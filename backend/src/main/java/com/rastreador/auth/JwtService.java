package com.rastreador.auth;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;

import javax.crypto.SecretKey;

import org.springframework.stereotype.Service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {

    private final SecretKey key;
    private final JwtProperties properties;

    public JwtService(JwtProperties properties) {
        this.properties = properties;
        this.key = Keys.hmacShaKeyFor(properties.secret().getBytes(StandardCharsets.UTF_8));
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
