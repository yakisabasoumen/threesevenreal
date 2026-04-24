package com.threesevenreal.threesevenreal.controller;

import com.threesevenreal.threesevenreal.dto.DominoRoomDTO;
import com.threesevenreal.threesevenreal.model.User;
import com.threesevenreal.threesevenreal.service.DominoGameService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/domino")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class DominoController {

    private final DominoGameService dominoGameService;

    @PostMapping("/create")
    public ResponseEntity<DominoRoomDTO> createRoom(
            @RequestParam(defaultValue = "2") int maxPlayers,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(dominoGameService.createRoom(user.getId(), maxPlayers));
    }

    @PostMapping("/join/{roomId}")
    public ResponseEntity<?> joinRoom(
            @PathVariable String roomId,
            @AuthenticationPrincipal User user) {
        try {
            return ResponseEntity.ok(dominoGameService.joinRoom(roomId, user.getId()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/rooms")
    public ResponseEntity<List<DominoRoomDTO>> getAvailableRooms(@RequestParam(defaultValue = "2") int maxPlayers) {
        return ResponseEntity.ok(dominoGameService.getAvailableRooms(maxPlayers));
    }

    @GetMapping("/rooms/all")
    public ResponseEntity<List<DominoRoomDTO>> getAllAvailableRooms() {
        return ResponseEntity.ok(dominoGameService.getAvailableRooms());
    }

    // ← NUEVO: polling de respaldo para el creador
    @GetMapping("/rooms/{roomId}/state")
    public ResponseEntity<?> getRoomState(
            @PathVariable String roomId,
            @AuthenticationPrincipal User user) {
        try {
            return ResponseEntity.ok(dominoGameService.getRoomState(roomId, user.getId()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", e.getMessage()));
        }
    }
}