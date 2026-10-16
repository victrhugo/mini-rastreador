package com.rastreador.auth.email;

/**
 * Verifica se um domínio pode receber e-mail.
 */
public interface EmailDomainVerifier {

    DomainStatus check(String domain);

    enum DomainStatus {
        /** O domínio existe e tem servidor de e-mail (ou endereço) publicado no DNS. */
        VALID,
        /** O domínio não existe ou não publica nenhum destino de e-mail. */
        INVALID,
        /** Não deu para saber (DNS fora do ar ou lento). Nesses casos o cadastro não é bloqueado. */
        UNKNOWN
    }
}
