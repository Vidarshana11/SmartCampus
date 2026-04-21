package com.smartcampus.api.booking;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingVerificationDTO {
    private Long bookingId;
    private String resourceName;
    private String userName;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private BookingStatus status;
    private boolean isValid;
}