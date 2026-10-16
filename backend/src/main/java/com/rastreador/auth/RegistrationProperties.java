package com.rastreador.auth;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * @param maxPerIp quantos cadastros um mesmo IP pode fazer por janela
 * @param window   tamanho da janela
 */
@ConfigurationProperties(prefix = "app.registration")
public record RegistrationProperties(int maxPerIp, Duration window) {
}
