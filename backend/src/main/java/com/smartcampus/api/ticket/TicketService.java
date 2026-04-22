package com.smartcampus.api.ticket;

import com.smartcampus.api.notification.NotificationCategory;
import com.smartcampus.api.notification.NotificationService;
import com.smartcampus.api.notification.NotificationType;
import com.smartcampus.api.resource.Resource;
import com.smartcampus.api.resource.ResourceRepository;
import java.util.Objects;
import com.smartcampus.api.ticket.dto.TicketCreateRequest;
import com.smartcampus.api.ticket.dto.TicketDTO;
import com.smartcampus.api.user.Role;
import com.smartcampus.api.user.User;
import com.smartcampus.api.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;
    private final TicketAttachmentRepository attachmentRepository;
    private final ResourceRepository resourceRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Value("${upload.dir:uploads/}")
    private String uploadDir;

    // Valid status transitions map
    private static final Map<TicketStatus, Set<TicketStatus>> VALID_TRANSITIONS = Map.of(
            TicketStatus.OPEN, Set.of(TicketStatus.IN_PROGRESS, TicketStatus.REJECTED),
            TicketStatus.IN_PROGRESS, Set.of(TicketStatus.RESOLVED, TicketStatus.REJECTED),
            TicketStatus.RESOLVED, Set.of(TicketStatus.CLOSED, TicketStatus.REJECTED),
            TicketStatus.CLOSED, Set.of(),
            TicketStatus.REJECTED, Set.of());

    @Transactional
    public TicketDTO createTicket(Long userId, TicketCreateRequest request, List<MultipartFile> files) {
        // Validate max 3 files
        if (files != null && files.size() > 3) {
            throw new RuntimeException("Maximum 3 images allowed per ticket");
        }

        Resource resource = resourceRepository.findById(Objects.requireNonNull(request.getResourceId()))
                .orElseThrow(() -> new RuntimeException("Resource not found"));

        User user = userRepository.findById(Objects.requireNonNull(userId))
                .orElseThrow(() -> new RuntimeException("User not found"));

        Ticket ticket = Ticket.builder()
                .resource(resource)
                .category(request.getCategory())
                .description(request.getDescription())
                .priority(request.getPriority())
                .status(TicketStatus.OPEN)
                .contactDetails(request.getContactDetails())
                .createdBy(user)
                .build();

        Ticket savedTicket = ticketRepository.save(ticket);

        // Save attachments
        if (files != null && !files.isEmpty()) {
            for (MultipartFile file : files) {
                if (!file.isEmpty()) {
                    String fileUrl = saveFile(file, savedTicket.getId());
                    TicketAttachment attachment = TicketAttachment.builder()
                            .ticket(savedTicket)
                            .fileUrl(fileUrl)
                            .build();
                    attachmentRepository.save(attachment);
                }
            }
        }

        // Send notification to the user who created the ticket
        try {
            notificationService.createTicketNotification(
                    user.getId(),
                    "Ticket Created Successfully",
                    String.format("Your ticket #%d for %s has been created and is now %s.",
                            savedTicket.getId(),
                            resource.getName(),
                            savedTicket.getStatus().name().replace("_", " ")),
                    NotificationType.SUCCESS,
                    savedTicket.getId()
            );
            log.info("Sent ticket creation notification to user: {}", user.getId());
        } catch (Exception e) {
            log.error("Failed to send ticket creation notification to user {}: {}", user.getId(), e.getMessage());
        }

        // Send notification to all admins about the new ticket
        try {
            List<User> admins = userRepository.findByRoleIn(List.of(Role.ADMIN));
            for (User admin : admins) {
                // Skip if the admin is the same as the ticket creator
                if (!admin.getId().equals(user.getId())) {
                    notificationService.createNotification(
                            admin.getId(),
                            "New Ticket Raised",
                            String.format("A new ticket #%d has been raised by %s for %s with %s priority.",
                                    savedTicket.getId(),
                                    user.getName(),
                                    resource.getName(),
                                    savedTicket.getPriority().name()),
                            NotificationType.INFO,
                            NotificationCategory.ADMIN_ALERT,
                            savedTicket.getId(),
                            "TICKET"
                    );
                }
            }
            log.info("Sent new ticket notifications to {} admins", admins.size());
        } catch (Exception e) {
            log.error("Failed to send admin notifications for new ticket: {}", e.getMessage());
        }

        return convertToDTO(ticketRepository.findById(Objects.requireNonNull(savedTicket.getId())).orElse(savedTicket));
    }

    @Transactional(readOnly = true)
    public TicketDTO getTicketById(Long id) {
        Ticket ticket = ticketRepository.findById(Objects.requireNonNull(id))
                .orElseThrow(() -> new RuntimeException("Ticket not found with id: " + id));
        return convertToDTO(ticket);
    }

    @Transactional(readOnly = true)
    public List<TicketDTO> getTicketsByRole(User user) {
        List<Ticket> tickets;
        Role role = user.getRole();

        if (role == Role.ADMIN || role == Role.MANAGER) {
            tickets = ticketRepository.findAllByOrderByCreatedAtDesc();
        } else if (role == Role.TECHNICIAN) {
            // Technicians should see assigned work plus incidents they personally reported.
            Map<Long, Ticket> mergedTickets = new LinkedHashMap<>();

            ticketRepository.findByAssignedToIdOrderByCreatedAtDesc(user.getId())
                    .forEach(ticket -> mergedTickets.put(ticket.getId(), ticket));

            ticketRepository.findByCreatedByIdOrderByCreatedAtDesc(user.getId())
                    .forEach(ticket -> mergedTickets.put(ticket.getId(), ticket));

            tickets = mergedTickets.values()
                    .stream()
                    .sorted(Comparator.comparing(Ticket::getCreatedAt).reversed())
                    .toList();
        } else {
            tickets = ticketRepository.findByCreatedByIdOrderByCreatedAtDesc(user.getId());
        }

        return tickets.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TicketDTO> getAllTickets() {
        return ticketRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public TicketDTO updateStatus(Long ticketId, TicketStatus newStatus, User user,
            String rejectionReason, String resolutionNotes) {
        Ticket ticket = ticketRepository.findById(Objects.requireNonNull(ticketId))
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        // Validate status transition
        TicketStatus currentStatus = ticket.getStatus();
        Set<TicketStatus> validNext = VALID_TRANSITIONS.getOrDefault(currentStatus, Set.of());

        if (!validNext.contains(newStatus)) {
            throw new RuntimeException(
                    "Invalid status transition from " + currentStatus + " to " + newStatus);
        }

        // Only ADMIN can reject
        if (newStatus == TicketStatus.REJECTED && user.getRole() != Role.ADMIN) {
            throw new RuntimeException("Only ADMIN can reject tickets");
        }

        // Only assigned technician or admin can update status
        if (user.getRole() == Role.TECHNICIAN) {
            if (ticket.getAssignedTo() == null || !ticket.getAssignedTo().getId().equals(user.getId())) {
                throw new RuntimeException("Only the assigned technician can update this ticket's status");
            }
        } else if (user.getRole() != Role.ADMIN && user.getRole() != Role.MANAGER) {
            throw new RuntimeException("You don't have permission to update ticket status");
        }

        // Rejection requires a reason
        if (newStatus == TicketStatus.REJECTED) {
            if (rejectionReason == null || rejectionReason.trim().isEmpty()) {
                throw new RuntimeException("Rejection reason is required");
            }
            ticket.setRejectionReason(rejectionReason);
        }

        // Resolution notes when resolving
        if (newStatus == TicketStatus.RESOLVED && resolutionNotes != null) {
            ticket.setResolutionNotes(resolutionNotes);
        }

        ticket.setStatus(newStatus);
        Ticket savedTicket = ticketRepository.save(ticket);

        // Send notification to the ticket creator about status change
        try {
            User ticketCreator = ticket.getCreatedBy();
            if (ticketCreator != null) {
                String statusMessage = String.format("Your ticket #%d status has been changed to %s%s",
                        savedTicket.getId(),
                        newStatus.name().replace("_", " "),
                        resolutionNotes != null && !resolutionNotes.isBlank()
                                ? ". Resolution notes: " + resolutionNotes
                                : ".");

                notificationService.createTicketNotification(
                        ticketCreator.getId(),
                        "Ticket Status Updated",
                        statusMessage,
                        NotificationType.INFO,
                        savedTicket.getId()
                );
                log.info("Sent ticket status update notification to user: {}", ticketCreator.getId());
            }
        } catch (Exception e) {
            log.error("Failed to send ticket status update notification: {}", e.getMessage());
        }

        return convertToDTO(savedTicket);
    }

    @Transactional
    public TicketDTO assignTechnician(Long ticketId, Long technicianId) {
        Ticket ticket = ticketRepository.findById(Objects.requireNonNull(ticketId))
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        User technician = userRepository.findById(Objects.requireNonNull(technicianId))
                .orElseThrow(() -> new RuntimeException("Technician not found"));

        if (technician.getRole() != Role.TECHNICIAN) {
            throw new RuntimeException("User is not a technician");
        }

        ticket.setAssignedTo(technician);
        Ticket savedTicket = ticketRepository.save(ticket);
        return convertToDTO(savedTicket);
    }

    // File saving helper
    private String saveFile(MultipartFile file, Long ticketId) {
        try {
            Path ticketUploadDir = Paths.get(uploadDir, "tickets", String.valueOf(ticketId));
            Files.createDirectories(ticketUploadDir);

            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }

            String filename = UUID.randomUUID().toString() + extension;
            Path filePath = ticketUploadDir.resolve(filename);
            Files.copy(file.getInputStream(), filePath);

            return "uploads/tickets/" + ticketId + "/" + filename;
        } catch (IOException e) {
            throw new RuntimeException("Failed to save file: " + e.getMessage());
        }
    }

    // Convert entity to DTO
    private TicketDTO convertToDTO(Ticket ticket) {
        List<String> attachmentUrls = attachmentRepository.findByTicketId(ticket.getId())
                .stream()
                .map(TicketAttachment::getFileUrl)
                .collect(Collectors.toList());

        return TicketDTO.builder()
                .id(ticket.getId())
                .resourceId(ticket.getResource().getId())
                .resourceName(ticket.getResource().getName())
                .category(ticket.getCategory())
                .description(ticket.getDescription())
                .priority(ticket.getPriority())
                .status(ticket.getStatus())
                .contactDetails(ticket.getContactDetails())
                .assignedToId(ticket.getAssignedTo() != null ? ticket.getAssignedTo().getId() : null)
                .assignedToName(ticket.getAssignedTo() != null ? ticket.getAssignedTo().getName() : null)
                .rejectionReason(ticket.getRejectionReason())
                .resolutionNotes(ticket.getResolutionNotes())
                .createdById(ticket.getCreatedBy().getId())
                .createdByName(ticket.getCreatedBy().getName())
                .attachmentUrls(attachmentUrls)
                .createdAt(ticket.getCreatedAt())
                .updatedAt(ticket.getUpdatedAt())
                .build();
    }
}
