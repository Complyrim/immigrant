/**
 * A working life over two decades (ids `yw-`, flags `yw_`), all on the 'work' track.
 *
 * Half one: people who may lawfully work. Sponsored workers (H-1B, O-1, STEM OPT) are tied to an
 * employer; green card holders, citizens, asylees and work-permit holders are not, and the text
 * branches on that. Nothing here ends a job or changes status: layoffs belong to work.ts.
 *
 * Half two: people working without authorization (no status, or a pending case and no work
 * permit). Told through consequences only: what the work costs, and which protections exist.
 *
 * Sources for every rule cited are listed in research/years-work-notes.md.
 */
import { bad, c, def, mod, ok, well } from '../cx';
import type { ChallengeDef, Flags, GameState } from '../types';
import { YOU, band, cost, has, hasChild, hasSpouse, is, mayWork, noStatus, num, secure, settled, sponsored, waiting, yearsHere } from './yx';

const career = (label = 'career standing') => mod('career', 50, 0.3, label);
const ties = (label = 'people who know you') => mod('community', 40, 0.25, label);

/** Has a lawful, paid job right now. */
const job = (s: GameState): boolean => settled(s) && mayWork(s) && num(s, 'salary') > 0;
/** Free to work for anyone: not tied to a sponsoring employer and not on a student work permit. */
const free = (s: GameState): boolean => job(s) && !sponsored(s) && !is(s, 'OPT');
/** Working without authorization: no status, or a pending case and no work permit. */
const shadow = (s: GameState): boolean =>
  settled(s) && (noStatus(s) || (waiting(s) && !has(s, 'ead'))) && has(s, 'informalWork');

/** Remember the year a card was last answered, so it can return some years later and read differently. */
const mark = (s: GameState, k: string): Flags => ({ [`yw_${k}Y`]: s.year + 1 });
const seen = (s: GameState, k: string): boolean => num(s, `yw_${k}Y`) > 0;
const gap = (s: GameState, k: string, years: number): boolean => !seen(s, k) || s.year + 1 - num(s, `yw_${k}Y`) >= years;
const raise = (s: GameState, n: number): Flags => ({ salary: num(s, 'salary') + n });

const L_ORIGIN =
  'Federal rules define national origin discrimination to include treating someone worse because of the linguistic characteristics of a national origin group, which covers an accent (29 CFR 1606.1). A charge must be filed within 180 days of the act, or 300 days where a state or local agency enforces a similar law (42 U.S.C. 2000e-5(e)(1)).';
const L_GRACE =
  'If a sponsored job ends, a worker in H-1B or O-1 status has up to 60 consecutive days, or until the authorized stay ends if that is sooner, to find a new petition, change status or leave. No work is allowed in that time (8 CFR 214.1(l)(2)).';
const L_WAGES =
  'The Wage and Hour Division enforces the federal wage law "without regard to whether an employee is documented or undocumented", for hours actually worked (US Department of Labor, Fact Sheet 48). A claim must generally start within two years, or three for a willful violation (29 U.S.C. 255(a)).';

