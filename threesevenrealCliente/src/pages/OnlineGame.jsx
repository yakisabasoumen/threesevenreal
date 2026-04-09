import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { useWebSocket } from '../hooks/useWebSocket';
import api from '../api/axios';
import GameHeader from '../components/layout/GameHeader';
import CardHand from '../components/game/CardHand';
import DominoTileCard from '../components/game/DominoTileCard';
import PrimaryButton from '../components/ui/PrimaryButton';
import { t } from '../styles/theme';

const GAME_LABELS = { blackjack: 'Blackjack', threeseven: 'Tres y Siete', poker: 'Poker', domino: 'Dominó' };
const CHAT_VISIBLE_TYPES = new Set(['CHAT', 'JOIN', 'PLAYER_LEFT', 'ACTION_NOTICE', 'GAME_START', 'ROUND_END', 'GAME_END', 'ERROR']);

export default function OnlineGame() {
  const { gameType } = useParams();
  const { user } = useAuth();

  const [phase, setPhase]               = useState('lobby');
  const [roomId, setRoomId]             = useState(null);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [gameState, setGameState]       = useState(null);
  const [messages, setMessages]         = useState([]);
  const [chatInput, setChatInput]       = useState('');
  const [loading, setLoading]           = useState(false);
  const [dominoRoomSize, setDominoRoomSize] = useState(2);
  const [selectedTileIndex, setSelectedTileIndex] = useState(null);
  const [selectedSide, setSelectedSide] = useState('LEFT');
  const chatRef = useRef(null);

  const loadAvailableRooms = useCallback(async () => {
    try {
      const res = gameType === 'domino'
        ? await api.get(`/domino/rooms?maxPlayers=${dominoRoomSize}`)
        : await api.get(`/rooms/available/${gameType}`);
      setAvailableRooms(res.data);
    } catch (e) { console.error(e); }
  }, [gameType, dominoRoomSize]);

  const onMessage = (msg) => {
    if (msg.type === 'ERROR' && msg.playerId !== user.playerId) {
      return;
    }
    if (CHAT_VISIBLE_TYPES.has(msg.type)) {
      setMessages(prev => [...prev, msg]);
    }
    if (msg.type === 'GAME_START' || msg.type === 'ROUND_END' || msg.type === 'GAME_END') {
      if (msg.payload) {
        setGameState(msg.payload);
      }
      setPhase('playing');
    }
    if (msg.type === 'STATE_UPDATE') {
      if (msg.payload) setGameState(msg.payload);
    }
    if (msg.type === 'ACTION_NOTICE' || msg.type === 'JOIN') {
      loadAvailableRooms();
    }
    setTimeout(() => {
      chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
    }, 50);
  };

  const { connected, sendAction, sendChat, playerStreak } = useWebSocket(roomId, onMessage, user.playerId, gameType);

  useEffect(() => { loadAvailableRooms(); }, [loadAvailableRooms]);

  const createRoom = async () => {
    setLoading(true);
    try {
      const res = gameType === 'domino'
        ? await api.post('/domino/create', null, { params: { maxPlayers: dominoRoomSize } })
        : await api.post(`/rooms/create/${gameType}`);
      setRoomId(res.data.roomId);
      setPhase('waiting');
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const joinRoom = async (id) => {
    setLoading(true);
    try {
      const res = gameType === 'domino'
        ? await api.post(`/domino/join/${id}`)
        : await api.post(`/rooms/join/${id}`);
      setRoomId(id);
      setPhase('waiting');
      if (res.data.status === 'PLAYING') setPhase('playing');
    } catch (e) {
      alert(e.response?.data?.message || 'Error al unirse');
    }
    setLoading(false);
  };

  const handleAction  = (action) => sendAction(action, user.playerId);
  const handleChat    = () => {
    if (!chatInput.trim()) return;
    sendChat(chatInput, user.username);
    setChatInput('');
  };

  const leaveGame = async () => {
    if (gameType === 'domino' && roomId && isDominoPlaying) {
      handleAction({ action: 'ABANDON' });
    }
    setPhase('lobby');
    setGameState(null);
    setRoomId(null);
    setMessages([]);
    loadAvailableRooms();
  };

  const myDominoPlayer = gameState?.players?.find(player => player.playerId === user.playerId);
  const isMyTurn = gameType === 'domino'
    ? gameState?.currentTurnPlayerId === user.playerId || myDominoPlayer?.turn === true
    : gameType === 'threeseven'
      ? gameState?.myTurn === true
      : gameState?.currentTurnUsername === user.username;

  const isDominoPlaying = gameType === 'domino' && gameState?.status === 'PLAYING';
  const canDraw = isDominoPlaying && isMyTurn && gameState?.pool > 0;
  const canPass = isDominoPlaying && gameState?.pool <= 0;
  const isFinished = gameState?.status && gameState.status !== 'PLAYING';

  const connectionIndicator = (
    <div style={{ color: connected ? t.win : t.loss, fontSize: '0.85rem', fontFamily: t.fontBody }}>
      {connected ? '● Conectado' : '○ Desconectado'}
    </div>
  );

  // ── Panel de juego según gameType ──────────────────────────────────────────
  const renderGamePanel = () => {
    if (gameType === 'domino') return renderDominoPanel();
    if (gameType === 'threeseven') return renderThreeSevenPanel();
    return renderBlackjackPanel();
  };

  const renderDominoPanel = () => (
    <div style={s.gamePanel}>
      <div style={{
        ...s.turnBanner,
        borderColor: isMyTurn ? t.win : t.loss,
        boxShadow: `0 0 16px ${isMyTurn ? t.win : t.loss}33`,
      }}>
        <span style={{ color: isMyTurn ? t.win : t.loss }}>
          {isMyTurn ? '🟢 Tu turno' : `⏳ Turno de ${gameState?.currentTurnUsername || '...'}`}
        </span>
      </div>

      <div style={s.dominoScoreboard}>
        <div style={s.dominoScoreBox}>
          <span style={s.dominoScoreLabel}>Equipo A</span>
          <strong>{gameState?.totalPoints?.team1 ?? 0}</strong>
        </div>
        <div style={s.dominoScoreBox}>
          <span style={s.dominoScoreLabel}>Equipo B</span>
          <strong>{gameState?.totalPoints?.team2 ?? 0}</strong>
        </div>
        <div style={s.dominoScoreBox}>
          <span style={s.dominoScoreLabel}>Ronda</span>
          <strong>{gameState?.roundNumber ?? 1}</strong>
        </div>
      </div>

      <div style={s.dominoBoard}>
        {gameState?.board?.length > 0 ? gameState.board.map((tile, index) => (
          <DominoTileCard
            key={index}
            left={tile.left}
            right={tile.right}
            small
            compact={gameState.board.length > 18}
          />
        )) : (
          <div style={s.dominoEmpty}>La mesa está vacía. Juega cualquier ficha.</div>
        )}
      </div>

      {gameState?.message && <p style={s.gameMessage}>{gameState.message}</p>}

      <div style={s.playerHandPanel}>
        <div style={s.playerHandTitle}>Tu mano</div>
        <div style={s.dominoHand}>
          {myDominoPlayer?.hand?.map((tile, index) => (
            <button
              key={index}
              style={{
                ...s.dominoHandTile,
                borderColor: selectedTileIndex === index ? t.gold : t.border,
              }}
              onClick={() => setSelectedTileIndex(index)}
              type="button"
            >
              <DominoTileCard left={tile.left} right={tile.right} small />
            </button>
          ))}
        </div>
      </div>

      <div style={s.dominoActions}>
        <div style={s.dominoActionGroup}>
          <button
            style={selectedSide === 'LEFT' ? s.dominoSideActive : s.dominoSideButton}
            type="button"
            onClick={() => setSelectedSide('LEFT')}
          >
            Izquierda
          </button>
          <button
            style={selectedSide === 'RIGHT' ? s.dominoSideActive : s.dominoSideButton}
            type="button"
            onClick={() => setSelectedSide('RIGHT')}
          >
            Derecha
          </button>
        </div>
        <div style={s.dominoActionGroup}>
          <button
            style={s.btnHit}
            onClick={() => handleAction({ action: 'PLAY', tileIndex: selectedTileIndex, side: selectedSide })}
            disabled={!isDominoPlaying || !isMyTurn || selectedTileIndex === null}
          >
            🧩 Jugar ficha
          </button>
          <button
            style={s.btnStand}
            onClick={() => handleAction({ action: 'DRAW' })}
            disabled={!canDraw}
          >
            📥 Robar
          </button>
          {gameState?.pool <= 0 && (
            <button
              style={s.btnOutline}
              onClick={() => handleAction({ action: 'PASS' })}
              disabled={!canPass}
            >
              ⏭ Pasar
            </button>
          )}
          <button
            style={s.btnSurrender}
            onClick={() => handleAction({ action: 'SURRENDER' })}
            disabled={!isDominoPlaying}
          >
            🏳️ Rendirse
          </button>
        </div>
        {isDominoPlaying && (
          <div style={s.actions}>
            <button
              style={s.btnLeave}
              type="button"
              onClick={leaveGame}
            >
              🚪 Salir al lobby (abandonar)
            </button>
          </div>
        )}
      </div>

      {isFinished && (
        <div style={s.actions}>
          <PrimaryButton onClick={leaveGame}>
            🔄 Volver al lobby online
          </PrimaryButton>
        </div>
      )}
    </div>
  );

  const renderThreeSevenPanel = () => (
    <div style={s.gamePanel}>

      {/* Turno */}
      <div style={{
        ...s.turnBanner,
        borderColor: isMyTurn ? t.win : t.loss,
        boxShadow: `0 0 16px ${isMyTurn ? t.win : t.loss}33`,
      }}>
        <span style={{ color: isMyTurn ? t.win : t.loss }}>
          {isMyTurn ? '🟢 Tu turno' : `⏳ Turno de ${gameState?.currentTurnUsername || '...'}`}
        </span>
      </div>

      {/* Resultado */}
      {isFinished && (
        <div style={{
          ...s.resultBanner,
          borderColor: gameState.status === 'PLAYER_WIN' ? t.win : gameState.status === 'PUSH' ? t.gold : t.loss,
          boxShadow: `0 0 24px ${gameState.status === 'PLAYER_WIN' ? t.win : t.loss}40`,
        }}>
          <span style={{
            color: gameState.status === 'PLAYER_WIN' ? t.win : gameState.status === 'PUSH' ? t.gold : t.loss,
            fontSize: '1.3rem', fontWeight: 700, fontFamily: t.fontDisplay,
          }}>
            {gameState.status === 'PLAYER_WIN' ? '✦ ¡Ganaste!' : gameState.status === 'PUSH' ? '✦ ¡Empate!' : '✦ Has perdido'}
          </span>
        </div>
      )}

      {/* Mano rival — oculta hasta FINISHED */}
      {isFinished && gameState?.opponentHand ? (
        <CardHand
          title={`${gameState.opponentUsername || 'Rival'} — ${gameState.opponentHandRank} (${gameState.opponentHandScore} pts)`}
          cards={gameState.opponentHand}
        />
      ) : (
        <div style={s.hiddenHand}>
          <span style={{ color: t.textSecondary, fontFamily: t.fontBody, fontSize: '0.9rem' }}>
            🂠 Mano de {gameState?.opponentUsername || 'rival'} oculta
          </span>
        </div>
      )}

      {/* Mi mano */}
      {gameState?.myHand && (
        <CardHand
          title={`Tu mano — ${gameState.myHandRank || ''} (${gameState.myHandScore} pts)`}
          cards={gameState.myHand}
        />
      )}

      {gameState?.message && <p style={s.gameMessage}>{gameState.message}</p>}

      {/* Acciones */}
      {!isFinished && isMyTurn && (
        <div style={s.actions}>
          <button style={s.btnHit}   onClick={() => handleAction('HIT')}>🃏 Pedir carta</button>
          <button style={s.btnStand} onClick={() => handleAction('STAND')}>✋ Plantarse</button>
        </div>
      )}

      {/* Volver al lobby */}
      {isFinished && (
        <div style={s.actions}>
          <PrimaryButton onClick={() => { setPhase('lobby'); setGameState(null); loadAvailableRooms(); }}>
            🔄 Volver al lobby online
          </PrimaryButton>
        </div>
      )}
    </div>
  );

  const renderBlackjackPanel = () => (
    <div style={s.gamePanel}>
      <div style={{
        ...s.turnBanner,
        borderColor: isMyTurn ? t.win : t.loss,
        boxShadow: `0 0 16px ${isMyTurn ? t.win : t.loss}33`,
      }}>
        <span style={{ color: isMyTurn ? t.win : t.loss }}>
          {isMyTurn ? '🟢 Tu turno' : `⏳ Turno de ${gameState?.currentTurnUsername || '...'}`}
        </span>
      </div>

      {isFinished && (
        <div style={{
          ...s.resultBanner,
          borderColor: gameState.status === 'PLAYER_WIN' ? t.win : t.loss,
          boxShadow: `0 0 24px ${gameState.status === 'PLAYER_WIN' ? t.win : t.loss}40`,
        }}>
          <span style={{ color: gameState.status === 'PLAYER_WIN' ? t.win : t.loss, fontSize: '1.3rem', fontWeight: 700, fontFamily: t.fontDisplay }}>
            {gameState.status === 'PLAYER_WIN' ? '✦ ¡Ganaste!' : gameState.status === 'PUSH' ? '✦ ¡Empate!' : '✦ Has perdido'}
          </span>
        </div>
      )}

      {gameState?.dealerHand && (
        <CardHand title={`Dealer — ${gameState.dealerScore} pts`} cards={gameState.dealerHand} />
      )}
      {gameState?.playerHand && (
        <CardHand title={`Tu mano — ${gameState.playerScore} pts`} cards={gameState.playerHand} />
      )}

      {gameState?.message && <p style={s.gameMessage}>{gameState.message}</p>}

      {!isFinished && isMyTurn && (
        <div style={s.actions}>
          <button style={s.btnHit}   onClick={() => handleAction('HIT')}>👊 Hit</button>
          <button style={s.btnStand} onClick={() => handleAction('STAND')}>✋ Stand</button>
        </div>
      )}

      {isFinished && (
        <div style={s.actions}>
          <PrimaryButton onClick={() => { setPhase('lobby'); setGameState(null); loadAvailableRooms(); }}>
            🔄 Volver al lobby online
          </PrimaryButton>
        </div>
      )}
    </div>
  );

  return (
    <div style={s.container}>
      <GameHeader title={`🌐 ${GAME_LABELS[gameType]} Online - Racha: ${playerStreak.winStreak}`} right={connectionIndicator} />

      <main style={s.main}>

        {/* ── LOBBY ── */}
        {phase === 'lobby' && (
          <div style={s.lobbyBox}>
            <h2 style={s.subtitle}>Salas disponibles</h2>
            <div style={s.lobbyActions}>
              <PrimaryButton onClick={createRoom} disabled={loading}>
                {loading ? '...' : '+ Crear sala'}
              </PrimaryButton>
              <button style={s.btnOutline} onClick={loadAvailableRooms}>🔄 Actualizar</button>
            </div>
            {gameType === 'domino' && (
              <div style={s.dominoRoomSizeRow}>
                <span style={s.subtitle}>Tamaño de sala</span>
                <select
                  style={s.dominoRoomSizeSelect}
                  value={dominoRoomSize}
                  onChange={(e) => setDominoRoomSize(Number(e.target.value))}
                >
                  <option value={2}>2 jugadores</option>
                  <option value={4}>4 jugadores</option>
                </select>
              </div>
            )}
            {availableRooms.length === 0 ? (
              <p style={s.empty}>No hay salas disponibles. ¡Crea una!</p>
            ) : (
              <div style={s.roomList}>
                {availableRooms.map(room => (
                  <div key={room.roomId} style={s.roomRow}>
                    <div>
                      <div style={s.roomCode}>Sala {room.roomId.slice(-6)}</div>
                      <div style={s.roomPlayers}>
                        {room.playerUsernames.join(', ')} · {room.currentPlayers}/{room.maxPlayers} jugadores
                      </div>
                    </div>
                    <button style={s.btnJoin} onClick={() => joinRoom(room.roomId)} disabled={loading}>
                      Unirse
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── WAITING ── */}
        {phase === 'waiting' && (
          <div style={s.waitingBox}>
            <div style={s.spinner}>⏳</div>
            <h2 style={s.subtitle}>Esperando rival...</h2>
            <p style={s.waitCode}>Código de sala: <strong style={{ color: t.gold }}>{roomId?.slice(-6)}</strong></p>
            <p style={s.hint}>Comparte el código con tu rival para que se una</p>
            {connected && <p style={{ color: t.win, fontFamily: t.fontBody }}>✓ Conectado al WebSocket</p>}
          </div>
        )}

        {/* ── PLAYING ── */}
        {phase === 'playing' && (
          <div style={s.gameArea}>
            {renderGamePanel()}

            {/* ── CHAT ── */}
            <div style={s.chatPanel}>
              <h3 style={s.chatTitle}>💬 Chat</h3>
              <div style={s.chatMessages} ref={chatRef}>
                {messages.map((msg, i) => (
                  <div key={i} style={{
                    ...s.chatMsg,
                    background:
                      msg.type === 'CHAT'       ? 'rgba(201,168,76,0.08)'  :
                      msg.type === 'ERROR'      ? 'rgba(248,113,113,0.12)' :
                      msg.type === 'GAME_START' ? 'rgba(74,222,128,0.1)'   :
                      'rgba(255,255,255,0.04)',
                    borderColor:
                      msg.type === 'CHAT'       ? t.border                    :
                      msg.type === 'ERROR'      ? 'rgba(248,113,113,0.3)'     :
                      msg.type === 'GAME_START' ? 'rgba(74,222,128,0.25)'     :
                      'rgba(255,255,255,0.06)',
                  }}>
                    {msg.type === 'CHAT'
                      ? <><strong style={{ color: t.gold }}>{msg.username}: </strong><span style={{ color: t.textPrimary }}>{msg.message}</span></>
                      : <span style={{ color: t.textSecondary, fontSize: '0.82rem' }}>{msg.message || msg.type}</span>
                    }
                  </div>
                ))}
              </div>
              <div style={s.chatInputRow}>
                <input
                  style={s.chatInput}
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleChat()}
                  placeholder="Escribe un mensaje..."
                />
                <button style={s.btnSend} onClick={handleChat}>➤</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const s = {
  container: { minHeight: '100vh', background: t.bg0, color: t.textPrimary },
  main: { padding: '2rem', maxWidth: '1100px', margin: '0 auto' },

  lobbyBox: { maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' },
  subtitle: { color: t.gold, fontFamily: t.fontDisplay, fontSize: '1.3rem', fontWeight: 700, margin: '0 0 0.25rem' },
  lobbyActions: { display: 'flex', gap: '0.75rem' },
  dominoRoomSizeRow: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.75rem' },
  dominoRoomSizeSelect: { padding: '0.75rem 1rem', borderRadius: '8px', border: `1px solid ${t.border}`, background: t.bg3, color: t.textPrimary, fontFamily: t.fontBody },
  btnOutline: { padding: '0.85rem 1.5rem', borderRadius: '8px', border: `1px solid ${t.border}`, background: 'transparent', color: t.gold, cursor: 'pointer', fontSize: '0.9rem', fontFamily: t.fontBody, transition: 'all 0.2s' },
  empty: { color: t.textSecondary, textAlign: 'center', padding: '2rem', fontFamily: t.fontBody },
  roomList: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  roomRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: t.bg2, border: `1px solid ${t.border}`, padding: '1rem 1.25rem', borderRadius: '10px', boxShadow: t.shadowCard },
  roomCode: { fontWeight: 700, color: t.gold, fontFamily: t.fontDisplay, fontSize: '0.95rem', letterSpacing: '0.05em' },
  roomPlayers: { color: t.textSecondary, fontSize: '0.82rem', marginTop: '0.2rem', fontFamily: t.fontBody },
  btnJoin: { padding: '0.5rem 1.25rem', borderRadius: '6px', border: `1px solid rgba(74,222,128,0.4)`, background: 'rgba(74,222,128,0.1)', color: t.win, fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', fontFamily: t.fontBody },

  waitingBox: { textAlign: 'center', marginTop: '4rem' },
  spinner: { fontSize: '3rem', marginBottom: '1rem' },
  waitCode: { color: t.textSecondary, fontSize: '1.1rem', margin: '1rem 0', fontFamily: t.fontBody },
  hint: { color: t.textMuted, fontSize: '0.9rem', fontFamily: t.fontBody },

  gameArea: { display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem' },
  gamePanel: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  turnBanner: { textAlign: 'center', padding: '0.75rem', borderRadius: '8px', border: '1px solid', background: 'rgba(0,0,0,0.3)', fontWeight: '700', fontFamily: t.fontBody, backdropFilter: 'blur(8px)' },
  resultBanner: { textAlign: 'center', padding: '1rem', borderRadius: '8px', border: '1px solid', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' },
  hiddenHand: { background: t.bg2, border: `1px dashed ${t.border}`, borderRadius: '12px', padding: '1.5rem', textAlign: 'center' },
  gameMessage: { color: t.textSecondary, fontStyle: 'italic', textAlign: 'center', fontFamily: t.fontBody, fontSize: '0.9rem' },
  dominoScoreboard: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(120px, 1fr))', gap: '0.75rem' },
  dominoScoreBox: { background: t.bg3, border: `1px solid ${t.border}`, borderRadius: '12px', padding: '1rem', textAlign: 'center', boxShadow: t.shadowCard },
  dominoScoreLabel: { color: t.textSecondary, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '0.35rem' },
  dominoBoard: { minHeight: '110px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(48px, 1fr))', gap: '0.35rem', alignContent: 'center', justifyItems: 'center', background: 'radial-gradient(circle at top, rgba(78, 175, 123, 0.08), transparent 60%), ' + t.bg3, border: `1px solid ${t.border}`, borderRadius: '18px', padding: '1rem', boxShadow: t.shadowCard, overflowX: 'auto' },
  dominoEmpty: { color: t.textSecondary, fontFamily: t.fontBody, textAlign: 'center', width: '100%' },
  playerHandPanel: { display: 'flex', flexDirection: 'column', gap: '0.65rem' },
  playerHandTitle: { color: t.gold, fontSize: '0.95rem', fontFamily: t.fontDisplay, fontWeight: 700 },
  dominoHand: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(70px, 1fr))', gap: '0.5rem' },
  dominoHandTile: { padding: 0, background: 'transparent', borderRadius: '12px', border: `1px solid ${t.border}`, cursor: 'pointer' },
  dominoActions: { display: 'grid', gap: '0.75rem', marginTop: '1rem' },
  dominoActionGroup: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' },
  dominoSideButton: { padding: '0.8rem 1rem', borderRadius: '8px', border: `1px solid ${t.border}`, background: 'transparent', color: t.textPrimary, cursor: 'pointer', fontFamily: t.fontBody },
  dominoSideActive: { padding: '0.8rem 1rem', borderRadius: '8px', border: `1px solid ${t.gold}`, background: 'rgba(250,214,165,0.12)', color: t.gold, cursor: 'pointer', fontFamily: t.fontBody },
  actions: { display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' },
  btnHit:   { padding: '0.85rem 1.5rem', borderRadius: '8px', border: '1px solid rgba(74,222,128,0.4)',  background: 'rgba(74,222,128,0.1)',  color: t.win,  fontSize: '0.9rem', fontWeight: '700', cursor: 'pointer', fontFamily: t.fontBody, minWidth: '120px' },
  btnStand: { padding: '0.85rem 1.5rem', borderRadius: '8px', border: '1px solid rgba(248,113,113,0.4)', background: 'rgba(248,113,113,0.1)', color: t.loss, fontSize: '0.9rem', fontWeight: '700', cursor: 'pointer', fontFamily: t.fontBody, minWidth: '120px' },
  btnSurrender: { padding: '0.85rem 1.5rem', borderRadius: '8px', border: '1px solid rgba(250,170,60,0.4)', background: 'rgba(250,170,60,0.12)', color: t.gold, fontSize: '0.9rem', fontWeight: '700', cursor: 'pointer', fontFamily: t.fontBody, minWidth: '120px' },
  btnLeave: { padding: '0.85rem 1.5rem', borderRadius: '8px', border: '1px solid rgba(248,113,113,0.5)', background: 'rgba(248,113,113,0.12)', color: t.loss, fontSize: '0.9rem', fontWeight: '700', cursor: 'pointer', fontFamily: t.fontBody, minWidth: '180px' },

  chatPanel: { background: t.bg2, borderRadius: '12px', border: `1px solid ${t.border}`, padding: '1.25rem', display: 'flex', flexDirection: 'column', height: '500px', boxShadow: t.shadowCard },
  chatTitle: { color: t.gold, fontFamily: t.fontDisplay, fontSize: '1rem', fontWeight: 600, margin: '0 0 0.75rem', letterSpacing: '0.05em' },
  chatMessages: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.75rem' },
  chatMsg: { padding: '0.4rem 0.75rem', borderRadius: '6px', fontSize: '0.85rem', border: '1px solid', fontFamily: t.fontBody },
  chatInputRow: { display: 'flex', gap: '0.5rem' },
  chatInput: { flex: 1, padding: '0.6rem 0.875rem', borderRadius: '6px', border: `1px solid ${t.border}`, background: t.bg3, color: t.textPrimary, fontFamily: t.fontBody, fontSize: '0.875rem', outline: 'none' },
  btnSend: { padding: '0.6rem 0.875rem', borderRadius: '6px', border: `1px solid ${t.goldDark}`, background: `linear-gradient(135deg, ${t.goldDark}, ${t.gold})`, color: t.bg0, fontWeight: '700', cursor: 'pointer' },
};