/**
 * Everyday life once you are here (ids `daily-`): ordinary work days and the first errands of a new life.
 *
 * - Work days: one card per duty. Each card has an office or lab version for professional work and a
 *   hands-on version for each kind of work in flags.jobKind (content/jobs.ts; the title is the fallback):
 *   a kitchen shift, a warehouse order, a store till, a hotel room turnover, a construction site, a care
 *   visit, a delivery route or a cleaning shift, including work without authorization. Kitchen, warehouse,
 *   store, hotel and construction use the 'worksite' stage with that kind's painting pinned (placeForKind in
 *   jobs.ts), care is a home visit (an apartment with the 'care-home' painting), delivery 'street' and
 *   cleaning 'workplace'. Office days are never shown to anyone
 *   who cannot work lawfully, and nobody on F-1 or B-2 sees any of these.
 * - The Social Security office (status track, the first months of a new work-authorized status).
 * - The licence office and the road test (life track), then buying a first car.
 *
 * No card here states a legal rule except the REAL ID limited-term licence rule, already verified in
 * research/years-home-notes.md (6 CFR 37.21). Prices are designed estimates in 2025 dollars, scaled by `cost`.
 *
 * Flags set here: ssn, stateId, learnerPermit, license, carBought, and for the matching later-year cards in
 * years-home.ts also yh_licence, yh_licenceSkipY, yh_ownsCar, yh_carY, yh_carSkipY, yh_carLoan.
 */
import { bad, c, def, mod, money, ok, well } from '../cx';
import type { CastSpec, ChallengeDef, Choice, GameState, Line, Outcome, Pose, Role, StageId, StatusCode } from '../types';
import { jobKindOf, placeForKind, siteKindOf } from './jobs';
import type { SiteKind } from './jobs';
import { YOU, band, cost, has, is, mayWork, noStatus, num, settled } from './yx';

// ------------------------------------------------------------------ helpers

const p = (s: GameState, n: number): string => money(cost(s, n));
const career = (label = 'career standing') => mod('career', 50, 0.3, label);
const ties = (label = 'people who know you') => mod('community', 40, 0.25, label);
const title = (s: GameState): string => String(s.flags.jobTitle || '');

/** Paid, lawful work right now (including a work permit held by someone with a pending case). Never without status. */
const lawfulJob = (s: GameState): boolean => settled(s) && !noStatus(s) && mayWork(s) && num(s, 'salary') > 0;
/** Cash work with no lawful paid job behind it (flags.informalWork); F-1 and B-2 never count. */
const cashWork = (s: GameState): boolean => settled(s) && has(s, 'informalWork') && !lawfulJob(s);
/** A hands-on work floor: cash work, or a lawful job whose kind (flags.jobKind, else the title) is not office work. */
const siteJob = (s: GameState): boolean => cashWork(s) || (lawfulJob(s) && jobKindOf(s) !== 'office');
/** A professional job in an office or a lab. */
const officeJob = (s: GameState): boolean => lawfulJob(s) && jobKindOf(s) === 'office';
const cashPaid = (s: GameState): boolean => cashWork(s);
/** The kind of hands-on work today. Cash work never happens at a desk, so an office kind falls back to a seeded one. */
const siteKind = siteKindOf;

/** Everyone who could be working. F-1 and B-2 are never here. */
const WORKERS: StatusCode[] = ['OPT', 'STEM_OPT', 'H1B', 'O1', 'LPR', 'CITIZEN', 'ASYLEE', 'AOS_PENDING', 'ASY_PENDING', 'NONE'];
/** Statuses with papers a licence office can check (same list as years-home.ts). */
const DOCUMENTED: StatusCode[] = ['OPT', 'STEM_OPT', 'H1B', 'O1', 'LPR', 'CITIZEN', 'ASYLEE'];
const TEMPORARY: StatusCode[] = ['OPT', 'STEM_OPT', 'H1B', 'O1'];

const research = (s: GameState): boolean => is(s, 'O1') || /research|scientist/i.test(title(s));
const officeStage = (s: GameState): StageId => (research(s) ? 'lab' : 'workplace');
/** " as a research scientist", or nothing when the title does not read well in a sentence. */
const asTitle = (s: GameState): string => {
  const t = title(s);
  return !t || /work in your field|or retail work/i.test(t) ? '' : ` as ${/^[aeiou]/i.test(t) ? 'an' : 'a'} ${t}`;
};
const payWord = (s: GameState): string => (cashPaid(s) ? 'the envelope' : 'your paycheck');
const extraPay = (s: GameState, cash: string, stub: string): string => (cashPaid(s) ? cash : stub);
const cap = (t: string): string => t.charAt(0).toUpperCase() + t.slice(1);

interface Scene {
  title: string;
  narration: string;
  lines: Line[];
  stage: StageId;
  /** A painting the stage borrows (hands-on work: the one for its kind of work). */
  paint?: string;
  cast: CastSpec[];
  choices: Choice[];
}

/** Ids of the work-day cards, for the engine (for example a shorter gap before they come back). */
export const DAILY_WORK_IDS: string[] = [];

/**
 * One work duty with an office or lab version and a hands-on version (SITE below, one variant per kind
 * of work). Each duty fits four months a quarter apart (the nth duty fits months n, n+3, n+6, n+9), so a
 * year spreads them about one a month instead of drawing several in the same month.
 */
const day = (
  id: string,
  office: (s: GameState) => Scene,
  extraWhen: (s: GameState) => boolean = () => true,
): ChallengeDef => {
  const n = DAILY_WORK_IDS.length;
  DAILY_WORK_IDS.push(id);
  // Every answer stamps the year, so a card swapped in later in the same year cannot repeat it.
  const stamp = `dw_${id}`;
  const mark = (s: GameState, o: Outcome): Outcome => ({ ...o, effects: { ...o.effects, flags: { ...(o.effects.flags ?? {}), [stamp]: s.year } } });
  return def(
    id,
    'work',
    14,
    (s) => {
      const sc = siteJob(s) ? SITE[id](s, siteKind(s)) : office(s);
      const choices = sc.choices.map((ch) => ({ ...ch, success: mark(s, ch.success), ...(ch.fail ? { fail: mark(s, ch.fail) } : {}) }));
      return { id, track: 'work', title: sc.title, body: sc.narration, narration: sc.narration, lines: sc.lines, stage: sc.stage, ...(sc.paint ? { paint: sc.paint } : {}), cast: sc.cast, choices };
    },
    {
      statuses: WORKERS,
      months: [0, 3, 6, 9].map((k) => (n + k) % 12),
      when: (s) => (officeJob(s) || siteJob(s)) && num(s, stamp, -1) !== s.year && extraWhen(s),
    },
  );
};

const manager = (pose: CastSpec['pose'] = 'talk'): CastSpec => ({ role: 'advisor', pose });
const coworker = (pose: CastSpec['pose'] = 'idle'): CastSpec => ({ role: 'friend', pose });

// ------------------------------------------------------------------ hands-on work days, by kind of work

/** Words and people for each kind of hands-on work. Only warehouse and store work shows you holding boxes. */
interface Floor {
  /** Who is in charge, as words. */
  boss: string;
  /** Who speaks for the person in charge: a care coordinator is a nurse, everyone else a boss. */
  bossRole: Role;
  /** What is handed to you on your first day alone. */
  station: string;
  /** One piece of the work: "every plate", "every stop". */
  unit: string;
  /** One stretch of work: "shift", "route". */
  shift: string;
  /** The people you work with. */
  crew: string;
  /** Your usual pose at work. */
  pose: Pose;
  /** Your coworker's usual pose. */
  mate: Pose;
  /** Alone on the job (no coworker standing next to you). */
  alone: boolean;
}

const FLOOR: Record<SiteKind, Floor> = {
  kitchen: { boss: 'the head cook', bossRole: 'owner', station: 'the grill station', unit: 'plate', shift: 'shift', crew: 'the kitchen crew', pose: 'cook', mate: 'cook', alone: false },
  warehouse: { boss: 'the shift lead', bossRole: 'owner', station: 'a picking zone', unit: 'order', shift: 'shift', crew: 'the crew', pose: 'carry', mate: 'carry', alone: false },
  store: { boss: 'the store manager', bossRole: 'owner', station: 'the front till', unit: 'sale', shift: 'shift', crew: 'the crew', pose: 'idle', mate: 'idle', alone: false },
  hotel: { boss: 'the head housekeeper', bossRole: 'owner', station: 'a whole floor of rooms', unit: 'room', shift: 'shift', crew: 'the housekeepers', pose: 'idle', mate: 'talk', alone: false },
  construction: { boss: 'the foreman', bossRole: 'owner', station: 'a section of the site', unit: 'cut', shift: 'day', crew: 'the crew', pose: 'idle', mate: 'think', alone: false },
  care: { boss: 'the care coordinator', bossRole: 'nurse', station: 'a list of three clients', unit: 'visit', shift: 'round of visits', crew: 'the other aides', pose: 'talk', mate: 'phone', alone: true },
  driver: { boss: 'the dispatcher', bossRole: 'owner', station: 'a route of ninety stops', unit: 'stop', shift: 'route', crew: 'the other drivers', pose: 'phone', mate: 'phone', alone: true },
  cleaning: { boss: 'the cleaning supervisor', bossRole: 'owner', station: 'a whole floor of offices', unit: 'room', shift: 'shift', crew: 'the cleaning crew', pose: 'idle', mate: 'talk', alone: false },
};

const bossOf = (k: SiteKind, pose: Pose = 'talk'): CastSpec => ({ role: FLOOR[k].bossRole, pose });
const mateOf = (k: SiteKind, pose?: Pose): CastSpec => coworker(pose ?? FLOOR[k].mate);
const yourPose = (k: SiteKind, stock = false): Pose => (stock && (k === 'warehouse' || k === 'store') ? 'carry' : FLOOR[k].pose);

/** A hands-on scene in the setting for its kind of work, with its painting pinned to the same kind as the words. */
const floor = (k: SiteKind, title: string, narration: string, lines: Line[], cast: CastSpec[], choices: Choice[]): Scene => ({
  title,
  narration,
  lines,
  ...placeForKind(k),
  cast,
  choices,
});

/** The first slip on your own, by kind. */
const MISHAP: Record<SiteKind, string> = {
  kitchen: 'You drop a full tray in the rush. Nobody yells, which is somehow worse.',
  warehouse: 'A stack of boxes slides off your cart in the rush. Nobody yells, which is somehow worse.',
  store: 'You ring up the same item three times while the line watches you fix it. Nobody yells, which is somehow worse.',
  hotel: 'You forget the towels in two rooms and have to run back. Nobody yells, which is somehow worse.',
  construction: 'You cut a board short in the rush and the foreman just sighs, which is somehow worse.',
  care: 'You rush a client through breakfast and she goes quiet on you for the rest of the visit.',
  driver: 'You leave a parcel at the wrong door and have to drive back across town for it.',
  cleaning: 'You skip a whole row of bins in the rush and find a polite note about it the next night.',
};

