/**
 * Family, visitor, entered-without-inspection, asylum, adjustment and settlement roads.
 *
 * Owns the B2, ASY_PENDING and ASYLEE statuses, and writes the cards (not the definitions) for
 * AOS_PENDING, LPR and CITIZEN. Every legal mechanic is cited in a lookback or an inlineFact; the
 * sources are listed in research/verified-law-family.md. Game-design reference, not legal advice.
 *
 * Flags introduced here (all optional; numbers are months since arrival unless noted):
 *   b2Until, b2ExtendAsked, b2Extended, overstaySince, unauthWork,
 *   usCitizenPartner, marriedCitizen, marriedAt, separated, i130Filed, i601aFiled, i601aApproved,
 *   aosBasis, aosFiled, priorStatus, aosBiometrics, advanceParole, aosRfe, aosRfeAnswered,
 *   conditionalGC, natzFrom, n400Filed, reentryPermit,
 *   asyFiled, asyLate, asyWeak, asyEvidence, asyInterviewed, asyReferred, asyDenied, asyDecided,
 *   ewiNta, inAbsentia, removalOrder, voted, usPassport, petitionedFamily, petitionedSpouse.
 */
import { bad, c, cfr, def, legal, ok, social } from '../cx';
import { priceFactor } from '../economy';
import { mechanicsOf } from '../country';
import { monthsInStatus, monthsSinceArrival, statusOf } from '../routes';
import type { RouteDef, StatusDef } from '../routes';
import type { ChallengeDef, Effects, Fact, GameState, Outcome, StatusCode } from '../types';

const YOU = { role: 'player' } as const;

// ------------------------------------------------------------------ helpers
const now = (s: GameState): number => monthsSinceArrival(s);
/** Approximate calendar year of the current card. */
const calYear = (s: GameState): number => s.profile.arrivalYear + s.year;
/** A filing fee or cost in the current year's dollars (the base values are 2024 to 2026 USCIS fees). */
const fee = (s: GameState, n: number): number => Math.round(n * priceFactor(calYear(s)));
const isEwi = (s: GameState): boolean => Boolean(s.flags.ewi);
const st = (s: GameState): StatusCode => statusOf(s);
const n = (s: GameState, k: string): number => Number(s.flags[k] ?? 0);
const has = (s: GameState, k: string): boolean => Boolean(s.flags[k]);
const goHome = (text: string, effects: Effects, lookback?: string): Outcome => ({ ...ok(text, effects, lookback), ends: 'went-home' });

/** Months of unlawful presence so far (a game estimate). Time with a bona fide asylum case pending is not counted. */
function upMonths(s: GameState): number {
  if (isEwi(s)) return Math.max(0, has(s, 'asyFiled') ? n(s, 'asyFiled') : now(s));
  if (s.flags.overstaySince !== undefined) return Math.max(0, now(s) - n(s, 'overstaySince'));
  return 0;
}
function barText(s: GameState): string {
  const up = upMonths(s);
  if (up >= 12) return 'With more than a year of unlawful presence, leaving would start a 10-year bar on returning.';
  if (up > 6) return 'With more than six months of unlawful presence, leaving would start a 3-year bar on returning.';
  return 'You have not yet built up enough unlawful presence to trigger a bar on returning, but every month counts.';
}
/** Months of permanent residence that count toward naturalization (restarted after a long absence). */
const lprMonths = (s: GameState): number => now(s) - Math.max(n(s, 'lprSince'), n(s, 'natzFrom'));
const marriedMonths = (s: GameState): number => (has(s, 'marriedCitizen') ? now(s) - n(s, 'marriedAt') : 0);
function natzEligible(s: GameState): boolean {
  if (has(s, 'conditionalGC') || has(s, 'n400Filed')) return false;
  const m = lprMonths(s);
  // Filing may start 90 days before the anniversary (8 CFR 334.2(b)).
  if (m >= 57) return true;
  return has(s, 'marriedCitizen') && !has(s, 'separated') && m >= 33 && marriedMonths(s) >= 33;
}
/** Designed asylum odds, anchored on EOIR court grant ratios by nationality (FY2024) and the 2025 to 2026 drop. */
function asylumOdds(s: GameState): number {
  const base = mechanicsOf(s.profile.country)?.asylumGrantPct ?? 40;
  const y = calYear(s);
  let p = y >= 2026 ? base * 0.3 : y >= 2025 ? base * 0.55 : base;
  if (has(s, 'asyLate')) p *= 0.35;
  if (has(s, 'asyWeak')) p *= 0.4;
  return Math.max(4, Math.round(p));
}

// ------------------------------------------------------------------ sources and facts
const U1255 = 'https://www.law.cornell.edu/uscode/text/8/1255';
const U1182 = 'https://www.law.cornell.edu/uscode/text/8/1182';
const U1158 = 'https://www.law.cornell.edu/uscode/text/8/1158';
const U1159 = 'https://www.law.cornell.edu/uscode/text/8/1159';
const U1186A = 'https://www.law.cornell.edu/uscode/text/8/1186a';
const U1427 = 'https://www.law.cornell.edu/uscode/text/8/1427';
const C2142 = 'https://www.law.cornell.edu/cfr/text/8/214.2';
const C2087 = 'https://www.law.cornell.edu/cfr/text/8/208.7';
const C20814 = 'https://www.law.cornell.edu/cfr/text/8/208.14';
const C2452 = 'https://www.law.cornell.edu/cfr/text/8/245.2';
const I601A = 'https://www.uscis.gov/family/family-of-us-citizens/provisional-unlawful-presence-waivers';

const FX_AOS = cfr(
  'fx-245a',
  'Getting a green card from inside the US',
  'Adjustment of status is open only to someone who was inspected and admitted or paroled (INA 245(a)). The bars for working without permission or falling out of status do not apply to an immediate relative of a US citizen: a spouse, an unmarried child under 21, or a parent of a citizen aged 21 or over (INA 245(c)(2), 201(b)). Section 245(i) helps only people whose petitions were filed by April 30, 2001.',
  U1255,
);
const FX_BARS = cfr(
  'fx-bars',
  'The 3-year and 10-year bars',
  'More than 180 days but less than a year of unlawful presence, then leaving, bars a return for 3 years. A year or more bars it for 10 years. The clock starts when you leave. Time while a bona fide asylum case is pending generally does not count, unless you work without permission. A waiver needs extreme hardship to a US citizen or permanent resident spouse or parent (INA 212(a)(9)(B)).',
  U1182,
);
const FX_B2 = cfr(
  'fx-b2',
  'How long a visitor may stay',
  'A B-2 visitor may be admitted for up to one year and is usually admitted for at least six months. Extensions come in steps of up to six months (8 CFR 214.2(b)(1), (2)). Work without authorization is a failure to keep status (8 CFR 214.1(e)).',
  C2142,
);
const FX_B2_STUDY = cfr(
  'fx-b2-study',
  'Visitors may not start school',
  'A B-1 or B-2 visitor may not pursue a course of study until USCIS approves a change to student status. USCIS will deny the change if the visitor enrolled before filing or while the request is pending (8 CFR 214.2(b)(7), 248.1(c)(3)).',
  'https://www.law.cornell.edu/cfr/text/8/248.1',
);
const FX_ASY_DEADLINE = cfr(
  'fx-asy-deadline',
  'The one-year asylum deadline',
  'Anyone physically present in the US may apply for asylum, however they arrived. The application must be filed within one year of arrival, unless changed circumstances or extraordinary circumstances explain the delay (INA 208(a)(1), (a)(2)(B), (a)(2)(D)). Knowingly filing a frivolous application makes a person permanently ineligible for immigration benefits (INA 208(d)(6)).',
  U1158,
);
const FX_ASY_EAD = cfr(
  'fx-asy-ead',
  'The asylum work-permit clock',
  'An asylum applicant may ask for a work permit 150 days after a complete application is received. USCIS then has 30 days to decide, but no permit may be issued before 180 days have passed since filing. Delays the applicant causes stop the clock (8 CFR 208.7(a)).',
  C2087,
);
const FX_ASY_REFER = cfr(
  'fx-asy-refer',
  'When the asylum office does not grant',
  'An asylum officer may grant asylum. If the officer does not, and the applicant has no other valid status, the case is referred to an immigration judge for removal proceedings, where asylum can be asked for again (8 CFR 208.14(b), (c)(1)). The work permit continues while the case is with the judge (8 CFR 208.7(b)(1)).',
  C20814,
);
const FX_209 = cfr(
  'fx-209b',
  'From asylee to green card',
  'A person granted asylum may apply for a green card after being physically present in the US for at least one year after the grant (INA 209(b)). On approval, the green card date is recorded as one year before the approval date (8 CFR 209.2(f)).',
  U1159,
);
const FX_AP = cfr(
  'fx-ap',
  'Leaving while a green card is pending',
  'Leaving the US while an adjustment application is pending is treated as abandoning it, unless advance parole was granted first and you were inspected on return (8 CFR 245.2(a)(4)). Since August 13, 2026, USCIS treats leaving on advance parole as a departure for the unlawful presence bars (Matter of Delcarmen-Lara).',
  C2452,
);
const FX_216 = cfr(
  'fx-216',
  'A two-year conditional green card',
  'If the marriage is less than 24 months old on the day you become a permanent resident, the green card is conditional. You and your spouse must jointly petition to remove the conditions in the 90 days before the second anniversary, or the status ends. A waiver exists if the marriage was entered in good faith but ended, or for abuse or extreme hardship (INA 216).',
  U1186A,
);
const FX_I601A = cfr(
  'fx-i601a',
  'The provisional unlawful presence waiver',
  'Form I-601A lets some people in the US ask for a waiver of the 3- or 10-year bar before leaving for a consular interview. You must be 17 or older, have an approved family petition with a pending immigrant visa case, and show extreme hardship to a US citizen or permanent resident spouse or parent. It covers unlawful presence only, not other grounds such as reentry after removal.',
  I601A,
);
const FX_NATZ = cfr(
  'fx-natz',
  'When you can naturalize',
  'A permanent resident may naturalize after 5 years of continuous residence, physically present for at least half of that time (INA 316(a)), or after 3 years if married to and living with a US citizen for those 3 years (INA 319(a)). You may file 90 days early (8 CFR 334.2(b)). An absence of more than 6 months but less than a year is presumed to break continuous residence; a year or more breaks it (INA 316(b)). Applicants show English and knowledge of US history and government (INA 312).',
  U1427,
);
const FX_LPR_TRIP = cfr(
  'fx-lpr-trip',
  'Long trips on a green card',
  'A permanent resident who has been away more than 180 days in a row is treated as seeking admission on return (INA 101(a)(13)(C)). The green card works as a travel document only after an absence of less than one year (8 CFR 211.1(a)(2)); a reentry permit, applied for before leaving, covers longer trips (8 CFR 223).',
  'https://www.law.cornell.edu/cfr/text/8/211.1',
);
const FX_VOTE = cfr(
  'fx-vote',
  'Only citizens vote in federal elections',
  'It is a federal crime for a noncitizen to vote in an election for President or Congress, with up to a year in prison (18 U.S.C. 611). A noncitizen who votes in violation of any law is deportable (INA 237(a)(6)).',
  'https://www.law.cornell.edu/uscode/text/18/611',
);
const FX_FRAUD = cfr(
  'fx-fraud',
  'A marriage must be real',
  'Knowingly entering a marriage to evade the immigration laws is a federal crime, with up to 5 years in prison and a fine of up to $250,000 (INA 275(c)). Officers look at whether a couple truly shares a life.',
  'https://www.law.cornell.edu/uscode/text/8/1325',
);
const FX_SUPPORT = cfr(
  'fx-i864',
  'Your sponsor\'s promise',
  'A family sponsor signs an affidavit of support promising to keep you at no less than 125 percent of the federal poverty line. It is legally enforceable and ends once you have about 40 quarters of work credited under Social Security, among other ways (INA 213A).',
  'https://www.law.cornell.edu/uscode/text/8/1183a',
);
const FX_PARENTS = cfr(
  'fx-parents',
  'Who a citizen can bring',
  'Parents of a US citizen aged 21 or over are immediate relatives, with no yearly cap (INA 201(b)(2)(A)(i)). Siblings of a citizen aged 21 or over fall in a preference category with a yearly limit of 65,000 plus unused numbers (INA 203(a)(4)), so the wait can be decades.',
  'https://www.law.cornell.edu/uscode/text/8/1151',
);
const FX_OATH = cfr(
  'fx-oath',
  'The day you become a citizen',
  'A naturalization applicant becomes a US citizen on the date the oath of allegiance is taken at the ceremony (8 CFR 337.9(a)), not on the day the application is approved.',
  'https://www.law.cornell.edu/cfr/text/8/337.9',
);
/** Not fully verified: the official Visa Bulletin page could not be opened, so the dates come from law-firm summaries. */
const FX_WAIT: Fact = {
  id: 'fx-family-wait',
  title: 'The family line depends on your country',
  text: 'Family preference categories have yearly limits and per-country caps, so the wait depends on where you were born. Reported final action dates for siblings of US citizens (F4) in the November 2026 Visa Bulletin: Mexico April 22, 2001; India December 15, 2006; most other countries, including Nigeria, October 22, 2012. Married children of citizens (F3) from Mexico: July 15, 2001. Reported by law firms; the official bulletin could not be opened to confirm.',
  source: 'https://www.gozellaw.com/blog/november-2026-visa-bulletin',
  confidence: 'LIKELY',
  estimate: false,
};
const HELP = 'For real advice, use a licensed immigration attorney or a DOJ-accredited representative at a recognized nonprofit; notarios and consultants cannot give legal advice.';

