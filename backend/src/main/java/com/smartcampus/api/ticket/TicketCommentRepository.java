package com.smartcampus.api.ticket;

import com.smartcampus.api.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketCommentRepository extends JpaRepository<TicketComment, Long> {

    List<TicketComment> findByTicketIdOrderByCreatedAtAsc(Long ticketId);

    // For user account deletion - find by User entity
    List<TicketComment> findByUser(User user);
}
