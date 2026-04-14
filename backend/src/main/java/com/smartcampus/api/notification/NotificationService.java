package com.smartcampus.api.notification;

import com.smartcampus.api.user.Role;
import com.smartcampus.api.user.User;
import com.smartcampus.api.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationReadStatusRepository notificationReadStatusRepository;
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
        if (isSharedNotification(notification)) {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + userId));
            if (!isRoleTargeted(notification, user.getRole())) {
                throw new EntityNotFoundException("Notification does not belong to user");
            }

            boolean alreadyRead = notificationReadStatusRepository.existsByNotificationIdAndUserId(notificationId, userId);
            if (!alreadyRead) {
                NotificationReadStatus status = NotificationReadStatus.builder()
                        .notification(notification)
                        .user(user)
                        .readAt(LocalDateTime.now())
                        .build();
                notificationReadStatusRepository.save(status);
            }
            return;
        }
        if (!notification.getUser().getId().equals(userId)) {
            throw new EntityNotFoundException("Notification does not belong to user");
        }
        notificationRepository.delete(notification);
    }

    /**
     * Get all notifications for a user
     */
    public List<NotificationDTO> getUserNotifications(Long userId) {
        return getVisibleNotificationsForUser(userId, false);
    }

    /**
     * Get paginated notifications for a user
     */
    @Transactional(readOnly = true)
    public Page<NotificationDTO> getUserNotificationsPaginated(Long userId, Pageable pageable) {
        List<NotificationDTO> visible = getVisibleNotificationsForUser(userId, false);
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), visible.size());

        List<NotificationDTO> pageContent;
        if (start >= visible.size()) {
            pageContent = List.of();
        } else {
            pageContent = visible.subList(start, end);
        }

        return new PageImpl<>(pageContent, pageable, visible.size());
    }

    /**
     * Get unread notifications for a user
     */
    @Transactional(readOnly = true)
    public List<NotificationDTO> getUnreadNotifications(Long userId) {
        return getVisibleNotificationsForUser(userId, true);
    }

    /**
     * Count unread notifications for a user
     */
    @Transactional(readOnly = true)
    public long countUnreadNotifications(Long userId) {
        return getVisibleNotificationsForUser(userId, true).size();
    }

    /**
     * Mark a notification as read
     */
    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        Notification notification = getNotificationById(notificationId);

        if (isSharedNotification(notification)) {
            if (!notification.isEnabled()) {
                throw new EntityNotFoundException("Notification not available");
            }

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + userId));

            if (!isRoleTargeted(notification, user.getRole())) {
                throw new EntityNotFoundException("Notification does not belong to user");
            }

            boolean alreadyRead = notificationReadStatusRepository.existsByNotificationIdAndUserId(notificationId, userId);
            if (!alreadyRead) {
                NotificationReadStatus status = NotificationReadStatus.builder()
                        .notification(notification)
                        .user(user)
                        .readAt(LocalDateTime.now())
                        .build();
                notificationReadStatusRepository.save(status);
            }
            return;
        }

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

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + userId));
        List<Notification> roleBased = getRoleTargetedNotifications(user.getRole());
        if (roleBased.isEmpty()) {
            return;
        }

        Set<Long> roleBasedIds = roleBased.stream().map(Notification::getId).collect(Collectors.toSet());
        Set<Long> existingReadIds = notificationReadStatusRepository
                .findByUserIdAndNotificationIdIn(userId, roleBasedIds)
                .stream()
                .map(status -> status.getNotification().getId())
                .collect(Collectors.toSet());

        LocalDateTime now = LocalDateTime.now();
        List<NotificationReadStatus> newReadStatuses = roleBased.stream()
                .filter(notification -> !existingReadIds.contains(notification.getId()))
                .map(notification -> NotificationReadStatus.builder()
                        .notification(notification)
                        .user(user)
                        .readAt(now)
                        .build())
                .toList();

        if (!newReadStatuses.isEmpty()) {
            notificationReadStatusRepository.saveAll(newReadStatuses);
        }
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
                .isEnabled(true)
                .recipientCount(1)
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
        List<Role> rolesToTarget = resolveTargetRoles(targetRoles);
        List<User> recipients = userRepository.findByRoleIn(rolesToTarget);

        if (recipients.isEmpty()) {
            return 0;
        }

        String campaignId = UUID.randomUUID().toString();
        String serializedRoles = serializeRoles(rolesToTarget);

        Notification notification = Notification.builder()
                .user(null)
                .title(title)
                .message(message)
                .type(type)
                .category(category)
                .isRead(false)
                .isEnabled(true)
                .campaignId(campaignId)
                .targetRoles(serializedRoles)
                .recipientCount(recipients.size())
                .build();

        try {
            notificationRepository.save(notification);
        } catch (DataIntegrityViolationException ex) {
            // Compatibility fallback for legacy schemas where notifications.user_id is still NOT NULL.
            notification.setUser(resolveSharedNotificationOwner(recipients));
            notificationRepository.save(notification);
        }

        return recipients.size();
    }

    /**
     * Delete old read notifications (for cleanup)
     */
    @Transactional
    public void deleteOldReadNotifications(Long userId, int daysOld) {
        LocalDateTime cutoffDate = LocalDateTime.now().minusDays(daysOld);
        List<Notification> oldNotifications = notificationRepository.findByUserIdAndIsEnabledTrueOrderByCreatedAtDesc(userId)
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

    /**
     * Get admin notification history grouped by campaign.
     * A single campaign represents one announcement sent to multiple users.
     */
    @Transactional
    public List<AdminNotificationHistoryDTO> getAdminNotificationHistory() {
        consolidateLegacyBroadcastRows();
        List<Notification> notifications = notificationRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream()
                .filter(n -> n.getCategory() != NotificationCategory.ADMIN_ALERT
                        && n.getCategory() != NotificationCategory.TICKET
                        && n.getCategory() != NotificationCategory.BOOKING)
                .toList();

        Map<String, List<Notification>> groupedByCampaign = new LinkedHashMap<>();
        for (Notification notification : notifications) {
            String historyKey = notification.getCampaignId() != null
                    ? notification.getCampaignId()
                    : "legacy-" + notification.getId();
            groupedByCampaign
                    .computeIfAbsent(historyKey, ignored -> new ArrayList<>())
                    .add(notification);
        }

        return groupedByCampaign.entrySet()
                .stream()
                .map(entry -> toAdminHistoryDTO(entry.getKey(), entry.getValue()))
                .toList();
    }

    /**
     * Update title/message/enabled for all notifications in a campaign.
     * Updates propagate to all recipients including users who already marked as read.
     */
    @Transactional
    public AdminNotificationHistoryDTO updateNotificationCampaign(
            String campaignId,
            String title,
            String message,
            Boolean enabled
    ) {
        List<Notification> campaignNotifications;
        if (campaignId.startsWith("legacy-")) {
            long legacyId = parseLegacyId(campaignId);
            Notification legacyNotification = notificationRepository.findById(legacyId)
                    .orElseThrow(() -> new EntityNotFoundException("Notification campaign not found: " + campaignId));
            campaignNotifications = new ArrayList<>();
            campaignNotifications.add(legacyNotification);
        } else {
            campaignNotifications = notificationRepository.findByCampaignIdOrderByCreatedAtDesc(campaignId);
        }

        if (campaignNotifications.isEmpty()) {
            throw new EntityNotFoundException("Notification campaign not found: " + campaignId);
        }

        String normalizedTitle = title != null ? title.trim() : null;
        String normalizedMessage = message != null ? message.trim() : null;

        if (normalizedTitle != null && normalizedTitle.isBlank()) {
            throw new IllegalArgumentException("Title cannot be blank");
        }
        if (normalizedMessage != null && normalizedMessage.isBlank()) {
            throw new IllegalArgumentException("Message cannot be blank");
        }
        if (normalizedTitle == null && normalizedMessage == null && enabled == null) {
            throw new IllegalArgumentException("No updates provided");
        }

        for (Notification notification : campaignNotifications) {
            if (normalizedTitle != null) {
                notification.setTitle(normalizedTitle);
            }
            if (normalizedMessage != null) {
                notification.setMessage(normalizedMessage);
            }
            if (enabled != null) {
                notification.setEnabled(enabled);
            }
        }

        notificationRepository.saveAll(campaignNotifications);
        return toAdminHistoryDTO(campaignId, campaignNotifications);
    }

    /**
     * Delete all notifications in a campaign.
     * Legacy campaigns delete only the single notification row.
     */
    @Transactional
    public int deleteNotificationCampaign(String campaignId) {
        List<Notification> campaignNotifications;
        if (campaignId.startsWith("legacy-")) {
            long legacyId = parseLegacyId(campaignId);
            Notification legacyNotification = notificationRepository.findById(legacyId)
                    .orElseThrow(() -> new EntityNotFoundException("Notification campaign not found: " + campaignId));
            campaignNotifications = new ArrayList<>();
            campaignNotifications.add(legacyNotification);
        } else {
            campaignNotifications = notificationRepository.findByCampaignIdOrderByCreatedAtDesc(campaignId);
        }

        if (campaignNotifications.isEmpty()) {
            throw new EntityNotFoundException("Notification campaign not found: " + campaignId);
        }

        List<Long> notificationIds = campaignNotifications.stream().map(Notification::getId).toList();
        notificationReadStatusRepository.deleteByNotificationIdIn(notificationIds);
        int deletedCount = campaignNotifications.size();
        notificationRepository.deleteAll(campaignNotifications);
        return deletedCount;
    }

    private AdminNotificationHistoryDTO toAdminHistoryDTO(
            String campaignId,
            List<Notification> campaignNotifications
    ) {
        Notification latest = campaignNotifications.get(0);
        long readCount;
        int recipientCount;
        if (isSharedNotification(latest)) {
            readCount = notificationReadStatusRepository.countByNotificationId(latest.getId());
            recipientCount = latest.getRecipientCount() != null
                    ? latest.getRecipientCount()
                    : countRecipientsByRoles(parseTargetRoles(latest.getTargetRoles()));
        } else {
            readCount = campaignNotifications.stream().filter(Notification::isRead).count();
            recipientCount = campaignNotifications.size();
        }

        return new AdminNotificationHistoryDTO(
                campaignId,
                latest.getTitle(),
                latest.getMessage(),
                latest.getType(),
                latest.getCategory(),
                latest.isEnabled(),
                latest.getCreatedAt(),
                latest.getUpdatedAt(),
                recipientCount,
                readCount
        );
    }

    private void consolidateLegacyBroadcastRows() {
        List<Notification> allNotifications = notificationRepository.findAll(Sort.by(Sort.Direction.ASC, "createdAt"));
        if (allNotifications.isEmpty()) {
            return;
        }

        Map<String, List<Notification>> campaignGroups = allNotifications.stream()
                .filter(notification -> notification.getUser() != null)
                .filter(notification -> !isSharedNotification(notification))
                .filter(notification -> notification.getCampaignId() != null && !notification.getCampaignId().isBlank())
                .collect(Collectors.groupingBy(
                        Notification::getCampaignId,
                        LinkedHashMap::new,
                        Collectors.toList()
                ));

        for (Map.Entry<String, List<Notification>> entry : campaignGroups.entrySet()) {
            consolidateCampaignGroup(entry.getKey(), entry.getValue());
        }

        Map<LegacyNotificationGroupKey, List<Notification>> legacyGroups = allNotifications.stream()
                .filter(notification -> notification.getUser() != null)
                .filter(notification -> !isSharedNotification(notification))
                .filter(notification -> notification.getCampaignId() == null || notification.getCampaignId().isBlank())
                .filter(notification -> notification.getCategory() == NotificationCategory.SYSTEM)
                .filter(notification -> notification.getRelatedEntityId() == null)
                .filter(notification -> notification.getRelatedEntityType() == null)
                .collect(Collectors.groupingBy(
                        this::toLegacyGroupKey,
                        LinkedHashMap::new,
                        Collectors.toList()
                ));

        for (Map.Entry<LegacyNotificationGroupKey, List<Notification>> entry : legacyGroups.entrySet()) {
            List<Notification> group = entry.getValue();
            if (group.size() < 2) {
                continue;
            }
            long distinctUsers = group.stream()
                    .map(Notification::getUser)
                    .filter(user -> user != null && user.getId() != null)
                    .map(User::getId)
                    .distinct()
                    .count();
            if (distinctUsers < 2) {
                continue;
            }
            consolidateCampaignGroup(UUID.randomUUID().toString(), group);
        }
    }

    private void consolidateCampaignGroup(String campaignId, List<Notification> personalRows) {
        if (personalRows == null || personalRows.isEmpty()) {
            return;
        }

        List<Notification> sourceRows = personalRows.stream()
                .filter(notification -> notification.getUser() != null)
                .filter(notification -> !isSharedNotification(notification))
                .toList();
        if (sourceRows.isEmpty()) {
            return;
        }

        Notification template = sourceRows.stream()
                .max(Comparator.comparing(Notification::getCreatedAt))
                .orElse(sourceRows.get(0));
        LocalDateTime earliestCreatedAt = sourceRows.stream()
                .map(Notification::getCreatedAt)
                .filter(createdAt -> createdAt != null)
                .min(LocalDateTime::compareTo)
                .orElse(LocalDateTime.now());

        Map<Long, User> recipientsById = sourceRows.stream()
                .map(Notification::getUser)
                .filter(user -> user != null && user.getId() != null)
                .collect(Collectors.toMap(
                        User::getId,
                        user -> user,
                        (left, right) -> left,
                        LinkedHashMap::new
                ));
        if (recipientsById.isEmpty()) {
            return;
        }

        List<Role> roles = recipientsById.values().stream()
                .map(User::getRole)
                .filter(role -> role != null)
                .distinct()
                .toList();

        Notification sharedNotification = null;
        if (campaignId != null && !campaignId.isBlank()) {
            sharedNotification = notificationRepository.findByCampaignIdOrderByCreatedAtDesc(campaignId)
                    .stream()
                    .filter(notification -> notification.getUser() == null)
                    .findFirst()
                    .orElse(null);
        }

        if (sharedNotification == null) {
            sharedNotification = Notification.builder()
                    .user(null)
                    .title(template.getTitle())
                    .message(template.getMessage())
                    .type(template.getType())
                    .category(template.getCategory())
                    .isRead(false)
                    .isEnabled(template.isEnabled())
                    .campaignId(campaignId)
                    .targetRoles(serializeRoles(roles))
                    .recipientCount(recipientsById.size())
                    .relatedEntityId(template.getRelatedEntityId())
                    .relatedEntityType(template.getRelatedEntityType())
                    .createdAt(earliestCreatedAt)
                    .updatedAt(template.getUpdatedAt())
                    .build();
        } else {
            Set<Role> mergedRoles = new HashSet<>(parseTargetRoles(sharedNotification.getTargetRoles()));
            mergedRoles.addAll(roles);
            sharedNotification.setTargetRoles(serializeRoles(mergedRoles));
            int existingRecipientCount = sharedNotification.getRecipientCount() != null
                    ? sharedNotification.getRecipientCount()
                    : 0;
            sharedNotification.setRecipientCount(Math.max(existingRecipientCount, recipientsById.size()));
        }

        sharedNotification = notificationRepository.save(sharedNotification);
        final Notification persistedSharedNotification = sharedNotification;

        Set<Long> existingReadUsers = notificationReadStatusRepository.findByNotificationId(persistedSharedNotification.getId())
                .stream()
                .map(NotificationReadStatus::getUser)
                .filter(user -> user != null && user.getId() != null)
                .map(User::getId)
                .collect(Collectors.toSet());

        Map<Long, LocalDateTime> readAtByUser = new LinkedHashMap<>();
        for (Notification notification : sourceRows) {
            User user = notification.getUser();
            if (user == null || user.getId() == null || !notification.isRead()) {
                continue;
            }
            LocalDateTime readAt = notification.getReadAt() != null
                    ? notification.getReadAt()
                    : notification.getUpdatedAt() != null
                    ? notification.getUpdatedAt()
                    : notification.getCreatedAt();
            readAtByUser.merge(
                    user.getId(),
                    readAt,
                    (existing, candidate) -> {
                        if (candidate == null) {
                            return existing;
                        }
                        if (existing == null) {
                            return candidate;
                        }
                        return existing.isAfter(candidate) ? existing : candidate;
                    }
            );
        }

        List<NotificationReadStatus> newReadStatuses = readAtByUser.entrySet()
                .stream()
                .filter(entry -> !existingReadUsers.contains(entry.getKey()))
                .map(entry -> NotificationReadStatus.builder()
                        .notification(persistedSharedNotification)
                        .user(recipientsById.get(entry.getKey()))
                        .readAt(entry.getValue() != null ? entry.getValue() : LocalDateTime.now())
                        .build())
                .toList();
        if (!newReadStatuses.isEmpty()) {
            notificationReadStatusRepository.saveAll(newReadStatuses);
        }

        List<Long> sourceIds = sourceRows.stream().map(Notification::getId).toList();
        notificationReadStatusRepository.deleteByNotificationIdIn(sourceIds);
        notificationRepository.deleteAll(sourceRows);
    }

    private LegacyNotificationGroupKey toLegacyGroupKey(Notification notification) {
        LocalDateTime createdAtBucket = notification.getCreatedAt() != null
                ? notification.getCreatedAt().withNano(0)
                : null;
        return new LegacyNotificationGroupKey(
                notification.getTitle(),
                notification.getMessage(),
                notification.getType(),
                notification.getCategory(),
                createdAtBucket
        );
    }

    private List<NotificationDTO> getVisibleNotificationsForUser(Long userId, boolean unreadOnly) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found with id: " + userId));

        List<Notification> personalNotifications = notificationRepository
                .findByUserIdAndIsEnabledTrueOrderByCreatedAtDesc(userId);
        List<NotificationDTO> personalDtos = personalNotifications.stream()
                .filter(notification -> !isSharedNotification(notification))
                .map(NotificationDTO::fromEntity)
                .filter(dto -> !unreadOnly || !dto.isRead())
                .toList();

        List<Notification> roleBasedNotifications = getRoleTargetedNotifications(user.getRole());
        List<Long> roleBasedIds = roleBasedNotifications.stream().map(Notification::getId).toList();
        if (roleBasedIds.isEmpty()) {
            return personalDtos;
        }

        List<NotificationReadStatus> readStatuses = notificationReadStatusRepository
                .findByUserIdAndNotificationIdIn(userId, roleBasedIds);
        Set<Long> readRoleBasedIds = new HashSet<>(
                readStatuses.stream()
                        .map(status -> status.getNotification().getId())
                        .toList()
        );
        Map<Long, NotificationReadStatus> readStatusByNotificationId = readStatuses
                .stream()
                .collect(Collectors.toMap(
                        status -> status.getNotification().getId(),
                        status -> status
                ));

        List<NotificationDTO> roleBasedDtos = roleBasedNotifications.stream()
                .map(notification -> {
                    boolean isRead = readRoleBasedIds.contains(notification.getId());
                    NotificationReadStatus readStatus = readStatusByNotificationId.get(notification.getId());
                    return new NotificationDTO(
                            notification.getId(),
                            notification.getTitle(),
                            notification.getMessage(),
                            notification.getType(),
                            notification.getCategory(),
                            isRead,
                            notification.isEnabled(),
                            notification.getCampaignId(),
                            notification.getRelatedEntityId(),
                            notification.getRelatedEntityType(),
                            notification.getCreatedAt(),
                            notification.getUpdatedAt(),
                            readStatus != null ? readStatus.getReadAt() : null
                    );
                })
                .filter(dto -> !unreadOnly || !dto.isRead())
                .toList();

        List<NotificationDTO> merged = new ArrayList<>();
        merged.addAll(personalDtos);
        merged.addAll(roleBasedDtos);
        merged.sort(Comparator.comparing(NotificationDTO::createdAt).reversed());
        return merged;
    }

    private List<Notification> getRoleTargetedNotifications(Role role) {
        return notificationRepository.findRoleTargetedEnabledNotificationsOrderByCreatedAtDesc()
                .stream()
                .filter(notification -> isRoleTargeted(notification, role))
                .toList();
    }

    private boolean isSharedNotification(Notification notification) {
        return notification.getTargetRoles() != null && !notification.getTargetRoles().isBlank();
    }

    private User resolveSharedNotificationOwner(List<User> recipients) {
        List<User> admins = userRepository.findByRoleIn(List.of(Role.ADMIN));
        if (!admins.isEmpty()) {
            return admins.get(0);
        }
        return recipients.get(0);
    }

    private boolean isRoleTargeted(Notification notification, Role role) {
        List<Role> targetRoles = parseTargetRoles(notification.getTargetRoles());
        return targetRoles.contains(role);
    }

    private List<Role> resolveTargetRoles(List<Role> targetRoles) {
        if (targetRoles == null || targetRoles.isEmpty()) {
            return Arrays.stream(Role.values()).toList();
        }
        return targetRoles.stream().distinct().toList();
    }

    private List<Role> parseTargetRoles(String targetRolesCsv) {
        if (targetRolesCsv == null || targetRolesCsv.isBlank()) {
            return Arrays.stream(Role.values()).toList();
        }
        return Arrays.stream(targetRolesCsv.split(","))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .map(value -> {
                    try {
                        return Role.valueOf(value);
                    } catch (IllegalArgumentException ignored) {
                        return null;
                    }
                })
                .filter(role -> role != null)
                .toList();
    }

    private String serializeRoles(Collection<Role> roles) {
        return roles.stream()
                .filter(Objects::nonNull)
                .distinct()
                .sorted(Comparator.comparing(Enum::name))
                .map(Role::name)
                .collect(Collectors.joining(","));
    }

    private int countRecipientsByRoles(List<Role> roles) {
        if (roles.isEmpty()) {
            return 0;
        }
        return userRepository.findByRoleIn(roles).size();
    }

    private long parseLegacyId(String campaignId) {
        try {
            return Long.parseLong(campaignId.substring("legacy-".length()));
        } catch (Exception ex) {
            throw new EntityNotFoundException("Notification campaign not found: " + campaignId);
        }
    }

    public record AdminNotificationHistoryDTO(
            String campaignId,
            String title,
            String message,
            NotificationType type,
            NotificationCategory category,
            boolean isEnabled,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            int recipientCount,
            long readCount
    ) {}

    private record LegacyNotificationGroupKey(
            String title,
            String message,
            NotificationType type,
            NotificationCategory category,
            LocalDateTime createdAtSecond
    ) {}
}