// ------------------------------------------------------------------ routes
export const ROUTES: RouteDef[] = [
  {
    id: 'FAM',
    name: 'Family-sponsored immigrant',
    note: 'A relative petitioned for you years ago. You arrive with a green card already approved and can work for anyone.',
    startStatus: 'LPR',
    arrival: ['fam-arrival-port', 'fam-arrival-sponsor', 'fam-arrival-job'],
    startFlags: { lprSince: 0 },
    startMoney: 2500,
    usesStudentFunding: false,
  },
  {
    id: 'B2',
    name: 'Visitor (B-2)',
    note: 'A visit to family. You may not work or start school, and your stay has an end date.',
    startStatus: 'B2',
    arrival: ['b2-arrival-port', 'b2-arrival-hosts', 'b2-arrival-rules'],
    startFlags: { b2Until: 6 },
    startMoney: 3500,
    usesStudentFunding: false,
  },
  {
    id: 'EWI',
    name: 'Entered without inspection',
    note: 'You arrived without being inspected at a port of entry. No status, no work permit, and few legal roads.',
    startStatus: 'NONE',
    arrival: ['ewi-arrival-couch', 'ewi-arrival-work', 'ewi-arrival-fear'],
    startFlags: { ewi: true, statusLostReason: 'entered-without-inspection', informalWork: true },
    startMoney: 300,
    usesStudentFunding: false,
  },
  {
    id: 'ASY',
    name: 'Seeking asylum',
    note: 'You fled danger and are asking for protection. A long case, a work permit only after months, and an uncertain decision.',
    startStatus: 'ASY_PENDING',
    arrival: ['asy-arrival-shelter', 'asy-arrival-help', 'asy-arrival-story'],
    startMoney: 1200,
    usesStudentFunding: false,
  },
];

// ------------------------------------------------------------------ statuses
export const STATUSES: StatusDef[] = [
  {
    code: 'B2',
    label: 'Visitor (B-2)',
    lawful: true,
    work: 'none',
    pinned: (s) =>
      s.year === 0
        ? [[3, 'b2-extend'], [5, 'b2-deadline'], [11, 'b2-last-day']]
        : [[0, 'b2-last-day']],
    next: 'A visit is short and work is not allowed. Before the date on your I-94 you can leave, ask to extend, or ask to change to another status such as student.',
  },
  {
    code: 'ASY_PENDING',
    label: 'Asylum pending',
    lawful: true,
    work: 'none',
    pinned: (s) => {
      const out: Array<[number, string]> = [];
      if (!s.flags.asyFiled) out.push([1, 'asy-file']);
      if (!s.flags.ead) out.push([7, 'asy-ead']);
      if (s.flags.asyDenied) out.push([1, 'asy-after-denial']);
      else if (s.flags.asyReferred) out.push([6, 'asy-court']);
      else if (s.year >= 1) out.push([4, 'asy-interview']);
      return out;
    },
    next: 'Your asylum case is pending. You may not work until a work permit is granted, no sooner than 180 days after a complete filing; with it, any job. An interview, and maybe a judge, decide the case.',
  },
  {
    code: 'ASYLEE',
    label: 'Asylee',
    lawful: true,
    work: 'any',
    pinned: () => [[2, 'asy-green-card']],
    next: 'You were granted asylum and may work for anyone. After a year here as an asylee you can apply for a green card (INA 209(b)).',
  },
];

// ------------------------------------------------------------------ arrival: family-sponsored
const FAM_ARRIVAL: ChallengeDef[] = [
  def('fam-arrival-port', 'big', 0, (s) => ({
    id: 'fam-arrival-port',
    track: 'big',
    title: 'The sealed envelope',
    body: `Years of waiting end in an arrivals hall. In your hand is the sealed packet the consulate gave you with your immigrant visa. ${s.profile.country === 'mexico' ? 'Your family\'s petition sat in one of the longest lines in the world.' : 'Your family\'s petition sat in line for years.'} The officer holds out a hand.`,
    stage: 'airport',
    cast: [{ ...YOU, pose: 'carry' }, { role: 'officer', pose: 'talk' }],
    inlineFact: FX_WAIT,
    choices: [
      c('ready', 'Hand over the packet and your passport. Answer plainly.', ok('A few questions, a stamp, a nod. "Welcome," the officer says, and means it. You are a permanent resident.', { legal: 6, wellbeing: 6 })),
      c('bag', 'You packed the envelope in a checked bag to keep it safe.', bad('You wait at the side while your bag is found. It takes two hours and all your patience.', { wellbeing: -5, legal: 1 }, 'Some papers belong in your hands.', 'Arrival documents should travel with you, not in checked luggage.')),
      c('ask', 'Ask the officer how and when your green card arrives.', ok('The officer explains what happens next and reminds you to keep your address current. You write it all down.', { legal: 4, wellbeing: 2 })),
    ],
  })),
  def('fam-arrival-sponsor', 'life', 0, (s) => {
    const sib = s.profile.names?.sibling || 'your sister';
    return {
      id: 'fam-arrival-sponsor',
      track: 'life',
      title: 'The person who sponsored you',
      body: `${sib.charAt(0).toUpperCase() + sib.slice(1)} filed the petition for you long ago, back when you both looked younger. Tonight there is food, a mattress in the spare room and a long list of promises ${sib} signed so you could come.`,
      stage: 'apartment',
      cast: [{ ...YOU, pose: 'eat' }, { role: 'friend', pose: 'talk' }, { role: 'parent', pose: 'laugh' }],
      inlineFact: FX_SUPPORT,
      choices: [
        c('contribute', 'Stay for now and pay toward rent and groceries from the first paycheck.', ok('It is crowded and warm. Paying your share makes it feel like home and not a favor.', { family: 6, wellbeing: 3, community: 2 }, 'A family sponsor signs a legally enforceable promise of support (INA 213A). Pulling your weight early protects the relationship as well as the paperwork.')),
        c('move-out', 'Find your own room within a month.', ok('A small room across town. Lonely, but yours.', { wellbeing: 1, family: -2, money: -400 })),
        c('lean', 'Let them carry everything until you are settled.', bad('Weeks pass. You notice the careful way they talk about money at dinner.', { family: -5, wellbeing: -2 }, 'Gratitude is easier to keep when the load is shared.')),
      ],
    };
  }),
  def('fam-arrival-job', 'work', 0, () => ({
    id: 'fam-arrival-job',
    track: 'work',
    title: 'First work',
    body: 'A green card means you can work for anyone. It does not mean anyone will hire you into your old profession. Your cousin knows a warehouse that is hiring now; a community college offers evening certificates; your degree from home sits in a folder.',
    stage: 'street',
    cast: [{ ...YOU, pose: 'walk' }, { role: 'friend', pose: 'talk' }],
    choices: [
      c('warehouse', 'Take the warehouse job now.', ok('Ten-hour shifts and sore feet, but a real paycheck on the books, with taxes and a pay stub.', { career: 2, wellbeing: -2, flags: { salary: 2300, jobTitle: 'warehouse associate' } })),
      c(
        'field',
        'Hold out for work in your field.',
        ok('Two months of applications, then an offer at a lower level than home. It is a door in your field.', { career: 7, money: -600, flags: { salary: 2900, jobTitle: 'junior technician' } }),
        {
          roll: { base: 45, mods: [{ stat: 'career', center: 40, per: 0.3, label: 'experience' }] },
          fail: bad('No one calls back. Your savings thin and you take the warehouse job after all.', { money: -900, wellbeing: -4, flags: { salary: 2300, jobTitle: 'warehouse associate' } }, 'The market did not see what you know.', 'Credentials from abroad are often discounted at first. Evaluations of foreign degrees and local certificates can help.'),
        },
      ),
      c('both', 'Take a part-time job and start an evening certificate.', ok('Long days, tired nights. By spring the certificate is half done.', { career: 4, study: 3, wellbeing: -3, money: -300, flags: { salary: 1500, jobTitle: 'part-time cashier' } })),
    ],
  })),
];

// ------------------------------------------------------------------ arrival: visitor
const B2_ARRIVAL: ChallengeDef[] = [
  def('b2-arrival-port', 'big', 0, () => ({
    id: 'b2-arrival-port',
    track: 'big',
    title: 'Purpose of your visit',
    body: 'The officer looks at your visitor visa and asks why you are here and how long you will stay. Behind you the line stretches back to the escalators.',
    stage: 'airport',
    cast: [{ ...YOU, pose: 'idle' }, { role: 'officer', pose: 'talk' }],
    choices: [
      c('plain', 'Say you are visiting family and show your return ticket.', ok('A stamp. Your electronic arrival record (the I-94) will show the date your stay ends.', { legal: 5, wellbeing: 3 })),
      c(
        'honest-unsure',
        'Admit you are not sure when you will go back.',
        ok('The officer asks more questions, then admits you. You notice your hands are damp.', { legal: 1, wellbeing: -2 }),
        {
          roll: { base: 70 },
          fail: bad('A long talk in a side room, then you are admitted for a shorter visit than you hoped.', { legal: -3, wellbeing: -6, flags: { b2Until: 6 } }, 'Uncertain plans make officers ask more.', 'A visitor visa is for a temporary visit. Always tell the truth; if your plans change later, there are lawful ways to ask for more time or a different status.'),
        },
      ),
      c('check', 'Answer simply, then look up your I-94 date the first night.', ok('The date is six months away. You put it in your phone calendar with two reminders.', { legal: 6, flags: { b2Checked: true } }, 'A B-2 visitor is generally admitted for at least six months and at most a year (8 CFR 214.2(b)). The I-94 date, not the visa stamp, sets your deadline.')),
    ],
  })),
  def('b2-arrival-hosts', 'life', 0, () => ({
    id: 'b2-arrival-hosts',
    track: 'life',
    title: 'Your cousin\'s spare room',
    body: 'Your cousin\'s family has made up the spare room. Over dinner your uncle says, half joking, that the restaurant down the road always needs someone for cash, and visitors here do it all the time.',
    stage: 'apartment',
    cast: [{ ...YOU, pose: 'eat' }, { role: 'parent', pose: 'talk' }, { role: 'friend', pose: 'laugh' }],
    inlineFact: FX_B2,
    choices: [
      c('decline', 'Laugh it off. You came to visit.', ok('Your uncle shrugs and passes the rice. The evening is warm.', { family: 4, wellbeing: 3 })),
      c('help-home', 'Offer to cook and help around the house instead.', ok('By the end of the week the kitchen is half yours. Your aunt is delighted.', { family: 6, community: 1 })),
      c('ask-more', 'Ask for the restaurant owner\'s number.', bad('The number sits in your phone like a small weight.', { wellbeing: -2, flags: { b2CashLead: true } }, 'Easy money has a hidden cost for a visitor.', 'Visitors may not work. Work without authorization is a failure to keep status (8 CFR 214.1(e)), and it can close doors that would otherwise stay open.')),
    ],
  })),
  def('b2-arrival-rules', 'status', 0, () => ({
    id: 'b2-arrival-rules',
    track: 'status',
    title: 'What a visitor can do',
    body: 'Your cousin\'s neighbor studied immigration rules for her own case and offers to explain what a visitor may and may not do. Your phone buzzes with messages from home asking when you will be back.',
    stage: 'cafe',
    cast: [{ ...YOU, pose: 'sit' }, { role: 'friend', pose: 'talk' }],
    inlineFact: FX_B2_STUDY,
    choices: [
      c('listen', 'Listen and take notes.', ok('No work. No classes until a change of status is approved. Ask before the end date, not after. You have it written down.', { legal: 6, flags: { b2Rules: true } })),
      c('skim', 'Thank her and look it up later.', ok('You mean to. Later becomes next month.', { legal: 1 })),
      c('ignore', 'You are only visiting. It does not matter.', bad('You enjoy the city and do not think about dates.', { legal: -2 }, 'Dates matter more than they seem.', 'A visitor\'s stay ends on the I-94 date. Staying past it without a timely request begins unlawful presence (INA 212(a)(9)(B)).')),
    ],
  })),
];

