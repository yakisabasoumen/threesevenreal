package com.threesevenreal.threesevenreal.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.*;

@Data
@NoArgsConstructor
public class PokerOnlineGame {

    private Deck deck = new Deck();
    private Map<String, List<Card>> playerHands = new HashMap<>();
    private List<Card> communityCards = new ArrayList<>();
    private String phase = "PREFLOP"; 
    private String status = "PLAYING";
    private Set<String> foldedPlayers = new HashSet<>();
    private Set<String> checkedInPhase = new HashSet<>(); 
}