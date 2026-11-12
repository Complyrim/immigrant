import { createSeededRandom } from '../utils/random';
import { ALL_CARDS as CHALLENGES, ROUTE_MAP, ROUTES, STATUS_MAP } from './content/index';
import { monthsSinceArrival, statusOf } from './routes';
import { borrowedPerMonth, commuteInfo, monthlyBudget, START_MONEY } from './economy';
import type {
  Challenge,
  ChallengeDef,
  Choice,
  Effects,
  Ending,
  GameState,
  LedgerEntry,
  LogEntry,
  Outcome,
  Pivot,
  PivotOption,
  Profile,
  ResultView,
  ScheduleItem,
  Statement,
  StatKey,
  Stats,
  Track,
} from './types';

/** Cards used as arrival-day cards are never drawn at random later. */
const ARRIVAL_IDS = new Set(ROUTES.flatMap((r) => r.arrival));

/** Whether a card fits the player right now: status, country, month and its own condition. */
export function fits(d: ChallengeDef, state: GameState, month?: number): boolean {
  if (d.weight <= 0 || ARRIVAL_IDS.has(d.id)) return false;
  const st = statusOf(state);
  if (d.statuses && !d.statuses.includes(st)) return false;
  if (d.countries && !d.countries.includes(state.profile.country)) return false;
  if (month !== undefined && d.months && !d.months.includes(month)) return false;
  return !d.when || d.when(state);
}
const ENFORCE_CHANCE = { hopeful: 0.006, honest: 0.012, hard: 0.028 } as const;

export const REALITY_MOD = { hopeful: 8, honest: 0, hard: -8 } as const;
const DETECT_CHANCE = { hopeful: 0.03, honest: 0.06, hard: 0.1 } as const;
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));
const STAT_KEYS: StatKey[] = ['study', 'career', 'legal', 'family', 'wellbeing', 'community'];

/** Month index 0 is August of the arrival year; -1 is arrival day. */
export function monthLabel(profile: Profile, month: number): string {
  if (month < 0) return `Arrival day, August ${profile.arrivalYear}`;
  const calendar = (7 + month) % 12;
  const year = profile.arrivalYear + Math.floor((7 + month) / 12);
  return `${MONTH_NAMES[calendar]} ${year}`;
}

/** "Early March 2024", or the arrival-day label. */
export function slotLabel(profile: Profile, item: ScheduleItem): string {
  if (item.month < 0) return monthLabel(profile, item.month);
  return `${['Early', 'Mid', 'Late'][item.slot] ?? ''} ${monthLabel(profile, item.month)}`.trim();
}

const GENERIC_COMMENTS: Record<Track, string[]> = {
  status: ['That did not sit quite right.', 'Maybe someone who knows the rules could have told you more.'],
  study: ['You wonder whether you could have prepared differently.', 'It might have gone better with another approach.'],
  work: ['You are not sure that was your best move.', 'It leaves a small knot in your stomach.'],
  life: ['You are left with a feeling something could have been better.', 'A small regret lingers.'],
  era: ['In hindsight, you wish you had paid more attention.', 'You feel a step behind.'],
  big: ['That could have gone more smoothly.', 'You are still catching your breath.'],
};

function defaultComment(track: Track, id: string): string {
  const list = GENERIC_COMMENTS[track];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return list[h % list.length];
}

export function gpaOf(study: number): number {
  return Math.round((1.5 + study * 0.025) * 100) / 100;
}

function startingStats(p: Profile): Stats {
  const s: Stats = {
    money: START_MONEY[p.funding],
    study: 60,
    career: 20,
    legal: 70,
    family: 70,
    wellbeing: 70,
    community: 40,
  };
  // How you pay for school only shapes a student's start.
  if (p.status === 'F1' && (p.funding === 'scholarship' || p.funding === 'assistantship')) s.study += 5;
  if (p.status === 'F1' && p.funding === 'assistantship') s.career += 8;
  if (p.age >= 30) {
    s.study -= 3;
    s.career += 5;
  }
  if (p.marital === 'married') {
    s.family += 10;
    s.wellbeing += 4;
    s.community += 4;
  }
  if (p.housing === 'relatives') {
    s.family += 6;
    s.community += 6;
    s.wellbeing += 2;
  }
  return s;
}

export const CARDS_PER_MONTH = 3;
/** The longest a journey can run. Most end sooner: at the oath, at removal, or when you go home. */
export const MAX_YEARS = 30;
/** A card drawn this recently (in years) is passed over while fresher ones fit. */
const FRESH_GAPS = [5, 4, 3, 2, 1];
/**
 * The soonest a card may come back, in years. Students relive the academic year, so their cards may
 * return every year; a settled adult's year should not replay the last one, so a month with nothing
 * new to say stays quieter instead. Holidays come round more often than other events.
 */
const minGap = (id: string, student: boolean): number => MIN_GAP[id] ?? (student ? 1 : 2);
/** Things that happen once in a long while: a ten-year card, a first winter, a sibling's exams. */
const MIN_GAP: Record<string, number> = {
  'lpr-card-renewal': 9, 'lpr-voter-trap': 6, roommate: 5, 'sibling-exam': 7, 'winter-coat': 7, 'phone-plan': 5, dating: 4,
  'laptop-breaks': 4, 'job-scam': 4, 'parents-visit': 4,
};

/**
 * Builds the year: three arrival-day cards, then three cards per month. Seasonal
 * cards are fixed to their months, the rest are drawn from the pool so that each
 * month mixes study or status, life and work or money.
 */
