/**
 * CONTRACT for entry routes, statuses and route content.
 *
 * Content files (src/engine/content/*.ts) export three arrays and nothing else is needed:
 *   export const ROUTES: RouteDef[]     - entry routes chosen in setup (one per StatusId)
 *   export const STATUSES: StatusDef[]  - runtime statuses (one per StatusCode)
 *   export const CARDS: ChallengeDef[]  - decision cards, built with def/c/ok/bad from ./cx
 *
 * How the engine uses them
 * - Year 0 opens with the route's three `arrival` cards, then twelve months of three cards.
 * - Every month, cards are drawn from all CARDS whose `statuses` include the current status
 *   (or that have no `statuses`), whose `countries` include the home country (or none), whose
 *   `months` include the month (or none) and whose `when` passes.
 * - Each year the current status's `pinned(state)` cards are fixed to their months.
 * - A choice changes status by setting flags: `{ flags: { status: 'OPT' } }`. The engine then
 *   records `statusSince` (months since arrival), sets `lprSince` on LPR and sets or clears
 *   `outOfStatus` from the status's `lawful` field. Setting status 'NONE' also needs
 *   `statusLostReason` (a short string) for the summary.
 * - Removal, jail and going home end the journey through the existing flags and outcomes:
 *   `{ flags: { removal: true } }`, `{ flags: { arrested: true } }`, or `ends: 'went-home'`.
 *
 * Money conventions (all designed estimates; the engine shows them in the monthly statement)
 * - `flags.salary`: monthly take-home pay in USD (2025 dollars; the engine scales by year).
 *   `flags.jobTitle`: short label such as 'software engineer'. Set both when a job starts and
 *   set salary to 0 when it ends.
 * - `flags.informalWork: true`: cash work without authorization (engine adds about $1,050).
 * - `flags.ead: true`: holds a work permit (asylum applicants, adjustment applicants).
 * - One-off costs go in `money` on the outcome (negative to pay). Filing fees should come from
 *   a source in research/ or an official fee page and be marked as an estimate if not current.
 *
 * Writing rules: plain, respectful language; no em dashes; never "failed". Risky outcomes get a
 * gentle `comment` and a `lookback` that explains the real rule with a citation. Legal facts must
 * come from research/ files or a primary source you fetched, cited in a Fact (see cx.ts `cfr`).
 * Use only existing StageId and Role values (types.ts).
 */
import type { ChallengeDef, Flags, GameState, StatusCode, StatusId } from './types';

export interface RouteDef {
  id: StatusId;
  /** Shown in setup. */
  name: string;
  note: string;
  startStatus: StatusCode;
  /** Exactly three arrival-day card ids, all present in some CARDS array. */
  arrival: [string, string, string];
  startFlags?: Flags;
  /** Starting money in USD for this route, before the funding choice adjusts it. */
  startMoney?: number;
  /** True if the setup "How you pay" choice (family, loan, scholarship, assistantship) applies. */
  usesStudentFunding?: boolean;
}

export interface StatusDef {
  code: StatusCode;
  /** Short label for the HUD pill, for example 'OPT' or 'Green card'. */
  label: string;
  /** False means no lawful status: the engine sets flags.outOfStatus and enforcement risk applies. */
  lawful: boolean;
  /** Who you may work for while in this status. */
  work: 'none' | 'campus' | 'any' | 'employer' | 'informal';
  /** Cards fixed to months (0 = August) for each year spent in this status. */
  pinned?: (s: GameState) => Array<[number, string]>;
  /** One or two sentences for the year summary: where this road goes next. */
  next?: string;
}

/** Months since arrival, counting the current card's month. */
export function monthsSinceArrival(s: GameState): number {
  const item = s.schedule[s.index];
  return s.year * 12 + Math.max(0, item?.month ?? 0);
}

/** Whole months in the current status. */
export function monthsInStatus(s: GameState): number {
  return monthsSinceArrival(s) - Number(s.flags.statusSince ?? 0);
}

export function statusOf(s: GameState): StatusCode {
  return (s.flags.status as StatusCode | undefined) ?? 'F1';
}

export type { ChallengeDef };
