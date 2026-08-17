package com.society.management.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VisitorEntryRequest {

    @NotBlank
    private String visitorName;

    private String visitorPhone;
    private String purpose;
    private String vehicleNumber;

    @NotBlank
    private String flatToVisit;

    private String blockToVisit;
    private String hostName;

    /** URL returned from the /api/upload/photo endpoint after capturing the visitor's photo. */
    private String photoUrl;

    private String gateNumber;
}
