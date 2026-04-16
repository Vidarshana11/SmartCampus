package com.smartcampus.api.security;

import com.smartcampus.api.security.dto.ForgotPasswordRequest;
import com.smartcampus.api.security.dto.ResetPasswordRequest;
import com.smartcampus.api.user.Role;
import com.smartcampus.api.user.User;
import com.smartcampus.api.user.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Authentication controller for local registration & login.
 * Also provides a protected /me endpoint to verify JWT tokens.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final PasswordResetService passwordResetService;
    private final EmailVerificationService emailVerificationService;

    public AuthController(
            UserRepository userRepository,
            JwtService jwtService,
            PasswordEncoder passwordEncoder,
            PasswordResetService passwordResetService,
            EmailVerificationService emailVerificationService
    ) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
        this.passwordResetService = passwordResetService;
        this.emailVerificationService = emailVerificationService;
    }

    // ===== DTOs =====
    public record RegisterRequest(
            @NotBlank(message = "Email is required") @Email(message = "Invalid email") String email,
            @NotBlank(message = "Name is required") String name,
            @NotBlank(message = "Password is required") String password,
            String role
    ) {}

    public record LoginRequest(
            @NotBlank(message = "Email is required") @Email String email,
            @NotBlank(message = "Password is required") String password
    ) {}

    public record ResendVerificationRequest(
            @NotBlank(message = "Email is required") @Email(message = "Invalid email") String email
    ) {}

    public record VerifyEmailRequest(
            @NotBlank(message = "Token is required") String token
    ) {}

    // ===== Register =====
    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@Valid @RequestBody RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            return ResponseEntity.badRequest().body(Map.of("error", "An account with this email already exists."));
        }

        User user = User.builder()
                .email(request.email())
                .name(request.name())
                .passwordHash(passwordEncoder.encode(request.password()))
                .build();

        // Assign role (default to USER if not provided or invalid)
        try {
            user.setRole(Role.valueOf(request.role().toUpperCase()));
        } catch (Exception e) {
            user.setRole(Role.USER);
        }

        userRepository.save(user);
        emailVerificationService.sendVerificationEmail(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "Registration successful. Please verify your email before signing in."
        ));
    }

    // ===== Login =====
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@Valid @RequestBody LoginRequest request) {
        User user = userRepository.findByEmail(request.email()).orElse(null);

        if (user == null || user.getPasswordHash() == null ||
                !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid email or password."));
        }
        if (!user.isEmailVerified()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "error", "Email not verified. Please verify your email before signing in."
            ));
        }

        String token = jwtService.generateToken(user);

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("user", buildUserMap(user));
        return ResponseEntity.ok(response);
    }

    // ===== Get Current User =====
    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> me(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid token"));
        }
        return ResponseEntity.ok(Map.of("user", buildUserMap(user)));
    }

    // ===== Forgot Password =====
    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        passwordResetService.requestPasswordReset(request.email());
        return ResponseEntity.ok(
                Map.of("message", "If this email exists, a password reset link has been sent.")
        );
    }

    // ===== Reset Password =====
    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        boolean resetSuccess = passwordResetService.resetPassword(request.token(), request.newPassword());
        if (!resetSuccess) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Invalid or expired password reset token."));
        }
        return ResponseEntity.ok(Map.of("message", "Password reset successful. You can now sign in."));
    }

    // ===== Verify Email =====
    @PostMapping("/verify-email")
    public ResponseEntity<Map<String, String>> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        boolean verified = emailVerificationService.verifyEmail(request.token());
        if (!verified) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Invalid or expired verification token."));
        }
        return ResponseEntity.ok(Map.of("message", "Email verified successfully. You can now sign in."));
    }

    // ===== Resend Verification =====
    @PostMapping("/resend-verification")
    public ResponseEntity<Map<String, String>> resendVerification(
            @Valid @RequestBody ResendVerificationRequest request
    ) {
        emailVerificationService.resendVerification(request.email());
        return ResponseEntity.ok(Map.of(
                "message", "If this email exists, a verification email has been sent."
        ));
    }

    // ===== Helper =====
    private Map<String, Object> buildUserMap(User user) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", user.getId());
        map.put("email", user.getEmail());
        map.put("name", user.getName());
        map.put("role", user.getRole().name());
        map.put("profilePictureUrl", user.getProfilePictureUrl());
        map.put("hasPassword", user.getPasswordHash() != null && !user.getPasswordHash().isEmpty());
        map.put("emailVerified", user.isEmailVerified());
        return map;
    }
}
