package com.smartcampus.api.security;

import com.smartcampus.api.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, Long> {

    Optional<EmailVerificationToken> findByTokenHashAndConsumedAtIsNullAndExpiresAtAfter(String tokenHash, LocalDateTime now);

    List<EmailVerificationToken> findByUserAndConsumedAtIsNull(User user);

    List<EmailVerificationToken> findByUserAndConsumedAtIsNullAndExpiresAtAfter(User user, LocalDateTime now);

    // For user account deletion - find all tokens by user
    List<EmailVerificationToken> findByUser(User user);
}
