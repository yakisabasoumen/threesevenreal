import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PrimaryButton from '../components/ui/PrimaryButton';
import { t } from '../styles/theme';

const games = [
  { id: 'blackjack',  name: 'Blackjack',      suit: '♣', desc: 'Llega a 21 sin pasarte. Clásico contra la máquina.' },
  { id: 'threeseven', name: 'Tres y Siete',   suit: '♦', desc: 'Juego de cartas español. La mejor mano gana.' },
  { id: 'poker',      name: "Texas Hold'em",  suit: '♠', desc: 'Poker simplificado contra la máquina.' },
];

export default function Lobby() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={s.container}>
      <div style={s.bgOrb} />

      <header style={s.header}>
        <div style={s.headerInner}>
          <h1 style={s.logo}>♠ ThreeSevenReal</h1>
          <nav style={s.nav}>
            <span style={s.username}>👤 {user.username}</span>
            <button style={s.btnNav} onClick={() => navigate('/ranking')}>Ranking</button>
            <button style={s.btnNav} onClick={() => navigate('/profile')}>Perfil</button>
            <button style={s.btnRed} onClick={logout}>Salir</button>
          </nav>
        </div>
      </header>

      <main style={s.main}>
        <div style={s.hero}>
          <p style={s.heroLabel}>Mesa de juegos</p>
          <h2 style={s.heroTitle}>Elige tu partida</h2>
          <div style={s.heroDivider} />
        </div>

        <div style={s.grid}>
          {games.map((game, idx) => (
            <div key={game.id} style={{ ...s.card, animationDelay: `${idx * 0.1}s` }} className="game-card">
              <div style={s.cardSuit}>{game.suit}</div>
              <div style={s.cardContent}>
                <h3 style={s.cardTitle}>{game.name}</h3>
                <p style={s.cardDesc}>{game.desc}</p>
              </div>
              <div style={s.cardActions}>
                <PrimaryButton style={s.btnPrimaryOverride} onClick={() => navigate(`/${game.id}`)}>
                  Un jugador
                </PrimaryButton>
                <button style={s.btnSecondary} onClick={() => navigate(`/${game.id}/online`)}>
                  Online
                </button>
              </div>
              <div style={s.cardAccent} />
            </div>
          ))}
        </div>
      </main>

      <style>{`
        .game-card { transition: transform 0.25s, box-shadow 0.25s; }
        .game-card:hover { transform: translateY(-6px); box-shadow: 0 16px 48px rgba(0,0,0,0.7), 0 0 0 1px ${t.borderHover}, ${t.shadowGold}; }
      `}</style>
    </div>
  );
}

const s = {
  container: { minHeight: '100vh', background: t.bg0, color: t.textPrimary, position: 'relative', overflow: 'hidden' },
  bgOrb: { position: 'absolute', width: '800px', height: '800px', borderRadius: '50%', background: `radial-gradient(circle, ${t.goldGlow} 0%, transparent 65%)`, top: '-300px', right: '-200px', pointerEvents: 'none' },
  header: { background: t.bg2, borderBottom: `1px solid ${t.border}`, position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 4px 24px rgba(0,0,0,0.5)' },
  headerInner: { maxWidth: '1100px', margin: '0 auto', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  logo: { color: t.gold, fontFamily: t.fontDisplay, fontSize: '1.4rem', margin: 0, letterSpacing: '0.03em' },
  nav: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  username: { color: t.textSecondary, fontSize: '0.85rem', marginRight: '0.5rem' },
  btnNav: { padding: '0.45rem 1rem', borderRadius: '6px', border: `1px solid ${t.border}`, background: 'transparent', color: t.gold, cursor: 'pointer', fontSize: '0.85rem', fontFamily: t.fontBody, letterSpacing: '0.04em', transition: 'all 0.2s' },
  btnRed: { padding: '0.45rem 1rem', borderRadius: '6px', border: '1px solid rgba(248,113,113,0.3)', background: 'transparent', color: t.loss, cursor: 'pointer', fontSize: '0.85rem', fontFamily: t.fontBody },
  main: { maxWidth: '1100px', margin: '0 auto', padding: '3rem 2rem' },
  hero: { textAlign: 'center', marginBottom: '3rem' },
  heroLabel: { color: t.textSecondary, fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.75rem', fontFamily: t.fontBody },
  heroTitle: { color: t.textPrimary, fontFamily: t.fontDisplay, fontSize: '2.5rem', fontWeight: 700, margin: '0 0 1.5rem', letterSpacing: '0.02em' },
  heroDivider: { width: '60px', height: '1px', background: `linear-gradient(90deg, transparent, ${t.gold}, transparent)`, margin: '0 auto' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' },
  card: { background: t.bg2, borderRadius: '16px', border: `1px solid ${t.border}`, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative', overflow: 'hidden', boxShadow: t.shadowCard, cursor: 'default' },
  cardSuit: { fontSize: '2.5rem', color: t.gold, opacity: 0.25, fontFamily: t.fontDisplay, lineHeight: 1 },
  cardContent: { flex: 1 },
  cardTitle: { color: t.textPrimary, fontFamily: t.fontDisplay, fontSize: '1.3rem', fontWeight: 700, margin: '0 0 0.5rem', letterSpacing: '0.02em' },
  cardDesc: { color: t.textSecondary, fontSize: '0.88rem', lineHeight: 1.6, margin: 0 },
  cardActions: { display: 'flex', gap: '0.75rem' },
  // PrimaryButton override para tamaño compacto en las cards
  btnPrimaryOverride: { flex: 1, padding: '0.7rem', fontSize: '0.85rem', letterSpacing: '0.05em' },
  btnSecondary: { flex: 1, padding: '0.7rem', borderRadius: '8px', border: `1px solid ${t.border}`, background: 'transparent', color: t.gold, fontWeight: '500', fontSize: '0.85rem', cursor: 'pointer', fontFamily: t.fontBody, letterSpacing: '0.05em', textTransform: 'uppercase' },
  cardAccent: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, transparent, ${t.goldDark}, transparent)` },
};