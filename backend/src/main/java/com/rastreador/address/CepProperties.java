package com.rastreador.address;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * @param viaCepUrl    URL base da ViaCEP (fonte principal)
 * @param brasilApiUrl URL base da BrasilAPI (reserva)
 * @param timeout      tempo máximo de conexão e de leitura de cada consulta
 */
@ConfigurationProperties(prefix = "app.cep")
public record CepProperties(String viaCepUrl, String brasilApiUrl, Duration timeout) {
}
