package com.rastreador.order.stream;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import jakarta.annotation.PreDestroy;

/**
 * Mantém as conexões SSE abertas e repassa as mudanças de pedidos em tempo real:
 * operadores recebem todas; a página pública recebe só as do próprio pedido.
 *
 * <p>As conexões ficam em memória, o que basta para uma instância. Com várias
 * instâncias, os eventos passariam por um broker (ex.: Redis pub/sub).
 */
@Service
public class OrderStreamService {

    private static final Logger log = LoggerFactory.getLogger(OrderStreamService.class);
    private static final long TIMEOUT_MS = Duration.ofMinutes(30).toMillis();

    private final Set<SseEmitter> operators = ConcurrentHashMap.newKeySet();
    private final Map<String, Set<SseEmitter>> trackers = new ConcurrentHashMap<>();

    public SseEmitter subscribeOperator() {
        return register(new SseEmitter(TIMEOUT_MS), operators, null);
    }

    public SseEmitter subscribeTracking(String trackingCode) {
        return registerTracking(new SseEmitter(TIMEOUT_MS), trackingCode);
    }

    SseEmitter registerOperator(SseEmitter emitter) {
        return register(emitter, operators, null);
    }

    SseEmitter registerTracking(SseEmitter emitter, String trackingCode) {
        Set<SseEmitter> group = trackers.computeIfAbsent(trackingCode, code -> ConcurrentHashMap.newKeySet());
        return register(emitter, group, trackingCode);
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onOrderChanged(OrderChangedEvent event) {
        Map<String, Object> payload = Map.of(
                "id", event.orderId(), "status", event.status(), "version", event.version());
        operators.forEach(emitter -> send(emitter, SseEmitter.event().name("order")
                .data(payload, MediaType.APPLICATION_JSON)));

        Set<SseEmitter> group = trackers.get(event.trackingCode());
        if (group != null) {
            // Para o cliente vai só o novo status, sem o id interno.
            group.forEach(emitter -> send(emitter, SseEmitter.event().name("order")
                    .data(Map.of("status", event.status()), MediaType.APPLICATION_JSON)));
        }
    }

    /** Comentário periódico para proxies e navegadores não fecharem conexões ociosas. */
    @Scheduled(fixedRate = 25_000)
    public void heartbeat() {
        operators.forEach(emitter -> send(emitter, SseEmitter.event().comment("ping")));
        trackers.values().forEach(group -> group.forEach(emitter -> send(emitter, SseEmitter.event().comment("ping"))));
    }

    int connectionCount() {
        return operators.size() + trackers.values().stream().mapToInt(Set::size).sum();
    }

    @PreDestroy
    void closeAll() {
        operators.forEach(SseEmitter::complete);
        trackers.values().forEach(group -> group.forEach(SseEmitter::complete));
    }

    private SseEmitter register(SseEmitter emitter, Set<SseEmitter> group, String trackingCode) {
        group.add(emitter);
        Runnable remove = () -> {
            group.remove(emitter);
            if (trackingCode != null && group.isEmpty()) {
                trackers.remove(trackingCode, group);
            }
        };
        emitter.onCompletion(remove);
        emitter.onTimeout(remove);
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
