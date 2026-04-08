package com.threesevenreal.threesevenreal.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PlayerStatsDTO {

    private String userId;
    private String username;
    private String avatarSymbol;
    private int wins;
    private int losses;
    private int gamesPlayed;
    private double winRate;
    private int winStreak;
    private int maxWinStreak;
}