import type { StageId } from '../engine/types';

const hz = (m: number): number => 440 * Math.pow(2, (m - 69) / 12);

export type SceneAudio = StageId | 'title' | 'city' | 'transit';

type Chords = ReadonlyArray<readonly number[]>;

interface Mode {
  chords: Chords;
  pad: number;
  pluck: number;
  bar: number;
  lowpass: number;
}

const MODES: Record<'warm' | 'bright' | 'tense' | 'night' | 'hush' | 'none', Mode> = {
  warm: {
    chords: [[57, 60, 64, 67], [53, 57, 60, 64], [48, 55, 60, 64], [55, 59, 62, 65]],
    pad: 0.12, pluck: 0.1, bar: 7000, lowpass: 900,
  },
  bright: {
    chords: [[60, 64, 67, 71], [65, 69, 72, 76], [67, 71, 74, 79], [57, 60, 64, 67]],
    pad: 0.1, pluck: 0.12, bar: 5600, lowpass: 1500,
  },
  tense: {
    chords: [[45, 52, 57, 60], [41, 48, 53, 57], [43, 50, 55, 59], [40, 47, 52, 55]],
    pad: 0.11, pluck: 0, bar: 8200, lowpass: 600,
  },
  night: {
    chords: [[52, 59, 64], [48, 55, 60], [50, 57, 62], [47, 54, 59]],
    pad: 0.08, pluck: 0.06, bar: 8000, lowpass: 700,
  },
  hush: {
    chords: [[57, 60, 64], [53, 57, 60], [55, 59, 62], [48, 55, 60]],
    pad: 0.035, pluck: 0, bar: 9000, lowpass: 500,
  },
  none: { chords: [[57, 60, 64]], pad: 0, pluck: 0, bar: 9000, lowpass: 500 },
};

/**
 * The music itself: several pieces per mood, each with its own key, tempo, instruments and pattern. Every
 * scene change moves on to the next piece (and a new key), so two scenes in a row never sound the same.
 */
