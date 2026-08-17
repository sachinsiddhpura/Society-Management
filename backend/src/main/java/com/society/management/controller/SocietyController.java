package com.society.management.controller;

import com.society.management.dto.request.SocietyUpdateRequest;
import com.society.management.dto.response.SocietyResponse;
import com.society.management.service.SocietyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/societies")
@RequiredArgsConstructor
public class SocietyController {

    private final SocietyService societyService;

    @GetMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public List<SocietyResponse> getAll() {
        return societyService.findAll().stream().map(SocietyResponse::from).toList();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'SOCIETY_ADMIN')")
    public SocietyResponse getById(@PathVariable Long id) {
        return SocietyResponse.from(societyService.findById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'SOCIETY_ADMIN')")
    public SocietyResponse update(@PathVariable Long id, @Valid @RequestBody SocietyUpdateRequest request) {
        return SocietyResponse.from(societyService.update(id, request));
    }
}
