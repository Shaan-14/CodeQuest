/**
 * AUDIO: a tiny synthesiser (no audio files to download). Sound effects, a quiet ambience per place and an engine tone. Everything is optional:
 * nothing in the game is understood only by sound (every event also has a caption), it starts only after the player's first key or click
 * (browsers require that), and the mute switch is saved. Volume is deliberately low.
 */
export type Sfx = 'step' | 'interact' | 'open' | 'success' | 'fail' | 'spark' | 'spell' | 'hit' | 'click' | 'quest' | 'jump' | 'whoosh' | 'crack' | 'cheer' | 'error' | 'servo' | 'weld' | 'power' | 'chime' | 'door';
export type Ambience = 'workshop' | 'wind' | 'crowd' | 'engine' | 'magic' | 'summit' | 'none';

export class Audio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private ambGain: GainNode | null = null;
  private ambNodes: AudioNode[] = [];
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  muted = false;
  private noiseBuf: AudioBuffer | null = null;

  /** Must be called from a user gesture (key press/click). Safe to call repeatedly. */
  resume(): void {
    if (this.ctx) { void this.ctx.resume(); return; }
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    try {
      this.ctx = new AC();
      this.master = this.ctx.createGain(); this.master.gain.value = this.muted ? 0 : 0.5; this.master.connect(this.ctx.destination);
      this.ambGain = this.ctx.createGain(); this.ambGain.gain.value = 0.0; this.ambGain.connect(this.master);
      const len = this.ctx.sampleRate; this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noiseBuf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      if (this.pendingAmb) this.setAmbience(this.pendingAmb);
    } catch { this.ctx = null; }
  }
  private pendingAmb: Ambience | null = null;

  setMuted(m: boolean): void { this.muted = m; if (this.master && this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 0.5, this.ctx.currentTime, 0.05); }

  private tone(freq: number, dur: number, type: OscillatorType, vol: number, slideTo?: number, delay = 0): void {
    if (!this.ctx || !this.master || this.muted) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.02);
  }
  private noise(dur: number, vol: number, freq: number, q = 1, delay = 0): void {
    if (!this.ctx || !this.master || !this.noiseBuf || this.muted) return;
    const t = this.ctx.currentTime + delay;
    const s = this.ctx.createBufferSource(), f = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
    s.buffer = this.noiseBuf; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(this.master); s.start(t); s.stop(t + dur + 0.02);
  }

  sfx(name: Sfx): void {
    switch (name) {
      case 'step': this.noise(0.06, 0.05, 240 + Math.random() * 120, 0.8); break;
      case 'jump': this.tone(260, 0.14, 'sine', 0.06, 520); break;
      case 'click': this.tone(880, 0.05, 'square', 0.03); break;
      case 'interact': this.tone(520, 0.08, 'triangle', 0.08); this.tone(780, 0.1, 'triangle', 0.07, undefined, 0.07); break;
      case 'open': this.tone(180, 0.35, 'sawtooth', 0.05, 420); this.noise(0.3, 0.04, 600); break;
      case 'quest': [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.16, 'triangle', 0.08, undefined, i * 0.09)); break;
      case 'success': [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.22, 'triangle', 0.09, undefined, i * 0.08)); break;
      case 'fail': this.tone(220, 0.35, 'sawtooth', 0.08, 90); this.noise(0.25, 0.06, 900); break;
      case 'error': this.tone(160, 0.25, 'square', 0.05, 110); break;
      case 'spark': this.noise(0.18, 0.08, 3200, 2); this.tone(1800, 0.08, 'square', 0.03, 600); break;
      case 'spell': this.tone(400, 0.5, 'sine', 0.07, 1200); this.tone(600, 0.5, 'triangle', 0.05, 1800, 0.05); break;
      case 'hit': this.noise(0.15, 0.1, 160, 0.7); this.tone(120, 0.15, 'sine', 0.1, 60); break;
      case 'whoosh': this.noise(0.3, 0.06, 500, 0.5); break;
      case 'crack': this.noise(0.08, 0.14, 1500, 3); break;
      case 'servo': this.tone(140, 0.28, 'sawtooth', 0.035, 260); this.tone(260, 0.2, 'square', 0.02, 180, 0.12); break;
      case 'weld': this.noise(0.5, 0.07, 4200, 3); this.tone(2200, 0.4, 'square', 0.012, 900); break;
      case 'power': this.tone(90, 0.7, 'sawtooth', 0.05, 520); this.tone(180, 0.7, 'triangle', 0.04, 1040, 0.05); this.noise(0.4, 0.03, 700, 1, 0.3); break;
      case 'chime': [880, 1319].forEach((f, i) => this.tone(f, 0.5, 'sine', 0.06, undefined, i * 0.12)); break;
      case 'door': this.tone(120, 0.5, 'triangle', 0.05, 80); this.noise(0.4, 0.04, 350, 0.6); break;
      case 'cheer': this.noise(0.9, 0.05, 1200, 0.4); [392, 523, 659].forEach((f, i) => this.tone(f, 0.25, 'triangle', 0.06, undefined, i * 0.1)); break;
    }
  }

  setAmbience(a: Ambience): void {
    if (!this.ctx || !this.ambGain || !this.noiseBuf) { this.pendingAmb = a; return; }
    this.pendingAmb = null;
    for (const n of this.ambNodes) { try { (n as AudioScheduledSourceNode).stop?.(); n.disconnect(); } catch { /* already stopped */ } }
    this.ambNodes = [];
    if (a === 'none') { this.ambGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2); return; }
    const cfg: Record<Exclude<Ambience, 'none'>, { f: number; q: number; v: number; hum?: number }> = {
      workshop: { f: 220, q: 0.6, v: 0.05, hum: 55 }, wind: { f: 600, q: 0.4, v: 0.045 }, crowd: { f: 900, q: 0.3, v: 0.05 },
      engine: { f: 160, q: 0.7, v: 0.03, hum: 70 }, magic: { f: 1200, q: 2, v: 0.025, hum: 196 }, summit: { f: 420, q: 0.3, v: 0.05, hum: 110 },
    };
    const c = cfg[a];
    const s = this.ctx.createBufferSource(); s.buffer = this.noiseBuf; s.loop = true;
    const f = this.ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = c.f; f.Q.value = c.q;
    s.connect(f); f.connect(this.ambGain); s.start(); this.ambNodes.push(s, f);
    if (c.hum) { const o = this.ctx.createOscillator(); o.type = 'sine'; o.frequency.value = c.hum; const g = this.ctx.createGain(); g.gain.value = 0.35; o.connect(g); g.connect(this.ambGain); o.start(); this.ambNodes.push(o, g); }
    this.ambGain.gain.setTargetAtTime(c.v, this.ctx.currentTime, 0.4);
  }

  /** The car's engine: pitch follows speed. Pass null to stop it. */
  engine(speed01: number | null): void {
    if (!this.ctx || !this.master) return;
    if (speed01 === null) { this.engineGain?.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1); return; }
    if (!this.engineOsc) {
      this.engineOsc = this.ctx.createOscillator(); this.engineOsc.type = 'sawtooth';
      this.engineGain = this.ctx.createGain(); this.engineGain.gain.value = 0;
      const lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420;
      this.engineOsc.connect(lp); lp.connect(this.engineGain); this.engineGain.connect(this.master); this.engineOsc.start();
    }
    this.engineOsc.frequency.setTargetAtTime(55 + speed01 * 150, this.ctx.currentTime, 0.05);
    this.engineGain!.gain.setTargetAtTime(this.muted ? 0 : 0.035 + speed01 * 0.03, this.ctx.currentTime, 0.08);
  }

  dispose(): void {
    try { this.engineOsc?.stop(); } catch { /* not started */ }
    void this.ctx?.close();
    this.ctx = null; this.master = null;
  }
}
