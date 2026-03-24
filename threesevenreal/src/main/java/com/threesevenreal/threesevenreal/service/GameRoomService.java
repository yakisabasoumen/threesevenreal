package com.threesevenreal.threesevenreal.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.threesevenreal.threesevenreal.dto.BlackjackStateDTO;
import com.threesevenreal.threesevenreal.dto.GameMessage;
import com.threesevenreal.threesevenreal.dto.GameRoomDTO;
import com.threesevenreal.threesevenreal.model.BlackjackGame;
import com.threesevenreal.threesevenreal.model.Card;
import com.threesevenreal.threesevenreal.model.Deck;
import com.threesevenreal.threesevenreal.model.GameRoom;
import com.threesevenreal.threesevenreal.model.User;
import com.threesevenreal.threesevenreal.repository.GameRoomRepository;
import com.threesevenreal.threesevenreal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GameRoomService {

    private final GameRoomRepository gameRoomRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;

    // ──────────────────────────────────────────
    // CREAR SALA
    // ──────────────────────────────────────────
    public GameRoomDTO createRoom(String gameType, String playerId) {
        User user = userRepository.findById(playerId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        GameRoom room = new GameRoom();
        room.setGameType(gameType);
        room.setStatus("WAITING");
        room.setMaxPlayers(2);
        room.setCurrentRound(0);
        room.setCreatedAt(LocalDateTime.now());
        room.setUpdatedAt(LocalDateTime.now());
        room.getPlayerIds().add(playerId);
        room.getPlayerUsernames().add(user.getUsername());

        gameRoomRepository.save(room);
        return buildRoomDTO(room, "Sala creada. Esperando jugadores...");
    }

    // ──────────────────────────────────────────
    // UNIRSE A SALA
    // ──────────────────────────────────────────
    public GameRoomDTO joinRoom(String roomId, String playerId) {
        User user = userRepository.findById(playerId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        GameRoom room = gameRoomRepository.findByIdAndStatus(roomId, "WAITING")
                .orElseThrow(() -> new RuntimeException("Sala no encontrada o ya iniciada"));

        if (room.getPlayerIds().contains(playerId))
            throw new RuntimeException("Ya estás en esta sala");

        if (room.getPlayerIds().size() >= room.getMaxPlayers())
            throw new RuntimeException("La sala está llena");

        room.getPlayerIds().add(playerId);
        room.getPlayerUsernames().add(user.getUsername());
        room.setUpdatedAt(LocalDateTime.now());

        if (room.getPlayerIds().size() == room.getMaxPlayers()) {
            startOnlineGame(room);
        } else {
            gameRoomRepository.save(room);
        }

        // Notificar JOIN a todos en la sala
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

    // ──────────────────────────────────────────
    // INICIAR PARTIDA ONLINE
    // ──────────────────────────────────────────
    private void startOnlineGame(GameRoom room) {
        room.setStatus("PLAYING");
        // El primer jugador en la lista empieza
        room.setCurrentTurnPlayerId(room.getPlayerIds().get(0));
        room.setUpdatedAt(LocalDateTime.now());

        if (room.getGameType().equals("BLACKJACK")) {
            BlackjackGame game = new BlackjackGame();
            game.setDeck(new Deck());
            game.setStatus("PLAYING");
            game.setCreatedAt(LocalDateTime.now());
            game.setUpdatedAt(LocalDateTime.now());

            // Repartir 2 cartas a cada jugador
            for (String pid : room.getPlayerIds()) {
                List<Card> hand = new ArrayList<>();
                hand.add(game.getDeck().dealCard());
                hand.add(game.getDeck().dealCard());
                game.getPlayerHands().put(pid, hand);
                game.getPlayerScores().put(pid, BlackjackGame.calculateHandScore(hand));
            }

            // Repartir 2 cartas al dealer
            game.getDealerHand().add(game.getDeck().dealCard());
            game.getDealerHand().add(game.getDeck().dealCard());
            game.setDealerScore(BlackjackGame.calculateHandScore(game.getDealerHand()));

            try {
                room.setGameState(objectMapper.writeValueAsString(game));
            } catch (Exception e) {
                throw new RuntimeException("Error serializando estado del juego");
            }
        }

        gameRoomRepository.save(room);

        // Notificar GAME_START con el DTO de sala
        GameMessage startMsg = GameMessage.builder()
                .type("GAME_START")
                .roomId(room.getId())
                .message("¡La partida ha comenzado! Turno de: " + room.getPlayerUsernames().get(0))
                .payload(buildRoomDTO(room, "Partida iniciada"))
                .timestamp(System.currentTimeMillis())
                .build();
        messagingTemplate.convertAndSend("/topic/room/" + room.getId(), startMsg);

        // Enviar a cada jugador su estado inicial personalizado
        try {
            BlackjackGame game = objectMapper.readValue(room.getGameState(), BlackjackGame.class);
            broadcastPersonalizedState(room, game);
        } catch (Exception e) {
            throw new RuntimeException("Error enviando estado inicial");
        }
    }

    // ──────────────────────────────────────────
    // FIX #1: REENVIAR ESTADO AL RECONECTAR
    // Si un jugador se conecta por WebSocket y la partida ya está en curso,
    // le enviamos su estado personalizado para que no vea la pantalla vacía.
    // Llamado desde GameWebSocketController.handleConnect()
    // ──────────────────────────────────────────
    public void resendStateIfPlaying(String roomId, String playerId) {
        gameRoomRepository.findById(roomId).ifPresent(room -> {
            if (!"PLAYING".equals(room.getStatus())) return;
            if (room.getGameState() == null) return;
            if (!room.getPlayerIds().contains(playerId)) return;

            try {
                BlackjackGame game = objectMapper.readValue(room.getGameState(), BlackjackGame.class);
                broadcastPersonalizedStateToPlayer(room, game, playerId);
            } catch (Exception e) {
                // No lanzar excepción — es un reenvío de cortesía
                System.err.println("resendStateIfPlaying error: " + e.getMessage());
            }
        });
    }

    // ──────────────────────────────────────────
    // SALAS DISPONIBLES
    // ──────────────────────────────────────────
    public List<GameRoomDTO> getAvailableRooms(String gameType) {
        return gameRoomRepository.findByGameTypeAndStatus(gameType, "WAITING")
                .stream()
                .map(room -> buildRoomDTO(room, "Sala disponible"))
                .toList();
    }

    // ──────────────────────────────────────────
    // MANEJAR ACCIÓN
    // ──────────────────────────────────────────
    public void handleAction(String roomId, String playerId, String action) {
        GameRoom room = gameRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Sala no encontrada"));

        if (!room.getStatus().equals("PLAYING"))
            throw new RuntimeException("La partida no está en curso");

        if (!room.getCurrentTurnPlayerId().equals(playerId))
            throw new RuntimeException("No es tu turno");

        User user = userRepository.findById(playerId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        processAction(room, playerId, action);

        // Notificar al chat que alguien realizó una acción
        GameMessage actionNotice = GameMessage.builder()
                .type("ACTION_NOTICE")
                .roomId(roomId)
                .username(user.getUsername())
                .message(user.getUsername() + " ha realizado: " + action)
                .timestamp(System.currentTimeMillis())
                .build();
        messagingTemplate.convertAndSend("/topic/room/" + roomId, actionNotice);
    }

    // ──────────────────────────────────────────
    // PROCESAR ACCIÓN Y CAMBIAR TURNO
    // FIX #4: el dealer solo juega cuando TODOS los jugadores han
    // plantado (STAND) o se han pasado de 21, no solo cuando uno planta.
    // ──────────────────────────────────────────
    private void processAction(GameRoom room, String playerId, String action) {
        try {
            BlackjackGame game = objectMapper.readValue(room.getGameState(), BlackjackGame.class);
            boolean gameOver = false;

            if (action.equals("HIT")) {
                // Dar carta al jugador actual
                List<Card> hand = game.getPlayerHands().get(playerId);
                hand.add(game.getDeck().dealCard());
                game.recalculatePlayerScore(playerId);

                int score = game.getPlayerScores().get(playerId);
                if (score > 21) {
                    // FIX #4: jugador se pasó — marcarlo como "terminado"
                    // pero no acabar la partida hasta que todos terminen
                    game.getStandingPlayers().add(playerId);
                }

            } else if (action.equals("STAND")) {
                // FIX #4: marcar este jugador como plantado
                game.getStandingPlayers().add(playerId);
            }

            // FIX #4: comprobar si todos los jugadores ya han terminado su turno
            // (plantados o pasados de 21) para que el dealer juegue
            boolean allPlayersDone = room.getPlayerIds().stream()
                    .allMatch(pid ->
                            game.getStandingPlayers().contains(pid) ||
                            game.getPlayerScores().getOrDefault(pid, 0) > 21
                    );

            if (allPlayersDone) {
                // Dealer juega ahora que todos han terminado
                while (game.getDealerScore() < 17) {
                    game.getDealerHand().add(game.getDeck().dealCard());
                    game.setDealerScore(BlackjackGame.calculateHandScore(game.getDealerHand()));
                }
                game.setStatus("FINISHED");
                room.setStatus("FINISHED");
                gameOver = true;
            } else {
                // FIX #2 (parte backend): avanzar al siguiente jugador que aún
                // no haya plantado ni se haya pasado de 21
                List<String> players = room.getPlayerIds();
                int currentIdx = players.indexOf(playerId);
                boolean turnAssigned = false;

                for (int i = 1; i < players.size(); i++) {
                    String candidate = players.get((currentIdx + i) % players.size());
                    boolean candidateDone =
                            game.getStandingPlayers().contains(candidate) ||
                            game.getPlayerScores().getOrDefault(candidate, 0) > 21;

                    if (!candidateDone) {
                        room.setCurrentTurnPlayerId(candidate);
                        turnAssigned = true;
                        break;
                    }
                }

                // Salvaguarda: si por algún motivo no se asignó turno, terminar
                if (!turnAssigned) {
                    game.setStatus("FINISHED");
                    room.setStatus("FINISHED");
                    gameOver = true;
                }
            }

            room.setGameState(objectMapper.writeValueAsString(game));
            room.setUpdatedAt(LocalDateTime.now());
            gameRoomRepository.save(room);

            // Enviar estado personalizado a cada jugador
            broadcastPersonalizedState(room, game);

        } catch (Exception e) {
            throw new RuntimeException("Error procesando acción: " + e.getMessage());
        }
    }

    // ──────────────────────────────────────────
    // BROADCAST PERSONALIZADO (cada jugador ve su mano)
    // ──────────────────────────────────────────
    private void broadcastPersonalizedState(GameRoom room, BlackjackGame game) {
        for (String pid : room.getPlayerIds()) {
            broadcastPersonalizedStateToPlayer(room, game, pid);
        }
    }

    // FIX #1: extraído para poder reutilizarlo en resendStateIfPlaying()
    private void broadcastPersonalizedStateToPlayer(GameRoom room, BlackjackGame game, String pid) {
        // Calcular el username del turno actual
        String currentTurnUsername = null;
        if (room.getCurrentTurnPlayerId() != null) {
            int idx = room.getPlayerIds().indexOf(room.getCurrentTurnPlayerId());
            if (idx >= 0) currentTurnUsername = room.getPlayerUsernames().get(idx);
        }

        boolean isPlaying = "PLAYING".equals(game.getStatus());

        List<Card> myHand = game.getPlayerHands().get(pid);
        int myScore = game.getPlayerScores().getOrDefault(pid, 0);

        // Determinar resultado personal
        String personalStatus;
        if (isPlaying) {
            personalStatus = "PLAYING";
        } else if (myScore > 21) {
            personalStatus = "DEALER_WIN";
        } else if (game.getDealerScore() > 21 || myScore > game.getDealerScore()) {
            personalStatus = "PLAYER_WIN";
        } else if (game.getDealerScore() > myScore) {
            personalStatus = "DEALER_WIN";
        } else {
            personalStatus = "PUSH";
        }

        // Dealer oculto mientras se juega (solo primera carta visible)
        List<Card> visibleDealerHand = isPlaying
                ? List.of(game.getDealerHand().get(0))
                : game.getDealerHand();
        int visibleDealerScore = isPlaying
                ? game.getDealerHand().get(0).getValue()
                : game.getDealerScore();

        BlackjackStateDTO dto = BlackjackStateDTO.builder()
                .gameId(room.getId())
                .playerHand(myHand)
                .dealerHand(visibleDealerHand)
                .playerScore(myScore)
                .dealerScore(visibleDealerScore)
                .status(personalStatus)
                .currentTurnUsername(currentTurnUsername)
                .message(resolveMessage(personalStatus, currentTurnUsername))
                .build();

        GameMessage msg = GameMessage.builder()
                .type("STATE_UPDATE")
                .roomId(room.getId())
                .payload(dto)
                .timestamp(System.currentTimeMillis())
                .build();

        // Topic personal: cada jugador solo recibe su propio estado
        messagingTemplate.convertAndSend(
                "/topic/room/" + room.getId() + "/" + pid, msg);
    }

    private String resolveMessage(String status, String currentTurnUsername) {
        return switch (status) {
            case "PLAYER_WIN" -> "¡Ganaste!";
            case "DEALER_WIN" -> "El dealer gana.";
            case "PUSH"       -> "¡Empate!";
            default           -> "Turno de: " + (currentTurnUsername != null ? currentTurnUsername : "...");
        };
    }

    // ──────────────────────────────────────────
    // DESCONEXIÓN
    // ──────────────────────────────────────────
    public void handlePlayerDisconnect(String playerId) {
        gameRoomRepository.findByStatus("WAITING").stream()
                .filter(room -> room.getPlayerIds().contains(playerId))
                .forEach(room -> {
                    int idx = room.getPlayerIds().indexOf(playerId);
                    room.getPlayerIds().remove(idx);
                    room.getPlayerUsernames().remove(idx);

                    if (room.getPlayerIds().isEmpty()) {
                        gameRoomRepository.delete(room);
                    } else {
                        room.setUpdatedAt(LocalDateTime.now());
                        gameRoomRepository.save(room);

                        GameMessage msg = GameMessage.builder()
                                .type("PLAYER_LEFT")
                                .roomId(room.getId())
                                .message("Un jugador ha abandonado la sala.")
                                .timestamp(System.currentTimeMillis())
                                .build();
                        messagingTemplate.convertAndSend("/topic/room/" + room.getId(), msg);
                    }
                });
    }

    // ──────────────────────────────────────────
    // HELPER
    // ──────────────────────────────────────────
    private GameRoomDTO buildRoomDTO(GameRoom room, String message) {
        String currentTurnUsername = null;
        if (room.getCurrentTurnPlayerId() != null) {
            int idx = room.getPlayerIds().indexOf(room.getCurrentTurnPlayerId());
            if (idx >= 0 && idx < room.getPlayerUsernames().size())
                currentTurnUsername = room.getPlayerUsernames().get(idx);
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