interface Piece {
  chords: Chords;
  /** Bar length in ms. */
  bar: number;
  pad: number;
  padWave: OscillatorType;
  lowpass: number;
  /** Broken-chord pattern: chord tone indexes, played evenly across the bar. */
  arp?: { notes: number[]; vol: number; wave: OscillatorType; up: number };
  bass?: number;
  bell?: number;
  hat?: number;
}
type Mood = Exclude<keyof typeof MODES, 'none'>;
const PIECES: Record<Mood, Piece[]> = {
  warm: [
    { chords: MODES.warm.chords, bar: 7000, pad: 0.12, padWave: 'sawtooth', lowpass: 900, arp: { notes: [0, 2, 1, 3], vol: 0.1, wave: 'triangle', up: 24 } },
    { chords: [[50, 57, 62, 66], [57, 61, 64, 69], [59, 62, 66, 71], [55, 59, 62, 67]], bar: 6000, pad: 0.09, padWave: 'triangle', lowpass: 1100, arp: { notes: [0, 1, 2, 3, 2, 1], vol: 0.09, wave: 'triangle', up: 12 }, bass: 0.09 },
    { chords: [[46, 53, 58, 62], [51, 55, 58, 63], [53, 57, 60, 65], [48, 55, 58, 63]], bar: 7600, pad: 0.1, padWave: 'sine', lowpass: 800, arp: { notes: [0, 2, 1, 3, 2, 3, 1, 2], vol: 0.06, wave: 'sine', up: 24 }, bell: 0.05 },
  ],
  bright: [
    { chords: MODES.bright.chords, bar: 5600, pad: 0.1, padWave: 'sawtooth', lowpass: 1500, arp: { notes: [0, 2, 1, 3], vol: 0.12, wave: 'triangle', up: 24 } },
    { chords: [[62, 66, 69, 74], [59, 62, 66, 71], [55, 59, 62, 67], [57, 61, 64, 69]], bar: 4400, pad: 0.07, padWave: 'triangle', lowpass: 1600, arp: { notes: [0, 1, 2, 3, 0, 1, 2, 3], vol: 0.07, wave: 'square', up: 12 }, bass: 0.1, hat: 0.025 },
    { chords: [[64, 68, 71, 76], [61, 64, 68, 73], [57, 61, 64, 69], [59, 63, 66, 71]], bar: 5000, pad: 0.08, padWave: 'triangle', lowpass: 1300, arp: { notes: [0, 1, 2, 1], vol: 0.09, wave: 'sine', up: 12 }, bell: 0.05 },
  ],
  tense: [
    { chords: MODES.tense.chords, bar: 8200, pad: 0.11, padWave: 'sawtooth', lowpass: 600 },
    { chords: [[50, 53, 57, 62], [49, 53, 56, 61], [46, 50, 53, 58], [45, 49, 52, 57]], bar: 9000, pad: 0.1, padWave: 'sine', lowpass: 700, bass: 0.12 },
    { chords: [[47, 50, 54, 59], [43, 47, 50, 55], [45, 48, 52, 57], [42, 45, 49, 54]], bar: 7600, pad: 0.09, padWave: 'triangle', lowpass: 550, bell: 0.04 },
  ],
  night: [
    { chords: MODES.night.chords, bar: 8000, pad: 0.08, padWave: 'sawtooth', lowpass: 700, arp: { notes: [0, 1, 2, 1], vol: 0.06, wave: 'triangle', up: 24 } },
    { chords: [[45, 52, 57, 60], [41, 48, 53, 57], [43, 50, 55, 59], [38, 45, 50, 53]], bar: 8600, pad: 0.07, padWave: 'sine', lowpass: 650, arp: { notes: [0, 2, 3], vol: 0.06, wave: 'sine', up: 24 }, bell: 0.04 },
    { chords: [[53, 57, 60, 64], [50, 53, 57, 60], [55, 59, 62, 65], [48, 52, 55, 59]], bar: 6400, pad: 0.07, padWave: 'triangle', lowpass: 900, arp: { notes: [0, 2, 1, 3], vol: 0.06, wave: 'triangle', up: 12 }, bass: 0.08, hat: 0.015 },
  ],
  hush: [
    { chords: MODES.hush.chords, bar: 9000, pad: 0.035, padWave: 'sawtooth', lowpass: 500 },
    { chords: [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]], bar: 8400, pad: 0.04, padWave: 'sine', lowpass: 700, bell: 0.035 },
    { chords: [[55, 59, 62], [52, 55, 59], [48, 52, 55], [50, 54, 57]], bar: 7800, pad: 0.035, padWave: 'triangle', lowpass: 650, arp: { notes: [0, 1, 2], vol: 0.04, wave: 'sine', up: 12 } },
  ],
};
/** Keys the rotation moves through, in semitones. */
const KEYS = [0, 2, -3, 5, -2];

type EvKind =
  | 'keys' | 'chime' | 'bird' | 'horn' | 'siren' | 'cricket' | 'sizzle' | 'clink'
  | 'weights' | 'page' | 'announce' | 'rumble' | 'cheer' | 'rain' | 'door';

interface Layer {
  /** Filtered noise bed. Frequencies in Hz. */
  hp?: number;
  lp?: number;
  bp?: number;
  gain: number;
  /** Slow level wobble in Hz, for crowds and traffic. */
  wobble?: number;
}

interface SceneDef {
  mode: keyof typeof MODES;
  beds: Layer[];
  /** Steady tones (appliance or lab hum). */
  hum?: { freq: number; gain: number }[];
  events?: { kind: EvKind; every: [number, number]; vol: number }[];
  /** Beats per minute for a club kick drum. */
  beat?: number;
}

const ROOM: Layer = { lp: 380, gain: 0.05 };
const CROWD: Layer = { bp: 700, gain: 0.07, wobble: 0.35 };

