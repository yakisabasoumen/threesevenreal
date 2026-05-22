import { useNavigate } from 'react-router-dom';
import { t } from '../../styles/theme';

export default function GameHeader({ title, backTo = '/lobby', right = null }) {
  const navigate = useNavigate();

  return (
    <header style={s.header}>
      <div style={s.headerInner}>
        <button style={s.btnBack} onClick={() => navigate(backTo)}
          onMouseEnter={e => Object.assign(e.target.style, s.btnBackHover)}
          onMouseLeave={e => Object.assign(e.target.style, s.btnBack)}>
          ← Volver
        </button>
        <h1 style={s.title}>{title}</h1>
        <div style={s.right}>{right}</div>
      </div>
    </header>
  );
}

const s = {
  header: {
    background: t.bg2,
    borderBottom: `1px solid ${t.border}`,
    boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  headerInner: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '1rem 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  btnBack: {
    padding: '0.5rem 1.25rem',
    borderRadius: '6px',
    border: `1px solid ${t.border}`,
    background: 'transparent',
    color: t.gold,
    cursor: 'pointer',
    fontSize: '0.85rem',
    letterSpacing: '0.05em',
    transition: 'all 0.2s',
    fontFamily: t.fontBody,
  },
  btnBackHover: {
    border: `1px solid ${t.borderHover}`,
    background: t.goldGlow,
    color: t.goldLight,
  },
  title: {
    color: t.gold,
    fontFamily: t.fontDisplay,
    fontWeight: 700,
    fontSize: '1.4rem',
    letterSpacing: '0.03em',
    margin: 0,
    textShadow: `0 0 30px ${t.goldGlow}`,
  },
  right: {
    minWidth: '100px',
    display: 'flex',
    justifyContent: 'flex-end',
  },
};