// ------------------------------------------------------------------ arrival: entered without inspection
const EWI_ARRIVAL: ChallengeDef[] = [
  def('ewi-arrival-couch', 'life', 0, () => ({
    id: 'ewi-arrival-couch',
    track: 'life',
    title: 'A relative\'s couch',
    body: 'You arrived a few days ago. Your body still aches and you sleep in pieces. A relative has given you a couch, a towel and a warning to keep the curtains closed. You have no papers that say you belong here, and you know it.',
    stage: 'apartment-night',
    cast: [{ ...YOU, pose: 'sleep' }, { role: 'friend', pose: 'talk' }],
    choices: [
      c('call', 'Call home to say you are alive.', ok('Your mother cannot speak for a while. Then she asks if you have eaten.', { family: 8, wellbeing: 4 })),
      c('rest', 'Sleep for two days.', ok('You wake up hungry and a little more yourself.', { wellbeing: 6 })),
      c('push', 'Ask your relative about work right away.', ok('He nods slowly. Tomorrow, he says, but first eat.', { wellbeing: -2, community: 2 })),
    ],
  })),
  def('ewi-arrival-work', 'work', 0, (s) => ({
    id: 'ewi-arrival-work',
    track: 'work',
    title: 'Cash work',
    body: 'Your relative takes you to people who pay cash for long days: a roofing crew, a restaurant kitchen, a cleaning service. Nobody asks for papers. Nobody writes anything down.',
    stage: 'street',
    cast: [{ ...YOU, pose: 'walk' }, { role: 'owner', pose: 'talk' }],
    choices: [
      c('kitchen', 'Take the kitchen job.', ok('Steam, knives and a staff meal at the end of the shift. The cook teaches you his tricks.', { wellbeing: -2, community: 2, flags: { informalWork: true } })),
      c('roofing', 'Take the roofing crew. It pays more.', ok('More money and more danger. Your hands blister, then harden.', { money: Math.round(150 * priceFactor(s.profile.arrivalYear)), wellbeing: -5, flags: { informalWork: true } }, 'Construction is the largest sector for work deaths among foreign-born Hispanic workers in BLS data, and wage theft is widely reported. Wage-and-hour laws protect workers regardless of status.')),
      c('notebook', 'Take the cleaning job, and keep a notebook of every hour and payment.', ok('The notebook feels silly at first. Later it may matter.', { wellbeing: -2, legal: 2, flags: { informalWork: true, wageRecords: true } }, 'Keeping your own record of hours, dates and pay helps a workers\' center or labor agency recover unpaid wages.')),
    ],
  })),
  def('ewi-arrival-fear', 'status', 0, () => ({
    id: 'ewi-arrival-fear',
    track: 'status',
    title: 'No name on any list',
    body: 'You have no ID that works here, no bank account and no way to prove where you live. A police siren on the street makes your heart jump. A woman at church says a nonprofit legal clinic offers free screenings on Saturdays.',
    stage: 'street',
    cast: [{ ...YOU, pose: 'think' }, { role: 'stranger', pose: 'talk' }],
    inlineFact: FX_ASY_DEADLINE,
    choices: [
      c('clinic', 'Go to the free screening.', ok('A DOJ-accredited representative listens for an hour. She is honest: few doors are open, but some are, and some close with time.', { legal: 8, wellbeing: 3, flags: { legalHelp: true } }, `Someone who entered without inspection cannot get a green card from inside the US through family or work (INA 245(a)); 245(i) is closed to recent arrivals. Asylum must be asked for within a year of arrival. ${HELP}`)),
      c('hide', 'Stay inside as much as you can.', bad('The days blur. You see the same four walls and the same worry.', { wellbeing: -6, community: -2 }, 'Fear makes the world smaller.')),
      c('church', 'Go back to the church on Sunday and meet people.', ok('A meal after the service, a few names, someone who knows a doctor who does not charge much.', { community: 6, wellbeing: 3 })),
    ],
  })),
];

// ------------------------------------------------------------------ arrival: asylum
const ASY_ARRIVAL: ChallengeDef[] = [
  def('asy-arrival-shelter', 'life', 0, () => ({
    id: 'asy-arrival-shelter',
    track: 'life',
    title: 'Safe, for tonight',
    body: 'A shelter run by a faith group has a bed for you. It is the first night in a long time that you do not listen for footsteps. You still do, out of habit.',
    stage: 'apartment-night',
    cast: [{ ...YOU, pose: 'sit' }, { role: 'friend', pose: 'talk' }],
    choices: [
      c('talk', 'Talk with the volunteer who stays up late.', ok('She does not ask for your story. She asks what you like to eat. You cry a little and feel lighter.', { wellbeing: 6, community: 3 })),
      c('call', 'Call the people you left behind.', ok('They are safe for now. Their voices are the best and worst thing about the night.', { family: 6, wellbeing: 1 })),
      c('alone', 'Keep to yourself.', ok('You sleep in your clothes, shoes by the bed.', { wellbeing: -2 })),
    ],
  })),
  def('asy-arrival-help', 'status', 0, (s) => ({
    id: 'asy-arrival-help',
    track: 'status',
    title: 'Who will help you ask?',
    body: 'People at the shelter talk about lawyers. One says a nonprofit has DOJ-accredited representatives with a long waiting list. Another swears by a "consultant" who charges $3,000 and promises asylum in six months.',
    stage: 'intl-office',
    cast: [{ ...YOU, pose: 'think' }, { role: 'advisor', pose: 'talk' }],
    choices: [
      c('nonprofit', 'Get on the nonprofit\'s list and go to their workshop meanwhile.', ok('The workshop explains the form, the deadline and the work-permit clock. A representative takes your case a month later.', { legal: 8, wellbeing: 2, flags: { legalHelp: true } }, HELP)),
      c('consultant', 'Pay the consultant.', bad('He takes the money and a copy of your passport. His office phone rings unanswered after a while.', { money: -Math.round(3000 * priceFactor(s.profile.arrivalYear)), legal: -6, wellbeing: -8 }, 'No one can promise asylum.', 'Notario fraud targets asylum seekers. Only a licensed attorney or a DOJ-accredited representative may give immigration legal advice. A badly prepared application can be denied, and knowingly false claims carry a permanent bar (INA 208(d)(6)).')),
      c('alone', 'Plan to do the paperwork yourself.', ok('The form is long and the instructions longer. You start, slowly, with a dictionary.', { legal: 2, wellbeing: -3 })),
    ],
  })),
  def('asy-arrival-story', 'status', 0, () => ({
    id: 'asy-arrival-story',
    track: 'status',
    title: 'Writing it down',
    body: 'To ask for asylum you must explain what happened to you and why you fear going back, in detail, and show what proof you can. Some of it you have never said aloud. The application must be filed within a year of arriving.',
    stage: 'apartment',
    cast: [{ ...YOU, pose: 'type' }, { role: 'advisor', pose: 'talk' }],
    inlineFact: FX_ASY_DEADLINE,
    choices: [
      c('start', 'Start writing tonight and ask home for documents.', ok('Pages of handwriting, then a list: news reports, a medical note, a letter from a neighbor. It is a beginning.', { wellbeing: -3, legal: 5, flags: { asyEvidence: true } })),
      c('slow', 'Give yourself a few weeks first.', ok('You rest, then begin. The deadline is still far, but you mark it on the wall.', { wellbeing: 3 })),
      c('avoid', 'Put it off. It hurts too much to remember.', bad('The papers stay in the drawer. Months have a way of passing.', { wellbeing: -2, legal: -2 }, 'The deadline does not wait for healing.', 'Asylum must be filed within one year of arrival unless changed or extraordinary circumstances explain the delay (INA 208(a)(2)(B), (D)). Trauma is real; counselors and legal clinics can help you write at a pace you can bear.')),
    ],
  })),
];

// ------------------------------------------------------------------ visitor (B2) cards
const B2_CARDS: ChallengeDef[] = [
  def('b2-extend', 'status', 0, (s) => ({
    id: 'b2-extend',
    track: 'status',
    title: 'Asking for more time',
    body: `Your I-94 date is ${Math.max(1, n(s, 'b2Until') - now(s))} month${n(s, 'b2Until') - now(s) === 1 ? '' : 's'} away. Your aunt is unwell and the family would like you to stay longer. A visitor can ask USCIS for an extension on Form I-539, but it must be filed before the stay ends.`,
    stage: 'intl-office',
    cast: [{ ...YOU, pose: 'type' }, { role: 'dso', pose: 'talk' }],
    inlineFact: FX_B2,
    choices: [
      c(
        'file',
        `File the I-539 now, with a letter about your aunt and proof you can support yourself (fee about $${fee(s, 470)}).`,
        ok('Months later, approval: six more months. You keep the notice in a plastic sleeve.', { money: -fee(s, 470), legal: 6, flags: { b2ExtendAsked: true, b2Extended: true, b2Until: n(s, 'b2Until') + 6 } }, 'Visitor extensions come in steps of up to six months (8 CFR 214.2(b)(1)). While a timely, nonfrivolous request is pending, unlawful presence is tolled for up to 120 days if you do not work without permission (INA 212(a)(9)(B)(iv)).'),
        {
          roll: { base: 65, mods: [legal()], flagMods: [{ flag: 'unauthWork', delta: -40, label: 'work without permission' }] },
          fail: bad('A denial arrives. You must leave, and there is no appeal.', { money: -fee(s, 470), legal: -4, wellbeing: -5, flags: { b2ExtendAsked: true, b2ExtDenied: true } }, 'Not every request is granted.', 'An extension denial cannot be appealed (8 CFR 214.1(c)). Leaving promptly keeps the record clean for future visits.'),
        },
      ),
      c('no', 'Do not file. You will leave on time.', ok('You start counting the days you have left and spending them well.', { family: 2, flags: { b2ExtendAsked: true } })),
      c('later', 'Wait and decide near the date.', bad('The weeks go faster than you expected.', { legal: -2, flags: { b2ExtendAsked: true } }, 'Deadlines are easier from a distance.', 'An extension cannot be approved if your stay already ended before you filed, except where USCIS excuses a late filing (8 CFR 214.1(c)).')),
    ],
  }), { statuses: ['B2'], when: (s) => st(s) === 'B2' && !has(s, 'b2ExtendAsked') && now(s) < n(s, 'b2Until') }),

  ...(['b2-deadline', 'b2-last-day'] as const).map((id) =>
    def(id, 'status', 0, (s) => ({
      id,
      track: 'status',
      title: 'The date on your I-94',
      body: `Your authorized stay ends this month. ${has(s, 'b2ExtDenied') ? 'Your extension was denied. ' : ''}Your cousin says lots of people simply stay. Your mother asks when your flight is.`,
      stage: 'apartment-night',
      cast: [{ ...YOU, pose: 'phone' }, { role: 'parent', pose: 'talk' }],
      inlineFact: FX_BARS,
      choices: [
        c('leave', 'Book the flight and leave on time.', goHome('Hugs at the airport and a suitcase heavier than when you came. Your record is clean, and the door to visit again stays open.', { family: 8, legal: 4, wellbeing: 3 }, 'Leaving before your I-94 date keeps a clean record and makes future visas easier to get.')),
        c('stay', 'Stay past the date.', bad('The date passes like any other day. Nothing happens. You feel it anyway.', { legal: -25, wellbeing: -5, flags: { status: 'NONE', statusLostReason: 'overstay', overstaySince: now(s) } }, 'Nothing changed, and everything did.', 'After the I-94 date you are out of status and unlawful presence begins. Leaving after more than 180 days triggers a 3-year bar on returning, after a year a 10-year bar (INA 212(a)(9)(B)).')),
        c('lawyer', 'Ask a legal clinic if any lawful option fits you before the date.', ok('The attorney walks through what exists for your situation. Nothing magic, but you now know the difference between a plan and a hope.', { legal: 4, wellbeing: 2, flags: { legalHelp: true } }, HELP)),
      ],
    }), { statuses: ['B2'], when: (s) => st(s) === 'B2' && now(s) >= n(s, 'b2Until') - 1 }),
  ),

  def('b2-cash-work', 'work', 2, (s) => ({
    id: 'b2-cash-work',
    track: 'work',
    title: 'Just a few shifts',
    body: 'The restaurant owner your uncle mentioned needs someone for weekend shifts. Cash, no forms. Your savings are going faster than you planned.',
    stage: 'cafe',
    cast: [{ ...YOU, pose: 'think' }, { role: 'owner', pose: 'talk' }],
    choices: [
      c('decline', 'Say no and cut your spending instead.', ok('Fewer outings, more home cooking. The money lasts.', { wellbeing: -1, money: 100 })),
      c('volunteer', 'Volunteer at the community center without pay.', ok('You help with a food pantry. No money, but people and purpose.', { community: 6, wellbeing: 3 }, 'Real volunteering for a charity, with no pay or in-kind compensation, is different from work. When in doubt, ask a legal clinic.')),
      c('work', 'Take the shifts.', bad('The cash is welcome. Every time the door opens you look up.', { money: Math.round(500 * priceFactor(calYear(s))), wellbeing: -4, flags: { informalWork: true, unauthWork: true } }, 'It helps now and may cost later.', 'A visitor who works without authorization fails to keep status (8 CFR 214.1(e)). It can lead to denial of extensions or a change of status. Only the immediate relatives of US citizens are excused from this bar when adjusting status (INA 245(c)(2)).')),
    ],
  }), { statuses: ['B2'], when: (s) => !has(s, 'unauthWork') }),

  def('b2-school-offer', 'status', 1.6, (s) => ({
    id: 'b2-school-offer',
    track: 'status',
    title: 'A school says yes',
    body: 'On a whim you applied to a program at a local college. They have admitted you and will issue an I-20 if you can show funding. Classes start in six weeks. A visitor cannot start school before a change to student status is approved, and approval can take months.',
    stage: 'intl-office',
    cast: [{ ...YOU, pose: 'idle' }, { role: 'dso', pose: 'talk' }],
    inlineFact: FX_B2_STUDY,
    choices: [
      c(
        'file-defer',
        `File for a change to F-1 (Form I-539, about $${fee(s, 470)}) and ask the school to defer your start until it is approved.`,
        ok('The approval comes the week before the deferred term. You are a student now, with all the rules that brings.', { money: -fee(s, 470), legal: 10, study: 4, flags: { status: 'F1' } }, 'A visitor may not study until USCIS approves the change to F-1, and enrolling early leads to denial (8 CFR 214.2(b)(7), 248.1(c)(3)).'),
        {
          roll: { base: 55, mods: [legal()], flagMods: [{ flag: 'unauthWork', delta: -45, label: 'work without permission' }] },
          fail: bad('A denial: USCIS is not satisfied. You keep your visitor stay until the I-94 date, no longer.', { money: -fee(s, 470), wellbeing: -6, legal: -3 }, 'It was worth trying.', 'Change of status is discretionary. Status violations, such as unauthorized work, generally make you ineligible.'),
        },
      ),
      c('start-now', 'File the request and start classes now anyway.', bad('You sit in the back row of the first lecture, thrilled and uneasy.', { money: -fee(s, 470), study: 2, legal: -10, flags: { b2EnrolledEarly: true } }, 'It feels like a shortcut.', 'USCIS will deny the change to student status if a visitor enrolls before filing or while the request is pending (8 CFR 248.1(c)(3)). Starting early can cost the whole plan.')),
      c('home', 'Go home and apply for a student visa from there.', goHome('You fly back with an admission letter in your bag and a plan to return properly.', { family: 6, legal: 3, study: 2 }, 'Applying for a student visa from home is the standard path and avoids the timing trap of a change of status.')),
    ],
  }), { statuses: ['B2'], when: (s) => now(s) >= 1 && now(s) < n(s, 'b2Until') - 1 }),
];

