/**
 * Work-based roads: OPT, STEM OPT, H-1B, O-1 and the employment green card steps,
 * plus the self-petition road (EB-1A and the EB-2 national interest waiver).
 *
 * Every legal mechanic here is cited in a lookback or an inline fact. The rule text was read
 * from eCFR (title 8, as of 2026-10-01) on 2026-11-09; see research/verified-law-work.md.
 * Odds, salaries, waits and processing times are designed estimates and say so.
 */
import { bad, c, cfr, def, legal, mod, money, ok, social, study, well } from '../cx';
import { priceFactor } from '../economy';
import { cultureOf, mechanicsOf } from '../country';
import type { EbQueue } from '../country';
import { monthsInStatus, monthsSinceArrival, statusOf } from '../routes';
import type { RouteDef, StatusDef } from '../routes';
import type { ChallengeDef, Choice, Country, Flags, GameState } from '../types';

// ------------------------------------------------------------------ helpers

const YOU = { role: 'player' } as const;
const career = (label = 'career standing') => mod('career', 50, 0.3, label);

const ECFR_2142 = 'https://www.ecfr.gov/current/title-8/chapter-I/subchapter-B/part-214/section-214.2';
const ECFR_2141 = 'https://www.ecfr.gov/current/title-8/chapter-I/subchapter-B/part-214/section-214.1';
const ECFR_2045 = 'https://www.ecfr.gov/current/title-8/chapter-I/subchapter-B/part-204/subpart-A/section-204.5';
const ECFR_2452 = 'https://www.ecfr.gov/current/title-8/chapter-I/subchapter-B/part-245/section-245.2';
const BULLETIN_NOTE =
  'Waits are designed estimates from the November 2026 Visa Bulletin as reported by secondary sources (travel.state.gov could not be read directly). Dates move every month and can move backwards.';

const num = (s: GameState, k: string, d = 0): number => {
  const v = s.flags[k];
  return v === undefined || v === '' ? d : Number(v);
};
const now = (s: GameState): number => monthsSinceArrival(s);
const monthOf = (s: GameState): number => Math.max(0, s.schedule[s.index]?.month ?? 0);
/** Calendar year of the current card. Month 0 is August. */
const calYear = (s: GameState): number => s.startYear + s.year + Math.floor((7 + monthOf(s)) / 12);
const cost = (s: GameState, n: number): number => Math.round(n * priceFactor(calYear(s)));
const hasJob = (s: GameState): boolean => num(s, 'salary') > 0;

/** OPT unemployment days used so far: banked days plus the current stretch without a job. */
const unempDays = (s: GameState): number => {
  const banked = num(s, 'optUnempDays');
  if (hasJob(s) || s.flags.unempSince === undefined) return banked;
  return banked + Math.max(0, now(s) - num(s, 'unempSince')) * 30;
};
const unempLimit = (s: GameState): number => (statusOf(s) === 'STEM_OPT' ? 150 : 90);

/** Flags for starting a job: banks the unemployment days and sets salary and title. */
const startJob = (s: GameState, salary: number, jobTitle: string, extra: Flags = {}): Flags => ({
  salary,
  jobTitle,
  optUnempDays: unempDays(s),
  ...extra,
});

const EVIDENCE = ['evPubs', 'evJudge', 'evPress', 'evAward', 'evCritical'] as const;
const evCount = (s: GameState): number => EVIDENCE.filter((k) => Boolean(s.flags[k])).length;

type Cat = 'eb1' | 'eb2' | 'eb3';
/** Designed waits in years from priority date to a current final action date (see BULLETIN_NOTE). */
const QUEUE_WAIT: Record<EbQueue, Record<Cat, number>> = {
  india: { eb1: 4, eb2: 13, eb3: 13 },
  china: { eb1: 3, eb2: 5, eb3: 5 },
  philippines: { eb1: 0, eb2: 2, eb3: 3 },
  mexico: { eb1: 0, eb2: 2, eb3: 2 },
  row: { eb1: 0, eb2: 2, eb3: 2 },
};
const waitFor = (c: Country): Record<Cat, number> => QUEUE_WAIT[mechanicsOf(c)?.ebQueue ?? 'row'];
const WAIT = { india: QUEUE_WAIT.india };
const catOf = (s: GameState): Cat => {
  const v = String(s.flags.gcCat ?? 'eb2');
  return v === 'eb1' || v === 'eb3' ? v : 'eb2';
};
const waitYears = (s: GameState, cat: Cat = catOf(s)): number => waitFor(s.profile.country)[cat] + num(s, 'waitExtra');
const pdCurrent = (s: GameState): boolean =>
  Boolean(s.flags.i140Approved) && calYear(s) >= num(s, 'priorityYear', 9999) + waitYears(s);

/** Months left before the six-year H-1B limit (or an AC21 extension) runs out. */
// h1bSince is set back by any H-1B months used before a stretch in another status (h1bUsedBefore), so the six years count all H-1B time.
const h1bLeft = (s: GameState): number => num(s, 'h1bMaxUntil', num(s, 'h1bSince') + 72) - now(s);

/** Designed H-1B selection odds (percent). Sourced rates are only overall, so this is an estimate. */
const lotteryOdds = (s: GameState): number => {
  const y = calYear(s);
  const level = Math.min(4, Math.max(1, num(s, 'wageLevel', 2)));
  const base = y >= 2026 ? [15, 28, 40, 52][level - 1] : 30;
  return base + (s.flags.usMasters ? 6 : 0);
};

const isWorker = (s: GameState): boolean => ['H1B', 'O1'].includes(statusOf(s));

/**
 * Flags for becoming an F-1 student again mid-journey (from H-1B, O-1 or practical training).
 * The job ends, the student road starts fresh from this year, and anything tied to the old employer
 * or the old status is cleared so its cards stop. H-1B months already used are kept, because they
 * still count toward the six-year limit if you return to H-1B later.
 */
// attorney review: change of status to F-1 and how earlier H-1B time counts on a later return.
const becomeStudent = (s: GameState): Flags => {
  const used = statusOf(s) === 'H1B' ? Math.max(0, now(s) - num(s, 'h1bSince')) + num(s, 'h1bUsedBefore') : num(s, 'h1bUsedBefore');
  return {
    status: 'F1', salary: 0, jobTitle: '', degreeStart: s.year, gradYear: '',
    graduated: false, researchTrack: false, optApplied: false, optStarted: false, optMissed: false, stemApplied: false,
    pendingOffer: false, h1bPetitionFiled: false, h1bSelected: false, capGap: false, capExempt: false,
    inGrace: false, graceUsed: false, h1bMaxUntil: '', h1bUsedBefore: used, optUnempDays: 0, unempSince: '',
  };
};

// ------------------------------------------------------------------ facts (rule text read 2026-11-09)

const FACT_OPT_FILE = cfr(
  'work-opt-file',
  'Applying for OPT',
  'You start OPT by asking your DSO for a recommendation. For post-completion OPT you may file Form I-765 up to 90 days before your program end date and no later than 30 days after it, and within 30 days of the DSO recommendation. A student may get 12 months of practical training, and 12 more after moving to a higher degree level. (8 CFR 214.2(f)(10), (f)(11)(i)(B))',
  ECFR_2142,
);
const FACT_OPT_UNEMP = cfr(
  'work-opt-unemp',
  'OPT unemployment limit',
  'During post-completion OPT, F-1 status depends on employment. You may not accrue more than 90 days of unemployment; with a 24-month STEM extension the limit is 150 days across the whole OPT period. (8 CFR 214.2(f)(10)(ii)(E))',
  ECFR_2142,
);
const FACT_STEM = cfr(
  'work-stem-opt',
  'STEM OPT extension',
  'A student on post-completion OPT with a qualifying STEM degree may apply for a 24-month extension. The employer must be enrolled in E-Verify and sign a training plan (Form I-983), and you may file up to 90 days before your OPT ends. On the extension you must report changes of address, employer or loss of employment within 10 days. (8 CFR 214.2(f)(10)(ii)(C), (f)(11)(i)(C), (f)(12)(ii))',
  ECFR_2142,
);
const FACT_CAPGAP = cfr(
  'work-cap-gap',
  'Cap-gap',
  'If your employer timely files a nonfrivolous cap H-1B petition asking to change your status, your F-1 status and OPT work permission are extended until April 1 of that fiscal year or the petition start date, whichever is earlier. The extension ends if the petition is rejected, denied, revoked or withdrawn. (8 CFR 214.2(f)(5)(vii))',
  ECFR_2142,
);
const FACT_REG = cfr(
  'work-h1b-reg',
  'H-1B registration and weighted selection',
  'Employers register each worker online. Selection counts each person once. Under the rule in force for the March 2026 season onward, a person is entered once at wage level I, twice at II, three times at III and four times at IV, based on the offered wage. Only a selected employer may file the petition. (8 CFR 214.2(h)(8)(iii)(A)(4))',
  ECFR_2142,
);
const FACT_PORT = cfr(
  'work-h1b-port',
  'Changing H-1B employers',
  'An H-1B worker who was lawfully admitted and has not worked without authorization may start with a new employer once that employer files a nonfrivolous H-1B petition before the current stay expires, or on the requested start date, whichever is later. (8 CFR 214.2(h)(2)(i)(H))',
  ECFR_2142,
);
const FACT_GRACE = cfr(
  'work-grace',
  'The 60-day grace period',
  'When H-1B or O-1 employment ends, you are not out of status for that reason alone for up to 60 consecutive days or until your stay ends, whichever is shorter, once per authorized validity period. You may not work in that time, but you may apply to extend or change status. (8 CFR 214.1(l)(2))',
  ECFR_2141,
);
const ECFR_248 = 'https://www.ecfr.gov/current/title-8/chapter-I/subchapter-B/part-248';
// attorney review: H-1B to F-1 mechanics (I-20, SEVIS fee, I-539, when H-1B work must stop).
const FACT_TO_F1 = cfr(
  'work-h1b-to-f1',
  'From H-1B to student',
  'A school that admits you issues a Form I-20, and you pay the SEVIS fee. From inside the US you may ask to change to F-1 with Form I-539 while your H-1B status is still valid (8 CFR 248.1). The other road is to leave, get an F-1 visa at a consulate and come back for the term. You may keep your H-1B job while the request is pending, but H-1B work has to stop once F-1 status begins: an F-1 student may not keep working for the old employer (8 CFR 214.2(f)(9), 214.1(e)).',
  ECFR_248,
);
const FACT_UNAUTH = cfr(
  'work-unauth',
  'One petition per employer',
  'An H-1B worker who will work for more than one employer needs a separate petition from each employer. Working without authorization is a failure to maintain status. (8 CFR 214.2(h)(2)(i)(C); 8 CFR 214.1(e))',
  ECFR_2142,
);
const FACT_SIX = cfr(
  'work-six-year',
  'The six-year H-1B limit',
  'H-1B time is capped at six years in total; after that you must spend a year outside the US before H or L status again. Extensions past six years are possible if a labor certification or I-140 was filed for you at least 365 days earlier (1-year steps), or if your I-140 is approved and only the per-country limit keeps you waiting (up to 3-year steps). (8 CFR 214.2(h)(13)(iii)(A), (D), (E))',
  ECFR_2142,
);
const FACT_PD = cfr(
  'work-priority-date',
  'Your place in line',
  'For a petition based on a labor certification, your priority date is the day the Department of Labor accepted the labor certification application; for petitions without one, it is the day the I-140 is properly filed. An approved I-140 keeps its priority date for later employment petitions, unless revoked for fraud or a labor certification problem. (8 CFR 204.5(d), (e))',
  ECFR_2045,
);
const FACT_AOS = cfr(
  'work-aos-file',
  'When you can file for the green card',
  'A visa number must be immediately available for your priority date before you can properly file to adjust status. For EB-1, EB-2 and EB-3, the adjustment form may be filed together with the I-140 if a visa would be available on approval. Employment-based applicants may still adjust despite up to 180 days in total of status violations or unauthorized work since their last lawful admission. (8 CFR 245.2(a)(2)(i); INA 245(k))',
  ECFR_2452,
);
const FACT_O1 = cfr(
  'work-o1-criteria',
  'What an O-1 needs',
  'O-1 in the sciences, education, business or athletics needs sustained national or international acclaim: a major international award, or at least three of eight kinds of evidence such as national prizes, selective memberships, press about you, judging others, major original contributions, scholarly articles, a critical role at a distinguished organization, or a high salary. A peer consultation is required. (8 CFR 214.2(o)(3)(iii), (o)(5))',
  ECFR_2142,
);
const FACT_O1_AGENT = cfr(
  'work-o1-agent',
  'Agents and many clients',
  'If an O-1 worker will work for more than one employer at the same time, each employer must file a separate petition unless an established US agent files one petition. A new employer must file its own petition and extension request. (8 CFR 214.2(o)(2)(iv)(B), (C), (F))',
  ECFR_2142,
);
const FACT_O1_EXT = cfr(
  'work-o1-ext',
  'Renewing an O-1',
  'An O-1 petition is approved for the time needed for the activity, up to 3 years. Extensions come in steps of up to 1 year to continue the same activity, plus 10 days. A denied extension cannot be appealed. (8 CFR 214.2(o)(6)(iii), (o)(12))',
  ECFR_2142,
);
const FACT_EB1A = cfr(
  'work-eb1a',
  'Extraordinary ability (EB-1A)',
  'You may file an I-140 for yourself. You must show sustained national or international acclaim: a one-time major international award, or at least three of ten kinds of evidence (prizes, selective memberships, press about you, judging, major contributions, scholarly articles, exhibitions, a leading role, a high salary, commercial success). No job offer or labor certification is needed, only evidence you will continue your work here. (8 CFR 204.5(h))',
  ECFR_2045,
);
const FACT_NIW = cfr(
  'work-niw',
  'The national interest waiver (EB-2)',
  'EB-2 normally needs an employer and a labor certification. If the job-offer requirement is waived in the national interest, you may petition for yourself. An advanced degree is a US degree above a bachelor\'s, or a bachelor\'s followed by five years of progressive experience. (8 CFR 204.5(k)(1), (2), (4))',
  ECFR_2045,
);

