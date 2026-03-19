package com.threesevenreal.threesevenreal.service;

import com.threesevenreal.threesevenreal.dto.PokerStateDTO;
import com.threesevenreal.threesevenreal.model.Card;
import com.threesevenreal.threesevenreal.model.Deck;
import com.threesevenreal.threesevenreal.model.PokerGame;
import com.threesevenreal.threesevenreal.repository.PokerGameRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class PokerService {

    private final PokerGameRepository pokerGameRepository;
    private final StatsService statsService;

    public PokerStateDTO startGame(String playerId) {
        PokerGame game = new PokerGame();
        game.setPlayerId(playerId);
        game.setDeck(new Deck());
        game.setPhase("PREFLOP");
        game.setStatus("PLAYING");
        game.setCreatedAt(LocalDateTime.now());
        game.setUpdatedAt(LocalDateTime.now());

        // Repartir 2 cartas a cada jugador
        game.getPlayerHand().add(game.getDeck().dealCard());
        game.getBotHand().add(game.getDeck().dealCard());
        game.getPlayerHand().add(game.getDeck().dealCard());
        game.getBotHand().add(game.getDeck().dealCard());

        pokerGameRepository.save(game);

        return buildState(game, "Partida iniciada. Tus cartas han sido repartidas. Check o Fold.");
    }

    public PokerStateDTO check(String gameId) {
        PokerGame game = getActiveGame(gameId);

        switch (game.getPhase()) {
            case "PREFLOP" -> {
                // Revelar flop (3 cartas)
                game.getCommunityCards().add(game.getDeck().dealCard());
                game.getCommunityCards().add(game.getDeck().dealCard());
                game.getCommunityCards().add(game.getDeck().dealCard());
                game.setPhase("FLOP");
                pokerGameRepository.save(game);
                return buildState(game, "Flop revelado. Check o Fold.");
            }
            case "FLOP" -> {
                // Revelar turn (1 carta)
                game.getCommunityCards().add(game.getDeck().dealCard());
                game.setPhase("TURN");
                pokerGameRepository.save(game);
                return buildState(game, "Turn revelado. Check o Fold.");
            }
            case "TURN" -> {
                // Revelar river (1 carta)
                game.getCommunityCards().add(game.getDeck().dealCard());
                game.setPhase("RIVER");
                pokerGameRepository.save(game);
                return buildState(game, "River revelado. Check para ver el resultado.");
            }
            case "RIVER" -> {
                // Showdown
                return showdown(game);
            }
            default -> throw new RuntimeException("Fase desconocida: " + game.getPhase());
        }
    }

    public PokerStateDTO fold(String gameId) {
        PokerGame game = getActiveGame(gameId);
        game.setStatus("PLAYER_FOLD");
        game.setUpdatedAt(LocalDateTime.now());
        pokerGameRepository.save(game);
        statsService.registerResult(game.getPlayerId(), "PLAYER_FOLD");
        return buildState(game, "Te has retirado. El bot gana.");
    }

    private PokerStateDTO showdown(PokerGame game) {
        List<Card> playerBest = getBestHand(game.getPlayerHand(), game.getCommunityCards());
        List<Card> botBest = getBestHand(game.getBotHand(), game.getCommunityCards());

        HandResult playerResult = evaluateHand(playerBest);
        HandResult botResult = evaluateHand(botBest);

        game.setPlayerHandRank(playerResult.rank());
        game.setBotHandRank(botResult.rank());

        String status;
        String message;

        if (playerResult.score() > botResult.score()) {
            status = "PLAYER_WIN";
            message = "Has ganado con " + playerResult.rank() + " vs " + botResult.rank() + " del bot!";
        } else if (botResult.score() > playerResult.score()) {
            status = "BOT_WIN";
            message = "El bot gana con " + botResult.rank() + " vs tu " + playerResult.rank() + ".";
        } else {
            status = "PUSH";
            message = "Empate! Ambos tienen " + playerResult.rank();
        }

        game.setStatus(status);
        game.setPhase("SHOWDOWN");
        game.setUpdatedAt(LocalDateTime.now());
        pokerGameRepository.save(game);
        statsService.registerResult(game.getPlayerId(), status);

        return PokerStateDTO.builder()
                .gameId(game.getId())
                .playerHand(game.getPlayerHand())
                .botHand(game.getBotHand())
                .communityCards(game.getCommunityCards())
                .status(status)
                .phase(game.getPhase())
                .playerHandRank(playerResult.rank())
                .botHandRank(botResult.rank())
                .message(message)
                .build();
    }

    private List<Card> getBestHand(List<Card> holeCards, List<Card> community) {
        List<Card> all = new ArrayList<>();
        all.addAll(holeCards);
        all.addAll(community);

        List<List<Card>> combinations = new ArrayList<>();
        getCombinations(all, 5, 0, new ArrayList<>(), combinations);

        return combinations.stream()
                .max((a, b) -> Integer.compare(
                        evaluateHand(a).score(),
                        evaluateHand(b).score()))
                .orElse(all.subList(0, 5));
    }

    private void getCombinations(List<Card> cards, int k, int start,
                                  List<Card> current, List<List<Card>> result) {
        if (current.size() == k) {
            result.add(new ArrayList<>(current));
            return;
        }
        for (int i = start; i < cards.size(); i++) {
            current.add(cards.get(i));
            getCombinations(cards, k, i + 1, current, result);
            current.remove(current.size() - 1);
        }
    }

    private HandResult evaluateHand(List<Card> hand) {
        Map<String, Long> rankCount = hand.stream()
                .collect(Collectors.groupingBy(Card::getRank, Collectors.counting()));
        Map<String, Long> suitCount = hand.stream()
                .collect(Collectors.groupingBy(Card::getSuit, Collectors.counting()));

        boolean isFlush = suitCount.size() == 1;
        boolean isStraight = isStraight(hand);
        long maxCount = rankCount.values().stream().mapToLong(Long::longValue).max().orElse(0);
        long pairs = rankCount.values().stream().filter(v -> v == 2).count();

        if (isFlush && isStraight) {
            List<Integer> values = hand.stream().map(Card::getValue).sorted().toList();
            if (values.get(4) == 14) return new HandResult("Escalera Real", 900);
            return new HandResult("Escalera de Color", 800);
        }
        if (maxCount == 4) return new HandResult("Poker", 700);
        if (maxCount == 3 && pairs == 1) return new HandResult("Full House", 600);
        if (isFlush) return new HandResult("Color", 500);
        if (isStraight) return new HandResult("Escalera", 400);
        if (maxCount == 3) return new HandResult("Trio", 300);
        if (pairs == 2) return new HandResult("Doble Pareja", 200);
        if (pairs == 1) return new HandResult("Pareja", 100);

        int highCard = hand.stream().mapToInt(Card::getValue).max().orElse(0);
        return new HandResult("Carta Alta (" + highCard + ")", highCard);
    }

    private boolean isStraight(List<Card> hand) {
        List<Integer> values = hand.stream()
                .map(Card::getValue)
                .distinct()
                .sorted()
                .toList();
        if (values.size() < 5) return false;
        for (int i = 1; i < values.size(); i++) {
            if (values.get(i) != values.get(i - 1) + 1) return false;
        }
        return true;
    }

    private PokerGame getActiveGame(String gameId) {
        PokerGame game = pokerGameRepository.findById(gameId)
                .orElseThrow(() -> new RuntimeException("Partida no encontrada"));
        if (!game.getStatus().equals("PLAYING")) {
            throw new RuntimeException("La partida ya ha terminado");
        }
        return game;
    }

    private PokerStateDTO buildState(PokerGame game, String message) {
        return PokerStateDTO.builder()
                .gameId(game.getId())
                .playerHand(game.getPlayerHand())
                .botHand(null)
                .communityCards(game.getCommunityCards())
                .status(game.getStatus())
                .phase(game.getPhase())
                .playerHandRank(game.getPlayerHandRank())
                .botHandRank(null)
                .message(message)
                .build();
    }

    private record HandResult(String rank, int score) {}
}