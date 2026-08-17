package com.society.management.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SocietyUpdateRequest {
    private String name;
    private String address;
    private String city;
    private String state;
    private String pincode;
    private String contactPhone;
    private Boolean active;
}
