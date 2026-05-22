import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import api from '../api/axios';
import GameHeader from '../components/layout/GameHeader';
import AuthInput from '../components/ui/AuthInput';
import PrimaryButton from '../components/ui/PrimaryButton';
import { t } from '../styles/theme';

const SYMBOLS = ['♠', '♣', '♥', '♦'];
const SYMBOL_COLORS = { '♠': t.textPrimary, '♣': t.textPrimary, '♥': '#e05555', '♦': '#e05555' };
const TABS = ['username', 'password', 'avatar'];
const TAB_LABELS = { username: 'Nombre', password: 'Contraseña', avatar: 'Símbolo' };

function FeedbackMsg({ msg }) {
  if (!msg) return null;
  const isError = msg.type === 'error';
  return (
    <div style={{
      padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid',
      borderColor: isError ? 'rgba(248,113,113,0.4)' : 'rgba(74,222,128,0.4)',
      background:  isError ? 'rgba(248,113,113,0.08)' : 'rgba(74,222,128,0.08)',
      color:       isError ? t.loss : t.win,
      fontSize: '0.82rem', fontFamily: t.fontBody,
    }}>
      {isError ? '⚠ ' : '✓ '}{msg.text}
    </div>
  );
}

export default function Profile() {
  const { user, login } = useAuth();
  const { username: profileUsername } = useParams();
  const isOwnProfile = !profileUsername || profileUsername === user.username;

  const [stats, setStats]       = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [profileError, setProfileError] = useState(null);
  const [activeTab, setActiveTab]       = useState('username');

  const [newUsername,     setNewUsername]     = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarSymbol,    setAvatarSymbol]    = useState(user.avatarSymbol || '♠');

  const [msg,    setMsg]    = useState(null);
  const [saving, setSaving] = useState(false);

  const displayUser = {
    avatarSymbol: stats?.avatarSymbol || user.avatarSymbol || '♠',
    username: stats?.username || user.username,
  };

  useEffect(() => {
    setProfileError(null);
    setLoadingStats(true);
    const endpoint = isOwnProfile
      ? '/stats/me'
      : `/stats/user/${encodeURIComponent(profileUsername)}`;

    api.get(endpoint)
      .then(res => setStats(res.data))
      .catch(err => {
        console.error(err);
        setStats(null);
        setProfileError(err.response?.data || 'No se encontró el perfil.');
      })
      .finally(() => setLoadingStats(false));
  }, [isOwnProfile, profileUsername]);

  const patch = async (payload, resetFn) => {
    setSaving(true); setMsg(null);
    try {
      const res = await api.patch('/users/me', payload);
      login({ ...user, username: res.data.username, avatarSymbol: res.data.avatarSymbol });
      setMsg({ type: 'ok', text: res.data.message });
      resetFn?.();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data || 'Error al guardar' });
    }
    setSaving(false);
  };

  const saveUsername = () => {
    if (!newUsername.trim()) return setMsg({ type: 'error', text: 'Escribe un nombre de usuario' });
    patch({ newUsername }, () => setNewUsername(''));
  };

  const savePassword = () => {
    if (!currentPassword) return setMsg({ type: 'error', text: 'Introduce tu contraseña actual' });
    if (newPassword.length < 6) return setMsg({ type: 'error', text: 'Mínimo 6 caracteres' });
    if (newPassword !== confirmPassword) return setMsg({ type: 'error', text: 'Las contraseñas no coinciden' });
    patch({ currentPassword, newPassword }, () => {
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    });
  };

  const saveAvatar = () => patch({ avatarSymbol });

  const winRate = stats?.winRate?.toFixed(1) ?? '0.0';
  const winRateDeg = stats ? Math.min((stats.winRate / 100) * 360, 360) : 0;

  return (
    <div style={s.container}>
      <GameHeader title="Perfil" />
      <main style={s.main}>
        <div style={s.layout}>

          {/* ── COLUMNA IZQUIERDA ─────────────────────────────── */}
          <div style={s.leftCol}>

            {/* Hero del jugador */}
            <div style={s.heroCard}>
              <div style={s.avatarRing}>
                <span style={{ fontSize: '2.2rem', color: SYMBOL_COLORS[displayUser.avatarSymbol] }}>
                  {displayUser.avatarSymbol}
                </span>
                <div style={s.avatarGlow} />
              </div>
              <h2 style={s.heroName}>{displayUser.username}</h2>
              <span style={s.heroBadge}>{isOwnProfile ? 'Jugador' : 'Perfil público'}</span>
            </div>

            {/* Win rate ring */}
            <div style={s.ringCard}>
              <svg viewBox="0 0 80 80" style={s.ringsvg}>
                <circle cx="40" cy="40" r="34" fill="none" stroke={t.bg3} strokeWidth="7" />
                <circle
                  cx="40" cy="40" r="34" fill="none"
                  stroke={t.gold} strokeWidth="7"
                  strokeDasharray={`${(winRateDeg / 360) * 213.6} 213.6`}
                  strokeLinecap="round"
                  transform="rotate(-90 40 40)"
                  style={{ transition: 'stroke-dasharray 0.8s ease' }}
                />
              </svg>
              <div style={s.ringLabel}>
                <span style={s.ringValue}>{winRate}%</span>
                <span style={s.ringText}>win rate</span>
              </div>
            </div>

            {/* Stats grid */}
            <div style={s.statsGrid}>
              {[
                { label: 'Partidas', value: stats?.gamesPlayed ?? '—', color: t.gold },
                { label: 'Victorias', value: stats?.wins ?? '—', color: t.win },
                { label: 'Derrotas',  value: stats?.losses ?? '—', color: t.loss },
                { label: 'Racha actual', value: stats?.winStreak ?? '—', color: t.gold },
                { label: 'Racha máxima', value: stats?.maxWinStreak ?? '—', color: t.win },
              ].map(({ label, value, color }) => (
                <div key={label} style={s.statPill}>
                  <span style={{ ...s.statValue, color }}>{loadingStats ? '…' : value}</span>
                  <span style={s.statLabel}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── COLUMNA DERECHA ───────────────────────────────── */}
          <div style={s.rightCol}>
            <p style={s.editHeading}>
              {isOwnProfile ? 'Editar perfil' : `Perfil de ${displayUser.username}`}
            </p>

            {profileError && (
              <div style={{
                marginBottom: '16px', padding: '14px 16px', borderRadius: '12px',
                backgroundColor: t.bg3, border: `1px solid ${t.border}`, color: t.loss,
              }}>
                {profileError}
              </div>
            )}

            {isOwnProfile ? (
              <>
                {/* Tabs */}
                <div style={s.tabRow}>
              {TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setMsg(null); }}
                  style={{
                    ...s.tab,
                    color:       activeTab === tab ? t.gold : t.textSecondary,
                    borderBottom: `2px solid ${activeTab === tab ? t.gold : 'transparent'}`,
                    background:  activeTab === tab ? t.goldGlow : 'transparent',
                  }}
                >
                  {TAB_LABELS[tab]}
                </button>
              ))}
            </div>

            {/* Panel de cada tab */}
            <div style={s.tabPanel}>

              {activeTab === 'username' && (
                <div style={s.formGroup}>
                  <p style={s.fieldHint}>Actual: <strong style={{ color: t.gold }}>{user.username}</strong></p>
                  <AuthInput
                    placeholder="Nuevo nombre de usuario"
                    value={newUsername}
                    onChange={e => setNewUsername(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && saveUsername()}
                  />
                  <FeedbackMsg msg={msg} />
                  <PrimaryButton onClick={saveUsername} disabled={saving} fullWidth style={{ marginTop: '0.25rem' }}>
                    {saving ? 'Guardando...' : 'Guardar nombre'}
                  </PrimaryButton>
                </div>
              )}

              {activeTab === 'password' && (
                <div style={s.formGroup}>
                  <AuthInput type="password" placeholder="Contraseña actual" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
                  <AuthInput type="password" placeholder="Nueva contraseña (mín. 6)" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                  <AuthInput type="password" placeholder="Confirmar contraseña" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && savePassword()} />
                  <FeedbackMsg msg={msg} />
                  <PrimaryButton onClick={savePassword} disabled={saving} fullWidth style={{ marginTop: '0.25rem' }}>
                    {saving ? 'Guardando...' : 'Cambiar contraseña'}
                  </PrimaryButton>
                </div>
              )}

              {activeTab === 'avatar' && (
                <div style={s.formGroup}>
                  <p style={s.fieldHint}>Elige tu símbolo de carta:</p>
                  <div style={s.symbolGrid}>
                    {SYMBOLS.map(sym => (
                      <button
                        key={sym}
                        onClick={() => setAvatarSymbol(sym)}
                        style={{
                          ...s.symbolBtn,
                          color:       SYMBOL_COLORS[sym],
                          borderColor: avatarSymbol === sym ? t.gold     : t.border,
                          background:  avatarSymbol === sym ? t.goldGlow : t.bg3,
                          boxShadow:   avatarSymbol === sym ? t.shadowGold : 'none',
                          transform:   avatarSymbol === sym ? 'scale(1.1)' : 'scale(1)',
                        }}
                      >
                        {sym}
                      </button>
                    ))}
                  </div>
                  <FeedbackMsg msg={msg} />
                  <PrimaryButton onClick={saveAvatar} disabled={saving} fullWidth style={{ marginTop: '0.25rem' }}>
                    {saving ? 'Guardando...' : 'Guardar símbolo'}
                  </PrimaryButton>
                </div>
              )}

            </div>
          </>) : (
            <div style={{ padding: '20px 24px', color: t.textSecondary, lineHeight: 1.7 }}>
              {loadingStats ? 'Cargando perfil...' : 'Este perfil es de solo lectura. No puedes editar los datos de otro usuario.'}
            </div>
          )}
          </div>
        </div>
      </main>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
      `}</style>
    </div>
  );
}

const s = {
  container: { minHeight: '100vh', background: t.bg0, color: t.textPrimary },
  main: { maxWidth: '900px', margin: '0 auto', padding: '2.5rem 1.5rem' },

  layout: { display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem', alignItems: 'start' },

  leftCol: { display: 'flex', flexDirection: 'column', gap: '1rem' },

  heroCard: {
    background: t.bg2, border: `1px solid ${t.border}`, borderRadius: '16px',
    padding: '2rem 1.5rem', textAlign: 'center', boxShadow: t.shadowCard,
    position: 'relative', overflow: 'hidden',
  },
  avatarRing: {
    width: '80px', height: '80px', borderRadius: '50%',
    border: `1px solid ${t.border}`, background: t.bg3,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 1rem', boxShadow: t.shadowGold, position: 'relative',
  },
  avatarGlow: {
    position: 'absolute', inset: '-8px', borderRadius: '50%',
    background: `radial-gradient(circle, ${t.goldGlow} 0%, transparent 70%)`,
    pointerEvents: 'none',
  },
  heroName: { color: t.textPrimary, fontFamily: t.fontDisplay, fontSize: '1.4rem', fontWeight: 700, margin: '0 0 0.5rem' },
  heroBadge: { display: 'inline-block', padding: '0.2rem 0.75rem', borderRadius: '20px', border: `1px solid ${t.border}`, color: t.textSecondary, fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase' },

  ringCard: {
    background: t.bg2, border: `1px solid ${t.border}`, borderRadius: '16px',
    padding: '1.25rem', boxShadow: t.shadowCard,
    display: 'flex', alignItems: 'center', gap: '1.25rem',
  },
  ringsvg: { width: '72px', height: '72px', flexShrink: 0 },
  ringLabel: { display: 'flex', flexDirection: 'column' },
  ringValue: { color: t.gold, fontFamily: t.fontDisplay, fontSize: '1.6rem', fontWeight: 700, lineHeight: 1 },
  ringText: { color: t.textSecondary, fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '0.25rem' },

  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' },
  statPill: {
    background: t.bg2, border: `1px solid ${t.border}`, borderRadius: '10px',
    padding: '0.875rem 0.5rem', textAlign: 'center', boxShadow: t.shadowCard,
  },
  statValue: { display: 'block', fontFamily: t.fontDisplay, fontSize: '1.4rem', fontWeight: 700, lineHeight: 1 },
  statLabel: { display: 'block', color: t.textSecondary, fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '0.3rem' },

  // ── Derecha ──
  rightCol: {
    background: t.bg2, border: `1px solid ${t.border}`, borderRadius: '16px',
    overflow: 'hidden', boxShadow: t.shadowCard,
  },
  editHeading: { color: t.textMuted, fontSize: '0.68rem', letterSpacing: '0.18em', textTransform: 'uppercase', margin: '1.5rem 1.5rem 0', fontFamily: t.fontBody },

  tabRow: { display: 'flex', borderBottom: `1px solid ${t.border}`, margin: '0.75rem 0 0' },
  tab: { flex: 1, padding: '0.75rem 0.5rem', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontFamily: t.fontBody, fontWeight: 500, letterSpacing: '0.04em', transition: 'all 0.15s' },

  tabPanel: { padding: '1.5rem', animation: 'fadeIn 0.2s ease' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '0.65rem' },

  fieldHint: { color: t.textSecondary, fontSize: '0.85rem', margin: 0, fontFamily: t.fontBody },

  symbolGrid: { display: 'flex', gap: '0.75rem' },
  symbolBtn: { flex: 1, aspectRatio: '1', borderRadius: '10px', border: '1px solid', fontSize: '1.8rem', cursor: 'pointer', transition: 'all 0.18s', fontFamily: t.fontDisplay, display: 'flex', alignItems: 'center', justifyContent: 'center' },
};