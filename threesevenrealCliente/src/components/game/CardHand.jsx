import PlayingCard from './PlayingCard';
import { t } from '../../styles/theme';

export default function CardHand({ title, cards = [], small = false, footer = null, children }) {
  return (
    <section style={s.section}>
      <h3 style={s.title}>{title}</h3>
      <div style={s.cards}>
        {cards.map((card, i) => (
          <PlayingCard key={i} card={card} small={small} />
        ))}
        {children}
      </div>
      {footer && <p style={s.footer}>{footer}</p>}
    </section>
  );
}

const s = {
  section: {
    background: t.bg3,
    borderRadius: '12px',
    padding: '1.25rem 1.5rem',
    border: `1px solid ${t.border}`,
    boxShadow: t.shadowCard,
  },
  title: {
    color: t.gold,
    fontFamily: t.fontDisplay,
    fontWeight: 600,
    fontSize: '0.95rem',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    margin: '0 0 1rem 0',
  },
  cards: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  footer: {
    color: t.push,
    fontStyle: 'italic',
    fontSize: '0.85rem',
    marginTop: '0.75rem',
    marginBottom: 0,
    fontFamily: t.fontBody,
  },
};