package com.rastreador.auth;

import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;

import javax.crypto.SecretKey;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {

    private static final Logger log = LoggerFactory.getLogger(JwtService.class);

    private final SecretKey key;
    private final JwtProperties properties;

    public JwtService(JwtProperties properties) {
        this.properties = properties;
        this.key = buildKey(properties.secret());
    }

    /**
     * Sem JWT_SECRET definido, gera uma chave aleatória a cada inicialização: seguro por
     * padrão (nada de segredo conhecido no repositório), com o custo de invalidar os
     * tokens quando a API reinicia. Em produção, defina JWT_SECRET.
     */
    private static SecretKey buildKey(String secret) {
        if (secret == null || secret.isBlank()) {
            log.warn("JWT_SECRET não definido: usando chave aleatória. Os logins expiram quando a API reiniciar.");
            byte[] random = new byte[32];
            new SecureRandom().nextBytes(random);
            return Keys.hmacShaKeyFor(random);
        }
        byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) {
            throw new IllegalStateException("JWT_SECRET precisa ter pelo menos 32 bytes.");
        }
        return Keys.hmacShaKeyFor(bytes);
    }

    public IssuedToken issue(AuthenticatedUser user) {
        Instant now = Instant.now();
        Instant expiresAt = now.plus(properties.expiration());

        String token = Jwts.builder()
                .subject(user.id().toString())
                .claim("name", user.name())
                .claim("email", user.email())
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiresAt))
                .signWith(key)
                .compact();

        return new IssuedToken(token, expiresAt);
    }

    /**
     * Valida assinatura e expiração. Retorna vazio para qualquer token inválido.
     */
    public Optional<AuthenticatedUser> parse(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            return Optional.of(new AuthenticatedUser(
                    Long.valueOf(claims.getSubject()),
                    claims.get("name", String.class),
                    claims.get("email", String.class)));
        } catch (JwtException | IllegalArgumentException ex) {
            return Optional.empty();
        }
    }

    public record IssuedToken(String token, Instant expiresAt) {
    }
}
