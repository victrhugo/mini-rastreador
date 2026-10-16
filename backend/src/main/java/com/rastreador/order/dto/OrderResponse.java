package com.rastreador.order.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import com.rastreador.order.Address;
import com.rastreador.order.Order;
import com.rastreador.order.OrderItem;
import com.rastreador.order.OrderStatus;
import com.rastreador.order.OrderStatusHistory;

/**
 * Representação do pedido na API. {@code allowedTransitions} e o prazo da etapa
 * ({@code stageDeadline}) vêm do back-end para o front não duplicar regras de negócio.
 */
public record OrderResponse(
        Long id,
        OrderStatus status,
        List<OrderStatus> allowedTransitions,
        BigDecimal total,
        CustomerResponse customer,
        AddressResponse address,
        List<ItemResponse> items,
        List<HistoryResponse> history,
        String createdBy,
        Instant createdAt,
        Instant updatedAt,
        long version,
        Instant stageStartedAt,
        Instant stageDeadline,
        boolean delayed,
        String trackingCode) {

    public record CustomerResponse(String name, String phone) {
    }

    public record AddressResponse(String street, String number, String complement,
            String district, String city, String state, String zipCode) {
    }

    public record ItemResponse(Long id, String description, int quantity, BigDecimal unitPrice, BigDecimal subtotal) {
    }

    public record HistoryResponse(OrderStatus from, OrderStatus to, String changedBy, Instant changedAt) {
    }

    /**
     * @param stageDeadline prazo da etapa atual ({@code null} se não houver)
     * @param delayed       se o prazo já passou no momento da resposta
     */
    public static OrderResponse from(Order order, Instant stageDeadline, boolean delayed) {
        Address address = order.getAddress();
        return new OrderResponse(
                order.getId(),
                order.getStatus(),
                order.getStatus().allowedTransitions(),
                toMoney(order.getTotalCents()),
                new CustomerResponse(order.getCustomer().getName(), order.getCustomer().getPhone()),
                new AddressResponse(address.getStreet(), address.getNumber(), address.getComplement(),
                        address.getDistrict(), address.getCity(), address.getState(), address.getZipCode()),
                order.getItems().stream().map(OrderResponse::toItem).toList(),
                order.getHistory().stream().map(OrderResponse::toHistory).toList(),
                order.getCreatedBy().getName(),
                order.getCreatedAt(),
                order.getUpdatedAt(),
                order.getVersion(),
                order.getStageStartedAt(),
                stageDeadline,
                delayed,
                order.getTrackingCode());
    }

    private static ItemResponse toItem(OrderItem item) {
        return new ItemResponse(item.getId(), item.getDescription(), item.getQuantity(),
                toMoney(item.getUnitPriceCents()), toMoney(item.subtotalCents()));
    }

    private static HistoryResponse toHistory(OrderStatusHistory entry) {
        return new HistoryResponse(entry.getFromStatus(), entry.getToStatus(),
                entry.getChangedBy().getName(), entry.getChangedAt());
    }

    private static BigDecimal toMoney(long cents) {
        return BigDecimal.valueOf(cents, 2);
    }
}
