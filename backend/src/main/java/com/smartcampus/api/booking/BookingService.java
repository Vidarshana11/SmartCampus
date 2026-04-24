package com.smartcampus.api.booking;

import java.time.LocalDateTime;
import java.util.List;
import java.util.function.Supplier;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.smartcampus.api.notification.NotificationService;
import com.smartcampus.api.notification.NotificationType;
import com.smartcampus.api.resource.Resource;
import com.smartcampus.api.resource.ResourceRepository;
import com.smartcampus.api.user.User;
import com.smartcampus.api.user.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final ResourceRepository resourceRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<BookingDTO> getAllBookings() {
        return bookingRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BookingDTO> getBookingsByUser(Long userId) {
        return bookingRepository.findByUserId(userId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BookingDTO> getBookingsByResource(Long resourceId) {
        return bookingRepository.findByResourceId(resourceId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BookingDTO> getPendingBookings() {
        return bookingRepository.findByStatus(BookingStatus.PENDING).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BookingDTO getBookingById(Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found with id: " + id));
        return convertToDTO(booking);
    }

    @Transactional
    public BookingDTO createBooking(Long userId, BookingDTO dto) {
        // Validate time range
        if (dto.getEndTime().isBefore(dto.getStartTime()) ||
            dto.getEndTime().isEqual(dto.getStartTime())) {
            throw new RuntimeException("End time must be after start time");
        }

        // Check if booking is in the past
        if (dto.getStartTime().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Cannot create booking in the past");
        }

        // Get resource and user
        Resource resource = resourceRepository.findById(dto.getResourceId())
                .orElseThrow(() -> new RuntimeException("Resource not found"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check for scheduling conflicts
        boolean hasConflict = bookingRepository.hasOverlappingBookings(
                dto.getResourceId(), dto.getStartTime(), dto.getEndTime());

        if (hasConflict) {
            throw new RuntimeException("This time slot is already booked. Please choose another time.");
        }

        // Create booking
        Booking booking = Booking.builder()
                .resource(resource)
                .user(user)
                .startTime(dto.getStartTime())
                .endTime(dto.getEndTime())
                .purpose(dto.getPurpose())
                .expectedAttendees(dto.getExpectedAttendees())
                .status(BookingStatus.PENDING)
                .build();

        Booking savedBooking = bookingRepository.save(booking);
        return convertToDTO(savedBooking);
    }

    @Transactional
    public BookingDTO approveBooking(Long bookingId, Long adminId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new RuntimeException("Only pending bookings can be approved");
        }

        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        booking.setStatus(BookingStatus.APPROVED);
        booking.setReviewedBy(admin);
        booking.setReviewedAt(LocalDateTime.now());

        Booking savedBooking = bookingRepository.save(booking);

        notificationService.createBookingNotification(
            savedBooking.getUser().getId(),
            "Booking approved",
            "Your booking for " + savedBooking.getResource().getName()
                + " from " + savedBooking.getStartTime() + " to " + savedBooking.getEndTime()
                + " has been approved.",
            NotificationType.SUCCESS,
            savedBooking.getId()
        );

        return convertToDTO(savedBooking);
    }

    @Transactional
    public BookingDTO rejectBooking(Long bookingId, Long adminId, String reason) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new RuntimeException("Only pending bookings can be rejected");
        }

        if (reason == null || reason.trim().isEmpty()) {
            throw new RuntimeException("Rejection reason is required");
        }

        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        booking.setStatus(BookingStatus.REJECTED);
        booking.setRejectionReason(reason);
        booking.setReviewedBy(admin);
        booking.setReviewedAt(LocalDateTime.now());

        Booking savedBooking = bookingRepository.save(booking);

        notificationService.createBookingNotification(
            savedBooking.getUser().getId(),
            "Booking rejected",
            "Your booking for " + savedBooking.getResource().getName()
                + " from " + savedBooking.getStartTime() + " to " + savedBooking.getEndTime()
                + " was rejected. Reason: " + reason,
            NotificationType.ERROR,
            savedBooking.getId()
        );

        return convertToDTO(savedBooking);
    }

    @Transactional
    public BookingDTO cancelBooking(Long bookingId, Long userId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        // Only the booking owner or admin can cancel
        if (!booking.getUser().getId().equals(userId)) {
            throw new RuntimeException("You can only cancel your own bookings");
        }

        if (booking.getStatus() == BookingStatus.CANCELLED ||
            booking.getStatus() == BookingStatus.REJECTED) {
            throw new RuntimeException("Booking is already cancelled or rejected");
        }

        // Check if booking has already passed
        if (booking.getStartTime().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Cannot cancel a booking that has already started");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        Booking savedBooking = bookingRepository.save(booking);

        notificationService.createBookingNotification(
            savedBooking.getUser().getId(),
            "Booking cancelled",
            "Your booking for " + savedBooking.getResource().getName()
                + " from " + savedBooking.getStartTime() + " to " + savedBooking.getEndTime()
                + " has been cancelled.",
            NotificationType.WARNING,
            savedBooking.getId()
        );

        return convertToDTO(savedBooking);
    }

    @Transactional
    public void deleteBooking(Long bookingId) {
        if (!bookingRepository.existsById(bookingId)) {
            throw new RuntimeException("Booking not found");
        }
        bookingRepository.deleteById(bookingId);
    }

    // Helper method to convert Entity to DTO
    private BookingDTO convertToDTO(Booking booking) {
        Long resourceId = safeGet(() -> booking.getResource().getId());
        String resourceName = safeGet(() -> booking.getResource().getName());
        Long userId = safeGet(() -> booking.getUser().getId());
        String userName = safeGet(() -> booking.getUser().getName());

        return BookingDTO.builder()
                .id(booking.getId())
            .resourceId(resourceId)
            .resourceName(resourceName != null ? resourceName : "Unknown Resource")
            .userId(userId)
            .userName(userName != null ? userName : "Unknown User")
                .startTime(booking.getStartTime())
                .endTime(booking.getEndTime())
                .purpose(booking.getPurpose())
                .expectedAttendees(booking.getExpectedAttendees())
                .status(booking.getStatus())
                .rejectionReason(booking.getRejectionReason())
                .reviewedById(booking.getReviewedBy() != null ? booking.getReviewedBy().getId() : null)
                .reviewedByName(booking.getReviewedBy() != null ? booking.getReviewedBy().getName() : null)
                .reviewedAt(booking.getReviewedAt())
                .createdAt(booking.getCreatedAt())
                .build();
    }

    private <T> T safeGet(Supplier<T> resolver) {
        try {
            return resolver.get();
        } catch (RuntimeException ex) {
            return null;
        }
    }
}
