package com.smartcampus.api.notification;

import com.smartcampus.api.user.Role;
import com.smartcampus.api.user.User;
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

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Member 4: Notifications Controller
 * Handles user notifications and notification management
 * ENDPOINTS:
 * - GET /api/notifications - Get user notifications (paginated, filter by unread)
 * - GET /api/notifications/unread-count - Get unread notification count
 * - PUT /api/notifications/{id}/read - Mark notification as read
 * - PUT /api/notifications/read-all - Mark all notifications as read
 * - DELETE /api/notifications/{id} - Delete notification
 * - POST /api/notifications/admin/system - Send system notification (Admin)
 * - POST /api/notifications/admin/broadcast - Broadcast notification (Admin)
 */
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    /**
     * GET /api/notifications - Get all notifications for current user (with pagination)
     * Member 4: GET endpoint with filtering support
     */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> getNotifications(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Boolean unreadOnly) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        Map<String, Object> response = new HashMap<>();

        if (Boolean.TRUE.equals(unreadOnly)) {
            List<NotificationDTO> unreadNotifications = notificationService.getUnreadNotifications(user.getId());
            response.put("notifications", unreadNotifications);
            response.put("unreadCount", unreadNotifications.size());
        } else {
            Page<NotificationDTO> notifications = notificationService.getUserNotificationsPaginated(user.getId(), pageable);
            response.put("notifications", notifications.getContent());
            response.put("currentPage", notifications.getNumber());
            response.put("totalItems", notifications.getTotalElements());
            response.put("totalPages", notifications.getTotalPages());
        }

        // Always include unread count
        response.put("unreadCount", notificationService.countUnreadNotifications(user.getId()));

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/notifications/unread-count - Get unread notification count
     * Member 4: GET endpoint for unread count (for badge display)
     */
    @GetMapping("/unread-count")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Long>> getUnreadCount(@AuthenticationPrincipal User user) {
        long count = notificationService.countUnreadNotifications(user.getId());
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }

    /**
     * PUT /api/notifications/{id}/read - Mark a notification as read
     * Member 4: PUT endpoint
     */
    @PutMapping("/{id}/read")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> markAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        notificationService.markAsRead(id, user.getId());
        return ResponseEntity.ok().build();
    }

    /**
     * PUT /api/notifications/read-all - Mark all notifications as read
     * Member 4: PUT endpoint
     */
    @PutMapping("/read-all")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> markAllAsRead(@AuthenticationPrincipal User user) {
        notificationService.markAllAsRead(user.getId());
        return ResponseEntity.ok(Map.of("message", "All notifications marked as read"));
    }

    /**
     * DELETE /api/notifications/{id} - Delete a notification
     * Member 4: DELETE endpoint
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deleteNotification(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        notificationService.deleteNotification(id, user.getId());
        return ResponseEntity.noContent().build();
    }

    // Admin endpoints

    /**
     * POST /api/notifications/admin/system - Send system notification to a user
     * Member 4: POST endpoint (Admin only)
     */
    @PostMapping("/admin/system")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> sendSystemNotification(
            @Valid @RequestBody SystemNotificationRequest request) {
        notificationService.createSystemNotification(
                request.userId(),
                request.title(),
                request.message()
        );
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", "Notification sent successfully"));
    }

    /**
     * POST /api/notifications/admin/broadcast - Broadcast to all users
     * Member 4: POST endpoint (Admin only)
     */
    @PostMapping("/admin/broadcast")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> broadcastNotification(
            @Valid @RequestBody BroadcastNotificationRequest request) {
        NotificationType type = request.type() != null ? request.type() : NotificationType.INFO;
        NotificationCategory category = request.category() != null
                ? request.category()
                : NotificationCategory.SYSTEM;

        // Convert string roles to Role enums
        List<Role> targetRoles = convertStringToRoles(request.targetRoles());

        int recipientCount = notificationService.broadcastNotification(
                request.title(),
                request.message(),
                type,
                category,
                targetRoles
        );

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of(
                        "message", "Broadcast sent successfully",
                        "recipientCount", String.valueOf(recipientCount)
                ));
    }

    /**
     * POST /api/notifications/admin/announcements - Create announcement for selected roles
     * Admin can target specific roles, or all users if roles are omitted.
     */
    @PostMapping("/admin/announcements")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> createAnnouncement(
            @Valid @RequestBody AnnouncementRequest request) {
        try {
            List<Role> targetRoles = convertStringToRoles(request.targetRoles());

            int recipientCount = notificationService.broadcastNotification(
                    request.title(),
                    request.message(),
                    NotificationType.INFO,
                    NotificationCategory.SYSTEM,
                    targetRoles
            );

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of(
                            "message", "Announcement sent successfully",
                            "recipientCount", String.valueOf(recipientCount)
                    ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                            "message", "Error: " + e.getMessage()
                    ));
        }
    }

    // DTOs
    public record SystemNotificationRequest(
            @NotNull(message = "User ID is required")
            Long userId,

            @NotBlank(message = "Title is required")
            String title,

            @NotBlank(message = "Message is required")
            String message
    ) {}

    public record BroadcastNotificationRequest(
            @NotBlank(message = "Title is required")
            String title,

            @NotBlank(message = "Message is required")
            String message,

            NotificationType type,

            NotificationCategory category,

            List<Object> targetRoles
    ) {}

    public record AnnouncementRequest(
            @NotBlank(message = "Title is required")
            String title,

            @NotBlank(message = "Message is required")
            String message,

            List<Object> targetRoles
    ) {}

    /**
     * Helper method to convert targetRoles from Object/String to Role enum
     */
    private List<Role> convertStringToRoles(List<Object> roleObjects) {
        if (roleObjects == null || roleObjects.isEmpty()) {
            return List.of();
        }

        return roleObjects.stream()
                .map(role -> {
                    try {
                        if (role instanceof Role) {
                            return (Role) role;
                        }
                        return Role.valueOf(role.toString().toUpperCase());
                    } catch (IllegalArgumentException e) {
                        return null;
                    }
                })
                .filter(role -> role != null)
                .toList();
    }
}
