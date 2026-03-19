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
@Document(collection = "threeseven_games")
public class ThreeSevenGame {

    @Id
    private String id;

    private String playerId;

    private List<Card> playerHand = new ArrayList<>();
    private List<Card> botHand = new ArrayList<>();
    private Deck deck;

    private String status; 

    private String playerHandRank;
    private String botHandRank;
    private int playerHandScore;
    private int botHandScore;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}