// ------------------------------------------------------------------ entered without inspection: cards
const EWI_CARDS: ChallengeDef[] = [
  def('ewi-asylum-deadline', 'status', 3, (s) => ({
    id: 'ewi-asylum-deadline',
    track: 'status',
    title: 'Eleven months, then twelve',
    body: `You have been here ${Math.max(1, now(s))} month${now(s) === 1 ? '' : 's'}. The legal clinic reminds you: if you fled because you were in danger for who you are or what you believe, asylum must be asked for within a year of arrival. It is not for people who came only for work, and a knowingly false claim brings a permanent bar.`,
    stage: 'intl-office',
    cast: [{ ...YOU, pose: 'think' }, { role: 'advisor', pose: 'talk' }],
    inlineFact: FX_ASY_DEADLINE,
    choices: [
      c('file', 'You did flee danger. File the asylum application with the clinic\'s help.', ok('The application is long and the night before you file you do not sleep. Then it is in, and the clock for a work permit starts.', { legal: 15, wellbeing: 2, money: -fee(s, 100), flags: { status: 'ASY_PENDING', asyFiled: now(s), informalWork: true } }, 'Anyone present in the US may apply for asylum regardless of how they arrived (INA 208(a)(1)). A work permit can be requested 150 days after filing and cannot be issued before 180 days (8 CFR 208.7). The asylum application fee shown on the USCIS fee schedule is $100.')),
      c('no-claim', 'Your reasons were about money and family. You do not file.', ok('It is the honest answer, and it leaves you where you were. The clinic says to come back if anything changes.', { wellbeing: -1, legal: 2 }, 'Asylum protects people persecuted on account of race, religion, nationality, political opinion or a particular social group. Economic hardship alone does not qualify.')),
      c('file-anyway', 'File anyway. A man at work says everyone does.', bad('You copy a story that is mostly not yours. Your stomach turns as you sign.', { legal: 2, wellbeing: -8, money: -fee(s, 100), flags: { status: 'ASY_PENDING', asyFiled: now(s), asyWeak: true, informalWork: true } }, 'Signing your name to someone else\'s story is heavy.', 'A knowingly frivolous asylum application makes a person permanently ineligible for any benefit under the immigration laws (INA 208(d)(6)). A weak or false claim also puts you on a path to immigration court.')),
    ],
  }), { statuses: ['NONE'], when: (s) => isEwi(s) && !has(s, 'asyFiled') && now(s) <= 11 }),

  def('ewi-legal-screening', 'status', 1.6, (s) => ({
    id: 'ewi-legal-screening',
    track: 'status',
    title: 'What doors are open?',
    body: `A DOJ-accredited representative at a nonprofit reviews your situation for free. ${has(s, 'usCitizenPartner') || has(s, 'marriedCitizen') ? 'You mention the US citizen you love. ' : ''}She speaks slowly, so you can take it in.`,
    stage: 'intl-office',
    cast: [{ ...YOU, pose: 'sit' }, { role: 'advisor', pose: 'talk' }],
    inlineFact: FX_AOS,
    choices: [
      c('listen', 'Ask for everything, including what you do not want to hear.', ok(`She explains: because you were not inspected and admitted, you cannot get a green card from inside the country, even through marriage; 245(i) does not help recent arrivals. ${barText(s)} Some people married to a citizen use a waiver and go to a consulate abroad. Court cases have their own forms of relief.`, { legal: 8, wellbeing: 1, flags: { legalHelp: true } }, `INA 245(a) requires inspection and admission or parole; 245(i) needs a petition filed by April 30, 2001. ${HELP}`)),
      c('hope', 'Ask only about the good news.', ok('She is kind and does not pretend. You leave with less hope and a phone number.', { legal: 4, flags: { legalHelp: true } })),
      c('skip', 'Skip it. Lawyers mean records.', bad('You tell yourself it is safer not to know.', { wellbeing: -3 }, 'Not knowing is not the same as safe.', 'Nonprofit legal programs and accredited representatives give free or low-cost screenings, and what you tell them is confidential. Unlicensed consultants, not lawyers, are the real risk.')),
    ],
  }), { statuses: ['NONE'], when: (s) => isEwi(s) && !has(s, 'legalHelp') }),

  def('ewi-court-notice', 'status', 1, (s) => ({
    id: 'ewi-court-notice',
    track: 'status',
    title: 'A Notice to Appear',
    body: 'An officer stopped the van you ride to work and checked everyone\'s papers. You were held for a day, then released with a document: a Notice to Appear in immigration court, with a date months away. Your hands shake reading it.',
    stage: 'street',
    cast: [{ ...YOU, pose: 'think' }, { role: 'officer', pose: 'talk' }],
    choices: [
      c('lawyer', 'Find a lawyer or accredited representative and go to every hearing.', ok('A nonprofit takes your case. The judge sets another date, years out. You are still afraid, but you are not alone.', { legal: 6, wellbeing: -3, money: -fee(s, 400), flags: { ewiNta: true, legalHelp: true } }, `Immigration court cases often last years; the court backlog was about 3.3 million cases at the end of FY2026 (EOIR). People who attend with representation can ask for relief such as asylum, if they qualify. ${HELP}`)),
      c('alone', 'Go to the hearings by yourself.', ok('The courtroom is cold and fast. The judge gives you time to find a lawyer.', { legal: 2, wellbeing: -5, flags: { ewiNta: true } })),
      c('skip', 'Do not go. Move and change your number.', bad('The date comes and goes. You hear nothing, which is worse.', { legal: -20, wellbeing: -8, flags: { ewiNta: true, inAbsentia: true, removalOrder: true } }, 'Not going does not make it go away.', 'A judge can order removal in your absence. EOIR issued about 311,000 in absentia orders in FY2025. A removal order makes later entry without permission a federal crime (INA 276) and triggers the 212(a)(9)(C) bar.')),
    ],
  }), { statuses: ['NONE'], when: (s) => isEwi(s) && !has(s, 'ewiNta') && now(s) >= 3 }),

  def('ewi-roots', 'life', 1.2, (s) => ({
    id: 'ewi-roots',
    track: 'life',
    title: 'Roots without papers',
    body: `You have been here ${Math.floor(now(s) / 12)} years now. You have a regular table at the taquería, a niece born here who calls you her favorite, and a boss who trusts you with the keys. On paper, you still do not exist.`,
    stage: 'park',
    cast: [{ ...YOU, pose: 'sit' }, { role: 'friend', pose: 'laugh' }, { role: 'parent', pose: 'talk' }],
    choices: [
      c('check-in', 'Check in with the legal clinic about anything new.', ok('Nothing new for you this year. They keep your file and your number.', { legal: 3, flags: { legalHelp: true } }, 'Laws and policies change. Some relief exists only in immigration court, such as cancellation of removal, which needs 10 years of continuous presence and exceptional hardship to a US citizen or resident relative (reported eligibility; check with counsel).')),
      c('savings', 'Build savings and keep tax records with an ITIN.', ok('A folder of tax returns grows on the shelf. It is a paper trail of a life.', { money: 200, wellbeing: 2 }, 'People without a Social Security number can generally file taxes with an ITIN; it does not authorize work.')),
      c('home', 'Think seriously about going home.', ok('You talk it through with your family at home. Nothing is decided, but it is said out loud.', { family: 4, wellbeing: -2 }, `${barText(s)} (INA 212(a)(9)(B)).`)),
    ],
  }), { statuses: ['NONE'], when: (s) => isEwi(s) && now(s) >= 36 }),
];

