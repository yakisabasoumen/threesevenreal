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
@Document(collection = "poker_games")
public class PokerGame {

    @Id
    private String id;

    private String playerId;

    private List<Card> playerHand = new ArrayList<>();
    private List<Card> botHand = new ArrayList<>();
    private List<Card> communityCards = new ArrayList<>();
    private Deck deck;

    // PREFLOP, FLOP, TURN, RIVER, SHOWDOWN, PLAYER_WIN, BOT_WIN, PUSH, PLAYER_FOLD
    private String status;
    private String phase; // PREFLOP, FLOP, TURN, RIVER

    private String playerHandRank;
    private String botHandRank;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}