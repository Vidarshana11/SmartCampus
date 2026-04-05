package com.smartcampus.api.notification;

import com.smartcampus.api.user.Role;
import com.smartcampus.api.user.User;
import com.smartcampus.api.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    /**
     * Get notification by ID
     */
    public Notification getNotificationById(Long id) {
        return notificationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Notification not found with id: " + id));
    }

    /**
     * Delete a notification
     */
    @Transactional
    public void deleteNotification(Long notificationId, Long userId) {
        Notification notification = getNotificationById(notificationId);
        if (!notification.getUser().getId().equals(userId)) {
            throw new EntityNotFoundException("Notification does not belong to user");
        }
        notificationRepository.delete(notification);
    }

    /**
     * Get all notifications for a user
     */
    public List<NotificationDTO> getUserNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(NotificationDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Get paginated notifications for a user
     */
    @Transactional(readOnly = true)
    public Page<NotificationDTO> getUserNotificationsPaginated(Long userId, Pageable pageable) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                .map(NotificationDTO::fromEntity);
    }

    /**
     * Get unread notifications for a user
     */
    @Transactional(readOnly = true)
    public List<NotificationDTO> getUnreadNotifications(Long userId) {
        return notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId)
                .stream()
                .map(NotificationDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Count unread notifications for a user
     */
    @Transactional(readOnly = true)
    public long countUnreadNotifications(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    /**
     * Mark a notification as read
     */
    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        int updated = notificationRepository.markAsRead(notificationId, userId, LocalDateTime.now());
        if (updated == 0) {
            throw new EntityNotFoundException("Notification not found or does not belong to user");
        }
    }

    /**
     * Mark all notifications as read for a user
     */
    @Transactional
    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsRead(userId, LocalDateTime.now());
    }

    /**
     * Create a notification (called by other services)
     */
    @Transactional
    public Notification createNotification(Long userId, String title, String message,
                                           NotificationType type, NotificationCategory category,
                                           Long relatedEntityId, String relatedEntityType) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + userId));

        Notification notification = Notification.builder()
                .user(user)
                .title(title)
                .message(message)
                .type(type)
                .category(category)
                .isRead(false)
                .relatedEntityId(relatedEntityId)
                .relatedEntityType(relatedEntityType)
                .build();

        return notificationRepository.save(notification);
    }

    /**
     * Create a booking notification
     */
    @Transactional
    public void createBookingNotification(Long userId, String title, String message,
                                          NotificationType type, Long bookingId) {
        createNotification(userId, title, message, type, NotificationCategory.BOOKING,
                bookingId, "BOOKING");
    }

    /**
     * Create a ticket notification
     */
    @Transactional
    public void createTicketNotification(Long userId, String title, String message,
                                         NotificationType type, Long ticketId) {
        createNotification(userId, title, message, type, NotificationCategory.TICKET,
                ticketId, "TICKET");
    }

    /**
     * Create a system notification
     */
    @Transactional
    public void createSystemNotification(Long userId, String title, String message) {
        createNotification(userId, title, message, NotificationType.INFO,
                NotificationCategory.SYSTEM, null, null);
    }

    /**
     * Broadcast a notification to all users or selected roles.
     * If targetRoles is null/empty, sends to all users.
     *
     * @return number of notifications created
     */
    @Transactional
    public int broadcastNotification(String title, String message, NotificationType type,
                                     NotificationCategory category, List<Role> targetRoles) {
        List<User> recipients;
        if (targetRoles == null || targetRoles.isEmpty()) {
            recipients = userRepository.findAll();
        } else {
            recipients = userRepository.findByRoleIn(targetRoles);
        }

        if (recipients.isEmpty()) {
            return 0;
        }

        List<Notification> notifications = recipients.stream()
                .map(user -> Notification.builder()
                        .user(user)
                        .title(title)
                        .message(message)
                        .type(type)
                        .category(category)
                        .isRead(false)
                        .build())
                .toList();

        notificationRepository.saveAll(notifications);
        return notifications.size();
    }

    /**
     * Delete old read notifications (for cleanup)
     */
    @Transactional
    public void deleteOldReadNotifications(Long userId, int daysOld) {
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(daysOld);
        List<Notification> oldNotifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .filter(n -> n.isRead() && n.getReadAt() != null && n.getReadAt().isBefore(cutoffDate))
                .collect(Collectors.toList());
        notificationRepository.deleteAll(oldNotifications);
    }

    /**
     * Get notifications by category
     */
    @Transactional(readOnly = true)
    public List<NotificationDTO> getNotificationsByCategories(Long userId, List<NotificationCategory> categories) {
        return notificationRepository.findByUserIdAndCategories(userId, categories)
                .stream()
                .map(NotificationDTO::fromEntity)
                .collect(Collectors.toList());
    }
}
