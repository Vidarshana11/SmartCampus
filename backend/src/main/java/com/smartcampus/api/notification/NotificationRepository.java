package com.smartcampus.api.notification;

import com.smartcampus.api.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUserIdAndIsEnabledTrueOrderByCreatedAtDesc(Long userId);

    // For user account deletion - find by User entity
    List<Notification> findByUser(User user);

    Page<Notification> findByUserIdAndIsEnabledTrueOrderByCreatedAtDesc(Long userId, Pageable pageable);

    List<Notification> findByUserIdAndIsReadFalseAndIsEnabledTrueOrderByCreatedAtDesc(Long userId);

    long countByUserIdAndIsReadFalseAndIsEnabledTrue(Long userId);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = :readAt WHERE n.id = :id AND n.user.id = :userId")
    int markAsRead(@Param("id") Long id, @Param("userId") Long userId, @Param("readAt") LocalDateTime readAt);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = :readAt WHERE n.user.id = :userId AND n.isRead = false")
    int markAllAsRead(@Param("userId") Long userId, @Param("readAt") LocalDateTime readAt);

    @Query("SELECT n FROM Notification n WHERE n.user.id = :userId AND n.isEnabled = true AND n.category IN :categories ORDER BY n.createdAt DESC")
    List<Notification> findByUserIdAndCategories(@Param("userId") Long userId, @Param("categories") List<NotificationCategory> categories);

    @Query("SELECT COUNT(n) FROM Notification n WHERE n.user.id = :userId AND n.isRead = false AND n.isEnabled = true AND n.category IN :categories")
    long countUnreadByUserIdAndCategories(@Param("userId") Long userId, @Param("categories") List<NotificationCategory> categories);

    List<Notification> findByCampaignIdOrderByCreatedAtDesc(String campaignId);

    List<Notification> findByUserIsNullAndIsEnabledTrueOrderByCreatedAtDesc();

    @Query("SELECT n FROM Notification n " +
            "WHERE n.isEnabled = true AND n.targetRoles IS NOT NULL AND n.targetRoles <> '' " +
            "ORDER BY n.createdAt DESC")
    List<Notification> findRoleTargetedEnabledNotificationsOrderByCreatedAtDesc();

    List<Notification> findByIdIn(Collection<Long> ids);
}
