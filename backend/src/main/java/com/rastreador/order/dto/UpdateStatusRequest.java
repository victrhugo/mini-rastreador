package com.rastreador.order.dto;

import com.rastreador.order.OrderStatus;

import jakarta.validation.constraints.NotNull;

public record UpdateStatusRequest(
        @NotNull(message = "Status é obrigatório")
        OrderStatus status) {
}
