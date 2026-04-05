package com.smartcampus.api.notification;

import com.smartcampus.api.user.Role;
import com.smartcampus.api.user.User;
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

        int recipientCount = notificationService.broadcastNotification(
                request.title(),
                request.message(),
                type,
                category,
                request.targetRoles()
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
            NotificationType announcementType = resolveAnnouncementType(request.type(), request.urgency());
            int recipientCount = notificationService.broadcastNotification(
                    request.title(),
                    request.message(),
                    announcementType,
                    NotificationCategory.SYSTEM,
                    request.targetRoles()
            );

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(Map.of(
                            "message", "Announcement sent successfully",
                            "recipientCount", String.valueOf(recipientCount)
                    ));
        } catch (EntityNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", ex.getMessage()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", getRootCauseMessage(ex)));
        }
    }

    /**
     * GET /api/notifications/admin/history - Get admin notification history grouped by campaign.
     */
    @GetMapping("/admin/history")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getAdminNotificationHistory() {
        List<NotificationService.AdminNotificationHistoryDTO> history =
                notificationService.getAdminNotificationHistory();
        return ResponseEntity.ok(Map.of("notifications", history));
    }

    /**
     * PUT /api/notifications/admin/history/{campaignId} - Update a campaign notification.
     * Updates are propagated to every recipient notification row.
     */
    @PutMapping("/admin/history/{campaignId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateAdminNotificationHistory(
            @PathVariable String campaignId,
            @RequestBody AdminNotificationUpdateRequest request
    ) {
        try {
            NotificationService.AdminNotificationHistoryDTO updated =
                    notificationService.updateNotificationCampaign(
                            campaignId,
                            request.title(),
                            request.message(),
                            request.enabled()
                    );
            return ResponseEntity.ok(updated);
        } catch (EntityNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", ex.getMessage()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    /**
     * DELETE /api/notifications/admin/history/{campaignId} - Delete a campaign notification.
     * Deletes all recipient notification rows in the campaign.
     */
    @DeleteMapping("/admin/history/{campaignId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteAdminNotificationHistory(@PathVariable String campaignId) {
        try {
            int deletedCount = notificationService.deleteNotificationCampaign(campaignId);
            return ResponseEntity.ok(Map.of(
                    "message", "Notification campaign deleted successfully",
                    "deletedCount", String.valueOf(deletedCount)
            ));
        } catch (EntityNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", ex.getMessage()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
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

            List<Role> targetRoles
    ) {}

    public record AnnouncementRequest(
            @NotBlank(message = "Title is required")
            String title,

            @NotBlank(message = "Message is required")
            String message,

            NotificationType type,

            String urgency,

            List<Role> targetRoles
    ) {}

    public record AdminNotificationUpdateRequest(
            String title,
            String message,
            Boolean enabled
    ) {}

    private String getRootCauseMessage(Throwable throwable) {
        Throwable root = throwable;
        while (root.getCause() != null && root.getCause() != root) {
            root = root.getCause();
        }
        String message = root.getMessage();
        if (message == null || message.isBlank()) {
            return "Failed to create announcement";
        }
        return message;
    }

    private NotificationType resolveAnnouncementType(NotificationType explicitType, String urgency) {
        if (explicitType != null) {
            return explicitType;
        }
        if (urgency == null || urgency.isBlank()) {
            return NotificationType.INFO;
        }

        String normalized = urgency.trim().toUpperCase();
        return switch (normalized) {
            case "URGENT" -> NotificationType.ERROR;
            case "IMPORTANT" -> NotificationType.WARNING;
            case "NORMAL" -> NotificationType.INFO;
            default -> NotificationType.INFO;
        };
    }
}
