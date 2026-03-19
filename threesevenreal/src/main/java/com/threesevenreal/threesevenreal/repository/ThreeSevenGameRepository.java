package com.threesevenreal.threesevenreal.repository;

import com.threesevenreal.threesevenreal.model.ThreeSevenGame;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ThreeSevenGameRepository extends MongoRepository<ThreeSevenGame, String> {

    List<ThreeSevenGame> findByPlayerId(String playerId);
    List<ThreeSevenGame> findByPlayerIdAndStatus(String playerId, String status);
}