function scheduleYear(state: GameState, rng: () => number): ScheduleItem[] {
  const byId = new Map<string, ChallengeDef>(CHALLENGES.map((d) => [d.id, d]));
  const need = (id: string): ChallengeDef => {
    const d = byId.get(id);
    if (!d) throw new Error(`Missing challenge ${id}`);
    return d;
  };
  const grid = new Map<string, ChallengeDef>();
  const key = (m: number, s: number): string => `${m}:${s}`;
  // The arrival cards belong to the route actually chosen; there is no student fallback.
  const route = ROUTE_MAP.get(state.profile.status);
  const st = statusOf(state);
  if (state.year === 0) (route?.arrival ?? []).forEach((id, i) => grid.set(key(-1, i), need(id)));
  else grid.set(key(0, 0), need(st === 'F1' ? 'new-year' : 'new-year-general'));

  const pinned: Array<[number, string]> = [...(STATUS_MAP.get(st)?.pinned?.(state) ?? [])].filter(([, id]) => CHALLENGES.some((d) => d.id === id));
  // Policy news fits students and workers whose rules it describes.
  if (['F1', 'OPT', 'STEM_OPT', 'H1B'].includes(st)) {
    const eraMonths = [2, 3, 5, 6, 7, 9, 11];
    pinned.push([eraMonths[Math.floor(rng() * eraMonths.length)], 'era-event']);
  }
  for (const [m, id] of pinned) {
    const free = [0, 1, 2].filter((s) => !grid.has(key(m, s)));
    if (!free.length) continue;
    grid.set(key(m, free[Math.floor(rng() * free.length)]), need(id));
  }

  const used = new Set<string>([...grid.values()].map((d) => d.id));
  const student = st === 'F1' || st === 'B2';
  const lastSeen = (id: string): number => {
    const v = state.flags[`cy_${id}`];
    return typeof v === 'number' ? v : -99;
  };
  const pool = CHALLENGES.filter((d) => !used.has(d.id) && fits(d, state) && (d.oddsPerYear === undefined || rng() < d.oddsPerYear));
  const trackOrder: Array<Array<ChallengeDef['track']>> = [['study', 'status'], ['life'], ['work']];
  const draw = (m: number, wanted: Array<ChallengeDef['track']>): ChallengeDef | null => {
    // Prefer cards not seen for several years, so each year has its own events; fall back only when the pool runs dry.
    const tries: ChallengeDef[][] = [];
    for (const gap of FRESH_GAPS) {
      const fresh = pool.filter((d) => !used.has(d.id) && state.year - lastSeen(d.id) >= Math.max(gap, minGap(d.id, student)));
      tries.push(
        fresh.filter((d) => wanted.includes(d.track) && (!d.months || d.months.includes(m))),
        fresh.filter((d) => !d.months || d.months.includes(m)),
        fresh,
      );
    }
    const list = tries.find((t) => t.length) ?? [];
    if (!list.length) return null;
    const total = list.reduce((s, d) => s + d.weight, 0);
    let r = rng() * total;
    for (const d of list) {
      r -= d.weight;
      if (r <= 0) return d;
    }
    return list[list.length - 1];
  };
  for (let m = 0; m < 12; m++) {
    const empty = [0, 1, 2].filter((s) => !grid.has(key(m, s)));
    const have = new Set<ChallengeDef['track']>();
    for (let s = 0; s < 3; s++) {
      const d = grid.get(key(m, s));
      if (d) have.add(d.track);
    }
    const wants = trackOrder.filter((t) => !t.some((x) => have.has(x)));
    empty.forEach((s, i) => {
      const pick = draw(m, wants[i] ?? trackOrder[i % 3]);
      if (pick) {
        grid.set(key(m, s), pick);
        used.add(pick.id);
      }
    });
  }

  for (const d of grid.values()) state.flags[`cy_${d.id}`] = state.year;
  const items: ScheduleItem[] = [];
  for (let m = -1; m < 12; m++) {
    for (let s = 0; s < CARDS_PER_MONTH; s++) {
      const d = grid.get(key(m, s));
      if (d) items.push({ month: m, slot: s, last: s === CARDS_PER_MONTH - 1, def: d });
    }
  }
  return items;
}

export class Game {
  state: GameState;
  private rng: () => number;
  private cache: Challenge | null = null;
  private moneyCtx: { label: string; kind: LedgerEntry['kind'] } = { label: 'Other', kind: 'event' };

  constructor(profile: Profile, seed = Math.floor(Math.random() * 1e9)) {
    this.rng = createSeededRandom(seed);
    this.state = {
      profile,
      seed,
      index: 0,
      stats: startingStats(profile),
      debt: 0,
      flags: {},
      log: [],
      schedule: [],
      ended: null,
      year: 0,
      startYear: profile.arrivalYear,
      ledger: [],
      stmt: { open: START_MONEY[profile.funding], from: 0 },
    };
    // Every route starts from its own definition. Falling back to the student route here once let F-1 flags and cards
    // reach players who never were students, so a missing route is an error instead.
    const route = ROUTE_MAP.get(profile.status);
    if (!route) throw new Error(`Unknown route ${profile.status}`);
    Object.assign(this.state.flags, route.startFlags ?? {});
    this.state.flags.status = route.startStatus;
    this.state.flags.statusSince = 0;
    if (route.startStatus === 'LPR') this.state.flags.lprSince = 0;
    this.state.flags.outOfStatus = !(STATUS_MAP.get(route.startStatus)?.lawful ?? true);
    if (!route.usesStudentFunding) {
      const startMoney = route.startMoney ?? 3000;
      this.state.stats.money = startMoney;
      this.state.stmt.open = startMoney;
    }
    this.state.schedule = scheduleYear(this.state, this.rng);
  }

  get total(): number {
    return this.state.schedule.length;
  }

  get item(): ScheduleItem | null {
    return this.state.schedule[this.state.index] ?? null;
  }

  get finished(): boolean {
    return this.state.index >= this.total;
  }

  get challenge(): Challenge | null {
    const item = this.item;
    if (!item) return null;
    if (!this.cache || this.cache.id !== item.def.id) this.cache = item.def.build(this.state);
    return this.cache;
  }

  /** Percent chance of the success outcome with a plain-language breakdown, or null if no roll. */
  odds(choice: Choice): { pct: number; parts: string[] } | null {
    if (!choice.roll) return null;
    const r = choice.roll;
    const parts: string[] = [`${Math.round(r.base)} starting odds`];
    let pct = r.base;
    for (const m of r.mods ?? []) {
      const v = m.stat === 'money' ? this.state.stats.money : this.state.stats[m.stat];
      const delta = Math.round((v - m.center) * m.per);
      if (delta !== 0) {
        pct += delta;
        parts.push(`${delta > 0 ? '+' : ''}${delta} ${m.label}`);
      }
    }
    for (const f of r.flagMods ?? []) {
      if (this.state.flags[f.flag]) {
        pct += f.delta;
        parts.push(`${f.delta > 0 ? '+' : ''}${f.delta} ${f.label}`);
      }
    }
    const rm = REALITY_MOD[this.state.profile.reality];
    if (rm !== 0) {
      pct += rm;
      parts.push(`${rm > 0 ? '+' : ''}${rm} ${this.state.profile.reality} setting`);
    }
    return { pct: clamp(Math.round(pct), 4, 96), parts };
  }

