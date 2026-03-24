import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../hooks/useWebSocket';
import api from '../api/axios';
import GameHeader from '../components/layout/GameHeader';
import CardHand from '../components/game/CardHand';
import PrimaryButton from '../components/ui/PrimaryButton';
import { t } from '../styles/theme';

const GAME_LABELS = { blackjack: 'Blackjack', threeseven: 'Tres y Siete', poker: 'Poker' };

// Tipos de mensaje que deben mostrarse en el chat
// FIX #3: excluir STATE_UPDATE para que no aparezca en el chat
const CHAT_VISIBLE_TYPES = new Set(['CHAT', 'JOIN', 'PLAYER_LEFT', 'ACTION_NOTICE', 'GAME_START', 'ERROR']);

export default function OnlineGame() {
  const { gameType } = useParams();
  const { user } = useAuth();

  const [phase, setPhase] = useState('lobby');
  const [roomId, setRoomId] = useState(null);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [roomInfo, setRoomInfo] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatRef = useRef(null);

  const loadAvailableRooms = async () => {
    try {
      const res = await api.get(`/rooms/available/${gameType}`);
      setAvailableRooms(res.data);
    } catch (e) { console.error(e); }
  };

  const fetchRoom = async () => {
    if (!roomId) return;
    try {
      const res = await api.get(`/rooms/available/${gameType}`);
      setAvailableRooms(res.data);
    } catch (e) { console.error(e); }
  };

  const onMessage = (msg) => {
    // FIX #3: solo añadir al chat los tipos relevantes, no STATE_UPDATE
    if (CHAT_VISIBLE_TYPES.has(msg.type)) {
      setMessages(prev => [...prev, msg]);
    }

    if (msg.type === 'GAME_START') {
      if (msg.payload) setRoomInfo(msg.payload);
      setPhase('playing');
    }

    if (msg.type === 'STATE_UPDATE') {
      if (msg.payload) setGameState(msg.payload);
    }

    if (msg.type === 'ACTION_NOTICE' || msg.type === 'JOIN') {
      fetchRoom();
    }

    setTimeout(() => {
      chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
    }, 50);
  };

  const { connected, sendAction, sendChat } = useWebSocket(roomId, onMessage, user.playerId);

  useEffect(() => { loadAvailableRooms(); }, []);

  const createRoom = async () => {
    setLoading(true);
    try {
      const res = await api.post(`/rooms/create/${gameType}`);
      setRoomId(res.data.roomId);
      setRoomInfo(res.data);
      setPhase('waiting');
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const joinRoom = async (id) => {
    setLoading(true);
    try {
      const res = await api.post(`/rooms/join/${id}`);
      setRoomId(id);
      setRoomInfo(res.data);
      setPhase('waiting');
      // Si la sala ya pasó a PLAYING (llena), ponemos fase playing.
      // FIX #1: el estado de cartas llegará por WebSocket desde
      // resendStateIfPlaying() cuando el hook se conecte y envíe /connect
      if (res.data.status === 'PLAYING') setPhase('playing');
    } catch (e) {
      alert(e.response?.data?.message || 'Error al unirse');
    }
    setLoading(false);
  };

  const handleAction = (action) => sendAction(action, user.playerId);

  const handleChat = () => {
    if (!chatInput.trim()) return;
    sendChat(chatInput, user.username);
    setChatInput('');
  };

  // FIX #2: usar SOLO gameState para determinar el turno actual.
  // roomInfo.currentTurnUsername nunca se actualiza tras el GAME_START
  // y causaba que ambos jugadores vieran "Tu turno" simultáneamente.
  const isMyTurn = gameState?.currentTurnUsername === user.username;

  const connectionIndicator = (
    <div style={{ color: connected ? t.win : t.loss, fontSize: '0.85rem', fontFamily: t.fontBody }}>
      {connected ? '● Conectado' : '○ Desconectado'}
    </div>
  );

  return (
    <div style={s.container}>
      <GameHeader
        title={`🌐 ${GAME_LABELS[gameType]} Online`}
        right={connectionIndicator}
      />

      <main style={s.main}>

        {/* ── LOBBY ── */}
        {phase === 'lobby' && (
          <div style={s.lobbyBox}>
            <h2 style={s.subtitle}>Salas disponibles</h2>
            <div style={s.lobbyActions}>
              <PrimaryButton onClick={createRoom} disabled={loading}>
                {loading ? '...' : '+ Crear sala'}
              </PrimaryButton>
              <button style={s.btnOutline} onClick={loadAvailableRooms}>
                🔄 Actualizar
              </button>
            </div>

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
            <p style={s.waitCode}>
              Código de sala: <strong style={{ color: t.gold }}>{roomId?.slice(-6)}</strong>
            </p>
            <p style={s.hint}>Comparte el código con tu rival para que se una</p>
            {connected && <p style={{ color: t.win, fontFamily: t.fontBody }}>✓ Conectado al WebSocket</p>}
          </div>
        )}

        {/* ── PLAYING ── */}
        {phase === 'playing' && (
          <div style={s.gameArea}>
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
              {gameState?.status && gameState.status !== 'PLAYING' && (
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

              {/* Manos — reutiliza CardHand */}
              {gameState?.dealerHand && (
                <CardHand
                  title={`Dealer — ${gameState.dealerScore} pts`}
                  cards={gameState.dealerHand}
                />
              )}
              {gameState?.playerHand && (
                <CardHand
                  title={`Tu mano — ${gameState.playerScore} pts`}
                  cards={gameState.playerHand}
                />
              )}

              {gameState?.message && <p style={s.gameMessage}>{gameState.message}</p>}

              {/* Acciones en partida */}
              {gameState?.status === 'PLAYING' && isMyTurn && (
                <div style={s.actions}>
                  {gameType === 'blackjack' && (
                    <>
                      <button style={s.btnHit}   onClick={() => handleAction('HIT')}>👊 Hit</button>
                      <button style={s.btnStand} onClick={() => handleAction('STAND')}>✋ Stand</button>
                    </>
                  )}
                  {gameType === 'poker' && (
                    <>
                      <button style={s.btnHit}   onClick={() => handleAction('CHECK')}>✅ Check</button>
                      <button style={s.btnStand} onClick={() => handleAction('FOLD')}>🏳️ Fold</button>
                    </>
                  )}
                </div>
              )}

              {/* Volver al lobby */}
              {gameState?.status && gameState.status !== 'PLAYING' && (
                <div style={s.actions}>
                  <PrimaryButton onClick={() => { setPhase('lobby'); setGameState(null); loadAvailableRooms(); }}>
                    🔄 Volver al lobby online
                  </PrimaryButton>
                </div>
              )}
            </div>

            {/* ── CHAT ── */}
            <div style={s.chatPanel}>
              <h3 style={s.chatTitle}>💬 Chat</h3>
              <div style={s.chatMessages} ref={chatRef}>
                {messages.map((msg, i) => (
                  <div key={i} style={{
                    ...s.chatMsg,
                    background:
                      msg.type === 'CHAT'         ? 'rgba(201,168,76,0.08)'  :
                      msg.type === 'ERROR'        ? 'rgba(248,113,113,0.12)' :
                      msg.type === 'GAME_START'   ? 'rgba(74,222,128,0.1)'   :
                      'rgba(255,255,255,0.04)',
                    borderColor:
                      msg.type === 'CHAT'         ? t.border                       :
                      msg.type === 'ERROR'        ? 'rgba(248,113,113,0.3)'        :
                      msg.type === 'GAME_START'   ? 'rgba(74,222,128,0.25)'        :
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

  // Lobby
  lobbyBox: { maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' },
  subtitle: { color: t.gold, fontFamily: t.fontDisplay, fontSize: '1.3rem', fontWeight: 700, margin: '0 0 0.25rem' },
  lobbyActions: { display: 'flex', gap: '0.75rem' },
  btnOutline: { padding: '0.85rem 1.5rem', borderRadius: '8px', border: `1px solid ${t.border}`, background: 'transparent', color: t.gold, cursor: 'pointer', fontSize: '0.9rem', fontFamily: t.fontBody, transition: 'all 0.2s' },
  empty: { color: t.textSecondary, textAlign: 'center', padding: '2rem', fontFamily: t.fontBody },
  roomList: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  roomRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: t.bg2, border: `1px solid ${t.border}`, padding: '1rem 1.25rem', borderRadius: '10px', boxShadow: t.shadowCard },
  roomCode: { fontWeight: 700, color: t.gold, fontFamily: t.fontDisplay, fontSize: '0.95rem', letterSpacing: '0.05em' },
  roomPlayers: { color: t.textSecondary, fontSize: '0.82rem', marginTop: '0.2rem', fontFamily: t.fontBody },
  btnJoin: { padding: '0.5rem 1.25rem', borderRadius: '6px', border: `1px solid rgba(74,222,128,0.4)`, background: 'rgba(74,222,128,0.1)', color: t.win, fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', fontFamily: t.fontBody },

  // Waiting
  waitingBox: { textAlign: 'center', marginTop: '4rem' },
  spinner: { fontSize: '3rem', marginBottom: '1rem' },
  waitCode: { color: t.textSecondary, fontSize: '1.1rem', margin: '1rem 0', fontFamily: t.fontBody },
  hint: { color: t.textMuted, fontSize: '0.9rem', fontFamily: t.fontBody },

  // Playing
  gameArea: { display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem' },
  gamePanel: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  turnBanner: { textAlign: 'center', padding: '0.75rem', borderRadius: '8px', border: '1px solid', background: 'rgba(0,0,0,0.3)', fontWeight: '700', fontFamily: t.fontBody, backdropFilter: 'blur(8px)' },
  resultBanner: { textAlign: 'center', padding: '1rem', borderRadius: '8px', border: '1px solid', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' },
  gameMessage: { color: t.textSecondary, fontStyle: 'italic', textAlign: 'center', fontFamily: t.fontBody, fontSize: '0.9rem' },
  actions: { display: 'flex', gap: '1rem', justifyContent: 'center' },
  btnHit:   { padding: '0.85rem 2rem', borderRadius: '8px', border: '1px solid rgba(74,222,128,0.4)',  background: 'rgba(74,222,128,0.1)',  color: t.win,  fontSize: '0.95rem', fontWeight: '700', cursor: 'pointer', fontFamily: t.fontBody },
  btnStand: { padding: '0.85rem 2rem', borderRadius: '8px', border: '1px solid rgba(248,113,113,0.4)', background: 'rgba(248,113,113,0.1)', color: t.loss, fontSize: '0.95rem', fontWeight: '700', cursor: 'pointer', fontFamily: t.fontBody },

  // Chat
  chatPanel: { background: t.bg2, borderRadius: '12px', border: `1px solid ${t.border}`, padding: '1.25rem', display: 'flex', flexDirection: 'column', height: '500px', boxShadow: t.shadowCard },
  chatTitle: { color: t.gold, fontFamily: t.fontDisplay, fontSize: '1rem', fontWeight: 600, margin: '0 0 0.75rem', letterSpacing: '0.05em' },
  chatMessages: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.75rem' },
  chatMsg: { padding: '0.4rem 0.75rem', borderRadius: '6px', fontSize: '0.85rem', border: '1px solid', fontFamily: t.fontBody },
  chatInputRow: { display: 'flex', gap: '0.5rem' },
  chatInput: { flex: 1, padding: '0.6rem 0.875rem', borderRadius: '6px', border: `1px solid ${t.border}`, background: t.bg3, color: t.textPrimary, fontFamily: t.fontBody, fontSize: '0.875rem', outline: 'none' },
  btnSend: { padding: '0.6rem 0.875rem', borderRadius: '6px', border: `1px solid ${t.goldDark}`, background: `linear-gradient(135deg, ${t.goldDark}, ${t.gold})`, color: t.bg0, fontWeight: '700', cursor: 'pointer' },
};