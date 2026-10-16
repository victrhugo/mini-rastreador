package com.rastreador.auth.email;

import java.util.Hashtable;

import javax.naming.Context;
import javax.naming.NameNotFoundException;
import javax.naming.NamingException;
import javax.naming.directory.Attribute;
import javax.naming.directory.Attributes;
import javax.naming.directory.DirContext;
import javax.naming.directory.InitialDirContext;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Component;

/**
 * Consulta o DNS pelo registro MX (servidor de e-mail) usando o cliente DNS que já vem no
 * JDK, sem API externa. A RFC 5321 ainda permite entregar pelo registro A quando não há MX,
 * mas na prática todo provedor real publica MX, e domínios só com A costumam ser cópias de
 * provedores conhecidos (ex.: gmial.com) feitas para capturar e-mails digitados errado.
 */
@Component
public class DnsEmailDomainVerifier implements EmailDomainVerifier {

    private static final Logger log = LoggerFactory.getLogger(DnsEmailDomainVerifier.class);
    private static final String[] RECORD_TYPES = {"MX"};

    private final EmailProperties properties;

    public DnsEmailDomainVerifier(EmailProperties properties) {
        this.properties = properties;
    }

    @Override
    @Cacheable(cacheNames = "email-domains", unless = "#result.name() == 'UNKNOWN'")
    public DomainStatus check(String domain) {
        Hashtable<String, String> env = new Hashtable<>();
        env.put(Context.INITIAL_CONTEXT_FACTORY, "com.sun.jndi.dns.DnsContextFactory");
        env.put("com.sun.jndi.dns.timeout.initial", String.valueOf(properties.dnsTimeout().toMillis()));
        env.put("com.sun.jndi.dns.timeout.retries", "1");

        DirContext context = null;
        try {
            context = new InitialDirContext(env);
            Attributes records = context.getAttributes("dns:/" + domain, RECORD_TYPES);
            return acceptsMail(records.get("MX")) ? DomainStatus.VALID : DomainStatus.INVALID;
        } catch (NameNotFoundException ex) {
            return DomainStatus.INVALID;
        } catch (NamingException ex) {
            log.warn("Não foi possível verificar o domínio de e-mail {}: {}", domain, ex.getMessage());
            return DomainStatus.UNKNOWN;
        } finally {
            close(context);
        }
    }

    /**
     * Há pelo menos um servidor de e-mail de verdade. O "MX nulo" ({@code 0 .}, RFC 7505)
     * é a forma de um domínio declarar que não recebe e-mail.
     */
    private static boolean acceptsMail(Attribute mx) throws NamingException {
        if (mx == null) {
            return false;
        }
        for (int i = 0; i < mx.size(); i++) {
            String[] parts = String.valueOf(mx.get(i)).trim().split("\\s+");
            String host = parts[parts.length - 1];
            if (!host.equals(".") && !host.isEmpty()) {
                return true;
            }
        }
        return false;
    }

    private static void close(DirContext context) {
        if (context == null) {
            return;
        }
        try {
            context.close();
        } catch (NamingException ignored) {
            // nada a fazer
        }
    }
}
