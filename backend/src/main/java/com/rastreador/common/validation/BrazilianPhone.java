package com.rastreador.common.validation;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

/**
 * Telefone brasileiro: DDD existente + 8 dígitos (fixo, começando com 2 a 5)
 * ou 9 dígitos (celular, começando com 9). Aceita máscara. Vazio é válido.
 */
@Documented
@Constraint(validatedBy = BrazilianPhoneValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER, ElementType.RECORD_COMPONENT})
@Retention(RetentionPolicy.RUNTIME)
public @interface BrazilianPhone {

    String message() default "Telefone inválido";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
