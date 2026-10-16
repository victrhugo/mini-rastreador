package com.rastreador.auth.email;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import com.rastreador.auth.email.EmailDomainVerifier.DomainStatus;
import com.rastreador.common.FieldValidationException;

/**
 * Regras de e-mail aplicadas no cadastro, além do formato (já validado por @Email):
 * recusa provedores de e-mail temporário e domínios que não recebem e-mail.
 */
@Component
public class EmailPolicy {

    private final EmailDomainVerifier verifier;
    private final EmailProperties properties;
    private final Set<String> disposableDomains;

    public EmailPolicy(EmailDomainVerifier verifier, EmailProperties properties) {
        this.verifier = verifier;
        this.properties = properties;
        this.disposableDomains = loadDisposableDomains();
    }

    /**
     * @param email e-mail já normalizado (minúsculo, sem espaços)
     * @throws FieldValidationException no campo "email" se o endereço for recusado
     */
    public void validate(String email) {
        String domain = email.substring(email.lastIndexOf('@') + 1);

        if (disposableDomains.contains(domain)) {
            throw new FieldValidationException("email", "E-mails temporários não são aceitos.");
        }
        if (properties.checkDomain() && verifier.check(domain) == DomainStatus.INVALID) {
            throw new FieldValidationException("email", "O domínio %s não recebe e-mails. Confira o endereço."
                    .formatted(domain));
        }
    }

    private static Set<String> loadDisposableDomains() {
        try (InputStream input = new ClassPathResource("disposable-email-domains.txt").getInputStream()) {
            return new String(input.readAllBytes(), StandardCharsets.UTF_8).lines()
                    .map(line -> line.trim().toLowerCase(Locale.ROOT))
                    .filter(line -> !line.isEmpty() && !line.startsWith("#"))
                    .collect(Collectors.toUnmodifiableSet());
        } catch (IOException ex) {
            throw new IllegalStateException("Lista de domínios descartáveis não encontrada", ex);
        }
    }
}
