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
}

const synth: SpeechSynthesis | null = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
/** A steady voice per role: the same person always sounds the same, and different people sound different. */
const ROLE_PITCH: Record<string, number> = { player: 1.04, officer: 0.86, dso: 1.12, professor: 0.9, advisor: 1.06, landlord: 0.84, roommate: 1.14, friend: 1.1, parent: 0.95, doctor: 0.97, nurse: 1.16, recruiter: 1.08, teller: 1.1, owner: 0.88, spouse: 1.08, student: 1.15 };
function englishVoices(): SpeechSynthesisVoice[] {
  const all = synth?.getVoices() ?? [];
  const en = all.filter((v) => /^en(-|_|$)/i.test(v.lang));
  const us = en.filter((v) => /US/i.test(v.lang));
  return us.length >= 2 ? us : en.length ? en : all;
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
  async play(lines: Line[], log: HTMLElement | null): Promise<void> {
    this.stop();
    const run = ++this.run;
    this.raf = requestAnimationFrame(this.place);
    // Let the cast load and the camera settle before anyone speaks.
    await this.wait(900, run);
    for (const line of lines) {
      if (run !== this.run) return;
      this.show(line);
      if (log) {
        const li = document.createElement('li');
        li.className = line.who === 'player' ? 'you' : '';
        li.innerHTML = `<b></b> <span></span>`;
        (li.querySelector('b') as HTMLElement).textContent = line.who === 'player' ? 'You' : label(line.who);
        (li.querySelector('span') as HTMLElement).textContent = line.text;
        log.appendChild(li);
        log.hidden = false;
      }
      const read = Math.max(2400, 1200 + line.text.length * 55);
      const mode = this.host.voices();
      // A recording if there is one; otherwise (or if it is missing) the device's own speech voice.
      let spoken: Promise<boolean> | null = null;
      if (mode !== 'off' && line.voice && line.who !== 'player') {
        spoken = this.say(line.voice, run).then((ok) => (ok || mode !== 'all' ? ok : this.speak(line, run, read)));
      } else if (mode === 'all') {
        spoken = this.speak(line, run, read);
      }
      // A voice that plays gets half a second after it; no voice leaves the line up for reading time.
      await Promise.race([spoken ? spoken.then((ok) => this.wait(ok ? 500 : read, run)) : this.wait(read, run), this.skipped(run)]);
      synth?.cancel();
    }
    if (run !== this.run) return;
    await this.wait(1600, run);
    if (run === this.run) this.hide();
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
    cancelAnimationFrame(this.raf);
    window.clearTimeout(this.timer);
    this.audio?.pause();
    this.audio = null;
    this.skip?.();
    this.skip = null;
    this.hide();
  }

  private show(line: Line): void {
    this.hide();
    const b = document.createElement('div');
    b.className = `bubble${line.who === 'player' ? ' you' : ''}${this.host.reduced() ? ' still' : ''}`;
    b.setAttribute('role', 'status');
    const name = document.createElement('small');
    name.textContent = line.who === 'player' ? 'You' : label(line.who);
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
      u.rate = 0.98;
      u.volume = Math.min(1, vol * 1.1);
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
      a.volume = Math.min(1, vol * 1.2);
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
