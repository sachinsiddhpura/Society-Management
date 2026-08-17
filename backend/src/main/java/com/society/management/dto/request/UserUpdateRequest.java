package com.society.management.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserUpdateRequest {
    private String name;
    private String phone;
    private String flatNumber;
    private String blockName;
    private Boolean active;
}
