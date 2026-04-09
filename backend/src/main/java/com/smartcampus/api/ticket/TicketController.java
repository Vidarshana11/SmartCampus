package com.smartcampus.api.ticket;

import com.smartcampus.api.ticket.dto.CommentDTO;
import com.smartcampus.api.ticket.dto.TicketCreateRequest;
import com.smartcampus.api.ticket.dto.TicketDTO;
import com.smartcampus.api.user.User;
import com.smartcampus.api.user.UserRepository;
import com.smartcampus.api.user.Role;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;
    private final TicketCommentService commentService;
    private final UserRepository userRepository;

    // POST /api/tickets — create with multipart (form data + files)
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<TicketDTO> createTicket(
            @AuthenticationPrincipal User user,
            @RequestPart("ticket") @Valid TicketCreateRequest request,
            @RequestPart(value = "files", required = false) List<MultipartFile> files) {
        TicketDTO ticket = ticketService.createTicket(user.getId(), request, files);
        return new ResponseEntity<>(ticket, HttpStatus.CREATED);
    }

    // GET /api/tickets — filtered by role
    @GetMapping
    public ResponseEntity<List<TicketDTO>> getTickets(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ticketService.getTicketsByRole(user));
    }

    // GET /api/tickets/all — admin sees all
    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<List<TicketDTO>> getAllTickets() {
        return ResponseEntity.ok(ticketService.getAllTickets());
    }

    // GET /api/tickets/{id}
    @GetMapping("/{id}")
    public ResponseEntity<TicketDTO> getTicketById(@PathVariable Long id) {
        return ResponseEntity.ok(ticketService.getTicketById(id));
    }

    // PUT /api/tickets/{id}/status
    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'TECHNICIAN')")
    public ResponseEntity<TicketDTO> updateStatus(
            @PathVariable Long id,
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, String> request) {
        TicketStatus newStatus = TicketStatus.valueOf(request.get("status"));
        String rejectionReason = request.get("rejectionReason");
        String resolutionNotes = request.get("resolutionNotes");
        return ResponseEntity.ok(ticketService.updateStatus(id, newStatus, user, rejectionReason, resolutionNotes));
    }

    // PUT /api/tickets/{id}/assign
    @PutMapping("/{id}/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TicketDTO> assignTechnician(
            @PathVariable Long id,
            @RequestBody Map<String, Long> request) {
        Long technicianId = request.get("technicianId");
        return ResponseEntity.ok(ticketService.assignTechnician(id, technicianId));
    }

    // GET /api/tickets/{id}/comments
    @GetMapping("/{id}/comments")
    public ResponseEntity<List<CommentDTO>> getComments(@PathVariable Long id) {
        return ResponseEntity.ok(commentService.getCommentsByTicket(id));
    }

    // POST /api/tickets/{id}/comments
    @PostMapping("/{id}/comments")
    public ResponseEntity<CommentDTO> addComment(
            @PathVariable Long id,
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, String> request) {
        String content = request.get("content");
        return new ResponseEntity<>(commentService.addComment(id, user.getId(), content), HttpStatus.CREATED);
    }

    // PUT /api/comments/{id}
    @PutMapping("/comments/{id}")
    public ResponseEntity<CommentDTO> editComment(
            @PathVariable Long id,
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, String> request) {
        String content = request.get("content");
        return ResponseEntity.ok(commentService.editComment(id, user.getId(), content));
    }

    // DELETE /api/comments/{id}
    @DeleteMapping("/comments/{id}")
    public ResponseEntity<Map<String, String>> deleteComment(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        commentService.deleteComment(id, user);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Comment deleted successfully");
        return ResponseEntity.ok(response);
    }

    // GET /api/tickets/technicians — get list of technicians for assignment
    // dropdown
    @GetMapping("/technicians")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getTechnicians() {
        List<User> technicians = userRepository.findByRoleIn(List.of(Role.TECHNICIAN));
        List<Map<String, Object>> result = technicians.stream()
                .map(t -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", t.getId());
                    map.put("name", t.getName());
                    map.put("email", t.getEmail());
                    return map;
                })
                .toList();
        return ResponseEntity.ok(result);
    }
}
