package com.threesevenreal.threesevenreal.controller;

import com.threesevenreal.threesevenreal.dto.PokerStateDTO;
import com.threesevenreal.threesevenreal.model.User;
import com.threesevenreal.threesevenreal.service.PokerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/poker")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class PokerController {

    private final PokerService pokerService;

    @PostMapping("/start")
    public ResponseEntity<PokerStateDTO> startGame(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(pokerService.startGame(user.getId()));
    }

    @PostMapping("/{gameId}/check")
    public ResponseEntity<PokerStateDTO> check(
            @PathVariable String gameId) {
        return ResponseEntity.ok(pokerService.check(gameId));
    }

    @PostMapping("/{gameId}/fold")
    public ResponseEntity<PokerStateDTO> fold(
            @PathVariable String gameId) {
        return ResponseEntity.ok(pokerService.fold(gameId));
    }
}