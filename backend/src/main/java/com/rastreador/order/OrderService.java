package com.rastreador.order;

import java.time.Clock;
import java.util.List;
import java.util.Locale;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.rastreador.auth.AuthenticatedUser;
import com.rastreador.common.NotFoundException;
import com.rastreador.common.UnauthorizedException;
import com.rastreador.order.dto.CreateOrderRequest;
import com.rastreador.order.dto.OrderResponse;
import com.rastreador.order.dto.PublicTrackingResponse;
import com.rastreador.order.stream.OrderChangedEvent;
import com.rastreador.user.User;
import com.rastreador.user.UserRepository;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final SlaPolicy slaPolicy;
    private final ApplicationEventPublisher events;
    private final Clock clock;

    public OrderService(OrderRepository orderRepository, UserRepository userRepository, SlaPolicy slaPolicy,
            ApplicationEventPublisher events, Clock clock) {
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.slaPolicy = slaPolicy;
        this.events = events;
        this.clock = clock;
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
                userReference(currentUser),
                clock.instant());

        Order saved = orderRepository.save(order);
        publishChange(saved);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> findAll(OrderStatus status) {
        List<Order> orders = status == null
                ? orderRepository.findAllByOrderByCreatedAtDescIdDesc()
                : orderRepository.findAllByStatusOrderByCreatedAtDescIdDesc(status);
        return orders.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public OrderResponse findById(Long id) {
        return toResponse(getOrder(id));
    }

    @Transactional
    public OrderResponse updateStatus(Long id, OrderStatus next, Long expectedVersion, AuthenticatedUser currentUser) {
        Order order = getOrder(id);
        if (expectedVersion != null && expectedVersion != order.getVersion()) {
            throw new StaleOrderException(id);
        }
        order.changeStatus(next, userReference(currentUser), clock.instant());
        Order saved = orderRepository.saveAndFlush(order);
        publishChange(saved);
        return toResponse(saved);
    }

    /** O evento só é entregue aos clientes conectados depois do commit (veja OrderStreamService). */
    private void publishChange(Order order) {
        events.publishEvent(new OrderChangedEvent(order.getId(), order.getTrackingCode(), order.getStatus(),
                order.getVersion()));
    }

    /** Status atual do pedido do link; 404 se o código não existir. Usado antes de abrir o stream público. */
    @Transactional(readOnly = true)
    public OrderStatus trackingStatus(String code) {
        return orderRepository.findByTrackingCode(code)
                .map(Order::getStatus)
                .orElseThrow(() -> new NotFoundException("Pedido não encontrado. Confira o link de rastreio."));
    }

    /** Visão pública do pedido para o link de rastreio (sem dados pessoais). */
    @Transactional(readOnly = true)
    public PublicTrackingResponse findByTrackingCode(String code) {
        Order order = orderRepository.findByTrackingCode(code)
                .orElseThrow(() -> new NotFoundException("Pedido não encontrado. Confira o link de rastreio."));
        return PublicTrackingResponse.from(order, slaPolicy.deadlineFor(order));
    }

    private OrderResponse toResponse(Order order) {
        return OrderResponse.from(order, slaPolicy.deadlineFor(order), slaPolicy.isDelayed(order));
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
