package com.rastreador.auth;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * @param secret     chave HMAC com pelo menos 32 bytes (HS256); vazia = chave aleatória por execução
 * @param expiration validade do token emitido
 */
@ConfigurationProperties(prefix = "app.jwt")
public record JwtProperties(String secret, Duration expiration) {
}
