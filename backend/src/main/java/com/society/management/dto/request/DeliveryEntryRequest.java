package com.society.management.dto.request;

import com.society.management.enums.DeliveryPartner;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DeliveryEntryRequest {

    @NotNull
    private DeliveryPartner deliveryPartner;

    private String otherPartnerName;
    private String agentName;
    private String agentPhone;
    private String orderId;

    @NotBlank
    private String flatNumber;

    private String blockName;

    /** URL returned from the /api/upload/photo endpoint after capturing the delivery agent's photo. */
    private String photoUrl;

    private String gateNumber;
}
