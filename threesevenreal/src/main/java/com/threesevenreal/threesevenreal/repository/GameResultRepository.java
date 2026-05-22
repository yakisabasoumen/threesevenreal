// src/main/java/com/threesevenreal/threesevenreal/repository/GameResultRepository.java
package com.threesevenreal.threesevenreal.repository;

import com.threesevenreal.threesevenreal.model.GameResult;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface GameResultRepository extends MongoRepository<GameResult, String> {
    List<GameResult> findByGameType(String gameType);
}