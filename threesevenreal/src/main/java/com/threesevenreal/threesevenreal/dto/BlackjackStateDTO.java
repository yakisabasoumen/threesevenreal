package com.threesevenreal.threesevenreal.dto;

import com.threesevenreal.threesevenreal.model.Card;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class BlackjackStateDTO {

    private String gameId;
    private List<Card> playerHand;
    private List<Card> dealerHand;
    private int playerScore;
    private int dealerScore;

    private List<Card> opponentHand;
    private int opponentScore;
    private String opponentUsername;
    private boolean isMyTurn;

    private String status;       
    private String message;
    private String currentTurnUsername; 
}