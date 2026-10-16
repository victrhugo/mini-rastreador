package com.rastreador.auth.email;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import com.rastreador.auth.email.EmailDomainVerifier.DomainStatus;
import com.rastreador.common.FieldValidationException;

/**
 * Regras de e-mail aplicadas no cadastro, além do formato (já validado por @Email):
 * recusa domínios quase iguais aos de provedores conhecidos (erro de digitação),
 * provedores de e-mail temporário e domínios sem servidor de e-mail.
 */
@Component
public class EmailPolicy {

    /** Provedores mais usados no Brasil; base para detectar domínio digitado errado. */
    private static final List<String> COMMON_DOMAINS = List.of(
            "gmail.com", "hotmail.com", "hotmail.com.br", "outlook.com", "outlook.com.br", "live.com",
            "yahoo.com", "yahoo.com.br", "icloud.com", "uol.com.br", "bol.com.br", "terra.com.br",
            "globo.com", "proton.me", "protonmail.com");

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

        String suggestion = typoSuggestion(domain);
        if (suggestion != null) {
            throw new FieldValidationException("email",
                    "Parece haver um erro de digitação. Você quis dizer %s?".formatted(suggestion));
        }
        if (isDisposable(domain)) {
            throw new FieldValidationException("email", "E-mails temporários não são aceitos.");
        }
        if (properties.checkDomain() && verifier.check(domain) == DomainStatus.INVALID) {
            throw new FieldValidationException("email", "O domínio %s não recebe e-mails. Confira o endereço."
                    .formatted(domain));
        }
    }

    /**
     * Domínio a até 2 letras de diferença de um provedor conhecido (sem ser ele) é tratado
     * como erro de digitação: gmial.com, hotmial.com, outlok.com, gmail.co...
     */
    static String typoSuggestion(String domain) {
        if (domain.length() < 6 || COMMON_DOMAINS.contains(domain)) {
            return null;
        }
        return COMMON_DOMAINS.stream()
                .filter(candidate -> distance(domain, candidate) <= 2)
                .min(Comparator.comparingInt(candidate -> distance(domain, candidate)))
                .orElse(null);
    }

    /** Distância de edição (inserções, remoções e trocas de letra). */
    private static int distance(String a, String b) {
        int[] previous = new int[b.length() + 1];
        for (int j = 0; j <= b.length(); j++) {
            previous[j] = j;
        }
        for (int i = 1; i <= a.length(); i++) {
            int diagonal = previous[0];
            previous[0] = i;
            for (int j = 1; j <= b.length(); j++) {
                int above = previous[j];
                int cost = a.charAt(i - 1) == b.charAt(j - 1) ? 0 : 1;
                previous[j] = Math.min(Math.min(above + 1, previous[j - 1] + 1), diagonal + cost);
                diagonal = above;
            }
        }
        return previous[b.length()];
    }

    /** Confere o domínio e os "pais" dele: x.mailinator.com também é descartável. */
    private boolean isDisposable(String domain) {
        for (String candidate = domain; candidate.contains("."); candidate = candidate.substring(candidate.indexOf('.') + 1)) {
            if (disposableDomains.contains(candidate)) {
                return true;
            }
        }
        return false;
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
