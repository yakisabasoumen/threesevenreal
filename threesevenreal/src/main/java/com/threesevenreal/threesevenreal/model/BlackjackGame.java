package com.threesevenreal.threesevenreal.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@Document(collection = "blackjack_games")
public class BlackjackGame {

    @Id
    private String id;

    private String playerId;

    private List<Card> playerHand = new ArrayList<>();
    private List<Card> dealerHand = new ArrayList<>();
    private Deck deck;

    private int playerScore;
    private int dealerScore;

    private String status; // PLAYING, PLAYER_WIN, DEALER_WIN, PUSH

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public void calculateScores() {
        this.playerScore = calculateHandScore(playerHand);
        this.dealerScore = calculateHandScore(dealerHand);
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