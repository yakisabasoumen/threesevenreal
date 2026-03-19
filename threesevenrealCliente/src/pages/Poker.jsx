import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

function CardDisplay({ card, small }) {
  const suits = { HEARTS: '♥', DIAMONDS: '♦', CLUBS: '♣', SPADES: '♠' };
  const isRed = ['HEARTS', 'DIAMONDS'].includes(card.suit);
  const size = small ? styles.cardSmall : styles.card;
  return (
    <div style={{ ...size, color: isRed ? '#e74c3c' : '#fff' }}>
      <div style={styles.cardRank}>{card.rank}</div>
      <div style={styles.cardSuit}>{suits[card.suit] || card.suit}</div>
    </div>
  );
}

const PHASES = ['PREFLOP', 'FLOP', 'TURN', 'RIVER', 'SHOWDOWN'];
const PHASE_LABELS = {
  PREFLOP: '1. Pre-Flop',
  FLOP: '2. Flop',
  TURN: '3. Turn',
  RIVER: '4. River',
  SHOWDOWN: '5. Showdown',
};

export default function Poker() {
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(false);

  const startGame = async () => {
    setLoading(true);
    try {
      const res = await api.post('/poker/start');
      setGame(res.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const check = async () => {
    setLoading(true);
    try {
      const res = await api.post(`/poker/${game.gameId}/check`);
      setGame(res.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const fold = async () => {
    setLoading(true);
    try {
      const res = await api.post(`/poker/${game.gameId}/fold`);
      setGame(res.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const isPlaying = game?.status === 'PLAYING';
  const isFinished = game && !isPlaying;

  const statusColor = {
    PLAYER_WIN: '#2ecc71', BOT_WIN: '#e74c3c',
    PUSH: '#f39c12', PLAYER_FOLD: '#e67e22',
  };
  const statusText = {
    PLAYER_WIN: '🎉 ¡Ganaste!', BOT_WIN: '💀 Gana el bot',
    PUSH: '🤝 Empate', PLAYER_FOLD: '🏳️ Te has retirado',
  };

  const phaseIndex = game ? PHASES.indexOf(game.phase) : -1;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button style={styles.btnBack} onClick={() => navigate('/lobby')}>← Volver</button>
        <h1 style={styles.title}>♠️ Poker Texas Hold'em</h1>
        <div />
      </header>

      <main style={styles.main}>
        {!game ? (
          <div style={styles.startBox}>
            <p style={styles.ruleText}>Texas Hold'em contra la máquina. 2 cartas privadas + 5 comunitarias.</p>
            <button style={styles.btnPrimary} onClick={startGame} disabled={loading}>
              {loading ? 'Repartiendo...' : 'Nueva partida'}
            </button>
          </div>
        ) : (
          <>
            {/* Barra de fases */}
            <div style={styles.phases}>
              {PHASES.map((p, i) => (
                <div key={p} style={{
                  ...styles.phaseStep,
                  background: i < phaseIndex ? '#2ecc71' : i === phaseIndex ? '#4fc3f7' : '#0f3460',
                  color: i <= phaseIndex ? '#000' : '#aaa',
                }}>
                  {PHASE_LABELS[p]}
                </div>
              ))}
            </div>

            {/* Banner resultado */}
            {isFinished && game.status !== 'PLAYING' && (
              <div style={{ ...styles.statusBanner, background: statusColor[game.status] }}>
                {statusText[game.status]}
                {game.playerHandRank && ` — ${game.playerHandRank}`}
              </div>
            )}

            {/* Cartas comunitarias */}
            {game.communityCards?.length > 0 && (
              <section style={styles.section}>
                <h2 style={styles.sectionTitle}>Cartas comunitarias</h2>
                <div style={styles.cards}>
                  {game.communityCards.map((card, i) => <CardDisplay key={i} card={card} />)}
                </div>
              </section>
            )}

            {/* Manos */}
            <div style={styles.grid}>
              <section style={styles.section}>
                <h2 style={styles.sectionTitle}>Tu mano</h2>
                <div style={styles.cards}>
                  {game.playerHand?.map((card, i) => <CardDisplay key={i} card={card} />)}
                </div>
                {game.playerHandRank && isFinished && (
                  <p style={styles.handRank}>{game.playerHandRank}</p>
                )}
              </section>

              <section style={styles.section}>
                <h2 style={styles.sectionTitle}>Bot</h2>
                <div style={styles.cards}>
                  {isFinished && game.botHand
                    ? game.botHand.map((card, i) => <CardDisplay key={i} card={card} />)
                    : <div style={styles.hiddenCards}>🂠 🂠 Ocultas</div>
                  }
                </div>
                {game.botHandRank && isFinished && (
                  <p style={styles.handRank}>{game.botHandRank}</p>
                )}
              </section>
            </div>

            {/* Mensaje */}
            <p style={styles.message}>{game.message}</p>

            {/* Botones */}
            <div style={styles.actions}>
              {isPlaying ? (
                <>
                  <button style={styles.btnCheck} onClick={check} disabled={loading}>
                    {loading ? '...' : game.phase === 'RIVER' ? '🃏 Ver resultado' : '✅ Check / Ver'}
                  </button>
                  {game.phase !== 'PREFLOP' && (
                    <button style={styles.btnFold} onClick={fold} disabled={loading}>
                      {loading ? '...' : '🏳️ Fold'}
                    </button>
                  )}
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
  main: { maxWidth: '900px', margin: '2rem auto', padding: '0 1rem' },
  startBox: { textAlign: 'center', marginTop: '4rem' },
  ruleText: { color: '#aaa', marginBottom: '2rem', fontSize: '1.1rem' },
  phases: { display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' },
  phaseStep: { flex: 1, textAlign: 'center', padding: '0.5rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', minWidth: '80px' },
  statusBanner: { textAlign: 'center', padding: '1rem', borderRadius: '8px', fontSize: '1.3rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#000' },
  section: { background: '#16213e', borderRadius: '12px', padding: '1.5rem', textAlign: 'center', marginBottom: '1rem' },
  sectionTitle: { color: '#4fc3f7', marginBottom: '1rem' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' },
  cards: { display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' },
  card: { background: '#0f3460', border: '2px solid #4fc3f7', borderRadius: '8px', width: '70px', height: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
  cardSmall: { background: '#0f3460', border: '2px solid #4fc3f7', borderRadius: '6px', width: '55px', height: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
  cardRank: { fontSize: '1.1rem' },
  cardSuit: { fontSize: '1.3rem' },
  hiddenCards: { color: '#aaa', fontSize: '1.5rem', padding: '1rem' },
  handRank: { color: '#f39c12', marginTop: '0.75rem', fontStyle: 'italic', fontSize: '0.9rem' },
  message: { color: '#aaa', textAlign: 'center', marginBottom: '1.5rem', fontStyle: 'italic' },
  actions: { display: 'flex', justifyContent: 'center', gap: '1rem' },
  btnPrimary: { padding: '0.75rem 2rem', borderRadius: '8px', border: 'none', background: '#4fc3f7', color: '#000', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' },
  btnCheck: { padding: '0.75rem 2rem', borderRadius: '8px', border: 'none', background: '#2ecc71', color: '#000', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' },
  btnFold: { padding: '0.75rem 2rem', borderRadius: '8px', border: 'none', background: '#e74c3c', color: '#fff', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' },
};