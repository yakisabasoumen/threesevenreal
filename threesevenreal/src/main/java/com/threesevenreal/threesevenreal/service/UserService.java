package com.threesevenreal.threesevenreal.service;

import com.threesevenreal.threesevenreal.dto.UpdateProfileRequest;
import com.threesevenreal.threesevenreal.dto.UpdateProfileResponse;
import com.threesevenreal.threesevenreal.model.User;
import com.threesevenreal.threesevenreal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Set;

@Service
@RequiredArgsConstructor
public class UserService {

    private static final Set<String> VALID_SYMBOLS = Set.of("♠", "♣", "♥", "♦");

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UpdateProfileResponse updateProfile(User currentUser, UpdateProfileRequest req) {

        if (hasText(req.getNewUsername())) {
            String newUsername = req.getNewUsername().trim();

            if (newUsername.length() < 3 || newUsername.length() > 20) {
                throw new IllegalArgumentException("El nombre debe tener entre 3 y 20 caracteres");
            }
            if (!newUsername.equals(currentUser.getUsername())
                    && userRepository.existsByUsername(newUsername)) {
                throw new IllegalArgumentException("Ese nombre de usuario ya está en uso");
            }
            currentUser.setUsername(newUsername);
        }

        if (hasText(req.getNewPassword())) {
            if (!hasText(req.getCurrentPassword())) {
                throw new IllegalArgumentException("Debes introducir tu contraseña actual");
            }
            if (!passwordEncoder.matches(req.getCurrentPassword(), currentUser.getPassword())) {
                throw new IllegalArgumentException("La contraseña actual es incorrecta");
            }
            if (req.getNewPassword().length() < 6) {
                throw new IllegalArgumentException("La nueva contraseña debe tener al menos 6 caracteres");
            }
            currentUser.setPassword(passwordEncoder.encode(req.getNewPassword()));
        }

        if (hasText(req.getAvatarSymbol())) {
            if (!VALID_SYMBOLS.contains(req.getAvatarSymbol())) {
                throw new IllegalArgumentException("Símbolo no válido");
            }
            currentUser.setAvatarSymbol(req.getAvatarSymbol());
        }

        if (req.getAvatarImage() != null) {
            currentUser.setAvatarImage(req.getAvatarImage().isBlank() ? null : req.getAvatarImage());
        }

        userRepository.save(currentUser);

        return UpdateProfileResponse.builder()
                .username(currentUser.getUsername())
                .avatarSymbol(currentUser.getAvatarSymbol())
                .message("Perfil actualizado correctamente")
                .build();
    }

    private boolean hasText(String s) {
        return s != null && !s.isBlank();
    }
}