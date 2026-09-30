import { lazy, Suspense } from 'preact/compat';
import { useEffect, useState } from 'preact/hooks';
import { areas } from '../content/world';
import { trackOfLessonId, worldOfArea, worldOfTrack } from '../content/worlds';
import { useGame } from '../game/store';
import { requiredTraining } from '../game/training';
import { isAreaUnlocked } from '../game/world';
import { Hud, type PanelTab } from './components/Hud';
import { Panel } from './components/Panel';
import { Toasts } from './components/Toasts';
import { Academy } from './screens/Academy';
import { useDailyClock } from './components/useDailyClock';
import { Locked } from './screens/Locked';
import { Title } from './screens/Title';
import { TrackArea } from './screens/TrackArea';
import { TrainingGrounds } from './screens/TrainingGrounds';
import { TrainingYard } from './screens/TrainingYard';
import { weaknessNames } from './components/DiagnosisCard';
import { WorldMap } from './screens/WorldMap';

/** Rarely-used screens load on demand so the first paint does not wait for their code. */
const DailyRun = lazy(() => import('./screens/DailyRun').then((m) => ({ default: m.DailyRun })));
const DailyScreen = lazy(() => import('./screens/DailyScreen').then((m) => ({ default: m.DailyScreen })));
const Library = lazy(() => import('./screens/Library').then((m) => ({ default: m.Library })));
const Practice = lazy(() => import('./screens/Practice').then((m) => ({ default: m.Practice })));
const PracticeRun = lazy(() => import('./screens/PracticeRun').then((m) => ({ default: m.PracticeRun })));
const LessonScreen = lazy(() => import('./screens/LessonScreen').then((m) => ({ default: m.LessonScreen })));
const TrainingRun = lazy(() => import('./screens/TrainingRun').then((m) => ({ default: m.TrainingRun })));
const BossHall = lazy(() => import('./screens/BossHall').then((m) => ({ default: m.BossHall })));
const BossRun = lazy(() => import('./screens/BossRun').then((m) => ({ default: m.BossRun })));
const Shop = lazy(() => import('./screens/Shop').then((m) => ({ default: m.Shop })));
const Loading = <main class="scene"><div class="scene-card"><p class="muted center">Loading…</p></div></main>;

const areaForLesson = (lessonId: string): string => worldOfTrack(trackOfLessonId(lessonId)).areaId;

/** Screens are plain state, not URL routes: the game is a single-page app with one save. */
type Route = { name: 'map' } | { name: 'area'; id: string } | { name: 'lesson'; id: string } | { name: 'practice' } | { name: 'daily' } | { name: 'daily-run' } | { name: 'practice-run'; challengeId: string } | { name: 'training-run'; planId: string } | { name: 'boss'; id: string };

