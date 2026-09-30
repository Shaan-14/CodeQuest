import { lazy, Suspense } from 'preact/compat';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { cast, getNpc3D } from '../../content/play/cast';
import { getScene } from '../../content/play/scenes';
import { getStation, stationOfChallenge, stationServes } from '../../content/play/stations';
import { getAvatar } from '../../content/avatars';
import { getLesson } from '../../content';
import { acceptQuest } from '../../game/actions';
import { enterScene, recordSeen, recordTalk, setPlaySettings, setPosition } from '../../game/play';
import { getStore, useGame } from '../../game/store';
import { requiredTraining } from '../../game/training';
import { conversationWith, type Conversation } from '../logic/dialogue';
import { holds } from '../logic/conditions';
import type { Interactable } from '../logic/sceneTypes';
import { canUseExit } from '../logic/travel';
import type { Stage } from '../engine/stage';
import { Caption, Controls, Dialogue, Prompt, QuestTracker, Where } from './Overlays';
import { TerminalOverlay } from './TerminalOverlay';
import { PauseMenu } from './PauseMenu';
import './play.css';

const PrerequisitePanel = lazy(() => import('../../app/components/PrerequisitePanel').then((m) => ({ default: m.PrerequisitePanel })));

const hex = (css: string): number => parseInt(css.replace('#', ''), 16);
export const DEFAULT_SCENE = 'maintenance-bay';

type Talk = { conv: Conversation; lines: string[] } | { inspect: { name: string; lines: string[] } } | null;

declare global { interface Window { __cq3d?: { stage: Stage; state: () => unknown; dynStates: (id: string) => string[]; teleport?: (x: number, z: number, ry?: number) => void; travel: (scene: string, spawn?: string) => void; open: (what: string) => void } } }

/**
 * The playable world screen: the 3D view plus everything drawn over it. All game rules stay where they were: quests, evidence, Focus and
 * training are the same functions the classic screens call.
 */
