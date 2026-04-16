package com.smartcampus.api.security;

import com.smartcampus.api.user.User;
import com.smartcampus.api.user.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class PasswordResetService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenGeneratorService tokenGeneratorService;
    private final EmailSenderService emailSenderService;

    @Value("${app.password-reset.ttl-minutes:30}")
    private long resetTtlMinutes;

    @Value("${app.password-reset.frontend-reset-url:http://localhost:5173/reset-password}")
    private String frontendResetUrl;

    public PasswordResetService(
            UserRepository userRepository,
            PasswordResetTokenRepository passwordResetTokenRepository,
            PasswordEncoder passwordEncoder,
            TokenGeneratorService tokenGeneratorService,
            EmailSenderService emailSenderService
    ) {
        this.userRepository = userRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenGeneratorService = tokenGeneratorService;
        this.emailSenderService = emailSenderService;
    }

    @Transactional
    public void requestPasswordReset(String email) {
        Optional<User> maybeUser = userRepository.findByEmail(email);
        if (maybeUser.isEmpty()) {
            return;
        }

        User user = maybeUser.get();
        invalidateActiveTokensForUser(user);

        String rawToken = tokenGeneratorService.generateRawToken();
        String tokenHash = tokenGeneratorService.hashToken(rawToken);
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = now.plusMinutes(resetTtlMinutes);

        PasswordResetToken resetToken = PasswordResetToken.builder()
                .user(user)
                .tokenHash(tokenHash)
                .expiresAt(expiresAt)
                .build();
        passwordResetTokenRepository.save(resetToken);

        String resetUrl = frontendResetUrl + "?token=" + rawToken;
        emailSenderService.sendPasswordReset(user.getEmail(), user.getName(), resetUrl);
    }

    @Transactional
    public boolean resetPassword(String rawToken, String newPassword) {
        String tokenHash = tokenGeneratorService.hashToken(rawToken);
        LocalDateTime now = LocalDateTime.now();

        Optional<PasswordResetToken> maybeToken =
                passwordResetTokenRepository.findByTokenHashAndConsumedAtIsNullAndExpiresAtAfter(tokenHash, now);

        if (maybeToken.isEmpty()) {
            return false;
        }

        PasswordResetToken resetToken = maybeToken.get();
        User user = resetToken.getUser();

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        resetToken.setConsumedAt(now);

        userRepository.save(user);
        passwordResetTokenRepository.save(resetToken);
        return true;
    }

    private void invalidateActiveTokensForUser(User user) {
        LocalDateTime now = LocalDateTime.now();
        for (PasswordResetToken token : passwordResetTokenRepository.findByUserAndConsumedAtIsNull(user)) {
            token.setConsumedAt(now);
        }
    }

}
