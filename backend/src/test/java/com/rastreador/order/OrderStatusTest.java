package com.rastreador.order;

import static com.rastreador.order.OrderStatus.CANCELADO;
import static com.rastreador.order.OrderStatus.EM_PREPARO;
import static com.rastreador.order.OrderStatus.ENTREGUE;
import static com.rastreador.order.OrderStatus.RECEBIDO;
import static com.rastreador.order.OrderStatus.SAIU_PARA_ENTREGA;
import static org.assertj.core.api.Assertions.assertThat;

import java.util.Set;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

class OrderStatusTest {

    private static final Set<String> ALLOWED = Set.of(
            "RECEBIDO->EM_PREPARO",
            "RECEBIDO->CANCELADO",
            "EM_PREPARO->SAIU_PARA_ENTREGA",
            "EM_PREPARO->CANCELADO",
            "SAIU_PARA_ENTREGA->ENTREGUE");

    /** Percorre a matriz completa (5x5) e compara com a tabela de transições permitidas. */
    @ParameterizedTest(name = "{0} -> *")
    @EnumSource(OrderStatus.class)
    void onlyAllowedTransitionsAreAccepted(OrderStatus from) {
        for (OrderStatus to : OrderStatus.values()) {
            boolean expected = ALLOWED.contains(from + "->" + to);
            assertThat(from.canTransitionTo(to))
                    .as("%s -> %s", from, to)
                    .isEqualTo(expected);
        }
    }

    @Test
    void cannotCancelAfterLeavingForDelivery() {
        assertThat(SAIU_PARA_ENTREGA.canTransitionTo(CANCELADO)).isFalse();
    }

    @Test
    void cannotSkipSteps() {
        assertThat(RECEBIDO.canTransitionTo(SAIU_PARA_ENTREGA)).isFalse();
        assertThat(RECEBIDO.canTransitionTo(ENTREGUE)).isFalse();
        assertThat(EM_PREPARO.canTransitionTo(ENTREGUE)).isFalse();
    }

    @Test
    void finalStatesHaveNoTransitions() {
        assertThat(ENTREGUE.isFinal()).isTrue();
        assertThat(CANCELADO.isFinal()).isTrue();
        assertThat(RECEBIDO.isFinal()).isFalse();
    }

    @Test
    void allowedTransitionsListsNextSteps() {
        assertThat(RECEBIDO.allowedTransitions()).containsExactly(EM_PREPARO, CANCELADO);
        assertThat(SAIU_PARA_ENTREGA.allowedTransitions()).containsExactly(ENTREGUE);
        assertThat(ENTREGUE.allowedTransitions()).isEmpty();
    }
}
