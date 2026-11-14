/**
 * Later-year status cards: what each immigration status asks of a person year after year.
 * These are the texture between the milestones in family.ts and work.ts. They never set `status`
 * or any flag those files own; they only read them.
 *
 * Every legal statement is cited in a lookback. Sources and URLs are listed in
 * research/years-status-notes.md. Fees, waits and odds are designed estimates and say so.
 * Game-design reference, not legal advice.
 *
 * Flags set here (all start with ys_): year stamps for cards that return (ys_addrAt, ys_daysAt,
 * ys_natzAskAt, ys_juryAt, ys_askedAt, ys_homeVisitAt, ys_ballotAt, ys_lookAt, ys_piecesAt, ys_stampAt,
 * ys_spouseAt, ys_reorgAt, ys_decadeAt, ys_reschedAt, ys_aosEadAt, ys_limboAt, ys_asyMovedAt, ys_asyEadAt,
 * ys_staleAt, ys_famFearAt, ys_queueAt, ys_homeNewsAt, ys_tripAt, ys_rightsAt, ys_knockAt, ys_stopAt,
 * ys_erAt, ys_hopeAt, ys_detAt, ys_taxAt, ys_ppAt, ys_orderAt), one-time markers (ys_lostCard, ys_juryLpr,
 * ys_taxIdea, ys_civics, ys_parentAsked, ys_cousinAsked, ys_oldCase, ys_citReturn, ys_ppRenewed,
 * ys_parentCame, ys_dualAsked, ys_ageOut, ys_aosMail, ys_aosReq2, ys_aosMoved, ys_cannotGo, ys_asyCity,
 * ys_asyleeFam, ys_firstYear, ys_consult1, ys_consult2, ys_victim, ys_schoolForm, ys_notario, ys_ten,
 * ys_twenty, ys_funeral) and small memories (ys_natzMind, ys_travelLog, ys_spouseEad, ys_papersReady,
 * ys_plan, ys_folder, ys_license, ys_itin, ys_hopeN). An existing `salary` is raised in ys-aos-job-offer and ys-asy-new-city.
 */
import { bad, c, def, legal, ok } from '../cx';
import type { ChallengeDef, GameState, StatusCode } from '../types';
import { YOU, age, band, cost, has, hasChild, hasJob, hasPartner, is, num, settled, yearsHere, yearsInStatus } from './yx';

// ------------------------------------------------------------------ helpers
/** A year stamp that is never 0, so a flag set in the first year still counts as set. */
const stamp = (s: GameState): number => yearsHere(s) + 1;
/** True if the card has never been shown, or was last shown at least `gap` years ago. */
const due = (s: GameState, k: string, gap: number): boolean => num(s, k) === 0 || stamp(s) - num(s, k) >= gap;
const seen = (s: GameState, k: string): boolean => num(s, k) > 0;
const ewi = (s: GameState): boolean => has(s, 'ewi');
/** A spouse who came as a dependent (not a US citizen spouse met here). */
const depSpouse = (s: GameState): boolean => s.profile.marital === 'married' && !has(s, 'marriedCitizen');
const empBasis = (s: GameState): boolean =>
  s.flags.aosBasis === 'employment' || (s.flags.aosBasis === undefined && has(s, 'i140Approved'));
const licenseState = (s: GameState): 'CA' | 'NY' | '' =>
  s.profile.cityId === 'la' || s.profile.cityId === 'bayarea' ? 'CA' : s.profile.cityId === 'nyc' ? 'NY' : '';

const ASSESS = 'A licensed immigration attorney or a DOJ-accredited representative must assess any real case (8 CFR 292.1).';
const HOME_LAW = "Whether you keep your first nationality after naturalizing is decided by your home country's law, not US law. Ask its consulate; do not rely on what a friend remembers.";
const ADDR_RULE = 'Almost every noncitizen in the US must report a change of address within 10 days (INA 265(a); 8 CFR 265.1).';

// ------------------------------------------------------------------ permanent residents
const LPR: StatusCode[] = ['LPR'];

const LPR_CARDS: ChallengeDef[] = [
  def('ys-address', 'status', 1.4, (s) => ({
    id: 'ys-address',
    track: 'status',
    title: seen(s, 'ys_addrAt') ? 'Moving again' : 'A new address',
    body: `You are moving across town: boxes, a new key, a new mailbox. ${seen(s, 'ys_addrAt') ? 'You have done this before and still dread the list of offices to tell.' : 'Somewhere in the list of things to do is a form for the immigration service.'} Tonight you are tired, and the form is not going anywhere.`,
    stage: 'apartment',
    cast: [{ ...YOU, pose: 'carry' }, { role: 'landlord', pose: 'talk' }],
    choices: [
      c('tonight', 'Report the new address tonight, sitting among the boxes.', ok('Ten minutes online, and a confirmation you save in your papers folder. Then you sleep on a mattress on the floor.', { legal: 4, wellbeing: -1, flags: { ys_addrAt: stamp(s) } }, ADDR_RULE)),
      c(
        'weekend',
        'Leave it for the first quiet weekend.',
        ok('On Saturday you remember, and it is done before lunch.', { legal: 3, wellbeing: 1, flags: { ys_addrAt: stamp(s) } }, ADDR_RULE),
        {
          roll: { base: 60, mods: [legal('your habits with paperwork')] },
          fail: bad('The weekend fills up, and then the month. A government envelope reaches you three weeks late, by way of your old neighbor.', { legal: -4, wellbeing: -2, flags: { ys_addrAt: stamp(s) } }, 'Small forms are easy to lose in a move.', ADDR_RULE),
        },
      ),
      c('forward', 'Set up mail forwarding and count that as done.', bad('The forwarding works for most things. One official letter does not follow you.', { legal: -3, flags: { ys_addrAt: stamp(s) } }, 'Forwarded mail is not a current record.', `${ADDR_RULE} Mail forwarding does not update immigration records.`)),
    ],
  }), { statuses: ['LPR', 'H1B', 'O1', 'ASYLEE'], when: (s) => settled(s) && band(s, 1) && due(s, 'ys_addrAt', 5), oddsPerYear: 0.45 }),

  def('ys-lpr-lost-card', 'status', 1.3, (s) => ({
    id: 'ys-lpr-lost-card',
    track: 'status',
    title: 'Your wallet is gone',
    body: 'Somewhere between the bus and the grocery store, your wallet disappeared. The bank cards can be cancelled by phone. Your green card was in it too.',
    stage: 'street',
    cast: [{ ...YOU, pose: 'think' }, { role: 'stranger', pose: 'walk' }],
    choices: [
      c('replace', `File for a replacement card this week (fee is an estimate, about $${cost(s, 465)}).`, ok('A receipt notice arrives first, and months later a new card. You stop carrying your whole life in one pocket.', { money: -cost(s, 465), legal: 4, flags: { ys_lostCard: true } }, 'Permanent residents aged 18 or over must carry their card at all times (INA 264(e)). A lost card is replaced with Form I-90; the fee here is an estimate.')),
      c('police', 'Report the theft to the police first, then file with the report number.', ok('An hour at the station and a slip of paper. The replacement goes in with a clean record of what happened.', { money: -cost(s, 465), legal: 5, wellbeing: -2, flags: { ys_lostCard: true } }, 'Permanent residents aged 18 or over must carry their card at all times (INA 264(e)). The replacement fee here is an estimate.')),
      c('wait', 'Wait and see if it turns up. There is a photo of the card on your phone.', bad('A month on, a new employer asks to see the original for their paperwork. You have a photo and an apology.', { legal: -4, career: -2, flags: { ys_lostCard: true } }, 'The status is permanent. The proof has to be in your hand.', 'Permanent residents aged 18 or over must carry their card at all times (INA 264(e)). A photo is not the card.')),
    ],
  }), { statuses: LPR, when: (s) => band(s, 1) && !has(s, 'ys_lostCard'), oddsPerYear: 0.3 }),

  def('ys-lpr-jury-form', 'status', 1.3, () => ({
    id: 'ys-lpr-jury-form',
    track: 'status',
    title: 'A jury summons, too early',
    body: 'An official envelope from the court: you are summoned for jury duty. The first question on the form asks whether you are a citizen of the United States. You pay taxes here and have for years.',
    stage: 'apartment',
    cast: [{ ...YOU, pose: 'think' }],
    choices: [
      c('no', 'Answer no, and send the form back on time.', ok('A short letter excuses you. You keep a copy with your papers.', { legal: 4, flags: { ys_juryLpr: true } }, 'Federal jurors must be US citizens (28 U.S.C. 1865(b)(1)). A summons that reaches a permanent resident still has to be answered, truthfully.')),
      c('yes', 'Tick yes. You want to do your part.', bad('You are called in, and a clerk looks twice at your ID. The afternoon ends in a long, uncomfortable conversation.', { legal: -12, wellbeing: -4, flags: { ys_juryLpr: true } }, 'The wish was good. The box was not yours yet.', 'A noncitizen who falsely represents themselves to be a US citizen for any purpose or benefit under federal or state law is deportable (INA 237(a)(3)(D)). In real life, see an attorney before doing anything else.')),
      c('drawer', 'Put it in a drawer. It was clearly sent by mistake.', bad('A second notice arrives, in bold type.', { legal: -3, wellbeing: -1 }, 'A mistake still needs an answer.', 'Federal jurors must be US citizens (28 U.S.C. 1865(b)(1)). The form has to be returned even when the answer is no.')),
    ],
  }), { statuses: LPR, when: (s) => band(s, 2) && !has(s, 'ys_juryLpr'), oddsPerYear: 0.35 }),

  def('ys-lpr-tax-idea', 'status', 1.3, (s) => ({
    id: 'ys-lpr-tax-idea',
    track: 'status',
    title: 'A clever tax idea',
    body: 'At tax time a preparer notices how many weeks you spent at home this year. He says he could file you as a nonresident and cut the bill by a good amount. "Lots of people do it."',
    stage: 'bank',
    cast: [{ ...YOU, pose: 'sit' }, { role: 'teller', pose: 'talk' }],
    choices: [
      c('resident', 'File as a resident, as every year, and pay the full amount.', ok('The bill hurts for a week. The return matches the life you actually live.', { money: -cost(s, 400), legal: 4, flags: { ys_taxIdea: true } }, 'For tax, a green card holder is a US resident (IRS, green card test). A permanent resident who claims nonresident status to lower income tax raises a presumption of having given up permanent residence (8 CFR 316.5(c)(2)).')),
      c('second', 'Thank him, and ask a second preparer who works with immigrants.', ok('She frowns at the idea before you finish the sentence, and files you correctly.', { money: -cost(s, 520), legal: 6, flags: { ys_taxIdea: true } }, 'A permanent resident who claims nonresident status to lower income tax raises a presumption of having given up permanent residence (8 CFR 316.5(c)(2)).')),
      c('save', 'Take the saving.', bad('The refund is larger than you have ever had. The return now says, in the government\'s own boxes, that you do not live here.', { money: cost(s, 900), legal: -10, flags: { ys_taxIdea: true } }, 'The saving has a price that does not show on the return.', 'A permanent resident who claims nonresident alien status for tax raises a rebuttable presumption of having relinquished permanent residence (8 CFR 316.5(c)(2)). It surfaces at naturalization and at the border.')),
    ],
  }), { statuses: LPR, when: (s) => band(s, 2) && hasJob(s) && !has(s, 'ys_taxIdea'), oddsPerYear: 0.35, months: [6, 7, 8] }),

  def('ys-lpr-counting-days', 'life', 1.4, (s) => ({
    id: 'ys-lpr-counting-days',
    track: 'life',
    title: 'Counting days abroad',
    body: `Your visits home have been getting longer${yearsHere(s) >= 10 ? ', as the people there get older' : ''}. This year the family asks for five months, maybe seven. ${has(s, 'ys_travelLog') ? 'Your list of travel dates is already two pages long.' : 'You have heard that long absences matter for a green card and for citizenship.'}`,
    stage: 'airport',
    cast: [{ ...YOU, pose: 'carry' }, { role: 'parent', pose: 'wave' }],
    choices: [
      c('five', 'Go for five months, and write down every departure and return date.', ok('Long enough to be useful, short enough to come back to a life that waited. The dates go in the notebook.', { family: 8, money: -cost(s, 1800), wellbeing: 2, legal: 2, flags: { ys_daysAt: stamp(s), ys_travelLog: true } }, 'Naturalization needs physical presence here for at least half of the required period (INA 316(a)), and the application asks for every trip. An absence under six months does not raise the presumption of a break.')),
      c('seven', 'Stay seven months. Keep your lease, your job on leave and your bills paid here.', ok('You come back to a dusty apartment and a patient employer. The officer asks why you were gone so long, and you have answers and papers.', { family: 11, money: -cost(s, 2600), career: -3, legal: -4, flags: { ys_daysAt: stamp(s) } }, 'An absence of more than six months but less than a year disrupts continuous residence for naturalization unless you show otherwise, for example that you kept your job, your home and your family here (8 CFR 316.5(c)(1)(i)). After more than 180 days away a permanent resident is treated as seeking admission (INA 101(a)(13)(C)(ii)).')),
      c('short', 'Go for three weeks, twice.', ok('Two rushed visits and two expensive tickets. You are there for one birthday and miss another.', { family: 4, money: -cost(s, 2400), wellbeing: -1, flags: { ys_daysAt: stamp(s) } })),
    ],
  }), { statuses: LPR, when: (s) => band(s, 2) && due(s, 'ys_daysAt', 4), oddsPerYear: 0.5 }),

  def('ys-lpr-civics', 'status', 1.4, (s) => {
    const older = (age(s) >= 50 && yearsInStatus(s) >= 20) || (age(s) >= 55 && yearsInStatus(s) >= 15);
    const rule = older
      ? 'Applicants must show English and knowledge of US history and government (INA 312(a)). The English requirement does not apply to a person over 50 with 20 years as a permanent resident, or over 55 with 15 years; the civics requirement still does (INA 312(b)(2)).'
      : 'Applicants must show an understanding of English and of US history and government (INA 312(a)). An applicant who does not pass gets a second opportunity within 90 days (8 CFR 312.5(a)).';
    return {
      id: 'ys-lpr-civics',
      track: 'status',
      title: 'Flashcards on the bus',
      body: `The library runs a free citizenship class on weeknights: reading and writing in English, and questions on history and government. ${older ? 'At your age and after this many years with a green card, the English part no longer applies to you, though the civics questions do.' : 'You are not sure your English is ready for an officer.'} The class is ten weeks of evenings you do not have.`,
      stage: 'library',
      cast: [{ ...YOU, pose: 'sit' }, { role: 'advisor', pose: 'present' }],
      choices: [
        c('class', 'Take the class, every week.', ok('Twelve people from nine countries argue about how many senators there are. By the end you are helping the newer ones.', { study: 6, community: 4, wellbeing: -2, flags: { ys_civics: true } }, rule)),
        c('alone', 'Study alone with flashcards on the bus.', ok('The cards go soft at the corners. You know more than you think, and less than the class would have taught you.', { study: 3, flags: { ys_civics: true } }, rule)),
        c('later', 'Not this year.', ok('The flyer stays on the fridge. The class runs every season.', { wellbeing: 1 }, rule)),
      ],
    };
  }, { statuses: LPR, when: (s) => yearsInStatus(s) >= 3 && !has(s, 'ys_civics') && !has(s, 'n400Study') }),

  def('ys-lpr-decide', 'life', 1.5, (s) => {
    const mind = String(s.flags.ys_natzMind ?? '');
    return {
      id: 'ys-lpr-decide',
      track: 'life',
      title: 'Citizen, or not?',
      body: `You have held a green card for ${yearsInStatus(s)} years. ${mind === 'no' ? 'You once decided to stay a permanent resident, and the question has come back anyway.' : mind === 'yes' ? 'You meant to apply for citizenship and have not yet.' : 'You could have applied for citizenship by now, and have not.'} A friend who took the oath asks, kindly, what is holding you back.`,
      stage: 'cafe',
      cast: [{ ...YOU, pose: 'think' }, { role: 'friend', pose: 'talk' }],
      choices: [
        c('yes', 'Decide to apply at the next chance.', ok('Saying it aloud makes it real. You start a list of every address and every trip.', { wellbeing: 3, legal: 2, flags: { ys_natzAskAt: stamp(s), ys_natzMind: 'yes' } })),
        c('stay', 'Stay a permanent resident. Your first citizenship is part of who you are.', ok('Your friend nods. It is a real choice, and it is yours.', { family: 3, wellbeing: 2, flags: { ys_natzAskAt: stamp(s), ys_natzMind: 'no' } }, 'Naturalization is optional. A permanent resident may not vote in federal elections (18 U.S.C. 611), can lose the use of the card after a year abroad (8 CFR 211.1(a)(2)) and can be deported for certain crimes (INA 237(a)(2)).')),
        c('consulate', "Ask your home country's consulate what you would keep and what you would lose.", ok('A clerk gives you the answer in writing. Now the decision rests on facts.', { legal: 3, family: 1, money: -cost(s, 40), flags: { ys_natzAskAt: stamp(s), ys_natzMind: 'asked' } }, HOME_LAW)),
      ],
    };
  }, { statuses: LPR, when: (s) => yearsInStatus(s) >= 6 && !has(s, 'n400Filed') && !has(s, 'conditionalGC') && due(s, 'ys_natzAskAt', 5) }),

  def('ys-lpr-parent-asks', 'life', 1.4, (s) => ({
    id: 'ys-lpr-parent-asks',
    track: 'life',
    title: 'A parent asks',
    body: 'Your mother\'s voice on the phone is careful. She is getting older. She asks, as if it were a small thing, whether your green card means she could come and live near you.',
    stage: 'apartment-night',
    cast: [{ ...YOU, pose: 'phone' }, { role: 'parent', pose: 'talk' }],
    choices: [
      c('truth', 'Tell her the truth: only a citizen can petition for a parent. Start counting your years.', ok('She is quiet, then practical. She asks how many years. You tell her, and she says she can wait that long.', { family: 3, wellbeing: -1, flags: { ys_parentAsked: true } }, 'Parents can be petitioned only by a US citizen aged 21 or over (INA 201(b)(2)(A)(i)). A permanent resident may petition only for a spouse and unmarried sons and daughters (INA 203(a)(2)).')),
      c(
        'visit',
        'Invite her for a long visit on a visitor visa instead.',
        ok('She gets the visa and spends a spring with you, cooking too much and rearranging your shelves.', { family: 10, wellbeing: 4, money: -cost(s, 1800), flags: { ys_parentAsked: true } }, 'A visit is temporary: a visitor may not work and has an end date (8 CFR 214.2(b)). The visa is decided at the consulate and is never guaranteed.'),
        {
          roll: { base: 60 },
          fail: bad('The consulate refuses the visitor visa. She says it does not matter, in the voice that means it does.', { family: -2, wellbeing: -4, money: -cost(s, 200), flags: { ys_parentAsked: true } }, 'You tried to give her what the rules allowed.', 'A visitor visa is decided at the consulate and is never guaranteed. Parents can be petitioned only by a US citizen aged 21 or over (INA 201(b)(2)(A)(i)).'),
        },
      ),
      c('promise', 'Promise her you will arrange it somehow.', bad('She tells the neighbors. You do not know how to tell her there is no form for it yet.', { family: 2, wellbeing: -5, flags: { ys_parentAsked: true } }, 'A kind promise can become a heavy one.', 'A permanent resident cannot petition for a parent; only a citizen aged 21 or over can (INA 201(b)(2)(A)(i)).')),
    ],
  }), { statuses: LPR, when: (s) => band(s, 2) && !has(s, 'ys_parentAsked'), oddsPerYear: 0.5 }),

  def('ys-cousin-asks', 'life', 1.2, (s) => ({
    id: 'ys-cousin-asks',
    track: 'life',
    title: 'A cousin asks for papers',
    body: `A cousin you grew up with sends a long message. Things are hard at home, and everyone there says you can "file" for family now${is(s, 'CITIZEN') ? ' that you are a citizen' : ''}. He wants to know how soon he can come.`,
    stage: 'apartment-night',
    cast: [{ ...YOU, pose: 'phone' }],
    choices: [
      c('truth', 'Tell him plainly: there is no petition for a cousin.', ok('He takes a day to answer. Then: "Thank you for not lying to me."', { family: 2, wellbeing: -1, flags: { ys_cousinAsked: true } }, 'Family petitions exist only for spouses, children, parents and brothers or sisters, and the last two only for citizens aged 21 or over (INA 201(b)(2)(A)(i), 203(a)). There is no petition for a cousin, a niece or a nephew.')),
      c('routes', 'Explain, then spend evenings helping him look at study and work routes of his own.', ok('Three long calls and a shared document. It is slower than a miracle, and it is real.', { family: 6, wellbeing: -2, flags: { ys_cousinAsked: true } }, 'There is no family petition for a cousin (INA 203(a)). Study and work visas are applied for by the person, on their own merits.')),
      c('agent', 'Lend him the fee for an agent who says cousins can be "added" to a petition.', bad('The agent takes the money and sends a form with a seal on it. Nothing follows.', { money: -cost(s, 1200), family: -3, wellbeing: -4, flags: { ys_cousinAsked: true } }, 'There was nothing to be added to.', 'There is no petition for a cousin (INA 203(a)). Anyone selling one is selling nothing.')),
      c('unread', 'Leave the message unanswered for now.', bad('Weeks pass. At a family call he does not meet your eye on the screen.', { family: -5 }, 'Silence was an answer too, and not the one you meant.')),
    ],
  }), { statuses: ['LPR', 'CITIZEN'], when: (s) => band(s, 4) && !has(s, 'ys_cousinAsked'), oddsPerYear: 0.4 }),

  def('ys-lpr-old-case', 'status', 1.2, (s) => ({
    id: 'ys-lpr-old-case',
    track: 'status',
    title: "A coworker's old case",
    body: 'A man at work has had a green card for twenty years. Last month he was told that a conviction from his twenties could cost him his status, and now he has a date in immigration court. He always thought the card was forever.',
    stage: 'workplace',
    cast: [{ ...YOU, pose: 'talk' }, { role: 'friend', pose: 'think' }],
    choices: [
      c('check', 'Book a consultation about your own record before your next filing or trip.', ok('The attorney goes through your history and finds nothing to worry about. You had not known how much you wanted to hear that.', { money: -cost(s, 150), legal: 5, wellbeing: 2, flags: { ys_oldCase: true } }, `A permanent resident can be placed in removal proceedings for certain convictions, including an aggravated felony at any time after admission and most drug offenses (INA 237(a)(2)). How an old offense is classified depends on the exact charge. ${ASSESS}`)),
      c('hearing', 'Drive him to his hearing and sit with his family in the corridor.', ok('The judge sets another date. His wife holds your hand for a moment on the way out.', { community: 6, wellbeing: -2, flags: { ys_oldCase: true } }, 'A permanent resident can be deported for certain convictions (INA 237(a)(2)). A person in removal proceedings may have a lawyer, at no expense to the government (INA 292).')),
      c('distance', 'Keep your distance. It feels as if bad luck could spread.', bad('You nod at him in the corridor and walk faster. He notices.', { community: -3, wellbeing: -2, flags: { ys_oldCase: true } }, 'Fear made the room smaller.')),
    ],
  }), { statuses: LPR, when: (s) => band(s, 7) && !has(s, 'ys_oldCase'), oddsPerYear: 0.35 }),
];

