package com.threesevenreal.threesevenreal.controller;

import com.threesevenreal.threesevenreal.dto.GameMessage;
import com.threesevenreal.threesevenreal.service.GameRoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
public class GameWebSocketController {

    private final GameRoomService gameRoomService;
    private final SimpMessagingTemplate messagingTemplate;

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