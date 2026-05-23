import { useState, useEffect } from 'react';
import { useAuth } from '../context/useAuth';
import api from '../api/axios';
import GameHeader from '../components/layout/GameHeader';
import { t } from '../styles/theme';

const medals = ['♛', '♜', '♞'];
const GAMES = [
  { key: null,         label: 'Global' },
  { key: 'BLACKJACK',  label: 'Blackjack' },
  { key: 'THREESEVEN', label: 'Tres y Siete' },
  { key: 'POKER',      label: 'Poker' },
  { key: 'DOMINO',     label: 'Dominó' },
];

export default function Ranking() {
  const { user } = useAuth();
  const [ranking, setRanking]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [activeGame, setActiveGame] = useState(null); // null = global

  useEffect(() => {
    setLoading(true);
    const url = activeGame ? `/stats/ranking?gameType=${activeGame}` : '/stats/ranking';
    api.get(url)
      .then(res => setRanking(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeGame]);

  return (
    <div className="ranking-container" style={s.container}>
      <GameHeader title="Ranking" />
      <main style={s.main}>

        {/* Game filter tabs */}
        <div style={s.tabs}>
          {GAMES.map(g => (
            <button
              key={g.label}
              onClick={() => setActiveGame(g.key)}
              style={{
                ...s.tab,
                background: activeGame === g.key ? t.gold : 'transparent',
                color:       activeGame === g.key ? t.bg0  : t.textSecondary,
                border:      `1px solid ${activeGame === g.key ? t.gold : t.border}`,
              }}
            >
              {g.label}
            </button>
          ))}
        </div>

        <div className="ranking-inner" style={{ minWidth: 'calc(var(--ranking-min-width))' }}>
          <div style={s.tableHeader}>
            <span style={s.colPos}>#</span>
            <span style={s.colPlayer}>Jugador</span>
            <span style={s.colStat}>Partidas</span>
            <span style={s.colStat}>Win rate</span>
            <span style={s.colWins}>Victorias</span>
            <span style={s.colStat}>Racha</span>
          </div>

          {loading ? (
            <p style={s.empty}>Cargando ranking...</p>
          ) : ranking.length === 0 ? (
            <p style={s.empty}>No hay datos aún para este juego.</p>
          ) : (
            <div style={s.list}>
              {ranking.map((player, i) => {
                const isMe = player.username === user.username;
                return (
                  <div key={player.userId} style={{
                    ...s.row,
                    background: isMe ? `linear-gradient(90deg, ${t.goldGlow}, transparent)` : t.bg2,
                    border:     `1px solid ${t.border}`,
                    boxShadow:  isMe ? t.shadowGold : t.shadowCard,
                  }}>
                    <span style={{ ...s.colPos, color: i < 3 ? t.gold : t.textSecondary, fontFamily: t.fontDisplay, fontSize: i < 3 ? '1.2rem' : '0.9rem' }}>
                      {medals[i] || `${i + 1}`}
                    </span>
                    <span style={s.colPlayer}>
                      <span style={s.playerName}>{player.username}</span>
                      {isMe && <span style={s.youBadge}>tú</span>}
                    </span>
                    <span style={{ ...s.colStat, color: t.textSecondary }}>{player.gamesPlayed}</span>
                    <span style={{ ...s.colStat, color: t.textSecondary }}>{player.winRate?.toFixed(1)}%</span>
                    <span style={{ ...s.colWins, color: t.win, fontFamily: t.fontDisplay, fontWeight: 700 }}>{player.wins}</span>
                    <span style={{ ...s.colStat, color: t.gold, fontFamily: t.fontDisplay, fontWeight: 700 }}>
                      {activeGame ? '—' : player.winStreak}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const s = {
  container:   { minHeight: '100vh', background: t.bg0, color: t.textPrimary },
  main:        { maxWidth: '760px', margin: '0 auto', padding: '2rem 1.5rem' },
  tabs:        { display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' },
  tab:         { padding: '0.4rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontFamily: 'inherit', transition: 'all 0.15s' },
  tableHeader: { display: 'grid', gridTemplateColumns: 'var(--ranking-cols, 48px 1fr 80px 80px 80px 80px)', gap: '1rem', padding: '0.5rem 1.5rem', color: t.textMuted, fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: t.fontBody, marginBottom: '0.5rem' },
  colPos:      { textAlign: 'center' },
  colPlayer:   { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  colStat:     { textAlign: 'center', fontSize: '0.9rem' },
  colWins:     { textAlign: 'center', fontSize: '0.9rem' },
  list:        { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  row:         { display: 'grid', gridTemplateColumns: 'var(--ranking-cols, 48px 1fr 80px 80px 80px 80px)', gap: '1rem', alignItems: 'center', padding: '1rem 1.5rem', borderRadius: '10px', transition: 'transform 0.15s' },
  playerName:  { fontWeight: 500, fontSize: '0.95rem', color: t.textPrimary },
  youBadge:    { background: t.goldGlow, border: `1px solid ${t.border}`, color: t.gold, borderRadius: '4px', padding: '0 6px', fontSize: '0.68rem', letterSpacing: '0.08em', textTransform: 'uppercase' },
  empty:       { textAlign: 'center', color: t.textSecondary, marginTop: '3rem' },
};