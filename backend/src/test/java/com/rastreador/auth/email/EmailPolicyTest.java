package com.rastreador.auth.email;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Duration;

import org.junit.jupiter.api.Test;

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
        assertThatThrownBy(() -> policyWith(DomainStatus.INVALID, true).validate("ana@gmial.com"))
                .isInstanceOf(FieldValidationException.class)
                .hasMessageContaining("gmial.com");
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
}
