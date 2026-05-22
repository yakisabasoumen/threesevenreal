import { t } from '../../styles/theme';

export default function PrimaryButton({ children, fullWidth, style, ...props }) {
  return (
    <button
      style={{ ...s.btn, ...(fullWidth && { width: '100%' }), ...style }}
      {...props}
    >
      {children}
    </button>
  );
}

const s = {
  btn: {
    padding: '0.85rem 2.5rem',
    borderRadius: '8px',
    border: `1px solid ${t.goldDark}`,
    background: `linear-gradient(135deg, ${t.goldDark}, ${t.gold})`,
    color: t.bg0,
    fontSize: '0.95rem',
    fontWeight: '700',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    fontFamily: t.fontBody,
    transition: 'opacity 0.2s',
  },
};