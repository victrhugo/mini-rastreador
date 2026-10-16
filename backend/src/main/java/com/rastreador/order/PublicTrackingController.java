package com.rastreador.order;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.rastreador.order.dto.PublicTrackingResponse;
import com.rastreador.order.stream.OrderStreamService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;

/** Rotas públicas (sem login) usadas pela página de rastreio do cliente. */
@RestController
@RequestMapping("/api/public/tracking")
@SecurityRequirements
public class PublicTrackingController {

    private final OrderService orderService;
    private final OrderStreamService orderStreamService;

    public PublicTrackingController(OrderService orderService, OrderStreamService orderStreamService) {
        this.orderService = orderService;
        this.orderStreamService = orderStreamService;
    }

    @GetMapping("/{code}")
    @Operation(summary = "Acompanhamento público do pedido pelo código do link de rastreio")
    public PublicTrackingResponse track(@PathVariable String code) {
        return orderService.findByTrackingCode(code);
    }

    @GetMapping(path = "/{code}/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(summary = "Eventos em tempo real (SSE) do pedido, para a página pública de rastreio")
    public SseEmitter stream(@PathVariable String code) {
        orderService.requireTrackingCode(code);
        return orderStreamService.subscribeTracking(code);
    }
}
