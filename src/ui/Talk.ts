import type { Line } from '../engine/types';
import { clipName, voiceSlot } from '../engine/voices';
import clipList from '../data/voice-clips.json';

/** Recordings that exist (scripts/gen_voices.mjs keeps this list), so missing ones are never requested. */
const CLIPS = new Set<string>(clipList as string[]);

/**
 * Plays a card's spoken lines as speech bubbles over the people in the scene, one at a time, with a
 * recorded voice where one exists (see engine/voices.ts). A line without a recording stays up for reading
 * time; the device's own robotic speech voice is never used. Every line is also written into the card's
 * transcript, so nothing is lost to players who read rather than listen, or who cannot hear. Tapping a
 * bubble skips ahead.
 */
export interface TalkHost {
  canvas: HTMLCanvasElement;
  /** Above-the-head point for a role, in canvas CSS pixels, or null if that person is not on screen. */
  screenOf(role: string): { x: number; y: number } | null;
  volume(): number;
  reduced(): boolean;
  /** Recorded voices on or off. */
  voices(): 'on' | 'off';
  /** Whether the person with this role on screen is a woman or a man, so their voice matches. */
  sexOf?(role: string): 'f' | 'm' | null;
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
      const clip = narr || this.host.voices() === 'off' ? null : this.clipFor(line);
      const spoken: Promise<boolean> | null = clip ? this.say(clip, run) : null;
      if (spoken) {
        this.host.speaking?.(true);
        void spoken.then(() => this.host.speaking?.(false));
      }
      // A voice that plays gets half a second after it; no voice leaves the line up for reading time.
      await Promise.race([spoken ? spoken.then((ok) => this.wait(ok ? 500 : read, run)) : this.wait(read, run), this.skipped(run)]);
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
    if (!this.audio) return;
    if (on) this.audio.pause();
    else void this.audio.play().catch(() => undefined);
  }

  stop(): void {
    this.run++;
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

  /** The recording of this line in the speaker's voice, or null when there is none. */
  private clipFor(line: TalkLine): string | null {
    const slot = voiceSlot(line.who, this.host.sexOf?.(line.who) ?? null);
    if (!slot) return null;
    const name = clipName(slot, line.text);
    return CLIPS.has(name) ? name : null;
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
