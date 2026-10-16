package com.rastreador.order;

import java.time.Duration;
import java.util.Map;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Tempo máximo esperado em cada etapa. Estados sem limite (finais) não atrasam.
 *
 * @param limits limite por status, ex.: {@code EM_PREPARO: 30m}
 */
@ConfigurationProperties(prefix = "app.sla")
public record SlaProperties(Map<OrderStatus, Duration> limits) {

    public SlaProperties {
        limits = limits == null ? Map.of() : Map.copyOf(limits);
    }
}