export const CARDS: ChallengeDef[] = [
  // ====================================================================== HALF ONE: lawful work

  def('yw-review', 'work', 2, (s) => {
    const y = yearsHere(s);
    const again = seen(s, 'review');
    return {
      id: 'yw-review', track: 'work',
      title: again ? 'The yearly review, again' : 'The yearly review',
      body: `${again ? `You have sat through enough of these to know the form. After ${y} years the surprise is how little is said about the work itself.` : 'Your manager books an hour to talk about your year. There is a form with boxes, and a space for you to describe your own work.'}${sponsored(s) ? ' You both know your status rests on this job, and neither of you says it.' : ''}`,
      stage: 'workplace', cast: [{ ...YOU, pose: 'sit' }, { role: 'advisor', pose: 'talk' }],
      choices: [
        c('list', 'Bring a written list of what you delivered, with numbers.', ok('Your manager copies two of your lines straight into the form. It feels like boasting, and it works.', { career: 5, wellbeing: 1, flags: mark(s, 'review') })),
        c('ask', 'Ask what the next level needs, and ask for it in writing.', ok('The answer is vaguer than you hoped, but now it is on paper. You can point to it next year.', { career: 3, legal: 1, flags: mark(s, 'review') })),
        c('quiet', 'Say little. Good work should speak for itself.', bad('The review says you meet expectations. A louder colleague gets the higher rating.', { career: -2, wellbeing: -3, flags: mark(s, 'review') }, 'The room heard the people who spoke.', 'In many workplaces here a review rewards people who describe their own results. Staying modest is read as having less to say.')),
      ],
    };
  }, { when: (s) => job(s) && band(s, 1) && gap(s, 'review', 3) }),

  def('yw-raise', 'work', 2, (s) => {
    const tied = sponsored(s);
    return {
      id: 'yw-raise', track: 'work',
      title: 'Asking for more',
      body: `Prices have climbed since your pay last moved. ${yearsHere(s) >= 8 ? 'You have trained half the people around you, and you suspect some of them earn more.' : 'You have looked up what others in your role are paid, and the gap is real.'}${tied ? ' Asking feels riskier when the same employer holds your paperwork.' : ''}`,
      stage: 'workplace', cast: [{ ...YOU, pose: 'talk' }, { role: 'advisor', pose: 'sit' }],
      choices: [
        c('ask', 'Ask for a raise, with the market numbers in your hand.', ok('Your manager takes it upstairs. A month later your pay goes up.', { career: 3, wellbeing: 4, flags: { ...raise(s, 300), ...mark(s, 'raise') } }), {
          roll: { base: 55, mods: [career()] },
          fail: bad('"Not this cycle," your manager says, and promises to look again in six months.', { wellbeing: -3, flags: mark(s, 'raise') }, 'You asked. That is on the record now.'),
        }),
        c('other', 'Ask for a training budget and a better title instead of money.', ok('That is easier to approve. You get a course and a title that will matter on the next application you write.', { career: 4, study: 2, flags: mark(s, 'raise') })),
        c('wait', tied ? 'Wait. You do not want to be the difficult one while they hold your papers.' : 'Wait for them to notice.', bad('Another year passes at the same number. Rent does not wait with you.', { wellbeing: -4, flags: mark(s, 'raise') }, 'Nobody offered what you did not ask for.')),
      ],
    };
  }, { when: (s) => job(s) && band(s, 2) && gap(s, 'raise', 3) }),

  def('yw-pay-gap', 'work', 1.5, (s) => {
    const tied = sponsored(s);
    return {
      id: 'yw-pay-gap', track: 'work',
      title: 'A number left on a screen',
      body: 'A shared spreadsheet stays open a moment too long. Someone hired two years after you, doing the same job, is paid noticeably more. You were hired when you were new here and glad of any offer.',
      stage: 'workplace', cast: [{ ...YOU, pose: 'think' }, { role: 'friend', pose: 'type' }],
      choices: [
        c('raise-it', 'Tell your manager calmly what you know, and ask for the gap to be closed.', ok('It takes two awkward meetings. Then an adjustment appears on your pay slip, with no announcement.', { career: 2, wellbeing: 4, flags: { ...raise(s, 350), ...mark(s, 'gap') } }), {
          roll: { base: 50, mods: [career()] },
          fail: bad('Your manager says pay is confidential and the budget is fixed. Nothing changes this year.', { wellbeing: -4, flags: mark(s, 'gap') }, 'Now you know what the first offer cost you.'),
        }),
        tied
          ? c('lawyer', 'Before you look elsewhere, ask what a move would mean for your papers.', ok('You spend an evening with the questions written out. Knowing the steps makes the anger more useful.', { legal: 3, wellbeing: 1, flags: mark(s, 'gap') }, is(s, 'H1B') ? 'A new employer must file its own petition before an H-1B worker can move to it (8 CFR 214.2(h)(2)(i)(D), (H)).' : undefined))
          : c('look', 'Say nothing, and quietly start answering recruiters.', ok('Two conversations in, you learn what you are worth. You carry yourself differently at work.', { career: 3, wellbeing: 1, flags: mark(s, 'gap') })),
        c('swallow', 'Let it go. You are grateful to have the job.', bad('You keep working beside the number. It does not get smaller.', { wellbeing: -5, flags: mark(s, 'gap') }, 'Gratitude and fair pay are separate things.')),
      ],
    };
  }, { when: (s) => job(s) && band(s, 3) && gap(s, 'gap', 6) }),

  def('yw-new-manager', 'work', 1.5, (s) => {
    const tied = sponsored(s);
    return {
      id: 'yw-new-manager', track: 'work',
      title: 'A new manager',
      body: `The person who hired you is leaving. Their replacement arrives from outside, knows nothing of what you have done, and has ${yearsHere(s) >= 10 ? 'half your years in the trade' : 'their own ideas about the team'}.${tied ? ' The company is your sponsor, not the manager who left, but that manager was the one who chased your paperwork.' : ''}`,
      stage: 'workplace', cast: [{ ...YOU, pose: 'idle' }, { role: 'advisor', pose: 'wave' }],
      choices: [
        c('meet', 'Book time in the first week and walk them through your work.', ok('Half an hour, three examples. By the end they are asking your opinion on the others.', { career: 4, flags: mark(s, 'boss') })),
        tied
          ? c('hr', 'Ask HR, in writing, who now looks after your immigration filings.', ok('HR names a person and a date for your next filing. One fear has a name and a calendar entry.', { legal: 4, flags: mark(s, 'boss') }))
          : c('ref', 'Ask the manager who is leaving for a written reference before they go.', ok('They write a generous page. You save it in three places.', { career: 3, community: 1, flags: mark(s, 'boss') })),
        c('wait', 'Keep your head down and let the work introduce you.', bad('The new manager builds a picture of the team from whoever talks most. You are a name on a list.', { career: -3, wellbeing: -2, flags: mark(s, 'boss') }, 'A new manager starts everyone from zero.')),
      ],
    };
  }, { when: (s) => job(s) && band(s, 2) && gap(s, 'boss', 5), oddsPerYear: 0.6 }),

  def('yw-passed-over', 'work', 1.5, (s) => ({
    id: 'yw-passed-over', track: 'work',
    title: 'The job goes to someone else',
    body: `The senior role you were told to wait for is announced in a team meeting. It has gone to a colleague with ${yearsHere(s) >= 10 ? 'a third of your experience' : 'less experience than you'}. Everyone claps, and you clap too.`,
    stage: 'conference', cast: [{ ...YOU, pose: 'sit' }, { role: 'advisor', pose: 'present' }, { role: 'friend', pose: 'cheer' }],
    choices: [
      c('why', 'Ask for the reasons, and for what was missing, in writing.', ok('The reasons are thin: "presence", "polish". But you have them on paper, and a named goal for next time.', { career: 3, wellbeing: -1, flags: mark(s, 'passed') })),
      c('notes', 'Keep dated notes, and raise it with HR if you believe it is about where you are from.', ok('HR listens more carefully than you expected. Whatever happens next, there is a record that you spoke.', { legal: 3, wellbeing: -2, flags: mark(s, 'passed') }, L_ORIGIN)),
      c('harder', 'Say nothing and work harder.', bad('You take on more. The next opening comes, and the pattern holds.', { wellbeing: -6, career: 1, flags: mark(s, 'passed') }, 'More work was not what was being measured.')),
    ],
  }), { when: (s) => job(s) && band(s, 4) && gap(s, 'passed', 7), oddsPerYear: 0.5 }),

  def('yw-first-reports', 'work', 2, (s) => {
    const pet = is(s, 'H1B', 'O1');
    return {
      id: 'yw-first-reports', track: 'work',
      title: 'People who report to you',
      body: `Your manager offers you a team of four. The pay is better and the work is different: less of what you are good at, more of other people's problems.${pet ? ' Your petition describes the job you do now.' : ''}`,
      stage: 'workplace', cast: [{ ...YOU, pose: 'think' }, { role: 'advisor', pose: 'talk' }],
      choices: [
        pet
          ? c('check', 'Accept, and ask HR to check with the immigration lawyer before your duties change.', ok('The lawyer takes a week and files what is needed. You start with the team a little late and with nothing hanging over you.', { career: 6, legal: 3, wellbeing: 2, flags: { ...raise(s, 600), yw_manager: true, yw_leadOffer: true } }, is(s, 'H1B') ? 'An employer must file an amended or new petition to reflect any material change in the terms and conditions of H-1B employment (8 CFR 214.2(h)(2)(i)(E)). Whether a promotion is material is a question for the company lawyer.' : 'An O-1 employer must file an amended petition to reflect any material change in the terms and conditions of employment (8 CFR 214.2(o)(2)(iv)(D)). Whether a promotion is material is a question for the company lawyer.'))
          : c('accept', 'Accept. You have watched enough managers to know what not to do.', ok('The first month you talk too much. By the third you have learned to ask and wait.', { career: 6, wellbeing: 1, flags: { ...raise(s, 600), yw_manager: true, yw_leadOffer: true } })),
        c('terms', 'Accept on a trial basis, with a way back to your old role.', ok('Six months, then a review. It is a smaller raise and a softer landing.', { career: 4, wellbeing: 3, flags: { ...raise(s, 350), yw_manager: true, yw_leadOffer: true } })),
        c('decline', 'Decline. You came here to do the work, not to manage it.', ok('Your manager is surprised, then respectful. You keep the part of the day you love.', { wellbeing: 4, career: -1, flags: { yw_leadOffer: true } })),
      ],
    };
  }, { when: (s) => job(s) && band(s, 5) && !has(s, 'yw_leadOffer') && s.stats.career >= 45 }),

  def('yw-accent', 'work', 1.3, (s) => ({
    id: 'yw-accent', track: 'work',
    title: 'Someone repeats your words',
    body: `In a meeting you make a point, and a colleague says it back in an imitation of your accent. A few people laugh. ${seen(s, 'accent') ? 'It is not the first time, and you are more tired than hurt.' : `You have spoken this language at work for ${Math.max(1, yearsHere(s))} years.`}`,
    stage: 'conference', cast: [{ ...YOU, pose: 'present' }, { role: 'friend', pose: 'laugh' }, { role: 'advisor', pose: 'sit' }],
    choices: [
      c('room', 'Say it in the room: "I will repeat my point. Please do not imitate me."', ok('A silence, then the meeting moves on to your point. Two colleagues message you afterwards to say thank you.', { wellbeing: 5, career: 1, community: 1, flags: mark(s, 'accent') })),
      c('private', 'Take the colleague aside afterwards and say how it landed.', ok('They are embarrassed and say they meant nothing by it. It does not happen again, at least not near you.', { community: 2, wellbeing: 2, flags: mark(s, 'accent') })),
      c('record', 'Write down the date, the words and who was there, and take it to HR.', ok('HR opens a file. It is slow and formal, and it is on the record.', { legal: 3, wellbeing: -1, flags: mark(s, 'accent') }, L_ORIGIN)),
      c('laugh', 'Laugh along.', bad('You laugh. For the rest of the week you rehearse sentences before you say them.', { wellbeing: -6, flags: mark(s, 'accent') }, 'It cost more than it showed.')),
    ],
  }), { when: (s) => job(s) && band(s, 1) && gap(s, 'accent', 7), oddsPerYear: 0.5 }),

  def('yw-mentor', 'work', 1.5, (s) => ({
    id: 'yw-mentor', track: 'work',
    title: 'The new one asks for help',
    body: `A junior colleague, six weeks into the job, hovers by your desk with a question they are afraid is stupid. ${yearsHere(s) >= 10 ? 'You remember being that new, and it was a long time ago.' : 'You remember being that new, and nobody stopping to explain.'}`,
    stage: 'workplace', cast: [{ ...YOU, pose: 'type' }, { role: 'student', pose: 'idle' }],
    choices: [
      c('weekly', 'Offer half an hour every week, for as long as they want it.', ok('The questions get better each week. Explaining your work out loud shows you how much of it you know.', { community: 4, wellbeing: 3, career: 2, flags: { ...mark(s, 'mentor'), yw_mentor: true } })),
      c('docs', 'Send your notes and say to ask if they get stuck.', ok('They find their way, more slowly. Your own deadlines are safe.', { career: 1, community: 1, flags: mark(s, 'mentor') })),
      c('busy', 'Say you are busy this month.', bad('They stop asking. Later you hear they asked someone else, and that someone else now has an ally.', { community: -3, wellbeing: -1, flags: mark(s, 'mentor') }, 'Nobody stopped for you either, and you remember how that felt.')),
    ],
  }), { when: (s) => job(s) && band(s, 4) && gap(s, 'mentor', 5) }),

  def('yw-reorg', 'work', 1.5, (s) => {
    const tied = sponsored(s);
    return {
      id: 'yw-reorg', track: 'work',
      title: 'Rumours on the floor',
      body: `A reorganisation is coming, everyone says, and nobody knows what it means. Meetings appear on senior calendars and vanish.${tied ? ' For most of your colleagues the worst case is a job search. For you it would also start a clock.' : ''}`,
      stage: 'workplace', cast: [{ ...YOU, pose: 'think' }, { role: 'friend', pose: 'talk' }],
      choices: tied
        ? [
            c('prepare', 'Put copies of every approval notice and pay slip in one folder, and learn your timeline.', ok('The reorganisation comes in spring. Your team gets a new name and you keep your desk. The folder stays in your bag anyway.', { legal: 4, wellbeing: 1, flags: mark(s, 'reorg') }, is(s, 'STEM_OPT') ? 'On a STEM extension, no more than 150 days of unemployment are allowed across the whole period of practical training, and a loss of employment must be reported within 10 days (8 CFR 214.2(f)(10)(ii)(E), (f)(12)(ii)(A)).' : L_GRACE)),
            c('contacts', 'Quietly tell two people you trust that you would take a call.', ok('Nothing comes of it this time. But two people now know to think of you first.', { community: 3, career: 2, flags: mark(s, 'reorg') })),
            c('ignore', 'Tell yourself rumours are only rumours.', bad('You keep your desk. You also spend three months reading every calendar invite twice.', { wellbeing: -5, flags: mark(s, 'reorg') }, 'The worry came anyway, without the preparation.')),
          ]
        : [
            c('cushion', 'Pause the extras for a few months and build a cushion.', ok('The reorganisation comes in spring. Your team gets a new name and you keep your desk, with three months of rent set aside.', { wellbeing: 3, money: cost(s, 400), flags: mark(s, 'reorg') })),
            c('ask', 'Ask your manager directly what is known.', ok('"I cannot say much" turns out to say a good deal. You sleep better for having asked.', { career: 2, wellbeing: 2, flags: mark(s, 'reorg') })),
            c('ignore', 'Tell yourself rumours are only rumours.', bad('You keep your desk. You also spend three months reading every calendar invite twice.', { wellbeing: -4, flags: mark(s, 'reorg') }, 'The worry came anyway, without the preparation.')),
          ],
    };
  }, { when: (s) => job(s) && band(s, 2) && gap(s, 'reorg', 4), oddsPerYear: 0.45 }),

  def('yw-offer', 'work', 1.5, (s) => {
    const o1 = is(s, 'O1');
    const stem = is(s, 'STEM_OPT');
    const tied = o1 || stem;
    return {
      id: 'yw-offer', track: 'work',
      title: 'A call from a former colleague',
      body: `Someone you used to work with has moved to another company and wants you there. The pay is better and the team is smaller.${o1 ? ' The new company would have to file its own petition for you before you could work there.' : stem ? ' The new employer would have to be enrolled in E-Verify and sign a training plan with you, and you would have to report the change within 10 days.' : ''}`,
      stage: 'cafe', cast: [{ ...YOU, pose: 'talk' }, { role: 'friend', pose: 'talk' }],
      choices: [
        tied
          ? c('paper', 'Ask whether they will do the paperwork, and resign from nothing until it is done.', ok('They say yes, then their legal team goes quiet for a month. You are still at your desk, with a door half open.', { career: 3, legal: 2, flags: mark(s, 'offer') }, o1 ? 'When an O-1 worker changes employers, the new employer must file a petition and a request to extend the stay (8 CFR 214.2(o)(2)(iv)(C)).' : 'A STEM extension employer must be enrolled in E-Verify and sign the Form I-983 training plan, and a change of employer must be reported within 10 days (8 CFR 214.2(f)(10)(ii)(C)(5), (6); (f)(12)(ii)(A)).'))
          : c('move', 'Take it.', ok('New faces, new systems, and a first pay slip that makes you check the figure twice.', { career: 5, wellbeing: 3, flags: { ...raise(s, 500), ...mark(s, 'offer') } }), {
              roll: { base: 75, mods: [career()] },
              fail: bad('The final interview goes sideways and the offer shrinks to "let us stay in touch".', { wellbeing: -3, flags: mark(s, 'offer') }, 'A friend inside is a start, not a promise.'),
            }),
        c('counter', 'Tell your manager about the offer and ask what they can do.', ok('Your manager matches part of it, and looks at you differently.', { career: 2, flags: { ...raise(s, 250), ...mark(s, 'offer') } }), {
          roll: { base: 50, mods: [career()] },
          fail: bad('Your manager wishes you well in a tone that is hard to read. Nothing changes on your pay slip.', { wellbeing: -3, flags: mark(s, 'offer') }, 'Leverage cuts both ways.'),
        }),
        c('stay', 'Thank them and stay where you are known.', ok('You know every corridor of this place. For now that is worth more than the difference.', { wellbeing: 2, community: 1, flags: mark(s, 'offer') })),
      ],
    };
  }, { when: (s) => job(s) && !is(s, 'H1B', 'OPT') && band(s, 3) && gap(s, 'offer', 4), oddsPerYear: 0.5 }),

  def('yw-licence', 'work', 2, (s) => ({
    id: 'yw-licence', track: 'work',
    title: 'The licence that stayed home',
    body: 'At home you were qualified in a profession that needs a licence. The board here does not recognise it. They want transcripts, exams and supervised hours, as if the years had not happened.',
    stage: 'library', cast: [{ ...YOU, pose: 'think' }, { role: 'advisor', pose: 'talk' }],
    choices: [
      c('start', `Start the process: evaluations, exam fees and study at night (about $${cost(s, 1200)}, an estimate).`, ok('A thick envelope goes to the board. You study at the kitchen table after work, relearning in a new vocabulary what your hands already know.', { money: -cost(s, 1200), study: 5, wellbeing: -3, flags: { yw_relicense: true, yw_licenceSeen: true } }, 'Professional licences are issued state by state, and each board sets its own rules for training done abroad. The cost here is a designed estimate.')),
      c('near', 'Take work near your profession, in a role that needs no licence.', ok('You are the most qualified assistant the place has ever had. Some days that is a comfort, and some days it stings.', { career: 2, wellbeing: -3, flags: { yw_licenceSeen: true } })),
      c('new', 'Let the old profession go and put your years into the new one.', ok('You put the certificates in a drawer, carefully. It is a loss, and you chose it.', { wellbeing: -2, career: 3, flags: { yw_licenceSeen: true } })),
    ],
  }), { when: (s) => free(s) && band(s, 1, 8) && !has(s, 'yw_licenceSeen') && s.profile.age >= 27, oddsPerYear: 0.5 }),

  def('yw-licence-exam', 'work', 3, (s) => ({
    id: 'yw-licence-exam', track: 'work',
    title: 'The exam, a second time in your life',
    body: 'The board has accepted your papers. What is left is the exam you first passed years ago, in another language, in another country. The hall is full of people ten years younger.',
    stage: 'classroom', cast: [{ ...YOU, pose: 'sit' }, { role: 'professor', pose: 'idle' }],
    choices: [
      c('sit', 'Sit the exam now, while the studying is fresh.', ok('You pass. The licence arrives in a plain envelope, and you are again what you were.', { career: 8, wellbeing: 8, flags: { ...raise(s, 700), yw_licensed: true, yw_relicense: false } }), {
        roll: { base: 55, mods: [mod('study', 50, 0.4, 'study standing'), well()] },
        fail: bad('A few points short. The next sitting is in six months.', { wellbeing: -5, money: -cost(s, 300) }, 'You knew the material. The format was the stranger.'),
      }),
      c('course', `Pay for a preparation course first (about $${cost(s, 600)}, an estimate).`, ok('The course teaches the exam more than the profession. That was the part you needed. You pass.', { money: -cost(s, 600), career: 8, wellbeing: 6, flags: { ...raise(s, 700), yw_licensed: true, yw_relicense: false } }), {
        roll: { base: 80, mods: [mod('study', 50, 0.3, 'study standing')] },
        fail: bad('Closer this time, and still short. The next sitting is in six months.', { wellbeing: -4, money: -cost(s, 600) }, 'Most people who pass needed more than one attempt.'),
      }),
      c('stop', 'Stop here. The cost to your family and your sleep has been enough.', ok('You close the books. Nobody who loves you thinks less of you.', { wellbeing: 2, family: 2, flags: { yw_relicense: false } })),
    ],
  }), { when: (s) => free(s) && has(s, 'yw_relicense') && !has(s, 'yw_licensed') }),

  def('yw-evening-class', 'work', 1.3, (s) => ({
    id: 'yw-evening-class', track: 'work',
    title: 'Evening classes',
    body: `The community college runs a certificate two nights a week that would open the next rung at work. ${hasChild(s) ? 'It would mean two bedtimes a week that you miss.' : 'It would mean two evenings a week that are no longer yours.'}`,
    stage: 'classroom', cast: [{ ...YOU, pose: 'sit' }, { role: 'professor', pose: 'present' }, { role: 'student', pose: 'sit' }],
    choices: [
      c('enrol', `Enrol and pay for it yourself (about $${cost(s, 900)}, an estimate).`, ok('The others in the room are tired in the same way you are. By spring you have a certificate and three new friends.', { money: -cost(s, 900), study: 5, career: 4, community: 2, wellbeing: -3, flags: { ...mark(s, 'class'), yw_cert: true } })),
      c('employer', 'Ask your employer to pay, and enrol only if they do.', ok('There is a tuition benefit nobody had mentioned. You enrol at their cost.', { study: 5, career: 4, wellbeing: -2, flags: { ...mark(s, 'class'), yw_cert: true } }), {
        roll: { base: 50, mods: [career()] },
        fail: bad('The answer is no, kindly. The certificate stays on a browser tab.', { wellbeing: -2, flags: mark(s, 'class') }, 'It was worth the question.'),
      }),
      c('later', 'Not this year. Home needs you more than the next rung does.', ok('The evenings stay yours. The course will run again.', { family: 3, wellbeing: 2, flags: mark(s, 'class') })),
    ],
  }), { when: (s) => free(s) && band(s, 2) && gap(s, 'class', 6) }),

  def('yw-burnout', 'work', 2, (s) => ({
    id: 'yw-burnout', track: 'work',
    title: 'Tired in a new way',
    body: `Sleep does not fix it any more. You sit in front of the same task for an hour, and on Sunday evening your chest tightens.${sponsored(s) ? ' Stopping is not simple when your status rests on the job.' : yearsHere(s) >= 10 ? ' You have not taken more than a week off in years.' : ''}`,
    stage: 'apartment-night', cast: [{ ...YOU, pose: 'think' }],
    choices: [
      c('doctor', 'See a doctor, and ask HR what leave you are entitled to.', ok('The doctor uses the word exhaustion and writes a note. HR explains the options without drama.', { money: -cost(s, 150), wellbeing: 9, career: -1, flags: mark(s, 'burnout') }, 'Federal law gives an eligible employee up to 12 workweeks of leave in a year for a serious health condition. Eligible means at least 12 months and 1,250 hours with an employer that has 50 or more employees within 75 miles (29 U.S.C. 2611(2), 2612(a)(1)(D)).')),
      c('days', 'Take the vacation days you have been saving, all at once.', ok('The first week you sleep. The second week you remember what you like.', { wellbeing: 7, flags: mark(s, 'burnout') })),
      c('push', 'Push through. People at home work harder for less.', bad('You get through the quarter. Something in you has gone quiet.', { wellbeing: -8, career: 1, flags: mark(s, 'burnout') }, 'Comparing your tiredness to theirs did not rest you.')),
    ],
  }), { when: (s) => job(s) && band(s, 3) && s.stats.wellbeing <= 55 && gap(s, 'burnout', 4) }),

  def('yw-injury', 'work', 1.2, (s) => ({
    id: 'yw-injury', track: 'work',
    title: 'Something gives',
    body: 'You lift a box at work and something gives in your shoulder. By the afternoon you cannot raise your arm. A colleague says to report it, and another says reporting things gets you noticed.',
    stage: 'workplace', cast: [{ ...YOU, pose: 'idle' }, { role: 'friend', pose: 'talk' }],
    choices: [
      c('report', 'Report it in writing the same day and see the doctor work sends you to.', ok('There is a form, a clinic and weeks of physiotherapy that you do not pay for. The shoulder comes back slowly.', { wellbeing: 3, legal: 1, flags: mark(s, 'injury') }, 'People hurt while working for a private company claim through their state workers\' compensation board (US Department of Labor). It is illegal for an employer to retaliate against a worker for a safety complaint, and a retaliation complaint must be made within 30 days (29 U.S.C. 660(c)).')),
      c('own', 'See your own doctor and keep work out of it.', ok('Your insurance covers part of it. Work never knows, and the bill is yours.', { money: -cost(s, 500), wellbeing: 1, flags: mark(s, 'injury') })),
      c('ignore', 'Take painkillers and wait.', bad('It half heals. From now on you reach for high shelves with the other arm.', { wellbeing: -7, flags: mark(s, 'injury') }, 'It was a small injury on the day it happened.')),
    ],
  }), { when: (s) => job(s) && band(s, 3) && gap(s, 'injury', 8), oddsPerYear: 0.3 }),

  def('yw-own-idea', 'work', 1.5, (s) => {
    const pet = is(s, 'H1B', 'O1');
    return {
      id: 'yw-own-idea', track: 'work',
      title: 'An idea of your own',
      body: pet
        ? 'For a year you have been sketching a business of your own in a notebook. Your status lets you work only for the employer that petitioned for you, so for now it has to stay in the notebook.'
        : `For a year you have been sketching a business of your own in a notebook. ${is(s, 'CITIZEN') ? 'Nothing in your papers stands in the way any more.' : 'With a green card, nothing in your papers stands in the way.'} What stands in the way is rent, and nerve.`,
      stage: 'kitchen', cast: [{ ...YOU, pose: 'think' }, ...(hasSpouse(s) ? [{ role: 'spouse' as const, pose: 'talk' as const }] : [])],
      choices: pet
        ? [
            c('plan', 'Keep building it on paper: costs, customers, a name.', ok('The plan fills a second notebook. It will be ready on the day you are free to use it.', { wellbeing: 3, career: 1, flags: { ...mark(s, 'idea'), yw_bizPlan: true } }, 'A worker in H-1B or O-1 status may work only as that status allows, and work outside it is a failure to maintain status (8 CFR 214.1(e)). Each employer needs its own petition (8 CFR 214.2(h)(2)(i)(C); 214.2(o)(2)(iv)(B)).')),
            c('lawyer', `Pay an immigration lawyer for an hour on what you may do (about $${cost(s, 300)}, an estimate).`, ok('The answer has more "it depends" than you wanted. But you know where the line is, and which side of it to stay on.', { money: -cost(s, 300), legal: 4, flags: { ...mark(s, 'idea'), yw_bizPlan: true } }, 'Unauthorized employment is a failure to maintain status (8 CFR 214.1(e)). The fee is a designed estimate.')),
            c('give', 'Give the idea to a friend who is free to run with it, and ask for nothing.', ok('They open within the year. You are the first customer, and you are proud and a little sore.', { community: 4, wellbeing: -2, flags: mark(s, 'idea') })),
          ]
        : [
            c('start', `Register it and start on nights and weekends (about $${cost(s, 1500)} to begin, an estimate).`, ok('A business licence in a frame, a first customer, a first complaint. You keep your job and lose your weekends.', { money: -cost(s, 1500), career: 4, wellbeing: -3, flags: { ...mark(s, 'idea'), yw_ownBusiness: true, yw_bizStart: s.year + 1 } })),
            c('save', 'Give it one more year of saving and planning first.', ok('The plan gets sharper and the cushion thicker. The idea is still there in the morning.', { money: cost(s, 500), wellbeing: 1, flags: { ...mark(s, 'idea'), yw_bizPlan: true } })),
            c('drop', 'Put the notebook away. You crossed the world for steady work and you have it.', ok('You close the notebook. Steady work was the dream once, and it still counts.', { wellbeing: -1, family: 2, flags: mark(s, 'idea') })),
          ],
    };
  }, { when: (s) => job(s) && (secure(s) || is(s, 'H1B', 'O1')) && band(s, 4) && !has(s, 'yw_ownBusiness') && gap(s, 'idea', 5) }),

  def('yw-first-hire', 'work', 2.5, (s) => ({
    id: 'yw-first-hire', track: 'work',
    title: 'Your first employee',
    body: 'The business has more work than your two hands can do. You need to hire, and for the first time you are the one handing the employment form across the table. You know how it feels from the other side.',
    stage: 'cafe', cast: [{ ...YOU, pose: 'talk' }, { role: 'stranger', pose: 'sit' }],
    choices: [
      c('best', 'Hire the strongest applicant, a stranger with ten years in the trade.', ok('They are better than you at half the job. The business grows, and you learn to let go of things.', { money: -cost(s, 600), career: 5, wellbeing: 2, flags: { yw_hired: true } }, 'An employer must examine a new hire\'s identity and work authorization documents and complete the Form I-9 within three business days of the hire (8 CFR 274a.2(b)(1)(ii)). The employee chooses which acceptable documents to show (USCIS, I-9 Central).')),
      c('friend', 'Hire a friend from your community who badly needs the job.', ok('They learn slowly and never let you down. Half the neighbourhood now sends you customers.', { money: -cost(s, 600), community: 6, career: 2, flags: { yw_hired: true } }, 'An employer must examine a new hire\'s identity and work authorization documents and complete the Form I-9 within three business days of the hire (8 CFR 274a.2(b)(1)(ii)). The rule is the same for a friend.')),
      c('alone', 'Stay alone and turn work away.', ok('You keep control of every detail. You also keep every late night.', { wellbeing: -4, career: -1, flags: { yw_hired: false, ...mark(s, 'hire') } })),
    ],
  }), { when: (s) => secure(s) && has(s, 'yw_ownBusiness') && !has(s, 'yw_hired') && s.year + 1 - num(s, 'yw_bizStart', 0) >= 2 && gap(s, 'hire', 3) }),

  def('yw-business-taxes', 'work', 2, (s) => ({
    id: 'yw-business-taxes', track: 'work',
    title: 'Tax season, with your own books',
    body: `${seen(s, 'biztax') ? 'The box of receipts is back on the table.' : 'A wage earner has tax taken out of every pay slip. A business owner has a box of receipts and a deadline.'} What the business earned is yours, and so is the arithmetic.`,
    stage: 'kitchen', cast: [{ ...YOU, pose: 'type' }],
    choices: [
      c('accountant', `Pay an accountant (about $${cost(s, 700)}, an estimate).`, ok('She finds deductions you did not know existed and sets up payments through the year. The fee pays for itself.', { money: -cost(s, 700), legal: 3, wellbeing: 3, flags: mark(s, 'biztax') }, 'Self-employment tax is 15.3 percent: 12.4 percent for Social Security and 2.9 percent for Medicare. People who expect to owe $1,000 or more generally pay estimated tax in four payment periods through the year (irs.gov, Self-employment tax; Estimated taxes).')),
      c('self', 'Do it yourself over three long evenings.', ok('You get there with a calculator and the official instructions. You understand your own business better than you did on Monday.', { study: 3, legal: 2, wellbeing: -4, flags: mark(s, 'biztax') })),
      c('late', 'Leave it until the last night.', bad('You file in a hurry and guess at two figures. A letter comes in the summer asking for more.', { money: -cost(s, 900), wellbeing: -5, flags: mark(s, 'biztax') }, 'The box of receipts did not sort itself.', 'If too little is paid by the due date of each payment period, a penalty may apply even when a refund is due at the end (irs.gov, Estimated taxes). Self-employment tax is 15.3 percent on top of income tax.')),
    ],
  }), { when: (s) => secure(s) && has(s, 'yw_ownBusiness') && gap(s, 'biztax', 3), months: [6, 7, 8] }),

  def('yw-business-slow', 'work', 1.5, (s) => ({
    id: 'yw-business-slow', track: 'work',
    title: 'A slow year',
    body: `Customers are spending less this year, and it shows in your till. ${has(s, 'yw_hired') ? 'Someone else\'s rent depends on your till now, as well as your own.' : 'You are still earning a wage elsewhere, which is the only reason you sleep.'}`,
    stage: 'cafe', cast: [{ ...YOU, pose: 'think' }, { role: 'teller', pose: 'idle' }],
    choices: [
      c('carry', 'Carry it from your savings and wait for the turn.', ok('It turns in the autumn. You are poorer and still open.', { money: -cost(s, 2500), wellbeing: -2, flags: mark(s, 'slow') })),
      c('change', 'Change what you sell to fit what people can afford now.', ok('Smaller jobs, more of them. It is not the business you drew in the notebook, and it pays.', { money: -cost(s, 800), career: 3, flags: mark(s, 'slow') }), {
        roll: { base: 60, mods: [ties()] },
        fail: bad('The new line does not catch on. You are back where you were, with new stock in the cupboard.', { money: -cost(s, 1800), wellbeing: -3, flags: mark(s, 'slow') }, 'It was a fair bet.'),
      }),
      c('close', 'Close it properly: pay what is owed and take down the sign.', ok('You pay the last bill and close the account. You did the thing most people only talk about, and you still have your job.', { money: -cost(s, 600), wellbeing: -3, family: 2, flags: { ...mark(s, 'slow'), yw_ownBusiness: false, yw_hired: false, yw_bizClosed: true } })),
    ],
  }), { when: (s) => secure(s) && has(s, 'yw_ownBusiness') && s.year + 1 - num(s, 'yw_bizStart', 0) >= 3 && gap(s, 'slow', 5), oddsPerYear: 0.35 }),

  def('yw-retirement-plan', 'work', 2, (s) => ({
    id: 'yw-retirement-plan', track: 'work',
    title: 'A form about being old',
    body: `HR sends a reminder about the retirement plan. If you put in part of your pay, the company adds to it. ${sponsored(s) ? 'It asks you to plan for an old age in a country that has not yet said you can stay.' : hasChild(s) ? 'You have been saving for a child\'s future and not for your own.' : 'Until now, old age was something you would think about at home.'}`,
    stage: 'workplace', cast: [{ ...YOU, pose: 'type' }],
    choices: [
      c('match', 'Put in enough to get the full company match.', ok('Your pay slip shrinks a little, and a second number starts growing somewhere you cannot touch it.', { money: -cost(s, 900), wellbeing: 4, flags: { yw_retire: true } }, 'The company match is part of your pay. It is only paid if you contribute. Plan rules differ, so read your own plan\'s summary.')),
      c('small', 'Start with a small amount and raise it each year.', ok('It is a beginning, and you will hardly miss it.', { money: -cost(s, 300), wellbeing: 2, flags: { yw_retire: true } })),
      c('home', 'Skip it. Your plan for old age is a house at home.', ok(`You send the money ${hasSpouse(s) ? 'where you and your spouse agreed' : 'where you always have'}. It is a real plan. It is also your only one.`, { family: 3, flags: { yw_retire: false, yw_retireSeen: true } })),
    ],
  }), { when: (s) => job(s) && band(s, 5) && !has(s, 'yw_retire') && !has(s, 'yw_retireSeen') }),

  def('yw-forty-credits', 'work', 2, (s) => ({
    id: 'yw-forty-credits', track: 'work',
    title: 'Forty credits',
    body: `A Social Security statement lists every year you have worked here and what you earned. It takes forty credits to qualify for a retirement benefit, and you can earn at most four in a year. ${yearsHere(s) >= 14 ? 'Your working life here is written down one line at a time.' : 'You count the lines.'}`,
    stage: 'apartment', cast: [{ ...YOU, pose: 'sit' }],
    choices: [
      c('check', 'Check every line against your own records.', ok('One year shows less than you earned, from a job that spelled your name its own way. You send the proof and it is corrected.', { legal: 3, wellbeing: 3, flags: { yw_ssChecked: true } }, 'A worker needs 40 quarters of coverage to be fully insured for old-age benefits, and no more than four can be credited in a calendar year, so it takes at least ten years of covered work (20 CFR 404.110(b), 404.143).')),
      c('talk', hasSpouse(s) ? 'Sit down with your spouse and talk about where you will grow old.' : 'Call home and talk about where you will grow old.', ok('Nobody decides anything. But the question has been asked out loud, and it turns out everyone had been thinking about it.', { family: 4, wellbeing: 1, flags: { yw_ssChecked: true } })),
      c('file', 'Put it in the drawer with the other envelopes.', ok('It will come again next year. The lines will still be there.', { wellbeing: -1, flags: { yw_ssChecked: true } })),
    ],
  }), { when: (s) => job(s) && (secure(s) || is(s, 'ASYLEE')) && band(s, 10) && !has(s, 'yw_ssChecked') }),

  def('yw-senior', 'work', 1.5, (s) => ({
    id: 'yw-senior', track: 'work',
    title: 'The one who remembers',
    body: `Someone asks why a thing is done the way it is, and the room turns to you. After ${yearsHere(s)} years you are the one who was there when it was decided. Nobody asks where you are from any more. They ask what you think.`,
    stage: 'conference', cast: [{ ...YOU, pose: 'talk' }, { role: 'student', pose: 'sit' }, { role: 'friend', pose: 'sit' }],
    choices: [
      c('write', 'Write it all down, so the knowledge outlasts you.', ok('It takes a month of Friday afternoons. New people are handed your document on their first day.', { career: 4, community: 3, flags: mark(s, 'senior') })),
      c('lift', 'Use your standing to put a quiet newcomer on the important project.', ok('They are terrified, and then very good. Somebody did this for you once, or should have.', { community: 5, wellbeing: 3, flags: mark(s, 'senior') })),
      c('guard', 'Keep it in your head. Being needed is job security.', bad('You stay needed. You also get called on every holiday, and nobody can cover for you.', { career: 1, wellbeing: -4, community: -2, flags: mark(s, 'senior') }, 'You are needed, and you cannot take a day off.')),
    ],
  }), { when: (s) => job(s) && band(s, 12) && gap(s, 'senior', 6) }),

  def('yw-i9-documents', 'work', 1.2, (s) => ({
    id: 'yw-i9-documents', track: 'work',
    title: 'They ask for one specific card',
    body: `HR is updating its files. The email tells you to bring ${is(s, 'LPR') ? 'your green card' : 'your work permit card'}, and nothing else will do. You have other documents that prove the same thing, and you remember reading that the choice is yours.`,
    stage: 'workplace', cast: [{ ...YOU, pose: 'idle' }, { role: 'advisor', pose: 'type' }],
    choices: [
      c('choice', 'Bring acceptable documents of your own choosing, and say politely that you may.', ok('The HR officer checks, goes a little pink and thanks you. The next person from abroad will have it easier.', { legal: 3, community: 1, flags: mark(s, 'i9') }, 'For the Form I-9 an employer must let the worker choose which acceptable documents to show, and may not ask for a specific one such as a green card (USCIS, I-9 Central, employee rights). Asking for more or different documents with intent to discriminate is an unfair immigration-related employment practice (8 U.S.C. 1324b(a)(6)).')),
      c('comply', 'Bring exactly what they asked for. It is not worth a conversation.', ok('It takes two minutes. You notice how quickly you reached for the card.', { wellbeing: -1, flags: mark(s, 'i9') }, 'For the Form I-9 the worker chooses which acceptable documents to show (USCIS, I-9 Central, employee rights; 8 U.S.C. 1324b(a)(6)).')),
      c('ask', 'Ask a colleague born here whether they got the same email.', ok('They did not. You take that fact, and your documents, to HR. The email is quietly reworded.', { legal: 2, wellbeing: 1, community: 1, flags: mark(s, 'i9') })),
    ],
  }), { when: (s) => job(s) && (is(s, 'LPR', 'ASYLEE') || (waiting(s) && has(s, 'ead'))) && band(s, 2) && gap(s, 'i9', 9), oddsPerYear: 0.4 }),

  def('yw-name', 'work', 1.5, (s) => ({
    id: 'yw-name', track: 'work',
    title: 'How to say your name',
    body: `A colleague stumbles over ${s.profile.name ? `"${s.profile.name}"` : 'your name'} for the third time. They ask, kindly enough, whether there is something shorter they could call you.`,
    stage: 'workplace', cast: [{ ...YOU, pose: 'idle' }, { role: 'friend', pose: 'talk' }],
    choices: [
      c('teach', 'Teach them. Say it slowly, twice, and wait while they try.', ok('They get it on the third try and look pleased with themselves. By Friday the whole team says it properly.', { wellbeing: 4, community: 2, flags: { yw_nameSeen: true } })),
      c('short', 'Offer a short form that you choose yourself.', ok('It is your name, cut to fit. Your family would smile at it.', { community: 2, flags: { yw_nameSeen: true } })),
      c('any', 'Say they can call you whatever is easiest.', bad('They pick something. It appears on a door sign, and then in the company directory.', { wellbeing: -4, flags: { yw_nameSeen: true } }, 'A name is a small thing to give away, until you see it on a door.')),
    ],
  }), { when: (s) => job(s) && band(s, 1, 6) && !has(s, 'yw_nameSeen'), oddsPerYear: 0.6 }),

  def('yw-day-that-matters', 'work', 1.3, (s) => ({
    id: 'yw-day-that-matters', track: 'work',
    title: 'A day that matters at home',
    body: `The biggest day of the year at home falls on an ordinary working ${seen(s, 'day') ? 'Thursday' : 'Tuesday'} here, with a deadline on top of it. Nobody at work knows the day exists.`,
    stage: 'workplace', cast: [{ ...YOU, pose: 'think' }, { role: 'advisor', pose: 'type' }],
    choices: [
      c('off', 'Ask for the day off, well ahead, and say why.', ok(`Your manager says of course and asks what the day is about. ${hasChild(s) ? 'Your child gets a whole day of it, done properly.' : 'You spend it the way it should be spent.'}`, { family: 4, wellbeing: 4, flags: mark(s, 'day') })),
      c('share', 'Work the day, and bring something to share so the team learns what it is.', ok('People ask questions, some of them clumsy and all of them curious. Next year someone remembers the date before you do.', { community: 4, wellbeing: 1, flags: mark(s, 'day') })),
      c('work', 'Work late and catch the end of it by video.', ok('The deadline is met. On a small screen your family waves from a room full of light.', { career: 2, family: -2, wellbeing: -3, flags: mark(s, 'day') })),
    ],
  }), { when: (s) => job(s) && band(s, 1) && gap(s, 'day', 6), oddsPerYear: 0.5 }),

  def('yw-always-yes', 'work', 1.5, (s) => ({
    id: 'yw-always-yes', track: 'work',
    title: 'The one who never says no',
    body: `There is a launch this weekend and your manager asks you again. "You are always so reliable." ${seen(s, 'yes') ? 'You know why you are, and you suspect your manager does too.' : 'You have never refused, because your papers run through this company, and you both know it.'}`,
    stage: 'workplace', cast: [{ ...YOU, pose: 'type' }, { role: 'advisor', pose: 'talk' }],
    choices: [
      c('yes', 'Say yes again.', ok('The launch goes well and your name is on the thank-you email. You have not had a free weekend this month.', { career: 3, wellbeing: -5, flags: mark(s, 'yes') })),
      c('half', 'Offer Saturday, and say Sunday is not possible.', ok('Your manager blinks, then says Saturday is plenty. It was that easy, and you had never tried it.', { career: 1, wellbeing: 3, flags: mark(s, 'yes') })),
      c('no', 'Say no this time, and name who has not yet taken a turn.', ok('It is awkward for a moment. Someone else covers, and nothing happens to you.', { wellbeing: 4, flags: mark(s, 'yes') }), {
        roll: { base: 70, mods: [career()] },
        fail: bad('Your manager says fine, in a voice that is not. Nothing follows from it, but you watch your inbox for a week.', { wellbeing: -3, flags: mark(s, 'yes') }, 'The fear was real even though nothing came of it.'),
      }),
    ],
  }), { statuses: ['H1B', 'O1', 'STEM_OPT'], when: (s) => job(s) && band(s, 1) && gap(s, 'yes', 4) }),

  def('yw-empty-desks', 'work', 1.2, (s) => ({
    id: 'yw-empty-desks', track: 'work',
    title: 'Empty desks',
    body: `Cuts came through another part of the company this week, and people you ate lunch with are gone. Your team was spared. Their work has not gone anywhere, and it is drifting toward your desk.`,
    stage: 'workplace', cast: [{ ...YOU, pose: 'idle' }, { role: 'friend', pose: 'carry' }],
    choices: [
      c('reference', 'Call the ones who left and offer a reference and your contacts.', ok('Two of them land within a season, one through a name you gave. People remember who called.', { community: 5, wellbeing: 2, flags: mark(s, 'desks') })),
      c('priorities', 'Ask your manager, in writing, which of the extra work comes first.', ok('The list comes back shorter than the pile. You do the top of it well.', { career: 3, wellbeing: 1, flags: mark(s, 'desks') })),
      c('absorb', 'Take it all on quietly. This is no time to be seen struggling.', bad('You do two jobs for one salary until spring. Nobody says thank you, because nobody knows.', { career: 2, wellbeing: -6, flags: mark(s, 'desks') }, 'Nobody could see the extra work, so nobody counted it.')),
    ],
  }), { when: (s) => job(s) && band(s, 5) && gap(s, 'desks', 7), oddsPerYear: 0.35 }),

  def('yw-asked-to-speak', 'work', 1.2, (s) => ({
    id: 'yw-asked-to-speak', track: 'work',
    title: 'Asked to speak',
    body: `You are asked to present your team's work to a few hundred people. ${yearsHere(s) >= 12 ? 'Years ago you would have rehearsed every word for a week. You probably still will.' : 'You know the work better than anyone, and you know exactly how your voice sounds in a quiet room.'}`,
    stage: 'conference', cast: [{ ...YOU, pose: 'present' }, { role: 'stranger', pose: 'sit' }, { role: 'friend', pose: 'sit' }],
    choices: [
      c('accept', 'Accept, and rehearse until the words are yours.', ok('The first minute your mouth is dry. Then you are simply explaining something you know, and the room leans in.', { career: 6, wellbeing: 4, flags: mark(s, 'speak') }), {
        roll: { base: 70, mods: [well(), career()] },
        fail: bad('You rush, and lose your place once. People are kind about it afterwards, and you replay it for days.', { career: 1, wellbeing: -4, flags: mark(s, 'speak') }, 'You stood up and did it, and that counts.'),
      }),
      c('share', 'Present it together with a junior colleague.', ok('You take the hard questions and they take the demo. Both of you come off the stage taller.', { career: 3, community: 4, flags: mark(s, 'speak') })),
      c('decline', 'Suggest someone who enjoys a stage.', ok('They do it well and thank your team by name. You watch from the third row, relieved and a little wistful.', { wellbeing: 1, career: -1, flags: mark(s, 'speak') })),
    ],
  }), { when: (s) => job(s) && band(s, 6) && gap(s, 'speak', 7), oddsPerYear: 0.4 }),

  def('yw-new-tools', 'work', 1.5, (s) => ({
    id: 'yw-new-tools', track: 'work',
    title: 'The way you learned it is gone',
    body: `The tools you built your working life on are being retired. The replacement does in a minute what used to take you an afternoon, and the newest hires already think in it. You have started over before, and it was harder than this.`,
    stage: 'workplace', cast: [{ ...YOU, pose: 'type' }, { role: 'student', pose: 'type' }],
    choices: [
      c('learn', `Take a course on your own time (about $${cost(s, 400)}, an estimate).`, ok('It is humbling for a month. Then your years of judgment meet the new speed, and you are hard to beat.', { money: -cost(s, 400), study: 4, career: 4, flags: mark(s, 'tools') })),
      c('swap', 'Ask a junior colleague to teach you, and teach them the trade in return.', ok('They show you the buttons and you show them why. Both of you get the better half of the deal.', { career: 3, community: 4, flags: mark(s, 'tools') })),
      c('coast', 'Leave it to the young ones. The old way still works.', bad('It works until the day it is switched off. Your name is on the list of people who need "transition support".', { career: -5, wellbeing: -2, flags: mark(s, 'tools') }, 'You learned a whole new country once.', 'Federal age discrimination law protects workers who are at least 40 (29 U.S.C. 631(a)). It does not protect a skill that has been retired.')),
    ],
  }), { when: (s) => job(s) && band(s, 11) && gap(s, 'tools', 6) }),

  def('yw-who-comes-after', 'work', 1.5, (s) => {
    const biz = has(s, 'yw_ownBusiness');
    return {
      id: 'yw-who-comes-after', track: 'work',
      title: 'Who comes after you',
      body: biz
        ? `The business has your name over the door and ${yearsHere(s)} years of your life in it. A customer asks, lightly, who will run it one day. You do not have an answer.`
        : `Your manager asks you to think about a successor. Nobody is pushing you out. It is that after ${yearsHere(s)} years too much lives only in your head.`,
      stage: biz ? 'cafe' : 'workplace', cast: [{ ...YOU, pose: 'think' }, { role: 'student', pose: 'talk' }],
      choices: [
        c('train', biz ? 'Start teaching your best worker the whole business, books included.' : 'Choose someone and teach them everything, including the parts that make you look good.', ok('It is strange to hear your own phrases in someone else\'s mouth. It is also a kind of permanence.', { community: 5, wellbeing: 3, career: 1, flags: mark(s, 'after') })),
        c('family', hasChild(s) ? 'Ask your child, now nearly grown, whether they have ever thought about it.' : 'Talk it through with family before deciding anything.', ok(hasChild(s) ? 'They have their own plans, and they tell you so gently. You worked so they could have plans of their own.' : 'The talk wanders into what you want from the next ten years. That was the real question.', { family: 5, wellbeing: 1, flags: mark(s, 'after') })),
        c('later', 'Not yet. You are not done.', ok('You say so, and it is true. The question will keep.', { career: 2, wellbeing: -1, flags: mark(s, 'after') })),
      ],
    };
  }, { when: (s) => job(s) && band(s, 15) && gap(s, 'after', 8) }),

  // ====================================================================== HALF TWO: no work permit
  // Consequences only. Nothing here explains how to find or keep work without authorization.

  def('yw-u-wages', 'work', 1.5, (s) => ({
    id: 'yw-u-wages', track: 'work',
    title: 'Three weeks owed',
    body: `The job is finished and the man who hired the crew has stopped answering his phone. He owes each of you three weeks. ${seen(s, 'uwages') ? 'You have seen this before, and this time you wrote down your hours.' : 'One of the crew says there is nothing to be done, because none of you has papers.'}`,
    stage: 'worksite', cast: [{ ...YOU, pose: 'phone' }, { role: 'friend', pose: 'think' }],
    choices: [
      c('centre', 'Go to the worker centre with the whole crew and file a wage claim.', ok('The centre knows this contractor by name. A letter goes out, then a claim. Months later most of the money arrives.', { money: cost(s, 1100), community: 4, wellbeing: 3, flags: mark(s, 'uwages') }, L_WAGES), {
        roll: { base: 60, mods: [ties()], flagMods: [{ flag: 'yw_hoursBook', delta: 15, label: 'a record of your hours' }] },
        fail: ok('The claim is filed, and it is slow. The contractor has changed his company name again. The centre keeps your file open.', { community: 3, wellbeing: -2, flags: mark(s, 'uwages') }, L_WAGES),
      }),
      c('record', 'Tonight, write down every day, hour and address while you still remember.', ok('Four pages in a school notebook, with dates, addresses and the number on his truck. Whatever you decide next, you have the facts.', { legal: 2, wellbeing: 1, flags: { ...mark(s, 'uwages'), yw_hoursBook: true } })),
      c('lose', 'Let it go. Chasing him is a risk you cannot weigh.', bad('You borrow for the rent. He hires a new crew across town.', { money: -cost(s, 500), wellbeing: -5, flags: mark(s, 'uwages') }, 'It was your money.', L_WAGES)),
    ],
  }), { when: (s) => shadow(s) && band(s, 2) && gap(s, 'uwages', 5), oddsPerYear: 0.45 }),

  def('yw-u-unsafe', 'work', 1.5, (s) => ({
    id: 'yw-u-unsafe', track: 'work',
    title: 'The gear is on order',
    body: 'Today\'s task needs protective gear, and there is none. The boss says it is on order, as he said last month. Everyone looks at the ground and waits for someone else to speak.',
    stage: 'worksite', cast: [{ ...YOU, pose: 'idle' }, { role: 'owner', pose: 'talk' }, { role: 'friend', pose: 'idle' }],
    choices: [
      c('refuse', 'Say you will do any other job today, but not this one without the gear.', ok('He swears, and gives you the sweeping. The next morning there is a box of gear by the door.', { wellbeing: 3, community: 2, flags: mark(s, 'unsafe') }), {
        roll: { base: 55, mods: [ties()] },
        fail: bad('He sends you home without the day\'s pay. Someone else does the task.', { money: -cost(s, 130), wellbeing: -3, flags: mark(s, 'unsafe') }, 'You went home in one piece.'),
      }),
      c('together', 'Talk to the others at lunch, and ask the worker centre about a confidential complaint.', ok('Four of you go together. The centre explains what a complaint is and that it can be made without your names.', { community: 4, legal: 2, flags: mark(s, 'unsafe') }, 'A worker or a representative may file a confidential safety complaint, and it is illegal to fire or punish a worker for complaining. A retaliation complaint must be made within 30 days (osha.gov, Workers; 29 U.S.C. 660(c)).')),
      c('do', 'Do it carefully. You have done worse.', ok('You finish with stinging eyes and all your fingers. The gear is still on order.', { wellbeing: -3, flags: mark(s, 'unsafe') }), {
        roll: { base: 65 },
        fail: bad('It goes wrong in a second. You spend the evening in an emergency room, and the week at home without pay.', { money: -cost(s, 900), wellbeing: -10, flags: { ...mark(s, 'unsafe'), yw_hurt: true } }, 'Nobody should have been asked to do it.', 'It is illegal to fire or punish a worker for a safety complaint, and a complaint can be confidential (osha.gov, Workers; 29 U.S.C. 660(c)).'),
      }),
    ],
  }), { when: (s) => shadow(s) && band(s, 1) && gap(s, 'unsafe', 5), oddsPerYear: 0.5 }),

  def('yw-u-overtime-threat', 'work', 1.3, (s) => ({
    id: 'yw-u-overtime-threat', track: 'work',
    title: 'He says he could make a call',
    body: 'You ask why sixty hours pays the same as forty. The boss does not raise his voice. He says a person in your position should think carefully about who he could call.',
    stage: 'worksite', cast: [{ ...YOU, pose: 'idle' }, { role: 'owner', pose: 'talk' }],
    choices: [
      c('centre', 'Tell the worker centre exactly what he said, word for word.', ok('They have heard those words many times. They explain what the law calls them, and what your choices are. You walk out less alone.', { legal: 3, wellbeing: 3, community: 2, flags: mark(s, 'uthreat') }, 'Federal wage law makes it unlawful to fire or otherwise punish an employee for making a wage complaint (29 U.S.C. 215(a)(3)), and it requires one and a half times the regular rate for hours over forty in a week (29 U.S.C. 207(a)(1)). The Department of Labor enforces it without regard to whether a worker is documented (Fact Sheet 48).')),
      c('leave', 'Say nothing more, and move to another employer through people you trust.', ok('It takes a lean month. The new boss is no saint, but he has never said those words.', { money: -cost(s, 600), wellbeing: 2, flags: mark(s, 'uthreat') })),
      c('drop', 'Drop the question and keep the job.', bad('Sixty hours, forty paid. He is friendly again by Friday.', { wellbeing: -6, flags: mark(s, 'uthreat') }, 'The threat did its work without his ever making the call.', 'Punishing a worker for a wage complaint is unlawful whatever the worker\'s papers (29 U.S.C. 215(a)(3); US Department of Labor, Fact Sheet 48).')),
    ],
  }), { when: (s) => shadow(s) && band(s, 2) && gap(s, 'uthreat', 6), oddsPerYear: 0.4 }),

  def('yw-u-same-pay', 'work', 1.5, (s) => ({
    id: 'yw-u-same-pay', track: 'work',
    title: 'The same pay as the first year',
    body: `You have worked for the same boss for ${Math.min(yearsHere(s), 10) >= 10 ? 'ten years or more' : `${yearsHere(s)} years`}. You open in the morning and you train the new people. The amount in the envelope has not changed since the first year, and everything it buys has.`,
    stage: 'worksite', cast: [{ ...YOU, pose: 'carry' }, { role: 'owner', pose: 'idle' }],
    choices: [
      c('ask', 'Ask for more, and say plainly what you do for the place.', ok('He complains about costs for ten minutes, then adds a little to the envelope. It is the first raise you have had in this country.', { money: cost(s, 1200), wellbeing: 4, flags: mark(s, 'usame') }), {
        roll: { base: 45, mods: [ties()] },
        fail: bad('"Times are hard," he says, from the seat of a new truck. The envelope stays the same.', { wellbeing: -4, flags: mark(s, 'usame') }, 'You asked, and that was hard enough.'),
      }),
      c('around', 'Ask people you trust what others are paying.', ok('The answer is more than you get. You carry the number in your head, and one day you will use it.', { community: 2, wellbeing: 1, flags: mark(s, 'usame') })),
      c('stay', 'Say nothing. He has never cheated you, and that is rare.', bad('Another year at the same figure. Loyalty runs one way here.', { wellbeing: -4, flags: mark(s, 'usame') }, 'You have been steady for him. The pay has only stood still.', 'The federal minimum wage and overtime rules are enforced for hours actually worked, whatever a worker\'s papers (US Department of Labor, Fact Sheet 48; 29 U.S.C. 207(a)(1)). They set a floor and do not require a raise.')),
    ],
  }), { when: (s) => shadow(s) && band(s, 7) && gap(s, 'usame', 6) }),

  def('yw-u-body', 'work', 1.5, (s) => ({
    id: 'yw-u-body', track: 'work',
    title: 'What the work has taken',
    body: `Your knees announce the stairs before you reach them. Your hands are stiff until the second hour of the shift. After ${yearsHere(s)} years of this work, your body is the only tool you own, and it is wearing out.`,
    stage: 'clinic', cast: [{ ...YOU, pose: 'sit' }, { role: 'nurse', pose: 'talk' }],
    choices: [
      c('clinic', `Go to the community clinic that charges by what you can pay (about $${cost(s, 120)}, an estimate).`, ok('Nobody asks about papers. They give you exercises, a brace, and a plain warning about what lifting will do in five more years.', { money: -cost(s, 120), wellbeing: 5, flags: mark(s, 'ubody') })),
      c('lighter', 'Ask the boss for the lighter tasks, and offer to train the young ones in exchange.', ok('He agrees faster than you expected. A trained crew is worth more to him than your back.', { wellbeing: 4, community: 2, flags: mark(s, 'ubody') }), {
        roll: { base: 55, mods: [ties()] },
        fail: bad('He says the job is the job. You go back to the heavy end.', { wellbeing: -4, flags: mark(s, 'ubody') }, 'It was a fair thing to ask.'),
      }),
      c('pills', 'Buy painkillers and keep going.', bad('The pills work, until one morning they do not. You lose a week you cannot afford.', { money: -cost(s, 400), wellbeing: -7, flags: mark(s, 'ubody') }, 'The pain was telling you something.')),
    ],
  }), { when: (s) => shadow(s) && band(s, 9) && gap(s, 'ubody', 5) }),

  def('yw-u-form', 'work', 1.3, (s) => ({
    id: 'yw-u-form', track: 'work',
    title: 'The new place has a form',
    body: 'A customer who likes your work recommends you to a large company: better pay, set hours, a uniform. On the first morning a woman from HR slides a form across the desk. It asks you to state your status and show documents within three days.',
    stage: 'workplace', cast: [{ ...YOU, pose: 'sit' }, { role: 'advisor', pose: 'talk' }],
    choices: [
      c('truth', 'Hand the form back and say you cannot complete it.', ok('She is kind about it, and the job goes to someone else. You walk out with nothing signed that could be held against you.', { wellbeing: -4, legal: 3, flags: mark(s, 'uform') }, 'An employer must check a new hire\'s identity and work authorization on the Form I-9 within three business days (8 CFR 274a.2(b)(1)(ii)). Falsely claiming to be a US citizen on it is a ground of inadmissibility in its own right (INA 212(a)(6)(C)(ii)), so the truthful answer protects any road that may open later.')),
      c('clinic', 'Ask for a day, and take your whole history back to the legal clinic.', ok(`${noStatus(s) ? 'Nothing has opened for you this year.' : 'Your case is still pending, and the work permit is not here yet.'} The lawyer updates your file, and you turn the job down knowing exactly where you stand.`, { legal: 4, wellbeing: -2, flags: mark(s, 'uform') }, 'An employer must check a new hire\'s identity and work authorization on the Form I-9 within three business days (8 CFR 274a.2(b)(1)(ii)).')),
      c('walk', 'Say you left something in the car, and do not come back.', bad('You sit at a bus stop with the uniform still folded in its bag. You will never know what she would have said.', { wellbeing: -6, flags: mark(s, 'uform') }, 'You left before she could say anything, and you carry it anyway.')),
    ],
  }), { when: (s) => shadow(s) && band(s, 3) && gap(s, 'uform', 6), oddsPerYear: 0.4 }),

  def('yw-u-tax-number', 'work', 1.2, (s) => ({
    id: 'yw-u-tax-number', track: 'work',
    title: 'The tax number has lapsed',
    body: 'At the free tax clinic a volunteer frowns at her screen. The taxpayer number you were given years ago has not been on a return for three years, and it has expired. She says it can be renewed, and asks whether you want to.',
    stage: 'library', cast: [{ ...YOU, pose: 'sit' }, { role: 'advisor', pose: 'type' }],
    choices: [
      c('renew', 'Renew it and file this year\'s return.', ok('There are more forms, and a wait of some weeks. Then the folder of returns on your shelf has no gap in it.', { legal: 3, wellbeing: 2, flags: { ...mark(s, 'utax'), yw_itinKept: true } }, 'An ITIN that is not used on a federal return for three consecutive tax years expires, and must be renewed if it will be used on a return (irs.gov, How to renew an ITIN). It is for federal tax purposes only: it does not authorize work, change immigration status or qualify anyone for Social Security benefits (irs.gov, ITIN).')),
      c('ask', 'Ask her first what the number does and does not do.', ok('She is exact about it. It is for tax and nothing else. It gives no permission to work, no status and no pension. You renew it knowing what it is.', { legal: 2, study: 1, flags: { ...mark(s, 'utax'), yw_itinKept: true } }, 'An ITIN is issued for federal tax purposes only. It does not authorize work, provide immigration status or qualify a person for Social Security benefits (irs.gov, ITIN).')),
      c('leave', 'Leave it. One less piece of paper with your name on it.', bad('The folder on your shelf stops at an old year. Each spring the gap gets wider.', { wellbeing: -3, flags: mark(s, 'utax') }, 'The record of your years here now has a gap.', 'An expired ITIN must be renewed before it is used on a return (irs.gov, How to renew an ITIN).')),
    ],
  }), { when: (s) => shadow(s) && band(s, 5) && gap(s, 'utax', 7), months: [6, 7, 8] }),

  def('yw-u-teach', 'work', 1.5, (s) => ({
    id: 'yw-u-teach', track: 'work',
    title: 'Showing someone the work',
    body: `A young man joins the crew, a few weeks in the country and holding the tool wrong. The boss nods at you to show him. ${yearsHere(s) >= 12 ? 'You have taught a dozen like him. Some have gone on to their own crews, and some have gone home.' : 'You were him once, and someone showed you.'}`,
    stage: 'worksite', cast: [{ ...YOU, pose: 'carry' }, { role: 'student', pose: 'idle' }],
    choices: [
      c('all', 'Teach him the trade and the rest: write down your hours, never work without the gear.', ok('He learns the trade from your hands. The other things he hears from you and will only understand later.', { community: 5, wellbeing: 3, flags: mark(s, 'uteach') })),
      c('trade', 'Teach him the work and leave the rest for him to find out.', ok('By the end of the month he is useful. He calls you teacher in his own language.', { community: 3, wellbeing: 1, flags: mark(s, 'uteach') })),
      c('distance', 'Show him the minimum. New ones come and go.', bad('He picks it up from watching. When he leaves for another crew he does not say goodbye.', { community: -3, wellbeing: -1, flags: mark(s, 'uteach') }, 'Someone took the time with you once.')),
    ],
  }), { when: (s) => shadow(s) && band(s, 6) && gap(s, 'uteach', 5) }),

  def('yw-u-keys', 'work', 2, (s) => ({
    id: 'yw-u-keys', track: 'work',
    title: 'He hands you the keys',
    body: 'The boss wants you to run the crew: open up, assign the work, deal with customers. He offers a little more in the envelope. He offers no title and nothing on paper, and when something goes wrong it will be your face the customer remembers.',
    stage: 'worksite', cast: [{ ...YOU, pose: 'idle' }, { role: 'owner', pose: 'talk' }],
    choices: [
      c('accept', 'Take the keys.', ok('You are good at it. The crew works better for you than it ever did for him, and you are the last to leave every night.', { money: cost(s, 1500), community: 3, wellbeing: -4, flags: { yw_crewLead: true, yw_keysSeen: true } })),
      c('book', 'Take them if the pay is written each week in a book you both sign.', ok('He grumbles and signs. It is a thin book, and it is the first written record of your work in this country.', { money: cost(s, 1500), legal: 2, wellbeing: -2, flags: { yw_crewLead: true, yw_keysSeen: true, yw_hoursBook: true } }), {
        roll: { base: 60, mods: [ties()] },
        fail: bad('"We do not need paper between us," he says, and gives the keys to someone else.', { wellbeing: -3, flags: { yw_keysSeen: true } }, 'You asked for something reasonable.'),
      }),
      c('decline', 'Thank him, and stay one of the crew.', ok('He gives the keys to another man. You go home when the shift ends, and that is worth something too.', { wellbeing: 2, flags: { yw_keysSeen: true } })),
    ],
  }), { when: (s) => shadow(s) && band(s, 5) && !has(s, 'yw_keysSeen') }),

  def('yw-u-hurt', 'work', 1.2, (s) => ({
    id: 'yw-u-hurt', track: 'work',
    title: 'Hurt on the job',
    body: 'A load slips and your hand is under it. The boss drives you most of the way to the hospital and stops a block short. "Tell them it happened at home," he says. He does not say it unkindly.',
    stage: 'clinic', cast: [{ ...YOU, pose: 'sit' }, { role: 'doctor', pose: 'talk' }],
    choices: [
      c('truth', 'Tell the doctor what happened and where.', ok('The doctor writes it down as you say it. The hand is set and wrapped. The bill is frightening, and the record is true.', { money: -cost(s, 700), wellbeing: 2, legal: 1, flags: mark(s, 'uhurt') }, 'Workers hurt while employed by a private company are directed to their state workers\' compensation board (US Department of Labor). Each state sets its own rules, so a worker centre or legal aid office is the place to ask what applies to you.')),
      c('centre', 'Get treated, then ask the worker centre what your state\'s rules say.', ok('They know the local rules and a clinic that charges less. One of them comes with you to the follow-up.', { money: -cost(s, 400), community: 3, legal: 2, wellbeing: 2, flags: mark(s, 'uhurt') }, 'Workers hurt while employed by a private company are directed to their state workers\' compensation board (US Department of Labor). The rules differ from state to state.')),
      c('home', 'Say it happened at home.', bad('The hand heals a little crooked. He pays you for two of the four weeks you cannot work, and calls it generosity.', { money: -cost(s, 900), wellbeing: -6, flags: mark(s, 'uhurt') }, 'You carried the cost of an injury that happened on his job.')),
    ],
  }), { when: (s) => shadow(s) && band(s, 2) && gap(s, 'uhurt', 7), oddsPerYear: 0.3 }),

  def('yw-u-old-age', 'work', 1.5, (s) => ({
    id: 'yw-u-old-age', track: 'work',
    title: 'No pension is coming',
    body: `A man from the old crew, past sixty, is still carrying loads because he cannot afford to stop. You have worked here ${yearsHere(s)} years. Nobody has put anything aside for you. If you have paid tax, it was with a number that earns no pension.`,
    stage: 'street', cast: [{ ...YOU, pose: 'think' }, { role: 'stranger', pose: 'carry' }],
    choices: [
      c('save', 'Start putting something aside every week, however small.', ok('It is a tin, then an account. It will not be enough, but it is something you did not have before.', { money: -cost(s, 300), wellbeing: 3, flags: mark(s, 'uold') }, 'An ITIN does not qualify a person for Social Security benefits (irs.gov, ITIN).')),
      c('home', `Put the savings into ${hasChild(s) ? 'something at home that could one day carry you' : 'a room and a plot at home'}.`, ok('Your family sends photographs of walls going up. It is a place to grow old, in a country you cannot visit and come back from.', { money: -cost(s, 1500), family: 5, wellbeing: 1, flags: mark(s, 'uold') }, 'An ITIN does not qualify a person for Social Security benefits (irs.gov, ITIN). After a year or more of unlawful presence, leaving the US triggers a ten-year bar on returning (INA 212(a)(9)(B)).')),
      c('not-now', 'Do not think about it. There is this week to get through.', bad('This week is got through. So is the next. The old man is still carrying loads.', { wellbeing: -4, flags: mark(s, 'uold') }, 'The question is still there for next year.')),
    ],
  }), { when: (s) => shadow(s) && band(s, 11) && gap(s, 'uold', 6) }),

  def('yw-u-built', 'work', 1.2, (s) => ({
    id: 'yw-u-built', track: 'work',
    title: 'Something you made',
    body: `You pass a place you worked on years ago. It is finished now, and full of people who will never know your name. ${hasChild(s) ? 'Your child is beside you, looking at a phone.' : 'You stop on the pavement for a moment.'}`,
    stage: 'street', cast: [{ ...YOU, pose: 'idle' }, { role: 'stranger', pose: 'walk' }],
    choices: [
      c('tell', hasChild(s) ? 'Tell your child: "I built part of that."' : 'Tell the friend you are with: "I built part of that."', ok(hasChild(s) ? 'They look up and look properly. "Which part?" You show them.' : 'They make you point out exactly which part. Then they make you tell the story at dinner.', { family: hasChild(s) ? 4 : 1, community: hasChild(s) ? 0 : 3, wellbeing: 5, flags: mark(s, 'ubuilt') })),
      c('photo', 'Take a photograph and send it home.', ok('Your family passes it around. Someone prints it. In a house far away, a piece of this city is pinned to a wall with your name under it.', { family: 4, wellbeing: 3, flags: mark(s, 'ubuilt') })),
      c('walk', 'Keep walking. It is only work.', ok('You keep walking. You look back once from the corner.', { wellbeing: -1, flags: mark(s, 'ubuilt') })),
    ],
  }), { when: (s) => shadow(s) && band(s, 6) && gap(s, 'ubuilt', 7) }),
];