  choose(choiceId: string): ResultView {
    const ch = this.challenge;
    const item = this.item;
    if (!ch || !item) throw new Error('No active challenge');
    const choice = ch.choices.find((c) => c.id === choiceId);
    if (!choice) throw new Error(`Unknown choice ${choiceId}`);

    const before = { ...this.state.stats };
    const odds = this.odds(choice);
    let outcome: Outcome = choice.success;
    let rolled = false;
    if (odds) {
      rolled = true;
      const succeeded = this.rng() * 100 < odds.pct;
      if (!succeeded) {
        outcome = choice.fail ?? { text: 'It did not go well.', effects: { wellbeing: -4 }, passed: false };
      }
    }
    this.state.flags[`shown_${ch.id}`] = monthsSinceArrival(this.state);
    this.moneyCtx = { label: ch.title, kind: 'event' };
    this.applyEffects(outcome.effects);
    let ending: Ending | null = outcome.ends === 'went-home' ? this.wentHomeEnding() : null;

    // Month-end economy and detection risks run once, on the last card of each regular month.
    const monthEnd = item.last && item.month >= 0;
    const budget = monthEnd ? monthlyBudget(this.state.profile, this.state.flags) : [];
    let statement: Statement | null = null;
    if (monthEnd) {
      for (const l of budget) {
        this.addMoney(l.amount, l.label, 'monthly');
        if (l.label === 'Education loan repayment') this.state.debt = Math.max(0, this.state.debt + l.amount);
      }
      this.state.debt += borrowedPerMonth(this.state.profile, this.state.flags);
      const c = commuteInfo(this.state.profile, this.state.profile.commute);
      let drift = c.wellbeingPerMonth;
      if (this.state.flags.outOfStatus) drift -= 1.2; // the weight of living without status
      this.state.stats.wellbeing = clamp(this.state.stats.wellbeing + drift, 0, 100);
      this.detectionChecks();
      // Hard times: no rent to pay, but shelters and couches wear a person down. It ends once there is a cushion again.
      if (this.state.flags.hardTimes) {
        this.state.stats.wellbeing = clamp(this.state.stats.wellbeing - 3, 0, 100);
        if (this.state.stats.money >= 1000) this.state.flags.hardTimes = false;
      }
      // A visitor's lawful stay ends on the I-94 date, whatever else is going on (8 CFR 214.2(b)).
      const fl = this.state.flags;
      // Anyone who became a visitor later (for example after losing a job) gets the usual six months.
      if (statusOf(this.state) === 'B2' && fl.b2Until === undefined) fl.b2Until = Number(fl.statusSince ?? 0) + 6;
      if (statusOf(this.state) === 'B2' && fl.b2Until !== undefined && monthsSinceArrival(this.state) > Number(fl.b2Until)) {
        this.moneyCtx = { label: 'Overstay', kind: 'event' };
        this.applyEffects({ legal: -20, flags: { status: 'NONE', statusLostReason: 'overstay', overstaySince: monthsSinceArrival(this.state) } });
      }
      statement = this.closeStatement();
    }

    this.clampStats();
    let pivot: Pivot | null = null;
    if (!ending) {
      ending = this.checkEnding();
      if (!ending) pivot = this.checkPivot();
    }
    if (ending) this.state.ended = ending;

    const deltas: Partial<Record<keyof Stats, number>> = {};
    (Object.keys(before) as Array<keyof Stats>).forEach((k) => {
      const d = Math.round(this.state.stats[k] - before[k]);
      if (d !== 0) deltas[k] = d;
    });

    const comment = outcome.passed ? null : (outcome.comment ?? defaultComment(ch.track, ch.id));
    const entry: LogEntry = {
      month: item.month,
      title: ch.title,
      track: ch.track,
      choice: choice.label,
      passed: outcome.passed,
      text: outcome.text,
      comment: comment ?? undefined,
      lookback: outcome.lookback,
      deltas,
      oddsPct: odds?.pct,
      breakdown: odds?.parts,
      year: this.state.year,
    };
    this.state.log.push(entry);

    return {
      passed: outcome.passed,
      comment,
      text: outcome.text,
      deltas,
      oddsPct: odds?.pct ?? null,
      rolled,
      breakdown: odds?.parts ?? [],
      budget,
      statement,
      ending,
      pivot,
    };
  }

  advance(): void {
    this.state.index += 1;
    this.cache = null;
    this.ensureValid();
    this.maybeInjectUrgent();
    this.maybeInjectDesperation();
  }

  /** Arrival, pinned and year-opening cards are never swapped out. */
  private protectedIds(): Set<string> {
    const pins = STATUS_MAP.get(statusOf(this.state))?.pinned?.(this.state) ?? [];
    return new Set([...ARRIVAL_IDS, ...pins.map(([, id]) => id), 'era-event', 'new-year', 'new-year-general']);
  }

  /**
   * Cards with weight 20 or more are reactions (a layoff's grace period, a lottery result): as soon as
   * one fits, it replaces the next ordinary card instead of waiting for next year's schedule.
   */
  private maybeInjectUrgent(): void {
    const item = this.item;
    if (!item || item.month < 0) return;
    if (this.protectedIds().has(item.def.id)) return;
    const seen = new Set(this.state.schedule.map((i) => i.def.id));
    const nowM = monthsSinceArrival(this.state);
    const again = (d: ChallengeDef): boolean => {
      if (!d.repeatAfter) return false;
      const last = this.state.flags[`shown_${d.id}`];
      return last === undefined || nowM - Number(last) >= d.repeatAfter;
    };
    const upcoming = new Set(this.state.schedule.slice(this.state.index + 1).map((i) => i.def.id));
    const cands = CHALLENGES.filter((d) => d.weight >= 20 && (!seen.has(d.id) || (again(d) && !upcoming.has(d.id) && d.id !== item.def.id)) && fits(d, this.state, item.month));
    if (!cands.length) return;
    cands.sort((a, b) => b.weight - a.weight);
    item.def = cands[0];
    this.cache = null;
  }

