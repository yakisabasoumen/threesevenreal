package com.threesevenreal.threesevenreal.model;

import lombok.Data;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Data
public class Deck {

    private List<Card> cards = new ArrayList<>();

    public Deck() {
        String[] suits = {"HEARTS", "DIAMONDS", "CLUBS", "SPADES"};
        String[] ranks = {"2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"};

        for (String suit : suits) {
            for (String rank : ranks) {
                cards.add(new Card(suit, rank));
            }
        }
        Collections.shuffle(cards);
    }

    public Card dealCard() {
        if (cards.isEmpty()) {
            throw new RuntimeException("No quedan cartas en el mazo");
        }
        return cards.remove(0);
    }

    public int size() {
        return cards.size();
    }
}