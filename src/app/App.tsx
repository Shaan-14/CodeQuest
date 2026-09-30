import { useEffect, useState } from 'preact/hooks';
import { areas } from '../content/world';
import { useGame } from '../game/store';
import { isAreaUnlocked } from '../game/world';
import { Hud, type PanelTab } from './components/Hud';
import { Panel } from './components/Panel';
import { Toasts } from './components/Toasts';
import { Academy } from './screens/Academy';
import { DailyRun } from './screens/DailyRun';
import { DailyScreen } from './screens/DailyScreen';
import { useDailyClock } from './components/useDailyClock';
import { LessonScreen } from './screens/LessonScreen';
import { Library } from './screens/Library';
import { Practice } from './screens/Practice';
import { PracticeRun } from './screens/PracticeRun';
import { Locked } from './screens/Locked';
import { Shop } from './screens/Shop';
import { Title } from './screens/Title';
import { TrackArea } from './screens/TrackArea';
import { TrainingGrounds } from './screens/TrainingGrounds';
import { WorldMap } from './screens/WorldMap';

const areaForLesson = (lessonId: string): string => (lessonId.startsWith('sql-') ? 'data-center' : lessonId.startsWith('de-') ? 'pipeline-works' : lessonId.startsWith('web-') ? 'web-district' : 'training-grounds');

/** Screens are plain state, not URL routes: the game is a single-page app with one save. */
type Route = { name: 'map' } | { name: 'area'; id: string } | { name: 'lesson'; id: string } | { name: 'practice' } | { name: 'daily' } | { name: 'daily-run' } | { name: 'practice-run'; challengeId: string };

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
  let screen;
  if (route.name === 'map') screen = <WorldMap current={lastArea} onOpen={open} />;
  else if (route.name === 'daily') screen = <DailyScreen onStart={() => setRoute({ name: 'daily-run' })} />;
  else if (route.name === 'daily-run') screen = <DailyRun onBack={() => setRoute({ name: 'daily' })} />;
  else if (route.name === 'practice') screen = <Practice onPractice={(id) => setRoute({ name: 'practice-run', challengeId: id })} onOpenLesson={(id) => setRoute({ name: 'lesson', id })} onBack={() => open('training-grounds')} />;
  else if (route.name === 'practice-run') screen = <PracticeRun challengeId={route.challengeId} onBack={() => setRoute({ name: 'practice' })} onGoAcademy={() => open('academy')} />;
  else if (route.name === 'lesson') screen = <LessonScreen lessonId={route.id} onExit={() => open(areaForLesson(route.id))} onGoAcademy={() => open('academy')} />;
  else {
    const area = areas.find((a) => a.id === route.id)!;
    if (!isAreaUnlocked(area, save)) screen = <Locked area={area} onMap={toMap} />;
    else if (area.id === 'academy') screen = <Academy onGo={(r) => (r === 'map' ? toMap() : open('training-grounds'))} onDaily={() => setRoute({ name: 'daily' })} />;
    else if (area.id === 'training-grounds') screen = <TrainingGrounds onOpenLesson={(id) => setRoute({ name: 'lesson', id })} onPractice={(id) => setRoute({ name: 'practice-run', challengeId: id })} onPracticeYard={() => setRoute({ name: 'practice' })} />;
    else if (area.id === 'data-center') screen = <TrackArea areaId="data-center" title="🗄️ Database District" theme="data" track="sql" giver="Architect Vex" blurb="Real SQL on real databases: ask questions, change data safely, and design tables that protect themselves." sandbox {...trackProps} />;
    else if (area.id === 'pipeline-works') screen = <TrackArea areaId="pipeline-works" title="🏭 Data Pipeline Works" theme="pipeline" track="data-eng" giver="Engineer Ori" blurb="Move data from raw files into databases without breaking anything, then combine Python and SQL." {...trackProps} />;
    else if (area.id === 'web-district') screen = <TrackArea areaId="web-district" title="🌐 Web District" theme="web" track="web" giver="Builder Nia" givers={['Builder Nia', 'Coder Kiran', 'Gatekeeper Marlo']} blurb="HTML, CSS, JavaScript and APIs in a real browser sandbox: build pages, make them respond, and connect them to data." {...trackProps} />;
    else if (area.id === 'library') screen = <Library />;
    else if (area.id === 'shop') screen = <Shop />;
    else screen = <Locked area={area} onMap={toMap} />;
  }

  return (
    <div class="app">
      <Hud onMap={toMap} onPanel={setPanel} onDaily={() => { setPanel(null); setRoute({ name: 'daily' }); }} />
      {notice && (
        <div class="banner" role="alert">
          Your previous save could not be read (it may be from a newer version). It was backed up in this browser and a new game was started.
          <button class="btn small" onClick={() => setNotice(false)}>Dismiss</button>
        </div>
      )}
      <div class="screen" key={route.name === 'map' ? 'map' : route.name === 'lesson' ? `l-${route.id}` : route.name === 'area' ? `a-${route.id}` : route.name === 'practice' ? 'practice' : route.name === 'daily' || route.name === 'daily-run' ? route.name : `p-${route.challengeId}`}>{screen}</div>
      {panel && <Panel tab={panel} onTab={setPanel} onClose={() => setPanel(null)} onReset={() => { setPanel(null); setRoute({ name: 'area', id: 'academy' }); setLastArea('academy'); }} />}
      <Toasts />
    </div>
  );
}
