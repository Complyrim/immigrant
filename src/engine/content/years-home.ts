/**
 * Later-year cards: home, money, health and daily life (prefix `yh-`, flags `yh_`).
 * Legal sources are listed in research/years-home-notes.md. Prices are designed estimates in
 * 2025 dollars, scaled by `cost`.
 */
import { c, bad, def, money, ok } from '../cx';
import type { ChallengeDef, GameState, StatusCode } from '../types';
import {
  YOU, band, cost, has, hasChild, hasJob, hasSpouse, is, mayWork, noStatus, num, secure, settled,
  sponsored, waiting, yearsHere,
} from './yx';

/** A price in this year's dollars, as text. */
const p = (s: GameState, n: number): string => money(cost(s, n));
/** True if the card stamped by flag `k` has never run, or last ran at least `n` years ago. */
const gap = (s: GameState, k: string, n: number): boolean => s.flags[k] === undefined || s.year - num(s, k) >= n;
const cash = (s: GameState): number => s.stats.money;
const late = (s: GameState): boolean => yearsHere(s) >= 11;
const mid = (s: GameState): boolean => yearsHere(s) >= 5 && yearsHere(s) <= 10;
const paidJob = (s: GameState): boolean => num(s, 'salary') > 0 && mayWork(s);
/** Statuses with papers a licence office and a bank can check. */
const DOCUMENTED: StatusCode[] = ['OPT', 'STEM_OPT', 'H1B', 'O1', 'LPR', 'CITIZEN', 'ASYLEE'];
const TEMPORARY: StatusCode[] = ['OPT', 'STEM_OPT', 'H1B', 'O1'];
const PERMANENT: StatusCode[] = ['LPR', 'CITIZEN'];

