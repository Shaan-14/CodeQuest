import { lazy, Suspense } from 'preact/compat';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { cast, getNpc3D } from '../../content/play/cast';
import { getScene } from '../../content/play/scenes';
import { getStation, stationOfChallenge, stationServes } from '../../content/play/stations';
import { playerLook } from '../../content/play/looks';
import { getLesson } from '../../content';
import { acceptQuest } from '../../game/actions';
import { enterScene, recordSeen, worldReward, recordTalk, setPlaySettings, setPosition } from '../../game/play';
import { getStore, useGame } from '../../game/store';
import { requiredTraining } from '../../game/training';
import { conversationWith, type Conversation } from '../logic/dialogue';
import { holds } from '../logic/conditions';
import type { Interactable } from '../logic/sceneTypes';
import { canUseExit } from '../logic/travel';
import type { Stage } from '../engine/stage';
import { Caption, Controls, Dialogue, Prompt } from './Overlays';
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
import { PauseMenu, guideEnabled } from './PauseMenu';
import { GameHud } from './GameHud';
import { CinematicOverlay } from './CinematicOverlay';
import { LocationCard } from './LocationCard';
import { ObjectiveWidget, type GuideInfo } from './ObjectiveWidget';
import { nextWaypoint, objectiveFor, type Objective } from '../logic/objective';
import { scenes } from '../../content/play/scenes';
import { IDLE_CINE, type CineState } from '../engine/director';
import { cinematicFor } from '../../content/play/cinematics';
import type { PanelTab } from '../../app/components/Hud';
import { DailyOverlay } from './DailyOverlay';
import { ManualOverlay } from './ManualOverlay';
import { Welcome } from './Welcome';
import { TouchControls } from './TouchControls';
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

/** A new game starts in the Robotics Academy atrium: the first world is the guided one. The plaza hub is one door away. */
export const DEFAULT_SCENE = 'robotics-atrium';

type Talk = { conv: Conversation; lines: string[] } | { inspect: { name: string; lines: string[] } } | null;

declare global { interface Window { __cq3dHud?: DriveHudState | null; __cq3d?: { autopilot?: (on: boolean, scale?: number) => void; stage: Stage; state: () => unknown; drive?: () => Promise<void>; dynStates: (id: string) => string[]; teleport?: (x: number, z: number, ry?: number) => void; travel: (scene: string, spawn?: string) => void; open: (what: string) => void } } }

/**
 * The playable world screen: the 3D view plus everything drawn over it. All game rules stay where they were: quests, evidence, Focus and
 * training are the same functions the classic screens call.
 */
