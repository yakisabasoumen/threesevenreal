package com.threesevenreal.threesevenreal.dto;

import com.threesevenreal.threesevenreal.model.Card;
import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
@Builder
public class ThreeSevenOnlineStateDTO {

    private String gameId;

    // Mano propia (siempre visible)
    private List<Card> myHand;
    private String     myHandRank;
    private int        myHandScore;

    // Mano rival (null mientras PLAYING, revelada en FINISHED)
    private List<Card> opponentHand;
    private String     opponentHandRank;
    private int        opponentHandScore;
    private String     opponentUsername;

    // Estado de turno
    private String  status;              // PLAYING | PLAYER_WIN | OPPONENT_WIN | PUSH
    private String  currentTurnUsername;
    private boolean isMyTurn;
    private String  message;
    private boolean canHit;
}