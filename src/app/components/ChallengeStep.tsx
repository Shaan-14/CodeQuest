import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { Challenge } from '../../content/schema';
import { getRunner } from '../../learning/python/runner';
import type { GradeResult } from '../../learning/runner';
import { FOCUS_LOSS_PER_FAILED_SUBMIT, recordRun, revealHint, saveDraftCode, startReplay, submitChallenge } from '../../game/actions';
import { rewardFor } from '../../game/progression';
import { getStore, useGame } from '../../game/store';
import { RichText } from './RichText';
import { emptyConsole, type ConsoleState } from './Console';
import { Modal } from './Modal';
import { NotesList } from './NotesList';
import { Workbench } from './Workbench';
import { GRADE_TIMEOUT_MS, runPython, useRunnerStatus } from './useRunner';

const MODE_LABEL = { learning: 'Learning mode', challenge: 'Challenge mode', independent: 'Independent trial' } as const;
const MODE_BLURB = {
  learning: 'Guided practice. Steps and stronger hints are available.',
  challenge: 'Less guidance. Solve it yourself; hints cost reward.',
  independent: 'No hints, no scaffolding, no named tools. Look things up in your notes.',
} as const;

interface Props {
  challenge: Challenge;
  onReady: () => void;
  onGoAcademy: () => void;
  /** Present when another variant of this objective exists: switches to a DIFFERENT problem on the same idea. */
  onSwitchVariant?: () => void;
  variantInfo?: { index: number; total: number };
}

/** A plain-language account of what went wrong, without revealing the answer. */
function explainFailure(result: GradeResult): string {
  if (result.timedOut) return 'Your program ran for too long, so it was stopped. That usually means a loop that never ends.';
  if (result.error) return 'Python could not run your program at all, so none of the tests ran. Read the error above, look at the line it points to, fix that one thing, and submit again.';
  const failed = result.checks.filter((k) => !k.passed);
  const hidden = failed.filter((k) => !k.visible).length;
  const parts = [`${failed.length} of ${result.checks.length} check${result.checks.length === 1 ? '' : 's'} did not pass.`];
  if (hidden > 0) parts.push(`${hidden} of the failures ${hidden === 1 ? 'is a hidden case' : 'are hidden cases'}: inputs the example does not show, such as boundaries, zero, or negative numbers. Think about which situations your code has not considered.`);
  if (failed.length > hidden) parts.push('For the visible checks, compare what yours produced with what was expected.');
  return parts.join(' ');
}

