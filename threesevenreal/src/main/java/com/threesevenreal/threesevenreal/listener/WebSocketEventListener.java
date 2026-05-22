package com.threesevenreal.threesevenreal.listener;

import com.threesevenreal.threesevenreal.service.GameRoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Component
@RequiredArgsConstructor
public class WebSocketEventListener {

    private final GameRoomService gameRoomService;

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        // Recupera el playerId que guardaste en la sesión al conectar
        String playerId = (String) headerAccessor.getSessionAttributes().get("playerId");
        if (playerId != null) {
            gameRoomService.handlePlayerDisconnect(playerId);
        }
    }
}