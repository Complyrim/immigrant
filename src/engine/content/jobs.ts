/**
 * The kinds of work in the game and the hands-on jobs a newcomer can be offered.
 *
 * `flags.jobKind` says where a job happens, so work-day cards and backdrops match it:
 *   kitchen, warehouse, store, hotel, construction, care, driver, cleaning, office.
 * Set it with `jobTitle` whenever a job starts (cash work included) and clear it ('') when a job ends.
 * Professional jobs use 'office'. Pay is monthly take-home in 2025 dollars (designed estimates).
 */
import type { Effects, Flags, GameState, StageId } from '../types';

export type JobKind = 'kitchen' | 'warehouse' | 'store' | 'hotel' | 'construction' | 'care' | 'driver' | 'cleaning' | 'office';
/** Kinds of work done on a floor, a site, a route or in someone's home, not at a desk. */
export type SiteKind = Exclude<JobKind, 'office'>;

export const JOB_KINDS: JobKind[] = ['kitchen', 'warehouse', 'store', 'hotel', 'construction', 'care', 'driver', 'cleaning', 'office'];

/** Titles from older saves or cards without a kind, read as a kind. */
const TITLE_KINDS: Array<[RegExp, JobKind]> = [
  [/kitchen|cook|dishwash|restaurant|chef/i, 'kitchen'],
  [/warehouse|retail work|whatever is hiring/i, 'warehouse'],
  [/retail|cashier|grocery|store|stock/i, 'store'],
  [/housekeep|hotel|front desk/i, 'hotel'],
  [/construction|labor|crew|paint|landscap|roof/i, 'construction'],
  [/aide|care|medical assistant|nursing/i, 'care'],
  [/driver|delivery/i, 'driver'],
  [/clean|janitor/i, 'cleaning'],
];

export const isKind = (v: unknown): v is JobKind => typeof v === 'string' && (JOB_KINDS as string[]).includes(v);

/** A small stable hash, so a pick depends only on the game state (never Math.random). */
export const seeded = (s: GameState, salt: string): number => {
  let h = (s.seed ^ 0x9e3779b9) >>> 0;
  const key = `${salt}:${s.year}:${s.index}`;
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 2654435761) >>> 0;
  return h;
};

/** Kinds of cash work, used when cash work started without a card naming it. */
export const CASH_DEFAULT_KINDS: SiteKind[] = ['kitchen', 'construction', 'cleaning', 'care', 'store'];

/**
 * The kind of the current job: flags.jobKind first, then the title, then (for cash work with no
 * title) a kind fixed by the game seed. A lawful job with no readable title counts as office work.
 */
export const jobKindOf = (s: GameState): JobKind => {
  if (isKind(s.flags.jobKind)) return s.flags.jobKind;
  const t = String(s.flags.jobTitle || '');
  for (const [re, k] of TITLE_KINDS) if (re.test(t)) return k;
  if (!t && s.flags.informalWork) return CASH_DEFAULT_KINDS[s.seed % CASH_DEFAULT_KINDS.length];
  return 'office';
};

/** The scene for a kind of work. The engine picks the painting for jobKind on 'worksite'. */
export const stageForKind = (k: JobKind): StageId =>
  k === 'care' ? 'clinic' : k === 'driver' ? 'street' : k === 'cleaning' || k === 'office' ? 'workplace' : 'worksite';

/** A hands-on job offer with its own trade-off. */
export interface JobOffer {
  kind: SiteKind;
  title: string;
  salary: number;
  /** Short words for the card body, e.g. "a restaurant kitchen". */
  where: string;
  label: string;
  text: string;
  effects: Effects;
}

