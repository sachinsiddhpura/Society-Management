package com.society.management.dto.response;

import com.society.management.entity.DeliveryEntry;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class DeliveryEntryResponse {
    private Long id;
    private Long societyId;
    private String deliveryPartner;
    private String otherPartnerName;
    private String agentName;
    private String agentPhone;
    private String orderId;
    private String flatNumber;
    private String blockName;
    private String photoUrl;
    private String gateNumber;
    private String status;
    private String createdByGuardName;
    private LocalDateTime entryTime;
    private LocalDateTime exitTime;

    public static DeliveryEntryResponse from(DeliveryEntry d) {
        return DeliveryEntryResponse.builder()
                .id(d.getId())
                .societyId(d.getSociety().getId())
                .deliveryPartner(d.getDeliveryPartner().name())
                .otherPartnerName(d.getOtherPartnerName())
                .agentName(d.getAgentName())
                .agentPhone(d.getAgentPhone())
                .orderId(d.getOrderId())
                .flatNumber(d.getFlatNumber())
                .blockName(d.getBlockName())
                .photoUrl(d.getPhotoUrl())
                .gateNumber(d.getGateNumber())
                .status(d.getStatus().name())
                .createdByGuardName(d.getCreatedByGuard() != null ? d.getCreatedByGuard().getName() : null)
                .entryTime(d.getEntryTime())
                .exitTime(d.getExitTime())
                .build();
    }
}