// ------------------------------------------------------------------ asylum cards
const ASY_CARDS: ChallengeDef[] = [
  def('asy-file', 'status', 0, (s) => ({
    id: 'asy-file',
    track: 'status',
    title: 'Filing the I-589',
    body: 'The application for asylum is ready: your story, your documents, translations of each one. Once a complete application is received, the clock for a work permit starts.',
    stage: 'intl-office',
    cast: [{ ...YOU, pose: 'present' }, { role: 'advisor', pose: 'talk' }],
    inlineFact: FX_ASY_EAD,
    choices: [
      c('file', 'File it now, complete and signed.', ok('A receipt notice arrives in the mail. You read the date on it again and again.', { legal: 10, money: -fee(s, 100), flags: { asyFiled: now(s), asyLate: now(s) > 12 } }, 'The work-permit clock starts only when a complete application is received; an incomplete one is rejected and the clock does not start (8 CFR 208.7(a)(1)).')),
      c('more', 'Wait a month for one more document from home.', ok('The document arrives. Your case is stronger, the clock a month later.', { legal: 8, money: -fee(s, 100), flags: { asyFiled: now(s) + 1, asyEvidence: true, asyLate: now(s) + 1 > 12 } })),
      c('rush', 'File quickly with missing pages, to start the clock.', bad('The packet comes back: rejected as incomplete. You start again.', { wellbeing: -5, money: -fee(s, 30), flags: { asyFiled: now(s) + 2 } }, 'Speed cost time.', 'An incomplete application is rejected and the 150-day clock does not start (8 CFR 208.7(a)(1)).')),
    ],
  }), { statuses: ['ASY_PENDING'], when: (s) => !has(s, 'asyFiled') }),

  def('asy-before-permit', 'work', 2.5, (s) => ({
    id: 'asy-before-permit',
    track: 'work',
    title: 'Months without a permit',
    body: 'Your application is in, but a work permit is months away. The shelter has a time limit. A man at the bus stop says a car wash pays cash.',
    stage: 'street',
    cast: [{ ...YOU, pose: 'think' }, { role: 'stranger', pose: 'talk' }],
    choices: [
      c('aid', 'Ask the nonprofit about rent help and food programs.', ok('A small housing grant and a food bank card. It is enough, barely.', { money: Math.round(300 * priceFactor(calYear(s))), community: 3, wellbeing: 1 })),
      c('volunteer', 'Volunteer and take free English classes while you wait.', ok('Your English grows faster than your bank balance. People begin to know you.', { community: 5, career: 3, money: -100 })),
      c('cash', 'Take the car wash job.', bad('Cash in your pocket. You hope no one asks.', { money: Math.round(600 * priceFactor(calYear(s))), wellbeing: -4, flags: { informalWork: true, unauthWork: true } }, 'Rent is real. So is the risk.', 'Time with a bona fide asylum case pending generally does not count as unlawful presence, but that protection is lost for someone who works without authorization (INA 212(a)(9)(B)(iii)(II)).')),
    ],
  }), { statuses: ['ASY_PENDING'], when: (s) => !has(s, 'ead') && !has(s, 'informalWork') }),

  def('asy-ead', 'work', 0, (s) => ({
    id: 'asy-ead',
    track: 'work',
    title: 'The work permit',
    body: 'It has been more than five months since your complete application arrived. You can now ask for a work permit. USCIS has 30 days to decide, but cannot issue it until six months have passed since filing.',
    stage: 'intl-office',
    cast: [{ ...YOU, pose: 'idle' }, { role: 'dso', pose: 'talk' }],
    inlineFact: FX_ASY_EAD,
    choices: [
      c(
        'apply',
        'Apply right away.',
        ok('A plastic card with your photo arrives. You can work, legally, for anyone. A hotel hires you the next week.', { money: -fee(s, 550), legal: 8, wellbeing: 8, career: 4, flags: { ead: true, informalWork: false, salary: 2200, jobTitle: 'hotel housekeeper' } }, 'Asylum applicants may request a work permit after 150 days and receive it no earlier than 180 days after filing (8 CFR 208.7(a)(1)). Fees for asylum-related permits were added by a 2025 law; the amount here is an estimate.'),
        {
          roll: { base: 85, flagMods: [{ flag: 'legalHelp', delta: 8, label: 'legal help' }] },
          fail: bad('A notice: your case had an applicant-caused delay, so the clock is paused. More months to wait.', { money: -fee(s, 550), wellbeing: -6 }, 'The clock was not where you thought.', 'Delays requested or caused by the applicant, such as rescheduling an interview or missing fingerprints, stop the clock (8 CFR 208.7(a)(2)).'),
        },
      ),
      c('wait', 'Wait to save for the fee.', bad('Another month of cash jobs and worry.', { wellbeing: -3 }, 'The permit was within reach.')),
    ],
  }), { statuses: ['ASY_PENDING'], when: (s) => has(s, 'asyFiled') && !has(s, 'ead') && now(s) - n(s, 'asyFiled') >= 5 }),

  def('asy-evidence', 'status', 1.8, () => ({
    id: 'asy-evidence',
    track: 'status',
    title: 'Proof from far away',
    body: 'Your representative says your case would be stronger with more evidence: a medical report, a police record, statements from people who saw what happened. Asking for them puts people back home at risk of questions.',
    stage: 'apartment-night',
    cast: [{ ...YOU, pose: 'phone' }, { role: 'parent', pose: 'talk' }],
    choices: [
      c('careful', 'Ask a trusted relative to gather documents quietly.', ok('Over weeks, scans arrive one by one. Your representative nods at each.', { legal: 6, family: -2, flags: { asyEvidence: true } }, 'The applicant must show that a protected ground was a central reason for the persecution (INA 208(b)(1)(B)); corroborating evidence matters.')),
      c('expert', 'Ask the clinic about country reports and a doctor\'s evaluation here.', ok('A volunteer doctor documents your scars. Public reports describe what happens to people like you. It is strange to see your life in a report.', { legal: 5, wellbeing: -3, flags: { asyEvidence: true } })),
      c('none', 'Decide your word will have to be enough.', bad('Your representative is quiet for a moment, then says it can be done.', { legal: -2 }, 'Your story is true; proof helps others see it.')),
    ],
  }), { statuses: ['ASY_PENDING'], when: (s) => !has(s, 'asyEvidence') && !has(s, 'asyDecided') }),

  def('asy-interview', 'status', 0, (s) => {
    const p = asylumOdds(s);
    return {
      id: 'asy-interview',
      track: 'status',
      title: 'The asylum interview',
      body: 'A small office, a box of tissues on the table, an interpreter on the phone. The asylum officer asks you to swear to tell the truth, then asks about the worst days of your life, in order, with dates.',
      stage: 'intl-office',
      cast: [{ ...YOU, pose: 'sit' }, { role: 'officer', pose: 'talk' }, { role: 'advisor', pose: 'idle' }],
      inlineFact: FX_ASY_REFER,
      choices: [
        c(
          'truth',
          'Tell it plainly, even the parts you would rather forget.',
          ok('Weeks later, a letter: asylum granted. You read the word three times before you let yourself believe it.', { legal: 40, wellbeing: 15, flags: { status: 'ASYLEE', ead: true, asyInterviewed: true, asyDecided: true } }, 'People granted asylum must be authorized to work (INA 208(c)(1)(B)) and can apply for a green card after one year (INA 209(b)).'),
          {
            roll: { base: p, mods: [legal('your case file')], flagMods: [{ flag: 'legalHelp', delta: 12, label: 'legal help' }, { flag: 'asyEvidence', delta: 10, label: 'evidence' }] },
            fail: bad('A letter: the officer did not grant your case and referred it to an immigration judge. You will tell it again, in court.', { legal: -8, wellbeing: -8, flags: { asyInterviewed: true, asyReferred: true } }, 'Not yet is not never.', `When an asylum officer does not grant and the applicant has no other status, the case goes to an immigration judge, who decides it fresh (8 CFR 208.14(c)(1)). The work permit continues meanwhile (8 CFR 208.7(b)(1)). In immigration court, grants were about 46 percent of grants plus denials in FY2024 and about 24 percent in FY2025 (EOIR).`),
          },
        ),
        c(
          'polish',
          'Leave out details you think make you look weak.',
          ok('The officer seems satisfied. Weeks later, asylum granted, and a strange guilt about what you did not say.', { legal: 35, wellbeing: 8, flags: { status: 'ASYLEE', ead: true, asyInterviewed: true, asyDecided: true } }),
          {
            roll: { base: Math.round(p * 0.6) },
            fail: bad('The officer notices that your account differs from your written statement. The case is referred to a judge.', { legal: -12, wellbeing: -10, flags: { asyInterviewed: true, asyReferred: true } }, 'Gaps can look like inconsistencies.', 'Officers compare your testimony with your written application. Consistency and candor matter, and painful details often support a claim rather than weaken it.'),
          },
        ),
      ],
    };
  }, { statuses: ['ASY_PENDING'], when: (s) => has(s, 'asyFiled') && !has(s, 'asyInterviewed') && !has(s, 'asyReferred') && now(s) - n(s, 'asyFiled') >= 6 }),

  def('asy-court', 'status', 0, (s) => {
    const p = asylumOdds(s);
    return {
      id: 'asy-court',
      track: 'status',
      title: 'Before the judge',
      body: 'A wood-panelled courtroom. A government attorney at one table, your representative beside you at the other. The judge asks you to raise your right hand. This time the decision is made here.',
      stage: 'conference',
      cast: [{ ...YOU, pose: 'idle' }, { role: 'officer', pose: 'talk' }, { role: 'advisor', pose: 'talk' }],
      choices: [
        c(
          'testify',
          'Testify, with your representative and your evidence.',
          ok('The judge grants asylum from the bench. Your representative squeezes your arm. Outside, the sun is impossibly bright.', { legal: 40, wellbeing: 15, flags: { status: 'ASYLEE', ead: true, asyDecided: true, asyReferred: false } }, 'An immigration judge may grant asylum to a refugee as defined in INA 101(a)(42) (8 CFR 208.14(a)).'),
          {
            roll: { base: p, mods: [legal('your case file')], flagMods: [{ flag: 'legalHelp', delta: 15, label: 'representation' }, { flag: 'asyEvidence', delta: 8, label: 'evidence' }] },
            fail: bad('The judge denies asylum. The words are careful and final. You have 30 days to appeal.', { legal: -15, wellbeing: -12, flags: { asyDenied: true } }, 'This is not the end of every road yet.', 'After a judge\'s denial the work permit ends 30 days later unless an appeal is filed with the Board of Immigration Appeals (8 CFR 208.7(b)(2)).'),
          },
        ),
        c(
          'alone',
          'Go without a representative.',
          ok('You speak for yourself, haltingly. The judge grants asylum. You did not know you could be this brave.', { legal: 40, wellbeing: 12, flags: { status: 'ASYLEE', ead: true, asyDecided: true, asyReferred: false } }),
          {
            roll: { base: Math.round(p * 0.5) },
            fail: bad('The rules of evidence and the questions move too fast. The judge denies asylum.', { legal: -15, wellbeing: -14, flags: { asyDenied: true } }, 'Courts are hard to face alone.', 'There is no right to a free lawyer in immigration court. Nonprofit representation is limited but real; it is worth asking early.'),
          },
        ),
      ],
    };
  }, { statuses: ['ASY_PENDING'], when: (s) => has(s, 'asyReferred') && !has(s, 'asyDecided') && !has(s, 'asyDenied') }),

  def('asy-after-denial', 'status', 5, () => ({
    id: 'asy-after-denial',
    track: 'status',
    title: 'After the denial',
    body: 'Your representative lays out what is left. An appeal to the Board of Immigration Appeals keeps the case open and the work permit alive, but few succeed. Going home is a real choice. Staying without status means living with a removal order.',
    stage: 'intl-office',
    cast: [{ ...YOU, pose: 'sit' }, { role: 'advisor', pose: 'talk' }],
    choices: [
      c(
        'appeal',
        'Appeal.',
        ok('Many months later, the Board sends the case back and the judge grants protection on a second look. You cannot stop shaking.', { legal: 35, wellbeing: 12, flags: { status: 'ASYLEE', ead: true, asyDecided: true, asyDenied: false } }),
        {
          roll: { base: 15, flagMods: [{ flag: 'legalHelp', delta: 8, label: 'representation' }] },
          fail: bad('The Board dismisses the appeal. The order is final. Officers come for you on a weekday morning.', { wellbeing: -15, flags: { asyDecided: true, removal: true } }, 'You did everything you could.', 'After a final order, the work permit ends (8 CFR 208.7(b)(3)) and removal follows. A removal order brings bars on returning and criminal exposure for reentry without permission (INA 212(a)(9), 276).'),
        },
      ),
      c('home', 'Go home on your own terms.', goHome('You pack carefully. The fear has not gone, but neither has your will. Friends drive you to the airport.', { family: 6, wellbeing: -6 }, 'Leaving with a removal order, or after unlawful presence, triggers bars on returning (INA 212(a)(9)). Ask counsel how to leave in the way that keeps the most doors open, such as voluntary departure where available.')),
      c('stay', 'Stay, without status.', bad('You move rooms, keep your head down and work for cash again.', { legal: -25, wellbeing: -10, flags: { status: 'NONE', statusLostReason: 'asylum-denied', removalOrder: true, informalWork: true, ead: false } }, 'The road narrows.', 'Living with a final removal order means arrest can lead directly to removal, and reentering after removal without permission is a federal crime (INA 276).')),
    ],
  }), { statuses: ['ASY_PENDING'], when: (s) => has(s, 'asyDenied') && !has(s, 'asyDecided') }),

  def('asy-granted-life', 'life', 2.5, () => ({
    id: 'asy-granted-life',
    track: 'life',
    title: 'Safe, on paper',
    body: 'You are an asylee. You can work anywhere, build a credit history, plan more than one month ahead. Your body has not caught up. You still check the locks twice.',
    stage: 'clinic',
    cast: [{ ...YOU, pose: 'sit' }, { role: 'nurse', pose: 'talk' }],
    choices: [
      c('therapy', 'Start counseling at a clinic for survivors.', ok('Slowly, the nightmares come less often. You learn their names.', { wellbeing: 10, money: -60 })),
      c('career', 'Throw yourself into a better job.', ok('A new job with benefits. Work feels like proof that you are allowed to live.', { career: 7, wellbeing: -2, flags: { salary: 2800, jobTitle: 'medical assistant' } })),
      c('travel', 'Plan a trip back to see your family.', bad('Your representative goes pale on the phone.', { wellbeing: -3, legal: -2 }, 'The trip home would cost more than a ticket.', 'Asylees may travel abroad only with prior permission (INA 208(c)(1)(C)), and returning to the country you fled can call your claim of fear into question. Ask counsel before any trip.')),
    ],
  }), { statuses: ['ASYLEE'] }),

  def('asy-green-card', 'status', 3, (s) => ({
    id: 'asy-green-card',
    track: 'status',
    title: 'One year as an asylee',
    body: 'A year has passed since the grant. You can now apply for a green card. The form asks again about where you have been and whether you still fear return.',
    stage: 'intl-office',
    cast: [{ ...YOU, pose: 'type' }, { role: 'advisor', pose: 'talk' }],
    inlineFact: FX_209,
    choices: [
      c('file', `File the green card application (Form I-485, about $${fee(s, 1440)}).`, ok('A receipt arrives. Your status now reads: green card pending.', { money: -fee(s, 1440), legal: 8, flags: { status: 'AOS_PENDING', greenCardPending: true, aosBasis: 'asylum', priorStatus: 'ASYLEE', aosFiled: now(s) } }, 'Asylees may adjust after one year of physical presence following the grant (INA 209(b)); the green card date is rolled back one year from approval (8 CFR 209.2(f)), which counts toward naturalization.')),
      c('wait', 'Wait a year to save the fee.', ok('The money is tight anyway. Asylum status continues while you save.', { money: 200 })),
    ],
  }), { statuses: ['ASYLEE'], when: (s) => monthsInStatus(s) >= 12 }),
];

// ------------------------------------------------------------------ marriage road (any status)
const MARRIAGE_STATUSES: StatusCode[] = ['B2', 'NONE', 'ASY_PENDING', 'ASYLEE', 'F1', 'OPT', 'STEM_OPT', 'H1B', 'O1', 'LPR'];

