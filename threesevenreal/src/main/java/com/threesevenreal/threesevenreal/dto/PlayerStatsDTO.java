package com.threesevenreal.threesevenreal.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PlayerStatsDTO {

    private String userId;
    private String username;
    private int wins;
    private int losses;
    private int gamesPlayed;
    private double winRate;
}