export const CARDS: ChallengeDef[] = [
  // ---------------------------------------------------------------- a place to live
  def('yh-first-lease', 'life', 2, (s) => ({
    id: 'yh-first-lease',
    track: 'life',
    title: 'A lease in your own name',
    body: noStatus(s) || waiting(s)
      ? 'A one-bedroom is open two streets away. The application asks for a Social Security number and a credit history, and you leave both lines empty. The landlord looks at the form, then at you.'
      : 'A one-bedroom is open two streets away. For the first time the lease would have only your name on it. The landlord wants first month, last month and a deposit.',
    narration: noStatus(s) || waiting(s)
      ? 'A one-bedroom is open two streets away. The application asks for a Social Security number and a credit history, and you leave both lines empty.'
      : 'A one-bedroom is open two streets away. For the first time, the lease would have only your name on it.',
    lines: noStatus(s) || waiting(s)
      ? [
          { who: 'landlord', text: 'You left the Social Security number and the credit history empty.' },
          { who: 'player', text: 'I do not have those yet. I have always paid my rent on time.' },
          { who: 'landlord', text: 'Then I would need more up front. Let me think about it.' },
        ]
      : [
          { who: 'landlord', text: 'First month, last month and a deposit, all before you move in.' },
          { who: 'player', text: 'All of it at once? That is more than I expected.' },
          { who: 'landlord', text: 'That is how it works around here. The place will not stay open long.' },
        ],
    stage: 'apartment',
    cast: [{ ...YOU, pose: 'think' }, { role: 'landlord', pose: 'talk' }],
    choices: [
      c('sign', `Sign it and pay about ${p(s, 2400)} up front.`, ok(
        noStatus(s) || waiting(s)
          ? 'The landlord takes a larger deposit in place of a credit check and hands you two keys. Your name is on the mailbox by evening.'
          : 'Two keys, one mailbox, your name on the lease. You sit on the bare floor for a while and listen to how quiet it is.',
        { money: -cost(s, 2400), wellbeing: 7, flags: { yh_lease: true } },
        'Move-in costs here are a designed estimate. What a landlord may ask for up front depends on state and city rules.',
      )),
      c('share', `Take a two-bedroom with a friend and split it, about ${p(s, 1300)} each.`, ok('You argue about the thermostat within a week. You also never eat alone.', { money: -cost(s, 1300), community: 4, wellbeing: 2, flags: { yh_lease: true, yh_housemate: true } })),
      c('stay', 'Stay in the room you rent by the month, with nothing in writing.', bad('The room is cheap and the arrangement is a handshake. In spring the owner tells you a cousin needs it by the end of the month.', { money: -cost(s, 500), wellbeing: -5 }, 'Cheap and safe are not always the same thing.', 'A written lease is what lets a tenant show the agreed rent and the agreed dates. Without one, a month-to-month room can end on short notice.')),
    ],
  }), { when: (s) => settled(s) && band(s, 1, 6) && !has(s, 'yh_lease') }),

  def('yh-first-bed', 'life', 2, (s) => ({
    id: 'yh-first-bed',
    track: 'life',
    title: 'The first real bed',
    body: `You have slept on a mattress on the floor for ${yearsHere(s) <= 1 ? 'a year' : `${yearsHere(s)} years`}. It was supposed to be temporary. Your back has started to disagree.`,
    stage: 'bedroom',
    cast: [{ ...YOU, pose: 'think' }],
    choices: [
      c('new', `Buy a frame and a good mattress, about ${p(s, 900)}.`, ok('The delivery crew carries it up three flights. That night you sleep eight hours without waking.', { money: -cost(s, 900), wellbeing: 7, flags: { yh_bed: true } })),
      c('used', `Find a frame second-hand and keep the old mattress, about ${p(s, 150)}.`, ok('A neighbour helps you carry it home. It squeaks, and it is yours.', { money: -cost(s, 150), wellbeing: 3, community: 2, flags: { yh_bed: true } })),
      c('wait', 'Keep the floor. Furniture is for people who are staying.', bad('You wake stiff most mornings. You keep telling yourself you might not be here next year.', { wellbeing: -4 }, 'You have been here longer than you planned to wait.', 'Living as if you are about to leave has a cost of its own. Small comforts are not a promise to stay.')),
    ],
  }), { when: (s) => settled(s) && band(s, 1, 5) && !has(s, 'yh_bed') }),

  def('yh-rent-rise', 'life', 2, (s) => ({
    id: 'yh-rent-rise',
    track: 'life',
    title: 'The rent goes up',
    body: late(s)
      ? `A renewal letter is under the door. After ${yearsHere(s)} years in this city you know the pattern, but this rise is the biggest yet.`
      : 'A renewal letter is under the door. The new rent is a good deal more than the old one, starting in sixty days.',
    stage: 'apartment',
    cast: [{ ...YOU, pose: 'think' }, { role: 'landlord', pose: 'talk' }],
    choices: [
      c('talk', 'Ask to meet halfway, and offer a longer lease in return.', ok(
        has(s, 'yh_goodTenant') ? 'You have paid on time for years and the landlord knows it. The rise is cut in half.' : 'The landlord takes a little off for an eighteen-month lease. It still stings.',
        { money: -cost(s, has(s, 'yh_goodTenant') ? 500 : 800), wellbeing: 1, flags: { yh_rentY: s.year, yh_goodTenant: true } },
      )),
      c('pay', 'Pay it. Moving costs money too.', ok('You cut a few things from the month and stay where you know the bus times.', { money: -cost(s, 1400), wellbeing: -2, flags: { yh_rentY: s.year, yh_goodTenant: true } })),
      c('move', 'Give notice and find something cheaper, further out.', ok('The new place is forty minutes further from everything. The rent is lower and the nights are quieter.', { money: -cost(s, 900), wellbeing: -3, community: -3, flags: { yh_rentY: s.year, yh_movedY: s.year } })),
    ],
  }), { when: (s) => settled(s) && band(s, 2) && !has(s, 'yh_ownsHome') && gap(s, 'yh_rentY', 3), oddsPerYear: 0.5 }),

  def('yh-landlord-repairs', 'life', 1.5, (s) => ({
    id: 'yh-landlord-repairs',
    track: 'life',
    title: 'No heat in January',
    body: 'The radiator has been cold for four days. The landlord says a part is on order. You can see your breath in the kitchen.',
    stage: 'apartment-night',
    cast: [{ ...YOU, pose: 'phone' }],
    choices: [
      c('write', 'Put the request in writing, with dates and photos, and keep a copy.', ok('A repair crew comes two days after the letter. You keep the copy in a folder, just in case.', { wellbeing: 2, legal: 1, flags: { yh_repairY: s.year } }, 'A dated written request is the usual first step in any dispute with a landlord. What comes after depends on state and city rules.')),
      c('heater', `Buy a space heater, about ${p(s, 80)}, and stop asking.`, ok(
        noStatus(s) ? 'You would rather not be the tenant who complains. The heater keeps one room warm and the electric bill climbs.' : 'The heater keeps one room warm and the electric bill climbs. The radiator is fixed in March.',
        { money: -cost(s, 200), wellbeing: -2, flags: { yh_repairY: s.year } },
      )),
      c('neighbours', 'Knock on doors. If everyone is cold, everyone can ask together.', ok('Six households sign one letter. The part that was on order arrives the next morning.', { community: 5, wellbeing: 2, flags: { yh_repairY: s.year } })),
    ],
  }), { months: [4, 5, 6], when: (s) => settled(s) && band(s, 1, 9) && !has(s, 'yh_ownsHome') && gap(s, 'yh_repairY', 4), oddsPerYear: 0.4 }),

  def('yh-building-sold', 'life', 1.5, (s) => ({
    id: 'yh-building-sold',
    track: 'life',
    title: 'The building is sold',
    body: `A notice is taped in the lobby: new owners. Within a month there are plans for renovations and talk that leases will not be renewed. ${hasChild(s) ? 'Your child has only ever known this address.' : 'You have lived here longer than anywhere since you arrived.'}`,
    stage: 'street',
    cast: [{ ...YOU, pose: 'think' }, { role: 'stranger', pose: 'talk' }],
    choices: [
      c('buyout', `Take the offer to leave early, about ${p(s, 3000)}, and start looking now.`, ok('The cheque covers a deposit and a van. You find a smaller place before the rush.', { money: cost(s, 1200), wellbeing: -3, community: -3, flags: { yh_soldOut: true, yh_movedY: s.year } })),
      c('organise', 'Go to the tenants\' meeting in the laundry room.', ok('Twenty neighbours, one folding table, a volunteer from a housing group. You win six more months and a larger payment for everyone.', { money: cost(s, 2000), community: 8, wellbeing: -2, flags: { yh_soldOut: true, yh_movedY: s.year } }, 'Tenant protections when a building changes hands vary a great deal by city and state. Local housing groups know the rules where you live.')),
      c('wait', 'Wait and see. Maybe nothing changes.', bad('The non-renewal letter comes in the busiest month to move. You take what you can find.', { money: -cost(s, 2200), wellbeing: -7, flags: { yh_soldOut: true, yh_movedY: s.year } }, 'Notices in lobbies are worth reading twice.', 'When a building is sold, the people who start looking early have the most choices. Waiting left you moving on the owner\'s timetable.')),
    ],
  }), { when: (s) => settled(s) && band(s, 5) && !has(s, 'yh_ownsHome') && !has(s, 'yh_soldOut'), oddsPerYear: 0.25 }),

  def('yh-move-across-town', 'life', 1.5, (s) => ({
    id: 'yh-move-across-town',
    track: 'life',
    title: 'Moving across town',
    body: late(s)
      ? 'A better place has come up on the other side of the city. You count the boxes in your head. There are far more of them than the two suitcases you came with.'
      : 'A better place has come up on the other side of the city: more light, a real kitchen, a longer ride to everyone you know.',
    stage: 'apartment',
    cast: [{ ...YOU, pose: 'carry' }, { role: 'friend', pose: 'carry' }],
    choices: [
      c('movers', `Hire movers, about ${p(s, 1100)}.`, ok('Three people empty your home in two hours. You tip them and sit among the boxes.', { money: -cost(s, 1100), wellbeing: 4, flags: { yh_movedY: s.year } })),
      c('friends', `Rent a van, about ${p(s, 180)}, and ask friends.`, ok('Five friends, one staircase, one dropped lamp. You feed everyone on the floor of the new place.', { money: -cost(s, 260), community: 5, wellbeing: 1, flags: { yh_movedY: s.year } })),
      c('stay', 'Let it go. Your people are on this side of town.', ok('Someone else takes the bright kitchen. You keep the corner shop that knows your order.', { community: 3, wellbeing: -1, flags: { yh_movedY: s.year } })),
    ],
  }), { when: (s) => settled(s) && band(s, 3) && !has(s, 'yh_ownsHome') && gap(s, 'yh_movedY', 5), oddsPerYear: 0.35 }),

  def('yh-renters-insurance', 'life', 1.5, (s) => ({
    id: 'yh-renters-insurance',
    track: 'life',
    title: 'Everything you own',
    body: 'A fire two blocks away put four families on the street with nothing. You look around your own place: a laptop, a bed, papers you could not easily replace.',
    stage: 'apartment',
    cast: [{ ...YOU, pose: 'think' }],
    choices: [
      c('insure', `Buy renter's insurance, about ${p(s, 180)} a year.`, ok('The policy is four pages. You photograph every room and email the pictures to yourself.', { money: -cost(s, 180), wellbeing: 2, flags: { yh_rentersIns: true, yh_docsSafe: true } })),
      c('box', `Buy a small fireproof box for your documents, about ${p(s, 50)}.`, ok('Passport, certificates, the letters that prove who you are. They fit in a box the size of a loaf of bread.', { money: -cost(s, 50), legal: 2, flags: { yh_docsSafe: true, yh_rentersIns: false } })),
      c('skip', 'Skip it. It will not happen to you.', ok('You keep the money. You do move your documents to a higher shelf.', { flags: { yh_rentersIns: false } })),
    ],
  }), { when: (s) => settled(s) && band(s, 2, 9) && s.flags.yh_rentersIns === undefined && !has(s, 'yh_ownsHome'), oddsPerYear: 0.5 }),

  def('yh-flood', 'life', 1.5, (s) => ({
    id: 'yh-flood',
    track: 'life',
    title: 'Water on the floor',
    body: has(s, 'yh_ownsHome')
      ? 'You come home to the sound of running water. A pipe has burst behind the kitchen wall and the floor is ruined. This time there is no landlord to call.'
      : 'You come home to water coming through the ceiling. The neighbour upstairs left a tap running. Your bed, your shoes and a box of papers are soaked.',
    stage: 'apartment-night',
    cast: [{ ...YOU, pose: 'carry' }],
    choices: [
      c('claim', has(s, 'yh_ownsHome') ? 'Call your home insurer and start a claim.' : 'Photograph everything and file a claim.', has(s, 'yh_ownsHome') || has(s, 'yh_rentersIns')
        ? ok('An adjuster walks through with a tablet. After the deductible, most of the damage is covered.', { money: -cost(s, has(s, 'yh_ownsHome') ? 1000 : 250), wellbeing: -2, flags: { yh_floodY: s.year } })
        : bad('There is no policy to claim on. The building\'s insurance covers the building, not your things.', { money: -cost(s, 1500), wellbeing: -6, flags: { yh_floodY: s.year } }, 'The gap only shows on the day you need it.', 'A landlord\'s policy generally covers the structure, not a tenant\'s belongings. Renter\'s insurance is what covers those.')),
      c('self', 'Dry out what you can and replace the rest a little at a time.', ok(
        has(s, 'yh_docsSafe') ? 'The documents were in their box and are dry. The mattress is not. You sleep on a friend\'s couch for a week.' : 'You peel wet pages apart on the windowsill. Some of them will need replacing, and that takes months.',
        { money: -cost(s, has(s, 'yh_ownsHome') ? 2500 : 700), wellbeing: -4, legal: has(s, 'yh_docsSafe') ? 0 : -2, flags: { yh_floodY: s.year } },
      )),
      c('help', 'Ask friends for fans, towels and a place to sleep.', ok('By midnight there are four people in your home with mops. Someone brings food. It is still a disaster, but you are not alone in it.', { money: -cost(s, has(s, 'yh_ownsHome') ? 1800 : 500), community: 5, wellbeing: -1, flags: { yh_floodY: s.year } })),
    ],
  }), { when: (s) => settled(s) && band(s, 4) && gap(s, 'yh_floodY', 8), oddsPerYear: 0.2 }),

  def('yh-break-in', 'life', 1.5, (s) => ({
    id: 'yh-break-in',
    track: 'life',
    title: 'The door is open',
    body: `You come home and the door is ajar. Drawers are pulled out. ${has(s, 'yh_docsSafe') ? 'The laptop is gone. The box with your documents is still under the bed.' : 'The laptop is gone, and so is the envelope where you kept your documents.'}${noStatus(s) ? ' You do not know what calling the police would mean for someone without papers.' : ''}`,
    stage: 'apartment-night',
    cast: [{ ...YOU, pose: 'think' }],
    choices: [
      noStatus(s) || waiting(s)
        ? c('ask', 'Call a legal aid line first and ask what reporting would involve.', ok('A volunteer explains how reports work where you live and what your options are. You decide with facts, not fear.', { legal: 2, wellbeing: 1, money: -cost(s, 600), flags: { yh_breakInY: s.year } }, 'Whether and how to report a crime without status is a question for a local legal aid group. Local practice differs, so the game does not state a rule.'))
        : c('report', 'Report it and get a copy of the police report.', ok(
          has(s, 'yh_rentersIns') ? 'An officer takes notes at your kitchen table. With the report number, your insurance pays for most of what was taken.' : 'An officer takes notes at your kitchen table. Nothing comes back, but you have a report number for replacing your documents.',
          { money: -cost(s, has(s, 'yh_rentersIns') ? 150 : 900), legal: 1, flags: { yh_breakInY: s.year } },
        )),
      c('locks', `Change the locks tonight, about ${p(s, 220)}, and tell the neighbours.`, ok('The locksmith is done by ten. The woman across the hall says she will keep an eye out, and means it.', { money: -cost(s, has(s, 'yh_docsSafe') ? 900 : 1100), community: 3, wellbeing: -2, flags: { yh_breakInY: s.year, yh_docsSafe: true } })),
      c('quiet', 'Tidy up and say nothing to anyone.', bad('You replace what you can afford. For weeks you check the door three times before bed.', { money: -cost(s, 900), wellbeing: -7, flags: { yh_breakInY: s.year } }, 'Carrying it alone made it heavier.', 'Telling neighbours or the landlord costs little and often gets a lock or a light fixed. Silence left the worry with you alone.')),
    ],
  }), { when: (s) => settled(s) && band(s, 3) && gap(s, 'yh_breakInY', 9), oddsPerYear: 0.2 }),

  def('yh-neighbourhood-changing', 'life', 1.5, (s) => ({
    id: 'yh-neighbourhood-changing',
    track: 'life',
    title: 'The street is changing',
    body: `The shop where you bought phone cards in your first year is a wine bar now. The laundromat is next. ${has(s, 'yh_ownsHome') ? 'Your home is worth more on paper, and your tax bill has noticed.' : 'New neighbours are friendly, and the rents in the windows have doubled.'}`,
    stage: 'street',
    cast: [{ ...YOU, pose: 'walk' }, { role: 'owner', pose: 'talk' }],
    choices: [
      c('join', 'Join the neighbourhood association and speak at the meeting.', ok('You are nervous at the microphone. Afterwards three people thank you, two of them in languages you do not speak.', { community: 7, wellbeing: 1, flags: { yh_streetY: s.year } })),
      c('loyal', 'Spend your money at the old places while they last.', ok('The tailor, the grocer, the barber. It costs a little more than the chain store. They know your name.', { money: -cost(s, 200), community: 4, flags: { yh_streetY: s.year } })),
      c('adapt', 'Shrug. You were new here once too.', ok('You try the wine bar. It is fine. You still miss the phone cards.', { wellbeing: 1, community: -1, flags: { yh_streetY: s.year } })),
    ],
  }), { when: (s) => settled(s) && band(s, 9) && gap(s, 'yh_streetY', 7), oddsPerYear: 0.4 }),

  def('yh-host-newcomer', 'life', 1.5, (s) => ({
    id: 'yh-host-newcomer',
    track: 'life',
    title: 'Someone needs a couch',
    body: `A friend of a friend has just arrived with one suitcase and nowhere to stay. They ask if you have a couch for a few weeks. You remember your own first month very clearly.`,
    stage: 'apartment',
    cast: [{ ...YOU, pose: 'talk' }, { role: 'stranger', pose: 'carry' }],
    choices: [
      c('host', 'Say yes, for a month.', ok(
        hasSpouse(s) || hasChild(s) ? 'The household is crowded and loud for five weeks. Your guest finds a room and leaves a thank-you note on the fridge.' : 'Five weeks of shared dinners and long questions about how things work here. You know more answers than you expected.',
        { money: -cost(s, 250), community: 7, wellbeing: -2, flags: { yh_hostY: s.year } },
      )),
      c('guide', 'No couch, but spend a Saturday showing them the city.', ok('The bus map, the cheap grocery, the library with free internet. It takes one day and saves them a month.', { community: 4, flags: { yh_hostY: s.year } })),
      c('no', 'Say you cannot. Your home is the one place you rest.', ok('They understand. You feel a small weight anyway, and send the name of a shelter that helps new arrivals.', { wellbeing: 1, community: -2, flags: { yh_hostY: s.year } })),
    ],
  }), { when: (s) => settled(s) && band(s, 6) && gap(s, 'yh_hostY', 6), oddsPerYear: 0.35 }),

  // ---------------------------------------------------------------- money
  def('yh-bank-account', 'life', 2, (s) => ({
    id: 'yh-bank-account',
    track: 'life',
    title: 'Where the money sleeps',
    body: 'You are paid, you cash the cheque at a counter that takes a cut, and the rest lives in an envelope at home. A credit union on your street has a sign in the window about new accounts.',
    stage: 'bank',
    cast: [{ ...YOU, pose: 'idle' }, { role: 'teller', pose: 'talk' }],
    choices: [
      c('open', 'Go in and ask what they need to open an account.', ok(
        noStatus(s) || waiting(s)
          ? 'The teller lists the identification they accept and you have enough of it. You leave with an account number and no envelope.'
          : 'Twenty minutes and two forms. Your pay will land there from now on, and the counter with the fee can do without you.',
        { money: cost(s, 150), wellbeing: 3, flags: { yh_bank: true } },
        'Each bank and credit union sets its own identification list within federal rules. It is worth asking at more than one.',
      )),
      c('envelope', 'Keep the envelope. You can see it and count it.', bad('The cheque-cashing fees add up over the year. You also start to dislike leaving home for long.', { money: -cost(s, 350), wellbeing: -3 }, 'Cash at home is easy to count and easy to lose.', 'Cheque-cashing counters charge a share of every cheque, and cash at home has no protection from theft, fire or water.')),
      c('friend', 'Ask a friend to hold your savings in their account.', bad('It works until your friend has a hard month. The money comes back slowly, and not all of it.', { money: -cost(s, 500), community: -3 }, 'Good friends and good banks are different things.', 'Money in someone else\'s account is legally theirs to spend. An account in your own name is the only kind you control.')),
    ],
  }), { when: (s) => settled(s) && band(s, 1, 5) && hasJob(s) && !has(s, 'yh_bank') && (noStatus(s) || waiting(s) || is(s, 'ASYLEE')) }),

  def('yh-credit-card', 'life', 2, (s) => ({
    id: 'yh-credit-card',
    track: 'life',
    title: 'No credit history',
    body: 'A phone plan, an apartment, a car loan: every form asks for a credit score, and yours is a blank. It does not matter how careful you were with money at home. Here you start from zero.',
    stage: 'bank',
    cast: [{ ...YOU, pose: 'sit' }, { role: 'teller', pose: 'talk' }],
    choices: [
      c('secured', `Open a secured card with a ${p(s, 300)} deposit and pay it in full each month.`, ok('You put one small bill on it and pay it off on the same day every month. A year later a number appears where the blank was.', { money: -cost(s, 300), career: 1, wellbeing: 2, flags: { yh_credit: true } }, 'A secured card is backed by your own deposit. On-time payments reported each month are what build a credit history.')),
      c('store', 'Take the store card offered at the checkout, with a discount today.', bad('The discount is real. So is the interest, and you do not read that part until the second statement.', { money: -cost(s, 280), wellbeing: -3, flags: { yh_credit: true } }, 'The offer at the till is rarely the best one.', 'Store cards often carry higher interest than ordinary cards. They do build a history, but a carried balance costs far more than the discount saved.')),
      c('cash', 'Stay with cash and a debit card. Debt is debt.', ok('You owe nobody anything. You also pay larger deposits on everything, because the forms still show a blank.', { money: -cost(s, 200), wellbeing: 1 }, 'A debit card does not build a credit history. Without one, deposits and interest rates are usually higher.')),
    ],
  }), { statuses: DOCUMENTED, when: (s) => band(s, 1, 7) && !has(s, 'yh_credit') }),

  def('yh-identity-theft', 'life', 1.2, (s) => ({
    id: 'yh-identity-theft',
    track: 'life',
    title: 'An account you never opened',
    body: 'A letter thanks you for opening a store account in a city you have never visited. Then a second letter. Someone is using your name and your number.',
    stage: 'apartment',
    cast: [{ ...YOU, pose: 'phone' }],
    choices: [
      c('freeze', 'Freeze your credit files, dispute both accounts and keep a log of every call.', ok('It takes eleven phone calls and most of a month. The accounts are closed and your score recovers.', { wellbeing: -3, legal: 2, flags: { yh_idTheft: true } }, 'A credit freeze stops new accounts being opened in your name. Written disputes with dates are what get false accounts removed.')),
      c('pay', `Pay the small balance, about ${p(s, 400)}, to make it go away.`, bad('The letters stop for a while. Then a third account appears.', { money: -cost(s, 400), wellbeing: -5, flags: { yh_idTheft: true } }, 'Paying it told someone the name still works.', 'Paying a debt that is not yours can look like accepting it. The accounts stay open until they are disputed and the file is frozen.')),
      c('helpdesk', 'Take the letters to a free financial counselling clinic.', ok('A counsellor walks you through each form in an afternoon. You leave with a checklist and a much quieter mind.', { community: 2, wellbeing: 1, legal: 2, flags: { yh_idTheft: true } })),
    ],
  }), { statuses: DOCUMENTED, when: (s) => band(s, 5) && has(s, 'yh_credit') && !has(s, 'yh_idTheft'), oddsPerYear: 0.2 }),

  def('yh-tax-season', 'life', 2, (s) => ({
    id: 'yh-tax-season',
    track: 'life',
    title: late(s) ? 'Tax season, again' : yearsHere(s) <= 2 ? 'Your first tax return' : 'Tax season',
    body: noStatus(s)
      ? 'It is spring and everyone is talking about taxes. You have worked all year. A neighbour says people without a Social Security number can still file, with a tax number of their own.'
      : late(s)
        ? `The envelopes pile up in February as they do every year. ${has(s, 'yh_ownsHome') ? 'There is a mortgage statement among them now.' : 'The pile is thicker than it used to be.'}${hasChild(s) ? ' So is a form from the school.' : ''}`
        : 'It is spring and the forms have arrived from work. The return is in English you have never needed before, and it is yours to get right.',
    stage: 'apartment',
    cast: [{ ...YOU, pose: 'type' }],
    choices: [
      c('clinic', 'Take everything to a free volunteer tax clinic at the library.', ok(
        noStatus(s) ? 'A volunteer helps you apply for a tax number and file with it. You keep the copy with your other papers.' : 'A retired bookkeeper checks every line with you. You understand your own pay slip for the first time.',
        { community: 2, legal: 3, money: cost(s, hasJob(s) ? 300 : 0), flags: { yh_taxY: s.year, yh_filed: true } },
        noStatus(s)
          ? 'The IRS issues an ITIN to people who have a federal tax purpose and are not eligible for a Social Security number. An ITIN does not authorize work, does not provide or change immigration status, and does not qualify the holder for Social Security benefits. (IRS, Individual Taxpayer Identification Number)'
          : undefined,
      )),
      c('preparer', `Pay a preparer, about ${p(s, 220)}.`, ok('You sign where the sticky notes point. It is done in forty minutes.', { money: -cost(s, 220) + cost(s, hasJob(s) ? 300 : 0), legal: 2, wellbeing: 1, flags: { yh_taxY: s.year, yh_filed: true } })),
      c('later', 'Put the envelopes in a drawer. Next month.', bad('Next month becomes summer. A letter arrives with a penalty on it and a number to call.', { money: -cost(s, 350), legal: -4, wellbeing: -3, flags: { yh_taxY: s.year } }, 'The drawer did not make it smaller.', 'Late returns bring penalties and interest when tax is owed. A record of filing on time each year is also something later applications may ask about.')),
    ],
  }), { months: [6, 7, 8], when: (s) => settled(s) && band(s, 1) && hasJob(s) && gap(s, 'yh_taxY', 3) }),

  def('yh-refund-promise', 'life', 1.3, (s) => ({
    id: 'yh-refund-promise',
    track: 'life',
    title: 'The biggest refund in town',
    body: 'A storefront with flags in the window promises the biggest refund in town, in your language. The preparer takes a share of the refund as the fee and does not put a name on the return.',
    stage: 'street',
    cast: [{ ...YOU, pose: 'think' }, { role: 'owner', pose: 'talk' }],
    choices: [
      c('walk', 'Walk out and file somewhere that signs its work.', ok('Your refund is smaller and it is real. Nobody writes to you about it afterwards.', { legal: 3, flags: { yh_refundScam: true, yh_taxY: s.year, yh_filed: true } })),
      c('ask', 'Ask to read the whole return before anything is sent.', ok('There are children on it you do not have. You take your papers back and leave.', { legal: 3, wellbeing: -1, flags: { yh_refundScam: true } })),
      c('sign', 'Sign. A bigger refund would help this month.', bad('The refund is large. Eight months later a letter asks you to explain numbers you have never seen.', { money: -cost(s, 1200), legal: -7, wellbeing: -5, flags: { yh_refundScam: true } }, 'The name on a return is the one that answers for it.', 'You are responsible for what is on your own tax return, whoever prepared it. A preparer who will not sign the return or who takes a share of the refund is a warning sign.')),
    ],
  }), { months: [6, 7, 8], when: (s) => settled(s) && band(s, 2, 12) && hasJob(s) && !has(s, 'yh_refundScam'), oddsPerYear: 0.3 }),

  def('yh-foreign-income', 'life', 1.3, (s) => ({
    id: 'yh-foreign-income',
    track: 'life',
    title: 'Money that stayed at home',
    body: 'A small account at home still earns a little interest, and a relative rents out the room that is in your name. Your tax preparer asks, without looking up, whether you have any income outside the United States.',
    stage: 'bank',
    cast: [{ ...YOU, pose: 'sit' }, { role: 'advisor', pose: 'talk' }],
    choices: [
      c('report', 'Say yes and bring the statements.', ok('It adds a page and a small amount of tax. The return is complete, and you sleep fine.', { money: -cost(s, 180), legal: 4, flags: { yh_foreignInc: true } }, `${is(s, 'CITIZEN') ? 'US citizens' : 'Permanent residents are US tax residents under the green card test, and US tax residents'} are taxed on worldwide income: interest, wages and rent count whether they are earned inside or outside the United States. (IRS, Taxation of U.S. residents; U.S. tax residency: green card test)`)),
      c('close', 'Report it this year, then close the account and sign the room over to your relative.', ok('Two signatures at home, sent by courier. One less thread tying your money to two countries.', { money: -cost(s, 300), legal: 3, family: 2, flags: { yh_foreignInc: true } })),
      c('no', 'Say no. It is a tiny amount in another country.', bad('The preparer ticks a box and moves on. The question stays with you longer than you expected.', { legal: -6, flags: { yh_foreignInc: true } }, 'Small amounts still belong on the form.', 'US tax residents must report worldwide income, including interest and rent earned abroad (IRS, Taxation of U.S. residents). Leaving it off makes a return inaccurate, and tax returns are read again in later applications.')),
    ],
  }), { statuses: PERMANENT, months: [6, 7, 8], when: (s) => band(s, 5) && !has(s, 'yh_foreignInc'), oddsPerYear: 0.35 }),

  def('yh-emergency-fund', 'life', 1.8, (s) => ({
    id: 'yh-emergency-fund',
    track: 'life',
    title: 'Three months of rent',
    body: mid(s) || late(s)
      ? 'A colleague loses a job and is on a friend\'s sofa within six weeks. You do the sum for yourself. How long could you last with nothing coming in?'
      : 'Every month ends near zero. One surprise, a tooth or a ticket home, and you would be borrowing. People say to keep three months of rent aside. It sounds like advice for someone richer.',
    stage: 'kitchen',
    cast: [{ ...YOU, pose: 'think' }],
    choices: [
      c('auto', 'Set up a small automatic transfer on every payday.', ok('You stop noticing it after two months. The balance grows quietly.', { money: cost(s, 500), wellbeing: 3, flags: { yh_fund: true, yh_fundY: s.year } })),
      c('home', 'Savings can wait. People at home need it more than a bank does.', ok('The money does real good where it lands. Your own cushion stays thin.', { money: -cost(s, 400), family: 5, wellbeing: -1, flags: { yh_fundY: s.year } })),
      c('split', 'Split it: half aside, half sent home.', ok('Nobody is fully satisfied, including you. Both numbers move in the right direction.', { money: cost(s, 100), family: 3, wellbeing: 2, flags: { yh_fund: true, yh_fundY: s.year } })),
    ],
  }), { when: (s) => settled(s) && band(s, 1) && hasJob(s) && gap(s, 'yh_fundY', 5), oddsPerYear: 0.5 }),

  def('yh-send-home', 'life', 1.8, (s) => ({
    id: 'yh-send-home',
    track: 'life',
    title: late(s) ? 'The roof at home' : 'A request from home',
    body: late(s)
      ? `After ${yearsHere(s)} years, you are the one the family calls when something large breaks. This time it is the roof of the house you grew up in, before the rains.`
      : 'A message from home: school fees are due for a younger relative, and the family is short. Nobody asks directly. They do not have to.',
    stage: 'apartment-night',
    cast: [{ ...YOU, pose: 'phone' }],
    choices: [
      c('all', `Send the full amount, about ${p(s, late(s) ? 2500 : 900)}.`, ok('The transfer goes through in minutes. A photo comes back a week later, and it is worth every dollar.', { money: -cost(s, late(s) ? 2500 : 900), family: 7, wellbeing: 1, flags: { yh_sendY: s.year } })),
      c('part', 'Send half, and say plainly what your own costs are here.', ok('It is an awkward call. People at home picture your life as easier than it is. They understand a little more afterwards.', { money: -cost(s, late(s) ? 1250 : 450), family: 3, wellbeing: 2, flags: { yh_sendY: s.year } })),
      c('borrow', 'Send it all on the credit card and deal with it later.', bad('The family never knows it was borrowed. You pay for it for most of a year.', { money: -cost(s, late(s) ? 3100 : 1150), family: 7, wellbeing: -5, flags: { yh_sendY: s.year } }, 'Generosity on credit costs extra.', 'Card interest turned one gift into many months of payments. Telling family the real limit is hard, and usually cheaper.')),
    ],
  }), { when: (s) => settled(s) && band(s, 1) && hasJob(s) && gap(s, 'yh_sendY', 3), oddsPerYear: 0.55 }),

  def('yh-lend-friend', 'life', 1.5, (s) => ({
    id: 'yh-lend-friend',
    track: 'life',
    title: 'A friend asks for a loan',
    body: `A friend who helped you when you were new is behind on rent and asks to borrow ${p(s, 800)}. "Two months, I promise." You have it, just.`,
    stage: 'cafe',
    cast: [{ ...YOU, pose: 'sit' }, { role: 'friend', pose: 'talk' }],
    choices: [
      c('lend', 'Lend it, and agree the dates out loud.', ok('Some of it comes back in two months and the rest by the end of the year. The friendship survives, slightly rearranged.', { money: -cost(s, 250), community: 4, flags: { yh_lendY: s.year } })),
      c('gift', `Give ${p(s, 300)} as a gift, and say it is not a loan.`, ok('Your friend is quiet, then grateful. Nobody has to avoid anybody afterwards.', { money: -cost(s, 300), community: 5, wellbeing: 1, flags: { yh_lendY: s.year } })),
      c('no', 'Say no, kindly. You cannot afford to lose it.', ok('Your friend says they understand. Calls are shorter for a while.', { community: -4, wellbeing: -1, flags: { yh_lendY: s.year } })),
    ],
  }), { when: (s) => settled(s) && band(s, 2) && cash(s) > 1500 && gap(s, 'yh_lendY', 6), oddsPerYear: 0.35 }),

  def('yh-scam-call', 'life', 1.6, (s) => ({
    id: 'yh-scam-call',
    track: 'life',
    title: 'A call about your file',
    body: `The caller knows your name and your home country. He says he is an immigration officer, that there is a problem with your file, and that it can be fixed today if you pay a fee in gift cards. ${noStatus(s) || waiting(s) ? 'Your stomach drops, as he means it to.' : 'He does not let you get a word in.'}`,
    stage: 'apartment',
    cast: [{ ...YOU, pose: 'phone' }],
    choices: [
      c('hang', 'Hang up.', ok('The phone rings twice more, then stops. Your hands take a minute to settle.', { wellbeing: -1, legal: 2, flags: { yh_scamY: s.year } }, 'USCIS says it will never ask you to pay fees to a person by phone or email, and does not accept gift cards or money transfer services as payment. (USCIS, Common Scams)')),
      c('check', 'Hang up, then ask a legal aid office whether anything is really wrong.', ok('A staff member checks and finds nothing. She says three other people brought in the same call this week.', { legal: 3, community: 2, flags: { yh_scamY: s.year } }, 'USCIS warns about people who pose as its officials, and says only licensed attorneys or accredited representatives of recognized organizations may give immigration legal advice. (USCIS, Common Scams)')),
      c('pay', `Buy the cards, about ${p(s, 1000)}, and read him the numbers.`, bad('He thanks you and says one more payment is needed. Then the line goes dead.', { money: -cost(s, 1000), wellbeing: -8, flags: { yh_scamY: s.year } }, 'Fear was the tool, and it worked.', 'USCIS never asks for fees by phone and does not accept gift cards as payment (USCIS, Common Scams). Money sent this way is almost never recovered.')),
    ],
  }), { when: (s) => settled(s) && !is(s, 'CITIZEN') && band(s, 1) && gap(s, 'yh_scamY', 6), oddsPerYear: 0.3 }),

  def('yh-consultant-storefront', 'life', 1.4, (s) => ({
    id: 'yh-consultant-storefront',
    track: 'life',
    title: 'The consultant upstairs',
    body: 'Above the bakery there is an office with a sign: immigration consultant, notary, all forms. A neighbour swears by him. He wants cash up front and says no lawyer is needed.',
    stage: 'street',
    cast: [{ ...YOU, pose: 'think' }, { role: 'stranger', pose: 'talk' }],
    choices: [
      c('ask', 'Ask whether he is a licensed attorney or an accredited representative.', ok('He changes the subject. You thank him and keep your cash.', { legal: 4, flags: { yh_notario: true } }, 'A notary is not authorized to provide immigration legal services. Only licensed attorneys or accredited representatives working for a recognized organization may advise and represent you. (USCIS, Common Scams)')),
      c('clinic', 'Skip him and get on the waiting list at a nonprofit legal clinic.', ok('The wait is seven weeks. The person you finally see has a certificate on the wall and tells you only what is true.', { legal: 5, wellbeing: -1, flags: { yh_notario: true } })),
      c('pay', `Pay him, about ${p(s, 1500)}. Your neighbour was happy.`, bad('He takes the cash and your documents. For months there is always one more form and one more fee.', { money: -cost(s, 1500), legal: -5, wellbeing: -5, flags: { yh_notario: true } }, 'A sign on a door is not a licence.', 'A notary is not authorized to give immigration legal advice in the United States (USCIS, Common Scams). Wrong filings made by such offices can do lasting harm to a case.')),
    ],
  }), { statuses: ['NONE', 'ASY_PENDING', 'AOS_PENDING', 'OPT', 'ASYLEE'], when: (s) => band(s, 1, 12) && !has(s, 'yh_notario'), oddsPerYear: 0.3 }),

  // ---------------------------------------------------------------- getting around
  def('yh-drivers-licence', 'life', 2, (s) => ({
    id: 'yh-drivers-licence',
    track: 'life',
    title: 'The licence office',
    body: is(s, ...TEMPORARY)
      ? 'A driver\'s licence would open up jobs, groceries and half the city. The checklist asks for proof of identity, proof of address and your immigration documents. The clerk says the licence will carry an end date tied to your stay.'
      : 'A driver\'s licence would open up jobs, groceries and half the city. The checklist asks for proof of identity, two proofs of address, a written test and a road test.',
    stage: 'uscis',
    cast: [{ ...YOU, pose: 'idle' }, { role: 'teller', pose: 'talk' }],
    choices: [
      c('school', `Pay for a few lessons, about ${p(s, 350)}, then take the test.`, ok('The instructor teaches you the local habits, the four-way stop above all. You pass on the first try.', { money: -cost(s, 400), wellbeing: 4, career: 2, flags: { yh_licence: true } }, is(s, ...TEMPORARY)
        ? 'For a person with temporary lawful status, a REAL ID licence may not run past the end of the authorized stay, or one year where the stay has no end date. Renewing it means showing that the status is still in effect. (6 CFR 37.21)'
        : 'Licence fees and tests are set by each state. The costs here are a designed estimate.')),
      c('friend', 'Study the handbook and practise in a friend\'s car.', ok('You miss the first road test on a parking manoeuvre and pass the second. The photo is terrible. You love it.', { money: -cost(s, 90), community: 2, wellbeing: 3, flags: { yh_licence: true } }, is(s, ...TEMPORARY) ? 'A limited-term licence ends with your authorized stay, so each extension of status means another visit to the licence office. (6 CFR 37.21)' : undefined)),
      c('later', 'Leave it. The bus works.', ok('The bus does work, mostly. Some jobs and some apartments stay out of reach.', { career: -1, flags: { yh_licenceSkipY: s.year } })),
    ],
  }), { statuses: DOCUMENTED, when: (s) => band(s, 1, 9) && !has(s, 'yh_licence') && gap(s, 'yh_licenceSkipY', 2) }),

  def('yh-first-car', 'life', 2, (s) => ({
    id: 'yh-first-car',
    track: 'life',
    title: 'A car of your own',
    body: `${hasChild(s) ? 'With a child, every errand by bus is an expedition.' : 'The late bus was cut, and the walk from the stop is long in winter.'} A neighbour is selling a twelve-year-old sedan. A dealer on the main road has newer ones, with payments.`,
    stage: 'street',
    cast: [{ ...YOU, pose: 'think' }, { role: 'owner', pose: 'talk' }],
    choices: [
      c('used', `Buy the old sedan for cash, about ${p(s, 4500)}.`, ok('It smells of someone else\'s air freshener and starts every morning. The city gets smaller overnight.', { money: -cost(s, 4500), wellbeing: 5, career: 2, flags: { yh_ownsCar: true, yh_carY: s.year } })),
      c('finance', `Finance a newer one: about ${p(s, 2000)} down and a monthly payment.`, has(s, 'yh_credit')
        ? ok('Your credit history gets you a fair rate. The car is reliable and the payment is steady.', { money: -cost(s, 3800), wellbeing: 6, career: 2, flags: { yh_ownsCar: true, yh_carY: s.year, yh_carLoan: true } })
        : bad('With no credit history, the rate on the contract is very high. You sign anyway, and feel it every month.', { money: -cost(s, 5600), wellbeing: 1, career: 2, flags: { yh_ownsCar: true, yh_carY: s.year, yh_carLoan: true } }, 'The blank on the credit form had a price.', 'Lenders charge much more to borrowers with no credit history. A year of on-time payments on a small card first would have lowered the rate.')),
      c('none', 'Stay without a car. Insurance, fuel and parking add up.', ok('You buy a better coat and a monthly pass. The money you did not spend stays where it is.', { wellbeing: -2, money: cost(s, 300), flags: { yh_carSkipY: s.year } })),
    ],
  }), { statuses: DOCUMENTED, when: (s) => band(s, 2, 12) && has(s, 'yh_licence') && !has(s, 'yh_ownsCar') && cash(s) > cost(s, 3000) && gap(s, 'yh_carSkipY', 3) }),

  def('yh-car-trouble', 'life', 1.6, (s) => ({
    id: 'yh-car-trouble',
    track: 'life',
    title: late(s) ? 'The car is tired' : 'A noise under the hood',
    body: late(s) || s.year - num(s, 'yh_carY') >= 7
      ? 'The mechanic wipes his hands and gives you the number. It is more than the car is worth. He says it has one more winter in it, maybe.'
      : 'The car starts making a sound like a spoon in a blender. The mechanic says the transmission is going.',
    stage: 'street',
    cast: [{ ...YOU, pose: 'think' }, { role: 'owner', pose: 'talk' }],
    choices: [
      c('fix', `Fix it properly, about ${p(s, 1800)}.`, ok('It drives like it did when you bought it. Your savings do not look like they did.', { money: -cost(s, 1800), wellbeing: 1, flags: { yh_carFixY: s.year } })),
      c('replace', `Trade it in for something newer, about ${p(s, 6000)} after the trade.`, ok('The new one has a screen that talks to your phone. You miss the old one for about a day.', { money: -cost(s, 6000), wellbeing: 4, flags: { yh_carFixY: s.year, yh_carY: s.year } })),
      c('patch', `Do the cheapest patch, about ${p(s, 400)}, and hope.`, bad('It lasts four months and stops on a highway ramp in the rain. The tow costs more than the patch did.', { money: -cost(s, 1100), wellbeing: -5, career: -1, flags: { yh_carFixY: s.year } }, 'Hope is not a repair.', 'The patch only delayed the full bill and added a tow and a missed shift. When a job depends on a car, the cheap fix is often the expensive one.')),
    ],
  }), { when: (s) => settled(s) && has(s, 'yh_ownsCar') && s.year - num(s, 'yh_carY') >= 2 && gap(s, 'yh_carFixY', 4), oddsPerYear: 0.45 }),

  // ---------------------------------------------------------------- health
  def('yh-work-insurance', 'life', 1.8, (s) => ({
    id: 'yh-work-insurance',
    track: 'life',
    title: 'Open enrolment',
    body: yearsHere(s) >= 8
      ? `Open enrolment again. You have ticked the same box for years. ${hasChild(s) || hasSpouse(s) ? 'This year there is more than one person to cover.' : 'This year your knees and your eyes have opinions.'}`
      : 'An email from work: two weeks to choose a health plan. There are three options and a glossary of words like deductible, copay and network that nobody explained.',
    stage: 'workplace',
    cast: [{ ...YOU, pose: 'type' }],
    choices: [
      c('rich', `Take the higher premium and low deductible, about ${p(s, 1500)} more over the year.`, ok('It costs more every payday. When you need a doctor, you go without doing sums first.', { money: -cost(s, 1500), wellbeing: 4, flags: { yh_insured: true, yh_goodPlan: true, yh_planY: s.year } })),
      c('cheap', 'Take the cheapest plan with the high deductible.', ok('Your pay barely changes. You are covered for a disaster, and you hope not to test what else it covers.', { money: -cost(s, 400), wellbeing: 1, flags: { yh_insured: true, yh_goodPlan: false, yh_planY: s.year } })),
      c('waive', 'Waive coverage and keep the money.', bad('Your pay is a little bigger. You start treating every cough as a financial decision.', { money: cost(s, 300), wellbeing: -4, flags: { yh_insured: false, yh_planY: s.year } }, 'You are healthy until the day you are not.', 'Without a plan, a single emergency visit can cost more than years of premiums. Most workplace plans can only be joined during open enrolment or after a life event.')),
    ],
  }), { when: (s) => settled(s) && band(s, 1) && paidJob(s) && gap(s, 'yh_planY', 5), oddsPerYear: 0.6 }),

  def('yh-marketplace-plan', 'life', 1.4, (s) => ({
    id: 'yh-marketplace-plan',
    track: 'life',
    title: 'Insurance without an employer',
    body: 'You have no health plan through work. A flyer at the library says permanent residents can buy one on the public marketplace, and a helper sits there on Thursdays to walk people through it.',
    stage: 'library',
    cast: [{ ...YOU, pose: 'sit' }, { role: 'advisor', pose: 'talk' }],
    choices: [
      c('enrol', `Sit with the helper and enrol, about ${p(s, 1800)} for the year after savings.`, ok('The helper checks your income against a chart and finds a plan you can carry. A card arrives in the mail.', { money: -cost(s, 1800), wellbeing: 5, flags: { yh_insured: true, yh_planY: s.year } }, 'Certain lawfully present immigrants can buy Marketplace coverage. From January 1, 2027, help with premiums is limited to lawful permanent residents and a few other groups. Medicaid generally opens five years after a person gets a qualified status. (healthcare.gov, Coverage for lawfully present immigrants; 8 U.S.C. 1613(a))')),
      c('clinic', 'Skip the plan and use the community health centre, which charges by income.', ok('The centre is crowded and kind. It handles the ordinary things well. You try not to think about the things that are not ordinary.', { money: -cost(s, 300), wellbeing: 1, flags: { yh_insured: false, yh_planY: s.year } })),
      c('nothing', 'Do nothing. You feel fine.', bad('The year passes without a doctor. You notice you have stopped running for the bus.', { wellbeing: -4, flags: { yh_insured: false, yh_planY: s.year } }, 'Feeling fine is not the same as knowing.', 'Marketplace plans are generally sold only during a yearly enrolment window or after a life event. Missing it means a year without cover.')),
    ],
  }), { statuses: ['LPR'], when: (s) => band(s, 1) && !has(s, 'yh_insured') && (num(s, 'salary') === 0 || has(s, 'yw_ownBusiness')) && gap(s, 'yh_planY', 4), oddsPerYear: 0.5 }),

  def('yh-clinic-no-cover', 'life', 1.6, (s) => ({
    id: 'yh-clinic-no-cover',
    track: 'life',
    title: 'A cough that will not leave',
    body: `You have been coughing for three weeks and it is getting worse. You have no insurance. ${noStatus(s) ? 'You are not sure which doors are open to someone without papers, or what they ask at the desk.' : 'With your case still pending, you are not sure which doors are open to you.'}`,
    stage: 'clinic',
    cast: [{ ...YOU, pose: 'sit' }, { role: 'nurse', pose: 'talk' }],
    choices: [
      c('centre', `Go to the community health centre, about ${p(s, 60)} on its sliding scale.`, ok('The nurse asks about your symptoms and your income, and nothing else. You leave with a prescription and a follow-up date.', { money: -cost(s, 60), wellbeing: 5, flags: { yh_clinicY: s.year } }, 'People who are not "qualified" immigrants are barred from most federal public benefits, but the law keeps exceptions: emergency medical treatment, immunizations, and testing and treatment for symptoms of communicable diseases. (8 U.S.C. 1611(b)(1))')),
      c('pharmacy', 'Ask the pharmacist and buy what is on the shelf.', ok('The syrup helps you sleep. The cough takes another month to go.', { money: -cost(s, 40), wellbeing: -2, flags: { yh_clinicY: s.year } })),
      c('wait', 'Wait it out. You cannot miss work, and you cannot pay a hospital.', bad('One night you cannot catch your breath and a housemate takes you to the emergency room. They treat you. The bill follows.', { money: -cost(s, 1400), wellbeing: -7, flags: { yh_clinicY: s.year } }, 'Waiting made it an emergency.', 'A hospital emergency department must screen and stabilize any individual who comes in, and may not delay that to ask about payment or insurance (42 U.S.C. 1395dd(a), (h)). It still sends a bill. A clinic visit weeks earlier would have cost far less.')),
    ],
  }), { statuses: ['NONE', 'ASY_PENDING'], when: (s) => band(s, 1) && gap(s, 'yh_clinicY', 4), oddsPerYear: 0.5 }),

  def('yh-medical-bill', 'life', 1.8, (s) => ({
    id: 'yh-medical-bill',
    track: 'life',
    title: 'The bill after the emergency room',
    body: `Three stitches and two hours in a waiting room, a month ago. Now an envelope: ${p(s, has(s, 'yh_goodPlan') ? 450 : has(s, 'yh_insured') ? 1900 : 3800)}. ${has(s, 'yh_insured') ? 'The insurance paid some. This is the part it calls your responsibility.' : 'There is no insurance line on it at all.'}`,
    stage: 'apartment',
    cast: [{ ...YOU, pose: 'think' }],
    choices: [
      c('itemise', 'Call the billing office, ask for an itemised bill and ask about financial assistance.', ok('Two charges turn out to be errors. A form you had never heard of takes more off for your income.', { money: -cost(s, has(s, 'yh_goodPlan') ? 300 : has(s, 'yh_insured') ? 1000 : 1400), wellbeing: 1, flags: { yh_billY: s.year } }, 'Hospital bills can be checked line by line and often negotiated. Many hospitals have assistance programs for patients with lower incomes, and it costs nothing to ask.')),
      c('plan', 'Ask for a payment plan and pay a little each month.', ok('No interest, twelve months. It is a line in your budget now, like the phone.', { money: -cost(s, has(s, 'yh_goodPlan') ? 450 : has(s, 'yh_insured') ? 1900 : 3800), wellbeing: -1, flags: { yh_billY: s.year } })),
      c('ignore', 'Put it in the drawer. It cannot be right.', bad('The letters change colour. Then a collection agency starts calling at dinner time.', { money: -cost(s, has(s, 'yh_goodPlan') ? 500 : 1200), wellbeing: -6, flags: { yh_billY: s.year, yh_collections: true } }, 'It was a real bill, even if it was wrong.', 'An unanswered medical bill can go to collections and damage a credit record. The same bill, questioned early, is often reduced.')),
    ],
  }), { when: (s) => settled(s) && band(s, 2) && gap(s, 'yh_billY', 6), oddsPerYear: 0.3 }),

  def('yh-dental-emergency', 'life', 1.6, (s) => ({
    id: 'yh-dental-emergency',
    track: 'life',
    title: 'A cracked tooth',
    body: late(s)
      ? 'A molar that has been patched twice finally gives up, on a Friday evening. Teeth, it turns out, keep their own count of the years.'
      : 'You bite down on something hard and feel a tooth split. By night the whole side of your face is throbbing. Dental care is not part of any plan you have.',
    stage: 'clinic',
    cast: [{ ...YOU, pose: 'sit' }, { role: 'doctor', pose: 'talk' }],
    choices: [
      c('dentist', `See a dentist tomorrow: a root canal and a crown, about ${p(s, 2200)}.`, ok('Two long appointments and a numb jaw. The pain is gone and the tooth stays.', { money: -cost(s, 2200), wellbeing: 5, flags: { yh_toothY: s.year } })),
      c('school', `Go to the dental school clinic, about ${p(s, 700)}, slower and supervised.`, ok('A nervous student and a calm professor take four visits to do what a private office does in two. The work is careful and the price is kind.', { money: -cost(s, 700), wellbeing: 2, flags: { yh_toothY: s.year } })),
      c('pull', `Have it pulled, about ${p(s, 250)}.`, ok('The pain ends that afternoon. You chew on the other side now and smile a little differently.', { money: -cost(s, 250), wellbeing: -2, flags: { yh_toothY: s.year } })),
      c('wait', 'Painkillers and salt water. It might settle.', bad('It does not settle. The infection spreads and you end up in an emergency room, then at the dentist anyway.', { money: -cost(s, 2900), wellbeing: -8, flags: { yh_toothY: s.year } }, 'Teeth do not heal by waiting.', 'A cracked tooth left untreated can become an infection that needs emergency care. The delay added a hospital bill on top of the dental one.')),
    ],
  }), { when: (s) => settled(s) && band(s, 2) && gap(s, 'yh_toothY', 7), oddsPerYear: 0.3 }),

  def('yh-reading-glasses', 'life', 1.5, (s) => ({
    id: 'yh-reading-glasses',
    track: 'life',
    title: 'Arms too short',
    body: 'You catch yourself holding your phone at arm\'s length to read a message from home. The small print on forms has become a rumour. When did that happen?',
    stage: 'clinic',
    cast: [{ ...YOU, pose: 'think' }, { role: 'doctor', pose: 'talk' }],
    choices: [
      c('exam', `Get a proper eye exam and glasses, about ${p(s, 320)}.`, ok('The optician clicks a lens into place and the world sharpens. The exam also checks the pressure in your eyes, which nobody had ever done.', { money: -cost(s, 320), wellbeing: 5, flags: { yh_glasses: true } })),
      c('cheap', `Buy reading glasses off the pharmacy rack, about ${p(s, 20)}.`, ok('They work well enough. You own four pairs within a year and can never find any of them.', { money: -cost(s, 40), wellbeing: 2, flags: { yh_glasses: true } })),
      c('deny', 'Make the font bigger. You are not that old.', ok('The font is enormous now. Your younger colleagues are polite about it.', { wellbeing: -2, career: -1, flags: { yh_glasses: true } })),
    ],
  }), { when: (s) => settled(s) && !has(s, 'yh_glasses') && (band(s, 13) || (band(s, 7) && s.profile.age + yearsHere(s) >= 42)) }),

  def('yh-bad-back', 'life', 1.6, (s) => ({
    id: 'yh-bad-back',
    track: 'life',
    title: 'Your back has a say',
    body: `${num(s, 'salary') > 4500 ? 'Years at a desk' : 'Years of lifting, standing and long shifts'} have settled in your lower back. This morning you could not bend to tie your shoes.`,
    stage: 'bedroom',
    cast: [{ ...YOU, pose: 'sit' }],
    choices: [
      c('therapy', `See a physical therapist for six sessions, about ${p(s, has(s, 'yh_insured') ? 240 : 720)}.`, ok('The exercises are dull and they work. You do them on the floor every morning, grumbling.', { money: -cost(s, has(s, 'yh_insured') ? 240 : 720), wellbeing: 6, flags: { yh_backY: s.year } })),
      c('move', 'Start walking an hour a day and stretching at night.', ok('It costs nothing but time. Some mornings are better. You see streets of your own city you had never walked.', { wellbeing: 3, flags: { yh_backY: s.year } })),
      c('push', 'Take pills and keep working. Rest is for later.', bad('You get through the month. Then your back locks completely and you lose a week of work.', { money: -cost(s, 600), wellbeing: -6, career: -2, flags: { yh_backY: s.year } }, 'Later arrived early.', 'Pain that is pushed through tends to come back larger. A few sessions early would have cost less than the lost week.')),
    ],
  }), { when: (s) => settled(s) && band(s, 8) && gap(s, 'yh_backY', 6), oddsPerYear: 0.4 }),

  def('yh-checkup', 'life', 1.6, (s) => ({
    id: 'yh-checkup',
    track: 'life',
    title: 'The numbers on the chart',
    body: `You have not slept through a night in months, and you finally see a doctor. The blood pressure cuff tightens twice. "It is high," she says. "Does this run in your family? How is your sleep? How is your stress?" You almost laugh at the last one.`,
    narration: 'You have not slept through a night in months, and you finally see a doctor. The blood pressure cuff tightens twice.',
    lines: [
      { who: 'doctor', text: 'It is high. Does high blood pressure run in your family?' },
      { who: 'player', text: 'I am not sure. Nobody at home ever talked about it.' },
      { who: 'doctor', text: 'How is your sleep? And how is your stress?' },
      { who: 'player', text: 'My sleep is bad. My stress, I almost want to laugh.' },
    ],
    stage: 'clinic',
    cast: [{ ...YOU, pose: 'sit' }, { role: 'doctor', pose: 'talk' }],
    choices: [
      c('treat', `Start the medication and come back in three months, about ${p(s, has(s, 'yh_insured') ? 150 : 480)} a year.`, ok('One small pill each morning. The numbers come down, and so do the headaches you had stopped noticing.', { money: -cost(s, has(s, 'yh_insured') ? 150 : 480), wellbeing: 6, flags: { yh_checkY: s.year, yh_bp: true } })),
      c('habits', 'Ask for three months to try sleep, salt and walking first.', ok('You cook differently and go to bed earlier. The numbers improve a little. The doctor says to keep watching them.', { wellbeing: 4, flags: { yh_checkY: s.year } })),
      c('family', 'Call home and ask what your parents and grandparents had.', ok('The call takes an hour and wanders everywhere. You learn three things about your family\'s health that nobody had thought to mention.', { family: 4, wellbeing: 2, flags: { yh_checkY: s.year } })),
      c('ignore', 'Nod, leave and do not go back.', bad('Life is busy and you feel the same as before. The dizzy spells start the following year.', { wellbeing: -7, flags: { yh_checkY: s.year } }, 'It did not hurt, so it was easy to forget.', 'High blood pressure usually has no symptoms until it has done damage. Follow-up visits are how it is caught.')),
    ],
  }), { when: (s) => settled(s) && band(s, 11) && gap(s, 'yh_checkY', 6), oddsPerYear: 0.45 }),

  // ---------------------------------------------------------------- daily life
  def('yh-cook-for-others', 'life', 1.6, (s) => ({
    id: 'yh-cook-for-others',
    track: 'life',
    title: late(s) ? 'The table you set' : 'Cooking for the building',
    body: late(s)
      ? 'Somewhere along the way your home became the one where people gather. Someone asks if you will cook the dish you always make. It tastes like a place most of them have never seen.'
      : 'The building is holding a potluck in the courtyard. You could bring something from home. You could also bring a supermarket pie and not explain anything to anyone.',
    stage: 'kitchen',
    cast: [{ ...YOU, pose: 'cook' }, { role: 'friend', pose: 'laugh' }],
    choices: [
      c('home', `Cook the real thing, properly, about ${p(s, 70)} in ingredients.`, ok(
        late(s) ? 'Twelve people, mismatched chairs, one pot scraped clean. A neighbour\'s teenager asks you to write the recipe down.' : 'It takes two buses to find one ingredient. The dish is empty in ten minutes and three neighbours ask what it is called.',
        { money: -cost(s, 70), community: 6, wellbeing: 4, flags: { yh_cookY: s.year } },
      )),
      c('teach', 'Invite two neighbours into the kitchen and cook it together.', ok('They chop badly and ask good questions. By the end they can pronounce it.', { money: -cost(s, 50), community: 7, wellbeing: 2, flags: { yh_cookY: s.year } })),
      c('pie', 'Bring something from the shop. You are tired.', ok('Nobody minds. You eat well, talk a little, and are home by eight.', { money: -cost(s, 15), community: 1, wellbeing: 1, flags: { yh_cookY: s.year } })),
    ],
  }), { when: (s) => settled(s) && band(s, 2) && gap(s, 'yh_cookY', 4), oddsPerYear: 0.5 }),

  def('yh-winter-bill', 'life', 1.4, (s) => ({
    id: 'yh-winter-bill',
    track: 'life',
    title: 'The heating bill',
    body: 'The utility bill for the coldest month is three times the usual one. You read the number twice. Nobody told you this was part of the price of the place.',
    stage: 'kitchen',
    cast: [{ ...YOU, pose: 'think' }],
    choices: [
      c('plan', 'Call the utility and ask to spread the cost over the year.', ok('A budget plan evens it out to the same amount every month. Winter stops being a shock.', { money: -cost(s, 220), wellbeing: 2, flags: { yh_heatY: s.year } })),
      c('seal', `Seal the windows and buy heavy curtains, about ${p(s, 90)}.`, ok('A roll of plastic film and an afternoon. The draught stops, and the next bill is noticeably smaller.', { money: -cost(s, 240), wellbeing: 3, flags: { yh_heatY: s.year } })),
      c('cold', 'Turn the heat down and wear a coat indoors.', bad('You save money and catch a cold that lasts until spring.', { money: -cost(s, 150), wellbeing: -5, flags: { yh_heatY: s.year } }, 'Some savings cost more than they return.', 'A cold home wears on sleep and health. Utilities often have budget plans, and it costs nothing to ask.')),
    ],
  }), { months: [5, 6, 7], when: (s) => settled(s) && band(s, 1, 8) && gap(s, 'yh_heatY', 5), oddsPerYear: 0.4 }),

  // ---------------------------------------------------------------- a home of your own
  def('yh-down-payment', 'life', 1.8, (s) => ({
    id: 'yh-down-payment',
    track: 'life',
    title: 'Rent receipts',
    body: `You add up what you have paid in rent since you arrived and wish you had not. ${hasSpouse(s) ? 'At dinner the two of you say the word "house" out loud for the first time.' : 'A colleague your age has just bought a small place.'} A down payment is a very large number.`,
    stage: 'kitchen',
    cast: [{ ...YOU, pose: 'think' }],
    choices: [
      c('save', 'Open a separate account and move money into it every month.', ok('You name the account "Door". Watching it grow becomes a small private pleasure.', { money: cost(s, 600), wellbeing: 3, flags: { yh_saving: true } })),
      c('class', 'Take the free first-time buyer class at the community centre.', ok('Six evenings of closing costs, inspections and interest. You learn what lenders look at and what you would need to change.', { community: 2, career: 1, wellbeing: 1, flags: { yh_saving: true, yh_buyerClass: true } })),
      c('rent', 'Decide that renting suits you. A house is an anchor.', ok('You keep your freedom to move and your weekends free of gutters.', { wellbeing: 2, flags: { yh_rentChoice: true } })),
    ],
  }), { statuses: PERMANENT, when: (s) => band(s, 5, 16) && paidJob(s) && !has(s, 'yh_saving') && !has(s, 'yh_rentChoice') && !has(s, 'yh_ownsHome') }),

  def('yh-house-or-wait', 'life', 1.5, (s) => ({
    id: 'yh-house-or-wait',
    track: 'life',
    title: 'Everyone is buying',
    body: 'Two colleagues have bought houses this year. You earn what they earn. Your right to stay rests on your job, though, and a thirty-year loan is a long promise to make on a status that has an end date.',
    stage: 'cafe',
    cast: [{ ...YOU, pose: 'sit' }, { role: 'friend', pose: 'talk' }],
    choices: [
      c('save', 'Keep renting and build the down payment for the day your status is settled.', ok('The savings account grows. The decision waits for a letter you do not control.', { money: cost(s, 800), wellbeing: -1, flags: { yh_saving: true, yh_waitedToBuy: true } })),
      c('nest', `Stay a renter, and make the rental feel like home, about ${p(s, 1200)}.`, ok('A real sofa, shelves, plants that need you. If you have to leave, you will have lived well while you were here.', { money: -cost(s, 1200), wellbeing: 5, flags: { yh_waitedToBuy: true } })),
      c('ask', 'Ask a housing counsellor what buying would involve for someone in your position.', ok('She is frank: lenders set their own rules for temporary statuses, and the risk of a forced sale is yours. You leave with a clearer picture.', { legal: 2, wellbeing: 1, flags: { yh_waitedToBuy: true, yh_buyerClass: true } }, 'The game does not state a lending rule here. Each lender has its own requirements for borrowers on temporary statuses, and they are worth asking about directly.')),
    ],
  }), { statuses: ['H1B', 'O1', 'AOS_PENDING'], when: (s) => band(s, 5) && num(s, 'salary') > 0 && !has(s, 'yh_waitedToBuy') && (sponsored(s) || waiting(s)), oddsPerYear: 0.5 }),

  def('yh-buy-home', 'life', 2.5, (s) => ({
    id: 'yh-buy-home',
    track: 'life',
    title: 'An offer on a home',
    body: `The agent has shown you eleven places. The twelfth is small, with a tree outside the kitchen window. ${has(s, 'yh_buyerClass') ? 'You know what every line of the estimate means.' : 'The estimate has a great many lines.'} After ${yearsHere(s)} years here, you could own a piece of the ground.`,
    stage: 'street',
    cast: [{ ...YOU, pose: 'think' }, { role: 'advisor', pose: 'talk' }],
    choices: [
      c('buy', `Make the offer: about ${p(s, 22000)} down, plus closing costs.`, ok(
        hasChild(s) ? 'The keys are heavier than you expected. Your child runs from room to room choosing one.' : 'The keys are heavier than you expected. You call home and hold the phone up to the empty rooms.',
        { money: -cost(s, has(s, 'yh_buyerClass') ? 24000 : 26000), wellbeing: 9, family: 3, community: 3, flags: { yh_ownsHome: true, yh_homeY: s.year, yh_lease: true } },
        'Prices here are a designed estimate. A lender looks at income, credit history, debts and savings before it approves a mortgage.',
      )),
      c('further', `Buy something larger, an hour further out: about ${p(s, 16000)} down.`, ok('There is a yard, and a spare room for visitors from home. The commute takes a real bite out of every day.', { money: -cost(s, 18500), wellbeing: 4, family: 4, community: -3, flags: { yh_ownsHome: true, yh_homeY: s.year, yh_lease: true, yh_farOut: true } })),
      c('pass', 'Step back. The payment would leave nothing for a bad month.', ok('Someone else gets the tree. Your savings stay whole, and you sleep.', { wellbeing: 1, flags: { yh_passY: s.year } })),
    ],
  }), { statuses: PERMANENT, when: (s) => band(s, 7) && has(s, 'yh_saving') && !has(s, 'yh_ownsHome') && paidJob(s) && cash(s) >= cost(s, 28000) && gap(s, 'yh_passY', 3) }),

  def('yh-home-repair', 'life', 1.8, (s) => ({
    id: 'yh-home-repair',
    track: 'life',
    title: s.year - num(s, 'yh_homeY') >= 8 ? 'The roof\'s turn' : 'No landlord to call',
    body: s.year - num(s, 'yh_homeY') >= 8
      ? 'A brown stain spreads across the bedroom ceiling. The roofer climbs down and shakes his head: it has done its years.'
      : 'The water heater dies on a Sunday night. You reach for your phone to call the landlord, and remember that the landlord is you.',
    stage: 'apartment',
    cast: [{ ...YOU, pose: 'phone' }],
    choices: [
      c('pro', `Hire it done properly, about ${p(s, s.year - num(s, 'yh_homeY') >= 8 ? 9000 : 1800)}.`, ok('It is done in days and comes with a warranty. Your savings take the hit a house was always going to ask for.', { money: -cost(s, s.year - num(s, 'yh_homeY') >= 8 ? 9000 : 1800), wellbeing: 2, flags: { yh_fixY: s.year } })),
      c('learn', 'Watch videos, borrow tools and do what you safely can yourself.', ok('It takes three weekends and one call to a neighbour who knows more. You save a lot and learn where every pipe runs.', { money: -cost(s, s.year - num(s, 'yh_homeY') >= 8 ? 5500 : 700), community: 3, wellbeing: -2, flags: { yh_fixY: s.year } })),
      c('delay', 'Put a bucket under it and wait for a better month.', bad('The better month does not come. The damage spreads into the wall.', { money: -cost(s, s.year - num(s, 'yh_homeY') >= 8 ? 12000 : 2600), wellbeing: -5, flags: { yh_fixY: s.year } }, 'Houses do not wait.', 'Water damage grows the longer it is left. Owners are usually advised to set aside a little every year for repairs.')),
    ],
  }), { when: (s) => settled(s) && has(s, 'yh_ownsHome') && s.year - num(s, 'yh_homeY') >= 1 && gap(s, 'yh_fixY', 4), oddsPerYear: 0.5 }),

  def('yh-home-costs-rise', 'life', 1.5, (s) => ({
    id: 'yh-home-costs-rise',
    track: 'life',
    title: 'The payment went up',
    body: 'Your mortgage rate is fixed, but the monthly payment has risen anyway. The letter explains: property tax and home insurance both went up, and the lender collects them with the loan.',
    stage: 'kitchen',
    cast: [{ ...YOU, pose: 'think' }],
    choices: [
      c('shop', 'Spend a weekend getting insurance quotes from other companies.', ok('Five calls and a lot of hold music. One quote is much lower for the same cover.', { money: -cost(s, 400), wellbeing: 1, flags: { yh_escrowY: s.year } })),
      c('appeal', 'Look up how to question the tax assessment and file the form.', ok('You bring photos of the cracked driveway and three nearby sale prices. The assessment comes down a little.', { money: -cost(s, 600), legal: 1, community: 1, flags: { yh_escrowY: s.year } }, 'Property tax and the way to question an assessment are set locally. The county office explains the process and the dates.')),
      c('absorb', 'Pay it and cut something else.', ok('The house costs what it costs. You cancel two subscriptions and one small pleasure.', { money: -cost(s, 1300), wellbeing: -2, flags: { yh_escrowY: s.year } })),
    ],
  }), { when: (s) => settled(s) && has(s, 'yh_ownsHome') && s.year - num(s, 'yh_homeY') >= 2 && gap(s, 'yh_escrowY', 5), oddsPerYear: 0.45 }),

  // ---------------------------------------------------------------- the long view
  def('yh-retirement-start', 'life', 1.8, (s) => ({
    id: 'yh-retirement-start',
    track: 'life',
    title: 'The form you skipped',
    body: `A younger colleague asks what you put into the retirement plan at work. You have never opened that form. The employer adds money if you do, and after ${yearsHere(s)} years you have left all of it on the table.`,
    stage: 'workplace',
    cast: [{ ...YOU, pose: 'type' }, { role: 'friend', pose: 'talk' }],
    choices: [
      c('match', 'Enrol and put in enough to get the full employer match.', ok('Your pay drops a little. A second number starts growing where you do not have to look at it.', { money: -cost(s, 900), wellbeing: 4, career: 1, flags: { yh_retire: true, yh_retireY: s.year } })),
      c('small', 'Start with one percent. Something is better than nothing.', ok('You barely feel it. It is a beginning, and beginnings are your speciality.', { money: -cost(s, 250), wellbeing: 2, flags: { yh_retire: true, yh_retireY: s.year } })),
      c('home', 'Skip it. Your plan for old age is land and family at home.', ok(
        secure(s) ? 'It is a real plan, and many people have lived by it. It also rests on prices and people an ocean away.' : 'It is a real plan, and with your status uncertain it may be the more sensible one. It rests on prices and people an ocean away.',
        { family: 2, flags: { yh_retireY: s.year } },
      )),
    ],
  }), { when: (s) => settled(s) && band(s, 7) && paidJob(s) && !has(s, 'yh_retire') && gap(s, 'yh_retireY', 5) }),

  def('yh-retirement-raid', 'life', 1.4, (s) => ({
    id: 'yh-retirement-raid',
    track: 'life',
    title: 'The money you cannot touch',
    body: `A large, sudden cost has landed: ${hasChild(s) ? 'a school bill' : 'a family emergency at home'}, about ${p(s, 6000)}. Your savings do not cover it. Your retirement account would, several times over.`,
    stage: 'bank',
    cast: [{ ...YOU, pose: 'sit' }, { role: 'advisor', pose: 'talk' }],
    choices: [
      c('withdraw', 'Take it out of the retirement account.', bad('The money arrives in a week. In spring the tax return shows what it really cost.', { money: -cost(s, 1800), wellbeing: -3, flags: { yh_raidY: s.year } }, 'The account gave it back, minus a share.', 'Withdrawals from a retirement plan before age 59 and a half generally carry an additional 10% tax on top of ordinary income tax, unless an exception applies. (IRS, Retirement topics: exceptions to tax on early distributions)')),
      c('trim', 'Pause your contributions for a year and pay the cost from your pay.', ok('It is a tight year. The account sits untouched and keeps growing by itself.', { money: -cost(s, 5200), wellbeing: -3, flags: { yh_raidY: s.year } })),
      c('ask', 'Ask the people involved for time, and pay in parts.', ok('It is an uncomfortable conversation and it works. The cost is spread across the year.', { money: -cost(s, 6000), wellbeing: -1, family: -1, flags: { yh_raidY: s.year } })),
    ],
  }), { when: (s) => settled(s) && band(s, 10) && has(s, 'yh_retire') && s.year - num(s, 'yh_retireY') >= 3 && gap(s, 'yh_raidY', 8), oddsPerYear: 0.25 }),

  def('yh-social-security-record', 'life', 1.5, (s) => ({
    id: 'yh-social-security-record',
    track: 'life',
    title: 'Your earnings, year by year',
    body: `You look up your Social Security record for the first time. There it is: every year you have worked here, one line each. ${yearsHere(s) >= 14 ? 'One year in the middle shows zero, and you know you worked that year.' : 'It reads like a short biography written by a payroll office.'}`,
    stage: 'library',
    cast: [{ ...YOU, pose: 'type' }],
    choices: [
      c('check', 'Check every line against your old tax returns.', ok(
        yearsHere(s) >= 14 ? 'You find the pay slips for the missing year and send them in. Months later, the zero is gone.' : 'Every line matches. You save a copy with your other papers.',
        { legal: 2, wellbeing: 3, flags: { yh_ssRecord: true } },
        'A worker is fully insured for Social Security retirement with 40 quarters of coverage, which takes at least ten years of covered work (42 U.S.C. 414(a)(2)). Benefits are worked out from the earnings on this record, so errors are worth fixing.',
      )),
      c('plan', 'Use the estimate to work out when you could stop working.', ok('The number is smaller than you hoped, since your first working years were in another country. You adjust the plan, not the dream.', { wellbeing: 1, career: 1, flags: { yh_ssRecord: true } }, 'A worker is fully insured for Social Security retirement with 40 quarters of coverage (42 U.S.C. 414(a)(2)). Years worked abroad do not appear on a US earnings record.')),
      c('close', 'Close the page. Retirement is a problem for an older person.', ok('You are busy, and it will keep. The record goes on adding a line a year whether you look or not.', { flags: { yh_ssRecord: true } })),
    ],
  }), { statuses: PERMANENT, when: (s) => band(s, 10) && !has(s, 'yh_ssRecord'), oddsPerYear: 0.5 }),

  def('yh-papers-in-order', 'life', 1.5, (s) => ({
    id: 'yh-papers-in-order',
    track: 'life',
    title: 'If something happened to you',
    body: `A friend from your community dies suddenly, and nobody knows where anything is: the bank, the lease, who to call at home. ${hasChild(s) ? 'You think of your child, and of who would know what to do.' : hasSpouse(s) ? 'You look at your spouse across the room and realise how much lives only in your head.' : 'You live alone. Who here even has your family\'s phone number?'}`,
    stage: 'apartment-night',
    cast: [{ ...YOU, pose: 'think' }],
    choices: [
      c('will', `See a lawyer about a will and the basic documents, about ${p(s, 700)}.`, ok('It takes two meetings. Signing it is strange, and afterwards you feel lighter.', { money: -cost(s, 700), wellbeing: 4, family: 3, flags: { yh_papers: true } }, 'Wills and the rules for who inherits without one are set by each state. A local lawyer or legal aid office can say what applies where you live.')),
      c('folder', 'Make one folder of accounts and contacts, and tell one person where it is.', ok('An evening at the kitchen table. You hand a trusted friend a sealed envelope and feel a little foolish and very adult.', { wellbeing: 3, community: 2, family: 2, flags: { yh_papers: true } })),
      c('later', 'Not this year. It feels like inviting bad luck.', ok('You put the thought away. It comes back at every funeral.', { wellbeing: -2, flags: { yh_papersSkipY: s.year } })),
    ],
  }), { when: (s) => settled(s) && band(s, 11) && !has(s, 'yh_papers') && gap(s, 'yh_papersSkipY', 4), oddsPerYear: 0.5 }),

  def('yh-where-to-grow-old', 'life', 1.5, (s) => ({
    id: 'yh-where-to-grow-old',
    track: 'life',
    title: 'Where the money should grow',
    body: `You have some savings now, and two ideas for them. One is a plot of land at home, where it would buy a great deal. The other is to keep it here, where your life is. ${noStatus(s) || waiting(s) ? 'You do not know which country you will be allowed to grow old in.' : 'You are no longer sure which country you will grow old in.'}`,
    stage: 'rooftop',
    cast: [{ ...YOU, pose: 'think' }],
    choices: [
      c('land', `Buy the plot at home through a relative you trust, about ${p(s, 8000)}.`, ok('Photos arrive of a fence and a young tree. You own ground in the place that made you, whatever happens here.', { money: -cost(s, 8000), family: 6, wellbeing: 3, flags: { yh_landHome: true, yh_growOld: true } })),
      c('here', 'Keep it here, in savings you can reach.', ok('It is less romantic than land. It is also there on the day a car, a tooth or a lawyer needs paying.', { wellbeing: 2, legal: 1, flags: { yh_growOld: true } })),
      c('both', `Do a little of each: a deposit on the plot, about ${p(s, 3000)}, and the rest stays.`, ok('The relative grumbles about instalments. You have a foot on each shore, which is how you have lived for years anyway.', { money: -cost(s, 3000), family: 3, wellbeing: 2, flags: { yh_landHome: true, yh_growOld: true } })),
    ],
  }), { when: (s) => settled(s) && band(s, 12) && cash(s) >= cost(s, 12000) && !has(s, 'yh_growOld'), oddsPerYear: 0.5 }),

  def('yh-old-furniture', 'life', 1.3, (s) => ({
    id: 'yh-old-furniture',
    track: 'life',
    title: 'The things you carried',
    body: `In a closet you find the suitcase you arrived with, ${yearsHere(s)} years ago. Around it your home has filled up: a table with a wobble, chairs from three different decades, a shelf a friend built. Some of it is worn out.`,
    stage: 'apartment',
    cast: [{ ...YOU, pose: 'carry' }],
    choices: [
      c('replace', `Replace the worn pieces with things you actually chose, about ${p(s, 2000)}.`, ok('For the first time, the room looks like a decision and not an accident.', { money: -cost(s, 2000), wellbeing: 6, flags: { yh_furnish: true } })),
      c('repair', 'Fix the wobble, sand the shelf, keep it all.', ok('A Saturday with glue and sandpaper. Every piece has a story, and you would rather keep the stories.', { money: -cost(s, 80), wellbeing: 4, flags: { yh_furnish: true } })),
      c('give', 'Give the good spare pieces to a family that has just arrived.', ok('They carry your old table up their stairs the way you once carried it up yours. The wobble goes with it.', { community: 6, wellbeing: 3, flags: { yh_furnish: true } })),
    ],
  }), { when: (s) => settled(s) && band(s, 11) && !has(s, 'yh_furnish'), oddsPerYear: 0.5 }),
];
