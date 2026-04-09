package com.threesevenreal.threesevenreal.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DominoRoomDTO {

    private String roomId;
    private String status;
    private int currentPlayers;
    private int maxPlayers;
    private List<String> playerUsernames;
    private String message;
    private int pool;
}