// ------------------------------------------------------------------ routes and statuses

export const ROUTES: RouteDef[] = [
  {
    id: 'H1B',
    name: 'H-1B worker',
    note: 'A US employer registered you, you were selected, and your petition was approved. You arrive with a job, a salary and a visa tied to that employer.',
    startStatus: 'H1B',
    arrival: ['work-h1b-port', 'work-h1b-first-days', 'work-arrival-home'],
    startFlags: { salary: 5800, jobTitle: 'software engineer', h1bSince: 0, wageLevel: 2, advancedDegree: true, everify: true },
    startMoney: 4500,
  },
  {
    id: 'O1',
    name: 'O-1 extraordinary ability',
    note: 'Your record of publications, judging and recognized work earned you an O-1. There is no lottery, but the visa rests on the evidence you keep building.',
    startStatus: 'O1',
    arrival: ['work-o1-port', 'work-o1-first-engagement', 'work-arrival-home'],
    startFlags: { salary: 6200, jobTitle: 'research scientist', o1ValidUntil: 35, evPubs: true, evJudge: true, evCritical: true, advancedDegree: true },
    startMoney: 5000,
  },
];

const yearStart = (s: GameState): number => s.year * 12;

export const STATUSES: StatusDef[] = [
  {
    code: 'OPT',
    label: 'OPT',
    lawful: true,
    work: 'any',
    pinned: (s) => (s.flags.h1bPetitionFiled ? [[2, 'work-h1b-start']] : [[7, 'work-h1b-registration'], [8, 'work-h1b-result']]),
    next: 'OPT lasts 12 months. A STEM extension, an H-1B selection or another status has to come before it ends.',
  },
  {
    code: 'STEM_OPT',
    label: 'STEM OPT',
    lawful: true,
    work: 'employer',
    pinned: (s) => (s.flags.h1bPetitionFiled ? [[2, 'work-h1b-start']] : [[7, 'work-h1b-registration'], [8, 'work-h1b-result']]),
    next: 'The STEM extension adds 24 months with an E-Verify employer: usually two or three more tries at the H-1B lottery.',
  },
  {
    code: 'H1B',
    label: 'H-1B',
    lawful: true,
    work: 'employer',
    pinned: (s) => {
      const left = num(s, 'h1bMaxUntil', num(s, 'h1bSince') + 72) - yearStart(s);
      return left > 0 && left <= 14 ? [[Math.min(11, Math.max(0, left - 6)), 'work-h1b-six-year']] : [];
    },
    next: 'H-1B time is capped at six years unless a green card process is far enough along. The employer\'s labor certification and I-140 are the usual road.',
  },
  {
    code: 'O1',
    label: 'O-1',
    lawful: true,
    work: 'employer',
    pinned: (s) => {
      const left = num(s, 'o1ValidUntil', 35) - yearStart(s);
      return left > 0 && left <= 13 ? [[Math.min(11, Math.max(0, left - 3)), 'work-o1-renewal']] : [];
    },
    next: 'An O-1 renews a year at a time for the same work. Many O-1 holders build toward a self-petitioned green card.',
  },
];

// ------------------------------------------------------------------ cards

const ARRIVAL: ChallengeDef[] = [
  def('work-h1b-port', 'big', 0, (s) => ({
    id: 'work-h1b-port',
    track: 'big',
    title: 'Port of entry with a work visa',
    body: `The officer asks for your passport with the H-1B visa and the approval notice your employer's lawyer mailed you (Form I-797). Behind you a family with four suitcases is trying to keep a toddler in line.${s.profile.country === 'nigeria' ? ' You have read the news about 2026 visa restrictions for Nigeria; the research for this game found that they name student and visitor visas, not the H-1B, but you still hold your breath.' : ''}`,
    stage: 'airport',
    cast: [{ ...YOU, pose: 'idle' }, { role: 'officer', pose: 'talk' }],
    choices: [
      c('ready', 'Hand over the passport, visa and approval notice together, and answer about the job plainly.', ok('The officer asks who you will work for and what you will do. Your answers match the notice. A stamp, and you are through.', { legal: 4, wellbeing: 3 }), {
        roll: { base: 92 },
        fail: bad('A name on the notice is spelled differently from your passport. You wait in a side room for an hour before you are admitted.', { wellbeing: -5 }, 'Small mismatches cost time.', 'Officers compare your documents with each other. Checking the approval notice against your passport before you fly saves trouble.'),
      }),
      c('no-notice', 'You packed the approval notice in your checked bag.', ok('The officer can see the approved petition in the system and lets you through after a few extra questions.', { wellbeing: -1 }), {
        roll: { base: 65 },
        fail: bad('Without the notice in hand you are sent to secondary inspection while they confirm the petition. It takes two hours.', { wellbeing: -6, legal: -1 }, 'That paper belonged in your hand luggage.'),
      }),
      c('chatty', 'Mention that you hope to start a company on the side someday.', bad('The officer asks several careful questions about who you will actually work for before admitting you.', { wellbeing: -3 }, 'An H-1B is tied to the employer that petitioned for you.', 'H-1B status is employer-specific: other work needs its own petition (8 CFR 214.2(h)(2)(i)(C)). A daydream is not a violation, but it is not a good thing to lead with.')),
    ],
  })),

  def('work-h1b-first-days', 'work', 0, (s) => ({
    id: 'work-h1b-first-days',
    track: 'work',
    title: 'First week at the office',
    body: `Your badge works on the second try. Your manager walks you through a ${String(s.flags.jobTitle ?? 'new')} role, a laptop setup checklist and a payroll form asking for a Social Security number you do not have yet.`,
    narration: 'Your badge works on the second try. Your first week starts with a laptop checklist and a lot of new names.',
    lines: [
      { who: 'advisor', text: 'Welcome aboard. Here is your setup checklist, and payroll needs one form today.' },
      { who: 'advisor', text: 'It asks for your Social Security number.' },
      { who: 'player', text: 'I do not have one yet. I only just arrived.' },
      { who: 'friend', text: 'Same thing happened to me. Also, a few of us get lunch at noon.' },
    ],
    stage: 'lab',
    cast: [{ ...YOU, pose: 'type' }, { role: 'advisor', pose: 'talk' }, { role: 'friend', pose: 'wave' }],
    choices: [
      c('ssn', 'Ask HR how to apply for a Social Security number and do it this week.', ok('A morning at the Social Security office, a receipt, and your first paycheck arrives on time.', { career: 3, wellbeing: 2 })),
      c('team', 'Take your new teammates up on lunch every day.', ok('You learn who knows what, and who to ask about rent. The work gets easier quickly.', { community: 5, career: 2 })),
      c('alone', 'Keep your head down and prove yourself.', ok('You ship your first change by Friday. Nobody knows your name yet.', { career: 3, community: -2, wellbeing: -1 })),
    ],
  })),

  def('work-o1-port', 'big', 0, () => ({
    id: 'work-o1-port',
    track: 'big',
    title: 'Port of entry with an O-1',
    body: 'The officer looks at your O-1 visa and approval notice, then at you. "Extraordinary ability," he reads aloud. "In what?" Your folder of evidence is in your bag, heavy with printouts.',
    stage: 'airport',
    cast: [{ ...YOU, pose: 'idle' }, { role: 'officer', pose: 'talk' }],
    inlineFact: FACT_O1,
    choices: [
      c('plain', 'Explain your field in one plain sentence and name the organization you will work with.', ok('He nods, stamps, and wishes you luck with the research.', { legal: 4, wellbeing: 3 }), {
        roll: { base: 92 },
        fail: bad('He asks for more about the engagement. Ten minutes of questions, then you are admitted.', { wellbeing: -3 }, 'Short answers usually go furthest.'),
      }),
      c('folder', 'Offer to show him your whole evidence folder.', ok('He smiles and says that is not needed. You are admitted.', { wellbeing: -1 })),
      c('modest', 'Say it is "nothing special, really".', bad('He pauses at the mismatch between your words and your visa, asks two more questions, and admits you.', { wellbeing: -3 }, 'Modesty is lovely, but your papers say otherwise.')),
    ],
  })),

  def('work-o1-first-engagement', 'work', 0, () => ({
    id: 'work-o1-first-engagement',
    track: 'work',
    title: 'Your first engagement',
    body: 'Your first week is a symposium where you are on the program. The organizer who signed your petition introduces you to people whose papers you have read for years.',
    stage: 'conference',
    cast: [{ ...YOU, pose: 'present' }, { role: 'professor', pose: 'talk' }, { role: 'recruiter', pose: 'idle' }],
    choices: [
      c('talk', 'Give your talk and stay for every question.', ok('The questions are sharp and fair. Afterwards two people ask for your slides.', { career: 5, community: 3 }), {
        roll: { base: 75, mods: [career(), well()] },
        fail: bad('Jet lag catches you mid-sentence and you lose your place. People are kind about it.', { career: 1, wellbeing: -3 }, 'You know this work better than that showed.'),
      }),
      c('network', 'Spend the breaks meeting people.', ok('By the end you have a dinner invitation and a collaborator.', { community: 6, career: 2 })),
      c('hide', 'Give the talk and slip out to rest.', ok('You sleep fourteen hours. The talk went fine.', { wellbeing: 3 })),
    ],
  })),

  def('work-arrival-home', 'life', 0, (s) => {
    const deposit = cost(s, 1700);
    return {
      id: 'work-arrival-home',
      track: 'life',
      title: 'Finding a place to live',
      body: `You have a salary but no US credit history. A landlord asks for last month's rent and a deposit on top of the first month, about ${money(deposit)} extra up front (a designed estimate), or a guarantor.`,
      stage: 'apartment',
      cast: [{ ...YOU, pose: 'talk' }, { role: 'landlord', pose: 'talk' }],
      choices: [
        c('letter', 'Offer your offer letter and pay the larger deposit.', ok('The landlord reads your offer letter twice and hands you keys.', { money: -deposit, wellbeing: 4 })),
        c('share', 'Rent a room in a shared apartment from a colleague\'s friend.', ok('Cheaper, noisier, and someone to eat dinner with.', { money: -Math.round(deposit / 3), community: 4, wellbeing: 1 })),
        c('broker', 'Pay a broker who promises a place "today, no questions".', bad('The apartment exists, but the fee was steep and the heating is a rumor.', { money: -Math.round(deposit * 1.4), wellbeing: -4 }, 'Fast and easy came at a price.')),
      ],
    };
  }),
];

