package com.threesevenreal.threesevenreal.controller;

import com.threesevenreal.threesevenreal.dto.UpdateProfileRequest;
import com.threesevenreal.threesevenreal.dto.UpdateProfileResponse;
import com.threesevenreal.threesevenreal.model.User;
import com.threesevenreal.threesevenreal.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    /**
     * PATCH /users/me
     * Actualiza username, password y/o avatarSymbol del usuario autenticado.
     * Requiere JWT válido en el header Authorization.
     */
    @PatchMapping("/me")
    public ResponseEntity<?> updateProfile(
            @RequestBody UpdateProfileRequest request
    ) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = (User) auth.getPrincipal();

        try {
            UpdateProfileResponse response = userService.updateProfile(currentUser, request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}