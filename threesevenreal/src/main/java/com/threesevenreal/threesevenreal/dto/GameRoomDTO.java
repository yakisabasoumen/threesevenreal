package com.threesevenreal.threesevenreal.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class GameRoomDTO {

    private String roomId;
    private String gameType;
    private String status;
    private List<String> playerUsernames;
    private int maxPlayers;
    private int currentPlayers;
    private String currentTurnUsername;
    private String message;
}