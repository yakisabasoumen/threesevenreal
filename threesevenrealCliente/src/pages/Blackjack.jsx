import { useState } from 'react';
import api from '../api/axios';
import GameHeader from '../components/layout/GameHeader';
import CardHand from '../components/game/CardHand';
import { CardBack } from '../components/game/PlayingCard';
import StatusBanner from '../components/game/StatusBanner';
import GameStartScreen from '../components/game/GameStartScreen';
import PrimaryButton from '../components/ui/PrimaryButton';
import { t } from '../styles/theme';

export default function Blackjack() {
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const startGame = async () => {
    setLoading(true);
    try {
      const res = await api.post('/blackjack/start');
      setGame(res.data); setMessage(res.data.message);
    } catch { setMessage('Error al iniciar la partida'); }
    setLoading(false);
  };

  const hit = async () => {
    setLoading(true);
    try {
      const res = await api.post(`/blackjack/${game.gameId}/hit`);
      setGame(res.data); setMessage(res.data.message);
    } catch { setMessage('Error'); }
    setLoading(false);
  };

  const stand = async () => {
    setLoading(true);
    try {
      const res = await api.post(`/blackjack/${game.gameId}/stand`);
      setGame(res.data); setMessage(res.data.message);
    } catch { setMessage('Error'); }
    setLoading(false);
  };

  const isPlaying = game?.status === 'PLAYING';

  return (
    <div style={s.container}>
      <GameHeader title="♣ Blackjack" />
      <main style={s.main}>
        {!game ? (
          <GameStartScreen
            suit="♣"
            title="Blackjack"
            ruleText="Llega a 21 sin pasarte. El dealer pide cartas hasta 17."
            loading={loading}
            onStart={startGame}
          />
        ) : (
          <div style={s.gameLayout}>
            <StatusBanner status={game.status} />

            <CardHand
              title={`Dealer${game.status !== 'PLAYING' ? ` — ${game.dealerScore} pts` : ''}`}
              cards={game.dealerHand}
              footer={null}
            >
              {isPlaying && <CardBack />}
            </CardHand>

            <CardHand
              title={`Tu mano — ${game.playerScore} pts`}
              cards={game.playerHand}
            />

            {message && <p style={s.message}>{message}</p>}

            <div style={s.actions}>
              {isPlaying ? (
                <>
                  <button style={s.btnHit}   onClick={hit}   disabled={loading}>{loading ? '...' : '👊 Hit'}</button>
                  <button style={s.btnStand} onClick={stand} disabled={loading}>{loading ? '...' : '✋ Stand'}</button>
                </>
              ) : (
                <PrimaryButton onClick={startGame} disabled={loading}>
                  {loading ? '...' : '↺ Nueva partida'}
                </PrimaryButton>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const s = {
  container: { minHeight: '100vh', background: t.bg0, color: t.textPrimary },
  main: { maxWidth: '720px', margin: '0 auto', padding: '2rem 1.5rem' },
  gameLayout: { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  message: { color: t.textSecondary, textAlign: 'center', fontStyle: 'italic', fontSize: '0.9rem', margin: 0 },
  actions: { display: 'flex', justifyContent: 'center', gap: '1rem', paddingTop: '0.5rem' },
  btnHit:   { padding: '0.85rem 2rem', borderRadius: '8px', border: '1px solid rgba(74,222,128,0.4)',  background: 'rgba(74,222,128,0.1)',  color: t.win,  fontSize: '0.95rem', fontWeight: '700', cursor: 'pointer', fontFamily: t.fontBody },
  btnStand: { padding: '0.85rem 2rem', borderRadius: '8px', border: '1px solid rgba(248,113,113,0.4)', background: 'rgba(248,113,113,0.1)', color: t.loss, fontSize: '0.95rem', fontWeight: '700', cursor: 'pointer', fontFamily: t.fontBody },
};