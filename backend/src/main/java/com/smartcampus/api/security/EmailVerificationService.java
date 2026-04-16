package com.smartcampus.api.security;

import com.smartcampus.api.user.User;
import com.smartcampus.api.user.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class EmailVerificationService {

    private final UserRepository userRepository;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final TokenGeneratorService tokenGeneratorService;
    private final EmailSenderService emailSenderService;

    @Value("${app.email-verification.ttl-minutes:1440}")
    private long verificationTtlMinutes;

    @Value("${app.email-verification.frontend-verify-url:http://localhost:5173/verify-email}")
    private String frontendVerifyUrl;

    public EmailVerificationService(
            UserRepository userRepository,
            EmailVerificationTokenRepository emailVerificationTokenRepository,
            TokenGeneratorService tokenGeneratorService,
            EmailSenderService emailSenderService
    ) {
        this.userRepository = userRepository;
        this.emailVerificationTokenRepository = emailVerificationTokenRepository;
        this.tokenGeneratorService = tokenGeneratorService;
        this.emailSenderService = emailSenderService;
    }

    @Transactional
    public void sendVerificationEmail(User user) {
        if (user.isEmailVerified()) {
            return;
        }
        invalidateActiveTokensForUser(user);

        String rawToken = tokenGeneratorService.generateRawToken();
        String tokenHash = tokenGeneratorService.hashToken(rawToken);
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(verificationTtlMinutes);

        EmailVerificationToken token = EmailVerificationToken.builder()
                .user(user)
                .tokenHash(tokenHash)
                .expiresAt(expiresAt)
                .build();
        emailVerificationTokenRepository.save(token);

        String verifyUrl = frontendVerifyUrl + "?token=" + rawToken;
        emailSenderService.sendEmailVerification(user.getEmail(), user.getName(), verifyUrl);
    }

    @Transactional
    public boolean verifyEmail(String rawToken) {
        String tokenHash = tokenGeneratorService.hashToken(rawToken);
        LocalDateTime now = LocalDateTime.now();

        Optional<EmailVerificationToken> maybeToken =
                emailVerificationTokenRepository.findByTokenHashAndConsumedAtIsNullAndExpiresAtAfter(tokenHash, now);
        if (maybeToken.isEmpty()) {
            return false;
        }

        EmailVerificationToken token = maybeToken.get();
        User user = token.getUser();

        user.setEmailVerified(true);
        user.setEmailVerifiedAt(now);
        token.setConsumedAt(now);

        userRepository.save(user);
        emailVerificationTokenRepository.save(token);
        return true;
    }

    @Transactional
    public void resendVerification(String email) {
        userRepository.findByEmail(email).ifPresent(this::sendVerificationEmail);
    }

    private void invalidateActiveTokensForUser(User user) {
        LocalDateTime now = LocalDateTime.now();
        for (EmailVerificationToken token : emailVerificationTokenRepository.findByUserAndConsumedAtIsNull(user)) {
            token.setConsumedAt(now);
        }
    }
}
