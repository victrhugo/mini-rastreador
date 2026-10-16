package com.rastreador.auth.email;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * @param checkDomain liga a verificação do domínio no DNS (desligada nos testes, que rodam offline)
 * @param dnsTimeout  tempo máximo da consulta ao DNS
 */
@ConfigurationProperties(prefix = "app.email")
public record EmailProperties(boolean checkDomain, Duration dnsTimeout) {
}
