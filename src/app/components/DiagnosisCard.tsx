import { getSkill } from '../../content';
import { useGame } from '../../game/store';

const SIZE: Record<string, string> = {
  minor: 'A quick refresher: about two short steps.',
  moderate: 'A short targeted session: a review, a fresh problem, then one on your own.',
  serious: 'A focused session with a worked example, guided and independent practice.',
  major: 'A full training path. This lesson waits for you, and you come straight back to it afterwards.',
};

/** What the evidence says after a failed attempt: kind, specific, never "go back to Lesson 2". */
export function DiagnosisCard({ challengeId, onTrain }: { challengeId: string; onTrain?: (weaknessId: string) => void }) {
  const { save } = useGame();
  const w = [...save.training.weaknesses].reverse().find((x) => x.exposedBy.challengeId === challengeId && x.status !== 'resolved');
  if (!w) return null;
  const names = w.skillIds.map((k) => getSkill(k)?.title ?? k).join(' + ');
  return (
    <div class="diagnosis panel" data-testid="diagnosis">
      <strong>🎯 What to work on: {names}</strong>
      <p class="small">
        {w.kind === 'combination' ? 'You know these ideas separately; putting them together is the gap.' : w.kind === 'hint-reliance' ? 'You needed a hint here. A fresh problem will show you can do it alone.' : w.kind === 'application' ? 'You have done this before; applying it in a new setting is the gap.' : 'This is a small thing to work on, not a step backwards.'}
      </p>
      {w.reasons.length > 0 && <ul class="small">{w.reasons.map((r, i) => <li key={i}>{r}</li>)}</ul>}
      {w.previousIndependent > 0 && <p class="small muted">Your earlier independent solves on this stay on your record.</p>}
      <p class="small muted">{SIZE[w.severity]} You can keep trying here as many times as you like; nothing is locked.</p>
      {onTrain && <button class="btn small gold" onClick={() => onTrain(w.id)} data-testid="train-now">🏋️ Train this now</button>}
    </div>
  );
}
