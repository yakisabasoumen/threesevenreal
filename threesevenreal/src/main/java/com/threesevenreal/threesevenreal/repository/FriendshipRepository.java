package com.threesevenreal.threesevenreal.repository;

import com.threesevenreal.threesevenreal.model.Friendship;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FriendshipRepository extends MongoRepository<Friendship, String> {

    // Buscar amistad entre dos usuarios (bidireccional)
    @Query("{ $or: [ { 'senderId': ?0, 'receiverId': ?1 }, { 'senderId': ?1, 'receiverId': ?0 } ] }")
    Optional<Friendship> findByUsers(String userId1, String userId2);

    // Solicitudes enviadas por un usuario
    List<Friendship> findBySenderIdAndStatus(String senderId, Friendship.FriendshipStatus status);

    // Solicitudes recibidas por un usuario
    List<Friendship> findByReceiverIdAndStatus(String receiverId, Friendship.FriendshipStatus status);

    // Amigos de un usuario (aceptadas)
    @Query("{ $and: [ { $or: [ { 'senderId': ?0 }, { 'receiverId': ?0 } ] }, { 'status': 'ACCEPTED' } ] }")
    List<Friendship> findFriendsByUserId(String userId);
}