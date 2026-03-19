import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

function CardDisplay({ card }) {
  const suits = { HEARTS: '♥', DIAMONDS: '♦', CLUBS: '♣', SPADES: '♠' };
  const redSuits = ['HEARTS', 'DIAMONDS'];
  const isRed = redSuits.includes(card.suit);
  return (
    <div style={{ ...styles.card, color: isRed ? '#e74c3c' : '#fff' }}>
      <div style={styles.cardRank}>{card.rank}</div>
      <div style={styles.cardSuit}>{suits[card.suit] || card.suit}</div>
    </div>
  );
}

export default function Blackjack() {
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const startGame = async () => {
    setLoading(true);
    try {
      const res = await api.post('/blackjack/start');
      setGame(res.data);
      setMessage(res.data.message);
    } catch (e) {
      setMessage('Error al iniciar la partida');
    }
    setLoading(false);
  };

  const hit = async () => {
    setLoading(true);
    try {
      const res = await api.post(`/blackjack/${game.gameId}/hit`);
      setGame(res.data);
      setMessage(res.data.message);
    } catch (e) {
      setMessage('Error');
    }
    setLoading(false);
  };

  const stand = async () => {
    setLoading(true);
    try {
      const res = await api.post(`/blackjack/${game.gameId}/stand`);
      setGame(res.data);
      setMessage(res.data.message);
    } catch (e) {
      setMessage('Error');
    }
    setLoading(false);
  };

  const isPlaying = game?.status === 'PLAYING';
  const statusColor = {
    PLAYER_WIN: '#2ecc71',
    DEALER_WIN: '#e74c3c',
    PUSH: '#f39c12',
    PLAYING: '#4fc3f7',
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button style={styles.btnBack} onClick={() => navigate('/lobby')}>← Volver</button>
        <h1 style={styles.title}>🃏 Blackjack</h1>
        <div />
      </header>

      <main style={styles.main}>
        {!game ? (
          <div style={styles.startBox}>
            <p style={styles.ruleText}>Llega a 21 sin pasarte. El dealer pide cartas hasta 17.</p>
            <button style={styles.btnPrimary} onClick={startGame} disabled={loading}>
              {loading ? 'Repartiendo...' : 'Nueva partida'}
            </button>
          </div>
        ) : (
          <>
            {/* Estado */}
            {game.status !== 'PLAYING' && (
              <div style={{ ...styles.statusBanner, background: statusColor[game.status] }}>
                {game.status === 'PLAYER_WIN' && '🎉 ¡Ganaste!'}
                {game.status === 'DEALER_WIN' && '💀 Gana el dealer'}
                {game.status === 'PUSH' && '🤝 Empate'}
              </div>
            )}

            {/* Mano del dealer */}
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>
                Dealer {game.status !== 'PLAYING' ? `— ${game.dealerScore} pts` : ''}
              </h2>
              <div style={styles.cards}>
                {game.dealerHand.map((card, i) => <CardDisplay key={i} card={card} />)}
                {isPlaying && <div style={styles.cardBack}>🂠</div>}
              </div>
            </section>

            {/* Mano del jugador */}
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>Tu mano — {game.playerScore} pts</h2>
              <div style={styles.cards}>
                {game.playerHand.map((card, i) => <CardDisplay key={i} card={card} />)}
              </div>
            </section>

            {/* Mensaje */}
            <p style={styles.message}>{message}</p>

            {/* Botones */}
            <div style={styles.actions}>
              {isPlaying ? (
                <>
                  <button style={styles.btnHit} onClick={hit} disabled={loading}>
                    {loading ? '...' : '👊 Hit'}
                  </button>
                  <button style={styles.btnStand} onClick={stand} disabled={loading}>
                    {loading ? '...' : '✋ Stand'}
                  </button>
                </>
              ) : (
                <button style={styles.btnPrimary} onClick={startGame} disabled={loading}>
                  {loading ? '...' : '🔄 Nueva partida'}
                </button>
              )}
            </div>
          </>
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
  main: { maxWidth: '700px', margin: '2rem auto', padding: '0 1rem' },
  startBox: { textAlign: 'center', marginTop: '4rem' },
  ruleText: { color: '#aaa', marginBottom: '2rem', fontSize: '1.1rem' },
  statusBanner: { textAlign: 'center', padding: '1rem', borderRadius: '8px', fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#000' },
  section: { marginBottom: '1.5rem' },
  sectionTitle: { color: '#4fc3f7', marginBottom: '0.75rem' },
  cards: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' },
  card: { background: '#16213e', border: '2px solid #0f3460', borderRadius: '8px', width: '70px', height: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 'bold' },
  cardRank: { fontSize: '1.2rem' },
  cardSuit: { fontSize: '1.5rem' },
  cardBack: { background: '#0f3460', border: '2px solid #4fc3f7', borderRadius: '8px', width: '70px', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' },
  message: { color: '#aaa', textAlign: 'center', marginBottom: '1.5rem', fontStyle: 'italic' },
  actions: { display: 'flex', justifyContent: 'center', gap: '1rem' },
  btnPrimary: { padding: '0.75rem 2rem', borderRadius: '8px', border: 'none', background: '#4fc3f7', color: '#000', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' },
  btnHit: { padding: '0.75rem 2rem', borderRadius: '8px', border: 'none', background: '#2ecc71', color: '#000', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' },
  btnStand: { padding: '0.75rem 2rem', borderRadius: '8px', border: 'none', background: '#e74c3c', color: '#fff', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' },
};