// ------------------------------------------------------------------ the F-1 employer road (year 2 onward)

const F1_ROAD: ChallengeDef[] = [
  def('work-f1-job-search', 'work', 2.5, () => ({
    id: 'work-f1-job-search',
    track: 'work',
    title: 'The job search starts',
    body: 'Your final year. The career fair hall is full of company banners. Some recruiters ask "Will you need sponsorship?" before they ask your name.',
    stage: 'careerfair',
    cast: [{ ...YOU, pose: 'talk' }, { role: 'recruiter', pose: 'talk' }, { role: 'student', pose: 'idle' }],
    fact: 'f1-first-job-pay-estimate',
    choices: [
      c('fair', 'Work the fair with a sharp resume and an honest answer about sponsorship.', ok('A mid-size company invites you to interview and then makes an offer that starts once your OPT begins.', { career: 6, wellbeing: 3, flags: { pendingOffer: true, pendingSalary: 5400, pendingTitle: 'software engineer', everify: true } }), {
        roll: { base: 45, mods: [career(), study()] },
        fail: bad('Lots of friendly conversations, no offers yet.', { career: 2, wellbeing: -3 }, 'It is early. Keep going.'),
      }),
      c('lab', 'Ask your professor about a research staff job at the university.', ok('The lab has funding for a research engineer. Universities are exempt from the H-1B cap, which matters later.', { career: 3, flags: { pendingOffer: true, pendingSalary: 3900, pendingTitle: 'research engineer', capExempt: true, everify: true } }, 'Universities and their affiliated nonprofits, and nonprofit or government research organizations, are exempt from the H-1B cap, so they can sponsor without the lottery (USCIS H-1B page, research/us-rules-and-timeline.md).'), {
        roll: { base: 50, mods: [study()] },
        fail: bad('The professor would love to, but the grant will not stretch that far this year.', { wellbeing: -2 }, 'Funding is out of anyone\'s hands.'),
      }),
      c('spray', 'Send two hundred online applications in a week.', ok('Silence, mostly, and one phone screen.', { career: 1, wellbeing: -4 })),
    ],
  }), { statuses: ['F1'], months: [1, 2, 3, 4, 5, 6, 7, 8], when: (s) => s.year >= num(s, 'degreeStart') + 1 && !s.flags.pendingOffer && !s.flags.graduated && !s.flags.researchTrack }),

  def('work-f1-graduation', 'status', 6, (s) => {
    const stem = s.flags.stemDegree === undefined ? s.seed % 5 !== 0 : Boolean(s.flags.stemDegree);
    const fee = cost(s, 500);
    return {
      id: 'work-f1-graduation',
      track: 'status',
      title: 'Graduation is coming',
      body: `Your last term. The DSO walks you through what comes after: practical training (OPT), another degree, or going home. She checks your degree code and says it ${stem ? 'is' : 'is not'} on the STEM list${stem ? ', so a 24-month extension could follow OPT' : ''}. The work permit application costs about ${money(fee)} (a designed estimate; check the current USCIS fee).`,
      narration: `Your last term. The work permit application for practical training costs about ${money(fee)} (a designed estimate; check the current USCIS fee).`,
      lines: [
        { who: 'dso', text: 'Let us talk about what comes after: practical training (OPT), another degree, or home.' },
        {
          who: 'dso',
          text: stem
            ? 'Your degree code is on the STEM list, so a 24-month extension could follow OPT.'
            : 'Your degree code is not on the STEM list, so there is no STEM extension after OPT.',
        },
        { who: 'player', text: 'When would I need to file?' },
        { who: 'dso', text: 'Up to 90 days before your program ends, and no later than 30 days after.' },
      ],
      stage: 'intl-office',
      cast: [{ ...YOU, pose: 'think' }, { role: 'dso', pose: 'talk' }],
      inlineFact: FACT_OPT_FILE,
      choices: [
        c('opt', 'Ask for the OPT recommendation and file now.', ok('The DSO signs your I-20, you file the same week, and a receipt arrives. Now you wait.', { money: -fee, legal: 4, flags: { optApplied: true, graduated: true, gradYear: s.year, stemDegree: stem, advancedDegree: true, usMasters: true } }, 'Filing early, within 90 days before the program end date, gives the most time for the card to arrive before you need it (8 CFR 214.2(f)(11)(i)(B)).')),
        c('phd', 'Stay on for a PhD. The research has hold of you.', ok('Your advisor is delighted. A new I-20 for a new program, and the long road of a doctorate.', { study: 4, wellbeing: 2, flags: { researchTrack: true, stemDegree: stem, advancedDegree: true, usMasters: true } }, 'Moving to a higher degree level gives a new 12 months of practical training later (8 CFR 214.2(f)(10)).')),
        c('later', 'Deal with it after graduation.', ok('You file in the weeks after the ceremony, just inside the window.', { money: -fee, wellbeing: -2, flags: { optApplied: true, graduated: true, gradYear: s.year, stemDegree: stem, advancedDegree: true, usMasters: true } }), {
          roll: { base: 55 },
          fail: bad('By the time you file, the 30 days after your program end date have passed. The application is denied.', { money: -fee, legal: -20, wellbeing: -8, flags: { graduated: true, gradYear: s.year, optMissed: true, stemDegree: stem, advancedDegree: true } }, 'Some deadlines do not bend.', 'Post-completion OPT must be filed no later than 30 days after the program end date (8 CFR 214.2(f)(11)(i)(B)). After study ends, the rule text gives 30 days to leave or take another lawful step (8 CFR 214.2(f)(5)(v)).'),
        }),
        c('home', 'Go home after graduation.', { text: 'You walk across the stage with your family on a video call, then pack. The degree comes with you.', effects: { family: 8, wellbeing: 3 }, passed: true, ends: 'went-home' }),
      ],
    };
  }, { statuses: ['F1'], months: [6, 7, 8, 9], when: (s) => s.year >= num(s, 'degreeStart') + 1 && !s.flags.graduated && !s.flags.researchTrack }),

  def('work-f1-opt-start', 'status', 8, (s) => {
    if (s.flags.optMissed) {
      return {
        id: 'work-f1-opt-start',
        track: 'status',
        title: 'No work permit',
        body: 'Your degree is done and the OPT application was too late. The rule text gives you 30 days to leave or take another lawful step.',
        stage: 'intl-office',
        cast: [{ ...YOU, pose: 'think' }, { role: 'dso', pose: 'talk' }],
        fact: 'f1-grace-period',
        choices: [
          c('enroll', 'Enroll in another program and get a new I-20.', ok('A new program, new tuition, and your student status continues.', { money: -cost(s, 3000), study: 2, flags: { optMissed: false, graduated: false } })),
          c('home', 'Go home and apply from there.', { text: 'You leave within the 30 days, with your record clean.', effects: { family: 6 }, passed: true, ends: 'went-home', lookback: 'Leaving within the grace period keeps your record clean for future visas.' }),
          c('stay', 'Stay and hope something comes up.', bad('The 30 days pass. You are now out of status.', { legal: -25, wellbeing: -8, flags: { status: 'NONE', statusLostReason: 'opt-missed', salary: 0 } }, 'Staying without a plan has costs that grow.', 'Unlawful presence of more than 180 days can bar a return for 3 years after you leave, and a year or more for 10 years (INA 212(a)(9)(B)).')),
        ],
      };
    }
    const pending = Boolean(s.flags.pendingOffer);
    const salary = num(s, 'pendingSalary', 5000);
    const title = String(s.flags.pendingTitle ?? 'analyst');
    return {
      id: 'work-f1-opt-start',
      track: 'status',
      title: 'Your work permit arrives',
      body: pending
        ? `The card is in the mailbox. Your ${title} job can start the day it is valid.`
        : 'The card is in the mailbox. You have a work permit and no job. From the first valid day, unemployment days start counting.',
      stage: 'apartment',
      cast: [{ ...YOU, pose: 'cheer' }, { role: 'roommate', pose: 'wave' }],
      inlineFact: FACT_OPT_UNEMP,
      fact: 'opt-length',
      choices: pending
        ? [
            c('start', 'Start the job and report your employer to the DSO.', ok('Your first paycheck as a graduate. You send part of it home.', { career: 5, family: 3, legal: 3, flags: { status: 'OPT', optStarted: true, pendingOffer: false, salary, jobTitle: title, optUnempDays: 0 } }, 'On OPT you must report your employer, address changes and any interruption of employment to your DSO (8 CFR 214.2(f)(12)).')),
            c('start-quiet', 'Start the job; you will tell the DSO later.', bad('Work begins. The reporting email sits unread.', { career: 4, legal: -6, flags: { status: 'OPT', optStarted: true, pendingOffer: false, salary, jobTitle: title, optUnempDays: 0, optUnreported: true } }, 'Something feels unfinished.', 'Unreported OPT employment can look like unemployment in your record. Since 2025 ICE has sent warnings about unreported jobs (research fact mistake-unreported-opt-job, LIKELY).')),
          ]
        : [
            c('search', 'Start OPT and throw yourself into the search.', ok('A spreadsheet, a schedule and a lot of coffee.', { career: 2, wellbeing: -2, flags: { status: 'OPT', optStarted: true, salary: 0, unempSince: now(s), optUnempDays: 0 } })),
            c('rest', 'Start OPT, but take two weeks to rest first.', ok('You sleep, cook and call home. The counter ticks quietly.', { wellbeing: 4, flags: { status: 'OPT', optStarted: true, salary: 0, unempSince: now(s), optUnempDays: 0 } })),
          ],
    };
  }, { statuses: ['F1'], when: (s) => s.year >= 1 && (Boolean(s.flags.optApplied) || Boolean(s.flags.optMissed)) && !s.flags.optStarted && (s.year > num(s, 'gradYear') || monthOf(s) >= 9) }),
];

// ------------------------------------------------------------------ OPT and STEM OPT

