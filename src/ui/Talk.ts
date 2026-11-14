import type { Line } from '../engine/types';

/**
 * Plays a card's spoken lines as speech bubbles over the people in the scene, one at a time, with a
 * recorded voice where one exists and the device's own speech voice for the rest. Every line is also written into the card's transcript, so nothing is
 * lost to players who read rather than listen, or who cannot hear. Tapping a bubble skips ahead.
 */
export interface TalkHost {
  canvas: HTMLCanvasElement;
  /** Above-the-head point for a role, in canvas CSS pixels, or null if that person is not on screen. */
  screenOf(role: string): { x: number; y: number } | null;
  volume(): number;
  reduced(): boolean;
  /** 'all': recordings, and the device's speech voice for every other line; 'recorded': recordings only; 'off'. */
  voices(): 'all' | 'recorded' | 'off';
  /** Someone has started (true) or stopped (false) speaking: music and room sound dip under the voice. */
  speaking?(on: boolean): void;
  /** The name to show over a person's lines (a roommate's own name, say); falls back to the role. */
  nameOf?(role: string): string | null;
}

/** A spoken line, or a line of narration that goes in the transcript only (no bubble, no voice). */
export type TalkLine = Line | { who: 'narrator'; text: string; voice?: undefined };

export interface PlayOptions {
  /** Reading time multiplier: under 1 is quicker. */
  pace?: number;
  /** Called as each line starts, so the scene can act it out. */
  onLine?: (line: TalkLine, index: number) => void;
}

const synth: SpeechSynthesis | null = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
/**
 * A steady voice per role: the same person always sounds the same, and different people sound different.
 * Pitch moves only a little; larger shifts make device voices sound muffled.
 */
const ROLE_PITCH: Record<string, number> = { player: 1.02, officer: 0.95, dso: 1.04, professor: 0.96, advisor: 1.03, landlord: 0.95, roommate: 1.05, friend: 1.04, parent: 0.98, doctor: 0.99, nurse: 1.05, recruiter: 1.03, teller: 1.04, owner: 0.96, spouse: 1.03, student: 1.05 };

/** Novelty, effect and old low-quality voices that devices ship: never used for a person. */
const UNCLEAR = /albert|bad news|bahh|bells|boing|bubbles|cellos|deranged|good news|hysterical|jester|junior|organ|ralph|superstar|trinoids|whisper|wobble|zarvox|fred|kathy|grandma|grandpa|rocko|eddy|flo\b|reed|sandy|shelley|novelty/i;
/** Voices known to read clearly, best first. Premium, enhanced and natural voices rank above all of them. */
const CLEAR = ['samantha', 'ava', 'allison', 'alex', 'susan', 'tom', 'nathan', 'zoe', 'evan', 'joelle', 'noelle', 'aaron', 'nicky', 'daniel', 'karen', 'moira', 'tessa', 'serena', 'arthur', 'martha', 'rishi', 'google us english', 'google uk english', 'microsoft aria', 'microsoft jenny', 'microsoft guy'];

function voiceScore(v: SpeechSynthesisVoice): number {
  const n = v.name.toLowerCase();
  let score = 0;
  if (/premium|enhanced|natural|neural|siri/.test(n)) score += 100;
  const i = CLEAR.findIndex((c) => n.includes(c));
  if (i >= 0) score += 50 - i;
  if (/US/i.test(v.lang)) score += 8;
  if (v.localService) score += 2;
  return score;
}

/** The clearest English voices on this device, a handful of them, best first. */
export function englishVoices(): SpeechSynthesisVoice[] {
  const all = synth?.getVoices() ?? [];
  const en = all.filter((v) => /^en(-|_|$)/i.test(v.lang) && !UNCLEAR.test(v.name));
  const ranked = en.sort((a, b) => voiceScore(b) - voiceScore(a));
  // Keep only voices close to the best one, so nobody gets a noticeably worse voice than the rest.
  const top = ranked.length ? voiceScore(ranked[0]) : 0;
  const good = ranked.filter((v) => voiceScore(v) >= top - 60).slice(0, 6);
  return good.length ? good : ranked.slice(0, 4);
}

const base = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');

