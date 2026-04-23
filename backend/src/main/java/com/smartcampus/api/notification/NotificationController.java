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

import java.time.LocalDateTime;
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
     * GET /api/notifications/admin - Get admin-specific notifications (ADMIN_ALERT category)
     * Admin notifications are separate from user notifications
     */
    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getAdminNotifications(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        // Get notifications for ADMIN_ALERT category
        List<NotificationDTO> adminNotifications = notificationService
                .getNotificationsByCategories(user.getId(), List.of(NotificationCategory.ADMIN_ALERT));

        // Paginate manually
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), adminNotifications.size());
        List<NotificationDTO> paginatedNotifications = start >= adminNotifications.size()
                ? List.of()
                : adminNotifications.subList(start, end);

        Map<String, Object> response = new HashMap<>();
        response.put("notifications", paginatedNotifications);
        response.put("currentPage", page);
        response.put("totalItems", adminNotifications.size());
        response.put("totalPages", (int) Math.ceil((double) adminNotifications.size() / size));
        response.put("unreadCount", adminNotifications.stream().filter(n -> !n.isRead()).count());

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/notifications/admin/unread-count - Get unread admin notification count
     */
    @GetMapping("/admin/unread-count")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Long>> getAdminUnreadCount(@AuthenticationPrincipal User user) {
        List<NotificationDTO> adminNotifications = notificationService
                .getNotificationsByCategories(user.getId(), List.of(NotificationCategory.ADMIN_ALERT));
        long count = adminNotifications.stream().filter(n -> !n.isRead()).count();
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
     * ADMIN can target all roles, while MANAGER and LECTURER are limited to their allowed audiences.
     */
    @PostMapping("/admin/announcements")
        @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'LECTURER')")
        public ResponseEntity<Map<String, String>> createAnnouncement(
            @Valid @RequestBody AnnouncementRequest request,
            @AuthenticationPrincipal User currentUser) {
        try {
            NotificationType announcementType = resolveAnnouncementType(request.type(), request.urgency());
            List<Role> targetRoles = resolveAnnouncementTargets(currentUser.getRole(), request.targetRoles());
            int recipientCount = notificationService.broadcastNotification(
                    request.title(),
                    request.message(),
                    announcementType,
                    NotificationCategory.SYSTEM,
                    targetRoles,
                    request.scheduleAt(),
                    request.expiresAt(),
                    request.recurrenceMinutes(),
                    currentUser.getId()
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
     * GET /api/notifications/announcements/my-history - Get announcements created by the current user.
     */
    @GetMapping("/announcements/my-history")
    @PreAuthorize("hasAnyRole('LECTURER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getMyAnnouncementHistory(@AuthenticationPrincipal User user) {
        List<NotificationService.AdminNotificationHistoryDTO> history =
                notificationService.getAnnouncementHistoryByCreator(user.getId());
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
                        request.enabled(),
                        request.scheduleAt(),
                        request.expiresAt(),
                        request.recurrenceMinutes()
                    );
            return ResponseEntity.ok(updated);
        } catch (EntityNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", ex.getMessage()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    /**
     * PUT /api/notifications/announcements/my-history/{campaignId} - Update a campaign created by the current user.
     */
    @PutMapping("/announcements/my-history/{campaignId}")
    @PreAuthorize("hasAnyRole('LECTURER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<?> updateMyAnnouncementHistory(
            @PathVariable String campaignId,
            @AuthenticationPrincipal User user,
            @RequestBody AdminNotificationUpdateRequest request
    ) {
        try {
            NotificationService.AdminNotificationHistoryDTO updated =
                    notificationService.updateAnnouncementCampaignForCreator(
                            user.getId(),
                            campaignId,
                            request.title(),
                            request.message(),
                            request.enabled(),
                            request.scheduleAt(),
                            request.expiresAt(),
                            request.recurrenceMinutes()
                    );
            return ResponseEntity.ok(updated);
        } catch (EntityNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", ex.getMessage()));
        } catch (SecurityException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", ex.getMessage()));
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

    /**
     * DELETE /api/notifications/announcements/my-history/{campaignId} - Delete a campaign created by the current user.
     */
    @DeleteMapping("/announcements/my-history/{campaignId}")
    @PreAuthorize("hasAnyRole('LECTURER', 'MANAGER', 'ADMIN')")
    public ResponseEntity<?> deleteMyAnnouncementHistory(
            @PathVariable String campaignId,
            @AuthenticationPrincipal User user
    ) {
        try {
            int deletedCount = notificationService.deleteAnnouncementCampaignForCreator(user.getId(), campaignId);
            return ResponseEntity.ok(Map.of(
                    "message", "Notification campaign deleted successfully",
                    "deletedCount", String.valueOf(deletedCount)
            ));
        } catch (EntityNotFoundException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", ex.getMessage()));
        } catch (SecurityException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", ex.getMessage()));
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

                List<Role> targetRoles,

                LocalDateTime scheduleAt,

                LocalDateTime expiresAt,

                Integer recurrenceMinutes
    ) {}

    public record AdminNotificationUpdateRequest(
            String title,
            String message,
            Boolean enabled,
            LocalDateTime scheduleAt,
            LocalDateTime expiresAt,
            Integer recurrenceMinutes
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

    private List<Role> resolveAnnouncementTargets(Role creatorRole, List<Role> requestedRoles) {
        List<Role> normalizedRoles = requestedRoles == null
                ? List.of()
                : requestedRoles.stream().distinct().toList();

        if (creatorRole == Role.ADMIN) {
            return normalizedRoles;
        }

        List<Role> allowedRoles = switch (creatorRole) {
            case MANAGER -> List.of(Role.STUDENT, Role.LECTURER, Role.TECHNICIAN);
            case LECTURER -> List.of(Role.STUDENT);
            default -> List.of();
        };

        if (allowedRoles.isEmpty()) {
            throw new IllegalArgumentException("You are not allowed to create announcements.");
        }
        if (normalizedRoles.isEmpty()) {
            throw new IllegalArgumentException("At least one target role is required.");
        }

        List<Role> invalidRoles = normalizedRoles.stream()
                .filter(role -> !allowedRoles.contains(role))
                .toList();
        if (!invalidRoles.isEmpty()) {
            throw new IllegalArgumentException("You are only allowed to target: " + allowedRoles.stream().map(Enum::name).collect(java.util.stream.Collectors.joining(", ")));
        }

        return normalizedRoles;
    }
}
