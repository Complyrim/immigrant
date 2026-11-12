import { bad, c, def, mod, ok } from '../cx';
import { cultureOf, playableCountries } from '../country';
import type { ChallengeDef, Country, StatusCode } from '../types';
import type { RouteDef, StatusDef } from '../routes';
import { statusOf } from '../routes';
import { ADULT_FESTIVAL_TEXT } from './festivals-adult';

const YOU = { role: 'player' } as const;

/** The original route: arriving as an F-1 student. */
export const ROUTES: RouteDef[] = [
  {
    id: 'F1',
    name: 'F-1 student',
    note: 'Study in the US, work only as your school allows.',
    startStatus: 'F1',
    arrival: ['arrival-inspection', 'first-night', 'first-week'],
    usesStudentFunding: true,
  },
];

/** Statuses every road can reach. Route writers own the rest (OPT, H1B, B2, asylum and so on). */
export const STATUSES: StatusDef[] = [
  {
    code: 'F1',
    label: 'F-1 student',
    lawful: true,
    work: 'campus',
    pinned: (s) => [
      ...(s.year === 0 ? ([[0, 'orientation']] as Array<[number, string]>) : []),
      [4, 'winter-break'],
      [8, 'tax-8843'],
      [10, 'internship-cpt'],
    ],
    next: 'Graduation brings a choice: practical training (OPT), more study, or home. The H-1B lottery and green card roads open from there.',
  },
  {
    code: 'AOS_PENDING',
    label: 'Green card pending',
    lawful: true,
    work: 'any',
    next: 'Your green card application is in line. Biometrics, a work permit and an interview come before a decision.',
  },
  {
    code: 'LPR',
    label: 'Green card',
    lawful: true,
    work: 'any',
    next: 'Permanent residence. After five years (three if married to a US citizen) you can apply to naturalize.',
  },
  {
    code: 'CITIZEN',
    label: 'US citizen',
    lawful: true,
    work: 'any',
    next: 'You are a US citizen. The road ahead is your own life, and maybe bringing family.',
  },
  {
    code: 'NONE',
    label: 'Out of status',
    lawful: false,
    work: 'informal',
    next: 'Without status, every month carries risk. Legal help can show which doors are still open and how long they stay that way.',
  },
];

/** Opens every year after the first, for anyone who is not a student. */
/** How each year opens, by years since arrival (index 0 is the start of the second year). */
const YEAR_OPENERS: string[] = [
  'Another August, your second here. You know your streets now, your bus stop and the people at the corner store.',
  'Your third August. You no longer convert every price in your head, and you have opinions about which train car to stand in.',
  'Year four. You have a drawer of keys, cards and letters with your name on them, and a favourite seat at the laundromat.',
  'Five years. Somebody new asks you for directions and you give them without thinking. You notice that afterwards.',
  'Year six. The photos on your phone from the first winter look like someone younger, standing very straight.',
  'Seven Augusts. You have outlasted two phones, three addresses and a few friendships, and kept the ones that matter.',
  'Year eight. When you say home now, you sometimes have to say which one you mean.',
  'Nine years. You catch yourself explaining this country to a newcomer the way it was once explained to you.',
  'Ten years. A decade. You mark it quietly: a meal, a call home, a long look at the folder where you keep every paper.',
  'Year eleven. The city has changed around you. Shops you relied on have closed, and you know what used to be on each corner.',
  'Twelve years. Your accent has settled somewhere between two places, and people on both sides remark on it.',
  'Year thirteen. You have now spent more Augusts planning around paperwork than you can easily count.',
  'Fourteen years. The children of your first friends here are tall now, and they call you by a family name.',
  'Fifteen years. Half a working life. Your knees have opinions about stairs, and your advice is asked for more often.',
  'Year sixteen. You find a ticket stub from your first year in a coat pocket and sit with it for a minute.',
  'Seventeen years. The news from home reaches you as a visitor would hear it, and that still surprises you.',
  'Year eighteen. Someone born the year you arrived is an adult now.',
  'Nineteen years. You know which of your habits came with you and which ones you picked up here, and you keep both.',
  'Twenty years. You have lived here almost as long as anywhere. You make the dish from home and it tastes a little like here too.',
  'Year twenty-one. The folder of papers is now a box. You know where everything in it is.',
  'Twenty-two years. Friends talk about retiring, about going back, about staying. Nobody is sure, and that is allowed.',
  'Year twenty-three. You are the one people call when a letter arrives that they do not understand.',
  'Twenty-four years. Some mornings the whole road is plain behind you, every turn of it.',
  'Twenty-five years. A quarter of a century. You raise a glass with the people who were there for parts of it.',
  'Year twenty-six. The young people in your building have no idea how different it all was, and you enjoy telling them.',
  'Twenty-seven years. You plan less by deadlines now and more by seasons.',
  'Year twenty-eight. You count the people you have helped settle here, and lose count.',
  'Twenty-nine years. There is not much about this place that can surprise you, and yet it sometimes does.',
  'Thirty years. You open the oldest photo you have of your arrival, and look at it for a long time.',
];
const STATUS_LINE: Partial<Record<StatusCode, string>> = {
  OPT: 'The work permit in your wallet has an end date, and the next step has to come before it.',
  STEM_OPT: 'The extension gives you time, and time is what the lottery asks for.',
  H1B: 'Your stay is tied to your employer, and the calendar of filings never quite leaves your mind.',
  O1: 'Your stay rests on your work being judged extraordinary, a year at a time.',
  B2: 'You are a visitor, and the date on your record does not move.',
  AOS_PENDING: 'Your green card application is in line. Waiting is its own kind of work.',
  ASY_PENDING: 'Your asylum case is still pending, and you have learned to live inside the waiting.',
  ASYLEE: 'You are safe here, and allowed to stay.',
  LPR: 'The green card in your wallet means you can plan in years, not months.',
  CITIZEN: 'You are a citizen now. The questions are about life, not papers.',
  NONE: 'You are still here without papers. You work, you look out for your people, and you keep your head down.',
};

