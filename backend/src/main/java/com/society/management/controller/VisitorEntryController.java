package com.society.management.controller;

import com.society.management.dto.request.VisitorEntryRequest;
import com.society.management.dto.response.VisitorEntryResponse;
import com.society.management.enums.VisitorStatus;
import com.society.management.security.UserPrincipal;
import com.society.management.service.VisitorEntryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/visitors")
@RequiredArgsConstructor
public class VisitorEntryController {

    private final VisitorEntryService visitorEntryService;

    @GetMapping
    public List<VisitorEntryResponse> getAll(@RequestParam(required = false) VisitorStatus status,
                                              @AuthenticationPrincipal UserPrincipal actor) {
        return visitorEntryService.findForActor(actor, status);
    }

    @GetMapping("/{id}")
    public VisitorEntryResponse getById(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal actor) {
        return visitorEntryService.findById(id, actor);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('GUARD', 'SOCIETY_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<VisitorEntryResponse> create(@Valid @RequestBody VisitorEntryRequest request,
                                                         @AuthenticationPrincipal UserPrincipal actor) {
        return ResponseEntity.status(HttpStatus.CREATED).body(visitorEntryService.create(request, actor));
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('RESIDENT', 'SOCIETY_ADMIN', 'SUPER_ADMIN')")
    public VisitorEntryResponse approve(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal actor) {
        return visitorEntryService.updateStatus(id, VisitorStatus.APPROVED, actor);
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('RESIDENT', 'SOCIETY_ADMIN', 'SUPER_ADMIN')")
    public VisitorEntryResponse reject(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal actor) {
        return visitorEntryService.updateStatus(id, VisitorStatus.REJECTED, actor);
    }

    @PutMapping("/{id}/checkout")
    @PreAuthorize("hasAnyRole('GUARD', 'SOCIETY_ADMIN', 'SUPER_ADMIN')")
    public VisitorEntryResponse checkout(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal actor) {
        return visitorEntryService.updateStatus(id, VisitorStatus.CHECKED_OUT, actor);
    }
}
