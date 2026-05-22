import { t } from '../../styles/theme';

export default function StatBox({ value, label, color = t.gold }) {
  return (
    <div style={s.box}>
      <div style={{ ...s.value, color }}>{value}</div>
      <div style={s.label}>{label}</div>
      <div style={{ ...s.accent, background: color }} />
    </div>
  );
}

const s = {
  box: {
    background: t.bg3,
    borderRadius: '12px',
    padding: '1.5rem',
    border: `1px solid ${t.border}`,
    boxShadow: t.shadowCard,
    textAlign: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  value: {
    fontSize: '2.2rem',
    fontWeight: '700',
    fontFamily: t.fontDisplay,
    lineHeight: 1,
    marginBottom: '0.5rem',
  },
  label: {
    color: t.textSecondary,
    fontSize: '0.78rem',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    fontFamily: t.fontBody,
  },
  accent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '2px',
    opacity: 0.6,
  },
};