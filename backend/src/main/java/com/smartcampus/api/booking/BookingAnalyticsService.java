package com.smartcampus.api.booking;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookingAnalyticsService {

    private final BookingRepository bookingRepository;

    @Transactional(readOnly = true)
    public BookingAnalyticsDTO getAnalytics() {
        List<Booking> allBookings = bookingRepository.findAll();
        List<Booking> validResourceBookings = allBookings.stream()
                .filter(this::hasValidResource)
                .toList();

        // Count by status
        Map<BookingStatus, Long> statusCounts = allBookings.stream()
                .collect(Collectors.groupingBy(Booking::getStatus, Collectors.counting()));

        // Top resources by booking count
        List<BookingAnalyticsDTO.ResourceBookingCount> topResources = validResourceBookings.stream()
                .collect(Collectors.groupingBy(
                        b -> b.getResource().getId(),
                        Collectors.counting()
                ))
                .entrySet().stream()
                .sorted(Map.Entry.<Long, Long>comparingByValue().reversed())
                .limit(5)
                .map(e -> {
                    Booking sample = validResourceBookings.stream()
                            .filter(b -> b.getResource().getId().equals(e.getKey()))
                            .findFirst().orElseThrow();
                    return BookingAnalyticsDTO.ResourceBookingCount.builder()
                            .resourceId(e.getKey())
                            .resourceName(sample.getResource().getName())
                            .bookingCount(e.getValue())
                            .build();
                })
                .collect(Collectors.toList());

        // Peak booking hours
        Map<Integer, Long> bookingsByHour = allBookings.stream()
                .filter(b -> b.getStartTime() != null)
                .collect(Collectors.groupingBy(
                        b -> b.getStartTime().getHour(),
                        Collectors.counting()
                ));

        return BookingAnalyticsDTO.builder()
                .totalBookings(allBookings.size())
                .pendingBookings(statusCounts.getOrDefault(BookingStatus.PENDING, 0L))
                .approvedBookings(statusCounts.getOrDefault(BookingStatus.APPROVED, 0L))
                .rejectedBookings(statusCounts.getOrDefault(BookingStatus.REJECTED, 0L))
                .cancelledBookings(statusCounts.getOrDefault(BookingStatus.CANCELLED, 0L))
                .topResources(topResources)
                .bookingsByHour(bookingsByHour)
                .build();
    }

        private boolean hasValidResource(Booking booking) {
                try {
                        return booking.getResource() != null && booking.getResource().getId() != null;
                } catch (RuntimeException ex) {
                        log.warn("Skipping booking {} in analytics due to missing resource relation", booking.getId());
                        return false;
                }
        }
}