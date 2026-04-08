package com.threesevenreal.threesevenreal.dto;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSearchDTO {
    private String id;
    private String username;
    private String avatarSymbol;
    private int wins;
    private int losses;
}