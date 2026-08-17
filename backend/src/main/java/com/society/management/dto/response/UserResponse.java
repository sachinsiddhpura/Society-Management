package com.society.management.dto.response;

import com.society.management.entity.User;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class UserResponse {
    private Long id;
    private Long societyId;
    private String name;
    private String email;
    private String phone;
    private String role;
    private String flatNumber;
    private String blockName;
    private boolean active;
    private LocalDateTime createdAt;

    public static UserResponse from(User u) {
        return UserResponse.builder()
                .id(u.getId())
                .societyId(u.getSociety() != null ? u.getSociety().getId() : null)
                .name(u.getName())
                .email(u.getEmail())
                .phone(u.getPhone())
                .role(u.getRole().name())
                .flatNumber(u.getFlatNumber())
                .blockName(u.getBlockName())
                .active(u.isActive())
                .createdAt(u.getCreatedAt())
                .build();
    }
}