/** The trick a coworker shows you. */
const TRICK: Record<SiteKind, string> = {
  kitchen: 'a faster way to hold the knife',
  warehouse: 'a trick for the heavy part',
  store: 'a trick for the old till that sticks',
  hotel: 'how to make a bed in half the time',
  construction: 'how to carry a full bucket without wrecking your back',
  care: 'how to help someone stand without hurting either of you',
  driver: 'which stops have dogs and which have back doors',
  cleaning: 'the right mix for the hard floors',
};

const SITE: Record<string, (s: GameState, k: SiteKind) => Scene> = {
  'daily-first-assignment': (_s, k) => {
    const F = FLOOR[k];
    const narration =
      k === 'care'
        ? 'For two weeks someone came on every visit with you. Today the care coordinator hands you a list of three clients and says they are yours.'
        : k === 'driver'
          ? 'For two weeks someone rode along with you. Today the dispatcher hands you the van keys and a route of ninety stops.'
          : `For two weeks someone stood next to you. Today ${F.boss} points at ${F.station} and says it is yours until close.`;
    return floor(
      k,
      'Your first shift alone',
      narration,
      [
        { who: F.bossRole, text: 'You watched long enough. This is yours today.' },
        { who: 'player', text: k === 'care' ? 'All three? On my own?' : k === 'driver' ? 'Ninety stops? On my own?' : 'All of it? Until close?' },
        { who: 'friend', text: F.alone ? 'Call me if anything feels wrong. My phone is always on.' : 'Shout if it gets busy. I am two steps away.' },
      ],
      [{ ...YOU, pose: yourPose(k) }, bossOf(k), mateOf(k)],
      [
        c('steady', `Go slow and get every ${F.unit} right.`, ok(`You are slower than the others and nothing comes back. By the end of the ${F.shift}, ${F.boss} nods at you once.`, { career: 2, wellbeing: 2 })),
        c('fast', 'Go as fast as the others from the first hour.', ok('You keep up, mostly. Your hands shake a little at the end.', { career: 3, wellbeing: -2 }), {
          roll: { base: 55, mods: [well()] },
          fail: bad(MISHAP[k], { wellbeing: -4 }, 'Speed comes after the hands know the work.'),
        }),
        c('help', 'Ask your coworker the moment you are unsure.', ok(`She shows you ${TRICK[k]}. You owe her a coffee and you mean to pay it.`, { community: 3, career: 1 })),
      ],
    );
  },

  'daily-deadline': (s, k) => {
    const F = FLOOR[k];
    const V: Record<SiteKind, [string, string, string]> = {
      kitchen: ['The big booking', 'A party of eighty is booked for lunch tomorrow, and the prep has to start tonight or very early.', 'Eighty for lunch tomorrow. Who stays tonight to prep?'],
      warehouse: ['The big order', 'An order for two hundred comes in for six in the morning. That means everyone stays late tonight, or someone comes in very early.', 'Two hundred, ready by six. Who stays tonight?'],
      store: ['The early truck', 'A truck of holiday stock arrives at six in the morning, and the shelves have to be full before the doors open.', 'The truck comes at six. Who stays tonight to clear the stockroom?'],
      hotel: ['The full house', 'A conference checks in at noon tomorrow, and sixty rooms still need a deep clean first.', 'Sixty rooms by noon tomorrow. Who stays tonight?'],
      construction: ['The early pour', 'The concrete truck is booked for six in the morning, and the forms are not finished.', 'The truck pours at six. Who stays to finish the forms?'],
      care: ['Coming home tomorrow', 'Your client comes home from hospital tomorrow. The house has to be ready: the bed moved downstairs, the bathroom safe, the fridge stocked.', 'She comes home tomorrow. Can someone stay late to get the house ready?'],
      driver: ['The double route', 'A holiday rush: every route doubles tomorrow, and the vans have to be loaded before the sun is up.', 'Double routes tomorrow. Who stays tonight to load the vans?'],
      cleaning: ['The big meeting', 'The office you clean has a board meeting at eight tomorrow, and every floor has to shine before it.', 'Board meeting at eight. Who stays to finish every floor?'],
    };
    const [t, narration, ask] = V[k];
    return floor(
      k,
      t,
      narration,
      [
        { who: F.bossRole, text: ask },
        { who: 'friend', text: 'I have my kids tonight. I can come at four.' },
        { who: 'player', text: 'I can stay. How late?' },
      ],
      [{ ...YOU, pose: yourPose(k, true) }, bossOf(k), mateOf(k, 'think')],
      [
        c('stay', 'Stay late and get it done.', ok(`You leave at midnight with sore feet. ${extraPay(s, 'There is a little extra in the envelope that week.', 'The extra hours show on your next pay stub.')}`, { money: cost(s, 120), wellbeing: -3 })),
        c('early', 'Come in very early with your coworker instead.', ok('The two of you work side by side with the radio on before anyone else is awake. It is the best morning of the month.', { money: cost(s, 100), community: 3, wellbeing: -1 })),
        c('no', 'Say you cannot do either this time.', ok(`${cap(F.boss)} shrugs and calls someone else. Next time the others get asked first.`, { wellbeing: 2, career: -2 })),
      ],
    );
  },

  'daily-present': (_s, k) => {
    const F = FLOOR[k];
    const WAY: Record<SiteKind, string> = {
      kitchen: 'the prep line set up your way',
      warehouse: 'the picking shelves laid out your way',
      store: 'the shelves stocked your way',
      hotel: 'the carts stocked your way',
      construction: 'the tools and materials laid out your way each morning',
      care: 'the visit checklist done your way',
      driver: 'the vans loaded in stop order, your way',
      cleaning: 'the carts and the route through each floor done your way',
    };
    return floor(
      k,
      'Show the new way',
      `${cap(F.boss)} wants ${WAY[k]}, because yours is faster. Before the next ${F.shift} starts, you are to show ${F.crew}.`,
      [
        { who: F.bossRole, text: 'Your way is faster. Show them before we start.' },
        { who: 'player', text: 'Me? Some of them have been here ten years.' },
        { who: 'friend', text: 'Then show us something good. We are listening.' },
      ],
      [{ ...YOU, pose: 'present' }, bossOf(k, 'idle'), mateOf(k, 'idle')],
      [
        c('show', 'Do it once slowly, with your hands, and let them try.', ok(`An older worker nods and changes one small thing, and it is better. By noon it is everyone's way, not yours.`, { community: 4, career: 3 })),
        c('tell', 'Explain it quickly and get back to work.', ok('Half of them do it your way. The other half do it the old way, a little louder.', { career: 1, community: -1 })),
        c('credit', `Say it was the boss's idea, to keep the peace.`, ok(`${cap(F.boss)} looks pleased and says nothing. Everyone knows anyway.`, { community: 2, career: -1 })),
      ],
    );
  },

  'daily-mistake': (s, k) => {
    const F = FLOOR[k];
    const V: Record<SiteKind, [string, string, string, string]> = {
      kitchen: ['The plate that came back', 'A plate comes back from the pass before it reaches the table. The ticket said no nuts, and the garnish has nuts. You plated it.', 'This ticket says no nuts. Who plated it?', 'The two garnish tubs look the same. It happens to all of us.'],
      warehouse: ['The wrong pallet', `A delivery comes back. The labels were right, and the boxes inside were somebody else's order. You packed it.`, 'This came back. Who packed it?', 'Those two codes look the same. It happens to all of us.'],
      store: ['The short till', 'Your till is forty dollars short at the end of the night. You count twice. You gave a twenty in change instead of a five.', 'Your drawer is forty short. What happened?', 'The twenties and fives sit side by side in that drawer. It happens to all of us.'],
      hotel: ['The room you missed', 'A guest calls the front desk: their room was never made up. It was on your list, and you skipped it by mistake.', 'Room 412 was never done. It was on your list.', 'Those two doors are right next to each other. It happens to all of us.'],
      construction: ['Off the line', 'A wall you framed yesterday is two inches off the line on the plan. You measured it.', 'This wall is two inches off. Who framed it?', 'That plan is hard to read in this light. It happens to all of us.'],
      care: ['The locked door', `You lock your client's keys inside when you leave, and her daughter has to call a locksmith to get back in.`, 'Her daughter had to call a locksmith. What happened?', 'Those doors lock by themselves. It happens to all of us.'],
      driver: ['The wrong door', 'A parcel comes back to the depot. The address was right, and you left it at the house next door.', 'This came back. You left it at number twelve, not fourteen.', 'Those two houses look the same. It happens to all of us.'],
      cleaning: ['The room you missed', 'The office manager calls: the conference room was not cleaned before a client meeting. It was on your floor.', 'The conference room was a mess this morning. It was yours.', 'That room hides behind the kitchen. It happens to all of us.'],
    };
    const [t, narration, ask, comfort] = V[k];
    return floor(
      k,
      t,
      narration,
      [
        { who: F.bossRole, text: ask },
        { who: 'player', text: 'That was me. I am sorry. I can put it right now.' },
        { who: 'friend', text: comfort },
      ],
      [{ ...YOU, pose: yourPose(k, k === 'warehouse') }, bossOf(k), mateOf(k)],
      [
        c('redo', 'Say it was you and put it right on your break.', ok(`You miss your lunch and it gets fixed. ${cap(F.boss)} stops frowning at you by the afternoon.`, { career: 2, wellbeing: -2 })),
        c('fix', 'Put it right, and suggest a simple check so it cannot happen again.', ok(`${cap(F.boss)} grumbles about the extra step, then makes it the rule. Nobody makes that mistake again.`, { career: 4, community: 2 })),
        c('pay', `Offer to pay for the mistake out of ${payWord(s)}.`, bad(`${cap(F.boss)} takes the offer. ${extraPay(s, 'The envelope is lighter that week.', 'It comes out of your pay.')} Nobody else is ever offered the same deal.`, { money: -cost(s, 150), wellbeing: -3 }, 'Mistakes at work are part of the cost of running a business.')),
      ],
    );
  },

  'daily-new-hire': (s, k) => {
    const F = FLOOR[k];
    const TEACH: Record<SiteKind, string> = {
      kitchen: 'Teach him the safe way with knives and hot oil, then the fast way, in that order.',
      warehouse: 'Teach him the safe way to lift and the fast way to work, in that order.',
      store: 'Teach him the safe way to lift a case, then the till, in that order.',
      hotel: 'Teach him the safe way to lift a mattress and the fast way to work, in that order.',
      construction: 'Teach him the safe way to lift and the fast way to work, in that order.',
      care: 'Teach him the safe way to help someone stand, then the rest, in that order.',
      driver: 'Teach him the safe way to drive and carry, then the fast way, in that order.',
      cleaning: 'Teach him which cleaners never mix, then the fast way, in that order.',
    };
    return floor(
      k,
      'The new one is yours',
      `A new worker starts today, barely older than your cousin and very nervous. ${cap(F.boss)} puts him with you for the week and walks off.`,
      [
        { who: F.bossRole, text: 'Show him everything. He is with you all week.' },
        { who: 'stranger', text: 'I have never done this before. Is it hard?' },
        { who: 'player', text: 'The first week is hard. Then your hands learn it.' },
      ],
      [{ ...YOU, pose: 'talk' }, bossOf(k, 'idle'), { role: 'stranger', pose: 'idle' }],
      [
        c('teach', TEACH[k], ok('He is slow all week and does not get hurt. On Friday he brings you a pastry from his mother.', { community: 5, wellbeing: 1 })),
        c('pay', `Ask ${F.boss} for a little extra for training him.`, ok('The answer is no, then a little extra appears anyway at the end of the month.', { money: cost(s, 60), career: 1 }), {
          roll: { base: 50, mods: [ties()] },
          fail: ok('The answer is no, and the new one still needs teaching. You teach him.', { community: 2 }),
        }),
        c('own', 'Keep your head down and let him watch.', ok('He watches and copies everything, including your one bad habit.', { wellbeing: 1, community: -1 })),
      ],
    );
  },

  'daily-client': (_s, k) => {
    const F = FLOOR[k];
    const V: Record<SiteKind, [string, string, string, string]> = {
      kitchen: ['The plate sent back', 'A diner sends his plate back for the second time and asks for the person in charge. The head cook is out, and the server is looking at you.', 'Twice now. I want whoever is in charge.', 'He is out for an hour. Tell me what is wrong and I will fix it.'],
      warehouse: ['The angry driver', 'A truck driver has waited two hours at the loading dock and wants someone in charge. The shift lead is in a meeting, and the driver is looking at you.', 'Two hours I have been sitting here. Who is in charge?', 'She is in a meeting. Tell me what you need and I will try.'],
      store: ['The customer at the counter', 'A customer at the counter wants to speak to someone in charge, and the someone in charge is out. He is getting louder, and he is looking at you.', 'This is the second time. I want to talk to someone in charge.', 'He is out for an hour. Tell me what happened and I will try.'],
      hotel: ['The guest in the hallway', 'A guest stops you in the hallway, angry that his room was not ready at check-in. The front desk sent him up anyway, and now he is looking at you.', 'I was told the room would be ready. This is the second time.', 'I am sorry. Give me fifteen minutes and it will be right.'],
      construction: ['The angry neighbor', 'A neighbor walks onto the site, furious about the dust on his car and the noise at seven. The foreman is at the supply yard, and the neighbor is looking at you.', 'Every morning at seven. Who is in charge here?', 'The foreman is out for an hour. Tell me and I will pass it on.'],
      care: ['The worried son', `Your client's son calls during your visit, upset that his mother waited for lunch yesterday when another aide was late. He wants someone in charge, and you are the one who answered.`, 'My mother sat hungry for two hours yesterday. Who do I talk to?', 'I am with her now. Let me tell you how she is, then I will pass it on.'],
      driver: ['The parcel that came late', 'A man is waiting on his doorstep when you pull up, angry that his parcel is a day late. It is not your fault, and he is looking at you.', 'A day late. I took the day off for this.', 'I am sorry. It is here now. Let me find out what happened.'],
      cleaning: ['The desk that was moved', 'An office worker staying late is angry that her desk was moved so the floor could be cleaned. Your supervisor is on another floor, and she is looking at you.', 'Who moved my things? I had everything in order.', 'I did, to clean under it. Show me how it was and I will put it back.'],
    };
    const [t, narration, angry, reply] = V[k];
    const lines: Line[] = [
      { who: 'stranger', text: angry },
      { who: 'player', text: reply },
    ];
    if (!F.alone) lines.push({ who: 'friend', text: 'Stay calm. You are doing fine.' });
    const cast: CastSpec[] = [{ ...YOU, pose: k === 'care' || k === 'driver' ? 'phone' : 'idle' }, { role: 'stranger', pose: 'talk' }];
    if (!F.alone) cast.push(mateOf(k, 'idle'));
    return floor(
      k,
      t,
      narration,
      lines,
      cast,
      [
        c('listen', 'Let them finish, then fix the part you can fix.', ok('It was a small thing in the end. No thank you, which counts as a win here.', { career: 2, wellbeing: 1 })),
        c('call', `Call ${F.boss} and hand over the phone.`, ok(`${cap(F.boss)} sorts it in two minutes and tells you later to just say sorry and offer something small next time.`, { wellbeing: 1 })),
        c('back', 'Say calmly that you will not be shouted at.', ok('They go quiet, surprised. Later your coworker laughs when you tell the story.', { wellbeing: 3, community: 1 }), {
          roll: { base: 55, mods: [ties()] },
          fail: bad(`A complaint reaches ${F.boss}, who sides with them and frowns at you for a week.`, { wellbeing: -3, career: -1 }, 'You were right, and it still cost you.'),
        }),
      ],
    );
  },

  'daily-overtime': (s, k) => {
    const F = FLOOR[k];
    return floor(
      k,
      k === 'driver' ? 'A double route' : k === 'care' ? 'A double round' : 'A double shift',
      `Someone did not show up. ${cap(F.boss)} asks whether you can stay and do the next ${F.shift} too, right now, straight through.`,
      [
        { who: F.bossRole, text: 'He did not come in. Can you do the next one too?' },
        { who: 'player', text: 'I have been going since six.' },
        { who: 'friend', text: 'I can do half if you do half.' },
      ],
      [{ ...YOU, pose: yourPose(k) }, bossOf(k), mateOf(k, 'think')],
      [
        c('double', 'Do the whole double.', ok(`Sixteen hours. ${extraPay(s, 'The extra is in the envelope.', 'The extra hours show on your pay stub.')} Your back reminds you for two days.`, { money: cost(s, 180), wellbeing: -6 })),
        c('half', 'Split it with your coworker.', ok('Four extra hours each. You head home at the same time, too tired to talk, which is its own kind of friendship.', { money: cost(s, 90), community: 3, wellbeing: -2 })),
        c('no', 'Go home. You are done for today.', ok(`${cap(F.boss)} is short with you the next morning, then forgets about it.`, { wellbeing: 3, career: -1 })),
      ],
    );
  },

  'daily-safety': (s, k) => {
    const F = FLOOR[k];
    const lost = `you lose three days of work and ${cashPaid(s) ? 'three days of pay' : 'some pay'}`;
    interface Hazard { t: string; n: string; ask: string; warn: string; safe: [string, string]; slow: [string, string]; quick: [string, string, string] }
    const V: Record<SiteKind, Hazard> = {
      kitchen: {
        t: 'The grease by the fryer', n: 'The floor by the fryer is slick with grease again, and the head cook wants a full pot of boiling stock moved across it, now.',
        ask: 'Move that pot to the back. Now, before the rush.', warn: 'Someone slipped there last month. Mind the grease.',
        safe: ['Throw salt on the grease and get a second pair of hands first.', 'It takes a minute longer. The head cook taps the counter, and nobody gets burned.'],
        slow: ['Ladle it into smaller pots and move them one by one.', 'More trips and a sore arm, but the boiling stock stays in the pots.'],
        quick: ['Carry it across in one go. The rush is coming.', 'You make it across, heart pounding.', `Your foot slides and hot stock splashes your arm. Nothing serious, but ${lost}.`],
      },
      warehouse: {
        t: 'The wet floor', n: 'There is a leak near the back and the floor by the heavy shelves is wet again. You are asked to carry a stack across it, quickly.',
        ask: 'Move those across before the truck comes. Quickly.', warn: 'Someone slipped there last week. Take the long way.',
        safe: ['Mop and put out a sign first, then carry.', 'It takes five extra minutes. The shift lead taps a watch, and nobody falls.'],
        slow: ['Take the long way round with smaller loads.', 'More trips and a sore back, but you stay on your feet.'],
        quick: ['Do it the quick way. The truck is coming.', 'You make it across, twice, heart pounding.', `Your foot goes out from under you. Nothing is broken, but ${lost}.`],
      },
      store: {
        t: 'The wet stockroom', n: 'The cooler in the stockroom is leaking again and the floor by the shelves is wet. You are asked to carry a stack of cases across it, quickly.',
        ask: 'Get those cases out front before we open. Quickly.', warn: 'Someone slipped there last week. Take the long way.',
        safe: ['Mop and put out a sign first, then carry.', 'It takes five extra minutes. The manager taps a watch, and nobody falls.'],
        slow: ['Take the long way round with smaller loads.', 'More trips and a sore back, but you stay on your feet.'],
        quick: ['Do it the quick way. The doors open soon.', 'You make it across, twice, heart pounding.', `Your foot goes out from under you. Nothing is broken, but ${lost}.`],
      },
      hotel: {
        t: 'The broken lift', n: 'The service lift is broken again. The head housekeeper wants a full load of linen carried down three flights of stairs before checkout, quickly.',
        ask: 'All of that downstairs before checkout. Quickly.', warn: 'You cannot see your feet with that pile. Take two trips.',
        safe: ['Ask for a second person and carry it down together.', 'It takes ten minutes to find someone. Nobody falls on the stairs.'],
        slow: ['Take smaller loads and more trips.', 'More trips and burning legs, but you can see every step.'],
        quick: ['Carry it all in one go. Checkout is coming.', 'You make it down, heart pounding, the pile up to your chin.', `You miss a step you could not see past the linen. Nothing is broken, but ${lost}.`],
      },
      construction: {
        t: 'The cracked ladder', n: 'The only tall ladder on site has a cracked foot, and the foreman wants you up it, quickly, to finish a ceiling before the inspector comes.',
        ask: 'Up you go. The inspector is here in an hour.', warn: 'That foot is cracked right through. I would not.',
        safe: ['Refuse that ladder and ask for the scaffold or a new one.', 'The foreman grumbles and sends someone to the yard. The inspector waits ten minutes, and nobody falls.'],
        slow: ['Have your coworker hold the ladder while you work slowly.', `Slow and awkward, with your coworker's weight on the bottom rung. It holds.`],
        quick: ['Go up it anyway. The inspector is coming.', 'You finish the ceiling with your heart in your throat.', `The ladder shifts and you come down hard on one knee. Nothing is broken, but ${lost}.`],
      },
      care: {
        t: 'The slippery bath', n: 'Your client wants a bath today. There is no grab bar and no mat, she is unsteady on her feet, and she does not want to wait.',
        ask: 'Do what is safe. Call me if you are unsure.', warn: 'That bathroom scares me too. Do not do it alone.',
        safe: ['Help her wash sitting down today and report the missing bar.', 'She is a little cross about the chair. The agency sends someone to fit a grab bar the next week.'],
        slow: ['Wait until your coworker can come and help with the bath.', 'Two of you, slow and careful. Your coworker loses half her lunch break and does not mind.'],
        quick: ['Help her into the bath on your own. She insists.', 'She gets her bath, and you hold her the whole time, arms shaking.', `She slips, and you catch her and twist your back. She is unhurt, but ${lost}.`],
      },
      driver: {
        t: 'The icy driveway', n: 'The last stop of the day is up a steep driveway glazed with ice, with a heavy box and the light going. The dispatcher wants the route finished.',
        ask: 'Last stop. Finish it and come in.', warn: 'That hill is a sheet of ice. I fell there last winter.',
        safe: ['Leave a note and bring it back tomorrow with a hand truck.', 'The dispatcher sighs at your late stop. You stay on your feet.'],
        slow: ['Walk up the grass beside the drive, one careful step at a time.', 'Slow and muddy, but you stay up.'],
        quick: ['Carry it straight up the ice. You want to go home.', 'You make it up and back, heart pounding.', `Your feet go out from under you. Nothing is broken, but ${lost}.`],
      },
      cleaning: {
        t: 'The two bottles', n: 'A coffee stain will not come out of the carpet, and the supervisor says to mix the two strong cleaners on your cart to get it done fast.',
        ask: 'Mix the two. It works faster.', warn: 'My aunt got sick doing that. Do not mix them.',
        safe: ['Refuse to mix them and give one cleaner more time.', 'It takes twenty minutes longer. The stain mostly comes out, and nobody breathes anything bad.'],
        slow: ['Open a window and ask your coworker what she uses.', 'She hands you a different bottle. It works, slowly.'],
        quick: ['Mix them. The supervisor said so.', 'The stain comes out. Your eyes sting for an hour.', `The fumes make you dizzy and sick. Nothing lasting, but ${lost}.`],
      },
    };
    const h = V[k];
    return floor(
      k,
      h.t,
      h.n,
      [
        { who: F.bossRole, text: h.ask },
        { who: 'player', text: 'This does not look safe.' },
        { who: 'friend', text: h.warn },
      ],
      [{ ...YOU, pose: yourPose(k, true) }, bossOf(k), mateOf(k)],
      [
        c('mop', h.safe[0], ok(h.safe[1], { wellbeing: 2, community: 1 })),
        c('long', h.slow[0], ok(h.slow[1], { wellbeing: -1 })),
        c('quick', h.quick[0], ok(h.quick[1], { career: 1 }), {
          roll: { base: 70 },
          fail: bad(h.quick[2], { money: -cost(s, 300), wellbeing: -8 }, 'Nobody should have asked you to take that risk.'),
        }),
      ],
    );
  },

  'daily-credit': (s, k) => {
    const F = FLOOR[k];
    const V: Record<SiteKind, [string, string]> = {
      kitchen: ['The head cook praises the spotless walk-in fridge in front of everyone and thanks your coworker. You scrubbed it on Sunday, alone, unpaid.', 'I spent my Sunday on that.'],
      warehouse: ['The shift lead praises the sorted returns shelf in front of everyone and thanks your coworker. You sorted it on Sunday, alone, unpaid.', 'I spent my Sunday on that.'],
      store: ['The store manager praises the clean storeroom in front of everyone and thanks your coworker. You did it on Sunday, alone, unpaid.', 'I spent my Sunday on that.'],
      hotel: ['The head housekeeper praises the tidy linen room in front of everyone and thanks your coworker. You sorted it on your day off, alone, unpaid.', 'I spent my day off on that.'],
      construction: ['The foreman praises the cleared site in front of the owner and thanks your coworker. You hauled the scrap on Saturday, alone, unpaid.', 'I spent my Saturday on that.'],
      care: [`The care coordinator reads out a thank-you card from a client's family and thanks your coworker. It was your client. You did those visits for three months.`, 'Those were my visits.'],
      driver: ['The dispatcher praises your coworker for finishing a huge route early. You took thirty of her stops on top of your own.', 'Thirty of those stops were mine.'],
      cleaning: ['The building manager praises the shining lobby floor and thanks your coworker. You stripped and waxed it on Sunday, alone, unpaid.', 'I spent my Sunday on that.'],
    };
    const [narration, mine] = V[k];
    return floor(
      k,
      'Who did the work',
      narration,
      [
        { who: F.bossRole, text: 'Good job. Really good work.' },
        { who: 'friend', text: 'Thanks, boss.' },
        { who: 'player', text: mine },
      ],
      [{ ...YOU, pose: 'idle' }, bossOf(k), mateOf(k, 'talk')],
      [
        c('say', 'Say plainly, in front of everyone, that it was your work.', ok(`There is a short silence. Then ${F.boss} says thank you to you, and means it.`, { career: 2, wellbeing: 2, community: -1 })),
        c('later', `Tell ${F.boss} alone at the end of the ${F.shift}.`, ok(`${cap(F.boss)} listens, nods, and gives you the better hours next week.`, { career: 2, money: cost(s, 50) })),
        c('drop', 'Say nothing. It is not worth the trouble.', bad('Your coworker never mentions it. The next extra job is yours again.', { wellbeing: -3 }, 'It was worth saying.')),
      ],
    );
  },

  'daily-review': (s, k) => {
    const F = FLOOR[k];
    return floor(
      k,
      'Asking for more',
      `You have been ${cashPaid(s) ? 'paid the same in the envelope' : 'on the same hourly rate'} since you started. You do more than you did then. ${cap(F.boss)} is in a good mood today.`,
      [
        { who: 'player', text: 'Can we talk about my pay? I do more now.' },
        { who: F.bossRole, text: 'Everyone wants more. Business is not easy.' },
        { who: 'friend', text: 'Ask on a good day. Today is a good day.' },
      ],
      [{ ...YOU, pose: 'talk' }, bossOf(k, 'idle'), mateOf(k, 'idle')],
      [
        c('ask', 'Ask, and name the things you do now that you did not do before.', ok('Ten minutes of complaints about costs, then a little more per hour.', { money: cost(s, 200), wellbeing: 3 }), {
          roll: { base: 50, mods: [ties()] },
          fail: bad('"Next year," you are told. You heard that last year.', { wellbeing: -3 }, 'Asking was hard enough. You did it.'),
        }),
        c('hours', 'Ask for more hours instead of more per hour.', ok(`You get two more ${F.shift === 'day' ? 'days' : 'shifts'} a month. More money, less time.`, { money: cost(s, 150), wellbeing: -2 })),
        c('wait', 'Wait for a better moment.', ok('There is always a reason it is not the moment.', { wellbeing: -1 })),
      ],
    );
  },

  'daily-team-lunch': (s, k) => {
    const F = FLOOR[k];
    if (k === 'care') {
      return floor(
        k,
        'Lunch with your client',
        'Your client insists you sit and eat with her today. She cooked, slowly, all morning, and she has set two places at the table.',
        [
          { who: 'parent', text: 'Sit. I made too much, as always.' },
          { who: 'player', text: 'I am supposed to be looking after you.' },
          { who: 'parent', text: 'Then look after me by eating.' },
        ],
        [{ ...YOU, pose: 'eat' }, { role: 'parent', pose: 'laugh' }],
        [
          c('sit', 'Sit and eat with her.', ok('She tells you about her own first year in this country, long ago. Some of it is your story too.', { community: 5, wellbeing: 2 })),
          c('cook', 'Offer to cook something from home next week.', ok('Next week you bring a dish from home. She eats two helpings and asks for the recipe.', { community: 5, money: -cost(s, 25) })),
          c('call', 'Call home on your break instead.', ok('Your mother sounds happy to hear you. Your client wraps a plate for you to take home anyway.', { family: 3, community: 1 })),
        ],
      );
    }
    const V: Record<Exclude<SiteKind, 'care'>, string> = {
      kitchen: 'Before the doors open, the crew eats together at the back. Someone cooked from home, someone else brought bread. There is an empty crate next to the oldest cook.',
      warehouse: 'At the break, the crew eats together in the break room. Someone cooked from home, someone else brought bread. There is an empty chair next to the oldest worker.',
      store: 'Before the doors open, the crew eats together in the back room. Someone cooked from home, someone else brought bread. There is an empty crate next to the oldest cashier.',
      hotel: 'At lunch, the housekeepers eat together in the laundry room downstairs. Someone cooked from home, someone else brought bread. There is an empty stool next to the oldest housekeeper.',
      construction: `At noon the crew eats on the tailgate of the foreman's truck. Someone cooked from home, someone else brought bread. There is room on a stack of lumber next to the oldest worker.`,
      driver: 'Before the vans load, the drivers share coffee and breakfast at the depot. Someone cooked from home, someone else brought bread. There is an empty seat next to the oldest driver.',
      cleaning: 'Before the night shift starts, the crew eats together in the basement. Someone cooked from home, someone else brought bread. There is an empty chair next to the oldest cleaner.',
    };
    return floor(
      k,
      'The staff meal',
      V[k],
      [
        { who: 'friend', text: 'Sit, sit. Nobody eats standing up here.' },
        { who: 'player', text: 'I was going to call home on my break.' },
        { who: F.bossRole, text: 'Ten minutes. Then back to work.' },
      ],
      [{ ...YOU, pose: 'eat' }, mateOf(k, 'laugh'), bossOf(k, 'idle')],
      [
        c('sit', 'Sit and eat with them.', ok('The oldest worker tells a story about his first year here. You laugh in the right places, and some of it is your story too.', { community: 5, wellbeing: 2 })),
        c('cook', 'Offer to cook something from home next week.', ok('The next week your dish is gone in four minutes. Now they call you by a nickname.', { community: 5, money: -cost(s, 25) })),
        c('call', 'Call home on your break instead.', ok('Your mother sounds happy to hear you. They save you a plate anyway.', { family: 3, community: 1 })),
      ],
    );
  },

  'daily-cover': (s, k) => {
    const F = FLOOR[k];
    const job = k === 'driver' ? 'route' : k === 'care' ? 'visits' : 'shift';
    return floor(
      k,
      k === 'driver' ? 'Covering a route' : k === 'care' ? 'Covering her visits' : 'Covering a shift',
      `A coworker texts at seven in the morning. Her mother is in hospital. Can you take her ${job} today, on your one day off this week?`,
      [
        { who: 'friend', text: `I am so sorry. Can you take my ${job} today?` },
        { who: 'player', text: 'Today is my day off. Is your mother all right?' },
        { who: 'friend', text: 'I do not know yet. I will cover you next week, I promise.' },
      ],
      [{ ...YOU, pose: 'phone' }, coworker('phone')],
      [
        c('cover', `Take her ${job}.`, ok(`You lose your day off and gain a friend for life. ${extraPay(s, 'The pay is the same as any day.', 'The hours are on your pay stub.')}`, { money: cost(s, 100), community: 5, wellbeing: -3 })),
        c('swap', `Take it if she takes your Saturday next week.`, ok(`She agrees immediately. Fair for both of you, and she keeps her word, even when ${F.boss} grumbles about the swap.`, { money: cost(s, 100), community: 3 })),
        c('rest', 'Say no. You need the day.', ok('You sleep, cook and call home. She finds someone else, and she understands.', { wellbeing: 4, community: -1 })),
      ],
    );
  },

  'daily-outage': (_s, k) => {
    const F = FLOOR[k];
    interface Breakdown { t: string; n: string; spot: string; me: string; boss: string; move: [string, string]; fix: [string, string, string]; wait: [string, string] }
    const cooler = (what: string): Breakdown => ({
      t: 'The cold room stops',
      n: `Mid-shift the big cooler at the back goes quiet. It is getting warmer inside by the minute, and everything in it is ${what}.`,
      spot: 'The cooler is off. It is getting warm in there.',
      me: `Call ${F.boss}. We need to move everything now.`,
      boss: 'I am twenty minutes away. Save what you can.',
      move: ['Organise the crew to move everything to the small fridges and ice.', `Twenty minutes of running. Almost nothing is lost. When ${F.boss} arrives, there is a long look, then a handshake.`],
      fix: ['Try to restart the cooler yourself.', 'You find the switch that tripped. The hum comes back. You feel like a hero for an hour.', 'Nothing works, and you lost ten minutes trying. Some stock goes in the bin.'],
      wait: [`Wait for ${F.boss}. It is not your cooler.`, 'By the time help arrives a lot of it has to be thrown out. Nobody says much, which says enough.'],
    });
    const V: Record<SiteKind, Breakdown> = {
      kitchen: cooler(`today's food and tomorrow's`),
      store: cooler('milk, meat and cheese for the whole week'),
      warehouse: {
        t: 'The belt stops', n: 'Mid-shift the main conveyor belt grinds to a stop with a hundred orders still on it. The trucks leave at six.',
        spot: 'The belt is dead. Everything is stuck on it.', me: 'Call the shift lead. We can carry the orders by hand.', boss: 'I am twenty minutes away. Keep the orders moving.',
        move: ['Organise the crew to carry the orders to the dock by hand.', 'Two hours of carrying. Every truck leaves on time. When the shift lead arrives, there is a long look, then a handshake.'],
        fix: ['Try to restart the belt yourself.', 'You find the safety switch that tripped. The belt hums again. You feel like a hero for an hour.', 'Nothing works, and you lost ten minutes trying. Two trucks leave late.'],
        wait: ['Wait for the shift lead. It is not your belt.', 'By the time help arrives, two trucks have left half empty.'],
      },
      hotel: {
        t: 'The laundry stops', n: 'Mid-morning the big washers in the basement stop. There is no clean linen, and forty rooms need their beds made by three.',
        spot: 'The machines are dead. There is nothing clean left.', me: 'Call the head housekeeper. We need linen from somewhere.', boss: 'I am twenty minutes away. Do what you can.',
        move: ['Organise the floor to borrow linen from the sister hotel down the street.', 'Two trips with a cart down the street. Every room is ready by three. The head housekeeper just shakes your hand.'],
        fix: ['Try to restart the washers yourself.', 'You find the breaker that tripped. The machines rumble again. You feel like a hero for an hour.', 'Nothing works, and you lost ten minutes trying. Some rooms open late.'],
        wait: ['Wait for the head housekeeper. It is not your machine.', 'By the time help arrives, a line of guests is waiting at the desk.'],
      },
      construction: {
        t: 'The storm', n: 'Mid-afternoon the sky goes black, and the roof your crew is working on is still half open. The foreman is at the supply yard.',
        spot: 'That is a big storm coming. The roof is wide open.', me: 'Call the foreman. We need tarps up before the rain.', boss: 'I am twenty minutes away. Cover what you can, then get down.',
        move: ['Get the crew to tarp the open roof, then everyone down before the rain.', 'Twenty minutes of wind and rope. The rain comes, the room below stays dry, and everyone is on the ground. The foreman shakes your hand.'],
        fix: ['Try to close up the section yourself before the rain.', 'You get the last sheet on just as the first drops fall. You feel like a hero for an hour.', 'The rain beats you, and you climb down. Some new drywall below is soaked.'],
        wait: ['Wait for the foreman to decide.', 'By the time the call comes, the rain has soaked the room below.'],
      },
      care: {
        t: 'The power cut', n: `On a hot afternoon the power goes out at your client's home. No fan, no fridge, and she is getting flushed and tired.`,
        spot: 'The whole street is out. Mine too.', me: 'I need to keep her cool. I am calling the coordinator.', boss: 'I am twenty minutes away. Keep her cool and drinking water.',
        move: ['Move her to the coolest room, with cool cloths and water, and check on her often.', 'An hour of cool cloths and small sips. When the power comes back she is tired and fine. The coordinator writes your name in her notes.'],
        fix: ['Try the fuse box first.', 'It was only her breaker. The fan spins again. You feel like a hero for an hour.', 'It is the whole street, and you lost ten minutes before cooling her down.'],
        wait: ['Wait for the coordinator to get there.', 'She is flushed and dizzy by the time help comes. She is all right, and the coordinator is not happy.'],
      },
      driver: {
        t: 'The van stops', n: 'Halfway through your route the van coughs and dies on a busy street, with forty parcels still in the back.',
        spot: 'I am four streets away. I can take some of yours.', me: 'The van is dead. Forty stops left.', boss: 'A mechanic is an hour out. Do what you can.',
        move: ['Meet your coworker and split the parcels between her van and your feet.', 'You carry the close stops on foot and she takes the rest. Every parcel goes out. The dispatcher shakes your hand the next morning.'],
        fix: ['Try to restart the van yourself.', 'A loose cable. The engine turns over. You feel like a hero for an hour.', 'Nothing works, and you lose half an hour. Twenty parcels go back to the depot.'],
        wait: ['Wait in the van for the mechanic.', 'The mechanic comes at dark. Every parcel goes back to the depot.'],
      },
      cleaning: {
        t: 'The burst pipe', n: 'On your night round a pipe bursts in the ceiling of an office, and water is running onto the desks and computers.',
        spot: 'Water is coming through on my floor too.', me: 'Call the supervisor. We need to save what we can.', boss: 'I am twenty minutes away. Save what you can.',
        move: ['Organise the crew to move the computers and papers out of the water.', 'Twenty minutes of running. Almost nothing is lost. In the morning the office manager leaves a thank-you note on your cart.'],
        fix: ['Find the shut-off valve yourself.', 'You find it behind a panel by the restrooms. The water stops. You feel like a hero for an hour.', 'You cannot find it, and ten minutes are lost. Two desks are soaked.'],
        wait: ['Wait for the supervisor. It is not your building.', 'By the time help arrives, half the floor is soaked.'],
      },
    };
    const b = V[k];
    return floor(
      k,
      b.t,
      b.n,
      [
        { who: 'friend', text: b.spot },
        { who: 'player', text: b.me },
        { who: F.bossRole, text: b.boss },
      ],
      [{ ...YOU, pose: yourPose(k, true) }, mateOf(k), bossOf(k, 'phone')],
      [
        c('move', b.move[0], ok(b.move[1], { career: 4, community: 3, wellbeing: -1 })),
        c('fix', b.fix[0], ok(b.fix[1], { career: 3 }), {
          roll: { base: 45 },
          fail: bad(b.fix[2], { career: -1, wellbeing: -2 }, k === 'care' ? 'Keeping her cool came first.' : 'Saving the work came first.'),
        }),
        c('wait', b.wait[0], bad(b.wait[1], { career: -2 }, 'You could have done more.')),
      ],
    );
  },

  'daily-crunch': (s, k) => {
    const F = FLOOR[k];
    const V: Record<SiteKind, [string, string, string]> = {
      kitchen: ['The inspection', 'The health inspection is due this week, and the head cook wants every shelf and corner deep cleaned on top of the dinner rush.', 'Inspection this week. Every shelf, every corner.'],
      warehouse: ['The busy season', 'It is the busiest week of the year at the warehouse. The shift lead wants a full count of every box and shelf before Sunday, on top of the rush.', 'Inventory by Sunday. Every box, every shelf.'],
      store: ['The busy season', 'It is the busiest week of the year at the store. The manager wants a full count of every shelf before Sunday, on top of the rush.', 'Inventory by Sunday. Every shelf, every case.'],
      hotel: ['The full week', 'Every room is booked this week, and the head housekeeper wants the linen room counted and sorted before Sunday, on top of the rooms.', 'Full house all week. And the linen count by Sunday.'],
      construction: ['The handover', 'The building is handed over on Monday. The foreman wants every item on the punch list done by Sunday, on top of the normal work.', 'Handover Monday. Every item on this list by Sunday.'],
      care: ['Flu season', 'Half the aides are out sick. The coordinator needs every visit covered this week, on top of your own clients.', 'Half the team is sick. Every visit has to be covered.'],
      driver: ['Peak season', 'It is the busiest week of the year. Every route is doubled, and the vans have to be loaded by six each morning.', 'Peak week. Double routes, every day.'],
      cleaning: ['The deep clean', 'The building wants every carpet and window deep cleaned before Sunday, on top of the nightly rounds.', 'Every carpet, every window, by Sunday.'],
    };
    const [t, narration, ask] = V[k];
    return floor(
      k,
      t,
      narration,
      [
        { who: F.bossRole, text: ask },
        { who: 'friend', text: 'And the normal work on top. Every year the same.' },
        { who: 'player', text: 'If we split it up well, it goes faster.' },
      ],
      [{ ...YOU, pose: yourPose(k, true) }, bossOf(k), mateOf(k)],
      [
        c('night', 'Take the extra late hours.', ok(`Three long nights, all done. ${extraPay(s, 'A little extra in the envelope.', 'Extra hours on the pay stub.')}`, { money: cost(s, 150), wellbeing: -4 })),
        c('system', 'Suggest splitting it in pairs during the slow hours.', ok(`It works. Everything is done by Saturday afternoon, and ${F.boss} pretends it was the plan all along.`, { career: 3, community: 2 })),
        c('only', 'Do your normal hours and nothing more.', ok(`Others stay late. ${cap(F.boss)} remembers who did.`, { wellbeing: 2, career: -2 })),
      ],
    );
  },
};

