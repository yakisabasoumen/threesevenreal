package com.threesevenreal.threesevenreal.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.threesevenreal.threesevenreal.dto.BlackjackStateDTO;
import com.threesevenreal.threesevenreal.dto.GameMessage;
import com.threesevenreal.threesevenreal.dto.GameRoomDTO;
import com.threesevenreal.threesevenreal.dto.ThreeSevenOnlineStateDTO;
import com.threesevenreal.threesevenreal.model.*;
import com.threesevenreal.threesevenreal.repository.GameRoomRepository;
import com.threesevenreal.threesevenreal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GameRoomService {

    private final GameRoomRepository    gameRoomRepository;
    private final UserRepository        userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper          objectMapper;
    private final ThreeSevenService     threeSevenService;
    private final StatsService          statsService;

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

        GameMessage joinMsg = GameMessage.builder()
                .type("JOIN")
                .roomId(room.getId())
                .username(user.getUsername())
                .message(user.getUsername() + " se ha unido a la sala.")
                .timestamp(System.currentTimeMillis())
                .winStreak(user.getWinStreak())
                .maxWinStreak(user.getMaxWinStreak())
                .build();
        messagingTemplate.convertAndSend("/topic/room/" + room.getId(), joinMsg);

        return buildRoomDTO(room, "Te has unido a la sala.");
    }

    // ──────────────────────────────────────────
    // INICIAR PARTIDA ONLINE
    // ──────────────────────────────────────────
    private void startOnlineGame(GameRoom room) {
        room.setStatus("PLAYING");
        room.setCurrentTurnPlayerId(room.getPlayerIds().get(0));
        room.setUpdatedAt(LocalDateTime.now());

        try {
            if (room.getGameType().equals("BLACKJACK")) {
                BlackjackGame game = new BlackjackGame();
                game.setDeck(new Deck());
                game.setStatus("PLAYING");
                game.setCreatedAt(LocalDateTime.now());
                game.setUpdatedAt(LocalDateTime.now());

                for (String pid : room.getPlayerIds()) {
                    List<Card> hand = new ArrayList<>();
                    hand.add(game.getDeck().dealCard());
                    hand.add(game.getDeck().dealCard());
                    game.getPlayerHands().put(pid, hand);
                    game.getPlayerScores().put(pid, BlackjackGame.calculateHandScore(hand));
                }
                game.getDealerHand().add(game.getDeck().dealCard());
                game.getDealerHand().add(game.getDeck().dealCard());
                game.setDealerScore(BlackjackGame.calculateHandScore(game.getDealerHand()));

                room.setGameState(objectMapper.writeValueAsString(game));

            } else if (room.getGameType().equals("THREESEVEN")) {
                ThreeSevenOnlineGame game = new ThreeSevenOnlineGame();

                for (String pid : room.getPlayerIds()) {
                    List<Card> hand = new ArrayList<>();
                    for (int i = 0; i < 3; i++) hand.add(game.getDeck().dealCard());
                    game.getPlayerHands().put(pid, hand);
                    evaluateAndStore(game, pid);
                }

                room.setGameState(objectMapper.writeValueAsString(game));
            }

        } catch (Exception e) {
            throw new RuntimeException("Error iniciando partida: " + e.getMessage());
        }

        gameRoomRepository.save(room);

        GameMessage startMsg = GameMessage.builder()
                .type("GAME_START")
                .roomId(room.getId())
                .message("¡La partida ha comenzado! Turno de: " + room.getPlayerUsernames().get(0))
                .payload(buildRoomDTO(room, "Partida iniciada"))
                .timestamp(System.currentTimeMillis())
                .build();
        messagingTemplate.convertAndSend("/topic/room/" + room.getId(), startMsg);

        try {
            if (room.getGameType().equals("BLACKJACK")) {
                BlackjackGame game = objectMapper.readValue(room.getGameState(), BlackjackGame.class);
                broadcastBlackjackState(room, game);
            } else if (room.getGameType().equals("THREESEVEN")) {
                ThreeSevenOnlineGame game = objectMapper.readValue(room.getGameState(), ThreeSevenOnlineGame.class);
                broadcastThreeSevenState(room, game);
            }
        } catch (Exception e) {
            throw new RuntimeException("Error enviando estado inicial: " + e.getMessage());
        }
    }

    // ──────────────────────────────────────────
    // REENVIAR ESTADO AL RECONECTAR (FIX #1)
    // ──────────────────────────────────────────
    public void resendStateIfPlaying(String roomId, String playerId) {
        gameRoomRepository.findById(roomId).ifPresent(room -> {
            if (!"PLAYING".equals(room.getStatus())) return;
            if (room.getGameState() == null) return;
            if (!room.getPlayerIds().contains(playerId)) return;

            try {
                if ("BLACKJACK".equals(room.getGameType())) {
                    BlackjackGame game = objectMapper.readValue(room.getGameState(), BlackjackGame.class);
                    broadcastBlackjackStateToPlayer(room, game, playerId);
                } else if ("THREESEVEN".equals(room.getGameType())) {
                    ThreeSevenOnlineGame game = objectMapper.readValue(room.getGameState(), ThreeSevenOnlineGame.class);
                    broadcastThreeSevenStateToPlayer(room, game, playerId);
                }
            } catch (Exception e) {
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

        if ("BLACKJACK".equals(room.getGameType())) {
            processBlackjackAction(room, playerId, action);
        } else if ("THREESEVEN".equals(room.getGameType())) {
            processThreeSevenAction(room, playerId, action);
        }

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
    // LÓGICA TRES Y SIETE ONLINE
    // ──────────────────────────────────────────
    private void processThreeSevenAction(GameRoom room, String playerId, String action) {
        try {
            ThreeSevenOnlineGame game = objectMapper.readValue(room.getGameState(), ThreeSevenOnlineGame.class);

            if ("HIT".equals(action)) {
                game.getPlayerHands().get(playerId).add(game.getDeck().dealCard());
                evaluateAndStore(game, playerId);

            } else if ("STAND".equals(action)) {
                game.getStandingPlayers().add(playerId);
            }

            boolean allDone = room.getPlayerIds().stream()
                    .allMatch(pid -> game.getStandingPlayers().contains(pid));

            if (allDone) {
                game.setStatus("FINISHED");
                room.setStatus("FINISHED");

                // Determinar ganador y registrar stats
                List<String> players = room.getPlayerIds();
                String player1 = players.get(0);
                String player2 = players.get(1);
                int score1 = game.getHandScores().get(player1);
                int score2 = game.getHandScores().get(player2);

                if (score1 > score2) {
                    statsService.registerResult(player1, "PLAYER_WIN");
                    statsService.registerResult(player2, "PLAYER_LOSE");
                } else if (score2 > score1) {
                    statsService.registerResult(player2, "PLAYER_WIN");
                    statsService.registerResult(player1, "PLAYER_LOSE");
                }
                // En caso de empate, no registrar stats
            } else {
                // Pasar turno al siguiente que no haya plantado
                List<String> players = room.getPlayerIds();
                int idx = players.indexOf(playerId);
                for (int i = 1; i < players.size(); i++) {
                    String candidate = players.get((idx + i) % players.size());
                    if (!game.getStandingPlayers().contains(candidate)) {
                        room.setCurrentTurnPlayerId(candidate);
                        break;
                    }
                }
            }

            room.setGameState(objectMapper.writeValueAsString(game));
            room.setUpdatedAt(LocalDateTime.now());
            gameRoomRepository.save(room);

            broadcastThreeSevenState(room, game);

        } catch (Exception e) {
            throw new RuntimeException("Error procesando acción Tres y Siete: " + e.getMessage());
        }
    }

    private void evaluateAndStore(ThreeSevenOnlineGame game, String playerId) {
        List<Card> hand = game.getPlayerHands().get(playerId);
        ThreeSevenService.HandResult result = threeSevenService.evaluateHandPublic(hand);
        game.getHandRanks().put(playerId, result.rank());
        game.getHandScores().put(playerId, result.score());
    }

    // ──────────────────────────────────────────
    // BROADCAST TRES Y SIETE
    // ──────────────────────────────────────────
    private void broadcastThreeSevenState(GameRoom room, ThreeSevenOnlineGame game) {
        for (String pid : room.getPlayerIds()) {
            broadcastThreeSevenStateToPlayer(room, game, pid);
        }
    }

    private void broadcastThreeSevenStateToPlayer(GameRoom room, ThreeSevenOnlineGame game, String pid) {
        List<String> players = room.getPlayerIds();
        String opponentId = players.stream().filter(p -> !p.equals(pid)).findFirst().orElse(null);

        String opponentUsername = null;
        if (opponentId != null) {
            int idx = players.indexOf(opponentId);
            if (idx >= 0) opponentUsername = room.getPlayerUsernames().get(idx);
        }

        String currentTurnUsername = null;
        if (room.getCurrentTurnPlayerId() != null) {
            int idx = players.indexOf(room.getCurrentTurnPlayerId());
            if (idx >= 0) currentTurnUsername = room.getPlayerUsernames().get(idx);
        }

        boolean finished = "FINISHED".equals(game.getStatus());

        // Determinar resultado personal solo si terminó
        String personalStatus = "PLAYING";
        if (finished && opponentId != null) {
            int myScore  = game.getHandScores().getOrDefault(pid, 0);
            int oppScore = game.getHandScores().getOrDefault(opponentId, 0);
            if      (myScore > oppScore)  personalStatus = "PLAYER_WIN";
            else if (oppScore > myScore)  personalStatus = "OPPONENT_WIN";
            else                          personalStatus = "PUSH";
        }

        String myUsername = room.getPlayerUsernames().get(players.indexOf(pid));

        ThreeSevenOnlineStateDTO dto = ThreeSevenOnlineStateDTO.builder()
                .gameId(room.getId())
                .myHand(game.getPlayerHands().get(pid))
                .myHandRank(game.getHandRanks().get(pid))
                .myHandScore(game.getHandScores().getOrDefault(pid, 0))
                // Cartas del rival: ocultas hasta FINISHED
                .opponentHand(finished && opponentId != null ? game.getPlayerHands().get(opponentId) : null)
                .opponentHandRank(finished ? game.getHandRanks().get(opponentId) : null)
                .opponentHandScore(finished ? game.getHandScores().getOrDefault(opponentId, 0) : 0)
                .opponentUsername(opponentUsername)
                .status(personalStatus)
                .currentTurnUsername(currentTurnUsername)
                .isMyTurn(pid.equals(room.getCurrentTurnPlayerId()) && !finished)
                .message(resolveThreeSevenMessage(personalStatus, currentTurnUsername, finished))
                .build();

        GameMessage msg = GameMessage.builder()
                .type("STATE_UPDATE")
                .roomId(room.getId())
                .payload(dto)
                .timestamp(System.currentTimeMillis())
                .build();

        messagingTemplate.convertAndSend("/topic/room/" + room.getId() + "/" + pid, msg);
    }

    private String resolveThreeSevenMessage(String status, String turnUsername, boolean finished) {
        if (!finished) return "Turno de: " + (turnUsername != null ? turnUsername : "...");
        return switch (status) {
            case "PLAYER_WIN"   -> "¡Ganaste!";
            case "OPPONENT_WIN" -> "Has perdido.";
            case "PUSH"         -> "¡Empate!";
            default             -> "";
        };
    }

    // ──────────────────────────────────────────
    // LÓGICA BLACKJACK (sin cambios, renombrado)
    // ──────────────────────────────────────────
    private void processBlackjackAction(GameRoom room, String playerId, String action) {
        try {
            BlackjackGame game = objectMapper.readValue(room.getGameState(), BlackjackGame.class);
            boolean gameOver = false;

            if (action.equals("HIT")) {
                List<Card> hand = game.getPlayerHands().get(playerId);
                hand.add(game.getDeck().dealCard());
                game.recalculatePlayerScore(playerId);
                int score = game.getPlayerScores().get(playerId);
                if (score > 21) game.getStandingPlayers().add(playerId);

            } else if (action.equals("STAND")) {
                game.getStandingPlayers().add(playerId);
            }

            boolean allPlayersDone = room.getPlayerIds().stream()
                    .allMatch(pid ->
                            game.getStandingPlayers().contains(pid) ||
                            game.getPlayerScores().getOrDefault(pid, 0) > 21);

            if (allPlayersDone) {
                while (game.getDealerScore() < 17) {
                    game.getDealerHand().add(game.getDeck().dealCard());
                    game.setDealerScore(BlackjackGame.calculateHandScore(game.getDealerHand()));
                }
                game.setStatus("FINISHED");
                room.setStatus("FINISHED");
                gameOver = true;
            } else {
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

                if (!turnAssigned) {
                    game.setStatus("FINISHED");
                    room.setStatus("FINISHED");
                    gameOver = true;
                }
            }

            room.setGameState(objectMapper.writeValueAsString(game));
            room.setUpdatedAt(LocalDateTime.now());
            gameRoomRepository.save(room);

            broadcastBlackjackState(room, game);

        } catch (Exception e) {
            throw new RuntimeException("Error procesando acción: " + e.getMessage());
        }
    }

    private void broadcastBlackjackState(GameRoom room, BlackjackGame game) {
        for (String pid : room.getPlayerIds()) {
            broadcastBlackjackStateToPlayer(room, game, pid);
        }
    }

    private void broadcastBlackjackStateToPlayer(GameRoom room, BlackjackGame game, String pid) {
        String currentTurnUsername = null;
        if (room.getCurrentTurnPlayerId() != null) {
            int idx = room.getPlayerIds().indexOf(room.getCurrentTurnPlayerId());
            if (idx >= 0) currentTurnUsername = room.getPlayerUsernames().get(idx);
        }

        boolean isPlaying = "PLAYING".equals(game.getStatus());
        List<Card> myHand = game.getPlayerHands().get(pid);
        int myScore = game.getPlayerScores().getOrDefault(pid, 0);

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
                .message(resolveBlackjackMessage(personalStatus, currentTurnUsername))
                .build();

        GameMessage msg = GameMessage.builder()
                .type("STATE_UPDATE")
                .roomId(room.getId())
                .payload(dto)
                .timestamp(System.currentTimeMillis())
                .build();

        messagingTemplate.convertAndSend("/topic/room/" + room.getId() + "/" + pid, msg);
    }

    private String resolveBlackjackMessage(String status, String currentTurnUsername) {
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