package com.society.management.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FlatRequest {

    @NotBlank
    private String blockName;

    @NotBlank
    private String flatNumber;

    private String ownerName;
    private String ownerPhone;
    private Long residentUserId;
    private boolean occupied;
}