const exitChoices = (s: GameState, reason: string): Choice[] => {
  const out: Choice[] = [];
  if (s.flags.capExempt && hasJob(s)) {
    out.push(c('cap-exempt', 'Ask your university employer to file a cap-exempt H-1B petition.', ok('No lottery for this employer. The petition is filed, then approved, and you move to H-1B.', { legal: 15, wellbeing: 6, flags: { status: 'H1B', h1bSince: now(s) - num(s, 'h1bUsedBefore'), capGap: false } }, 'Universities and affiliated nonprofit or government research employers are exempt from the H-1B cap (USCIS H-1B page).'), {
      roll: { base: 85, mods: [legal()] },
      fail: bad('The petition gets a request for more evidence and the timing slips. Your OPT runs out first.', { legal: -20, wellbeing: -8, flags: { status: 'NONE', statusLostReason: reason, salary: 0 } }, 'Timing was tight.'),
    }));
  }
  if (evCount(s) >= 3) {
    out.push(c('o1', 'Ask your employer to petition for an O-1 on your record.', ok('Your publications, your judging and your role at the lab carry it. You change status to O-1.', { legal: 15, wellbeing: 6, money: -cost(s, 4000), flags: { status: 'O1', o1ValidUntil: now(s) + 36 } }, 'O-1 needs at least three of eight kinds of evidence and a peer consultation (8 CFR 214.2(o)(3)(iii), (o)(5)). Lawyer fees are a designed estimate.'), {
      roll: { base: 55, mods: [career()], flagMods: [{ flag: 'legalHelp', delta: 10, label: 'legal help' }] },
      fail: bad('The petition is denied. The evidence was close, but not there yet.', { money: -cost(s, 4000), wellbeing: -8, flags: { status: 'NONE', statusLostReason: reason, salary: 0 } }, 'Close is a hard word.'),
    }));
  }
  out.push(
    c('enroll', 'Enroll in a new degree program.', ok('A higher degree, a new I-20 and, later, a new year of practical training. It costs money and years.', { money: -cost(s, 4000), study: 3, flags: becomeStudent(s) }, 'A student becomes eligible for another 12 months of practical training after moving to a higher educational level (8 CFR 214.2(f)(10)).')),
    c('home', 'Go home with what you have built.', { text: 'You pack your desk, take a photo of the city from the train, and fly home with savings and a resume that opens doors.', effects: { family: 8, wellbeing: 2 }, passed: true, ends: 'went-home', lookback: 'The rule text gives 30 days after OPT ends to depart or take another lawful step (8 CFR 214.2(f)(5)(v)). Leaving inside that window keeps future visas open.' }),
    c('stay', 'Stay without status and keep trying.', bad('The end date passes. Your work permit is just a card now.', { legal: -25, wellbeing: -8, flags: { status: 'NONE', statusLostReason: reason, salary: 0, jobTitle: '' } }, 'This road narrows month by month.', 'Unlawful presence of more than 180 days can bar a return for 3 years after leaving, a year or more for 10 years (INA 212(a)(9)(B)).')),
  );
  return out;
};

const OPT_CARDS: ChallengeDef[] = [
  def('work-opt-unemployment', 'status', 4, (s) => {
    const days = unempDays(s);
    const limit = unempLimit(s);
    if (days > limit) {
      return {
        id: 'work-opt-unemployment',
        track: 'status',
        title: 'The unemployment days ran out',
        body: `By your count you are at ${days} days without a job, over the limit of ${limit}. Your DSO says your status depended on employment.`,
        stage: 'intl-office',
        cast: [{ ...YOU, pose: 'think' }, { role: 'dso', pose: 'talk' }],
        inlineFact: FACT_OPT_UNEMP,
        choices: exitChoices(s, 'opt-unemployment'),
      };
    }
    return {
      id: 'work-opt-unemployment',
      track: 'status',
      title: 'Counting the days',
      body: `A spreadsheet on your wall counts unemployment days: ${days} used of ${limit}. Friends say "something will come". The number does not care.`,
      stage: 'apartment-night',
      cast: [{ ...YOU, pose: 'type' }],
      inlineFact: FACT_OPT_UNEMP,
      fact: 'opt-unemployment-days',
      choices: [
        c('network', 'Ask every alum you know for a referral.', ok('An alum forwards your resume with a kind note. A contract role in your field starts within weeks.', { career: 4, community: 3, flags: startJob(s, 4200, 'contract analyst', { everify: false }) }), {
          roll: { base: 40, mods: [career(), social()] },
          fail: bad('Warm replies, no openings yet.', { wellbeing: -3 }, 'Keep the list going.'),
        }),
        c('dso', 'Check your count with the DSO.', ok('Your DSO confirms the number and explains what counts as employment for OPT. You feel steadier knowing exactly where you stand.', { legal: 4, wellbeing: 2 })),
        c('ignore', 'Stop looking at the number.', bad('The weeks blur. The count goes up anyway.', { wellbeing: -4, legal: -3 }, 'Not looking does not stop the clock.')),
      ],
    };
  }, { statuses: ['OPT', 'STEM_OPT'], when: (s) => !hasJob(s) && s.flags.unempSince !== undefined }),

  def('work-opt-offer', 'work', 3.5, (s) => ({
    id: 'work-opt-offer',
    track: 'work',
    title: 'Two offers on the table',
    body: `After ${unempDays(s)} unemployment days, two emails in one week. A startup offers more money and stock but has never heard of E-Verify. A large company offers less, a training program and a plain answer about sponsorship.`,
    stage: 'cafe',
    cast: [{ ...YOU, pose: 'phone' }, { role: 'recruiter', pose: 'talk' }],
    inlineFact: FACT_STEM,
    choices: [
      c('big', 'Take the large company.', ok('A desk, a badge, a manager who says "we sponsor". You report the job to your DSO.', { career: 5, wellbeing: 4, flags: startJob(s, 5300, 'software engineer', { everify: true, wageLevel: 2 }) }, 'A STEM extension requires an E-Verify employer and a signed training plan (8 CFR 214.2(f)(10)(ii)(C)).'), {
        roll: { base: 80, mods: [career()] },
        fail: bad('The offer is withdrawn after a hiring freeze. Back to the list.', { wellbeing: -6 }, 'It was not about you.'),
      }),
      c('startup', 'Take the startup.', ok('Exciting work and long nights. The founder shrugs when you ask about E-Verify.', { career: 6, wellbeing: 1, flags: startJob(s, 6000, 'software engineer', { everify: false, wageLevel: 2 }) }, s.flags.stemDegree ? 'Without E-Verify, this employer cannot support your STEM extension (8 CFR 214.2(f)(10)(ii)(C)(5)).' : undefined)),
      c('hold', 'Hold out for something better.', bad('A third offer never comes this month.', { wellbeing: -3 }, 'Every day on the counter mattered.')),
    ],
  }), { statuses: ['OPT', 'STEM_OPT'], when: (s) => !hasJob(s) }),

  def('work-stem-opt', 'status', 6, (s) => {
    const fee = cost(s, 500);
    const ev = Boolean(s.flags.everify);
    return {
      id: 'work-stem-opt',
      track: 'status',
      title: 'The STEM extension',
      body: ev
        ? `Your OPT ends in a few months. Your employer is in E-Verify and HR has a training plan form ready. The filing fee is about ${money(fee)} (a designed estimate).`
        : 'Your OPT ends in a few months. Your degree qualifies for 24 more months, but your employer is not enrolled in E-Verify, so it cannot be the STEM employer.',
      stage: 'intl-office',
      cast: [{ ...YOU, pose: 'talk' }, { role: 'dso', pose: 'talk' }],
      inlineFact: FACT_STEM,
      fact: 'stem-opt-length',
      choices: ev
        ? [
            c('file', 'Complete the training plan with your manager and file.', ok('Approved. Twenty-four more months, and one or two more chances at the H-1B lottery.', { money: -fee, legal: 10, wellbeing: 4, flags: { status: 'STEM_OPT', stemApplied: true } }, 'With a timely filed STEM extension, work permission continues while it is pending; the 2016 rule allows up to 180 days (USCIS OPT page, research/visa-catalog.md).'), {
              roll: { base: 90, mods: [legal()] },
              fail: bad('A request for evidence about the training plan. You fix it and it is approved, two anxious months later.', { money: -fee, wellbeing: -4, legal: 4, flags: { status: 'STEM_OPT', stemApplied: true } }, 'The form wanted more detail.'),
            }),
            c('skip', 'Skip it; the H-1B will come through.', bad('You let the window pass.', { legal: -6, flags: { stemApplied: true } }, 'That was a lot of time to give up.', 'Without the extension, OPT ends after 12 months unless an H-1B petition or another status takes over.')),
          ]
        : [
            c('switch', 'Find an E-Verify employer before OPT ends.', ok('A company with E-Verify and a training program hires you. You file the extension with them.', { career: 3, money: -fee, legal: 8, flags: { ...startJob(s, 5400, 'software engineer', { everify: true }), status: 'STEM_OPT', stemApplied: true } }), {
              roll: { base: 50, mods: [career(), social()] },
              fail: bad('Interviews go well but nothing lands in time.', { wellbeing: -5, flags: { stemApplied: true } }, 'The calendar was tight.'),
            }),
            c('ask', 'Ask the startup to enroll in E-Verify.', ok('The founder signs up in an afternoon. You file the extension.', { money: -fee, legal: 8, flags: { everify: true, status: 'STEM_OPT', stemApplied: true } }), {
              roll: { base: 45, mods: [social()] },
              fail: bad('The founder says "maybe next quarter".', { wellbeing: -3, flags: { stemApplied: true } }, 'It was worth asking.'),
            }),
          ],
    };
  }, { statuses: ['OPT'], when: (s) => Boolean(s.flags.stemDegree) && hasJob(s) && !s.flags.stemApplied && monthsInStatus(s) >= 7 }),

  def('work-h1b-registration', 'status', 4, (s) => {
    const y = calYear(s);
    const employer = hasJob(s) || Boolean(s.flags.pendingOffer);
    const weighted = y >= 2026;
    const regFlags: Flags = { h1bRegYear: y };
    if (!employer) {
      return {
        id: 'work-h1b-registration',
        track: 'status',
        title: 'Registration month, without an employer',
        body: 'March. Everyone at the meetup is talking about H-1B registration. Only an employer can register you, and you do not have one right now.',
        stage: 'cafe',
        cast: [{ ...YOU, pose: 'think' }, { role: 'friend', pose: 'talk' }],
        inlineFact: FACT_REG,
        choices: [
          c('plan', 'Plan for next year and keep searching.', ok('You write down every company that sponsored last season.', { career: 2 })),
          c('consultant', 'Pay a "consultant" who says he can register you for a fee.', bad('He takes the money. There is no employer behind it.', { money: -cost(s, 1500), wellbeing: -6 }, 'It sounded too easy.', 'Registrations are submitted by the prospective employer, and false statements on a registration lead to denial (8 CFR 214.2(h)(8)(iii), (h)(10)(ii)).')),
          c('evidence', 'Put the energy into building your own record instead.', ok('You submit a paper and volunteer to review for a workshop.', { career: 2, study: 2 })),
        ],
      };
    }
    return {
      id: 'work-h1b-registration',
      track: 'status',
      title: 'H-1B registration',
      body: `March. HR emails: they will register you in the H-1B lottery. The registration fee is the employer's to pay${weighted ? '. Since the 2026 season, selection is weighted by the wage level of the offer' : ''}.`,
      stage: 'lab',
      cast: [{ ...YOU, pose: 'type' }, { role: 'advisor', pose: 'talk' }],
      inlineFact: FACT_REG,
      fact: 'h1b-lottery-basics',
      choices: [
        c('register', 'Thank HR and check every detail of your passport information.', ok('Registered. Results come by the end of the month.', { legal: 3, flags: regFlags }, `Odds in this game are designed estimates: reported overall selection rates were roughly 25 to 35 percent in the 2024 to 2026 seasons (law-firm summaries, LIKELY), and per-level rates for the weighted system were not published.`)),
        ...(weighted
          ? [c('negotiate', 'Ask for a raise that lifts the offer to the next wage level.', ok('Your manager makes the case and it works. A higher salary and more entries in the pool.', { career: 3, flags: { ...regFlags, wageLevel: Math.min(4, num(s, 'wageLevel', 2) + 1), ...(hasJob(s) ? { salary: num(s, 'salary') + 500 } : {}) } }, 'Each unique person is entered once at level I and up to four times at level IV (8 CFR 214.2(h)(8)(iii)(A)(4)(ii)).'), {
              roll: { base: 40, mods: [career()] },
              fail: bad('Budget is fixed this year. You are registered at the current level.', { wellbeing: -2, flags: regFlags }, 'It was a fair thing to ask.'),
            })]
          : []),
        c('two', 'Ask a second company to register you too, just in case.', ok('A friend\'s company agrees. Two registrations, one entry: selection counts each person once, but either employer could file if you are picked.', { career: 1, flags: regFlags }, 'Selection is by unique beneficiary: more registrations do not add entries (8 CFR 214.2(h)(8)(iii)(A)(4)).')),
      ],
    };
  }, { statuses: ['F1', 'OPT', 'STEM_OPT'], months: [7], when: (s) => !s.flags.h1bPetitionFiled && num(s, 'h1bRegYear') !== calYear(s) && (statusOf(s) !== 'F1' || (s.year >= 1 && Boolean(s.flags.pendingOffer))) }),

  def('work-h1b-result', 'status', 30, (s) => {
    const registered = num(s, 'h1bRegYear') === calYear(s);
    if (!registered) {
      return {
        id: 'work-h1b-result',
        track: 'status',
        title: 'Results week',
        body: 'Lottery results week. Your group chat fills with screenshots, some joyful, most not. You were not in it this year.',
        stage: 'cafe',
        cast: [{ ...YOU, pose: 'phone' }, { role: 'friend', pose: 'talk' }],
        choices: [
          c('cheer', 'Congratulate the ones who were picked, and console the rest.', ok('A long night of food and stories. Next year feels less lonely.', { community: 4 })),
          c('quiet', 'Mute the chat.', ok('Quieter. A little lonelier.', { wellbeing: 1, community: -1 })),
        ],
      };
    }
    const odds = lotteryOdds(s);
    const tries = num(s, 'h1bTries');
    const win: Flags = { h1bSelected: true, h1bPetitionFiled: true, capGap: true };
    const lose: Flags = { h1bTries: tries + 1 };
    const india = s.profile.country === 'india';
    return {
      id: 'work-h1b-result',
      track: 'status',
      title: 'The lottery email',
      body: `An email from HR with the subject line "H-1B registration status". ${india ? 'Your cousin in Pune has already asked twice.' : 'Your family has asked twice already.'}${tries ? ` This is try number ${tries + 1}.` : ''}`,
      stage: 'apartment-night',
      cast: [{ ...YOU, pose: 'phone' }, { role: 'roommate', pose: 'idle' }],
      fact: india ? 'h1b-india-share-fy2024' : 'h1b-lottery-basics',
      choices: [
        c('open', 'Open it now.', ok('Selected. You read it four times. HR says the lawyers will file the petition between April and June.', { wellbeing: 12, legal: 12, career: 3, flags: win }), {
          roll: { base: odds },
          fail: bad('Not selected. HR says they will try again next year if your status allows.', { wellbeing: -10, flags: lose }, 'It is a lottery. It was never a judgment of you.', `Selection is a random draw among registrations; this game uses a designed estimate of about ${odds} percent for your registration.`),
        }),
        c('wait', 'Wait until morning to open it with your coffee.', ok('Selected. You laugh out loud in the kitchen.', { wellbeing: 13, legal: 12, career: 3, flags: win }), {
          roll: { base: odds },
          fail: bad('Not selected. The coffee goes cold.', { wellbeing: -9, flags: lose }, 'Nothing you did changed the draw.'),
        }),
      ],
    };
  }, { statuses: ['F1', 'OPT', 'STEM_OPT'], months: [8], when: (s) => num(s, 'h1bRegYear') === calYear(s) && !s.flags.h1bSelected }),

  def('work-cap-gap', 'status', 4, (s) => ({
    id: 'work-cap-gap',
    track: 'status',
    title: 'The cap-gap',
    body: 'Your petition is filed and the H-1B would start on October 1. Your OPT card ends before that. Your DSO explains the "cap-gap".',
    stage: 'intl-office',
    cast: [{ ...YOU, pose: 'idle' }, { role: 'dso', pose: 'talk' }],
    inlineFact: FACT_CAPGAP,
    choices: [
      c('record', 'Ask the DSO to note the pending petition on your record, and keep the receipt.', ok('Your DSO updates your record. HR has a copy of the receipt too. You keep working.', { legal: 6, wellbeing: 3 })),
      c('travel', 'Plan a trip home this summer to celebrate.', bad('Your lawyer warns that travel while a change of status is pending can complicate it, and asks you to wait. You cancel the ticket.', { money: -cost(s, 200), wellbeing: -4 }, 'Ask before you book.', 'The cap-gap extension rests on a pending change-of-status request. How international travel affects that was not verified for this game, so ask an attorney first.')),
      c('ignore', 'Assume HR has it covered.', ok('They do, this time.', { wellbeing: 1 })),
    ],
  }), { statuses: ['F1', 'OPT', 'STEM_OPT'], months: [9, 10, 11], when: (s) => Boolean(s.flags.h1bPetitionFiled) }),

  def('work-h1b-start', 'status', 30, (s) => ({
    id: 'work-h1b-start',
    track: 'status',
    title: 'October first',
    body: 'The petition was decided over the summer. Today is the start date on it.',
    stage: 'lab',
    cast: [{ ...YOU, pose: 'cheer' }, { role: 'advisor', pose: 'wave' }],
    choices: [
      c('start', 'Log in on October 1 as an H-1B worker.', ok('Approved. Same desk, same team, new status. Your manager brings cake.', { legal: 15, wellbeing: 8, flags: { status: 'H1B', h1bSince: now(s) - num(s, 'h1bUsedBefore'), h1bPetitionFiled: false, h1bSelected: false, capGap: false } }, 'H-1B time counts toward a six-year limit (8 CFR 214.2(h)(13)(iii)(A)).'), {
        roll: { base: 88, mods: [legal()] },
        fail: bad('The petition was denied after a request for evidence about the job duties. Your cap-gap protection ends with it.', { legal: -12, wellbeing: -12, flags: { h1bPetitionFiled: false, h1bSelected: false, capGap: false } }, 'You did everything you were asked.', 'The cap-gap extension ends when the petition is denied (8 CFR 214.2(f)(5)(vii)(B)). Any OPT time left still counts.'),
      }),
    ],
  }), { statuses: ['F1', 'OPT', 'STEM_OPT'], months: [2], when: (s) => Boolean(s.flags.h1bPetitionFiled) }),

  def('work-opt-ending', 'status', 10, (s) => ({
    id: 'work-opt-ending',
    track: 'status',
    title: statusOf(s) === 'STEM_OPT' ? 'The STEM extension is ending' : 'OPT is ending',
    body: `Your ${statusOf(s) === 'STEM_OPT' ? 'STEM extension' : 'OPT'} ends in a few weeks and no H-1B petition is pending. ${num(s, 'h1bTries') ? `The lottery passed you by ${num(s, 'h1bTries')} time${num(s, 'h1bTries') > 1 ? 's' : ''}. ` : ''}Your DSO asks what comes next.`,
    stage: 'intl-office',
    cast: [{ ...YOU, pose: 'think' }, { role: 'dso', pose: 'talk' }],
    fact: 'f1-grace-period',
    choices: exitChoices(s, 'opt-ended'),
  }), {
    statuses: ['OPT', 'STEM_OPT'],
    when: (s) => !s.flags.h1bPetitionFiled && (statusOf(s) === 'STEM_OPT' ? monthsInStatus(s) >= 23 : monthsInStatus(s) >= 11 && !(s.flags.stemDegree && hasJob(s) && !s.flags.stemApplied)),
  }),
];

