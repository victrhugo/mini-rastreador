package com.rastreador.common;

import java.time.Duration;

/**
 * Limite de tentativas atingido (HTTP 429). {@code retryAfter} vira o header Retry-After.
 */
public class TooManyRequestsException extends RuntimeException {

    private final Duration retryAfter;

    public TooManyRequestsException(String message, Duration retryAfter) {
        super(message);
        this.retryAfter = retryAfter;
    }

    public Duration getRetryAfter() {
        return retryAfter;
    }
}
