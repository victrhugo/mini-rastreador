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
 * Representação do pedido na API. {@code allowedTransitions} vem do back-end
 * para o front não precisar duplicar as regras da máquina de estados.
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
        Instant updatedAt) {

    public record CustomerResponse(String name, String phone) {
    }

    public record AddressResponse(String street, String number, String complement,
            String district, String city, String zipCode) {
    }

    public record ItemResponse(Long id, String description, int quantity, BigDecimal unitPrice, BigDecimal subtotal) {
    }

    public record HistoryResponse(OrderStatus from, OrderStatus to, String changedBy, Instant changedAt) {
    }

    public static OrderResponse from(Order order) {
        Address address = order.getAddress();
        return new OrderResponse(
                order.getId(),
                order.getStatus(),
                order.getStatus().allowedTransitions(),
                toMoney(order.getTotalCents()),
                new CustomerResponse(order.getCustomer().getName(), order.getCustomer().getPhone()),
                new AddressResponse(address.getStreet(), address.getNumber(), address.getComplement(),
                        address.getDistrict(), address.getCity(), address.getZipCode()),
                order.getItems().stream().map(OrderResponse::toItem).toList(),
                order.getHistory().stream().map(OrderResponse::toHistory).toList(),
                order.getCreatedBy().getName(),
                order.getCreatedAt(),
                order.getUpdatedAt());
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
