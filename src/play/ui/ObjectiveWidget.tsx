import { quests } from '../../content/world';
import { nextObjective, objectiveDone } from '../../game/quests';
import { useGame } from '../../game/store';
import type { Objective } from '../logic/objective';

export interface GuideInfo { dist: number; bearing: number; via: boolean; label: string }

/**
 * The objective: what to do, where it is and how far, with a small compass arrow that turns as the player (and camera) turn. Under it, the
 * steps of the current quest. It tells the player WHERE the story goes and never how to solve anything.
 */
export function ObjectiveWidget({ objective, guide, fresh }: { objective: Objective | null; guide: GuideInfo | null; fresh: boolean }) {
  const { save } = useGame();
  const quest = objective?.questId ? quests.find((q) => q.id === objective.questId) : undefined;
  const next = quest ? nextObjective(save, quest) : undefined;
  const dist = guide ? Math.max(0, Math.round(guide.dist)) : null;
  return (
    <aside class={`objective ${fresh ? 'fresh' : ''}`} aria-label="Current objective" data-testid="play-tracker" data-objective={objective ? objective.kind : 'none'}>
      <div class="obj-head">
        <div class="obj-compass" aria-hidden="true" style={{ opacity: guide && dist !== null && dist > 3 ? 1 : 0.25 }}>
          <svg viewBox="0 0 40 40" width="38" height="38" style={{ transform: `rotate(${guide ? (guide.bearing * 180) / Math.PI : 0}deg)` }}><circle cx="20" cy="20" r="18" fill="rgba(255,209,102,.12)" stroke="#ffd166" stroke-width="2" /><path d="M20 6 L28 27 L20 22 L12 27 Z" fill={guide?.via ? '#6ee7ff' : '#ffd166'} /></svg>
        </div>
        <div class="obj-main">
          <div class="obj-kicker">{!objective ? 'Explore' : objective.kind === 'training' ? 'Before anything else' : objective.kind === 'choose' ? 'Bytehaven Plaza' : objective.kind === 'free' ? 'Free to roam' : objective.kind === 'review' ? 'Review due' : 'Objective'}</div>
          <div class="obj-title" data-testid="objective-title">{objective ? objective.title : 'Look around'}</div>
        </div>
      </div>
      <div class="obj-text" data-testid="objective-text">{objective ? objective.text : 'Nothing is asked of you here. Walk anywhere, talk to people, or open the map (M) to pick a world.'}</div>
      {objective && guide && <div class="obj-where" data-testid="objective-where">{guide.via ? '🚪' : '📍'} {guide.label}{dist !== null ? ` · ${dist <= 3 ? (guide.via ? 'right here' : 'you are here') : `${dist} m`}` : ''}</div>}
      {quest && (
        <div class="obj-steps" data-testid={`tracker-${quest.id}`}>
          {quest.objectives.map((o) => <div key={o.id} class={`step ${objectiveDone(save, o) ? 'done' : ''} ${o.id === next?.id ? 'now' : ''}`}>{objectiveDone(save, o) ? '☑' : o.id === next?.id ? '▶' : '☐'} {o.text}</div>)}
        </div>
      )}
    </aside>
  );
}
