import { Talk } from './Talk';
import { Sound } from '../audio/Sound';
import { ACTIVITIES, pickActivities, pickScript } from '../engine/activities';
import type { Activity } from '../engine/activities';
import { fill, withLine } from '../engine/people';
import { CITIES, getCity, getFact, srcNum, type CityData } from '../engine/data';
import { commuteInfo, monthlyBudget, netMonthly, START_MONEY } from '../engine/economy';
import type { BudgetLine, GameState, ScheduleItem, Statement } from '../engine/types';
import { Game, gpaOf, monthLabel, REALITY_MOD, slotLabel } from '../engine/game';
import { createSeededRandom } from '../utils/random';
import type {
  Choice,
  CommuteMode,
  Ending,
  Fact,
  Funding,
  Housing,
  Lifestyle,
  Marital,
  Pivot,
  Profile,
  Reality,
  ResultView,
  Sex,
  Stats,
} from '../engine/types';
import { CityScene } from '../world/CityScene';
import { playerLookFor, ROLE_LOOKS } from '../world/Figure';
import { loadHumans } from '../world/HumanFigure';
import { preloadCast, setCastContext } from '../world/MhFigure';
import { preloadBackdrops, setBackdropsEnabled } from '../world/backdrops';
import { CONTINENTS, continentOf, countryFact, cultureOf, mechanicsOf, playableCountries } from '../engine/country';
import type { Continent } from '../engine/country';
import { ALL_CARDS, ROUTES, STATUS_MAP, routeReady } from '../engine/content/index';
import { statusOf } from '../engine/routes';
import { blurbOf } from '../engine/activities';
import { setBoardLine } from '../world/Stage';
import type { Country, StatusId } from '../engine/types';
import { buildStage } from '../world/Stage';

const esc = (s: string): string =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c);
const money = (n: number): string => `${n < 0 ? '-' : ''}$${Math.abs(Math.round(n)).toLocaleString('en-US')}`;
const est = (e: boolean): string => (e ? '<span class="est" title="A designed estimate, not a measured figure">est.</span>' : '');

interface Settings {
  music: number;
  sfx: number;
  reduceMotion: boolean;
  showOdds: boolean;
  interlude: 'off' | 'short' | 'normal' | 'long';
  /** Spoken lines: recordings plus the device voice, recordings only, or silent (text only). Missing means 'all'. */
  voices?: 'all' | 'recorded' | 'off';
  /** Painted scene backdrops (true) or the older 3D rooms (false). Missing in old saves means painted. */
  painted?: boolean;
}

const SETTINGS_KEY = 'immigrant-settings-v1';
const PROFILE_KEY = 'immigrant-last-profile-v1';
/** The journey in progress, saved at every new card so the player can stop and carry on later. */
const JOURNEY_KEY = 'immigrant-journey-v1';
interface SavedJourney {
  v: 1;
  savedAt: number;
  state: Omit<GameState, 'schedule'> & { schedule: Array<Omit<ScheduleItem, 'def'> & { def: string }> };
}
function loadJourney(): SavedJourney | null {
  try {
    const raw = localStorage.getItem(JOURNEY_KEY);
    const j = raw ? (JSON.parse(raw) as SavedJourney) : null;
    return j && j.v === 1 && j.state?.profile ? j : null;
  } catch {
    return null;
  }
}
function clearJourney(): void {
  try {
    localStorage.removeItem(JOURNEY_KEY);
  } catch {
    // Ignore blocked storage.
  }
}

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? ({ ...fallback, ...(JSON.parse(raw) as object) } as T) : fallback;
  } catch {
    return fallback;
  }
}
function saveJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage may be blocked; the game still works.
  }
}

const STAT_LABEL: Record<keyof Stats, string> = {
  money: 'Money',
  study: 'Study',
  career: 'Career',
  legal: 'Legal security',
  family: 'Family',
  wellbeing: 'Wellbeing',
  community: 'Community',
};

const COMMUTES: CommuteMode[] = ['walk', 'bike', 'transit', 'car', 'rideshare'];
const COMMUTE_NAME: Record<CommuteMode, string> = {
  walk: 'Walk',
  bike: 'Bike',
  transit: 'Public transit',
  car: 'Car',
  rideshare: 'Ride-share',
};

/** Shared facts that describe India only; other countries see their own version or nothing. */
const INDIA_ONLY_TOPICS = new Set(['numbers', 'family', 'time', 'flight']);

function blockedReason(country: Country, year: number, route: StatusId): string | null {
  const hit = mechanicsOf(country)?.arrivalLimits.find((l) => year >= l.from && l.routes.includes(route));
  return hit ? hit.reason : null;
}

function factFor(country: Country, id: string | undefined): Fact | null {
  if (!id) return null;
  const own = countryFact(country, id);
  if (own) return own;
  const shared = getFact(id);
  if (!shared) return null;
  if (country === 'india') return shared;
  const indiaOnly = INDIA_ONLY_TOPICS.has(sharedTopic(id)) || /india|indian/i.test(shared.title + shared.text);
  return indiaOnly ? null : shared;
}
function sharedTopic(id: string): string {
  if (/^(india|indian|f1-visas|f1-refusal|f1-overstay|h1b-india|remittance|education-loan|family|parent)/.test(id)) return 'numbers';
  if (id === 'time-difference') return 'time';
  if (id === 'flight-roundtrip') return 'flight';
  return 'other';
}

const REALITY_TEXT: Record<Reality, string> = {
  hopeful: 'Hopeful. Setbacks are softer. Odds are a little better.',
  honest: 'Honest. Odds follow the data as closely as we can. The default.',
  hard: 'Hard realism. Setbacks bite and odds are a little worse.',
};

function hashSeed(text: string): number {
  let h = 7;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return h;
}

function odds(pct: number): string {
  if (pct >= 80) return 'Likely';
  if (pct >= 60) return 'Good odds';
  if (pct >= 40) return 'Even odds';
  if (pct >= 20) return 'Long shot';
  return 'Unlikely';
}

export class App {
  private readonly root: HTMLElement;
  private readonly scene: CityScene;
  private readonly sound = new Sound();
  private readonly talk: Talk;
  private settings: Settings = loadJson<Settings>(SETTINGS_KEY, { music: 0.5, sfx: 0.7, reduceMotion: false, showOdds: false, interlude: 'normal' });
  private draft: Profile = loadJson<Profile>(PROFILE_KEY, {
    name: '',
    age: 24,
    sex: 'female',
    marital: 'single',
    country: 'india',
    status: 'F1',
    cityId: 'chicago',
    arrivalYear: 2022,
    funding: 'family',
    housing: 'shared',
    lifestyle: 'balanced',
    reality: 'honest',
    commute: 'transit',
  });
  private step = 1;
  private game: Game | null = null;
  private result: ResultView | null = null;
  private busy = false;
  private pendingPivot: Pivot | null = null;
  private currentActivity: Activity | null = null;
  private activityCount = 0;
  private interludeTimer = 0;
  private paused = false;

