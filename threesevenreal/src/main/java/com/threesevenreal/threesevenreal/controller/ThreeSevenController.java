package com.threesevenreal.threesevenreal.controller;

import com.threesevenreal.threesevenreal.dto.ThreeSevenStateDTO;
import com.threesevenreal.threesevenreal.model.User;
import com.threesevenreal.threesevenreal.service.ThreeSevenService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/threeseven")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class ThreeSevenController {

    private final ThreeSevenService threeSevenService;

    @PostMapping("/start")
    public ResponseEntity<ThreeSevenStateDTO> startGame(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(threeSevenService.startGame(user.getId()));
    }
}