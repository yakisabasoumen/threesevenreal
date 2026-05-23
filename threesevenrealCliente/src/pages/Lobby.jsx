import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import PrimaryButton from '../components/ui/PrimaryButton';
import LobbyChat from '../components/ui/LobbyChat';
import { useLobbyStats } from "../hooks/useLobbyStats";
import { useAppPresence } from "../hooks/useAppPresence";
import { t } from '../styles/theme';

const games = [
  { id: 'blackjack',  name: 'Blackjack',     suit: '♣', desc: 'Llega a 21 sin pasarte. Clásico contra la máquina.', badge: 'Clásico' },
  { id: 'threeseven', name: 'Tres y Siete',  suit: '♦', desc: 'Juego de cartas español. La mejor mano gana.',       badge: 'Español' },
  { id: 'poker',      name: "Texas Hold'em", suit: '♠', desc: 'Poker simplificado contra la máquina.',              badge: 'Popular' },
  { id: 'domino',     name: 'Dominó',        suit: '☰', desc: 'Dominó real contra otro jugador en línea.',            badge: 'Multijugador', onlineOnly: true },
];

const HEADER_H = '58px';

export default function Lobby() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const { stats } = useLobbyStats();        
  const { onlineUsers } = useAppPresence(); 

  return (
    <div className="page-lobby" style={s.root}>
      {/* Orbs */}
      <div style={s.orbTR} />
      <div style={s.orbBL} />

      {/* HEADER */}
      <header style={s.header}>
        <div style={s.headerInner}>
          <div style={s.logoGroup}>
            <span style={s.logoSuit}>♠</span>
            <span className="logo-text" style={s.logoText}>ThreeSevenReal</span>
          </div>
          <nav className="nav-inner" style={s.nav}>
            <span style={s.username}>👤 {user?.username}</span>
            <button style={s.btnNav} onClick={() => navigate('/friends')}>Amigos</button>
            <button style={s.btnNav} onClick={() => navigate('/ranking')}>Ranking</button>
            <button style={s.btnNav} onClick={() => navigate('/profile')}>Perfil</button>
            <button style={s.btnRed} onClick={logout}>Salir</button>
          </nav>
        </div>
      </header>

      {/* BODY */}
      <div className="page-body" style={s.body}>

        {/* IZQUIERDA */}
        <div style={s.leftCol}>

          {/* Hero */}
          <div className="hero" style={s.hero}>
            <p style={s.heroEyebrow}>Mesa de juegos</p>
            <h2 style={s.heroTitle}>Elige tu partida</h2>
            <div style={s.heroLine} />
            <p style={s.heroSub}>
              Juega en solitario o desafía a otros jugadores en tiempo real.
              Tres juegos, un solo objetivo: ganar.
            </p>
          </div>

          {/* Stats rápidas */}
          <div className="statsRow" style={s.statsRow}>
            <div style={s.statCard}>
              <span style={s.statIcon}>◉</span>
              <span style={s.statValue}>{onlineUsers.length}</span>
              <span style={s.statLabel}>Jugadores activos</span>
            </div>

            <div style={s.statCard}>
              <span style={s.statIcon}>♠</span>
              <span style={s.statValue}>{stats.gamesToday}</span>
              <span style={s.statLabel}>Partidas hoy</span>
            </div>

            <div style={s.statCard}>
              <span style={s.statIcon}>★</span>
              <span style={s.statValue}>{stats.winStreak}</span>
              <span style={s.statLabel}>Racha actual</span>
            </div>

            <div style={s.statCard}>
              <span style={s.statIcon}>✔</span>
              <span style={s.statValue}>{stats.maxWinStreak}</span>
              <span style={s.statLabel}>Racha máxima</span>
            </div>
          </div>

          {/* Divider */}
          <div style={s.sectionDivider}>
            <div style={s.sectionLine} />
            <span style={s.sectionLabel}>JUEGOS DISPONIBLES</span>
            <div style={s.sectionLine} />
          </div>

          {/* Cards */}
          <div style={s.gameList}>
            {games.map((game, idx) => (
              <div
                key={game.id}
                style={{ ...s.card, animationDelay: `${idx * 0.08}s` }}
                className="game-card"
              >
                <div style={s.suitBox}>
                  <span className="suit-char" style={s.suitChar}>{game.suit}</span>
                </div>

                <div style={s.cardInfo}>
                  <div style={s.cardTitleRow}>
                    <h3 style={s.cardTitle}>{game.name}</h3>
                    <span style={s.badge}>{game.badge}</span>
                  </div>
                  <p className="card-desc" style={s.cardDesc}>{game.desc}</p>
                </div>

                <div className="card-actions" style={s.cardActions}>
                  {!game.onlineOnly && (
                    <PrimaryButton style={s.btnPrimary} onClick={() => navigate(`/${game.id}`)}>
                      Un jugador
                    </PrimaryButton>
                  )}
                  <button style={s.btnSecondary} onClick={() => navigate(`/${game.id}/online`)}>
                    Online
                  </button>
                </div>

                <div style={s.cardAccent} />
              </div>
            ))}
          </div>

          {/* Info bar */}
          <div style={s.infoBar}>
            <span style={s.infoIcon}>ℹ</span>
            <span style={s.infoText}>
              El modo <strong style={{ color: t.gold }}>Online</strong> requiere que haya otro jugador disponible en el lobby.
              El chat de la derecha te ayuda a coordinar partidas.
            </span>
          </div>

        </div>

        {/* DERECHA */}
        <aside className="page-sidebar" style={s.rightCol}>
          <LobbyChat />
        </aside>

      </div>

      {/* Animaciones */}
      <style>{`
        * { box-sizing: border-box; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .game-card {
          animation: fadeUp 0.35s ease both;
          transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
        }
        .game-card:hover {
          transform: translateY(-3px);
          border-color: ${t.borderHover} !important;
          box-shadow: 0 18px 50px rgba(0,0,0,0.7), ${t.shadowGold} !important;
        }
        .game-card:hover .suit-char {
          opacity: 0.55 !important;
          transform: scale(1.1);
        }
        .suit-char { transition: opacity 0.22s, transform 0.22s; }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${t.border}; border-radius: 4px; }

        @media (max-width: 1024px) {
          .page-lobby header { padding: 0.6rem 1rem !important; }
          .page-lobby header .headerInner { padding: 0 1rem !important; }
        }

        @media (max-width: 768px) {
          .page-lobby header { position: sticky !important; top: 0; left: 0; right: 0; }
          .page-lobby header .headerInner { padding: 0 0.85rem !important; }
          .page-lobby .page-body { margin-top: 0 !important; }
          .page-lobby .page-body { grid-template-columns: 1fr !important; }
          .page-lobby .page-sidebar { position: static !important; height: auto !important; width: 100% !important; }
          .page-lobby .nav-inner { width: 100%; justify-content: center; gap: 0.5rem !important; }
          .page-lobby .nav-inner button { padding: 0.28rem 0.65rem !important; font-size: 0.72rem !important; flex: 1 1 120px !important; }
          .page-lobby .logo-text { font-size: 1rem !important; }
          .page-lobby .logoGroup { width: 100%; justify-content: space-between; }
          .page-lobby .username { width: 100%; text-align: center; order: -1; }
          .page-lobby .game-card { grid-template-columns: 52px minmax(0, 1fr) !important; }
          .page-lobby .card-actions { width: 100%; justify-content: flex-start; gap: 0.55rem !important; }
          .page-lobby .card-actions button { flex: 1 1 140px !important; min-width: 140px !important; }
          .page-lobby .card-desc { font-size: 0.92rem !important; line-height: 1.6 !important; }
        }
      `}</style>
    </div>
  );
}

