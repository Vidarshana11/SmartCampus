package com.smartcampus.api.security;

import com.smartcampus.api.security.dto.ForgotPasswordRequest;
import com.smartcampus.api.security.dto.ResetPasswordRequest;
import com.smartcampus.api.user.Role;
import com.smartcampus.api.user.User;
import com.smartcampus.api.user.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/**
 * Authentication controller for local registration & login.
 * Also provides a protected /me endpoint to verify JWT tokens.
 */
@Slf4j
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

    // ===== New Code-Based DTOs =====
    public record SendVerificationCodeRequest(
            @NotBlank(message = "Email is required") @Email(message = "Invalid email") String email,
            String name
    ) {}

    public record VerifyCodeRequest(
            @NotBlank(message = "Email is required") @Email(message = "Invalid email") String email,
            @NotBlank(message = "Code is required") String code
    ) {}

    public record RegisterWithCodeRequest(
            @NotBlank(message = "Email is required") @Email(message = "Invalid email") String email,
            @NotBlank(message = "Name is required") String name,
            @NotBlank(message = "Password is required") String password,
            @NotBlank(message = "Verification code is required") String verificationCode,
            String role
    ) {}

    public record SendResetCodeRequest(
            @NotBlank(message = "Email is required") @Email(message = "Invalid email") String email
    ) {}

    public record ResetWithCodeRequest(
            @NotBlank(message = "Email is required") @Email(message = "Invalid email") String email,
            @NotBlank(message = "Reset code is required") String resetCode,
            @NotBlank(message = "New password is required") String newPassword
    ) {}

    // ===== NEW: Send Verification Code (Step 1 of Registration) =====
    @PostMapping("/send-verification-code")
    public ResponseEntity<Map<String, Object>> sendVerificationCode(@Valid @RequestBody SendVerificationCodeRequest request) {
        // Check if email already exists
        if (userRepository.existsByEmail(request.email())) {
            return ResponseEntity.badRequest().body(Map.of("error", "An account with this email already exists."));
        }

        // Generate and send verification code
        String code = emailVerificationService.createVerificationForEmail(request.email(), request.name());

        return ResponseEntity.ok(Map.of(
                "message", "Verification code sent to your email.",
                "code", code  // Include code in response for testing/development
        ));
    }

    // ===== NEW: Register with Verification Code (Step 2) =====
    @PostMapping("/register-with-code")
    public ResponseEntity<Map<String, Object>> registerWithCode(@Valid @RequestBody RegisterWithCodeRequest request) {
        // Check if email already exists
        if (userRepository.existsByEmail(request.email())) {
            return ResponseEntity.badRequest().body(Map.of("error", "An account with this email already exists."));
        }

        // Verify the code first
        boolean verified = emailVerificationService.verifyEmailCode(request.email(), request.verificationCode());
        if (!verified) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Invalid or expired verification code."));
        }

        // Create the user (mark as email verified since they entered the correct code)
        User user = new User();
        user.setEmail(request.email());
        user.setName(request.name());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setEmailVerified(true);
        user.setEmailVerifiedAt(LocalDateTime.now());

        // Assign role (default to STUDENT if not provided or invalid)
        try {
            user.setRole(Role.valueOf(request.role().toUpperCase()));
        } catch (Exception e) {
            user.setRole(Role.STUDENT);
        }

        userRepository.save(user);

        // Generate JWT token for auto-login
        String token = jwtService.generateToken(user);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Registration successful. Your email has been verified.");
        response.put("token", token);
        response.put("user", buildUserMap(user));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ===== NEW: Send Password Reset Code =====
    @PostMapping("/send-reset-code")
    public ResponseEntity<Map<String, Object>> sendResetCode(@Valid @RequestBody SendResetCodeRequest request) {
        String code = passwordResetService.requestPasswordReset(request.email());

        Map<String, Object> response = new HashMap<>();
        response.put("message", "If this email exists, a password reset code has been sent.");
        if (code != null) {
            response.put("code", code); // Include code in response for testing/development
        }
        return ResponseEntity.ok(response);
    }

    // ===== NEW: Reset Password with Code =====
    @PostMapping("/reset-password-with-code")
    public ResponseEntity<Map<String, String>> resetPasswordWithCode(@Valid @RequestBody ResetWithCodeRequest request) {
        boolean resetSuccess = passwordResetService.resetPassword(request.email(), request.resetCode(), request.newPassword());
        if (!resetSuccess) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Invalid or expired reset code."));
        }
        return ResponseEntity.ok(Map.of("message", "Password reset successful. You can now sign in."));
    }

    // ===== NEW: Verify Code Only (for checking code validity without consuming it) =====
    @PostMapping("/verify-reset-code")
    public ResponseEntity<Map<String, String>> verifyResetCode(@Valid @RequestBody VerifyCodeRequest request) {
        boolean valid = passwordResetService.verifyResetCode(request.email(), request.code());
        if (!valid) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Invalid or expired reset code."));
        }
        return ResponseEntity.ok(Map.of("message", "Code is valid."));
    }

    // ===== Register (Legacy - kept for backwards compatibility) =====
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

        try {
            user.setRole(Role.valueOf(request.role().toUpperCase()));
        } catch (Exception e) {
            user.setRole(Role.STUDENT);
        }

        // Explicitly set as not verified (needs email verification)
        user.setEmailVerified(false);

        userRepository.save(user);
        emailVerificationService.sendVerificationEmail(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "Registration successful. Please verify your email before signing in."
        ));
    }

    // ===== Admin Create User (Auto-verifies ADMIN accounts) =====
    @PostMapping("/admin/register")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> adminCreateUser(
            @Valid @RequestBody RegisterRequest request,
            @AuthenticationPrincipal User adminUser) {

        if (userRepository.existsByEmail(request.email())) {
            return ResponseEntity.badRequest().body(Map.of("error", "An account with this email already exists."));
        }

        User user = User.builder()
                .email(request.email())
                .name(request.name())
                .passwordHash(passwordEncoder.encode(request.password()))
                .build();

        // Assign role (default to STUDENT if not provided or invalid)
        Role assignedRole;
        try {
            assignedRole = Role.valueOf(request.role().toUpperCase());
        } catch (Exception e) {
            assignedRole = Role.STUDENT;
        }
        user.setRole(assignedRole);

        // Auto-verify email for ADMIN accounts created by admin
        // Regular users still need email verification
        if (assignedRole == Role.ADMIN) {
            user.setEmailVerified(true);
            user.setEmailVerifiedAt(LocalDateTime.now());
            log.info("Admin {} created new admin account for {} - auto-verified", adminUser.getEmail(), request.email());
        } else {
            user.setEmailVerified(false);
        }

        // Explicitly set as not verified (needs email verification)
        user.setEmailVerified(false);

        userRepository.save(user);
        emailVerificationService.sendVerificationEmail(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "message", "Registration successful. Please verify your email before signing in."
        ));
    }

    // ===== Admin Create User (Auto-verifies all admin-created accounts) =====
    @PostMapping("/admin/register")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> adminCreateUser(
            @Valid @RequestBody RegisterRequest request,
            @AuthenticationPrincipal User adminUser) {

        if (userRepository.existsByEmail(request.email())) {
            return ResponseEntity.badRequest().body(Map.of("error", "An account with this email already exists."));
        }

        User user = User.builder()
                .email(request.email())
                .name(request.name())
                .passwordHash(passwordEncoder.encode(request.password()))
                .build();

        // Assign role (default to STUDENT if not provided or invalid)
        Role assignedRole;
        try {
            assignedRole = Role.valueOf(request.role().toUpperCase());
        } catch (Exception e) {
            assignedRole = Role.STUDENT;
        }
        user.setRole(assignedRole);

        // Accounts created by admin are trusted and pre-verified.
        user.setEmailVerified(true);
        user.setEmailVerifiedAt(LocalDateTime.now());
        log.info("Admin {} created {} account for {} - auto-verified", adminUser.getEmail(), assignedRole, request.email());

        userRepository.save(user);

        // Build response
        Map<String, Object> response = new HashMap<>();
        if (assignedRole == Role.ADMIN) {
            response.put("message", "Admin account created successfully. Email is pre-verified.");
        } else {
            response.put("message", "User created successfully. They will need to verify their email.");
        }
        response.put("user", buildUserMap(user));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
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

    // ===== Forgot Password (Legacy) =====
    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        passwordResetService.requestPasswordReset(request.email());
        return ResponseEntity.ok(
                Map.of("message", "If this email exists, a password reset link has been sent.")
        );
    }

    // ===== Reset Password (Legacy) =====
    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        boolean resetSuccess = passwordResetService.resetPassword(request.token(), request.newPassword());
        if (!resetSuccess) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Invalid or expired password reset token."));
        }
        return ResponseEntity.ok(Map.of("message", "Password reset successful. You can now sign in."));
    }

    // ===== Verify Email (Legacy) =====
    @PostMapping("/verify-email")
    public ResponseEntity<Map<String, String>> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        boolean verified = emailVerificationService.verifyEmail(request.token());
        if (!verified) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Invalid or expired verification token."));
        }
        return ResponseEntity.ok(Map.of("message", "Email verified successfully. You can now sign in."));
    }

    // ===== Resend Verification (Legacy) =====
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
    private Role resolveSelfRegistrationRole(String roleValue) {
        if (roleValue == null || roleValue.isBlank()) {
            return Role.STUDENT;
        }

        Role parsedRole;
        try {
            parsedRole = Role.valueOf(roleValue.toUpperCase(Locale.ROOT));
        } catch (Exception ex) {
            throw new IllegalArgumentException("Invalid role selected for self-registration.");
        }

        if (parsedRole != Role.STUDENT && parsedRole != Role.LECTURER) {
            throw new IllegalArgumentException("Only STUDENT and LECTURER accounts can be created from Create Account.");
        }

        return parsedRole;
    }

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
