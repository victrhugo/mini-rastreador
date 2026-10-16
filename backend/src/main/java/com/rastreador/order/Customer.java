package com.rastreador.order;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

/**
 * Quem recebe o pedido. Não é necessariamente o usuário que o cadastrou.
 */
@Embeddable
public class Customer {

    @Column(name = "customer_name", nullable = false, length = 120)
    private String name;

    @Column(name = "customer_phone", length = 20)
    private String phone;

    protected Customer() {
    }

    public Customer(String name, String phone) {
        this.name = name;
        this.phone = phone;
    }

    public String getName() {
        return name;
    }

    public String getPhone() {
        return phone;
    }
}