const MARRIAGE_CARDS: ChallengeDef[] = [
  def('fam-meet-citizen', 'life', 1.3, (s) => ({
    id: 'fam-meet-citizen',
    track: 'life',
    title: has(s, 'dating') ? 'Getting serious' : 'Someone at the community garden',
    body: has(s, 'dating')
      ? 'The person you have been seeing was born here and is a US citizen. Last night they said they could imagine a whole life with you, and asked if you could too.'
      : 'You keep ending up at the same bed of tomatoes as a funny, patient person who grew up three streets away. They are a US citizen, and they want to cook for you on Friday.',
    stage: 'park',
    cast: [{ ...YOU, pose: 'laugh' }, { role: 'partner', pose: 'talk' }],
    choices: [
      c('yes', 'Let yourself fall for them.', ok('Dinners, long walks, an argument about music that you both enjoy. You feel at home in a way papers cannot give.', { wellbeing: 8, community: 3, flags: { dating: true, usCitizenPartner: true } })),
      c('honest', 'Tell them about your immigration situation first.', ok('They listen, ask questions and do not flinch. It makes you trust them more.', { wellbeing: 6, flags: { dating: true, usCitizenPartner: true } })),
      c('not-now', 'Keep your distance. Your life is too uncertain.', ok('You go home alone and wonder.', { wellbeing: -2 })),
    ],
  }), { statuses: MARRIAGE_STATUSES, when: (s) => s.profile.marital !== 'married' && !has(s, 'usCitizenPartner') && !has(s, 'marriedCitizen') }),

  def('fam-proposal', 'life', 2.2, (s) => ({
    id: 'fam-proposal',
    track: 'life',
    title: 'A ring in a jam jar',
    body: 'Your partner hides a ring in a jar of the jam you made together and waits, red-faced, while you find it. You love them. You also know that for you, marriage has a second meaning, and that officers will ask whether it is real.',
    stage: 'apartment',
    cast: [{ ...YOU, pose: 'cheer' }, { role: 'partner', pose: 'talk' }],
    inlineFact: FX_FRAUD,
    choices: [
      c('yes', 'Say yes, and plan a small wedding with both families on video.', ok('A courthouse wedding, a borrowed suit or dress, your mother crying on a phone held up by a friend. You are married.', { wellbeing: 12, family: 6, money: -fee(s, 900), flags: { marriedCitizen: true, marriedAt: now(s) } })),
      c('wait', 'Say yes, but not until your life is steadier.', ok('A long engagement. They understand, mostly.', { wellbeing: 3, flags: { engaged: true } })),
      c('papers', 'Suggest marrying fast so the green card can start sooner.', bad('They say yes, but something in their face closes a little. Later they ask whether you would have said yes anyway.', { wellbeing: -2, money: -fee(s, 300), flags: { marriedCitizen: true, marriedAt: now(s), rushedMarriage: true } }, 'Love and paperwork are tangled.', 'A marriage must be genuine. Officers examine whether a couple shares a life, and marrying to evade immigration law is a federal crime (INA 275(c)). A real marriage entered quickly is lawful, but expect harder questions.')),
    ],
  }), { statuses: MARRIAGE_STATUSES, when: (s) => has(s, 'usCitizenPartner') && !has(s, 'marriedCitizen') }),

  def('fam-file-petition', 'status', 3, (s) => {
    const ewi = isEwi(s);
    return {
      id: 'fam-file-petition',
      track: 'status',
      title: ewi ? 'Married, and still stuck' : 'Filing for your green card',
      body: ewi
        ? 'Your spouse can petition for you as an immediate relative. But because you entered without inspection, you cannot finish the green card here. The usual road is to file the petition, ask for a waiver of the bar, and then go to a consulate in your home country for the visa interview.'
        : 'Your spouse is a US citizen, so you are an immediate relative. Because you were inspected and admitted, you can file the petition (I-130) and your green card application (I-485) together and wait here.',
      stage: 'intl-office',
      cast: [{ ...YOU, pose: 'type' }, { role: 'spouse', pose: 'idle' }, { role: 'advisor', pose: 'talk' }],
      inlineFact: ewi ? FX_I601A : FX_AOS,
      choices: ewi
        ? [
            c('i130', `File the I-130 petition (about $${fee(s, 675)}) and plan the waiver with an attorney.`, ok('The petition is filed. The attorney warns: the waiver depends on hardship to your spouse, and the consular trip is never risk-free.', { money: -fee(s, 675), legal: 6, flags: { i130Filed: now(s), legalHelp: true } }, `An entrant without inspection cannot adjust under INA 245(a); 245(i) needs a petition filed by April 30, 2001. Leaving for the interview would trigger the bar, so the I-601A waiver is asked for first. ${HELP}`)),
            c('notario', 'A storefront office says it can fix your papers here for $4,000.', bad('They file something. Months later a letter says the application was rejected and your address is now on file.', { money: -fee(s, 4000), legal: -10, wellbeing: -8 }, 'The promise was too good.', 'No one can adjust the status of someone who entered without inspection inside the US, except under the closed 245(i) rule. Filing a doomed I-485 can expose you to enforcement. Use a licensed attorney or accredited representative.')),
            c('wait', 'Wait. The trip abroad scares you.', ok('You stay. Your spouse says they will wait with you.', { wellbeing: -2 })),
          ]
        : [
            c('file', `File the I-130 and I-485 together, plus a work-permit request (about $${fee(s, 2375)}).`, ok('Two thick envelopes, a receipt notice each. Your status now reads: green card pending.', { money: -fee(s, 2375), legal: 15, wellbeing: 6, flags: { i130Filed: now(s), status: 'AOS_PENDING', greenCardPending: true, aosBasis: 'marriage', priorStatus: st(s), aosFiled: now(s) } }, 'Immediate relatives of US citizens who were inspected and admitted can adjust even after a status lapse or unauthorized work (INA 245(a), 245(c)(2)). Current USCIS fees: I-130 $675, I-485 $1,440, I-765 $260 with a pending I-485.')),
            c('lawyer', 'Pay a lawyer to prepare it all first.', ok('The lawyer finds a mistake you would have made on the first page. The package goes in clean.', { money: -fee(s, 2375) - fee(s, 2000), legal: 18, flags: { i130Filed: now(s), status: 'AOS_PENDING', greenCardPending: true, aosBasis: 'marriage', priorStatus: st(s), aosFiled: now(s), legalHelp: true } })),
            c('later', 'Wait until you can afford it.', bad('The fees sit on a list on the fridge.', { wellbeing: -2 }, 'Time out of status keeps adding up, even when a road is open.')),
          ],
    };
  }, { statuses: ['B2', 'NONE', 'ASY_PENDING', 'ASYLEE', 'F1', 'OPT', 'STEM_OPT', 'H1B', 'O1'], when: (s) => has(s, 'marriedCitizen') && !has(s, 'i130Filed') }),

  def('fam-ewi-waiver', 'status', 3, (s) => ({
    id: 'fam-ewi-waiver',
    track: 'status',
    title: 'Proving hardship',
    body: `The petition is approved. ${barText(s)} Before you can go to the consulate, your attorney files the provisional waiver. It must show that your spouse, not you, would suffer extreme hardship if you were kept out.`,
    stage: 'intl-office',
    cast: [{ ...YOU, pose: 'sit' }, { role: 'spouse', pose: 'talk' }, { role: 'advisor', pose: 'talk' }],
    inlineFact: FX_I601A,
    choices: [
      c(
        'evidence',
        'Gather medical records, finances and letters about your spouse\'s life with you.',
        ok('Months later: the waiver is provisionally approved. Now comes the trip.', { money: -fee(s, 1500), legal: 15, wellbeing: 6, flags: { i601aFiled: true, i601aApproved: true } }, 'The waiver depends on hardship to a US citizen or permanent resident spouse or parent; hardship to you or your children does not count by itself (INA 212(a)(9)(B)(v)). People in open removal proceedings are generally not eligible. The filing fee here is an estimate.'),
        {
          roll: { base: 58, mods: [legal()], flagMods: [{ flag: 'legalHelp', delta: 12, label: 'legal help' }, { flag: 'removalOrder', delta: -40, label: 'removal order' }, { flag: 'ewiNta', delta: -45, label: 'an open court case' }] },
          fail: bad('The waiver is denied. You can refile, but not this year.', { money: -fee(s, 1500), wellbeing: -10, flags: { i601aFiled: true } }, 'Hardship is hard to prove.', 'The provisional waiver is discretionary. A denial does not bar a new filing; ask counsel.'),
        },
      ),
      c('skip', 'Decide the risk is too great, and stay as you are.', ok('Your spouse holds your hand. You will find another way to be together here, even without papers.', { wellbeing: -3 })),
    ],
  }), { statuses: ['NONE', 'ASY_PENDING'], when: (s) => isEwi(s) && has(s, 'i130Filed') && !has(s, 'i601aApproved') && now(s) - n(s, 'i130Filed') >= 10 }),

  def('fam-ewi-consular', 'big', 4, (s) => {
    const cond = marriedMonths(s) < 24;
    return {
      id: 'fam-ewi-consular',
      track: 'big',
      title: 'The consulate',
      body: `With the waiver approved, you fly home for your immigrant visa interview. It is the first time you have left since you arrived. If the consular officer finds any problem the waiver does not cover, you could be stuck outside for years.`,
      stage: 'airport',
      cast: [{ ...YOU, pose: 'carry' }, { role: 'spouse', pose: 'wave' }],
      inlineFact: FX_BARS,
      choices: [
        c(
          'go',
          'Go, with every document in order.',
          ok(`The interview is short. The officer stamps your passport. Ten days later you land back in the US as a permanent resident${cond ? ', on a two-year conditional card because the marriage is still young' : ''}. Your spouse is holding a sign with your name.`, { legal: 40, wellbeing: 15, family: 8, money: -fee(s, 1200), flags: { status: 'LPR', greenCardPending: false, conditionalGC: cond } }, 'The provisional waiver covers only unlawful presence. Other grounds, such as reentry after a removal order or more than a year of unlawful presence followed by reentering without inspection, are not covered (INA 212(a)(9)(C)).'),
          {
            roll: { base: 82, flagMods: [{ flag: 'removalOrder', delta: -50, label: 'removal order' }, { flag: 'crime', delta: -30, label: 'criminal record' }] },
            fail: bad('The officer finds a ground the waiver does not cover. The visa is refused. You are home, and the bar now runs.', { legal: -20, wellbeing: -20 }, 'It was the risk everyone feared.', 'A consular refusal after departure leaves the applicant outside the US while the 3- or 10-year bar runs from departure (INA 212(a)(9)(B)).'),
          },
        ),
        c('stay', 'At the last moment, do not go.', ok('You cancel the ticket. Relief and grief arrive together.', { wellbeing: -4 })),
      ],
    };
  }, { statuses: ['NONE', 'ASY_PENDING'], when: (s) => isEwi(s) && has(s, 'i601aApproved') && st(s) !== 'LPR' }),
];

// ------------------------------------------------------------------ green card pending (any basis)
const basisText = (s: GameState): string =>
  ({ marriage: 'your marriage', asylum: 'your asylum grant', employment: 'your job', family: 'your family petition' } as Record<string, string>)[String(s.flags.aosBasis ?? '')] ?? 'your petition';

/** On denial, a still-valid status comes back; otherwise the person is out of status. */
function deniedFlags(s: GameState): Record<string, string | boolean> {
  const prior = String(s.flags.priorStatus ?? '');
  if (prior === 'ASYLEE' || prior === 'H1B' || prior === 'O1') return { status: prior, greenCardPending: false };
  return { status: 'NONE', statusLostReason: 'adjustment-denied', greenCardPending: false };
}

