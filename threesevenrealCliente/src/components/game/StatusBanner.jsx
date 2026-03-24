import { t } from '../../styles/theme';

const defaultColorMap = {
  PLAYER_WIN: t.win,
  DEALER_WIN: t.loss,
  BOT_WIN:    t.loss,
  PUSH:       t.push,
  PLAYER_FOLD: t.push,
};

const defaultTextMap = {
  PLAYER_WIN:  '✦ ¡Ganaste!',
  DEALER_WIN:  'Gana el dealer',
  BOT_WIN:     'Gana el bot',
  PUSH:        'Empate',
  PLAYER_FOLD: 'Te has retirado',
};

export default function StatusBanner({ status, colorMap = {}, textMap = {}, extra = null }) {
  const color  = { ...defaultColorMap,  ...colorMap  }[status];
  const text   = { ...defaultTextMap,   ...textMap   }[status];
  if (!color || !text) return null;

  return (
    <div style={{
      ...s.banner,
      borderColor: color,
      boxShadow: `0 0 24px ${color}40, 0 4px 16px rgba(0,0,0,0.5)`,
    }}>
      <span style={{ ...s.text, color }}>{text}</span>
      {extra && <span style={s.extra}>{extra}</span>}
    </div>
  );
}

const s = {
  banner: {
    textAlign: 'center',
    padding: '1rem 2rem',
    borderRadius: '8px',
    border: '1px solid',
    background: 'rgba(0,0,0,0.4)',
    marginBottom: '1.5rem',
    backdropFilter: 'blur(8px)',
  },
  text: {
    fontSize: '1.3rem',
    fontWeight: '700',
    fontFamily: t.fontDisplay,
    letterSpacing: '0.05em',
    display: 'block',
  },
  extra: {
    color: t.textSecondary,
    fontSize: '0.85rem',
    fontFamily: t.fontBody,
    marginTop: '0.25rem',
    display: 'block',
  },
};