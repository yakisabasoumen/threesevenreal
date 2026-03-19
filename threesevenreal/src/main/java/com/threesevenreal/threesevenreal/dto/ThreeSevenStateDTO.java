package com.threesevenreal.threesevenreal.dto;

import com.threesevenreal.threesevenreal.model.Card;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ThreeSevenStateDTO {

    private String gameId;
    private List<Card> playerHand;
    private List<Card> botHand;
    private String status;
    private String playerHandRank;
    private String botHandRank;
    private int playerHandScore;
    private int botHandScore;
    private String message;
}