const NEW_YEAR_GENERAL = def('new-year-general', 'life', 0, (s) => ({
  id: 'new-year-general',
  track: 'life',
  title: `Year ${s.year + 1} begins`,
  body: `${YEAR_OPENERS[Math.min(s.year, YEAR_OPENERS.length) - 1] ?? YEAR_OPENERS[0]} ${STATUS_LINE[statusOf(s)] ?? ''} You can only lean into some of it.`,
  stage: 'street',
  cast: [{ ...YOU, pose: 'idle' }, { role: 'friend', pose: 'wave' }],
  choices: [
    c('career', 'Push at work: a course, a certification, a raise.', ok('Evenings go to study. The payoff is slow, but you can feel it.', { career: 5, wellbeing: -2 })),
    c('community', 'Show up for your community.', ok('Weekends fill with church, mosque, temple or the soccer field. People start to count on you.', { community: 5, wellbeing: 1 })),
    c('rest', 'Protect time for family and rest.', ok('More calls home, more sleep. You feel steadier.', { wellbeing: 5, family: 3 })),
    c('budget', 'Plan the budget and hunt for savings.', ok('A spreadsheet and a few phone calls trim what you pay each month.', { money: 180, wellbeing: -1 })),
  ],
}));

/** Festival cards built from each country's culture file. */
function festivalCards(): ChallengeDef[] {
  const out: ChallengeDef[] = [];
  for (const country of playableCountries()) {
    const cu = cultureOf(country);
    if (!cu) continue;
    for (const f of cu.festivals) {
      const id = `fest-${country}-${f.id}`;
      out.push(
        def(
          id,
          'life',
          1.4,
          (s) => {
            // The data files are written for students; anyone not enrolled right now gets the non-student wording.
            const student = statusOf(s) === 'F1';
            const t = student ? f : { ...f, ...ADULT_FESTIVAL_TEXT[`${country}:${f.id}`] };
            return {
              id,
              track: 'life',
              title: t.title,
              body: t.body,
              stage: 'festival',
              cast: [{ ...YOU, pose: 'cheer' }, { role: 'friend', pose: 'laugh' }, { role: student ? 'student' : 'stranger', pose: 'talk' }],
              choices: [
                c('join', t.join, ok(t.joinText, { community: 5, wellbeing: 5, family: 2, money: -30 })),
                c('host', t.host, ok(t.hostText, { community: 7, wellbeing: 3, money: -90 })),
                c('skip', t.skip, ok(t.skipText, student ? { family: 3, wellbeing: -1, study: 1 } : { family: 3, wellbeing: 1 })),
              ],
            };
          },
          { months: [f.month], countries: [country] },
        ),
      );
    }
  }
  return out;
}

/** Statuses that allow any job, and those that allow it once a work permit (flags.ead) is granted. */
const WORK_ANY = ['LPR', 'CITIZEN', 'ASYLEE'];
const WORK_WITH_EAD = ['AOS_PENDING', 'ASY_PENDING'];

/**
 * When someone may work but has no job, finding one is the most pressing thing in their life.
 * Pay is take-home per month in 2025 dollars (designed estimates; the engine scales by year).
 */
