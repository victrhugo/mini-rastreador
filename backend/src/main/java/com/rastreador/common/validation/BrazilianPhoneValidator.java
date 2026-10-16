package com.rastreador.common.validation;

import java.util.Set;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class BrazilianPhoneValidator implements ConstraintValidator<BrazilianPhone, String> {

    /** DDDs em uso no Brasil (Anatel). */
    static final Set<Integer> VALID_DDDS = Set.of(
            11, 12, 13, 14, 15, 16, 17, 18, 19,
            21, 22, 24, 27, 28,
            31, 32, 33, 34, 35, 37, 38,
            41, 42, 43, 44, 45, 46, 47, 48, 49,
            51, 53, 54, 55,
            61, 62, 63, 64, 65, 66, 67, 68, 69,
            71, 73, 74, 75, 77, 79,
            81, 82, 83, 84, 85, 86, 87, 88, 89,
            91, 92, 93, 94, 95, 96, 97, 98, 99);

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null || value.isBlank()) {
            return true;
        }

        String message = problem(value);
        if (message == null) {
            return true;
        }
        context.disableDefaultConstraintViolation();
        context.buildConstraintViolationWithTemplate(message).addConstraintViolation();
        return false;
    }

    /** Descreve o problema do telefone, ou {@code null} se ele for válido. */
    static String problem(String value) {
        String digits = value.replaceAll("\\D", "");
        if (digits.startsWith("55") && digits.length() > 11) {
            digits = digits.substring(2);
        }
        if (digits.length() != 10 && digits.length() != 11) {
            return "Telefone deve ter DDD e 8 ou 9 dígitos";
        }
        if (!VALID_DDDS.contains(Integer.parseInt(digits.substring(0, 2)))) {
            return "DDD %s não existe".formatted(digits.substring(0, 2));
        }
        char first = digits.charAt(2);
        if (digits.length() == 11 && first != '9') {
            return "Celular deve começar com 9 depois do DDD";
        }
        if (digits.length() == 10 && (first < '2' || first > '5')) {
            return "Telefone fixo deve começar com 2, 3, 4 ou 5 depois do DDD";
        }
        return null;
    }
}
