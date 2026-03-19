package com.threesevenreal.threesevenreal.repository;

import com.threesevenreal.threesevenreal.model.GameRoom;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GameRoomRepository extends MongoRepository<GameRoom, String> {

    List<GameRoom> findByGameTypeAndStatus(String gameType, String status);
    List<GameRoom> findByStatus(String status);
    Optional<GameRoom> findByIdAndStatus(String id, String status);
}