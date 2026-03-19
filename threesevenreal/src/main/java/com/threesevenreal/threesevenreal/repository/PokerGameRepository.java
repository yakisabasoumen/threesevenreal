package com.threesevenreal.threesevenreal.repository;

import com.threesevenreal.threesevenreal.model.PokerGame;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PokerGameRepository extends MongoRepository<PokerGame, String> {

    List<PokerGame> findByPlayerId(String playerId);
    List<PokerGame> findByPlayerIdAndStatus(String playerId, String status);
}