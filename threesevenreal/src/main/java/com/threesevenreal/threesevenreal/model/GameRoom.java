package com.threesevenreal.threesevenreal.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@Document(collection = "game_rooms")
public class GameRoom {

    @Id
    private String id;

    private String gameType; // BLACKJACK, THREESEVEN, POKER

    // WAITING (esperando jugadores), PLAYING, FINISHED
    private String status;

    private List<String> playerIds = new ArrayList<>();
    private List<String> playerUsernames = new ArrayList<>();

    private int maxPlayers;
    private int currentRound;

    // Estado del juego serializado como JSON
    private String gameState;

    // Turno actual: playerId del jugador que debe actuar
    private String currentTurnPlayerId;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}