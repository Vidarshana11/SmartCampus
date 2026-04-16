package com.smartcampus.api.ticket;

import com.smartcampus.api.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {

    List<Ticket> findByCreatedByIdOrderByCreatedAtDesc(Long userId);

    List<Ticket> findByAssignedToIdOrderByCreatedAtDesc(Long technicianId);

    // For user account deletion - find by User entity
    List<Ticket> findByCreatedBy(User user);

    List<Ticket> findByAssignedTo(User user);

    List<Ticket> findByStatusOrderByCreatedAtDesc(TicketStatus status);

    List<Ticket> findByPriorityOrderByCreatedAtDesc(TicketPriority priority);

    List<Ticket> findAllByOrderByCreatedAtDesc();

    List<Ticket> findByStatusAndPriorityOrderByCreatedAtDesc(TicketStatus status, TicketPriority priority);
}