export function PlayScreen({ onClassic, onOpenTraining, onLeaveToLesson }: { onClassic: () => void; onOpenTraining: () => void; onLeaveToLesson?: (lessonId: string) => void }) {
  const game = useGame();
  const { save } = game;
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<Stage | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [prompt, setPrompt] = useState<Interactable | null>(null);
  const [caption, setCaption] = useState('');
  const [sceneId, setSceneId] = useState<string>('');
  const [talk, setTalk] = useState<Talk>(null);
  const [terminal, setTerminal] = useState<string | null>(null);
  const [gate, setGate] = useState<{ area: string; text: string } | null>(null);
  const [paused, setPaused] = useState(false);
  const pending = useRef<import('../../game/events').GameEvent[]>([]);
  const overlayOpen = useRef(false);
  const captionTimer = useRef<number>(0);

  overlayOpen.current = !!(talk || terminal || paused || gate);

  const say = useCallback((text: string) => {
    setCaption(text);
    clearTimeout(captionTimer.current);
    captionTimer.current = window.setTimeout(() => setCaption(''), 7000);
  }, []);

  const travel = useCallback((to: string, spawn?: string) => {
    const stage = stageRef.current, def = getScene(to);
    if (!stage || !def) return;
    stage.load(def, spawn ?? 'default');
    const st = getStore();
    const sp = def.spawns[spawn ?? 'default'] ?? def.spawns.default ?? Object.values(def.spawns)[0]!;
    st.apply(enterScene(st.save, def.id, sp), { silent: true });
    setSceneId(def.id); setPrompt(null);
  }, []);

  // ---- create the stage once
  useEffect(() => {
    let disposed = false;
    const host = hostRef.current!, canvas = canvasRef.current!;
    (async () => {
      try {
        const probe = document.createElement('canvas');
        if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) throw new Error('WebGL is not available in this browser.');
        const { Stage } = await import('../engine/stage');
        if (disposed) return;
        const s = getStore().save;
        const a = getAvatar(s.player?.avatar ?? 'spellwright');
        const reduced = s.play.settings.reducedMotion ?? window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const stage = new Stage(canvas, host, {
          getSave: () => getStore().save,
          getNpc: getNpc3D,
          stationMatches: stationServes,
          stationOfChallenge,
          onPrompt: setPrompt,
          onInteract: (it) => interact(it),
          onCaption: say,
          onPause: () => setPaused(true),
          onPosition: (scene, x, z, ry) => { const st = getStore(); st.apply(setPosition(st.save, scene, x, z, ry), { silent: true }); },
          onAction: (n) => { if (n === 'map') interactPanel('map'); },
          playerLook: { body: hex(a.robe), head: hex(a.skin), accent: hex(a.trim), hair: hex(a.hair) },
          quality: s.play.settings.quality,
          reducedMotion: reduced,
        });
        stageRef.current = stage;
        stage.audio.setMuted(s.play.settings.muted);
        // resume where the player was (same scene, same spot), else the first place of the story
        const scene = getScene(s.play.scene ?? '') ?? getScene(DEFAULT_SCENE)!;
        stage.load(scene, s.play.scene === scene.id && s.play.pos ? s.play.pos : 'default');
        setSceneId(scene.id);
        stage.start();
        setReady(true);
        window.__cq3d = {
          stage, state: () => stage.snapshot(), travel, dynStates: (id) => stage.dyn(id)?.states?.() ?? [],
          teleport: localStorage.getItem('codequest.e2e') === '1' ? (x, z, ry) => stage.teleport(x, z, ry) : undefined,
          open: (w) => { if (w === 'pause') setPaused(true); },
        };
      } catch (e) { if (!disposed) setFailed(String((e as Error).message ?? e)); }
    })();
    return () => { disposed = true; const st = getStore(), s = stageRef.current; if (s?.def) st.apply(setPosition(st.save, s.def.id, s.body.x, s.body.z, s.body.ry), { silent: true }); s?.dispose(); stageRef.current = null; delete window.__cq3d; clearTimeout(captionTimer.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- the world reacts to what the learning engine says happened
  useEffect(() => {
    const off = getStore().onEvent((e) => { if (overlayOpen.current) pending.current.push(e); else stageRef.current?.react([e]); });
    return off;
  }, []);
  // any save change (a quest accepted, a lesson done) refreshes what the world offers
  useEffect(() => { stageRef.current?.refresh(); }, [save]);

  // overlays take the keyboard: the world stops listening (and stops rendering behind a full-screen terminal)
  useEffect(() => {
    const s = stageRef.current; if (!s) return;
    s.setInputEnabled(!(talk || terminal || paused || gate));
    if (terminal || paused) s.suspend(); else if (ready) s.start();
    if (!talk && !terminal && !paused && !gate && pending.current.length) { const evs = pending.current; pending.current = []; s.react(evs); }
  }, [talk, terminal, paused, gate, ready]);

  function interactPanel(panel: string): void { if (panel === 'map') setPaused(false), onOpenMap(); }
  const [mapOpen, setMapOpen] = useState(false);
  function onOpenMap(): void { setMapOpen(true); }
  void mapOpen;

  function interact(it: Interactable): void {
    const st = getStore();
    const a = it.action;
    switch (a.type) {
      case 'talk': {
        const npc = getNpc3D(a.npc); if (!npc) return;
        const conv = conversationWith(st.save, npc);
        stageRef.current?.npcRig(npc.id)?.play(conv.entry.mood === 'cheer' ? 'cheer' : conv.entry.mood === 'think' ? 'think' : 'wave');
        setTalk({ conv, lines: conv.entry.lines });
        break;
      }
      case 'inspect': {
        const after = a.after && holds(st.save, { effect: a.after.effect });
        setTalk({ inspect: { name: it.label, lines: [after ? a.after!.text : a.text] } });
        st.apply(recordSeen(st.save, a.id));
        break;
      }
      case 'terminal': setTerminal(a.station); break;
      case 'exit': {
        const exit = getScene(sceneId)?.exits.find((e) => `exit:${e.id}` === it.id);
        const check = exit ? canUseExit(st.save, exit) : { ok: true, reason: '' };
        if (!check.ok && check.areaId) { setGate({ area: check.areaId, text: check.reason }); break; }
        stageRef.current?.audio.sfx('open');
        travel(a.to, a.spawn);
        break;
      }
      default: say(`${it.label}: not available yet.`);
    }
  }

  function closeTalk(accepted: boolean): void {
    const st = getStore();
    const t = talk;
    setTalk(null);
    if (!t) return;
    if ('conv' in t) {
      st.apply(recordTalk(st.save, t.conv.npc.id));
      if (t.conv.entry.marks) st.apply(recordSeen(st.save, t.conv.entry.marks));
      if (accepted && t.conv.questId) st.apply(acceptQuest(st.save, t.conv.questId));
    }
  }

  const goTraining = () => { setTerminal(null); onOpenTraining(); };
  void cast; void getLesson; void getStation; void requiredTraining; void onLeaveToLesson; void setPlaySettings; void game;

  const scene = getScene(sceneId);
  if (failed) {
    return (
      <main class="panel play-fail" data-testid="play-unavailable">
        <h2>The 3D world cannot start here</h2>
        <p class="muted">{failed}</p>
        <p>Everything in CodeQuest is also available in the classic view, with the same quests, lessons and progress.</p>
        <button class="btn gold" onClick={onClassic} data-testid="use-classic">Use the classic view</button>
      </main>
    );
  }
  return (
    <div class="play" ref={hostRef} data-testid="play" data-scene={sceneId} data-ready={ready ? '1' : '0'}>
      <canvas ref={canvasRef} role="img" aria-label={scene ? `3D view: ${scene.title}. ${scene.blurb} Use the keyboard to move; every event is also described in text.` : '3D view'} tabIndex={0} data-testid="play-canvas" />
      {!ready && <div class="play-loading" role="status">Loading the world…</div>}
      {ready && (
        <div class="play-overlay">
          {scene && <Where title={scene.title} blurb={scene.blurb} />}
          <QuestTracker />
          <Caption text={caption} />
          {!talk && !terminal && !paused && !gate && <Prompt it={prompt} />}
          <Controls />
          <div class="play-buttons">
            <button class="btn small" onClick={() => setPaused(true)} data-testid="play-menu" aria-label="Pause menu">☰ Menu</button>
          </div>
          {talk && ('conv' in talk ? <Dialogue conv={talk.conv} lines={talk.lines} onClose={closeTalk} /> : <Dialogue conv={{ npc: { name: talk.inspect.name, role: 'You look closely', icon: '🔍' }, lines: talk.inspect.lines, canOffer: false }} lines={talk.inspect.lines} onClose={closeTalk} />)}
          {gate && (
            <div class="play-terminal" role="dialog" aria-label="Prerequisite required" data-testid="play-gate">
              <div class="term-body"><Suspense fallback={null}><PrerequisitePanelForArea areaId={gate.area} onClose={() => setGate(null)} /></Suspense></div>
            </div>
          )}
          {terminal && getStation(terminal) && <TerminalOverlay station={getStation(terminal)!} onClose={() => setTerminal(null)} onGoTraining={goTraining} />}
          {paused && <PauseMenu onResume={() => setPaused(false)} onClassic={onClassic} stage={stageRef.current} />}
        </div>
      )}
    </div>
  );
}

import { areas } from '../../content/world';
function PrerequisitePanelForArea({ areaId, onClose }: { areaId: string; onClose: () => void }) {
  const area = areas.find((a) => a.id === areaId);
  if (!area || area.lock.type !== 'skills') return <p>Not open yet. <button class="btn" onClick={onClose}>Back</button></p>;
  return <PrerequisitePanel title={area.name} reqs={area.lock.requires} reason={area.lock.reason} onOpenLesson={() => onClose()} onBack={onClose} backLabel="Back to the world" />;
}
