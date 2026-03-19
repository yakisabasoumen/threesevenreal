package com.threesevenreal.threesevenreal.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class GameMessage {

    // Tipo de mensaje
    private String type;
    // JOIN, LEAVE, ACTION, STATE_UPDATE, GAME_START, GAME_END, ERROR, CHAT

    private String roomId;
    private String playerId;
    private String username;

    // Accion del jugador: HIT, STAND, FOLD, CHECK, BET
    private String action;

    // Payload con el estado actual del juego (JSON string)
    private Object payload;

    private String message;
    private long timestamp;
}