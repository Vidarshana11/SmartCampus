package com.smartcampus.api.notification;

import com.smartcampus.api.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface NotificationReadStatusRepository extends JpaRepository<NotificationReadStatus, Long> {

    boolean existsByNotificationIdAndUserId(Long notificationId, Long userId);

    List<NotificationReadStatus> findByUserIdAndNotificationIdIn(Long userId, Collection<Long> notificationIds);

    List<NotificationReadStatus> findByNotificationId(Long notificationId);

    long countByNotificationId(Long notificationId);

    void deleteByNotificationIdIn(Collection<Long> notificationIds);

    // For user account deletion - find by User entity
    List<NotificationReadStatus> findByUser(User user);

    List<NotificationReadStatus> findByNotification(Notification notification);
}
