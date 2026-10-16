package com.rastreador.order;

import java.net.URI;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.rastreador.auth.AuthenticatedUser;
import com.rastreador.order.dto.CreateOrderRequest;
import com.rastreador.order.dto.OrderResponse;
import com.rastreador.order.dto.UpdateStatusRequest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping
    @Operation(summary = "Lista os pedidos, mais recentes primeiro")
    public List<OrderResponse> list(
            @Parameter(description = "Filtra por status") @RequestParam(required = false) OrderStatus status) {
        return orderService.findAll(status);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Busca um pedido por ID")
    public OrderResponse get(@PathVariable Long id) {
        return orderService.findById(id);
    }

    @PostMapping
    @Operation(summary = "Cria um pedido com status inicial RECEBIDO")
    public ResponseEntity<OrderResponse> create(@Valid @RequestBody CreateOrderRequest request,
            @AuthenticationPrincipal AuthenticatedUser currentUser) {
        OrderResponse created = orderService.create(request, currentUser);
        return ResponseEntity.created(URI.create("/api/orders/" + created.id())).body(created);
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Avança ou cancela o pedido",
            description = "Responde 409 quando a transição não é permitida a partir do status atual "
                    + "ou quando a versão informada está desatualizada.")
    public OrderResponse updateStatus(@PathVariable Long id, @Valid @RequestBody UpdateStatusRequest request,
            @AuthenticationPrincipal AuthenticatedUser currentUser) {
        return orderService.updateStatus(id, request.status(), request.version(), currentUser);
    }
}
