package com.smartcampus.api.notification;

import java.time.LocalDateTime;

public record NotificationDTO(
        Long id,
        String title,
        String message,
        NotificationType type,
        NotificationCategory category,
        boolean isRead,
        boolean isEnabled,
        String campaignId,
    LocalDateTime scheduledAt,
    LocalDateTime expiresAt,
    Integer recurrenceMinutes,
    LocalDateTime nextReminderAt,
        Long relatedEntityId,
        String relatedEntityType,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        LocalDateTime readAt
) {
    public static NotificationDTO fromEntity(Notification notification) {
        return new NotificationDTO(
                notification.getId(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getType(),
                notification.getCategory(),
                notification.isRead(),
                notification.isEnabled(),
                notification.getCampaignId(),
                notification.getScheduledAt(),
                notification.getExpiresAt(),
                notification.getRecurrenceMinutes(),
                notification.getNextReminderAt(),
                notification.getRelatedEntityId(),
                notification.getRelatedEntityType(),
                notification.getCreatedAt(),
                notification.getUpdatedAt(),
                notification.getReadAt()
        );
    }
}
