import { createSeededRandom } from '../utils/random';
import { MORE_CHALLENGES } from './challenges2';
import { OUT_OF_STATUS_CHALLENGES } from './challenges3';
import {
  FACT_ADDR,
  FACT_CPT,
  FACT_F2,
  FACT_RCL,
  FACT_REPORT,
  FACT_WORK,
  bad,
  c,
  def,
  legal,
  money,
  ok,
  social,
  study,
  well,
} from './cx';
import { commuteInfo, priceFactor } from './economy';
import { eraFor, getCity, srcNum } from './data';
import { cultureOf } from './country';
import { statusOf } from './routes';
import type { ChallengeDef, Effects } from './types';

const YOU = { role: 'player' } as const;

const CORE: ChallengeDef[] = [
  // ------------------------------------------------------------------ arrival
  def('arrival-inspection', 'big', 0, () => ({
    id: 'arrival-inspection',
    track: 'big',
    title: 'Port-of-entry inspection',
    body:
      'Your flight lands after a long journey. In the arrivals hall a border officer reviews your passport, your F-1 visa and your school paperwork (the I-20). The line is long, you are tired, and everything you own is in two suitcases.',
    narration: 'Your flight lands after a long journey. The line is long, you are tired, and everything you own is in two suitcases.',
    lines: [
      { who: 'officer', text: 'Good afternoon. Passport, visa and your I-20, please.', voice: 'arrival-officer-1' },
      { who: 'officer', text: 'What brings you to the United States?', voice: 'arrival-officer-2' },
      { who: 'player', text: 'I am here to study. My program starts this month.' },
      { who: 'officer', text: 'And how are you paying for your studies?', voice: 'arrival-officer-3' },
    ],
    stage: 'airport',
    cast: [{ ...YOU, pose: 'idle' }, { role: 'officer', pose: 'talk' }],
    fact: 'f1-visas-issued-fy2024',
    choices: [
      c(
        'ready',
        'Keep passport, visa, I-20 and funding proof in hand. Answer plainly.',
        ok('The officer asks a few questions about your school and program, glances at your papers and slides them back. A stamp, a nod, and you are in.', { legal: 4, wellbeing: 4 }),
        {
          roll: { base: 90 },
          fail: bad('Something on the officer\'s screen makes them pause. You are asked to wait in a side room. An hour later you are let through, shaken.', { wellbeing: -5 }, 'You wonder whether your papers or your answers could have been clearer.'),
        },
      ),
      c(
        'checked-bag',
        'Your documents are in a checked bag. Ask if you can fetch them.',
        ok('It takes a while, but you retrieve them and are admitted. Lesson learned: documents stay with you.', { legal: 1, wellbeing: -2 }),
        {
          roll: { base: 55 },
          fail: bad('The delay sends you to a side room, you miss your ride and reach your apartment close to midnight.', { wellbeing: -8, legal: -2 }, 'That could have gone more smoothly.'),
        },
      ),
      c(
        'overexplain',
        'You are nervous, so you explain everything, including plans you are not sure about.',
        ok('The officer listens patiently and admits you. Your answers matched your paperwork.', { legal: 2 }),
        {
          roll: { base: 62 },
          fail: bad('A few of your answers do not match your papers. A long interview follows before you are admitted.', { wellbeing: -7, legal: -3 }, 'Perhaps a shorter, simpler answer would have been safer.', 'Border officers compare what you say with your documents. Keeping answers short, consistent and true avoids extra scrutiny.'),
        },
      ),
    ],
  })),

  def('first-night', 'life', 0, () => ({
    id: 'first-night',
    track: 'life',
    title: 'The first night',
    body: 'It is 3 a.m. by your body clock. The apartment is quiet, a mattress sits on the floor and your suitcases are half open. Home is a long way off and morning there is already starting.',
    stage: 'apartment-night',
    cast: [{ ...YOU, pose: 'phone' }, { role: 'parent', pose: 'talk' }],
    choices: [
      c('call', 'Call home.', ok('Your mother cries a little, your father asks if you ate. It is exactly what you needed, and exactly what makes you miss them.', { family: 6, wellbeing: 4 })),
      c('plan', 'Unpack and write a plan for the first week.', ok('A list on the wall makes the room feel like yours. You finally sleep a little.', { study: 2, wellbeing: 2 })),
      c('scroll', 'Scroll through your phone until you fall asleep.', ok('You wake up with a stiff neck and a dead battery. Tomorrow is a new day.', { wellbeing: -2 })),
    ],
  })),

  def('first-week', 'life', 0, () => ({
    id: 'first-week',
    track: 'life',
    title: 'Finding your feet',
    body: 'Bus routes, grocery stores, building names you cannot pronounce. Every errand takes twice as long as it should. A group of new students is setting off on a campus tour.',
    stage: 'campus',
    cast: [{ ...YOU, pose: 'walk' }, { role: 'student', pose: 'wave' }, { role: 'friend', pose: 'talk' }],
    choices: [
      c('tour', 'Join the group tour.', ok('You get lost with strangers, which turns out to be the fastest way to make friends.', { community: 6, wellbeing: 3 })),
      c('alone', 'Explore on your own.', ok('You learn the neighborhood properly, though you eat dinner alone.', { study: 1, wellbeing: -1 })),
      c('rest', 'Stay in and recover.', ok('You catch up on sleep. The campus will still be there tomorrow.', { wellbeing: 2, community: -2 })),
    ],
  })),

  // ------------------------------------------------------------------ fixed seasonal
  def('orientation', 'status', 0, () => ({
    id: 'orientation',
    track: 'status',
    title: 'International student orientation',
    body: 'The international office (the DSO) is running orientation for new students. There is a sign-in table, a long line, and a folder of forms. You are still jet-lagged.',
    stage: 'intl-office',
    cast: [{ ...YOU, pose: 'idle' }, { role: 'dso', pose: 'talk' }],
    inlineFact: FACT_REPORT,
    choices: [
      c('checkin', 'Attend and complete the check-in.', ok('The advisor confirms your details on a screen and hands you a welcome packet. You learn who to call when something goes wrong.', { legal: 6, community: 3, study: 1 })),
      c(
        'skip',
        'Skip it. You will do it later.',
        ok('You catch up later and nothing seems to happen.', { legal: -1 }),
        {
          roll: { base: 52 },
          fail: bad('Weeks later an email arrives about your record. You are not sure you read it properly.', { legal: -8, wellbeing: -3, flags: { missedCheckIn: true } }, 'Maybe that email deserved more attention.', 'Schools must report each term whether students enrolled or failed to enroll, and a missed check-in can flag your record (8 CFR 214.3(g)). Always complete check-in.'),
        },
      ),
      c(
        'leave-line',
        'Leave the long line and check in "next week".',
        ok('The office lets you finish online. A close call.', { legal: 0 }),
        {
          roll: { base: 40 },
          fail: bad('Next week turns into three. A reminder arrives and your stomach drops.', { legal: -10, wellbeing: -3, flags: { missedCheckIn: true } }, 'You promised yourself you would deal with it.', 'Check-in deadlines are tied to your program start date. Missing them can put your record at risk.'),
        },
      ),
    ],
  })),

  def('winter-break', 'life', 0, (s) => {
    const cu = cultureOf(s.profile.country);
    const cost = Math.round((cu?.roundTripFlightUsd ?? 1400) * priceFactor(s.profile.arrivalYear));
    return {
      id: 'winter-break',
      track: 'life',
      title: 'Winter break: home or stay?',
      body: `Classes pause for three weeks and your family wants you home. Getting there is ${cu?.homeTravelNote ?? 'a long trip'}, and a round trip costs roughly ${money(cost)} (a designed estimate). Travel with a current travel signature on your I-20 (check with your international office).`,
      stage: 'airport',
      cast: [{ ...YOU, pose: 'carry' }, { role: 'friend', pose: 'wave' }],
      fact: 'time-difference',
      choices: [
        c(
          'fly-home',
          'Fly home to see your family.',
          ok('Three weeks of home food, family and sleep. The return trip goes smoothly.', { money: -cost, family: 12, wellbeing: 9 }),
          {
            note: `About ${money(cost)}`,
            roll: { base: 90, mods: [legal()] },
            fail: bad('On the way back, a records problem delays your return by two weeks. You miss the first classes and scramble to catch up.', { money: -cost, family: 10, wellbeing: -5, study: -7 }, 'Travel always carries some risk of delay.'),
          },
        ),
        c('stay-work', 'Stay and pick up extra campus work and study time.', ok('The campus is quiet. You earn a little and get ahead, but the evenings are lonely.', { money: 180, study: 4, family: -8, wellbeing: -5 }), { note: 'Saves the fare' }),
        c('stay-friends', 'Stay and travel with friends instead.', ok('A road trip with new friends. You do not feel as far from home.', { money: -170, community: 7, wellbeing: 5, family: -5 })),
      ],
    };
  }, { months: [4] }),

  def('tax-8843', 'status', 0, () => ({
    id: 'tax-8843',
    track: 'status',
    title: 'Spring paperwork: taxes',
    body: 'A classmate mentions "tax forms for international students". You earned little or nothing, so you assume it does not apply to you.',
    stage: 'library',
    cast: [{ ...YOU, pose: 'think' }, { role: 'friend', pose: 'talk' }],
    choices: [
      c('free-help', 'Use your school\'s free international-student tax help.', ok('A volunteer walks you through the forms and you file correctly. A weight lifts.', { legal: 3, wellbeing: 2 })),
      c(
        'skip-tax',
        'Skip it. No income means no forms.',
        ok('Nothing happens this year.', { legal: 0 }),
        {
          roll: { base: 55 },
          fail: bad('Months later a notice arrives about a missing filing. Sorting it out takes weeks.', { legal: -4, wellbeing: -4 }, 'You could have asked someone earlier.', 'Many international students are expected to file a form even with no income (IRS Form 8843). Check IRS guidance or your school\'s tax help.'),
        },
      ),
      c('paid-preparer', 'Pay a street-corner preparer who promises a big refund.', bad('The preparer takes a fee, files confusing paperwork and you spend weeks fixing it.', { money: -300, wellbeing: -5 }, 'It was an expensive way to learn.')),
    ],
  }), { months: [8] }),

  def('internship-cpt', 'work', 0, () => ({
    id: 'internship-cpt',
    track: 'work',
    title: 'A summer internship offer',
    body: 'A company offers you a paid summer internship. The recruiter wants an answer this week. You are not sure what your visa allows.',
    stage: 'careerfair',
    cast: [{ ...YOU, pose: 'talk' }, { role: 'recruiter', pose: 'talk' }],
    inlineFact: FACT_CPT,
    choices: [
      c(
        'ask-dso',
        'Ask the international office what you are eligible for before accepting.',
        ok('The office finds a path: you are authorized for next summer and the recruiter agrees to wait. Your career path now has a real next step.', { career: 7, legal: 3, community: 1 }),
        {
          roll: { base: 50, mods: [study()] },
          fail: bad('The advisor explains you are not eligible yet. You thank the recruiter, who invites you to apply again next year.', { career: 2, community: 1 }, 'A little disappointing, but you asked the right question.'),
        },
      ),
      c(
        'start-now',
        'Accept and start now, sorting the paperwork out later.',
        bad('The summer pays and the experience is real. You keep quiet about it when friends ask how you got the job.', { career: 10, money: 900, legal: -10, flags: { unauthWork: true } }, 'Something about this keeps nagging at you.', 'Off-campus work needs prior authorization: CPT may begin only after your school endorses your I-20 (8 CFR 214.2(f)(10)(i)). Unauthorized employment counts as failing to maintain status (8 CFR 214.1(e)(2)).'),
      ),
      c('campus-research', 'Find on-campus summer research instead.', ok('A professor takes you on for the summer. It is lower pay, but safe and useful.', { career: 4, money: 450, study: 3 })),
    ],
  }), { months: [10] }),

  def('era-event', 'era', 0, (s) => {
    const rng = createSeededRandom(s.seed + 77);
    // News is chosen and worded for the status the player holds now, not the route they arrived on.
    const st = statusOf(s);
    const student = st === 'F1';
    const dso = st === 'F1' || st === 'OPT' || st === 'STEM_OPT';
    const groups = student ? ['F-1', 'OPT'] : dso ? ['OPT'] : st === 'H1B' ? ['H-1B'] : st === 'B2' ? ['B-1/B-2'] : [];
    const ev = eraFor(s.profile.arrivalYear, rng, groups);
    const office = dso ? 'the international office' : st === 'H1B' || st === 'O1' ? "your employer's immigration lawyer" : 'a legal aid clinic';
    const peers = student ? 'other students' : 'others in the same position';
    const group = student ? 'a student group' : 'a community group';
    const stage = student ? 'campus' : 'cafe';
    const cast = [{ ...YOU, pose: 'think' as const }, { role: 'friend' as const, pose: 'talk' as const }, { role: (student ? 'student' : 'stranger') as 'student' | 'stranger', pose: 'talk' as const }];
    if (!ev) {
      return {
        id: 'era-event',
        track: 'era',
        title: 'In the news: a changing job market',
        body: `Headlines say hiring is shifting and visa rules may change. ${student ? 'Students in your program are' : 'People you know on visas are'} anxious, and nobody is sure what is coming.`,
        stage,
        cast,
        choices: [
          c('advice', 'Attend a career and visa information session.', ok(`You leave with a clearer picture and a list of questions for ${office}.`, { career: 3, legal: 2 })),
          student
            ? c('ignore', 'Ignore the noise and focus on classes.', ok('You keep your head down and your grades up.', { study: 3, career: -1 }))
            : c('ignore', 'Ignore the noise and focus on your days.', ok('You keep your head down and your routine steady.', { wellbeing: 2, career: -1 })),
          c('group', `Join ${group} sharing information.`, ok('Shared notes and shared worries. It helps to know others are in the same position.', { community: 4, wellbeing: 2, ...(student ? { study: -1 } : {}) })),
        ],
      };
    }
    const e = ev.effect;
    const scale = (f: number): Effects => ({
      legal: Math.round((e.legal ?? 0) * f),
      career: Math.round((e.career ?? 0) * f),
      wellbeing: Math.round((e.wellbeing ?? 0) * f),
      community: Math.round((e.community ?? 0) * f),
      money: Math.round((e.money ?? 0) * f * 50),
    });
    const positive = ev.tone === 'opportunity';
    const pending = ev.pending ? ' This was still unsettled as of November 2026.' : '';
    const lookback = `${ev.title}: ${ev.summary}${pending}`;
    return {
      id: 'era-event',
      track: 'era',
      title: `In the news: ${ev.title}`,
      body: `${ev.summary}${pending}`,
      stage,
      cast,
      inlineFact: { id: ev.id, title: ev.title, text: ev.summary, source: ev.source, confidence: ev.confidence, estimate: false },
      choices: positive
        ? [
            c('act', 'Act on it: read the details and use the opening.', ok('You read the rules, use the opening and come out ahead.', scale(1.4), lookback)),
            c('ignore', 'Let it pass.', ok('You miss most of the benefit, but nothing is lost.', scale(0.3), lookback)),
            c('share', `Share what you learn with ${peers}.`, ok('You help others and earn some goodwill.', { ...scale(0.8), community: 4 }, lookback)),
          ]
        : [
            c('guidance', `Read the official guidance and talk to ${office}.`, ok('Knowing the rules softens the blow. You adjust early.', scale(0.5), lookback)),
            c('ignore', `Ignore the headlines and keep ${student ? 'studying' : 'going'}.`, bad('You find out the details late, which makes the impact harder.', scale(1), 'Maybe you should have paid attention sooner.', lookback)),
            c('group', `Join ${group} working through it together.`, ok('Shared information and shared worry. You are less alone.', { ...scale(0.6), community: 4, ...(student ? { study: -1 } : {}) }, lookback)),
          ],
    };
  }, { months: [2, 3, 5, 6, 7, 9, 11] }),

  // ------------------------------------------------------------------ pool: status and study
  def('courseload', 'status', 1.2, () => ({
    id: 'courseload',
    track: 'status',
    title: 'Too much on your plate',
    body: 'Courses, a job search and homesickness collide. You think about dropping a course to free up time. Nobody has told you what that would mean for your visa.',
    stage: 'library',
    cast: [{ ...YOU, pose: 'think' }, { role: 'friend', pose: 'talk' }],
    inlineFact: FACT_RCL,
    choices: [
      c('full', 'Stay at a full course load and push through.', ok('It is a hard month, but you get through it.', { study: 2, wellbeing: -5, legal: 1 })),
      c('drop', 'Drop a course quietly to free up time.', bad('You feel lighter at once. You do not mention it to anyone.', { study: 4, wellbeing: 6, legal: -12, flags: { droppedLoad: true } }, 'A small voice asks whether that was really allowed.', 'Dropping below a full course of study without prior DSO approval is considered out of status (8 CFR 214.2(f)(6)). A reduced load needs your school\'s approval first.')),
      c(
        'ask',
        'Ask the international office whether any approved reduction applies.',
        ok('The advisor listens and approves a short, documented reduction. You get breathing room.', { wellbeing: 8, study: 2, legal: 1 }),
        {
          roll: { base: 40, mods: [well('stress level')] },
          fail: bad('The advisor explains you do not qualify and walks you through catching up instead.', { wellbeing: -3, study: 1 }, 'At least you asked.'),
        },
      ),
    ],
  }), { months: [1, 2, 3, 5, 6, 7, 9] }),

  def('first-exams', 'study', 1.2, () => ({
    id: 'first-exams',
    track: 'study',
    title: 'First midterms',
    body: 'American courses grade continuously: quizzes, group projects, class participation. Your first midterms are this week and the style is new.',
    stage: 'classroom',
    cast: [{ ...YOU, pose: 'type' }, { role: 'professor', pose: 'idle' }, { role: 'student', pose: 'type' }],
    choices: [
      c(
        'group',
        'Join a study group and go to office hours.',
        ok('Explaining things aloud locks them in. The exam goes well and you make friends.', { study: 6, community: 3 }),
        { roll: { base: 72, mods: [study()] }, fail: bad('The exam goes better than you feared, but not as well as you hoped.', { study: 2, wellbeing: -3 }, 'You wonder what you missed.') },
      ),
      c(
        'alone',
        'Cram alone, the way you did back home.',
        ok('The old method still works. You are tired but fine.', { study: 4, wellbeing: -4 }),
        { roll: { base: 52, mods: [study(), well()] }, fail: bad('The questions ask you to apply ideas, not recall them. Your score is a warning.', { study: -3, wellbeing: -5 }, 'The way you studied may not have fit this exam.') },
      ),
      c('work-instead', 'Skip prep to cover extra work shifts.', bad('The money helps. The exam does not go well.', { study: -7, money: 220 }, 'You knew it was a trade-off.')),
    ],
  }), { months: [1, 2, 3, 9], when: (s) => s.year === 0 }),

  def('address-change', 'status', 1, () => ({
    id: 'address-change',
    track: 'status',
    title: 'You move apartments',
    body: 'A better apartment opens up and you move. Your school keeps your U.S. address in the system that tracks your F-1 record, so the international office needs to hear about the move.',
    stage: 'apartment',
    cast: [{ ...YOU, pose: 'carry' }, { role: 'roommate', pose: 'wave' }],
    inlineFact: FACT_ADDR,
    choices: [
      c('update', 'Update your address with the office right away.', ok('A five-minute form. Your record now matches reality.', { legal: 3 })),
      c(
        'forget',
        'Forget about it. You have boxes to unpack.',
        ok('Nothing seems to happen.', { legal: -1 }),
        { roll: { base: 68 }, fail: bad('A letter goes to your old address. You do not hear about it until much later.', { legal: -6, wellbeing: -3 }, 'You meant to deal with that.', 'Schools update your U.S. address in SEVIS within 21 days of a change (8 CFR 214.3(g)), so a stale address can leave gaps in your record. Tell the office when you move.') },
      ),
    ],
  }), { months: [1, 2, 3, 5, 6, 7, 9] }),

  def('conference', 'study', 1, (s) => ({
    id: 'conference',
    track: 'study',
    title: 'Present at a conference',
    body: 'Your professor invites you to present a poster. One conference is in a US city. The other, in Toronto, is better known. Leaving and re-entering the US requires a valid visa and normally a current travel signature on your I-20, so ask your international office before you book.',
    stage: 'conference',
    cast: [{ ...YOU, pose: 'present' }, { role: 'professor', pose: 'talk' }, { role: 'student', pose: 'idle' }],
    choices: [
      c('domestic', 'Go to the US conference.', ok('A busy few days. You come back with contacts and a stronger résumé.', { money: -Math.round(450 * priceFactor(s.profile.arrivalYear)), career: 6, study: 2, community: 3 })),
      c(
        'abroad',
        'Go to Toronto.',
        ok('The talk goes well and the return to the US is smooth.', { money: -Math.round(700 * priceFactor(s.profile.arrivalYear)), career: 8, study: 2 }),
        {
          roll: { base: 82, mods: [legal()] },
          fail: bad('At the border on the way back you are held for extra questions and a records check. You get home days late and shaken.', { money: -Math.round(900 * priceFactor(s.profile.arrivalYear)), career: 4, wellbeing: -6, study: -3 }, 'Travel is rarely risk-free.'),
        },
      ),
      c('decline', 'Decline and focus on coursework.', ok('A missed chance, but your grades are safe.', { study: 1 })),
    ],
  }), { months: [5, 6, 7, 9] }),

  def('lab-pressure', 'study', 1.5, () => ({
    id: 'lab-pressure',
    track: 'study',
    title: 'The advisor wants more',
    body: 'Your assistantship counts as on-campus work. Your advisor expects long weekends and sends emails at midnight. You do not want to seem ungrateful.',
    stage: 'lab',
    cast: [{ ...YOU, pose: 'type' }, { role: 'advisor', pose: 'talk' }],
    choices: [
      c(
        'boundaries',
        'Set polite boundaries about hours.',
        ok('Your advisor nods and adjusts. You feel respected and more focused.', { wellbeing: 4, study: 2 }),
        { roll: { base: 55, mods: [study()] }, fail: bad('Your advisor is cool toward you for a week. The lab feels colder.', { career: -3, wellbeing: -2 }, 'Maybe the conversation could have gone differently.') },
      ),
      c('overtime', 'Accept the overtime.', ok('The lab notices your dedication. You are exhausted.', { study: -3, wellbeing: -6, career: 4 })),
      c('grad-office', 'Quietly ask the graduate office what is normal.', ok('You learn the norms and your options without making a scene.', { wellbeing: 2, career: 1 })),
    ],
  }), { when: (s) => s.profile.funding === 'assistantship' }),

  def('scholarship-review', 'study', 1.5, () => ({
    id: 'scholarship-review',
    track: 'study',
    title: 'Scholarship check-in',
    body: 'Your scholarship renews only if your grades stay above a threshold and you remain a full-time student. The review is next month.',
    stage: 'intl-office',
    cast: [{ ...YOU, pose: 'idle' }, { role: 'advisor', pose: 'talk' }],
    choices: [
      c(
        'plan',
        'Meet your advisor and make a study plan.',
        ok('The advisor sees the effort and signs off. You are on track.', { study: 4, career: 2 }),
        { roll: { base: 60, mods: [study()] }, fail: bad('The advisor tells you you are on probation. One more bad term and the scholarship ends.', { study: 1, wellbeing: -6, money: -200 }, 'It might have helped to start the conversation sooner.') },
      ),
      c('hope', 'Hope your grades speak for themselves.', ok('They do, barely.', { study: 1 }), { roll: { base: 45, mods: [study()] }, fail: bad('They did not. You are told you are on probation.', { wellbeing: -6, money: -200 }, 'Hoping was not enough.') }),
    ],
  }), { when: (s) => s.profile.funding === 'scholarship' }),

  // ------------------------------------------------------------------ pool: work and money
  def('campus-job', 'work', 1.5, () => ({
    id: 'campus-job',
    track: 'work',
    title: 'Money feels tight',
    body: 'A lab offers about ten hours a week on campus. A restaurant owner nearby offers more hours for cash and no questions. Your savings are shrinking faster than you planned.',
    stage: 'cafe',
    cast: [{ ...YOU, pose: 'idle' }, { role: 'owner', pose: 'talk' }],
    inlineFact: FACT_WORK,
    choices: [
      c('on-campus', 'Take the on-campus job.', ok('Pay arrives each month and the lab is a good network. It is less than the cash job, but you sleep well.', { career: 4, study: -1, flags: { campusJob: true } })),
      c('cash-job', 'Take the cash job.', bad('The money helps right away. The owner pays at the end of every shift and does not ask for paperwork.', { money: 300, wellbeing: -2, legal: -8, flags: { unauthWork: true } }, 'You tell yourself it is only for a while.', 'Off-campus work needs authorization; unauthorized employment counts as failing to maintain F-1 status (8 CFR 214.1(e)(2), 214.2(f)(9)). Cash work can also mean no wage protections.')),
      c('decline', 'Decline both and tighten your budget.', ok('You cut costs and protect your study time.', { study: 2, wellbeing: -2 })),
    ],
  }), { when: (s) => s.profile.funding !== 'assistantship', months: [1, 2, 3, 5, 6, 7, 9] }),

  def('scam-call', 'work', 1.2, () => ({
    id: 'scam-call',
    track: 'work',
    title: 'A threatening phone call',
    body: 'A caller says they are from immigration. You owe fees and will be deported unless you pay today in gift cards or by transfer. The voice is calm and sounds official. Your hands are shaking.',
    stage: 'apartment-night',
    cast: [{ ...YOU, pose: 'phone' }],
    choices: [
      c('hang-up', 'Hang up and call your international office.', ok('The office tells you it is a scam and has heard of it before. You warn your friends.', { legal: 2, wellbeing: 2, community: 2 })),
      c(
        'argue',
        'Stay on the line to argue.',
        ok('You hang up before giving anything away. Your heart is still racing.', { wellbeing: -2 }),
        {
          roll: { base: 68, mods: [well()] },
          fail: bad('You slip and share personal details. A few days later money disappears from your account.', { money: -250, wellbeing: -7 }, 'You should have hung up sooner.', 'Callers who demand immediate payment by gift card or transfer are a classic scam. Hang up and verify with your international office.'),
        },
      ),
      c('pay', 'Pay to make it go away.', bad('The caller thanks you, and calls again the next day for more.', { money: -600, wellbeing: -8, legal: -2 }, 'Your stomach sinks.', 'Callers who demand immediate payment by gift card or transfer are a classic scam. Hang up and verify with your international office.')),
    ],
  }), { months: [2, 3, 5, 6, 7, 9, 11] }),

  def('health-visit', 'work', 1.1, () => ({
    id: 'health-visit',
    track: 'work',
    title: 'You get sick',
    body: 'A fever and a bad cough hit midweek. US healthcare is expensive and the options are confusing: campus clinic, urgent care, emergency room, or waiting it out.',
    stage: 'clinic',
    cast: [{ ...YOU, pose: 'sit' }, { role: 'nurse', pose: 'talk' }, { role: 'doctor', pose: 'idle' }],
    choices: [
      c('campus', 'Go to the campus health center.', ok('The visit is cheap and quick, and you are back on your feet.', { money: -40, wellbeing: 3 })),
      c('urgent', 'Go to urgent care.', ok('Fast, but you pay for the speed.', { money: -180, wellbeing: 3 })),
      c('er', 'Go to the emergency room.', bad('It was not an emergency, and a bill arrives weeks later.', { money: -900, wellbeing: -3 }, 'You wonder whether there was a cheaper way.')),
      c('wait', 'Wait it out.', ok('You recover after a rough week.', { wellbeing: -2, study: -1 }), {
        roll: { base: 55, mods: [well()] },
        fail: bad('It gets worse, and you end up in the emergency room anyway.', { money: -900, wellbeing: -8, study: -4 }, 'Waiting made it harder.'),
      }),
    ],
  }), { months: [2, 3, 5, 6, 7, 9, 11] }),

  def('rent-hike', 'work', 1.1, (s) => {
    const city = getCity(s.profile.cityId);
    const rent = srcNum(city.rentOneBedroom, 1800).value;
    const amt = Math.round(rent * 0.08 * priceFactor(s.profile.arrivalYear));
    return {
      id: 'rent-hike',
      track: 'work',
      title: 'The rent goes up',
      body: `Your landlord announces a rent increase of about ${money(amt)} a month. In ${city.name}, rents have been moving fast.`,
      stage: 'apartment',
      cast: [{ ...YOU, pose: 'think' }, { role: 'landlord', pose: 'talk' }],
      choices: [
        c('tighten', 'Tighten your belt.', ok('Fewer meals out and one fewer trip. It stings but you manage.', { money: -amt, wellbeing: -3 })),
        c('ask-family', 'Ask your family for help.', ok('They send the money without a word. You feel the weight of it.', { money: Math.round(amt * 3), family: -4, wellbeing: 2 })),
        c('card', 'Put the shortfall on a credit card.', bad('It works for now, but you keep thinking about the interest.', { money: -amt, debt: Math.round(amt * 3), wellbeing: -2 }, 'That will follow you for a while.')),
      ],
    };
  }, { months: [2, 3, 5, 6, 7, 9, 11] }),

  def('loan-emi', 'work', 1.5, () => ({
    id: 'loan-emi',
    track: 'work',
    title: 'The loan statement',
    body: 'The first education loan statement arrives. Interest is building, your family co-signed, and they worry quietly about it.',
    stage: 'bank',
    cast: [{ ...YOU, pose: 'idle' }, { role: 'teller', pose: 'talk' }],
    choices: [
      c('pay-interest', 'Pay the interest on time from your savings.', ok('It stings, but the balance stops growing as fast.', { money: -150, family: 3 })),
      c('defer', 'Skip this month and hope to catch up.', bad('The interest builds and your family notices the late notice.', { debt: 150, family: -4, wellbeing: -3 }, 'You were hoping nobody would notice.')),
      c('ask-family', 'Ask your family to cover this month.', ok('They cover it quietly, and you feel the weight.', { money: 150, family: -3 })),
    ],
  }), { when: (s) => s.profile.funding === 'loan' }),

  def('job-fair', 'work', 1, () => ({
    id: 'job-fair',
    track: 'work',
    title: 'The career fair',
    body: 'Booths line the gym. Several recruiters smile, then say "we don\'t sponsor visas". Others say the opposite. You are a first-year student and the job market feels far off.',
    stage: 'careerfair',
    cast: [{ ...YOU, pose: 'talk' }, { role: 'recruiter', pose: 'talk' }, { role: 'student', pose: 'idle' }],
    choices: [
      c('ask-around', 'Talk to everyone and ask about sponsorship honestly.', ok('You learn which companies hire international students and how timelines work.', { career: 5, community: 2 })),
      c('walk', 'Take a look and take notes.', ok('You see the landscape and leave your résumé at two booths.', { career: 2 })),
      c('skip', 'Skip it. Too early for that.', ok('You save a morning and lose a chance.', { study: 2, career: -1 })),
    ],
  }), { months: [1, 2, 9] }),

  // ------------------------------------------------------------------ pool: life
  def('homesick', 'life', 1.2, () => ({
    id: 'homesick',
    track: 'life',
    title: 'Dark at five',
    body: 'The days are short and the apartment is quiet. Your family is roughly ten to thirteen hours ahead, depending on your city, so your mornings are their nights. You miss food, noise and people.',
    stage: 'apartment-night',
    cast: [{ ...YOU, pose: 'phone' }, { role: 'parent', pose: 'talk' }],
    fact: 'time-difference',
    choices: [
      c('call', 'Call home at the hour that suits them.', ok('It is late for you, but your mother\'s voice and the noise behind her help.', { family: 5, wellbeing: 5, study: -2 })),
      c('dinner', 'Go to an international students dinner.', ok('You find people who understand. Someone shares a recipe you can actually make.', { community: 5, wellbeing: 4, money: -15 })),
      c('stay-in', 'Stay in and study.', ok('You get ahead in class and feel the distance more.', { study: 3, wellbeing: -4, family: -2 })),
    ],
  }), { months: [2, 3, 5, 6, 9] }),

  def('student-assoc', 'life', 1, (s) => ({
    id: 'student-assoc',
    track: 'life',
    title: 'A festival away from home',
    body: `The ${cultureOf(s.profile.country)?.studentAssociation ?? 'international students\' association'} is organizing a night with food, music and volunteers needed. It has been a while since you heard your language in a crowd.`,
    stage: 'festival',
    cast: [{ ...YOU, pose: 'cheer' }, { role: 'friend', pose: 'wave' }, { role: 'student', pose: 'talk' }],
    choices: [
      c('volunteer', 'Volunteer to help organize.', ok('You meet half the campus while hauling tables. It feels like a small version of home.', { community: 8, wellbeing: 4, study: -2, money: -20 })),
      c('attend', 'Attend for an hour.', ok('A good evening and a few new contacts.', { community: 3, wellbeing: 2 })),
      c('skip', 'Skip it. Assignments are due.', ok('You submit early and feel a little more alone.', { study: 2, community: -2 })),
    ],
  }), { months: [1, 2, 5, 6, 7, 9] }),

  def('family-call', 'life', 1, () => ({
    id: 'family-call',
    track: 'life',
    title: 'Family expectations',
    body: 'Your parents ask when you will visit, and your uncle asks whether you can send money for a cousin\'s wedding. In many families, a child abroad is expected to be both successful and generous.',
    stage: 'apartment-night',
    cast: [{ ...YOU, pose: 'phone' }, { role: 'parent', pose: 'talk' }],
    choices: [
      c('send', 'Send what you can.', ok('Your mother cries on the call. It is only a small gift, but it means a lot.', { money: -200, family: 6, wellbeing: 2 })),
      c('explain', 'Explain your student budget honestly.', ok('There is silence, then understanding. They did not realize how little you earn.', { family: 1, wellbeing: 2 })),
      c('avoid', 'Avoid the call this week.', bad('The silence is noticed.', { family: -6, wellbeing: -2 }, 'You feel the distance more than usual.')),
    ],
  }), { months: [1, 2, 3, 5, 6, 7, 9, 11] }),

  def('dating', 'life', 1.3, () => ({
    id: 'dating',
    track: 'life',
    title: 'Someone catches your eye',
    body: 'In your lab or at an event you keep running into someone with an easy laugh. Dating in a new country means new norms and new nerves.',
    stage: 'park',
    cast: [{ ...YOU, pose: 'talk' }, { role: 'partner', pose: 'talk' }],
    choices: [
      c(
        'coffee',
        'Ask them for coffee.',
        ok('Coffee turns into dinner turns into long walks. You do not feel like a visitor tonight.', { wellbeing: 7, community: 4, study: -1, flags: { dating: true } }),
        { roll: { base: 52, mods: [well('confidence'), social()] }, fail: bad('It is awkward. You laugh about it later with friends, but it stings.', { wellbeing: -3 }, 'Maybe next time.') },
      ),
      c('friends', 'Keep it friendly and go in a group.', ok('A pleasant evening and a slow-building friendship.', { community: 4, wellbeing: 2 })),
      c('focus', 'Focus on your studies for now.', ok('A quiet sacrifice for your goals.', { study: 3, wellbeing: -1 })),
    ],
  }), { when: (s) => s.profile.marital === 'single' }),

  def('spouse-f2', 'life', 1.5, () => ({
    id: 'spouse-f2',
    track: 'life',
    title: 'Your spouse is restless',
    body: '{partner}, your spouse, came with you on a dependent visa. They are bored, isolated and worried about money. A neighbor mentions cash work that "nobody checks".',
    stage: 'apartment',
    cast: [{ ...YOU, pose: 'talk' }, { role: 'spouse', pose: 'think' }],
    inlineFact: FACT_F2,
    choices: [
      c('community', 'Help them find volunteering and community classes.', ok('A community center takes them in. They find friends, purpose and a daily rhythm.', { wellbeing: 5, community: 4, family: 3 })),
      c('cash', 'Let them take the cash work.', bad('The money helps your budget. Your spouse does not talk much about the job.', { money: 450, legal: -10, wellbeing: -2, flags: { unauthWork: true } }, 'You both avoid the subject.', 'F-2 dependents may not accept employment (8 CFR 214.2(f)(15)). Work without authorization can endanger both your statuses.')),
      c('extra', 'Take extra on-campus hours yourself.', ok('You spend less time at home but the budget holds.', { money: 250, study: -2, family: -2 })),
    ],
  }), { when: (s) => s.profile.marital === 'married' }),

  def('long-distance', 'life', 1.4, () => ({
    id: 'long-distance',
    track: 'life',
    title: 'Distance wears at the relationship',
    body: '{partner} is far away and the time difference makes every call a negotiation. Plans for the future keep slipping.',
    stage: 'apartment-night',
    cast: [{ ...YOU, pose: 'phone' }, { role: 'partner', pose: 'talk' }],
    choices: [
      c('schedule', 'Set a fixed weekly call and honor it.', ok('A ritual you both can count on. It is not the same as being together, but it holds.', { family: 3, wellbeing: 4, study: -1 })),
      c('visit-plan', 'Start saving for a visit.', ok('The goal helps you both hold on.', { money: -120, wellbeing: 3 })),
      c('drift', 'Let it drift while you focus.', bad('Messages get shorter. The silence grows.', { wellbeing: -5, family: -3 }, 'Something is slipping.')),
    ],
  }), { when: (s) => s.profile.marital === 'partnered' }),

  def('roommate', 'life', 1.2, () => ({
    id: 'roommate',
    track: 'life',
    title: 'A roommate problem',
    body: '{roommate}\'s friends keep staying over and the landlord has noticed extra people. Dishes pile up and your sleep suffers.',
    stage: 'apartment',
    cast: [{ ...YOU, pose: 'talk' }, { role: 'roommate', pose: 'talk' }],
    choices: [
      c('talk', 'Have a calm house meeting.', ok('You agree on rules and the air clears.', { wellbeing: 4, community: 2 }), { roll: { base: 62, mods: [well()] }, fail: bad('It turns tense. The two of you barely speak for weeks.', { wellbeing: -4 }, 'It might have gone better with a different approach.') }),
      c('move-out', 'Find a new place and move out.', ok('Fresh start, but you lose your deposit.', { money: -400, wellbeing: 4 })),
      c('ignore', 'Ignore it and wear earplugs.', bad('Resentment builds and so does the tension.', { wellbeing: -4, study: -2 }, 'This is not going away on its own.')),
    ],
  }), { when: (s) => s.profile.housing === 'shared' }),

  def('commute-shock', 'life', 1.1, (s) => {
    const info = commuteInfo(s.profile, s.profile.commute);
    const city = getCity(s.profile.cityId);
    return {
      id: 'commute-shock',
      track: 'life',
      title: 'The commute fights back',
      body: `Your usual ${info.mode === 'transit' ? 'transit route' : info.mode} to campus runs into trouble. ${city.weather ? `Weather in ${city.name}: ${city.weather}.` : ''} The trip usually takes about ${info.minutesOneWay} minutes each way.`,
      stage: 'street',
      cast: [{ ...YOU, pose: 'idle' }, { role: 'stranger', pose: 'idle' }],
      choices: [
        c('switch', 'Pay for a quicker option this month.', ok('It costs more but you get to class on time.', { money: -80, study: 1 })),
        c('tough', 'Tough it out.', ok('You arrive late and wet, but you arrive.', { wellbeing: -4 })),
        c('remote', 'Study from home for a couple of days.', ok('You catch up on reading, then miss a class discussion.', { study: -1, wellbeing: 1 })),
      ],
    };
  }, { months: [2, 3, 5, 6, 7, 9], when: (s) => s.year === 0 }),

  // Opens every year after the first.
  def('new-year', 'life', 0, (s) => ({
    id: 'new-year',
    track: 'life',
    title: `Year ${s.year + 1} begins`,
    body: 'A new academic year starts. You know the campus now, the shortcuts and the people. The questions are bigger than they were: money, work, where this is going. You can only lean into some of it.',
    stage: 'campus',
    cast: [{ ...YOU, pose: 'idle' }, { role: 'friend', pose: 'wave' }, { role: 'student', pose: 'talk' }],
    choices: [
      c('grades', 'Focus on grades and find a research mentor.', ok('A professor takes you seriously. The workload is real, and so is the progress.', { study: 5, wellbeing: -2 })),
      c('network', 'Build a professional network through clubs and events.', ok('Coffee chats turn into introductions. Your calendar fills up fast.', { career: 5, community: 3, wellbeing: -1 })),
      c('balance', 'Protect time for friends, family and rest.', ok('Calls home, long dinners, one real day off a week. You feel steadier.', { wellbeing: 5, family: 2, community: 2 })),
      c('budget', 'Plan the budget and hunt for savings.', ok('A spreadsheet and a few phone calls trim what you pay each month.', { money: 180, wellbeing: -1 })),
    ],
  })),
];

export const CHALLENGES: ChallengeDef[] = [...CORE, ...MORE_CHALLENGES, ...OUT_OF_STATUS_CHALLENGES];