export function PlayScreen({ onClassic, onPanel, panelOpen }: { onClassic: () => void; onPanel: (tab: PanelTab) => void; panelOpen: boolean }) {
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
  const [daily, setDaily] = useState(false);
  const [manual, setManual] = useState(false);
  const [locked, setLocked] = useState(false);
  const [cine, setCine] = useState<CineState>(IDLE_CINE);
  const [guide, setGuide] = useState<GuideInfo | null>(null);
  const [objective, setObjective] = useState<Objective | null>(null);
  const [freshObj, setFreshObj] = useState(false);
  const [showControls, setShowControls] = useState(true);
  useEffect(() => { if (!ready) return; const t = window.setTimeout(() => setShowControls(false), 30000); return () => clearTimeout(t); }, [ready]);
  const lastObj = useRef('');
  const [welcome, setWelcome] = useState(() => !getStore().save.play.seen['play-welcome']);
  const touch = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
  const [termNote, setTermNote] = useState('');
  const [termStart, setTermStart] = useState<string | null>(null);
  const terminalRef = useRef<string | null>(null);
  terminalRef.current = terminal;
  const finalePending = useRef(false);
  const [hud, setHud] = useState<DriveHudState | null>(null);
  const [driving, setDriving] = useState(false);
  const stopDrive = useRef<(() => void) | null>(null);
  const par = useRef(0);
  const pending = useRef<import('../../game/events').GameEvent[]>([]);
  const overlayOpen = useRef(false);
  const captionTimer = useRef<number>(0);

  overlayOpen.current = !!(panelOpen || talk || terminal || paused || gate || training || mapOpen || sim || boss || finale || daily || manual || welcome);

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
          onCinematic: setCine,
          onGuide: (g) => setGuide((old) => (g && old && Math.abs(old.dist - g.dist) < 1 && Math.abs(old.bearing - g.bearing) < 0.05 && old.label === g.label ? old : g)),
          cinematic: cinematicFor,
          onAction: (n) => { if (n === 'map') interactPanel('map'); if (n === 'manual') setManual((m) => !m); },
          playerLook: playerLook(s.player?.avatar ?? 'spellwright'),
          quality: s.play.settings.quality,
          reducedMotion: reduced,
        });
        stageRef.current = stage;
        stage.input.onLockLost = () => setPaused(true);
        stage.input.onLockChange = setLocked;
        stage.audio.setMuted(s.play.settings.muted);
        stage.setGuideVisible(guideEnabled());
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
          open: (w) => { if (w === 'pause') setPaused(true); if (w === 'sim') setSim(true); if (w === 'map') setMapOpen(true); if (w === 'daily') setDaily(true); if (w === 'manual') setManual(true); },
        };
      } catch (e) { if (!disposed) setFailed(String((e as Error).message ?? e)); }
    })();
    // leaving the page (reload, close, navigate away) saves where the player stands, like leaving the world does
    const flush = () => { const st = getStore(), s = stageRef.current; if (s?.def) st.apply(setPosition(st.save, s.def.id, s.body.x, s.body.z, s.body.ry), { silent: true }); };
    window.addEventListener('pagehide', flush); window.addEventListener('beforeunload', flush);
    return () => { window.removeEventListener('pagehide', flush); window.removeEventListener('beforeunload', flush); disposed = true; const st = getStore(), s = stageRef.current; if (s?.def) st.apply(setPosition(st.save, s.def.id, s.body.x, s.body.z, s.body.ry), { silent: true }); s?.dispose(); stageRef.current = null; delete window.__cq3d; clearTimeout(captionTimer.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- the world reacts to what the learning engine says happened
  useEffect(() => {
    const off = getStore().onEvent((e) => {
      if (e.type === 'campaignComplete') finalePending.current = true;
      // while a terminal is open the world is hidden behind it: say what the code just did out there
      if (terminalRef.current) {
        const def = stageRef.current?.def;
        if (e.type === 'challengeFailed') { const station = stationOfChallenge(e.challengeId); const c = def?.consequences?.find((x) => x.station === station && x.say); if (c) setTermNote(c.say); }
        if (e.type === 'worldEffect') { const r = def?.reactions?.find((x) => x.effect === `${e.target}:${e.action}` && x.say); if (r?.say) setTermNote(r.say); }
      } if (overlayOpen.current) pending.current.push(e); else stageRef.current?.react([e]); });
    return off;
  }, []);
  // any save change (a quest accepted, a lesson done) refreshes what the world offers
  useEffect(() => { stageRef.current?.refresh(); }, [save]);

  // the objective: what to do and where, from the save and the current place; the stage turns it into a trail and a column of light
  useEffect(() => {
    const st = stageRef.current; if (!st || !sceneId) return;
    const obj = objectiveFor(save, sceneId, { scenes, getNpc: getNpc3D, stationMatches: stationServes, trainingOwed: !!requiredTraining(save) });
    const w = obj ? nextWaypoint(obj, sceneId, scenes) : null;
    st.setWaypoint(w);
    setObjective(obj);
    if (!obj) setGuide(null);
    const key = obj ? `${obj.kind}|${obj.questId ?? ''}|${obj.objectiveId ?? ''}|${obj.label}` : '';
    if (key !== lastObj.current) { const first = lastObj.current === ''; lastObj.current = key; if (obj && !first) { st.audio.sfx('chime'); setFreshObj(true); window.setTimeout(() => setFreshObj(false), 1700); } }
  }, [save, sceneId, ready]);

  // overlays take the keyboard: the world stops listening (and stops rendering behind a full-screen terminal)
  useEffect(() => {
    const s = stageRef.current; if (!s) return;
    s.setInputEnabled(!(panelOpen || talk || terminal || paused || gate || training || mapOpen || sim || boss || finale || daily || manual || welcome));
    if (panelOpen || terminal || paused || training || mapOpen || boss || daily || manual || welcome) s.suspend(); else if (ready) s.start();
    if (!panelOpen && !talk && !terminal && !paused && !gate && !training && !mapOpen && !sim && !boss && !finale && !daily && !manual && !welcome && pending.current.length) { const evs = pending.current; pending.current = []; s.react(evs); }
    // the ending: once the beacon has had its moment, the campaign-complete card appears
    if (!panelOpen && !talk && !terminal && !paused && !gate && !training && !mapOpen && !sim && !boss && !finale && !daily && !manual && !welcome && finalePending.current) { finalePending.current = false; window.setTimeout(() => setFinale(true), s.reduced ? 500 : 7000); }
  }, [panelOpen, talk, terminal, paused, gate, training, mapOpen, sim, boss, finale, daily, manual, welcome, ready]);

  function interactPanel(panel: string): void { if (panel === 'map') setMapOpen(true); else if (panel === 'training') setTraining(true); else if (panel === 'daily') setDaily(true); }

  function interact(it: Interactable): void {
    const st = getStore();
    const a = it.action;
    switch (a.type) {
      case 'talk': {
        const npc = getNpc3D(a.npc); if (!npc) return;
        const conv = conversationWith(st.save, npc);
        const rig = stageRef.current?.npcRig(npc.id);
        rig?.play(conv.entry.mood === 'cheer' ? 'cheer' : conv.entry.mood === 'think' ? 'think' : 'wave');
        rig?.mood(conv.entry.mood === 'cheer' ? 'happy' : conv.entry.mood === 'worry' ? 'worried' : conv.entry.mood === 'think' ? 'focused' : 'neutral');
        stageRef.current?.conversationShot(npc.id);
        setTalk({ conv, lines: conv.entry.lines });
        break;
      }
      case 'inspect': {
        const after = a.after && holds(st.save, { effect: a.after.effect });
        setTalk({ inspect: { name: it.label, lines: [after ? a.after!.text : a.text] } });
        st.apply(recordSeen(st.save, a.id));
        break;
      }
      case 'terminal': setTermNote(''); setTermStart(null); setTerminal(a.station); break;
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
      case 'container': {
        const first = !st.save.play.seen[a.id];
        say(first ? a.text : 'Already searched.');
        if (first) { st.apply(recordSeen(st.save, a.id)); st.apply(worldReward(getStore().save, 0, a.coins, 'Found something')); }
        break;
      }
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
      const stage = stageRef.current, id = t.conv.npc.id;
      st.apply(recordTalk(st.save, id));
      if (t.conv.entry.marks) st.apply(recordSeen(st.save, t.conv.entry.marks));
      if (accepted && t.conv.questId) st.apply(acceptQuest(st.save, t.conv.questId));
      stage?.endConversationShot(id);
      // the speaker points the way to what the player should do next (when it is somewhere else)
      const obj = sceneId ? objectiveFor(getStore().save, sceneId, { scenes, getNpc: getNpc3D, stationMatches: stationServes, trainingOwed: !!requiredTraining(getStore().save) }) : null;
      const w = obj && sceneId ? nextWaypoint(obj, sceneId, scenes) : null;
      const npcPos = stage?.targetPos({ npc: id });
      if (stage && w && npcPos && Math.hypot(w.x - npcPos.x, w.z - npcPos.z) > 3.5 && (accepted || obj?.kind === 'quest')) stage.npcPoint(id, w.x, w.z);
    } else if (stageRef.current) { stageRef.current.endConversationShot(''); }
  }

  /** A failure owes training: walk the player to the Simulation Room, and open its console. Nothing is lost by going. */
  const goTraining = () => { setTerminal(null); setPaused(false); setMapOpen(false); setBoss(null); travel('sim-room', 'training'); setTraining(true); };
  /** Training is done: back to the exact place (and lesson) the player left. */
  const returnFromTraining = (r: ReturnPoint) => {
    setTraining(false);
    const station = r.kind === 'lesson' && r.lessonId ? stationOfLesson(r.lessonId) : undefined;
    if (station) { travel(station.scene); setTermNote(''); setTermStart(r.lessonId ?? null); setTerminal(station.id); return; }
    if (r.kind === 'boss') { travel('summit'); setBoss({ start: r.bossId ?? null }); return; }
  };
  void cast; void getLesson; void requiredTraining; void setPlaySettings; void game;

  const scene = getScene(sceneId);
  if (failed) {
    return (
      <main class="panel play-fail" data-testid="play-unavailable">
        <h2>The 3D world cannot start here</h2>
        <p class="muted">{failed}</p>
        <p>CodeQuest needs WebGL for its world. Enable hardware acceleration (or try another browser). A plain-screens fallback exists with the same save, quests and lessons.</p>
        <button class="btn gold" onClick={onClassic} data-testid="use-classic">Use the plain-screens fallback</button>
      </main>
    );
  }
  return (
    <div class={`play ${cine.active ? 'cine-on' : ''}`} ref={hostRef} data-testid="play" data-scene={sceneId} data-ready={ready ? '1' : '0'}>
      <canvas ref={canvasRef} role="img" aria-label={scene ? `3D view: ${scene.title}. ${scene.blurb} Use the keyboard to move; every event is also described in text.` : '3D view'} tabIndex={0} data-testid="play-canvas" />
      {!ready && <div class="play-loading" role="status">Loading the world…</div>}
      {ready && (
        <div class="play-overlay">
          {scene && <LocationCard title={scene.title} blurb={scene.blurb} sceneKey={scene.id} />}
          <ObjectiveWidget objective={objective} guide={guide} fresh={freshObj} />
          <Caption text={caption} />
          {!talk && !terminal && !paused && !gate && !training && !mapOpen && !sim && !driving && !boss && !finale && !daily && !manual && !welcome && <Prompt it={prompt} />}
          {driving ? <DriveHud hud={hud} par={par.current} onExit={() => stopDrive.current?.()} /> : showControls ? <Controls /> : null}
          <CinematicOverlay cine={cine} />
          <GameHud onPanel={onPanel} onMap={() => setMapOpen(true)} onManual={() => setManual(true)} onMenu={() => setPaused(true)} />
          {!locked && !overlayOpen.current && !touch && <div class="play-lockhint pill" data-testid="play-lockhint">Click or press a key to look around with the mouse · Esc to release it</div>}
          {talk && ('conv' in talk ? <Dialogue conv={talk.conv} lines={talk.lines} onClose={closeTalk} /> : <Dialogue conv={{ npc: { name: talk.inspect.name, role: 'You look closely', icon: '🔍' }, lines: talk.inspect.lines, canOffer: false }} lines={talk.inspect.lines} onClose={closeTalk} />)}
          {gate && (
            <div class="play-terminal" role="dialog" aria-label="Prerequisite required" data-testid="play-gate">
              <div class="term-body"><Suspense fallback={null}><PrerequisitePanel title={gate.title} reqs={gate.reqs} reason={gate.text} onOpenLesson={() => setGate(null)} onBack={() => setGate(null)} backLabel="Back to the world" /></Suspense></div>
            </div>
          )}
          {touch && !driving && stageRef.current && <TouchControls input={stageRef.current.input} />}
          {daily && <DailyOverlay onClose={() => setDaily(false)} onGoTraining={() => { setDaily(false); goTraining(); }} />}
          {manual && <ManualOverlay onClose={() => setManual(false)} />}
          {welcome && <Welcome onStart={() => { const t = getStore(); t.apply(recordSeen(t.save, 'play-welcome'), { silent: true }); setWelcome(false); }} />}
          {boss && <BossOverlay start={boss.start} onClose={() => setBoss(null)} onGoTraining={goTraining} />}
          {finale && <Finale onClose={() => setFinale(false)} />}
          {sim && stageRef.current && <SimOverlay stage={stageRef.current} onClose={() => setSim(false)} />}
          {training && <TrainingOverlay onClose={() => setTraining(false)} onReturn={returnFromTraining} />}
          {mapOpen && <MapOverlay sceneId={sceneId} onClose={() => setMapOpen(false)} onTravel={(to, spawn) => { setMapOpen(false); travel(to, spawn); }} />}
          {terminal && getStation(terminal) && <TerminalOverlay station={getStation(terminal)!} note={termNote} start={termStart} onClose={() => setTerminal(null)} onGoTraining={goTraining} />}
          {paused && <PauseMenu onResume={() => setPaused(false)} stage={stageRef.current} />}
        </div>
      )}
    </div>
  );
}