// ------------------------------------------------------------------ work days

const WORK_DAYS: ChallengeDef[] = [
  day(
    'daily-first-assignment',
    (s) => ({
      title: 'Your first real assignment',
      narration: `The setup checklists are done. Your manager hands you your first real piece of work${asTitle(s)}, with your name on it and a date two weeks out.`,
      lines: [
        { who: 'advisor', text: 'This one is yours. It is small, but people will use it.' },
        { who: 'player', text: 'Who should I ask when I get stuck?' },
        { who: 'friend', text: 'Me, mostly. I sit right there and I like coffee.' },
      ],
      stage: officeStage(s),
      cast: [{ ...YOU, pose: 'type' }, manager(), coworker('wave')],
      choices: [
        c('ask', 'Ask questions early, even the ones that feel basic.', ok('Your coworker spends twenty minutes showing you where everything lives. You finish two days early.', { career: 4, community: 2 })),
        c('alone', 'Work it out alone so nobody thinks you are slow.', ok('You get there, after three late nights and one wrong turn nobody needed to take.', { career: 2, wellbeing: -3 }), {
          roll: { base: 60, mods: [career()] },
          fail: bad('You build the wrong thing very well. Your manager is kind about it, and you start again.', { career: -1, wellbeing: -3 }, 'One question on day one would have saved a week.'),
        }),
        c('extra', 'Do it, then add something nobody asked for.', ok('The extra part is clever. Your manager asks you to take it out for now and keep it for later.', { career: 2, wellbeing: -1 })),
      ],
    }),
    (s) => s.flags['dw_daily-first-assignment'] === undefined,
  ),

  day(
    'daily-deadline',
    (s) => ({
      title: 'Due on Friday',
      narration: `It is Wednesday. A client moved a date, and the work you thought was due next week is now due Friday at noon.`,
      lines: [
        { who: 'advisor', text: 'The client moved the date. Friday at noon. Can we make it?' },
        { who: 'player', text: 'If something else can wait, yes.' },
        { who: 'friend', text: 'I can take the boring part off your hands.' },
      ],
      stage: officeStage(s),
      cast: [{ ...YOU, pose: 'think' }, manager(), coworker()],
      choices: [
        c('trade', 'Say yes, and ask your manager what can wait.', ok('Two other things slide to next week with her blessing. You hand it in on Friday at ten.', { career: 4, wellbeing: 1 })),
        c('nights', 'Say yes to everything and work the nights.', ok('You make it, and you sleep most of Saturday.', { career: 3, wellbeing: -5 }), {
          roll: { base: 65, mods: [well()] },
          fail: bad('You make it with a mistake in the middle that the client finds first.', { career: -1, wellbeing: -5 }, 'Tired eyes miss things.'),
        }),
        c('share', 'Take your coworker up on the offer.', ok('Split two ways it is a normal week. You put her name next to yours on the hand-off.', { career: 2, community: 3 })),
      ],
    }),
  ),

  day(
    'daily-present',
    (s) => ({
      title: 'Your turn to present',
      narration: `Every week someone shows their work to the whole team. This week it is you, in English, in front of twenty faces and a director who joined late.`,
      lines: [
        { who: 'advisor', text: 'You have ten minutes on Thursday. Show them what you built.' },
        { who: 'player', text: 'Ten minutes. In front of everyone.' },
        { who: 'friend', text: 'Say it slowly. Nobody minds an accent. They mind long slides.' },
      ],
      stage: officeStage(s),
      cast: [{ ...YOU, pose: 'present' }, manager('sit'), coworker('sit')],
      choices: [
        c('rehearse', 'Practise it out loud twice with your coworker.', ok('Your hands still shake at the start. By the third slide you forget to be nervous, and the director asks a good question.', { career: 5, wellbeing: 1 }), {
          roll: { base: 75, mods: [career()] },
          fail: ok('The room is quiet in the wrong places, and you run over. Your coworker says the middle part was very clear.', { career: 2, wellbeing: -2 }),
        }),
        c('short', 'Keep it to three slides and one clear point.', ok('You finish in six minutes. Nobody remembers the slides, and everyone remembers the point.', { career: 3, wellbeing: 2 })),
        c('swap', 'Ask to swap with someone and go next month.', ok('Your manager agrees, and asks you twice in the next month whether you are ready.', { wellbeing: 2, career: -2 })),
      ],
    }),
  ),

  day(
    'daily-mistake',
    (s) => ({
      title: 'The mistake was yours',
      narration: `A number in last week's report is wrong, and it went to a client. You check twice. It was your formula.`,
      lines: [
        { who: 'friend', text: 'The client is asking about that figure on page three.' },
        { who: 'player', text: 'I think that one is mine. Give me ten minutes.' },
        { who: 'advisor', text: 'Come and find me when you know what happened.' },
      ],
      stage: officeStage(s),
      cast: [{ ...YOU, pose: 'think' }, coworker('talk'), manager()],
      choices: [
        c('own', 'Tell your manager it was you, with the fix already written.', ok('She reads the fix, sends it to the client and moves on. Later she tells someone you are the person who owns things.', { career: 4, wellbeing: 1 })),
        c('quiet', 'Fix it quietly and hope nobody traces it back.', bad('It gets fixed. Two weeks later the client mentions the change, and your manager learns about it from them.', { career: -3, wellbeing: -3 }, 'It was a small mistake. The silence made it bigger.')),
        c('blame', 'Point out that the data you were given was messy.', bad('The data was messy. That was not the question, and everyone at the table knows it.', { career: -2, community: -2 }, 'True and useful are not the same thing.')),
      ],
    }),
  ),

  day(
    'daily-new-hire',
    (s) => ({
      title: 'Training the new hire',
      narration: `A new hire starts Monday, from another country, and your manager asks you to show them the ropes. Not so long ago, that was you.`,
      lines: [
        { who: 'advisor', text: 'Can you be their buddy for the first month?' },
        { who: 'player', text: 'Yes. I remember my first week.' },
        { who: 'friend', text: 'It is extra work. Make sure it counts in your review.' },
      ],
      stage: officeStage(s),
      cast: [{ ...YOU, pose: 'talk' }, manager(), coworker()],
      choices: [
        c('full', 'Do it properly: a checklist, lunch on day one, and the things nobody wrote down.', ok('By week three the new hire is asking you better questions than you asked. Your manager notices who taught them.', { community: 4, career: 3, wellbeing: -1 })),
        c('written', 'Say yes, and ask that it go into your goals in writing.', ok('Your manager adds a line to your goals. You do a good job, and now it is on paper.', { career: 4 })),
        c('decline', 'Say you are too busy right now.', ok('Someone else does it. The new hire still comes to you with questions, quietly.', { career: -1, wellbeing: 1 })),
      ],
    }),
  ),

  day(
    'daily-client',
    (s) => ({
      title: 'An angry call',
      narration: `A client is on the call before your coffee, unhappy about a delay that was not your fault. Your manager is on a plane. It is your call now.`,
      lines: [
        { who: 'recruiter', text: 'We were promised this last week. Who do I talk to?' },
        { who: 'player', text: 'You can talk to me. Let me tell you exactly where it is.' },
        { who: 'friend', text: 'Stay calm. He shouts at everyone. Do not promise a date.' },
      ],
      stage: officeStage(s),
      cast: [{ ...YOU, pose: 'phone' }, { role: 'recruiter', pose: 'talk' }, coworker()],
      choices: [
        c('facts', 'Listen to the end, then give him the facts and the next step.', ok('He runs out of anger in four minutes. He thanks you at the end, which surprises you both.', { career: 4, wellbeing: 1 }), {
          roll: { base: 70, mods: [career()] },
          fail: ok('He is still unhappy, but he hangs up calmer than he started. Your manager hears it went fine.', { career: 2, wellbeing: -2 }),
        }),
        c('promise', 'Promise him it will be done by Friday.', bad('He is happy until Friday. Then he is much less happy, and asks for your manager by name.', { career: -3, wellbeing: -3 }, 'A date you do not control is a promise you cannot keep.')),
        c('pass', 'Say your manager will call him back next week.', ok('He grumbles and hangs up. Your manager calls him from the airport, a little annoyed.', { career: -1, wellbeing: 1 })),
      ],
    }),
  ),

  day(
    'daily-overtime',
    (s) => ({
      title: 'The weekend ask',
      narration: `At five on Friday your manager stops by your desk with a face you are learning to read. Something needs doing this weekend.`,
      lines: [
        { who: 'advisor', text: 'I hate to ask. Could you put in a few hours this weekend?' },
        { who: 'player', text: 'I had plans on Saturday. Sunday could work.' },
        { who: 'friend', text: 'This is the third weekend this quarter. Just saying.' },
      ],
      stage: officeStage(s),
      cast: [{ ...YOU, pose: 'think' }, manager(), coworker()],
      choices: [
        c('sunday', 'Offer Sunday morning only, and keep Saturday.', ok('Four hours on Sunday, and your plans on Saturday. Your manager says thank you twice.', { career: 2, wellbeing: 1 })),
        c('all', 'Give the whole weekend. It is a good moment to be seen.', ok('You are seen. You are also tired on Monday, and on Tuesday.', { career: 4, wellbeing: -5, family: -1 })),
        c('no', 'Say no this time and explain why.', ok('Your manager nods and finds someone else. Nothing bad happens, which you did not expect.', { wellbeing: 3, career: -1 })),
      ],
    }),
  ),

  day(
    'daily-safety',
    (s) => ({
      title: 'The blocked exit',
      narration: `Boxes from the move are stacked against the emergency exit on your floor, and have been for three weeks. Everyone walks past them.`,
      lines: [
        { who: 'player', text: 'Those boxes are in front of the fire exit.' },
        { who: 'friend', text: 'Facilities said they would move them. Last month.' },
        { who: 'advisor', text: 'Send me a note and I will chase it.' },
      ],
      stage: officeStage(s),
      cast: [{ ...YOU, pose: 'idle' }, coworker(), manager()],
      choices: [
        c('report', 'Send the note, with a photo, to your manager and the building office.', ok('The boxes are gone by Thursday. Nobody says who asked.', { community: 2, wellbeing: 1 })),
        c('move', 'Move them yourself after work.', ok('It takes an hour and your shirt is ruined. The exit is clear.', { wellbeing: -1, community: 2 })),
        c('leave', 'Leave it. It is not your job.', ok('The boxes stay. You notice them every day now.', { wellbeing: -1 })),
      ],
    }),
  ),

  day(
    'daily-credit',
    (s) => ({
      title: 'Your idea, his name',
      narration: `In the big meeting a coworker presents the fix you worked out last week. He says "I". Your manager says it is great work.`,
      lines: [
        { who: 'advisor', text: 'Great work on this. Really clever.' },
        { who: 'friend', text: 'Wait, was that not yours? You showed me on Tuesday.' },
        { who: 'player', text: 'It was. I am not sure what to say.' },
      ],
      stage: officeStage(s),
      cast: [{ ...YOU, pose: 'sit' }, manager('sit'), coworker('talk')],
      choices: [
        c('follow', 'Send a friendly note to the team with your notes from last week attached.', ok('Nobody makes a fuss. Your manager replies with one line: thanks, this is helpful. She understands.', { career: 4, community: -1 })),
        c('talk', 'Talk to him privately first.', ok('He goes red and says he meant "we". In the next meeting he says your name twice.', { career: 2, community: 2 }), {
          roll: { base: 60, mods: [ties()] },
          fail: bad('He says he does not know what you mean. You have learned something about him.', { wellbeing: -3 }, 'You were fair to him. He was not fair to you.'),
        }),
        c('let', 'Let it go. There will be other ideas.', bad('There are other ideas. He presents one of those too.', { career: -2, wellbeing: -2 }, 'Silence is easy to read as permission.')),
      ],
    }),
  ),

  day(
    'daily-review',
    (s) => ({
      title: 'The check-in',
      narration: `Your manager books thirty minutes called "check-in". There is a form, and a box where you rate yourself from one to five.`,
      lines: [
        { who: 'advisor', text: 'How would you rate your work so far?' },
        { who: 'player', text: 'Where I come from, you do not give yourself a five.' },
        { who: 'advisor', text: 'Here, if you do not, nobody else will.' },
      ],
      stage: officeStage(s),
      cast: [{ ...YOU, pose: 'sit' }, manager('sit')],
      choices: [
        c('evidence', 'Rate yourself fairly and bring a list of what you delivered.', ok('She copies two of your lines into her own notes. A small raise arrives two months later.', { career: 4, wellbeing: 1, flags: { salary: num(s, 'salary') + 150 } }), {
          roll: { base: 60, mods: [career()] },
          fail: ok('She agrees with all of it. The budget is frozen this year, she says, but it is written down.', { career: 3 }),
        }),
        c('modest', 'Give yourself a three. Let the work speak.', ok('She gives you a three too. The work did speak, quietly.', { career: 1 })),
        c('ask', 'Ask what a five would look like, and write it down.', ok('The answer is vague, but now it is on paper and you can point to it in six months.', { career: 3 })),
      ],
    }),
    (s) => s.year >= 1,
  ),

  day(
    'daily-team-lunch',
    (s) => ({
      title: 'Lunch with the team',
      narration: `The team goes out for lunch on Fridays. You have said "next time" three times. Today someone holds the door open and waits.`,
      lines: [
        { who: 'friend', text: 'Come on. It is just tacos. You always eat at your desk.' },
        { who: 'player', text: 'I brought food from home.' },
        { who: 'friend', text: 'Bring it tomorrow. Today you come.' },
      ],
      stage: 'cafe',
      cast: [{ ...YOU, pose: 'eat' }, coworker('laugh'), manager('eat')],
      choices: [
        c('go', `Go, and pay about ${p(s, 20)}.`, ok('You learn who has kids, who hates the new system and where to get a decent haircut. It was the most useful hour of the week.', { money: -cost(s, 20), community: 4, career: 1 })),
        c('bring', 'Go, and bring your food from home to share.', ok('Your food is gone first. Next Friday three people ask whether you are bringing it again.', { community: 5, wellbeing: 2 })),
        c('desk', 'Stay at your desk and get ahead on work.', ok('You get ahead on work. On Monday they are laughing at a joke from Friday that you missed.', { career: 1, community: -2 })),
      ],
    }),
  ),

  day(
    'daily-cover',
    (s) => ({
      title: 'Can you cover for me?',
      narration: `A coworker's child is sick. She is supposed to lead a client meeting tomorrow morning and asks whether you can take it, with her notes.`,
      lines: [
        { who: 'friend', text: 'My son has a fever. Could you run the meeting tomorrow?' },
        { who: 'player', text: 'I have never met this client.' },
        { who: 'friend', text: 'My notes are good. I will owe you, a lot.' },
      ],
      stage: officeStage(s),
      cast: [{ ...YOU, pose: 'phone' }, coworker('phone')],
      choices: [
        c('cover', 'Take it, and read her notes twice tonight.', ok('You stumble once on a name and the client does not mind. Your coworker sends you a photo of her son, recovered, holding a thank-you drawing.', { community: 4, career: 3, wellbeing: -1 })),
        c('push', 'Suggest moving the meeting to next week.', ok('The client agrees easily. Your coworker is grateful, if a little disappointed.', { community: 1 })),
        c('no', 'Say you cannot. You have your own work.', ok('She finds someone else. She asks you for less after that.', { community: -2, wellbeing: 1 })),
      ],
    }),
  ),

  day(
    'daily-outage',
    (s) => ({
      title: 'Everything is down',
      narration: `At ten in the morning the system the whole company uses stops working. Phones light up. Your manager looks around the room and her eyes land on you.`,
      lines: [
        { who: 'advisor', text: 'It is down for everyone. Can you help find out why?' },
        { who: 'friend', text: 'It started right after the update this morning.' },
        { who: 'player', text: 'Then let us start with the update.' },
      ],
      stage: officeStage(s),
      cast: [{ ...YOU, pose: 'type' }, manager(), coworker('type')],
      choices: [
        c('dig', 'Work through it calmly with your coworker, step by step.', ok('Two hours later you find it: one setting in the update. Everything comes back. People clap, which is embarrassing and nice.', { career: 5, community: 2, wellbeing: -1 }), {
          roll: { base: 60, mods: [career()] },
          fail: ok('Someone on another team finds it first. You found half of it, and your manager saw you working.', { career: 2, wellbeing: -2 }),
        }),
        c('notes', 'Keep a clear written timeline while others debug.', ok('When it is over, everyone uses your timeline to write the report. Your manager forwards it to her boss.', { career: 4 })),
        c('wait', 'Stay out of the way and let the experts handle it.', ok('They handle it. You get through a pile of other work while you wait.', { career: 1 })),
      ],
    }),
  ),

  day(
    'daily-crunch',
    (s) => ({
      title: 'End of the quarter',
      narration: `The last week of the quarter. Numbers are due, every meeting runs long, and your manager's calendar is a solid wall of color.`,
      lines: [
        { who: 'advisor', text: 'Everything has to be closed by Friday. Everything.' },
        { who: 'friend', text: 'Every quarter. Every single quarter.' },
        { who: 'player', text: 'Tell me which three things matter most.' },
      ],
      stage: officeStage(s),
      cast: [{ ...YOU, pose: 'type' }, manager(), coworker('type')],
      choices: [
        c('focus', 'Ask for the top three and do those first.', ok('Your three are done on Thursday. You help others on Friday and leave on time.', { career: 4, wellbeing: 1 })),
        c('everything', 'Do everything anyone asks.', ok('You do everything. You also eat cereal for dinner three nights running.', { career: 3, wellbeing: -5 })),
        c('pace', 'Keep a steady pace and protect your evenings.', ok('Two small things slip into next week. Nobody notices but you.', { wellbeing: 3, career: -1 })),
      ],
    }),
  ),
];

