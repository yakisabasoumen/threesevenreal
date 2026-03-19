package com.threesevenreal.threesevenreal.controller;

import com.threesevenreal.threesevenreal.dto.GameRoomDTO;
import com.threesevenreal.threesevenreal.model.User;
import com.threesevenreal.threesevenreal.service.GameRoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class GameRoomController {

    private final GameRoomService gameRoomService;

    @PostMapping("/create/{gameType}")
    public ResponseEntity<GameRoomDTO> createRoom(
            @PathVariable String gameType,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(gameRoomService.createRoom(gameType.toUpperCase(), user.getId()));
    }

    @PostMapping("/join/{roomId}")
    public ResponseEntity<GameRoomDTO> joinRoom(
            @PathVariable String roomId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(gameRoomService.joinRoom(roomId, user.getId()));
    }

    @GetMapping("/available/{gameType}")
    public ResponseEntity<List<GameRoomDTO>> getAvailableRooms(
            @PathVariable String gameType) {
        return ResponseEntity.ok(gameRoomService.getAvailableRooms(gameType.toUpperCase()));
    }
}