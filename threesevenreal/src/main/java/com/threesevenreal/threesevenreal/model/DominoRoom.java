package com.threesevenreal.threesevenreal.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@Document(collection = "domino_rooms")
public class DominoRoom {

    @Id
    private String id;
    private String status;
    private int maxPlayers;
    private List<String> playerIds = new ArrayList<>();
    private List<String> playerUsernames = new ArrayList<>();
    private String gameState;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
