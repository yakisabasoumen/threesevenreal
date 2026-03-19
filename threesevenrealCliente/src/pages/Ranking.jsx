import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const medals = ['🥇', '🥈', '🥉'];

export default function Ranking() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/stats/ranking')
      .then(res => setRanking(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button style={styles.btnBack} onClick={() => navigate('/lobby')}>← Volver</button>
        <h1 style={styles.title}>🏆 Ranking</h1>
        <div />
      </header>

      <main style={styles.main}>
        {loading ? (
          <p style={styles.loading}>Cargando ranking...</p>
        ) : ranking.length === 0 ? (
          <p style={styles.loading}>No hay datos aún. ¡Sé el primero en jugar!</p>
        ) : (
          <div style={styles.list}>
            {ranking.map((player, i) => (
              <div key={player.userId} style={{
                ...styles.row,
                background: player.username === user.username ? '#1a3a5c' : '#16213e',
                border: player.username === user.username ? '2px solid #4fc3f7' : '2px solid transparent',
              }}>
                <div style={styles.position}>
                  {medals[i] || `#${i + 1}`}
                </div>
                <div style={styles.playerInfo}>
                  <span style={styles.playerName}>
                    {player.username}
                    {player.username === user.username && <span style={styles.youBadge}> tú</span>}
                  </span>
                  <span style={styles.playerStats}>
                    {player.gamesPlayed} partidas · {player.winRate?.toFixed(1)}% win rate
                  </span>
                </div>
                <div style={styles.wins}>
                  <span style={styles.winsValue}>{player.wins}</span>
                  <span style={styles.winsLabel}>victorias</span>
                </div>
              </div>
            ))}
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
  main: { maxWidth: '700px', margin: '2rem auto', padding: '0 1rem' },
  loading: { textAlign: 'center', color: '#aaa', marginTop: '3rem' },
  list: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  row: { display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem', borderRadius: '12px' },
  position: { fontSize: '1.5rem', width: '2rem', textAlign: 'center' },
  playerInfo: { flex: 1, display: 'flex', flexDirection: 'column' },
  playerName: { fontWeight: 'bold', fontSize: '1rem' },
  youBadge: { background: '#4fc3f7', color: '#000', borderRadius: '4px', padding: '0 4px', fontSize: '0.7rem', marginLeft: '4px' },
  playerStats: { color: '#aaa', fontSize: '0.8rem', marginTop: '0.2rem' },
  wins: { textAlign: 'right' },
  winsValue: { display: 'block', fontSize: '1.5rem', fontWeight: 'bold', color: '#2ecc71' },
  winsLabel: { color: '#aaa', fontSize: '0.75rem' },
};