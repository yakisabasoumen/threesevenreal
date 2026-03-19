package com.threesevenreal.threesevenreal.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.threesevenreal.threesevenreal.dto.BlackjackStateDTO;
import com.threesevenreal.threesevenreal.dto.GameMessage;
import com.threesevenreal.threesevenreal.dto.GameRoomDTO;
import com.threesevenreal.threesevenreal.dto.ThreeSevenStateDTO;
import com.threesevenreal.threesevenreal.model.BlackjackGame;
import com.threesevenreal.threesevenreal.model.Deck;
import com.threesevenreal.threesevenreal.model.GameRoom;
import com.threesevenreal.threesevenreal.model.User;
import com.threesevenreal.threesevenreal.repository.GameRoomRepository;
import com.threesevenreal.threesevenreal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GameRoomService {

    private final GameRoomRepository gameRoomRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final BlackjackService blackjackService;
    private final ObjectMapper objectMapper;

    public GameRoomDTO createRoom(String gameType, String playerId) {
        User user = userRepository.findById(playerId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        int maxPlayers = gameType.equals("POKER") ? 2 : 2;

        GameRoom room = new GameRoom();
        room.setGameType(gameType);
        room.setStatus("WAITING");
        room.setMaxPlayers(maxPlayers);
        room.setCurrentRound(0);
        room.setCreatedAt(LocalDateTime.now());
        room.setUpdatedAt(LocalDateTime.now());
        room.getPlayerIds().add(playerId);
        room.getPlayerUsernames().add(user.getUsername());

        gameRoomRepository.save(room);

        return buildRoomDTO(room, "Sala creada. Esperando jugadores...");
    }

    public GameRoomDTO joinRoom(String roomId, String playerId) {
        User user = userRepository.findById(playerId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        GameRoom room = gameRoomRepository.findByIdAndStatus(roomId, "WAITING")
                .orElseThrow(() -> new RuntimeException("Sala no encontrada o ya iniciada"));

        if (room.getPlayerIds().contains(playerId)) {
            throw new RuntimeException("Ya estas en esta sala");
        }

        if (room.getPlayerIds().size() >= room.getMaxPlayers()) {
            throw new RuntimeException("La sala esta llena");
        }

        room.getPlayerIds().add(playerId);
        room.getPlayerUsernames().add(user.getUsername());
        room.setUpdatedAt(LocalDateTime.now());

        // Si la sala esta llena, iniciar la partida
        if (room.getPlayerIds().size() == room.getMaxPlayers()) {
            startOnlineGame(room);
        } else {
            gameRoomRepository.save(room);
        }

        // Notificar a todos en la sala
        GameMessage joinMsg = GameMessage.builder()
                .type("JOIN")
                .roomId(room.getId())
                .username(user.getUsername())
                .message(user.getUsername() + " se ha unido a la sala.")
                .timestamp(System.currentTimeMillis())
                .build();
        messagingTemplate.convertAndSend("/topic/room/" + room.getId(), joinMsg);

        return buildRoomDTO(room, "Te has unido a la sala.");
    }

    private void startOnlineGame(GameRoom room) {
        room.setStatus("PLAYING");
        room.setCurrentTurnPlayerId(room.getPlayerIds().get(0));
        room.setUpdatedAt(LocalDateTime.now());

        if (room.getGameType().equals("BLACKJACK")) {
            BlackjackGame game = new BlackjackGame();
            game.setPlayerId(room.getPlayerIds().get(0));
            game.setDeck(new Deck());
            game.setStatus("PLAYING");
            game.setCreatedAt(LocalDateTime.now());
            game.setUpdatedAt(LocalDateTime.now());

            game.getPlayerHand().add(game.getDeck().dealCard());
            game.getDealerHand().add(game.getDeck().dealCard());
            game.getPlayerHand().add(game.getDeck().dealCard());
            game.getDealerHand().add(game.getDeck().dealCard());
            game.calculateScores();

            try {
                room.setGameState(objectMapper.writeValueAsString(game));
            } catch (Exception e) {
                throw new RuntimeException("Error serializando estado del juego");
            }
        }

        gameRoomRepository.save(room);

        // Notificar inicio de partida
        GameMessage startMsg = GameMessage.builder()
                .type("GAME_START")
                .roomId(room.getId())
                .message("La partida ha comenzado! Turno de: " + room.getPlayerUsernames().get(0))
                .payload(buildRoomDTO(room, "Partida iniciada"))
                .timestamp(System.currentTimeMillis())
                .build();
        messagingTemplate.convertAndSend("/topic/room/" + room.getId(), startMsg);
    }

    public List<GameRoomDTO> getAvailableRooms(String gameType) {
        return gameRoomRepository.findByGameTypeAndStatus(gameType, "WAITING")
                .stream()
                .map(room -> buildRoomDTO(room, "Sala disponible"))
                .toList();
    }

    public void handleAction(String roomId, String playerId, String action) {
        GameRoom room = gameRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Sala no encontrada"));

        if (!room.getStatus().equals("PLAYING")) {
            throw new RuntimeException("La partida no esta en curso");
        }

        if (!room.getCurrentTurnPlayerId().equals(playerId)) {
            throw new RuntimeException("No es tu turno");
        }

        User user = userRepository.findById(playerId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        // Procesar la accion segun el tipo de juego
        Object result = processAction(room, playerId, action);

        // Notificar a todos en la sala
        GameMessage actionMsg = GameMessage.builder()
                .type("ACTION")
                .roomId(roomId)
                .playerId(playerId)
                .username(user.getUsername())
                .action(action)
                .payload(result)
                .message(user.getUsername() + " ha realizado: " + action)
                .timestamp(System.currentTimeMillis())
                .build();
        messagingTemplate.convertAndSend("/topic/room/" + roomId, actionMsg);
    }

    private Object processAction(GameRoom room, String playerId, String action) {
        try {
            if (room.getGameType().equals("BLACKJACK")) {
                BlackjackGame game = objectMapper.readValue(room.getGameState(), BlackjackGame.class);

                BlackjackGame updated;
                if (action.equals("HIT")) {
                    game.getPlayerHand().add(game.getDeck().dealCard());
                    game.calculateScores();
                    if (game.getPlayerScore() > 21) game.setStatus("DEALER_WIN");
                } else if (action.equals("STAND")) {
                    while (game.getDealerScore() < 17) {
                        game.getDealerHand().add(game.getDeck().dealCard());
                        game.calculateScores();
                    }
                    if (game.getDealerScore() > 21 || game.getPlayerScore() > game.getDealerScore()) {
                        game.setStatus("PLAYER_WIN");
                    } else if (game.getDealerScore() > game.getPlayerScore()) {
                        game.setStatus("DEALER_WIN");
                    } else {
                        game.setStatus("PUSH");
                    }
                }

                if (!game.getStatus().equals("PLAYING")) {
                    room.setStatus("FINISHED");
                }

                room.setGameState(objectMapper.writeValueAsString(game));
                room.setUpdatedAt(LocalDateTime.now());
                gameRoomRepository.save(room);

                return BlackjackStateDTO.builder()
                        .gameId(room.getId())
                        .playerHand(game.getPlayerHand())
                        .dealerHand(game.getStatus().equals("PLAYING")
                                ? List.of(game.getDealerHand().get(0))
                                : game.getDealerHand())
                        .playerScore(game.getPlayerScore())
                        .dealerScore(game.getStatus().equals("PLAYING")
                                ? game.getDealerHand().get(0).getValue()
                                : game.getDealerScore())
                        .status(game.getStatus())
                        .message(game.getStatus().equals("PLAYER_WIN") ? "Ganaste!"
                                : game.getStatus().equals("DEALER_WIN") ? "El dealer gana."
                                : game.getStatus().equals("PUSH") ? "Empate!"
                                : "Carta repartida.")
                        .build();
            }

            return "Accion procesada";
        } catch (Exception e) {
            throw new RuntimeException("Error procesando accion: " + e.getMessage());
        }
    }

    private GameRoomDTO buildRoomDTO(GameRoom room, String message) {
        String currentTurnUsername = null;
        if (room.getCurrentTurnPlayerId() != null) {
            int idx = room.getPlayerIds().indexOf(room.getCurrentTurnPlayerId());
            if (idx >= 0 && idx < room.getPlayerUsernames().size()) {
                currentTurnUsername = room.getPlayerUsernames().get(idx);
            }
        }

        return GameRoomDTO.builder()
                .roomId(room.getId())
                .gameType(room.getGameType())
                .status(room.getStatus())
                .playerUsernames(room.getPlayerUsernames())
                .maxPlayers(room.getMaxPlayers())
                .currentPlayers(room.getPlayerIds().size())
                .currentTurnUsername(currentTurnUsername)
                .message(message)
                .build();
    }
}