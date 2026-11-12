import type { ChallengeDef, Choice, Effects, Fact, Outcome } from './types';

/** An outcome the player will likely read as fine. `lookback` is revealed in the year-end review. */
export const ok = (text: string, effects: Effects = {}, lookback?: string): Outcome => ({
  text,
  effects,
  passed: true,
  lookback,
});

/**
 * An outcome that was not good enough. The text only describes what the character notices.
 * `comment` is a gentle aside; the real consequence is explained later in `lookback`.
 */
export const bad = (text: string, effects: Effects = {}, comment?: string, lookback?: string): Outcome => ({
  text,
  effects,
  passed: false,
  comment,
  lookback,
});

export const mod = (
  stat: 'study' | 'career' | 'legal' | 'family' | 'wellbeing' | 'community' | 'money',
  center: number,
  per: number,
  label: string,
): { stat: typeof stat; center: number; per: number; label: string } => ({ stat, center, per, label });

export const study = (label = 'study standing') => mod('study', 60, 0.4, label);
export const well = (label = 'wellbeing') => mod('wellbeing', 60, 0.25, label);
export const legal = (label = 'legal security') => mod('legal', 70, 0.2, label);
export const social = (label = 'social ties') => mod('community', 40, 0.2, label);

export function c(id: string, label: string, success: Outcome, extra: Partial<Choice> = {}): Choice {
  return { id, label, success, ...extra };
}

export const def = (
  id: string,
  track: ChallengeDef['track'],
  weight: number,
  build: ChallengeDef['build'],
  extra: Partial<ChallengeDef> = {},
): ChallengeDef => ({ id, track, weight, build, ...extra });

export function money(n: number): string {
  return `$${Math.round(n).toLocaleString('en-US')}`;
}

const CFR_2142 = 'https://www.law.cornell.edu/cfr/text/8/214.2';
const CFR_2143 = 'https://www.law.cornell.edu/cfr/text/8/214.3';
export const cfr = (id: string, title: string, text: string, source: string): Fact => ({
  id,
  title,
  text,
  source,
  confidence: 'CONFIRMED',
  estimate: false,
});

export const FACT_RCL = cfr(
  'cfr-rcl',
  'Reduced course load',
  'A school official (DSO) may approve a reduced course load for academic difficulties such as adjusting to English or US teaching methods, for documented medical conditions, or in the final term. A student who drops below full-time without prior DSO approval is considered out of status. (8 CFR 214.2(f)(6))',
  CFR_2142,
);
export const FACT_WORK = cfr(
  'cfr-work',
  'Working as an F-1 student',
  'On-campus work is limited to 20 hours a week while school is in session and may be full-time during breaks. Off-campus work generally needs at least one full academic year in F-1 status, good standing, a DSO recommendation and a work permit. (8 CFR 214.2(f)(9))',
  CFR_2142,
);
export const FACT_CPT = cfr(
  'cfr-cpt',
  'Curricular practical training',
  'CPT may begin only after the DSO endorses your I-20. It generally requires one full academic year of full-time enrollment, except for graduate programs that require immediate CPT. (8 CFR 214.2(f)(10)(i))',
  CFR_2142,
);
export const FACT_F2 = cfr(
  'cfr-f2',
  'Spouses on F-2',
  'An F-2 spouse or child may not accept employment. Recreational or avocational study is allowed, and any other study is limited. (8 CFR 214.2(f)(15))',
  CFR_2142,
);
export const FACT_REPORT = cfr(
  'cfr-report',
  'Your school reports on you',
  'Each term, schools must report to the tracking system (SEVIS) whether each student enrolled, dropped below full-time without DSO authorization, or failed to enroll. The DSO sets a report date no more than 30 days before classes start. (8 CFR 214.3(g)(2)(iii))',
  CFR_2143,
);
export const FACT_ADDR = cfr(
  'cfr-address',
  'Keeping your record current',
  'Schools must update a student\'s U.S. address in SEVIS within 21 days of a change. Students on a STEM OPT extension have their own 10-day duty to report changes. (8 CFR 214.3(g))',
  CFR_2143,
);