// ------------------------------------------------------------------ Social Security office

/** True if the H-1B arrival card's "apply this week" choice was taken (it sets no flag of its own). */
const ssnFromArrival = (s: GameState): boolean => s.log.some((e) => /Social Security number/.test(e.choice));

/** The paper that shows a person may be here and work, said plainly for the status. */
const statusPaper = (s: GameState): string => {
  if (is(s, 'LPR')) return 'your green card';
  if (is(s, 'OPT', 'STEM_OPT')) return 'your work permit card';
  if (is(s, 'ASYLEE')) return 'your asylum approval papers';
  return 'your approval notice';
};
const idPaper = (s: GameState): string => (is(s, 'ASYLEE') ? 'your identity papers' : 'your passport');

const ssnCard = (id: string, extra: Partial<ChallengeDef>): ChallengeDef =>
  def(id, 'status', 12, (s) => ({
    id,
    track: 'status',
    title: 'The Social Security office',
    body: `Payroll, the bank and the landlord all ask for a Social Security number, and you do not have one yet. The office opens at nine. At five to nine there is already a line on the pavement.`,
    narration: `You take a number from the machine by the door. The screen says forty people are ahead of you. You hold a folder: ${idPaper(s)}, ${is(s, 'ASYLEE') ? 'your arrival record' : 'the arrival record from the airport'} and ${statusPaper(s)}.`,
    lines: [
      { who: 'teller', text: 'Number eighty-two? Window six.' },
      { who: 'teller', text: `I need ${idPaper(s)}, your arrival record and ${statusPaper(s)}.` },
      { who: 'player', text: 'Here they are. When will the card come?' },
      { who: 'teller', text: 'It comes by mail. Make sure your name is on the mailbox.' },
    ],
    stage: 'uscis',
    cast: [{ ...YOU, pose: 'idle', slot: 0 }, { role: 'teller', pose: 'talk', slot: 1 }, { role: 'stranger', pose: 'sit', slot: 2 }],
    choices: [
      c('ready', 'Go early in the week with every paper, and copies, in one folder.', ok('An hour and a half on a plastic chair, ten minutes at the window. You leave with a receipt. The card comes in the mail and you put it somewhere safe, not in your wallet.', { career: 2, wellbeing: 2, flags: { ssn: true } })),
      c('rush', 'Go on your lunch break with what is in your bag.', ok('You get to the window just before your break ends.', { wellbeing: 1, flags: { ssn: true } }), {
        roll: { base: 50 },
        fail: bad('The arrival record is at home in a drawer. The clerk is kind and firm. You come back on Thursday, number one hundred and four.', { wellbeing: -3, career: -1, flags: { ssn: true } }, 'One folder, packed the night before, saves a second morning.'),
      }),
      c('later', 'Leave it for a few weeks until work settles down.', bad(`Payroll waits for a while, and so does the bank. Your first ${is(s, 'LPR', 'ASYLEE') ? 'job application stalls' : 'paycheck is a mess of forms'} until you finally go.`, { wellbeing: -3, career: -2, flags: { ssn: true } }, 'Every office you met this month asked for the same number.')),
    ],
  }), extra);