// ------------------------------------------------------------------ H-1B life

const H1B_CARDS: ChallengeDef[] = [
  def('work-h1b-portability', 'work', 2, (s) => {
    const lose = Boolean(s.flags.permFiled) && !s.flags.i140Approved;
    return {
      id: 'work-h1b-portability',
      track: 'work',
      title: 'A better offer',
      body: `A recruiter calls with a role that pays noticeably more. The new company would file a new H-1B petition.${lose ? ' But your current employer\'s labor certification is in progress, and it would not come with you.' : s.flags.i140Approved ? ' Your approved I-140 keeps its priority date even if you move.' : ''}`,
      stage: 'cafe',
      cast: [{ ...YOU, pose: 'talk' }, { role: 'recruiter', pose: 'talk' }],
      inlineFact: lose || s.flags.i140Approved ? FACT_PD : FACT_PORT,
      choices: [
        c('move', 'Accept and start once the new petition is filed.', ok('The lawyer files the petition on Monday and you start with the new team the next week.', { career: 5, wellbeing: 3, flags: { salary: num(s, 'salary') + 900, jobTitle: 'senior engineer', wageLevel: Math.min(4, num(s, 'wageLevel', 2) + 1), ...(lose ? { permFiled: false, priorityYear: '' } : {}) } }, 'You may start new H-1B employment once the new employer files a nonfrivolous petition, if you were lawfully admitted and have not worked without authorization (8 CFR 214.2(h)(2)(i)(H)).'), {
          roll: { base: 80, mods: [career()], flagMods: [{ flag: 'h1bUnauthWork', delta: -40, label: 'past unauthorized work' }] },
          fail: bad('The new company\'s lawyer finds a problem and the offer stalls. You stay where you are, a little embarrassed.', { wellbeing: -4 }, 'Not every door opens on the first push.'),
        }),
        c('counter', 'Use the offer to ask your manager for a raise.', ok('Your manager matches part of it.', { career: 2, flags: { salary: num(s, 'salary') + 400 } }), {
          roll: { base: 50, mods: [career()] },
          fail: bad('Your manager says there is no budget, and things feel awkward for a week.', { wellbeing: -3 }, 'Leverage cuts both ways.'),
        }),
        c('stay', 'Stay. The green card process matters more right now.', ok('You decline politely. The recruiter says to call any time.', { legal: 2 })),
      ],
    };
  }, { statuses: ['H1B'], when: (s) => hasJob(s) && !s.flags.inGrace && monthsInStatus(s) >= 6 }),

  def('work-h1b-layoff', 'work', 1.2, (s) => ({
    id: 'work-h1b-layoff',
    track: 'work',
    title: 'A calendar invite with no title',
    body: 'Fifteen minutes with your manager and someone from HR. The company is cutting a tenth of the team, and your name is on the list. Your access ends at five.',
    narration: 'A calendar invite with no title: fifteen minutes with your manager and someone from HR.',
    lines: [
      { who: 'advisor', text: 'Thank you for coming in. The company is cutting a tenth of the team.' },
      { who: 'advisor', text: 'I am sorry. Your role is on the list, and your access ends at five today.' },
      { who: 'player', text: 'Today? My visa depends on this job.' },
      { who: 'advisor', text: 'I know. HR can answer questions about your last day and severance.' },
    ],
    stage: 'lab',
    cast: [{ ...YOU, pose: 'sit' }, { role: 'advisor', pose: 'talk' }],
    fact: 'h1b-60-day-grace',
    choices: [
      c('ask', 'Ask HR for your last day in writing and for severance.', ok('You get the date in writing and two weeks of pay. That date starts your 60 days.', { money: cost(s, 2500), wellbeing: -8, flags: { salary: 0, jobTitle: '', inGrace: true, graceSince: now(s) } }, 'The grace period runs up to 60 consecutive days from when employment ends, or until your stay ends if sooner (8 CFR 214.1(l)(2)).')),
      c('call', 'Call your closest friend from the car park.', ok('They pick up on the first ring and stay on the line all the way home.', { wellbeing: -5, community: 3, flags: { salary: 0, jobTitle: '', inGrace: true, graceSince: now(s) } })),
      c('freeze', 'Go home and stare at the wall.', bad('A whole day disappears. Then two.', { wellbeing: -10, flags: { salary: 0, jobTitle: '', inGrace: true, graceSince: now(s) } }, 'The clock started even while you were still.')),
    ],
  }), { statuses: ['H1B', 'O1'], when: (s) => hasJob(s) && !s.flags.inGrace && !s.flags.graceUsed }),

  def('work-h1b-grace', 'status', 40, (s) => {
    const used = Math.max(0, now(s) - num(s, 'graceSince')) * 30;
    const left = Math.max(0, 60 - used);
    const expired = left <= 0;
    const country = s.profile.country;
    return {
      id: 'work-h1b-grace',
      track: 'status',
      title: expired ? 'The 60 days are gone' : 'The grace period',
      body: expired
        ? 'Your 60 days have run out without a new petition or a new status.'
        : `About ${left} days left of the grace period. You may not work, but you may line up a new petition or change status.`,
      stage: 'apartment-night',
      cast: [{ ...YOU, pose: 'type' }, { role: 'friend', pose: 'talk' }],
      inlineFact: FACT_GRACE,
      choices: expired
        ? [
            c('home', 'Fly home and look for work from there.', { text: 'You leave with your record intact and a list of contacts.', effects: { family: 6, wellbeing: -2 }, passed: true, ends: 'went-home' }),
            c('stay', 'Stay and keep interviewing.', bad('You are out of status now.', { legal: -25, wellbeing: -8, flags: { status: 'NONE', statusLostReason: 'grace-ended', inGrace: false, graceUsed: true } }, 'The ground moved under you.', 'Once the grace period ends without a new petition or status, you are out of status, and unlawful presence can later bar a return (INA 212(a)(9)(B)).')),
          ]
        : [
            c('sponsor', 'Interview everywhere and ask each company if it can file quickly.', ok(`A company that knows the process files a petition for you within weeks.${country === 'india' ? ' Your mother lights a lamp at home.' : ''}`, { career: 3, wellbeing: 8, legal: 6, flags: { inGrace: false, graceUsed: true, salary: 5500, jobTitle: 'software engineer', ...(s.flags.permFiled && !s.flags.i140Approved ? { permFiled: false, priorityYear: '' } : {}) } }, 'A new employer can file a petition during the grace period and you may start once it is filed (8 CFR 214.1(l)(2); 214.2(h)(2)(i)(H)).'), {
              roll: { base: 45, mods: [career(), social()] },
              fail: bad('Final rounds, then silence. The days keep falling off.', { wellbeing: -8 }, 'You gave it everything.'),
            }),
            c('visitor', 'File to change to visitor status to buy time.', ok('The change is filed. You cannot work as a visitor, but you are not out of status while it is pending.', { money: -cost(s, 500), legal: 2, flags: { status: 'B2', inGrace: false, graceUsed: true, salary: 0 } }, 'During the grace period you may apply to change status (8 CFR 214.1(l)(2); 8 CFR 248.1). A visitor may not work (8 CFR 214.1(e)). The fee is a designed estimate.')),
            // attorney review: a change of status filed inside the grace period (8 CFR 214.1(l)(2); 248.1).
            c('student', 'Get into a graduate program, take the I-20, and file to change to F-1 before the 60 days end.', ok('A school admits you for the next term and issues an I-20. You pay the SEVIS fee and file Form I-539 inside the grace period. Student life again, with savings this time.', { money: -cost(s, 4000) - cost(s, 470) - 350, study: 3, flags: becomeStudent(s) }, 'During the grace period you may apply to change status (8 CFR 214.1(l)(2); 8 CFR 248.1). Fees here are designed estimates: about $470 for Form I-539 and $350 for the SEVIS fee, plus a tuition deposit.')),
            c('home', 'Go home now, on your own terms.', { text: 'You book the flight with weeks to spare, and leave a clean record behind you.', effects: { family: 8, wellbeing: 1 }, passed: true, ends: 'went-home' }),
          ],
    };
  }, { statuses: ['H1B', 'O1'], when: (s) => Boolean(s.flags.inGrace) }),

  // An H-1B worker decides to go back to school. This is the in-game way from H-1B to F-1 while still employed.
  // attorney review: change of status from H-1B to F-1 (Form I-539 with the school's I-20 and the SEVIS fee, 8 CFR 248.1),
  // or an F-1 visa from a consulate abroad; H-1B employment must stop once F-1 status begins (8 CFR 214.2(f)(9), 214.1(e)).
  def('work-h1b-back-to-school', 'status', 1.6, (s) => {
    const i539 = cost(s, 470);
    const sevis = 350;
    const deposit = cost(s, 3500);
    const trip = cultureOf(s.profile.country)?.roundTripFlightUsd ?? 1200;
    const visaFee = 185;
    return {
      id: 'work-h1b-back-to-school',
      track: 'status',
      title: 'Back to school?',
      body: `A year or more into the job, you keep reading course pages late at night. A graduate program you admire has admitted you for the next term and will issue an I-20 once you show you can pay. Going means leaving your ${String(s.flags.jobTitle || 'job')} and your H-1B: once you are a student, you may not keep working for your employer.`,
      stage: 'intl-office',
      cast: [{ ...YOU, pose: 'think' }, { role: 'dso', pose: 'talk' }],
      inlineFact: FACT_TO_F1,
      choices: [
        c('change', `Take the I-20, pay the SEVIS fee (about ${money(sevis)}) and file Form I-539 to change to F-1 from here (about ${money(i539)}), keeping the job until it is approved.`,
          ok('The approval arrives a few weeks before the term starts. You work your last day, hand in your badge and start orientation the next week. You are a student again, with savings this time.', { money: -(i539 + sevis + deposit), study: 6, career: -2, wellbeing: 4, legal: 4, flags: becomeStudent(s) },
            'A nonimmigrant who is maintaining status may ask to change to another nonimmigrant status from inside the US (8 CFR 248.1). The fees and the tuition deposit here are designed estimates; check the current USCIS and SEVIS fees.'),
          {
            roll: { base: 62, mods: [legal()], flagMods: [{ flag: 'h1bUnauthWork', delta: -40, label: 'work outside your petition' }] },
            fail: bad('USCIS denies the change, and the program will not hold your place. You still have your job and your H-1B, and the fees are gone.', { money: -(i539 + sevis), wellbeing: -5 }, 'It was a fair try.', 'Change of status is discretionary, and a status violation such as work outside the petition generally rules it out (8 CFR 248.1(b)). Because you kept working on H-1B while the request was pending, your status did not lapse.'),
          }),
        c('consulate', `Fly home, apply for an F-1 visa at the consulate, and come back for the term (a flight of about ${money(trip)} and a visa fee of about ${money(visaFee)}).`,
          ok('The consular officer asks about your plans after the degree and stamps the visa. You resign, fly back with the I-20 in your hand luggage and enter as a student.', { money: -(trip + visaFee + sevis + deposit), study: 6, career: -2, family: 4, flags: becomeStudent(s) },
            'Leaving and returning on an F-1 visa is the usual road. At the interview you must show you intend to study and can pay for it.'),
          {
            roll: { base: 66, mods: [legal()] },
            fail: bad('The officer is not satisfied and refuses the student visa. You fly back on your H-1B visa, a little poorer, to the job you had not yet left.', { money: -(trip + visaFee + sevis), wellbeing: -5, family: 2 }, 'You did not lose the job, at least.', 'A visa refusal is a decision about that application only. Resigning before the visa was in hand would have left you with nothing.'),
          }),
        c('evenings', 'Stay on H-1B and take one evening course a term instead.', ok('Two nights a week in a classroom after work. Slower, and the paycheck keeps coming.', { money: -cost(s, 1200), study: 5, wellbeing: -2, career: 2 },
          'Studying part-time alongside the H-1B job is generally allowed, as long as you keep doing the work your petition describes.')),
        c('not-now', 'Not now. The job is good and the timing is not.', ok('You close the course page. Maybe in a few years.', { wellbeing: 1 })),
      ],
    };
  }, {
    statuses: ['H1B'],
    months: [3, 4, 5, 6],
    oddsPerYear: 0.35,
    // Not while the employer's green card process is under way: F-1 needs intent to leave after study.
    when: (s) => s.year >= 1 && hasJob(s) && !s.flags.inGrace && !s.flags.permFiled && !s.flags.i140Approved && !s.flags.greenCardPending,
  }),

  def('work-h1b-side-gig', 'work', 1.5, (s) => ({
    id: 'work-h1b-side-gig',
    track: 'work',
    title: 'A little freelance work',
    body: 'A friend\'s startup needs someone to build an app on weekends and offers good money. "Everyone does side gigs," he says. Your visa is tied to your employer.',
    stage: 'cafe',
    cast: [{ ...YOU, pose: 'think' }, { role: 'friend', pose: 'talk' }],
    inlineFact: FACT_UNAUTH,
    choices: [
      c('decline', 'Decline and offer to advise for free over coffee, no work.', ok('He is disappointed, then grateful. You stay clear.', { community: 2, legal: 2 })),
      c('petition', `Tell him he would need to file his own ${statusOf(s) === 'O1' ? 'O-1' : 'H-1B'} petition for you.`, ok('He laughs, then looks it up. Not this year. You both move on.', { legal: 3 })),
      c('take', 'Take it, paid in cash.', bad('The money is good. You feel it every time HR emails you.', { money: cost(s, 1500), wellbeing: -4, legal: -10, flags: { h1bUnauthWork: true } }, 'You know it was not allowed.', `Unauthorized work is a failure to maintain status (8 CFR 214.1(e))${statusOf(s) === 'O1' ? ', and an O-1 covers only the work in your petition (8 CFR 214.2(o)(2)(iv))' : ' and can block H-1B portability (8 CFR 214.2(h)(2)(i)(H))'}. Employment-based green cards can forgive only up to 180 days of violations in total (INA 245(k)).`)),
    ],
  }), { statuses: ['H1B', 'O1'], when: (s) => hasJob(s) && !s.flags.h1bUnauthWork }),

  def('work-h1b-perm', 'status', 3, (s) => {
    const india = s.profile.country === 'india';
    const cat: Cat = s.flags.advancedDegree ? 'eb2' : 'eb3';
    return {
      id: 'work-h1b-perm',
      track: 'status',
      title: 'Your employer offers to start the green card',
      body: `Your manager says the company will sponsor your green card. First comes a labor certification (PERM) from the Department of Labor, then an immigrant petition (I-140), then, when your priority date is reached, the green card application itself.${india ? ' Your Indian colleagues exchange a look: they know how long the line is.' : ''}`,
      stage: 'lab',
      cast: [{ ...YOU, pose: 'talk' }, { role: 'advisor', pose: 'talk' }],
      inlineFact: FACT_PD,
      choices: [
        c('yes', 'Say yes and gather every document the lawyer asks for.', ok('The labor certification is filed. Its filing date will become your priority date if the I-140 is approved.', { legal: 8, wellbeing: 4, flags: { permFiled: true, permMonth: now(s), priorityYear: calYear(s), gcCat: cat } }, `For ${cat.toUpperCase()}, a petition usually needs a labor certification (8 CFR 204.5(k)(4)), and the priority date is the date the Department of Labor accepted it (8 CFR 204.5(d)). ${india ? `For India-born applicants this game assumes a wait of about ${WAIT.india[cat]} years after the priority date. ` : `This game assumes a wait of about ${waitFor(s.profile.country)[cat]} years after the priority date. `}${BULLETIN_NOTE}`)),
        c('later', 'Ask if it can wait until after your promotion.', bad('Your manager says sure. The year moves on without a filing.', { legal: -2 }, 'Every month of delay is a month later in line.', 'The priority date is set when the labor certification is filed, so waiting pushes your place in line back.')),
      ],
    };
  }, { statuses: ['H1B'], when: (s) => hasJob(s) && !s.flags.permFiled && !s.flags.i140Approved && monthsInStatus(s) >= 4 }),

  def('work-h1b-i140', 'status', 5, (s) => {
    const current = calYear(s) >= num(s, 'priorityYear') + waitYears(s);
    return {
      id: 'work-h1b-i140',
      track: 'status',
      title: 'The labor certification is approved',
      body: `After months of recruitment ads and waiting (the length here is a designed estimate), the Department of Labor certifies the job. The lawyer files your I-140.${current ? ' Your priority date is already within the bulletin cutoff, so the green card application could go in with it.' : ''}`,
      stage: 'lab',
      cast: [{ ...YOU, pose: 'cheer' }, { role: 'advisor', pose: 'talk' }],
      inlineFact: FACT_PD,
      choices: [
        c('file', 'Sign the forms and wait for the I-140.', ok('Approved. Your priority date is now yours, even if you change jobs later.', { legal: 12, wellbeing: 6, flags: { i140Approved: true, i140Month: now(s) } }, 'An approved I-140 keeps its priority date for later employment petitions (8 CFR 204.5(e)).'), {
          roll: { base: 85, mods: [legal()] },
          fail: bad('A request for evidence about your degree. The lawyer answers it and you wait three more months.', { wellbeing: -4, flags: { i140Approved: true, i140Month: now(s) } }, 'Paperwork can be patient with you only so far.'),
        }),
        ...(current
          ? [c('concurrent', 'File the green card application together with the I-140.', ok('Both forms go in the same packet. You also apply for a work permit and travel document.', { money: -cost(s, 1440), legal: 15, wellbeing: 8, flags: { i140Approved: true, status: 'AOS_PENDING', ead: true } }, 'EB-1, EB-2 and EB-3 adjustment applications may be filed together with the I-140 when a visa would be available on approval (8 CFR 245.2(a)(2)(i)(B)). The I-485 fee is $1,440 under the April 2024 fee rule (research/visa-catalog.md).'))]
          : []),
      ],
    };
  }, { statuses: ['H1B'], when: (s) => Boolean(s.flags.permFiled) && !s.flags.i140Approved && now(s) - num(s, 'permMonth') >= 15 }),

  def('work-h1b-six-year', 'status', 20, (s) => {
    const perm365 = Boolean(s.flags.permFiled) && now(s) - num(s, 'permMonth') >= 12;
    const i140 = Boolean(s.flags.i140Approved);
    const backlogged = i140 && !pdCurrent(s);
    const choices: Choice[] = [];
    if (backlogged) {
      choices.push(c('ext3', 'Ask the lawyer to file a 3-year extension based on the approved I-140.', ok('Approved for three more years. The wait continues, but from inside the country.', { legal: 10, wellbeing: 5, flags: { h1bMaxUntil: now(s) + 36 } }, 'With an approved I-140 and a visa unavailable only because of the per-country limit, H-1B can be extended past six years in steps of up to 3 years (8 CFR 214.2(h)(13)(iii)(E)).')));
    } else if (perm365 || i140) {
      choices.push(c('ext1', 'File a 1-year extension based on the pending green card process.', ok('Approved for one more year.', { legal: 6, wellbeing: 3, flags: { h1bMaxUntil: now(s) + 12 } }, 'If a labor certification or I-140 was filed at least 365 days earlier, H-1B can be extended past six years in 1-year steps (8 CFR 214.2(h)(13)(iii)(D)).')));
    }
    if (evCount(s) >= 3) {
      choices.push(c('o1', 'Switch to an O-1 on the strength of your record.', ok('The O-1 is approved. No six-year clock on this one, but it has to be renewed.', { money: -cost(s, 4000), legal: 8, flags: { status: 'O1', o1ValidUntil: now(s) + 36 } }, 'O-1 needs at least three of eight kinds of evidence (8 CFR 214.2(o)(3)(iii)). Lawyer fees are a designed estimate.'), {
        roll: { base: 55, mods: [career()] },
        fail: bad('The O-1 is denied. Your H-1B time is nearly gone.', { money: -cost(s, 4000), wellbeing: -8 }, 'It was close.'),
      }));
    }
    choices.push(
      c('home', 'Go home for the year abroad the rule requires, and maybe come back.', { text: 'You leave on good terms. Your manager says your seat will be there if a petition can be filed after a year away.', effects: { family: 8, career: -2 }, passed: true, ends: 'went-home', lookback: 'After six years in H or L status, you must spend a year outside the US before returning in H or L (8 CFR 214.2(h)(13)(iii)(A)).' }),
      c('stay', 'Stay past the end date.', bad('The end date passes. Your badge still works; your status does not.', { legal: -25, wellbeing: -8, flags: { status: 'NONE', statusLostReason: 'h1b-six-years', salary: 0, jobTitle: '' } }, 'This could cost more than it saves.', 'Staying past your authorized stay builds unlawful presence (INA 212(a)(9)(B)).')),
    );
    return {
      id: 'work-h1b-six-year',
      track: 'status',
      title: 'The six-year clock',
      body: `Your H-1B time runs out in about ${Math.max(0, h1bLeft(s))} months. ${backlogged ? 'Your I-140 is approved, but the line for your country has not moved far enough.' : perm365 || i140 ? 'Your green card process has been on file for more than a year.' : 'No green card process was started for you.'}`,
      stage: 'intl-office',
      cast: [{ ...YOU, pose: 'think' }, { role: 'advisor', pose: 'talk' }],
      inlineFact: FACT_SIX,
      choices,
    };
  }, { statuses: ['H1B'], when: (s) => h1bLeft(s) <= 8 }),
];

