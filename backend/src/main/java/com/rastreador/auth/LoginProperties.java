package com.rastreador.auth;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * @param maxAttempts      tentativas seguidas permitidas por e-mail + IP antes do bloqueio
 * @param maxAttemptsPerIp tentativas permitidas por IP, somando todas as contas
 * @param lockDuration     por quanto tempo o login fica bloqueado depois disso
 */
@ConfigurationProperties(prefix = "app.login")
public record LoginProperties(int maxAttempts, int maxAttemptsPerIp, Duration lockDuration) {
}
