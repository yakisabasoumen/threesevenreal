import { t } from '../../styles/theme';

export default function PlayerAvatar({ username, symbol = '♠', badge = 'Jugador' }) {
  return (
    <div style={s.wrapper}>
      <div style={s.ring}>
        <span style={s.symbol}>{symbol}</span>
      </div>
      <h2 style={s.username}>{username}</h2>
      <span style={s.badge}>{badge}</span>
    </div>
  );
}

const s = {
  wrapper: { textAlign: 'center', marginBottom: '2.5rem' },
  ring: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    border: `1px solid ${t.border}`,
    background: t.bg2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 1rem',
    boxShadow: t.shadowGold,
  },
  symbol: { fontSize: '2rem', color: t.gold },
  username: {
    color: t.textPrimary,
    fontFamily: t.fontDisplay,
    fontSize: '1.6rem',
    fontWeight: 700,
    margin: '0 0 0.5rem',
  },
  badge: {
    display: 'inline-block',
    padding: '0.25rem 0.75rem',
    borderRadius: '20px',
    border: `1px solid ${t.border}`,
    color: t.textSecondary,
    fontSize: '0.75rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
  },
};