// ------------------------------------------------------------------ citizens
const CIT: StatusCode[] = ['CITIZEN'];

const CIT_CARDS: ChallengeDef[] = [
  def('ys-cit-jury', 'life', 1.3, (s) => ({
    id: 'ys-cit-jury',
    track: 'life',
    title: 'Jury duty',
    body: `A summons from the court. ${seen(s, 'ys_juryAt') ? 'You know the routine now: the waiting room, the bad coffee, the long morning.' : 'The form asks if you are a citizen, and for the first time the answer is yes.'} Your manager sighs when you mention the date.`,
    stage: 'court',
    cast: [{ ...YOU, pose: 'sit' }, { role: 'stranger', pose: 'sit' }],
    choices: [
      c('serve', 'Go, and serve if you are picked.', ok("You are picked for a two-day trial. Twelve strangers weigh someone else's life carefully, and your voice counts as much as any.", { community: 6, wellbeing: 3, money: -cost(s, 150), flags: { ys_juryAt: stamp(s) } }, 'A federal juror must be a US citizen aged 18 or over who has lived in the district for a year and can read, write, speak and understand English (28 U.S.C. 1865(b)).')),
      c('postpone', 'Ask the court for a later date. Work is at a bad moment.', ok('The clerk gives you a date in the spring. Your manager is relieved.', { career: 1, flags: { ys_juryAt: stamp(s) } })),
      c('ignore', 'Ignore it. They have plenty of people.', bad('A second notice arrives with a warning in it.', { legal: -3, wellbeing: -1, flags: { ys_juryAt: stamp(s) } }, 'This was one of the duties that came with the oath.', 'Jury service is limited to citizens (28 U.S.C. 1865(b)(1)). A summons has to be answered.')),
    ],
  }), { statuses: CIT, when: (s) => due(s, 'ys_juryAt', 6), oddsPerYear: 0.45 }),

  def('ys-cit-first-return', 'status', 1.8, (s) => {
    const pp = has(s, 'usPassport');
    const rule = 'A US citizen must bear a valid US passport to leave or enter the United States (INA 215(b)).';
    return {
      id: 'ys-cit-first-return',
      track: 'status',
      title: pp ? 'The other line at the airport' : 'A trip, and the wrong passport',
      body: pp
        ? 'You land after your first trip abroad as a citizen. The hall splits in two, and for the first time you follow the sign for US citizens. Your hand still reaches for a folder of papers you no longer need.'
        : 'A trip abroad is coming, and you have only your old passport and your naturalization certificate. A friend says the certificate will do at the border.',
      stage: 'airport',
      cast: [{ ...YOU, pose: pp ? 'walk' : 'think' }, { role: pp ? 'officer' : 'friend', pose: 'talk' }],
      choices: pp
        ? [
            c('passport', 'Hand over the blue passport and nothing else.', ok('"Welcome home," the officer says. Thirty seconds. On the other side you stand still for a moment, close to tears.', { wellbeing: 8, legal: 2, flags: { ys_citReturn: true } }, rule)),
            c('folder', 'Bring the whole folder anyway. Old habits.', ok('Nobody asks for it. You carry it home unopened and laugh at yourself a little.', { wellbeing: 4, legal: 1, flags: { ys_citReturn: true } }, rule)),
            c('call', 'Go through, then call home from the baggage belt to tell them how it went.', ok('Your family wants every detail: which line, what the officer said, how long. You tell it twice.', { family: 6, wellbeing: 5, flags: { ys_citReturn: true } }, rule)),
          ]
        : [
            c('apply', `Get a US passport first and move the trip (about $${cost(s, 365)} in all, an estimate).`, ok('The trip moves by six weeks. You travel with the right document and no knot in your stomach.', { money: -cost(s, 365), legal: 4 }, rule)),
            c('risk', 'Travel on the old passport and the certificate.', bad('The airline agent on the way back takes a long time over your papers, and so does the officer after her.', { legal: -4, wellbeing: -6, flags: { ys_citReturn: true } }, 'You were a citizen the whole time. The paper to show it was missing.', rule)),
            c('cancel', 'Cancel the trip for now.', ok('You stay. The certificate goes back in its folder, and the passport form goes on the fridge.', { family: -2, wellbeing: -1 }, rule)),
          ],
    };
  }, { statuses: CIT, when: (s) => !has(s, 'ys_citReturn'), oddsPerYear: 0.6 }),

  def('ys-cit-passport-renew', 'status', 1.5, (s) => {
    const rule = "An adult's US passport is valid for ten years (22 CFR 51.4(b)(1)), and a citizen needs a valid one to leave or enter (INA 215(b)). Fees here are estimates.";
    return {
      id: 'ys-cit-passport-renew',
      track: 'status',
      title: 'Ten years of stamps',
      body: 'Your first US passport expires this year. The photo shows someone ten years younger, taken the week after the oath. Every page tells you where you went once you could.',
      stage: 'apartment',
      cast: [{ ...YOU, pose: 'think' }],
      choices: [
        c('renew', `Renew it now (about $${cost(s, 130)}, an estimate).`, ok('The new one arrives with empty pages. You keep the old one, corner clipped, in the folder with everything else.', { money: -cost(s, 130), legal: 4, wellbeing: 2, flags: { ys_ppRenewed: true } }, rule)),
        c('both', 'Renew it, and ask the consulate whether your passport from home can be renewed too.', ok('One answer is quick and one takes three visits. In the end you know exactly which documents are yours.', { money: -cost(s, 260), legal: 4, family: 3, flags: { ys_ppRenewed: true } }, `${rule} ${HOME_LAW}`)),
        c('later', 'Later. No trips are planned.', bad('Months later someone at home falls ill, and the fastest flight leaves without you while a rush renewal is processed.', { family: -4, wellbeing: -4, money: -cost(s, 250), flags: { ys_ppRenewed: true } }, 'Trips home are not always planned.', rule)),
      ],
    };
  }, { statuses: CIT, when: (s) => yearsInStatus(s) >= 9 && has(s, 'usPassport') && !has(s, 'ys_ppRenewed') }),

  def('ys-cit-parent-arrives', 'life', 2, (s) => ({
    id: 'ys-cit-parent-arrives',
    track: 'life',
    title: 'The promise you sign',
    body: 'The petition you filed for your parents has reached the consulate at home. Before the interview you must sign an affidavit of support: a promise, enforceable in court, to keep them above a set income line. Your mother asks whether there will be room for her sewing machine.',
    stage: 'apartment',
    cast: [{ ...YOU, pose: 'type' }, { role: 'parent', pose: 'talk' }],
    choices: [
      c('sign', 'Sign it, and get the spare room ready.', ok('She walks out of the arrivals hall with a suitcase full of food she was told not to bring. The apartment is louder and warmer from that day.', { family: 14, wellbeing: 6, money: -cost(s, 2500), flags: { ys_parentCame: true } }, 'A family sponsor promises to maintain the immigrant at no less than 125 percent of the federal poverty line, and the promise is legally enforceable (INA 213A(a)(1)).')),
      c('half', 'Sign, and agree she will spend part of each year at home at first.', ok('She comes for the summer and goes back for the winter. It works for now, and everyone knows it cannot work forever.', { family: 9, money: -cost(s, 1900), flags: { ys_parentCame: true } }, 'A green card is for living here. It works as an entry document only after an absence of less than one year (8 CFR 211.1(a)(2)), and long stays abroad can be read as giving residence up.')),
      c('stay', 'Listen when your parents say they are too old to start again.', ok('Your mother says her garden cannot be left. You hear relief and sorrow in the same sentence, and you promise to visit more often.', { family: 4, wellbeing: -3, flags: { ys_parentCame: true } }, 'Parents of a citizen aged 21 or over are immediate relatives with no yearly limit (INA 201(b)(2)(A)(i)). The petition gives them a choice; it does not make it for them.')),
    ],
  }), { statuses: CIT, when: (s) => has(s, 'petitionedFamily') && !has(s, 'ys_parentCame') }),

  def('ys-cit-asked-how', 'life', 1.4, (s) => ({
    id: 'ys-cit-asked-how',
    track: 'life',
    title: 'How did you do it?',
    body: `At a community dinner, a young couple who arrived last year find you. ${seen(s, 'ys_askedAt') ? 'It happens more often now: people are sent to you.' : 'Someone told them you have been through all of it.'} They have a folder, a deadline and a great deal of hope.`,
    stage: 'festival',
    cast: [{ ...YOU, pose: 'talk' }, { role: 'stranger', pose: 'talk' }, { role: 'stranger', pose: 'idle' }],
    choices: [
      c('story', "Tell them your own story, bad years included, and give them the legal clinic's number.", ok('They listen as if you were reading from a map. You tell them it is only your road, and where to find someone who can read theirs.', { community: 6, wellbeing: 3, flags: { ys_askedAt: stamp(s) } }, `Sharing your story is a gift. Advice on their case is different work. ${ASSESS}`)),
      c('with', "Go with them to the clinic's intake day and wait in line beside them.", ok('Four hours in a corridor. You translate, hold the folder and remember exactly how this felt.', { community: 9, wellbeing: 1, money: -cost(s, 60), flags: { ys_askedAt: stamp(s) } }, ASSESS)),
      c('forms', 'Offer to fill in their forms yourself. You remember how.', bad('You do your best from memory. Weeks later they call: a notice says something was filed the wrong way.', { community: -2, wellbeing: -4, flags: { ys_askedAt: stamp(s) } }, 'Your road is not a map of theirs.', `Forms, fees and rules change, and yours were years ago. ${ASSESS}`)),
    ],
  }), { statuses: CIT, when: (s) => band(s, 6) && due(s, 'ys_askedAt', 4), oddsPerYear: 0.6 }),

  def('ys-cit-visit-home', 'life', 1.5, (s) => {
    const first = !seen(s, 'ys_homeVisitAt');
    return {
      id: 'ys-cit-visit-home',
      track: 'life',
      title: 'A visitor where you were born',
      body: first
        ? 'You fly home for the first time since the oath. At the airport you grew up near, the signs sort people into citizens and foreigners, and you are no longer sure which line is yours.'
        : `Home again, ${yearsHere(s)} years after you left. The shop on the corner has a new name, and the children call you by the word for an older relative. You are a guest in a place you can still walk blindfolded.`,
      stage: 'airport',
      cast: [{ ...YOU, pose: 'carry' }, { role: 'officer', pose: 'idle' }],
      choices: [
        c('ask', 'Check with the consulate before flying which passport to use and whether you need a visa.', ok('One email saves an hour at the desk. You arrive in the right line with the right papers.', { legal: 3, family: 6, money: -cost(s, 1650), flags: { ys_homeVisitAt: stamp(s) } }, `${HOME_LAW} On the US side, a citizen must leave and enter on a US passport (INA 215(b)).`)),
        c(
          'old',
          'Use your old passport at home, as you always did.',
          ok('The officer stamps it without looking up. You are through before your suitcase is.', { family: 6, wellbeing: 2, money: -cost(s, 1600), flags: { ys_homeVisitAt: stamp(s) } }, HOME_LAW),
          {
            roll: { base: 65 },
            fail: bad('The officer studies the old passport, then asks whether you hold another nationality. It takes an hour and a form you did not expect.', { family: 4, wellbeing: -5, money: -cost(s, 1700), flags: { ys_homeVisitAt: stamp(s) } }, 'The rules at home changed for you the day you took the oath.', `Some countries end citizenship when you naturalize elsewhere, and an old passport can then be a problem. ${HOME_LAW}`),
          },
        ),
        c('kitchen', "Keep it short, and spend all of it in your family's kitchen.", ok('Ten days of being fed and scolded. Nobody asks what you are now. They ask when you are coming back.', { family: 9, wellbeing: 4, money: -cost(s, 1400), flags: { ys_homeVisitAt: stamp(s) } })),
      ],
    };
  }, { statuses: CIT, when: (s) => band(s, 4) && due(s, 'ys_homeVisitAt', 6), oddsPerYear: 0.55 }),

  def('ys-cit-dual', 'status', 1.3, (s) => ({
    id: 'ys-cit-dual',
    track: 'status',
    title: 'Two nationalities, or one',
    body: 'A relative calls about the family house. To put your name on the papers, the office at home needs to know one thing: are you still a citizen there? You realize you have never asked.',
    stage: 'apartment-night',
    cast: [{ ...YOU, pose: 'phone' }, { role: 'parent', pose: 'talk' }],
    choices: [
      c('writing', 'Ask the consulate for the answer in writing.', ok('It takes two visits and a fee. The letter that comes back settles the question for the house and for every trip after.', { money: -cost(s, 80), legal: 4, family: 2, flags: { ys_dualAsked: true } }, HOME_LAW)),
      c('assume', 'Sign as a citizen of home. You were born there.', bad('Months later the papers come back with a query, and a relative has to sort it out in person.', { family: -4, legal: -2, flags: { ys_dualAsked: true } }, 'Being born somewhere and being its citizen today can be two questions.', HOME_LAW)),
      c('siblings', 'Let the others hold the house in their names.', ok('It is simpler. It also feels like closing a door quietly behind you.', { family: 3, wellbeing: -2, flags: { ys_dualAsked: true } })),
    ],
  }), { statuses: CIT, when: (s) => !has(s, 'ys_dualAsked'), oddsPerYear: 0.45 }),

  def('ys-cit-ballot', 'life', 1.3, (s) => ({
    id: 'ys-cit-ballot',
    track: 'life',
    title: 'A small election',
    body: `A local election: the school board, a judge, a measure about bus routes. Hardly anyone you know plans to vote. ${yearsInStatus(s) >= 8 ? 'You have rarely missed one since the oath.' : 'It is nothing like your first ballot.'}`,
    stage: 'street',
    cast: [{ ...YOU, pose: 'walk' }, { role: 'stranger', pose: 'talk' }],
    choices: [
      c('read', 'Read the voter guide properly and vote.', ok('Twenty minutes of small print, five minutes in a booth. The bus measure passes by a few hundred votes.', { community: 4, wellbeing: 2, flags: { ys_ballotAt: stamp(s) } })),
      c('neighbors', 'Vote, and translate the guide for two neighbors who are new citizens.', ok('Your kitchen table becomes a small civics class. One of them brings dessert.', { community: 8, wellbeing: -1, flags: { ys_ballotAt: stamp(s) } })),
      c('skip', 'Skip this one.', bad('The bus measure loses by a handful of votes. Your route is one of the ones cut.', { community: -2, flags: { ys_ballotAt: stamp(s) } }, 'Small elections are decided by the few who show up.')),
    ],
  }), { statuses: CIT, months: [3], when: (s) => has(s, 'voted') && due(s, 'ys_ballotAt', 3) }),

  def('ys-cit-looking-back', 'life', 1.3, (s) => ({
    id: 'ys-cit-looking-back',
    track: 'life',
    title: 'The folder',
    body: `You have been here ${yearsHere(s)} years. Tonight you find the folder: the first document you were given here, old receipts, the certificate from the oath. ${hasChild(s) ? 'Your child asks what all the papers are.' : 'A younger friend, helping you move a shelf, asks what all the papers are.'}`,
    stage: 'apartment-night',
    cast: [{ ...YOU, pose: 'sit' }, { role: 'friend', pose: 'idle' }],
    choices: [
      c('tell', 'Tell the whole story, in order, including the years you were afraid.', ok('It takes until midnight. Some of it you have never said in one piece before.', { family: 6, wellbeing: 4, flags: { ys_lookAt: stamp(s) } })),
      c('write', 'Write it down, dates and all, while you still remember.', ok('Eleven pages. You are surprised by how much of it is waiting, and how much of the waiting was living.', { wellbeing: 5, community: 2, flags: { ys_lookAt: stamp(s) } })),
      c('close', 'Say "a long story" and close the folder.', ok('You put it back on the shelf. Not everything has to be told this year.', { wellbeing: 1, flags: { ys_lookAt: stamp(s) } })),
    ],
  }), { statuses: CIT, when: (s) => band(s, 10) && yearsInStatus(s) >= 2 && due(s, 'ys_lookAt', 7) }),
];