// ------------------------------------------------------------------ green card waits and filing

const GC_CARDS: ChallengeDef[] = [
  def('work-gc-india-wait', 'status', 2, (s) => {
    const cat = catOf(s);
    const ready = num(s, 'priorityYear') + waitYears(s);
    const married = s.profile.marital !== 'single';
    return {
      id: 'work-gc-india-wait',
      track: 'status',
      title: 'The longest line',
      body: `Your I-140 is approved with a ${num(s, 'priorityYear')} priority date in ${cat.toUpperCase()}. At current movement your turn might come around ${ready}, if the bulletin does not go backwards. Colleagues from other countries who filed after you already hold green cards.`,
      stage: 'apartment-night',
      cast: [{ ...YOU, pose: 'phone' }, married ? { role: 'spouse', pose: 'talk' } : { role: 'friend', pose: 'talk' }],
      inlineFact: FACT_PD,
      choices: [
        c('eb1', 'Start building an EB-1A case so your old priority date can move to a shorter line.', ok('You sketch out three kinds of evidence you could realistically collect. It is a long project, but a real one.', { career: 3, wellbeing: 2, flags: { eb1Plan: true } }, `An approved EB-1, 2 or 3 petition keeps its priority date for a later petition in another of those categories (8 CFR 204.5(e)). This game assumes ${cultureOf(s.profile.country)?.name ?? 'your country'}'s EB-1 line waits about ${waitFor(s.profile.country).eb1} years instead of ${waitFor(s.profile.country)[cat]}. ${BULLETIN_NOTE}`)),
        ...(married
          ? [c('h4', 'Help your spouse apply for an H-4 work permit now that your I-140 is approved.', ok('Your spouse files, and months later a work permit arrives. Two incomes, and a spouse who is no longer stuck at home.', { family: 8, wellbeing: 5, money: -cost(s, 520) }, 'An H-4 spouse may apply for work permission when the H-1B principal has an approved I-140 or an AC21 extension (8 CFR 214.2(h)(9)(iv)). The fee is a designed estimate.'))]
          : []),
        c('accept', 'Accept the wait and build a life here anyway.', ok('You buy real furniture for the first time.', { wellbeing: 3, community: 2 })),
        c('bitter', 'Spend the evening reading forum threads about the backlog.', bad('Three hours later you know every rumor and feel worse.', { wellbeing: -5 }, 'The forums did not move the line.')),
      ],
    };
  }, { statuses: ['H1B', 'O1'], countries: ['india', 'china'], when: (s) => Boolean(s.flags.i140Approved) && !pdCurrent(s) }),

  def('work-gc-file-aos', 'status', 20, (s) => ({
    id: 'work-gc-file-aos',
    track: 'status',
    title: 'Your date is current',
    body: `The visa bulletin moved. Your ${num(s, 'priorityYear')} priority date is inside the cutoff for ${catOf(s).toUpperCase()}. The lawyer says you can file to adjust status now. The I-485 fee is $1,440 (April 2024 fee schedule).`,
    stage: 'bank',
    cast: [{ ...YOU, pose: 'cheer' }, { role: 'advisor', pose: 'talk' }],
    inlineFact: FACT_AOS,
    choices: [
      c('file', 'File the I-485 with the work permit and travel document requests.', ok('The packet goes out with a tracking number you check every hour. Receipts arrive in a few weeks.', { money: -cost(s, 1440), legal: 15, wellbeing: 10, flags: { status: 'AOS_PENDING', ead: true } }, 'A visa must be immediately available for your priority date before you can file (8 CFR 245.2(a)(2)(i)(A)). Pending adjustment applicants can apply for a work permit (8 CFR 274a.12(c)(9)).')),
      c('later', 'Wait a month to save for the fee.', bad('Next month the bulletin holds. The month after, it retrogresses.', { wellbeing: -6, flags: { waitExtra: num(s, 'waitExtra') + 1 } }, 'The window was open, and then it was not.', 'Cutoff dates can move backwards. When your date is current, filing promptly matters.')),
    ],
  }), { statuses: ['F1', 'OPT', 'STEM_OPT', 'H1B', 'O1'], when: (s) => pdCurrent(s) && !s.flags.inGrace }),
];

