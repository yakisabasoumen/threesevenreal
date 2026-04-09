package com.threesevenreal.threesevenreal.dto;

import com.threesevenreal.threesevenreal.model.DominoTile;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DominoStateDTO {

    private String gameId;
    private List<DominoPlayerDTO> players;
    private List<DominoTile> board;
    private int pool;
    private Map<String, Integer> roundPoints;
    private Map<String, Integer> totalPoints;
    private String winner;
    private int roundNumber;
    private String status;
    private String currentTurnPlayerId;
    private String currentTurnUsername;
    private String message;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DominoPlayerDTO {
        private String playerId;
        private String username;
        private int team;
        private boolean turn;
        private List<DominoTile> hand;
    }
}