  /** After a status change, place the new status's calendar cards in the months still ahead. */
  private placePinned(): void {
    const pins = STATUS_MAP.get(statusOf(this.state))?.pinned?.(this.state) ?? [];
    const now = this.item?.month ?? 0;
    const keep = this.protectedIds();
    for (const [m, id] of pins) {
      if (m <= now || this.state.schedule.some((i) => i.def.id === id)) continue;
      const def = CHALLENGES.find((d) => d.id === id);
      if (!def) continue;
      const j = this.state.schedule.findIndex((it, k) => k > this.state.index && it.month === m && !keep.has(it.def.id));
      if (j >= 0) this.state.schedule[j] = { ...this.state.schedule[j], def };
    }
  }

  summaryEnding(): Ending {
    return this.state.ended ?? this.finalEnding();
  }

  // ---------- internals ----------

  /** Every change to money goes through here so the balance can always be itemised. */
  private addMoney(amount: number, label = this.moneyCtx.label, kind: LedgerEntry['kind'] = this.moneyCtx.kind): void {
    const a = Math.round(amount);
    if (!a) return;
    this.state.stats.money += a;
    this.state.ledger.push({ year: this.state.year, month: Math.max(0, this.item?.month ?? 0), kind, label, amount: a });
  }

  /** Money changes since the last month-end statement, with opening and closing balances. */
  statementNow(): Statement {
    const lines = this.state.ledger.slice(this.state.stmt.from);
    const sum = lines.reduce((a, l) => a + l.amount, 0);
    return { opening: this.state.stmt.open, lines, closing: this.state.stats.money, other: Math.round(this.state.stats.money - this.state.stmt.open - sum) };
  }

  private closeStatement(): Statement {
    const st = this.statementNow();
    this.state.stmt = { open: this.state.stats.money, from: this.state.ledger.length };
    return st;
  }

  get canContinue(): boolean {
    return !this.state.ended && this.state.year + 1 < MAX_YEARS && !this.journeyComplete;
  }

  /** The road has reached its end: you have been a citizen for at least half a year when the year closes. */
  get journeyComplete(): boolean {
    if (statusOf(this.state) !== 'CITIZEN') return false;
    return (this.state.year + 1) * 12 - Number(this.state.flags.statusSince ?? 0) >= 6;
  }

  /** Move on to the next year: same person, same money and standing, a fresh twelve months. */
  nextYear(): void {
    const s = this.state;
    s.year += 1;
    s.profile.arrivalYear += 1;
    s.profile.age += 1;
    s.index = 0;
    s.stats.wellbeing = clamp(s.stats.wellbeing + 6, 0, 100);
    s.schedule = scheduleYear(s, this.rng);
    this.cache = null;
    this.ensureValid();
    this.maybeInjectUrgent();
    this.maybeInjectDesperation();
  }

  private applyEffects(e: Effects): void {
    const s = this.state.stats;
    if (e.money) this.addMoney(e.money);
    if (e.debt) this.state.debt += e.debt;
    for (const k of STAT_KEYS) {
      const v = e[k];
      if (v) s[k] += v;
    }
    if (e.flags) {
      const before = statusOf(this.state);
      Object.assign(this.state.flags, e.flags);
      if (e.flags.status && e.flags.status !== before) this.onStatusChange(before);
    }
  }

  /** Keep the bookkeeping flags in step with a status change made by a card. */
  private onStatusChange(before: string): void {
    const f = this.state.flags;
    const now = statusOf(this.state);
    const def = STATUS_MAP.get(now);
    f.statusSince = monthsSinceArrival(this.state);
    if (now === 'LPR' && f.lprSince === undefined) f.lprSince = f.statusSince;
    if (now === 'AOS_PENDING') {
      // The adjustment cards restore the earlier status on a denial and tailor the interview to the basis.
      if (!f.priorStatus) f.priorStatus = before;
      if (!f.aosBasis) f.aosBasis = ['H1B', 'O1', 'OPT', 'STEM_OPT', 'F1'].includes(before) ? 'employment' : 'family';
    }
    if (now !== 'AOS_PENDING' && before === 'AOS_PENDING') {
      f.priorStatus = '';
      f.aosBasis = '';
    }
    this.placePinned();
    if (def?.lawful) {
      f.outOfStatus = false;
      f.statusLost = false;
      // A new lawful status is a fresh start for the crossroads: losing it later is its own event, with its own reason.
      f.pivotStatusDone = false;
      f.statusLostReason = '';
      f.canReinstate = false;
    } else if (now === 'NONE') {
      if (before === 'F1') f.formerStudent = true;
      if (!f.ewi) {
        f.statusLost = true;
        if (!f.statusLostReason) f.statusLostReason = 'legal';
      }
    }
  }

  private clampStats(): void {
    const s = this.state.stats;
    for (const k of STAT_KEYS) s[k] = clamp(s[k], 0, 100);
  }

  private detectionChecks(): void {
    const f = this.state.flags;
    const chance = DETECT_CHANCE[this.state.profile.reality];
    const workRule = f.ead ? 'any' : STATUS_MAP.get(statusOf(this.state))?.work ?? 'campus';
    // Past unauthorized work stays on the record (cards read flags.unauthWork), but it can only cost a status that limits work.
    if (f.unauthWork && !f.statusLost && !f.outOfStatus && workRule !== 'any' && this.rng() < chance) {
      f.statusLost = true;
      f.statusLostReason = 'unauthorized-work';
    }
    if (f.droppedLoad && !f.statusLost && this.rng() < 0.45) {
      f.statusLost = true;
      f.statusLostReason = 'reduced-load';
    }
    if (f.missedCheckIn && !f.statusLost && this.rng() < 0.35) {
      f.statusLost = true;
      f.statusLostReason = 'sevis-check-in';
    }
    // A desperate act can catch up with you: each month after one is a chance of arrest.
    if (Number(f.crime ?? 0) > 0 && !f.arrested) {
      const base = { hopeful: 0.05, honest: 0.09, hard: 0.16 }[this.state.profile.reality];
      if (this.rng() < Math.min(0.5, base * Math.min(3, Number(f.crime)))) f.arrested = true;
    }
    // Unauthorized side gigs (like driving for a rideshare app) carry their own risk of discovery.
    if (Number(f.sideGig ?? 0) > 0 && !f.statusLost && !f.outOfStatus && workRule !== 'any') {
      const base = { hopeful: 0.02, honest: 0.04, hard: 0.07 }[this.state.profile.reality];
      if (this.rng() < Math.min(0.3, base * Number(f.sideGig))) {
        f.statusLost = true;
        f.statusLostReason = 'unauthorized-work';
      }
    }
    // Living out of status carries a standing risk of enforcement.
    if (f.outOfStatus && !f.removal) {
      let p: number = ENFORCE_CHANCE[this.state.profile.reality];
      if (f.legalHelp) p *= 0.6;
      if (f.greenCardPending) p *= 0.35;
      if (f.informalWork) p *= 1.3;
      if (f.removalOrder || f.inAbsentia) p *= 2;
      if (Number(f.sideGig ?? 0) > 0) p *= 1.15;
      if (this.rng() < p) f.removal = true;
    }
  }

