package com.rastreador.auth;

/**
 * Usuário autenticado extraído do JWT. Fica no SecurityContext como principal.
 */
public record AuthenticatedUser(Long id, String name, String email) {
}
