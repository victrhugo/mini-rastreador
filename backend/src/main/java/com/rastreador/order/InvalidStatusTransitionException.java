package com.rastreador.order;

import com.rastreador.common.ConflictException;

public class InvalidStatusTransitionException extends ConflictException {

    public InvalidStatusTransitionException(OrderStatus from, OrderStatus to) {
        super(message(from, to));
    }

    private static String message(OrderStatus from, OrderStatus to) {
        if (from.isFinal()) {
            return "Pedido já está %s e não pode mais ser alterado.".formatted(from);
        }
        return "Transição de %s para %s não é permitida. Próximos status possíveis: %s."
                .formatted(from, to, from.allowedTransitions());
    }
}
