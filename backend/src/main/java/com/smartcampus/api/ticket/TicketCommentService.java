package com.smartcampus.api.ticket;

import com.smartcampus.api.ticket.dto.CommentDTO;
import com.smartcampus.api.user.Role;
import com.smartcampus.api.user.User;
import com.smartcampus.api.user.UserRepository;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TicketCommentService {

    private final TicketCommentRepository commentRepository;
    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<CommentDTO> getCommentsByTicket(Long ticketId) {
        return commentRepository.findByTicketIdOrderByCreatedAtAsc(ticketId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public CommentDTO addComment(Long ticketId, Long userId, String content) {
        Ticket ticket = ticketRepository.findById(Objects.requireNonNull(ticketId))
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        User user = userRepository.findById(Objects.requireNonNull(userId))
                .orElseThrow(() -> new RuntimeException("User not found"));

        TicketComment comment = TicketComment.builder()
                .ticket(ticket)
                .user(user)
                .content(content)
                .build();

        TicketComment saved = commentRepository.save(comment);
        return convertToDTO(saved);
    }

    @Transactional
    public CommentDTO editComment(Long commentId, Long userId, String content) {
        TicketComment comment = commentRepository.findById(Objects.requireNonNull(commentId))
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        // Only the owner can edit their comment
        if (!comment.getUser().getId().equals(userId)) {
            throw new RuntimeException("You can only edit your own comments");
        }

        comment.setContent(content);
        TicketComment saved = commentRepository.save(comment);
        return convertToDTO(saved);
    }

    @Transactional
    public void deleteComment(Long commentId, User user) {
        TicketComment comment = commentRepository.findById(Objects.requireNonNull(commentId))
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        // Owner or ADMIN can delete
        if (!comment.getUser().getId().equals(user.getId()) && user.getRole() != Role.ADMIN) {
            throw new RuntimeException("You can only delete your own comments");
        }

        commentRepository.delete(comment);
    }

    private CommentDTO convertToDTO(TicketComment comment) {
        return CommentDTO.builder()
                .id(comment.getId())
                .ticketId(comment.getTicket().getId())
                .userId(comment.getUser().getId())
                .userName(comment.getUser().getName())
                .content(comment.getContent())
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .build();
    }
}