const s = {
  root: {
    minHeight: '100vh',
    background: t.bg0,
    color: t.textPrimary,
    fontFamily: t.fontBody,
    position: 'relative',
  },

  orbTR: {
    position: 'fixed',
    width: '800px', height: '800px', borderRadius: '50%',
    background: `radial-gradient(circle, ${t.goldGlow} 0%, transparent 60%)`,
    top: '-280px', right: '-200px',
    pointerEvents: 'none', zIndex: 0,
  },
  orbBL: {
    position: 'fixed',
    width: '600px', height: '600px', borderRadius: '50%',
    background: `radial-gradient(circle, rgba(201,168,76,0.05) 0%, transparent 65%)`,
    bottom: '-180px', left: '-150px',
    pointerEvents: 'none', zIndex: 0,
  },

  /* Header fijo */
  header: {
    minHeight: HEADER_H,
    background: t.bg2,
    borderBottom: `1px solid ${t.border}`,
    position: 'fixed',
    top: 0, left: 0, right: 0,
    zIndex: 200,
    boxShadow: '0 2px 20px rgba(0,0,0,0.6)',
  },
  headerInner: {
    maxWidth: '1380px', margin: '0 auto', padding: '0 2rem',
    minHeight: HEADER_H,
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    flexWrap: 'wrap', gap: '0.75rem',
  },
  logoGroup: { display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 },
  logoSuit:  { color: t.gold, fontFamily: t.fontDisplay, fontSize: '1.2rem' },
  logoText:  { color: t.gold, fontFamily: t.fontDisplay, fontSize: '1.25rem', fontWeight: 700, letterSpacing: '0.04em' },
  nav: { display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap', justifyContent: 'flex-end' },
  username: { color: t.textSecondary, fontSize: '0.8rem', marginRight: '0.3rem', whiteSpace: 'nowrap' },
  btnNav: {
    padding: '0.38rem 0.9rem', borderRadius: '6px',
    border: `1px solid ${t.border}`, background: 'transparent',
    color: t.gold, cursor: 'pointer', fontSize: '0.8rem',
    fontFamily: t.fontBody, letterSpacing: '0.04em', whiteSpace: 'nowrap',
  },
  btnRed: {
    padding: '0.38rem 0.9rem', borderRadius: '6px',
    border: '1px solid rgba(248,113,113,0.25)', background: 'transparent',
    color: t.loss, cursor: 'pointer', fontSize: '0.8rem', fontFamily: t.fontBody, whiteSpace: 'nowrap',
  },

  /* Body */
  body: {
    maxWidth: '1380px',
    margin: `${HEADER_H} auto 0`,
    padding: '2rem 2rem 2rem',
    display: 'grid',
    gridTemplateColumns: '1fr 360px',
    gap: '2rem',
    alignItems: 'start',
    position: 'relative',
    zIndex: 1,
  },

  /* Columna izquierda */
  leftCol: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },

  hero: { display: 'flex', flexDirection: 'column', gap: '0.65rem' },
  heroEyebrow: {
    color: t.textSecondary, fontSize: '0.7rem',
    letterSpacing: '0.22em', textTransform: 'uppercase',
    margin: 0,
  },
  heroTitle: {
    color: t.textPrimary, fontFamily: t.fontDisplay,
    fontSize: '2.4rem', fontWeight: 700,
    margin: 0, letterSpacing: '0.02em', lineHeight: 1.1,
  },
  heroLine: {
    width: '52px', height: '2px',
    background: `linear-gradient(90deg, ${t.gold}, transparent)`,
  },
  heroSub: {
    color: t.textSecondary, fontSize: '0.88rem',
    lineHeight: 1.65, margin: 0, maxWidth: '520px',
  },

  /* Stats */
  statsRow: {
    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem',
  },
  statCard: {
    background: t.bg2, border: `1px solid ${t.border}`,
    borderRadius: '12px', padding: '1rem 1.1rem',
    display: 'flex', flexDirection: 'column', gap: '4px',
  },
  statIcon:  { color: t.goldDark, fontSize: '0.85rem', lineHeight: 1 },
  statValue: { color: t.textPrimary, fontFamily: t.fontDisplay, fontSize: '1.6rem', fontWeight: 700, lineHeight: 1 },
  statLabel: { color: t.textMuted, fontSize: '0.7rem', letterSpacing: '0.04em' },

  /* Sección divider */
  sectionDivider: { display: 'flex', alignItems: 'center', gap: '1rem' },
  sectionLine:    { flex: 1, height: '1px', background: t.border },
  sectionLabel:   { color: t.textMuted, fontSize: '0.65rem', letterSpacing: '0.18em', whiteSpace: 'nowrap' },

  /* Game cards */
  gameList: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  card: {
    background: t.bg2, borderRadius: '14px',
    border: `1px solid ${t.border}`,
    padding: '1.2rem 1.5rem',
    display: 'grid', gridTemplateColumns: '52px minmax(0, 1fr) auto',
    alignItems: 'flex-start', gap: '1.25rem',
    position: 'relative', overflow: 'hidden',
    boxShadow: t.shadowCard,
  },
  suitBox: {
    width: '48px', height: '48px',
    background: 'rgba(201,168,76,0.05)',
    border: `1px solid ${t.border}`, borderRadius: '10px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  suitChar: { fontSize: '1.5rem', color: t.gold, opacity: 0.3, fontFamily: t.fontDisplay, display: 'block' },
  cardInfo:     { display: 'flex', flexDirection: 'column', gap: '5px', minWidth: 0 },
  cardTitleRow: { display: 'flex', alignItems: 'center', gap: '8px' },
  cardTitle: {
    color: t.textPrimary, fontFamily: t.fontDisplay,
    fontSize: '1.1rem', fontWeight: 700, margin: 0, letterSpacing: '0.02em',
  },
  badge: {
    fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase',
    color: t.goldDark, background: 'rgba(201,168,76,0.08)',
    border: `1px solid rgba(201,168,76,0.2)`, borderRadius: '20px',
    padding: '2px 7px', fontFamily: t.fontBody, flexShrink: 0,
  },
  cardDesc: { color: t.textSecondary, fontSize: '0.82rem', lineHeight: 1.5, margin: 0 },
  cardActions:  { display: 'flex', gap: '0.55rem', flexShrink: 0, flexWrap: 'wrap', alignItems: 'center' },
  btnPrimary:   { padding: '0.55rem 1.1rem', fontSize: '0.78rem', letterSpacing: '0.06em' },
  btnSecondary: {
    padding: '0.55rem 1.1rem', borderRadius: '8px',
    border: `1px solid ${t.border}`, background: 'transparent',
    color: t.gold, fontWeight: 500, fontSize: '0.78rem',
    cursor: 'pointer', fontFamily: t.fontBody,
    letterSpacing: '0.06em', textTransform: 'uppercase',
  },
  cardAccent: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px',
    background: `linear-gradient(90deg, transparent, ${t.goldDark}, transparent)`,
  },

  infoBar: {
    display: 'flex', alignItems: 'flex-start', gap: '10px',
    background: 'rgba(201,168,76,0.04)', border: `1px solid ${t.border}`,
    borderRadius: '10px', padding: '0.75rem 1rem',
  },
  infoIcon: { color: t.goldDark, fontSize: '0.85rem', flexShrink: 0, marginTop: '1px' },
  infoText: { color: t.textMuted, fontSize: '0.78rem', lineHeight: 1.55 },

  /* Columna derecha: sticky debajo del header fijo */
  rightCol: {
    position: 'sticky',
    top: `calc(${HEADER_H} + 2rem)`,
    height: `calc(100vh - ${HEADER_H} - 4rem)`,
    display: 'flex',
    flexDirection: 'column',
  },
};