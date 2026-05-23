import { t } from '../../styles/theme';

export default function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@300;400;500&display=swap');
      body { background: ${t.bg0}; margin: 0; font-family: ${t.fontBody}; color: ${t.textPrimary}; }
      * { box-sizing: border-box; }
      html { scroll-behavior: smooth; }
      button, input, textarea { font-family: ${t.fontBody}; }
      button, .btn, input[type=button], input[type=submit] { min-height: var(--touch-size); min-width: var(--touch-size); }

      :root {
        --break-mobile: 768px;
        --break-tablet: 1024px;
        --profile-left: 280px;
        --lobby-right: 360px;
        --game-right: 300px;
        --ranking-min-width: 720px;
        --ranking-cols: 48px 1fr 80px 80px 80px 80px;
        --touch-size: 44px;
      }

      img, video { max-width: 100%; height: auto; display: block; }
      html, body, #root { min-height: 100%; }
      a { color: inherit; text-decoration: none; }
      input, textarea, button { outline: none; }
      input::placeholder, textarea::placeholder { color: ${t.textMuted}; }

      .ranking-container { overflow-x: auto; }
      .ranking-inner { min-width: var(--ranking-min-width); }
      .ranking-container::-webkit-scrollbar { height: 8px; }
      .ranking-container::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 999px; }

      .game-header { width: 100%; }
      .game-header .title, header.game-header h1 { text-overflow: ellipsis; white-space: nowrap; overflow: hidden; }
      .game-header .headerInner { flex-wrap: wrap; gap: 0.75rem; }
      .game-header .right { min-width: 0; justify-content: flex-start; width: 100%; }

      .lobby-chat { position: relative; max-width: 100%; }
      .lobby-chat .messages { max-height: 40vh; overflow-y: auto; }
      .lobby-chat .footer { position: sticky; bottom: 0; }
      .lobby-chat input, .lobby-chat button { width: 100%; }
      .lobby-chat .inputRow { flex-direction: column !important; gap: 0.5rem !important; }
      .lobby-chat .footerDivider { display: none !important; }

      .page-lobby .page-body { grid-template-columns: 1fr 360px; }
      .page-lobby header .logoGroup { gap: 0.6rem; }
      .page-lobby nav { flex-wrap: wrap; justify-content: flex-end; gap: 0.5rem; }
      .page-lobby nav button { flex: 1 1 auto; }
      .page-lobby .hero { gap: 0.8rem !important; }
      .page-lobby .statsRow { gap: 0.9rem !important; grid-template-columns: repeat(2, minmax(0, 1fr)) !important; display: grid !important; }
      .page-lobby .game-card { min-width: 0; }

      .page-profile .profile-layout { grid-template-columns: 1fr !important; }
      .page-profile .profile-stats-grid { grid-template-columns: 1fr !important; }
      .page-profile .profile-tab-row { flex-wrap: wrap !important; gap: 0.5rem !important; }
      .page-profile .profile-symbol-grid { flex-wrap: wrap !important; }
      .page-profile .profile-form-group input,
      .page-profile .profile-form-group button,
      .page-profile .profile-drop-zone { width: 100% !important; }
      .page-profile .profile-drop-zone { min-height: 180px !important; }
      .page-profile .rightCol { width: 100% !important; }
      .page-profile .heroCard,
      .page-profile .ringCard,
      .page-profile .statPill { width: 100% !important; }

      .page-poker .game-grid,
      .page-threeseven .game-grid { grid-template-columns: 1fr !important; }
      .page-online-game .game-area { grid-template-columns: 1fr !important; }
      .page-online-game .chatInputRow { flex-direction: column !important; }
      .page-online-game .chatInputRow input,
      .page-online-game .chatInputRow button { width: 100% !important; }
      .page-online-game .chatPanel { min-height: auto !important; }

      @media (max-width: 1023px) {
        :root { --ranking-min-width: 660px; }
        .game-header header, header.game-header { padding: 0.9rem 1rem; }
        .game-header .title, header.game-header h1 { font-size: 1.1rem; }
      }

      @media (max-width: 767px) {
        :root {
          --profile-left: 100%;
          --lobby-right: 100%;
          --game-right: 100%;
          --ranking-min-width: 600px;
        }

        body { padding-bottom: 1rem; }
        .page-lobby .page-body { grid-template-columns: 1fr !important; padding: 1rem 0.85rem 1rem !important; }
        .page-lobby .page-sidebar { width: 100% !important; }
        .game-header header, header.game-header { padding: 0.75rem 0.85rem; }
        .game-header .title, header.game-header h1 { font-size: 1rem; text-align: center; display: block; }
        .game-header .right { justify-content: center; }

        .lobby-chat { position: fixed; right: 12px; left: 12px; bottom: 12px; z-index: 1200; border-radius: 14px; }
        .lobby-chat .messages { max-height: 35vh; }
        .lobby-chat .footer { position: sticky; bottom: 0; }

        .page-lobby .page-sidebar { position: static !important; height: auto !important; width: 100% !important; }
        .page-lobby header { position: fixed !important; top: 0; left: 0; right: 0; }
        .page-lobby .page-body { margin-top: 78px !important; }
        .page-lobby nav { justify-content: center; }

        .page-profile .profile-tab-row { justify-content: stretch; }
        .page-profile .profile-symbol-grid { gap: 0.5rem !important; }

        .ranking-container { margin: 0 0.75rem; }
        .ranking-inner { min-width: 100% !important; }
      }
    `}</style>
  );
}