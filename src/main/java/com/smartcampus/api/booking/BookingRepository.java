package com.smartcampus.api.booking;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByUserId(Long userId);

    List<Booking> findByResourceId(Long resourceId);

    List<Booking> findByStatus(BookingStatus status);

    // Find overlapping bookings for conflict checking
    @Query("SELECT b FROM Booking b WHERE b.resource.id = :resourceId " +
           "AND b.status IN ('PENDING', 'APPROVED') " +
           "AND ((b.startTime < :endTime AND b.endTime > :startTime))")
    List<Booking> findOverlappingBookings(
            @Param("resourceId") Long resourceId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);

    // Check if any booking overlaps (excluding a specific booking - for updates)
    @Query("SELECT COUNT(b) > 0 FROM Booking b WHERE b.resource.id = :resourceId " +
           "AND b.status IN ('PENDING', 'APPROVED') " +
           "AND b.id != :excludeBookingId " +
           "AND ((b.startTime < :endTime AND b.endTime > :startTime))")
    boolean hasOverlappingBookingsExcluding(
            @Param("resourceId") Long resourceId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            @Param("excludeBookingId") Long excludeBookingId);

    // Check if any booking overlaps (for new bookings)
    @Query("SELECT COUNT(b) > 0 FROM Booking b WHERE b.resource.id = :resourceId " +
           "AND b.status IN ('PENDING', 'APPROVED') " +
           "AND ((b.startTime < :endTime AND b.endTime > :startTime))")
    boolean hasOverlappingBookings(
            @Param("resourceId") Long resourceId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);
}
