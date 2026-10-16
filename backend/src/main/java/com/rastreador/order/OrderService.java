package com.rastreador.order;

import java.util.List;
import java.util.Locale;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.rastreador.auth.AuthenticatedUser;
import com.rastreador.common.NotFoundException;
import com.rastreador.common.UnauthorizedException;
import com.rastreador.order.dto.CreateOrderRequest;
import com.rastreador.order.dto.OrderResponse;
import com.rastreador.user.User;
import com.rastreador.user.UserRepository;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    public OrderService(OrderRepository orderRepository, UserRepository userRepository) {
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public OrderResponse create(CreateOrderRequest request, AuthenticatedUser currentUser) {
        CreateOrderRequest.CustomerData customer = request.customer();
        CreateOrderRequest.AddressData address = request.address();

        List<OrderItem> items = request.items().stream()
                .map(item -> new OrderItem(
                        item.description().trim(),
                        item.quantity(),
                        item.unitPrice().movePointRight(2).longValueExact()))
                .toList();

        Order order = Order.create(
                new Customer(customer.name().trim(), blankToNull(customer.phone())),
                new Address(address.street().trim(), address.number().trim(), blankToNull(address.complement()),
                        address.district().trim(), address.city().trim(), address.state().trim().toUpperCase(Locale.ROOT),
                        address.zipCode().trim()),
                items,
                userReference(currentUser));

        return OrderResponse.from(orderRepository.save(order));
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> findAll(OrderStatus status) {
        List<Order> orders = status == null
                ? orderRepository.findAllByOrderByCreatedAtDescIdDesc()
                : orderRepository.findAllByStatusOrderByCreatedAtDescIdDesc(status);
        return orders.stream().map(OrderResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public OrderResponse findById(Long id) {
        return OrderResponse.from(getOrder(id));
    }

    @Transactional
    public OrderResponse updateStatus(Long id, OrderStatus next, Long expectedVersion, AuthenticatedUser currentUser) {
        Order order = getOrder(id);
        if (expectedVersion != null && expectedVersion != order.getVersion()) {
            throw new StaleOrderException(id);
        }
        order.changeStatus(next, userReference(currentUser));
        return OrderResponse.from(orderRepository.saveAndFlush(order));
    }

    private Order getOrder(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Pedido %d não encontrado.".formatted(id)));
    }

    private User userReference(AuthenticatedUser currentUser) {
        return userRepository.findById(currentUser.id())
                .orElseThrow(() -> new UnauthorizedException("Sessão inválida. Entre novamente."));
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