// ------------------------------------------------------------------ H-1B and O-1: the long wait
const WORKER: StatusCode[] = ['H1B', 'O1'];

const WORKER_CARDS: ChallengeDef[] = [
  def('ys-h1b-pieces', 'life', 1.4, (s) => {
    const o1 = is(s, 'O1');
    return {
      id: 'ys-h1b-pieces',
      track: 'life',
      title: o1 ? 'A life one year at a time' : 'A life in three-year pieces',
      body: `A new approval notice goes into the folder with the others. ${yearsHere(s) >= 10 ? 'You have stopped counting how many there are. ' : ''}Every plan you make has an end date printed on it. Your landlord offers a two-year lease at a better rent, and you hesitate over a date again.`,
      stage: 'apartment',
      cast: [{ ...YOU, pose: 'think' }, { role: 'landlord', pose: 'talk' }],
      choices: [
        c('commit', 'Sign the longer lease and buy the good mattress.', ok('The apartment starts to look like someone lives in it on purpose.', { wellbeing: 5, money: -cost(s, 700), flags: { ys_piecesAt: stamp(s) } }, 'An H-1B petition is approved for up to three years at a time and an O-1 extension for up to one (8 CFR 214.2(h)(9)(iii)(A)(1), (h)(15)(ii)(B)(1), (o)(12)(ii)). The wait for a green card is lived inside those dates.')),
        c('light', 'Keep everything short-term and easy to sell.', ok('You save money and own nothing heavy. The folding chairs are still folding chairs.', { money: cost(s, 250), wellbeing: -3, flags: { ys_piecesAt: stamp(s) } })),
        c('talk', `Sit down with ${hasPartner(s) ? 'your partner' : 'a close friend'} and say out loud what you would do if it ended.`, ok('The plan fits on one page: savings, who to call, where you would go. Having it makes the lease easier to sign.', { wellbeing: 3, family: 3, legal: 1, flags: { ys_piecesAt: stamp(s) } }, 'If the job ends, H-1B and O-1 workers have a grace period of up to 60 days (8 CFR 214.1(l)(2)). A plan made in a calm month is worth more than one made in those 60 days.')),
      ],
    };
  }, { statuses: WORKER, when: (s) => band(s, 3) && hasJob(s) && !has(s, 'inGrace') && due(s, 'ys_piecesAt', 3) }),

  def('ys-h1b-stamp', 'status', 1.5, (s) => {
    const rule = 'An arriving nonimmigrant must present a valid, unexpired visa (8 CFR 212.1). An approval notice from inside the US extends the stay, not the visa stamp; a new stamp normally comes from a consulate abroad, and the time it takes is not yours to control. Waits here are designed estimates.';
    return {
      id: 'ys-h1b-stamp',
      track: 'status',
      title: 'The stamp in your passport',
      body: `${yearsHere(s) >= 8 ? 'Someone you love at home is unwell, and you want to go.' : 'There is a wedding at home, and everyone expects you.'} Your approval notice lets you stay and work, but the visa stamp in your passport has expired. To come back in you would need a new one from the consulate.`,
      stage: 'apartment-night',
      cast: [{ ...YOU, pose: 'phone' }, { role: 'parent', pose: 'talk' }],
      choices: [
        c(
          'go',
          'Go, with a consulate appointment booked and three weeks of buffer.',
          ok('The interview takes four minutes. The passport comes back with a new stamp, and you are there for the day that mattered.', { family: 10, wellbeing: 3, money: -cost(s, 2200), flags: { ys_stampAt: stamp(s) } }, rule),
          {
            roll: { base: 75, mods: [legal('a clean record')] },
            fail: bad("The officer keeps your passport for more checks. Three weeks become nine, and you work odd hours from a relative's spare room.", { family: 8, career: -4, wellbeing: -6, money: -cost(s, 3800), flags: { ys_stampAt: stamp(s) } }, 'The trip was right. The timing was not yours to control.', rule),
          },
        ),
        c('lawyer', "Ask the company's lawyer to check your papers first, and travel at a quieter time.", ok('She reviews the file and finds it clean. You miss the day itself and arrive a month later, to a calmer house.', { family: 5, legal: 3, money: -cost(s, 2300), flags: { ys_stampAt: stamp(s) } }, rule)),
        c('stay', 'Stay, and send a gift and a long video message.', ok('Your message is played for the whole room. Someone films the room watching it and sends that back to you.', { family: -3, wellbeing: -3, flags: { ys_stampAt: stamp(s) } }, rule)),
      ],
    };
  }, { statuses: WORKER, when: (s) => band(s, 2) && hasJob(s) && !has(s, 'inGrace') && due(s, 'ys_stampAt', 4), oddsPerYear: 0.55 }),

  def('ys-h1b-spouse', 'life', 1.5, (s) => {
    const open = is(s, 'H1B') && has(s, 'i140Approved') && !has(s, 'ys_spouseEad');
    const rule = 'An H-4 spouse may apply for work permission only when the H-1B worker has an approved I-140 or certain extensions past six years (8 CFR 214.2(h)(9)(iv)). An O-3 spouse may not accept employment unless separately authorized (8 CFR 214.2(o)(6)(iv)).';
    return {
      id: 'ys-h1b-spouse',
      track: 'life',
      title: "Your spouse's work",
      body: open
        ? 'Your I-140 is approved, which means your spouse can now ask for a work permit of their own. They have been at home for a long time. They read the rule twice, as if it might change.'
        : `Your spouse came as your dependent and may not take a job. ${yearsHere(s) >= 5 ? 'It has been years now. ' : ''}Their degree and their patience are both gathering dust, and tonight they say so.`,
      stage: 'kitchen',
      cast: [{ ...YOU, pose: 'sit' }, { role: 'spouse', pose: 'talk' }],
      choices: open
        ? [
            c('file', `File for the work permit now (fee is an estimate, about $${cost(s, 520)}).`, ok('Months later a card arrives with their photo on it. They hold it for a long time before putting it away.', { family: 9, wellbeing: 4, money: -cost(s, 520), flags: { ys_spouseAt: stamp(s), ys_spouseEad: true } }, rule)),
            c('ask', 'Ask what they want first. Years at home have changed things.', ok('The answer surprises you both: not the old career, something new. You file the form the next week.', { family: 7, wellbeing: 3, money: -cost(s, 520), flags: { ys_spouseAt: stamp(s), ys_spouseEad: true } }, rule)),
            c('wait', 'Wait until money is less tight.', bad('They say it is fine. The form stays in the browser tab for months.', { family: -4, flags: { ys_spouseAt: stamp(s) } }, 'The door was open, and the two of you stood in front of it.', rule)),
          ]
        : [
            c('own', 'Help them look for an employer who would sponsor them in their own right.', ok('Months of applications. One employer is willing to try next season. It is a thread, and your spouse holds on to it.', { family: 4, wellbeing: 1, flags: { ys_spouseAt: stamp(s) } }, rule)),
            c('unpaid', 'Live on one income while they volunteer and keep their skills alive.', ok('The food pantry gives them a set of keys within a month. The budget is tight, and the evenings are better.', { family: 3, community: 4, money: -cost(s, 300), flags: { ys_spouseAt: stamp(s) } }, rule)),
            c('cash', 'They take cash tutoring work on the side.', bad('The money helps. Neither of you mentions it on the phone to anyone.', { money: cost(s, 700), legal: -8, wellbeing: -3, flags: { ys_spouseAt: stamp(s) } }, 'It felt harmless.', `Work without authorization is a failure to maintain status (8 CFR 214.1(e)). ${rule}`)),
          ],
    };
  }, { statuses: WORKER, when: (s) => band(s, 1) && depSpouse(s) && due(s, 'ys_spouseAt', 4) }),

  def('ys-h1b-age-out', 'status', 1.3, (s) => ({
    id: 'ys-h1b-age-out',
    track: 'status',
    title: "A colleague's daughter turns 21",
    body: `A colleague who came the same year as you is still in the green card line. His daughter was three when they arrived. She turns twenty-one in the spring, and after that she may no longer count as his child on the application. ${hasChild(s) ? 'You think of your own child, born here, who will never face this.' : 'She has never lived anywhere else that she remembers.'}`,
    stage: 'workplace',
    cast: [{ ...YOU, pose: 'talk' }, { role: 'friend', pose: 'think' }],
    choices: [
      c('attorney', 'Urge him to have an attorney calculate her age under the child-protection rule now.', ok('He books the appointment that week. Whatever the answer is, they will hear it while there is still time to act.', { community: 4, legal: 2, flags: { ys_ageOut: true } }, `For immigration, a child is unmarried and under 21 (INA 101(b)(1)). The Child Status Protection Act subtracts the time the petition was pending from the child's age on the day a visa becomes available, and the child must then seek the green card within a year (INA 203(h)). ${ASSESS}`)),
      c('dinner', 'Have the family over for dinner and let them talk.', ok('The daughter does most of the talking. She has a plan B and a plan C, and she is twenty.', { community: 6, wellbeing: -1, flags: { ys_ageOut: true } }, 'For immigration, a child is unmarried and under 21 (INA 101(b)(1)). Whether the Child Status Protection Act helps is a calculation for an attorney (INA 203(h)).')),
      c('away', 'Change the subject. It is too close to your own fears.', bad('He lets you change it. The conversation moves to the weather and stays there.', { community: -3, wellbeing: -3, flags: { ys_ageOut: true } }, 'Some things are easier to carry when someone asks.')),
    ],
  }), { statuses: WORKER, when: (s) => band(s, 5) && !has(s, 'ys_ageOut'), oddsPerYear: 0.4 }),

  def('ys-h1b-reorg', 'work', 1.3, (s) => ({
    id: 'ys-h1b-reorg',
    track: 'work',
    title: 'Rumors of a reorganization',
    body: 'Two directors leave in one month and the calendar fills with meetings about "alignment". Colleagues who are citizens joke about severance. For you, a layoff would start a different clock.',
    stage: 'workplace',
    cast: [{ ...YOU, pose: 'type' }, { role: 'friend', pose: 'talk' }],
    choices: [
      c('copies', 'Quietly save your own copies of every approval notice, and update your résumé.', ok('One evening of scanning. If the day comes, a new employer could file for you within a week.', { legal: 4, career: 2, wellbeing: -1, flags: { ys_reorgAt: stamp(s), ys_papersReady: true } }, 'If H-1B or O-1 employment ends, there is a grace period of up to 60 days (8 CFR 214.1(l)(2)). An approved I-140 keeps its priority date for a later petition (8 CFR 204.5(e)). Your own copies make a fast filing possible.')),
      c(
        'manager',
        'Ask your manager directly where you stand.',
        ok('She tells you your team is safe, and thanks you for asking plainly.', { wellbeing: 4, career: 1, flags: { ys_reorgAt: stamp(s) } }),
        {
          roll: { base: 55 },
          fail: bad('She cannot say. Now she knows you are worried, and so do you.', { wellbeing: -4, flags: { ys_reorgAt: stamp(s) } }, 'An honest question got an honest non-answer.'),
        },
      ),
      c('hope', 'Keep your head down and hope.', ok('The reorganization passes over your team this time. You notice how tightly you were holding your shoulders.', { wellbeing: -2, flags: { ys_reorgAt: stamp(s) } })),
    ],
  }), { statuses: WORKER, when: (s) => band(s, 2) && hasJob(s) && !has(s, 'inGrace') && due(s, 'ys_reorgAt', 4), oddsPerYear: 0.45 }),

  def('ys-h1b-decade', 'life', 1.5, (s) => ({
    id: 'ys-h1b-decade',
    track: 'life',
    title: `${yearsHere(s)} years on temporary papers`,
    body: `You have lived here ${yearsHere(s)} years on a status with "temporary" in its definition. You have paid taxes every year, ${hasChild(s) ? 'raised a child' : 'watched colleagues come and go'}, and renewed your stay more times than you can list without the folder. A younger colleague asks how you stand it.`,
    stage: 'cafe',
    cast: [{ ...YOU, pose: 'think' }, { role: 'friend', pose: 'talk' }],
    choices: [
      c('review', 'Book an hour with an attorney to look at every road again, old and new.', ok(`She asks what has changed in your career since the last review. More than you thought${has(s, 'eb1Plan') ? ', and your old plan has moved further than you realized' : ''}.`, { money: -cost(s, 300), legal: 4, wellbeing: 2, flags: { ys_decadeAt: stamp(s) } }, 'Roads change as a career grows: an approved petition keeps its priority date if you later qualify in another employment category (8 CFR 204.5(e)). Waits in this game are designed estimates.')),
      c('roots', 'Put your evenings into something that does not depend on the line.', ok('A youth team needs a coach, or a choir needs a voice. On those evenings nobody asks about your papers.', { community: 6, wellbeing: 4, flags: { ys_decadeAt: stamp(s) } })),
      c('honest', 'Tell the colleague the truth: some days you do not stand it.', ok('They look relieved. You had both been pretending for each other.', { wellbeing: 3, community: 2, flags: { ys_decadeAt: stamp(s) } })),
      c('elsewhere', 'Talk seriously at home about a life somewhere else.', ok('Nothing is decided. Saying it aloud makes the staying feel more like a choice.', { family: 3, wellbeing: -2, flags: { ys_decadeAt: stamp(s) } })),
    ],
  }), { statuses: WORKER, when: (s) => band(s, 10) && due(s, 'ys_decadeAt', 5) }),
];

