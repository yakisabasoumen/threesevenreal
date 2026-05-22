import { t } from '../../styles/theme';

export default function AuthInput({ style, ...props }) {
  return <input style={{ ...s.input, ...style }} {...props} />;
}

const s = {
  input: {
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    border: `1px solid ${t.border}`,
    background: t.bg3,
    color: t.textPrimary,
    fontSize: '0.95rem',
    fontFamily: t.fontBody,
    outline: 'none',
    transition: 'border-color 0.2s',
    width: '100%',
    boxSizing: 'border-box',
  },
};