  private checkEnding(): Ending | null {
    const s = this.state.stats;
    const f = this.state.flags;
    if (f.arrested) {
      return {
        id: 'jail-removal',
        title: 'Arrest, jail and removal',
        kind: 'failed',
        text: 'The police stop you. An act you thought of as small, in a desperate moment, becomes a charge. You spend nights in a county jail, and because you are not a citizen, your case is flagged to immigration authorities. When the criminal case ends, you are transferred to immigration custody and ordered removed. The people you built a life with are suddenly very far away.',
        tips: [
          'Certain criminal convictions can make a noncitizen deportable (INA 237(a)(2)). If you or someone you know is arrested, speak to a criminal defense lawyer and an immigration lawyer before saying anything about status.',
          'Defense lawyers are expected to advise about immigration consequences before a plea. Food banks, worker centers and legal aid groups exist so that no one has to choose between a crime and going hungry.',
        ],
      };
    }
    if (f.removal) {
      return {
        id: 'removal',
        title: 'Removal proceedings',
        kind: 'failed',
        text: 'One morning the knock you were afraid of comes. You are taken into custody and told you will face removal proceedings. Everything you built here is suddenly in other people\'s hands. A lawyer or an accredited representative may still be able to help, but this is where your journey turns.',
        tips: [
          'Free and low-cost immigration legal help exists. Look for a licensed attorney or an accredited organization, and be wary of anyone who promises guaranteed results.',
          'People in removal proceedings generally have rights, including the right to see a lawyer at their own expense. Contact a legal aid group right away.',
        ],
      };
    }
    if (s.wellbeing <= 0 && Number(f.burnoutCount ?? 0) >= 1) {
      return {
        id: 'burnout',
        title: 'Burned out',
        kind: 'failed',
        text: 'You tried to recover once and went back to the same pressure. This time you cannot keep going, and you return home to heal.',
        tips: ['Many campuses and communities offer free counseling. Using it early is a strength, not a risk.'],
      };
    }
    return null;
  }

  private makePivot(kind: Pivot['kind']): Pivot {
    const f = this.state.flags;
    if (kind === 'status-lost') {
      const reason = String(f.statusLostReason ?? 'legal');
      const why: Record<string, string> = {
        'unauthorized-work': 'After reports of work without authorization, your school ended your student record.',
        'reduced-load': 'Your school reported that you dropped below a full course load without approval and ended your student record.',
        'sevis-check-in': 'Because of the missed check-in, your school ended your student record.',
        legal: 'Your student record has ended.',
        overstay: 'The date on your admission record has passed, and you are still here.',
        'opt-ended': 'Your practical training has ended without a new status.',
        'h1b-grace': 'The grace period after your job ended has run out without a new employer or status.',
        'asylum-denied': 'Your asylum case has been denied.',
        'opt-missed': 'The window to apply for practical training closed before you filed.',
        'opt-unemployment': 'You passed the limit on days without work during practical training.',
        'grace-ended': 'The grace period after your job ended has run out without a new employer or status.',
        'h1b-six-years': 'You reached the six-year limit on H-1B time.',
        'o1-extension-denied': 'Your O-1 extension was denied.',
        'adjustment-denied': 'Your green card application was denied.',
        'conditions-not-removed': 'The conditions on your green card were not removed in time.',
      };
      const student = statusOf(this.state) === 'F1';
      // Student wording only for someone enrolled when it happened.
      if (!student) {
        why['unauthorized-work'] = 'After reports of work without authorization, your lawful status has ended.';
        why.legal = 'Your lawful status has ended.';
      }
      const lead = why[reason] ?? why.legal;
      return {
        kind,
        title: student ? 'Your student record has ended' : 'You are out of status',
        body: `${lead} You are out of status. You do not have to decide everything today, but you do have to decide something.`,
        stage: 'apartment-night',
        options: [
          { id: 'help', label: 'Find legal help first', note: 'Stay for now. A free clinic may explain what is possible.' },
          { id: 'stay', label: 'Stay and try to get by', note: 'You will be out of status. Work, school and travel all get harder.' },
          { id: 'home', label: 'Go home', note: 'Your journey ends here.' },
        ],
      };
    }
    if (kind === 'dismissed') {
      return {
        kind,
        title: 'Dismissed from your program',
        body: 'Your grades fell below your program\'s minimum and the school dismisses you. Without enrollment your student record ends, and you are out of status.',
        stage: 'apartment-night',
        options: [
          { id: 'help', label: 'Find legal help first', note: 'Stay for now. A free clinic may explain what is possible.' },
          { id: 'stay', label: 'Stay and try to get by', note: 'You will be out of status. Work, school and travel all get harder.' },
          { id: 'home', label: 'Go home', note: 'Your journey ends here.' },
        ],
      };
    }
    if (kind === 'broke') {
      const oos = Boolean(f.outOfStatus);
      const times = Number(f.brokeCount ?? 0);
      const rule = f.ead ? 'any' : STATUS_MAP.get(statusOf(this.state))?.work ?? 'campus';
      const mayWork = rule === 'any' && !Number(f.salary ?? 0);
      const options: PivotOption[] = [];
      if (times < 2) options.push({ id: 'loan', label: 'Ask your family for a loan', note: 'About $1,500 and your unpaid bills, as a debt you both will feel.' });
      if (!f.hardTimes) options.push({ id: 'shelter', label: 'Give up your room', note: 'A shelter bed or a friend\'s couch, and food banks. No rent, and it wears you down.' });
      if (mayWork) options.push({ id: 'job', label: 'Take any job, today', note: 'Whatever is hiring: nights, weekends, heavy lifting.' });
      else if (rule === 'any') options.push({ id: 'extra', label: 'Take a second job', note: 'Nights and weekends on top of what you do now. More money, less of you.' });
      else if (!f.informalWork) options.push({ id: 'cash', label: 'Take cash work', note: oos ? 'It pays, and it is not authorized work.' : 'This counts as unauthorized work and puts your status at risk.' });
      options.push({ id: 'crime', label: 'Take the offer you keep refusing', note: 'Fast money, and a risk of arrest that can end everything.' });
      options.push({ id: 'home', label: 'Go home', note: 'Your journey ends here.' });
      return {
        kind,
        title: times ? 'The money has run out again' : 'The money has run out',
        body: times
          ? 'You patched it once, and the hole is back. Bills are stacked on the table and the landlord has stopped being polite. People in this spot do not vanish: they double up, find a shelter, borrow, hustle, or take risks they swore they never would.'
          : 'Rent, food and fees have outrun everything you had. Nobody is offering a way out, and the clock on this month is ticking.',
        stage: f.hardTimes ? 'shelter' : 'apartment-night',
        options,
      };
    }
    return {
      kind,
      title: 'You cannot keep going like this',
      body: 'Sleep, money, distance and worry have piled up until you cannot function. Something has to change.',
      stage: 'apartment-night',
      options: [
        { id: 'recover', label: 'Get help and slow down', note: statusOf(this.state) === 'F1' ? 'Counseling and rest. Your studies and plans slip.' : 'Counseling and rest. Your plans slip.' },
        { id: 'home', label: 'Go home to recover', note: 'Your journey ends here.' },
      ],
    };
  }

