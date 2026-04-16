package com.smartcampus.api.user;

import com.smartcampus.api.booking.Booking;
import com.smartcampus.api.booking.BookingRepository;
import com.smartcampus.api.notification.Notification;
import com.smartcampus.api.notification.NotificationReadStatus;
import com.smartcampus.api.notification.NotificationReadStatusRepository;
import com.smartcampus.api.notification.NotificationRepository;
import com.smartcampus.api.security.EmailVerificationToken;
import com.smartcampus.api.security.EmailVerificationTokenRepository;
import com.smartcampus.api.security.PasswordResetToken;
import com.smartcampus.api.security.PasswordResetTokenRepository;
import com.smartcampus.api.ticket.Ticket;
import com.smartcampus.api.ticket.TicketComment;
import com.smartcampus.api.ticket.TicketCommentRepository;
import com.smartcampus.api.ticket.TicketRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

/**
 * Service for deleting users and all their related data
 * Used by both self-service deletion and admin deletion
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserDeletionService {

    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final TicketRepository ticketRepository;
    private final TicketCommentRepository ticketCommentRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationReadStatusRepository notificationReadStatusRepository;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;

    /**
     * Delete a user and all their related data
     * This method handles all foreign key constraints properly
     *
     * @param userId the ID of the user to delete
     * @param deleteProfilePicture whether to delete the profile picture file
     * @throws RuntimeException if deletion fails
     */
    @Transactional
    public void deleteUser(Long userId, boolean deleteProfilePicture) {
        log.info("Starting deletion process for user id: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        // Delete profile picture if requested
        if (deleteProfilePicture && user.getProfilePictureUrl() != null && !user.getProfilePictureUrl().isEmpty()) {
            try {
                deleteProfilePictureFile(user.getProfilePictureUrl());
                log.info("Deleted profile picture for user: {}", userId);
            } catch (IOException e) {
                log.warn("Could not delete profile picture for user {}: {}", userId, e.getMessage());
                // Continue with deletion even if file deletion fails
            }
        }

        // === Delete all related entities in proper order ===

        // 1. Delete notification read statuses for this user
        try {
            List<NotificationReadStatus> readStatuses = notificationReadStatusRepository.findByUser(user);
            if (readStatuses != null && !readStatuses.isEmpty()) {
                notificationReadStatusRepository.deleteAll(readStatuses);
                log.info("Deleted {} notification read statuses for user: {}", readStatuses.size(), userId);
            }
        } catch (Exception e) {
            log.error("Error deleting notification read statuses for user {}: {}", userId, e.getMessage());
            throw new RuntimeException("Failed to delete notification read statuses: " + e.getMessage(), e);
        }

        // 2. Handle tickets where user is assigned (set to null)
        try {
            List<Ticket> ticketsWhereAssigned = ticketRepository.findByAssignedTo(user);
            if (ticketsWhereAssigned != null) {
                for (Ticket ticket : ticketsWhereAssigned) {
                    ticket.setAssignedTo(null);
                    ticketRepository.save(ticket);
                }
                if (!ticketsWhereAssigned.isEmpty()) {
                    log.info("Cleared assignment from {} tickets for user: {}", ticketsWhereAssigned.size(), userId);
                }
            }
        } catch (Exception e) {
            log.error("Error clearing ticket assignments for user {}: {}", userId, e.getMessage());
            throw new RuntimeException("Failed to clear ticket assignments: " + e.getMessage(), e);
        }

        // 3. Delete ALL comments on tickets created by this user FIRST (before deleting tickets)
        try {
            List<Ticket> ticketsCreatedByUser = ticketRepository.findByCreatedBy(user);
            if (ticketsCreatedByUser != null && !ticketsCreatedByUser.isEmpty()) {
                for (Ticket ticket : ticketsCreatedByUser) {
                    // Delete all comments on this ticket (including comments by other users)
                    List<TicketComment> commentsOnTicket = ticketCommentRepository.findByTicketIdOrderByCreatedAtAsc(ticket.getId());
                    if (commentsOnTicket != null && !commentsOnTicket.isEmpty()) {
                        ticketCommentRepository.deleteAll(commentsOnTicket);
                        log.info("Deleted {} comments on ticket {} before deleting ticket", commentsOnTicket.size(), ticket.getId());
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error deleting comments on tickets for user {}: {}", userId, e.getMessage());
            throw new RuntimeException("Failed to delete comments on tickets: " + e.getMessage(), e);
        }

        // 4. Delete tickets created by this user (after comments are deleted)
        try {
            List<Ticket> ticketsCreatedByUser = ticketRepository.findByCreatedBy(user);
            if (ticketsCreatedByUser != null && !ticketsCreatedByUser.isEmpty()) {
                ticketRepository.deleteAll(ticketsCreatedByUser);
                log.info("Deleted {} tickets created by user: {}", ticketsCreatedByUser.size(), userId);
            }
        } catch (Exception e) {
            log.error("Error deleting tickets for user {}: {}", userId, e.getMessage());
            throw new RuntimeException("Failed to delete tickets: " + e.getMessage(), e);
        }

        // 5. Delete comments by this user on OTHER people's tickets (comments on tickets not deleted above)
        try {
            List<TicketComment> userComments = ticketCommentRepository.findByUser(user);
            if (userComments != null && !userComments.isEmpty()) {
                ticketCommentRepository.deleteAll(userComments);
                log.info("Deleted {} comments by user on other tickets: {}", userComments.size(), userId);
            }
        } catch (Exception e) {
            log.error("Error deleting comments for user {}: {}", userId, e.getMessage());
            throw new RuntimeException("Failed to delete comments: " + e.getMessage(), e);
        }

        // 6. Handle bookings - delete bookings by this user
        try {
            List<Booking> userBookings = bookingRepository.findByUser(user);
            if (userBookings != null && !userBookings.isEmpty()) {
                bookingRepository.deleteAll(userBookings);
                log.info("Deleted {} bookings by user: {}", userBookings.size(), userId);
            }
        } catch (Exception e) {
            log.error("Error deleting bookings for user {}: {}", userId, e.getMessage());
            throw new RuntimeException("Failed to delete bookings: " + e.getMessage(), e);
        }

        // 7. Handle bookings reviewed by this user (set to null)
        try {
            List<Booking> bookingsReviewed = bookingRepository.findByReviewedBy(user);
            if (bookingsReviewed != null) {
                for (Booking booking : bookingsReviewed) {
                    booking.setReviewedBy(null);
                    bookingRepository.save(booking);
                }
                if (!bookingsReviewed.isEmpty()) {
                    log.info("Cleared reviewer from {} bookings for user: {}", bookingsReviewed.size(), userId);
                }
            }
        } catch (Exception e) {
            log.error("Error clearing booking reviews for user {}: {}", userId, e.getMessage());
            throw new RuntimeException("Failed to clear booking reviews: " + e.getMessage(), e);
        }

        // 8. Handle notifications - delete read statuses first, then notifications
        try {
            // Get notifications targeted at this user
            List<Notification> userNotifications = notificationRepository.findByUser(user);
            if (userNotifications != null && !userNotifications.isEmpty()) {
                // Delete read statuses for these notifications first
                for (Notification notification : userNotifications) {
                    try {
                        List<NotificationReadStatus> statuses = notificationReadStatusRepository.findByNotification(notification);
                        if (statuses != null && !statuses.isEmpty()) {
                            notificationReadStatusRepository.deleteAll(statuses);
                        }
                    } catch (Exception ex) {
                        log.warn("Error deleting read statuses for notification {}: {}", notification.getId(), ex.getMessage());
                    }
                }
                // Then delete the notifications
                notificationRepository.deleteAll(userNotifications);
                log.info("Deleted {} notifications for user: {}", userNotifications.size(), userId);
            }
        } catch (Exception e) {
            log.error("Error deleting notifications for user {}: {}", userId, e.getMessage());
            throw new RuntimeException("Failed to delete notifications: " + e.getMessage(), e);
        }

        // 9. Delete email verification tokens
        try {
            List<EmailVerificationToken> emailTokens = emailVerificationTokenRepository.findByUser(user);
            if (emailTokens != null && !emailTokens.isEmpty()) {
                emailVerificationTokenRepository.deleteAll(emailTokens);
                log.info("Deleted {} email verification tokens for user: {}", emailTokens.size(), userId);
            }
        } catch (Exception e) {
            log.error("Error deleting email tokens for user {}: {}", userId, e.getMessage());
            throw new RuntimeException("Failed to delete email tokens: " + e.getMessage(), e);
        }

        // 10. Delete password reset tokens
        try {
            List<PasswordResetToken> resetTokens = passwordResetTokenRepository.findByUser(user);
            if (resetTokens != null && !resetTokens.isEmpty()) {
                passwordResetTokenRepository.deleteAll(resetTokens);
                log.info("Deleted {} password reset tokens for user: {}", resetTokens.size(), userId);
            }
        } catch (Exception e) {
            log.error("Error deleting reset tokens for user {}: {}", userId, e.getMessage());
            throw new RuntimeException("Failed to delete reset tokens: " + e.getMessage(), e);
        }

        // 11. Finally, delete the user
        userRepository.delete(user);
        log.info("Successfully deleted user account: {} ({})", user.getEmail(), userId);
    }

    private void deleteProfilePictureFile(String filePath) throws IOException {
        if (filePath != null && !filePath.isEmpty()) {
            Path path = Paths.get(filePath);
            Files.deleteIfExists(path);
        }
    }
}