const SCENES: Record<SceneAudio, SceneDef> = {
  title: { mode: 'warm', beds: [{ lp: 500, gain: 0.04, wobble: 0.1 }], events: [{ kind: 'horn', every: [14, 26], vol: 0.03 }] },
  city: { mode: 'warm', beds: [{ lp: 420, gain: 0.09, wobble: 0.12 }, { hp: 2500, gain: 0.012 }], events: [{ kind: 'horn', every: [9, 20], vol: 0.04 }, { kind: 'siren', every: [30, 55], vol: 0.025 }] },
  transit: { mode: 'bright', beds: [{ lp: 300, gain: 0.12, wobble: 0.5 }, { bp: 1200, gain: 0.025 }], events: [{ kind: 'horn', every: [5, 11], vol: 0.05 }, { kind: 'rumble', every: [6, 12], vol: 0.06 }] },
  airport: { mode: 'tense', beds: [{ lp: 500, gain: 0.06 }, CROWD], hum: [{ freq: 110, gain: 0.012 }], events: [{ kind: 'announce', every: [10, 18], vol: 0.06 }, { kind: 'rumble', every: [7, 14], vol: 0.04 }] },
  'intl-office': { mode: 'hush', beds: [ROOM], events: [{ kind: 'keys', every: [3, 7], vol: 0.04 }, { kind: 'page', every: [8, 16], vol: 0.04 }] },
  classroom: { mode: 'hush', beds: [ROOM, { bp: 900, gain: 0.02, wobble: 0.2 }], events: [{ kind: 'page', every: [4, 9], vol: 0.04 }, { kind: 'keys', every: [5, 10], vol: 0.03 }] },
  lab: { mode: 'night', beds: [{ lp: 300, gain: 0.04 }], hum: [{ freq: 120, gain: 0.02 }, { freq: 480, gain: 0.004 }], events: [{ kind: 'chime', every: [8, 16], vol: 0.03 }, { kind: 'keys', every: [4, 8], vol: 0.03 }] },
  apartment: { mode: 'warm', beds: [ROOM], hum: [{ freq: 60, gain: 0.012 }], events: [{ kind: 'door', every: [14, 28], vol: 0.04 }, { kind: 'horn', every: [14, 24], vol: 0.015 }] },
  'apartment-night': { mode: 'night', beds: [{ lp: 300, gain: 0.04 }], hum: [{ freq: 60, gain: 0.01 }], events: [{ kind: 'cricket', every: [1.2, 2.4], vol: 0.03 }, { kind: 'siren', every: [22, 40], vol: 0.02 }] },
  cafe: { mode: 'warm', beds: [{ bp: 650, gain: 0.09, wobble: 0.4 }, { lp: 300, gain: 0.03 }], events: [{ kind: 'clink', every: [3, 8], vol: 0.05 }] },
  clinic: { mode: 'hush', beds: [ROOM], hum: [{ freq: 100, gain: 0.012 }], events: [{ kind: 'chime', every: [12, 22], vol: 0.04 }, { kind: 'door', every: [15, 30], vol: 0.03 }] },
  conference: { mode: 'bright', beds: [CROWD, { lp: 400, gain: 0.04 }], events: [{ kind: 'cheer', every: [10, 20], vol: 0.04 }, { kind: 'clink', every: [6, 12], vol: 0.03 }] },
  festival: { mode: 'bright', beds: [{ bp: 800, gain: 0.1, wobble: 0.3 }, { hp: 3000, gain: 0.01 }], events: [{ kind: 'cheer', every: [6, 12], vol: 0.06 }] },
  park: { mode: 'bright', beds: [{ lp: 500, gain: 0.035, wobble: 0.15 }], events: [{ kind: 'bird', every: [1.5, 4], vol: 0.04 }, { kind: 'cheer', every: [18, 36], vol: 0.015 }] },
  library: { mode: 'hush', beds: [{ lp: 260, gain: 0.03 }], events: [{ kind: 'page', every: [3, 7], vol: 0.04 }, { kind: 'keys', every: [5, 10], vol: 0.03 }] },
  careerfair: { mode: 'bright', beds: [CROWD, { lp: 400, gain: 0.04 }], events: [{ kind: 'clink', every: [8, 14], vol: 0.03 }, { kind: 'cheer', every: [14, 24], vol: 0.03 }] },
  street: { mode: 'warm', beds: [{ lp: 450, gain: 0.1, wobble: 0.18 }, { hp: 2200, gain: 0.014 }], events: [{ kind: 'horn', every: [5, 12], vol: 0.05 }, { kind: 'siren', every: [26, 50], vol: 0.025 }, { kind: 'rumble', every: [4, 9], vol: 0.04 }] },
  bank: { mode: 'hush', beds: [ROOM], events: [{ kind: 'keys', every: [3, 6], vol: 0.04 }, { kind: 'chime', every: [10, 20], vol: 0.04 }] },
  campus: { mode: 'bright', beds: [{ lp: 450, gain: 0.04, wobble: 0.2 }, { bp: 900, gain: 0.02, wobble: 0.3 }], events: [{ kind: 'bird', every: [2, 5], vol: 0.035 }, { kind: 'cheer', every: [16, 30], vol: 0.02 }] },
  bedroom: { mode: 'night', beds: [{ lp: 280, gain: 0.04 }], events: [{ kind: 'rain', every: [3, 6], vol: 0.03 }, { kind: 'cricket', every: [2, 4], vol: 0.015 }] },
  kitchen: { mode: 'warm', beds: [ROOM], hum: [{ freq: 55, gain: 0.014 }], events: [{ kind: 'sizzle', every: [2, 5], vol: 0.05 }, { kind: 'clink', every: [5, 10], vol: 0.04 }] },
  club: { mode: 'none', beds: [{ lp: 400, gain: 0.07 }, { bp: 900, gain: 0.04, wobble: 0.4 }], beat: 118, events: [{ kind: 'cheer', every: [7, 14], vol: 0.05 }] },
  gym: { mode: 'bright', beds: [{ lp: 350, gain: 0.04 }], hum: [{ freq: 90, gain: 0.012 }], events: [{ kind: 'weights', every: [2.5, 6], vol: 0.05 }] },
  rooftop: { mode: 'night', beds: [{ lp: 420, gain: 0.06, wobble: 0.1 }, { bp: 800, gain: 0.015, wobble: 0.3 }], events: [{ kind: 'horn', every: [8, 16], vol: 0.03 }, { kind: 'siren', every: [28, 50], vol: 0.02 }, { kind: 'cheer', every: [12, 24], vol: 0.02 }] },
  court: { mode: 'tense', beds: [{ lp: 300, gain: 0.04 }], events: [{ kind: 'page', every: [5, 10], vol: 0.04 }, { kind: 'door', every: [14, 26], vol: 0.03 }] },
  uscis: { mode: 'hush', beds: [ROOM, { bp: 700, gain: 0.03, wobble: 0.3 }], events: [{ kind: 'chime', every: [7, 14], vol: 0.04 }, { kind: 'keys', every: [4, 8], vol: 0.03 }] },
  legal: { mode: 'hush', beds: [ROOM], events: [{ kind: 'page', every: [4, 9], vol: 0.04 }, { kind: 'keys', every: [5, 10], vol: 0.03 }] },
  workplace: { mode: 'bright', beds: [ROOM, { bp: 800, gain: 0.025, wobble: 0.25 }], hum: [{ freq: 110, gain: 0.008 }], events: [{ kind: 'keys', every: [2, 5], vol: 0.04 }, { kind: 'chime', every: [12, 22], vol: 0.03 }] },
  shelter: { mode: 'night', beds: [{ lp: 280, gain: 0.04 }, { bp: 600, gain: 0.02, wobble: 0.2 }], events: [{ kind: 'door', every: [10, 20], vol: 0.03 }, { kind: 'rain', every: [4, 8], vol: 0.02 }] },
  worksite: { mode: 'warm', beds: [ROOM, { hp: 3000, gain: 0.012 }], hum: [{ freq: 70, gain: 0.016 }], events: [{ kind: 'sizzle', every: [2, 4], vol: 0.05 }, { kind: 'clink', every: [2, 5], vol: 0.05 }] },
  walk: { mode: 'night', beds: [{ lp: 450, gain: 0.06, wobble: 0.15 }], events: [{ kind: 'horn', every: [8, 16], vol: 0.03 }, { kind: 'cricket', every: [2, 4], vol: 0.015 }, { kind: 'cheer', every: [20, 34], vol: 0.015 }] },
};

