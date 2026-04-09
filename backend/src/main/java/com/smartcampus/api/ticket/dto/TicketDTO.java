package com.smartcampus.api.ticket.dto;

import com.smartcampus.api.ticket.TicketCategory;
import com.smartcampus.api.ticket.TicketPriority;
import com.smartcampus.api.ticket.TicketStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketDTO {

    private Long id;
    private Long resourceId;
    private String resourceName;
    private TicketCategory category;
    private String description;
    private TicketPriority priority;
    private TicketStatus status;
    private String contactDetails;

    private Long assignedToId;
    private String assignedToName;
    private String rejectionReason;
    private String resolutionNotes;

    private Long createdById;
    private String createdByName;

    private List<String> attachmentUrls;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
