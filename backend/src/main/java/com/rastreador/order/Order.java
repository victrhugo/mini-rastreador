package com.rastreador.order;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import com.rastreador.user.User;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

/**
 * Agregado do pedido. Toda mudança de status passa por {@link #changeStatus},
 * que aplica as regras de {@link OrderStatus} e registra o histórico.
 */
@Entity
@Table(name = "orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Embedded
    private Customer customer;

    @Embedded
    private Address address;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OrderStatus status;

    @Column(name = "total_cents", nullable = false)
    private long totalCents;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    @Column(nullable = false)
    private long version;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id")
    private List<OrderItem> items = new ArrayList<>();

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id")
    private List<OrderStatusHistory> history = new ArrayList<>();

    protected Order() {
    }

    public static Order create(Customer customer, Address address, List<OrderItem> items, User createdBy) {
        if (items == null || items.isEmpty()) {
            throw new IllegalArgumentException("Pedido precisa de pelo menos um item");
        }

        Order order = new Order();
        Instant now = Instant.now();
        order.customer = customer;
        order.address = address;
        order.createdBy = createdBy;
        order.createdAt = now;
        order.updatedAt = now;
        order.status = OrderStatus.RECEBIDO;

        items.forEach(order::addItem);
        order.history.add(new OrderStatusHistory(order, null, OrderStatus.RECEBIDO, createdBy, now));
        return order;
    }

    public void changeStatus(OrderStatus next, User changedBy) {
        if (!status.canTransitionTo(next)) {
            throw new InvalidStatusTransitionException(status, next);
        }

        Instant now = Instant.now();
        history.add(new OrderStatusHistory(this, status, next, changedBy, now));
        status = next;
        updatedAt = now;
    }

    private void addItem(OrderItem item) {
        item.attachTo(this);
        items.add(item);
        totalCents = Math.addExact(totalCents, item.subtotalCents());
    }

    public Long getId() {
        return id;
    }

    public Customer getCustomer() {
        return customer;
    }

    public Address getAddress() {
        return address;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public long getTotalCents() {
        return totalCents;
    }

    public User getCreatedBy() {
        return createdBy;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public long getVersion() {
        return version;
    }

    public List<OrderItem> getItems() {
        return Collections.unmodifiableList(items);
    }

    public List<OrderStatusHistory> getHistory() {
        return Collections.unmodifiableList(history);
    }
}