// ------------------------------------------------------------------ O-1 life

const O1_CARDS: ChallengeDef[] = [
  def('work-o1-evidence', 'work', 2, () => ({
    id: 'work-o1-evidence',
    track: 'work',
    title: 'The evidence folder',
    body: 'Your lawyer tells you to keep a folder: every citation, every review request, every article that mentions your work. "Renewals and green cards are built from that folder."',
    stage: 'library',
    cast: [{ ...YOU, pose: 'type' }, { role: 'advisor', pose: 'talk' }],
    inlineFact: FACT_O1,
    choices: [
      c('monthly', 'Update the folder every month.', ok('Twenty minutes on the first Sunday of each month. It adds up quietly.', { legal: 6, career: 2, flags: { evFolder: true } })),
      c('press', 'Say yes to a trade journalist who wants to profile your work.', ok('The article runs with your photo. Your mother shares it with every relative.', { career: 4, family: 3, flags: { evPress: true, evFolder: true } }), {
        roll: { base: 60, mods: [career()] },
        fail: bad('The article ends up being about your lab director. You get one line.', { wellbeing: -2 }, 'Press is hard to steer.'),
      }),
      c('later', 'You will gather it all when the renewal comes.', bad('The emails pile up, unsorted.', { legal: -4 }, 'Future you will have a long weekend.')),
    ],
  }), { statuses: ['O1'], when: (s) => !s.flags.evFolder }),

  def('work-o1-agent', 'work', 2, (s) => ({
    id: 'work-o1-agent',
    track: 'work',
    title: 'More than one client',
    body: 'Two other organizations want you for short engagements this year. Your O-1 was filed by one employer. A US agent offers to file a single petition covering all three.',
    stage: 'conference',
    cast: [{ ...YOU, pose: 'talk' }, { role: 'recruiter', pose: 'talk' }],
    inlineFact: FACT_O1_AGENT,
    choices: [
      c('agent', 'Use the agent and file an amended petition before starting.', ok('The agent files with all three contracts. The approval arrives and the work begins.', { money: -cost(s, 2500), career: 6, flags: { o1Agent: true, salary: num(s, 'salary') + 700 } }, 'An established US agent may file one petition for work with several employers (8 CFR 214.2(o)(2)(iv)(B), (F)). Agent and lawyer fees are designed estimates.'), {
        roll: { base: 80, mods: [legal()] },
        fail: bad('The petition needs more detail about one contract. It takes two extra months, and one client walks away.', { money: -cost(s, 2500), career: 2 }, 'Contracts need detail.'),
      }),
      c('one', 'Stay with your one employer for now.', ok('Simpler. Your employer is pleased.', { legal: 2 })),
      c('cash', 'Do the extra work quietly for cash.', bad('The money is real. So is the knot in your stomach.', { money: cost(s, 2000), legal: -10, wellbeing: -4, flags: { h1bUnauthWork: true } }, 'This was not covered by your petition.', 'Working for an employer not covered by a petition is unauthorized employment and a failure to maintain status (8 CFR 214.1(e)).')),
    ],
  }), { statuses: ['O1'], when: (s) => hasJob(s) && !s.flags.o1Agent }),

  def('work-o1-renewal', 'status', 20, (s) => ({
    id: 'work-o1-renewal',
    track: 'status',
    title: 'Renewing the O-1',
    body: `Your O-1 ends in a few months. Your employer's lawyer asks for your folder: what have you done since the last petition?${s.flags.evFolder ? ' You send it in ten minutes.' : ' You spend a weekend digging through old emails.'}`,
    stage: 'library',
    cast: [{ ...YOU, pose: 'type' }, { role: 'advisor', pose: 'talk' }],
    inlineFact: FACT_O1_EXT,
    choices: [
      c('file', 'File the extension with everything you have.', ok('Approved for another year.', { money: -cost(s, 1500), legal: 10, wellbeing: 5, flags: { o1ValidUntil: now(s) + 12 } }, 'O-1 extensions are granted in steps of up to 1 year to continue the same activity (8 CFR 214.2(o)(12)(ii)). Legal fees are a designed estimate.'), {
        roll: { base: 72, mods: [career(), legal()], flagMods: [{ flag: 'evFolder', delta: 12, label: 'kept evidence' }, { flag: 'h1bUnauthWork', delta: -25, label: 'unauthorized work' }] },
        fail: bad('Denied. There is no appeal. Your stay ends with the current approval.', { money: -cost(s, 1500), legal: -25, wellbeing: -12, flags: { status: 'NONE', statusLostReason: 'o1-extension-denied', salary: 0, jobTitle: '' } }, 'The folder was thinner than the work deserved.', 'A denied O-1 extension cannot be appealed (8 CFR 214.2(o)(12)(iii)). Keeping evidence current is the best protection.'),
      }),
      c('home', 'Let it end and go home to a job offer there.', { text: 'You leave at the end of your approval, with a body of work and a network on two continents.', effects: { family: 8 }, passed: true, ends: 'went-home' }),
    ],
  }), { statuses: ['O1'], when: (s) => num(s, 'o1ValidUntil', 35) - now(s) <= 4 }),
];

