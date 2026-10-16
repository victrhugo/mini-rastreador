package com.rastreador.common;

/**
 * Erro de validação de um campo específico que só pode ser detectado no serviço
 * (por exemplo, consultando o DNS). Vira 400 com o erro associado ao campo.
 */
public class FieldValidationException extends RuntimeException {

    private final String field;

    public FieldValidationException(String field, String message) {
        super(message);
        this.field = field;
    }

    public String getField() {
        return field;
    }
}
