import { useMemo, useRef, useState, useEffect } from 'preact/hooks';
import { getAnyChallenge } from '../../content';
import { databasesUsedBy } from '../../content/helpers';
import { sourcesFor } from '../../content/databases';
import { getRunner } from '../../learning/python/runner';
import type { GradeResult } from '../../learning/runner';
import { canSubmitDaily, formatRemaining, submitDaily, timeRemainingMs } from '../../game/daily';
import { difficultyName } from '../../game/dailySelect';
import { getStore, useGame } from '../../game/store';
import { emptyConsole, type ConsoleState } from '../components/Console';
import { Modal } from '../components/Modal';
import { RichText } from '../components/RichText';
import { SchemaBrowser } from '../components/SchemaBrowser';
import { Workbench } from '../components/Workbench';
import { WebWorkbench } from '../components/WebWorkbench';
import { gradeWeb, parseWebFiles } from '../../learning/web/WebRunner';
import { GRADE_TIMEOUT_MS, runCode, useRunnerStatus } from '../components/useRunner';
import { useNow } from '../components/useDailyClock';

/**
 * The Daily Challenge attempt. Deliberately different from a lesson challenge: NO hints, NO variants, NO Field
 * Manual, NO solution or expected-output reveal, and exactly ONE graded submission. Run is free (test as much as
 * you like); the single Submit is recorded whatever the outcome. Failing costs no Focus.
 */
export function DailyRun({ onBack }: { onBack: () => void }) {
  const game = useGame();
  const cur = game.save.daily.current;
  const c = cur ? getAnyChallenge(cur.challengeId) : undefined;
  const now = useNow(15_000);
  const status = useRunnerStatus(c?.language !== 'web');
  const startCode = c?.language === 'web' ? JSON.stringify(c.starterFiles ?? { html: '', css: '', js: '' }) : (c?.starterCode ?? '');
  const [code, setCode] = useState(startCode);
  const [stdin, setStdin] = useState((c?.sampleInput ?? []).join('\n'));
  const [cons, setCons] = useState<ConsoleState>(emptyConsole);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [outcome, setOutcome] = useState<'passed' | 'failed' | null>(null);
  const activeMs = useRef(0);
  useEffect(() => {
    const t = setInterval(() => document.visibilityState === 'visible' && (activeMs.current += 1000), 1000);
    return () => clearInterval(t);
  }, []);
  const sources = useMemo(() => (c ? sourcesFor(databasesUsedBy(c)) : {}), [c]);

  if (!cur || !c) {
    return (
      <main class="lesson" data-testid="daily-run">
        <div class="lesson-head"><button class="btn small ghost" onClick={onBack}>← Back</button><h1>Daily Challenge</h1></div>
        <p class="muted">There is no Daily Challenge on offer right now.</p>
      </main>
    );
  }
  const open = canSubmitDaily(game.save, now) && !outcome;
  const isSql = c.language === 'sql';
  const isWeb = c.language === 'web';

  const run = async () => {
    setBusy(true);
    const { state } = await runCode(c.language, code, { stdin, fixtures: c.fixtures, sources, db: c.db });
    setCons(state);
    setBusy(false);
  };
  const submit = async () => {
    setConfirm(false);
    setBusy(true);
    let graded: GradeResult;
    try {
      graded = isWeb ? await gradeWeb(parseWebFiles(code), c.checks) : await getRunner().grade({ language: c.language, code, checks: c.checks, constraints: c.constraints, fixtures: c.fixtures, sources, db: c.db, timeoutMs: GRADE_TIMEOUT_MS });
    } catch (e) {
      graded = { passed: false, error: String(e), timedOut: false, checks: [], constraints: [] };
    }
    setBusy(false);
    const s = getStore();
    s.apply(submitDaily(s.save, Date.now(), graded.passed, activeMs.current));
    setOutcome(graded.passed ? 'passed' : 'failed');
  };

  return (
    <main class="lesson" data-testid="daily-run">
      <div class="lesson-head">
        <button class="btn small ghost" onClick={onBack}>← Back</button>
        <h1>🌅 Daily Challenge</h1>
      </div>
      <div class="two-col">
        <section class="briefing panel" data-testid="daily-briefing" data-challenge={c.id}>
          <div class="brief-head">
            <span class="mode-badge independent">Daily · no hints · one submission</span>
            <span class="difficulty" title={`Difficulty ${c.difficulty} of 5`}>{difficultyName(c.difficulty)}</span>
          </div>
          <h2>{c.title}</h2>
          <p class="muted small">{cur.category} · {cur.focus === 'review' ? 'Review of an earlier skill' : 'Reinforces what you are learning'} · resets in {formatRemaining(timeRemainingMs(game.save, now))}</p>
          <RichText text={c.prompt} />
          {isSql && c.db && <SchemaBrowser dbId={c.db} />}
          {open && <p class="callout small">You can Run as often as you like. When you Submit, that is your one attempt: it cannot be repeated and no solution is shown.</p>}
          {outcome === 'passed' && (
            <div class="result pass" data-testid="daily-result">
              <h3>✅ Solved!</h3>
              <p>+{cur.reward.coins} coins, +{cur.reward.xp} XP, +{cur.reward.focus} Focus. This counts as independent evidence for {cur.category}, and mastery still needs varied evidence over time.</p>
            </div>
          )}
          {outcome === 'failed' && (
            <div class="result fail" data-testid="daily-result">
              <h3>Not this time</h3>
              <p>Your attempt is recorded, nothing is lost, and there is no retry or answer for this challenge. A fresh one arrives in {formatRemaining(timeRemainingMs(getStore().save, now))}. Revisit the topic in the Library or Practice Yard whenever you like.</p>
            </div>
          )}
          {!open && !outcome && <p class="callout small" data-testid="daily-closed">This challenge has already been {cur.status === 'passed' ? 'solved' : 'attempted'} (or has expired). A new one is coming.</p>}
        </section>
        {isWeb ? (
          <WebWorkbench files={parseWebFiles(code)} onFiles={(f) => setCode(JSON.stringify(f))} tabs={c.web?.tabs ?? ['html', 'css', 'js']} api={!!c.web?.api} readOnly={!open} onReset={() => setCode(startCode)} busy={busy}>
          <button class="btn gold" onClick={() => setConfirm(true)} disabled={busy || !open} data-testid="daily-submit">✔ Submit (one attempt)</button>
          </WebWorkbench>
        ) : (
          <Workbench language={isSql ? 'sql' : 'python'} code={code} onCode={setCode} stdin={stdin} onStdin={setStdin} showInput={!isSql && (!!c.sampleInput || code.includes('input('))} console={cons} status={status} busy={busy} onRun={run} onReset={() => setCode(startCode)} readOnly={!open}>
            <button class="btn gold" onClick={() => setConfirm(true)} disabled={busy || !open} data-testid="daily-submit">✔ Submit (one attempt)</button>
          </Workbench>
        )}
      </div>
      {confirm && (
        <Modal title="Submit your one attempt?" onClose={() => setConfirm(false)}>
          <p>This is the only graded submission you get for this Daily Challenge. Have you tested it with Run, including edge cases?</p>
          <div class="row-between">
            <button class="btn" onClick={() => setConfirm(false)}>Keep working</button>
            <button class="btn gold" onClick={submit} data-testid="daily-confirm">Submit</button>
          </div>
        </Modal>
      )}
    </main>
  );
}
