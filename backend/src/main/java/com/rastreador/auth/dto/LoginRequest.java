package com.rastreador.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
        @NotBlank(message = "E-mail é obrigatório")
        @Size(max = 180, message = "E-mail deve ter no máximo 180 caracteres")
        String email,

        @NotBlank(message = "Senha é obrigatória")
        @Size(max = 72, message = "Senha deve ter no máximo 72 caracteres")
        String password) {
}
