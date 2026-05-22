package com.threesevenreal.threesevenreal.dto;

import com.threesevenreal.threesevenreal.model.Card;
import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class PokerOnlineStateDTO {

    private String gameId;
    private List<Card> myHand;
    private List<Card> opponentHand;     
    private String opponentUsername;
    private List<Card> communityCards;
    private String phase;          
    private String status;              
    private String currentTurnUsername;
    private boolean isMyTurn;
    private boolean canCheck;
    private String myHandRank;           
    private String opponentHandRank;    
    private String message;
}