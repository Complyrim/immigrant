/**
 * CONTRACT for home countries. Each country is one JSON file in src/data/countries/<id>.json:
 *   { "asOf": "YYYY-MM-DD", "culture": CountryCulture, "facts": FactJson[] }
 * Facts follow the shape of src/data/india-f1.json (id, topic, title, text, value, unit, year,
 * source, confidence CONFIRMED|LIKELY|UNVERIFIED, estimate). A country fact with the same id as
 * a shared fact replaces it for that country. Ids the game looks up by name:
 *   f1-visas-issued-fy2024, time-difference, flight-roundtrip, students-in-us-latest,
 *   remittances-latest, h1b-share-latest, asylum-context, family-backlog
 * Leave one out if research has nothing sourced for it; never invent a number.
 */
import type { Country, Fact, StatusId } from './types';

export interface Festival {
  id: string;
  title: string;
  body: string;
  /** Game month index: 0 = August ... 11 = July. */
  month: number;
  /** Three choices: celebrate with others, host or cook yourself, let it pass quietly. */
  join: string;
  joinText: string;
  host: string;
  hostText: string;
  skip: string;
  skipText: string;
}

export interface CountryCulture {
  id: Country;
  name: string;
  /** Adjective, for example 'Indian'. */
  demonym: string;
  language: string;
  departureCity: string;
  /** Airport arrivals board line, 26 characters or fewer, like 'AI 101  DELHI      LANDED'. */
  airportBoardLine: string;
  /** Short phrase for the call-home blurb, for example 'It is already tomorrow there.' */
  timeDifference: string;
  roundTripFlightUsd: number;
  flightEstimate: boolean;
  homeTravelNote: string;
  /** At least ten common given names each. */
  names: { female: string[]; male: string[] };
  /** Six skin tone hex colours used for the player and family. */
  skinTones: string[];
  foods: { dish: string; cookLines: [string, string, string, string]; groceryStore: string };
  studentAssociation: string;
  /** Two or three festivals or holidays that matter to people from this country. */
  festivals: Festival[];
  /** A four-line call-home scene. */
  familyCall: [string, string, string, string];
  homeMoneyNote: string;
  /** Designed multiplier on monthly money from family (India = 1). Explain it in familySupportNote. */
  familySupportFactor: number;
  familySupportNote: string;
  /** Optional one-line setup note per entry route for this country. */
  entryNotes: Partial<Record<StatusId, string>>;
}

type Loose = Record<string, unknown>;
const files = import.meta.glob('../data/countries/*.json', { eager: true }) as Record<string, { default?: Loose } & Loose>;

export type Continent = 'Africa' | 'Asia' | 'Europe' | 'North America' | 'South America' | 'Oceania';
export const CONTINENTS: Continent[] = ['Africa', 'Asia', 'Europe', 'North America', 'South America', 'Oceania'];
/** Which green card line a country is charged to. Most share the 'row' (rest of world) line. */
export type EbQueue = 'row' | 'india' | 'china' | 'mexico' | 'philippines';
/** Each country has its own cast, named by the country id. */
export type CastGroup = Country;

/** Rules and designed numbers that differ by country, kept beside the research that supports them. */
export interface CountryMechanics {
  continent: Continent;
  /** Which set of people plays the player, family and friends. */
  castGroup: CastGroup;
  ebQueue: EbQueue;
  ebDates?: string;
  /** Immigration court grants as a share of grants plus denials (EOIR, FY2024), or null if not found. */
  asylumGrantPct: number | null;
  asylumNote?: string;
  visaWaiver: boolean;
  /** Arrivals the rules did not allow: from this calendar year, on these routes. */
  arrivalLimits: Array<{ from: number; routes: StatusId[]; reason: string; source?: string }>;
}

/** Five per continent, in the order shown in setup. */
const ORDER: Record<Continent, Country[]> = {
  Africa: ['nigeria', 'ghana', 'ethiopia', 'kenya', 'egypt'],
  Asia: ['india', 'china', 'philippines', 'vietnam', 'south-korea'],
  Europe: ['united-kingdom', 'germany', 'ukraine', 'poland', 'italy'],
  'North America': ['mexico', 'canada', 'guatemala', 'el-salvador', 'dominican-republic'],
  'South America': ['brazil', 'colombia', 'venezuela', 'peru', 'ecuador'],
  Oceania: ['australia', 'new-zealand', 'fiji', 'tonga', 'samoa'],
};

const CULTURES = new Map<Country, CountryCulture>();
const MECHANICS = new Map<Country, CountryMechanics>();
const COUNTRY_FACTS = new Map<Country, Map<string, Fact>>();

for (const [path, mod] of Object.entries(files)) {
  const raw = (mod.default ?? mod) as Loose;
  const id = path.split('/').pop()?.replace('.json', '') as Country;
  const culture = raw.culture as CountryCulture | undefined;
  if (culture) CULTURES.set(id, { ...culture, id });
  const m = raw.mechanics as Partial<CountryMechanics> | undefined;
  if (m) {
    MECHANICS.set(id, {
      continent: (CONTINENTS.includes(m.continent as Continent) ? m.continent : continentOf(id)) as Continent,
      castGroup: m.castGroup ?? id,
      ebQueue: m.ebQueue ?? 'row',
      ebDates: m.ebDates,
      asylumGrantPct: typeof m.asylumGrantPct === 'number' ? m.asylumGrantPct : null,
      asylumNote: m.asylumNote,
      visaWaiver: Boolean(m.visaWaiver),
      arrivalLimits: Array.isArray(m.arrivalLimits) ? m.arrivalLimits.filter((l) => l && typeof l.from === 'number' && Array.isArray(l.routes)) : [],
    });
  }
  const facts = new Map<string, Fact>();
  for (const f of (raw.facts as Loose[] | undefined) ?? []) {
    const fid = String(f.id ?? '');
    if (!fid) continue;
    facts.set(fid, {
      id: fid,
      title: String(f.title ?? ''),
      text: String(f.text ?? ''),
      source: String(f.source ?? ''),
      confidence: String(f.confidence ?? 'UNVERIFIED'),
      estimate: f.estimate === true,
    });
  }
  COUNTRY_FACTS.set(id, facts);
}

export function cultureOf(c: Country): CountryCulture | null {
  return CULTURES.get(c) ?? null;
}

export function countryFact(c: Country, id: string): Fact | null {
  return COUNTRY_FACTS.get(c)?.get(id) ?? null;
}

export function mechanicsOf(c: Country): CountryMechanics | null {
  return MECHANICS.get(c) ?? null;
}

export function continentOf(c: Country): Continent {
  return CONTINENTS.find((k) => ORDER[k].includes(c)) ?? 'Asia';
}

/** Countries with a data file, optionally only one continent's. */
export function playableCountries(continent?: Continent): Country[] {
  const list = continent ? ORDER[continent] : CONTINENTS.flatMap((k) => ORDER[k]);
  return list.filter((c) => CULTURES.has(c));
}