interface ActiveLayer {
  gain: GainNode;
  sources: AudioScheduledSourceNode[];
  timers: number[];
}

/**
 * Generative music plus a distinct ambience for every scene (airport hall, kitchen
 * sizzle, club bass, park birds, library pages, street traffic and so on), all
 * synthesized at runtime with no audio files. The context starts on the first
 * user gesture. Scene changes crossfade.
 */
export class Sound {
  private ctx: AudioContext | null = null;
  private music: GainNode | null = null;
  private amb: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private timer = 0;
  private step = 0;
  private musicVol = 0.5;
  private sfxVol = 0.7;
  private running = false;
  private scene: SceneAudio = 'title';
  private piece: Piece | null = PIECES.warm[0];
  private key = 0;
  private turn = 0;
  private paused = false;
  private layer: ActiveLayer | null = null;

  unlock(): void {
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
      const master = this.ctx.createGain();
      master.gain.value = 0.9;
      master.connect(this.ctx.destination);
      this.music = this.ctx.createGain();
      this.amb = this.ctx.createGain();
      this.sfxBus = this.ctx.createGain();
      this.music.connect(master);
      this.amb.connect(master);
      this.sfxBus.connect(master);
      const len = this.ctx.sampleRate * 3;
      this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.apply();
    }
    if (this.ctx.state === 'suspended' && !this.paused) void this.ctx.resume();
    if (!this.running) this.startMusic();
    this.enter(this.scene, true);
  }

  setVolumes(music: number, sfx: number): void {
    this.musicVol = music;
    this.sfxVol = sfx;
    this.apply();
  }

  private apply(): void {
    if (!this.ctx || !this.music || !this.amb || !this.sfxBus) return;
    const t = this.ctx.currentTime;
    this.music.gain.setTargetAtTime(this.musicVol * 0.35, t, 0.1);
    this.amb.gain.setTargetAtTime(this.musicVol * 1.4, t, 0.1);
    this.sfxBus.gain.setTargetAtTime(this.sfxVol, t, 0.05);
  }

  /** Hold all sound where it is (pause), or carry on from the same place (resume). */
  setPaused(on: boolean): void {
    this.paused = on;
    if (!this.ctx) return;
    if (on) void this.ctx.suspend();
    else void this.ctx.resume();
  }

  /** Which piece and key are playing (for checks). */
  get nowPlaying(): { piece: number; key: number } {
    const list = Object.values(PIECES).find((l) => this.piece && l.includes(this.piece));
    return { piece: list && this.piece ? list.indexOf(this.piece) : -1, key: this.key };
  }

  /** Switch the soundscape. Safe to call before audio is unlocked. */
  setScene(scene: SceneAudio): void {
    if (scene === this.scene && this.layer) return;
    this.scene = scene;
    this.enter(scene, false);
  }

  // ------------------------------------------------------------ scene layers

  private enter(scene: SceneAudio, force: boolean): void {
    const ctx = this.ctx;
    const amb = this.amb;
    if (!ctx || !amb || !this.noise) return;
    if (this.layer && !force) this.fadeOut(this.layer);
    else if (this.layer && force) return;
    const def = SCENES[scene];
    const before = this.piece;
    if (def.mode === 'none') this.piece = null;
    else if (!force || !this.piece) {
      // Next piece for this mood, never the one just playing, in the next key along.
      const list = PIECES[def.mode];
      this.turn += 1;
      let next = list[this.turn % list.length];
      if (next === before && list.length > 1) next = list[(this.turn + 1) % list.length];
      this.piece = next;
      this.key = KEYS[this.turn % KEYS.length];
    }
    const changed = this.piece !== before;
    const t = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(1, t + 1.4);
    gain.connect(amb);
    const layer: ActiveLayer = { gain, sources: [], timers: [] };
    this.layer = layer;

    for (const b of def.beds) {
      const src = ctx.createBufferSource();
      src.buffer = this.noise;
      src.loop = true;
      src.loopStart = Math.random() * 2;
      let node: AudioNode = src;
      const chain = (type: BiquadFilterType, f: number, q = 0.7): void => {
        const bq = ctx.createBiquadFilter();
        bq.type = type;
        bq.frequency.value = f;
        bq.Q.value = q;
        node.connect(bq);
        node = bq;
      };
      if (b.hp) chain('highpass', b.hp);
      if (b.lp) chain('lowpass', b.lp);
      if (b.bp) chain('bandpass', b.bp, 0.8);
      const g = ctx.createGain();
      g.gain.value = b.gain;
      node.connect(g).connect(gain);
      src.start(t, Math.random() * 2);
      layer.sources.push(src);
      if (b.wobble) {
        const lfo = ctx.createOscillator();
        lfo.frequency.value = b.wobble;
        const depth = ctx.createGain();
        depth.gain.value = b.gain * 0.55;
        lfo.connect(depth).connect(g.gain);
        lfo.start(t);
        layer.sources.push(lfo);
      }
    }
    for (const h of def.hum ?? []) {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = h.freq;
      const g = ctx.createGain();
      g.gain.value = h.gain;
      o.connect(g).connect(gain);
      o.start(t);
      layer.sources.push(o);
    }
    for (const e of def.events ?? []) {
      const loop = (): void => {
        if (this.layer !== layer) return;
        this.event(e.kind, e.vol, gain);
        layer.timers.push(window.setTimeout(loop, (e.every[0] + Math.random() * (e.every[1] - e.every[0])) * 1000));
      };
      layer.timers.push(window.setTimeout(loop, 400 + Math.random() * e.every[0] * 1000));
    }
    if (def.beat) {
      const ms = 60000 / def.beat;
      let n = 0;
      layer.timers.push(
        window.setInterval(() => {
          if (this.layer !== layer) return;
          if (n % 2 === 0) this.kick(gain);
          else this.hat(gain);
          if (n % 8 === 5) this.hat(gain);
          n++;
        }, ms / 2),
      );
    }
    if (changed) this.restartMusic();
  }

  private fadeOut(layer: ActiveLayer): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    layer.gain.gain.cancelScheduledValues(t);
    layer.gain.gain.setValueAtTime(layer.gain.gain.value, t);
    layer.gain.gain.linearRampToValueAtTime(0.0001, t + 1.2);
    for (const id of layer.timers) {
      window.clearTimeout(id);
      window.clearInterval(id);
    }
    layer.timers = [];
    window.setTimeout(() => {
      for (const s of layer.sources) {
        try {
          s.stop();
        } catch {
          /* already stopped */
        }
      }
      layer.gain.disconnect();
    }, 1500);
  }

  // ---------------------------------------------------------------- one-shots

  private burst(dest: AudioNode, opts: { hp?: number; lp?: number; bp?: number; dur: number; vol: number; delay?: number; attack?: number }): void {
    const ctx = this.ctx;
    if (!ctx || !this.noise) return;
    const t = ctx.currentTime + (opts.delay ?? 0);
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    let node: AudioNode = src;
    const chain = (type: BiquadFilterType, f: number, q = 0.8): void => {
      const bq = ctx.createBiquadFilter();
      bq.type = type;
      bq.frequency.value = f;
      bq.Q.value = q;
      node.connect(bq);
      node = bq;
    };
    if (opts.hp) chain('highpass', opts.hp);
    if (opts.lp) chain('lowpass', opts.lp);
    if (opts.bp) chain('bandpass', opts.bp, 3);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(opts.vol, t + (opts.attack ?? 0.01));
    g.gain.exponentialRampToValueAtTime(0.0001, t + opts.dur);
    node.connect(g).connect(dest);
    src.start(t, Math.random() * 2, opts.dur + 0.1);
  }

  private blip(dest: AudioNode, f0: number, f1: number, dur: number, type: OscillatorType, vol: number, delay = 0): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(dest);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  private kick(dest: AudioNode): void {
    this.blip(dest, 130, 42, 0.22, 'sine', 0.5);
  }

  private hat(dest: AudioNode): void {
    this.burst(dest, { hp: 6000, dur: 0.05, vol: 0.05 });
  }

  private event(kind: EvKind, vol: number, dest: AudioNode): void {
    const v = vol * 3;
    switch (kind) {
      case 'keys':
        for (let i = 0; i < 4 + Math.floor(Math.random() * 6); i++) {
          this.burst(dest, { hp: 2500, lp: 6000, dur: 0.03, vol: v * 0.5, delay: i * (0.08 + Math.random() * 0.1) });
        }
        break;
      case 'chime':
        this.blip(dest, 880, 880, 0.9, 'sine', v);
        this.blip(dest, 660, 660, 0.9, 'sine', v * 0.8, 0.28);
        break;
      case 'announce':
        this.blip(dest, 523, 523, 0.5, 'sine', v);
        this.blip(dest, 392, 392, 0.8, 'sine', v, 0.5);
        this.burst(dest, { bp: 900, dur: 1.4, vol: v * 0.4, delay: 1.2, attack: 0.3 });
        break;
      case 'bird': {
        const base = 2400 + Math.random() * 1600;
        for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) this.blip(dest, base, base * 1.3, 0.09, 'sine', v * 0.5, i * 0.13);
        break;
      }
      case 'horn':
        this.blip(dest, 330 + Math.random() * 60, 320, 0.45, 'sawtooth', v * 0.25);
        this.burst(dest, { lp: 700, dur: 1.2, vol: v * 0.3, attack: 0.5 });
        break;
      case 'siren':
        for (let i = 0; i < 6; i++) this.blip(dest, i % 2 ? 620 : 840, i % 2 ? 840 : 620, 0.5, 'sine', v * 0.18, i * 0.5);
        break;
      case 'cricket':
        for (let i = 0; i < 3; i++) this.blip(dest, 4200, 4300, 0.05, 'sine', v * 0.3, i * 0.09);
        break;
      case 'sizzle':
        this.burst(dest, { hp: 4000, dur: 1.2, vol: v * 0.7, attack: 0.15 });
        break;
      case 'clink':
        this.blip(dest, 2800 + Math.random() * 800, 2800, 0.25, 'sine', v * 0.5);
        this.blip(dest, 4100, 4100, 0.18, 'sine', v * 0.3, 0.05);
        break;
      case 'weights':
        this.burst(dest, { bp: 600, dur: 0.18, vol: v * 0.9 });
        this.blip(dest, 180, 90, 0.2, 'triangle', v * 0.5, 0.05);
        break;
      case 'page':
        this.burst(dest, { hp: 1800, lp: 5000, dur: 0.35, vol: v * 0.6, attack: 0.08 });
        break;
      case 'rumble':
        this.burst(dest, { lp: 180, dur: 2.2, vol: v * 1.2, attack: 0.9 });
        break;
      case 'cheer':
        this.burst(dest, { bp: 1100, dur: 1.6, vol: v * 0.6, attack: 0.4 });
        break;
      case 'rain':
        this.burst(dest, { hp: 3000, dur: 3, vol: v * 0.4, attack: 1 });
        break;
      case 'door':
        this.burst(dest, { lp: 500, dur: 0.18, vol: v * 1.2 });
        this.blip(dest, 140, 70, 0.25, 'triangle', v * 0.7);
        break;
    }
  }

  // ------------------------------------------------------------------- music

  private startMusic(): void {
    if (!this.ctx || this.running) return;
    this.running = true;
    this.restartMusic();
  }

  /** Begin the current piece from its first bar, at its own tempo. */
  private restartMusic(): void {
    if (!this.running) return;
    window.clearTimeout(this.timer);
    this.step = 0;
    const tick = (): void => {
      if (!this.paused) this.bar();
      this.timer = window.setTimeout(tick, this.piece?.bar ?? 9000);
    };
    tick();
  }

  private bar(): void {
    if (!this.ctx || !this.music) return;
    const p = this.piece;
    if (!p || p.pad <= 0) return;
    const chord = p.chords[this.step % p.chords.length].map((n) => n + this.key);
    const t = this.ctx.currentTime + 0.05;
    const len = p.bar / 1000;
    this.pad(chord, t, len + 0.5, p);
    if (p.arp) {
      const n = p.arp.notes.length;
      for (let i = 0; i < n; i++) {
        const note = chord[p.arp.notes[i] % chord.length] + p.arp.up;
        this.pluck(hz(note), t + 0.3 + (i * (len - 0.3)) / n, Math.min(2.4, (len / n) * 2.2), p.arp.vol, p.arp.wave);
      }
    }
    if (p.bass) {
      this.pluck(hz(chord[0] - 12), t, len * 0.45, p.bass, 'sine');
      this.pluck(hz(chord[0] - 12), t + len * 0.5, len * 0.4, p.bass * 0.8, 'sine');
    }
    if (p.bell && this.step % 2 === 0) this.pluck(hz(chord[chord.length - 1] + 24), t + len * 0.62, 3.2, p.bell, 'sine');
    if (p.hat && this.noise) {
      for (let i = 0; i < 8; i++) this.tick(t + (i * len) / 8, i % 2 ? p.hat * 0.6 : p.hat);
    }
    this.step += 1;
  }

  /** A soft closed hi-hat: a short burst of high noise. */
  private tick(t: number, vol: number): void {
    if (!this.ctx || !this.music || !this.noise) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const f = this.ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 7000;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    src.connect(f).connect(g).connect(this.music);
    src.start(t, Math.random() * 2, 0.06);
  }

  private pad(notes: readonly number[], t: number, dur: number, p: Piece): void {
    if (!this.ctx || !this.music) return;
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = p.lowpass;
    const g = this.ctx.createGain();
    // Softer waves need a little more level to sit at the same loudness as the saw pads.
    const level = p.pad * (p.padWave === 'sine' ? 1.8 : p.padWave === 'triangle' ? 1.4 : 1);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(level, t + dur * 0.35);
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    f.connect(g).connect(this.music);
    for (const n of notes) {
      for (const d of [-6, 6]) {
        const o = this.ctx.createOscillator();
        o.type = p.padWave;
        o.frequency.value = hz(n);
        o.detune.value = d;
        o.connect(f);
        o.start(t);
        o.stop(t + dur + 0.1);
      }
    }
  }

  private pluck(freq: number, t: number, dur: number, vol: number, wave: OscillatorType = 'triangle'): void {
    if (!this.ctx || !this.music) return;
    const o = this.ctx.createOscillator();
    o.type = wave;
    o.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.music);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  // --------------------------------------------------------- feedback sounds

  private tone(f0: number, f1: number, dur: number, type: OscillatorType, vol: number, delay = 0): void {
    if (this.sfxBus) this.blip(this.sfxBus, f0, f1, dur, type, vol, delay);
  }

  click(): void {
    this.tone(520, 700, 0.07, 'triangle', 0.18);
  }
  choose(): void {
    this.tone(330, 440, 0.12, 'sine', 0.2);
  }
  pass(): void {
    [523, 659, 784].forEach((f, i) => this.tone(f, f, 0.2, 'triangle', 0.2, i * 0.08));
  }
  fail(): void {
    [392, 330, 262].forEach((f, i) => this.tone(f, f * 0.95, 0.26, 'sine', 0.22, i * 0.11));
  }
  step2(): void {
    this.tone(260, 520, 0.18, 'triangle', 0.14);
  }
  dispose(): void {
    window.clearTimeout(this.timer);
    if (this.layer) {
      for (const id of this.layer.timers) {
        window.clearTimeout(id);
        window.clearInterval(id);
      }
    }
    this.layer = null;
    void this.ctx?.close();
    this.ctx = null;
    this.running = false;
  }
}
