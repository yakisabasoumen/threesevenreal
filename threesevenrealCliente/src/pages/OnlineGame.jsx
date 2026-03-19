import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWebSocket } from '../hooks/useWebSocket';
import api from '../api/axios';

function CardDisplay({ card }) {
  const suits = { HEARTS: '♥', DIAMONDS: '♦', CLUBS: '♣', SPADES: '♠' };
  const isRed = ['HEARTS', 'DIAMONDS'].includes(card.suit);
  return (
    <div style={{ ...styles.card, color: isRed ? '#e74c3c' : '#fff' }}>
      <div>{card.rank}</div>
      <div style={{ fontSize: '1.3rem' }}>{suits[card.suit] || card.suit}</div>
    </div>
  );
}

export default function OnlineGame() {
  const { gameType } = useParams();
  const navigate = useNavigate();
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
    setMessages(prev => [...prev, msg]);
    if (msg.type === 'GAME_START' || msg.type === 'ACTION') {
      if (msg.payload) setGameState(msg.payload);
      if (msg.type === 'GAME_START') setPhase('playing');
    }
    if (msg.type === 'JOIN') fetchRoom();
    setTimeout(() => { chatRef.current?.scrollTo(0, chatRef.current.scrollHeight); }, 50);
  };

  const { connected, sendAction, sendChat } = useWebSocket(roomId, onMessage);

  useEffect(() => {
    loadAvailableRooms();
  }, []);

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
      if (res.data.status === 'PLAYING') setPhase('playing');
    } catch (e) {
      alert(e.response?.data?.message || 'Error al unirse');
    }
    setLoading(false);
  };

  const handleAction = (action) => {
    sendAction(action, user.playerId);
  };

  const handleChat = () => {
    if (!chatInput.trim()) return;
    sendChat(chatInput, user.username);
    setChatInput('');
  };

  const gameLabels = { blackjack: 'Blackjack', threeseven: 'Tres y Siete', poker: 'Poker' };

  const isMyTurn = gameState?.currentTurnUsername === user.username ||
    roomInfo?.currentTurnUsername === user.username;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button style={styles.btnBack} onClick={() => navigate('/lobby')}>← Volver</button>
        <h1 style={styles.title}>🌐 {gameLabels[gameType]} Online</h1>
        <div style={{ color: connected ? '#2ecc71' : '#e74c3c', fontSize: '0.85rem' }}>
          {connected ? '● Conectado' : '○ Desconectado'}
        </div>
      </header>

      <main style={styles.main}>

        {/* FASE: LOBBY — elegir o crear sala */}
        {phase === 'lobby' && (
          <div style={styles.lobbyBox}>
            <h2 style={styles.subtitle}>Salas disponibles</h2>
            <button style={styles.btnPrimary} onClick={createRoom} disabled={loading}>
              {loading ? '...' : '+ Crear sala'}
            </button>
            <button style={styles.btnOutline} onClick={loadAvailableRooms}>
              🔄 Actualizar
            </button>

            {availableRooms.length === 0 ? (
              <p style={styles.empty}>No hay salas disponibles. ¡Crea una!</p>
            ) : (
              <div style={styles.roomList}>
                {availableRooms.map(room => (
                  <div key={room.roomId} style={styles.roomRow}>
                    <div>
                      <div style={styles.roomId}>Sala {room.roomId.slice(-6)}</div>
                      <div style={styles.roomPlayers}>
                        {room.playerUsernames.join(', ')} · {room.currentPlayers}/{room.maxPlayers} jugadores
                      </div>
                    </div>
                    <button style={styles.btnJoin} onClick={() => joinRoom(room.roomId)} disabled={loading}>
                      Unirse
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* FASE: WAITING — esperando rival */}
        {phase === 'waiting' && (
          <div style={styles.waitingBox}>
            <div style={styles.spinner}>⏳</div>
            <h2 style={styles.subtitle}>Esperando rival...</h2>
            <p style={styles.roomCode}>
              Código de sala: <strong style={{ color: '#4fc3f7' }}>{roomId?.slice(-6)}</strong>
            </p>
            <p style={styles.hint}>Comparte el código con tu rival para que se una</p>
            {connected && <p style={{ color: '#2ecc71' }}>✓ Conectado al WebSocket</p>}
          </div>
        )}

        {/* FASE: PLAYING — juego en curso */}
        {phase === 'playing' && (
          <div style={styles.gameArea}>
            <div style={styles.gamePanel}>

              {/* Info de turno */}
              <div style={{ ...styles.turnBanner, background: isMyTurn ? '#2ecc71' : '#e74c3c' }}>
                {isMyTurn ? '🟢 Tu turno' : `⏳ Turno de ${gameState?.currentTurnUsername || '...'}`}
              </div>

              {/* Estado del juego */}
              {gameState && gameState.status && gameState.status !== 'PLAYING' && (
                <div style={{ ...styles.statusBanner, background: gameState.status === 'PLAYER_WIN' ? '#2ecc71' : '#e74c3c' }}>
                  {gameState.status === 'PLAYER_WIN' ? '🎉 ¡Ganaste!' : '💀 Has perdido'}
                </div>
              )}

              {/* Cartas dealer */}
              {gameState?.dealerHand && (
                <section style={styles.section}>
                  <h3 style={styles.sectionTitle}>Dealer — {gameState.dealerScore} pts</h3>
                  <div style={styles.cards}>
                    {gameState.dealerHand.map((c, i) => <CardDisplay key={i} card={c} />)}
                  </div>
                </section>
              )}

              {/* Cartas jugador */}
              {gameState?.playerHand && (
                <section style={styles.section}>
                  <h3 style={styles.sectionTitle}>Tu mano — {gameState.playerScore} pts</h3>
                  <div style={styles.cards}>
                    {gameState.playerHand.map((c, i) => <CardDisplay key={i} card={c} />)}
                  </div>
                </section>
              )}

              {/* Mensaje */}
              {gameState?.message && <p style={styles.gameMessage}>{gameState.message}</p>}

              {/* Botones de acción */}
              {gameState?.status === 'PLAYING' && isMyTurn && (
                <div style={styles.actions}>
                  {gameType === 'blackjack' && (
                    <>
                      <button style={styles.btnHit} onClick={() => handleAction('HIT')}>👊 Hit</button>
                      <button style={styles.btnStand} onClick={() => handleAction('STAND')}>✋ Stand</button>
                    </>
                  )}
                  {gameType === 'poker' && (
                    <>
                      <button style={styles.btnHit} onClick={() => handleAction('CHECK')}>✅ Check</button>
                      <button style={styles.btnStand} onClick={() => handleAction('FOLD')}>🏳️ Fold</button>
                    </>
                  )}
                </div>
              )}

              {/* Nueva partida si terminó */}
              {gameState?.status && gameState.status !== 'PLAYING' && (
                <div style={styles.actions}>
                  <button style={styles.btnPrimary} onClick={() => { setPhase('lobby'); setGameState(null); loadAvailableRooms(); }}>
                    🔄 Volver al lobby online
                  </button>
                </div>
              )}
            </div>

            {/* Chat */}
            <div style={styles.chatPanel}>
              <h3 style={styles.chatTitle}>💬 Chat</h3>
              <div style={styles.chatMessages} ref={chatRef}>
                {messages.map((msg, i) => (
                  <div key={i} style={{
                    ...styles.chatMsg,
                    background: msg.type === 'CHAT' ? '#0f3460'
                      : msg.type === 'ERROR' ? '#5c1a1a'
                      : msg.type === 'GAME_START' ? '#1a5c2a' : '#1a3a5c'
                  }}>
                    {msg.type === 'CHAT'
                      ? <><strong style={{ color: '#4fc3f7' }}>{msg.username}: </strong>{msg.message}</>
                      : <span style={{ color: '#aaa', fontSize: '0.85rem' }}>{msg.message || msg.type}</span>
                    }
                  </div>
                ))}
              </div>
              <div style={styles.chatInput}>
                <input
                  style={styles.input}
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleChat()}
                  placeholder="Escribe un mensaje..."
                />
                <button style={styles.btnSend} onClick={handleChat}>➤</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', background: '#1a1a2e', color: '#fff' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', background: '#16213e', borderBottom: '1px solid #0f3460' },
  btnBack: { padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #4fc3f7', background: 'transparent', color: '#4fc3f7', cursor: 'pointer' },
  title: { color: '#4fc3f7' },
  main: { padding: '2rem', maxWidth: '1100px', margin: '0 auto' },
  lobbyBox: { maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' },
  subtitle: { color: '#4fc3f7', marginBottom: '0.5rem' },
  empty: { color: '#aaa', textAlign: 'center', padding: '2rem' },
  roomList: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  roomRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#16213e', padding: '1rem', borderRadius: '8px' },
  roomId: { fontWeight: 'bold', color: '#4fc3f7' },
  roomPlayers: { color: '#aaa', fontSize: '0.85rem' },
  waitingBox: { textAlign: 'center', marginTop: '4rem' },
  spinner: { fontSize: '3rem', marginBottom: '1rem' },
  roomCode: { color: '#aaa', fontSize: '1.1rem', margin: '1rem 0' },
  hint: { color: '#666', fontSize: '0.9rem' },
  gameArea: { display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem' },
  gamePanel: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  turnBanner: { textAlign: 'center', padding: '0.75rem', borderRadius: '8px', fontWeight: 'bold', color: '#000' },
  statusBanner: { textAlign: 'center', padding: '1rem', borderRadius: '8px', fontWeight: 'bold', color: '#000', fontSize: '1.2rem' },
  section: { background: '#16213e', borderRadius: '12px', padding: '1rem' },
  sectionTitle: { color: '#4fc3f7', marginBottom: '0.75rem' },
  cards: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' },
  card: { background: '#0f3460', border: '2px solid #4fc3f7', borderRadius: '8px', width: '65px', height: '90px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
  gameMessage: { color: '#aaa', fontStyle: 'italic', textAlign: 'center' },
  actions: { display: 'flex', gap: '1rem', justifyContent: 'center' },
  chatPanel: { background: '#16213e', borderRadius: '12px', padding: '1rem', display: 'flex', flexDirection: 'column', height: '500px' },
  chatTitle: { color: '#4fc3f7', marginBottom: '0.75rem' },
  chatMessages: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.75rem' },
  chatMsg: { padding: '0.4rem 0.75rem', borderRadius: '6px', fontSize: '0.85rem' },
  chatInput: { display: 'flex', gap: '0.5rem' },
  input: { flex: 1, padding: '0.5rem', borderRadius: '6px', border: '1px solid #0f3460', background: '#0f3460', color: '#fff' },
  btnPrimary: { padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', background: '#4fc3f7', color: '#000', fontWeight: 'bold', cursor: 'pointer' },
  btnOutline: { padding: '0.75rem 1.5rem', borderRadius: '8px', border: '1px solid #4fc3f7', background: 'transparent', color: '#4fc3f7', cursor: 'pointer' },
  btnJoin: { padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: '#2ecc71', color: '#000', fontWeight: 'bold', cursor: 'pointer' },
  btnHit: { padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', background: '#2ecc71', color: '#000', fontWeight: 'bold', cursor: 'pointer' },
  btnStand: { padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', background: '#e74c3c', color: '#fff', fontWeight: 'bold', cursor: 'pointer' },
  btnSend: { padding: '0.5rem 0.75rem', borderRadius: '6px', border: 'none', background: '#4fc3f7', color: '#000', cursor: 'pointer' },
};