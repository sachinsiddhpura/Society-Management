package com.society.management.controller;

import com.society.management.dto.auth.LoginRequest;
import com.society.management.dto.auth.LoginResponse;
import com.society.management.dto.auth.RegisterSocietyRequest;
import com.society.management.dto.auth.RegisterUserRequest;
import com.society.management.dto.response.UserResponse;
import com.society.management.entity.User;
import com.society.management.security.UserPrincipal;
import com.society.management.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register-society")
    public ResponseEntity<LoginResponse> registerSociety(@Valid @RequestBody RegisterSocietyRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.registerSociety(request));
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/register-user")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'SOCIETY_ADMIN')")
    public ResponseEntity<UserResponse> registerUser(@Valid @RequestBody RegisterUserRequest request,
                                                       @AuthenticationPrincipal UserPrincipal actor) {
        User user = authService.registerUser(request, actor);
        return ResponseEntity.status(HttpStatus.CREATED).body(UserResponse.from(user));
    }
}