const SSN: ChallengeDef[] = [
  // The first months of the first year, for anyone who arrived able to work.
  ssnCard('daily-ssn-office', {
    months: [0, 1, 2],
    statuses: ['H1B', 'O1', 'OPT', 'STEM_OPT', 'LPR', 'ASYLEE'],
    when: (s) => s.year === 0 && !has(s, 'ssn') && !ssnFromArrival(s),
  }),
  // A later year that opens in a new work status: practical training after study, or asylum granted without an earlier job.
  ssnCard('daily-ssn-office-new', {
    months: [0, 1, 2],
    statuses: ['OPT', 'STEM_OPT', 'ASYLEE'],
    when: (s) =>
      s.year >= 1 && !has(s, 'ssn') && !has(s, 'campusJob') && !ssnFromArrival(s) && num(s, 'statusSince') >= (s.year - 1) * 12 &&
      (!is(s, 'ASYLEE') || (num(s, 'salary') === 0 && !has(s, 'informalWork'))),
  }),
];

// ------------------------------------------------------------------ licence office and road test

const licensed = (s: GameState): boolean => has(s, 'license') || has(s, 'yh_licence');
const LIMITED_TERM =
  'For a person with temporary lawful status, a REAL ID licence may not run past the end of the authorized stay, or one year where the stay has no end date. Renewing it means showing that the status is still in effect. (6 CFR 37.21)';

