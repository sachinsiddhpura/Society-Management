package com.society.management.service;

import com.society.management.dto.auth.LoginRequest;
import com.society.management.dto.auth.LoginResponse;
import com.society.management.dto.auth.RegisterSocietyRequest;
import com.society.management.dto.auth.RegisterUserRequest;
import com.society.management.entity.Society;
import com.society.management.entity.User;
import com.society.management.enums.Role;
import com.society.management.exception.AccessDeniedCustomException;
import com.society.management.exception.BadRequestException;
import com.society.management.repository.SocietyRepository;
import com.society.management.repository.UserRepository;
import com.society.management.security.JwtUtil;
import com.society.management.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final SocietyRepository societyRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;

    @Transactional
    public LoginResponse registerSociety(RegisterSocietyRequest req) {
        if (societyRepository.existsByContactEmail(req.getAdminEmail())) {
            throw new BadRequestException("A society is already registered with this contact email");
        }
        if (userRepository.existsByEmail(req.getAdminEmail())) {
            throw new BadRequestException("A user already exists with this email");
        }
        if (req.getRegistrationNumber() != null && !req.getRegistrationNumber().isBlank()
                && societyRepository.existsByRegistrationNumber(req.getRegistrationNumber())) {
            throw new BadRequestException("Registration number already in use");
        }

        Society society = Society.builder()
                .name(req.getSocietyName())
                .registrationNumber(req.getRegistrationNumber())
                .address(req.getAddress())
                .city(req.getCity())
                .state(req.getState())
                .pincode(req.getPincode())
                .contactEmail(req.getAdminEmail())
                .contactPhone(req.getSocietyContactPhone())
                .active(true)
                .build();
        society = societyRepository.save(society);

        User admin = User.builder()
                .society(society)
                .name(req.getAdminName())
                .email(req.getAdminEmail())
                .password(passwordEncoder.encode(req.getAdminPassword()))
                .phone(req.getAdminPhone())
                .role(Role.SOCIETY_ADMIN)
                .active(true)
                .build();
        admin = userRepository.save(admin);

        String token = jwtUtil.generateToken(admin.getId(), admin.getEmail(), admin.getRole().name(), society.getId());

        return LoginResponse.builder()
                .token(token)
                .userId(admin.getId())
                .name(admin.getName())
                .email(admin.getEmail())
                .role(admin.getRole().name())
                .societyId(society.getId())
                .societyName(society.getName())
                .build();
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest req) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.getEmail(), req.getPassword()));

        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new BadRequestException("Invalid email or password"));

        String token = jwtUtil.generateToken(
                user.getId(), user.getEmail(), user.getRole().name(),
                user.getSociety() != null ? user.getSociety().getId() : null);

        return LoginResponse.builder()
                .token(token)
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .societyId(user.getSociety() != null ? user.getSociety().getId() : null)
                .societyName(user.getSociety() != null ? user.getSociety().getName() : null)
                .build();
    }

    @Transactional
    public User registerUser(RegisterUserRequest req, UserPrincipal actor) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new BadRequestException("A user already exists with this email");
        }
        if (req.getRole() == Role.SUPER_ADMIN) {
            throw new BadRequestException("Cannot create another super admin through this endpoint");
        }

        Long societyId;
        if (actor.getRole() == Role.SUPER_ADMIN) {
            if (req.getSocietyId() == null) {
                throw new BadRequestException("societyId is required when a super admin creates a user");
            }
            societyId = req.getSocietyId();
        } else if (actor.getRole() == Role.SOCIETY_ADMIN) {
            societyId = actor.getSocietyId();
        } else {
            throw new AccessDeniedCustomException("You are not allowed to create users");
        }

        Society society = societyRepository.findById(societyId)
                .orElseThrow(() -> new BadRequestException("Society not found"));

        User user = User.builder()
                .society(society)
                .name(req.getName())
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .phone(req.getPhone())
                .role(req.getRole())
                .flatNumber(req.getFlatNumber())
                .blockName(req.getBlockName())
                .active(true)
                .build();

        return userRepository.save(user);
    }
}
