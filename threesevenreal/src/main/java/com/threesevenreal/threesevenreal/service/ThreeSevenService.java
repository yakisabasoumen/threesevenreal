package com.threesevenreal.threesevenreal.service;

import com.threesevenreal.threesevenreal.dto.ThreeSevenStateDTO;
import com.threesevenreal.threesevenreal.model.Card;
import com.threesevenreal.threesevenreal.model.Deck;
import com.threesevenreal.threesevenreal.model.ThreeSevenGame;
import com.threesevenreal.threesevenreal.repository.ThreeSevenGameRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ThreeSevenService {

    private final ThreeSevenGameRepository threeSevenGameRepository;
    private final StatsService statsService;

    public ThreeSevenStateDTO startGame(String playerId) {

        ThreeSevenGame game = new ThreeSevenGame();
        game.setPlayerId(playerId);
        game.setDeck(new Deck());
        game.setCreatedAt(LocalDateTime.now());
        game.setUpdatedAt(LocalDateTime.now());

        // Repartir 3 cartas a cada uno
        for (int i = 0; i < 3; i++) {
            game.getPlayerHand().add(game.getDeck().dealCard());
            game.getBotHand().add(game.getDeck().dealCard());
        }

        // Evaluar manos
        HandResult playerResult = evaluateHand(game.getPlayerHand());
        HandResult botResult = evaluateHand(game.getBotHand());

        game.setPlayerHandRank(playerResult.rank());
        game.setBotHandRank(botResult.rank());
        game.setPlayerHandScore(playerResult.score());
        game.setBotHandScore(botResult.score());

        // Determinar ganador
        String status = determineWinner(playerResult, botResult);
        game.setStatus(status);

        threeSevenGameRepository.save(game);
        statsService.registerResult(playerId, status);

        String message = switch (status) {
            case "PLAYER_WIN" -> "Has ganado con " + playerResult.rank() + "!";
            case "BOT_WIN" -> "El bot gana con " + botResult.rank() + ".";
            case "PUSH" -> "Empate!";
            default -> "";
        };

        return buildState(game, message);
    }

    private HandResult evaluateHand(List<Card> hand) {

        // Tres cartas iguales (mismo rank)
        boolean threeOfAKind = hand.get(0).getRank().equals(hand.get(1).getRank())
                && hand.get(1).getRank().equals(hand.get(2).getRank());
        if (threeOfAKind) return new HandResult("Tres iguales", 100);

        // Agrupar por palo
        Map<String, List<Card>> bySuit = hand.stream()
                .collect(Collectors.groupingBy(Card::getSuit));

        // Tres cartas del mismo palo
        if (bySuit.size() == 1) {
            List<Card> sameSuit = bySuit.values().iterator().next();
            int sum = sameSuit.stream().mapToInt(Card::getValue).sum();

            // Escalera de color (tres cartas consecutivas del mismo palo)
            if (isSequential(sameSuit)) return new HandResult("Escalera de color", 90);

            // Suma exacta de 7 del mismo palo
            if (sum == 7) return new HandResult("Siete de color", 80);

            // Suma exacta de 3 del mismo palo
            if (sum == 3) return new HandResult("Tres de color", 75);

            // Mismo palo generico — puntuación basada en cercanía a 7
            int distanceTo7 = Math.abs(7 - sum);
            return new HandResult("Color (" + sum + ")", 50 - distanceTo7);
        }

        // Pareja
        String rank0 = hand.get(0).getRank();
        String rank1 = hand.get(1).getRank();
        String rank2 = hand.get(2).getRank();
        if (rank0.equals(rank1) || rank1.equals(rank2) || rank0.equals(rank2)) {
            return new HandResult("Pareja", 40);
        }

        // Carta más alta (sin combinación)
        int highCard = hand.stream().mapToInt(Card::getValue).max().orElse(0);
        return new HandResult("Carta alta (" + highCard + ")", highCard);
    }

    private boolean isSequential(List<Card> cards) {
        List<Integer> values = cards.stream()
                .map(Card::getValue)
                .sorted()
                .toList();
        return values.get(1) == values.get(0) + 1
                && values.get(2) == values.get(1) + 1;
    }

    private String determineWinner(HandResult player, HandResult bot) {
        if (player.score() > bot.score()) return "PLAYER_WIN";
        if (bot.score() > player.score()) return "BOT_WIN";
        return "PUSH";
    }

    private ThreeSevenStateDTO buildState(ThreeSevenGame game, String message) {
        return ThreeSevenStateDTO.builder()
                .gameId(game.getId())
                .playerHand(game.getPlayerHand())
                .botHand(game.getBotHand())
                .status(game.getStatus())
                .playerHandRank(game.getPlayerHandRank())
                .botHandRank(game.getBotHandRank())
                .playerHandScore(game.getPlayerHandScore())
                .botHandScore(game.getBotHandScore())
                .message(message)
                .build();
    }

    private record HandResult(String rank, int score) {}
}