export class Talk {
  private layer: HTMLDivElement;
  private bubble: HTMLDivElement | null = null;
  private who = '';
  private raf = 0;
  private timer = 0;
  private audio: HTMLAudioElement | null = null;
  private run = 0;
  private skip: (() => void) | null = null;
  private paused = false;

  constructor(private readonly host: TalkHost) {
    this.layer = document.createElement('div');
    this.layer.className = 'talk-layer';
    this.layer.addEventListener('click', () => { if (!this.paused) this.skip?.(); });
    host.canvas.parentElement?.appendChild(this.layer);
  }

  /** Play the lines in order; `log` receives each line as it is spoken. */
  /** Play the lines in order; `log` receives each line as it is spoken. Resolves true if it played to the end. */
  async play(lines: TalkLine[], log: HTMLElement | null, opts: PlayOptions = {}): Promise<boolean> {
    this.stop();
    const run = ++this.run;
    this.raf = requestAnimationFrame(this.place);
    // Let the cast load and the camera settle before anyone speaks.
    await this.wait(900, run);
    for (const [i, line] of lines.entries()) {
      if (run !== this.run) return false;
      opts.onLine?.(line, i);
      const narr = line.who === 'narrator';
      if (narr) this.hide();
      else this.show(line);
      if (log) {
        for (const old of Array.from(log.children)) old.classList.remove('now');
        const li = document.createElement('li');
        li.className = `${narr ? 'narr' : line.who === 'player' ? 'you' : ''} now`;
        li.innerHTML = narr ? '<span></span>' : `<b></b> <span></span>`;
        const b = li.querySelector('b');
        if (b) b.textContent = this.nameFor(line.who);
        (li.querySelector('span') as HTMLElement).textContent = line.text;
        log.appendChild(li);
        log.hidden = false;
        log.scrollTop = log.scrollHeight;
      }
      const read = Math.max(2400, 1200 + line.text.length * 55) * (opts.pace ?? 1);
      const mode = narr ? 'off' : this.host.voices();
      // A recording if there is one; otherwise (or if it is missing) the device's own speech voice.
      let spoken: Promise<boolean> | null = null;
      if (mode !== 'off' && line.voice && line.who !== 'player') {
        spoken = this.say(line.voice, run).then((ok) => (ok || mode !== 'all' ? ok : this.speak(line, run, read)));
      } else if (mode === 'all') {
        spoken = this.speak(line as Line, run, read);
      }
      if (spoken) {
        this.host.speaking?.(true);
        void spoken.then(() => this.host.speaking?.(false));
      }
      // A voice that plays gets half a second after it; no voice leaves the line up for reading time.
      await Promise.race([spoken ? spoken.then((ok) => this.wait(ok ? 500 : read, run)) : this.wait(read, run), this.skipped(run)]);
      synth?.cancel();
      this.host.speaking?.(false);
    }
    if (run !== this.run) return false;
    await this.wait(1600, run);
    if (run !== this.run) return false;
    this.hide();
    return true;
  }

  /** Move on to the next line now (a tap on the dialogue box or the Next button). */
  next(): void {
    if (!this.paused) this.skip?.();
  }

  private nameFor(who: string): string {
    if (who === 'player') return 'You';
    return this.host.nameOf?.(who) ?? label(who);
  }

  /** Hold the conversation where it is (voice and timing), or carry on. */
  setPaused(on: boolean): void {
    this.paused = on;
    if (synth?.speaking) {
      if (on) synth.pause();
      else synth.resume();
    }
    if (!this.audio) return;
    if (on) this.audio.pause();
    else void this.audio.play().catch(() => undefined);
  }

  stop(): void {
    this.run++;
    synth?.cancel();
    this.host.speaking?.(false);
    cancelAnimationFrame(this.raf);
    window.clearTimeout(this.timer);
    this.audio?.pause();
    this.audio = null;
    this.skip?.();
    this.skip = null;
    this.hide();
  }

