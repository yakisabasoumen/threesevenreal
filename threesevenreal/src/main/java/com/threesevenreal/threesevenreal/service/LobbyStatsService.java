package com.threesevenreal.threesevenreal.service;

import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.threesevenreal.threesevenreal.repository.UserRepository;

import java.time.LocalDate;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class LobbyStatsService {

    private final SimpMessagingTemplate messagingTemplate;
    private final UserRepository userRepository;

    private final Set<String> connectedUsers = ConcurrentHashMap.newKeySet();
    private LocalDate lastReset = LocalDate.now();
    private int gamesToday = 0;

    public LobbyStatsService(SimpMessagingTemplate messagingTemplate, UserRepository userRepository) {
        this.messagingTemplate = messagingTemplate;
        this.userRepository = userRepository;
    }

    public void userConnected(String username) {
        connectedUsers.add(username);
        broadcastStats();
    }

    public void userDisconnected(String username) {
        connectedUsers.remove(username);
        broadcastStats();
    }

    public void incrementGamesToday() {
        if (!LocalDate.now().equals(lastReset)) {
            gamesToday = 0;
            lastReset = LocalDate.now();
        }
        gamesToday++;
        broadcastStats();
    }

    public void broadcastStats() {
        StatsDTO dto = new StatsDTO(
                connectedUsers.size(),
                gamesToday
        );

        messagingTemplate.convertAndSend("/topic/lobby.stats", dto);
    }

    public void sendPersonalStats(String username) {
        userRepository.findByUsername(username).ifPresent(user -> {
            PersonalStatsDTO personal = new PersonalStatsDTO(
                    user.getWinStreak(),
                    user.getMaxWinStreak()
            );
            messagingTemplate.convertAndSendToUser(username, "/queue/lobby.stats", personal);
        });
    }

    @Data
    public static class StatsDTO {
        private final int playersOnline;
        private final int gamesToday;
    }

    @Data
    public static class PersonalStatsDTO {
        private final int winStreak;
        private final int maxWinStreak;
    }
}