package com.smartcampus.api.security;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PendingEmailVerificationRepository extends JpaRepository<PendingEmailVerification, Long> {

    Optional<PendingEmailVerification> findByEmailAndCodeHashAndConsumedAtIsNullAndExpiresAtAfter(
            String email, String codeHash, LocalDateTime now);

    List<PendingEmailVerification> findByEmailAndConsumedAtIsNull(String email);

    List<PendingEmailVerification> findByEmailAndConsumedAtIsNullAndExpiresAtAfter(String email, LocalDateTime now);
}