  constructor(root: HTMLElement, canvas: HTMLCanvasElement) {
    this.root = root;
    this.scene = new CityScene(canvas);
    this.talk = new Talk({
      canvas,
      screenOf: (role) => this.scene.screenOf(role),
      volume: () => this.settings.sfx,
      reduced: () => this.settings.reduceMotion,
      voices: () => this.settings.voices ?? 'all',
    });
    this.scene.setReducedMotion(this.settings.reduceMotion);
    this.scene.setStageBuilder((id, cast, profile, variant) => {
      const look = playerLookFor(profile, hashSeed(profile.name), cultureOf(profile.country)?.skinTones);
      setCastContext(mechanicsOf(profile.country)?.castGroup ?? profile.country, look.fem ? 'f' : 'm');
      return buildStage(id, cast, look, this.cityOf(profile.cityId).palette, variant);
    });
    this.sound.setVolumes(this.settings.music, this.settings.sfx);
    void loadHumans(false);
    preloadCast();
    preloadBackdrops();
    setBackdropsEnabled(this.settings.painted !== false);
    this.scene.setCity(this.cityOf(this.draft.cityId));
    this.scene.setMonth(8);
    this.scene.start();
    this.root.addEventListener('click', (e) => this.onClick(e));
    this.root.addEventListener('input', (e) => this.onInput(e));
    this.root.addEventListener('change', (e) => this.onInput(e));
    window.addEventListener('resize', () => requestAnimationFrame(this.syncScene));
    new ResizeObserver(() => this.syncScene()).observe(this.root);
    window.addEventListener('pointerdown', () => this.sound.unlock(), { once: true });
    window.addEventListener('keydown', () => this.sound.unlock(), { once: true });
    window.addEventListener('keydown', (e) => {
      if ((e.key === 'Escape' || e.key === 'p' || e.key === 'P') && this.game && !document.getElementById('modal')) {
        if ((e.target as HTMLElement | null)?.closest('input, textarea, select')) return;
        e.preventDefault();
        this.setPaused(!this.paused);
      }
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.game && this.root.className === 'is-play') this.setPaused(true);
    });
    this.title();
    if (new URLSearchParams(location.search).has('debug')) {
      (window as unknown as { __immigrant: App }).__immigrant = this;
    }
  }

  private cityOf(id: string): CityData {
    return CITIES.find((c) => c.id === id) ?? CITIES[0];
  }

  // ---------------------------------------------------------------- event routing

  private onClick(e: MouseEvent): void {
    const t = (e.target as HTMLElement).closest<HTMLElement>('[data-act]');
    if (!t || t.hasAttribute('disabled')) return;
    this.sound.click();
    const d = t.dataset;
    switch (d.act) {
      case 'title': return this.title();
      case 'start': return this.setup(1);
      case 'help': return this.modal('help');
      case 'settings': return this.modal('settings');
      case 'close': return this.closeModal();
      case 'next': return this.setup(this.step + 1);
      case 'back': return this.setup(Math.max(1, this.step - 1));
      case 'sex': this.draft.sex = d.v as Sex; return this.setup(this.step);
      case 'country': this.draft.country = d.v as Country; return this.setup(this.step);
      case 'continent': {
        const first = playableCountries(d.v as Continent)[0];
        if (first && continentOf(this.draft.country) !== d.v) this.draft.country = first;
        return this.setup(this.step);
      }
      case 'route': this.draft.status = d.v as StatusId; return this.setup(this.step);
      case 'marital': this.draft.marital = d.v as Marital; return this.setup(this.step);
      case 'city':
        this.draft.cityId = d.v as Profile['cityId'];
        this.scene.setCity(this.cityOf(this.draft.cityId));
        return this.setup(this.step);
      case 'funding': this.draft.funding = d.v as Funding; return this.setup(this.step);
      case 'housing': this.draft.housing = d.v as Housing; return this.setup(this.step);
      case 'lifestyle': this.draft.lifestyle = d.v as Lifestyle; return this.setup(this.step);
      case 'reality': this.draft.reality = d.v as Reality; return this.setup(this.step);
      case 'begin': return this.begin();
      case 'pause': return this.setPaused(true);
      case 'resume': return this.setPaused(false);
      case 'save-quit': this.setPaused(false); this.saveJourney(); return this.title();
      case 'resume-journey': return this.resumeJourney();
      case 'preview': return void this.previewCommute(d.v as CommuteMode);
      case 'commute': return this.pickCommute(d.v as CommuteMode);
      case 'choose': return this.choose(d.v ?? '');
      case 'continue': return this.afterResult();
      case 'pivot': return this.resolveCrossroads(d.v ?? '');
      case 'activity': return this.startActivity(d.v ?? '');
      case 'skip-interlude': return this.finishInterlude();
      case 'interlude-done': return void this.next();
      case 'skip-evening': return void this.next();
      case 'toggle-interlude': {
        const order = ['off', 'short', 'normal', 'long'] as const;
        this.settings.interlude = order[(order.indexOf(this.settings.interlude) + 1) % order.length];
        saveJson(SETTINGS_KEY, this.settings);
        return this.modal('settings');
      }
      case 'toggle-voices': {
        const order = ['all', 'recorded', 'off'] as const;
        this.settings.voices = order[(order.indexOf(this.settings.voices ?? 'all') + 1) % order.length];
        saveJson(SETTINGS_KEY, this.settings);
        return this.modal('settings');
      }
      case 'toggle-painted':
        this.settings.painted = this.settings.painted === false;
        setBackdropsEnabled(this.settings.painted !== false);
        saveJson(SETTINGS_KEY, this.settings);
        return this.modal('settings');
      case 'nextyear': return this.startNextYear();
      case 'ledger': return this.modal('ledger');
      case 'again': return this.begin(true);
      case 'newjourney': return this.setup(1);
      case 'share': return void this.share();
      case 'reset': return this.resetSave();
      case 'toggle-odds':
        this.settings.showOdds = !this.settings.showOdds;
        saveJson(SETTINGS_KEY, this.settings);
        return this.modal('settings');
      case 'toggle-motion':
        this.settings.reduceMotion = !this.settings.reduceMotion;
        this.scene.setReducedMotion(this.settings.reduceMotion);
        saveJson(SETTINGS_KEY, this.settings);
        return this.modal('settings');
      default:
    }
  }

  private onInput(e: Event): void {
    const t = e.target as HTMLInputElement | HTMLSelectElement;
    switch (t.id) {
      case 'f-name': this.draft.name = t.value.slice(0, 24); break;
      case 'f-age': this.draft.age = Math.max(18, Math.min(50, Number(t.value) || 24)); break;
      case 'f-year': this.draft.arrivalYear = Number(t.value); this.setup(this.step); break;
      case 'f-n-roommate':
      case 'f-n-friend':
      case 'f-n-partner':
      case 'f-n-classmate':
      case 'f-n-sibling': {
        const key = t.id.slice(4) as 'roommate' | 'friend' | 'partner' | 'classmate' | 'sibling';
        this.draft.names = { ...(this.draft.names ?? {}), [key]: t.value.slice(0, 16) };
        break;
      }
      case 's-music':
        this.settings.music = Number(t.value) / 100;
        this.sound.setVolumes(this.settings.music, this.settings.sfx);
        saveJson(SETTINGS_KEY, this.settings);
        break;
      case 's-sfx':
        this.settings.sfx = Number(t.value) / 100;
        this.sound.setVolumes(this.settings.music, this.settings.sfx);
        saveJson(SETTINGS_KEY, this.settings);
        break;
      default:
    }
  }

  // ---------------------------------------------------------------- screens

  private put(html: string, cls = ''): void {
    this.talk.stop();
    this.root.className = cls;
    const split = cls === 'is-play' || cls === 'is-transit';
    let out = this.game ? fill(html, this.game.state) : html;
    // In play the 3D scene gets its own window between the top bar and the card. The menu layer reserves an
    // empty slot for it and the scene is placed over that slot, so no browser can draw the card over the people.
    if (split) {
      const at = out.indexOf('</header>');
      out = at >= 0 ? `${out.slice(0, at + 9)}<div class="scene-slot" aria-hidden="true"></div>${out.slice(at + 9)}` : `<div class="scene-slot" aria-hidden="true"></div>${out}`;
    }
    this.root.innerHTML = out;
    this.root.scrollTop = 0;
    const app = document.getElementById('app');
    if (app) app.dataset.layout = split ? 'split' : 'full';
    this.syncScene();
  }

  /** Put the 3D scene exactly over the reserved slot (play screens), or back to full screen (menus). */
  private syncScene = (): void => {
    const c = document.getElementById('scene');
    const slot = this.root.querySelector<HTMLElement>('.scene-slot');
    const app = document.getElementById('app');
    if (!c) return;
    if (!slot || !app) {
      c.style.left = c.style.top = c.style.width = c.style.height = '';
      return;
    }
    const ar = app.getBoundingClientRect();
    const r = slot.getBoundingClientRect();
    c.style.left = `${Math.round(r.left - ar.left)}px`;
    c.style.top = `${Math.round(r.top - ar.top)}px`;
    c.style.width = `${Math.round(r.width)}px`;
    c.style.height = `${Math.round(r.height)}px`;
  };

  private title(): void {
    this.game = null;
    this.scene.setFocus('orbit');
    this.scene.setCity(this.cityOf(this.draft.cityId));
    this.sound.setScene('title');
    this.put(
      `<section class="screen center">
        <div class="brand"><h1>IMMIGRANT</h1><p class="sub">A journey, one year at a time</p></div>
        <p class="lede">Move to the United States from one of thirty countries on six continents. Every month brings a decision, and some of them will matter for years.</p>
        <div class="stack">
          ${this.continueButton()}
          <button class="btn${loadJourney() ? '' : ' primary'}" data-act="start">${loadJourney() ? 'Start a new journey' : 'Start a journey'}</button>
          <button class="btn" data-act="help">How it works</button>
          <button class="btn" data-act="settings">Settings</button>
        </div>
        <p class="fine">Seven ways to arrive, thirty home countries, and every year of the road until it ends. Not legal advice. Built from public data, with sources shown in the game.</p>
      </section>`,
      'is-title',
    );
  }

  private chips(name: string, current: string, options: Array<[string, string]>, act: string): string {
    return `<div class="chips" role="group" aria-label="${esc(name)}">${options
      .map(([v, label]) => `<button type="button" class="chip${current === v ? ' on' : ''}" data-act="${act}" data-v="${v}" aria-pressed="${current === v}">${esc(label)}</button>`)
      .join('')}</div>`;
  }

  private setup(step: number): void {
    this.step = Math.min(4, Math.max(1, step));
    this.scene.setFocus('orbit');
    const d = this.draft;
    const dots = [1, 2, 3, 4].map((n) => `<i class="${n === this.step ? 'on' : n < this.step ? 'done' : ''}"></i>`).join('');
    let body = '';
    if (this.step === 1) {
      body = `<h2>Who are you?</h2>
        <label class="field"><span>Name</span><input id="f-name" type="text" maxlength="24" placeholder="Your name" value="${esc(d.name)}" autocomplete="off" /></label>
        <label class="field"><span>Age</span><input id="f-age" type="number" min="18" max="50" value="${d.age}" /></label>
        <div class="field"><span>Sex</span>${this.chips('Sex', d.sex, [['female', 'Female'], ['male', 'Male'], ['other', 'Another / prefer not to say']], 'sex')}</div>
        <div class="field"><span>Relationship status</span>${this.chips('Relationship status', d.marital, [['single', 'Single'], ['partnered', 'In a relationship'], ['married', 'Married']], 'marital')}</div>
        <p class="hint">Players are adults in this build. Married characters bring a spouse on a dependent visa that does not allow work.</p>`;
    } else if (this.step === 2) {
      const cu = cultureOf(d.country);
      body = `<h2>Where from, and how?</h2>
        <div class="field"><span>Country of origin</span>
          ${this.chips('Continent', continentOf(d.country), CONTINENTS.filter((k) => playableCountries(k).length).map((k) => [k, k] as [string, string]), 'continent')}
          <div class="cards small">${playableCountries(continentOf(d.country))
            .map((cid) => {
              const c = cultureOf(cid);
              return `<button class="card${cid === d.country ? ' on' : ''}" type="button" data-act="country" data-v="${cid}" aria-pressed="${cid === d.country}"><b>${esc(c?.name ?? cid)}</b><small>${esc(c?.departureCity ?? '')}</small></button>`;
            })
            .join('')}</div>
        </div>
        <div class="field"><span>How you arrive</span>
          <div class="list">${ROUTES.map((r) => {
            const ready = routeReady(r.id);
            const on = r.id === d.status;
            const extra = cu?.entryNotes?.[r.id];
            return `<button class="row${on ? ' on' : ''}${ready ? '' : ' locked'}" type="button" ${ready ? `data-act="route" data-v="${r.id}"` : 'disabled'} aria-pressed="${on}">
              <b>${esc(r.name)}</b><small>${esc(r.note)}${extra ? ` ${esc(extra)}` : ''}</small>${ready ? '' : '<em>Not available</em>'}</button>`;
          }).join('')}</div>
        </div>
        <p class="hint">Every route is open to every country, with consequences drawn from public rules. Entry without inspection is shown through data and consequences only.</p>`;
    } else if (this.step === 3) {
      const yrs: string[] = [];
      for (let y = 2015; y <= 2026; y++) yrs.push(`<option value="${y}"${y === d.arrivalYear ? ' selected' : ''}>${y}</option>`);
      body = `<h2>Where do you land?</h2>
        <div class="field"><span>Arrival city</span>
          <div class="cards">${CITIES.map((c) => {
            const shared = srcNum(c.rentSharedRoom, 900);
            const commute = srcNum(c.avgCommuteMin, 28);
            return `<button class="card${c.id === d.cityId ? ' on' : ''}" type="button" data-act="city" data-v="${c.id}" aria-pressed="${c.id === d.cityId}">
              <b>${esc(c.name)}</b><small>Shared room ${money(shared.value)}/mo ${est(shared.estimate)} · commute ${Math.round(commute.value)} min ${est(commute.estimate)}</small></button>`;
          }).join('')}</div>
        </div>
        <label class="field"><span>Year you arrive (2015 to 2026)</span><select id="f-year">${yrs.join('')}</select></label>
        ${blockedReason(d.country, d.arrivalYear, d.status) ? `<p class="hint warn">${esc(blockedReason(d.country, d.arrivalYear, d.status) ?? '')}</p>` : ''}
        ${ROUTES.find((r) => r.id === d.status)?.usesStudentFunding === false ? '' : `<div class="field"><span>How you pay</span>${this.chips('Funding', d.funding, [['family', 'Family savings'], ['loan', 'Education loan'], ['scholarship', 'Scholarship'], ['assistantship', 'Assistantship']], 'funding')}</div>`}
        <div class="field"><span>Where you live</span>${this.chips('Housing', d.housing, [['shared', 'Shared apartment'], ['studio', 'Your own studio'], ['relatives', 'With relatives']], 'housing')}</div>
        <div class="field"><span>Lifestyle</span>${this.chips('Lifestyle', d.lifestyle, [['frugal', 'Frugal'], ['balanced', 'Balanced'], ['comfortable', 'Comfortable']], 'lifestyle')}</div>
        ${this.budgetPreview(d)}`;
    } else {
      const city = this.cityOf(d.cityId);
      body = `<h2>Ready?</h2>
        <div class="review">
          <p><b>${esc(d.name || 'Traveler')}</b>, ${d.age}, from ${esc(cultureOf(d.country)?.name ?? 'home')}, arriving in <b>${esc(city.name)}</b> in <b>${d.arrivalYear}</b>: <b>${esc(ROUTES.find((r) => r.id === d.status)?.name ?? 'F-1 student')}</b>.</p>
          <p>${ROUTES.find((r) => r.id === d.status)?.usesStudentFunding === false ? 'Starting with your savings' : esc(d.funding === 'family' ? 'Funded by family savings' : d.funding === 'loan' ? 'Funded by an education loan' : d.funding === 'scholarship' ? 'On a scholarship' : 'On an assistantship')}, living ${d.housing === 'shared' ? 'in a shared apartment' : d.housing === 'studio' ? 'in your own studio' : 'with relatives'}.</p>
        </div>
        <div class="field"><span>Reality setting</span>
          ${this.chips('Reality', d.reality, [['hopeful', 'Hopeful'], ['honest', 'Honest'], ['hard', 'Hard realism']], 'reality')}
          <p class="hint">${esc(REALITY_TEXT[d.reality])} The setting changes the odds, never the facts.</p>
        </div>
        <details class="field names"${Object.values(d.names ?? {}).some(Boolean) ? ' open' : ''}>
          <summary>Name the people in your life (optional)</summary>
          <p class="hint">They appear in scenes and conversations. Leave a box empty for a random name.</p>
          ${(
            [
              ['roommate', 'Roommate'],
              ['friend', 'Close friend'],
              ['partner', 'Partner or date'],
              ['classmate', 'Classmate'],
              ['sibling', 'Brother or sister'],
            ] as const
          )
            .map(
              ([k, label]) =>
                `<label class="field row"><span>${label}</span><input id="f-n-${k}" type="text" maxlength="16" autocomplete="off" placeholder="Random" value="${esc(d.names?.[k] ?? '')}" /></label>`,
            )
            .join('')}
        </details>
        ${blockedReason(d.country, d.arrivalYear, d.status) ? `<p class="hint warn">${esc(blockedReason(d.country, d.arrivalYear, d.status) ?? '')}</p>` : ''}
        <p class="hint">A journey runs one year at a time until it ends: at the oath of citizenship, at removal, or when you go home. That can take many years. Money figures marked "est." are designed estimates. Rules are drawn from public sources and are not legal advice.</p>`;
    }
    this.put(
      `<section class="screen wizard">
        <div class="panel">
          <div class="dots" aria-label="Step ${this.step} of 4">${dots}</div>
          ${body}
          <div class="actions">
            ${this.step > 1 ? '<button class="btn" data-act="back">Back</button>' : '<button class="btn ghost" data-act="title">Cancel</button>'}
            ${this.step < 4 ? '<button class="btn primary" data-act="next">Continue</button>' : `<button class="btn primary" data-act="begin"${this.step === 4 && blockedReason(d.country, d.arrivalYear, d.status) ? ' disabled' : ''}>Begin the journey</button>`}
          </div>
        </div>
      </section>`,
      'is-setup',
    );
  }

  private begin(sameProfile = false): void {
    if (!sameProfile) this.draft.name = this.draft.name.trim();
    if (!routeReady(this.draft.status)) this.draft.status = 'F1';
    if (blockedReason(this.draft.country, this.draft.arrivalYear, this.draft.status)) return this.setup(4);
    if (!playableCountries().includes(this.draft.country)) this.draft.country = 'india';
    const profile: Profile = { ...this.draft, name: this.draft.name || 'Traveler' };
    this.applyCulture(profile);
    saveJson(PROFILE_KEY, this.draft);
    this.game = new Game(profile);
    this.result = null;
    this.scene.setCity(this.cityOf(profile.cityId));
    this.scene.setMonth(7);
    this.commuteScreen();
  }

  private applyCulture(profile: Profile): void {
    const cu = cultureOf(profile.country);
    if (cu) {
      setBoardLine(cu.airportBoardLine);
      // Family on screen shares the player's home.
      ROLE_LOOKS.parent.skin = cu.skinTones[1] ?? ROLE_LOOKS.parent.skin;
      ROLE_LOOKS.spouse.skin = cu.skinTones[3] ?? ROLE_LOOKS.spouse.skin;
      ROLE_LOOKS.parent.outfit = profile.country === 'india' ? 'kurta' : undefined;
    }
  }

  // ---------------------------------------------------------------- pause, save and carry on

  /** Stop the clock everywhere (scene, voices, music, the evening timer) and show the pause card. */
  private setPaused(on: boolean): void {
    if (on === this.paused || (on && !this.game)) return;
    this.paused = on;
    this.scene.setPaused(on);
    this.talk.setPaused(on);
    this.sound.setPaused(on);
    document.getElementById('pause-veil')?.remove();
    if (!on) return;
    const veil = document.createElement('div');
    veil.id = 'pause-veil';
    veil.className = 'pause-veil';
    veil.setAttribute('role', 'dialog');
    veil.setAttribute('aria-modal', 'true');
    veil.setAttribute('aria-label', 'Paused');
    veil.innerHTML = `<div class="panel pause-card">
        <h2>Paused</h2>
        <p>Everything is on hold, right where you left it. Your journey is also saved, so you can close the game and carry on later.</p>
        <div class="stack">
          <button class="btn primary" data-act="resume">Continue</button>
          <button class="btn" data-act="settings">Settings</button>
          <button class="btn ghost" data-act="save-quit">Save and return to title</button>
        </div>
        <p class="fine">Press Esc or P to pause and continue.</p>
      </div>`;
    this.root.appendChild(veil);
    (veil.querySelector('[data-act="resume"]') as HTMLElement | null)?.focus();
  }

  /** Save the journey as it stands at the start of the current card (choices on it are made again). */
  private saveJourney(): void {
    const g = this.game;
    if (!g) return;
    if (g.state.ended && !g.canContinue) return clearJourney();
    const st = g.state;
    const out: SavedJourney = { v: 1, savedAt: Date.now(), state: { ...st, schedule: st.schedule.map((i) => ({ ...i, def: i.def.id })) } };
    saveJson(JOURNEY_KEY, out);
  }

  private continueButton(): string {
    const j = loadJourney();
    if (!j) return '';
    const st = j.state;
    const it = st.schedule[st.index];
    const when = it ? slotLabel(st.profile, { ...it, def: ALL_CARDS[0] }) : `Year ${st.year + 1}`;
    return `<button class="btn primary" data-act="resume-journey">Continue your journey<small>${esc(st.profile.name)}, year ${st.year + 1}, ${esc(when)}</small></button>`;
  }

  private resumeJourney(): void {
    const j = loadJourney();
    if (!j) return this.title();
    const byId = new Map(ALL_CARDS.map((d) => [d.id, d]));
    const schedule: ScheduleItem[] = [];
    for (const i of j.state.schedule) {
      const def = byId.get(i.def);
      // A card that no longer exists means the save is from an older build; start fresh rather than break.
      if (!def) {
        clearJourney();
        return this.title();
      }
      schedule.push({ ...i, def });
    }
    let g: Game;
    try {
      g = new Game(j.state.profile, (j.state.seed + j.state.index * 7919) % 1e9);
    } catch {
      clearJourney();
      return this.title();
    }
    g.state = { ...j.state, schedule };
    this.draft = { ...this.draft, ...j.state.profile };
    this.applyCulture(g.state.profile);
    this.game = g;
    this.result = null;
    this.pendingPivot = null;
    this.scene.setCity(this.cityOf(g.state.profile.cityId));
    this.scene.setCommute(g.state.profile.commute);
    this.showChallenge();
  }

  private commuteScreen(): void {
    const g = this.game;
    if (!g) return;
    this.scene.setFocus('orbit');
    const p = g.state.profile;
    this.put(
      `<section class="screen wizard">
        <div class="panel wide">
          <h2>How will you get to campus?</h2>
          <p class="hint">${esc(getCity(p.cityId).name)}. Your commute costs money every month and wears on your wellbeing, or helps it. Tap Preview to watch the trip.</p>
          <div class="cards commute">${COMMUTES.map((m) => {
            const info = commuteInfo(p, m);
            return `<div class="card${p.commute === m ? ' on' : ''}">
              <b>${COMMUTE_NAME[m]}</b>
              <small>${money(info.cost)}/month ${est(info.estimate)} · about ${info.minutesOneWay} min each way</small>
              <small>${esc(info.summary)} Wellbeing ${info.wellbeingPerMonth >= 0 ? '+' : ''}${info.wellbeingPerMonth} a month.</small>
              <span class="row2"><button class="btn small" data-act="preview" data-v="${m}">Preview</button><button class="btn small primary" data-act="commute" data-v="${m}">Choose</button></span>
            </div>`;
          }).join('')}</div>
        </div>
      </section>`,
      'is-setup',
    );
  }

  private async previewCommute(mode: CommuteMode): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    this.root.classList.add('previewing');
    this.scene.setCommute(mode);
    this.sound.setScene('transit');
    await this.scene.playCommute(3200, this.game?.state.profile);
    this.scene.showCity();
    this.sound.setScene('city');
    this.scene.setFocus('orbit');
    this.root.classList.remove('previewing');
    this.busy = false;
  }

  private pickCommute(mode: CommuteMode): void {
    if (!this.game) return;
    this.game.state.profile.commute = mode;
    this.scene.setCommute(mode);
    this.showChallenge();
  }

  // ---------------------------------------------------------------- play

  private hud(): string {
    const g = this.game;
    if (!g) return '';
    const s = g.state.stats;
    const f = g.state.flags;
    const item = g.item;
    const label = item ? slotLabel(g.state.profile, item) : '';
    const keys = ['study', 'career', 'family', 'wellbeing', 'community'] as const;
    const studying = statusOf(g.state) === 'F1';
    const short: Record<(typeof keys)[number], string> = { study: studying ? 'Study' : 'Skills', career: 'Career', family: 'Family', wellbeing: 'Wellbeing', community: 'Community' };
    const bar = (k: (typeof keys)[number]): string => {
      const v = Math.round(s[k]);
      const text = k === 'study' && studying ? gpaOf(s.study).toFixed(1) : String(v);
      return `<div class="stat ${v < 30 ? 'low' : ''}" title="${k === 'study' && !studying ? 'Skills' : STAT_LABEL[k]}: ${text}"><span>${short[k]}</span><div class="bar"><i style="width:${v}%"></i></div></div>`;
    };
    const st = STATUS_MAP.get(statusOf(g.state));
    void f;
    const pills = st ? `<span class="pill${st.lawful ? (st.code === 'LPR' || st.code === 'CITIZEN' ? ' good' : '') : ' bad'}">${esc(st.label)}</span>` : '';
    const hard = g.state.flags.hardTimes ? '<span class="pill bad">No fixed home</span>' : '';
    return `<header class="hud">
      <div class="when"><b>${esc(label)}</b><span>Year ${g.state.year + 1} · ${Math.min(g.state.index + 1, g.total)} of ${g.total}${pills}${hard}</span></div>
      <div class="cash" data-act="ledger" role="button" tabindex="0" title="See where your money went this month"><b class="${s.money < 0 ? 'neg' : ''}">${money(s.money)}</b>${g.state.debt > 0 ? `<small>Debt ${money(g.state.debt)}</small>` : ''}</div>
      <div class="hud-btns"><button class="icon" data-act="pause" aria-label="Pause" title="Pause (Esc)">❚❚</button><button class="icon" data-act="settings" aria-label="Settings">⚙</button></div>
      <div class="bars">${keys.map(bar).join('')}</div>
    </header>`;
  }

  /** Monthly income and bills for the chosen setup, with a plain warning when it runs a deficit. */
  private budgetPreview(d: Profile): string {
    // Preview with the route's starting status and flags, so a worker sees pay and a visitor sees no wages.
    const route = ROUTES.find((r) => r.id === d.status);
    const lines = monthlyBudget(d, { status: route?.startStatus ?? 'F1', ...(route?.startFlags ?? {}) });
    const net = netMonthly(lines);
    const start = route && route.usesStudentFunding === false ? route.startMoney ?? 3000 : START_MONEY[d.funding];
    const rows = lines
      .map((l) => `<tr><td>${esc(l.label)} ${est(l.estimate)}</td><td class="${l.amount >= 0 ? 'up' : 'down'}">${money(l.amount)}</td></tr>`)
      .join('');
    const verdict =
      net >= 0
        ? `<p class="hint">This setup roughly breaks even or saves ${money(net)} a month, before surprises.</p>`
        : `<p class="hint warn">This setup spends ${money(-net)} more than it brings in each month. Your starting ${money(start)} would last about ${Math.max(1, Math.floor(start / -net))} months. ${route?.usesStudentFunding === false ? 'A cheaper home or a frugal lifestyle can close the gap.' : 'A cheaper home, a frugal lifestyle or a campus job can close the gap.'}</p>`;
    return `<div class="field"><span>Your monthly budget (estimate; commute shown as ${esc(d.commute)}, chosen next)</span>
      <table class="statement">${rows}<tr class="total"><td>Net per month</td><td class="${net >= 0 ? 'up' : 'down'}">${money(net)}</td></tr></table>${verdict}</div>`;
  }

  /** Opening balance, every itemised change, closing balance. The numbers always add up. */
  private statementTable(st: Statement, budget: BudgetLine[] = []): string {
    const row = (label: string, amount: number, cls = ''): string =>
      `<tr class="${cls}"><td>${label}</td><td class="${amount >= 0 ? 'up' : 'down'}">${money(amount)}</td></tr>`;
    const estOf = (label: string): string => {
      const b = budget.find((x) => x.label === label);
      return b ? ` ${est(b.estimate)}` : '';
    };
    const groups: Array<[string, 'event' | 'help' | 'evening' | 'monthly']> = [
      ['Decisions and events', 'event'],
      ['Emergency help', 'help'],
      ['Evenings and activities', 'evening'],
      ['Monthly income and bills', 'monthly'],
    ];
    let html = `<table class="statement">${row('Opening balance', st.opening, 'open')}`;
    for (const [title, kind] of groups) {
      const lines = st.lines.filter((l) => l.kind === kind);
      if (!lines.length) continue;
      const sum = lines.reduce((a, l) => a + l.amount, 0);
      html += `<tr class="group"><td>${title}</td><td class="${sum >= 0 ? 'up' : 'down'}">${money(sum)}</td></tr>`;
      for (const l of lines) html += row(`${esc(l.label)}${kind === 'monthly' ? estOf(l.label) : ''}`, l.amount, 'item');
    }
    if (st.other) html += row('Other adjustments', st.other, 'item');
    html += `${row('Closing balance', st.closing, 'total')}</table>`;
    const g = this.game;
    if (g && g.state.debt > 0 && st.lines.some((l) => l.label.toLowerCase().includes('loan'))) {
      html += `<p class="hint">Loan money counts as income here but is also debt you will repay: ${money(g.state.debt)} so far.</p>`;
    }
    return html;
  }

  private startNextYear(): void {
    const g = this.game;
    if (!g || !g.canContinue) return;
    g.nextYear();
    this.result = null;
    this.pendingPivot = null;
    this.scene.setMonth(8);
    this.showChallenge();
  }

  private factHtml(f: Fact | null): string {
    if (!f) return '';
    const link = f.source.startsWith('http') ? `<a href="${esc(f.source)}" target="_blank" rel="noopener noreferrer">source</a>` : '';
    return `<aside class="fact"><b>Did you know?</b> <span>${esc(f.title)}. ${esc(f.text)}</span>
      <small>${link} <span class="conf conf-${esc(String(f.confidence).toLowerCase())}">${esc(String(f.confidence))}</span>${f.estimate ? ' <span class="est">est.</span>' : ''}</small></aside>`;
  }

  private showChallenge(): void {
    const g = this.game;
    if (!g) return;
    const ch = g.challenge;
    const item = g.item;
    if (!ch || !item) return this.summary();
    this.result = null;
    this.saveJourney();
    this.scene.setMonth(item.month < 0 ? 7 : (7 + item.month) % 12);
    this.scene.showStage(ch.stage ?? 'campus', ch.cast ?? [{ role: 'player' }], g.state.profile);
    this.sound.setScene(ch.stage ?? 'campus');
    const showOdds = this.settings.showOdds;
    const choices = ch.choices
      .map((c: Choice) => {
        const o = showOdds ? g.odds(c) : null;
        const odd = o ? `<span class="odds odds-${Math.floor(o.pct / 20)}">${odds(o.pct)} · ${o.pct}%</span>` : '';
        const why = o ? `<details class="why"><summary>Why these odds?</summary><ul>${o.parts.map((p) => `<li>${esc(p)}</li>`).join('')}</ul></details>` : '';
        return `<div class="choice"><button class="btn choose" data-act="choose" data-v="${esc(c.id)}"><span class="lbl">${esc(c.label)}</span>${c.note ? `<small>${esc(c.note)}</small>` : ''}${odd}</button>${why}</div>`;
      })
      .join('');
    const fact = ch.inlineFact ?? factFor(g.state.profile.country, ch.fact);
    this.put(
      `${this.hud()}
      <section class="screen play"><article class="panel card-main track-${ch.track}">
        <div class="kicker"><span class="tag">${esc(ch.track === 'big' ? 'Big moment' : ch.track)}</span><span>${esc(slotLabel(g.state.profile, item))}</span></div>
        <h2>${esc(ch.title)}</h2>
        <p class="body">${esc(ch.lines ? ch.narration ?? '' : ch.body)}</p>
        ${ch.lines ? '<ol class="talk-log" hidden aria-live="polite"></ol>' : ''}
        ${this.factHtml(fact)}
        <div class="choices">${choices}</div>
      </article></section>`,
      'is-play',
    );
    if (ch.lines) void this.talk.play(ch.lines, this.root.querySelector('.talk-log'));
  }

  private choose(id: string): void {
    const g = this.game;
    if (!g || this.busy || this.result) return;
    const res = g.choose(id);
    this.result = res;
    this.sound.choose();
    window.setTimeout(() => this.sound.step2(), 140);
    const ch = g.challenge;
    const item = g.item;
    if (!ch || !item) return;
    const budget = res.statement
      ? `<details class="budget" open><summary>Month statement: ${money(res.statement.opening)} to ${money(res.statement.closing)}</summary>${this.statementTable(res.statement, res.budget)}</details>`
      : '';
    const aside = res.comment ? `<p class="aside">${esc(res.comment)}</p>` : '';
    const ending = res.ending ? `<p class="endnote">Something has changed for good. This is where this journey turns.</p>` : '';
    this.put(
      `${this.hud()}
      <section class="screen play"><article class="panel card-main result">
        <div class="kicker"><span class="tag">${esc(ch.title)}</span><span>${esc(slotLabel(g.state.profile, item))}</span></div>
        <p class="body reaction">${esc(res.text)}</p>
        ${aside}
        ${budget}
        ${ending}
        <div class="actions"><button class="btn primary" data-act="continue">${res.ending ? 'See what happened' : 'Continue'}</button></div>
      </article></section>`,
      'is-play',
    );
  }

  private async next(): Promise<void> {
    const g = this.game;
    if (!g || this.busy) return;
    if (this.result?.ending) return this.summary();
    g.advance();
    if (g.finished) return this.summary();
    const item = g.item;
    if (item && item.month >= 0 && item.slot === 0) {
      this.busy = true;
      const info = commuteInfo(g.state.profile, g.state.profile.commute);
      this.put(
        `${this.hud()}<section class="screen play"><div class="transit-note panel"><b>${esc(monthLabel(g.state.profile, item.month))}</b>
          <span>${COMMUTE_NAME[g.state.profile.commute]} to campus, about ${info.minutesOneWay} minutes</span></div></section>`,
        'is-transit',
      );
      this.scene.setMonth((7 + item.month) % 12);
      await this.scene.playCommute(1800, g.state.profile);
      this.busy = false;
    }
    this.showChallenge();
  }

  // ---------------------------------------------------------------- crossroads and evenings

  private afterResult(): void {
    const g = this.game;
    if (!g || this.busy) return;
    const res = this.result;
    if (res?.ending) return this.summary();
    if (res?.pivot) return this.crossroads(res.pivot);
    this.toEvening();
  }

  /** Between one task and the next there is an evening to spend (unless switched off). */
  private toEvening(): void {
    const g = this.game;
    if (!g) return;
    if (this.settings.interlude === 'off' || g.state.index + 1 >= g.total) {
      void this.next();
      return;
    }
    this.eveningMenu();
  }

  private crossroads(pivot: Pivot): void {
    const g = this.game;
    if (!g) return;
    this.pendingPivot = pivot;
    this.scene.showStage(pivot.stage, [{ role: 'player', pose: 'think' }], g.state.profile);
    this.sound.setScene(pivot.stage);
    const opts = pivot.options
      .map(
        (o) =>
          `<div class="choice"><button class="btn choose" data-act="pivot" data-v="${esc(o.id)}"><span class="lbl">${esc(o.label)}</span>${o.note ? `<small>${esc(o.note)}</small>` : ''}</button></div>`,
      )
      .join('');
    this.put(
      `${this.hud()}
      <section class="screen play"><article class="panel card-main crossroads">
        <div class="kicker"><span class="tag">A turning point</span><span></span></div>
        <h2>${esc(pivot.title)}</h2>
        <p class="body">${esc(pivot.body)}</p>
        <div class="choices">${opts}</div>
      </article></section>`,
      'is-play',
    );
  }

  private resolveCrossroads(id: string): void {
    const g = this.game;
    const pivot = this.pendingPivot;
    if (!g || !pivot) return;
    this.pendingPivot = null;
    const ending = g.resolvePivot(pivot, id);
    this.result = null;
    if (ending) return this.summary();
    this.toEvening();
  }

  private eveningMenu(): void {
    const g = this.game;
    if (!g) return;
    this.result = null;
    this.scene.showCity();
    this.sound.setScene('city');
    const rng = createSeededRandom(g.state.seed + g.state.index * 31 + 7);
    const options = pickActivities(g.state, rng, 3);
    const list = options
      .map(
        (a) =>
          `<div class="choice"><button class="btn choose" data-act="activity" data-v="${esc(a.id)}"><span class="lbl">${esc(a.label)}</span><small>${esc(blurbOf(a, g.state))}</small></button></div>`,
      )
      .join('');
    this.put(
      `${this.hud()}
      <section class="screen play"><article class="panel card-main evening">
        <div class="kicker"><span class="tag">Between tasks</span><span>The evening is yours</span></div>
        <h2>Nothing is due tonight</h2>
        <p class="body">The day is over. How do you spend the evening?</p>
        <div class="choices">${list}</div>
        <div class="actions"><button class="btn ghost" data-act="skip-evening">Skip to the next day</button></div>
      </article></section>`,
      'is-play',
    );
  }

  private startActivity(id: string): void {
    const g = this.game;
    const a = ACTIVITIES.find((x) => x.id === id);
    if (!g || !a) return;
    this.currentActivity = a;
    const script = pickScript(a, g.state, createSeededRandom(g.state.seed + g.state.index * 13 + this.activityCount++ * 101 + 5));
    const lines = script.lines.map((l) => fill(l, g.state));
    const cast = script.cast ?? a.cast;
    const withText = script.with ?? withLine(cast, g.state);
    this.scene.showStage(a.stage, cast, g.state.profile, undefined, a.variant);
    this.sound.setScene(a.stage);
    const seconds = ({ off: 0, short: 20, normal: 45, long: 90 } as const)[this.settings.interlude] || 45;
    this.put(
      `${this.hud()}
      <section class="screen play"><article class="panel card-main evening playing">
        <div class="kicker"><span class="tag">Between tasks</span><span>${esc(a.label)}</span></div>
        ${withText ? `<p class="aside">${esc(withText)}</p>` : ''}
        <p class="caption in" id="cap">${esc(lines[0])}</p>
        <div class="progress"><i id="prog"></i></div>
        <div class="actions"><button class="btn ghost" id="skip-btn" data-act="skip-interlude" hidden>Skip</button></div>
      </article></section>`,
      'is-play',
    );
    window.clearInterval(this.interludeTimer);
    let last = performance.now();
    let t = 0;
    let shown = 0;
    this.interludeTimer = window.setInterval(() => {
      const now = performance.now();
      if (!this.paused) t += (now - last) / 1000;
      last = now;
      const frac = Math.min(1, t / seconds);
      const prog = document.getElementById('prog');
      if (prog) prog.style.width = `${Math.round(frac * 100)}%`;
      const idx = Math.min(lines.length - 1, Math.floor(frac * lines.length));
      const cap = document.getElementById('cap');
      if (cap && idx !== shown) {
        shown = idx;
        cap.textContent = lines[idx];
        cap.classList.remove('in');
        void cap.offsetWidth;
        cap.classList.add('in');
      }
      const skip = document.getElementById('skip-btn');
      if (skip && t > 5) skip.hidden = false;
      if (frac >= 1) this.finishInterlude();
    }, 120);
  }

  private finishInterlude(): void {
    window.clearInterval(this.interludeTimer);
    this.interludeTimer = 0;
    const g = this.game;
    const a = this.currentActivity;
    if (!g || !a) return;
    this.currentActivity = null;
    g.logActivity(a);
    const extra = a.after?.(g.state, createSeededRandom(g.state.seed + g.state.index * 17 + 3)) ?? null;
    if (extra?.effects) g.applyDirect(extra.effects);
    const note = fill(extra?.text ?? 'You feel the evening settle into you.', g.state);
    this.put(
      `${this.hud()}
      <section class="screen play"><article class="panel card-main evening">
        <div class="kicker"><span class="tag">Between tasks</span><span>${esc(a.label)}</span></div>
        <p class="body reaction">${esc(note)}</p>
        <div class="actions"><button class="btn primary" data-act="interlude-done">A new day</button></div>
      </article></section>`,
      'is-play',
    );
  }

  // ---------------------------------------------------------------- summary

  private summary(): void {
    const g = this.game;
    if (!g) return;
    // A finished journey has nothing to carry on; a year-end one waits for the next year.
    if (g.canContinue) this.saveJourney();
    else clearJourney();
    this.scene.showCity();
    this.sound.setScene('city');
    const e: Ending = g.summaryEnding();
    const s = g.state.stats;
    const f = g.state.flags;
    const atRisk = Boolean(f.unauthWork || f.droppedLoad || f.missedCheckIn);
    const stDef = STATUS_MAP.get(statusOf(g.state));
    const standing = !stDef?.lawful ? 'No status' : atRisk || s.legal < 55 ? 'At risk' : 'Secure';
    const scope = g.state.ended ? g.state.log : g.state.log.filter((l) => (l.year ?? 0) === g.state.year);
    const moments = [...scope]
      .map((l) => ({ l, weight: Object.values(l.deltas).reduce((a, b) => a + Math.abs(b ?? 0), 0) }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 3);
    const lookbacks = scope.filter((l) => l.lookback);
    const looking = lookbacks.length
      ? `<h3>Looking back</h3><p class="hint">Nobody tells you the consequences when you decide. Here is what some of your choices really meant.</p>
         <ul class="lookback">${lookbacks.map((l) => `<li><b>${esc(l.title)}</b><small>You chose: ${esc(l.choice)}</small><p>${esc(l.lookback ?? '')}</p></li>`).join('')}</ul>`
      : '<h3>Looking back</h3><p class="hint">Nothing you chose this year turned into a problem. That is not guaranteed next year.</p>';
    const yearNo = g.state.year + 1;
    const nextText = STATUS_MAP.get(statusOf(g.state))?.next ?? '';
    const forks = g.state.ended
      ? ''
      : `<div class="forks"><h3>Where the road goes next</h3><p class="hint">${esc(nextText)}${
          g.canContinue ? ` Year ${yearNo + 1} is waiting. Your money, standing, debt and choices carry over, and prices keep rising.` : ''
        }</p></div>`;
    const help =
      g.state.ended
        ? '<p class="hint">If this feels familiar: free and low-cost immigration legal help exists. Look for a licensed attorney or an accredited organization, and be wary of anyone who promises guaranteed results.</p>'
        : '';
    this.put(
      `${this.hud()}
      <section class="screen play"><article class="panel card-main summary ${e.kind}">
        <div class="kicker"><span class="tag">${g.state.ended ? 'Journey ended' : `Year ${yearNo} complete`}</span><span>${esc(g.state.profile.name)}, ${esc(getCity(g.state.profile.cityId).name)}, ${g.state.startYear + g.state.year}</span></div>
        <h2>${esc(e.title)}</h2>
        <p class="body">${esc(e.text)}</p>
        <div class="grid3">
          ${statusOf(g.state) === 'F1' ? `<div><b>${gpaOf(s.study).toFixed(2)}</b><span>GPA</span></div>` : `<div><b>${esc(stDef?.label ?? '')}</b><span>status</span></div>`}
          <div><b class="${s.money < 0 ? 'neg' : ''}">${money(s.money)}</b><span>money</span></div>
          <div><b>${money(g.state.debt)}</b><span>debt</span></div>
          <div><b>${esc(standing)}</b><span>status standing</span></div>
          <div><b>${Math.round(s.wellbeing)}</b><span>wellbeing</span></div>
          <div><b>${g.state.log.length}</b><span>decisions</span></div>
        </div>
        ${looking}
        <h3>Moments that shaped ${g.state.ended ? 'your journey' : 'this year'}</h3>
        <ol class="moments">${moments.map(({ l }) => `<li><b>${esc(l.title)}</b><small>${esc(l.choice)}</small></li>`).join('')}</ol>
        ${e.tips.length ? `<ul class="tips">${e.tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
        ${help}
        ${forks}
        <div class="actions">
          ${g.canContinue ? `<button class="btn primary" data-act="nextyear">Begin year ${yearNo + 1}</button>` : ''}
          <button class="btn${g.canContinue ? '' : ' primary'}" data-act="again">Replay this journey</button>
          <button class="btn" data-act="newjourney">New journey</button>
          <button class="btn" data-act="share">Copy summary</button>
          <button class="btn ghost" data-act="title">Title</button>
        </div>
      </article></section>`,
      'is-play',
    );
    if (e.kind === 'success') this.sound.pass();
    else this.sound.fail();
  }

  private async share(): Promise<void> {
    const g = this.game;
    if (!g) return;
    const e = g.summaryEnding();
    const p = g.state.profile;
    const text = `Immigrant: ${p.name}, from ${cultureOf(p.country)?.name ?? 'home'} to ${getCity(p.cityId).name} in ${g.state.startYear} (${ROUTES.find((r) => r.id === p.status)?.name ?? 'F-1 student'}). Year ${g.state.year + 1}: ${e.title}. ${g.state.log.length} decisions made.`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard may be blocked in some contexts.
    }
  }

  // ---------------------------------------------------------------- modals

  private modal(kind: 'help' | 'settings' | 'ledger'): void {
    this.closeModal();
    let inner = '';
    if (kind === 'help') {
      inner = `<h2>How it works</h2>
        <ul class="tips">
          <li>Each year is twelve months with three decisions a month, and evenings between them. After each year you can continue into the next, up to four years in this build.</li>
          <li>Every risky choice shows its odds and why. The Reality setting nudges the odds, never the facts.</li>
          <li>Your status is a thing you protect. Some tempting choices, such as unauthorized work or dropping courses, can end your student record.</li>
          <li>Money figures marked "est." are designed estimates. Sourced facts show where they come from and how sure we are.</li>
          <li>This is a game built from public information. It is not legal advice.</li>
        </ul>
        <p class="hint">Made by ComplyRim. Open-source code and asset licences on <a href="https://github.com/Complyrim/immigrant" target="_blank" rel="noopener noreferrer">GitHub</a>.</p>`;
    } else if (kind === 'ledger') {
      const g = this.game;
      inner = g
        ? `<h2>Money this month</h2><p class="hint">Every change since the last month-end, so the balance always adds up. Bills and income are added at the end of each month.</p>${this.statementTable(g.statementNow(), monthlyBudget(g.state.profile, g.state.flags))}`
        : '<h2>Money</h2>';
    } else {
      inner = `<h2>Settings</h2>
        <label class="field row"><span>Music</span><input id="s-music" type="range" min="0" max="100" value="${Math.round(this.settings.music * 100)}" /></label>
        <label class="field row"><span>Effects</span><input id="s-sfx" type="range" min="0" max="100" value="${Math.round(this.settings.sfx * 100)}" /></label>
        <div class="field row"><span>Reduce motion</span><button class="btn small${this.settings.reduceMotion ? ' primary' : ''}" data-act="toggle-motion" aria-pressed="${this.settings.reduceMotion}">${this.settings.reduceMotion ? 'On' : 'Off'}</button></div>
        <div class="field row"><span>Scene art</span><button class="btn small" data-act="toggle-painted">${this.settings.painted === false ? '3D rooms' : 'Painted scenes'}</button></div>
        <div class="field row"><span>Voices</span><button class="btn small" data-act="toggle-voices">${({ all: 'Recorded and device', recorded: 'Recorded only', off: 'Off' } as const)[this.settings.voices ?? 'all']}</button></div>
        <div class="field row"><span>Between-task scenes</span><button class="btn small" data-act="toggle-interlude">${({ off: 'Off', short: 'Short', normal: 'Normal', long: 'Long' } as const)[this.settings.interlude]}</button></div>
        <div class="field row"><span>Show odds hints (learning mode)</span><button class="btn small${this.settings.showOdds ? ' primary' : ''}" data-act="toggle-odds" aria-pressed="${this.settings.showOdds}">${this.settings.showOdds ? 'On' : 'Off'}</button></div>
        <div class="field row"><span>Saved settings</span><button class="btn small danger" data-act="reset">Reset</button></div>`;
    }
    const el = document.createElement('div');
    el.className = 'modal';
    el.id = 'modal';
    el.innerHTML = `<div class="sheet panel" role="dialog" aria-modal="true">${inner}<div class="actions"><button class="btn primary" data-act="close">Close</button></div></div>`;
    this.root.appendChild(el);
  }

  private closeModal(): void {
    document.getElementById('modal')?.remove();
  }

  private resetSave(): void {
    try {
      localStorage.removeItem(SETTINGS_KEY);
      localStorage.removeItem(PROFILE_KEY);
      localStorage.removeItem(JOURNEY_KEY);
    } catch {
      // Ignore blocked storage.
    }
    this.settings = { music: 0.5, sfx: 0.7, reduceMotion: false, showOdds: false, interlude: 'normal' };
    this.sound.setVolumes(this.settings.music, this.settings.sfx);
    this.modal('settings');
  }

  // ---------------------------------------------------------------- test helpers (?debug)

  quickStart(partial: Partial<Profile> = {}): void {
    this.draft = { ...this.draft, name: 'Test', ...partial };
    this.begin();
    this.pickCommute(this.draft.commute);
  }

  get currentGame(): Game | null {
    return this.game;
  }

  get realityMod(): number {
    return REALITY_MOD[this.draft.reality];
  }

  monthlyNet(): number {
    return this.game ? netMonthly(monthlyBudget(this.game.state.profile, this.game.state.flags)) : 0;
  }
}