const DMV: ChallengeDef[] = [
  def('daily-dmv-visit', 'life', 8, (s) => ({
    id: 'daily-dmv-visit',
    track: 'life',
    title: 'A morning at the licence office',
    body: `Your online appointment is at eight. You bring a folder: ${idPaper(s)}, your immigration papers, and two letters with your new address on them, a lease and a bank statement.`,
    narration: `Your appointment is at eight and the room is already full. You take a number, then another line for the photo, then a machine where you read letters off a lit screen.${is(s, ...TEMPORARY) ? ' The clerk says a licence will carry an end date tied to your stay.' : ''}`,
    lines: [
      { who: 'teller', text: 'Proof of identity, your immigration papers and two proofs of address.' },
      { who: 'player', text: 'My lease and a bank statement. Is that enough?' },
      { who: 'teller', text: 'That works. Look into the machine and read line four for me.' },
      { who: 'teller', text: 'State ID today, or a learner\'s permit? The permit needs the written test.' },
    ],
    stage: 'uscis',
    cast: [{ ...YOU, pose: 'idle', slot: 0 }, { role: 'teller', pose: 'talk', slot: 1 }, { role: 'stranger', pose: 'sit', slot: 2 }],
    choices: [
      c('id', `Get a state ID card only for now, about ${p(s, 35)}.`, ok('A paper copy today and the plastic card by mail. For the first time you can show ID without carrying your passport around.', { money: -cost(s, 35), wellbeing: 3, flags: { stateId: true } })),
      c('permit', `Take the written test for a learner's permit, about ${p(s, 60)}, and practise.`, ok('Twenty questions on a touch screen about signs, right of way and school buses. You pass and walk out with a learner\'s permit. A coworker offers his car on Sunday mornings.', { money: -cost(s, 60), wellbeing: 2, flags: { learnerPermit: true, stateId: true, yh_licenceSkipY: s.year } }), {
        roll: { base: 70, mods: [well()] },
        fail: ok('The questions about stopping distances catch you out. You study the handbook for a week, come back and pass, permit in hand.', { money: -cost(s, 75), wellbeing: -1, flags: { learnerPermit: true, stateId: true, yh_licenceSkipY: s.year } }),
      }),
      c('road', `Take the written test now and book the earliest road test, with two lessons, about ${p(s, 250)}.`, ok('Three weeks later you sit next to an examiner with a clipboard. Parallel parking, a three-point turn, one nervous stop sign. You pass. The photo is terrible and you love it.', { money: -cost(s, 250), wellbeing: 5, career: 2, flags: { license: true, yh_licence: true, learnerPermit: true, stateId: true } }, is(s, ...TEMPORARY) ? LIMITED_TERM : undefined), {
        roll: { base: 50, mods: [well()] },
        fail: bad('The examiner stops the test at the parking part and hands you a sheet with three boxes ticked. You keep the learner\'s permit and the lessons, and try again later.', { money: -cost(s, 250), wellbeing: -3, flags: { learnerPermit: true, stateId: true, yh_licenceSkipY: s.year } }, 'Driving here is a new set of habits, even for an old driver.'),
      }),
    ],
  }), { months: [1, 2, 3, 4, 5], statuses: DOCUMENTED, when: (s) => s.year === 0 && !licensed(s) && !has(s, 'learnerPermit') && !has(s, 'stateId') }),

  def('daily-road-test', 'life', 8, (s) => ({
    id: 'daily-road-test',
    track: 'life',
    title: 'The road test',
    body: `You have had your learner's permit for a while now. Sunday mornings in an empty car park, a friend in the passenger seat gripping the door. The earliest road test is in two weeks.`,
    narration: `The examiner gets in with a clipboard and does not smile. Mirrors, seat belt, signal. You pull out of the lot slower than you have ever driven anything.`,
    lines: [
      { who: 'officer', text: 'Take the next right, then pull over behind the blue car.' },
      { who: 'player', text: 'Behind the blue car. Parallel?' },
      { who: 'officer', text: 'Parallel. Take your time.' },
    ],
    stage: 'street',
    cast: [{ ...YOU, pose: 'sit' }, { role: 'officer', pose: 'sit' }],
    choices: [
      c('lessons', `Book three lessons first, about ${p(s, 200)}, then the test.`, ok('The instructor fixes the one thing your friend never noticed. You pass, and drive home with nobody beside you for the first time.', { money: -cost(s, 220), wellbeing: 5, career: 2, flags: { license: true, yh_licence: true } }, is(s, ...TEMPORARY) ? LIMITED_TERM : undefined), {
        roll: { base: 80, mods: [well()] },
        fail: bad('A rolling stop at the last corner. The examiner writes something down. You book again for next month.', { money: -cost(s, 220), wellbeing: -3, flags: { yh_licenceSkipY: s.year } }, 'Close. Next time, a full stop.'),
      }),
      c('friend', `Take the test in your friend's car, about ${p(s, 40)}.`, ok('Your friend waits on a bench, smoking nervously. You come back with a grin, and she shouts loud enough for the examiner to hear.', { money: -cost(s, 40), wellbeing: 4, community: 2, flags: { license: true, yh_licence: true } }, is(s, ...TEMPORARY) ? LIMITED_TERM : undefined), {
        roll: { base: 60, mods: [well()] },
        fail: bad('The car\'s brake light is out, and the examiner will not start the test. You fix the bulb and book again.', { money: -cost(s, 60), wellbeing: -3, flags: { yh_licenceSkipY: s.year } }, 'Check the car as well as yourself.'),
      }),
      c('wait', 'Not yet. Keep practising.', ok('More Sunday mornings. You get better at it, and the permit sits in your wallet a while longer.', { wellbeing: 1, flags: { yh_licenceSkipY: s.year } })),
    ],
  }), { statuses: DOCUMENTED, when: (s) => has(s, 'learnerPermit') && !licensed(s) }),
];

