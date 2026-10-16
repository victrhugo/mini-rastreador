package com.rastreador.order;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;

import com.rastreador.user.User;

class SlaPolicyTest {

    private static final SlaProperties LIMITS = new SlaProperties(Map.of(
            OrderStatus.RECEBIDO, Duration.ofMinutes(10),
            OrderStatus.EM_PREPARO, Duration.ofMinutes(30)));

    private final User user = new User("Operador", "op@teste.com", "hash");

    private Order newOrder() {
        return Order.create(
                new Customer("Ana", null),
                new Address("Rua A", "10", null, "Centro", "São Paulo", "SP", "01000-000"),
                List.of(new OrderItem("Pizza", 1, 4990)),
                user,
                Instant.now());
    }

    private static SlaPolicy policyAt(Instant now) {
        return new SlaPolicy(LIMITS, Clock.fixed(now, ZoneOffset.UTC));
    }

    @Test
    void deadlineCountsFromWhenTheOrderEnteredTheStage() {
        Order order = newOrder();
        Instant started = order.getStageStartedAt();

        assertThat(policyAt(started).deadlineFor(order)).isEqualTo(started.plus(Duration.ofMinutes(10)));
    }

    @Test
    void delayedOnlyAfterTheDeadline() {
        Order order = newOrder();
        Instant started = order.getStageStartedAt();

        assertThat(policyAt(started.plus(Duration.ofMinutes(9))).isDelayed(order)).isFalse();
        assertThat(policyAt(started.plus(Duration.ofMinutes(11))).isDelayed(order)).isTrue();
    }

    @Test
    void changingStageRestartsTheClock() {
        Order order = newOrder();
        order.changeStatus(OrderStatus.EM_PREPARO, user, Instant.now());

        Instant deadline = policyAt(Instant.now()).deadlineFor(order);
        assertThat(deadline).isEqualTo(order.getStageStartedAt().plus(Duration.ofMinutes(30)));
    }

    @Test
    void stagesWithoutLimitNeverDelay() {
        Order order = newOrder();
        order.changeStatus(OrderStatus.CANCELADO, user, Instant.now());

        SlaPolicy policy = policyAt(Instant.now().plus(Duration.ofDays(1)));
        assertThat(policy.deadlineFor(order)).isNull();
        assertThat(policy.isDelayed(order)).isFalse();
    }
}