  private show(line: TalkLine): void {
    this.hide();
    const b = document.createElement('div');
    b.className = `bubble${line.who === 'player' ? ' you' : ''}${this.host.reduced() ? ' still' : ''}`;
    b.setAttribute('role', 'status');
    const name = document.createElement('small');
    name.textContent = this.nameFor(line.who);
    const text = document.createElement('span');
    text.textContent = line.text;
    b.append(name, text);
    this.layer.appendChild(b);
    this.bubble = b;
    this.who = line.who;
    this.place();
  }

  private hide(): void {
    this.bubble?.remove();
    this.bubble = null;
  }

  /** Keep the bubble over the speaker's head as the camera drifts. */
  private place = (): void => {
    const b = this.bubble;
    const c = this.host.canvas;
    if (b) {
      const off = { x: c.offsetLeft, y: c.offsetTop };
      const at = this.host.screenOf(this.who);
      const w = b.offsetWidth;
      const h = b.offsetHeight;
      const cw = c.clientWidth;
      let x = at ? at.x : cw / 2;
      let y = at ? at.y - 10 : h + 24;
      x = Math.max(w / 2 + 8, Math.min(cw - w / 2 - 8, x));
      y = Math.max(h + 8, y);
      b.style.transform = `translate(${Math.round(off.x + x - w / 2)}px, ${Math.round(off.y + y - h)}px)`;
      // The tail points at the speaker even when the bubble is pushed in from an edge.
      const tail = at ? Math.max(14, Math.min(w - 14, at.x - (x - w / 2))) : w / 2;
      b.style.setProperty('--tail', `${Math.round(tail)}px`);
    }
    this.raf = requestAnimationFrame(this.place);
  };

  /** Speak a line with the device's own voice. Resolves true when it finished, false if speech is unavailable. */
  private speak(line: Line, run: number, read: number): Promise<boolean> {
    return new Promise((resolve) => {
      const vol = this.host.volume();
      if (!synth || vol <= 0 || run !== this.run) return resolve(false);
      const u = new SpeechSynthesisUtterance(line.text);
      const voices = englishVoices();
      if (voices.length) {
        let h = 0;
        for (const ch of line.who) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
        u.voice = voices[h % voices.length];
        u.lang = u.voice.lang;
      } else u.lang = 'en-US';
      u.pitch = ROLE_PITCH[line.who] ?? 1;
      u.rate = 0.94;
      u.volume = Math.min(1, vol * 1.4);
      let done = false;
      const finish = (ok: boolean): void => {
        if (done) return;
        done = true;
        resolve(ok);
      };
      u.onend = () => finish(true);
      u.onerror = () => finish(false);
      // Some phones never report the end of an utterance: give up after a generous reading time.
      window.setTimeout(() => finish(true), read * 1.6 + 1500);
      synth.speak(u);
    });
  }

  /** Play a recorded line; resolves true when it played to the end, false when there was nothing to hear. */
  private say(file: string, run: number): Promise<boolean> {
    return new Promise((resolve) => {
      const vol = this.host.volume();
      if (vol <= 0) {
        resolve(false);
        return;
      }
      const a = new Audio(`${base}/assets/voice/${file}.mp3`);
      a.volume = Math.min(1, vol * 1.4);
      this.audio = a;
      a.onended = () => resolve(run === this.run);
      a.onerror = () => resolve(false);
      a.play().catch(() => resolve(false));
    });
  }

  /** Wait this long in playing time: the clock stops while the game is paused. */
  private wait(ms: number, run: number): Promise<void> {
    return new Promise((resolve) => {
      let left = ms;
      const step = (): void => {
        if (run !== this.run || left <= 0) return resolve();
        if (!this.paused) left -= 100;
        this.timer = window.setTimeout(step, 100);
      };
      step();
    });
  }

  private skipped(run: number): Promise<void> {
    return new Promise((resolve) => {
      this.skip = () => {
        this.audio?.pause();
        resolve();
      };
      if (run !== this.run) resolve();
    });
  }
}

function label(role: string): string {
  const names: Record<string, string> = { officer: 'Officer', dso: 'Adviser', landlord: 'Landlord', roommate: 'Roommate', manager: 'Manager', parent: 'Family', friend: 'Friend', professor: 'Professor', lawyer: 'Lawyer', clerk: 'Clerk' };
  return names[role] ?? role.charAt(0).toUpperCase() + role.slice(1);
}
