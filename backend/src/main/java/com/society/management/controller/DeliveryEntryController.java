package com.society.management.controller;

import com.society.management.dto.request.DeliveryEntryRequest;
import com.society.management.dto.response.DeliveryEntryResponse;
import com.society.management.enums.DeliveryStatus;
import com.society.management.security.UserPrincipal;
import com.society.management.service.DeliveryEntryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/deliveries")
@RequiredArgsConstructor
public class DeliveryEntryController {

    private final DeliveryEntryService deliveryEntryService;

    @GetMapping
    public List<DeliveryEntryResponse> getAll(@RequestParam(required = false) DeliveryStatus status,
                                               @AuthenticationPrincipal UserPrincipal actor) {
        return deliveryEntryService.findForActor(actor, status);
    }

    @GetMapping("/{id}")
    public DeliveryEntryResponse getById(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal actor) {
        return deliveryEntryService.findById(id, actor);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('GUARD', 'SOCIETY_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<DeliveryEntryResponse> create(@Valid @RequestBody DeliveryEntryRequest request,
                                                          @AuthenticationPrincipal UserPrincipal actor) {
        return ResponseEntity.status(HttpStatus.CREATED).body(deliveryEntryService.create(request, actor));
    }

    @PutMapping("/{id}/checkout")
    @PreAuthorize("hasAnyRole('GUARD', 'SOCIETY_ADMIN', 'SUPER_ADMIN')")
    public DeliveryEntryResponse checkout(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal actor) {
        return deliveryEntryService.checkout(id, actor);
    }
}
