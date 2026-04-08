package com.threesevenreal.threesevenreal.controller;

import com.threesevenreal.threesevenreal.dto.FriendshipDTO;
import com.threesevenreal.threesevenreal.dto.FriendshipStatusDTO;
import com.threesevenreal.threesevenreal.dto.UserSearchDTO;
import com.threesevenreal.threesevenreal.model.User;
import com.threesevenreal.threesevenreal.repository.UserRepository;
import com.threesevenreal.threesevenreal.service.FriendshipService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/friends")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class FriendshipController {

    private final FriendshipService friendshipService;
    private final UserRepository userRepository;

    private String getUserId(Authentication auth) {
        String username = auth.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        return user.getId();
    }

    // Buscar usuarios
    @GetMapping("/search")
    public ResponseEntity<List<UserSearchDTO>> searchUsers(@RequestParam String query, Authentication auth) {
        String userId = getUserId(auth);
        List<UserSearchDTO> users = friendshipService.searchUsers(query, userId);
        return ResponseEntity.ok(users);
    }

    // Enviar solicitud
    @PostMapping("/request")
    public ResponseEntity<FriendshipDTO> sendFriendRequest(@RequestBody Map<String, String> body, Authentication auth) {
        String senderId = getUserId(auth);
        String receiverId = body.get("receiverId");
        FriendshipDTO friendship = friendshipService.sendFriendRequest(senderId, receiverId);
        return ResponseEntity.ok(friendship);
    }

    // Aceptar solicitud
    @PostMapping("/{friendshipId}/accept")
    public ResponseEntity<FriendshipDTO> acceptFriendRequest(@PathVariable String friendshipId, Authentication auth) {
        String userId = getUserId(auth);
        FriendshipDTO friendship = friendshipService.acceptFriendRequest(friendshipId, userId);
        return ResponseEntity.ok(friendship);
    }

    // Rechazar solicitud
    @PostMapping("/{friendshipId}/reject")
    public ResponseEntity<Void> rejectFriendRequest(@PathVariable String friendshipId, Authentication auth) {
        String userId = getUserId(auth);
        friendshipService.rejectFriendRequest(friendshipId, userId);
        return ResponseEntity.ok().build();
    }

    // Cancelar solicitud
    @DeleteMapping("/request/{friendshipId}")
    public ResponseEntity<Void> cancelFriendRequest(@PathVariable String friendshipId, Authentication auth) {
        String userId = getUserId(auth);
        friendshipService.cancelFriendRequest(friendshipId, userId);
        return ResponseEntity.ok().build();
    }

    // Listar solicitudes recibidas
    @GetMapping("/requests/received")
    public ResponseEntity<List<FriendshipDTO>> getReceivedRequests(Authentication auth) {
        String userId = getUserId(auth);
        List<FriendshipDTO> requests = friendshipService.getReceivedRequests(userId);
        return ResponseEntity.ok(requests);
    }

    // Listar solicitudes enviadas
    @GetMapping("/requests/sent")
    public ResponseEntity<List<FriendshipDTO>> getSentRequests(Authentication auth) {
        String userId = getUserId(auth);
        List<FriendshipDTO> requests = friendshipService.getSentRequests(userId);
        return ResponseEntity.ok(requests);
    }

    // Listar amigos
    @GetMapping
    public ResponseEntity<List<UserSearchDTO>> getFriends(Authentication auth) {
        String userId = getUserId(auth);
        List<UserSearchDTO> friends = friendshipService.getFriends(userId);
        return ResponseEntity.ok(friends);
    }

    // Eliminar amigo
    @DeleteMapping("/{friendId}")
    public ResponseEntity<Void> removeFriend(@PathVariable String friendId, Authentication auth) {
        String userId = getUserId(auth);
        friendshipService.removeFriend(friendId, userId);
        return ResponseEntity.ok().build();
    }

    // Comprobar estado
    @GetMapping("/status/{otherUserId}")
    public ResponseEntity<FriendshipStatusDTO> getFriendshipStatus(@PathVariable String otherUserId, Authentication auth) {
        String userId = getUserId(auth);
        FriendshipStatusDTO status = friendshipService.getFriendshipStatus(userId, otherUserId);
        return ResponseEntity.ok(status);
    }
}