// ------------------------------------------------------------------ green card pending
const AOS: StatusCode[] = ['AOS_PENDING'];
const AP_RULE = 'Leaving the US while an adjustment application is pending is treated as abandoning it unless advance parole was granted first (8 CFR 245.2(a)(4)(ii)). Even with it, travel has risks an attorney should weigh.';

const AOS_CARDS: ChallengeDef[] = [
  def('ys-aos-mail', 'status', 1.5, (s) => {
    const rule = 'If an applicant does not appear for biometrics or an interview, the application is considered abandoned and denied unless USCIS received a change of address or a reschedule request by the appointment time (8 CFR 103.2(b)(13)(ii)). A change of address must be reported within 10 days (INA 265(a)).';
    return {
      id: 'ys-aos-mail',
      track: 'status',
      title: 'A notice at the old address',
      body: 'You moved in the spring. This week a former neighbor texts a photo of an envelope from USCIS, delivered to your old door and dated three weeks ago.',
      stage: 'street',
      cast: [{ ...YOU, pose: 'phone' }, { role: 'stranger', pose: 'idle' }],
      choices: [
        c('today', 'Collect it today, report the new address, and act on whatever is inside.', ok('It is an appointment notice, and the date is next week. You make it, just.', { legal: 4, wellbeing: -2, flags: { ys_aosMail: true } }, rule)),
        c(
          'weekend',
          'Ask the neighbor to hold it until the weekend.',
          ok('It was only a notice that your case moved to another office. You report the new address that night.', { legal: 2, flags: { ys_aosMail: true } }, rule),
          {
            roll: { base: 50 },
            fail: bad('Inside is an appointment for the day before you opened it. Your representative files an urgent request to reschedule.', { legal: -8, wellbeing: -6, money: -cost(s, 250), flags: { ys_aosMail: true } }, 'Three weeks is a long time for a government letter.', rule),
          },
        ),
        c('forward', 'Rely on mail forwarding. It has worked for everything else.', bad('The next notice takes a month to find you.', { legal: -5, flags: { ys_aosMail: true } }, 'Forwarded mail is not a current record.', rule)),
      ],
    };
  }, { statuses: AOS, when: (s) => !has(s, 'ys_aosMail'), oddsPerYear: 0.5 }),

  def('ys-aos-rescheduled', 'status', 1.5, (s) => ({
    id: 'ys-aos-rescheduled',
    track: 'status',
    title: 'Interview cancelled',
    body: `A one-page notice: an appointment in your green card case is cancelled "due to unforeseen circumstances" and will be rescheduled. No new date is given. ${seen(s, 'ys_reschedAt') ? 'It is not the first time.' : 'You had already taken the day off.'}`,
    stage: 'apartment',
    cast: [{ ...YOU, pose: 'think' }],
    choices: [
      c('wait', 'Keep the file ready and wait for the new notice.', ok('Weeks pass. You learn the sound of the mail slot.', { legal: 2, wellbeing: -2, flags: { ys_reschedAt: stamp(s) } })),
      c('inquiry', 'Ask your representative to send a case inquiry.', ok('A form reply comes back: the case is "actively pending". At least someone looked.', { legal: 3, wellbeing: 1, money: -cost(s, 120), flags: { ys_reschedAt: stamp(s) } })),
      c('refresh', 'Use the delay to replace everything in the file that will be out of date by then.', ok(`New pay stubs, a new copy of the lease, ${s.flags.aosBasis === 'marriage' ? "this year's photos" : 'an updated letter'}. When the date comes, the file will be current.`, { legal: 5, money: -cost(s, 200), wellbeing: -1, flags: { ys_reschedAt: stamp(s) } }, 'USCIS decides on the record in front of it. A file that was complete a year ago may no longer be.')),
    ],
  }), { statuses: AOS, when: (s) => due(s, 'ys_reschedAt', 2), oddsPerYear: 0.45 }),

  def('ys-aos-ead-renew', 'work', 1.6, (s) => ({
    id: 'ys-aos-ead-renew',
    track: 'work',
    title: 'The card runs out in spring',
    body: 'Your green card case is still pending, and the work permit that came with it has an end date four months away. The payroll system at work has already sent an automatic reminder.',
    stage: 'workplace',
    cast: [{ ...YOU, pose: 'type' }, { role: 'advisor', pose: 'talk' }],
    choices: [
      c('file', `File the renewal now (about $${cost(s, 260)}).`, ok('The receipt arrives in two weeks and the new card well before the old one ends.', { money: -cost(s, 260), legal: 4, flags: { ys_aosEadAt: stamp(s) } }, 'An applicant for adjustment may hold a work permit while the case is pending (8 CFR 274a.12(c)(9)). The card has an end date and must be renewed. The $260 fee with a pending green card case is from the USCIS fee schedule read in 2026 and may change.')),
      c('both', 'Renew it, and renew the travel document at the same time (the second fee is an estimate).', ok('Two receipts. You do not plan to travel, and you remember the year you could not.', { money: -cost(s, 890), legal: 5, flags: { ys_aosEadAt: stamp(s) } }, AP_RULE)),
      c('late', 'Leave it until the last month.', bad('The new card does not arrive in time. You are put on unpaid leave for three weeks.', { money: -Math.max(cost(s, 1200), Math.round(num(s, 'salary') * 0.7)), wellbeing: -5, flags: { ys_aosEadAt: stamp(s) } }, 'The reminder was right.', 'An employer must see valid work authorization. Whether an expired card is extended automatically while a renewal is pending has changed more than once; check the current USCIS rule or ask your representative.')),
    ],
  }), { statuses: AOS, when: (s) => has(s, 'ead') && hasJob(s) && yearsInStatus(s) >= 1 && due(s, 'ys_aosEadAt', 2) }),

  def('ys-aos-second-request', 'status', 1.5, (s) => {
    const rule = 'A request for evidence gives a deadline of at most twelve weeks (8 CFR 103.2(b)(8)(iv)). With no response by the date, the case may be denied as abandoned or decided on the record (8 CFR 103.2(b)(13)(i)).';
    const what = s.flags.aosBasis === 'marriage'
      ? 'newer proof that you and your spouse still share a home'
      : empBasis(s)
        ? 'a fresh letter from your employer confirming the job is still offered'
        : 'an updated list of every address and job since you filed';
    return {
      id: 'ys-aos-second-request',
      track: 'status',
      title: 'One more letter',
      body: `Another letter from USCIS. This time they want ${what}. The deadline is printed in bold on the first page, and it feels as if the file will never be finished.`,
      stage: 'apartment',
      cast: [{ ...YOU, pose: 'type' }],
      choices: [
        c('now', 'Answer in full within two weeks.', ok('It goes out tracked, with a cover page listing every item. You keep a copy of all of it.', { legal: 6, wellbeing: -1, flags: { ys_aosReq2: true } }, rule)),
        c('rep', 'Pay your representative to prepare the response.', ok('She adds two documents you would not have thought of.', { legal: 8, money: -cost(s, 450), flags: { ys_aosReq2: true } }, rule)),
        c(
          'last-day',
          'Send it on the last day, by ordinary mail.',
          ok('It arrives in time. You only find out weeks later, and those are long weeks.', { legal: 3, wellbeing: -3, flags: { ys_aosReq2: true } }, rule),
          {
            roll: { base: 55 },
            fail: bad('A notice says the office did not receive a response by the date and will decide on what it has. Your representative starts writing letters.', { legal: -10, wellbeing: -6, money: -cost(s, 300), flags: { ys_aosReq2: true } }, 'The date in bold was the whole letter.', rule),
          },
        ),
      ],
    };
  }, { statuses: AOS, when: (s) => !has(s, 'ys_aosReq2') && (has(s, 'aosRfe') || yearsInStatus(s) >= 1), oddsPerYear: 0.5 }),

  def('ys-aos-job-offer', 'work', 1.5, (s) => {
    const rule = `When an adjustment application has been pending 180 days or more, the underlying petition stays valid for a new job in the same or a similar occupational classification (INA 204(j)). Whether two jobs are similar is a judgment call. ${ASSESS}`;
    return {
      id: 'ys-aos-job-offer',
      track: 'work',
      title: 'A job offer while you wait',
      body: 'A recruiter offers you a role much like yours at another company, for more money. Your green card case was filed through your current employer and has been pending for more than six months.',
      stage: 'cafe',
      cast: [{ ...YOU, pose: 'talk' }, { role: 'recruiter', pose: 'talk' }],
      choices: [
        c('similar', 'Accept, after a lawyer confirms the new job is in the same or a similar occupation.', ok('The lawyer writes a short letter comparing the two jobs. You start the new one with it in your folder.', { career: 4, money: -cost(s, 400), flags: { ys_aosMoved: true, salary: num(s, 'salary') + 600 } }, rule)),
        c('different', "Take a very different, better-paid role at a friend's company.", bad("The work is exciting. Your lawyer's reply to the news is two lines long and not happy.", { career: 3, legal: -10, flags: { ys_aosMoved: true, salary: num(s, 'salary') + 900 } }, 'The new job may not fit the petition your case rests on.', rule)),
        c('stay', 'Stay where you are until the card arrives.', ok('You decline. The recruiter says the door stays open, which recruiters always say.', { legal: 2, wellbeing: -1, flags: { ys_aosMoved: true } }, rule)),
      ],
    };
  }, { statuses: AOS, when: (s) => empBasis(s) && num(s, 'salary') > 0 && yearsInStatus(s) >= 1 && !has(s, 'ys_aosMoved') }),

  def('ys-aos-limbo', 'life', 1.4, (s) => ({
    id: 'ys-aos-limbo',
    track: 'life',
    title: 'Another year pending',
    body: `Your green card case has been pending for ${yearsInStatus(s)} years. You have a receipt, ${has(s, 'ead') ? 'a work permit, ' : ''}and no date. A friend invites you to her wedding abroad next summer, and you do not know what to answer.`,
    stage: 'cafe',
    cast: [{ ...YOU, pose: 'think' }, { role: 'friend', pose: 'talk' }],
    choices: [
      c('bend', 'Say maybe, and make plans that can bend.', ok('You buy the refundable ticket and the dress or suit. Half a plan is still a plan.', { wellbeing: 3, money: -cost(s, 150), flags: { ys_limboAt: stamp(s) } }, AP_RULE)),
      c('ask', 'Ask your representative what the trip would mean for your case before answering.', ok('The answer is specific to your file, and clearer than anything online. You reply to your friend the same day.', { legal: 4, money: -cost(s, 100), flags: { ys_limboAt: stamp(s) } }, AP_RULE)),
      c('decline', 'Decline everything that needs a fixed future.', bad('You say no to the wedding, and to a course, and to a dog. The year is very tidy.', { wellbeing: -5, community: -2, flags: { ys_limboAt: stamp(s) } }, 'Waiting can take more than it has to.')),
    ],
  }), { statuses: AOS, when: (s) => yearsInStatus(s) >= 2 && due(s, 'ys_limboAt', 2) }),
];

