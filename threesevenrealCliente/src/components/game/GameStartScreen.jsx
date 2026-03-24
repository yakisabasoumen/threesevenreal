import PrimaryButton from '../ui/PrimaryButton';
import { t } from '../../styles/theme';

export default function GameStartScreen({
  suit,
  label = 'Modo un jugador',
  title,
  ruleText,
  rulesBox,
  btnLabel = 'Nueva partida',
  loading,
  onStart,
}) {
  return (
    <div style={s.wrapper}>
      {suit && <div style={s.suit}>{suit}</div>}
      <p style={s.heroLabel}>{label}</p>
      <h2 style={s.heroTitle}>{title}</h2>
      <p style={s.ruleText}>{ruleText}</p>
      {rulesBox && <div style={s.rulesBox}>{rulesBox}</div>}
      <PrimaryButton onClick={onStart} disabled={loading}>
        {loading ? 'Repartiendo...' : btnLabel}
      </PrimaryButton>
    </div>
  );
}

const s = {
  wrapper: { textAlign: 'center', marginTop: '5rem' },
  suit: {
    fontSize: '3rem',
    color: t.gold,
    opacity: 0.3,
    fontFamily: t.fontDisplay,
    lineHeight: 1,
    marginBottom: '1rem',
  },
  heroLabel: {
    color: t.textSecondary,
    fontSize: '0.75rem',
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    marginBottom: '0.5rem',
  },
  heroTitle: {
    color: t.textPrimary,
    fontFamily: t.fontDisplay,
    fontSize: '2.5rem',
    fontWeight: 700,
    margin: '0 0 1rem',
  },
  ruleText: {
    color: t.textSecondary,
    marginBottom: '1.5rem',
    fontSize: '1rem',
    lineHeight: 1.6,
  },
  rulesBox: {
    background: t.bg2,
    border: `1px solid ${t.border}`,
    borderRadius: '8px',
    padding: '1rem 1.5rem',
    color: t.textSecondary,
    fontSize: '0.85rem',
    lineHeight: 1.8,
    maxWidth: '480px',
    margin: '0 auto 2.5rem',
  },
};