  private checkPivot(): Pivot | null {
    const s = this.state.stats;
    const f = this.state.flags;
    const student = statusOf(this.state) === 'F1';
    if (f.statusLost && !f.pivotStatusDone && !student) return this.makePivot('status-lost');
    if (!f.outOfStatus && student) {
      if ((f.statusLost || s.legal <= 0) && !f.pivotStatusDone) {
        if (!f.statusLost) {
          f.statusLost = true;
          f.statusLostReason = 'legal';
        }
        return this.makePivot('status-lost');
      }
      if (s.study <= 8 && !f.pivotStatusDone) {
        f.statusLost = true;
        f.statusLostReason = 'dismissed';
        return this.makePivot('dismissed');
      }
    }
    // Running out of money never ends the journey by itself; it comes back as a crossroads every few months.
    if (s.money < -2500 && (f.lastBrokeAt === undefined || monthsSinceArrival(this.state) - Number(f.lastBrokeAt) >= 3)) return this.makePivot('broke');
    if (s.wellbeing <= 0 && !f.burnoutCount) return this.makePivot('burnout');
    return null;
  }

  /** Apply the player's answer to a crossroads. Returns an Ending if the journey ends here. */
  resolvePivot(pivot: Pivot, optionId: string): Ending | null {
    const f = this.state.flags;
    const s = this.state.stats;
    if (optionId === 'home') {
      const e = this.wentHomeEnding();
      this.state.ended = e;
      return e;
    }
    const monthNow = this.item?.month ?? 0;
    switch (pivot.kind) {
      case 'status-lost':
      case 'dismissed':
        f.pivotStatusDone = true;
        if (statusOf(this.state) === 'F1') f.formerStudent = true;
        f.status = 'NONE';
        f.statusSince = monthsSinceArrival(this.state);
        f.outOfStatus = true;
        f.statusLostMonth = monthNow;
        // Reinstatement is only open to students who did not work without authorization and whose
        // violation was a course-load reduction or a check-in problem (see research/verified-law.md).
        f.canReinstate = !f.unauthWork && !f.sideGig && (f.statusLostReason === 'reduced-load' || f.statusLostReason === 'sevis-check-in');
        s.legal = Math.min(s.legal, 15);
        s.wellbeing -= 8;
        if (optionId === 'help') f.legalHelp = true;
        // Staying without status means finding cash work to live on (former students find it through their own cards).
        if (optionId === 'stay' && !f.formerStudent) f.informalWork = true;
        this.rescheduleRest(optionId === 'help');
        break;
      case 'broke':
        f.brokeCount = Number(f.brokeCount ?? 0) + 1;
        f.lastBrokeAt = monthsSinceArrival(this.state);
        if (optionId === 'loan') {
          // The loan covers the unpaid bills too, and all of it becomes debt.
          const owed = Math.max(0, -s.money);
          this.addMoney(owed + 1500, 'Emergency loan', 'help');
          this.state.debt += owed + 1500;
          s.family -= 10;
        } else if (optionId === 'shelter') {
          // Unpaid bills become debt; rent stops while you stay in a shelter or on a couch.
          const owed = Math.max(0, -s.money);
          this.addMoney(owed, 'Unpaid bills moved to debt', 'help');
          this.state.debt += owed;
          f.hardTimes = true;
          s.wellbeing -= 8;
          s.community += 3;
        } else if (optionId === 'job') {
          f.salary = 2400;
          f.jobTitle = 'whatever is hiring';
          this.addMoney(300, 'First week of pay', 'help');
          s.wellbeing -= 4;
        } else if (optionId === 'extra') {
          f.salary = Number(f.salary ?? 0) + 800;
          this.addMoney(200, 'First extra shifts', 'help');
          s.wellbeing -= 7;
          s.family -= 2;
        } else if (optionId === 'crime') {
          f.forceCrimeOffer = true;
          s.wellbeing -= 3;
        } else if (optionId === 'cash') {
          if (f.outOfStatus) f.informalWork = true;
          else f.unauthWork = true;
          this.addMoney(400, 'Cash work', 'help');
          s.wellbeing -= 3;
          s.legal -= f.outOfStatus ? 0 : 6;
        }
        break;
      case 'burnout':
        f.burnoutCount = Number(f.burnoutCount ?? 0) + 1;
        s.wellbeing = 35;
        s.study = Math.max(0, s.study - 8);
        s.family += 2;
        break;
    }
    this.clampStats();
    this.cache = null;
    return null;
  }

