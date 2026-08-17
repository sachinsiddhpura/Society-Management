package com.society.management.repository;

import com.society.management.entity.Flat;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FlatRepository extends JpaRepository<Flat, Long> {
    List<Flat> findBySocietyId(Long societyId);
    boolean existsBySocietyIdAndBlockNameAndFlatNumber(Long societyId, String blockName, String flatNumber);
}
