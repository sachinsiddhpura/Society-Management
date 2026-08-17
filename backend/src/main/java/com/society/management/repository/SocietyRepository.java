package com.society.management.repository;

import com.society.management.entity.Society;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SocietyRepository extends JpaRepository<Society, Long> {
    Optional<Society> findByContactEmail(String contactEmail);
    boolean existsByContactEmail(String contactEmail);
    boolean existsByRegistrationNumber(String registrationNumber);
}
