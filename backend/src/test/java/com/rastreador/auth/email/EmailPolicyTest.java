package com.rastreador.auth.email;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Duration;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;

import com.rastreador.auth.email.EmailDomainVerifier.DomainStatus;
import com.rastreador.common.FieldValidationException;

class EmailPolicyTest {

    private static EmailPolicy policyWith(DomainStatus status, boolean checkDomain) {
        return new EmailPolicy(domain -> status, new EmailProperties(checkDomain, Duration.ofSeconds(1)));
    }

    @Test
    void acceptsDomainThatReceivesEmail() {
        assertThatCode(() -> policyWith(DomainStatus.VALID, true).validate("ana@gmail.com"))
                .doesNotThrowAnyException();
    }

    @Test
    void rejectsDomainWithoutMailServer() {
        assertThatThrownBy(() -> policyWith(DomainStatus.INVALID, true).validate("ana@loja-sem-email.com.br"))
                .isInstanceOf(FieldValidationException.class)
                .hasMessageContaining("loja-sem-email.com.br");
    }

    @Test
    void doesNotBlockWhenDnsIsUnavailable() {
        assertThatCode(() -> policyWith(DomainStatus.UNKNOWN, true).validate("ana@empresa.com.br"))
                .doesNotThrowAnyException();
    }

    @Test
    void rejectsDisposableEmailEvenWithoutDnsCheck() {
        assertThatThrownBy(() -> policyWith(DomainStatus.VALID, false).validate("x@mailinator.com"))
                .isInstanceOf(FieldValidationException.class)
                .hasMessage("E-mails temporários não são aceitos.");
    }

    @Test
    void skipsDnsCheckWhenDisabled() {
        assertThatCode(() -> policyWith(DomainStatus.INVALID, false).validate("ana@qualquer.test"))
                .doesNotThrowAnyException();
    }

    @Test
    void rejectsSubdomainsOfDisposableProviders() {
        assertThatThrownBy(() -> policyWith(DomainStatus.VALID, false).validate("x@caixa.mailinator.com"))
                .isInstanceOf(FieldValidationException.class);
    }

    @ParameterizedTest
    @CsvSource({
            "ana@gmial.com, gmail.com",
            "ana@gmail.co, gmail.com",
            "ana@hotmial.com, hotmail.com",
            "ana@outlok.com, outlook.com",
            "ana@yaho.com.br, yahoo.com.br"})
    void rejectsTyposOfWellKnownProvidersEvenIfTheDomainExists(String email, String suggestion) {
        assertThatThrownBy(() -> policyWith(DomainStatus.VALID, true).validate(email))
                .isInstanceOf(FieldValidationException.class)
                .hasMessage("Parece haver um erro de digitação. Você quis dizer %s?".formatted(suggestion));
    }

    @ParameterizedTest
    @ValueSource(strings = {"gmail.com", "uol.com.br", "bol.com.br", "empresa.com.br", "gmx.com", "usp.br"})
    void doesNotFlagRealDomains(String domain) {
        assertThat(EmailPolicy.typoSuggestion(domain)).isNull();
    }
}
