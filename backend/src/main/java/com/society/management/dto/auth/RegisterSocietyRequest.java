package com.society.management.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RegisterSocietyRequest {

    @NotBlank
    private String societyName;

    private String registrationNumber;
    private String address;
    private String city;
    private String state;
    private String pincode;

    @NotBlank
    private String societyContactPhone;

    @NotBlank
    private String adminName;

    @NotBlank
    @Email
    private String adminEmail;

    @NotBlank
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String adminPassword;

    private String adminPhone;
}
