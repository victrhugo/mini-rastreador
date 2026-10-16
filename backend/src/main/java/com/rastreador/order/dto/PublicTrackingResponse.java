package com.rastreador.order.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import com.rastreador.order.Order;
import com.rastreador.order.OrderStatus;

/**
 * O que o cliente vê no link público de rastreio. Ficam de fora telefone, rua,
 * número, complemento e os nomes de quem operou o pedido.
 */
public record PublicTrackingResponse(
        Long orderNumber,
        OrderStatus status,
        String customerFirstName,
        String district,
        String city,
        String state,
        List<Item> items,
        BigDecimal total,
        List<Step> history,
        Instant stageStartedAt,
        Instant stageDeadline,
        Instant createdAt,
        Instant updatedAt) {

    public record Item(String description, int quantity) {
    }

    public record Step(OrderStatus status, Instant at) {
    }

    public static PublicTrackingResponse from(Order order, Instant stageDeadline) {
        String name = order.getCustomer().getName().trim();
        return new PublicTrackingResponse(
                order.getId(),
                order.getStatus(),
                name.split("\\s+")[0],
                order.getAddress().getDistrict(),
                order.getAddress().getCity(),
                order.getAddress().getState(),
                order.getItems().stream().map(item -> new Item(item.getDescription(), item.getQuantity())).toList(),
                BigDecimal.valueOf(order.getTotalCents(), 2),
                order.getHistory().stream().map(entry -> new Step(entry.getToStatus(), entry.getChangedAt())).toList(),
                order.getStageStartedAt(),
                stageDeadline,
                order.getCreatedAt(),
                order.getUpdatedAt());
    }
}
