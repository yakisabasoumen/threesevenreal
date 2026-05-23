import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import api from '../api/axios';
import GameHeader from '../components/layout/GameHeader';
import AuthInput from '../components/ui/AuthInput';
import PrimaryButton from '../components/ui/PrimaryButton';
import { t } from '../styles/theme';

const SYMBOLS = ['♠', '♣', '♥', '♦'];
const SYMBOL_COLORS = { '♠': t.textPrimary, '♣': t.textPrimary, '♥': '#e05555', '♦': '#e05555' };
const TABS = ['username', 'password', 'avatar', 'foto'];
const TAB_LABELS = { username: 'Nombre', password: 'Contraseña', avatar: 'Símbolo', foto: 'Foto' };

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

function Avatar({ avatarImage, avatarSymbol, size = 48 }) {
  if (avatarImage) {
    return (
      <img
        src={avatarImage}
        alt="avatar"
        style={{
          width: size, height: size, borderRadius: '50%',
          objectFit: 'cover', display: 'block',
        }}
      />
    );
  }
  return (
    <span style={{ fontSize: size * 0.46, color: SYMBOL_COLORS[avatarSymbol] || t.textPrimary }}>
      {avatarSymbol}
    </span>
  );
}

export default function Profile() {
  const { user, login } = useAuth();
  const { username: profileUsername } = useParams();
  const isOwnProfile = !profileUsername || profileUsername === user.username;

  const [stats, setStats]             = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [profileError, setProfileError] = useState(null);
  const [activeTab, setActiveTab]       = useState('username');

  const [newUsername,     setNewUsername]     = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarSymbol,    setAvatarSymbol]    = useState(user.avatarSymbol || '♠');

  // ── Photo state ──────────────────────────────────────────
  const [previewImage, setPreviewImage] = useState(null); // Base64 of newly picked file
  const [dragOver,     setDragOver]     = useState(false);
  const fileInputRef = useRef(null);

  const [msg,    setMsg]    = useState(null);
  const [saving, setSaving] = useState(false);

  const displayUser = {
    avatarSymbol: stats?.avatarSymbol || user.avatarSymbol || '♠',
    username:     stats?.username     || user.username,
    avatarImage:  stats?.avatarImage  || user.avatarImage  || null,
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
      login({
        ...user,
        username:    res.data.username,
        avatarSymbol: res.data.avatarSymbol,
        avatarImage:  res.data.avatarImage ?? user.avatarImage,
      });
      // Sync stats so the left column updates immediately
      setStats(prev => prev ? { ...prev, avatarImage: res.data.avatarImage ?? prev.avatarImage } : prev);
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

  // ── Photo helpers ─────────────────────────────────────────
  const MAX_BYTES = 200 * 1024; // 200 KB

  const processFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setMsg({ type: 'error', text: 'El archivo debe ser una imagen' });
      return;
    }
    if (file.size > MAX_BYTES) {
      setMsg({ type: 'error', text: 'La imagen no puede superar 200 KB' });
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => { setPreviewImage(ev.target.result); setMsg(null); };
    reader.readAsDataURL(file);
  };

  const savePhoto = () => {
    if (!previewImage) return setMsg({ type: 'error', text: 'Selecciona una imagen primero' });
    patch({ avatarImage: previewImage }, () => setPreviewImage(null));
  };

  const deletePhoto = () => {
    setPreviewImage(null);
    patch({ avatarImage: '' }, () => {}); // empty string → backend sets null
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    processFile(e.dataTransfer.files[0]);
  };

  // ── Derived ───────────────────────────────────────────────
  const winRate    = stats?.winRate?.toFixed(1) ?? '0.0';
  const winRateDeg = stats ? Math.min((stats.winRate / 100) * 360, 360) : 0;

  // The image shown in the foto tab preview: newly picked > saved in DB > nothing
  const shownImage = previewImage || displayUser.avatarImage;

  return (
    <div className="page-profile" style={s.container}>
      <GameHeader title="Perfil" />
      <main style={s.main}>
        <div className="profile-layout" style={s.layout}>

          {/* ── COLUMNA IZQUIERDA ─────────────────────────────── */}
          <div style={s.leftCol}>

            {/* Hero del jugador */}
            <div style={s.heroCard}>
              <div style={s.avatarRing}>
                <Avatar
                  avatarImage={displayUser.avatarImage}
                  avatarSymbol={displayUser.avatarSymbol}
                  size={52}
                />
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
            <div className="profile-stats-grid" style={s.statsGrid}>
              {[
                { label: 'Partidas',     value: stats?.gamesPlayed  ?? '—', color: t.gold },
                { label: 'Victorias',    value: stats?.wins         ?? '—', color: t.win  },
                { label: 'Derrotas',     value: stats?.losses       ?? '—', color: t.loss },
                { label: 'Racha actual', value: stats?.winStreak    ?? '—', color: t.gold },
                { label: 'Racha máxima', value: stats?.maxWinStreak ?? '—', color: t.win  },
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
                <div className="profile-tab-row" style={s.tabRow}>
                  {TABS.map(tab => (
                    <button
                      key={tab}
                      onClick={() => { setActiveTab(tab); setMsg(null); setPreviewImage(null); }}
                      style={{
                        ...s.tab,
                        color:        activeTab === tab ? t.gold : t.textSecondary,
                        borderBottom: `2px solid ${activeTab === tab ? t.gold : 'transparent'}`,
                        background:   activeTab === tab ? t.goldGlow : 'transparent',
                      }}
                    >
                      {TAB_LABELS[tab]}
                    </button>
                  ))}
                </div>

                {/* Tab panels */}
                <div style={s.tabPanel}>

                  {activeTab === 'username' && (
                    <div className="profile-form-group" style={s.formGroup}>
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
                      <AuthInput type="password" placeholder="Contraseña actual"         value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
                      <AuthInput type="password" placeholder="Nueva contraseña (mín. 6)" value={newPassword}     onChange={e => setNewPassword(e.target.value)} />
                      <AuthInput type="password" placeholder="Confirmar contraseña"      value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && savePassword()} />
                      <FeedbackMsg msg={msg} />
                      <PrimaryButton onClick={savePassword} disabled={saving} fullWidth style={{ marginTop: '0.25rem' }}>
                        {saving ? 'Guardando...' : 'Cambiar contraseña'}
                      </PrimaryButton>
                    </div>
                  )}

                  {activeTab === 'avatar' && (
                    <div style={s.formGroup}>
                      <p style={s.fieldHint}>Elige tu símbolo de carta:</p>
                      <div className="profile-symbol-grid" style={s.symbolGrid}>
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

                  {/* ── FOTO TAB ──────────────────────────────── */}
                  {activeTab === 'foto' && (
                    <div style={s.formGroup}>
                      <p style={s.fieldHint}>Foto de perfil — máx. 200 KB, formatos JPG / PNG / WEBP</p>

                      {/* Drop zone */}
                      <div
                        className="profile-drop-zone"
                        style={{
                          ...s.dropZone,
                          borderColor: dragOver ? t.gold : shownImage ? t.border : t.border,
                          background:  dragOver ? t.goldGlow : t.bg3,
                        }}
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                      >
                        {shownImage ? (
                          /* Preview of current or newly picked image */
                          <div style={s.previewWrap}>
                            <img src={shownImage} alt="preview" style={s.previewImg} />
                            <div style={s.previewOverlay}>
                              <span style={s.previewOverlayText}>Cambiar foto</span>
                            </div>
                          </div>
                        ) : (
                          /* Empty state */
                          <div style={s.dropEmpty}>
                            <span style={s.dropIcon}>↑</span>
                            <span style={s.dropPrimary}>Arrastra una imagen aquí</span>
                            <span style={s.dropSecondary}>o haz clic para elegir</span>
                          </div>
                        )}
                      </div>

                      {/* Hidden file input */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={e => processFile(e.target.files[0])}
                      />

                      <FeedbackMsg msg={msg} />

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <PrimaryButton
                          onClick={savePhoto}
                          disabled={saving || !previewImage}
                          fullWidth
                          style={{ marginTop: '0.25rem' }}
                        >
                          {saving ? 'Subiendo...' : 'Guardar foto'}
                        </PrimaryButton>

                        {displayUser.avatarImage && !previewImage && (
                          <button
                            onClick={deletePhoto}
                            disabled={saving}
                            style={s.deleteBtn}
                          >
                            {saving ? '...' : 'Eliminar'}
                          </button>
                        )}
                      </div>

                      {previewImage && (
                        <button
                          onClick={() => { setPreviewImage(null); setMsg(null); }}
                          style={{ ...s.deleteBtn, alignSelf: 'flex-start' }}
                        >
                          Cancelar selección
                        </button>
                      )}
                    </div>
                  )}
                  {/* ── END FOTO TAB ──────────────────────────── */}

                </div>
              </>
            ) : (
              <div style={{ padding: '20px 24px', color: t.textSecondary, lineHeight: 1.7 }}>
                {loadingStats ? 'Cargando perfil...' : 'Este perfil es de solo lectura. No puedes editar los datos de otro usuario.'}
              </div>
            )}
          </div>
        </div>
      </main>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        .drop-zone-inner:hover .preview-overlay { opacity: 1 !important; }
      `}</style>
    </div>
  );
}

const s = {
  container: { minHeight: '100vh', background: t.bg0, color: t.textPrimary },
  main:      { maxWidth: '900px', margin: '0 auto', padding: '2.5rem 1.5rem' },

  layout:  { display: 'grid', gridTemplateColumns: 'var(--profile-left, 280px) 1fr', gap: '1.5rem', alignItems: 'start' },
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
    overflow: 'hidden',
  },
  avatarGlow: {
    position: 'absolute', inset: '-8px', borderRadius: '50%',
    background: `radial-gradient(circle, ${t.goldGlow} 0%, transparent 70%)`,
    pointerEvents: 'none',
  },
  heroName:  { color: t.textPrimary, fontFamily: t.fontDisplay, fontSize: '1.4rem', fontWeight: 700, margin: '0 0 0.5rem' },
  heroBadge: { display: 'inline-block', padding: '0.2rem 0.75rem', borderRadius: '20px', border: `1px solid ${t.border}`, color: t.textSecondary, fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase' },

  ringCard:  { background: t.bg2, border: `1px solid ${t.border}`, borderRadius: '16px', padding: '1.25rem', boxShadow: t.shadowCard, display: 'flex', alignItems: 'center', gap: '1.25rem' },
  ringsvg:   { width: '72px', height: '72px', flexShrink: 0 },
  ringLabel: { display: 'flex', flexDirection: 'column' },
  ringValue: { color: t.gold, fontFamily: t.fontDisplay, fontSize: '1.6rem', fontWeight: 700, lineHeight: 1 },
  ringText:  { color: t.textSecondary, fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '0.25rem' },

  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' },
  statPill:  { background: t.bg2, border: `1px solid ${t.border}`, borderRadius: '10px', padding: '0.875rem 0.5rem', textAlign: 'center', boxShadow: t.shadowCard },
  statValue: { display: 'block', fontFamily: t.fontDisplay, fontSize: '1.4rem', fontWeight: 700, lineHeight: 1 },
  statLabel: { display: 'block', color: t.textSecondary, fontSize: '0.65rem', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '0.3rem' },

  rightCol:    { background: t.bg2, border: `1px solid ${t.border}`, borderRadius: '16px', overflow: 'hidden', boxShadow: t.shadowCard },
  editHeading: { color: t.textMuted, fontSize: '0.68rem', letterSpacing: '0.18em', textTransform: 'uppercase', margin: '1.5rem 1.5rem 0', fontFamily: t.fontBody },

  tabRow:   { display: 'flex', borderBottom: `1px solid ${t.border}`, margin: '0.75rem 0 0' },
  tab:      { flex: 1, padding: '0.75rem 0.5rem', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontFamily: t.fontBody, fontWeight: 500, letterSpacing: '0.04em', transition: 'all 0.15s' },
  tabPanel: { padding: '1.5rem', animation: 'fadeIn 0.2s ease' },
  formGroup:{ display: 'flex', flexDirection: 'column', gap: '0.65rem' },
  fieldHint:{ color: t.textSecondary, fontSize: '0.85rem', margin: 0, fontFamily: t.fontBody },

  symbolGrid: { display: 'flex', gap: '0.75rem' },
  symbolBtn:  { flex: 1, aspectRatio: '1', borderRadius: '10px', border: '1px solid', fontSize: '1.8rem', cursor: 'pointer', transition: 'all 0.18s', fontFamily: t.fontDisplay, display: 'flex', alignItems: 'center', justifyContent: 'center' },

  // ── Foto tab ──────────────────────────────────────────────
  dropZone: {
    border: `2px dashed`,
    borderRadius: '12px',
    cursor: 'pointer',
    overflow: 'hidden',
    transition: 'border-color 0.2s, background 0.2s',
    minHeight: '160px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropEmpty: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem',
    padding: '2rem',
  },
  dropIcon:      { fontSize: '1.8rem', color: t.textMuted, lineHeight: 1 },
  dropPrimary:   { color: t.textSecondary, fontSize: '0.9rem', fontWeight: 500 },
  dropSecondary: { color: t.textMuted, fontSize: '0.78rem' },

  previewWrap: {
    width: '100%', position: 'relative',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  previewImg: {
    width: '100%', maxHeight: '200px', objectFit: 'cover', display: 'block',
  },
  previewOverlay: {
    position: 'absolute', inset: 0,
    background: 'rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    opacity: 0, transition: 'opacity 0.2s',
  },
  previewOverlayText: {
    color: '#fff', fontSize: '0.85rem', fontWeight: 500, letterSpacing: '0.06em',
  },

  deleteBtn: {
    marginTop: '0.25rem', padding: '0.55rem 1rem',
    borderRadius: '8px', border: `1px solid ${t.border}`,
    background: 'transparent', color: t.loss,
    cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'inherit',
    transition: 'all 0.15s', whiteSpace: 'nowrap',
  },
};
