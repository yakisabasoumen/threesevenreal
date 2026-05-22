import { t } from '../../styles/theme';

const SUITS = { HEARTS: '♥', DIAMONDS: '♦', CLUBS: '♣', SPADES: '♠' };
const RED_SUITS = ['HEARTS', 'DIAMONDS'];

export default function PlayingCard({ card, small = false }) {
  const isRed = RED_SUITS.includes(card.suit);
  const suit = SUITS[card.suit] || card.suit;

  return (
    <div style={{
      ...s.card,
      ...(small ? s.cardSmall : s.cardNormal),
      color: isRed ? '#e05555' : t.textPrimary,
    }}>
      <span style={small ? s.rankSmall : s.rank}>{card.rank}</span>
      <span style={small ? s.suitSmall : s.suit}>{suit}</span>
      <span style={{ ...s.cornerSuit, bottom: small ? 4 : 6, right: small ? 4 : 6, transform: 'rotate(180deg)', fontSize: small ? '0.55rem' : '0.65rem' }}>
        {suit}
      </span>
    </div>
  );
}

export function CardBack({ small = false }) {
  return (
    <div style={{
      ...s.card,
      ...(small ? s.cardSmall : s.cardNormal),
      background: `repeating-linear-gradient(
        45deg,
        ${t.bg3},
        ${t.bg3} 4px,
        ${t.bg4} 4px,
        ${t.bg4} 8px
      )`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={s.cardBackInner} />
    </div>
  );
}

const s = {
  card: {
    background: t.bg3,
    border: `1px solid ${t.border}`,
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    fontWeight: '700',
    fontFamily: t.fontBody,
    position: 'relative',
    boxShadow: '0 4px 12px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.05) inset',
    transition: 'transform 0.15s, box-shadow 0.15s',
    flexShrink: 0,
  },
  cardNormal: {
    width: '62px',
    height: '90px',
    padding: '6px 7px',
  },
  cardSmall: {
    width: '48px',
    height: '70px',
    padding: '4px 5px',
  },
  rank: {
    fontSize: '1.1rem',
    lineHeight: 1,
  },
  rankSmall: {
    fontSize: '0.9rem',
    lineHeight: 1,
  },
  suit: {
    fontSize: '1.3rem',
    lineHeight: 1,
    marginTop: '2px',
  },
  suitSmall: {
    fontSize: '1rem',
    lineHeight: 1,
    marginTop: '2px',
  },
  cornerSuit: {
    position: 'absolute',
    color: 'inherit',
    opacity: 0.7,
  },
  cardBackInner: {
    width: '70%',
    height: '70%',
    border: `1px solid ${t.border}`,
    borderRadius: '4px',
  },
};