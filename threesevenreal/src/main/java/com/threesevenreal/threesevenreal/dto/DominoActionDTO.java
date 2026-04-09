package com.threesevenreal.threesevenreal.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DominoActionDTO {

    private String gameId;
    private String playerId;
    private String action;
    private Integer tileIndex;
    private String side;
    private Integer maxPlayers;
    private String roomId;
    private String message;
}
