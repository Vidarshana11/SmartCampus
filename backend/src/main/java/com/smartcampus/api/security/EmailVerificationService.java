package com.smartcampus.api.security;

import com.smartcampus.api.user.User;
import com.smartcampus.api.user.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class EmailVerificationService {

    private final UserRepository userRepository;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final PendingEmailVerificationRepository pendingEmailVerificationRepository;
    private final TokenGeneratorService tokenGeneratorService;
    private final EmailSenderService emailSenderService;

    @Value("${app.email-verification.ttl-minutes:1440}")
    private long verificationTtlMinutes;

    public EmailVerificationService(
            UserRepository userRepository,
            EmailVerificationTokenRepository emailVerificationTokenRepository,
            PendingEmailVerificationRepository pendingEmailVerificationRepository,
            TokenGeneratorService tokenGeneratorService,
            EmailSenderService emailSenderService
    ) {
        this.userRepository = userRepository;
        this.emailVerificationTokenRepository = emailVerificationTokenRepository;
        this.pendingEmailVerificationRepository = pendingEmailVerificationRepository;
        this.tokenGeneratorService = tokenGeneratorService;
        this.emailSenderService = emailSenderService;
    }

    /**
     * Generates and sends a 6-digit verification code to the user.
     * Returns the code (for testing purposes - in production, only send via email).
     */
    @Transactional
    public String generateAndSendVerificationCode(User user) {
        if (user.isEmailVerified()) {
            return null;
        }
        invalidateActiveTokensForUser(user);

        String rawCode = tokenGeneratorService.generateNumericCode();
        String codeHash = tokenGeneratorService.hashCode(rawCode);
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(verificationTtlMinutes);

        EmailVerificationToken token = EmailVerificationToken.builder()
                .user(user)
                .tokenHash(codeHash)
                .expiresAt(expiresAt)
                .build();
        emailVerificationTokenRepository.save(token);

        emailSenderService.sendEmailVerificationCode(user.getEmail(), user.getName(), rawCode);
        return rawCode;
    }

    /**
     * Verifies a 6-digit code for the given email.
     * Returns true if code is valid and consumed successfully.
     */
    @Transactional
    public boolean verifyEmailCode(String email, String rawCode) {
        LocalDateTime now = LocalDateTime.now();
        String codeHash = tokenGeneratorService.hashCode(rawCode);

        // First check pending verifications (for new registrations)
        Optional<PendingEmailVerification> pendingOpt =
                pendingEmailVerificationRepository.findByEmailAndCodeHashAndConsumedAtIsNullAndExpiresAtAfter(
                        email, codeHash, now);

        if (pendingOpt.isPresent()) {
            PendingEmailVerification pending = pendingOpt.get();
            pending.setConsumedAt(now);
            pendingEmailVerificationRepository.save(pending);
            return true;
        }

        // Then check existing user verifications
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            List<EmailVerificationToken> activeTokens =
                    emailVerificationTokenRepository.findByUserAndConsumedAtIsNullAndExpiresAtAfter(user, now);

            for (EmailVerificationToken token : activeTokens) {
                if (token.matchesCode(rawCode, tokenGeneratorService)) {
                    user.setEmailVerified(true);
                    user.setEmailVerifiedAt(now);
                    token.setConsumedAt(now);
                    userRepository.save(user);
                    emailVerificationTokenRepository.save(token);
                    return true;
                }
            }
        }

        return false;
    }

    @Transactional
    public void resendVerification(String email) {
        userRepository.findByEmail(email).ifPresent(this::generateAndSendVerificationCode);
    }

    /**
     * For pre-verification during registration - creates pending verification for email
     * Returns the 6-digit verification code
     */
    @Transactional
    public String createVerificationForEmail(String email, String name) {
        invalidatePendingVerificationsForEmail(email);

        String rawCode = tokenGeneratorService.generateNumericCode();
        String codeHash = tokenGeneratorService.hashCode(rawCode);
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(verificationTtlMinutes);

        PendingEmailVerification pending = PendingEmailVerification.builder()
                .email(email)
                .codeHash(codeHash)
                .expiresAt(expiresAt)
                .build();
        pendingEmailVerificationRepository.save(pending);

        emailSenderService.sendEmailVerificationCode(email, name, rawCode);
        return rawCode;
    }

    private void invalidateActiveTokensForUser(User user) {
        LocalDateTime now = LocalDateTime.now();
        for (EmailVerificationToken token : emailVerificationTokenRepository.findByUserAndConsumedAtIsNull(user)) {
            token.setConsumedAt(now);
        }
    }

    private void invalidatePendingVerificationsForEmail(String email) {
        LocalDateTime now = LocalDateTime.now();
        for (PendingEmailVerification pending : pendingEmailVerificationRepository.findByEmailAndConsumedAtIsNull(email)) {
            pending.setConsumedAt(now);
        }
    }

    // Legacy method - kept for compatibility but redirects to new code-based flow
    @Transactional
    public void sendVerificationEmail(User user) {
        generateAndSendVerificationCode(user);
    }

    // Legacy method - kept for compatibility
    @Transactional
    public boolean verifyEmail(String rawToken) {
        // This method is kept for backwards compatibility with link-based tokens
        String tokenHash = tokenGeneratorService.hashToken(rawToken);
        LocalDateTime now = LocalDateTime.now();

        Optional<EmailVerificationToken> maybeToken =
                emailVerificationTokenRepository.findByTokenHashAndConsumedAtIsNullAndExpiresAtAfter(tokenHash, now);
        if (maybeToken.isEmpty()) {
            return false;
        }

        EmailVerificationToken token = maybeToken.get();
        User user = token.getUser();

        if (user == null) {
            return false;
        }

        user.setEmailVerified(true);
        user.setEmailVerifiedAt(now);
        token.setConsumedAt(now);

        userRepository.save(user);
        emailVerificationTokenRepository.save(token);
        return true;
    }
}
