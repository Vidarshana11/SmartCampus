package com.smartcampus.api.notification;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);

    Page<Notification> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    List<Notification> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(Long userId);

    long countByUserIdAndIsReadFalse(Long userId);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = :readAt WHERE n.id = :id AND n.user.id = :userId")
    int markAsRead(@Param("id") Long id, @Param("userId") Long userId, @Param("readAt") LocalDateTime readAt);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = :readAt WHERE n.user.id = :userId AND n.isRead = false")
    int markAllAsRead(@Param("userId") Long userId, @Param("readAt") LocalDateTime readAt);

    @Query("SELECT n FROM Notification n WHERE n.user.id = :userId AND n.category IN :categories ORDER BY n.createdAt DESC")
    List<Notification> findByUserIdAndCategories(@Param("userId") Long userId, @Param("categories") List<NotificationCategory> categories);

    @Query("SELECT COUNT(n) FROM Notification n WHERE n.user.id = :userId AND n.isRead = false AND n.category IN :categories")
    long countUnreadByUserIdAndCategories(@Param("userId") Long userId, @Param("categories") List<NotificationCategory> categories);
}
