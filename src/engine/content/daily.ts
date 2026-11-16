/**
 * Everyday life once you are here (ids `daily-`): ordinary work days and the first errands of a new life.
 *
 * - Work days: one card per duty. Each card has two settings and picks one from the player's job:
 *   an office or lab for professional work, and a work floor (kitchen, warehouse, hotel, store, site) for
 *   hands-on work, including work without authorization. Office days are never shown to anyone who
 *   cannot work lawfully, and nobody on F-1 or B-2 sees any of these.
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
import type { CastSpec, ChallengeDef, Choice, GameState, Line, Outcome, StageId, StatusCode } from '../types';
import { YOU, band, cost, has, is, mayWork, noStatus, num, settled } from './yx';

// ------------------------------------------------------------------ helpers

const p = (s: GameState, n: number): string => money(cost(s, n));
const career = (label = 'career standing') => mod('career', 50, 0.3, label);
const ties = (label = 'people who know you') => mod('community', 40, 0.25, label);
const title = (s: GameState): string => String(s.flags.jobTitle || '');

/** Job titles in the game that mean work with your hands on a floor, not at a desk. */
const HANDS_ON = /housekeep|warehouse|retail|cashier|kitchen|cook|clean|crew|driver|construction|labor/i;

/** Paid, lawful work right now (including a work permit held by someone with a pending case). Never without status. */
const lawfulJob = (s: GameState): boolean => settled(s) && !noStatus(s) && mayWork(s) && num(s, 'salary') > 0;
/** Cash work with no lawful paid job behind it (flags.informalWork); F-1 and B-2 never count. */
const cashWork = (s: GameState): boolean => settled(s) && has(s, 'informalWork') && !lawfulJob(s);
/** A hands-on work floor: cash work, or a lawful job with a hands-on title. */
const siteJob = (s: GameState): boolean => cashWork(s) || (lawfulJob(s) && HANDS_ON.test(title(s)));
/** A professional job in an office or a lab. */
const officeJob = (s: GameState): boolean => lawfulJob(s) && !HANDS_ON.test(title(s));
const cashPaid = (s: GameState): boolean => cashWork(s);

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
/** Where a hands-on shift happens, as words. */
const place = (s: GameState): string => {
  const t = title(s);
  if (/housekeep/i.test(t)) return 'the hotel';
  if (/warehouse/i.test(t)) return 'the warehouse';
  if (/retail|cashier/i.test(t)) return 'the store';
  return 'work';
};
const payWord = (s: GameState): string => (cashPaid(s) ? 'the envelope' : 'your paycheck');

interface Scene {
  title: string;
  narration: string;
  lines: Line[];
  stage: StageId;
  cast: CastSpec[];
  choices: Choice[];
}

/** Ids of the work-day cards, for the engine (for example a shorter gap before they come back). */
export const DAILY_WORK_IDS: string[] = [];

/**
 * One work duty with an office or lab version and a hands-on version. Each duty fits four months a
 * quarter apart (the nth duty fits months n, n+3, n+6, n+9), so a year spreads them about one a month
 * instead of drawing several in the same month.
 */
const day = (
  id: string,
  office: (s: GameState) => Scene,
  site: (s: GameState) => Scene,
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
      const sc = siteJob(s) ? site(s) : office(s);
      const choices = sc.choices.map((ch) => ({ ...ch, success: mark(s, ch.success), ...(ch.fail ? { fail: mark(s, ch.fail) } : {}) }));
      return { id, track: 'work', title: sc.title, body: sc.narration, narration: sc.narration, lines: sc.lines, stage: sc.stage, cast: sc.cast, choices };
    },
    {
      statuses: WORKERS,
      months: [0, 3, 6, 9].map((k) => (n + k) % 12),
      when: (s) => (officeJob(s) || siteJob(s)) && num(s, stamp, -1) !== s.year && extraWhen(s),
    },
  );
};

