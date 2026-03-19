import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

function CardDisplay({ card }) {
  const suits = { HEARTS: '♥', DIAMONDS: '♦', CLUBS: '♣', SPADES: '♠' };
  const isRed = ['HEARTS', 'DIAMONDS'].includes(card.suit);
  return (
    <div style={{ ...styles.card, color: isRed ? '#e74c3c' : '#fff' }}>
      <div style={styles.cardRank}>{card.rank}</div>
      <div style={styles.cardSuit}>{suits[card.suit] || card.suit}</div>
    </div>
  );
}

export default function ThreeSeven() {
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(false);

  const startGame = async () => {
    setLoading(true);
    try {
      const res = await api.post('/threeseven/start');
      setGame(res.data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const statusColor = { PLAYER_WIN: '#2ecc71', BOT_WIN: '#e74c3c', PUSH: '#f39c12' };
  const statusText = { PLAYER_WIN: '🎉 ¡Ganaste!', BOT_WIN: '💀 Gana el bot', PUSH: '🤝 Empate' };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button style={styles.btnBack} onClick={() => navigate('/lobby')}>← Volver</button>
        <h1 style={styles.title}>🎴 Tres y Siete</h1>
        <div />
      </header>

      <main style={styles.main}>
        {!game ? (
          <div style={styles.startBox}>
            <p style={styles.ruleText}>Se reparten 3 cartas. Gana la mejor combinación.</p>
            <div style={styles.rules}>
              <p>Tres iguales {'>'} Escalera de color {'>'} Siete de color {'>'} Tres de color {'>'} Color {'>'} Pareja {'>'} Carta alta</p>
            </div>
            <button style={styles.btnPrimary} onClick={startGame} disabled={loading}>
              {loading ? 'Repartiendo...' : 'Jugar'}
            </button>
          </div>
        ) : (
          <>
            <div style={{ ...styles.statusBanner, background: statusColor[game.status] }}>
              {statusText[game.status]}
            </div>

            <div style={styles.grid}>
              <section style={styles.section}>
                <h2 style={styles.sectionTitle}>Tu mano</h2>
                <div style={styles.cards}>
                  {game.playerHand.map((card, i) => <CardDisplay key={i} card={card} />)}
                </div>
                <p style={styles.handRank}>{game.playerHandRank}</p>
              </section>

              <section style={styles.section}>
                <h2 style={styles.sectionTitle}>Bot</h2>
                <div style={styles.cards}>
                  {game.botHand.map((card, i) => <CardDisplay key={i} card={card} />)}
                </div>
                <p style={styles.handRank}>{game.botHandRank}</p>
              </section>
            </div>

            <p style={styles.message}>{game.message}</p>

            <div style={styles.actions}>
              <button style={styles.btnPrimary} onClick={startGame} disabled={loading}>
                {loading ? '...' : '🔄 Nueva partida'}
              </button>
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
  main: { maxWidth: '800px', margin: '2rem auto', padding: '0 1rem' },
  startBox: { textAlign: 'center', marginTop: '3rem' },
  ruleText: { color: '#aaa', marginBottom: '1rem', fontSize: '1.1rem' },
  rules: { background: '#16213e', borderRadius: '8px', padding: '1rem', color: '#aaa', fontSize: '0.85rem', marginBottom: '2rem' },
  statusBanner: { textAlign: 'center', padding: '1rem', borderRadius: '8px', fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#000' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '1.5rem' },
  section: { background: '#16213e', borderRadius: '12px', padding: '1.5rem', textAlign: 'center' },
  sectionTitle: { color: '#4fc3f7', marginBottom: '1rem' },
  cards: { display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' },
  card: { background: '#0f3460', border: '2px solid #4fc3f7', borderRadius: '8px', width: '70px', height: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
  cardRank: { fontSize: '1.2rem' },
  cardSuit: { fontSize: '1.5rem' },
  handRank: { color: '#f39c12', marginTop: '0.75rem', fontStyle: 'italic', fontSize: '0.9rem' },
  message: { color: '#aaa', textAlign: 'center', marginBottom: '1.5rem' },
  actions: { display: 'flex', justifyContent: 'center' },
  btnPrimary: { padding: '0.75rem 2rem', borderRadius: '8px', border: 'none', background: '#4fc3f7', color: '#000', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' },
};