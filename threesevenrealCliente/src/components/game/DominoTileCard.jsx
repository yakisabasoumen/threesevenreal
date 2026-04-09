import { t } from '../../styles/theme';

export default function DominoTileCard({ left, right, selected = false, small = false, compact = false }) {
  const compactStyle = compact ? styles.compact : {};
  return (
    <div style={{
      ...styles.tile,
      ...(small ? styles.small : styles.normal),
      ...compactStyle,
      borderColor: selected ? t.gold : t.border,
      background: selected ? 'rgba(250,214,165,0.16)' : t.bg3,
    }}>
      <div style={styles.semi}>{left}</div>
      <div style={styles.bar} />
      <div style={styles.semi}>{right}</div>
    </div>
  );
}

const styles = {
  tile: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '10px',
    border: `1px solid ${t.border}`,
    boxShadow: '0 8px 16px rgba(0,0,0,0.18)',
    color: t.textPrimary,
    fontFamily: t.fontDisplay,
    fontWeight: 700,
    userSelect: 'none',
  },
  normal: {
    width: '68px',
    height: '42px',
    flexDirection: 'row',
  },
  small: {
    width: '58px',
    height: '34px',
    flexDirection: 'row',
  },
  compact: {
    width: '46px',
    height: '28px',
  },
  semi: {
    width: '50%',
    textAlign: 'center',
    fontSize: '1rem',
  },
  bar: {
    width: '2px',
    height: '70%',
    background: t.border,
  },
};
