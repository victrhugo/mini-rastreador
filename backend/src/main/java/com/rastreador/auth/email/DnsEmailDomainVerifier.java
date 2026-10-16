package com.rastreador.auth.email;

import java.util.Hashtable;

import javax.naming.Context;
import javax.naming.NameNotFoundException;
import javax.naming.NamingException;
import javax.naming.directory.Attributes;
import javax.naming.directory.DirContext;
import javax.naming.directory.InitialDirContext;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Component;

/**
 * Consulta o DNS (registros MX, com A/AAAA como alternativa, como prevê a RFC 5321)
 * usando o cliente DNS que já vem no JDK. Não depende de nenhuma API externa.
 */
@Component
public class DnsEmailDomainVerifier implements EmailDomainVerifier {

    private static final Logger log = LoggerFactory.getLogger(DnsEmailDomainVerifier.class);
    private static final String[] RECORD_TYPES = {"MX", "A", "AAAA"};

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
            return records.size() > 0 ? DomainStatus.VALID : DomainStatus.INVALID;
        } catch (NameNotFoundException ex) {
            return DomainStatus.INVALID;
        } catch (NamingException ex) {
            log.warn("Não foi possível verificar o domínio de e-mail {}: {}", domain, ex.getMessage());
            return DomainStatus.UNKNOWN;
        } finally {
            close(context);
        }
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
