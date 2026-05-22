package com.threesevenreal.threesevenreal.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.threesevenreal.threesevenreal.dto.BlackjackStateDTO;
import com.threesevenreal.threesevenreal.dto.GameMessage;
import com.threesevenreal.threesevenreal.dto.GameRoomDTO;
import com.threesevenreal.threesevenreal.dto.PokerOnlineStateDTO;
import com.threesevenreal.threesevenreal.dto.ThreeSevenOnlineStateDTO;
import com.threesevenreal.threesevenreal.model.*;
import com.threesevenreal.threesevenreal.repository.GameResultRepository;
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

    private final GameRoomRepository gameRoomRepository;
    private final GameResultRepository gameResultRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;
    private final ThreeSevenService threeSevenService;
    private final StatsService statsService;

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
                    for (int i = 0; i < 3; i++)
                        hand.add(game.getDeck().dealCard());
                    game.getPlayerHands().put(pid, hand);
                    evaluateAndStore(game, pid);
                }

                room.setGameState(objectMapper.writeValueAsString(game));
            } else if (room.getGameType().equals("POKER")) {
                PokerOnlineGame game = new PokerOnlineGame();

                for (String pid : room.getPlayerIds()) {
                    List<Card> hand = new ArrayList<>();
                    hand.add(game.getDeck().dealCard());
                    hand.add(game.getDeck().dealCard());
                    game.getPlayerHands().put(pid, hand);
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
            } else if (room.getGameType().equals("POKER")) {
                PokerOnlineGame game = objectMapper.readValue(room.getGameState(), PokerOnlineGame.class);
                broadcastPokerState(room, game);
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
            if (!"PLAYING".equals(room.getStatus()))
                return;
            if (room.getGameState() == null)
                return;
            if (!room.getPlayerIds().contains(playerId))
                return;

            try {
                if ("BLACKJACK".equals(room.getGameType())) {
                    BlackjackGame game = objectMapper.readValue(room.getGameState(), BlackjackGame.class);
                    broadcastBlackjackStateToPlayer(room, game, playerId);
                } else if ("THREESEVEN".equals(room.getGameType())) {
                    ThreeSevenOnlineGame game = objectMapper.readValue(room.getGameState(), ThreeSevenOnlineGame.class);
                    broadcastThreeSevenStateToPlayer(room, game, playerId);
                } else if ("POKER".equals(room.getGameType())) {
                    PokerOnlineGame game = objectMapper.readValue(room.getGameState(), PokerOnlineGame.class);
                    broadcastPokerStateToPlayer(room, game, playerId);
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
        } else if ("POKER".equals(room.getGameType())) {
            processPokerAction(room, playerId, action);
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
                if (game.getPlayersWhoHit().contains(playerId)) {
                    throw new RuntimeException("Ya pediste carta, solo puedes plantarte");
                }
                game.getPlayerHands().get(playerId).add(game.getDeck().dealCard());
                evaluateAndStore(game, playerId);
                game.getPlayersWhoHit().add(playerId);
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
                    saveGameResult(room, player1);
                } else if (score2 > score1) {
                    statsService.registerResult(player2, "PLAYER_WIN");
                    statsService.registerResult(player1, "PLAYER_LOSE");
                    saveGameResult(room, player2);
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
            if (idx >= 0)
                opponentUsername = room.getPlayerUsernames().get(idx);
        }

        String currentTurnUsername = null;
        if (room.getCurrentTurnPlayerId() != null) {
            int idx = players.indexOf(room.getCurrentTurnPlayerId());
            if (idx >= 0)
                currentTurnUsername = room.getPlayerUsernames().get(idx);
        }

        boolean finished = "FINISHED".equals(game.getStatus());

        // Determinar resultado personal solo si terminó
        String personalStatus = "PLAYING";
        if (finished && opponentId != null) {
            int myScore = game.getHandScores().getOrDefault(pid, 0);
            int oppScore = game.getHandScores().getOrDefault(opponentId, 0);
            if (myScore > oppScore)
                personalStatus = "PLAYER_WIN";
            else if (oppScore > myScore)
                personalStatus = "OPPONENT_WIN";
            else
                personalStatus = "PUSH";
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
                .canHit(!game.getPlayersWhoHit().contains(pid) && !finished)
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
        if (!finished)
            return "Turno de: " + (turnUsername != null ? turnUsername : "...");
        return switch (status) {
            case "PLAYER_WIN" -> "¡Ganaste!";
            case "OPPONENT_WIN" -> "Has perdido.";
            case "PUSH" -> "¡Empate!";
            default -> "";
        };
    }

    private void registerBlackjackResult(GameRoom room, BlackjackGame game) {
        List<String> players = room.getPlayerIds();
        if (players.size() < 2)
            return;

        String p1 = players.get(0);
        String p2 = players.get(1);
        int score1 = game.getPlayerScores().getOrDefault(p1, 0);
        int score2 = game.getPlayerScores().getOrDefault(p2, 0);

        boolean bust1 = score1 > 21;
        boolean bust2 = score2 > 21;

        String winnerId = null;
        if (bust1 && bust2) {
            // draw, no stats
        } else if (bust1) {
            statsService.registerResult(p1, "PLAYER_LOSE");
            statsService.registerResult(p2, "PLAYER_WIN");
            winnerId = p2;
        } else if (bust2) {
            statsService.registerResult(p2, "PLAYER_LOSE");
            statsService.registerResult(p1, "PLAYER_WIN");
            winnerId = p1;
        } else if (score1 > score2) {
            statsService.registerResult(p1, "PLAYER_WIN");
            statsService.registerResult(p2, "PLAYER_LOSE");
            winnerId = p1;
        } else if (score2 > score1) {
            statsService.registerResult(p2, "PLAYER_WIN");
            statsService.registerResult(p1, "PLAYER_LOSE");
            winnerId = p2;
        }
        // draw: winnerId stays null, saveGameResult skips it

        saveGameResult(room, winnerId);
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
                if (score > 21)
                    game.getStandingPlayers().add(playerId);

            } else if (action.equals("STAND")) {
                game.getStandingPlayers().add(playerId);
            }

            boolean allPlayersDone = room.getPlayerIds().stream()
                    .allMatch(pid -> game.getStandingPlayers().contains(pid) ||
                            game.getPlayerScores().getOrDefault(pid, 0) > 21);

            if (allPlayersDone) {
                game.setStatus("FINISHED");
                room.setStatus("FINISHED");
                gameOver = true;
                registerBlackjackResult(room, game);

            } else {
                List<String> players = room.getPlayerIds();
                int currentIdx = players.indexOf(playerId);
                boolean turnAssigned = false;

                for (int i = 1; i < players.size(); i++) {
                    String candidate = players.get((currentIdx + i) % players.size());
                    boolean candidateDone = game.getStandingPlayers().contains(candidate) ||
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
                    registerBlackjackResult(room, game);
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
            if (idx >= 0)
                currentTurnUsername = room.getPlayerUsernames().get(idx);
        }

        boolean isPlaying = "PLAYING".equals(game.getStatus());
        List<Card> myHand = game.getPlayerHands().get(pid);
        int myScore = game.getPlayerScores().getOrDefault(pid, 0);

        String opponentId = room.getPlayerIds().stream()
                .filter(p -> !p.equals(pid))
                .findFirst()
                .orElse(null);

        String opponentUsername = null;
        int opponentScore = 0;
        List<Card> opponentHand = null;
        if (opponentId != null) {
            int opponentIndex = room.getPlayerIds().indexOf(opponentId);
            if (opponentIndex >= 0) {
                opponentUsername = room.getPlayerUsernames().get(opponentIndex);
            }
            opponentScore = game.getPlayerScores().getOrDefault(opponentId, 0);
            if (!isPlaying) {
                opponentHand = game.getPlayerHands().get(opponentId);
            }
        }

        String personalStatus;
        if (isPlaying) {
            personalStatus = "PLAYING";
        } else if (myScore > 21 && opponentScore > 21) {
            personalStatus = "PUSH";
        } else if (myScore > 21) {
            personalStatus = "OPPONENT_WIN";
        } else if (opponentScore > 21) {
            personalStatus = "PLAYER_WIN";
        } else if (myScore > opponentScore) {
            personalStatus = "PLAYER_WIN";
        } else if (opponentScore > myScore) {
            personalStatus = "OPPONENT_WIN";
        } else {
            personalStatus = "PUSH";
        }

        BlackjackStateDTO dto = BlackjackStateDTO.builder()
                .gameId(room.getId())
                .playerHand(myHand)
                .opponentHand(opponentHand)
                .opponentUsername(opponentUsername)
                .opponentScore(opponentScore)
                .playerScore(myScore)
                .status(personalStatus)
                .isMyTurn(pid.equals(room.getCurrentTurnPlayerId()) && !isPlaying)
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
            case "OPPONENT_WIN" -> "Has perdido.";
            case "DEALER_WIN" -> "El dealer gana.";
            case "PUSH" -> "¡Empate!";
            default -> "Turno de: " + (currentTurnUsername != null ? currentTurnUsername : "...");
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
    // LÓGICA POKER ONLINE
    // ──────────────────────────────────────────
    private void processPokerAction(GameRoom room, String playerId, String action) {
        try {
            PokerOnlineGame game = objectMapper.readValue(room.getGameState(), PokerOnlineGame.class);
            List<String> players = room.getPlayerIds();
            String opponentId = players.stream().filter(p -> !p.equals(playerId)).findFirst().orElse(null);

            if ("FOLD".equals(action)) {
                game.getFoldedPlayers().add(playerId);
                game.setStatus("FINISHED");
                room.setStatus("FINISHED");

                // El rival gana por fold
                if (opponentId != null) {
                    statsService.registerResult(opponentId, "PLAYER_WIN");
                    statsService.registerResult(playerId, "PLAYER_LOSE");
                    saveGameResult(room, opponentId);
                }

                room.setGameState(objectMapper.writeValueAsString(game));
                room.setUpdatedAt(LocalDateTime.now());
                gameRoomRepository.save(room);
                broadcastPokerState(room, game);
                return;
            }

            if ("CHECK".equals(action)) {
                game.getCheckedInPhase().add(playerId);

                boolean bothChecked = players.stream()
                        .allMatch(pid -> game.getCheckedInPhase().contains(pid)
                                || game.getFoldedPlayers().contains(pid));

                if (bothChecked) {
                    // Avanzar fase
                    game.getCheckedInPhase().clear();
                    switch (game.getPhase()) {
                        case "PREFLOP" -> {
                            game.getCommunityCards().add(game.getDeck().dealCard());
                            game.getCommunityCards().add(game.getDeck().dealCard());
                            game.getCommunityCards().add(game.getDeck().dealCard());
                            game.setPhase("FLOP");
                        }
                        case "FLOP" -> {
                            game.getCommunityCards().add(game.getDeck().dealCard());
                            game.setPhase("TURN");
                        }
                        case "TURN" -> {
                            game.getCommunityCards().add(game.getDeck().dealCard());
                            game.setPhase("RIVER");
                        }
                        case "RIVER" -> {
                            // Showdown
                            game.setPhase("SHOWDOWN");
                            game.setStatus("FINISHED");
                            room.setStatus("FINISHED");

                            // Registrar stats
                            String winner = determinePokerWinner(game, players);
                            if (winner != null && opponentId != null) {
                                String loserId = winner.equals(playerId) ? opponentId : playerId;
                                statsService.registerResult(winner, "PLAYER_WIN");
                                statsService.registerResult(loserId, "PLAYER_LOSE");
                                saveGameResult(room, winner);
                            }
                        }
                    }
                    // El turno vuelve al jugador 0 en cada nueva fase
                    room.setCurrentTurnPlayerId(players.get(0));
                } else {
                    // Pasar turno al otro
                    room.setCurrentTurnPlayerId(opponentId);
                }
            }

            room.setGameState(objectMapper.writeValueAsString(game));
            room.setUpdatedAt(LocalDateTime.now());
            gameRoomRepository.save(room);
            broadcastPokerState(room, game);

        } catch (Exception e) {
            throw new RuntimeException("Error procesando acción Poker: " + e.getMessage());
        }
    }

    private String determinePokerWinner(PokerOnlineGame game, List<String> players) {
        String p1 = players.get(0);
        String p2 = players.get(1);
        int score1 = evaluatePokerHand(game.getPlayerHands().get(p1), game.getCommunityCards()).score();
        int score2 = evaluatePokerHand(game.getPlayerHands().get(p2), game.getCommunityCards()).score();
        if (score1 > score2)
            return p1;
        if (score2 > score1)
            return p2;
        return null; // empate
    }

    private void broadcastPokerState(GameRoom room, PokerOnlineGame game) {
        for (String pid : room.getPlayerIds()) {
            broadcastPokerStateToPlayer(room, game, pid);
        }
    }

    private void broadcastPokerStateToPlayer(GameRoom room, PokerOnlineGame game, String pid) {
        List<String> players = room.getPlayerIds();
        String opponentId = players.stream().filter(p -> !p.equals(pid)).findFirst().orElse(null);

        String opponentUsername = null;
        if (opponentId != null) {
            int idx = players.indexOf(opponentId);
            if (idx >= 0)
                opponentUsername = room.getPlayerUsernames().get(idx);
        }

        String currentTurnUsername = null;
        if (room.getCurrentTurnPlayerId() != null) {
            int idx = players.indexOf(room.getCurrentTurnPlayerId());
            if (idx >= 0)
                currentTurnUsername = room.getPlayerUsernames().get(idx);
        }

        boolean finished = "FINISHED".equals(game.getStatus());
        boolean folded = game.getFoldedPlayers().contains(pid);
        boolean opponentFolded = opponentId != null && game.getFoldedPlayers().contains(opponentId);

        String personalStatus = "PLAYING";
        String myHandRank = null;
        String opponentHandRank = null;
        List<Card> opponentHand = null;

        if (finished) {
            if (opponentFolded) {
                personalStatus = "PLAYER_WIN";
            } else if (folded) {
                personalStatus = "OPPONENT_WIN";
            } else if (opponentId != null) {
                // Showdown — calcular ganador
                PokerHandResult myResult = evaluatePokerHand(game.getPlayerHands().get(pid), game.getCommunityCards());
                PokerHandResult oppResult = evaluatePokerHand(game.getPlayerHands().get(opponentId),
                        game.getCommunityCards());
                myHandRank = myResult.rank();
                opponentHandRank = oppResult.rank();
                opponentHand = game.getPlayerHands().get(opponentId);

                if (myResult.score() > oppResult.score())
                    personalStatus = "PLAYER_WIN";
                else if (oppResult.score() > myResult.score())
                    personalStatus = "OPPONENT_WIN";
                else
                    personalStatus = "PUSH";
            }
        }

        String message;
        if (!finished) {
            message = "Fase: " + game.getPhase() + " — Turno de: "
                    + (currentTurnUsername != null ? currentTurnUsername : "...");
        } else {
            message = switch (personalStatus) {
                case "PLAYER_WIN" -> "¡Ganaste!";
                case "OPPONENT_WIN" -> "Has perdido.";
                case "PUSH" -> "¡Empate!";
                default -> "";
            };
        }

        PokerOnlineStateDTO dto = PokerOnlineStateDTO.builder()
                .gameId(room.getId())
                .myHand(game.getPlayerHands().get(pid))
                .opponentHand(finished ? opponentHand : null)
                .opponentUsername(opponentUsername)
                .communityCards(game.getCommunityCards())
                .phase(game.getPhase())
                .status(personalStatus)
                .currentTurnUsername(currentTurnUsername)
                .isMyTurn(pid.equals(room.getCurrentTurnPlayerId()) && !finished)
                .canCheck(!game.getCheckedInPhase().contains(pid) && !finished)
                .myHandRank(myHandRank)
                .opponentHandRank(opponentHandRank)
                .message(message)
                .build();

        GameMessage msg = GameMessage.builder()
                .type("STATE_UPDATE")
                .roomId(room.getId())
                .payload(dto)
                .timestamp(System.currentTimeMillis())
                .build();

        messagingTemplate.convertAndSend("/topic/room/" + room.getId() + "/" + pid, msg);
    }

    private record PokerHandResult(String rank, int score) {
    }

    private PokerHandResult evaluatePokerHand(List<Card> holeCards, List<Card> community) {
        List<Card> all = new ArrayList<>(holeCards);
        all.addAll(community);

        List<List<Card>> combinations = new ArrayList<>();
        getCombinations(all, 5, 0, new ArrayList<>(), combinations);

        return combinations.stream()
                .map(this::evaluateFiveCardHand)
                .max(Comparator.comparingInt(PokerHandResult::score))
                .orElse(new PokerHandResult("Carta Alta", 0));
    }

    private void getCombinations(List<Card> cards, int k, int start,
            List<Card> current, List<List<Card>> result) {
        if (current.size() == k) {
            result.add(new ArrayList<>(current));
            return;
        }
        for (int i = start; i < cards.size(); i++) {
            current.add(cards.get(i));
            getCombinations(cards, k, i + 1, current, result);
            current.remove(current.size() - 1);
        }
    }

    private PokerHandResult evaluateFiveCardHand(List<Card> hand) {
        Map<String, Long> rankCount = hand.stream()
                .collect(java.util.stream.Collectors.groupingBy(Card::getRank, java.util.stream.Collectors.counting()));
        Map<String, Long> suitCount = hand.stream()
                .collect(java.util.stream.Collectors.groupingBy(Card::getSuit, java.util.stream.Collectors.counting()));

        boolean isFlush = suitCount.size() == 1;
        boolean isStraight = isPokerStraight(hand);
        long maxCount = rankCount.values().stream().mapToLong(Long::longValue).max().orElse(0);
        long pairs = rankCount.values().stream().filter(v -> v == 2).count();

        if (isFlush && isStraight) {
            List<Integer> values = hand.stream().map(Card::getValue).sorted().toList();
            if (values.get(4) == 14)
                return new PokerHandResult("Escalera Real", 900);
            return new PokerHandResult("Escalera de Color", 800);
        }
        if (maxCount == 4)
            return new PokerHandResult("Poker", 700);
        if (maxCount == 3 && pairs == 1)
            return new PokerHandResult("Full House", 600);
        if (isFlush)
            return new PokerHandResult("Color", 500);
        if (isStraight)
            return new PokerHandResult("Escalera", 400);
        if (maxCount == 3)
            return new PokerHandResult("Trío", 300);
        if (pairs == 2)
            return new PokerHandResult("Doble Pareja", 200);
        if (pairs == 1)
            return new PokerHandResult("Pareja", 100);
        int high = hand.stream().mapToInt(Card::getValue).max().orElse(0);
        return new PokerHandResult("Carta Alta (" + high + ")", high);
    }

    private boolean isPokerStraight(List<Card> hand) {
        List<Integer> values = hand.stream().map(Card::getValue).distinct().sorted().toList();
        if (values.size() < 5)
            return false;
        for (int i = 1; i < values.size(); i++) {
            if (values.get(i) != values.get(i - 1) + 1)
                return false;
        }
        return true;
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

    private void saveGameResult(GameRoom room, String winnerId) {
        if (winnerId == null)
            return; // draw, don't record
        int winnerIdx = room.getPlayerIds().indexOf(winnerId);
        String winnerUsername = winnerIdx >= 0 ? room.getPlayerUsernames().get(winnerIdx) : null;

        GameResult result = GameResult.builder()
                .roomId(room.getId())
                .gameType(room.getGameType())
                .winnerId(winnerId)
                .winnerUsername(winnerUsername)
                .playerIds(new ArrayList<>(room.getPlayerIds()))
                .playerUsernames(new ArrayList<>(room.getPlayerUsernames()))
                .playedAt(LocalDateTime.now())
                .build();

        gameResultRepository.save(result);
    }
}