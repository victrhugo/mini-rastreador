package com.rastreador.auth;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;

import com.rastreador.common.TooManyRequestsException;

/**
 * Protege o login contra tentativa e erro de senha: depois de {@code maxAttempts}
 * erros seguidos para o mesmo e-mail a partir do mesmo IP, bloqueia por
 * {@code lockDuration}. A chave combina e-mail e IP para que um atacante não
 * consiga bloquear a conta de outra pessoa de qualquer lugar.
 *
 * <p>O controle fica em memória: suficiente para uma instância. Com várias
 * instâncias, o estado iria para um armazenamento compartilhado (ex.: Redis).
 */
@Service
public class LoginAttemptService {

    private final Map<String, Attempts> attempts = new ConcurrentHashMap<>();
    private final LoginProperties properties;
    private final Clock clock;

    public LoginAttemptService(LoginProperties properties, Clock clock) {
        this.properties = properties;
        this.clock = clock;
    }

    /** @throws TooManyRequestsException se a chave estiver bloqueada */
    public void checkAllowed(String key) {
        Attempts current = attempts.get(key);
        if (current == null || current.lockedUntil() == null) {
            return;
        }

        Instant now = clock.instant();
        if (now.isBefore(current.lockedUntil())) {
            Duration remaining = Duration.between(now, current.lockedUntil());
            long minutes = Math.max(1, (remaining.toSeconds() + 59) / 60);
            throw new TooManyRequestsException(
                    "Muitas tentativas de login. Tente novamente em %d %s."
                            .formatted(minutes, minutes == 1 ? "minuto" : "minutos"),
                    remaining);
        }
        attempts.remove(key);
    }

    public void recordFailure(String key) {
        attempts.compute(key, (k, current) -> {
            int failures = (current == null ? 0 : current.failures()) + 1;
            Instant lockedUntil = failures >= properties.maxAttempts()
                    ? clock.instant().plus(properties.lockDuration())
                    : null;
            return new Attempts(failures, lockedUntil);
        });
    }

    public void recordSuccess(String key) {
        attempts.remove(key);
    }

    private record Attempts(int failures, Instant lockedUntil) {
    }
}
