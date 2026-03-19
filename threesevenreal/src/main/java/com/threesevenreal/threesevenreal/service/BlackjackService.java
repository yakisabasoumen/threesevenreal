package com.threesevenreal.threesevenreal.service;

import com.threesevenreal.threesevenreal.dto.BlackjackStateDTO;
import com.threesevenreal.threesevenreal.model.BlackjackGame;
import com.threesevenreal.threesevenreal.model.Card;
import com.threesevenreal.threesevenreal.model.Deck;
import com.threesevenreal.threesevenreal.repository.BlackjackGameRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BlackjackService {

    private final BlackjackGameRepository blackjackGameRepository;
    private final StatsService statsService;

    public BlackjackStateDTO startGame(String playerId) {

        BlackjackGame game = new BlackjackGame();
        game.setPlayerId(playerId);
        game.setDeck(new Deck());
        game.setStatus("PLAYING");
        game.setCreatedAt(LocalDateTime.now());
        game.setUpdatedAt(LocalDateTime.now());

        // Repartir 2 cartas a cada uno
        game.getPlayerHand().add(game.getDeck().dealCard());
        game.getDealerHand().add(game.getDeck().dealCard());
        game.getPlayerHand().add(game.getDeck().dealCard());
        game.getDealerHand().add(game.getDeck().dealCard());

        game.calculateScores();

        // Blackjack natural
        if (game.getPlayerScore() == 21) {
            game.setStatus("PLAYER_WIN");
            blackjackGameRepository.save(game);
            statsService.registerResult(game.getPlayerId(), "PLAYER_WIN");
            return buildState(game, "Blackjack! Has ganado!");
        }

        blackjackGameRepository.save(game);
        return buildState(game, "Partida iniciada. Pide carta o planta.");
    }

    public BlackjackStateDTO hit(String gameId) {

        BlackjackGame game = getActiveGame(gameId);

        game.getPlayerHand().add(game.getDeck().dealCard());
        game.calculateScores();
        game.setUpdatedAt(LocalDateTime.now());

        if (game.getPlayerScore() > 21) {
            game.setStatus("DEALER_WIN");
            blackjackGameRepository.save(game);
            return buildState(game, "Te has pasado de 21. El dealer gana.");
        }

        if (game.getPlayerScore() == 21) {
            return stand(gameId);
        }

        blackjackGameRepository.save(game);
        statsService.registerResult(game.getPlayerId(), "DEALER_WIN");
        return buildState(game, "Carta repartida.");
    }

    public BlackjackStateDTO stand(String gameId) {

        BlackjackGame game = getActiveGame(gameId);

        // El dealer pide cartas hasta llegar a 17
        while (game.getDealerScore() < 17) {
            game.getDealerHand().add(game.getDeck().dealCard());
            game.calculateScores();
        }

        game.setUpdatedAt(LocalDateTime.now());
        String result = determineWinner(game);
        game.setStatus(result);

        blackjackGameRepository.save(game);
        statsService.registerResult(game.getPlayerId(), game.getStatus());

        String message = switch (result) {
            case "PLAYER_WIN" -> "Has ganado!";
            case "DEALER_WIN" -> "El dealer gana.";
            case "PUSH" -> "Empate!";
            default -> "";
        };

        return buildState(game, message);
    }

    private String determineWinner(BlackjackGame game) {
        int playerScore = game.getPlayerScore();
        int dealerScore = game.getDealerScore();

        if (dealerScore > 21) return "PLAYER_WIN";
        if (playerScore > dealerScore) return "PLAYER_WIN";
        if (dealerScore > playerScore) return "DEALER_WIN";
        return "PUSH";
    }

    private BlackjackGame getActiveGame(String gameId) {
        BlackjackGame game = blackjackGameRepository.findById(gameId)
                .orElseThrow(() -> new RuntimeException("Partida no encontrada"));

        if (!game.getStatus().equals("PLAYING")) {
            throw new RuntimeException("La partida ya ha terminado");
        }
        return game;
    }

    private BlackjackStateDTO buildState(BlackjackGame game, String message) {

        List<Card> dealerVisible = game.getStatus().equals("PLAYING")
                ? List.of(game.getDealerHand().get(0))
                : game.getDealerHand();

        int dealerVisibleScore = game.getStatus().equals("PLAYING")
                ? game.getDealerHand().get(0).getValue()
                : game.getDealerScore();

        return BlackjackStateDTO.builder()
                .gameId(game.getId())
                .playerHand(game.getPlayerHand())
                .dealerHand(dealerVisible)
                .playerScore(game.getPlayerScore())
                .dealerScore(dealerVisibleScore)
                .status(game.getStatus())
                .message(message)
                .build();
    }
}