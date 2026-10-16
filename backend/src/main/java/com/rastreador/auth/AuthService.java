package com.rastreador.auth;

import java.util.Locale;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.rastreador.auth.dto.AuthResponse;
import com.rastreador.auth.dto.LoginRequest;
import com.rastreador.auth.dto.RegisterRequest;
import com.rastreador.common.ConflictException;
import com.rastreador.common.UnauthorizedException;
import com.rastreador.user.User;
import com.rastreador.user.UserRepository;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("E-mail já cadastrado.");
        }

        User user = userRepository.save(
                new User(request.name().trim(), email, passwordEncoder.encode(request.password())));
        return authenticate(user);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        // Mesma mensagem para e-mail inexistente e senha errada: não revela quais e-mails existem.
        User user = userRepository.findByEmail(normalizeEmail(request.email()))
                .filter(found -> passwordEncoder.matches(request.password(), found.getPasswordHash()))
                .orElseThrow(() -> new UnauthorizedException("E-mail ou senha inválidos."));
        return authenticate(user);
    }

    private AuthResponse authenticate(User user) {
        AuthenticatedUser principal = new AuthenticatedUser(user.getId(), user.getName(), user.getEmail());
        JwtService.IssuedToken issued = jwtService.issue(principal);
        return new AuthResponse(issued.token(), issued.expiresAt(),
                new AuthResponse.UserResponse(user.getId(), user.getName(), user.getEmail()));
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
