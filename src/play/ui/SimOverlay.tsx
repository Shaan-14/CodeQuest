import { useEffect, useRef, useState } from 'preact/hooks';
import { BASEBALL_STEPS } from '../../content/play/baseball';
import { hasEffect } from '../logic/conditions';
import { opposingTeam, ourTeam, simulateGame, winRate, type GameResult, type Play } from '../logic/baseballSim';
import { recordSeen, worldReward } from '../../game/play';
import { getStore, useGame } from '../../game/store';
import type { Stage } from '../engine/stage';

/**
 * Play a game at Harborview Park. The strength of the Herons comes from the analysis the player has done (how many of the six steps, and whether
 * the lineup is set); the game explains that, and a win is recorded as a story fact. A loss costs nothing: look at the analysis and play again.
 */
export function SimOverlay({ stage, onClose }: { stage: Stage; onClose: () => void }) {
  const { save } = useGame();
  const steps = BASEBALL_STEPS.filter((s) => hasEffect(save, s.effect)).length;
  const lineupSet = hasEffect(save, 'field.lineup:set');
  const us = ourTeam(steps, lineupSet);
  const gamesPlayed = Object.keys(save.play.seen).filter((k) => k.startsWith('sim-game-')).length;
  const [phase, setPhase] = useState<'ready' | 'playing' | 'done'>('ready');
  const [line, setLine] = useState('');
  const [score, setScore] = useState({ us: 0, them: 0, inning: 1 });
  const [result, setResult] = useState<(GameResult & { chance: number; firstWin: boolean }) | null>(null);
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; stage.setCinema(null); }; }, [stage]);

  async function play() {
    setPhase('playing');
    const seed = 101 + gamesPlayed * 7;
    const game = simulateGame(us, opposingTeam, seed);
    let ours = 0, theirs = 0;
    stage.setCinema({ x: 0, z: 6 - 13, y: 1.5, yaw: 0.0, pitch: 0.6, dist: 30 });
    const dyn = stage.dyn('team');
    await dyn?.run?.('sim', {
      plays: game.plays, speed: 1.6,
      onPlay: (p: Play) => { if (!alive.current) return; if (p.half === 'us') ours += p.runs; else theirs += p.runs; setScore({ us: ours, them: theirs, inning: p.inning }); setLine(`${p.half === 'us' ? 'Herons' : 'Gulls'}, inning ${p.inning}: ${p.text}`); stage.env_caption?.(p.text); },
    });
    if (!alive.current) return;
    stage.setCinema(null);
    const st = getStore();
    const firstWin = game.won && !st.save.play.seen['sim-win'];
    st.apply(recordSeen(st.save, `sim-game-${gamesPlayed + 1}`));
    if (game.won) { if (firstWin) st.apply(worldReward(st.save, 60, 25, 'Won at Harborview Park')); st.apply(recordSeen(st.save, 'sim-win')); }
    setResult({ ...game, chance: winRate(us, opposingTeam, 300), firstWin });
    setPhase('done');
  }

  const missing = BASEBALL_STEPS.filter((s) => !hasEffect(save, s.effect));
  return (
    <div class="play-terminal" style={{ background: 'transparent', pointerEvents: phase === 'playing' ? 'none' : 'auto' }} role="dialog" aria-label="Play ball" data-testid="play-sim">
      {phase !== 'playing' ? (
        <div class="play-dialogue pill" style={{ pointerEvents: 'auto', bottom: '14px' }}>
          <div class="portrait" aria-hidden="true">⚾</div>
          <div>
            {phase === 'ready' && (
              <>
                <div class="speaker">Coach Reyes<span class="role">Harborview Herons vs Dockside Gulls · 3 innings</span></div>
                <p>{lineupSet ? 'The lineup is set by your analysis. Let us see if the numbers were right.' : `We have ${steps} of 6 analysis steps done. Without a finished lineup I pick by jersey number.`} Your Herons: on-base {us.obp.toFixed(3)}, slugging {us.slg.toFixed(3)}, misplay rate {(us.errorRate * 100).toFixed(0)}%.</p>
                <div class="row"><button class="btn" onClick={onClose} data-testid="sim-notyet">Not yet</button><button class="btn gold" onClick={play} data-testid="sim-play">Play ball</button></div>
              </>
            )}
            {phase === 'done' && result && (
              <>
                <div class="speaker" data-testid="sim-result" data-won={result.won ? '1' : '0'}>{result.won ? '🏆 The Herons win' : 'The Gulls win'} {result.us}–{result.them}</div>
                <p>{result.won ? `Your lineup did what the data said it would.${result.firstWin ? ' +60 XP, +25 coins.' : ''}` : 'Not this time.'} With this lineup the Herons win about {Math.round(result.chance * 100)}% of games.{missing.length ? ` Still to do: ${missing.map((m) => m.label.toLowerCase()).join('; ')}. ${missing[0]!.why.replace(/^./, (c) => c.toUpperCase())}.` : ' Every step of the analysis is in; the rest is baseball.'}</p>
                <div class="row"><button class="btn" onClick={onClose} data-testid="sim-close">Back to the field</button><button class="btn gold" onClick={() => { setResult(null); setPhase('ready'); setScore({ us: 0, them: 0, inning: 1 }); setLine(''); }} data-testid="sim-again">Play again</button></div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div class="play-race pill" style={{ top: '70px' }} data-testid="sim-scoreboard">
          <span>Inning {score.inning}</span><span>Herons {score.us}</span><span>Gulls {score.them}</span><span style={{ fontFamily: 'inherit', maxWidth: '40ch' }}>{line}</span>
        </div>
      )}
    </div>
  );
}