  private wentHomeEnding(): Ending {
    return {
      id: 'went-home',
      title: 'Going home',
      kind: 'mixed',
      text: 'You go home with a suitcase of memories, a few good friends and a longer sense of what it takes. The country did not turn out the way you hoped, and you did not leave unchanged.',
      tips: [
        'If you spent time out of status, talk to a licensed attorney before trying to return: leaving can trigger bars on coming back.',
      ],
    };
  }

  /** After a crossroads the rest of the year is dealt again for the new situation. */
  private rescheduleRest(consult: boolean): void {
    const sched = this.state.schedule;
    const idx = this.state.index;
    const kept = sched.slice(0, idx + 1);
    const rest = sched.slice(idx + 1);
    const used = new Set(kept.map((i) => i.def.id));
    const byId = new Map<string, ChallengeDef>(CHALLENGES.map((d) => [d.id, d]));
    const forced: ChallengeDef[] = [];
    const add = (id: string): void => {
      const d = byId.get(id);
      if (d) {
        forced.push(d);
        used.add(id);
      }
    };
    if (this.state.flags.formerStudent) {
      add('oos-aftermath');
      if (consult) add('oos-consult');
    }
    if (this.state.flags.canReinstate) add('oos-reinstate');

    const eligible = (d: ChallengeDef): boolean =>
      !used.has(d.id) && fits(d, this.state);
    const draw = (list: ChallengeDef[]): ChallengeDef | null => {
      if (!list.length) return null;
      const total = list.reduce((a, d) => a + d.weight, 0);
      let r = this.rng() * total;
      for (const d of list) {
        r -= d.weight;
        if (r <= 0) return d;
      }
      return list[list.length - 1];
    };
    const defs: ChallengeDef[] = [];
    rest.forEach((_, i) => {
      if (i < forced.length) {
        defs.push(forced[i]);
        return;
      }
      const pool = CHALLENGES.filter(eligible);
      const oosPool = pool.filter((d) => d.id.startsWith('oos-'));
      const other = pool.filter((d) => !d.id.startsWith('oos-'));
      const pick = (this.rng() < 0.55 && oosPool.length ? draw(oosPool) : draw(other)) ?? draw(pool);
      if (pick) {
        used.add(pick.id);
        defs.push(pick);
      } else {
        defs.push(rest[i].def);
      }
    });
    this.state.schedule = [...kept, ...rest.map((it, i) => ({ ...it, def: defs[i] }))];
    this.cache = null;
  }

  /** When someone is truly desperate, a tempting and dangerous offer can appear. */
  private maybeInjectDesperation(): void {
    const f = this.state.flags;
    const s = this.state.stats;
    const item = this.item;
    if (!item || item.month < 0 || f.arrested) return;
    const forced = Boolean(f.forceCrimeOffer);
    const desperate = forced || s.money < 250 || Number(f.brokeCount ?? 0) > 0 || (Boolean(f.outOfStatus) && s.money < 700);
    const offers = Number(f.crimeOffers ?? 0);
    if (!desperate) return;
    const ids = ['desperate-offer', 'hunger-shoplift', 'borrowed-papers', 'unlicensed-drive'];
    let id = ids[Math.floor(this.rng() * ids.length)];
    if (forced) {
      // The player chose this at the crossroads: the offer comes now, whatever came before.
      f.forceCrimeOffer = false;
      const fresh = ids.filter((x) => !this.state.schedule.some((i, j) => j <= this.state.index && i.def.id === x));
      if (fresh.length) id = fresh[Math.floor(this.rng() * fresh.length)];
    } else {
      if (offers >= 3) return;
      const lastOffer = Number(f.lastCrimeOfferIndex ?? -99);
      if (this.state.index - lastOffer < 5) return;
      if (this.rng() > 0.5) return;
      if (this.state.schedule.some((i, j) => j <= this.state.index && i.def.id === id)) return;
    }
    const def = CHALLENGES.find((d) => d.id === id);
    if (!def) return;
    item.def = def;
    f.crimeOffers = offers + 1;
    f.lastCrimeOfferIndex = this.state.index;
    this.cache = null;
  }

  /** Before a card is shown, swap it out if the situation has changed so it no longer fits. */
  private ensureValid(): void {
    const item = this.item;
    if (!item) return;
    const d = item.def;
    const f = this.state.flags;
    const st = statusOf(this.state);
    const stale = (d.when && !d.when(this.state)) || (d.statuses && !d.statuses.includes(st)) || (d.countries && !d.countries.includes(this.state.profile.country));
    if (!stale) return;
    const taken = new Set(this.state.schedule.map((i) => i.def.id));
    void f;
    // Prefer a card not used this year. Late in a year that ran into a status change the fresh pool can be empty;
    // then a card already seen earlier this year is better than keeping one written for a status the player no longer holds.
    const upcoming = new Set(this.state.schedule.slice(this.state.index + 1).map((i) => i.def.id));
    let pool = CHALLENGES.filter((x) => !taken.has(x.id) && fits(x, this.state, item.month));
    if (!pool.length) pool = CHALLENGES.filter((x) => x.id !== d.id && !upcoming.has(x.id) && fits(x, this.state, item.month));
    if (!pool.length) pool = CHALLENGES.filter((x) => x.id !== d.id && !upcoming.has(x.id) && fits(x, this.state));
    if (!pool.length) return;
    const total = pool.reduce((a, x) => a + x.weight, 0);
    let r = this.rng() * total;
    let pick = pool[pool.length - 1];
    for (const x of pool) {
      r -= x.weight;
      if (r <= 0) {
        pick = x;
        break;
      }
    }
    item.def = pick;
    this.cache = null;
  }

  /** Record a between-task activity: apply its effects and keep its hidden meaning for the review. */
  logActivity(a: { label: string; effects: Effects; lookback?: string }): void {
    const f = this.state.flags;
    const { flags, ...rest } = a.effects;
    this.moneyCtx = { label: a.label, kind: 'evening' };
    this.applyEffects(rest);
    if (flags) {
      for (const [k, v] of Object.entries(flags)) {
        if (k === 'sideGig') f.sideGig = Number(f.sideGig ?? 0) + 1;
        else f[k] = v;
      }
    }
    this.clampStats();
    const item = this.item;
    this.state.log.push({
      month: item?.month ?? 0,
      title: a.label,
      track: 'life',
      choice: a.label,
      passed: true,
      text: '',
      lookback: a.lookback,
      deltas: {},
      year: this.state.year,
    });
    this.cache = null;
  }

