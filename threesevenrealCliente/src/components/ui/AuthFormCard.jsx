import { t } from '../../styles/theme';

export default function AuthFormCard({ title, subtitle, error, children, footer }) {
  return (
    <div style={s.page}>
      {/* Fondo decorativo */}
      <div style={s.bgOrb1} />
      <div style={s.bgOrb2} />

      <div style={s.card}>
        <div style={s.cardTop}>
          <div style={s.suit}>♠</div>
          <h1 style={s.appName}>ThreeSevenReal</h1>
          <div style={s.divider} />
          <h2 style={s.title}>{title}</h2>
          {subtitle && <p style={s.subtitle}>{subtitle}</p>}
        </div>

        {error && (
          <div style={s.error}>
            <span>⚠ {error}</span>
          </div>
        )}

        <div style={s.body}>{children}</div>

        {footer && <div style={s.footer}>{footer}</div>}
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: t.bg0,
    fontFamily: t.fontBody,
    position: 'relative',
    overflow: 'hidden',
  },
  bgOrb1: {
    position: 'absolute',
    width: '500px',
    height: '500px',
    borderRadius: '50%',
    background: `radial-gradient(circle, ${t.goldGlow} 0%, transparent 70%)`,
    top: '-200px',
    right: '-100px',
    pointerEvents: 'none',
  },
  bgOrb2: {
    position: 'absolute',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: `radial-gradient(circle, rgba(74,222,128,0.05) 0%, transparent 70%)`,
    bottom: '-150px',
    left: '-100px',
    pointerEvents: 'none',
  },
  card: {
    background: t.bg2,
    border: `1px solid ${t.border}`,
    borderRadius: '16px',
    width: '400px',
    boxShadow: t.shadowCard,
    position: 'relative',
    zIndex: 1,
    overflow: 'hidden',
  },
  cardTop: {
    padding: '2rem 2rem 1.5rem',
    textAlign: 'center',
    borderBottom: `1px solid ${t.border}`,
  },
  suit: {
    fontSize: '2rem',
    color: t.gold,
    opacity: 0.4,
    marginBottom: '0.25rem',
  },
  appName: {
    color: t.gold,
    fontFamily: t.fontDisplay,
    fontWeight: 700,
    fontSize: '1.6rem',
    margin: '0 0 1rem',
    letterSpacing: '0.03em',
  },
  divider: {
    width: '40px',
    height: '1px',
    background: t.border,
    margin: '0 auto 1rem',
  },
  title: {
    color: t.textPrimary,
    fontFamily: t.fontBody,
    fontWeight: 400,
    fontSize: '0.95rem',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    margin: 0,
  },
  subtitle: {
    color: t.textSecondary,
    fontSize: '0.85rem',
    marginTop: '0.5rem',
    marginBottom: 0,
  },
  error: {
    background: 'rgba(248,113,113,0.1)',
    borderBottom: '1px solid rgba(248,113,113,0.3)',
    color: t.loss,
    fontSize: '0.85rem',
    padding: '0.75rem 2rem',
    textAlign: 'center',
  },
  body: {
    padding: '1.5rem 2rem',
  },
  footer: {
    padding: '1rem 2rem 1.5rem',
    textAlign: 'center',
    borderTop: `1px solid ${t.border}`,
    color: t.textSecondary,
    fontSize: '0.85rem',
  },
};