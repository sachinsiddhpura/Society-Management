package com.society.management.service;

import com.society.management.dto.request.SocietyUpdateRequest;
import com.society.management.entity.Society;
import com.society.management.exception.ResourceNotFoundException;
import com.society.management.repository.SocietyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SocietyService {

    private final SocietyRepository societyRepository;

    public List<Society> findAll() {
        return societyRepository.findAll();
    }

    public Society findById(Long id) {
        return societyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Society not found with id " + id));
    }

    @Transactional
    public Society update(Long id, SocietyUpdateRequest req) {
        Society society = findById(id);
        if (req.getName() != null) society.setName(req.getName());
        if (req.getAddress() != null) society.setAddress(req.getAddress());
        if (req.getCity() != null) society.setCity(req.getCity());
        if (req.getState() != null) society.setState(req.getState());
        if (req.getPincode() != null) society.setPincode(req.getPincode());
        if (req.getContactPhone() != null) society.setContactPhone(req.getContactPhone());
        if (req.getActive() != null) society.setActive(req.getActive());
        return societyRepository.save(society);
    }
}
