package com.threesevenreal.threesevenreal.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.threesevenreal.threesevenreal.dto.DominoRoomDTO;
import com.threesevenreal.threesevenreal.dto.DominoStateDTO;
import com.threesevenreal.threesevenreal.model.DominoGameState;
import com.threesevenreal.threesevenreal.model.DominoRoom;
import com.threesevenreal.threesevenreal.model.DominoTile;
import com.threesevenreal.threesevenreal.model.User;
import com.threesevenreal.threesevenreal.repository.DominoRoomRepository;
import com.threesevenreal.threesevenreal.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DominoGameService {

    private final DominoRoomRepository dominoRoomRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;
    private final StatsService statsService;

    public DominoRoomDTO createRoom(String playerId, int maxPlayers) {
        User user = userRepository.findById(playerId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        DominoRoom room = new DominoRoom();
        room.setStatus("WAITING");
        room.setMaxPlayers(maxPlayers);
        room.getPlayerIds().add(playerId);
        room.getPlayerUsernames().add(user.getUsername());
        room.setCreatedAt(LocalDateTime.now());
        room.setUpdatedAt(LocalDateTime.now());
        dominoRoomRepository.save(room);
        broadcastRooms();
        return buildRoomDTO(room, "Sala creada");
    }

    public DominoRoomDTO joinRoom(String roomId, String playerId) {
        User user = userRepository.findById(playerId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        DominoRoom room = dominoRoomRepository.findByIdAndStatus(roomId, "WAITING")
                .orElseThrow(() -> new RuntimeException("Sala no encontrada o ya iniciada"));

        if (room.getPlayerIds().contains(playerId)) {
            throw new RuntimeException("Ya estás en esta sala");
        }
        if (room.getPlayerIds().size() >= room.getMaxPlayers()) {
            throw new RuntimeException("La sala está llena");
        }

        room.getPlayerIds().add(playerId);
        room.getPlayerUsernames().add(user.getUsername());
        room.setUpdatedAt(LocalDateTime.now());

        if (room.getPlayerIds().size() == room.getMaxPlayers()) {
            startRound(room);
        } else {
            dominoRoomRepository.save(room);
        }

        broadcastRooms();
        return buildRoomDTO(room, "Te has unido a la sala");
    }

    public DominoRoomDTO leaveRoom(String roomId, String playerId) {
        DominoRoom room = dominoRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Sala no encontrada"));

        int idx = room.getPlayerIds().indexOf(playerId);
        if (idx >= 0) {
            room.getPlayerIds().remove(idx);
            room.getPlayerUsernames().remove(idx);
        }

        if (room.getPlayerIds().isEmpty()) {
            dominoRoomRepository.delete(room);
            broadcastRooms();
            return null;
        }

        if ("WAITING".equals(room.getStatus())) {
            room.setUpdatedAt(LocalDateTime.now());
            dominoRoomRepository.save(room);
        } else {
            room.setStatus("ABANDONED");
            dominoRoomRepository.save(room);
        }

        broadcastRooms();
        return buildRoomDTO(room, "Has abandonado la sala");
    }

    public List<DominoRoomDTO> getAvailableRooms() {
        return dominoRoomRepository.findByStatus("WAITING").stream()
                .map(room -> buildRoomDTO(room, "Sala disponible"))
                .collect(Collectors.toList());
    }

    public List<DominoRoomDTO> getAvailableRooms(int maxPlayers) {
        return dominoRoomRepository.findByStatus("WAITING").stream()
                .filter(room -> room.getMaxPlayers() == maxPlayers)
                .map(room -> buildRoomDTO(room, "Sala disponible"))
                .collect(Collectors.toList());
    }

    public void resendStateIfPlaying(String roomId, String playerId) {
        try {
            DominoRoom room = dominoRoomRepository.findById(roomId).orElse(null);
            if (room != null && "PLAYING".equals(room.getStatus())) {
                DominoGameState state = loadState(room);
                DominoStateDTO dto = buildStateDTO(state, "Estado de la partida");
                Map<String, Object> payload = new HashMap<>();
                payload.put("type", "STATE_UPDATE");
                payload.put("gameId", room.getId());
                payload.put("message", "Estado de la partida");
                payload.put("payload", dto);
                messagingTemplate.convertAndSend("/topic/domino." + roomId + "/" + playerId, payload);
            }
        } catch (Exception e) {
            // Ignorar errores en reenvío
        }
    }

    public void sendGeneralMessage(String roomId, Object message) {
        messagingTemplate.convertAndSend("/topic/domino." + roomId, message);
    }

    public void playTile(String gameId, String playerId, int tileIndex, String side) {
        DominoRoom room = loadPlayingRoom(gameId);
        DominoGameState state = loadState(room);
        ensurePlayerTurn(state, playerId);

        if (tileIndex < 0 || tileIndex >= state.getPlayers().stream()
                .filter(p -> p.getPlayerId().equals(playerId)).findFirst().orElseThrow().getHand().size()) {
            throw new RuntimeException("Ficha inválida");
        }

        DominoGameState.DominoPlayerState playerState = state.getPlayers().stream()
                .filter(p -> p.getPlayerId().equals(playerId))
                .findFirst().orElseThrow();

        DominoTile tile = playerState.getHand().get(tileIndex);
        if (!isValidPlay(state, tile, side)) {
            throw new RuntimeException("Movimiento inválido");
        }

        placeTile(state, playerState, tileIndex, side);
        state.setPassCount(0);
        if (playerState.getHand().isEmpty()) {
            finishRound(room, state, playerId, true);
        } else {
            advanceTurn(room, state, playerId);
            persistRoom(room, state);
            broadcastState(room, state, "STATE_UPDATE", "Ficha jugada");
        }
    }

    public void passTurn(String gameId, String playerId) {
        DominoRoom room = loadPlayingRoom(gameId);
        DominoGameState state = loadState(room);
        ensurePlayerTurn(state, playerId);

        if (state.getPool() > 0) {
            throw new RuntimeException("No puedes pasar mientras haya fichas en el pozo");
        }

        state.setPassCount(state.getPassCount() + 1);
        if (state.getPassCount() >= room.getPlayerIds().size()) {
            finishRoundByBlock(room, state);
        } else {
            advanceTurn(room, state, playerId);
            persistRoom(room, state);
            broadcastState(room, state, "STATE_UPDATE", "Jugador pasó");
        }
    }

    public void drawTile(String gameId, String playerId) {
        DominoRoom room = loadPlayingRoom(gameId);
        DominoGameState state = loadState(room);
        ensurePlayerTurn(state, playerId);

        if (state.getPool() <= 0) {
            throw new RuntimeException("No hay fichas disponibles en el pozo");
        }

        DominoGameState.DominoPlayerState playerState = state.getPlayers().stream()
                .filter(p -> p.getPlayerId().equals(playerId))
                .findFirst().orElseThrow();

        DominoTile drawn = drawFromPool(state);
        playerState.getHand().add(drawn);
        state.setPassCount(0);
        advanceTurn(room, state, playerId);
        persistRoom(room, state);
        broadcastState(room, state, "STATE_UPDATE", "Ficha robada");
    }

    public void surrender(String gameId, String playerId) {
        DominoRoom room = loadPlayingRoom(gameId);
        DominoGameState state = loadState(room);

        String surrenderUsername = state.getPlayers().stream()
            .filter(p -> p.getPlayerId().equals(playerId))
            .map(DominoGameState.DominoPlayerState::getUsername)
            .findFirst().orElse("Un jugador");

        int surrenderTeam = getTeam(state, playerId);
        int winningTeam = surrenderTeam == 1 ? 2 : 1;
        int score = scoreOpponents(state, winningTeam);
        updateRoundPoints(state, winningTeam, score);

        DominoGameState finalState = cloneState(state);
        boolean matchFinished = maybeFinishMatch(room, state);

        String msg = surrenderUsername + " se rindió";

        if (matchFinished) {
            persistRoom(room, state);
            broadcastState(room, finalState, "GAME_END", msg);
        } else {
            persistRoom(room, state);
            broadcastState(room, finalState, "ROUND_END", msg);
            broadcastState(room, state, "GAME_START", "Nueva ronda iniciada");
        }
    }

    public void sendPersonalMessage(String roomId, String playerId, Object message) {
        messagingTemplate.convertAndSend("/topic/domino." + roomId + "/" + playerId, message);
    }

    public void abandonGame(String gameId, String playerId) {
        DominoRoom room = loadPlayingRoom(gameId);
        DominoGameState state = loadState(room);

        int abandonTeam = getTeam(state, playerId);
        int winningTeam = abandonTeam == 1 ? 2 : 1;
        state.setWinner("team" + winningTeam);
        state.setStatus("GAME_END");
        room.setStatus("FINISHED");
        registerMatchResults(state, winningTeam);
        persistRoom(room, state);
        broadcastState(room, state, "GAME_END", "Tu contrincante abandonó la partida, has ganado!.");
    }

    public Map<String, Object> getRoomState(String roomId, String playerId) {
        DominoRoom room = dominoRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Sala no encontrada"));

        Map<String, Object> response = new HashMap<>();
        response.put("status", room.getStatus());

        if ("PLAYING".equals(room.getStatus())) {
            DominoGameState state = loadState(room);
            response.put("gameState", buildStateDTO(state, "Estado actual"));
        }

        return response;
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------
    private DominoRoom loadPlayingRoom(String gameId) {
        return dominoRoomRepository.findById(gameId)
                .orElseThrow(() -> new RuntimeException("Partida no encontrada"));
    }

    private DominoGameState loadState(DominoRoom room) {
        try {
            return objectMapper.readValue(room.getGameState(), DominoGameState.class);
        } catch (Exception e) {
            throw new RuntimeException("No se pudo leer el estado del juego: " + e.getMessage());
        }
    }

    private void ensurePlayerTurn(DominoGameState state, String playerId) {
        if (!playerId.equals(state.getCurrentTurnPlayerId())) {
            throw new RuntimeException("No es tu turno");
        }
    }

    private void placeTile(DominoGameState state, DominoGameState.DominoPlayerState player, int tileIndex, String side) {
        DominoTile tile = player.getHand().remove(tileIndex);
        if (state.getBoard().isEmpty()) {
            state.getBoard().add(tile);
            return;
        }

        int leftEnd = state.getBoard().get(0).getLeft();
        int rightEnd = state.getBoard().get(state.getBoard().size() - 1).getRight();

        if ("LEFT".equals(side)) {
            if (tile.getRight() == leftEnd) {
                state.getBoard().add(0, tile);
            } else if (tile.getLeft() == leftEnd) {
                state.getBoard().add(0, tile.flipped());
            }
        } else {
            if (tile.getLeft() == rightEnd) {
                state.getBoard().add(tile);
            } else if (tile.getRight() == rightEnd) {
                state.getBoard().add(tile.flipped());
            }
        }
    }

    private boolean isValidPlay(DominoGameState state, DominoTile tile, String side) {
        if (state.getBoard().isEmpty()) {
            return true;
        }
        int leftEnd = state.getBoard().get(0).getLeft();
        int rightEnd = state.getBoard().get(state.getBoard().size()-1).getRight();
        if ("LEFT".equals(side)) {
            return tile.matches(leftEnd);
        }
        return tile.matches(rightEnd);
    }

    private void advanceTurn(DominoRoom room, DominoGameState state, String playerId) {
        List<String> players = room.getPlayerIds();
        int idx = players.indexOf(playerId);
        int next = (idx + 1) % players.size();
        state.setCurrentTurnPlayerId(players.get(next));
    }

    private DominoTile drawFromPool(DominoGameState state) {
        int poolSize = state.getPool();
        if (poolSize <= 0) throw new RuntimeException("Pozo vacío");
        state.setPool(poolSize - 1);
        return new DominoTile((int) (Math.random() * 7), (int) (Math.random() * 7));
    }

    private void finishRound(DominoRoom room, DominoGameState state, String winnerId, boolean handEmptyWin) {
        int winningTeam = getTeam(state, winnerId);
        int score = scoreOpponents(state, winningTeam);
        updateRoundPoints(state, winningTeam, score);

        DominoGameState finalState = cloneState(state);
        boolean matchFinished = maybeFinishMatch(room, state);

        if (matchFinished) {
            persistRoom(room, state);
            broadcastState(room, finalState, "GAME_END", handEmptyWin ? "Ronda ganada por vaciar la mano" : "Ronda finalizada");
        } else {
            persistRoom(room, state);
            broadcastState(room, finalState, "ROUND_END", handEmptyWin ? "Ronda ganada por vaciar la mano" : "Ronda finalizada");
            broadcastState(room, state, "GAME_START", "Nueva ronda iniciada");
        }
    }

    private void finishRoundByBlock(DominoRoom room, DominoGameState state) {
        int team1 = sumTeamPips(state, 1);
        int team2 = sumTeamPips(state, 2);
        int winnerTeam;
        int score;
        if (team1 == team2) {
            winnerTeam = 0;
            score = 0;
            state.setMessage("Ronda empatada por tranca");
        } else if (team1 < team2) {
            winnerTeam = 1;
            score = team2 - team1;
        } else {
            winnerTeam = 2;
            score = team1 - team2;
        }
        if (winnerTeam != 0) {
            updateRoundPoints(state, winnerTeam, score);
        }

        DominoGameState finalState = cloneState(state);
        boolean matchFinished = maybeFinishMatch(room, state);

        if (matchFinished) {
            persistRoom(room, state);
            broadcastState(room, finalState, "GAME_END", "Ronda terminada por tranca");
        } else {
            persistRoom(room, state);
            broadcastState(room, finalState, "ROUND_END", "Ronda terminada por tranca");
            broadcastState(room, state, "GAME_START", "Nueva ronda iniciada");
        }
    }

    private int getTeam(DominoGameState state, String playerId) {
        return state.getPlayers().stream()
                .filter(p -> p.getPlayerId().equals(playerId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Jugador no encontrado"))
                .getTeam();
    }

    private int scoreOpponents(DominoGameState state, int winningTeam) {
        return state.getPlayers().stream()
                .filter(player -> player.getTeam() != winningTeam)
                .flatMap(player -> player.getHand().stream())
                .mapToInt(DominoTile::getPipSum)
                .sum();
    }

    private int sumTeamPips(DominoGameState state, int team) {
        return state.getPlayers().stream()
                .filter(player -> player.getTeam() == team)
                .flatMap(player -> player.getHand().stream())
                .mapToInt(DominoTile::getPipSum)
                .sum();
    }

    private void updateRoundPoints(DominoGameState state, int winningTeam, int points) {
        state.getRoundPoints().put("team1", state.getRoundPoints().getOrDefault("team1", 0));
        state.getRoundPoints().put("team2", state.getRoundPoints().getOrDefault("team2", 0));
        state.getTotalPoints().put("team1", state.getTotalPoints().getOrDefault("team1", 0));
        state.getTotalPoints().put("team2", state.getTotalPoints().getOrDefault("team2", 0));

        if (winningTeam == 1) {
            state.getRoundPoints().put("team1", points);
            state.getTotalPoints().put("team1", state.getTotalPoints().get("team1") + points);
        } else if (winningTeam == 2) {
            state.getRoundPoints().put("team2", points);
            state.getTotalPoints().put("team2", state.getTotalPoints().get("team2") + points);
        }
    }

    private boolean maybeFinishMatch(DominoRoom room, DominoGameState state) {
        boolean finished = state.getTotalPoints().getOrDefault("team1", 0) >= 100
                || state.getTotalPoints().getOrDefault("team2", 0) >= 100;
        if (finished) {
            int score1 = state.getTotalPoints().getOrDefault("team1", 0);
            int score2 = state.getTotalPoints().getOrDefault("team2", 0);
            String winnerTeam = score1 >= score2 ? "team1" : "team2";
            state.setWinner(winnerTeam);
            state.setStatus("GAME_END");
            DominoGameState.DominoPlayerState winner = state.getPlayers().stream()
                    .filter(player -> player.getTeam() == (winnerTeam.equals("team1") ? 1 : 2))
                    .findFirst().orElseThrow();
            registerMatchResults(state, winner.getTeam());
            room.setStatus("FINISHED");
            return true;
        }
        prepareNextRound(room, state);
        return false;
    }

    private void registerMatchResults(DominoGameState state, int winningTeam) {
        state.getPlayers().stream().forEach(player -> {
            String status = player.getTeam() == winningTeam ? "PLAYER_WIN" : "PLAYER_LOSE";
            statsService.registerResult(player.getPlayerId(), status);
        });
    }

    private void prepareNextRound(DominoRoom room, DominoGameState state) {
        state.setRoundNumber(state.getRoundNumber() + 1);
        state.setBoard(new ArrayList<>());
        state.setPassCount(0);
        state.setStatus("PLAYING");
        state.setWinner(null);
        state.setRoundPoints(Map.of("team1", 0, "team2", 0));
        state.setCurrentTurnPlayerId(state.getPlayers().get(0).getPlayerId());

        List<DominoTile> pool = generateDominoSet();
        Collections.shuffle(pool);
        state.setPool(room.getMaxPlayers() == 2 ? 14 : 0);

        for (DominoGameState.DominoPlayerState player : state.getPlayers()) {
            player.setHand(new ArrayList<>());
            for (int i = 0; i < 7; i++) {
                if (!pool.isEmpty()) {
                    player.getHand().add(pool.remove(0));
                }
            }
        }

        room.setGameState(serializeState(state));
        dominoRoomRepository.save(room);
    }

    private void persistRoom(DominoRoom room, DominoGameState state) {
        room.setGameState(serializeState(state));
        room.setUpdatedAt(LocalDateTime.now());
        dominoRoomRepository.save(room);
    }

    private void broadcastRooms() {
        List<DominoRoomDTO> rooms = getAvailableRooms();
        messagingTemplate.convertAndSend("/topic/domino.rooms", rooms);
    }

    private void broadcastState(DominoRoom room, DominoGameState state, String type, String message) {
        DominoStateDTO dto = buildStateDTO(state, message);
        Map<String, Object> payload = new HashMap<>();
        payload.put("type", type);
        payload.put("gameId", room.getId());
        payload.put("message", message);
        payload.put("payload", dto);
        messagingTemplate.convertAndSend("/topic/domino." + room.getId(), payload);
    }

    private DominoStateDTO buildStateDTO(DominoGameState state, String message) {
        return DominoStateDTO.builder()
                .gameId(state.getGameId())
                .players(state.getPlayers().stream().map(player -> DominoStateDTO.DominoPlayerDTO.builder()
                        .playerId(player.getPlayerId())
                        .username(player.getUsername())
                        .team(player.getTeam())
                        .turn(player.getPlayerId().equals(state.getCurrentTurnPlayerId()))
                        .hand(player.getHand())
                        .build()).collect(Collectors.toList()))
                .board(state.getBoard())
                .pool(state.getPool())
                .roundPoints(state.getRoundPoints())
                .totalPoints(state.getTotalPoints())
                .winner(state.getWinner())
                .roundNumber(state.getRoundNumber())
                .status(state.getStatus())
                .currentTurnPlayerId(state.getCurrentTurnPlayerId())
                .currentTurnUsername(getCurrentTurnUsername(state))
                .message(message)
                .build();
    }

    private String getCurrentTurnUsername(DominoGameState state) {
        return state.getPlayers().stream()
                .filter(player -> player.getPlayerId().equals(state.getCurrentTurnPlayerId()))
                .map(DominoGameState.DominoPlayerState::getUsername)
                .findFirst().orElse(null);
    }

    private DominoRoomDTO buildRoomDTO(DominoRoom room, String message) {
        return DominoRoomDTO.builder()
                .roomId(room.getId())
                .status(room.getStatus())
                .currentPlayers(room.getPlayerIds().size())
                .maxPlayers(room.getMaxPlayers())
                .playerUsernames(room.getPlayerUsernames())
                .message(message)
                .pool(room.getMaxPlayers() == 2 ? 14 : 0)
                .build();
    }

    private String serializeState(DominoGameState state) {
        try {
            return objectMapper.writeValueAsString(state);
        } catch (Exception e) {
            throw new RuntimeException("Error serializando estado: " + e.getMessage());
        }
    }

    private DominoGameState cloneState(DominoGameState state) {
        try {
            return objectMapper.readValue(objectMapper.writeValueAsString(state), DominoGameState.class);
        } catch (Exception e) {
            throw new RuntimeException("Error clonando estado: " + e.getMessage());
        }
    }

    private void startRound(DominoRoom room) {
        DominoGameState state = new DominoGameState();
        state.setGameId(room.getId());
        state.setRoundNumber(1);
        state.setStatus("PLAYING");
        state.setMaxPlayers(room.getMaxPlayers());

        List<DominoTile> pool = generateDominoSet();
        Collections.shuffle(pool);
        state.setPool(room.getMaxPlayers() == 2 ? 14 : 0);

        for (int i = 0; i < room.getPlayerIds().size(); i++) {
            String playerId = room.getPlayerIds().get(i);
            String username = room.getPlayerUsernames().get(i);
            DominoGameState.DominoPlayerState playerState = new DominoGameState.DominoPlayerState();
            playerState.setPlayerId(playerId);
            playerState.setUsername(username);
            playerState.setTeam(determineTeam(i, room.getMaxPlayers()));
            playerState.setTurn(i == 0);
            playerState.setHand(new ArrayList<>());
            for (int j = 0; j < 7 && !pool.isEmpty(); j++) {
                playerState.getHand().add(pool.remove(0));
            }
            state.getPlayers().add(playerState);
        }

        state.setRoundPoints(Map.of("team1", 0, "team2", 0));
        state.setTotalPoints(Map.of("team1", 0, "team2", 0));
        state.setCurrentTurnPlayerId(room.getPlayerIds().get(0));

        room.setStatus("PLAYING");
        room.setGameState(serializeState(state));
        room.setUpdatedAt(LocalDateTime.now());
        dominoRoomRepository.save(room);

        broadcastRooms();
        broadcastState(room, state, "GAME_START", "Partida de dominó iniciada");
    }

    private int determineTeam(int index, int maxPlayers) {
        if (maxPlayers == 2) return index == 0 ? 1 : 2;
        return (index % 2 == 0) ? 1 : 2;
    }

    private List<DominoTile> generateDominoSet() {
        List<DominoTile> tiles = new ArrayList<>();
        for (int left = 0; left <= 6; left++) {
            for (int right = left; right <= 6; right++) {
                tiles.add(new DominoTile(left, right));
            }
        }
        Collections.shuffle(tiles);
        return tiles;
    }
}