/** Hands-on jobs open to anyone who may work. One per kind. */
export const JOB_OFFERS: JobOffer[] = [
  {
    kind: 'kitchen', title: 'line cook', salary: 2300, where: 'a restaurant kitchen',
    label: 'Take the restaurant kitchen: evenings and weekends, a hot line and a staff meal.',
    text: 'Steam, knives and orders shouted in three languages. You come home smelling of the fryer, fed and a little proud.',
    effects: { career: 2, wellbeing: -2, community: 2 },
  },
  {
    kind: 'warehouse', title: 'warehouse associate', salary: 2500, where: 'a warehouse',
    label: 'Take the warehouse: steady hours and overtime, heavy lifting all day.',
    text: 'Ten-hour shifts, a scanner on your wrist and sore feet. The pay stub is real, and the overtime helps.',
    effects: { career: 1, wellbeing: -3 },
  },
  {
    kind: 'store', title: 'grocery store cashier', salary: 2000, where: 'a grocery store',
    label: 'Take the grocery store till: lower pay, gentler hours, a lot of faces.',
    text: 'The pay is thin, but your English grows by the shift and the regulars start to know your name.',
    effects: { career: 1, community: 3, wellbeing: 1 },
  },
  {
    kind: 'hotel', title: 'hotel housekeeper', salary: 2200, where: 'a hotel',
    label: 'Take the hotel housekeeping job: fixed shifts and a daily quota of rooms.',
    text: 'Fourteen rooms a day, every bed tight, every mirror clear. Your back complains and the shifts never change, which helps.',
    effects: { career: 1, wellbeing: -2 },
  },
  {
    kind: 'construction', title: 'construction laborer', salary: 2900, where: 'a construction crew',
    label: 'Join the construction crew: the best pay here, hard on the body, early starts.',
    text: 'Up at five, outside in all weather. The money is the best you have seen here, and your body pays some of it back.',
    effects: { career: 1, wellbeing: -4, money: 150 },
  },
  {
    kind: 'care', title: 'home health aide', salary: 2100, where: 'a home care agency',
    label: 'Work as a home health aide: modest pay, real meaning, a road toward nursing.',
    text: 'You help an old man shave and a widow get to her doctor. The pay is modest. The coordinator says aides who stay can train further.',
    effects: { career: 3, wellbeing: 1, community: 2 },
  },
  {
    kind: 'driver', title: 'delivery driver', salary: 2600, where: 'a delivery company',
    label: 'Drive a delivery route: decent pay, long days alone in a van.',
    text: 'A van, a scanner and a hundred doors a day. You learn the city fast, and you eat lunch alone at red lights.',
    effects: { career: 1, wellbeing: -2 },
  },
  {
    kind: 'cleaning', title: 'office cleaner', salary: 2000, where: 'an office cleaning company',
    label: 'Clean offices at night: quiet, steady, and your days stay free.',
    text: 'Empty floors, a cart and headphones. Your days are free for errands, classes and sleep, in about that order.',
    effects: { career: 0, wellbeing: -1, study: 1 },
  },
];

/** Flags for starting a hands-on job from an offer. */
export const offerFlags = (o: JobOffer, extra: Flags = {}): Flags => ({ salary: o.salary, jobTitle: o.title, jobKind: o.kind, ...extra });

/** Offers that fit this person right now: delivery needs a driver's licence. */
const openOffers = (s: GameState): JobOffer[] =>
  JOB_OFFERS.filter((o) => o.kind !== 'driver' || Boolean(s.flags.license || s.flags.yh_licence));

/** `count` different offers, picked from the state so a card stays the same while it is shown. */
export const pickOffers = (s: GameState, salt: string, count: number): JobOffer[] => {
  const pool = [...openOffers(s)];
  const out: JobOffer[] = [];
  let h = seeded(s, salt);
  while (out.length < count && pool.length) {
    out.push(pool.splice(h % pool.length, 1)[0]);
    h = Math.imul(h ^ (h >>> 15), 2246822519) >>> 0;
  }
  return out;
};

/** Pick one item from a list, stable for the shown card. */
export const pickOne = <T>(s: GameState, salt: string, list: T[]): T => list[seeded(s, salt) % list.length];

/** Cash work without papers: what it is, in words, for the cash-work cards. */
export interface CashJob {
  kind: SiteKind;
  /** "a restaurant kitchen" */
  where: string;
  /** "kitchen" as in "Take the kitchen job." */
  short: string;
  text: string;
}

export const CASH_JOBS: Record<'kitchen' | 'store' | 'construction' | 'cleaning' | 'care', CashJob> = {
  kitchen: { kind: 'kitchen', where: 'a restaurant kitchen', short: 'kitchen', text: 'Twelve-hour shifts, hot steel and a staff meal at the end.' },
  store: { kind: 'store', where: 'a corner store', short: 'store', text: 'Long hours behind the counter, stocking shelves when it is quiet.' },
  construction: { kind: 'construction', where: 'a painting and drywall crew', short: 'painting crew', text: 'Dust in your hair and paint on your hands, out the door before sunrise.' },
  cleaning: { kind: 'cleaning', where: 'a cleaning contractor', short: 'cleaning', text: 'Nights in empty offices, a bucket and silence.' },
  care: { kind: 'care', where: 'a family who needs someone to look after their grandmother', short: 'care', text: 'Days with an old woman who calls you by her daughter\'s name and holds your hand at lunch.' },
};
