package com.threesevenreal.threesevenreal.service;

import com.threesevenreal.threesevenreal.dto.PlayerStatsDTO;
import com.threesevenreal.threesevenreal.model.User;
import com.threesevenreal.threesevenreal.repository.UserRepository;
import com.threesevenreal.threesevenreal.service.LobbyStatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StatsService {

    private final UserRepository userRepository;
    private final LobbyStatsService lobbyStatsService;

    public void registerResult(String playerId, String status) {
        User user = userRepository.findById(playerId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        user.setGamesPlayed(user.getGamesPlayed() + 1);

        if (status.equals("PLAYER_WIN")) {
            user.setWins(user.getWins() + 1);
            user.setWinStreak(user.getWinStreak() + 1);
            if (user.getWinStreak() > user.getMaxWinStreak()) {
                user.setMaxWinStreak(user.getWinStreak());
            }
        } else if (status.equals("BOT_WIN") || status.equals("DEALER_WIN") || status.equals("PLAYER_FOLD") || status.equals("PLAYER_LOSE")) {
            user.setLosses(user.getLosses() + 1);
            user.setWinStreak(0);
        }

        userRepository.save(user);
        lobbyStatsService.incrementGamesToday();
        lobbyStatsService.broadcastStats();
        lobbyStatsService.sendPersonalStats(user.getUsername());
    }

    public PlayerStatsDTO getStats(String playerId) {
        User user = userRepository.findById(playerId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        double winRate = user.getGamesPlayed() > 0
                ? (double) user.getWins() / user.getGamesPlayed() * 100
                : 0;

        return PlayerStatsDTO.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .avatarSymbol(user.getAvatarSymbol())
                .wins(user.getWins())
                .losses(user.getLosses())
                .gamesPlayed(user.getGamesPlayed())
                .winRate(Math.round(winRate * 100.0) / 100.0)
                .winStreak(user.getWinStreak())
                .maxWinStreak(user.getMaxWinStreak())
                .build();
    }

    public PlayerStatsDTO getStatsByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        return getStats(user.getId());
    }

    public List<PlayerStatsDTO> getRanking() {
        return userRepository.findAll().stream()
                .sorted((a, b) -> Integer.compare(b.getWins(), a.getWins()))
                .limit(10)
                .map(user -> {
                    double winRate = user.getGamesPlayed() > 0
                            ? (double) user.getWins() / user.getGamesPlayed() * 100
                            : 0;
                    return PlayerStatsDTO.builder()
                            .userId(user.getId())
                            .username(user.getUsername())
                            .avatarSymbol(user.getAvatarSymbol())
                            .wins(user.getWins())
                            .losses(user.getLosses())
                            .gamesPlayed(user.getGamesPlayed())
                            .winRate(Math.round(winRate * 100.0) / 100.0)
                            .winStreak(user.getWinStreak())
                            .maxWinStreak(user.getMaxWinStreak())
                            .build();
                })
                .toList();
    }
}