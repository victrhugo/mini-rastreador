package com.rastreador.order.stream;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Limites das conexões em tempo real (SSE).
 *
 * @param maxConnections     total de conexões abertas no servidor
 * @param maxPerOperator     conexões simultâneas por usuário logado (abas abertas)
 * @param maxPerTrackingCode conexões simultâneas por link público de rastreio
 */
@ConfigurationProperties(prefix = "app.stream")
public record StreamProperties(int maxConnections, int maxPerOperator, int maxPerTrackingCode) {
}
