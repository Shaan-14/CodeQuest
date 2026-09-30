import { useEffect } from 'preact/hooks';
import { getRunner } from '../../learning/python/runner';
import type { Track } from '../../game/lessons';
import { LessonList } from '../components/LessonList';
import { NpcCards, QuestOffers } from '../components/NpcCards';
import { Recommendations } from '../components/Recommendations';
import { SqlSandbox } from '../components/SqlSandbox';
import { useState } from 'preact/hooks';

interface Props {
  areaId: string;
  title: string;
  theme: string;
  track: Track;
  giver: string;
  /** Areas with several quest givers list them all (Web District). */
  givers?: string[];
  blurb: string;
  sandbox?: boolean;
  onOpenLesson: (id: string) => void;
  onPractice: (challengeId: string) => void;
  onPracticeYard: () => void;
}

/** A themed area listing one part of the curriculum, with its NPCs, quest offers and (for SQL) a free-play sandbox. */
export function TrackArea(p: Props) {
  const [tab, setTab] = useState<'lessons' | 'sandbox'>('lessons');
  useEffect(() => void getRunner().warmUp().catch(() => undefined), []);
  return (
    <main class={`scene theme-${p.theme}`} data-testid={`area-screen-${p.areaId}`}>
      <div class="scene-card wide">
        <h1 class="scene-title">{p.title}</h1>
        <p class="muted center">{p.blurb}</p>
        <NpcCards areaId={p.areaId} />
        {(p.givers ?? [p.giver]).map((g) => <QuestOffers key={g} giver={g} />)}
        {p.sandbox && (
          <div class="tabs" role="tablist">
            <button role="tab" aria-selected={tab === 'lessons'} class={tab === 'lessons' ? 'active' : ''} onClick={() => setTab('lessons')}>Lessons</button>
            <button role="tab" aria-selected={tab === 'sandbox'} class={tab === 'sandbox' ? 'active' : ''} onClick={() => setTab('sandbox')} data-testid="tab-sandbox">SQL Sandbox</button>
          </div>
        )}
        {tab === 'sandbox' && p.sandbox ? <SqlSandbox /> : (
          <>
            <div class="row-between">
              <h2>Lessons</h2>
              <button class="btn small" onClick={p.onPracticeYard}>🎯 Practice Yard</button>
            </div>
            <Recommendations onPractice={p.onPractice} onOpenLesson={p.onOpenLesson} max={2} />
            <LessonList track={p.track} onOpenLesson={p.onOpenLesson} />
          </>
        )}
      </div>
    </main>
  );
}