const AOS_CARDS: ChallengeDef[] = [
  def('aos-biometrics', 'status', 3.5, () => ({
    id: 'aos-biometrics',
    track: 'status',
    title: 'Fingerprints and a photo',
    body: 'A letter schedules your biometrics appointment at a USCIS office: fingerprints, a photo and a signature. It takes twenty minutes. Missing it can stall the whole case.',
    stage: 'intl-office',
    cast: [{ ...YOU, pose: 'idle' }, { role: 'dso', pose: 'talk' }],
    choices: [
      c('go', 'Go on the date, early, with the letter and your ID.', ok('Ink-free fingerprints on a glass plate. The officer wishes you luck.', { legal: 5, flags: { aosBiometrics: true } })),
      c('reschedule', 'Reschedule for a day off work.', ok('The new date is a month later. Fine, just slower.', { legal: 1, flags: { aosBiometrics: true } }, 'Rescheduling is allowed but adds time to the case.')),
      c('miss', 'You forget and miss it.', bad('A second letter arrives with a sterner tone.', { legal: -6, wellbeing: -3, flags: { aosBiometrics: true } }, 'One letter can matter a lot.', 'Missing a biometrics appointment can stall or endanger the case. If you must miss it, reschedule before the date.')),
    ],
  }), { statuses: ['AOS_PENDING'], when: (s) => !has(s, 'aosBiometrics'), months: [0, 1, 2, 3, 4, 5, 6, 7, 8] }),

  def('aos-work-permit', 'work', 3, (s) => ({
    id: 'aos-work-permit',
    track: 'work',
    title: 'A work permit and a travel paper',
    body: 'Your work permit card arrives, and with it the option of advance parole, a travel document that lets you leave and come back without abandoning your case. For the first time, you can take a job on the books.',
    stage: 'bank',
    cast: [{ ...YOU, pose: 'cheer' }, { role: 'teller', pose: 'talk' }],
    inlineFact: FX_AP,
    choices: [
      c('job', 'Take a job on the books and open a bank account.', ok('A pay stub with your real name on it. You frame the first one, a little embarrassed.', { career: 6, wellbeing: 6, flags: { ead: true, informalWork: false, salary: 2600, jobTitle: 'office assistant' } })),
      c('both', 'Take the job and also apply for advance parole, just in case.', ok('A second card arrives months later. You hope you never need it.', { career: 5, wellbeing: 4, money: -fee(s, 630), flags: { ead: true, informalWork: false, salary: 2600, jobTitle: 'office assistant', advanceParole: true } }, 'Advance parole is applied for on Form I-131; the fee here is an estimate.')),
      c('keep-cash', 'Keep your cash job. It pays more.', bad('The cash still comes. So does the old worry.', { wellbeing: -3 }, 'You had a door and did not walk through it.')),
    ],
  }), { statuses: ['AOS_PENDING'], when: (s) => !has(s, 'ead'), months: [2, 3, 4, 5, 6, 7, 8, 9] }),

  def('aos-travel', 'life', 1.6, (s) => {
    const risky = upMonths(s) > 6 && calYear(s) >= 2026;
    return {
      id: 'aos-travel',
      track: 'life',
      title: 'A call from home',
      body: `Your father is in the hospital. Everyone asks if you can come. Your green card case is still pending. ${has(s, 'advanceParole') ? 'You have an advance parole document.' : 'You do not have advance parole.'}`,
      stage: 'apartment-night',
      cast: [{ ...YOU, pose: 'phone' }, { role: 'parent', pose: 'talk' }],
      inlineFact: FX_AP,
      choices: [
        has(s, 'advanceParole')
          ? c(
              'go-ap',
              'Go, using advance parole, after calling your lawyer.',
              risky
                ? goHome('Your lawyer warns you, but you go. At the border on the way back, your past months without status count against you. You stay with your father, and the case is lost.', { family: 12, legal: -30, wellbeing: -10 }, 'Since August 13, 2026, USCIS treats leaving on advance parole as a departure for the unlawful presence bars (Matter of Delcarmen-Lara). With more than 180 days of unlawful presence, the trip itself triggered a bar.')
                : ok('You sit by his bed for ten days. On return, an officer inspects your document and lets you back in. The case continues.', { family: 12, wellbeing: 4, money: -fee(s, 1400) }, 'With advance parole and inspection on return, travel does not abandon a pending application (8 CFR 245.2(a)(4)(ii)(B)).'),
            )
          : c('go', 'Go anyway.', goHome('You make it to the hospital in time. When you try to return, your green card application has been treated as abandoned.', { family: 14, legal: -30 }, 'Leaving without advance parole is treated as abandoning a pending adjustment application (8 CFR 245.2(a)(4)(ii)(A)).')),
        c('video', 'Stay, and be there by video every day.', ok('You read to him over the phone. Your cousin holds it to his ear. It is not enough and it is everything you can do.', { family: 4, wellbeing: -6 })),
        c('send', 'Send money for his care and a sibling to sit with him.', ok('The money helps. Your sister sends photos every evening.', { family: 6, money: -fee(s, 800), wellbeing: -3 })),
      ],
    };
  }, { statuses: ['AOS_PENDING'] }),

  def('aos-rfe', 'status', 2.2, (s) => ({
    id: 'aos-rfe',
    track: 'status',
    title: 'A request for evidence',
    body: `A letter from USCIS: they need more before deciding. ${s.flags.aosBasis === 'marriage' ? 'Proof that you and your spouse share a life: a joint lease, a joint bank account, bills in both names, photos over time.' : 'An updated medical exam form and proof of your work history.'} There is a deadline on the first page.`,
    stage: 'apartment',
    cast: [{ ...YOU, pose: 'type' }, { role: s.flags.aosBasis === 'marriage' ? 'spouse' : 'friend', pose: 'think' }],
    choices: [
      c('complete', 'Answer every item, organized and before the deadline.', ok('A neat binder with tabs goes in the mail, tracked. You sleep better that night.', { legal: 8, flags: { aosRfe: true, aosRfeAnswered: true } })),
      c('partial', 'Send what you have now.', bad('Some items are missing, but it is in on time.', { legal: -3, flags: { aosRfe: true, aosRfeAnswered: true, aosWeakFile: true } }, 'Half an answer is a risk.', 'USCIS decides on the record it has. Missing evidence can lead to denial.')),
      c('late', 'You are busy. It can wait a few weeks.', bad('The deadline passes while the binder sits half-finished.', { legal: -12, flags: { aosRfe: true, aosWeakFile: true } }, 'Some deadlines are walls.', 'USCIS decides on the record it has. An unanswered request for evidence can lead to denial.')),
    ],
  }), { statuses: ['AOS_PENDING'], when: (s) => !has(s, 'aosRfe'), months: [3, 4, 5, 6, 7, 8, 9, 10] }),

  def('aos-interview', 'big', 4, (s) => {
    const marriage = s.flags.aosBasis === 'marriage';
    const cond = marriage && marriedMonths(s) < 24;
    const lprFlags = { status: 'LPR', greenCardPending: false, conditionalGC: cond };
    return {
      id: 'aos-interview',
      track: 'big',
      title: 'The green card interview',
      body: marriage
        ? 'You and your spouse sit side by side across from an officer, who asks about your life together: how you met, who wakes up first, what you did last weekend, what is on your bedside table. The officer is testing whether the marriage is real.'
        : `An officer reviews ${basisText(s)}, your history and your answers under oath, line by line.`,
      stage: 'intl-office',
      cast: marriage
        ? [{ ...YOU, pose: 'sit' }, { role: 'spouse', pose: 'sit' }, { role: 'officer', pose: 'talk' }]
        : [{ ...YOU, pose: 'sit' }, { role: 'officer', pose: 'talk' }],
      inlineFact: marriage ? FX_FRAUD : FX_AOS,
      choices: [
        c(
          'truth',
          marriage ? 'Answer honestly, and bring your joint lease, bank statements and photos.' : 'Answer plainly and bring every original document.',
          ok(`A few days later: approved. Your green card arrives in the mail${cond ? ', valid for two years because the marriage is young' : ''}. You are a permanent resident.`, { legal: 35, wellbeing: 14, flags: lprFlags }, cond ? 'A marriage under 24 months old at approval gives conditional residence; the couple must jointly petition to remove the conditions in the 90 days before the second anniversary (INA 216).' : undefined),
          {
            roll: {
              base: 80,
              mods: [legal()],
              flagMods: [
                { flag: 'aosRfe', delta: 3, label: 'evidence on file' },
                { flag: 'aosWeakFile', delta: -20, label: 'gaps in the file' },
                { flag: 'rushedMarriage', delta: -15, label: 'a rushed marriage' },
                { flag: 'crime', delta: -30, label: 'criminal record' },
              ],
            },
            fail: bad('The officer is not satisfied and denies the application. Your lawyer says you may be able to refile, but for now the status you had is all you have.', { legal: -25, wellbeing: -14, flags: deniedFlags(s) }, 'That was not the ending you rehearsed.', 'A denial leaves you in whatever status you still hold, or with none. Talk to a licensed attorney about whether you can refile or renew the request.'),
          },
        ),
        c(
          'rehearse',
          marriage ? 'Rehearse matching answers with your spouse the night before.' : 'Memorize a script for every question.',
          ok('The officer asks something you did not rehearse. You both laugh and answer it truthfully. Approved.', { legal: 30, wellbeing: 10, flags: lprFlags }),
          {
            roll: { base: 60, mods: [legal()], flagMods: [{ flag: 'aosWeakFile', delta: -20, label: 'gaps in the file' }] },
            fail: bad('Your answers sound recited. The officer schedules a second, separate interview for each of you. In the end, the application is denied.', { legal: -25, wellbeing: -15, flags: deniedFlags(s) }, 'Real lives are not scripts.', 'Officers look for a shared life, not identical answers. Real couples disagree about small details; rehearsed sameness can raise more questions than honest differences.'),
          },
        ),
      ],
    };
  }, { statuses: ['AOS_PENDING'], months: [5, 6, 7, 8, 9, 10, 11], when: (s) => s.flags.aosBasis !== 'employment' || has(s, 'aosBiometrics') }),

  def('aos-line', 'status', 1.4, (s) => ({
    id: 'aos-line',
    track: 'status',
    title: 'Waiting in line',
    body: `Months pass with no news. The online case status says the same thing it said in spring. ${s.flags.aosBasis === 'employment' ? 'Your priority date has to become current in the Visa Bulletin before anything moves, and for some countries that takes years.' : 'Processing times run long.'}`,
    stage: 'cafe',
    cast: [{ ...YOU, pose: 'phone' }, { role: 'friend', pose: 'talk' }],
    choices: [
      c('patience', 'Live your life. Check once a month.', ok('You plant a small garden on the balcony and stop refreshing the page every morning.', { wellbeing: 5 })),
      c('inquiry', 'Ask your representative to send an inquiry.', ok('A polite form reply. At least someone looked.', { legal: 2, money: -100 })),
      c('obsess', 'Check the status every hour.', bad('Your phone becomes a slot machine with one outcome.', { wellbeing: -6 }, 'Waiting is its own work.')),
    ],
  }), { statuses: ['AOS_PENDING'] }),
];

