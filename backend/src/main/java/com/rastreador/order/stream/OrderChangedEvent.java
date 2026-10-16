package com.rastreador.order.stream;

import com.rastreador.order.OrderStatus;

/**
 * Publicado quando um pedido é criado ou muda de status. Só chega aos clientes
 * depois que a transação é confirmada no banco.
 */
public record OrderChangedEvent(Long orderId, String trackingCode, OrderStatus status, long version) {
}
