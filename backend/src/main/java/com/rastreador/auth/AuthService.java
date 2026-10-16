package com.rastreador.auth;

import java.util.Locale;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.rastreador.auth.dto.AuthResponse;
import com.rastreador.auth.dto.LoginRequest;
import com.rastreador.auth.dto.RegisterRequest;
import com.rastreador.auth.email.EmailPolicy;
import com.rastreador.common.ConflictException;
import com.rastreador.common.UnauthorizedException;
import com.rastreador.user.User;
import com.rastreador.user.UserRepository;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailPolicy emailPolicy;
    private final LoginAttemptService loginAttempts;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService,
            EmailPolicy emailPolicy, LoginAttemptService loginAttempts) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.emailPolicy = emailPolicy;
        this.loginAttempts = loginAttempts;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("E-mail já cadastrado.");
        }
        emailPolicy.validate(email);

        User user = userRepository.save(
                new User(request.name().trim(), email, passwordEncoder.encode(request.password())));
        return authenticate(user);
    }

    /**
     * @param clientIp IP de origem, usado junto com o e-mail no limite de tentativas
     */
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request, String clientIp) {
        String email = normalizeEmail(request.email());
        String attemptKey = email + "|" + clientIp;
        loginAttempts.checkAllowed(attemptKey);

        // Mesma mensagem para e-mail inexistente e senha errada: não revela quais e-mails existem.
        User user = userRepository.findByEmail(email)
                .filter(found -> passwordEncoder.matches(request.password(), found.getPasswordHash()))
                .orElse(null);
        if (user == null) {
            loginAttempts.recordFailure(attemptKey);
            throw new UnauthorizedException("E-mail ou senha inválidos.");
        }

        loginAttempts.recordSuccess(attemptKey);
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
