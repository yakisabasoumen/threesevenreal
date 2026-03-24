package com.threesevenreal.threesevenreal.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.*;

@Data
@NoArgsConstructor
@Document(collection = "blackjack_games")
public class BlackjackGame {

    @Id
    private String id;

    private String playerId;

    // ── Single-player (se mantiene para no romper modo offline) ──
    private List<Card> playerHand = new ArrayList<>();
    private int playerScore;

    // ── Online: mano y score por playerId ──
    private Map<String, List<Card>> playerHands = new HashMap<>();
    private Map<String, Integer> playerScores = new HashMap<>();

    // FIX #4: rastrear qué jugadores ya han plantado (STAND)
    // El dealer solo juega cuando TODOS han plantado o se han pasado de 21
    private Set<String> standingPlayers = new HashSet<>();

    // ── Compartido ──
    private List<Card> dealerHand = new ArrayList<>();
    private Deck deck;
    private int dealerScore;
    private String status; // PLAYING, FINISHED

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Recalcula dealer (online y offline)
    public void calculateScores() {
        this.playerScore = calculateHandScore(playerHand);
        this.dealerScore = calculateHandScore(dealerHand);
    }

    // Recalcula score de un jugador online concreto
    public void recalculatePlayerScore(String pid) {
        List<Card> hand = playerHands.get(pid);
        if (hand != null) {
            playerScores.put(pid, calculateHandScore(hand));
        }
    }

    public static int calculateHandScore(List<Card> hand) {
        int score = 0;
        int aces = 0;
        for (Card card : hand) {
            score += card.getValue();
            if (card.getRank().equals("A")) aces++;
        }
        while (score > 21 && aces > 0) {
            score -= 10;
            aces--;
        }
        return score;
    }
}