// ------------------------------------------------------------------ self-petition: EB-1A and the national interest waiver

const SP_STATUSES: Array<'F1' | 'OPT' | 'STEM_OPT' | 'H1B' | 'O1'> = ['F1', 'OPT', 'STEM_OPT', 'H1B', 'O1'];
const spOpen = (s: GameState): boolean => statusOf(s) !== 'F1' || s.year >= 2 || Boolean(s.flags.researchTrack);

const SP_CARDS: ChallengeDef[] = [
  def('work-sp-paper', 'work', 1.8, (s) => ({
    id: 'work-sp-paper',
    track: 'work',
    title: 'A paper worth finishing',
    body: `${isWorker(s) ? 'Your team' : 'Your lab'} has results that could become a paper in a good journal. It means evenings and weekends for two months.`,
    stage: 'lab',
    cast: [{ ...YOU, pose: 'type' }, { role: 'professor', pose: 'talk' }],
    choices: [
      c('write', 'Lead the writing.', ok('Accepted after one round of revisions. Your name is first.', { career: 6, wellbeing: -3, flags: { evPubs: true } }, 'Authorship of scholarly articles is one of the kinds of evidence for O-1 and EB-1A (8 CFR 214.2(o)(3)(iii)(B)(6); 204.5(h)(3)(vi)).'), {
        roll: { base: 55, mods: [study(), career()] },
        fail: bad('Rejected by the first journal. The reviews are fair and harsh.', { wellbeing: -5, career: 1 }, 'Most papers hear "no" before "yes".'),
      }),
      c('help', 'Help, but let a colleague lead.', ok('Second author, and a friend for life.', { career: 2, community: 3 })),
      c('pass', 'Pass. You need your weekends.', ok('You hike, sleep and call home.', { wellbeing: 4 })),
    ],
  }), { statuses: SP_STATUSES, when: (s) => spOpen(s) && !s.flags.evPubs }),

  def('work-sp-judging', 'work', 1.5, () => ({
    id: 'work-sp-judging',
    track: 'work',
    title: 'Asked to review',
    body: 'An editor asks you to review a paper for a journal in your field. It is unpaid, takes a weekend, and someone will read your comments carefully.',
    stage: 'library',
    cast: [{ ...YOU, pose: 'type' }],
    choices: [
      c('review', 'Accept and write a careful review.', ok('The editor thanks you and asks you again two months later. You save both emails.', { career: 3, flags: { evJudge: true } }, 'Judging the work of others is one of the listed kinds of evidence (8 CFR 204.5(h)(3)(iv)).')),
      c('quick', 'Accept and skim it.', bad('The editor does not ask again.', { career: -1 }, 'A rushed review is noticed.')),
      c('decline', 'Decline politely.', ok('Your weekend stays your own.', { wellbeing: 2 })),
    ],
  }), { statuses: SP_STATUSES, when: (s) => spOpen(s) && !s.flags.evJudge && Boolean(s.flags.evPubs) }),

  def('work-sp-recognition', 'work', 1.5, (s) => ({
    id: 'work-sp-recognition',
    track: 'work',
    title: 'A prize, maybe',
    body: 'Your work is shortlisted for a national award in your field. The ceremony is at a conference across the country, and a reporter covering it wants a quote.',
    stage: 'conference',
    cast: [{ ...YOU, pose: 'present' }, { role: 'professor', pose: 'cheer' }, { role: 'stranger', pose: 'idle' }],
    inlineFact: FACT_EB1A,
    choices: [
      c('go', 'Go, give the talk and the interview.', ok('You win. Your photo is in a trade magazine the next week.', { career: 8, family: 4, money: -cost(s, 600), flags: { evAward: true, evPress: true } }, 'Nationally recognized prizes and published material about you are separate kinds of evidence (8 CFR 204.5(h)(3)(i), (iii)).'), {
        roll: { base: 40, mods: [career()] },
        fail: bad('You do not win, but the reporter quotes you anyway.', { career: 3, money: -cost(s, 600), flags: { evPress: true } }, 'Shortlisted is still something.'),
      }),
      c('remote', 'Send a video instead.', ok('Thoughtful, and a little invisible.', { career: 2 })),
    ],
  }), { statuses: SP_STATUSES, when: (s) => spOpen(s) && Boolean(s.flags.evPubs) && !(s.flags.evAward && s.flags.evPress) }),

  def('work-sp-file', 'status', 3, (s) => {
    const n = evCount(s);
    const fees = cost(s, 1315);
    const lawyer = cost(s, 6000);
    const pdKeep = s.flags.i140Approved ? num(s, 'priorityYear', calYear(s)) : calYear(s);
    const choices: Choice[] = [];
    if (n >= 3) {
      choices.push(c('eb1a', 'File an EB-1A petition with a lawyer.', ok('Approved. You are, in the eyes of the law, extraordinary. Your mother frames the notice.', { money: -(fees + lawyer), legal: 15, wellbeing: 10, flags: { spFiled: true, i140Approved: true, gcCat: 'eb1', priorityYear: Math.min(pdKeep, calYear(s)) } }, `EB-1A needs three of ten kinds of evidence, then a judgment that you are among the small percentage at the very top of your field (8 CFR 204.5(h)(2), (3)). An earlier approved priority date carries over (8 CFR 204.5(e)). The I-140 fee is $715 plus the $600 Asylum Program Fee (G-1055); lawyer fees and odds are designed estimates.`), {
        roll: { base: 25 + 8 * (n - 3), mods: [career()], flagMods: [{ flag: 'legalHelp', delta: 8, label: 'legal help' }] },
        fail: bad('Denied. The officer agreed you met three criteria, but not that you are at the very top.', { money: -(fees + lawyer), wellbeing: -10, flags: { spFiled: true } }, 'A "no" on the final step, not on the evidence.'),
      }));
    }
    if (s.flags.advancedDegree) {
      choices.push(c('niw', 'File for a national interest waiver (EB-2).', ok('Approved. No employer needed for this petition.', { money: -(fees + lawyer), legal: 12, wellbeing: 8, flags: { spFiled: true, i140Approved: true, gcCat: 'eb2', priorityYear: pdKeep } }, `The job-offer requirement can be waived in the national interest, so you may petition for yourself (8 CFR 204.5(k)(1)). How officers weigh "national interest" comes from case law not read for this game. ${s.profile.country === 'india' ? `India-born EB-2 applicants still face the long EB-2 line (about ${WAIT.india.eb2} years in this game). ` : ''}${BULLETIN_NOTE}`), {
        roll: { base: 35 + 6 * n, mods: [career()], flagMods: [{ flag: 'legalHelp', delta: 8, label: 'legal help' }] },
        fail: bad('Denied. The officer was not persuaded that waiving the job offer serves the national interest.', { money: -(fees + lawyer), wellbeing: -8, flags: { spFiled: true } }, 'The case may be stronger in a year.'),
      }));
    }
    choices.push(c('wait', 'Wait a year and build more evidence.', ok('You decide the case will be stronger later. It probably will.', { wellbeing: 1 })));
    return {
      id: 'work-sp-file',
      track: 'status',
      title: 'Petition for yourself',
      body: `A lawyer reviews your record: ${n} kind${n === 1 ? '' : 's'} of evidence. "You do not need an employer for these," she says. "You need a convincing story." Government fees are about ${money(fees)}, and her fee would be about ${money(lawyer)} (a designed estimate).`,
      stage: 'intl-office',
      cast: [{ ...YOU, pose: 'think' }, { role: 'advisor', pose: 'talk' }],
      inlineFact: n >= 3 ? FACT_EB1A : FACT_NIW,
      choices,
    };
  }, {
    statuses: SP_STATUSES,
    // A year in the US first, and enough savings that filing does not mean going broke.
    when: (s) =>
      spOpen(s) && !s.flags.spFiled && s.year * 12 + Math.max(0, s.schedule[s.index]?.month ?? 0) >= 12 && s.stats.money > cost(s, 5000) &&
      (evCount(s) >= 3 || (Boolean(s.flags.advancedDegree) && evCount(s) >= 2)),
  }),
];

export const CARDS: ChallengeDef[] = [...ARRIVAL, ...F1_ROAD, ...OPT_CARDS, ...H1B_CARDS, ...GC_CARDS, ...O1_CARDS, ...SP_CARDS];
