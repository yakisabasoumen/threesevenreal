package com.threesevenreal.threesevenreal.controller;

import com.threesevenreal.threesevenreal.dto.BlackjackStateDTO;
import com.threesevenreal.threesevenreal.model.User;
import com.threesevenreal.threesevenreal.service.BlackjackService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/blackjack")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class BlackjackController {

    private final BlackjackService blackjackService;

    @PostMapping("/start")
    public ResponseEntity<BlackjackStateDTO> startGame(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(blackjackService.startGame(user.getId()));
    }

    @PostMapping("/{gameId}/hit")
    public ResponseEntity<BlackjackStateDTO> hit(
            @PathVariable String gameId) {
        return ResponseEntity.ok(blackjackService.hit(gameId));
    }

    @PostMapping("/{gameId}/stand")
    public ResponseEntity<BlackjackStateDTO> stand(
            @PathVariable String gameId) {
        return ResponseEntity.ok(blackjackService.stand(gameId));
    }
}