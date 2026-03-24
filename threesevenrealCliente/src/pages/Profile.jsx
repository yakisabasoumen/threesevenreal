import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import GameHeader from '../components/layout/GameHeader';
import StatBox from '../components/ui/StatBox';
import PlayerAvatar from '../components/ui/PlayerAvatar';
import { t } from '../styles/theme';

export default function Profile() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/stats/me').then(res => setStats(res.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div style={s.container}>
      <GameHeader title="Perfil" />
      <main style={s.main}>
        <PlayerAvatar username={user.username} />

        {loading ? (
          <p style={s.empty}>Cargando estadísticas...</p>
        ) : stats ? (
          <div style={s.grid}>
            <StatBox value={stats.gamesPlayed} label="Partidas jugadas" color={t.gold} />
            <StatBox value={stats.wins}         label="Victorias"        color={t.win} />
            <StatBox value={stats.losses}       label="Derrotas"         color={t.loss} />
            <StatBox value={`${stats.winRate?.toFixed(1)}%`} label="Win Rate" color={t.push} />
          </div>
        ) : (
          <p style={s.empty}>No hay estadísticas aún. ¡Juega una partida!</p>
        )}
      </main>
    </div>
  );
}

const s = {
  container: { minHeight: '100vh', background: t.bg0, color: t.textPrimary },
  main: { maxWidth: '640px', margin: '0 auto', padding: '2.5rem 1.5rem' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  empty: { textAlign: 'center', color: t.textSecondary, marginTop: '3rem' },
};