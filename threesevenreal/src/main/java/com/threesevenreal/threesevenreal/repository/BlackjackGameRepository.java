package com.threesevenreal.threesevenreal.repository;

import com.threesevenreal.threesevenreal.model.BlackjackGame;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BlackjackGameRepository extends MongoRepository<BlackjackGame, String> {

    List<BlackjackGame> findByPlayerId(String playerId);
    List<BlackjackGame> findByPlayerIdAndStatus(String playerId, String status);
}