// ------------------------------------------------------------------ asylum pending
const ASY: StatusCode[] = ['ASY_PENDING'];
const asyOpen = (s: GameState): boolean => has(s, 'asyFiled') && !has(s, 'asyDecided') && !has(s, 'asyDenied');
const TRAVEL_ASY = 'An asylum applicant who leaves the US without advance parole is presumed to have abandoned the application. One who returns to the country of claimed persecution is presumed to have abandoned it even with advance parole, unless there are compelling reasons (8 CFR 208.8).';

const ASY_CARDS: ChallengeDef[] = [
  def('ys-asy-moved-date', 'status', 1.6, (s) => {
    const what = has(s, 'asyReferred') ? 'court hearing' : 'asylum interview';
    const rule = 'Dates in asylum cases move often: the immigration courts had a backlog of about 3.3 million cases at the end of FY2026 (EOIR). The date on the newest notice is the one that counts, and missing it can lose the case.';
    return {
      id: 'ys-asy-moved-date',
      track: 'status',
      title: seen(s, 'ys_asyMovedAt') ? 'Moved again' : 'The date is moved',
      body: `A notice in the mail: your ${what} has been moved${seen(s, 'ys_asyMovedAt') ? ' again' : ''}, to a date more than a year away. You had prepared yourself to tell all of it this spring. Now you must carry it, ready, for another year.`,
      stage: 'apartment',
      cast: [{ ...YOU, pose: 'think' }],
      choices: [
        c('confirm', 'Confirm the new date with your representative and write it where you cannot lose it.', ok('It goes on the wall, in the phone and in the folder. Your representative has it too.', { legal: 4, wellbeing: -2, flags: { ys_asyMovedAt: stamp(s) } }, rule)),
        c('use', 'Use the time: ask the clinic what would make the case stronger by then.', ok('They give you a short list. A year is long enough to do every item on it.', { legal: 5, wellbeing: -1, flags: { ys_asyMovedAt: stamp(s) } }, rule)),
        c('drawer', 'Put the notice in the drawer with the others.', bad('A year is a long time to remember a date. You find the notice again by accident, with eleven days to spare.', { legal: -3, wellbeing: -5, flags: { ys_asyMovedAt: stamp(s) } }, 'The longer the wait, the easier a date slips.', rule)),
      ],
    };
  }, { statuses: ASY, when: (s) => asyOpen(s) && yearsInStatus(s) >= 1 && due(s, 'ys_asyMovedAt', 2), oddsPerYear: 0.6 }),

  def('ys-asy-ead-renew', 'work', 1.6, (s) => {
    const rule = 'An asylum applicant\'s work authorization continues while the case is with an immigration judge (8 CFR 208.7(b)(1)), but the card has an end date and must be renewed. The fee is an estimate; fees for asylum-related permits were added by a 2025 law.';
    return {
      id: 'ys-asy-ead-renew',
      track: 'work',
      title: 'Renewing the permit',
      body: `Your asylum case is still open, and the work permit that lets you keep your job has an end date this year. ${hasJob(s) ? 'Your supervisor asks, gently, whether your papers are up to date.' : 'Without it, no employer can put you on the books.'}`,
      stage: 'workplace',
      cast: [{ ...YOU, pose: 'idle' }, { role: 'owner', pose: 'talk' }],
      choices: [
        c('early', `File the renewal months ahead (fee is an estimate, about $${cost(s, 550)}).`, ok('The new card arrives with weeks to spare. You show it to your supervisor before being asked.', { money: -cost(s, 550), legal: 4, flags: { ys_asyEadAt: stamp(s) } }, rule)),
        c('clinic', "Give up a Saturday for the clinic's renewal day, where volunteers check the form.", ok('A law student finds a box you had ticked wrongly. The line was long and worth it.', { money: -cost(s, 550), legal: 6, community: 2, wellbeing: -1, flags: { ys_asyEadAt: stamp(s) } }, rule)),
        c('late', 'Leave it until the card is nearly expired.', bad('The card lapses for a month. Your shifts are held for you, unpaid.', { money: -cost(s, 550) - cost(s, 1400), wellbeing: -5, flags: { ys_asyEadAt: stamp(s) } }, 'The date on the card was not a suggestion.', rule)),
      ],
    };
  }, { statuses: ASY, when: (s) => has(s, 'ead') && yearsInStatus(s) >= 2 && due(s, 'ys_asyEadAt', 2) }),

  def('ys-asy-stale', 'status', 1.4, (s) => ({
    id: 'ys-asy-stale',
    track: 'status',
    title: 'What time does to proof',
    body: `It has been ${yearsInStatus(s)} years since you asked for protection. The neighbor who wrote a statement for you has moved and changed numbers. The news from home uses new names for old dangers. Your own memory has started to blur dates you once knew by heart.`,
    stage: 'legal',
    cast: [{ ...YOU, pose: 'sit' }, { role: 'advisor', pose: 'talk' }],
    choices: [
      c('statement', 'Sit with your representative and update your written statement while you still remember.', ok('Three hard afternoons. The dates are fixed on paper now, and you can stop rehearsing them at night.', { legal: 6, wellbeing: -4, flags: { ys_staleAt: stamp(s) } }, 'The applicant must show that a protected ground was a central reason for the harm (INA 208(b)(1)(B)), and decision makers compare testimony with the written file. Years of delay make careful, dated records more important.')),
      c('reports', 'Ask the clinic for current reports on conditions at home.', ok('A volunteer prints forty pages. It is strange to read about your own town in the language of a report.', { legal: 4, wellbeing: -1, flags: { ys_staleAt: stamp(s) } })),
      c('leave', 'Leave the file as it is. Opening it costs too much.', bad('The folder stays shut and you sleep a little better this month.', { legal: -3, wellbeing: 1, flags: { ys_staleAt: stamp(s) } }, 'Rest is real. So is the file.', 'Decision makers compare testimony with the written file. A file left untouched for years is harder to stand behind on the day.')),
    ],
  }), { statuses: ASY, when: (s) => asyOpen(s) && yearsInStatus(s) >= 2 && due(s, 'ys_staleAt', 3) }),

  def('ys-asy-family-fear', 'life', 1.5, (s) => ({
    id: 'ys-asy-family-fear',
    track: 'life',
    title: 'A call about your family',
    body: `Someone from home calls at an odd hour. ${seen(s, 'ys_famFearAt') ? 'It has happened again: people' : 'Two men'} came to the house asking where you are now. Nobody was hurt. Everyone is trying to sound calm for your sake.`,
    stage: 'apartment-night',
    cast: [{ ...YOU, pose: 'phone' }, { role: 'parent', pose: 'talk' }],
    choices: [
      c('move', 'Send money so they can stay with relatives in another town for a while.', ok('They go the same week. The calls come from a different kitchen now, with different noises behind them.', { money: -cost(s, 700), family: 6, wellbeing: -2, flags: { ys_famFearAt: stamp(s) } })),
      c('record', 'Ask them to write down what happened, with the date, and tell your representative.', ok('A page in careful handwriting arrives as a photo. Your representative adds it to the file and says it matters.', { legal: 5, family: 2, wellbeing: -3, flags: { ys_famFearAt: stamp(s) } }, 'Events after you left can show that the danger continues. Dated, first-hand accounts carry weight; your representative decides what to submit.')),
      c('quiet', 'Tell them not to call for a while, for their own safety.', ok('The phone goes quiet. You tell yourself that silence means safe.', { family: -5, wellbeing: -5, flags: { ys_famFearAt: stamp(s) } })),
    ],
  }), { statuses: ASY, when: (s) => band(s, 1) && due(s, 'ys_famFearAt', 3), oddsPerYear: 0.5 }),

  def('ys-asy-cannot-go', 'life', 1.4, (s) => ({
    id: 'ys-asy-cannot-go',
    track: 'life',
    title: 'You cannot go',
    body: 'Someone who helped raise you is very ill at home. The family does not ask you to come. They know. But a message arrives anyway with the name of the hospital and the visiting hours.',
    stage: 'apartment-night',
    cast: [{ ...YOU, pose: 'phone' }],
    choices: [
      c('phone', 'Stay, and be there by phone every evening.', ok('A cousin holds the phone near the bed. You talk about small things from long ago, and are answered sometimes.', { family: 5, wellbeing: -6, flags: { ys_cannotGo: true } }, TRAVEL_ASY)),
      c('send', 'Send what money you can for the care.', ok('It pays for a better room and a night nurse. It is not the same as being there, and it is not nothing.', { money: -cost(s, 900), family: 6, wellbeing: -3, flags: { ys_cannotGo: true } }, TRAVEL_ASY)),
      c('flights', 'Look at flights. You could be back in a week.', bad('Your representative calls back within the hour and stays on the line until you close the browser.', { wellbeing: -8, legal: -1, flags: { ys_cannotGo: true } }, 'Going would end the case you fled to make.', TRAVEL_ASY)),
    ],
  }), { statuses: ASY, when: (s) => band(s, 2) && has(s, 'asyFiled') && !has(s, 'ys_cannotGo'), oddsPerYear: 0.4 }),

  def('ys-asy-new-city', 'status', 1.3, (s) => {
    const court = has(s, 'asyReferred');
    const rule = court
      ? 'A person in immigration court must give the court written notice of a new address within five days, on Form EOIR-33 (8 CFR 1003.15(d)(2)). Hearing notices go to the address on file.'
      : `${ADDR_RULE} Notices about the case go to the address on file.`;
    return {
      id: 'ys-asy-new-city',
      track: 'status',
      title: 'New city, same case',
      body: `An acquaintance offers steady work on the books in a city three states away, and a room to go with it. Your case is with ${court ? 'the immigration court' : 'the asylum office'} here, and so is the representative who knows it.`,
      stage: 'street',
      cast: [{ ...YOU, pose: 'think' }, { role: 'friend', pose: 'talk' }],
      choices: [
        c('tell', `Move, and report the new address at once${court ? ' to the court and to the immigration service' : ''}.`, ok('The paperwork goes in the week you arrive. Your representative agrees to keep the case by phone for now.', { career: 3, legal: 3, money: -cost(s, 500), flags: { ys_asyCity: true, salary: num(s, 'salary') > 0 ? num(s, 'salary') + 200 : num(s, 'salary') } }, rule)),
        c('later', 'Move first, and sort out the paperwork once you are settled.', bad('The work is good. A notice about your case sits in a mailbox three states behind you.', { career: 3, legal: -9, wellbeing: -2, flags: { ys_asyCity: true } }, 'A case follows the address on file, not the person.', rule)),
        c('stay', 'Stay near your representative and the people who know your case.', ok('You thank him and stay. The job you have is smaller, and the ground under it is known.', { community: 3, wellbeing: -1, flags: { ys_asyCity: true } })),
      ],
    };
  }, { statuses: ASY, when: (s) => band(s, 1) && asyOpen(s) && has(s, 'ead') && !has(s, 'ys_asyCity'), oddsPerYear: 0.4 }),

  def('ys-asy-queue-years', 'life', 1.5, (s) => ({
    id: 'ys-asy-queue-years',
    track: 'life',
    title: 'Years in the queue',
    body: `${yearsInStatus(s)} years since you asked for protection. You have ${hasJob(s) ? 'a job, ' : ''}${hasChild(s) ? 'a child in school, ' : ''}a favorite bench and a dentist. You also have a case number and no answer. Some nights the not knowing is louder than the memory of why you left.`,
    stage: 'park',
    cast: [{ ...YOU, pose: 'sit' }],
    choices: [
      c('counsel', 'Find a counselor who works with people in long cases.', ok('She has heard this exact tiredness before. It helps to learn that it has a shape.', { wellbeing: 7, money: -cost(s, 80), flags: { ys_queueAt: stamp(s) } })),
      c('build', 'Build as if you were staying: a course, a savings account, friendships.', ok('You enroll, you save, you say yes to invitations. If the answer is no one day, these years will still have been lived.', { career: 3, community: 3, wellbeing: 1, flags: { ys_queueAt: stamp(s) } })),
      c('freeze', 'Do not start anything you might have to leave.', bad('The apartment stays half unpacked. So do you.', { wellbeing: -5, community: -2, flags: { ys_queueAt: stamp(s) } }, 'A paused life is still passing.')),
    ],
  }), { statuses: ASY, when: (s) => yearsInStatus(s) >= 3 && due(s, 'ys_queueAt', 3) }),
];