const boss = (pose: CastSpec['pose'] = 'talk'): CastSpec => ({ role: 'owner', pose });
const manager = (pose: CastSpec['pose'] = 'talk'): CastSpec => ({ role: 'advisor', pose });
const coworker = (pose: CastSpec['pose'] = 'idle'): CastSpec => ({ role: 'friend', pose });

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
    (s) => ({
      title: 'Your first shift alone',
      narration: `For two weeks someone stood next to you. Today the boss points at a station ${place(s) === 'work' ? 'on the floor' : `at ${place(s)}`} and says it is yours until close.`,
      lines: [
        { who: 'owner', text: 'You watched long enough. This station is yours today.' },
        { who: 'player', text: 'All of it? Until close?' },
        { who: 'friend', text: 'Shout if it gets busy. I am two steps away.' },
      ],
      stage: 'worksite',
      cast: [{ ...YOU, pose: 'carry' }, boss(), coworker()],
      choices: [
        c('steady', 'Go slow and get every order right.', ok('You are slower than the others and nothing comes back. By evening the boss nods at you once.', { career: 2, wellbeing: 2 })),
        c('fast', 'Go as fast as the others from the first hour.', ok('You keep up, mostly. Your hands shake a little at the end.', { career: 3, wellbeing: -2 }), {
          roll: { base: 55, mods: [well()] },
          fail: bad('You drop a full tray in the rush. Nobody yells, which is somehow worse.', { wellbeing: -4 }, 'Speed comes after the hands know the work.'),
        }),
        c('help', 'Call your coworker over the moment you are unsure.', ok('She shows you a trick for the heavy part. You owe her a coffee and you mean to pay it.', { community: 3, career: 1 })),
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
    (s) => ({
      title: 'The big order',
      narration: `An order for two hundred comes in for six in the morning. At ${place(s)} that means everyone stays late tonight, or someone comes in very early.`,
      lines: [
        { who: 'owner', text: 'Two hundred, ready by six. Who stays tonight?' },
        { who: 'friend', text: 'I have my kids tonight. I can come at four.' },
        { who: 'player', text: 'I can stay. How late?' },
      ],
      stage: 'worksite',
      cast: [{ ...YOU, pose: 'carry' }, boss(), coworker('think')],
      choices: [
        c('stay', 'Stay late and get it done.', ok(`You leave at midnight with sore feet. ${cashPaid(s) ? 'There is a little extra in the envelope that week.' : 'The extra hours show on your next pay stub.'}`, { money: cost(s, 120), wellbeing: -3 })),
        c('early', 'Come in at four with your coworker instead.', ok('The two of you have the whole place to yourselves and the radio on. It is the best morning of the month.', { money: cost(s, 100), community: 3, wellbeing: -1 })),
        c('no', 'Say you cannot do either this time.', ok('The boss shrugs and calls someone else. Next time he asks the others first.', { wellbeing: 2, career: -2 })),
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
    () => ({
      title: 'Show the new way',
      narration: `The boss wants the shelves and stations laid out a new way, your way, because yours is faster. Before the shift he wants you to show the whole crew.`,
      lines: [
        { who: 'owner', text: 'Your way is faster. Show them before we open.' },
        { who: 'player', text: 'Me? Some of them have been here ten years.' },
        { who: 'friend', text: 'Then show us something good. We are listening.' },
      ],
      stage: 'worksite',
      cast: [{ ...YOU, pose: 'present' }, boss('idle'), coworker()],
      choices: [
        c('show', 'Do it once slowly, with your hands, and let them try.', ok('An older worker nods and changes one small thing, and it is better. By noon it is the crew\'s way, not yours.', { community: 4, career: 3 })),
        c('tell', 'Explain it quickly and get back to work.', ok('Half of them do it your way. The other half do it the old way, a little louder.', { career: 1, community: -1 })),
        c('credit', 'Say it was the boss\'s idea, to keep the peace.', ok('The boss looks pleased and says nothing. The crew knows anyway.', { community: 2, career: -1 })),
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
    (s) => ({
      title: 'The wrong pallet',
      narration: `A delivery comes back. The labels were right, and the boxes inside were somebody else's order. You packed it.`,
      lines: [
        { who: 'owner', text: 'This came back. Who packed it?' },
        { who: 'player', text: 'I did. I am sorry. I can redo it now.' },
        { who: 'friend', text: 'Those two codes look the same. It happens to all of us.' },
      ],
      stage: 'worksite',
      cast: [{ ...YOU, pose: 'carry' }, boss(), coworker()],
      choices: [
        c('redo', 'Say it was you and redo it on your break.', ok('You miss your lunch and the order goes out right. The boss stops frowning at you by the afternoon.', { career: 2, wellbeing: -2 })),
        c('fix', 'Redo it, and suggest marking the two look-alike codes in red.', ok('He grumbles about the cost of a red marker, then buys three. Nobody mixes them up again.', { career: 4, community: 2 })),
        c('pay', `Offer to pay for the mistake out of ${payWord(s)}.`, bad(`He takes the offer. ${cashPaid(s) ? 'The envelope is lighter that week.' : 'It comes out of your pay.'} He never offers anyone else the same deal.`, { money: -cost(s, 150), wellbeing: -3 }, 'Mistakes at work are part of the cost of running a business.')),
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
    (s) => ({
      title: 'The new one is yours',
      narration: `A new worker starts today, barely older than your cousin and very nervous. The boss puts him next to you and walks off.`,
      lines: [
        { who: 'owner', text: 'Show him everything. He starts on your station.' },
        { who: 'stranger', text: 'I have never done this before. Is it hard?' },
        { who: 'player', text: 'The first week is hard. Then your hands learn it.' },
      ],
      stage: 'worksite',
      cast: [{ ...YOU, pose: 'talk' }, boss('idle'), { role: 'stranger', pose: 'idle' }],
      choices: [
        c('teach', 'Teach him the safe way to lift and the fast way to work, in that order.', ok('He is slow all week and does not get hurt. On Friday he brings you a pastry from his mother.', { community: 5, wellbeing: 1 })),
        c('pay', 'Ask the boss for a little extra for training him.', ok('He says no, then adds a little anyway at the end of the month.', { money: cost(s, 60), career: 1 }), {
          roll: { base: 50, mods: [ties()] },
          fail: ok('He says no, and the new one still needs teaching. You teach him.', { community: 2 }),
        }),
        c('own', 'Keep your head down and let him watch.', ok('He watches and copies everything, including your one bad habit.', { wellbeing: 1, community: -1 })),
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
    (s) => ({
      title: 'The customer at the counter',
      narration: `A customer at ${place(s) === 'work' ? 'the counter' : place(s)} wants to speak to someone in charge, and the someone in charge is out. He is getting louder, and he is looking at you.`,
      lines: [
        { who: 'stranger', text: 'This is the second time. I want to talk to someone in charge.' },
        { who: 'player', text: 'He is out for an hour. Tell me what happened and I will try.' },
        { who: 'friend', text: 'Careful. He did this last week too.' },
      ],
      stage: 'worksite',
      cast: [{ ...YOU, pose: 'idle' }, { role: 'stranger', pose: 'talk' }, coworker()],
      choices: [
        c('listen', 'Let him finish, then fix the part you can fix.', ok('It was a small thing in the end. He leaves without a thank you, which counts as a win here.', { career: 2, wellbeing: 1 })),
        c('call', 'Call the boss and hand him the phone.', ok('The boss sorts it in two minutes and tells you later to just give people a discount next time.', { wellbeing: 1 })),
        c('back', 'Tell him you will not be shouted at.', ok('He goes quiet, surprised. Your coworker gives you a thumbs up from behind the shelves.', { wellbeing: 3, community: 1 }), {
          roll: { base: 55, mods: [ties()] },
          fail: bad('He complains to the boss, who sides with the customer and frowns at you for a week.', { wellbeing: -3, career: -1 }, 'You were right, and it still cost you.'),
        }),
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
    (s) => ({
      title: 'A double shift',
      narration: `Someone did not show up. The boss asks whether you can stay and do the next shift too, right now, straight through.`,
      lines: [
        { who: 'owner', text: 'He did not come in. Can you do the next shift too?' },
        { who: 'player', text: 'I have been here since six.' },
        { who: 'friend', text: 'I can do half if you do half.' },
      ],
      stage: 'worksite',
      cast: [{ ...YOU, pose: 'idle' }, boss(), coworker('think')],
      choices: [
        c('double', 'Do the whole double.', ok(`Sixteen hours. ${cashPaid(s) ? 'The extra is in the envelope.' : 'The extra hours show on your pay stub.'} Your back reminds you for two days.`, { money: cost(s, 180), wellbeing: -6 })),
        c('half', 'Split it with your coworker.', ok('Four extra hours each. You walk to the bus together, too tired to talk, which is its own kind of friendship.', { money: cost(s, 90), community: 3, wellbeing: -2 })),
        c('no', 'Go home. You are done for today.', ok('The boss is short with you the next morning, then forgets about it.', { wellbeing: 3, career: -1 })),
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
    (s) => ({
      title: 'The wet floor',
      narration: `There is a leak near the back and the floor by the heavy shelves is wet again. You are asked to carry a stack across it, quickly.`,
      lines: [
        { who: 'owner', text: 'Move those across before the truck comes. Quickly.' },
        { who: 'player', text: 'The floor is wet back there again.' },
        { who: 'friend', text: 'Someone slipped there last week. Take the long way.' },
      ],
      stage: 'worksite',
      cast: [{ ...YOU, pose: 'carry' }, boss(), coworker()],
      choices: [
        c('mop', 'Mop and put out a sign first, then carry.', ok('It takes five extra minutes. The boss taps his watch, and nobody falls.', { wellbeing: 2, community: 1 })),
        c('long', 'Take the long way round with smaller loads.', ok('More trips and a sore back, but you stay on your feet.', { wellbeing: -1 })),
        c('quick', 'Do it the quick way. The truck is coming.', ok('You make it across, twice, heart pounding.', { career: 1 }), {
          roll: { base: 70 },
          fail: bad(`Your foot goes out from under you. Nothing is broken, but you lose three days of work and ${cashPaid(s) ? 'three days of pay' : 'some pay'}.`, { money: -cost(s, 300), wellbeing: -8 }, 'Nobody should have asked you to hurry there.'),
        }),
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
    (s) => ({
      title: 'Who did the work',
      narration: `The boss praises the clean storeroom in front of everyone and thanks your coworker. You did it on Sunday, alone, unpaid.`,
      lines: [
        { who: 'owner', text: 'Look at that storeroom. Good job, really good.' },
        { who: 'friend', text: 'Thanks, boss.' },
        { who: 'player', text: 'I spent my Sunday on that.' },
      ],
      stage: 'worksite',
      cast: [{ ...YOU, pose: 'idle' }, boss(), coworker('talk')],
      choices: [
        c('say', 'Say plainly, in front of everyone, that you did it on Sunday.', ok('There is a short silence. Then the boss says thank you to you, and means it.', { career: 2, wellbeing: 2, community: -1 })),
        c('later', 'Tell the boss alone at the end of the shift.', ok('He listens, nods, and gives you the better hours next week.', { career: 2, money: cost(s, 50) })),
        c('drop', 'Say nothing. It is not worth the trouble.', bad('Your coworker never mentions it. The next Sunday job is yours again.', { wellbeing: -3 }, 'It was worth saying.')),
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
    (s) => ({
      title: 'Asking for more',
      narration: `You have been ${cashPaid(s) ? 'paid the same in the envelope' : 'on the same hourly rate'} since you started. You do more than you did then. The boss is in a good mood today.`,
      lines: [
        { who: 'player', text: 'Can we talk about my pay? I do more now.' },
        { who: 'owner', text: 'Everyone wants more. Business is not easy.' },
        { who: 'friend', text: 'Ask on a good day. Today is a good day.' },
      ],
      stage: 'worksite',
      cast: [{ ...YOU, pose: 'talk' }, boss('idle'), coworker()],
      choices: [
        c('ask', 'Ask, and name the things you do now that you did not do before.', ok('He complains for ten minutes, then adds a little.', { money: cost(s, 200), wellbeing: 3 }), {
          roll: { base: 50, mods: [ties()] },
          fail: bad('"Next year," he says. You heard that last year.', { wellbeing: -3 }, 'Asking was hard enough. You did it.'),
        }),
        c('hours', 'Ask for more hours instead of more per hour.', ok('He gives you two more shifts a month. More money, less time.', { money: cost(s, 150), wellbeing: -2 })),
        c('wait', 'Wait for a better moment.', ok('There is always a reason it is not the moment.', { wellbeing: -1 })),
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
    (s) => ({
      title: 'The staff meal',
      narration: `Before the doors open, the crew eats together at the back. Someone cooked from home, someone else brought bread. There is an empty crate next to the oldest worker.`,
      lines: [
        { who: 'friend', text: 'Sit, sit. Nobody eats standing up here.' },
        { who: 'player', text: 'I was going to call home on my break.' },
        { who: 'owner', text: 'Ten minutes. Then we open.' },
      ],
      stage: 'worksite',
      cast: [{ ...YOU, pose: 'eat' }, coworker('laugh'), boss('idle')],
      choices: [
        c('sit', 'Sit and eat with them.', ok('The oldest worker tells a story about his first year here. You laugh in the right places, and some of it is your story too.', { community: 5, wellbeing: 2 })),
        c('cook', 'Offer to cook something from home next week.', ok('The next week your dish is gone in four minutes. Now they call you by a nickname.', { community: 5, money: -cost(s, 25) })),
        c('call', 'Call home on your break instead.', ok('Your mother sounds happy to hear you. The crew saves you a plate anyway.', { family: 3, community: 1 })),
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
    (s) => ({
      title: 'Covering a shift',
      narration: `A coworker texts at seven in the morning. Her mother is in hospital. Can you take her shift today, your one day off this week?`,
      lines: [
        { who: 'friend', text: 'I am so sorry. Can you take my shift today?' },
        { who: 'player', text: 'Today is my day off. Is your mother all right?' },
        { who: 'friend', text: 'I do not know yet. I will cover you next week, I promise.' },
      ],
      stage: 'worksite',
      cast: [{ ...YOU, pose: 'phone' }, coworker('phone')],
      choices: [
        c('cover', 'Take the shift.', ok(`You lose your day off and gain a friend for life. ${cashPaid(s) ? 'The pay is the same as any day.' : 'The hours are on your pay stub.'}`, { money: cost(s, 100), community: 5, wellbeing: -3 })),
        c('swap', 'Take it if she takes your Saturday next week.', ok('She agrees immediately. Fair for both of you, and she keeps her word.', { money: cost(s, 100), community: 3 })),
        c('rest', 'Say no. You need the day.', ok('You sleep, cook and call home. She finds someone else, and she understands.', { wellbeing: 4, community: -1 })),
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
    () => ({
      title: 'The cold room stops',
      narration: `Mid-shift the big cooler at the back goes quiet. It is getting warmer inside by the minute, and everything in it is today's work and tomorrow's.`,
      lines: [
        { who: 'friend', text: 'The cooler is off. It is getting warm in there.' },
        { who: 'player', text: 'Call the boss. We need to move everything now.' },
        { who: 'owner', text: 'I am twenty minutes away. Save what you can.' },
      ],
      stage: 'worksite',
      cast: [{ ...YOU, pose: 'carry' }, coworker('carry'), boss('phone')],
      choices: [
        c('move', 'Organise the crew to move everything to the small fridges and ice.', ok('Twenty minutes of running. Almost nothing is lost. When the boss arrives he just stands there, then shakes your hand.', { career: 4, community: 3, wellbeing: -1 })),
        c('fix', 'Try to restart the cooler yourself.', ok('You find the switch that tripped. The hum comes back. You feel like a hero for an hour.', { career: 3 }), {
          roll: { base: 45 },
          fail: bad('Nothing works, and you lost ten minutes trying. Some stock goes in the bin.', { career: -1, wellbeing: -2 }, 'Saving the food came first.'),
        }),
        c('wait', 'Wait for the boss. It is his cooler.', bad('By the time he arrives a lot of it has to be thrown out. He does not say much, which says enough.', { career: -2 }, 'You could have done more.')),
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
    (s) => ({
      title: 'The busy season',
      narration: `It is the busiest week of the year at ${place(s)}. The boss wants a full count of every box and shelf before Sunday, on top of the rush.`,
      lines: [
        { who: 'owner', text: 'Inventory by Sunday. Every box, every shelf.' },
        { who: 'friend', text: 'And the rush on top. Every year the same.' },
        { who: 'player', text: 'If we count at night it goes faster.' },
      ],
      stage: 'worksite',
      cast: [{ ...YOU, pose: 'carry' }, boss(), coworker('carry')],
      choices: [
        c('night', 'Count at night when it is quiet, for the extra hours.', ok(`Three late nights, all counted. ${cashPaid(s) ? 'A little extra in the envelope.' : 'Extra hours on the pay stub.'}`, { money: cost(s, 150), wellbeing: -4 })),
        c('system', 'Suggest counting by section in pairs during slow hours.', ok('It works. The count is done by Saturday afternoon and the boss pretends it was his idea.', { career: 3, community: 2 })),
        c('only', 'Do your normal shifts and nothing more.', ok('Others stay late. The boss remembers who did.', { wellbeing: 2, career: -2 })),
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
