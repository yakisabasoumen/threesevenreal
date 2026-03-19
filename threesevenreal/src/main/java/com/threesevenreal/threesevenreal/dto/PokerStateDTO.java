package com.threesevenreal.threesevenreal.dto;

import com.threesevenreal.threesevenreal.model.Card;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class PokerStateDTO {

    private String gameId;
    private List<Card> playerHand;
    private List<Card> botHand;
    private List<Card> communityCards;
    private String status;
    private String phase;
    private String playerHandRank;
    private String botHandRank;
    private String message;
}