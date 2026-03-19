package com.threesevenreal.threesevenreal.controller;

import com.threesevenreal.threesevenreal.dto.PlayerStatsDTO;
import com.threesevenreal.threesevenreal.model.User;
import com.threesevenreal.threesevenreal.service.StatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class StatsController {

    private final StatsService statsService;

    @GetMapping("/me")
    public ResponseEntity<PlayerStatsDTO> getMyStats(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(statsService.getStats(user.getId()));
    }

    @GetMapping("/ranking")
    public ResponseEntity<List<PlayerStatsDTO>> getRanking() {
        return ResponseEntity.ok(statsService.getRanking());
    }
}