package com.rastreador.auth;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * @param secret     chave HMAC; precisa ter pelo menos 32 bytes (HS256)
 * @param expiration validade do token emitido
 */
@ConfigurationProperties(prefix = "app.jwt")
public record JwtProperties(String secret, Duration expiration) {
}
