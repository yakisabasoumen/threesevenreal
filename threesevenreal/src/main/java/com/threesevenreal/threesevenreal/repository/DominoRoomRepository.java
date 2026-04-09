package com.threesevenreal.threesevenreal.repository;

import com.threesevenreal.threesevenreal.model.DominoRoom;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DominoRoomRepository extends MongoRepository<DominoRoom, String> {

    List<DominoRoom> findByStatus(String status);
    Optional<DominoRoom> findByIdAndStatus(String id, String status);
    List<DominoRoom> findByStatusAndMaxPlayers(String status, int maxPlayers);
}
