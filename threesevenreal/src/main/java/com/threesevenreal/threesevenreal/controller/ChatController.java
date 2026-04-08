package com.threesevenreal.threesevenreal.controller;

import com.threesevenreal.threesevenreal.dto.ChatMessage;
import com.threesevenreal.threesevenreal.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    // REST: cargar historial al entrar al lobby
    @GetMapping("/history")
    public List<ChatMessage> getHistory() {
        return chatService.getRecentMessages();
    }

    // WebSocket: recibir mensaje del cliente
    @MessageMapping("/chat.send")
    public void sendMessage(@Payload Map<String, String> payload,
                            SimpMessageHeaderAccessor headerAccessor) {
        Principal principal = headerAccessor.getUser();
        if (principal == null) {
            System.out.println("[WS] chat.send rejected: user principal is null, headers=" + headerAccessor.getMessageHeaders());
            return;
        }

        String username = principal.getName();
        String content  = payload.get("content");

        if (content == null || content.isBlank() || content.length() > 200) return;

        // Verificar cooldown
        if (chatService.isOnCooldown(username)) {
            long remaining = chatService.getRemainingCooldown(username);
            // Manda error solo al usuario
            messagingTemplate.convertAndSendToUser(
                username, "/queue/chat.error",
                Map.of("error", "cooldown", "remaining", remaining)
            );
            return;
        }

        ChatMessage saved = chatService.saveMessage(username, content.trim());

        // Broadcast a todos en el lobby
        messagingTemplate.convertAndSend("/topic/lobby.chat", saved);
    }
}