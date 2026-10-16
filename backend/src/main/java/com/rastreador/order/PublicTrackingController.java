package com.rastreador.order;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.rastreador.order.dto.PublicTrackingResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;

/** Rotas públicas (sem login) usadas pela página de rastreio do cliente. */
@RestController
@RequestMapping("/api/public/tracking")
@SecurityRequirements
public class PublicTrackingController {

    private final OrderService orderService;

    public PublicTrackingController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping("/{code}")
    @Operation(summary = "Acompanhamento público do pedido pelo código do link de rastreio")
    public PublicTrackingResponse track(@PathVariable String code) {
        return orderService.findByTrackingCode(code);
    }
}
