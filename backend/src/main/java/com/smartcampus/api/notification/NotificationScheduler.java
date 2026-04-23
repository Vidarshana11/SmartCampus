package com.smartcampus.api.notification;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationScheduler {

    private final NotificationService notificationService;

    @Scheduled(fixedDelayString = "${app.notifications.scheduler-delay-ms:60000}")
    public void processScheduledNotifications() {
        int activated = notificationService.activateScheduledAnnouncements();
        int expired = notificationService.expireAnnouncements();
        int reminders = notificationService.processRecurringReminders();

        if (activated > 0 || expired > 0 || reminders > 0) {
            log.info("Notification scheduler run: activated={}, expired={}, reminders={}", activated, expired, reminders);
        }
    }
}
