package com.threesevenreal.threesevenreal.service;

import com.threesevenreal.threesevenreal.dto.PlayerStatsDTO;
import com.threesevenreal.threesevenreal.model.GameResult;
import com.threesevenreal.threesevenreal.model.User;
import com.threesevenreal.threesevenreal.repository.GameResultRepository;
import com.threesevenreal.threesevenreal.repository.UserRepository;
import com.threesevenreal.threesevenreal.service.LobbyStatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.HashMap;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StatsService {

    private final UserRepository userRepository;
    private final LobbyStatsService lobbyStatsService;
    private final GameResultRepository gameResultRepository;

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
        } else if (status.equals("BOT_WIN") || status.equals("DEALER_WIN") || status.equals("PLAYER_FOLD")
                || status.equals("PLAYER_LOSE")) {
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
                .avatarImage(user.getAvatarImage())
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
                            .avatarImage(user.getAvatarImage())
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

    public List<PlayerStatsDTO> getRankingByGame(String gameType) {
        List<GameResult> results = gameResultRepository.findByGameType(gameType);

        // Total games per player in this game type
        Map<String, Integer> gamesPlayed = new HashMap<>();
        for (GameResult r : results) {
            for (String pid : r.getPlayerIds()) {
                gamesPlayed.merge(pid, 1, Integer::sum);
            }
        }

        // Wins per player in this game type
        Map<String, Integer> wins = new HashMap<>();
        for (GameResult r : results) {
            if (r.getWinnerId() != null) {
                wins.merge(r.getWinnerId(), 1, Integer::sum);
            }
        }

        // Build one DTO per player who played at least once
        return gamesPlayed.keySet().stream()
                .map(pid -> {
                    int w = wins.getOrDefault(pid, 0);
                    int g = gamesPlayed.get(pid);
                    double winRate = Math.round((double) w / g * 10000.0) / 100.0;

                    // Get username + avatar from DB
                    return userRepository.findById(pid)
                            .map(user -> PlayerStatsDTO.builder()
                                    .userId(pid)
                                    .username(user.getUsername())
                                    .avatarSymbol(user.getAvatarSymbol())
                                    .avatarImage(user.getAvatarImage())
                                    .wins(w)
                                    .losses(g - w)
                                    .gamesPlayed(g)
                                    .winRate(winRate)
                                    .winStreak(0) // not tracked per-game
                                    .maxWinStreak(0)
                                    .build())
                            .orElse(null);
                })
                .filter(dto -> dto != null)
                .sorted((a, b) -> Integer.compare(b.getWins(), a.getWins()))
                .limit(10)
                .toList();
    }
}