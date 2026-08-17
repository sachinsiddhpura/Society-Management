package com.society.management.controller;

import com.society.management.dto.request.FlatRequest;
import com.society.management.dto.response.ApiResponse;
import com.society.management.dto.response.FlatResponse;
import com.society.management.security.UserPrincipal;
import com.society.management.service.FlatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/flats")
@RequiredArgsConstructor
public class FlatController {

    private final FlatService flatService;

    @GetMapping
    public List<FlatResponse> getAll(@AuthenticationPrincipal UserPrincipal actor) {
        return flatService.findForActor(actor);
    }

    @GetMapping("/{id}")
    public FlatResponse getById(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal actor) {
        return flatService.findById(id, actor);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'SOCIETY_ADMIN')")
    public ResponseEntity<FlatResponse> create(@Valid @RequestBody FlatRequest request,
                                                @AuthenticationPrincipal UserPrincipal actor) {
        return ResponseEntity.status(HttpStatus.CREATED).body(flatService.create(request, actor));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'SOCIETY_ADMIN')")
    public FlatResponse update(@PathVariable Long id, @Valid @RequestBody FlatRequest request,
                                @AuthenticationPrincipal UserPrincipal actor) {
        return flatService.update(id, request, actor);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'SOCIETY_ADMIN')")
    public ApiResponse delete(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal actor) {
        flatService.delete(id, actor);
        return ApiResponse.of(true, "Flat deleted successfully");
    }
}
