package com.threesevenreal.threesevenreal.controller;

import com.threesevenreal.threesevenreal.service.LobbyStatsService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
@RequiredArgsConstructor
public class LobbyController {

    private final LobbyStatsService lobbyStats;

    @MessageMapping("/lobby.connect")
    public void connect(Principal principal, @Payload ConnectDTO dto) {
        if (principal == null) return;
        lobbyStats.userConnected(principal.getName());
        lobbyStats.sendPersonalStats(principal.getName());
    }

    @MessageMapping("/lobby.disconnect")
    public void disconnect(Principal principal, @Payload ConnectDTO dto) {
        if (principal == null) return;
        lobbyStats.userDisconnected(principal.getName());
    }

    @Data
    public static class ConnectDTO {
        private String username;
    }
}
