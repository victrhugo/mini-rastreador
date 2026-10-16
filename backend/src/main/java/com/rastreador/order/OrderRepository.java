package com.rastreador.order;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findAllByOrderByCreatedAtDescIdDesc();

    List<Order> findAllByStatusOrderByCreatedAtDescIdDesc(OrderStatus status);
}
