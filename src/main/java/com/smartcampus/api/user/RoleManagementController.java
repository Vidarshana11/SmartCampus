package com.smartcampus.api.user;

import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Member 4: Role Management Controller
 * Handles user role assignments and role-based operations
 * ENDPOINTS:
 * - GET /api/roles - Get all available roles
 * - GET /api/users - Get all users with pagination and filtering
 * - GET /api/users/{id} - Get user by ID
 * - GET /api/users/me - Get current user
 * - GET /api/users/role/{role} - Get users by role
 * - PUT /api/users/{id}/role - Update user role (Admin)
 * - PUT /api/users/{id} - Update user details
 * - DELETE /api/users/{id} - Delete user (Admin)
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class RoleManagementController {

    private final UserRepository userRepository;

    /**
     * GET /api/roles - Get all available roles
     * Member 4: GET endpoint for roles
     */
    @GetMapping("/roles")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getAllRoles() {
        List<Map<String, String>> roles = Arrays.stream(Role.values())
                .map(role -> {
                    Map<String, String> map = new HashMap<>();
                    map.put("name", role.name());
                    map.put("description", getRoleDescription(role));
                    return map;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(Map.of("roles", roles));
    }

    /**
     * GET /api/users - Get all users with their roles
     * Member 4: GET endpoint for user listing with roles
     */
    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Role role) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<User> usersPage;

        if (role != null) {
            usersPage = userRepository.findByRole(role, pageable);
        } else if (search != null && !search.isBlank()) {
            usersPage = userRepository.findByEmailContainingOrNameContainingIgnoreCase(search, search, pageable);
        } else {
            usersPage = userRepository.findAll(pageable);
        }

        List<UserDTO> userDTOs = usersPage.getContent()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("users", userDTOs);
        response.put("currentPage", usersPage.getNumber());
        response.put("totalItems", usersPage.getTotalElements());
        response.put("totalPages", usersPage.getTotalPages());

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/users/{id} - Get user details with role
     * Member 4: GET endpoint for single user
     */
    @GetMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN') or @securityService.isCurrentUser(#id, authentication)")
    public ResponseEntity<UserDTO> getUserById(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + id));
        return ResponseEntity.ok(convertToDTO(user));
    }

    /**
     * PUT /api/users/{id}/role - Update user role
     * Member 4: PUT endpoint for role assignment
     */
    @PutMapping("/users/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDTO> updateUserRole(
            @PathVariable Long id,
            @Valid @RequestBody RoleUpdateRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + id));

        // Prevent changing own role (safety measure)
        user.setRole(request.role());
        User updatedUser = userRepository.save(user);

        return ResponseEntity.ok(convertToDTO(updatedUser));
    }

    /**
     * PUT /api/users/{id} - Update user details
     * Member 4: PUT endpoint for user update
     */
    @PutMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN') or @securityService.isCurrentUser(#id, authentication)")
    public ResponseEntity<UserDTO> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UserUpdateRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + id));

        if (request.name() != null && !request.name().isBlank()) {
            user.setName(request.name());
        }

        User updatedUser = userRepository.save(user);
        return ResponseEntity.ok(convertToDTO(updatedUser));
    }

    /**
     * DELETE /api/users/{id} - Delete user
     * Member 4: DELETE endpoint for user removal
     */
    @DeleteMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> deleteUser(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser) {

        // Prevent self-deletion
        if (currentUser.getId().equals(id)) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Cannot delete your own account"));
        }

        User user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + id));

        userRepository.delete(user);
        return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
    }

    /**
     * GET /api/users/me - Get current user details
     * Member 4: GET endpoint for current user
     */
    @GetMapping("/users/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserDTO> getCurrentUser(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(convertToDTO(user));
    }

    /**
     * GET /api/users/role/{role} - Get users by role
     * Member 4: GET endpoint for users by role
     */
    @GetMapping("/users/role/{role}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getUsersByRole(
            @PathVariable Role role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<User> usersPage = userRepository.findByRole(role, pageable);

        List<UserDTO> userDTOs = usersPage.getContent()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("users", userDTOs);
        response.put("currentPage", usersPage.getNumber());
        response.put("totalItems", usersPage.getTotalElements());
        response.put("totalPages", usersPage.getTotalPages());

        return ResponseEntity.ok(response);
    }

    // Helper methods
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

    private String getRoleDescription(Role role) {
        return switch (role) {
            case STUDENT -> "Regular student user with basic access";
            case LECTURER -> "Lecturer with booking privileges";
            case TECHNICIAN -> "Technician for maintenance and incident handling";
            case MANAGER -> "Manager with approval privileges";
            case ADMIN -> "Administrator with full system access";
            case USER -> "Generic user role";
        };
    }

    // DTOs
    public record UserDTO(
            Long id,
            String email,
            String name,
            String role,
            String profilePictureUrl,
            java.time.LocalDateTime createdAt,
            java.time.LocalDateTime updatedAt
    ) {}

    public record RoleUpdateRequest(
            @NotNull(message = "Role is required") Role role
    ) {}

    public record UserUpdateRequest(
            @NotBlank(message = "Name is required") String name
    ) {}
}
