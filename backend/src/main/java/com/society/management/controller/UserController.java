package com.society.management.controller;

import com.society.management.dto.request.UserUpdateRequest;
import com.society.management.dto.response.ApiResponse;
import com.society.management.dto.response.UserResponse;
import com.society.management.security.UserPrincipal;
import com.society.management.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'SOCIETY_ADMIN')")
public class UserController {

    private final UserService userService;

    @GetMapping
    public List<UserResponse> getAll(@AuthenticationPrincipal UserPrincipal actor) {
        return userService.findForActor(actor).stream().map(UserResponse::from).toList();
    }

    @GetMapping("/{id}")
    public UserResponse getById(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal actor) {
        return UserResponse.from(userService.findById(id, actor));
    }

    @PutMapping("/{id}")
    public UserResponse update(@PathVariable Long id, @Valid @RequestBody UserUpdateRequest request,
                                @AuthenticationPrincipal UserPrincipal actor) {
        return UserResponse.from(userService.update(id, request, actor));
    }

    @DeleteMapping("/{id}")
    public ApiResponse delete(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal actor) {
        userService.delete(id, actor);
        return ApiResponse.of(true, "User deleted successfully");
    }
}
