package com.threesevenreal.threesevenreal.model;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Data
@NoArgsConstructor
public class ThreeSevenOnlineGame {

    private Deck deck = new Deck();
    private Map<String, List<Card>> playerHands = new HashMap<>();
    private Map<String, String>     handRanks   = new HashMap<>();
    private Map<String, Integer>    handScores  = new HashMap<>();
    private Set<String>             standingPlayers = new HashSet<>();
    private Set<String>             playersWhoHit   = new HashSet<>();  
    private String status = "PLAYING"; 
}