// ------------------------------------------------------------------ asylees
const ASYLEE: StatusCode[] = ['ASYLEE'];

const ASYLEE_CARDS: ChallengeDef[] = [
  def('ys-asylee-meeting', 'life', 1.5, (s) => {
    const rule = 'A person with asylum status must have a refugee travel document to return to the US after travel abroad (8 CFR 223.1(b)). It is applied for before leaving and is valid for one year (8 CFR 223.2(b)(2), 223.3(a)(2)). Fees and travel costs here are estimates.';
    return {
      id: 'ys-asylee-meeting',
      track: 'life',
      title: 'Meeting halfway',
      body: 'Your family cannot come here, and you cannot go to them. A relative suggests meeting in a third country that all of you can reach. It would be the first time in years that you sat at the same table.',
      stage: 'apartment-night',
      cast: [{ ...YOU, pose: 'phone' }, { role: 'parent', pose: 'talk' }],
      choices: [
        c('document', 'Apply for a refugee travel document first, then go.', ok('The document takes months. The week itself goes by in a rented apartment that smells of your childhood kitchen.', { family: 13, wellbeing: 6, money: -cost(s, 2600), flags: { ys_tripAt: stamp(s) } }, rule)),
        c('old', 'Go on your old passport. The document takes too long.', bad('At the check-in desk you realize nobody can tell you how you would get back in. You do not board.', { money: -cost(s, 900), wellbeing: -6, family: -2, flags: { ys_tripAt: stamp(s) } }, 'The way out was easy. The way back was the question.', `${rule} Asylum may also be ended if a person voluntarily returns to the protection of the country they fled (INA 208(c)(2)(D)); ask counsel before using its passport.`)),
        c('video', 'Stay, and keep to video calls until you hold a green card.', ok('The calls are long and the screen is small. You promise each other a table, later.', { family: 2, wellbeing: -2, flags: { ys_tripAt: stamp(s) } }, rule)),
      ],
    };
  }, { statuses: ASYLEE, when: (s) => due(s, 'ys_tripAt', 4), oddsPerYear: 0.6 }),

  def('ys-asylee-family', 'status', 2, (s) => {
    const spouse = depSpouse(s);
    const rule = 'An asylee may ask for the same status for a spouse or an unmarried child under 21 who is following to join, if the relationship existed when asylum was granted. The request must be filed within two years of the grant unless USCIS extends the time for humanitarian reasons (INA 208(b)(3); 8 CFR 208.21). Parents, brothers and sisters are not covered.';
    return {
      id: 'ys-asylee-family',
      track: 'status',
      title: 'The people you left',
      body: spouse
        ? 'Your spouse is still at home, waiting. Your representative says an asylee can ask to bring a spouse and unmarried children under 21, and that the request has a deadline counted from the day of your grant.'
        : 'Someone in your family asks whether your asylum means they can follow you. Your representative explains who is covered: a spouse and unmarried children under 21. Not parents, not brothers or sisters.',
      stage: 'legal',
      cast: [{ ...YOU, pose: 'sit' }, { role: 'advisor', pose: 'talk' }],
      choices: spouse
        ? [
            c('file', 'File the request for your spouse now.', ok('The receipt goes on the wall beside your grant letter. At home, your spouse starts sorting what to keep.', { family: 12, legal: 3, money: -cost(s, 300), flags: { ys_asyleeFam: true } }, `${rule} Costs here are estimates for documents and translations.`)),
            c('check', 'Have the clinic check the marriage certificate and translations first, then file.', ok('They catch a name spelled two different ways. It is fixed before anyone official sees it.', { family: 10, legal: 6, money: -cost(s, 450), flags: { ys_asyleeFam: true } }, rule)),
            c('later', 'Wait until you have a bigger apartment and steadier work.', bad('It seems sensible. The months go by quietly.', { family: -5, wellbeing: -2 }, 'The window is two years wide, and it is already open.', rule)),
          ]
        : [
            c('truth', 'Tell them the truth, and what you can do instead: send money, stay close.', ok('It is a hard call. At the end of it they thank you for knowing the answer.', { family: 2, wellbeing: -2, flags: { ys_asyleeFam: true } }, rule)),
            c('road', 'Explain the long road: a green card for you, then citizenship, then a petition.', ok('You count the years together on the phone. It is a long number, and it is a number.', { family: 3, legal: 2, flags: { ys_asyleeFam: true } }, `${rule} A citizen aged 21 or over may petition for parents, and for brothers and sisters in a long line (INA 201(b)(2)(A)(i), 203(a)(4)).`)),
            c('vague', 'Say you will look into it.', bad('They wait for news that you already know will not come.', { family: -4, wellbeing: -2, flags: { ys_asyleeFam: true } }, 'Hope with nothing under it is a weight to hand someone.', rule)),
          ],
    };
  }, { statuses: ASYLEE, when: (s) => yearsInStatus(s) < 2 && !has(s, 'ys_asyleeFam') }),

  def('ys-asylee-first-year', 'status', 1.8, (s) => {
    const rule = 'A person granted asylum may apply for a green card after being physically present in the US for at least one year after the grant (INA 209(b)).';
    return {
      id: 'ys-asylee-first-year',
      track: 'status',
      title: 'Counting to one year',
      body: 'You were granted asylum a few months ago. After one year here as an asylee you can apply for a green card. Until then the grant letter is the most important paper you own, and your body is still learning that it is over.',
      stage: 'apartment',
      cast: [{ ...YOU, pose: 'sit' }],
      choices: [
        c('folder', 'Start a folder now: the grant letter, proof of where you lived each month, tax forms.', ok('A plain folder with a year of ordinary life in it. When the day comes, the form will mostly be copying.', { legal: 5, flags: { ys_firstYear: true, ys_folder: true } }, rule)),
        c('shifts', 'Take extra shifts and save for the fee (about $1,440 at the 2026 rate).', ok('The envelope in the drawer gets thicker. So do the circles under your eyes.', { money: cost(s, 600), wellbeing: -4, flags: { ys_firstYear: true } }, `${rule} The I-485 fee was $1,440 on the USCIS fee schedule read in 2026.`)),
        c('rest', 'Give yourself this year to rest. Papers can wait until spring.', ok('You sleep. You learn the bus routes for pleasure. Something in your chest loosens by a notch.', { wellbeing: 7, flags: { ys_firstYear: true } }, rule)),
      ],
    };
  }, { statuses: ASYLEE, when: (s) => yearsInStatus(s) < 1 && !has(s, 'ys_firstYear') }),

  def('ys-asylee-home-news', 'life', 1.5, (s) => ({
    id: 'ys-asylee-home-news',
    track: 'life',
    title: 'News from home',
    body: `The people you fled have lost power, or say they have changed. Friends message you: is it over, will you come back? Your representative has a different question: ${yearsInStatus(s) >= 2 ? 'why have you still not filed for your green card?' : 'are you ready to file for your green card?'}`,
    stage: 'cafe',
    cast: [{ ...YOU, pose: 'phone' }, { role: 'friend', pose: 'talk' }],
    choices: [
      c('file', 'Decide to file for the green card at the next chance.', ok('You put the fee on a list and the list on the door. Good news from home is welcome; you would rather not depend on it.', { legal: 4, wellbeing: 2, flags: { ys_homeNewsAt: stamp(s) } }, 'Asylum does not convey a right to remain permanently and may be ended after a fundamental change in circumstances (INA 208(c)(2)(A)). A green card, open after one year as an asylee (INA 209(b)), is firmer ground.')),
      c('gather', 'Go to the gathering in the park where everyone from home is singing.', ok('Flags, food, old songs, arguments about what happens next. For one afternoon the news belongs to all of you.', { community: 7, wellbeing: 5, flags: { ys_homeNewsAt: stamp(s) } })),
      c('watch', 'Follow the news closely and wait to see what is real.', ok('You read everything, in two languages, until late. The picture changes every day and settles nothing.', { wellbeing: -3, legal: -1, flags: { ys_homeNewsAt: stamp(s) } }, 'Asylum may be ended after a fundamental change in circumstances (INA 208(c)(2)(A)). Ask your representative what the news means for you before it is tested.')),
    ],
  }), { statuses: ASYLEE, when: (s) => yearsInStatus(s) >= 1 && due(s, 'ys_homeNewsAt', 3), oddsPerYear: 0.6 }),
];

// ------------------------------------------------------------------ no status
const NONE: StatusCode[] = ['NONE'];
const BAR_10 = 'After a year or more of unlawful presence, leaving the US starts a 10-year bar on returning (INA 212(a)(9)(B)).';
const CANCEL = 'Cancellation of removal needs 10 years of continuous physical presence, good moral character, no disqualifying conviction, and exceptional and extremely unusual hardship to a spouse, parent or child who is a US citizen or permanent resident (INA 240A(b)(1)). It exists only as a defense before an immigration judge, the ten-year count stops when a Notice to Appear is served (INA 240A(d)(1)), and no more than 4,000 are granted a year (INA 240A(e)).';
const RIGHTS = "The Constitution's protections cover persons, whatever their immigration status (Plyler v. Doe, 457 U.S. 202). The Fourth Amendment protects the home, and the Supreme Court has drawn \"a firm line at the entrance to the house\" (Payton v. New York, 445 U.S. 573). Under the Fifth Amendment no person may be compelled to be a witness against himself. In removal proceedings a person may have a lawyer, at no expense to the government (INA 292). What these mean in a given moment is for a lawyer to explain.";