  /** Apply small direct effects, for example from a between-task activity. */
  applyDirect(e: Effects, label = 'Evening'): void {
    this.moneyCtx = { label, kind: 'evening' };
    this.applyEffects(e);
    this.clampStats();
  }

  private finalEnding(): Ending {
    const s = this.state.stats;
    const f = this.state.flags;
    const st = statusOf(this.state);
    const yr = this.state.year + 1;
    const final = !this.canContinue;
    const span = final ? `After ${yr} years` : `After year ${yr}`;
    const steady = s.wellbeing >= 40 && s.money >= -500;
    switch (st) {
      case 'CITIZEN':
        return final
          ? { id: 'citizen', title: 'The end of the road, and a beginning', kind: 'success', text: `${yr} years after you landed with a suitcase and a folder of papers, you are a citizen of the country you came to. No more expiry dates, no more renewals, no line to wait in. You vote, you travel on a passport that brings you back, and you can ask for your family to join you. The place you came from is still part of you, and nobody can take either away. This is where the journey this game follows ends. The life goes on.`, tips: [] }
          : { id: 'citizen', title: 'A citizen now', kind: 'success', text: `${span}, you raised your hand and took the oath. Your passport says where you live now. The place you came from is still part of you, and nobody can take either away. One more year remains to settle into it.`, tips: [] };
      case 'LPR':
        return { id: 'green-card', title: 'A permanent home', kind: 'success', text: `${span}, you hold a green card. You can work anywhere, change jobs, travel and come back. Citizenship is the next door, when the years add up.`, tips: [] };
      case 'AOS_PENDING':
        return { id: 'pending-green-card', title: 'A long road with a light at the end', kind: 'mixed', text: `${span}, your green card application is in line. There are still steps ahead, and waiting is its own kind of work, but you can see where the road goes.`, tips: [] };
      case 'ASYLEE':
        return { id: 'asylee', title: 'Safe, and allowed to stay', kind: 'success', text: `${span}, you have asylum. You can work and build a life without the fear of being sent back. A green card can follow after a year.`, tips: [] };
      case 'ASY_PENDING':
        return { id: 'asylum-waiting', title: 'Waiting for an answer', kind: 'mixed', text: `${span}, your asylum case is still pending. You have learned to live in the waiting: work if you can, keep every paper, keep going.`, tips: ['A licensed immigration attorney or a DOJ-accredited representative can help prepare an asylum case. Many offer free or low-cost help.'] };
      case 'B2':
        return { id: 'visitor', title: 'Still a visitor', kind: 'mixed', text: `${span}, you are still here as a visitor, with a date on your admission record that does not move. Visitors cannot work, and the clock is always running.`, tips: [] };
      case 'OPT':
      case 'STEM_OPT':
      case 'H1B':
      case 'O1':
        return steady
          ? { id: 'working', title: final ? 'A career built on a clock' : 'Working, and counting the days', kind: 'success', text: `${span}, you are working in your field in lawful status. Every status has an end date, and the next filing is always on your mind, but you have built something real.`, tips: [] }
          : { id: 'working-strained', title: 'Working, but stretched thin', kind: 'mixed', text: `${span}, you are in status and working, but money or health is thin. The next step will ask for margin you do not quite have yet.`, tips: [] };
      case 'NONE':
        if (f.ewi) {
          return { id: 'undocumented', title: 'Here, without papers', kind: 'mixed', text: `${span}, you are still here without papers. You work, you send money home and you have people who look out for you. Very few doors open without status, and the ones that do take time and good legal help.`, tips: ['Free and low-cost legal help exists. A consultation with a licensed attorney or a DOJ-accredited representative can show whether any path applies to you.'] };
        }
        break;
      default:
    }
    if (f.reinstated) {
      return {
        id: 'back-in-status',
        title: 'Back on solid ground',
        kind: 'success',
        text: 'After months in limbo, your student status was reinstated. The year left a mark, but the road ahead is open again, and you know how fragile that is.',
        tips: [],
      };
    }
    if (f.greenCardPending) {
      return {
        id: 'pending-green-card',
        title: 'A long road with a light at the end',
        kind: 'mixed',
        text: 'You are married, and the green card process is under way. It will take time, and there are still interviews ahead. But for the first time in a long while you can see where the road goes.',
        tips: [],
      };
    }
    if (f.outOfStatus) {
      return {
        id: 'out-of-status',
        title: 'Still here, out of status',
        kind: 'mixed',
        text: `You made it through another year without ${f.formerStudent ? 'your student status' : 'lawful status'}. You work, you worry and you have found people who look out for you. The road ahead is uncertain: some doors may still open, others close with time.`,
        tips: [
          'Free and low-cost legal help exists. A consultation can show which doors are still open and how long they stay that way.',
        ],
      };
    }
    const y = this.state.year;
    const last = !this.canContinue;
    if (s.legal >= 55 && s.study >= 55 && s.wellbeing >= 40 && s.money >= -500) {
      return {
        id: 'steady-start',
        title: y === 0 ? 'A steady first year' : last ? `${y + 1} years of steady ground` : `A steady year ${y + 1}`,
        kind: 'success',
        text:
          y === 0
            ? 'You finish year one in good standing, with your studies on track and your footing in a new city. The harder questions come next: work authorization, the lottery, and what kind of life you are building.'
            : last
              ? `${y + 1} years in, you are still in good standing, in a city that feels like yours. This is as far as the game follows you; the road itself goes on.`
              : `Year ${y + 1} ends with your studies on track, your standing intact and a little more of the city belonging to you. The questions about work and the future are getting closer.`,
        tips: [],
      };
    }
    return {
      id: 'strained',
      title: 'Standing, but strained',
      kind: 'mixed',
      text:
        y === 0
          ? 'You are still enrolled and in status, but the year cost you. Money, health or your record is thin, and the next year will ask you to rebuild some margin.'
          : `You are still enrolled and in status, but year ${y + 1} cost you. Money, health or your record is thin, and the next year will ask you to rebuild some margin.`,
      tips: [],
    };
  }
}
