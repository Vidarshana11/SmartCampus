package com.smartcampus.api.notification;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class NotificationSchemaMigrationRunner implements ApplicationRunner {

    private static final Logger logger = LoggerFactory.getLogger(NotificationSchemaMigrationRunner.class);

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        ensureNotificationsUserIdIsNullable();
    }

    private void ensureNotificationsUserIdIsNullable() {
        try {
            Integer tableCount = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM information_schema.tables " +
                            "WHERE table_schema = DATABASE() AND table_name = 'notifications'",
                    Integer.class
            );
            if (tableCount == null || tableCount == 0) {
                return;
            }

            String isNullable = jdbcTemplate.query(
                    "SELECT IS_NULLABLE FROM information_schema.columns " +
                            "WHERE table_schema = DATABASE() " +
                            "AND table_name = 'notifications' " +
                            "AND column_name = 'user_id'",
                    rs -> rs.next() ? rs.getString(1) : null
            );

            if ("NO".equalsIgnoreCase(isNullable)) {
                jdbcTemplate.execute("ALTER TABLE notifications MODIFY COLUMN user_id BIGINT NULL");
                logger.info("Updated notifications.user_id to allow NULL for shared role-based notifications.");
            }
        } catch (Exception ex) {
            logger.warn("Could not verify/update notifications.user_id nullability: {}", ex.getMessage());
        }
    }
}
