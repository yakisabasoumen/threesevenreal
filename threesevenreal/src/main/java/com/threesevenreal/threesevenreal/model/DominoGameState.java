package com.threesevenreal.threesevenreal.model;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
public class DominoGameState {

    private String gameId;
    private List<DominoPlayerState> players = new ArrayList<>();
    private List<DominoTile> board = new ArrayList<>();
    private List<DominoTile> drawPile = new ArrayList<>();
    private int pool;
    private Map<String, Integer> roundPoints = new HashMap<>();
    private Map<String, Integer> totalPoints = new HashMap<>();
    private String winner;
    private int roundNumber;
    private String status;
    private String currentTurnPlayerId;
    private int passCount;
    private int maxPlayers;
    private String message;

    @Data
    @NoArgsConstructor
    public static class DominoPlayerState {
        private String playerId;
        private String username;
        private int team;
        private boolean turn;
        private List<DominoTile> hand = new ArrayList<>();
    }
}
