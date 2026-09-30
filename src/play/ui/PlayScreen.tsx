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
import { TrainingOverlay } from './TrainingOverlay';
import { MapOverlay } from './MapOverlay';
import { SimOverlay } from './SimOverlay';
import { DriveHud } from './DriveHud';
import { BossOverlay } from './BossOverlay';
import { Finale } from './Finale';
import type { DriveHud as DriveHudState } from '../engine/drive';
import { aiLap, setupFrom, TUNED } from '../logic/vehicle';
import { centreLine, locate, REDLINE } from '../logic/track';
import { hasEffect } from '../logic/conditions';
import { stationOfLesson } from '../../content/play/stations';
import type { ReturnPoint } from '../../core/save';
import { PauseMenu } from './PauseMenu';
import './play.css';

const PrerequisitePanel = lazy(() => import('../../app/components/PrerequisitePanel').then((m) => ({ default: m.PrerequisitePanel })));

/** E2E-only: drives the car round the circuit by holding keys (the same inputs a player uses), so a whole lap can be tested. */
let autoHook: ((dt: number) => void) | null = null;
function autopilot(stage: Stage, on: boolean): void {
  if (autoHook) { stage.hooks = stage.hooks.filter((h) => h !== autoHook); autoHook = null; }
  ['w', 's', 'a', 'd'].forEach((k) => stage.input.hold(k, false));
  if (!on) return;
  const cl = centreLine(REDLINE); const N = cl.pts.length; let hint = 0;
  autoHook = () => {
    const b = stage.body;
    const here = locate(cl, b.x, b.z, hint); hint = here.i;
    const hud = window.__cq3dHud; const speed = (hud?.kmh ?? 0) / 3.6;
    const step = cl.length / N;
    const ahead = cl.pts[(here.i + Math.max(3, Math.round((speed * 0.4) / step))) % N]!;
    const want = Math.atan2(-(ahead.x - b.x), -(ahead.z - b.z));
    let err = want - b.ry; while (err > Math.PI) err -= 2 * Math.PI; while (err < -Math.PI) err += 2 * Math.PI;
    const far = cl.pts[(here.i + Math.round((14 + speed * 1.5) / step)) % N]!;
    let bend = far.heading - cl.pts[here.i]!.heading; while (bend > Math.PI) bend -= 2 * Math.PI; while (bend < -Math.PI) bend += 2 * Math.PI;
    const corner = Math.max(13, 50 * (1 - Math.min(0.78, Math.abs(bend) * 0.95)) * 0.75);
    stage.input.hold('w', speed < corner); stage.input.hold('s', speed > corner + 3);
    stage.input.hold('a', -err * 1.7 < -0.15); stage.input.hold('d', -err * 1.7 > 0.15);
  };
  stage.hooks.push(autoHook);
}

const hex = (css: string): number => parseInt(css.replace('#', ''), 16);
export const DEFAULT_SCENE = 'plaza';

type Talk = { conv: Conversation; lines: string[] } | { inspect: { name: string; lines: string[] } } | null;

