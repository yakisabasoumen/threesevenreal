import { t } from '../../styles/theme';

export default function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@300;400;500&display=swap');
      body { background: ${t.bg0}; margin: 0; font-family: ${t.fontBody}; color: ${t.textPrimary}; }
      * { box-sizing: border-box; }
    `}</style>
  );
}