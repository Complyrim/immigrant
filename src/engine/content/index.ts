import { CHALLENGES as BASE } from '../challenges';
import type { ChallengeDef, StageId, StatusCode, StatusId } from '../types';
import type { RouteDef, StatusDef } from '../routes';
import * as core from './core';
import * as work from './work';
import * as family from './family';
import * as yHome from './years-home';
import * as yFamily from './years-family';
import * as yWork from './years-work';
import * as yStatus from './years-status';

/**
 * Every card, route and status in the game, with tags applied to the original student cards.
 * Out-of-status cards (ids starting 'oos-') carry their own `when` checks and stay untagged.
 */
/** Written for someone whose student record ended. */
const FORMER_STUDENT_ONLY = new Set(['oos-aftermath', 'oos-consult', 'oos-reinstate']);

/** Rare events: the chance each year that they can happen at all (designed). */
const RARE: Record<string, number> = { 'lpr-long-trip': 0.3, 'work-h1b-layoff': 0.25, 'work-h1b-side-gig': 0.5, 'laptop-breaks': 0.5, 'bike-stolen': 0.4, 'job-scam': 0.5 };

const tagged: ChallengeDef[] = BASE.filter((d) => !core.RETIRED_CARDS.has(d.id)).map((d) => {
  const extra: Partial<ChallengeDef> = {};
  if (!d.statuses && core.STUDENT_CARDS.has(d.id)) extra.statuses = ['F1'];
  if (!d.countries && core.COUNTRY_CARDS[d.id]) extra.countries = core.COUNTRY_CARDS[d.id];
  if (RARE[d.id] !== undefined && d.oddsPerYear === undefined) extra.oddsPerYear = RARE[d.id];
  if (FORMER_STUDENT_ONLY.has(d.id)) {
    const orig = d.when;
    extra.when = (st) => Boolean(st.flags.formerStudent) && (orig ? orig(st) : true);
  }
  return Object.keys(extra).length ? { ...d, ...extra } : d;
});

/** Cards that happen in a courtroom, the immigration agency, an office, a shelter, a work kitchen or a legal aid office. */
const SCENE: Record<string, StageId> = {};
const put = (stage: StageId, ids: string): void => ids.split(' ').forEach((id) => (SCENE[id] = stage));
put('court', 'asy-court');
put('uscis', 'asy-interview aos-biometrics aos-interview lpr-i751 lpr-natz-interview');
put('legal', 'asy-arrival-help ewi-asylum-deadline ewi-legal-screening asy-file asy-after-denial fam-file-petition fam-ewi-waiver oos-consult oos-notario work-sp-file work-h1b-six-year work-gc-file-aos');
put('workplace', 'work-h1b-first-days work-h1b-start work-h1b-layoff work-h1b-perm work-h1b-i140');
put('shelter', 'asy-arrival-shelter');
put('worksite', 'ewi-arrival-work oos-cash-job oos-wage-theft oos-boss-threat b2-cash-work find-cash-work');

export const ALL_CARDS: ChallengeDef[] = [...tagged, ...core.CARDS, ...work.CARDS, ...family.CARDS, ...yHome.CARDS, ...yFamily.CARDS, ...yWork.CARDS, ...yStatus.CARDS].map((d) => {
  let out = RARE[d.id] !== undefined && d.oddsPerYear === undefined ? { ...d, oddsPerYear: RARE[d.id] } : d;
  const stage = SCENE[d.id];
  if (stage) {
    const build = out.build;
    out = { ...out, build: (s) => ({ ...build(s), stage }) };
  }
  return out;
});

const seen = new Set<string>();
for (const d of ALL_CARDS) {
  if (seen.has(d.id)) console.warn(`Duplicate card id ${d.id}`);
  seen.add(d.id);
}

export const ROUTES: RouteDef[] = [...core.ROUTES, ...work.ROUTES, ...family.ROUTES];
export const ROUTE_MAP = new Map<StatusId, RouteDef>(ROUTES.map((r) => [r.id, r]));
export const STATUS_MAP = new Map<StatusCode, StatusDef>([...core.STATUSES, ...work.STATUSES, ...family.STATUSES].map((s) => [s.code, s]));

/** A route is playable when its definition exists and all three arrival cards exist. */
export function routeReady(id: StatusId): boolean {
  const r = ROUTE_MAP.get(id);
  return Boolean(r && r.arrival.every((a) => seen.has(a)));
}
