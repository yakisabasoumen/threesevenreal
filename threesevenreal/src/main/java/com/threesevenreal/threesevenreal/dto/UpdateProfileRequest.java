package com.threesevenreal.threesevenreal.dto;

import lombok.Data;

@Data
public class UpdateProfileRequest {

    private String newUsername;
    private String currentPassword;
    private String newPassword;
    private String avatarSymbol; 
}