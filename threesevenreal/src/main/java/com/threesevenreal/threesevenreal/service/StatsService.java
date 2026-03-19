package com.threesevenreal.threesevenreal.service;

import com.threesevenreal.threesevenreal.dto.PlayerStatsDTO;
import com.threesevenreal.threesevenreal.model.User;
import com.threesevenreal.threesevenreal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StatsService {

    private final UserRepository userRepository;

    public void registerResult(String playerId, String status) {
        User user = userRepository.findById(playerId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        user.setGamesPlayed(user.getGamesPlayed() + 1);

        if (status.equals("PLAYER_WIN")) {
            user.setWins(user.getWins() + 1);
        } else if (status.equals("BOT_WIN") || status.equals("DEALER_WIN") || status.equals("PLAYER_FOLD")) {
            user.setLosses(user.getLosses() + 1);
        }

        userRepository.save(user);
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
                .wins(user.getWins())
                .losses(user.getLosses())
                .gamesPlayed(user.getGamesPlayed())
                .winRate(Math.round(winRate * 100.0) / 100.0)
                .build();
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
                            .wins(user.getWins())
                            .losses(user.getLosses())
                            .gamesPlayed(user.getGamesPlayed())
                            .winRate(Math.round(winRate * 100.0) / 100.0)
                            .build();
                })
                .toList();
    }
}