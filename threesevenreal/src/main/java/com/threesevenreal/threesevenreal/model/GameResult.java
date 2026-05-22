// src/main/java/com/threesevenreal/threesevenreal/model/GameResult.java
package com.threesevenreal.threesevenreal.model;

import lombok.Builder;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@Document(collection = "game_results")
public class GameResult {
    @Id
    private String id;
    private String roomId;
    private String gameType;
    private String winnerId;
    private String winnerUsername;
    private List<String> playerIds;
    private List<String> playerUsernames;
    private LocalDateTime playedAt;
}