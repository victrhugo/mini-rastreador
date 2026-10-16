package com.rastreador.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.rastreador.common.TooManyRequestsException;

class LoginAttemptServiceTest {

    private static final String EMAIL = "ana@teste.com";
    private static final String IP = "203.0.113.7";

    private MutableClock clock;
    private LoginAttemptService service;

    @BeforeEach
    void setUp() {
        clock = new MutableClock(Instant.parse("2026-10-16T12:00:00Z"));
        service = new LoginAttemptService(new LoginProperties(3, 10, Duration.ofMinutes(15)), clock);
    }

    private void fail(String email, String ip) {
        service.beginAttempt(email, ip);
    }

    @Test
    void blocksTheAccountAfterMaxAttempts() {
        fail(EMAIL, IP);
        fail(EMAIL, IP);
        fail(EMAIL, IP);

        assertThatThrownBy(() -> service.beginAttempt(EMAIL, IP))
                .isInstanceOf(TooManyRequestsException.class)
                .hasMessageContaining("15 minutos")
                .satisfies(ex -> assertThat(((TooManyRequestsException) ex).getRetryAfter())
                        .isEqualTo(Duration.ofMinutes(15)));
    }

    @Test
    void unlocksAfterLockDurationWithoutNewAttempts() {
        fail(EMAIL, IP);
        fail(EMAIL, IP);
        fail(EMAIL, IP);
        clock.advance(Duration.ofMinutes(15));

        assertThatCode(() -> service.beginAttempt(EMAIL, IP)).doesNotThrowAnyException();
    }

    @Test
    void oldFailuresExpire() {
        fail(EMAIL, IP);
        fail(EMAIL, IP);
        clock.advance(Duration.ofMinutes(16));

        // As duas falhas antigas expiraram: ainda cabem três tentativas.
        fail(EMAIL, IP);
        fail(EMAIL, IP);
        assertThatCode(() -> service.beginAttempt(EMAIL, IP)).doesNotThrowAnyException();
    }

    @Test
    void successResetsTheAccountCounter() {
        fail(EMAIL, IP);
        fail(EMAIL, IP);
        service.beginAttempt(EMAIL, IP);
        service.recordSuccess(EMAIL, IP);

        fail(EMAIL, IP);
        fail(EMAIL, IP);
        assertThatCode(() -> service.beginAttempt(EMAIL, IP)).doesNotThrowAnyException();
    }

    @Test
    void sameAccountFromAnotherIpIsNotBlocked() {
        fail(EMAIL, IP);
        fail(EMAIL, IP);
        fail(EMAIL, IP);

        assertThatCode(() -> service.beginAttempt(EMAIL, "198.51.100.9")).doesNotThrowAnyException();
    }

    @Test
    void blocksAnIpTryingManyAccounts() {
        for (int i = 0; i < 10; i++) {
            fail("conta" + i + "@teste.com", IP);
        }

        assertThatThrownBy(() -> service.beginAttempt("outra@teste.com", IP))
                .isInstanceOf(TooManyRequestsException.class);
    }

    @Test
    void parallelRequestsDoNotExceedTheLimit() throws Exception {
        AtomicInteger allowed = new AtomicInteger();
        try (ExecutorService pool = Executors.newFixedThreadPool(8)) {
            for (int i = 0; i < 50; i++) {
                pool.submit(() -> {
                    try {
                        service.beginAttempt(EMAIL, IP);
                        allowed.incrementAndGet();
                    } catch (TooManyRequestsException ignored) {
                        // bloqueada, como esperado
                    }
                });
            }
        }
        assertThat(allowed.get()).isEqualTo(3);
    }

    private static final class MutableClock extends Clock {
        private volatile Instant now;

        MutableClock(Instant now) {
            this.now = now;
        }

        void advance(Duration duration) {
            now = now.plus(duration);
        }

        @Override
        public Instant instant() {
            return now;
        }

        @Override
        public ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }
    }
}