export function ChallengeStepView({ challenge: c, onReady, onGoAcademy, onSwitchVariant, variantInfo }: Props) {
  const game = useGame();
  const progress = game.save.learning.challenges[c.id];
  const [code, setCode] = useState(progress?.code ?? c.starterCode);
  const [stdin, setStdin] = useState((c.sampleInput ?? []).join('\n'));
  const [cons, setCons] = useState<ConsoleState>(emptyConsole);
  const [result, setResult] = useState<GradeResult | null>(null);
  const [payout, setPayout] = useState<{ xp: number; coins: number; note: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState(false);
  const status = useRunnerStatus();

  const hintsUsed = progress?.hintsUsed ?? 0;
  const passed = !!progress?.passed;
  const focus = game.save.stats.focus;
  const independent = c.mode === 'independent';

  // Active time (seconds the tab is visible), flushed on submit.
  const activeMs = useRef(0);
  useEffect(() => {
    const t = setInterval(() => document.visibilityState === 'visible' && (activeMs.current += 1000), 1000);
    return () => clearInterval(t);
  }, []);

  // Debounced draft save.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    const t = setTimeout(() => { const s = getStore(); s.apply(saveDraftCode(s.save, c.id, code)); }, 700);
    return () => clearTimeout(t);
  }, [code, c.id]);

  useEffect(() => { if (passed) onReady(); }, [passed]); // eslint-disable-line react-hooks/exhaustive-deps

  const showInput = useMemo(() => !!c.sampleInput || code.includes('input('), [c.sampleInput, code]);

  const run = async () => {
    setBusy(true);
    const { state } = await runPython(code, stdin);
    setCons(state);
    setBusy(false);
    const s = getStore();
    s.apply(recordRun(s.save, c.id));
  };

  const submit = async () => {
    setBusy(true);
    setPayout(null);
    let graded: GradeResult;
    try {
      graded = await getRunner().grade({ language: 'python', code, checks: c.checks, constraints: c.constraints, timeoutMs: GRADE_TIMEOUT_MS });
    } catch (e) {
      graded = { passed: false, error: `CodeQuest could not grade your code: ${String(e)}`, timedOut: false, checks: [], constraints: [] };
    }
    setResult(graded);
    setBusy(false);
    const s = getStore();
    const xpBefore = s.save.stats.xp;
    const coinsBefore = s.save.stats.coins;
    const ms = activeMs.current;
    activeMs.current = 0;
    s.apply(submitChallenge(s.save, c.id, graded.passed, ms, code));
    if (graded.passed) {
      const r = rewardFor(c, s.save.learning.challenges[c.id]!.hintsUsed);
      setPayout({ xp: s.save.stats.xp - xpBefore, coins: s.save.stats.coins - coinsBefore, note: r.note });
    }
  };

  const reset = () => { setCode(c.starterCode); setCons(emptyConsole); };
  const hint = () => { const s = getStore(); s.apply(revealHint(s.save, c.id)); };
  const replay = () => {
    const s = getStore();
    s.apply(startReplay(s.save, c.id));
    setCode(c.starterCode); setCons(emptyConsole); setResult(null); setPayout(null);
  };

  const exhausted = focus < 1;
  const failedChecks = result?.checks.filter((k) => !k.passed) ?? [];
  const failedConstraints = result?.constraints.filter((k) => !k.passed) ?? [];

  return (
    <div class="two-col">
      {exhausted && (
        <div class="focus-warning panel" role="alert" data-testid="focus-warning">
          You are out of <strong>Focus</strong>, so you cannot submit right now. You can still Run code and think. Rest at the Academy, or use a snack or tea from your pack.
          <button class="btn small" onClick={onGoAcademy}>Go to the Academy</button>
        </div>
      )}
      <section class="briefing panel" data-testid="briefing" data-challenge={c.id}>
        <div class="brief-head">
          <span class={`mode-badge ${c.mode}`} data-testid="mode-badge">{MODE_LABEL[c.mode]}</span>
          {variantInfo && variantInfo.total > 1 && <span class="variant-chip" data-testid="variant-chip" title="Another problem testing the same idea in a different setting">Problem {variantInfo.index + 1} of {variantInfo.total}</span>}
          <span class="difficulty" title={`Difficulty ${c.difficulty} of 5`}>{'●'.repeat(c.difficulty)}{'○'.repeat(5 - c.difficulty)}</span>
        </div>
        <h2>{c.title}</h2>
        <p class="muted small">{MODE_BLURB[c.mode]}</p>
        <RichText text={c.prompt} />
        {c.expectedBehavior && (
          <div class="expected"><strong>Expected behaviour</strong><RichText text={c.expectedBehavior} /></div>
        )}
        {c.mode === 'learning' && c.guidedSteps && (
          <div class="guided">
            <strong>Guided steps</strong>
            <ol>{c.guidedSteps.map((s, i) => <li key={i}><RichText text={s} /></li>)}</ol>
          </div>
        )}

        {!independent && c.hints.length > 0 && (
          <div class="hints">
            {hintsUsed > 0 && (
              <ol class="hint-list" data-testid="hint-list">
                {c.hints.slice(0, hintsUsed).map((h, i) => <li key={i}><span class="hint-label">Hint {i + 1}</span><RichText text={h} /></li>)}
              </ol>
            )}
          </div>
        )}
        {independent && (
          <div class="callout">
            <strong>Independent trial.</strong> No hints, and the problem does not tell you how to solve it. Your notebook has reference material, and you can test with the Run button as much as you like.
            <div><button class="btn small" onClick={() => setNotes(true)} data-testid="open-notes">📚 Open my notes</button></div>
          </div>
        )}

        {result && (
          <div class={`result ${result.passed ? 'pass' : 'fail'}`} data-testid="result">
            {result.passed ? (
              <>
                <h3>✅ Passed!</h3>
                {payout && <p data-testid="payout">{payout.xp > 0 ? `+${payout.xp} XP` : 'No new XP (already earned)'}{payout.coins > 0 ? `, +${payout.coins} coins` : ''} <span class="muted small">({payout.note})</span></p>}
                {c.mode === 'learning' && <p class="small" data-testid="evidence-note">Recorded as <strong>guided</strong> practice. Independent evidence comes from challenges with less guidance.</p>}
                {c.mode !== 'learning' && progress && progress.hintsUsed === 0 && <p class="small" data-testid="evidence-note">Solved with no hints, and that is recorded as <strong>independent</strong> evidence.</p>}
                {c.mode !== 'learning' && progress && progress.hintsUsed > 0 && <p class="small" data-testid="evidence-note">Solved with {progress.hintsUsed} hint{progress.hintsUsed > 1 ? 's' : ''}. That is recorded honestly. Replay without hints for stronger evidence.</p>}
                {onSwitchVariant && <p><button class="btn small" onClick={onSwitchVariant} data-testid="other-variant">🔀 Practise this idea with a different problem</button></p>}
              </>
            ) : (
              <>
                <h3>❌ Not quite yet</h3>
                {result.error && <pre class="console-error">{result.error}</pre>}
                <p class="small" data-testid="failure-explanation">{explainFailure(result)} <span class="muted">(−{FOCUS_LOSS_PER_FAILED_SUBMIT} Focus)</span></p>
                <div class="retry-actions">
                  <p class="small muted">Fix your code and submit again, open a hint, or try a different problem on the same idea. This attempt stays in your record either way.</p>
                  {onSwitchVariant && <button class="btn small" onClick={onSwitchVariant} data-testid="other-variant">🔀 Try a different problem on this idea</button>}
                </div>
              </>
            )}
            {result.error === '' && (
              <ul class="checks">
                {result.checks.map((k, i) => (
                  <li key={i} class={k.passed ? 'ok' : 'bad'}>
                    <span>{k.passed ? '✔' : '✘'} {k.visible || k.passed ? k.name : `Hidden case ${i + 1}`}</span>
                    {!k.passed && <div class="check-detail"><span>{k.message}</span>
                      {k.expected !== undefined && <div class="diff"><div><b>Expected</b><pre>{k.expected}</pre></div><div><b>Yours</b><pre>{k.actual}</pre></div></div>}
                    </div>}
                  </li>
                ))}
                {result.constraints.map((k, i) => <li key={`c${i}`} class={k.passed ? 'ok' : 'bad'}>{k.passed ? '✔' : '✘'} {k.message}</li>)}
              </ul>
            )}
            {!result.passed && failedChecks.length + failedConstraints.length > 0 && independent && <p class="small muted">Hidden cases test situations the example does not show. Think about what else could be entered.</p>}
          </div>
        )}
      </section>

      <Workbench code={code} onCode={setCode} stdin={stdin} onStdin={setStdin} showInput={showInput} console={cons} status={status} busy={busy} onRun={run} onReset={reset}>
        <button class="btn gold" onClick={submit} disabled={busy || exhausted} data-testid="submit" title={exhausted ? 'Out of Focus' : 'Check your solution'}>✔ Submit</button>
        {!independent && c.hints.length > 0 && (
          <button class="btn" onClick={hint} disabled={hintsUsed >= c.hints.length} data-testid="hint" title="Hints lower your reward and are recorded in your evidence">
            💡 Hint ({hintsUsed}/{c.hints.length})
          </button>
        )}
        {independent && <button class="btn" onClick={() => setNotes(true)}>📚 Notes</button>}
        {passed && hintsUsed > 0 && <button class="btn" onClick={replay} data-testid="replay">🔁 Replay without hints</button>}
      </Workbench>

      {notes && <Modal title="My notes" onClose={() => setNotes(false)} wide><NotesList /></Modal>}
    </div>
  );
}
