package com.threesevenreal.threesevenreal.controller;

import com.threesevenreal.threesevenreal.dto.DominoActionDTO;
import com.threesevenreal.threesevenreal.dto.GameMessage;
import com.threesevenreal.threesevenreal.model.DominoGameState;
import com.threesevenreal.threesevenreal.model.DominoRoom;
import com.threesevenreal.threesevenreal.service.DominoGameService;
import lombok.RequiredArgsConstructor;

import java.util.HashMap;

import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@Controller
@RequiredArgsConstructor
public class DominoWebSocketController {

    private final DominoGameService dominoGameService;

    @MessageMapping("/domino/{roomId}/connect")
    public void handleConnect(
            @DestinationVariable String roomId,
            @Payload GameMessage message,
            SimpMessageHeaderAccessor headerAccessor) {

        headerAccessor.getSessionAttributes().put("playerId", message.getPlayerId());
        headerAccessor.getSessionAttributes().put("roomId", roomId);
        dominoGameService.resendStateIfPlaying(roomId, message.getPlayerId());
    }

    @MessageMapping("/domino/{roomId}/action")
    public void handleAction(
            @DestinationVariable String roomId,
            @Payload DominoActionDTO action) {
        try {
            String actionType = action.getAction();
            if ("PLAY".equals(actionType)) {
                dominoGameService.playTile(roomId, action.getPlayerId(), action.getTileIndex(), action.getSide());
            } else if ("DRAW".equals(actionType)) {
                dominoGameService.drawTile(roomId, action.getPlayerId());
            } else if ("PASS".equals(actionType)) {
                dominoGameService.passTurn(roomId, action.getPlayerId());
            } else if ("SURRENDER".equals(actionType)) {
                dominoGameService.surrender(roomId, action.getPlayerId());
            } else if ("ABANDON".equals(actionType)) {
                dominoGameService.abandonGame(roomId, action.getPlayerId());
            } else {
                throw new RuntimeException("Acción de dominó no válida");
            }
        } catch (Exception e) {
            GameMessage errorMsg = GameMessage.builder()
                    .type("ERROR")
                    .roomId(roomId)
                    .playerId(action.getPlayerId())
                    .message(e.getMessage())
                    .timestamp(System.currentTimeMillis())
                    .build();
            dominoGameService.sendPersonalMessage(roomId, action.getPlayerId(), errorMsg);
        }
    }

    @MessageMapping("/domino/{roomId}/chat")
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
        dominoGameService.sendGeneralMessage(roomId, chatMsg);
    }

    @GetMapping("/domino/rooms/{roomId}/state")
    public ResponseEntity<?> getRoomState(@PathVariable String roomId) {
        DominoRoom room = dominoRoomRepository.findById(roomId)
            .orElseThrow(() -> new RuntimeException("Sala no encontrada"));
        
        Map<String, Object> response = new HashMap<>();
        response.put("status", room.getStatus());
        
        if ("PLAYING".equals(room.getStatus())) {
            DominoGameState state = objectMapper.readValue(room.getGameState(), DominoGameState.class);
            response.put("gameState", dominoGameService.buildStateDTO(state, "Estado actual"));
        }
        
        return ResponseEntity.ok(response);
    }
}
