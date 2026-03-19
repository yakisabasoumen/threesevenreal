package com.threesevenreal.threesevenreal.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Card {

    private String suit;   // HEARTS, DIAMONDS, CLUBS, SPADES
    private String rank;   // 2-10, J, Q, K, A

    public int getValue() {
        return switch (rank) {
            case "J", "Q", "K" -> 10;
            case "A" -> 11;
            default -> Integer.parseInt(rank);
        };
    }

    @Override
    public String toString() {
        return rank + " of " + suit;
    }
}