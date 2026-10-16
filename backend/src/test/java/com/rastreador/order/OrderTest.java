package com.rastreador.order;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.Test;

import com.rastreador.user.User;

class OrderTest {

    private final User user = new User("Operador", "op@teste.com", "hash");

    private Order newOrder() {
        return Order.create(
                new Customer("Ana", "11999990000"),
                new Address("Rua A", "10", null, "Centro", "São Paulo", "SP", "01000-000"),
                List.of(new OrderItem("Pizza", 2, 4990), new OrderItem("Refrigerante", 1, 800)),
                user,
                Instant.now());
    }

    @Test
    void newOrderStartsAsReceivedWithCalculatedTotalAndHistory() {
        Order order = newOrder();

        assertThat(order.getStatus()).isEqualTo(OrderStatus.RECEBIDO);
        assertThat(order.getTotalCents()).isEqualTo(2 * 4990 + 800);
        assertThat(order.getHistory()).singleElement().satisfies(entry -> {
            assertThat(entry.getFromStatus()).isNull();
            assertThat(entry.getToStatus()).isEqualTo(OrderStatus.RECEBIDO);
        });
    }

    @Test
    void orderWithoutItemsIsRejected() {
        assertThatThrownBy(() -> Order.create(
                new Customer("Ana", null),
                new Address("Rua A", "10", null, "Centro", "São Paulo", "SP", "01000-000"),
                List.of(),
                user,
                Instant.now()))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void fullFlowRecordsEveryTransition() {
        Order order = newOrder();

        order.changeStatus(OrderStatus.EM_PREPARO, user, Instant.now());
        order.changeStatus(OrderStatus.SAIU_PARA_ENTREGA, user, Instant.now());
        order.changeStatus(OrderStatus.ENTREGUE, user, Instant.now());

        assertThat(order.getStatus()).isEqualTo(OrderStatus.ENTREGUE);
        assertThat(order.getHistory())
                .extracting(OrderStatusHistory::getToStatus)
                .containsExactly(OrderStatus.RECEBIDO, OrderStatus.EM_PREPARO,
                        OrderStatus.SAIU_PARA_ENTREGA, OrderStatus.ENTREGUE);
    }

    @Test
    void invalidTransitionThrowsAndKeepsState() {
        Order order = newOrder();
        order.changeStatus(OrderStatus.EM_PREPARO, user, Instant.now());
        order.changeStatus(OrderStatus.SAIU_PARA_ENTREGA, user, Instant.now());

        assertThatThrownBy(() -> order.changeStatus(OrderStatus.CANCELADO, user, Instant.now()))
                .isInstanceOf(InvalidStatusTransitionException.class)
                .hasMessageContaining("SAIU_PARA_ENTREGA");

        assertThat(order.getStatus()).isEqualTo(OrderStatus.SAIU_PARA_ENTREGA);
        assertThat(order.getHistory()).hasSize(3);
    }

    @Test
    void finalOrderCannotChange() {
        Order order = newOrder();
        order.changeStatus(OrderStatus.CANCELADO, user, Instant.now());

        assertThatThrownBy(() -> order.changeStatus(OrderStatus.EM_PREPARO, user, Instant.now()))
                .isInstanceOf(InvalidStatusTransitionException.class)
                .hasMessageContaining("não pode mais ser alterado");
    }
}
