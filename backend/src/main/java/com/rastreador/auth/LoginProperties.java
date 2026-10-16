package com.rastreador.auth;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * @param maxAttempts  erros de senha seguidos permitidos antes do bloqueio
 * @param lockDuration por quanto tempo o login fica bloqueado depois disso
 */
@ConfigurationProperties(prefix = "app.login")
public record LoginProperties(int maxAttempts, Duration lockDuration) {
}
