package com.smartcampus.api.security;

import com.smartcampus.api.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByTokenHashAndConsumedAtIsNullAndExpiresAtAfter(String tokenHash, LocalDateTime now);

    List<PasswordResetToken> findByUserAndConsumedAtIsNull(User user);
}
