import { useEffect, useState } from 'preact/hooks';
import { areas } from '../content/world';
import { useGame } from '../game/store';
import { isAreaUnlocked } from '../game/world';
import { Hud, type PanelTab } from './components/Hud';
import { Panel } from './components/Panel';
import { Toasts } from './components/Toasts';
import { Academy } from './screens/Academy';
import { LessonScreen } from './screens/LessonScreen';
import { Library } from './screens/Library';
import { Locked } from './screens/Locked';
import { Shop } from './screens/Shop';
import { Title } from './screens/Title';
import { TrainingGrounds } from './screens/TrainingGrounds';
import { WorldMap } from './screens/WorldMap';

/** Screens are plain state, not URL routes: the game is a single-page app with one save. */
type Route = { name: 'map' } | { name: 'area'; id: string } | { name: 'lesson'; id: string };

export function App() {
  const game = useGame();
  const { save } = game;
  const [route, setRoute] = useState<Route>({ name: 'area', id: 'academy' });
  const [panel, setPanel] = useState<PanelTab | null>(null);
  const [lastArea, setLastArea] = useState('academy');
  const [notice, setNotice] = useState(game.loadStatus === 'recovered');

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

  let screen;
  if (route.name === 'map') screen = <WorldMap current={lastArea} onOpen={open} />;
  else if (route.name === 'lesson') screen = <LessonScreen lessonId={route.id} onExit={() => open('training-grounds')} onGoAcademy={() => open('academy')} />;
  else {
    const area = areas.find((a) => a.id === route.id)!;
    if (!isAreaUnlocked(area, save)) screen = <Locked area={area} onMap={toMap} />;
    else if (area.id === 'academy') screen = <Academy onGo={(r) => (r === 'map' ? toMap() : open('training-grounds'))} />;
    else if (area.id === 'training-grounds') screen = <TrainingGrounds onOpenLesson={(id) => setRoute({ name: 'lesson', id })} />;
    else if (area.id === 'library') screen = <Library />;
    else if (area.id === 'shop') screen = <Shop />;
    else screen = <Locked area={area} onMap={toMap} />;
  }

  return (
    <div class="app">
      <Hud onMap={toMap} onPanel={setPanel} />
      {notice && (
        <div class="banner" role="alert">
          Your previous save could not be read (it may be from a newer version). It was backed up in this browser and a new game was started.
          <button class="btn small" onClick={() => setNotice(false)}>Dismiss</button>
        </div>
      )}
      <div class="screen" key={route.name === 'map' ? 'map' : route.name === 'lesson' ? `l-${route.id}` : `a-${route.id}`}>{screen}</div>
      {panel && <Panel tab={panel} onTab={setPanel} onClose={() => setPanel(null)} onReset={() => { setPanel(null); setRoute({ name: 'area', id: 'academy' }); setLastArea('academy'); }} />}
      <Toasts />
    </div>
  );
}
