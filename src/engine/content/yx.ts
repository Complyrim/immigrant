/**
 * Shared helpers for the later-year cards (years-*.ts): the long middle of a journey, after the
 * arrival year, until it ends. Read-only views of the state; cards change it through outcome flags.
 */
import { priceFactor } from '../economy';
import { monthsInStatus, monthsSinceArrival, statusOf } from '../routes';
import type { GameState, StatusCode } from '../types';

export const YOU = { role: 'player' } as const;
export const has = (s: GameState, k: string): boolean => Boolean(s.flags[k]);
export const num = (s: GameState, k: string, d = 0): number => {
  const v = Number(s.flags[k]);
  return Number.isFinite(v) && s.flags[k] !== undefined ? v : d;
};
export const st = (s: GameState): StatusCode => statusOf(s);
export const is = (s: GameState, ...codes: StatusCode[]): boolean => codes.includes(statusOf(s));
/** Approximate calendar year of the current card. */
export const calYear = (s: GameState): number => s.profile.arrivalYear + s.year;
/** A price or fee in the current year's dollars (write the base in 2025 dollars). */
export const cost = (s: GameState, n: number): number => Math.round(n * priceFactor(calYear(s)));
/** Whole years since arrival: 0 during the first year. */
export const yearsHere = (s: GameState): number => s.year;
export const monthsHere = (s: GameState): number => monthsSinceArrival(s);
export const yearsInStatus = (s: GameState): number => Math.floor(monthsInStatus(s) / 12);
/** True from year `from` to year `to` inclusive (years since arrival). */
export const band = (s: GameState, from: number, to = 99): boolean => s.year >= from && s.year <= to;

/** Past the student and visitor chapters: a working adult life, with or without papers. */
export const settled = (s: GameState): boolean => !is(s, 'F1', 'B2');
/** May lawfully work for an employer right now. */
export const mayWork = (s: GameState): boolean =>
  is(s, 'OPT', 'STEM_OPT', 'H1B', 'O1', 'LPR', 'CITIZEN', 'ASYLEE') || has(s, 'ead');
/** Tied to one sponsoring employer. */
export const sponsored = (s: GameState): boolean => is(s, 'H1B', 'O1', 'STEM_OPT');
/** Permanent: a green card or citizenship. */
export const secure = (s: GameState): boolean => is(s, 'LPR', 'CITIZEN');
export const noStatus = (s: GameState): boolean => is(s, 'NONE');
/** Waiting on a decision: asylum or a green card application. */
export const waiting = (s: GameState): boolean => is(s, 'ASY_PENDING', 'AOS_PENDING');
export const hasJob = (s: GameState): boolean => num(s, 'salary') > 0 || has(s, 'informalWork');
export const hasSpouse = (s: GameState): boolean => s.profile.marital === 'married' || has(s, 'marriedCitizen');
export const hasPartner = (s: GameState): boolean => hasSpouse(s) || s.profile.marital === 'partnered' || has(s, 'dating');
/** Set by the family cards (flag `yf_child`) when a child is born here. */
export const hasChild = (s: GameState): boolean => has(s, 'yf_child');
export const age = (s: GameState): number => s.profile.age;
