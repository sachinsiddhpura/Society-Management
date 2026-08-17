package com.society.management.repository;

import com.society.management.entity.DeliveryEntry;
import com.society.management.enums.DeliveryStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DeliveryEntryRepository extends JpaRepository<DeliveryEntry, Long> {
    List<DeliveryEntry> findBySocietyIdOrderByEntryTimeDesc(Long societyId);
    List<DeliveryEntry> findBySocietyIdAndStatusOrderByEntryTimeDesc(Long societyId, DeliveryStatus status);
}
