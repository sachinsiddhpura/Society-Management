package com.society.management.dto.response;

import com.society.management.entity.VisitorEntry;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class VisitorEntryResponse {
    private Long id;
    private Long societyId;
    private String visitorName;
    private String visitorPhone;
    private String purpose;
    private String vehicleNumber;
    private String flatToVisit;
    private String blockToVisit;
    private String hostName;
    private String photoUrl;
    private String gateNumber;
    private String status;
    private String createdByGuardName;
    private String approvedByName;
    private LocalDateTime entryTime;
    private LocalDateTime exitTime;

    public static VisitorEntryResponse from(VisitorEntry v) {
        return VisitorEntryResponse.builder()
                .id(v.getId())
                .societyId(v.getSociety().getId())
                .visitorName(v.getVisitorName())
                .visitorPhone(v.getVisitorPhone())
                .purpose(v.getPurpose())
                .vehicleNumber(v.getVehicleNumber())
                .flatToVisit(v.getFlatToVisit())
                .blockToVisit(v.getBlockToVisit())
                .hostName(v.getHostName())
                .photoUrl(v.getPhotoUrl())
                .gateNumber(v.getGateNumber())
                .status(v.getStatus().name())
                .createdByGuardName(v.getCreatedByGuard() != null ? v.getCreatedByGuard().getName() : null)
                .approvedByName(v.getApprovedBy() != null ? v.getApprovedBy().getName() : null)
                .entryTime(v.getEntryTime())
                .exitTime(v.getExitTime())
                .build();
    }
}
