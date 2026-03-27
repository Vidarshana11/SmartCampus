package com.smartcampus.api.notification;

import java.time.LocalDateTime;

public record NotificationDTO(
        Long id,
        String title,
        String message,
        NotificationType type,
        NotificationCategory category,
        boolean isRead,
        Long relatedEntityId,
        String relatedEntityType,
        LocalDateTime createdAt,
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
                notification.getRelatedEntityId(),
                notification.getRelatedEntityType(),
                notification.getCreatedAt(),
                notification.getReadAt()
        );
    }
}
