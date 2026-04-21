package com.smartcampus.api.booking;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingAnalyticsDTO {
    private long totalBookings;
    private long pendingBookings;
    private long approvedBookings;
    private long rejectedBookings;
    private long cancelledBookings;
    private List<ResourceBookingCount> topResources;
    private Map<Integer, Long> bookingsByHour;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResourceBookingCount {
        private Long resourceId;
        private String resourceName;
        private long bookingCount;
    }
}