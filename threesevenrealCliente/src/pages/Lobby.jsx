import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const games = [
  { id: 'blackjack', name: 'Blackjack', emoji: '🃏', desc: 'Clásico contra la máquina. Llega a 21 sin pasarte.' },
  { id: 'threeseven', name: 'Tres y Siete', emoji: '🎴', desc: 'Juego de cartas español. La mejor mano gana.' },
  { id: 'poker', name: 'Poker Texas Hold\'em', emoji: '♠️', desc: 'Texas Hold\'em simplificado contra la máquina.' },
];

export default function Lobby() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>ThreeSevenReal</h1>
        <div style={styles.headerRight}>
          <span style={styles.username}>👤 {user.username}</span>
          <button style={styles.btnOutline} onClick={() => navigate('/ranking')}>🏆 Ranking</button>
          <button style={styles.btnOutline} onClick={() => navigate('/profile')}>📊 Perfil</button>
          <button style={styles.btnRed} onClick={logout}>Salir</button>
        </div>
      </header>

      <main style={styles.main}>
        <h2 style={styles.subtitle}>Elige un juego</h2>
        <div style={styles.grid}>
          {games.map(game => (
            <div key={game.id} style={styles.card}>
              <div style={styles.emoji}>{game.emoji}</div>
              <h3 style={styles.cardTitle}>{game.name}</h3>
              <p style={styles.cardDesc}>{game.desc}</p>
              <div style={styles.cardButtons}>
                <button style={styles.btnPrimary} onClick={() => navigate(`/${game.id}`)}>
                  Un jugador
                </button>
                <button style={styles.btnSecondary} onClick={() => navigate(`/${game.id}/online`)}>
                  Online 🌐
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', background: '#1a1a2e', color: '#fff' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', background: '#16213e', borderBottom: '1px solid #0f3460' },
  title: { color: '#4fc3f7', margin: 0 },
  headerRight: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  username: { color: '#aaa' },
  main: { padding: '2rem', maxWidth: '900px', margin: '0 auto' },
  subtitle: { textAlign: 'center', color: '#4fc3f7', marginBottom: '2rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' },
  card: { background: '#16213e', borderRadius: '12px', padding: '1.5rem', textAlign: 'center', border: '1px solid #0f3460' },
  emoji: { fontSize: '3rem', marginBottom: '0.5rem' },
  cardTitle: { color: '#4fc3f7', marginBottom: '0.5rem' },
  cardDesc: { color: '#aaa', fontSize: '0.9rem', marginBottom: '1.5rem' },
  cardButtons: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  btnPrimary: { padding: '0.6rem', borderRadius: '8px', border: 'none', background: '#4fc3f7', color: '#000', fontWeight: 'bold', cursor: 'pointer' },
  btnSecondary: { padding: '0.6rem', borderRadius: '8px', border: '1px solid #4fc3f7', background: 'transparent', color: '#4fc3f7', cursor: 'pointer' },
  btnOutline: { padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #4fc3f7', background: 'transparent', color: '#4fc3f7', cursor: 'pointer' },
  btnRed: { padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', background: '#e74c3c', color: '#fff', cursor: 'pointer' },
};