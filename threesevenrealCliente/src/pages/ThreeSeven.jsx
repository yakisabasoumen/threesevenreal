import { useState } from 'react';
import api from '../api/axios';
import GameHeader from '../components/layout/GameHeader';
import CardHand from '../components/game/CardHand';
import StatusBanner from '../components/game/StatusBanner';
import GameStartScreen from '../components/game/GameStartScreen';
import PrimaryButton from '../components/ui/PrimaryButton';
import { t } from '../styles/theme';

const RULES_BOX = 'Tres iguales › Escalera de color › Siete de color › Tres de color › Color › Pareja › Carta alta';

export default function ThreeSeven() {
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(false);

  const startGame = async () => {
    setLoading(true);
    try { const res = await api.post('/threeseven/start'); setGame(res.data); }
    catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <div style={s.container}>
      <GameHeader title="♦ Tres y Siete" />
      <main style={s.main}>
        {!game ? (
          <GameStartScreen
            suit="♦"
            title="Tres y Siete"
            ruleText="Se reparten 3 cartas. Gana la mejor combinación."
            rulesBox={RULES_BOX}
            btnLabel="Jugar"
            loading={loading}
            onStart={startGame}
          />
        ) : (
          <div style={s.gameLayout}>
            <StatusBanner status={game.status} />

            <div style={s.grid}>
              <CardHand title="Tu mano" cards={game.playerHand} footer={game.playerHandRank} />
              <CardHand title="Bot"     cards={game.botHand}    footer={game.botHandRank} />
            </div>

            {game.message && <p style={s.message}>{game.message}</p>}

            <div style={s.actions}>
              <PrimaryButton onClick={startGame} disabled={loading}>
                {loading ? '...' : '↺ Nueva partida'}
              </PrimaryButton>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const s = {
  container: { minHeight: '100vh', background: t.bg0, color: t.textPrimary },
  main: { maxWidth: '800px', margin: '0 auto', padding: '2rem 1.5rem' },
  gameLayout: { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' },
  message: { color: t.textSecondary, textAlign: 'center', fontStyle: 'italic', fontSize: '0.9rem', margin: 0 },
  actions: { display: 'flex', justifyContent: 'center' },
};