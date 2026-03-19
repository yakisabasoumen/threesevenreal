import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/stats/me')
      .then(res => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button style={styles.btnBack} onClick={() => navigate('/lobby')}>← Volver</button>
        <h1 style={styles.title}>📊 Perfil</h1>
        <div />
      </header>

      <main style={styles.main}>
        <div style={styles.card}>
          <div style={styles.avatar}>👤</div>
          <h2 style={styles.username}>{user.username}</h2>

          {loading ? (
            <p style={styles.loading}>Cargando estadísticas...</p>
          ) : stats ? (
            <div style={styles.statsGrid}>
              <div style={styles.statBox}>
                <div style={styles.statValue}>{stats.gamesPlayed}</div>
                <div style={styles.statLabel}>Partidas jugadas</div>
              </div>
              <div style={{ ...styles.statBox, borderColor: '#2ecc71' }}>
                <div style={{ ...styles.statValue, color: '#2ecc71' }}>{stats.wins}</div>
                <div style={styles.statLabel}>Victorias</div>
              </div>
              <div style={{ ...styles.statBox, borderColor: '#e74c3c' }}>
                <div style={{ ...styles.statValue, color: '#e74c3c' }}>{stats.losses}</div>
                <div style={styles.statLabel}>Derrotas</div>
              </div>
              <div style={{ ...styles.statBox, borderColor: '#f39c12' }}>
                <div style={{ ...styles.statValue, color: '#f39c12' }}>{stats.winRate?.toFixed(1)}%</div>
                <div style={styles.statLabel}>Win Rate</div>
              </div>
            </div>
          ) : (
            <p style={styles.loading}>No hay estadísticas aún. ¡Juega una partida!</p>
          )}
        </div>
      </main>
    </div>
  );
}

const styles = {
  container: { minHeight: '100vh', background: '#1a1a2e', color: '#fff' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', background: '#16213e', borderBottom: '1px solid #0f3460' },
  btnBack: { padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #4fc3f7', background: 'transparent', color: '#4fc3f7', cursor: 'pointer' },
  title: { color: '#4fc3f7' },
  main: { maxWidth: '600px', margin: '3rem auto', padding: '0 1rem' },
  card: { background: '#16213e', borderRadius: '16px', padding: '2rem', textAlign: 'center' },
  avatar: { fontSize: '4rem', marginBottom: '0.5rem' },
  username: { color: '#4fc3f7', marginBottom: '2rem', fontSize: '1.5rem' },
  loading: { color: '#aaa' },
  statsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  statBox: { background: '#0f3460', borderRadius: '12px', padding: '1.5rem', border: '2px solid #4fc3f7' },
  statValue: { fontSize: '2rem', fontWeight: 'bold', color: '#4fc3f7' },
  statLabel: { color: '#aaa', fontSize: '0.85rem', marginTop: '0.25rem' },
};