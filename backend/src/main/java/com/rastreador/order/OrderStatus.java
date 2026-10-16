package com.rastreador.order;

import java.util.Arrays;
import java.util.List;

/**
 * Ciclo de vida do pedido:
 *
 * <pre>
 * RECEBIDO -> EM_PREPARO -> SAIU_PARA_ENTREGA -> ENTREGUE
 *     |            |
 *     +------------+--> CANCELADO
 * </pre>
 *
 * O fluxo só avança, uma etapa por vez. O cancelamento só é permitido antes de o
 * pedido sair para entrega. ENTREGUE e CANCELADO são estados finais.
 */
public enum OrderStatus {
    RECEBIDO,
    EM_PREPARO,
    SAIU_PARA_ENTREGA,
    ENTREGUE,
    CANCELADO;

    public boolean canTransitionTo(OrderStatus next) {
        return switch (this) {
            case RECEBIDO -> next == EM_PREPARO || next == CANCELADO;
            case EM_PREPARO -> next == SAIU_PARA_ENTREGA || next == CANCELADO;
            case SAIU_PARA_ENTREGA -> next == ENTREGUE;
            case ENTREGUE, CANCELADO -> false;
        };
    }

    public List<OrderStatus> allowedTransitions() {
        return Arrays.stream(values()).filter(this::canTransitionTo).toList();
    }

    public boolean isFinal() {
        return allowedTransitions().isEmpty();
    }
}
