package com.rastreador.order.dto;

import com.rastreador.order.OrderStatus;

import jakarta.validation.constraints.NotNull;

/**
 * @param status  novo status
 * @param version versão do pedido que o cliente está vendo (opcional). Se informada e
 *                diferente da atual, a alteração é recusada com 409.
 */
public record UpdateStatusRequest(
        @NotNull(message = "Status é obrigatório")
        OrderStatus status,

        Long version) {
}
