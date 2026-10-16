package com.rastreador.common;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;

import org.junit.jupiter.api.Test;

class FixedWindowRateLimiterTest {

    @Test
    void allowsUpToTheLimitPerWindow() {
        Instant start = Instant.parse("2026-10-16T12:00:00Z");
        FixedWindowRateLimiter limiter = new FixedWindowRateLimiter(2, Duration.ofHours(1),
                Clock.fixed(start, ZoneOffset.UTC), "limite");

        limiter.acquire("1.2.3.4");
        limiter.acquire("1.2.3.4");
        assertThatThrownBy(() -> limiter.acquire("1.2.3.4")).isInstanceOf(TooManyRequestsException.class);
        assertThatCode(() -> limiter.acquire("5.6.7.8")).doesNotThrowAnyException();
    }

    @Test
    void newWindowStartsAfterTheWindowEnds() {
        Instant start = Instant.parse("2026-10-16T12:00:00Z");
        FixedWindowRateLimiter first = new FixedWindowRateLimiter(1, Duration.ofHours(1),
                Clock.fixed(start, ZoneOffset.UTC), "limite");
        first.acquire("ip");
        assertThatThrownBy(() -> first.acquire("ip")).isInstanceOf(TooManyRequestsException.class);
    }
}
