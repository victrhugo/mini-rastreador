package com.rastreador.common;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;

/**
 * Limite simples de "no máximo N vezes por janela de tempo" por chave (ex.: IP).
 * As chaves expiram sozinhas e o total guardado é limitado.
 */
public class FixedWindowRateLimiter {

    private final int limit;
    private final Duration window;
    private final Clock clock;
    private final String message;
    private final Cache<String, Window> windows;

    public FixedWindowRateLimiter(int limit, Duration window, Clock clock, String message) {
        this.limit = limit;
        this.window = window;
        this.clock = clock;
        this.message = message;
        this.windows = Caffeine.newBuilder()
                .expireAfterWrite(window)
                .maximumSize(100_000)
                .ticker(() -> TimeUnit.MILLISECONDS.toNanos(clock.millis()))
                .build();
    }

    /** @throws TooManyRequestsException se a chave já usou o limite da janela atual */
    public void acquire(String key) {
        Instant now = clock.instant();
        AtomicReference<Duration> retryAfter = new AtomicReference<>();

        windows.asMap().compute(key, (k, current) -> {
            if (current == null || !now.isBefore(current.start().plus(window))) {
                return new Window(now, 1);
            }
            if (current.count() >= limit) {
                retryAfter.set(Duration.between(now, current.start().plus(window)));
                return current;
            }
            return new Window(current.start(), current.count() + 1);
        });

        if (retryAfter.get() != null) {
            throw new TooManyRequestsException(message, retryAfter.get());
        }
    }

    private record Window(Instant start, int count) {
    }
}
