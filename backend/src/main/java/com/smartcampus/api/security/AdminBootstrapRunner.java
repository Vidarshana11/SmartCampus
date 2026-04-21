package com.smartcampus.api.security;

import com.smartcampus.api.user.Role;
import com.smartcampus.api.user.User;
import com.smartcampus.api.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class AdminBootstrapRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminBootstrapRunner.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.bootstrap.admin.enabled:true}")
    private boolean bootstrapEnabled;

    @Value("${app.bootstrap.admin.email:adminone@nust.lk}")
    private String bootstrapAdminEmail;

    @Value("${app.bootstrap.admin.name:Admin One}")
    private String bootstrapAdminName;

    @Value("${app.bootstrap.admin.password:Test1234}")
    private String bootstrapAdminPassword;

    public AdminBootstrapRunner(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!bootstrapEnabled) {
            return;
        }

        userRepository.findByEmail(bootstrapAdminEmail).ifPresentOrElse(existing -> {
            boolean changed = false;

            if (existing.getRole() != Role.ADMIN) {
                existing.setRole(Role.ADMIN);
                changed = true;
            }

            if (!existing.isEmailVerified()) {
                existing.setEmailVerified(true);
                existing.setEmailVerifiedAt(LocalDateTime.now());
                changed = true;
            }

            if (existing.getPasswordHash() == null || existing.getPasswordHash().isBlank()) {
                existing.setPasswordHash(passwordEncoder.encode(bootstrapAdminPassword));
                changed = true;
            }

            if (changed) {
                userRepository.save(existing);
                log.warn("Updated bootstrap admin account: {}", bootstrapAdminEmail);
            }
        }, () -> {
            User admin = User.builder()
                    .email(bootstrapAdminEmail)
                    .name(bootstrapAdminName)
                    .passwordHash(passwordEncoder.encode(bootstrapAdminPassword))
                    .role(Role.ADMIN)
                    .emailVerified(true)
                    .emailVerifiedAt(LocalDateTime.now())
                    .build();

            userRepository.save(admin);
            log.warn("Created bootstrap admin account: {}", bootstrapAdminEmail);
        });
    }
}
