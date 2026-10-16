package com.rastreador.order;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "order_items")
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Column(nullable = false, length = 200)
    private String description;

    @Column(nullable = false)
    private int quantity;

    @Column(name = "unit_price_cents", nullable = false)
    private long unitPriceCents;

    protected OrderItem() {
    }

    public OrderItem(String description, int quantity, long unitPriceCents) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Quantidade deve ser maior que zero");
        }
        if (unitPriceCents < 0) {
            throw new IllegalArgumentException("Preço não pode ser negativo");
        }
        this.description = description;
        this.quantity = quantity;
        this.unitPriceCents = unitPriceCents;
    }

    void attachTo(Order order) {
        this.order = order;
    }

    public long subtotalCents() {
        return Math.multiplyExact(unitPriceCents, quantity);
    }

    public Long getId() {
        return id;
    }

    public String getDescription() {
        return description;
    }

    public int getQuantity() {
        return quantity;
    }

    public long getUnitPriceCents() {
        return unitPriceCents;
    }
}