export function App() {
  const game = useGame();
  const { save } = game;
  const [route, setRoute] = useState<Route>({ name: 'area', id: 'academy' });
  const [panel, setPanel] = useState<PanelTab | null>(null);
  const [lastArea, setLastArea] = useState('academy');
  const [notice, setNotice] = useState(game.loadStatus === 'recovered');

  useDailyClock();
  useEffect(() => { document.title = save.player ? `CodeQuest — ${save.player.name}` : 'CodeQuest'; }, [save.player]);

  const open = (id: string) => { setLastArea(id); setRoute({ name: 'area', id }); };
  const toMap = () => { setPanel(null); setRoute({ name: 'map' }); };

  if (!save.player) {
    return (
      <>
        <Title onStart={() => setRoute({ name: 'area', id: 'academy' })} />
        <Toasts />
      </>
    );
  }

  const trackProps = { onOpenLesson: (id: string) => setRoute({ name: 'lesson', id }), onPractice: (id: string) => setRoute({ name: 'practice-run', challengeId: id }), onPracticeYard: () => setRoute({ name: 'practice' }) };
  const goTraining = () => open('training-yard');
  const required = requiredTraining(save);
  let screen;
  if (route.name === 'map') screen = <WorldMap current={lastArea} onOpen={open} />;
  else if (route.name === 'daily') screen = <DailyScreen onStart={() => setRoute({ name: 'daily-run' })} />;
  else if (route.name === 'daily-run') screen = <DailyRun onBack={() => setRoute({ name: 'daily' })} onGoTraining={goTraining} />;
  else if (required && (route.name === 'practice' || route.name === 'practice-run')) screen = <TrainingYard onOpenPlan={(planId) => setRoute({ name: 'training-run', planId })} onBack={() => open('academy')} />;
  else if (route.name === 'practice') screen = <Practice onPractice={(id) => setRoute({ name: 'practice-run', challengeId: id })} onOpenLesson={(id) => setRoute({ name: 'lesson', id })} onBack={() => open('training-grounds')} />;
  else if (route.name === 'training-run') screen = <TrainingRun planId={route.planId} onLeave={() => open('training-yard')} onReturn={(r) => (r.kind === 'lesson' && r.lessonId ? setRoute({ name: 'lesson', id: r.lessonId }) : r.kind === 'area' && r.areaId ? open(r.areaId) : r.kind === 'boss' && r.bossId ? setRoute({ name: 'boss', id: r.bossId }) : r.kind === 'boss' ? open('summit') : toMap())} />;
  else if (route.name === 'boss') screen = <BossRun bossId={route.id} onBack={() => open('summit')} onGoTraining={goTraining} />;
  else if (route.name === 'practice-run') screen = <PracticeRun challengeId={route.challengeId} onBack={() => setRoute({ name: 'practice' })} onGoAcademy={() => open('academy')} />;
  else if (route.name === 'lesson') screen = <LessonScreen lessonId={route.id} onExit={() => open(areaForLesson(route.id))} onGoAcademy={() => open('academy')} onGoTraining={goTraining} onOpenLesson={(id) => setRoute({ name: 'lesson', id })} />;
  else {
    const area = areas.find((a) => a.id === route.id)!;
    if (!isAreaUnlocked(area, save)) screen = <Locked area={area} onMap={toMap} onOpenLesson={(id) => setRoute({ name: 'lesson', id })} />;
    else if (area.id === 'academy') screen = <Academy onGo={(r) => (r === 'map' ? toMap() : open(r))} onDaily={() => setRoute({ name: 'daily' })} />;
    else if (area.id === 'training-grounds') screen = <TrainingGrounds onOpenLesson={(id) => setRoute({ name: 'lesson', id })} onPractice={(id) => setRoute({ name: 'practice-run', challengeId: id })} onPracticeYard={() => setRoute({ name: 'practice' })} />;
    else if (area.id === 'training-yard') screen = <TrainingYard onOpenPlan={(planId) => setRoute({ name: 'training-run', planId })} onBack={() => open('academy')} />;
    else if (worldOfArea(area.id) && area.id !== 'training-grounds') { const w = worldOfArea(area.id)!; screen = <TrackArea areaId={area.id} title={`${area.icon} ${area.name}`} theme={area.theme} track={w.track} givers={w.givers} blurb={w.blurb} sandbox={w.track === 'sql'} {...trackProps} />; }
    else if (area.id === 'summit') screen = <BossHall onOpenBoss={(id) => setRoute({ name: 'boss', id })} onGoTraining={goTraining} />;
    else if (area.id === 'library') screen = <Library />;
    else if (area.id === 'shop') screen = <Shop />;
    else screen = <Locked area={area} onMap={toMap} onOpenLesson={(id) => setRoute({ name: 'lesson', id })} />;
  }

  return (
    <div class="app">
      <Hud onMap={toMap} onPanel={setPanel} onDaily={() => { setPanel(null); setRoute({ name: 'daily' }); }} />
      {required && route.name !== 'lesson' && route.name !== 'training-run' && route.name !== 'boss' && !(route.name === 'area' && route.id === 'training-yard') && (
        <div class="banner required-banner" role="alert" data-testid="required-banner">
          <span>⏳ Not ready: Focus {save.stats.focus}/100. Train <strong>{weaknessNames(required)}</strong> to regain it before your next attempt.</span>
          <button class="btn small gold" onClick={goTraining} data-testid="banner-go-training">Go to the Training Grounds</button>
        </div>
      )}
      {notice && (
        <div class="banner" role="alert">
          Your previous save could not be read (it may be from a newer version). It was backed up in this browser and a new game was started.
          <button class="btn small" onClick={() => setNotice(false)}>Dismiss</button>
        </div>
      )}
      <div class="screen" key={route.name === 'map' ? 'map' : route.name === 'lesson' ? `l-${route.id}` : route.name === 'area' ? `a-${route.id}` : route.name === 'practice' ? 'practice' : route.name === 'training-run' ? `t-${route.planId}` : route.name === 'boss' ? `b-${route.id}` : route.name === 'daily' || route.name === 'daily-run' ? route.name : `p-${route.challengeId}`}><Suspense fallback={Loading}>{screen}</Suspense></div>
      {panel && <Panel tab={panel} onTab={setPanel} onClose={() => setPanel(null)} onReset={() => { setPanel(null); setRoute({ name: 'area', id: 'academy' }); setLastArea('academy'); }} />}
      <Toasts />
    </div>
  );
}
