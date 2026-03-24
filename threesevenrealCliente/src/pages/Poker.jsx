import { useState } from 'react';
import api from '../api/axios';
import GameHeader from '../components/layout/GameHeader';
import CardHand from '../components/game/CardHand';
import StatusBanner from '../components/game/StatusBanner';
import GameStartScreen from '../components/game/GameStartScreen';
import PrimaryButton from '../components/ui/PrimaryButton';
import { t } from '../styles/theme';

const PHASES = ['PREFLOP', 'FLOP', 'TURN', 'RIVER', 'SHOWDOWN'];
const PHASE_LABELS = { PREFLOP: 'Pre-Flop', FLOP: 'Flop', TURN: 'Turn', RIVER: 'River', SHOWDOWN: 'Showdown' };

export default function Poker() {
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(false);

  const startGame = async () => {
    setLoading(true);
    try { const res = await api.post('/poker/start'); setGame(res.data); }
    catch (e) { console.error(e); }
    setLoading(false);
  };

  const check = async () => {
    setLoading(true);
    try { const res = await api.post(`/poker/${game.gameId}/check`); setGame(res.data); }
    catch (e) { console.error(e); }
    setLoading(false);
  };

  const fold = async () => {
    setLoading(true);
    try { const res = await api.post(`/poker/${game.gameId}/fold`); setGame(res.data); }
    catch (e) { console.error(e); }
    setLoading(false);
  };

  const isPlaying  = game?.status === 'PLAYING';
  const isFinished = game && !isPlaying;
  const phaseIndex = game ? PHASES.indexOf(game.phase) : -1;

  return (
    <div style={s.container}>
      <GameHeader title="♠ Poker Texas Hold'em" />
      <main style={s.main}>
        {!game ? (
          <GameStartScreen
            suit="♠"
            title="Texas Hold'em"
            ruleText="2 cartas privadas + 5 comunitarias contra la máquina."
            loading={loading}
            onStart={startGame}
          />
        ) : (
          <div style={s.gameLayout}>
            <div style={s.phases}>
              {PHASES.map((p, i) => (
                <div key={p} style={{
                  ...s.phase,
                  background: i < phaseIndex ? 'rgba(74,222,128,0.15)' : i === phaseIndex ? t.goldGlow : 'transparent',
                  color:      i < phaseIndex ? t.win                   : i === phaseIndex ? t.goldLight : t.textMuted,
                  border: `1px solid ${i < phaseIndex ? 'rgba(74,222,128,0.3)' : i === phaseIndex ? t.border : t.textMuted + '22'}`,
                }}>
                  {PHASE_LABELS[p]}
                </div>
              ))}
            </div>

            <StatusBanner
              status={game.status}
              extra={game.playerHandRank}
              textMap={{ PLAYER_WIN: '✦ ¡Ganaste!', BOT_WIN: 'Gana el bot', PUSH: 'Empate', PLAYER_FOLD: 'Te has retirado' }}
            />

            {game.communityCards?.length > 0 && (
              <CardHand title="Mesa" cards={game.communityCards} />
            )}

            <div style={s.grid}>
              <CardHand title="Tu mano" cards={game.playerHand || []} footer={isFinished ? game.playerHandRank : null} />
              <CardHand title="Bot"     cards={isFinished && game.botHand ? game.botHand : []} footer={isFinished ? game.botHandRank : '🂠 🂠 Ocultas'} />
            </div>

            {game.message && <p style={s.message}>{game.message}</p>}

            <div style={s.actions}>
              {isPlaying ? (
                <>
                  <button style={s.btnCheck} onClick={check} disabled={loading}>
                    {loading ? '...' : game.phase === 'RIVER' ? '🃏 Ver resultado' : '✅ Check / Ver'}
                  </button>
                  {game.phase !== 'PREFLOP' && (
                    <button style={s.btnFold} onClick={fold} disabled={loading}>
                      {loading ? '...' : '🏳 Fold'}
                    </button>
                  )}
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
  main: { maxWidth: '900px', margin: '0 auto', padding: '2rem 1.5rem' },
  gameLayout: { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  phases: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap' },
  phase: { flex: 1, textAlign: 'center', padding: '0.5rem 0.25rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', letterSpacing: '0.06em', textTransform: 'uppercase', minWidth: '70px', fontFamily: t.fontBody },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  message: { color: t.textSecondary, textAlign: 'center', fontStyle: 'italic', fontSize: '0.9rem', margin: 0 },
  actions: { display: 'flex', justifyContent: 'center', gap: '1rem' },
  btnCheck: { padding: '0.85rem 2rem', borderRadius: '8px', border: '1px solid rgba(74,222,128,0.4)',  background: 'rgba(74,222,128,0.1)',  color: t.win,  fontSize: '0.95rem', fontWeight: '700', cursor: 'pointer', fontFamily: t.fontBody },
  btnFold:  { padding: '0.85rem 2rem', borderRadius: '8px', border: '1px solid rgba(248,113,113,0.4)', background: 'rgba(248,113,113,0.1)', color: t.loss, fontSize: '0.95rem', fontWeight: '700', cursor: 'pointer', fontFamily: t.fontBody },
};