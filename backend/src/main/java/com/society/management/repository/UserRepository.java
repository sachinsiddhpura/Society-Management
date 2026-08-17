package com.society.management.repository;

import com.society.management.entity.User;
import com.society.management.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    List<User> findBySocietyId(Long societyId);
    List<User> findBySocietyIdAndRole(Long societyId, Role role);
}
