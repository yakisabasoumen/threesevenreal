package com.threesevenreal.threesevenreal.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DominoTile {

    private int left;
    private int right;

    public boolean isDouble() {
        return left == right;
    }

    public int getPipSum() {
        return left + right;
    }

    public DominoTile flipped() {
        return new DominoTile(right, left);
    }

    public boolean matches(int value) {
        return left == value || right == value;
    }

    @Override
    public String toString() {
        return left + "|" + right;
    }
}
