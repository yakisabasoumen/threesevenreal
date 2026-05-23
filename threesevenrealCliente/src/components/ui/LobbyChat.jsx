import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLobbyChat } from '../../hooks/useLobbyChat';
import { useAuth } from '../../context/useAuth';
import { t } from '../../styles/theme';

export default function LobbyChat() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { messages, sendMessage, cooldown, connected } = useLobbyChat();
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(true);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  useEffect(() => {
    if (cooldown === 0 && isOpen) inputRef.current?.focus();
  }, [cooldown, isOpen]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || cooldown > 0) return;
    sendMessage(text);
    setInput('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const formatTime = (ts) =>
    new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const nearLimit = input.length > 170;

  return (
    <div className="lobby-chat" style={s.wrapper}>

      {/* ── HEADER ── */}
      <div style={s.header} onClick={() => setIsOpen((o) => !o)}>
        <div style={s.headerLeft}>
          <div style={s.headerIconBox}>
            <span style={s.headerIcon}>♠</span>
          </div>
          <div>
            <p style={s.headerTitle}>Chat del lobby</p>
            <p style={s.headerSub}>Habla con otros jugadores</p>
          </div>
        </div>
        <div style={s.headerRight}>
          {connected && (
            <div style={s.onlineBadge}>
              <span style={s.onlineDot} />
              En línea
            </div>
          )}
          <span style={{
            ...s.chevron,
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}>▾</span>
        </div>
      </div>

      {isOpen && (
        <>
          {/* ── MENSAJES ── */}
          <div className="messages" style={s.messages}>
            <div style={s.systemMsg}>
              <span style={s.diamond}>♦</span>
              Bienvenido al lobby de ThreeSevenReal
            </div>

            {messages.map((msg) =>
              msg.type === 'SYSTEM' ? (
                <div key={msg.messageId} style={s.systemMsg}>
                  <span style={s.diamond}>♦</span>
                  {msg.content}
                </div>
              ) : (
                <div
                  key={msg.messageId}
                  style={msg.sender === user?.username ? s.rowOwn : s.rowOther}
                >
                  <div style={s.meta}>
                    <span
                      style={msg.sender === user?.username ? s.senderOwn : s.senderClickable}
                      onClick={msg.sender !== user?.username ? () => navigate(`/profile/${encodeURIComponent(msg.sender)}`) : undefined}
                    >
                      {msg.sender === user?.username ? 'Tú' : msg.sender}
                    </span>
                    <span style={s.time}>{formatTime(msg.timestamp)}</span>
                  </div>
                  <div style={msg.sender === user?.username ? s.bubbleOwn : s.bubble}>
                    {msg.content}
                  </div>
                </div>
              )
            )}

            {messages.length === 0 && (
              <div style={s.emptyState}>
                <span style={s.emptyIcon}>✦</span>
                <p style={s.emptyText}>Sé el primero en escribir...</p>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* ── FOOTER ── */}
          <div className="footer" style={s.footer}>
            <div className="footerDivider" style={s.footerDivider} />

            <div className="inputRow" style={s.inputRow}>
              <input
                ref={inputRef}
                style={{ ...s.input, ...(cooldown > 0 ? s.inputDisabled : {}) }}
                value={input}
                onChange={(e) => setInput(e.target.value.slice(0, 200))}
                onKeyDown={handleKey}
                placeholder={cooldown > 0 ? `Espera ${cooldown}s...` : 'Escribe un mensaje...'}
                disabled={cooldown > 0}
                maxLength={200}
              />
              <button
                style={{
                  ...s.sendBtn,
                  ...(cooldown > 0 ? s.sendBtnCool : {}),
                  ...(!input.trim() || cooldown > 0 ? s.sendBtnOff : {}),
                }}
                onClick={handleSend}
                disabled={cooldown > 0 || !input.trim()}
              >
                {cooldown > 0 ? `${cooldown}s` : '↑'}
              </button>
            </div>

            <div style={s.bottomRow}>
              <div style={{ ...s.cdWrap, opacity: cooldown > 0 ? 1 : 0 }}>
                <div style={{
                  ...s.cdBar,
                  width: `${(cooldown / 3) * 100}%`,
                  transition: cooldown > 0 ? 'width 1s linear' : 'none',
                }} />
              </div>
              <span style={{ ...s.charCount, ...(nearLimit ? s.charRed : {}) }}>
                {input.length}/200
              </span>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes slideMsg {
          from { opacity: 0; transform: translateY(5px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseDot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}

const baseBubble = {
  borderRadius: '12px',
  padding: '9px 13px',
  fontSize: '0.83rem',
  color: t.textPrimary,
  lineHeight: 1.55,
  wordBreak: 'break-word',
  fontFamily: t.fontBody,
  animation: 'slideMsg 0.2s ease',
};

const baseRow = {
  display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '86%',
};

const s = {
  wrapper: {
    flex: 1,                   
    display: 'flex',
    flexDirection: 'column',
    background: t.bg2,
    border: `1px solid ${t.border}`,
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: t.shadowCard,
    fontFamily: t.fontBody,
    minHeight: 0,           
  },

  header: {
    background: t.bg1,
    borderBottom: `1px solid ${t.border}`,
    padding: '14px 16px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    cursor: 'pointer', userSelect: 'none', flexShrink: 0,
  },
  headerLeft:  { display: 'flex', alignItems: 'center', gap: '11px' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '10px' },
  headerIconBox: {
    width: '32px', height: '32px', borderRadius: '8px',
    background: 'rgba(201,168,76,0.07)', border: `1px solid ${t.border}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  headerIcon: { color: t.gold, fontFamily: t.fontDisplay, fontSize: '0.95rem', opacity: 0.85 },
  headerTitle: { fontFamily: t.fontDisplay, fontSize: '0.93rem', fontWeight: 600, color: t.textPrimary, letterSpacing: '0.02em', margin: 0, lineHeight: 1.3 },
  headerSub:   { fontSize: '0.68rem', color: t.textMuted, margin: 0, letterSpacing: '0.03em' },
  chevron: {
    color: t.gold, fontSize: '1.1rem', lineHeight: 1,
    transition: 'transform 0.25s ease', display: 'inline-block',
  },
  onlineBadge: {
    display: 'flex', alignItems: 'center', gap: '5px',
    background: 'rgba(74,222,128,0.07)', border: '1px solid rgba(74,222,128,0.18)',
    borderRadius: '20px', padding: '3px 9px',
    fontSize: '0.67rem', color: '#4ade80', letterSpacing: '0.04em',
  },
  onlineDot: {
    display: 'inline-block', width: '6px', height: '6px',
    borderRadius: '50%', background: '#4ade80',
    animation: 'pulseDot 2.2s ease-in-out infinite',
  },

  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: '14px 13px',
    display: 'flex', flexDirection: 'column', gap: '10px',
    minHeight: 0,
  },

  systemMsg: {
    alignSelf: 'center', display: 'flex', alignItems: 'center', gap: '6px',
    fontSize: '0.69rem', color: t.textMuted,
    background: 'rgba(201,168,76,0.03)', border: `1px solid ${t.border}`,
    padding: '4px 12px', borderRadius: '20px', letterSpacing: '0.03em',
  },
  diamond: { color: t.goldDark, fontSize: '0.58rem', opacity: 0.7 },

  rowOther: { ...baseRow, alignSelf: 'flex-start' },
  rowOwn:   { ...baseRow, alignSelf: 'flex-end', alignItems: 'flex-end' },
  meta:      { display: 'flex', alignItems: 'center', gap: '6px', padding: '0 3px' },
  sender:    { fontSize: '0.67rem', fontWeight: 500, color: t.gold, letterSpacing: '0.04em' },
  senderClickable: {
    fontSize: '0.67rem', fontWeight: 500, color: t.gold, letterSpacing: '0.04em',
    cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '4px'
  },
  senderOwn: { fontSize: '0.67rem', fontWeight: 500, color: t.textSecondary, letterSpacing: '0.04em' },
  time:      { fontSize: '0.61rem', color: t.textMuted },

  bubble: {
    ...baseBubble, background: t.bg3,
    border: `1px solid ${t.border}`, borderBottomLeftRadius: '3px',
  },
  bubbleOwn: {
    ...baseBubble, background: t.bg4,
    border: `1px solid rgba(201,168,76,0.22)`, borderBottomRightRadius: '3px',
  },

  emptyState: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: '8px', marginTop: '40px', opacity: 0.45,
  },
  emptyIcon: { color: t.gold, fontSize: '1.2rem', fontFamily: t.fontDisplay },
  emptyText: { color: t.textMuted, fontSize: '0.79rem', margin: 0, letterSpacing: '0.04em' },

  footer: {
    flexShrink: 0, background: t.bg1,
    padding: '10px 13px 12px',
    display: 'flex', flexDirection: 'column', gap: '8px',
  },
  footerDivider: { height: '1px', background: t.border, opacity: 0.5, marginBottom: '2px' },
  inputRow: { display: 'flex', gap: '8px', alignItems: 'center' },
  input: {
    flex: 1, background: t.bg0, border: `1px solid ${t.border}`,
    borderRadius: '10px', color: t.textPrimary,
    padding: '9px 13px', fontSize: '0.83rem',
    fontFamily: t.fontBody, outline: 'none', height: '40px',
    transition: 'border-color 0.2s',
  },
  inputDisabled: { opacity: 0.4, cursor: 'not-allowed' },
  sendBtn: {
    width: '40px', height: '40px', borderRadius: '10px',
    border: `1px solid rgba(201,168,76,0.28)`,
    background: t.bg4, color: t.gold,
    fontSize: '1rem', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.2s', flexShrink: 0, fontFamily: t.fontBody, fontWeight: 500,
  },
  sendBtnCool: { background: t.bg3, borderColor: t.border, color: t.textMuted, fontSize: '0.72rem' },
  sendBtnOff:  { opacity: 0.3, cursor: 'not-allowed' },
  bottomRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 2px' },
  cdWrap: {
    flex: 1, height: '2px', background: t.bg3,
    borderRadius: '2px', overflow: 'hidden', marginRight: '10px', transition: 'opacity 0.3s',
  },
  cdBar: {
    height: '100%',
    background: `linear-gradient(90deg, ${t.goldDark}, ${t.gold})`,
    borderRadius: '2px',
  },
  charCount: { fontSize: '0.63rem', color: t.textMuted },
  charRed:   { color: t.loss },
};