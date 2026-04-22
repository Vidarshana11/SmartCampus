package com.smartcampus.api.booking;

import com.google.zxing.WriterException;
import com.smartcampus.api.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingExtendedController {

    private final BookingQRService bookingQRService;
    private final BookingAnalyticsService bookingAnalyticsService;
    private final BookingRepository bookingRepository;

    // GET QR code as PNG image for approved booking
    @GetMapping("/{id}/qr")
    public ResponseEntity<byte[]> getBookingQRCode(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) throws WriterException, IOException {

        byte[] qrImage = bookingQRService.generateQRCode(id);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"booking-" + id + "-qr.png\"")
                .contentType(MediaType.IMAGE_PNG)
                .body(qrImage);
    }

    // GET QR code as Base64 string (easier for React to display)
    @GetMapping("/{id}/qr/base64")
    public ResponseEntity<Map<String, String>> getBookingQRCodeBase64(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) throws WriterException, IOException {

        String base64 = bookingQRService.generateQRCodeBase64(id);
        return ResponseEntity.ok(Map.of(
                "bookingId", id.toString(),
                "qrCode", base64
        ));
    }

    // GET verify booking by ID (for QR scan verification screen)
    @GetMapping("/{id}/verify")
    public ResponseEntity<BookingVerificationDTO> verifyBooking(@PathVariable Long id) {
        return ResponseEntity.ok(bookingQRService.verifyBooking(id));
    }

    // GET analytics dashboard data (ADMIN only)
    @GetMapping("/analytics")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<BookingAnalyticsDTO> getAnalytics() {
        return ResponseEntity.ok(bookingAnalyticsService.getAnalytics());
    }

    // GET bookings filtered by status (ADMIN only)
    @GetMapping("/filter")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<?> getBookingsByStatus(
            @RequestParam(required = false) BookingStatus status) {

        if (status != null) {
            return ResponseEntity.ok(
                bookingRepository.findByStatus(status)
                    .stream()
                    .map(b -> Map.of(
                        "id", b.getId(),
                        "resource", b.getResource().getName(),
                        "user", b.getUser().getName(),
                        "status", b.getStatus(),
                        "startTime", b.getStartTime(),
                        "endTime", b.getEndTime()
                    ))
                    .toList()
            );
        }
        return ResponseEntity.ok(bookingRepository.findAll());
    }
}