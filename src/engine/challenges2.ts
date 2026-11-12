import { bad, c, def, ok, social } from './cx';
import { priceFactor } from './economy';
import type { ChallengeDef } from './types';

const YOU = { role: 'player' } as const;
const m = (n: number, y: number): number => Math.round(n * priceFactor(y));

export const MORE_CHALLENGES: ChallengeDef[] = [
  // ------------------------------------------------------------------ study and status
  def('group-project', 'study', 1.1, () => ({
    id: 'group-project',
    track: 'study',
    title: 'The group project',
    body: 'Your team has four people and one of them has not done any work. The deadline is Friday and the grade is shared.',
    stage: 'classroom',
    cast: [{ ...YOU, pose: 'talk' }, { role: 'student', pose: 'talk' }, { role: 'friend', pose: 'idle' }],
    choices: [
      c('talk', 'Speak to the teammate directly and offer a clear task.', ok('They are embarrassed, then deliver something decent. The team is relieved.', { study: 3, community: 3 }), { roll: { base: 62, mods: [social()] }, fail: bad('They go quiet and nothing arrives. You finish their part at midnight.', { study: 1, wellbeing: -4 }, 'You wonder if the conversation could have gone differently.') }),
      c('cover', 'Quietly do their part yourself.', ok('You hand it in on time. You are exhausted and a little resentful.', { study: 2, wellbeing: -5 })),
      c('professor', 'Email the professor about the imbalance.', ok('The professor thanks you and adjusts the grading. Your team is cooler toward you.', { community: -2, study: 1 })),
    ],
  }), { months: [1, 2, 3, 5, 6, 9, 11] }),

  def('prof-feedback', 'study', 1.1, () => ({
    id: 'prof-feedback',
    track: 'study',
    title: 'A low grade and a red pen',
    body: 'Your first paper comes back covered in comments and a grade lower than you are used to. Back home this kind of writing was not what was graded.',
    stage: 'classroom',
    cast: [{ ...YOU, pose: 'think' }, { role: 'professor', pose: 'talk' }],
    choices: [
      c('office-hours', 'Go to office hours and ask what the professor expects.', ok('The professor walks you through what a strong paper looks like. You leave with a plan.', { study: 6, community: 1 })),
      c('writing-center', 'Book a session at the writing center.', ok('A tutor teaches you how to structure an argument. It feels slow, then clicks.', { study: 5, wellbeing: 1 })),
      c('ignore', 'Put it away and hope the next one goes better.', bad('The next paper has the same problems.', { study: -3, wellbeing: -3 }, 'Perhaps the comments were trying to tell you something.')),
    ],
  }), { months: [1, 2, 3, 5, 9, 11] }),

  def('academic-integrity', 'study', 1, () => ({
    id: 'academic-integrity',
    track: 'study',
    title: 'The deadline and the shortcut',
    body: 'Two assignments are due the same night. A classmate offers to send you their finished solutions "just to look at". Everyone does a little of this, they say.',
    stage: 'library',
    cast: [{ ...YOU, pose: 'think' }, { role: 'friend', pose: 'talk' }],
    choices: [
      c('decline', 'Decline and email the instructor to ask for a short extension.', ok('The instructor grants a day. It is a tense conversation but a fair one.', { study: 2, wellbeing: -1 })),
      c('own-work', 'Do your own work, even if it is rough.', ok('It is not your best, but it is yours.', { study: 1, wellbeing: -3 })),
      c('copy', 'Use the solutions "as a reference".', bad('You hand it in. Two weeks later an email asks you to meet the academic integrity office.', { study: -8, wellbeing: -8, legal: -3 }, 'You feel sick when you see the email.', 'US universities treat copying and unauthorized help as serious misconduct. Penalties can include course failure or dismissal, which would end your enrollment and put your student record at risk.')),
    ],
  }), { months: [2, 3, 5, 6, 9, 11] }),

  def('participation', 'study', 1, () => ({
    id: 'participation',
    track: 'study',
    title: 'Class participation counts',
    body: 'In your seminar, grades include speaking up. Back home you listened and wrote it all down. Here everyone seems to interrupt each other and the professor smiles.',
    stage: 'classroom',
    cast: [{ ...YOU, pose: 'talk' }, { role: 'professor', pose: 'idle' }, { role: 'student', pose: 'talk' }],
    choices: [
      c('prep-question', 'Prepare one question in advance and ask it.', ok('The professor nods and builds on your point. Next time is easier.', { study: 3, community: 2, wellbeing: 2 })),
      c('stay-quiet', 'Stay quiet and hope the written work carries you.', bad('Your participation score is the weakest part of your grade.', { study: -2, wellbeing: -2 }, 'Silence was safer, and cost something.')),
      c('after-class', 'Talk to the professor after class instead.', ok('They suggest a few ways to join the discussion. You try one next week.', { study: 2, community: 1 })),
    ],
  }), { months: [1, 2, 3, 9] }),

  def('research-start', 'study', 1, () => ({
    id: 'research-start',
    track: 'study',
    title: 'A chance to join a lab',
    body: 'A professor mentions that their lab needs help for the semester. It could shape your thesis and your résumé, but your coursework is already heavy.',
    stage: 'lab',
    cast: [{ ...YOU, pose: 'idle' }, { role: 'advisor', pose: 'talk' }, { role: 'student', pose: 'type' }],
    choices: [
      c('join', 'Join for a few hours a week.', ok('You learn more in the lab than in lectures. Your name appears in a lab meeting slide.', { career: 6, study: 2, wellbeing: -3 })),
      c('ask-terms', 'Ask what the arrangement is and whether it counts for credit or pay.', ok('The professor explains it clearly, and you set it up properly through the department.', { career: 5, study: 2, legal: 1 })),
      c('pass', 'Politely pass this semester.', ok('Your schedule breathes. You wonder about the road not taken.', { wellbeing: 3, career: -1 })),
    ],
  }), { months: [1, 2, 5, 9, 11] }),

  def('phishing-email', 'status', 1, () => ({
    id: 'phishing-email',
    track: 'status',
    title: 'An urgent email from the "international office"',
    body: 'An email with an official-looking logo says your record has a problem and you must log in through a link and pay a "reinstatement fee" today.',
    stage: 'library',
    cast: [{ ...YOU, pose: 'type' }],
    choices: [
      c('verify', 'Do not click. Ask the international office in person.', ok('The advisor smiles sadly: you are the third student today to ask. Nothing is wrong with your record.', { legal: 2, wellbeing: 1 })),
      c('click', 'Click the link to see what it says.', bad('The page asks for your student login and card number. You close it, but a few days later there are strange emails.', { money: -150, wellbeing: -6, legal: -2 }, 'Your stomach drops.', 'Fake emails pretending to be school or government offices target international students. Real offices do not demand urgent payment through links; confirm with the office directly.')),
      c('forward', 'Forward it to friends and ask what they think.', ok('A senior student recognizes it as a scam right away. You warn the group.', { community: 2 })),
    ],
  }), { months: [2, 3, 5, 6, 9, 11] }),

  def('registration-mixup', 'status', 1, () => ({
    id: 'registration-mixup',
    track: 'status',
    title: 'A registration mix-up',
    body: 'The course you registered for is full, and the system dropped you from it. The new schedule looks lighter. You are not sure how many courses you now have.',
    stage: 'intl-office',
    cast: [{ ...YOU, pose: 'think' }, { role: 'dso', pose: 'talk' }],
    choices: [
      c('fix', 'Find another course right away to stay at a full load.', ok('A scramble, but you land a seat in an elective that is actually interesting.', { study: 2, legal: 2, wellbeing: -2 })),
      c('ask', 'Ask the international office what counts as full-time before deciding.', ok('The advisor explains your program\'s minimum clearly and helps you pick.', { legal: 3, wellbeing: 1 })),
      c('enjoy', 'Enjoy the lighter schedule and say nothing.', bad('The term feels easy. You do not think about it again.', { wellbeing: 5, legal: -8, flags: { droppedLoad: true } }, 'It felt too easy, somehow.', 'Falling below a full course of study without DSO authorization is reported to SEVIS by your school and counts as failing to maintain status (8 CFR 214.2(f)(6), 214.3(g)(2)(iii)).')),
    ],
  }), { months: [1, 3, 5, 9] }),

  def('exam-late', 'study', 1, () => ({
    id: 'exam-late',
    track: 'study',
    title: 'Stuck on the way to an exam',
    body: 'Your bus does not come. Your exam starts in 25 minutes and you are on the wrong side of the city.',
    stage: 'street',
    cast: [{ ...YOU, pose: 'think' }, { role: 'stranger', pose: 'idle' }],
    choices: [
      c('rideshare', 'Pay for a ride-share.', ok('You arrive with two minutes to spare, and feel the cost.', { money: -28, study: 1 })),
      c('run', 'Run for the next train.', ok('Sweaty but on time. The exam goes fine.', { wellbeing: -2 }), { roll: { base: 60 }, fail: bad('You arrive ten minutes late. The proctor lets you in, but you are flustered.', { study: -4, wellbeing: -4 }, 'You might have left earlier.') }),
      c('email', 'Email the professor and hope for understanding.', ok('The professor replies kindly, but your time is already running.', { study: -1, wellbeing: -2 })),
    ],
  }), { months: [2, 3, 5, 6, 9, 11] }),

  // ------------------------------------------------------------------ money and work
  def('bank-account', 'work', 1, () => ({
    id: 'bank-account',
    track: 'work',
    title: 'Opening a bank account',
    body: 'You need a US bank account. One bank charges a monthly fee unless you keep a minimum balance. Another is friendly to students but far from campus.',
    stage: 'bank',
    cast: [{ ...YOU, pose: 'talk' }, { role: 'teller', pose: 'talk' }],
    choices: [
      c('student', 'Pick the student account and read the fee table first.', ok('No monthly fees, and an app that works. You feel like a local.', { money: 20, wellbeing: 2 })),
      c('nearest', 'Pick the nearest branch and sign quickly.', bad('A few months later you notice small monthly fees.', { money: -90, wellbeing: -1 }, 'You wish you had read the page.')),
      c('wait', 'Put it off and keep carrying cash.', ok('It works until your wallet goes missing for a day.', { wellbeing: -3, money: -20 })),
    ],
  }), { months: [0, 1] }),

  def('phone-plan', 'work', 1, () => ({
    id: 'phone-plan',
    track: 'work',
    title: 'A US phone plan',
    body: 'A salesperson offers a two-year contract with a free phone. A cheaper prepaid plan has no credit check and no contract.',
    stage: 'street',
    cast: [{ ...YOU, pose: 'think' }, { role: 'stranger', pose: 'talk' }],
    choices: [
      c('prepaid', 'Take the prepaid plan.', ok('Cheaper than you expected and no strings attached.', { money: 30, wellbeing: 1 })),
      c('contract', 'Sign the contract for the free phone.', bad('The phone is nice. The contract fees show up when you try to cancel next year.', { money: -80, wellbeing: -1 }, 'Free was not quite free.')),
      c('shop', 'Compare three stores before deciding.', ok('You spend an afternoon, save money and learn the neighborhood.', { money: 25, study: -1 })),
    ],
  }), { months: [0, 1] }),

  def('laptop-breaks', 'work', 1, (s) => ({
    id: 'laptop-breaks',
    track: 'work',
    title: 'The laptop dies',
    body: 'In the middle of a deadline week your laptop stops turning on. A repair shop quotes a price, and a new one costs far more.',
    stage: 'library',
    cast: [{ ...YOU, pose: 'think' }, { role: 'friend', pose: 'talk' }],
    choices: [
      c('repair', 'Pay for the repair.', ok('Back in two days. A relief.', { money: -m(180, s.profile.arrivalYear), wellbeing: 1 })),
      c('borrow', 'Borrow a friend\'s laptop and use the library.', ok('Awkward, but free. You owe a lot of coffees.', { community: 2, study: -1 })),
      c('new', 'Buy a new one on a payment plan.', bad('The laptop is great. The payments are not.', { money: -m(120, s.profile.arrivalYear), debt: m(700, s.profile.arrivalYear), wellbeing: 1 }, 'That commitment will follow you for a while.')),
    ],
  }), { months: [2, 3, 5, 6, 9, 11] }),

  def('textbooks', 'work', 1, (s) => ({
    id: 'textbooks',
    track: 'work',
    title: 'The textbook bill',
    body: 'Two required books cost more than a week of groceries. The bookstore says there are no used copies left.',
    stage: 'campus',
    cast: [{ ...YOU, pose: 'think' }, { role: 'student', pose: 'talk' }],
    choices: [
      c('library', 'Use the library copy and share a scan of key chapters with a classmate.', ok('Slower, but it works. A classmate helps you in return.', { community: 2, study: -1 })),
      c('buy-used', 'Hunt for used copies from seniors.', ok('A senior sells you both for a third of the price.', { money: -m(60, s.profile.arrivalYear), community: 1 })),
      c('buy-new', 'Buy both new.', ok('You feel the dent in your budget.', { money: -m(230, s.profile.arrivalYear) })),
    ],
  }), { months: [0, 1, 5, 6] }),

  def('winter-coat', 'life', 1, (s) => ({
    id: 'winter-coat',
    track: 'life',
    title: 'The first cold snap',
    body: 'The temperature drops faster than you expected and your jacket is not enough. Everyone else seems to own a proper coat.',
    stage: 'street',
    cast: [{ ...YOU, pose: 'idle' }, { role: 'stranger', pose: 'idle' }],
    choices: [
      c('thrift', 'Check a thrift store for a coat.', ok('You find a good one for little money. It even fits.', { money: -m(45, s.profile.arrivalYear), wellbeing: 2 })),
      c('new', 'Buy a proper winter coat.', ok('Warm, and worth every dollar.', { money: -m(180, s.profile.arrivalYear), wellbeing: 3 })),
      c('layers', 'Layer what you have and hope for the best.', bad('You catch a cold within two weeks.', { wellbeing: -4, study: -2 }, 'You could have planned for the cold.')),
    ],
  }), { months: [3, 4, 5] }),

  def('deposit-dispute', 'work', 1, (s) => ({
    id: 'deposit-dispute',
    track: 'work',
    title: 'The missing deposit',
    body: 'You moved out and the landlord is keeping part of your deposit for "damage" you do not remember.',
    stage: 'apartment',
    cast: [{ ...YOU, pose: 'talk' }, { role: 'landlord', pose: 'talk' }],
    choices: [
      c('photos', 'Send the move-in photos you took and ask politely.', ok('The landlord returns most of it after a short back-and-forth.', { money: m(250, s.profile.arrivalYear), wellbeing: 2 })),
      c('let-go', 'Let it go. You have no energy for this.', bad('You feel the loss every time you check your account.', { money: -m(250, s.profile.arrivalYear), wellbeing: -3 }, 'Perhaps worth a conversation after all.')),
      c('student-legal', 'Ask the student legal clinic.', ok('The clinic helps you write a letter. The landlord pays up.', { money: m(280, s.profile.arrivalYear), wellbeing: 2 })),
    ],
  }), { months: [5, 6, 7, 10] }),

  def('sublet-scam', 'work', 1, (s) => ({
    id: 'sublet-scam',
    track: 'work',
    title: 'A perfect apartment listing',
    body: 'A listing for a sunny room close to campus is cheaper than anything else. The "owner" is out of the country and asks for a deposit before you can visit.',
    stage: 'apartment-night',
    cast: [{ ...YOU, pose: 'type' }],
    choices: [
      c('see-first', 'Insist on seeing it in person before paying anything.', ok('The messages stop right away. You find a real place a week later.', { wellbeing: 1 })),
      c('pay', 'Send the deposit so you do not lose it.', bad('The listing disappears an hour later. So does your money.', { money: -m(600, s.profile.arrivalYear), wellbeing: -7 }, 'It felt too good to be true.', 'Rental scams ask for money before you can see a place. Never pay a deposit for a home you have not seen or a landlord you cannot verify.')),
      c('ask-friends', 'Send the listing to older students and ask what they think.', ok('Two of them recognize the pattern and warn you.', { community: 2, wellbeing: 1 })),
    ],
  }), { months: [5, 6, 7, 10] }),

  def('job-scam', 'work', 1, (s) => ({
    id: 'job-scam',
    track: 'work',
    title: 'A job offer that arrives by text',
    body: 'A recruiter messages you about a flexible remote job with great pay. To start, you must buy equipment from their vendor and they will "reimburse" you.',
    stage: 'library',
    cast: [{ ...YOU, pose: 'type' }],
    choices: [
      c('decline', 'Decline and report the message.', ok('You block the number and send a note to the career center.', { community: 1, career: 1 })),
      c('career-center', 'Ask the career center whether the company is real.', ok('The center has seen the same message from other students.', { career: 2, wellbeing: 1 })),
      c('buy', 'Buy the equipment to get started.', bad('A check arrives, then bounces. The equipment money is gone.', { money: -m(450, s.profile.arrivalYear), wellbeing: -6 }, 'You should have asked someone first.', 'Fake job offers that ask you to buy equipment first, or send money out of a check, are a common scam aimed at students.')),
    ],
  }), { months: [2, 3, 5, 9, 11] }),

  def('resume-review', 'work', 1, () => ({
    id: 'resume-review',
    track: 'work',
    title: 'Your résumé, American style',
    body: 'A career coach reads your résumé and says it is too long, has a photo and lists your date of birth. In the US, they say, it should look very different.',
    stage: 'intl-office',
    cast: [{ ...YOU, pose: 'talk' }, { role: 'advisor', pose: 'talk' }],
    choices: [
      c('rewrite', 'Rewrite it with the coach\'s notes.', ok('One crisp page with numbers and verbs. It already feels better.', { career: 6, wellbeing: 2 })),
      c('half', 'Make a few small changes and keep the rest.', ok('A bit better. The old habits show.', { career: 2 })),
      c('keep', 'Keep it as it is. It worked before.', bad('A few weeks later you notice you are hearing nothing back.', { career: -2, wellbeing: -2 }, 'It might be worth rethinking the format.')),
    ],
  }), { months: [1, 2, 9] }),

  def('alumni-networking', 'work', 1, () => ({
    id: 'alumni-networking',
    track: 'work',
    title: 'An alumni mixer',
    body: 'Alumni are meeting students in a hotel ballroom. Everyone has a drink and a handshake. You have never done "networking" before.',
    stage: 'conference',
    cast: [{ ...YOU, pose: 'talk' }, { role: 'recruiter', pose: 'talk' }, { role: 'student', pose: 'idle' }],
    choices: [
      c('ask-stories', 'Ask two people how they started, and follow up by email.', ok('One of them forwards your note to a friend at a company you like.', { career: 7, community: 2 })),
      c('wallflower', 'Stand near the food and listen.', ok('You learn a lot by watching, but no one remembers you.', { career: 1, wellbeing: -1 })),
      c('skip', 'Skip it. You have an assignment.', ok('You stay on top of work and wonder what you missed.', { study: 2, career: -1 })),
    ],
  }), { months: [1, 2, 3, 9, 11] }),

  def('club-officer', 'work', 1, () => ({
    id: 'club-officer',
    track: 'work',
    title: 'Run for club treasurer?',
    body: 'Your club needs a treasurer. It would take a few hours a week and look good later, but you are already stretched.',
    stage: 'campus',
    cast: [{ ...YOU, pose: 'talk' }, { role: 'student', pose: 'talk' }, { role: 'friend', pose: 'cheer' }],
    choices: [
      c('run', 'Run for it.', ok('You win by a handful of votes. The first budget meeting is a lot, then fun.', { career: 4, community: 6, study: -2, wellbeing: -2 })),
      c('help', 'Offer to help without taking the title.', ok('You help where you can and keep your evenings.', { community: 3, career: 1 })),
      c('pass', 'Pass this time.', ok('Someone else gets the job. You feel relieved and a little wistful.', { wellbeing: 2 })),
    ],
  }), { months: [1, 2, 9] }),

  def('bike-stolen', 'work', 1, (s) => ({
    id: 'bike-stolen',
    track: 'work',
    title: 'The bike is gone',
    body: 'You come out of class and the lock is cut, your bike gone. It was your whole commute plan.',
    stage: 'campus',
    cast: [{ ...YOU, pose: 'think' }, { role: 'stranger', pose: 'idle' }],
    choices: [
      c('report', 'Report it to campus police and look for a used replacement.', ok('The police take a report. A used bike costs less than the first one.', { money: -m(110, s.profile.arrivalYear), wellbeing: -1 })),
      c('transit', 'Switch to transit for a while.', ok('Slower and pricier, but safe.', { money: -m(70, s.profile.arrivalYear), wellbeing: -2 })),
      c('new', 'Buy a better lock and a new bike.', ok('Painful, but you are back on two wheels.', { money: -m(240, s.profile.arrivalYear) })),
    ],
  }), { when: (s) => s.profile.commute === 'bike', months: [2, 3, 5, 6, 9] }),

  def('parking-ticket', 'work', 1, (s) => ({
    id: 'parking-ticket',
    track: 'work',
    title: 'A parking ticket',
    body: 'You come back to your car and there is a bright envelope under the wiper. The sign you missed was behind a tree.',
    stage: 'street',
    cast: [{ ...YOU, pose: 'think' }],
    choices: [
      c('pay', 'Pay it right away.', ok('Annoying, but done.', { money: -m(75, s.profile.arrivalYear) })),
      c('contest', 'Contest it with a photo of the hidden sign.', ok('A few weeks later, the fine is reduced.', { money: -m(25, s.profile.arrivalYear) }), { roll: { base: 50 }, fail: bad('The appeal is denied and a late fee is added.', { money: -m(110, s.profile.arrivalYear), wellbeing: -2 }, 'It would have been cheaper to pay.') }),
      c('ignore', 'Ignore it.', bad('A late fee arrives, and then another letter.', { money: -m(160, s.profile.arrivalYear), wellbeing: -3 }, 'It did not go away.')),
    ],
  }), { when: (s) => s.profile.commute === 'car', months: [2, 3, 5, 6, 9] }),

  def('grocery-budget', 'work', 1, (s) => ({
    id: 'grocery-budget',
    track: 'work',
    title: 'The grocery trap',
    body: 'Familiar brands cost double at the big store. An international grocery across town has your spices and dals, but the bus ride is long.',
    stage: 'street',
    cast: [{ ...YOU, pose: 'carry' }, { role: 'stranger', pose: 'idle' }],
    choices: [
      c('trip', 'Make the trip once a month and stock up.', ok('Home feels closer for a week. You save money too.', { money: m(40, s.profile.arrivalYear), wellbeing: 3, family: 1 })),
      c('nearby', 'Shop at the nearby store and adapt your cooking.', ok('The food is not quite right, but it is quick.', { money: -m(25, s.profile.arrivalYear), wellbeing: -1 })),
      c('delivery', 'Order delivery for convenience.', ok('Easy, but the fees add up.', { money: -m(65, s.profile.arrivalYear), wellbeing: 1 })),
    ],
  }), { months: [1, 2, 3, 5, 6, 7, 9] }),

  // ------------------------------------------------------------------ life and culture
  def('cooking-night', 'life', 1.1, () => ({
    id: 'cooking-night',
    track: 'life',
    title: 'Cooking for friends',
    body: 'You decide to cook the dish your mother makes for guests. The kitchen is small, the stove is temperamental and you are missing two spices.',
    stage: 'apartment',
    cast: [{ ...YOU, pose: 'carry' }, { role: 'roommate', pose: 'talk' }, { role: 'friend', pose: 'cheer' }],
    choices: [
      c('invite-all', 'Invite everyone on the floor.', ok('It is chaos and delicious. Someone brings dessert and someone brings a guitar.', { community: 8, wellbeing: 6, money: -35 })),
      c('small', 'Keep it to two or three close friends.', ok('A quiet, warm night. You feel at home for the first time.', { community: 4, wellbeing: 5, money: -20 })),
      c('alone', 'Cook for yourself and eat in front of a screen.', ok('Comfort food, a call home, an early night.', { family: 2, wellbeing: 2 })),
    ],
  }), { months: [1, 2, 3, 5, 6, 7, 9, 11] }),

  def('cricket-sunday', 'life', 1, () => ({
    id: 'cricket-sunday',
    track: 'life',
    title: 'Sunday cricket',
    body: 'A group of students plays cricket in the park on Sundays with a tennis ball and a plank for a bat. They need one more player.',
    stage: 'park',
    cast: [{ ...YOU, pose: 'cheer' }, { role: 'friend', pose: 'cheer' }, { role: 'student', pose: 'wave' }],
    choices: [
      c('play', 'Join the game.', ok('You drop a catch and everyone laughs. Then you hit a six and nobody lets you forget it.', { community: 6, wellbeing: 5 })),
      c('watch', 'Watch from the side and chat.', ok('A good afternoon without any pressure.', { community: 3, wellbeing: 2 })),
      c('study', 'Stay in and study.', ok('You make progress and miss the sun.', { study: 3, community: -2 })),
    ],
  }), { months: [0, 1, 2, 6, 7, 9] }),

  def('festival-diwali', 'life', 1.4, () => ({
    id: 'festival-diwali',
    track: 'life',
    title: 'Diwali far from home',
    body: 'Diwali falls on a weekday. At home there would be lamps, sweets and family. Here it is just another Tuesday, with a quiz in the morning.',
    stage: 'festival',
    cast: [{ ...YOU, pose: 'cheer' }, { role: 'friend', pose: 'wave' }, { role: 'student', pose: 'cheer' }],
    choices: [
      c('join', 'Join the student association\'s celebration after class.', ok('Lamps on a campus lawn and a hundred strangers who feel like cousins. You call home with the noise behind you.', { community: 7, family: 4, wellbeing: 6, study: -1 })),
      c('small-home', 'Light a few lamps at home and call your family.', ok('Quiet, warm, a little sad. Your mother shows you the rangoli she made.', { family: 6, wellbeing: 3 })),
      c('ignore', 'Treat it as a normal day.', bad('It does not feel normal. The evening is long.', { wellbeing: -4, family: -2 }, 'Something felt missing all day.')),
    ],
  }), { months: [2, 3] }),

  def('holi', 'life', 1.2, () => ({
    id: 'holi',
    track: 'life',
    title: 'Holi on a campus lawn',
    body: 'The student association organizes a Holi event. Colors fly, music plays, and people who have never seen it before are laughing and joining in.',
    stage: 'festival',
    cast: [{ ...YOU, pose: 'cheer' }, { role: 'friend', pose: 'cheer' }, { role: 'student', pose: 'cheer' }],
    choices: [
      c('lead', 'Help organize and teach newcomers what it means.', ok('You explain the story behind it and everyone listens. You feel proud.', { community: 8, wellbeing: 6, study: -2 })),
      c('join', 'Join in and enjoy.', ok('Colors in your hair for three days. Worth it.', { community: 5, wellbeing: 6 })),
      c('skip', 'Skip it: midterms are close.', ok('You get ahead in class and see the photos later.', { study: 2, community: -2, wellbeing: -1 })),
    ],
  }), { months: [7] }),

  def('microaggression', 'life', 1, (s) => ({
    id: 'microaggression',
    track: 'life',
    title: 'Another mispronounced name',
    // Classmates only for someone enrolled now; anyone else meets it among neighbours and regulars.
    body: s.flags.status === 'F1'
      ? 'A classmate keeps mispronouncing your name and jokes that it is "too hard". Others laugh. You smile, but it stays with you.'
      : 'A regular at the place you buy coffee keeps mispronouncing your name and jokes that it is "too hard". Others in line laugh. You smile, but it stays with you.',
    stage: s.flags.status === 'F1' ? 'classroom' : 'cafe',
    cast: [{ ...YOU, pose: 'idle' }, { role: s.flags.status === 'F1' ? 'student' : 'stranger', pose: 'talk' }, { role: 'friend', pose: 'idle' }],
    choices: [
      c('correct', 'Say your name slowly and ask them to try again.', ok('They try again, embarrassed. The next time they get it right.', { community: 2, wellbeing: 3 })),
      c('laugh', 'Laugh it off.', bad('You laugh with them. Later you feel quietly worn down.', { wellbeing: -4 }, 'It added up more than you wanted to admit.')),
      c('friend', 'Talk to a friend afterwards.', ok('They have heard it too, and have a few ideas. It helps to know you are not alone.', { wellbeing: 3, community: 2 })),
    ],
  }), { months: [1, 2, 3, 9, 11] }),

  def('mental-health', 'life', 1.1, () => ({
    id: 'mental-health',
    track: 'life',
    title: 'Not sleeping',
    body: 'For weeks you have been lying awake, thinking about money, grades and home. A flyer for free campus counseling is taped to the door of the clinic.',
    stage: 'clinic',
    cast: [{ ...YOU, pose: 'sit' }, { role: 'nurse', pose: 'talk' }],
    choices: [
      c('go', 'Book a counseling appointment.', ok('The counselor listens and gives you tools that actually work. You leave lighter.', { wellbeing: 10, study: 2 })),
      c('friend', 'Talk to a friend first.', ok('It helps. A friend suggests you think about counseling.', { wellbeing: 4, community: 2 })),
      c('push', 'Push through it. Others have it worse.', bad('The weeks run together and the exams suffer.', { wellbeing: -7, study: -4 }, 'Maybe this was worth taking seriously.')),
    ],
  }), { months: [3, 5, 6, 9, 11] }),

  def('local-friend', 'life', 1.1, () => ({
    id: 'local-friend',
    track: 'life',
    title: 'A classmate invites you out',
    body: 'An American classmate invites you to a house party on Saturday. You have never been to one. They say "just come, it is easy".',
    stage: 'cafe',
    cast: [{ ...YOU, pose: 'talk' }, { role: 'friend', pose: 'talk' }],
    choices: [
      c('go', 'Go for an hour.', ok('Loud, funny and awkward in all the right ways. You meet three people you will see again.', { community: 6, wellbeing: 4 })),
      c('bring-friend', 'Go together with another international student.', ok('It is easier with someone to share the awkward moments.', { community: 5, wellbeing: 4 })),
      c('decline', 'Say no politely.', ok('You stay in. The invitation may not come again.', { community: -2, study: 1 })),
    ],
  }), { months: [1, 2, 3, 5, 9, 11] }),

  def('friend-trip', 'life', 1, (s) => ({
    id: 'friend-trip',
    track: 'life',
    title: 'A weekend away',
    body: 'Friends are planning a weekend trip to a national park. It would cost money and time you do not have, and a paper is due Monday.',
    stage: 'park',
    cast: [{ ...YOU, pose: 'wave' }, { role: 'friend', pose: 'cheer' }, { role: 'student', pose: 'cheer' }],
    choices: [
      c('go', 'Go and write the paper on the drive back.', ok('A trip you will remember. The paper is a little rushed.', { community: 6, wellbeing: 7, money: -m(120, s.profile.arrivalYear), study: -2 })),
      c('day', 'Do a day trip only.', ok('A compromise that leaves you happy and mostly on track.', { community: 3, wellbeing: 4, money: -m(40, s.profile.arrivalYear) })),
      c('stay', 'Stay home and finish the paper.', ok('A clean submission. The photos make you wish you had gone.', { study: 3, community: -2 })),
    ],
  }), { months: [5, 6, 7, 9] }),

  def('parents-visit', 'life', 1, () => ({
    id: 'parents-visit',
    track: 'life',
    title: 'Parents want to visit',
    body: 'Your parents want to come for your graduation next year. They ask if the visa will be easy. You know interview appointments can be hard to get.',
    stage: 'apartment-night',
    cast: [{ ...YOU, pose: 'phone' }, { role: 'parent', pose: 'talk' }],
    choices: [
      c('plan-early', 'Tell them to start the application early and gather documents.', ok('They start the paperwork now. You feel closer already.', { family: 5, wellbeing: 3 })),
      c('reassure', 'Reassure them it will be fine, without details.', ok('They relax. You worry quietly.', { family: 2, wellbeing: -2 })),
      c('avoid', 'Change the subject.', bad('Your mother notices. The next call is shorter.', { family: -4, wellbeing: -2 }, 'You felt it in the silence.')),
    ],
  }), { months: [5, 6, 7, 9] }),

  def('sibling-exam', 'life', 1, () => ({
    id: 'sibling-exam',
    track: 'life',
    title: 'Your sibling\'s big exam',
    body: 'Your younger sibling is preparing for an important exam back home and wants your advice. The time difference means your night is their morning.',
    stage: 'apartment-night',
    cast: [{ ...YOU, pose: 'phone' }, { role: 'parent', pose: 'talk' }],
    choices: [
      c('stay-up', 'Stay up late to help them revise.', ok('You feel like a good older sibling. Tomorrow you feel it in your eyes.', { family: 6, wellbeing: 2, study: -2 })),
      c('record', 'Record a voice note with study tips.', ok('A small gesture that lands well.', { family: 4, wellbeing: 2 })),
      c('busy', 'Say you are busy this week.', bad('They say it is fine. It does not sound fine.', { family: -4, wellbeing: -2 }, 'You wonder if it was the right call.')),
    ],
  }), { months: [1, 2, 3, 5, 9, 11] }),

  def('gym', 'life', 1, () => ({
    id: 'gym',
    track: 'life',
    title: 'The free gym',
    body: 'Your student card gives you free gym access. You have never gone to a gym, and the first visit feels like entering a foreign country.',
    stage: 'campus',
    cast: [{ ...YOU, pose: 'idle' }, { role: 'friend', pose: 'wave' }],
    choices: [
      c('go', 'Go with a friend twice a week.', ok('A habit that clears your head and helps you sleep.', { wellbeing: 7, study: 1, community: 2 })),
      c('try-once', 'Try it once and see.', ok('Not bad. Maybe next week.', { wellbeing: 2 })),
      c('skip', 'Skip it. No time.', ok('You study more and walk less.', { study: 1, wellbeing: -1 })),
    ],
  }), { months: [1, 2, 3, 5, 6, 9, 11] }),

  def('volunteer', 'life', 1, () => ({
    id: 'volunteer',
    track: 'life',
    title: 'A volunteering invitation',
    body: 'A neighborhood food pantry needs weekend volunteers. A friend says it is a good way to meet locals and build a sense of belonging.',
    stage: 'park',
    cast: [{ ...YOU, pose: 'carry' }, { role: 'friend', pose: 'talk' }, { role: 'stranger', pose: 'wave' }],
    choices: [
      c('sign-up', 'Sign up for a regular shift.', ok('You get to know the neighborhood and the people in it. It feels like you belong a little more.', { community: 8, wellbeing: 5, study: -2 })),
      c('once', 'Try one shift.', ok('A good morning and a nice story to share.', { community: 3, wellbeing: 3 })),
      c('later', 'Say "maybe later".', ok('You stay focused on school.', { study: 2 })),
    ],
  }), { months: [2, 3, 6, 7, 9, 11] }),
];
