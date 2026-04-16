package com.smartcampus.api.security;

import com.smartcampus.api.user.User;
import com.smartcampus.api.user.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
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

    /**
     * Generates and sends a 6-digit reset code to the user's email.
     * Returns the code (for testing purposes - in production, only send via email).
     */
    @Transactional
    public String requestPasswordReset(String email) {
        Optional<User> maybeUser = userRepository.findByEmail(email);
        if (maybeUser.isEmpty()) {
            return null;
        }

        User user = maybeUser.get();
        invalidateActiveTokensForUser(user);

        String rawCode = tokenGeneratorService.generateNumericCode();
        String codeHash = tokenGeneratorService.hashCode(rawCode);
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = now.plusMinutes(resetTtlMinutes);

        PasswordResetToken resetToken = PasswordResetToken.builder()
                .user(user)
                .tokenHash(codeHash)
                .expiresAt(expiresAt)
                .build();
        passwordResetTokenRepository.save(resetToken);

        emailSenderService.sendPasswordResetCode(user.getEmail(), user.getName(), rawCode);
        return rawCode;
    }

    /**
     * Verifies a 6-digit reset code for the given email.
     * Returns true if code is valid.
     */
    @Transactional
    public boolean verifyResetCode(String email, String rawCode) {
        LocalDateTime now = LocalDateTime.now();

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return false;
        }
        User user = userOpt.get();

        // Find active tokens for this user and check if any matches the code
        List<PasswordResetToken> activeTokens =
                passwordResetTokenRepository.findByUserAndConsumedAtIsNullAndExpiresAtAfter(user, now);

        for (PasswordResetToken token : activeTokens) {
            if (token.matchesCode(rawCode, tokenGeneratorService)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Resets password using email and 6-digit code.
     * Consumes the code on successful reset.
     */
    @Transactional
    public boolean resetPassword(String email, String rawCode, String newPassword) {
        LocalDateTime now = LocalDateTime.now();

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return false;
        }
        User user = userOpt.get();

        // Find active tokens for this user and check if any matches the code
        List<PasswordResetToken> activeTokens =
                passwordResetTokenRepository.findByUserAndConsumedAtIsNullAndExpiresAtAfter(user, now);

        for (PasswordResetToken token : activeTokens) {
            if (token.matchesCode(rawCode, tokenGeneratorService)) {
                // Valid code - consume it and update password
                user.setPasswordHash(passwordEncoder.encode(newPassword));
                token.setConsumedAt(now);

                userRepository.save(user);
                passwordResetTokenRepository.save(token);
                return true;
            }
        }
        return false;
    }

    // Legacy method - kept for backwards compatibility with token-based reset
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
