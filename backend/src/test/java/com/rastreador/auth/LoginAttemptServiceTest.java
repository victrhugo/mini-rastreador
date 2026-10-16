package com.rastreador.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.rastreador.common.TooManyRequestsException;

class LoginAttemptServiceTest {

    private static final String KEY = "ana@teste.com|127.0.0.1";

    private MutableClock clock;
    private LoginAttemptService service;

    @BeforeEach
    void setUp() {
        clock = new MutableClock(Instant.parse("2026-10-16T12:00:00Z"));
        service = new LoginAttemptService(new LoginProperties(3, Duration.ofMinutes(15)), clock);
    }

    @Test
    void blocksAfterMaxFailures() {
        service.recordFailure(KEY);
        service.recordFailure(KEY);
        assertThatCode(() -> service.checkAllowed(KEY)).doesNotThrowAnyException();

        service.recordFailure(KEY);
        assertThatThrownBy(() -> service.checkAllowed(KEY))
                .isInstanceOf(TooManyRequestsException.class)
                .hasMessageContaining("15 minutos")
                .satisfies(ex -> assertThat(((TooManyRequestsException) ex).getRetryAfter())
                        .isEqualTo(Duration.ofMinutes(15)));
    }

    @Test
    void unlocksAfterLockDuration() {
        for (int i = 0; i < 3; i++) {
            service.recordFailure(KEY);
        }
        clock.advance(Duration.ofMinutes(15));

        assertThatCode(() -> service.checkAllowed(KEY)).doesNotThrowAnyException();
        // O contador recomeça depois do desbloqueio.
        service.recordFailure(KEY);
        assertThatCode(() -> service.checkAllowed(KEY)).doesNotThrowAnyException();
    }

    @Test
    void successResetsTheCounter() {
        service.recordFailure(KEY);
        service.recordFailure(KEY);
        service.recordSuccess(KEY);
        service.recordFailure(KEY);

        assertThatCode(() -> service.checkAllowed(KEY)).doesNotThrowAnyException();
    }

    @Test
    void otherKeysAreNotAffected() {
        for (int i = 0; i < 3; i++) {
            service.recordFailure(KEY);
        }
        assertThatCode(() -> service.checkAllowed("ana@teste.com|10.0.0.9")).doesNotThrowAnyException();
    }

    private static final class MutableClock extends Clock {
        private Instant now;

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
