package com.rastreador.order.stream;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.rastreador.common.TooManyRequestsException;

import jakarta.annotation.PreDestroy;

/**
 * Mantém as conexões SSE abertas e repassa as mudanças de pedidos em tempo real:
 * operadores recebem todas; a página pública recebe só as do próprio pedido.
 *
 * <ul>
 *   <li>Os envios rodam em um executor próprio ({@code sseExecutor}), fora da thread da
 *       requisição: um cliente lento não segura a conexão do banco nem trava o PATCH.</li>
 *   <li>Há limite de conexões no total, por operador e por pedido, para que ninguém
 *       esgote o servidor abrindo streams.</li>
 *   <li>Quando o pedido chega a um estado final, os streams públicos dele são encerrados.</li>
 * </ul>
 *
 * <p>As conexões ficam em memória, o que basta para uma instância. Com várias
 * instâncias, os eventos passariam por um broker (ex.: Redis pub/sub).
 */
@Service
public class OrderStreamService {

    private static final Logger log = LoggerFactory.getLogger(OrderStreamService.class);
    private static final long TIMEOUT_MS = Duration.ofMinutes(30).toMillis();

    private final StreamProperties properties;
    private final AtomicInteger total = new AtomicInteger();
    private final Map<Long, Set<SseEmitter>> operators = new ConcurrentHashMap<>();
    private final Map<String, Set<SseEmitter>> trackers = new ConcurrentHashMap<>();

    public OrderStreamService(StreamProperties properties) {
        this.properties = properties;
    }

    /** @throws TooManyRequestsException se o limite total ou do operador for atingido */
    public SseEmitter subscribeOperator(Long userId) {
        return registerOperator(new SseEmitter(TIMEOUT_MS), userId);
    }

    /** @throws TooManyRequestsException se o limite total ou do pedido for atingido */
    public SseEmitter subscribeTracking(String trackingCode) {
        return registerTracking(new SseEmitter(TIMEOUT_MS), trackingCode);
    }

    SseEmitter registerOperator(SseEmitter emitter, Long userId) {
        return register(emitter, operators, userId, properties.maxPerOperator());
    }

    SseEmitter registerTracking(SseEmitter emitter, String trackingCode) {
        return register(emitter, trackers, trackingCode, properties.maxPerTrackingCode());
    }

    @Async("sseExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onOrderChanged(OrderChangedEvent event) {
        Map<String, Object> payload = Map.of(
                "id", event.orderId(), "status", event.status(), "version", event.version());
        operators.values().forEach(group -> group.forEach(emitter ->
                send(emitter, SseEmitter.event().name("order").data(payload, MediaType.APPLICATION_JSON))));

        Set<SseEmitter> group = trackers.get(event.trackingCode());
        if (group != null) {
            // Para o cliente vai só o novo status, sem o id interno.
            group.forEach(emitter -> send(emitter, SseEmitter.event().name("order")
                    .data(Map.of("status", event.status()), MediaType.APPLICATION_JSON)));
            if (event.status().isFinal()) {
                // Pedido encerrado: não haverá novas mudanças, então libera as conexões.
                group.forEach(SseEmitter::complete);
            }
        }
    }

    /** Comentário periódico para proxies e navegadores não fecharem conexões ociosas. */
    @Async("sseExecutor")
    @Scheduled(fixedRate = 25_000)
    public void heartbeat() {
        operators.values().forEach(group -> group.forEach(emitter -> send(emitter, SseEmitter.event().comment("ping"))));
        trackers.values().forEach(group -> group.forEach(emitter -> send(emitter, SseEmitter.event().comment("ping"))));
    }

    int connectionCount() {
        return total.get();
    }

    @PreDestroy
    void closeAll() {
        operators.values().forEach(group -> group.forEach(SseEmitter::complete));
        trackers.values().forEach(group -> group.forEach(SseEmitter::complete));
    }

    private <K> SseEmitter register(SseEmitter emitter, Map<K, Set<SseEmitter>> groups, K key, int maxPerKey) {
        if (total.incrementAndGet() > properties.maxConnections()) {
            total.decrementAndGet();
            throw new TooManyRequestsException("Muitas conexões em tempo real abertas. Tente novamente em instantes.",
                    Duration.ofSeconds(30));
        }

        // compute garante que entrar e sair do grupo nunca se cruzem (o grupo não some com alguém dentro).
        boolean[] accepted = {false};
        groups.compute(key, (k, group) -> {
            Set<SseEmitter> current = group == null ? ConcurrentHashMap.newKeySet() : group;
            if (current.size() < maxPerKey) {
                current.add(emitter);
                accepted[0] = true;
            }
            return current.isEmpty() ? null : current;
        });
        if (!accepted[0]) {
            total.decrementAndGet();
            throw new TooManyRequestsException("Limite de conexões em tempo real atingido para este acesso.",
                    Duration.ofSeconds(30));
        }

        Runnable remove = () -> groups.computeIfPresent(key, (k, group) -> {
            if (group.remove(emitter)) {
                total.decrementAndGet();
            }
            return group.isEmpty() ? null : group;
        });
        emitter.onCompletion(remove);
        emitter.onTimeout(() -> {
            remove.run();
            emitter.complete();
        });
        emitter.onError(error -> remove.run());

        // Primeiro evento: confirma ao cliente que a conexão está ativa.
        send(emitter, SseEmitter.event().name("ready").data("ok"));
        return emitter;
    }

    private void send(SseEmitter emitter, SseEmitter.SseEventBuilder event) {
        try {
            emitter.send(event);
        } catch (IOException | IllegalStateException ex) {
            // Cliente desconectou: encerra e deixa os callbacks removerem a conexão.
            log.debug("Conexão SSE encerrada: {}", ex.getMessage());
            emitter.completeWithError(ex);
        }
    }
}
