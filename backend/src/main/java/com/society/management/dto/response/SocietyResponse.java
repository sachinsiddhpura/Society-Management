package com.society.management.dto.response;

import com.society.management.entity.Society;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class SocietyResponse {
    private Long id;
    private String name;
    private String registrationNumber;
    private String address;
    private String city;
    private String state;
    private String pincode;
    private String contactEmail;
    private String contactPhone;
    private boolean active;
    private LocalDateTime createdAt;

    public static SocietyResponse from(Society s) {
        return SocietyResponse.builder()
                .id(s.getId())
                .name(s.getName())
                .registrationNumber(s.getRegistrationNumber())
                .address(s.getAddress())
                .city(s.getCity())
                .state(s.getState())
                .pincode(s.getPincode())
                .contactEmail(s.getContactEmail())
                .contactPhone(s.getContactPhone())
                .active(s.isActive())
                .createdAt(s.getCreatedAt())
                .build();
    }
}
