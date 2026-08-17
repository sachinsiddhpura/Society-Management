package com.society.management.repository;

import com.society.management.entity.VisitorEntry;
import com.society.management.enums.VisitorStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VisitorEntryRepository extends JpaRepository<VisitorEntry, Long> {
    List<VisitorEntry> findBySocietyIdOrderByEntryTimeDesc(Long societyId);
    List<VisitorEntry> findBySocietyIdAndStatusOrderByEntryTimeDesc(Long societyId, VisitorStatus status);
}