// ------------------------------------------------------------------ green card holders
const LPR_CARDS: ChallengeDef[] = [
  def('lpr-long-trip', 'life', 1.4, (s) => ({
    id: 'lpr-long-trip',
    track: 'life',
    title: 'A long stay abroad',
    body: 'Your mother needs care after surgery, and your siblings ask if you can come home for most of a year. You have a green card. You also have a life, a job and a lease here.',
    stage: 'airport',
    cast: [{ ...YOU, pose: 'carry' }, { role: 'parent', pose: 'wave' }],
    inlineFact: FX_LPR_TRIP,
    choices: [
      c('short', 'Go for two months, then rotate with your siblings.', ok('Two months of hospital corridors and home cooking. You come back tired and glad you went.', { family: 10, money: -fee(s, 1500), wellbeing: 2 })),
      c('permit', `Apply for a reentry permit before leaving, then stay as long as needed (fee is an estimate, about $${fee(s, 630)}).`, ok('You stay ten months. On return the officer checks the permit and welcomes you back. The naturalization clock, though, starts over.', { family: 14, money: -fee(s, 2500) - fee(s, 630), career: -4, flags: { reentryPermit: true, natzFrom: now(s) + 10 } }, 'A reentry permit protects against an abandonment finding, but an absence of six months to a year is presumed to break continuous residence for naturalization (INA 316(b)).')),
      c(
        'stay-long',
        'Go without a permit and stay as long as she needs you.',
        ok('You come back after eleven months. The officer asks many questions about your job and home here, then admits you. The naturalization clock starts over.', { family: 14, money: -fee(s, 2500), career: -5, legal: -6, flags: { natzFrom: now(s) + 11 } }),
        {
          roll: { base: 55, mods: [mod2()] },
          fail: goHome('One month stretches into thirteen. Your green card no longer works as a travel document, and you stay where your mother needs you.', { family: 16, legal: -30 }, 'After an absence of a year or more, the green card is no longer a valid entry document (8 CFR 211.1(a)(2)), and a long absence can be treated as abandoning residence.'),
        },
      ),
    ],
  }), { statuses: ['LPR'] }),

  def('lpr-sponsor', 'life', 1.3, (s) => {
    const married = s.profile.marital === 'married' && !has(s, 'marriedCitizen');
    return {
      id: 'lpr-sponsor',
      track: 'life',
      title: married ? 'Bringing your spouse' : 'Your brother asks',
      body: married
        ? 'Your spouse is still at home. As a permanent resident you can petition for a spouse, but in a preference category with a yearly limit, so there may be a wait.'
        : 'Your brother calls: now that you have a green card, can you sponsor him? You look it up together on the phone.',
      stage: 'apartment-night',
      cast: [{ ...YOU, pose: 'phone' }, { role: married ? 'spouse' : 'friend', pose: 'talk' }],
      inlineFact: married ? FX_WAIT : FX_PARENTS,
      choices: married
        ? [
            c('file', `File the I-130 for your spouse now (about $${fee(s, 675)}).`, ok('The petition is in. Your spouse marks the receipt date on a calendar at home.', { money: -fee(s, 675), family: 8, flags: { petitionedSpouse: true } }, 'Permanent residents may petition for spouses and unmarried children (INA 203(a)(2)); the wait depends on the Visa Bulletin. Becoming a citizen later turns a spouse into an immediate relative with no line.')),
            c('wait', 'Wait until you naturalize, so they come as an immediate relative.', bad('Your spouse goes quiet on the phone.', { family: -6 }, 'Years apart are long.', 'Filing now saves your place in line; the petition can convert when you naturalize.')),
          ]
        : [
            c('explain', 'Explain gently that only a citizen can sponsor a sibling, and plan to naturalize.', ok('He is disappointed, then proud of you. You both start counting years.', { family: 3, flags: { siblingHope: true } }, 'Permanent residents cannot petition for siblings; only citizens aged 21 or over can, in the F4 category (INA 203(a)(4)).')),
            c('notario', 'Pay a "visa agent" who says he can arrange it anyway.', bad('He takes $1,500 and a lot of personal information.', { money: -fee(s, 1500), wellbeing: -6, family: -2 }, 'There was no shortcut.', 'There is no lawful way for a permanent resident to sponsor a sibling. Fraudulent agents prey on families.')),
          ],
    };
  }, { statuses: ['LPR'], when: (s) => !has(s, 'petitionedSpouse') && !has(s, 'siblingHope') }),

  def('lpr-card-renewal', 'status', 1, (s) => ({
    id: 'lpr-card-renewal',
    track: 'status',
    title: 'The card in your wallet',
    body: 'Your permanent resident card has a date printed on it, and it is getting close. An employer asks for a copy. A friend says not to bother, it is just a card.',
    stage: 'bank',
    cast: [{ ...YOU, pose: 'idle' }, { role: 'teller', pose: 'talk' }],
    choices: [
      c('renew', `File Form I-90 to replace the card before it expires (fee is an estimate, about $${fee(s, 465)}).`, ok('A receipt notice serves as proof while the new card is made. One less thing.', { money: -fee(s, 465), legal: 4 })),
      c('ignore', 'Ignore it. Your status is permanent.', bad('An airline agent frowns at your expired card. A job offer stalls over the paperwork.', { legal: -4, career: -2 }, 'The status lasts; the proof does not.', 'An expired card makes it hard to prove your status for travel and work. Renewal uses Form I-90, and the fee here is an estimate.')),
    ],
  }), { statuses: ['LPR'], when: (s) => !has(s, 'conditionalGC') && now(s) - n(s, 'lprSince') >= 24 }),

  def('lpr-i751', 'status', 5, (s) => ({
    id: 'lpr-i751',
    track: 'status',
    title: 'Removing the conditions',
    body: 'Your two-year card expires in three months. You and your spouse must file together to show the marriage is real and continuing, with proof of the life you share.',
    stage: 'intl-office',
    cast: [{ ...YOU, pose: 'type' }, { role: 'spouse', pose: 'talk' }],
    inlineFact: FX_216,
    choices: [
      c(
        'joint',
        'File jointly with two years of joint bills, leases and photos.',
        ok('A receipt extends your status. Months later, a ten-year card arrives. The conditions are gone.', { legal: 15, wellbeing: 6, money: -fee(s, 750), flags: { conditionalGC: false } }, 'The joint petition is filed in the 90 days before the second anniversary of residence (INA 216(d)(2)). The fee here is an estimate.'),
        {
          roll: { base: 85, flagMods: [{ flag: 'rushedMarriage', delta: -15, label: 'a rushed marriage' }, { flag: 'separated', delta: -50, label: 'separation' }] },
          fail: bad('USCIS is not satisfied and denies the petition. Your case goes to an immigration judge for review.', { legal: -25, wellbeing: -12, money: -fee(s, 750), flags: { status: 'NONE', statusLostReason: 'conditions-not-removed' } }, 'Not the letter you wanted.', 'If the conditions are not removed, permanent residence ends as of the second anniversary (INA 216(c)(2)); a judge can review the decision.'),
        },
      ),
      c(
        'waiver',
        'The marriage has ended. File alone and ask for the good-faith waiver.',
        ok('An officer reads your proof that the marriage was real when it began. The waiver is granted.', { legal: 12, wellbeing: 4, money: -fee(s, 750), flags: { conditionalGC: false } }, 'A waiver of the joint filing exists when a good-faith marriage ended, or for battery or extreme cruelty, or for extreme hardship (INA 216(c)(4)).'),
        {
          roll: { base: 55, mods: [legal()], flagMods: [{ flag: 'legalHelp', delta: 15, label: 'legal help' }] },
          fail: bad('The waiver is denied. The judge will look at it again.', { legal: -25, wellbeing: -12, money: -fee(s, 750), flags: { status: 'NONE', statusLostReason: 'conditions-not-removed' } }, 'Proving the past is hard.'),
        },
      ),
      c('forget', 'You lose track of the date.', bad('A letter arrives: your conditional residence has ended.', { legal: -30, wellbeing: -12, flags: { status: 'NONE', statusLostReason: 'conditions-not-removed' } }, 'A date that mattered slipped by.', 'If no petition is filed in the 90-day window, permanent residence ends as of the second anniversary (INA 216(c)(2)). A late petition may be considered only with good cause and extenuating circumstances (INA 216(d)(2)(B)).')),
    ],
  }), { statuses: ['LPR'], when: (s) => has(s, 'conditionalGC') && now(s) - n(s, 'lprSince') >= 21 }),

  def('lpr-voter-trap', 'life', 1.2, () => ({
    id: 'lpr-voter-trap',
    track: 'life',
    title: 'At the license office',
    body: 'Renewing your driver\'s license, the clerk asks if you want to register to vote while you are there. The screen has a box to tick. Everyone behind you is in a hurry.',
    stage: 'uscis',
    cast: [{ ...YOU, pose: 'idle' }, { role: 'teller', pose: 'talk' }],
    inlineFact: FX_VOTE,
    choices: [
      c('decline', 'Say no: you are a permanent resident, not a citizen.', ok('The clerk nods and moves on. You make a note to register the day you naturalize.', { legal: 3 })),
      c('ask', 'Ask what the box means for someone with a green card.', ok('The clerk is not sure, so you leave it unticked. Good instinct.', { legal: 2 })),
      c('tick', 'Tick the box. It cannot hurt.', bad('A voter card arrives in the mail weeks later. You put it in a drawer, uneasy.', { legal: -15, flags: { voterRegistered: true } }, 'Some boxes are not for you yet.', 'Falsely claiming citizenship to register, or voting as a noncitizen in a federal election, is a crime (18 U.S.C. 611) and a ground of deportation (INA 237(a)(6)). It can also block naturalization.')),
    ],
  }), { statuses: ['LPR'], when: (s) => !has(s, 'voterRegistered') }),

  def('lpr-n400', 'status', 5, (s) => ({
    id: 'lpr-n400',
    track: 'status',
    title: 'Applying to become a citizen',
    body: `You have been a permanent resident long enough${has(s, 'marriedCitizen') && lprMonths(s) < 57 ? ', married to and living with a US citizen,' : ''} to apply for citizenship. The form asks about every trip abroad, every address and every brush with the law.`,
    stage: 'apartment',
    cast: [{ ...YOU, pose: 'type' }, { role: 'friend', pose: 'talk' }],
    inlineFact: FX_NATZ,
    choices: [
      c('online', `File online (about $${fee(s, 710)}) and start studying for the civics test.`, ok('Flashcards on the fridge: the branches of government, the rights in the First Amendment. Your housemate quizzes you over breakfast.', { money: -fee(s, 710), legal: 8, study: 3, flags: { n400Filed: true, n400Study: true } }, 'Current USCIS fees: N-400 $710 online, $760 on paper, $380 reduced fee for qualifying incomes.')),
      c('paper', `File on paper (about $${fee(s, 760)}) and figure out the test later.`, ok('The packet goes in. The test feels far away.', { money: -fee(s, 760), legal: 6, flags: { n400Filed: true } })),
      c('wait', 'Not now. The fee and the test feel like a lot.', ok('Your green card is still permanent. Citizenship can wait.', { wellbeing: 1 }, 'Naturalization is optional. Citizenship adds the vote, a US passport and the right to petition for parents and siblings.')),
    ],
  }), { statuses: ['LPR'], when: natzEligible }),

  def('lpr-natz-interview', 'big', 5, () => ({
    id: 'lpr-natz-interview',
    track: 'big',
    title: 'The citizenship interview',
    body: 'The officer checks your application line by line. Then the tests: read a sentence aloud in English, write one, and answer civics questions about US history and government.',
    stage: 'intl-office',
    cast: [{ ...YOU, pose: 'sit' }, { role: 'officer', pose: 'talk' }],
    inlineFact: FX_OATH,
    choices: [
      c(
        'answer',
        'Take a breath and answer.',
        ok('"Congratulations," the officer says. Weeks later, in a hall full of people from fifty countries, you raise your right hand and take the oath. You walk out a citizen.', { legal: 30, wellbeing: 15, community: 6, flags: { status: 'CITIZEN' } }, 'You become a citizen when you take the oath at the ceremony (8 CFR 337.9). Applicants must show English and knowledge of US history and government (INA 312).'),
        {
          roll: { base: 72, mods: [{ stat: 'study', center: 50, per: 0.3, label: 'preparation' }, social('English practice')], flagMods: [{ flag: 'n400Study', delta: 15, label: 'studied for the test' }, { flag: 'voterRegistered', delta: -40, label: 'false voter registration' }, { flag: 'crime', delta: -30, label: 'criminal record' }] },
          fail: bad('You freeze on two civics questions. The officer is kind: you will get a second chance at a new appointment.', { wellbeing: -6, flags: { n400Study: true } }, 'Nerves are not knowledge.', 'Applicants who do not pass the English or civics test get one more chance, generally within 90 days (8 CFR 312.5).'),
        },
      ),
    ],
  }), { statuses: ['LPR'], when: (s) => has(s, 'n400Filed') }),
];

// ------------------------------------------------------------------ citizens
const CIT_CARDS: ChallengeDef[] = [
  def('cit-first-vote', 'life', 4, () => ({
    id: 'cit-first-vote',
    track: 'life',
    title: 'Your first ballot',
    body: 'Election day. Your name is on the voter roll. The poll worker, an old man in a cardigan, finds it and smiles. The sticker is small and absurdly meaningful.',
    stage: 'street',
    cast: [{ ...YOU, pose: 'cheer' }, { role: 'stranger', pose: 'talk' }],
    choices: [
      c('vote', 'Vote, and send a selfie to everyone at home.', ok('Your phone fills with flags and hearts from people who have never been here.', { wellbeing: 8, community: 6, family: 4, flags: { voted: true } })),
      c('drive', 'Vote, then volunteer to drive neighbors to the polls.', ok('Three elderly neighbors, one wheelchair, a lot of stories. You feel part of something.', { community: 10, wellbeing: 5, flags: { voted: true } })),
      c('skip', 'Skip it this time. Work is busy.', bad('You see the stickers on everyone else.', { community: -2 }, 'That was a right you waited years for.')),
    ],
  }), { statuses: ['CITIZEN'], months: [3], when: (s) => calYear(s) % 2 === 0 && !has(s, 'voted') }),

  def('cit-passport', 'status', 3, (s) => ({
    id: 'cit-passport',
    track: 'status',
    title: 'A blue passport',
    body: 'Your naturalization certificate sits in a folder. To travel as a citizen you need a US passport. Your old passport is still in the drawer, from the country that made you.',
    stage: 'bank',
    cast: [{ ...YOU, pose: 'present' }, { role: 'teller', pose: 'talk' }],
    choices: [
      c('apply', 'Apply for a US passport right away.', ok('It arrives a few weeks later. You flip through the empty pages and imagine the stamps.', { legal: 5, wellbeing: 5, money: -fee(s, 165), flags: { usPassport: true } })),
      c('both', 'Apply, and check whether your home country allows dual citizenship.', ok('You find out where you stand with both countries. Two passports, or one; at least you know.', { legal: 5, family: 3, money: -fee(s, 165), flags: { usPassport: true } }, 'Some countries end your original citizenship when you naturalize elsewhere; check your home country\'s rules.')),
      c('later', 'Later. You are not traveling soon.', ok('The certificate goes back in its folder.', {})),
    ],
  }), { statuses: ['CITIZEN'], when: (s) => !has(s, 'usPassport') }),

  def('cit-petition-family', 'big', 3, (s) => ({
    id: 'cit-petition-family',
    track: 'big',
    title: 'Bringing family',
    body: 'As a citizen you can petition for your parents with no yearly line, and for your brothers and sisters in a long one. Your mother pretends she does not want to come. Your brother does not pretend.',
    stage: 'apartment-night',
    cast: [{ ...YOU, pose: 'phone' }, { role: 'parent', pose: 'talk' }],
    inlineFact: FX_PARENTS,
    choices: [
      c('parents', `File I-130 petitions for both parents (about $${fee(s, 1350)}).`, ok('Your mother says she will only visit. She has already started packing her pickles.', { family: 12, money: -fee(s, 1350), flags: { petitionedFamily: true } }, 'Parents of a citizen aged 21 or over are immediate relatives with no yearly limit (INA 201(b)(2)(A)(i)).')),
      c('sibling', `File for your brother too (about $${fee(s, 675)} more).`, ok(`You file. The receipt is the start of a very long line${s.profile.country === 'mexico' ? ': for Mexico, reported sibling waits run about 25 years' : ''}.`, { family: 10, money: -fee(s, 2025), flags: { petitionedFamily: true } }, 'Siblings of adult citizens fall in the F4 preference category with a yearly limit (INA 203(a)(4)); waits by country are in the Visa Bulletin.')),
      c('not-yet', 'Not yet. You want to be settled first.', ok('Your family understands. They are proud either way.', { family: 2 })),
    ],
  }), { statuses: ['CITIZEN'], when: (s) => !has(s, 'petitionedFamily') && s.profile.age + s.year >= 21 }),
];

/** Steadiness on a long trip abroad: savings and legal standing both help a return go smoothly. */
function mod2() {
  return { stat: 'legal' as const, center: 60, per: 0.3, label: 'ties to the US' };
}

export const CARDS: ChallengeDef[] = [
  ...FAM_ARRIVAL,
  ...B2_ARRIVAL,
  ...EWI_ARRIVAL,
  ...ASY_ARRIVAL,
  ...B2_CARDS,
  ...EWI_CARDS,
  ...ASY_CARDS,
  ...MARRIAGE_CARDS,
  ...AOS_CARDS,
  ...LPR_CARDS,
  ...CIT_CARDS,
];