// ------------------------------------------------------------------ buying a car

const hasCar = (s: GameState): boolean => has(s, 'carBought') || has(s, 'yh_ownsCar');
const carFlags = (s: GameState, loan = false) => ({ carBought: true, yh_ownsCar: true, yh_carY: s.year, ...(loan ? { yh_carLoan: true } : {}) });

const carCard = (id: string, extra: Partial<ChallengeDef>): ChallengeDef =>
  def(id, 'life', 6, (s) => {
    const credit = has(s, 'yh_credit');
    return {
      id,
      track: 'life',
      title: 'A car of your own',
      body: `You have a licence and the bus takes an hour each way. A neighbour is selling a ten-year-old car. The dealer on the main road has newer ones and a sign that says "Easy Credit".`,
      narration: `The neighbour's car has a few scratches and a full folder of service receipts. At the dealer, a salesman walks you round a shiny one and asks about your credit history before your name.`,
      lines: [
        { who: 'owner', text: 'Ten years old, runs fine. Cash only, and you take it as it is.' },
        { who: 'recruiter', text: credit ? 'Your credit looks fine. We can do a decent rate.' : 'No credit history? We can still do it, with a bigger down payment or a co-signer.' },
        { who: 'player', text: 'And insurance and registration on top of that?' },
        { who: 'recruiter', text: 'Insurance is extra, and it runs higher with no driving record here. Get a few quotes.' },
      ],
      stage: 'street',
      cast: [{ ...YOU, pose: 'think' }, { role: 'owner', pose: 'talk' }, { role: 'recruiter', pose: 'talk' }],
      choices: [
        c('private', `Buy the neighbour's car for cash, about ${p(s, 4500)}, plus about ${p(s, 900)} for registration and the first insurance payment.`, ok('It smells of someone else\'s air freshener and starts every morning. The city gets smaller overnight.', { money: -cost(s, 5400), wellbeing: 5, career: 2, flags: carFlags(s) }), {
          roll: { base: 65 },
          fail: bad('A month later a warning light comes on, and the mechanic shakes his head at the bill.', { money: -cost(s, 6400), wellbeing: 1, career: 2, flags: carFlags(s) }, 'A private sale comes as it is.', 'Paying a mechanic to look over a used car before buying it is a common way to catch problems a seller does not mention.'),
          note: 'Cheapest. No inspection, no warranty.',
        }),
        c('dealer', `Finance a newer one at the dealer: about ${p(s, 2500)} down, plus a monthly payment and insurance.`, credit
          ? ok('Your credit history gets a fair rate. The car is reliable and the payment is steady.', { money: -cost(s, 3600), wellbeing: 6, career: 2, flags: carFlags(s, true) })
          : bad('With no credit history the rate on the contract is very high. You sign anyway, and feel it every month.', { money: -cost(s, 5200), wellbeing: 1, career: 2, flags: carFlags(s, true) }, 'The blank on the credit form had a price.', 'Lenders charge much more to borrowers with no credit history. A bigger down payment, a co-signer or a year of on-time payments on a small card first would have lowered the cost.'), {
          note: credit ? 'Your credit history helps here.' : 'No credit history yet.',
        }),
        c('wait', 'Keep using the bus and your feet for now.', ok('You buy a monthly pass and a good pair of shoes. The money you did not spend stays where it is.', { wellbeing: -1, flags: { yh_carSkipY: s.year } })),
      ],
    };
  }, extra);

const CAR: ChallengeDef[] = [
  // The first year: not before month 4 (December).
  carCard('daily-buy-car', {
    months: [4, 5, 6, 7, 8, 9, 10, 11],
    statuses: DOCUMENTED,
    when: (s) => s.year === 0 && licensed(s) && !hasCar(s) && s.stats.money > cost(s, 6500),
  }),
  // The second year. From the third year on, years-home.ts 'yh-first-car' takes over.
  carCard('daily-buy-car-later', {
    statuses: DOCUMENTED,
    when: (s) => band(s, 1, 1) && licensed(s) && !hasCar(s) && s.stats.money > cost(s, 6500),
  }),
];

export const CARDS: ChallengeDef[] = [...WORK_DAYS, ...SSN, ...DMV, ...CAR];
