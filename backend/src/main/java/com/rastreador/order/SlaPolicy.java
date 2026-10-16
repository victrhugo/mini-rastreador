package com.rastreador.order;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;

import org.springframework.stereotype.Component;

/**
 * Calcula o prazo da etapa atual do pedido e se ele está atrasado.
 */
@Component
public class SlaPolicy {

    private final SlaProperties properties;
    private final Clock clock;

    public SlaPolicy(SlaProperties properties, Clock clock) {
        this.properties = properties;
        this.clock = clock;
    }

    /** Até quando o pedido deveria sair da etapa atual; {@code null} se a etapa não tem limite. */
    public Instant deadlineFor(Order order) {
        Duration limit = properties.limits().get(order.getStatus());
        return limit == null ? null : order.getStageStartedAt().plus(limit);
    }

    public boolean isDelayed(Order order) {
        Instant deadline = deadlineFor(order);
        return deadline != null && clock.instant().isAfter(deadline);
    }
}
