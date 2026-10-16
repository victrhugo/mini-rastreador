package com.rastreador.auth.dto;

import java.time.Instant;

public record AuthResponse(String token, Instant expiresAt, UserResponse user) {

    public record UserResponse(Long id, String name, String email) {
    }
}
