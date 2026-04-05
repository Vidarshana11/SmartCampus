package com.smartcampus.api.user;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    // Member 4: Role management queries
    Page<User> findByRole(Role role, Pageable pageable);
    Page<User> findByEmailContainingOrNameContainingIgnoreCase(String email, String name, Pageable pageable);
    List<User> findByRoleIn(Collection<Role> roles);
}