const FIND_WORK = def('find-work', 'work', 30, (s) => ({
  id: 'find-work',
  track: 'work',
  title: 'Looking for work',
  body: `You are allowed to work${s.flags.ead ? ' (your work permit came through)' : ''}, but nobody is paying you yet, and the money you came with is going fast. Every week of searching is a week of rent.`,
  stage: 'careerfair',
  cast: [{ ...YOU, pose: 'talk' }, { role: 'recruiter', pose: 'talk' }],
  choices: [
    c('steady', 'Take a steady job you can start now: a warehouse, a store, care work.', ok('The shifts are long and your feet ache, but a paycheck arrives every two weeks.', { career: 2, wellbeing: -1, flags: { salary: 2600, jobTitle: 'warehouse or retail work' } }, 'Taking the job you can get first is how many immigrants start. Pay here is a designed estimate of take-home pay for full-time hourly work.')),
    c('field', 'Hold out for work closer to your field.', ok('An employer calls back, then calls again. You start in two weeks, doing work you trained for.', { career: 7, wellbeing: 4, flags: { salary: 4300, jobTitle: 'work in your field' } }), {
      roll: { base: 30, mods: [mod('career', 40, 0.5, 'work experience'), mod('community', 40, 0.25, 'contacts')] },
      fail: bad('Applications, a few interviews, then silence. You will try again soon.', { wellbeing: -3 }, 'Credentials from home are not always recognized at first.', 'Foreign degrees and licenses often need evaluation or local certification before employers accept them, so many newcomers start below their training level.'),
    }),
    c('course', 'Take a short course first: community college or a certificate.', ok('Evenings in a classroom again. The certificate will open better doors.', { money: -250, study: 6, career: 3 })),
  ],
}), {
  statuses: [...WORK_ANY, ...WORK_WITH_EAD] as ChallengeDef['statuses'],
  repeatAfter: 2,
  when: (s) => !Number(s.flags.salary ?? 0) && (WORK_ANY.includes(String(s.flags.status)) || Boolean(s.flags.ead)),
});

/** Without status and without income, the question is how to live. */
const FIND_CASH_WORK = def('find-cash-work', 'work', 30, () => ({
  id: 'find-cash-work',
  track: 'work',
  title: 'No papers, no paycheck',
  body: 'Rent is due and nobody will hire you on the books. A friend of a friend says a kitchen pays cash, and a crew outside the hardware store takes day workers.',
  stage: 'street',
  cast: [{ ...YOU, pose: 'think' }, { role: 'stranger', pose: 'talk' }],
  choices: [
    c('cash', 'Take the cash work.', ok('Long days, cash in an envelope, no questions. You can pay rent this month.', { wellbeing: -2, legal: -2, flags: { informalWork: true } }, 'Working without authorization is a violation of status rules and can count against you later. Pay is often low and wage theft is common, but basic wage laws still protect every worker.')),
    c('help', 'Lean on community help for now: a food bank, a church, a cousin.', ok('A bag of groceries, a meal and a promise to ask around. It buys you a little time.', { money: 200, community: 3, wellbeing: 1 })),
    c('home', 'Decide it is time to go home.', ok('You make the call you have been avoiding. Your mother cries, then starts planning your room.', { family: 10 }), { success: { text: 'You make the call you have been avoiding. Your mother cries, then starts planning your room.', effects: { family: 10 }, passed: true, ends: 'went-home' } }),
  ],
}), { statuses: ['NONE'], repeatAfter: 2, when: (s) => !s.flags.informalWork && !Number(s.flags.salary ?? 0) });

export const CARDS: ChallengeDef[] = [NEW_YEAR_GENERAL, FIND_WORK, FIND_CASH_WORK, ...festivalCards()];

/**
 * Existing cards written for students (campus, classes, the international office), tagged so other
 * statuses never draw them. Cards not listed here fit anyone.
 */
export const STUDENT_CARDS = new Set([
  'orientation', 'courseload', 'first-exams', 'conference', 'lab-pressure', 'scholarship-review', 'campus-job',
  'internship-cpt', 'tax-8843', 'address-change', 'loan-emi', 'registration-mixup', 'group-project', 'prof-feedback',
  'participation', 'academic-integrity', 'research-start', 'exam-late', 'job-fair', 'resume-review',
  'alumni-networking', 'club-officer', 'textbooks', 'phishing-email',
  'arrival-inspection', 'first-night', 'first-week', 'winter-break', 'student-assoc', 'spouse-f2', 'commute-shock',
  'new-year', 'bank-account', 'sublet-scam', 'bike-stolen', 'mental-health', 'local-friend', 'gym', 'health-visit',
  'homesick', 'family-call', 'scam-call', 'deposit-dispute', 'friend-trip',
]);

/** Cards that only make sense for one country. */
export const COUNTRY_CARDS: Record<string, Country[]> = { 'cricket-sunday': ['india'] };

/** Replaced by the country festival cards above. */
export const RETIRED_CARDS = new Set(['festival-diwali', 'holi']);