declare global { interface Window { __cq3dHud?: DriveHudState | null; __cq3d?: { autopilot?: (on: boolean, scale?: number) => void; stage: Stage; state: () => unknown; drive?: () => Promise<void>; dynStates: (id: string) => string[]; teleport?: (x: number, z: number, ry?: number) => void; travel: (scene: string, spawn?: string) => void; open: (what: string) => void } } }

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
  const [gate, setGate] = useState<{ title: string; reqs: import('../../content/schema').SkillReq[]; text: string } | null>(null);
  const [paused, setPaused] = useState(false);
  const [training, setTraining] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [sim, setSim] = useState(false);
  const [boss, setBoss] = useState<{ start: string | null } | null>(null);
  const [finale, setFinale] = useState(false);
  const finalePending = useRef(false);
  const [hud, setHud] = useState<DriveHudState | null>(null);
  const [driving, setDriving] = useState(false);
  const stopDrive = useRef<(() => void) | null>(null);
  const par = useRef(0);
  const pending = useRef<import('../../game/events').GameEvent[]>([]);
  const overlayOpen = useRef(false);
  const captionTimer = useRef<number>(0);

  overlayOpen.current = !!(talk || terminal || paused || gate || training || mapOpen || sim || boss || finale);

  const say = useCallback((text: string) => {
    setCaption(text);
    clearTimeout(captionTimer.current);
    captionTimer.current = window.setTimeout(() => setCaption(''), 7000);
  }, []);

  const travel = useCallback((to: string, spawn?: string) => {
    const stage = stageRef.current, def = getScene(to);
    if (!stage || !def) return;
    if (stopDrive.current) { stopDrive.current = null; setDriving(false); setHud(null); }
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
          stage, state: () => stage.snapshot(), travel, drive: () => startDriving(), dynStates: (id) => stage.dyn(id)?.states?.() ?? [],
          teleport: localStorage.getItem('codequest.e2e') === '1' ? (x, z, ry) => stage.teleport(x, z, ry) : undefined,
          autopilot: localStorage.getItem('codequest.e2e') === '1' ? (on, scale) => { stage.timeScale = on ? (scale ?? 4) : 1; autopilot(stage, on); } : undefined,
          open: (w) => { if (w === 'pause') setPaused(true); if (w === 'sim') setSim(true); if (w === 'map') setMapOpen(true); },
        };
      } catch (e) { if (!disposed) setFailed(String((e as Error).message ?? e)); }
    })();
    return () => { disposed = true; const st = getStore(), s = stageRef.current; if (s?.def) st.apply(setPosition(st.save, s.def.id, s.body.x, s.body.z, s.body.ry), { silent: true }); s?.dispose(); stageRef.current = null; delete window.__cq3d; clearTimeout(captionTimer.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- the world reacts to what the learning engine says happened
  useEffect(() => {
    const off = getStore().onEvent((e) => { if (e.type === 'campaignComplete') finalePending.current = true; if (overlayOpen.current) pending.current.push(e); else stageRef.current?.react([e]); });
    return off;
  }, []);
  // any save change (a quest accepted, a lesson done) refreshes what the world offers
  useEffect(() => { stageRef.current?.refresh(); }, [save]);

  // overlays take the keyboard: the world stops listening (and stops rendering behind a full-screen terminal)
  useEffect(() => {
    const s = stageRef.current; if (!s) return;
    s.setInputEnabled(!(talk || terminal || paused || gate || training || mapOpen || sim || boss || finale));
    if (terminal || paused || training || mapOpen || boss) s.suspend(); else if (ready) s.start();
    if (!talk && !terminal && !paused && !gate && !training && !mapOpen && !sim && !boss && !finale && pending.current.length) { const evs = pending.current; pending.current = []; s.react(evs); }
    // the ending: once the beacon has had its moment, the campaign-complete card appears
    if (!talk && !terminal && !paused && !gate && !training && !mapOpen && !sim && !boss && !finale && finalePending.current) { finalePending.current = false; window.setTimeout(() => setFinale(true), s.reduced ? 500 : 7000); }
  }, [talk, terminal, paused, gate, training, mapOpen, sim, boss, finale, ready]);

  function interactPanel(panel: string): void { if (panel === 'map') setMapOpen(true); else if (panel === 'training') setTraining(true); }

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
        const exit = stageRef.current?.def?.exits.find((e) => `exit:${e.id}` === it.id);
        const check = exit ? canUseExit(st.save, exit) : { ok: true, reason: '' };
        if (!check.ok) { setGate({ title: check.title ?? it.label, reqs: check.reqs ?? [], text: check.reason }); break; }
        stageRef.current?.audio.sfx('open');
        travel(a.to, a.spawn);
        break;
      }
      case 'panel': interactPanel(a.panel); break;
      case 'sim': setSim(true); break;
      case 'vehicle': void startDriving(); break;
      case 'boss': setBoss({ start: null }); break;
      default: say(`${it.label}: not available yet.`);
    }
  }

  /** Get in the car: to the track, set up as the player's own analysis made it, and drive. */
  async function startDriving(): Promise<void> {
    const stage = stageRef.current; if (!stage) return;
    const st = getStore();
    if (stage.def?.id !== 'track') travel('track', 'paddock');
    const { startDrive } = await import('../engine/drive');
    const done = { tyres: hasEffect(st.save, 'garage.car:tyres'), brakes: hasEffect(st.save, 'garage.car:brakes'), fuel: hasEffect(st.save, 'garage.car:fuel'), aero: hasEffect(st.save, 'garage.car:aero') };
    const setup = setupFrom(done);
    if (!par.current) par.current = aiLap(TUNED, centreLine(REDLINE)).time * 1.15; // the crew chief's par: a tuned car's lap plus 15%, so it is beatable by a careful driver
    stage.dyn('paddock-car')?.object && (stage.dyn('paddock-car')!.object.visible = false);
    const p = stage.def?.spawns.grid;
    stopDrive.current = startDrive(stage, setup, {
      states: Object.entries(done).filter(([, v]) => v).map(([k]) => k),
      onHud: (h) => { window.__cq3dHud = h; setHud(h); },
      onLap: (ms, lap) => {
        const t = getStore();
        t.apply(recordSeen(t.save, 'lap-done'));
        if (ms / 1000 <= par.current) t.apply(recordSeen(t.save, 'lap-par'));
        say(`Lap ${lap}: ${(ms / 1000).toFixed(1)} s${ms / 1000 <= par.current ? ' — under par!' : ` (par ${par.current.toFixed(1)} s)`}`);
      },
      onExit: () => { setDriving(false); setHud(null); stopDrive.current = null; say('You get out of the car. Walk to the garage door to go back inside.'); },
    }, p ? { x: p.x, z: p.z, heading: p.ry } : undefined);
    setDriving(true);
    say('You climb in. W to accelerate, S to brake, A and D to steer. Drive through every gate to complete a lap.');
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

  /** A failure owes training: walk the player to the Simulation Room, and open its console. Nothing is lost by going. */
  const goTraining = () => { setTerminal(null); setPaused(false); setMapOpen(false); setBoss(null); travel('sim-room', 'training'); setTraining(true); };
  /** Training is done: back to the exact place (and lesson) the player left. */
  const returnFromTraining = (r: ReturnPoint) => {
    setTraining(false);
    const station = r.kind === 'lesson' && r.lessonId ? stationOfLesson(r.lessonId) : undefined;
    if (station) { travel(station.scene); setTerminal(station.id); return; }
    if (r.kind === 'boss') { travel('summit'); setBoss({ start: r.bossId ?? null }); return; }
    if (r.kind === 'lesson' && r.lessonId && onLeaveToLesson) { onLeaveToLesson(r.lessonId); return; }
  };
  void cast; void getLesson; void requiredTraining; void setPlaySettings; void game; void onOpenTraining;

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
          {!talk && !terminal && !paused && !gate && !training && !mapOpen && !sim && !driving && !boss && !finale && <Prompt it={prompt} />}
          {driving ? <DriveHud hud={hud} par={par.current} onExit={() => stopDrive.current?.()} /> : <Controls />}
          <div class="play-buttons">
            <button class="btn small" onClick={() => setPaused(true)} data-testid="play-menu" aria-label="Pause menu">☰ Menu</button>
          </div>
          {talk && ('conv' in talk ? <Dialogue conv={talk.conv} lines={talk.lines} onClose={closeTalk} /> : <Dialogue conv={{ npc: { name: talk.inspect.name, role: 'You look closely', icon: '🔍' }, lines: talk.inspect.lines, canOffer: false }} lines={talk.inspect.lines} onClose={closeTalk} />)}
          {gate && (
            <div class="play-terminal" role="dialog" aria-label="Prerequisite required" data-testid="play-gate">
              <div class="term-body"><Suspense fallback={null}><PrerequisitePanel title={gate.title} reqs={gate.reqs} reason={gate.text} onOpenLesson={() => setGate(null)} onBack={() => setGate(null)} backLabel="Back to the world" /></Suspense></div>
            </div>
          )}
          {boss && <BossOverlay start={boss.start} onClose={() => setBoss(null)} onGoTraining={goTraining} />}
          {finale && <Finale onClose={() => setFinale(false)} onClassic={onClassic} />}
          {sim && stageRef.current && <SimOverlay stage={stageRef.current} onClose={() => setSim(false)} />}
          {training && <TrainingOverlay onClose={() => setTraining(false)} onReturn={returnFromTraining} />}
          {mapOpen && <MapOverlay sceneId={sceneId} onClose={() => setMapOpen(false)} onTravel={(to, spawn) => { setMapOpen(false); travel(to, spawn); }} />}
          {terminal && getStation(terminal) && <TerminalOverlay station={getStation(terminal)!} onClose={() => setTerminal(null)} onGoTraining={goTraining} />}
          {paused && <PauseMenu onResume={() => setPaused(false)} onClassic={onClassic} stage={stageRef.current} />}
        </div>
      )}
    </div>
  );
}
