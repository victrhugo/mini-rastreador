package com.rastreador.auth;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

import org.springframework.stereotype.Service;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.rastreador.common.TooManyRequestsException;

/**
 * Protege o login contra tentativa e erro de senha, com dois limites:
 * <ul>
 *   <li>por e-mail + IP ({@code maxAttempts}): impede adivinhar a senha de uma conta sem
 *       permitir que alguém bloqueie a conta de outra pessoa de qualquer lugar;</li>
 *   <li>só por IP ({@code maxAttemptsPerIp}): impede testar muitas contas a partir do
 *       mesmo endereço.</li>
 * </ul>
 * A tentativa é reservada de forma atômica antes de conferir a senha, então requisições
 * em paralelo não passam do limite. Os contadores somem sozinhos após {@code lockDuration}
 * sem novas tentativas e o total guardado é limitado, então a memória não cresce sem fim.
 *
 * <p>O estado fica em memória: suficiente para uma instância. Com várias, iria para
 * um armazenamento compartilhado (ex.: Redis).
 */
@Service
public class LoginAttemptService {

    private final Cache<String, Attempts> attempts;
    private final LoginProperties properties;
    private final Clock clock;

    public LoginAttemptService(LoginProperties properties, Clock clock) {
        this.properties = properties;
        this.clock = clock;
        this.attempts = Caffeine.newBuilder()
                .expireAfterWrite(properties.lockDuration())
                .maximumSize(100_000)
                .ticker(() -> TimeUnit.MILLISECONDS.toNanos(clock.millis()))
                .build();
    }

    /**
     * Reserva uma tentativa de login.
     *
     * @throws TooManyRequestsException se algum dos limites já foi atingido
     */
    public void beginAttempt(String email, String ip) {
        reserve(accountKey(email, ip), properties.maxAttempts());
        try {
            reserve(ipKey(ip), properties.maxAttemptsPerIp());
        } catch (TooManyRequestsException ex) {
            release(accountKey(email, ip));
            throw ex;
        }
    }

    /** Senha certa: zera o contador da conta e devolve a tentativa ao IP. */
    public void recordSuccess(String email, String ip) {
        attempts.invalidate(accountKey(email, ip));
        release(ipKey(ip));
    }

    private void reserve(String key, int max) {
        Instant now = clock.instant();
        AtomicReference<Duration> blockedFor = new AtomicReference<>();

        attempts.asMap().compute(key, (k, current) -> {
            if (current != null && current.count() >= max) {
                Duration remaining = Duration.between(now, current.last().plus(properties.lockDuration()));
                if (remaining.isPositive()) {
                    blockedFor.set(remaining);
                    return current;
                }
                current = null;
            }
            return new Attempts(current == null ? 1 : current.count() + 1, now);
        });

        if (blockedFor.get() != null) {
            long minutes = Math.max(1, (blockedFor.get().toSeconds() + 59) / 60);
            throw new TooManyRequestsException(
                    "Muitas tentativas de login. Tente novamente em %d %s."
                            .formatted(minutes, minutes == 1 ? "minuto" : "minutos"),
                    blockedFor.get());
        }
    }

    private void release(String key) {
        attempts.asMap().computeIfPresent(key, (k, current) ->
                current.count() <= 1 ? null : new Attempts(current.count() - 1, current.last()));
    }

    private static String accountKey(String email, String ip) {
        return "account:" + email + "|" + ip;
    }

    private static String ipKey(String ip) {
        return "ip:" + ip;
    }

    private record Attempts(int count, Instant last) {
    }
}
