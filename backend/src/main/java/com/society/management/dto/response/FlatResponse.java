package com.society.management.dto.response;

import com.society.management.entity.Flat;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class FlatResponse {
    private Long id;
    private Long societyId;
    private String blockName;
    private String flatNumber;
    private String ownerName;
    private String ownerPhone;
    private Long residentUserId;
    private String residentName;
    private boolean occupied;

    public static FlatResponse from(Flat f) {
        return FlatResponse.builder()
                .id(f.getId())
                .societyId(f.getSociety().getId())
                .blockName(f.getBlockName())
                .flatNumber(f.getFlatNumber())
                .ownerName(f.getOwnerName())
                .ownerPhone(f.getOwnerPhone())
                .residentUserId(f.getResident() != null ? f.getResident().getId() : null)
                .residentName(f.getResident() != null ? f.getResident().getName() : null)
                .occupied(f.isOccupied())
                .build();
    }
}
