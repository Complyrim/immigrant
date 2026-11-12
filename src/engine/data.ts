import citiesRaw from '../data/cities.json';
import erasRaw from '../data/eras.json';
import indiaRaw from '../data/india-f1.json';
import type { CityId, Fact } from './types';

/** Numbers in the research data carry their own source, year and confidence. */
interface Sourced {
  value: number | null;
  year?: number | null;
  source?: string | null;
  confidence?: string | null;
  estimate?: boolean;
  basis?: string | null;
}

export interface CityData {
  id: CityId;
  name: string;
  metro: string;
  state: string;
  rentOneBedroom: Sourced | null;
  rentSharedRoom: Sourced | null;
  transitPass: Sourced | null;
  avgCommuteMin: Sourced | null;
  carMonthly: Sourced | null;
  indianCommunityNotes: string;
  universities: string[];
  skylineDescription: string;
  palette: string[];
  landmarks: string[];
  transitVehicles: string[];
  weather: string;
  stateRules: string | null;
  gaps: string[];
}

export interface EraEvent {
  id: string;
  year: number;
  title: string;
  summary: string;
  affects: string[];
  tone: string;
  effect: Partial<Record<'legal' | 'career' | 'wellbeing' | 'money' | 'community', number>>;
  source: string;
  confidence: string;
  pending: boolean;
}

type Loose = Record<string, unknown>;

function sourced(v: unknown): Sourced | null {
  if (!v || typeof v !== 'object') return null;
  const o = v as Loose;
  const value = typeof o.value === 'number' ? o.value : null;
  return {
    value,
    year: typeof o.year === 'number' ? o.year : null,
    source: typeof o.source === 'string' ? o.source : null,
    confidence: typeof o.confidence === 'string' ? o.confidence : null,
    estimate: o.estimate === true,
    basis: typeof o.basis === 'string' ? o.basis : null,
  };
}

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

function strArr(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}

const CITY_FALLBACK_PALETTE = ['#f2a65a', '#e76f51', '#264653', '#2a9d8f'];

export const CITIES: CityData[] = ((citiesRaw as unknown as { cities?: Loose[] }).cities ?? []).map((c) => {
  const rent = (c.rent ?? {}) as Loose;
  const commute = (c.commute ?? {}) as Loose;
  const visual = (c.visual ?? {}) as Loose;
  const palette = strArr(visual.palette);
  return {
    id: str(c.id) as CityId,
    name: str(c.name),
    metro: str(c.metro),
    state: str(c.state),
    rentOneBedroom: sourced(rent.oneBedroomMonthly),
    rentSharedRoom: sourced(rent.sharedRoomMonthly),
    transitPass: sourced(commute.transitMonthlyPass),
    avgCommuteMin: sourced(commute.avgMinutesOneWay),
    carMonthly: sourced(commute.carMonthlyCost),
    indianCommunityNotes: str(c.indianCommunityNotes),
    universities: strArr(c.universitiesForContext),
    skylineDescription: str(visual.skylineDescription),
    palette: palette.length >= 3 ? palette : CITY_FALLBACK_PALETTE,
    landmarks: strArr(visual.landmarks),
    transitVehicles: strArr(visual.transitVehicles),
    weather: str(visual.weather),
    stateRules: typeof c.stateRules === 'string' ? c.stateRules : null,
    gaps: strArr(c.gaps),
  };
});

export function getCity(id: CityId): CityData {
  const found = CITIES.find((c) => c.id === id);
  if (!found) throw new Error(`City data missing for ${id}`);
  return found;
}

export const ERAS: EraEvent[] = ((erasRaw as unknown as { events?: Loose[] }).events ?? []).map((e) => ({
  id: str(e.id),
  year: typeof e.year === 'number' ? e.year : 0,
  title: str(e.title),
  summary: str(e.summary),
  affects: strArr(e.affects),
  tone: str(e.tone, 'uncertainty'),
  effect: (e.effect && typeof e.effect === 'object' ? e.effect : {}) as EraEvent['effect'],
  source: str(e.source),
  confidence: str(e.confidence, 'UNVERIFIED'),
  pending: e.pending === true,
}));

/**
 * Tags in eras.json that are too wide: these events are about students and practical training only, so an H-1B
 * worker who never studied here should not get them as personal news. (Better fixed in the data file.)
 */
const NOT_FOR: Record<string, string[]> = { 'stem-opt-24-month-rule': ['H-1B'], 'opt-reevaluation-2026': ['H-1B'] };

/** Policy news for the year, chosen among events that touch the given groups (as tagged in eras.json) or everyone. */
export function eraFor(year: number, rng: () => number, groups: string[] = ['F-1', 'OPT']): EraEvent | null {
  const tags = (e: EraEvent): string[] => e.affects.filter((a) => !(NOT_FOR[e.id] ?? []).includes(a));
  const pool = ERAS.filter(
    (e) => e.year === year && (e.affects.length === 0 || tags(e).some((a) => a === 'all' || groups.includes(a))),
  );
  if (!pool.length) return null;
  return pool[Math.floor(rng() * pool.length)];
}

const FACTS = new Map<string, Fact>();
for (const f of ((indiaRaw as unknown as { facts?: Loose[] }).facts ?? [])) {
  const id = str(f.id);
  if (!id) continue;
  FACTS.set(id, {
    id,
    title: str(f.title),
    text: str(f.text),
    source: str(f.source),
    confidence: str(f.confidence, 'UNVERIFIED'),
    estimate: f.estimate === true,
  });
}

export function getFact(id: string | undefined): Fact | null {
  return id ? FACTS.get(id) ?? null : null;
}

export function factsByKeyword(keyword: string): Fact[] {
  const k = keyword.toLowerCase();
  return [...FACTS.values()].filter((f) => f.id.includes(k) || f.title.toLowerCase().includes(k));
}

export function allFacts(): Fact[] {
  return [...FACTS.values()];
}

export function srcNum(s: Sourced | null, fallback: number): { value: number; estimate: boolean } {
  if (s && s.value !== null && Number.isFinite(s.value)) return { value: s.value, estimate: s.estimate === true };
  return { value: fallback, estimate: true };
}
