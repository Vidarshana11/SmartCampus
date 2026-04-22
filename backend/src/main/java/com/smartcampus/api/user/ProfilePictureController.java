package com.smartcampus.api.user;

import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Profile Picture and Account Management Controller
 * Handles file uploads, profile picture management, password changes, and account deletion
 * ENDPOINTS:
 * - POST /api/users/{id}/upload-profile-picture - Upload profile picture
 * - DELETE /api/users/{id}/profile-picture - Delete profile picture
 * - POST /api/users/{id}/change-password - Change user password
 * - DELETE /api/users/{id}/delete-account - Delete user account (self-service)
 */
@Slf4j
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class ProfilePictureController {

    @Value("${file.upload-dir:uploads/}")
    private String uploadDir;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserDeletionService userDeletionService;

    /**
     * POST /api/users/{id}/upload-profile-picture - Upload or update profile picture
     */
    @PostMapping("/{id}/upload-profile-picture")
    @PreAuthorize("hasRole('ADMIN') or @securityService.isCurrentUser(#id, authentication)")
    public ResponseEntity<Map<String, Object>> uploadProfilePicture(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "File is empty"));
        }

        // Validate file type
        String contentType = file.getContentType();
        if (!isValidImageType(contentType)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Invalid file type. Only JPG, PNG, and WebP are allowed"));
        }

        // Validate file size (max 5MB)
        if (file.getSize() > 5 * 1024 * 1024) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "File size exceeds 5MB limit"));
        }

        try {
            User user = userRepository.findById(id)
                    .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + id));

            // Delete old profile picture if exists
            if (user.getProfilePictureUrl() != null && !user.getProfilePictureUrl().isEmpty()) {
                deleteProfilePictureFile(user.getProfilePictureUrl());
            }

            // Save new file
            String fileName = generateUniqueFileName(file.getOriginalFilename());
            String filePath = saveFile(file, fileName);

            // Update user profile picture URL
            user.setProfilePictureUrl(filePath);
            User updatedUser = userRepository.save(user);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Profile picture uploaded successfully");
            response.put("profilePictureUrl", updatedUser.getProfilePictureUrl());
            response.put("user", convertToDTO(updatedUser));

            return ResponseEntity.ok(response);

        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to upload file: " + e.getMessage()));
        }
    }

    /**
     * DELETE /api/users/{id}/profile-picture - Delete profile picture
     */
    @DeleteMapping("/{id}/profile-picture")
    @PreAuthorize("hasRole('ADMIN') or @securityService.isCurrentUser(#id, authentication)")
    public ResponseEntity<Map<String, Object>> deleteProfilePicture(@PathVariable Long id) {

        try {
            User user = userRepository.findById(id)
                    .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + id));

            if (user.getProfilePictureUrl() != null && !user.getProfilePictureUrl().isEmpty()) {
                deleteProfilePictureFile(user.getProfilePictureUrl());
                user.setProfilePictureUrl(null);
                User updatedUser = userRepository.save(user);

                Map<String, Object> response = new HashMap<>();
                response.put("message", "Profile picture deleted successfully");
                response.put("user", convertToDTO(updatedUser));

                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "No profile picture to delete"));
            }

        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to delete profile picture: " + e.getMessage()));
        }
    }

    /**
     * POST /api/users/{id}/change-password - Change user password
     * Only works for non-OAuth users (users with password hash)
     */
    @PostMapping("/{id}/change-password")
    @PreAuthorize("hasRole('ADMIN') or @securityService.isCurrentUser(#id, authentication)")
    public ResponseEntity<Map<String, String>> changePassword(
            @PathVariable Long id,
            @RequestBody ChangePasswordRequest request) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + id));

        // Check if user has a password (non-OAuth user)
        if (user.getPasswordHash() == null || user.getPasswordHash().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Cannot change password for OAuth-authenticated users"));
        }

        // Validate old password
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Current password is incorrect"));
        }

        // Validate new password
        if (request.newPassword() == null || request.newPassword().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "New password is required"));
        }

        if (request.newPassword().length() < 6) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Password must be at least 6 characters"));
        }

        // Update password
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }

    /**
     * DELETE /api/users/{id}/delete-account - Delete user account permanently (self-service)
     * Users can only delete their own account
     * Deletes all related data: bookings, tickets, comments, notifications, tokens
     */
    @DeleteMapping("/{id}/delete-account")
    @PreAuthorize("@securityService.isCurrentUser(#id, authentication)")
    public ResponseEntity<Map<String, String>> deleteAccount(@PathVariable Long id) {
        log.info("Starting self-service account deletion for user id: {}", id);

        try {
            // Use the deletion service to handle all related entities
            userDeletionService.deleteUser(id, true);
            return ResponseEntity.ok(Map.of("message", "Account deleted successfully"));
        } catch (EntityNotFoundException e) {
            log.error("User not found for deletion: {}", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "User not found"));
        } catch (RuntimeException e) {
            log.error("Error deleting account for user {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to delete account: " + e.getMessage()));
        }
    }

    // ===== Helper Methods =====

    private boolean isValidImageType(String contentType) {
        if (contentType == null) {
            return false;
        }
        return contentType.equals("image/jpeg") ||
                contentType.equals("image/png") ||
                contentType.equals("image/webp");
    }

    private String generateUniqueFileName(String originalFileName) {
        String extension = originalFileName.substring(originalFileName.lastIndexOf("."));
        return UUID.randomUUID() + extension;
    }

    private String saveFile(MultipartFile file, String fileName) throws IOException {
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        Path filePath = uploadPath.resolve(fileName);
        Files.copy(file.getInputStream(), filePath);

        return "uploads/" + fileName;
    }

    private void deleteProfilePictureFile(String filePath) throws IOException {
        if (filePath != null && !filePath.isEmpty()) {
            Path path = Paths.get(filePath);
            Files.deleteIfExists(path);
        }
    }

    private UserDTO convertToDTO(User user) {
        return new UserDTO(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getRole().name(),
                user.getProfilePictureUrl(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }

    // ===== DTOs =====

    public record UserDTO(
            Long id,
            String email,
            String name,
            String role,
            String profilePictureUrl,
            java.time.LocalDateTime createdAt,
            java.time.LocalDateTime updatedAt
    ) {}

    public record ChangePasswordRequest(
            @NotBlank(message = "Current password is required")
            String currentPassword,

            @NotBlank(message = "New password is required")
            String newPassword
    ) {}
}
