package com.threesevenreal.threesevenreal.service;

import com.threesevenreal.threesevenreal.dto.FriendshipDTO;
import com.threesevenreal.threesevenreal.dto.FriendshipStatusDTO;
import com.threesevenreal.threesevenreal.dto.UserSearchDTO;
import com.threesevenreal.threesevenreal.model.Friendship;
import com.threesevenreal.threesevenreal.model.User;
import com.threesevenreal.threesevenreal.repository.FriendshipRepository;
import com.threesevenreal.threesevenreal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FriendshipService {

    private final FriendshipRepository friendshipRepository;
    private final UserRepository userRepository;

    // Buscar usuarios por nombre o username
    public List<UserSearchDTO> searchUsers(String query, String currentUserId) {
        String normalizedQuery = query == null ? "" : query.trim().toLowerCase();

        List<User> users = userRepository.findAll().stream()
                .filter(user -> !user.getId().equals(currentUserId))
                .filter(user -> {
                    if (normalizedQuery.isBlank()) return true;
                    return user.getUsername().toLowerCase().contains(normalizedQuery) ||
                           user.getEmail().toLowerCase().contains(normalizedQuery);
                })
                .collect(Collectors.toList());

        return users.stream()
                .map(user -> UserSearchDTO.builder()
                        .id(user.getId())
                        .username(user.getUsername())
                        .avatarSymbol(user.getAvatarSymbol())
                        .wins(user.getWins())
                        .losses(user.getLosses())
                        .build())
                .collect(Collectors.toList());
    }

    // Enviar solicitud de amistad
    public FriendshipDTO sendFriendRequest(String senderId, String receiverId) {
        if (senderId.equals(receiverId)) {
            throw new RuntimeException("No puedes enviarte una solicitud a ti mismo");
        }

        Optional<Friendship> existing = friendshipRepository.findByUsers(senderId, receiverId);
        if (existing.isPresent()) {
            throw new RuntimeException("Ya existe una relación de amistad");
        }

        Friendship friendship = Friendship.builder()
                .senderId(senderId)
                .receiverId(receiverId)
                .status(Friendship.FriendshipStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        friendship = friendshipRepository.save(friendship);

        User sender = userRepository.findById(senderId).orElseThrow();
        User receiver = userRepository.findById(receiverId).orElseThrow();

        return mapToDTO(friendship, sender, receiver);
    }

    // Aceptar solicitud
    public FriendshipDTO acceptFriendRequest(String friendshipId, String userId) {
        Friendship friendship = friendshipRepository.findById(friendshipId)
                .orElseThrow(() -> new RuntimeException("Solicitud no encontrada"));

        if (!friendship.getReceiverId().equals(userId)) {
            throw new RuntimeException("No autorizado");
        }

        if (friendship.getStatus() != Friendship.FriendshipStatus.PENDING) {
            throw new RuntimeException("Solicitud ya procesada");
        }

        friendship.setStatus(Friendship.FriendshipStatus.ACCEPTED);
        friendship.setUpdatedAt(LocalDateTime.now());
        friendship = friendshipRepository.save(friendship);

        User sender = userRepository.findById(friendship.getSenderId()).orElseThrow();
        User receiver = userRepository.findById(friendship.getReceiverId()).orElseThrow();

        return mapToDTO(friendship, sender, receiver);
    }

    // Rechazar solicitud
    public void rejectFriendRequest(String friendshipId, String userId) {
        Friendship friendship = friendshipRepository.findById(friendshipId)
                .orElseThrow(() -> new RuntimeException("Solicitud no encontrada"));

        if (!friendship.getReceiverId().equals(userId)) {
            throw new RuntimeException("No autorizado");
        }

        friendship.setStatus(Friendship.FriendshipStatus.REJECTED);
        friendship.setUpdatedAt(LocalDateTime.now());
        friendshipRepository.save(friendship);
    }

    // Cancelar solicitud enviada
    public void cancelFriendRequest(String friendshipId, String userId) {
        Friendship friendship = friendshipRepository.findById(friendshipId)
                .orElseThrow(() -> new RuntimeException("Solicitud no encontrada"));

        if (!friendship.getSenderId().equals(userId)) {
            throw new RuntimeException("No autorizado");
        }

        if (friendship.getStatus() != Friendship.FriendshipStatus.PENDING) {
            throw new RuntimeException("No se puede cancelar");
        }

        friendshipRepository.delete(friendship);
    }

    // Listar solicitudes recibidas
    public List<FriendshipDTO> getReceivedRequests(String userId) {
        List<Friendship> friendships = friendshipRepository.findByReceiverIdAndStatus(userId, Friendship.FriendshipStatus.PENDING);
        return friendships.stream()
                .map(f -> {
                    User sender = userRepository.findById(f.getSenderId()).orElseThrow();
                    User receiver = userRepository.findById(f.getReceiverId()).orElseThrow();
                    return mapToDTO(f, sender, receiver);
                })
                .collect(Collectors.toList());
    }

    // Listar solicitudes enviadas
    public List<FriendshipDTO> getSentRequests(String userId) {
        List<Friendship> friendships = friendshipRepository.findBySenderIdAndStatus(userId, Friendship.FriendshipStatus.PENDING);
        return friendships.stream()
                .map(f -> {
                    User sender = userRepository.findById(f.getSenderId()).orElseThrow();
                    User receiver = userRepository.findById(f.getReceiverId()).orElseThrow();
                    return mapToDTO(f, sender, receiver);
                })
                .collect(Collectors.toList());
    }

    // Listar amigos
    public List<UserSearchDTO> getFriends(String userId) {
        List<Friendship> friendships = friendshipRepository.findFriendsByUserId(userId);
        return friendships.stream()
                .map(f -> {
                    String friendId = f.getSenderId().equals(userId) ? f.getReceiverId() : f.getSenderId();
                    User friend = userRepository.findById(friendId).orElseThrow();
                    return UserSearchDTO.builder()
                            .id(friend.getId())
                            .username(friend.getUsername())
                            .avatarSymbol(friend.getAvatarSymbol())
                            .wins(friend.getWins())
                            .losses(friend.getLosses())
                            .build();
                })
                .collect(Collectors.toList());
    }

    // Eliminar amigo
    public void removeFriend(String friendId, String userId) {
        Optional<Friendship> friendship = friendshipRepository.findByUsers(userId, friendId);
        if (friendship.isPresent() && friendship.get().getStatus() == Friendship.FriendshipStatus.ACCEPTED) {
            friendshipRepository.delete(friendship.get());
        } else {
            throw new RuntimeException("No son amigos");
        }
    }

    // Comprobar estado
    public FriendshipStatusDTO getFriendshipStatus(String userId, String otherUserId) {
        Optional<Friendship> friendship = friendshipRepository.findByUsers(userId, otherUserId);
        if (friendship.isEmpty()) {
            return FriendshipStatusDTO.builder().status("NONE").build();
        }

        Friendship f = friendship.get();
        String status;
        if (f.getStatus() == Friendship.FriendshipStatus.ACCEPTED) {
            status = "FRIENDS";
        } else if (f.getSenderId().equals(userId)) {
            status = "PENDING_SENT";
        } else {
            status = "PENDING_RECEIVED";
        }

        return FriendshipStatusDTO.builder()
                .status(status)
                .friendshipId(f.getId())
                .build();
    }

    private FriendshipDTO mapToDTO(Friendship friendship, User sender, User receiver) {
        return FriendshipDTO.builder()
                .id(friendship.getId())
                .senderId(friendship.getSenderId())
                .senderUsername(sender.getUsername())
                .receiverId(friendship.getReceiverId())
                .receiverUsername(receiver.getUsername())
                .status(friendship.getStatus().toString())
                .createdAt(friendship.getCreatedAt())
                .updatedAt(friendship.getUpdatedAt())
                .build();
    }
}