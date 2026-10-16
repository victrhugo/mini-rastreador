package com.rastreador.common;

/**
 * Requisição válida, mas que conflita com o estado atual do recurso (HTTP 409).
 */
public class ConflictException extends RuntimeException {

    public ConflictException(String message) {
        super(message);
    }
}
