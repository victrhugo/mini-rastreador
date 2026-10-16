package com.rastreador.auth;

import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.util.Locale;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.rastreador.auth.dto.AuthResponse;
import com.rastreador.auth.dto.LoginRequest;
import com.rastreador.auth.dto.RegisterRequest;
import com.rastreador.auth.email.EmailPolicy;
import com.rastreador.common.ConflictException;
import com.rastreador.common.FieldValidationException;
import com.rastreador.common.FixedWindowRateLimiter;
import com.rastreador.common.UnauthorizedException;
import com.rastreador.user.User;
import com.rastreador.user.UserRepository;

/**
 * Cadastro e login. Os métodos não são transacionais de propósito: BCrypt e a consulta
 * de DNS do e-mail são lentos e não precisam do banco. Só as chamadas ao repositório
 * (cada uma com sua transação curta) usam a conexão, que no SQLite é única.
 */
@Service
public class AuthService {

    /** O BCrypt só considera os primeiros 72 bytes da senha. */
    private static final int MAX_PASSWORD_BYTES = 72;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailPolicy emailPolicy;
    private final LoginAttemptService loginAttempts;
    private final FixedWindowRateLimiter registrations;
    /** Hash de uma senha qualquer: conferido quando o e-mail não existe, para o tempo de resposta não denunciar isso. */
    private final String dummyHash;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService,
            EmailPolicy emailPolicy, LoginAttemptService loginAttempts, RegistrationProperties registration,
            Clock clock) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.emailPolicy = emailPolicy;
        this.loginAttempts = loginAttempts;
        this.registrations = new FixedWindowRateLimiter(registration.maxPerIp(), registration.window(), clock,
                "Muitos cadastros a partir desta rede. Tente novamente mais tarde.");
        this.dummyHash = passwordEncoder.encode("senha-ficticia-para-tempo-constante");
    }

    /**
     * @param clientIp IP de origem, usado no limite de cadastros
     */
    public AuthResponse register(RegisterRequest request, String clientIp) {
        registrations.acquire(clientIp);

        if (request.password().getBytes(StandardCharsets.UTF_8).length > MAX_PASSWORD_BYTES) {
            throw new FieldValidationException("password", "Senha muito longa. Use até 72 caracteres sem acento.");
        }

        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("E-mail já cadastrado.");
        }
        emailPolicy.validate(email);

        User user;
        try {
            user = userRepository.save(
                    new User(request.name().trim(), email, passwordEncoder.encode(request.password())));
        } catch (DataIntegrityViolationException ex) {
            // Dois cadastros simultâneos com o mesmo e-mail: o índice único decide.
            throw new ConflictException("E-mail já cadastrado.");
        }
        return authenticate(user);
    }

    /**
     * @param clientIp IP de origem, usado junto com o e-mail no limite de tentativas
     */
    public AuthResponse login(LoginRequest request, String clientIp) {
        String email = normalizeEmail(request.email());
        loginAttempts.beginAttempt(email, clientIp);

        // Mesma mensagem e tempo parecido para e-mail inexistente e senha errada:
        // não revela quais e-mails estão cadastrados.
        User user = userRepository.findByEmail(email).orElse(null);
        boolean valid = request.password().getBytes(StandardCharsets.UTF_8).length <= MAX_PASSWORD_BYTES
                && passwordEncoder.matches(request.password(), user == null ? dummyHash : user.getPasswordHash());
        if (user == null || !valid) {
            throw new UnauthorizedException("E-mail ou senha inválidos.");
        }

        loginAttempts.recordSuccess(email, clientIp);
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
