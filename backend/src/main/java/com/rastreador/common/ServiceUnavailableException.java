package com.rastreador.common;

/**
 * Um serviço externo necessário para a operação está fora do ar (HTTP 503).
 */
public class ServiceUnavailableException extends RuntimeException {

    public ServiceUnavailableException(String message) {
        super(message);
    }
}