const NONE_CARDS: ChallengeDef[] = [
  def('ys-none-consult', 'status', 2, (s) => ({
    id: 'ys-none-consult',
    track: 'status',
    title: 'An honest consultation',
    body: 'You save for an hour with a licensed immigration attorney. She asks how you entered, every date, every family tie, every time you met the police. Then she puts down her pen.',
    narration: 'You saved up for an hour with a licensed immigration attorney. She writes down everything you say.',
    lines: [
      { who: 'advisor', text: 'Tell me how you entered, and every date you can remember.' },
      { who: 'advisor', text: 'Any family ties here? Any time at all that you met the police?' },
      { who: 'player', text: 'That is all of it. Is there anything you can see?' },
    ],
    stage: 'legal',
    cast: [{ ...YOU, pose: 'sit' }, { role: 'advisor', pose: 'talk' }],
    choices: [
      c(
        'all',
        'Ask her to tell you everything, and to write it down.',
        ok(
          ewi(s)
            ? 'She is plain: because you were not inspected when you came, a green card from inside the country is closed to you, even through marriage, and leaving after a year without status starts a ten-year bar. "Today I see no door," she says. "Come back when your life or the law changes."'
            : 'She is plain: because you were admitted with a visa, one door could open someday: a genuine marriage to a US citizen, or a citizen child who reaches 21. Nothing else fits today, and leaving after a year without status starts a ten-year bar.',
          { money: -cost(s, 150), legal: 6, wellbeing: -2, flags: { ys_consult1: true } },
          `Adjustment inside the US needs inspection and admission or parole (INA 245(a)); for those who were admitted, the bars for lost status do not apply to immediate relatives of citizens (INA 245(c)(2), 201(b)(2)(A)(i)). ${BAR_10} ${ASSESS}`,
        ),
      ),
      c('free', "Go to a nonprofit's free screening day instead, and wait in line.", ok('Four hours in a corridor, twenty minutes with an accredited representative. The answer is short and honest, and they keep your number.', { legal: 5, wellbeing: -1, community: 1, flags: { ys_consult1: true } }, `Adjustment inside the US needs inspection and admission or parole (INA 245(a)). ${BAR_10} ${ASSESS}`)),
      c('skip', 'Keep the money. You already know the answer.', bad('You tell yourself there is nothing to learn. The question stays where it was.', { wellbeing: -2 }, 'A guess and an answer are different things.', `Doors differ from person to person and change with time. ${ASSESS}`)),
    ],
  }), { statuses: NONE, when: (s) => band(s, 1, 9) && !has(s, 'ys_consult1') && !has(s, 'removalOrder') && !has(s, 'asyFiled') }),

  def('ys-none-narrow-door', 'status', 2, (s) => {
    const tie = hasChild(s) || has(s, 'marriedCitizen');
    return {
      id: 'ys-none-narrow-door',
      track: 'status',
      title: 'A narrow door',
      body: `Ten years is a number people repeat in waiting rooms. You go back to an attorney${has(s, 'ys_consult1') ? ', the one who once told you there was no door' : ''}. She listens to how your life has changed${hasChild(s) ? ': a child born here' : ''}${has(s, 'marriedCitizen') ? `${hasChild(s) ? ',' : ':'} a spouse who is a citizen` : ''}.`,
      stage: 'legal',
      cast: [{ ...YOU, pose: 'sit' }, { role: 'advisor', pose: 'talk' }],
      choices: [
        c(
          'hear',
          'Hear all of it, including the risks.',
          ok(
            tie
              ? 'She describes one narrow thing. A judge can cancel removal for someone here ten years, of good character, whose citizen or resident family would suffer hardship far beyond the ordinary. It exists only inside a court case, few are granted, and she will not tell you to walk toward a court.'
              : 'She explains the ten-year rule people talk about, and why it does not fit you: it needs a spouse, parent or child who is a citizen or resident, and it exists only inside a court case. "Better you hear that from me than pay someone who says otherwise."',
            { money: -cost(s, 200), legal: 6, wellbeing: tie ? 1 : -3, flags: { ys_consult2: true } },
            `${CANCEL} ${ASSESS}`,
          ),
        ),
        c('records', 'Ask what records to keep, whatever happens.', ok('Rent receipts, school letters, tax returns, letters from people who have known you for years. "Proof of the years," she says.', { money: -cost(s, 200), legal: 5, flags: { ys_consult2: true, ys_folder: true } }, `${CANCEL} ${ASSESS}`)),
        c('cancel', 'Cancel the appointment. Hope is expensive.', bad('You keep the fee and lose a night of sleep to it anyway.', { wellbeing: -3 }, 'Not asking did not make the question smaller.')),
      ],
    };
  }, { statuses: NONE, when: (s) => band(s, 9) && !has(s, 'ys_consult2') && !has(s, 'removalOrder') }),

  def('ys-none-attacked', 'life', 1.4, (s) => {
    const rule = `Victims of certain serious crimes who are helpful to the investigation may ask for U nonimmigrant status. It needs a certification from law enforcement, and only 10,000 principal visas may be granted each year (USCIS, Victims of Criminal Activity: U Nonimmigrant Status). Whether a given crime and a given case qualify is not something to guess at. ${ASSESS}`;
    return {
      id: 'ys-none-attacked',
      track: 'life',
      title: 'After the attack',
      body: "Walking home with your week's pay, you are attacked and beaten by two men who take all of it. You are bruised and shaking. One neighbor says to call the police. Another says people without papers should never call the police.",
      stage: 'street',
      cast: [{ ...YOU, pose: 'sit' }, { role: 'stranger', pose: 'talk' }],
      choices: [
        c('report', 'Report it, and tell the officers everything you saw.', ok('An officer takes your statement and gives you a report number. Later the legal clinic asks to see it.', { money: -cost(s, 600), legal: 3, wellbeing: 2, community: 2, flags: { ys_victim: true } }, rule)),
        c('clinic', 'Go to the legal clinic first and ask what reporting would mean for you.', ok('They explain it without hurrying you, and someone offers to come to the station with you.', { money: -cost(s, 600), legal: 4, wellbeing: 1, flags: { ys_victim: true } }, rule)),
        c('silent', 'Tell no one. Wash your face and go to work tomorrow.', bad('The bruises fade in two weeks. You take a different street home for much longer.', { money: -cost(s, 600), wellbeing: -8, flags: { ys_victim: true } }, 'You carried it alone.', rule)),
      ],
    };
  }, { statuses: NONE, when: (s) => band(s, 2) && !has(s, 'ys_victim'), oddsPerYear: 0.3 }),

  def('ys-none-rights-night', 'status', 1.6, (s) => ({
    id: 'ys-none-rights-night',
    track: 'status',
    title: 'Know your rights night',
    body: `A community center is holding an evening on the rights that everyone in the US has, whatever their papers. ${seen(s, 'ys_rightsAt') ? 'You went years ago, and the room is fuller now.' : 'The flyer is in four languages.'} Going means sitting in a room full of people in your situation, which feels both safe and exposed.`,
    stage: 'library',
    cast: [{ ...YOU, pose: 'sit' }, { role: 'advisor', pose: 'present' }, { role: 'stranger', pose: 'sit' }],
    choices: [
      c('plan', 'Go, and afterwards make a family plan: who to call, where the papers are.', ok("One page, in a drawer everyone knows. A lawyer's number at the top. You hope never to need it.", { legal: 6, wellbeing: 2, community: 3, flags: { ys_rightsAt: stamp(s), ys_plan: true } }, RIGHTS)),
      c('listen', 'Go, sit at the back and just listen.', ok('A lawyer speaks for an hour and answers questions for two. Half of what you believed turns out to be rumor.', { legal: 4, wellbeing: 1, flags: { ys_rightsAt: stamp(s) } }, RIGHTS)),
      c('chat', 'Skip it. The group chat tells you what you need.', bad('This week the chat says three different things, all urgent, none of them true.', { legal: -1, wellbeing: -3, flags: { ys_rightsAt: stamp(s) } }, 'Rumor travels faster than law.', RIGHTS)),
    ],
  }), { statuses: NONE, when: (s) => band(s, 1) && due(s, 'ys_rightsAt', 6) }),

  def('ys-none-knock', 'life', 1.4, (s) => {
    const calm = has(s, 'ys_plan');
    const note = 'Fear of a knock is part of life without status. Knowing your rights beforehand and having a family plan are what legal aid groups teach, so that a frightening minute is not also a confused one.';
    return {
      id: 'ys-none-knock',
      track: 'life',
      title: 'A knock before sunrise',
      body: `Someone knocks hard at the door at ten to six. ${hasChild(s) ? 'Your child sleeps on.' : 'The apartment holds its breath.'} You stand in the hallway in your socks with your heart in your ears${calm ? ', and think of the page in the drawer' : ''}.`,
      stage: 'apartment-night',
      cast: [{ ...YOU, pose: 'idle' }],
      choices: [
        c('ask', 'Ask through the closed door who it is.', ok('A tired voice: the water is being shut off for repairs. You sit down on the floor and laugh without making a sound.', { wellbeing: calm ? -1 : -2, flags: { ys_knockAt: stamp(s) } }, note)),
        c('wait', 'Stay still and wait.', ok('The steps move on to the next door, and the next. Later you learn it was the water company. You are tired all day.', { wellbeing: calm ? -2 : -4, flags: { ys_knockAt: stamp(s) } }, note)),
        c('open', 'Open at once.', ok('A man in a work vest, already turning to the next door. Your hands shake while you fill the kettle.', { wellbeing: calm ? -2 : -3, flags: { ys_knockAt: stamp(s) } }, note)),
      ],
    };
  }, { statuses: NONE, when: (s) => band(s, 1) && due(s, 'ys_knockAt', 5), oddsPerYear: 0.5 }),

  def('ys-none-traffic-stop', 'status', 1.5, (s) => {
    const st = licenseState(s);
    const stateRule =
      st === 'CA'
        ? "California issues AB 60 driver's licenses to residents who cannot show proof of legal presence but can prove identity and state residency (California DMV)."
        : st === 'NY'
          ? "New York's Green Light Law lets residents aged 16 or over apply for a standard, not-for-federal-purposes license regardless of citizenship or lawful status (NY DMV)."
          : 'Licensing is state law. Some states, such as California and New York, issue standard licenses regardless of immigration status; others require proof of lawful presence (California DMV; NY DMV).';
    const rule = `${stateRule} A license does not change immigration status.`;
    return {
      id: 'ys-none-traffic-stop',
      track: 'status',
      title: 'Blue lights behind you',
      body: `A coworker is driving you home when a patrol car pulls you both over for a broken tail light. The officer speaks only to the driver and lets him go with a warning. Your hands stay on your knees for a long time. ${has(s, 'yh_ownsCar') ? 'You drive that same road every day.' : 'You had been thinking about a car for the commute.'}`,
      stage: 'street',
      cast: [{ ...YOU, pose: 'sit' }, { role: 'officer', pose: 'talk' }, { role: 'friend', pose: 'sit' }],
      choices: [
        st
          ? c('license', 'Apply for the standard license your state issues regardless of status.', ok('A written test, a road test, a photo. The card that arrives says who you are and that you may drive.', { money: -cost(s, 120), legal: 5, wellbeing: 3, flags: { ys_stopAt: stamp(s), ys_license: true } }, rule))
          : c('check', "Read your own state's motor vehicle agency page to learn what it allows.", ok('You read the agency itself and not a forum. Now you know exactly what your state allows, and what it does not.', { legal: 3, flags: { ys_stopAt: stamp(s) } }, `${rule} Check your own state's agency.`)),
        c('bus', 'Leave driving alone. Take the bus, though it doubles the commute.', ok('Two buses each way. You read, you doze, you get home after dark.', { legal: 2, wellbeing: -4, money: -cost(s, 60), flags: { ys_stopAt: stamp(s) } }, rule)),
        c('drive', 'Drive without a license. Work is too far for anything else.', bad('Every patrol car in the mirror takes something out of you.', { legal: -6, wellbeing: -5, flags: { ys_stopAt: stamp(s) } }, 'The commute is real. So is the risk.', `Driving without a license is an offense under state law, and for a person without status any arrest can lead to immigration custody. ${rule}`)),
      ],
    };
  }, { statuses: NONE, when: (s) => band(s, 1) && !has(s, 'ys_license') && due(s, 'ys_stopAt', 6), oddsPerYear: 0.45 }),

  def('ys-none-school-form', 'life', 1.8, () => {
    const rule = "Public schools may not deny a child a basic education because of immigration status (Plyler v. Doe, 457 U.S. 202 (1982)). California's Attorney General, for one, states that status information is never needed to enroll and that no Social Security number has to be given. Paperwork differs by district; the enrollment office or a legal aid group can confirm.";
    return {
      id: 'ys-none-school-form',
      track: 'life',
      title: 'The enrollment form',
      body: "Your child starts school in the fall. The enrollment packet asks for proof of age and proof of address, and has a line for a Social Security number: the child's, and yours.",
      stage: 'classroom',
      cast: [{ ...YOU, pose: 'idle' }, { role: 'advisor', pose: 'talk' }],
      choices: [
        c('enroll', 'Enroll with the birth certificate and a utility bill, and leave your own number blank.', ok('The clerk checks two documents, stamps the form and tells you which door the little ones use.', { family: 6, legal: 3, wellbeing: 2, flags: { ys_schoolForm: true } }, rule)),
        c('ask', 'Ask the school secretary, quietly, which lines are required.', ok('She has answered this before. "Age and address," she says, and circles two lines.', { family: 5, community: 2, wellbeing: -1, flags: { ys_schoolForm: true } }, rule)),
        c('delay', 'Put the packet away for another year. Schools mean lists.', bad('In September the other children on the street walk past your window with new backpacks.', { family: -6, wellbeing: -4 }, "Your child's place in that classroom is protected.", rule)),
      ],
    };
  }, { statuses: NONE, when: (s) => band(s, 4) && hasChild(s) && !has(s, 'ys_schoolForm') }),

  def('ys-none-emergency', 'life', 1.5, (s) => {
    const rule = 'A hospital with an emergency department must give anyone who comes a medical screening, and may not delay it or needed treatment to ask about payment or insurance (42 U.S.C. 1395dd(a), (h)). Emergency Medicaid can cover an emergency for a person who is otherwise eligible, whatever their status (8 U.S.C. 1611(b)(1)(A)). The bill is a separate matter; ask about financial assistance.';
    return {
      id: 'ys-none-emergency',
      track: 'life',
      title: 'The emergency room',
      body: `${age(s) >= 45 ? 'A pressure in your chest that does not pass.' : 'A deep cut that will not stop bleeding.'} A coworker says the hospital will ask for papers and send a bill you can never pay. It is getting worse.`,
      stage: 'clinic',
      cast: [{ ...YOU, pose: 'sit' }, { role: 'nurse', pose: 'talk' }],
      choices: [
        c('er', 'Go to the emergency room now.', ok('They treat you first and ask about payment afterwards. A social worker helps with the financial assistance form; what remains is large, and has a payment plan.', { money: -cost(s, 900), wellbeing: 4, flags: { ys_erAt: stamp(s) } }, rule)),
        c(
          'clinic',
          'Wait until morning and go to the community clinic that charges by income.',
          ok('The clinic doctor sees you at eight, treats you, and tells you sternly to come sooner next time.', { money: -cost(s, 80), wellbeing: 1, flags: { ys_erAt: stamp(s) } }, rule),
          {
            roll: { base: 55 },
            fail: bad('By three in the morning a neighbor is driving you to the emergency room anyway. The hours you waited made it worse.', { money: -cost(s, 1400), wellbeing: -8, flags: { ys_erAt: stamp(s) } }, 'Fear of the bill nearly cost more than the bill.', rule),
          },
        ),
        c('home', 'Treat it at home and go to work tomorrow.', bad('You lose three days of work to it in the end, and some of your trust in your own body.', { money: -cost(s, 300), wellbeing: -9, flags: { ys_erAt: stamp(s) } }, 'You were allowed to be cared for.', rule)),
      ],
    };
  }, { statuses: NONE, when: (s) => band(s, 1) && due(s, 'ys_erAt', 7), oddsPerYear: 0.35 }),

  def('ys-none-notario', 'status', 1.6, (s) => {
    const rule = `There is no ten-year work permit. ${CANCEL} Only attorneys and accredited representatives may give immigration legal advice; consultants and notaries may not (8 CFR 292.1; California Department of Justice, immigration scams alert).`;
    return {
      id: 'ys-none-notario',
      track: 'status',
      title: 'Ten years, guaranteed',
      body: `A storefront with flags in the window advertises a "ten-year work permit" for people who have been here a decade. The man inside is friendly, has a wall of certificates, and wants $${cost(s, 3500)} to open your file. He is not a lawyer.`,
      stage: 'street',
      cast: [{ ...YOU, pose: 'think' }, { role: 'owner', pose: 'present' }],
      choices: [
        c('walk', 'Take his card, pay nothing, and ask the legal clinic about it.', ok('The clinic lawyer sighs; she has seen the flyer. What he sells, she says, ends with you in front of a judge and no promise of any permit.', { legal: 5, flags: { ys_notario: true } }, rule)),
        c('report', 'Walk out, and help a community group report what he is selling.', ok("The group files the complaint in its own name. A month later the sign in the window is gone, for now.", { legal: 3, community: 5, wellbeing: 1, flags: { ys_notario: true } }, rule)),
        c('pay', 'Pay the deposit. Ten years has to count for something.', bad(`He takes $${cost(s, 1500)} and copies of everything. The receipt has no address on it.`, { money: -cost(s, 1500), legal: -8, wellbeing: -6, flags: { ys_notario: true } }, 'A promise with a price and no license.', `${rule} Filing for something you do not qualify for can start the very court case you feared.`)),
      ],
    };
  }, { statuses: NONE, when: (s) => band(s, 8) && !has(s, 'ys_notario'), oddsPerYear: 0.55 }),

  def('ys-none-policy-hope', 'life', 1.5, (s) => {
    const n = num(s, 'ys_hopeN');
    const mark = { ys_hopeAt: stamp(s), ys_hopeN: n + 1 };
    return {
      id: 'ys-none-policy-hope',
      track: 'life',
      title: n === 0 ? 'The bill on the news' : 'The bill on the news, again',
      body: n === 0
        ? 'Every screen in the break room shows the same story: a proposal in Congress that could let people who have been here for years apply for papers. Your phone will not stop buzzing.'
        : `It is on the news again: a new proposal, new names, the same promise. You have watched this ${n > 1 ? 'more than once' : 'once'} before. The coworkers who arrived recently are giddy.`,
      stage: 'worksite',
      cast: [{ ...YOU, pose: 'phone' }, { role: 'friend', pose: 'cheer' }],
      choices: [
        c('folder', 'Hope carefully: gather proof of every year you have lived here, just in case.', ok('Weeks later the proposal stalls and the cameras move on. The folder stays on the shelf, a little thicker.', { legal: 4, wellbeing: 2, flags: { ...mark, ys_folder: true } }, 'A proposal changes nothing until it becomes law and an agency opens an application. Dated records of presence, work and taxes are what any attorney asks for first.')),
        c('guard', 'Do not let yourself hope this time.', ok('It stalls, as you expected. Being right does not feel like much.', { wellbeing: -2, flags: mark })),
        c('deposit', 'Pay a "consultant" who is already taking deposits to hold your place.', bad("The proposal never reaches a vote. The consultant's number stops working the same week.", { money: -cost(s, 800), wellbeing: -5, flags: mark }, 'There was no line to hold a place in.', 'No one can register you for a program that does not exist. Anyone taking money before a law passes is selling nothing.')),
      ],
    };
  }, { statuses: NONE, when: (s) => band(s, 2) && due(s, 'ys_hopeAt', 5) }),

  def('ys-none-friend-detained', 'life', 1.5, (s) => ({
    id: 'ys-none-friend-detained',
    track: 'life',
    title: 'A friend is detained',
    body: 'A friend you have worked beside for years did not come home on Tuesday. By evening his wife knows he is being held by immigration officers, and not yet where. She is at your door with their youngest on her hip.',
    stage: 'apartment-night',
    cast: [{ ...YOU, pose: 'talk' }, { role: 'stranger', pose: 'carry' }],
    choices: [
      c('clinic', 'Help her reach the legal clinic tonight and gather his papers.', ok('You make calls until someone answers. By morning a lawyer has his name and his file number.', { community: 7, legal: 2, wellbeing: -3, flags: { ys_detAt: stamp(s) } }, 'A person in removal proceedings may be represented by a lawyer of their choosing, at no expense to the government (INA 292). None is appointed, so families and nonprofits must find one, and early help matters.')),
      c('children', 'Take the children for the week and cover part of their rent.', ok('Three extra toothbrushes in the bathroom. The oldest does not ask questions, which is its own kind of question.', { money: -cost(s, 500), community: 8, family: 2, wellbeing: -2, flags: { ys_detAt: stamp(s) } })),
      c('door', 'Give her what cash you have and close the door. Being near this feels dangerous.', bad('You listen to her steps on the stairs. The apartment is very quiet afterwards.', { money: -cost(s, 100), community: -5, wellbeing: -6, flags: { ys_detAt: stamp(s) } }, 'Fear asked you to be smaller than you are.')),
    ],
  }), { statuses: NONE, when: (s) => band(s, 2) && due(s, 'ys_detAt', 7), oddsPerYear: 0.4 }),

  def('ys-none-tax-season', 'life', 1.4, (s) => {
    const rule = 'An ITIN is issued by the IRS for federal tax purposes to people who are not eligible for a Social Security number, regardless of immigration status. It does not authorize work, change immigration status or qualify you for Social Security benefits (IRS, Individual Taxpayer Identification Number).';
    return {
      id: 'ys-none-tax-season',
      track: 'life',
      title: 'Tax season',
      body: `${seen(s, 'ys_taxAt') ? 'Tax season again.' : 'Tax season.'} You work${has(s, 'informalWork') ? ' for cash' : ''} and have no Social Security number. ${has(s, 'ys_itin') ? 'Your folder already holds returns from other years.' : 'A coworker files every year with a tax number from the IRS and keeps the returns in a folder.'}`,
      stage: 'library',
      cast: [{ ...YOU, pose: 'sit' }, { role: 'advisor', pose: 'type' }],
      choices: [
        c('itin', 'File with an ITIN at the free tax clinic in the library.', ok('A volunteer walks you through it line by line. You owe a little, pay it, and file the copy with your other papers.', { money: -cost(s, 250), legal: 5, flags: { ys_taxAt: stamp(s), ys_itin: true, ys_folder: true } }, rule)),
        c('storefront', 'Use the storefront preparer who promises everyone a big refund.', bad('He keeps a third of a refund that later turns out to have been claimed wrongly. The letter from the IRS comes to you, not to him.', { money: -cost(s, 350), legal: -4, wellbeing: -3, flags: { ys_taxAt: stamp(s) } }, 'The promise was the product.', rule)),
        c('skip', 'Do not file. A return is one more paper with your name on it.', bad('Another year goes by with no record that you were here, working.', { legal: -2, flags: { ys_taxAt: stamp(s) } }, 'Being invisible has costs too.', `${rule} Whether to file is a real decision; a legal aid group can explain what a return does and does not do.`)),
      ],
    };
  }, { statuses: NONE, months: [6, 7, 8], when: (s) => band(s, 1) && hasJob(s) && due(s, 'ys_taxAt', 4) }),

  def('ys-none-ten-years', 'life', 2.5, (s) => ({
    id: 'ys-none-ten-years',
    track: 'life',
    title: 'Ten years here',
    body: `Ten years ago ${ewi(s) ? 'you arrived with nothing that had your name on it' : has(s, 'asyFiled') ? 'you arrived asking for protection' : 'you arrived with a visa and a plan'}. Tonight friends have brought food to mark the date. ${hasChild(s) ? 'Your child has never known another country. ' : ''}You have a decade of work, rent and birthdays here, and no more papers than on the first day.`,
    stage: 'kitchen',
    cast: [{ ...YOU, pose: 'eat' }, { role: 'friend', pose: 'laugh' }, { role: 'friend', pose: 'talk' }],
    choices: [
      c('toast', 'Let them celebrate you. Ten years of getting up every morning deserves a toast.', ok('Someone makes a speech that is mostly jokes. You find you cannot answer it without your voice going.', { wellbeing: 7, community: 5, flags: { ys_ten: true } })),
      c('recheck', 'Mark it by booking a fresh consultation. Ten years changes some questions.', ok('The attorney explains what the number ten does and does not mean. You leave knowing which of the stories you had heard were true.', { money: -cost(s, 150), legal: 5, flags: { ys_ten: true } }, `${CANCEL} ${ASSESS}`)),
      c('home', 'After everyone leaves, talk honestly about going home.', ok('Nothing is decided. It is the first time in years that the question has been asked out loud.', { family: 4, wellbeing: -3, flags: { ys_ten: true } }, `${BAR_10} Time here does not by itself create status either.`)),
    ],
  }), { statuses: NONE, when: (s) => band(s, 10, 13) && !has(s, 'ys_ten') }),

  def('ys-none-twenty-years', 'life', 2.5, (s) => ({
    id: 'ys-none-twenty-years',
    track: 'life',
    title: 'Twenty years here',
    body: `Twenty years. ${hasChild(s) ? 'The child you raised here is grown, or nearly.' : "Your friends' children, whom you held as babies, drive cars now."} You have outlasted three landlords and more bosses than you can count. A young man who has just arrived asks you, with respect, how long it takes to get papers.`,
    stage: 'park',
    cast: [{ ...YOU, pose: 'sit' }, { role: 'stranger', pose: 'talk' }],
    choices: [
      c('truth', 'Tell him the truth: for some of us, time alone never does it.', ok('He is quiet for a while. Then he asks what you would do in his place, and you find you have an answer.', { community: 5, wellbeing: -2, flags: { ys_twenty: true } }, 'US law has one provision that turns long residence itself into a green card, called registry, and it covers only people who entered before January 1, 1972 (INA 249). Everything else needs a family tie, a job category, protection, or a judge.')),
      c('teach', 'Tell him what you wish you had known in year one: the clinic, the records, the scams.', ok('He writes it down on the back of a receipt. You watch him fold it into his wallet like money.', { community: 8, wellbeing: 3, flags: { ys_twenty: true } }, ASSESS)),
      c('order', `${hasChild(s) ? 'Sit down with your family' : 'Sit down with the people closest to you'} and put your affairs in order.`, ok('Who holds the savings, who is called first, where the papers are. It is a sober evening, and you sleep well after it.', { family: 6, legal: 3, wellbeing: 1, flags: { ys_twenty: true, ys_plan: true } })),
      c('short', 'Say only "a long time", and change the subject.', ok('He nods as if that were an answer. Perhaps it is.', { wellbeing: -1, flags: { ys_twenty: true } })),
    ],
  }), { statuses: NONE, when: (s) => band(s, 20, 26) && !has(s, 'ys_twenty') }),

  def('ys-none-funeral', 'life', 1.5, (s) => ({
    id: 'ys-none-funeral',
    track: 'life',
    title: 'The funeral on a phone',
    body: 'Someone who helped raise you has died at home. The burial is in two days. Your family says nobody expects you, in the voice of people who wish you could come.',
    stage: 'apartment-night',
    cast: [{ ...YOU, pose: 'phone' }, { role: 'parent', pose: 'talk' }],
    choices: [
      c('video', 'Watch it on a phone held up by a cousin, and gather people here that evening.', ok('The picture freezes twice. In the evening your living room is full of people who never met the person and came anyway.', { family: 4, community: 4, wellbeing: -5, flags: { ys_funeral: true } }, `${BAR_10} There is no visa to come back on. For most people without status, a funeral at home means choosing between the grave and the life here.`)),
      c('send', 'Send money for the burial and the meal afterwards.', ok('It is done properly, as the family wanted, and your name is said among those who provided.', { money: -cost(s, 900), family: 7, wellbeing: -4, flags: { ys_funeral: true } }, BAR_10)),
      c('alone', 'Tell no one here. Work your shift.', bad('You get through the shift. The grief waits for you at the bus stop.', { wellbeing: -9, flags: { ys_funeral: true } }, 'Grief needs witnesses.', BAR_10)),
    ],
  }), { statuses: NONE, when: (s) => band(s, 4) && !has(s, 'ys_funeral'), oddsPerYear: 0.35 }),

  def('ys-none-passport', 'status', 1.4, (s) => {
    const rule = "A valid passport from your own country proves identity, not status. Your country's consulate sets the fees and the rules; the cost here is an estimate.";
    return {
      id: 'ys-none-passport',
      track: 'status',
      title: 'Your passport from home',
      body: `The one identity document you hold, your passport from home, expires in a few months. Renewing it means the consulate, a fee and an appointment under your real name. ${hasChild(s) ? "Your child's school and the hospital" : 'The bank and the pharmacy'} have both asked you for ID this year.`,
      stage: 'uscis',
      cast: [{ ...YOU, pose: 'idle' }, { role: 'teller', pose: 'talk' }],
      choices: [
        c('renew', 'Book the consulate appointment and renew it.', ok('A new booklet, good for years. It says who you are, which is not nothing.', { money: -cost(s, 180), legal: 4, wellbeing: 1, flags: { ys_ppAt: stamp(s) } }, rule)),
        c('group', 'Ask a community group about the consulate first, and go with someone who knows it.', ok('They have walked hundreds of people through it. A volunteer meets you at the door and waits with you.', { money: -cost(s, 180), legal: 4, community: 3, flags: { ys_ppAt: stamp(s) } }, rule)),
        c('lapse', 'Let it lapse. You are not going anywhere.', bad('Months later a clerk slides the expired passport back across a counter. "Do you have anything current?"', { legal: -4, wellbeing: -2, flags: { ys_ppAt: stamp(s) } }, 'Identity papers matter most when you have few.', rule)),
      ],
    };
  }, { statuses: NONE, when: (s) => band(s, 3) && due(s, 'ys_ppAt', 9), oddsPerYear: 0.45 }),

  def('ys-none-order', 'status', 2, (s) => ({
    id: 'ys-none-order',
    track: 'status',
    title: 'The order in the drawer',
    body: `There is a removal order with your name on it${has(s, 'inAbsentia') ? ', signed on a day you were not in the room' : ''}. You have lived with it for a while now. You know which drawer it is in, and most days you do not open the drawer.`,
    stage: 'apartment-night',
    cast: [{ ...YOU, pose: 'think' }],
    choices: [
      c('lawyer', 'Ask a licensed attorney whether anything can still be done about it.', ok("She reads every page. Some orders can be challenged and most cannot, she says, and she will tell you which this is once she has the court's file.", { money: -cost(s, 250), legal: 4, wellbeing: -2, flags: { ys_orderAt: stamp(s) } }, `Whether an old removal order can be reopened depends on facts and deadlines that can only be checked against the court file. Living with a final order means an arrest can lead straight to removal, and returning after removal without permission is a federal crime (INA 276). ${ASSESS}`)),
      c('plan', 'Make a plan for the people who depend on you, in case.', ok('Names, numbers, where the money is, who takes the keys. Writing it is grim. Having written it is a relief.', { family: 5, legal: 2, wellbeing: -1, flags: { ys_orderAt: stamp(s), ys_plan: true } })),
      c('closed', 'Leave the drawer closed.', ok('Another season passes. The drawer is still there every time you walk by it.', { wellbeing: -3, flags: { ys_orderAt: stamp(s) } })),
    ],
  }), { statuses: NONE, when: (s) => has(s, 'removalOrder') && due(s, 'ys_orderAt', 4) }),
];

export const CARDS: ChallengeDef[] = [
  ...LPR_CARDS,
  ...CIT_CARDS,
  ...WORKER_CARDS,
  ...AOS_CARDS,
  ...ASY_CARDS,
  ...ASYLEE_CARDS,
  ...NONE_CARDS,
];
