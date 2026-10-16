package com.rastreador.common.validation;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;

class BrazilianPhoneValidatorTest {

    @ParameterizedTest
    @ValueSource(strings = {"(11) 98765-4321", "11987654321", "(21) 3333-4444", "+55 (31) 99876-5432", "(98) 2345-6789"})
    void acceptsValidPhones(String phone) {
        assertThat(BrazilianPhoneValidator.problem(phone)).isNull();
    }

    @ParameterizedTest
    @CsvSource(delimiter = '|', value = {
            "(20) 98765-4321 | DDD 20 não existe",
            "(10) 3333-4444  | DDD 10 não existe",
            "(11) 88765-4321 | Celular deve começar com 9 depois do DDD",
            "(11) 9333-4444  | Telefone fixo deve começar com 2, 3, 4 ou 5 depois do DDD",
            "(11) 9876-543   | Telefone deve ter DDD e 8 ou 9 dígitos",
            "123             | Telefone deve ter DDD e 8 ou 9 dígitos"})
    void explainsWhatIsWrong(String phone, String expected) {
        assertThat(BrazilianPhoneValidator.problem(phone)).isEqualTo(expected);
    }
}
