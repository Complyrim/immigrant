import { bad, c, def, ok } from './cx';
import { priceFactor } from './economy';
import type { ChallengeDef, GameState } from './types';

const YOU = { role: 'player' } as const;
const m = (n: number, y: number): number => Math.round(n * priceFactor(y));
const oos = (s: GameState): boolean => Boolean(s.flags.outOfStatus);

const REASON_TEXT: Record<string, string> = {
  'reduced-load': 'Your school reported that you dropped below a full course load without approval, and ended your student record.',
  'unauthorized-work': 'After reports of work without authorization, your school ended your student record.',
  'sevis-check-in': 'Because you missed the required check-in, your school ended your student record.',
  dismissed: 'After the academic dismissal, your school ended your student record.',
  legal: 'Your school ended your student record.',
};

/**
 * Cards for the path after a student record ends. The journey does not stop here:
 * the player can survive, look for ways back into status, or go home.
 */
export const OUT_OF_STATUS_CHALLENGES: ChallengeDef[] = [
  def('oos-aftermath', 'life', 0, (s) => ({
    id: 'oos-aftermath',
    track: 'life',
    title: 'The email you hoped would not come',
    body: `${REASON_TEXT[String(s.flags.statusLostReason ?? 'legal')] ?? REASON_TEXT.legal} You are not a student in the eyes of the system any more. Your room feels very quiet.`,
    stage: 'apartment-night',
    cast: [{ ...YOU, pose: 'think' }],
    choices: [
      c('tell-family', 'Tell your family the truth.', ok('There is a long silence on the line. Then your mother says you are still their child. Your father asks how he can help.', { family: -4, wellbeing: 4 })),
      c('tell-friend', 'Tell one close friend.', ok('Your friend does not flinch. They offer their couch and their phone number for a clinic they know.', { community: 3, wellbeing: 4 })),
      c('hide', 'Tell no one.', bad('You smile at everyone and go home exhausted. The secret sits in your chest.', { wellbeing: -6, community: -2 }, 'Carrying this alone is heavy.')),
    ],
  }), { when: oos }),

  def('oos-consult', 'status', 0, (s) => {
    const dating = Boolean(s.flags.dating);
    return {
      id: 'oos-consult',
      track: 'status',
      title: 'A free legal clinic',
      body: 'A free legal clinic that works with students has an opening this week. The attorney asks what happened and what you want, then explains what is realistic. Nothing is guaranteed.',
      stage: 'intl-office',
      cast: [{ ...YOU, pose: 'talk' }, { role: 'advisor', pose: 'talk' }],
      choices: [
        c(
          'all-options',
          'Ask for all your options, including the unpleasant ones.',
          ok(
            `The attorney lays it out: ${s.flags.canReinstate ? 'a request to reinstate your student status may be possible, but only within a short window and only if you have not worked without permission; ' : 'reinstatement does not look possible in your case; '}${dating ? 'a relationship with a US citizen could eventually matter; ' : ''}leaving is always an option; and staying out of status carries risks every month.`,
            { wellbeing: 3, legal: 6, flags: { legalHelp: true } },
            'Free and low-cost legal help exists for students whose records have ended (use a licensed attorney or an accredited organization). Reinstatement is open only to students who did not work without authorization and who ask within about 5 months, and a denial cannot be appealed (8 CFR 214.2(f)(16)).',
          ),
        ),
        c('only-stay', 'Ask only how to stay.', ok('The attorney answers honestly but carefully: no one can promise you that.', { wellbeing: 1, legal: 3, flags: { legalHelp: true } })),
        c('skip', 'Cancel. It feels too frightening.', bad('You tell yourself you will go next month.', { wellbeing: -3 }, 'Time may matter here more than you feel.')),
      ],
    };
  }, { when: (s) => oos(s) && !s.flags.legalHelp }),

  def('oos-reinstate', 'status', 0, (s) => {
    const reason = String(s.flags.statusLostReason ?? '');
    const base = reason === 'reduced-load' ? 55 : 25;
    return {
      id: 'oos-reinstate',
      track: 'status',
      title: 'Asking to be reinstated',
      body: 'Your DSO says you could ask USCIS to reinstate your student status. It needs a recommendation from the school, a form and a fee, and the answer can take months. The window is short, and a denial is final.',
      stage: 'intl-office',
      cast: [{ ...YOU, pose: 'idle' }, { role: 'dso', pose: 'talk' }],
      choices: [
        c(
          'file',
          'File the request through your DSO.',
          ok('Months later, a letter arrives. Your student status is reinstated. You breathe out for what feels like the first time in a long while.', { legal: 45, wellbeing: 12, money: -m(600, s.profile.arrivalYear), flags: { statusLost: false, outOfStatus: false, reinstated: true, status: 'F1' } }, 'USCIS may consider reinstating a student who asks within about 5 months, has not worked without authorization, and shows the violation was beyond their control or a course-load reduction a DSO could have approved (8 CFR 214.2(f)(16)).'),
          {
            roll: { base, mods: [{ stat: 'legal', center: 40, per: 0.1, label: 'record so far' }], flagMods: [{ flag: 'legalHelp', delta: 15, label: 'legal help' }] },
            fail: bad('A letter arrives: the request is denied. There is no appeal. You read it three times.', { wellbeing: -10, money: -m(600, s.profile.arrivalYear), flags: { reinstateDenied: true } }, 'There is nothing more to do on this road.', 'Reinstatement is discretionary and a denial cannot be appealed (8 CFR 214.2(f)(16)).'),
          },
        ),
        c('wait', 'Wait and think.', bad('The weeks slide by. The window is shrinking.', { wellbeing: -3 }, 'Some doors close slowly.')),
        c('other', 'Look for a different road instead.', ok('You decide not to try, and look at what else is possible.', { wellbeing: 1 })),
      ],
    };
  }, { when: (s) => oos(s) && Boolean(s.flags.canReinstate) && !s.flags.reinstateDenied }),

  def('oos-cash-job', 'work', 3, () => ({
    id: 'oos-cash-job',
    track: 'work',
    title: 'Cash work',
    body: 'Rent comes due whether or not you have a record. A restaurant owner and a cleaning contractor both say they can pay you in cash. Nobody asks for papers, and nobody promises they will keep paying.',
    stage: 'cafe',
    cast: [{ ...YOU, pose: 'idle' }, { role: 'owner', pose: 'talk' }],
    choices: [
      c('kitchen', 'Take the kitchen job.', ok('Twelve-hour shifts, hot steel and a staff meal at the end. The money keeps you afloat.', { wellbeing: -3, flags: { informalWork: true } })),
      c('cleaning', 'Take the cleaning job.', ok('Nights in empty offices, a bucket and silence. It pays more than you feared.', { wellbeing: -4, flags: { informalWork: true } })),
      c('hold-out', 'Hold out and live on savings.', bad('You skip a meal here and there. The savings melt quickly.', { money: -300, wellbeing: -4 }, 'You cannot hold out forever.')),
    ],
  }), { when: (s) => oos(s) && !s.flags.informalWork }),

  def('oos-wage-theft', 'work', 2, (s) => ({
    id: 'oos-wage-theft',
    track: 'work',
    title: 'The pay does not come',
    body: 'Your boss says he will pay you next week. Then next week again. Three weeks of wages are missing, and he knows you are in no position to complain.',
    stage: 'cafe',
    cast: [{ ...YOU, pose: 'talk' }, { role: 'owner', pose: 'talk' }],
    choices: [
      c('center', 'Go to a workers\' rights center and ask for advice.', ok('A volunteer explains that wage laws apply to workers regardless of status and helps you write a demand letter. The boss pays part of it.', { money: m(500, s.profile.arrivalYear), wellbeing: 4, flags: { legalHelp: true } }, 'Wage-and-hour rules protect workers regardless of immigration status, and workers\' centers help people in this position.')),
      c('confront', 'Confront your boss yourself.', bad('He shouts, says you can leave, and doesn\'t pay. You stand outside shaking.', { wellbeing: -6, money: -m(300, s.profile.arrivalYear) }, 'You wonder if there was a safer way to ask.')),
      c('walk', 'Walk away and write it off.', bad('You swallow the loss. Rent is still due.', { money: -m(600, s.profile.arrivalYear), wellbeing: -5 }, 'It was a lot of money to give up.')),
    ],
  }), { when: (s) => oos(s) && Boolean(s.flags.informalWork) }),

  def('oos-boss-threat', 'work', 2, () => ({
    id: 'oos-boss-threat',
    track: 'work',
    title: 'A threat in a friendly voice',
    body: 'You ask your boss for a day off when you are ill. He smiles and says there are plenty of people who would love your job, and that he knows who to call if there is any trouble.',
    stage: 'cafe',
    cast: [{ ...YOU, pose: 'idle' }, { role: 'owner', pose: 'talk' }],
    choices: [
      c('quiet', 'Say nothing and work through the illness.', bad('You get sicker. Nobody mentions it again.', { wellbeing: -7 }, 'Silence kept you in the job and cost you something.')),
      c('advice', 'Ask a legal aid group what you can do.', ok('They tell you threats like this are a known tactic and that you have options. It is frightening and a relief.', { wellbeing: 3, flags: { legalHelp: true } })),
      c('quit', 'Quit.', ok('You walk out with your head up and an empty wallet.', { wellbeing: 2, money: -m(200, 2025), flags: { informalWork: false } })),
    ],
  }), { when: (s) => oos(s) && Boolean(s.flags.informalWork) }),

  def('oos-passport', 'status', 1.5, () => ({
    id: 'oos-passport',
    track: 'status',
    title: 'Your passport is about to expire',
    body: 'Your passport expires in five months. Renewing it means visiting a consulate. Every office feels like a risk, even though a consulate is not an immigration agency.',
    stage: 'street',
    cast: [{ ...YOU, pose: 'think' }, { role: 'stranger', pose: 'idle' }],
    choices: [
      c('renew', 'Renew it now.', ok('The queue is long and the clerk is kind. A new passport arrives in six weeks. You feel one fear fewer.', { money: -m(150, 2025), wellbeing: 4 })),
      c('delay', 'Put it off.', bad('You tell yourself there is time. There is, for a while.', { wellbeing: -3 }, 'Expired papers make everything harder.')),
      c('ask', 'Ask a legal aid group whether it is safe.', ok('They explain how it works and what to bring.', { wellbeing: 2, flags: { legalHelp: true } })),
    ],
  }), { when: oos, months: [3, 4, 5, 6, 7, 9] }),

  def('oos-medical', 'work', 2, (s) => ({
    id: 'oos-medical',
    track: 'work',
    title: 'You are sick and have no insurance',
    body: 'A fever and a pain in your side. You have no insurance and no student health center. Every option sounds expensive.',
    stage: 'clinic',
    cast: [{ ...YOU, pose: 'sit' }, { role: 'nurse', pose: 'talk' }],
    choices: [
      c('clinic', 'Go to a community clinic with sliding-scale fees.', ok('A nurse sees you within a few hours and charges what you can pay. You leave with medicine.', { money: -m(70, s.profile.arrivalYear), wellbeing: 3 })),
      c('er', 'Go to the emergency room.', ok('They treat you, no questions about papers. A bill arrives weeks later and you stare at it for a long time.', { money: -m(1100, s.profile.arrivalYear), wellbeing: -2 }, 'Emergency rooms generally must screen and stabilize patients regardless of status or ability to pay (EMTALA), but you can still be billed.')),
      c('skip', 'Ride it out.', bad('A bad week turns into a worse one.', { wellbeing: -8, money: -m(200, s.profile.arrivalYear) }, 'You waited too long.')),
    ],
  }), { when: oos }),

  def('oos-rumor', 'life', 1.8, () => ({
    id: 'oos-rumor',
    track: 'life',
    title: 'A rumor on the street',
    body: 'People say immigration officers are checking a few blocks away. Nobody knows if it is true. Your phone fills with messages. The streets feel different.',
    stage: 'street',
    cast: [{ ...YOU, pose: 'phone' }, { role: 'stranger', pose: 'idle' }],
    choices: [
      c('stay-home', 'Stay home for a few days.', bad('You lose a few shifts and the money that goes with them. The walls feel close.', { money: -m(250, 2025), wellbeing: -4 }, 'Fear has a price too.')),
      c('routine', 'Keep your routine and stay alert.', ok('Nothing happens. Your heart does not slow for days.', { wellbeing: -3 })),
      c('workshop', 'Go to a know-your-rights workshop run by a legal aid group.', ok('A lawyer explains what your rights are in different situations, and gives you a card with a number to call. You walk home standing straighter.', { wellbeing: 5, community: 3, flags: { legalHelp: true } })),
    ],
  }), { when: oos }),

  def('oos-notario', 'work', 1.8, (s) => ({
    id: 'oos-notario',
    track: 'work',
    title: 'A fast green card for a fee',
    body: 'A "consultant" with a storefront office promises he can get you a green card in six months for $2,500, guaranteed, no lawyer needed. A friend says he helped her cousin.',
    stage: 'bank',
    cast: [{ ...YOU, pose: 'think' }, { role: 'teller', pose: 'talk' }],
    choices: [
      c('verify', 'Check with a legal aid group or an accredited representative first.', ok('They tell you the offer is almost certainly a scam and warn you about "notario" fraud. You feel lucky.', { wellbeing: 2, legal: 2, flags: { legalHelp: true } })),
      c('pay', 'Pay him. You are desperate.', bad('He takes your money, files nothing real and stops answering the phone.', { money: -m(2500, s.profile.arrivalYear), wellbeing: -10, legal: -5 }, 'You had a bad feeling the whole time.', 'Immigration fraud preys on people without status: be wary of anyone who guarantees results or asks for cash without a licensed attorney or accredited representative.')),
      c('ask-family', 'Ask your family if they think it is safe.', ok('Your uncle makes a face. Together you decide to check before paying anyone.', { family: 2, wellbeing: 1 })),
    ],
  }), { when: oos }),

  def('oos-family-pressure', 'life', 2, () => ({
    id: 'oos-family-pressure',
    track: 'life',
    title: 'Your family wants you home',
    body: 'Your mother says your father has been unwell and asks you to come home. She does not say it, but you know the question under the question: what are you really doing there?',
    stage: 'apartment-night',
    cast: [{ ...YOU, pose: 'phone' }, { role: 'parent', pose: 'talk' }],
    choices: [
      c('go-home', 'Book a flight home.', { text: 'You pack two suitcases again, the way you did years ago. At the airport your hands are steady, your heart is not.', effects: { family: 10, wellbeing: 2 }, passed: true, ends: 'went-home', lookback: 'Leaving after time out of status can matter later: unlawful presence of more than 180 days or a year can trigger a 3-year or 10-year bar on returning (INA 212(a)(9)(B)), and waivers depend on a US-citizen or resident spouse or parent. Talk to a licensed attorney before departing.' }),
      c('stay', 'Tell them you cannot come yet.', bad('Your mother says she understands. You hear her put the phone down gently.', { family: -8, wellbeing: -6 }, 'You think of what you could not say.')),
      c('wait', 'Ask them to wait a few weeks while you sort things out.', ok('They agree, reluctantly. The clock is ticking.', { family: -2, wellbeing: -2 })),
    ],
  }), { when: oos }),

  def('oos-community', 'life', 1.5, () => ({
    id: 'oos-community',
    track: 'life',
    title: 'A place to belong',
    body: 'A community center in your neighborhood hosts a weekly dinner. People from many places eat together, and no one asks for your papers. A neighbor tells you to just come.',
    stage: 'festival',
    cast: [{ ...YOU, pose: 'idle' }, { role: 'friend', pose: 'wave' }, { role: 'student', pose: 'talk' }],
    choices: [
      c('go', 'Go and stay for the whole evening.', ok('There is rice, laughter and an old woman who insists on teaching you a card game. You leave with a full stomach and three phone numbers.', { community: 7, wellbeing: 6 })),
      c('peek', 'Go, but leave early.', ok('You eat quickly and watch from the edge. It is a start.', { community: 3, wellbeing: 2 })),
      c('stay-away', 'Stay away. It is safer to be invisible.', bad('The evening is quiet and the apartment is smaller than usual.', { wellbeing: -4, community: -2 }, 'Being invisible has its own cost.')),
    ],
  }), { when: oos }),

  def('oos-marriage', 'life', 2, (s) => ({
    id: 'oos-marriage',
    track: 'life',
    title: 'A proposal',
    body: 'The person you have been seeing, who is a US citizen, asks you to marry them. You love them, and the timing is terrible. You cannot tell which part of the question is the paperwork.',
    stage: 'park',
    cast: [{ ...YOU, pose: 'talk' }, { role: 'partner', pose: 'talk' }],
    choices: [
      c(
        'marry-file',
        'Say yes, marry, and start the green card process.',
        ok('You marry in a small ceremony and start the paperwork. The interview will examine whether the marriage is real, and the process takes time. For the first time in months you see a road.', { wellbeing: 10, money: -m(1500, s.profile.arrivalYear), legal: 20, flags: { greenCardPending: true, status: 'AOS_PENDING', aosBasis: 'marriage' } }, 'Marrying a US citizen can open a green card even after a status violation, if you were inspected and admitted (INA 245(a), (c)). The marriage must be genuine, and officers examine that closely.'),
        {
          roll: { base: 72, mods: [{ stat: 'wellbeing', center: 50, per: 0.1, label: 'steadiness' }], flagMods: [{ flag: 'legalHelp', delta: 12, label: 'legal help' }] },
          fail: bad('You marry, but the paperwork is heavier than you expected and a small mistake sets you back. The strain shows in the marriage.', { wellbeing: -6, money: -m(1500, s.profile.arrivalYear), legal: 5 }, 'Love and paperwork together are hard.'),
        },
      ),
      c('wait', 'Say you love them, and ask to wait and think.', ok('They are hurt, then understanding. You talk for hours.', { wellbeing: 2, community: 1 })),
      c('no', 'Say no. You do not want papers to be the reason.', ok('It is the harder road. It feels like your own.', { wellbeing: -1 })),
    ],
  }), { when: (s) => oos(s) && !s.flags.ewi && Boolean(s.flags.dating) && !s.flags.greenCardPending }),

  def('oos-holiday-alone', 'life', 1.2, () => ({
    id: 'oos-holiday-alone',
    track: 'life',
    title: 'A holiday alone',
    body: 'The holiday season arrives. Friends fly home, the street goes quiet, and the shops close early. You cannot leave without risking never coming back.',
    stage: 'apartment-night',
    cast: [{ ...YOU, pose: 'phone' }],
    choices: [
      c('video', 'Video call your family and cook their holiday dish.', ok('You stir a pot with the phone propped on the shelf. Your grandmother tells you what you are doing wrong, and you have never been so happy to be corrected.', { family: 6, wellbeing: 5 })),
      c('friends', 'Join the neighbors who stayed.', ok('A potluck of people who could not or would not leave. You are not the only one.', { community: 6, wellbeing: 4 })),
      c('work', 'Pick up extra shifts.', ok('The money helps. The day passes.', { money: m(120, 2025), wellbeing: -3 })),
    ],
  }), { when: oos, months: [4, 5, 11] }),

  def('oos-friend-detained', 'life', 1.2, () => ({
    id: 'oos-friend-detained',
    track: 'life',
    title: 'A friend does not come home',
    body: 'A friend from your old shift has been detained. Their wife calls you, crying, asking whether you know a lawyer. You freeze for a moment, then your own fear catches up.',
    stage: 'street',
    cast: [{ ...YOU, pose: 'phone' }, { role: 'friend', pose: 'think' }],
    choices: [
      c('help', 'Help find a lawyer and sit with the family.', ok('You spend hours calling clinics and organizations. By midnight there is a name and a number. It was the least and the most you could do.', { community: 5, wellbeing: -4, family: 1, flags: { legalHelp: true } })),
      c('money', 'Send a little money and keep your distance.', ok('It helps them, a little. You feel the line you are drawing.', { money: -m(100, 2025), wellbeing: -3 })),
      c('hide', 'Stay home and say nothing.', bad('You turn the sound off on your phone. It is quiet and you hate yourself a bit.', { wellbeing: -7, community: -3 }, 'You did what fear told you to.')),
    ],
  }), { when: oos }),

  // ------------------------------------------------------------------ desperation and crime
  def('desperate-offer', 'work', 0, (s) => ({
    id: 'desperate-offer',
    track: 'work',
    title: 'An offer that does not ask questions',
    body: 'You are out of options and nearly out of money. A man you barely know says he can pay you in cash to carry packages across town, and tells you not to ask what is inside. His smile is friendly. His eyes are not.',
    stage: 'street',
    cast: [{ ...YOU, pose: 'think' }, { role: 'stranger', pose: 'talk' }],
    choices: [
      c('refuse-aid', 'Refuse, and ask a community group for help with food and rent.', ok('The volunteers do not ask for papers. A bag of groceries and an emergency rent fund for the month. It is humbling and enough.', { money: m(250, s.profile.arrivalYear), wellbeing: 3, community: 3 })),
      c('ask', 'Ask what is in the packages.', ok('His smile fades and he walks away. You are shaking, and relieved.', { wellbeing: -2 })),
      c('accept', 'Take the job. Just this once.', bad('The first run pays more than a month of dishwashing. Your hands do not stop trembling afterwards.', { money: m(600, s.profile.arrivalYear), wellbeing: -7, flags: { crime: 1 } }, 'You tell yourself it was the last time.', 'Certain criminal convictions can make a noncitizen deportable, including crimes involving moral turpitude, aggravated felonies and drug offenses (INA 237(a)(2)). Desperation is understandable, and the consequences can be permanent.')),
    ],
  }), { when: () => false }),

  def('hunger-shoplift', 'life', 0, () => ({
    id: 'hunger-shoplift',
    track: 'life',
    title: 'An empty fridge',
    body: 'It is the third day of eating little. The fridge is empty and the pantry is bare. You stand in a grocery store holding a basket with nothing in it, and a loaf of bread is within reach.',
    stage: 'street',
    cast: [{ ...YOU, pose: 'think' }, { role: 'stranger', pose: 'idle' }],
    choices: [
      c('food-bank', 'Walk out and find a food bank.', ok('The food bank hands you a box without a single question. It is more than you expected.', { wellbeing: 3, community: 2 })),
      c('friend', 'Call a friend and admit you are struggling.', ok('Your friend arrives with groceries and says nothing about it. You eat like it is a holiday.', { community: 3, wellbeing: 4, family: 0 })),
      c('take', 'Slip the bread under your jacket.', bad('You walk out with your heart pounding. Nobody stops you this time.', { wellbeing: -5, flags: { crime: 1 } }, 'You felt every eye on your back.', 'Theft can be treated as a crime involving moral turpitude, and noncitizens can be deported for such crimes (INA 237(a)(2)). Food banks and community groups exist so that no one has to choose.')),
    ],
  }), { when: () => false }),

  def('borrowed-papers', 'work', 0, () => ({
    id: 'borrowed-papers',
    track: 'work',
    title: 'Somebody else\'s name',
    body: 'A coworker says a warehouse pays twice as much, but needs a valid ID and Social Security number. He offers to lend you a cousin\'s documents for a cut of your pay. He says everyone does it.',
    stage: 'cafe',
    cast: [{ ...YOU, pose: 'think' }, { role: 'friend', pose: 'talk' }],
    choices: [
      c('decline', 'Decline and ask a workers\' center what options exist.', ok('They cannot make you legal overnight, but they tell you which jobs do not need one and where wage claims are protected.', { wellbeing: 2, community: 2, flags: { legalHelp: true } })),
      c('use', 'Use the borrowed documents.', bad('The new job pays well and you start the next day. Every shift starts with a cold feeling at the door.', { money: 0, wellbeing: -6, flags: { crime: 1, informalWork: true } }, 'It pays, and it scares you.', 'Using another person\'s identity documents is a serious crime and can lead to prosecution and removal (INA 237(a)(2) criminal grounds).')),
      c('stay', 'Stay where you are.', ok('The pay is half and the work is harder, but you sleep.', { wellbeing: -2 })),
    ],
  }), { when: () => false }),

  def('unlicensed-drive', 'life', 0, () => ({
    id: 'unlicensed-drive',
    track: 'life',
    title: 'The long way to work',
    body: 'Your shift starts at five. The bus does not run that early and a friend offers you his car for the week. You do not have a driver\'s license.',
    stage: 'street',
    cast: [{ ...YOU, pose: 'think' }, { role: 'friend', pose: 'talk' }],
    choices: [
      c('bus', 'Take two buses and a long walk.', ok('You leave at three in the dark. The walk is long and you arrive on time.', { money: -m(25, 2025), wellbeing: -3 })),
      c('carpool', 'Ask a coworker for a lift.', ok('He grumbles, then agrees. You pay for gas and a thank-you.', { money: -m(40, 2025), community: 2 })),
      c('drive', 'Drive the friend\'s car.', bad('The first morning goes smoothly. You grip the wheel, watching every mirror.', { wellbeing: -4, flags: { crime: 1 } }, 'You promise yourself it is only for the week.', 'Driving without a license is a criminal offense in many places, and any arrest brings your immigration situation to light. Serious or repeated offenses can lead to removal (INA 237(a)(2)).')),
    ],
  }), { when: () => false }),

  def('oos-itin-tax', 'work', 1, () => ({
    id: 'oos-itin-tax',
    track: 'work',
    title: 'Taxes still come due',
    body: 'A coworker says that taxes apply to what you earn, even without a work permit, and that there is a way to file without a Social Security number. You are not sure whether it is wise to put your name on anything.',
    stage: 'library',
    cast: [{ ...YOU, pose: 'think' }, { role: 'friend', pose: 'talk' }],
    choices: [
      c('free-help', 'Visit a free tax clinic for guidance.', ok('A volunteer explains how filing works for people without a Social Security number, and what is kept private. You file, and you feel like a person who counts.', { wellbeing: 3, legal: 2, flags: { filedTaxes: true } }, 'Workers without a Social Security number can generally file with an individual taxpayer identification number (ITIN). Ask a free tax clinic about your situation.')),
      c('ignore', 'Do nothing.', bad('Time passes. The fear of mail has a new reason.', { wellbeing: -3 }, 'You may have wanted to ask someone first.')),
      c('shady', 'Pay a storefront preparer who asks no questions.', bad('The preparer takes a large fee and files something you do not understand.', { money: -m(300, 2025), wellbeing: -4 }, 'You paid for confusion.')),
    ],
  }), { when: (s) => oos(s) && Boolean(s.flags.informalWork), months: [8, 9] }),
];
