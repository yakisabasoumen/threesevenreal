package com.threesevenreal.threesevenreal.controller;

import com.threesevenreal.threesevenreal.dto.GameMessage;
import com.threesevenreal.threesevenreal.service.GameRoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class GameWebSocketController {

    private final GameRoomService gameRoomService;
    private final SimpMessagingTemplate messagingTemplate;

    // Registra playerId en la sesión WebSocket para detectar desconexiones.
    // FIX #1: también reenvía el estado de la partida si ya estaba en curso,
    // solucionando la race condition donde el 2º jugador se unía por HTTP
    // antes de que su WebSocket estuviera suscrito al topic personal.
    @MessageMapping("/game/{roomId}/connect")
    public void handleConnect(
            @DestinationVariable String roomId,
            @Payload GameMessage message,
            SimpMessageHeaderAccessor headerAccessor) {

        headerAccessor.getSessionAttributes().put("playerId", message.getPlayerId());
        headerAccessor.getSessionAttributes().put("roomId", roomId);

        // FIX #1: reenviar estado personalizado si la partida ya empezó
        // Esto garantiza que el 2º jugador siempre recibe sus cartas
        // aunque el GAME_START llegara antes de que su WS estuviera listo
        gameRoomService.resendStateIfPlaying(roomId, message.getPlayerId());
    }

    @MessageMapping("/game/{roomId}/action")
    public void handleAction(
            @DestinationVariable String roomId,
            @Payload GameMessage message) {
        try {
            gameRoomService.handleAction(roomId, message.getPlayerId(), message.getAction());
        } catch (Exception e) {
            GameMessage errorMsg = GameMessage.builder()
                    .type("ERROR")
                    .roomId(roomId)
                    .message(e.getMessage())
                    .timestamp(System.currentTimeMillis())
                    .build();
            messagingTemplate.convertAndSend("/topic/room/" + roomId, errorMsg);
        }
    }

    @MessageMapping("/game/{roomId}/chat")
    public void handleChat(
            @DestinationVariable String roomId,
            @Payload GameMessage message) {
        GameMessage chatMsg = GameMessage.builder()
                .type("CHAT")
                .roomId(roomId)
                .username(message.getUsername())
                .message(message.getMessage())
                .timestamp(System.currentTimeMillis())
                .build();
        messagingTemplate.convertAndSend("/topic/room/" + roomId, chatMsg);
    }
}