/**
 * Later-year cards: family across an ocean and the people around you here, over two decades.
 * Ids start with `yf-`; flags this file sets start with `yf_`.
 *
 * Flags set here: yf_parentIll, yf_lostParent, yf_lostYear, yf_siblingWed, yf_metNiece, yf_cousinAsked,
 * yf_visitedHome, yf_parentVisited, yf_faithGroup, yf_assocBoard, yf_mentor, yf_twentyYears,
 * yf_child, yf_childYear, yf_schoolStarted, yf_homeLanguage, yf_childGraduated.
 * Legal sources are listed in research/years-family-notes.md.
 */
import { bad, c, def, ok } from '../cx';
import type { ChallengeDef, Choice, GameState, Role } from '../types';
import {
  YOU, age, band, cost, has, hasChild, hasPartner, hasSpouse, is, noStatus, num, secure, settled, yearsHere,
} from './yx';

/** The person you share a life with, as a cast role and as words. */
const pRole = (s: GameState): Role => (hasSpouse(s) ? 'spouse' : 'partner');
const pWord = (s: GameState): string => (hasSpouse(s) ? 'your spouse' : 'your partner');
const PWord = (s: GameState): string => (hasSpouse(s) ? 'Your spouse' : 'Your partner');
/** Age of the child born here, in whole years (0 in the year of birth). */
const childAge = (s: GameState): number => yearsHere(s) - num(s, 'yf_childYear', yearsHere(s));
/** A short trip home and back is an ordinary thing only for these two. */
const canTravelFreely = (s: GameState): boolean => secure(s);

const LB_NONE_LEAVE =
  'Without status, leaving is the trap. After more than 180 days of unlawful presence, departure brings a 3-year bar on returning, and after a year or more a 10-year bar (INA 212(a)(9)(B)). The bars start only when a person leaves. This is general information; a lawyer can look at your own history.';
const LB_ASY_LEAVE =
  'An asylum applicant who leaves the United States without advance parole is presumed to have abandoned the application, and one who returns to the country of claimed persecution, even with advance parole, is presumed to have abandoned it unless there are compelling reasons (8 CFR 208.8). Ask your lawyer before any travel.';
const LB_AOS_LEAVE =
  'Leaving while a green card application is pending, without advance parole granted first, is treated as abandoning the application (8 CFR 245.2(a)(4)(ii)(A)). Since August 13, 2026, travel on advance parole also counts as a departure for the unlawful presence bars. Ask your lawyer before any travel.';
const LB_ASYLEE_LEAVE =
  'A person granted asylum may travel abroad only with prior consent (INA 208(c)(1)(C)). Going back to the country you fled is a serious question for a lawyer before you book anything; this game has not verified what it would mean for your case.';
const LB_TEMP_LEAVE =
  'Travel on a temporary work or training status can depend on a visa appointment abroad and on your employer and paperwork being in order when you come back. This game has not verified the rules for your exact case. Ask an immigration lawyer before you book.';
const LB_LPR_TRIP =
  'A short trip is ordinary for a permanent resident. An absence of more than 180 days means being treated as seeking admission again (INA 101(a)(13)(C)(ii)), and the card works as an entry document only after an absence of less than one year (8 CFR 211.1(a)(2)).';

/** Why this person cannot simply fly home and come back, for a lookback. Empty for LPR and citizens. */
const leaveLookback = (s: GameState): string =>
  noStatus(s) ? LB_NONE_LEAVE
    : is(s, 'ASY_PENDING') ? LB_ASY_LEAVE
      : is(s, 'AOS_PENDING') ? LB_AOS_LEAVE
        : is(s, 'ASYLEE') ? LB_ASYLEE_LEAVE
          : secure(s) ? '' : LB_TEMP_LEAVE;

const RAW: ChallengeDef[] = [
  // ───────────────────────── Family at home ─────────────────────────

  def('yf-parents-older', 'life', 1.4, (s) => {
    const y = yearsHere(s);
    const late = y >= 11;
    return {
      id: 'yf-parents-older',
      track: 'life',
      title: late ? 'The slower voice on the phone' : 'A detail on the video call',
      body: has(s, 'yf_lostParent')
        ? `The parent you still have answers the call from the same chair every week. The house behind them looks bigger than it used to. They say they are fine, and ask if you are eating.`
        : late
          ? `Your mother repeats a story she told you last week. Your father lets her do the talking now. After ${y} years of calls, you can hear the years in their voices.`
          : `On the screen, your father holds the phone further from his face to read it. Your mother mentions, lightly, that the stairs are harder this year. Nobody says the word old.`,
      stage: 'apartment-night',
      cast: [{ ...YOU, pose: 'phone' }, { role: 'parent', pose: 'talk' }],
      choices: [
        c('weekly', 'Set a fixed call, the same hour every week, and keep it.', ok(`The call becomes a small ritual on both sides of the ocean. They dress for it. You learn the names of their neighbours again.`, { family: 6, wellbeing: 2 })),
        c('help', `Pay for someone to help in the house a few days a week (about $${cost(s, 150)}).`, ok(`A neighbour's daughter comes three mornings a week. Your mother complains about how she folds the sheets, which means she likes her.`, { family: 5, money: -cost(s, 150), wellbeing: 1 })),
        c('ask', 'Ask them straight: what do you need, and what are you not telling me?', ok(`A long pause, then the real list: a doctor they have been putting off, a roof that leaks. It is easier to carry once you know it.`, { family: 4, wellbeing: -2 })),
        c('later', 'Keep it light. There is nothing you can do from here anyway.', bad(`The call ends with jokes. Afterwards the apartment is very quiet.`, { family: -3, wellbeing: -2 }, 'Distance makes it easy to look away.', 'Nothing here is a rule. It is only that the small calls are most of what a family across an ocean has.')),
      ],
    };
  }, { when: (s) => settled(s) && band(s, 3), oddsPerYear: 0.5 }),

  def('yf-parent-ill', 'life', 2, (s) => {
    const free = canTravelFreely(s);
    const temp = is(s, 'H1B', 'O1');
    const choices: Choice[] = [];
    if (free) {
      choices.push(c('go', `Fly home for two weeks (about $${cost(s, 1600)}).`, ok(`You sit by the bed and learn the nurses' names. Your parent sleeps better with you in the room. You fly back tired and sure it was right.`, { family: 12, wellbeing: 3, money: -cost(s, 1600), flags: { yf_parentIll: true, yf_visitedHome: true } }, is(s, 'LPR') ? LB_LPR_TRIP : undefined)));
    } else if (temp) {
      choices.push(c('go-careful', `Talk to an immigration lawyer first, then go for one week (about $${cost(s, 1900)}).`, ok(`The lawyer checks your papers and tells you what to carry. You get six days at the hospital and an anxious line at the airport coming back. You are let through.`, { family: 10, wellbeing: -1, money: -cost(s, 1900), flags: { yf_parentIll: true, yf_visitedHome: true } }, LB_TEMP_LEAVE)));
    }
    choices.push(
      c('video', 'Stay, and be there by phone every single day.', ok(`A cousin props the phone on the bedside table. You talk about nothing for an hour a day. Some days your parent only listens, and that is enough.`, { family: 5, wellbeing: -4, flags: { yf_parentIll: true } }, free ? undefined : leaveLookback(s))),
      c('send', `Send money for the hospital and a private room (about $${cost(s, 900)}).`, ok(`The transfer goes through in minutes. Your sibling sends a photo of the new room, with a window. It is the part of this you can reach.`, { family: 6, money: -cost(s, 900), wellbeing: -2, flags: { yf_parentIll: true } }, free ? undefined : leaveLookback(s))),
    );
    if (!free && !temp) {
      choices.push(c('lawyer', `Pay for an hour with an immigration lawyer to ask if any travel is possible (about $${cost(s, 200)}).`, ok(`The lawyer is kind and plain. For you, right now, leaving could cost everything you have built here. You walk out knowing the answer instead of guessing it.`, { legal: 4, wellbeing: -3, money: -cost(s, 200), flags: { yf_parentIll: true } }, leaveLookback(s))));
    }
    return {
      id: 'yf-parent-ill',
      track: 'life',
      title: 'The call at four in the morning',
      body: `Your sibling's voice is too calm. ${has(s, 'yf_lostParent') ? 'The parent you still have' : 'One of your parents'} is in the hospital, stable for now. Everyone at home is asking the same question: can you come? ${free ? 'You can. The question is work, money and how long.' : noStatus(s) ? 'You know what leaving would mean for someone with no papers.' : 'With your papers the way they are, a flight home is not a simple thing.'}`,
      stage: 'apartment-night',
      cast: [{ ...YOU, pose: 'phone' }, { role: 'parent', pose: 'sit' }],
      choices,
    };
  }, { statuses: ['OPT', 'STEM_OPT', 'H1B', 'O1', 'LPR', 'CITIZEN', 'ASY_PENDING', 'ASYLEE', 'NONE'], when: (s) => band(s, 2), oddsPerYear: 0.3 }),

  def('yf-funeral-phone', 'life', 2.5, (s) => {
    const free = canTravelFreely(s);
    const lost = { yf_lostParent: true, yf_lostYear: yearsHere(s) };
    const choices: Choice[] = [];
    if (free) {
      choices.push(c('fly', `Take the first flight you can find (about $${cost(s, 2200)}).`, ok(`You land the morning of the funeral in yesterday's clothes. You carry what a child is supposed to carry. Nobody asks why you live so far away. Not today.`, { family: 10, wellbeing: -4, money: -cost(s, 2200), flags: { ...lost, yf_visitedHome: true } }, is(s, 'LPR') ? LB_LPR_TRIP : undefined)));
    }
    choices.push(
      c('phone', free ? 'You cannot get there in time. Watch on a phone a cousin holds up.' : 'Watch the funeral on a phone a cousin holds up.', ok(`The picture freezes and comes back. You see the backs of heads you know, and hear the songs through a small speaker. You stand in your kitchen the whole time, because sitting felt wrong.`, { family: 3, wellbeing: -8, flags: lost }, free ? undefined : leaveLookback(s))),
      c('gather', 'Ask friends here to sit with you while it happens.', ok(`Six people come. Someone brings food, someone brings chairs. They watch the small screen with you and do not fill the silence. You will remember who came.`, { family: 3, wellbeing: -4, community: 6, flags: lost }, free ? undefined : leaveLookback(s))),
      c('pay', `Pay for the funeral from here and stay off the call (about $${cost(s, 1200)}).`, bad(`The money arrives before the burial. Your sibling thanks you in a short message. You work a full shift that day and remember none of it.`, { family: 2, wellbeing: -10, money: -cost(s, 1200), flags: lost }, 'Grief waits for you.', 'There is no rule here. People who could not attend often say the watching, however poor the picture, was the part that let it be real.')),
    );
    return {
      id: 'yf-funeral-phone',
      track: 'life',
      title: 'The news from home',
      body: `Your sibling calls, and you know before they speak. Your ${has(s, 'yf_parentIll') ? 'parent, who had been ill,' : 'parent'} died in the night. The funeral is in two days. ${free ? 'There is a flight tomorrow, if you can pay for it.' : 'You already know you cannot be there, and why.'}`,
      stage: 'apartment-night',
      cast: [{ ...YOU, pose: 'phone' }],
      choices,
    };
  }, { when: (s) => settled(s) && band(s, 6) && !has(s, 'yf_lostParent'), oddsPerYear: 0.22 }),

  def('yf-loss-anniversary', 'life', 1.2, (s) => {
    const since = Math.max(1, yearsHere(s) - num(s, 'yf_lostYear', yearsHere(s) - 1));
    return {
      id: 'yf-loss-anniversary',
      track: 'life',
      title: 'The date comes round again',
      body: `It is ${since === 1 ? 'one year' : `${since} years`} since your parent died. ${since === 1 ? 'The first year of dates has ended: the first birthday without them, the first holiday.' : 'The sharp part has worn smooth, and some days that feels like a second loss.'} Nobody at work knows what today is.`,
      stage: 'kitchen',
      cast: [{ ...YOU, pose: 'think' }],
      choices: [
        c('cook', 'Cook the dish they made best, from memory, and get it slightly wrong.', ok(`Too much salt, and the smell is exactly right. You eat it standing at the stove, the way they did.`, { wellbeing: 4, family: 3 })),
        c('call', 'Call your sibling and trade stories for an hour.', ok(`You each remember a different person, and both of them were real. You laugh more than you expected.`, { family: 6, wellbeing: 3 })),
        c('give', `Give to something they cared about, in their name (about $${cost(s, 100)}).`, ok(`A school fund at home gets a small gift with their name on it. Your aunt sends a photo of the receipt taped to her wall.`, { family: 4, community: 2, money: -cost(s, 100) })),
        c('work', 'Treat it as an ordinary day.', ok(`It is almost an ordinary day. On the way home you notice you have been humming their song.`, { wellbeing: -2 })),
      ],
    };
  }, { when: (s) => settled(s) && has(s, 'yf_lostParent') && yearsHere(s) > num(s, 'yf_lostYear', 99), oddsPerYear: 0.4 }),

  def('yf-sibling-wedding', 'life', 1.6, (s) => {
    const free = canTravelFreely(s);
    const choices: Choice[] = [];
    if (free) {
      choices.push(c('go', `Go, and stay ten days (about $${cost(s, 2400)} with gifts).`, ok(`You dance badly and are forgiven. An aunt introduces you to three people as "the one who lives abroad". In the photos you are in the second row, where family stands.`, { family: 12, wellbeing: 6, money: -cost(s, 2400), flags: { yf_siblingWed: true, yf_visitedHome: true } }, is(s, 'LPR') ? LB_LPR_TRIP : undefined)));
    }
    choices.push(
      c('screen', 'Join by video and give a toast from your living room.', ok(`You dress up from the waist up at five in the morning. Your toast is carried round the hall on a phone. Your sibling cries at the right part.`, { family: 6, wellbeing: -2, flags: { yf_siblingWed: true } }, free ? undefined : leaveLookback(s))),
      c('gift', `Send a serious gift toward their new home (about $${cost(s, 700)}).`, ok(`The gift is announced at the wedding, by name. It stands in the room in your place.`, { family: 6, money: -cost(s, 700), flags: { yf_siblingWed: true } }, free ? undefined : leaveLookback(s))),
      c('card', 'Send a message and promise to celebrate properly another year.', bad(`Your sibling says of course, they understand. The wedding photos arrive in a group chat, a hundred at once.`, { family: -3, wellbeing: -3, flags: { yf_siblingWed: true } }, 'Some days do not come twice.', 'There is no rule in this one. It is the cost of distance, counted in the days you were not in the picture.')),
    );
    return {
      id: 'yf-sibling-wedding',
      track: 'life',
      title: 'A wedding at home',
      body: `Your sibling is getting married in the spring. The message comes with a date, a colour for the family to wear, and one line: "You will be here, yes?" ${free ? 'You could go. It would take most of your leave and a good piece of your savings.' : 'You read that line many times. With your papers as they are, you do not see how.'}`,
      stage: 'apartment',
      cast: [{ ...YOU, pose: 'phone' }],
      choices,
    };
  }, { when: (s) => settled(s) && band(s, 2, 14) && !has(s, 'yf_siblingWed'), oddsPerYear: 0.3 }),

  def('yf-niece-on-screen', 'life', 1.3, (s) => {
    const y = yearsHere(s);
    return {
      id: 'yf-niece-on-screen',
      track: 'life',
      title: 'The child who knows your face',
      body: y >= 12
        ? `Your sibling's eldest is nearly grown now. You have watched a whole childhood through a screen: first steps, missing teeth, a school prize. In person you have ${has(s, 'yf_visitedHome') ? 'held them a handful of times' : 'never once held them'}.`
        : `Your sibling has a small child now. On video calls the child waves at the phone and says your name. To them you are a face that lives in a screen${has(s, 'yf_visitedHome') ? ', and once, a visitor with presents' : ''}.`,
      stage: 'apartment',
      cast: [{ ...YOU, pose: 'phone' }],
      choices: [
        c('stories', 'Read them a story on a call every Sunday.', ok(y >= 12 ? `They are too old for stories, so you ask about school and music. They start messaging you on their own, without their parent in the room.` : `You do all the voices. After a month they bring the book to the phone before you ask.`, { family: 6, wellbeing: 3, flags: { yf_metNiece: true } })),
        c('parcel', `Send a parcel for their birthday (about $${cost(s, 120)} with shipping).`, ok(`The parcel takes five weeks and arrives a little crushed. The photo you get back shows the wrapping paper being kept.`, { family: 4, money: -cost(s, 120), flags: { yf_metNiece: true } })),
        c('fund', `Start putting a little aside for their schooling (about $${cost(s, 300)} this year).`, ok(`Your sibling does not say much, which is how you know it matters. It is a way of being an aunt or uncle that travels.`, { family: 7, money: -cost(s, 300), flags: { yf_metNiece: true } })),
        c('wave', 'Wave when they are put on the phone. That is what there is.', ok(`They wave back and run off. You tell yourself there will be time later.`, { family: -1 })),
      ],
    };
  }, { when: (s) => settled(s) && band(s, 4), oddsPerYear: 0.4 }),

  def('yf-money-ask', 'life', 1.5, (s) => {
    const y = yearsHere(s);
    const who = y >= 12 ? 'A cousin you have not spoken to in years' : y >= 6 ? 'An uncle' : 'A cousin';
    return {
      id: 'yf-money-ask',
      track: 'life',
      title: 'A message that starts politely',
      body: `${who} writes with warm greetings, news of the family, and then the request: ${y >= 12 ? 'a business idea that only needs a start' : y >= 6 ? 'school fees for two children, due this month' : 'a hospital bill, and nobody else to ask'}. At home, everyone believes you earn in dollars and spend in nothing.`,
      stage: 'apartment',
      cast: [{ ...YOU, pose: 'phone' }],
      choices: [
        c('send', `Send what they ask (about $${cost(s, 500)}).`, ok(`The thanks are long and sincere. So, a month later, is the next request from someone else. Word travels.`, { family: 6, money: -cost(s, 500), wellbeing: -1 })),
        c('part', `Send part of it and say plainly what your rent is (about $${cost(s, 150)}).`, ok(`There is a pause in the chat, then a thumbs up. It is the first time anyone at home has heard a real number about your life.`, { family: 3, money: -cost(s, 150), wellbeing: 2 })),
        c('rule', 'Tell the family you will help through one person only, once a year.', ok(`Your sibling agrees to be the one who decides what is urgent. Some relatives grumble. The messages slow down.`, { family: 1, wellbeing: 4 })),
        c('silent', 'Leave the message unanswered.', bad(`The two grey ticks sit there. At the next family gathering, your name comes up in a tone your mother does not like.`, { family: -5, wellbeing: -2 }, 'Silence gets read as an answer.', 'No rule here. A clear no usually costs less at home than no reply at all.')),
      ],
    };
  }, { when: (s) => settled(s) && band(s, 1), oddsPerYear: 0.45 }),

  def('yf-how-to-come', 'life', 1.4, (s) => {
    const citizen = is(s, 'CITIZEN');
    const none = noStatus(s) || is(s, 'ASY_PENDING');
    return {
      id: 'yf-how-to-come',
      track: 'life',
      title: '"How do I come too?"',
      body: `A young cousin calls, bright and serious. They have finished school, there is no work at home, and you are the family's proof that leaving is possible. They want to know exactly how you did it, and whether you can bring them. ${none ? 'They do not know how your own days really are.' : citizen ? 'You are a citizen now, and they think that means you can sign for anyone.' : 'They think your papers are a door you can hold open.'}`,
      stage: 'apartment',
      cast: [{ ...YOU, pose: 'phone' }],
      choices: [
        c('truth', none ? 'Tell them the truth about your life here, the parts you leave out of calls.' : 'Tell them honestly what you can and cannot do for them.', ok(none ? `You tell them about the work, the fear, the years without a visit home. They go quiet. "Nobody says this," they tell you. Now somebody has.` : `You explain that a cousin is not someone the law lets you sponsor, and that their own road would be study or work. They are disappointed, and then they ask better questions.`, { family: 3, wellbeing: 2, flags: { yf_cousinAsked: true } }, citizen ? 'A US citizen may petition for a spouse, children, parents (once the citizen is 21) and brothers and sisters (INA 201(b)(2)(A)(i), INA 203(a)). Cousins, nieces and nephews are not on the list. The sibling line is very long.' : 'Family petitions are limited to close relatives of citizens and permanent residents (INA 201(b), INA 203(a)). A cousin is not among them.')),
        c('guide', 'Offer to help them research real routes: schools, scholarships, official sites.', ok(`You spend three evenings on calls, reading official pages together. They apply to two schools. Whatever happens, they did it with real information.`, { family: 5, community: 2, wellbeing: -1, flags: { yf_cousinAsked: true } })),
        c('vague', 'Say "we will see" and change the subject.', bad(`They hear a promise. For months the family asks how the plan for your cousin is going.`, { family: -4, wellbeing: -3, flags: { yf_cousinAsked: true } }, 'A soft maybe travels far.', 'People at home often plan around a relative abroad. A clear answer early saves them money and years.')),
        c('agent', 'Tell them to find a visa agent at home who knows the tricks.', bad(`They find one within a week. He wants a large deposit in cash, and your cousin's parents sell something to pay it.`, { family: -6, wellbeing: -4, flags: { yf_cousinAsked: true } }, 'You sent them to a stranger.', 'People who promise visas for cash are a common way families lose savings. Real information is on official government sites and from licensed lawyers or accredited representatives.')),
      ],
    };
  }, { when: (s) => settled(s) && band(s, 3) && (!has(s, 'yf_cousinAsked') || yearsHere(s) % 5 === 0), oddsPerYear: 0.35 }),

  def('yf-first-language', 'life', 1.3, (s) => {
    const y = yearsHere(s);
    return {
      id: 'yf-first-language',
      track: 'life',
      title: 'A word you cannot find',
      body: y >= 14
        ? `On a call home you reach for an ordinary word and it is not there. You say it in English and your aunt laughs, kindly. "You sound like a visitor," she says. You dream in two languages now and are fully at ease in neither.`
        : `Mid-sentence with your mother, a word in your own language goes missing. The English one arrives first. She waits. It comes back a second later, but you both noticed.`,
      stage: 'walk',
      cast: [{ ...YOU, pose: 'think' }],
      choices: [
        c('read', 'Start reading in your first language again, a few pages a night.', ok(`The first book is slow. By the third, the old rhythm is back in your mouth, and your jokes land again on calls home.`, { family: 4, wellbeing: 3 })),
        c('speak', 'Find people here who speak it and meet them once a month.', ok(`A back room, strong tea or coffee, and an argument about the right word for something. You go home hoarse and happy.`, { community: 5, wellbeing: 4 })),
        hasChild(s)
          ? c('teach', 'Speak it with your child, on purpose, every day.', ok(`It is harder than it sounds, and they answer in English half the time. But they understand their grandparents now, and so, again, do you.`, { family: 6, wellbeing: 2, flags: { yf_homeLanguage: true } }))
          : c('write', 'Write long messages home instead of sending voice notes.', ok(`Writing makes you hunt for the exact word. Your mother saves the messages and reads them to her friends.`, { family: 5 })),
        c('accept', 'Let it go. This is what living here does.', ok(`It is true, and it is also a small grief. You notice the next missing word a little less.`, { family: -2, wellbeing: -1 })),
      ],
    };
  }, { when: (s) => settled(s) && band(s, 6), oddsPerYear: 0.35 }),

  def('yf-parent-visits', 'life', 1.4, (s) => ({
    id: 'yf-parent-visits',
    track: 'life',
    title: 'A parent in your kitchen',
    body: `After two tries, your ${has(s, 'yf_lostParent') ? 'surviving parent' : 'mother'} has a visitor visa and a ticket. Three weeks in your home. You look at your life as they will see it: the small rooms, the long hours, the food you have learned to like. ${noStatus(s) ? 'They do not know everything about your papers.' : ''}`,
    stage: 'kitchen',
    cast: [{ ...YOU, pose: 'cook' }, { role: 'parent', pose: 'sit' }],
    choices: [
      c('show', `Take time off and show them everything (about $${cost(s, 600)}).`, ok(`Parks, a museum, a huge grocery store that amazes them most of all. On the last night they say, "Now I can picture you." It was what they came for.`, { family: 10, wellbeing: 5, money: -cost(s, 600), flags: { yf_parentVisited: true } })),
      c('ordinary', 'Keep working and let them live your ordinary days with you.', ok(`They reorganise your kitchen and make friends with a neighbour you have never spoken to. You come home each night to a lit window.`, { family: 8, wellbeing: 4, community: 2, flags: { yf_parentVisited: true } })),
      c('honest', 'Use the visit to tell them the hard things you never say on calls.', ok(`You tell them about the lonely years${noStatus(s) ? ' and the truth about your papers' : ''}. They listen with their hands folded. "You should have told us," they say, and then, "We would only have worried."`, { family: 7, wellbeing: 3, flags: { yf_parentVisited: true } })),
      c('perform', `Borrow and spend to make your life look bigger than it is (about $${cost(s, 1400)}).`, bad(`Restaurants, gifts for everyone at home, a rented car. They are impressed and a little uneasy. On the way to the airport they ask if you are really all right.`, { family: 3, wellbeing: -4, money: -cost(s, 1400), flags: { yf_parentVisited: true } }, 'Parents see through more than we think.', 'No rule here. The show costs money, and it keeps home believing in a life you do not have.')),
    ],
  }), { when: (s) => settled(s) && band(s, 5) && !has(s, 'yf_parentVisited'), oddsPerYear: 0.25 }),

  def('yf-trip-home', 'life', 1.5, (s) => {
    const y = yearsHere(s);
    return {
      id: 'yf-trip-home',
      track: 'life',
      title: has(s, 'yf_visitedHome') ? 'Home, again' : 'Home, after all these years',
      body: `You could finally take a real trip home. ${has(s, 'yf_visitedHome') ? 'Each visit, the place has moved a little further from the one you carry.' : `It has been ${y} years.`} The street you grew up on has new buildings, the children are adults, and your own room has someone else's things in it.`,
      stage: 'airport',
      cast: [{ ...YOU, pose: 'carry' }, { role: 'parent', pose: 'wave' }],
      choices: [
        c('long', `Go for a month and see everyone (about $${cost(s, 3200)}).`, ok(`Thirty houses, thirty meals, the same ten questions. By week three you are thinking in your first language again. By week four you miss your own bed, and that surprises you.`, { family: 12, wellbeing: 6, money: -cost(s, 3200), flags: { yf_visitedHome: true } }, is(s, 'LPR') ? LB_LPR_TRIP : undefined)),
        c('short', `Go for ten days, just the closest family (about $${cost(s, 2000)}).`, ok(`Ten days is enough to be held and not enough to be bored. Some relatives are offended that you did not call on them. Your mother defends you.`, { family: 8, wellbeing: 5, money: -cost(s, 2000), flags: { yf_visitedHome: true } }, is(s, 'LPR') ? LB_LPR_TRIP : undefined)),
        c('wait', 'Put it off another year. The money has other places to go.', ok(`The money stays in the bank. The photos from home keep coming, and the people in them keep getting older.`, { family: -3, wellbeing: -2 })),
      ],
    };
  }, { statuses: ['LPR', 'CITIZEN'], when: (s) => band(s, 5), oddsPerYear: 0.3 }),

  // ───────────────────────── Friends and community ─────────────────────────

  def('yf-friend-leaves', 'life', 1.4, (s) => {
    const y = yearsHere(s);
    return {
      id: 'yf-friend-leaves',
      track: 'life',
      title: 'A friend is leaving',
      body: y >= 10
        ? `A friend of many years tells you over dinner that they are going home for good. Their parents are old, and they are tired of being from somewhere else. You have been each other's family here since the early days.`
        : `The friend who showed you how everything works here is leaving the country. A job fell through, or the papers did, and they have decided not to fight it. Their room is already half in boxes.`,
      stage: 'cafe',
      cast: [{ ...YOU, pose: 'sit' }, { role: 'friend', pose: 'talk' }],
      choices: [
        c('sendoff', `Organise a proper send-off (about $${cost(s, 120)}).`, ok(`Everyone they ever helped turns up. There are speeches nobody planned. Your friend leaves knowing what they were to people here.`, { community: 6, wellbeing: 3, money: -cost(s, 120) })),
        c('help', 'Give them a weekend: packing, selling furniture, the drive to the airport.', ok(`You carry a mattress down four flights and argue about which pots to keep. At the airport you both pretend it is an ordinary goodbye.`, { community: 3, wellbeing: 2 })),
        c('ask', 'Ask them honestly whether they think you should go too.', ok(`They think about it properly. "You are not me," they say. "Do not leave because I am leaving, and do not stay because you are afraid." You turn it over for weeks.`, { wellbeing: 2, family: 2 })),
        c('avoid', 'Keep busy until they are gone. Goodbyes are too much.', bad(`You send a message the night of their flight. They answer from the gate with a heart. The city has one less door you can knock on.`, { community: -4, wellbeing: -4 }, 'The goodbye you skip stays with you.', 'No rule here. Friendships made in the first years abroad are hard to replace later.')),
      ],
    };
  }, { when: (s) => settled(s) && band(s, 3), oddsPerYear: 0.35 }),

  def('yf-friend-trouble', 'life', 1.5, (s) => ({
    id: 'yf-friend-trouble',
    track: 'life',
    title: 'A friend at your door',
    body: `A friend turns up with two bags. ${yearsHere(s) >= 9 ? 'A marriage has ended' : 'They lost their job and then their room'}, and they are too proud to say how bad it is. They ask if they can stay "a few days". ${hasPartner(s) ? `${PWord(s)} looks at you across the room.` : 'Your place is small.'}`,
    stage: 'apartment',
    cast: [{ ...YOU, pose: 'talk' }, { role: 'friend', pose: 'carry' }],
    choices: [
      c('stay', 'Give them the couch, with an honest end date.', ok(`Three weeks, agreed out loud. They cook, they job-hunt, they leave on the day they said. The friendship is stronger for having had edges.`, { community: 6, wellbeing: -1 })),
      c('open', 'Give them the couch for as long as they need.', ok(`A few days becomes three months. They get back on their feet in the end. ${hasPartner(s) ? 'Things at home were strained for most of it.' : 'You did not have a quiet evening for a season.'}`, { community: 7, wellbeing: -5, family: hasPartner(s) ? -2 : 0 })),
      c('money', `You cannot host. Pay for a week in a cheap room instead (about $${cost(s, 350)}).`, ok(`They take it with dignity. A week is enough for them to find a sublet. They pay you back in instalments you did not ask for.`, { community: 4, money: -cost(s, 350) })),
      c('no', 'Say you are sorry, you cannot do it right now.', bad(`They nod and say of course. You hear later that they slept in their car for a while.`, { community: -5, wellbeing: -4 }, 'You remember who once took you in.', 'No rule here. Among newcomers, a couch offered is often the only safety net there is, and people remember both the yes and the no.')),
    ],
  }), { when: (s) => settled(s) && band(s, 2), oddsPerYear: 0.3 }),

  def('yf-newcomer-calls', 'life', 1.5, (s) => {
    const y = yearsHere(s);
    return {
      id: 'yf-newcomer-calls',
      track: 'life',
      title: 'Now you are the one they call',
      body: `A stranger phones: someone from home gave them your number. They landed ${y >= 12 ? 'last week' : 'a month ago'} and have a list of questions, the same ones you once had. Where to live, how the buses work, which forms matter. ${y >= 12 ? 'This is the fourth such call this year.' : 'You realise that somewhere along the way you became the person who knows.'}`,
      stage: 'cafe',
      cast: [{ ...YOU, pose: 'talk' }, { role: 'stranger', pose: 'sit' }],
      choices: [
        c('meet', 'Meet them and walk them through their first month.', ok(`You show them the cheap grocery, the library, the bus pass. You hear yourself giving the advice you needed in your own first year.`, { community: 7, wellbeing: 3 })),
        c('limits', 'Help with daily life, and send them to a real lawyer for anything about papers.', ok(`You are firm about it: you know buses and landlords, not immigration law. They find a nonprofit legal clinic. Your advice stays inside what you actually know.`, { community: 5, legal: 2, wellbeing: 2 }, 'Friendly guesses from people who "went through it" are a common source of costly mistakes. For anything about papers, the safe pointer is a licensed attorney or an accredited representative at a recognized nonprofit.')),
        c('papers', 'Tell them exactly what to file. You went through it, after all.', bad(`They do just what you did. Their situation was not the same as yours, and the rules have changed since. It takes them a year to untangle.`, { community: -3, wellbeing: -3 }, 'Your road was yours.', 'Immigration rules change often and turn on small facts. What worked for one person years ago can harm another. Send people to a lawyer or an accredited representative.')),
        c('busy', 'Say you are busy and give them a website.', ok(`They thank you politely. You think, later, of the person who once spent a whole Saturday on you.`, { community: -2 })),
      ],
    };
  }, { when: (s) => settled(s) && band(s, 5), oddsPerYear: 0.4 }),

  def('yf-mentor', 'life', 1.3, (s) => ({
    id: 'yf-mentor',
    track: 'life',
    title: has(s, 'yf_mentor') ? 'The young person you mentor' : 'Asked to be a mentor',
    body: has(s, 'yf_mentor')
      ? `The young person you have been mentoring has a decision to make: a safe path their family wants, or a harder one they want. They ask what you would do. They will probably do what you say.`
      : `A community program pairs adults with teenagers from immigrant families. The coordinator says the young people need to see someone who came with nothing familiar and built a life. She means you.`,
    stage: 'library',
    cast: [{ ...YOU, pose: 'sit' }, { role: 'student', pose: 'talk' }],
    choices: has(s, 'yf_mentor')
      ? [
          c('questions', 'Do not answer. Ask questions until they hear their own answer.', ok(`It takes two hours and a lot of silence. They leave having decided, and it was their decision. That is the part they will keep.`, { community: 5, wellbeing: 4 })),
          c('story', 'Tell them about your own hardest choice and what it cost.', ok(`You have never told the whole story to anyone here. They listen without looking at their phone once.`, { community: 4, wellbeing: 3, family: 1 })),
          c('safe', 'Tell them to take the safe path. Dreams can wait.', ok(`They nod. Maybe it was right. You notice you gave them the advice your own parents gave you, the advice you did not take.`, { community: 1, wellbeing: -2 })),
        ]
      : [
          c('yes', 'Say yes: two hours every other week.', ok(`Your teenager is shy, sharp and embarrassed by their parents' accents. You recognise all of it. By the third meeting they are asking real questions.`, { community: 6, wellbeing: 4, flags: { yf_mentor: true } })),
          c('once', 'Offer to speak to the whole group once instead.', ok(`You tell twenty teenagers about your first year here. One of them comes up afterwards and asks how you stopped being afraid. You say you did not.`, { community: 4, wellbeing: 2 })),
          c('no', 'Say no. You do not feel like an example of anything.', ok(`The coordinator says the offer stays open. On the bus home you wonder who you would have been with someone like that at sixteen.`, { wellbeing: -1 })),
        ],
  }), { when: (s) => settled(s) && band(s, 8), oddsPerYear: 0.3 }),

  def('yf-gathering-place', 'life', 1.3, (s) => ({
    id: 'yf-gathering-place',
    track: 'life',
    title: 'A place people gather',
    body: has(s, 'yf_faithGroup')
      ? `The group you joined has become part of your week. Now they ask more of you: a turn cooking for sixty, a seat on a committee, a key to the building.`
      : `A neighbour invites you to the place where people from many countries meet each week. For some it is a house of worship, for others a hall with a kitchen and a notice board. There is food after, and people who ask your name and remember it.`,
    stage: 'festival',
    cast: [{ ...YOU, pose: 'talk' }, { role: 'friend', pose: 'laugh' }, { role: 'stranger', pose: 'talk' }],
    choices: has(s, 'yf_faithGroup')
      ? [
          c('serve', 'Take the committee seat.', ok(`Meetings run long and people disagree about small things with great feeling. It is, you realise, what belonging looks like from the inside.`, { community: 7, wellbeing: -1 })),
          c('cook', `Take the cooking turn (about $${cost(s, 90)} of ingredients).`, ok(`You cook the food of your home for sixty people who mostly have never tasted it. The pots come back empty. Three people ask for the recipe.`, { community: 6, wellbeing: 4, money: -cost(s, 90) })),
          c('back', 'Stay a regular. You come for the quiet, not the committees.', ok(`They understand. You keep your seat near the back, and your week keeps its anchor.`, { community: 2, wellbeing: 3 })),
        ]
      : [
          c('join', 'Go, and keep going.', ok(`Within a month you are on a list for rides, meals and news. When you are sick, someone you barely know leaves soup at your door.`, { community: 7, wellbeing: 4, flags: { yf_faithGroup: true } })),
          c('sometimes', 'Go for the big days only.', ok(`You show up for the celebrations and the food. People are glad to see you and do not ask where you have been.`, { community: 3, wellbeing: 2 })),
          c('own', 'It is not for you. Find your people some other way.', ok(`You thank the neighbour and mean it. Your own circle is smaller and slower to build, but it is yours.`, { wellbeing: 1 })),
        ],
  }), { when: (s) => settled(s) && band(s, 1, 12), oddsPerYear: 0.35 }),

  def('yf-association', 'life', 1.3, (s) => {
    const elder = has(s, 'yf_assocBoard') && yearsHere(s) >= 13;
    return {
      id: 'yf-association',
      track: 'life',
      title: elder ? 'The young ones want changes' : 'The association needs someone',
      body: elder
        ? `You have served the community association for years. Now the younger members, many born here, want to run things their way: meetings in English, less ceremony, more politics. Some of the founders are hurt. Both sides look to you.`
        : `The community association for people from your part of the world is run by the same five tired volunteers. It holds the yearly festival, collects for funerals and welcomes newcomers. They ask you to join the board.`,
      stage: 'conference',
      cast: [{ ...YOU, pose: 'talk' }, { role: 'owner', pose: 'talk' }, { role: 'student', pose: 'sit' }],
      choices: elder
        ? [
            c('bridge', 'Broker it: young people lead, and the founders keep the ceremonies.', ok(`It takes four meetings and a lot of tea. Nobody gets everything. The festival that year is the biggest in a decade.`, { community: 8, wellbeing: 2 })),
            c('handover', 'Step down and hand your seat to someone half your age.', ok(`You give a short speech and sit down in the audience. Watching them run it, slightly wrongly, is its own kind of pride.`, { community: 5, wellbeing: 5 })),
            c('hold', 'Side with the founders. Some things should not change.', ok(`The old ways stay. So do the old members, and only them. The hall is a little emptier each year.`, { community: -3, wellbeing: -1 })),
          ]
        : [
            c('join', 'Join the board.', ok(`You inherit a shoebox of receipts and a mailing list. It is unpaid, thankless and oddly satisfying. People start greeting you by name in the street.`, { community: 8, wellbeing: -2, flags: { yf_assocBoard: true } })),
            c('task', 'Offer one job only: the newcomers welcome table.', ok(`One Saturday a month you sit behind a folding table with maps and phone numbers. It is the job you would have wanted someone doing when you arrived.`, { community: 5, wellbeing: 2 })),
            c('dues', `Pay your dues and come to the festival (about $${cost(s, 60)}).`, ok(`Your name is on the members list. The five tired volunteers stay five.`, { community: 2, money: -cost(s, 60) })),
          ],
    };
  }, { when: (s) => settled(s) && band(s, 6) && (!has(s, 'yf_assocBoard') || yearsHere(s) >= 13), oddsPerYear: 0.3 }),

  def('yf-volunteer', 'life', 1.2, (s) => ({
    id: 'yf-volunteer',
    track: 'life',
    title: 'Saturday mornings',
    body: yearsHere(s) >= 10
      ? `The food pantry where you sometimes help is short of people who can speak to newcomers in their own language. You remember standing on the other side of a table like that.`
      : `A flyer at the library asks for volunteers: a food pantry, a youth sports league, a neighbourhood clean-up. None of it has anything to do with where you are from. That is part of the appeal.`,
    stage: 'park',
    cast: [{ ...YOU, pose: 'carry' }, { role: 'stranger', pose: 'talk' }],
    choices: [
      c('pantry', 'Give two Saturdays a month to the food pantry.', ok(`You learn to pack a box in forty seconds. You also learn how many of your neighbours, born here, are one bad month from the line.`, { community: 6, wellbeing: 3 })),
      c('coach', 'Help coach the children\'s league.', ok(`Twelve eight-year-olds ignore everything you say. Their parents learn your name. For the first time you know people here who have nothing to do with work or with home.`, { community: 6, wellbeing: 5 })),
      c('once', 'Do the one-day clean-up and see how it feels.', ok(`A morning with a rubbish bag and a stranger who turns out to live two doors down. It is a start.`, { community: 3, wellbeing: 2 })),
      c('rest', 'Keep your Saturdays. You have little enough time as it is.', ok(`You sleep late and call home. That counts for something too.`, { wellbeing: 3, family: 2 })),
    ],
  }), { when: (s) => settled(s) && band(s, 2), oddsPerYear: 0.3 }),

  def('yf-unkind-kind', 'life', 1.5, (s) => {
    const y = yearsHere(s);
    return {
      id: 'yf-unkind-kind',
      track: 'life',
      title: 'Two neighbours',
      body: y >= 10
        ? `In a shop queue, a man hears your accent and tells you to go back where you came from. You have lived on this street for ${y} years. An older neighbour behind you says, loudly, that you have been here longer than he has.`
        : `Someone has written something ugly on your mailbox. While you stand looking at it, the neighbour from across the hall comes out with a wet cloth and starts scrubbing, saying nothing at all.`,
      stage: 'street',
      cast: [{ ...YOU, pose: 'idle' }, { role: 'stranger', pose: 'talk' }, { role: 'friend', pose: 'talk' }],
      choices: [
        c('thank', 'Thank the neighbour, and ask them in for tea or coffee.', ok(`It turns out they have their own story of being the stranger once. You sit for two hours. The street feels different after.`, { community: 6, wellbeing: 4 })),
        c('speak', 'Answer the insult calmly, in front of everyone.', ok(`Your voice shakes a little and holds. A few people look at their shoes. One nods. You said it for yourself more than for him.`, { wellbeing: 3, community: 2 })),
        c('record', 'Write down what happened and tell a local community group that tracks such things.', ok(`A volunteer takes the details and tells you that you are the third person this month. Being counted is a small relief.`, { community: 4, legal: 1, wellbeing: 1 })),
        c('swallow', 'Say nothing, go home, tell no one.', bad(`You make dinner as usual. For weeks afterwards you take the longer way round to avoid that corner.`, { wellbeing: -6, community: -2 }, 'It weighs more when carried alone.', 'No rule here. People who tell even one person about an incident like this tend to carry it more lightly than those who tell no one.')),
      ],
    };
  }, { when: (s) => settled(s) && band(s, 1), oddsPerYear: 0.3 }),

  def('yf-holiday-alone', 'life', 1.5, (s) => ({
    id: 'yf-holiday-alone',
    track: 'life',
    title: yearsHere(s) >= 4 ? 'Another holiday on your own' : 'The city empties for the holidays',
    body: `Everyone at work has somewhere to go. The streets are quiet, the shops are shut, and the people you know here are with families of their own. At home it is an ordinary week. Your phone is very still.`,
    stage: 'apartment-night',
    cast: [{ ...YOU, pose: 'sit' }],
    choices: [
      c('strays', `Invite everyone else with nowhere to go (about $${cost(s, 80)}).`, ok(`Seven people from six countries, a table made of two desks, and food that does not match. Somebody says this should happen every year.`, { community: 7, wellbeing: 5, money: -cost(s, 80) })),
      c('accept', 'Say yes to the co-worker who invited you out of politeness.', ok(`You do not know the customs and bring the wrong kind of gift. Their grandmother takes to you at once. You are sent home with leftovers.`, { community: 5, wellbeing: 3 })),
      c('shift', 'Pick up the holiday shifts nobody wants.', ok(`The place is half empty and the hours pass slowly. It is easier than the apartment.`, { career: 2, wellbeing: -2 })),
      c('alone', 'Stay in with a film and a long call home.', ok(`The call is good. After it, the quiet is very large. You go to bed early.`, { family: 3, wellbeing: -3 })),
    ],
  }), { months: [3, 4], when: (s) => settled(s) && band(s, 1, 7) && !hasChild(s), oddsPerYear: 0.5 }),

  def('yf-holiday-host', 'life', 1.5, (s) => ({
    id: 'yf-holiday-host',
    track: 'life',
    title: 'Your table now',
    body: `Somewhere in the years, the holiday gathering became yours to host. ${hasChild(s) ? 'Your child asks which holidays are "ours" and which are "theirs".' : 'The newest arrivals look to your home as the place to be on that day.'} This year ${yearsHere(s) >= 15 ? 'there are more guests than chairs, again' : 'the list is longer than last year'}.`,
    stage: 'kitchen',
    cast: [{ ...YOU, pose: 'cook' }, { role: 'friend', pose: 'laugh' }, { role: 'stranger', pose: 'eat' }],
    choices: [
      c('both', `Cook both: the food of home and the food of here (about $${cost(s, 180)}).`, ok(`Two kitchens' worth of dishes on one table. ${hasChild(s) ? 'Your child eats from both without thinking about it, which answers their question.' : 'The newcomers go for the food of home. The old hands go for both.'}`, { community: 6, family: 3, wellbeing: 5, money: -cost(s, 180) })),
      c('potluck', 'Make it a potluck and seat the newcomers next to the old hands.', ok(`By dessert, a man who arrived in March has a lead on a room and a lift to work. That is what this table is for.`, { community: 8, wellbeing: 3 })),
      c('call', 'Put the family at home on a screen at the head of the table.', ok(`Your relatives wave at a room full of strangers who wave back. Your mother inspects the food through the camera and approves of most of it.`, { family: 7, community: 3, wellbeing: 3 })),
      c('small', 'Keep it small this year. You are tired.', ok(`Four people, one pot, an early night. A few feelings are bruised. You needed it anyway.`, { wellbeing: 4, community: -2 })),
    ],
  }), { months: [3, 4], when: (s) => settled(s) && band(s, 7), oddsPerYear: 0.5 }),

  def('yf-old-friend', 'life', 1.3, (s) => {
    const y = yearsHere(s);
    return {
      id: 'yf-old-friend',
      track: 'life',
      title: 'Someone from the first year',
      body: `A message from a name you have not seen in a long time: the friend from your first year here. You shared rice, bus fare and bad news. Then lives went different ways. They are in town for two days, ${y} years on.`,
      stage: 'cafe',
      cast: [{ ...YOU, pose: 'laugh' }, { role: 'friend', pose: 'laugh' }],
      choices: [
        c('dinner', `Clear the evening and take them to dinner (about $${cost(s, 90)}).`, ok(`You both look older and say so. Within ten minutes you are back to the old jokes. They remember a version of you that you had forgotten.`, { community: 5, wellbeing: 6, money: -cost(s, 90) })),
        c('home', 'Bring them home to meet the people in your life now.', ok(`They tell stories about your first winter that ${hasPartner(s) ? `${pWord(s)} has` : 'your friends have'} never heard. You are embarrassed and very happy.`, { community: 5, wellbeing: 5, family: hasPartner(s) ? 2 : 0 })),
        c('coffee', 'Fit in a quick coffee between other things.', ok(`Forty minutes, mostly catching up on facts. You promise to do it properly next time. You both know how that goes.`, { community: 2 })),
        c('skip', 'Let it pass. You are not sure what you would say.', ok(`You reply too late on purpose. The message stays in your phone, unanswered, for a long time.`, { wellbeing: -2, community: -2 })),
      ],
    };
  }, { when: (s) => settled(s) && band(s, 9), oddsPerYear: 0.3 }),

  def('yf-neighbour-ages', 'life', 1.2, (s) => ({
    id: 'yf-neighbour-ages',
    track: 'life',
    title: 'The neighbour who was kind',
    body: `The older neighbour who helped you in your early years here, with a signed-for parcel, a jump start, a word when you needed one, is not managing well alone. Their own children live far away. ${yearsHere(s) >= 15 ? 'You are not young yourself any more, and you know what it is to have family far off.' : ''} You notice the unopened post and the curtains closed at noon.`,
    stage: 'street',
    cast: [{ ...YOU, pose: 'talk' }, { role: 'stranger', pose: 'idle' }],
    choices: [
      c('routine', 'Make it routine: knock every evening, shop for them on Saturdays.', ok(`They pretend to be annoyed and leave the door on the latch for you. Their daughter phones from another state to thank you, and cries a little.`, { community: 7, wellbeing: 3 })),
      c('family', 'Find their children\'s number and tell them what you see.', ok(`It is an awkward call. Within a month there is a visiting nurse and a son who comes on weekends. You did the uncomfortable thing.`, { community: 5, wellbeing: 1 })),
      c('meal', 'Bring a plate over when you cook extra.', ok(`They return the plate washed, with a different food on it each time. It becomes an exchange, which is how they prefer it.`, { community: 4, wellbeing: 2 })),
      c('mind', 'It is not your place. People here keep to themselves.', bad(`Weeks later there is an ambulance outside. Someone else found them. You stand at your window.`, { community: -4, wellbeing: -5 }, 'You saw the curtains.', 'No rule here. Where you come from, and here too, noticing is often all that stands between an old person and a bad fall.')),
    ],
  }), { when: (s) => settled(s) && band(s, 9), oddsPerYear: 0.25 }),

  def('yf-stand-up-wedding', 'life', 1.2, (s) => ({
    id: 'yf-stand-up-wedding',
    track: 'life',
    title: 'Asked to stand in for family',
    body: `A friend here is getting married, and their family cannot travel for it. ${yearsHere(s) >= 10 ? 'You have known each other most of your years here.' : 'You met in your early days here.'} They ask you to stand where a brother or sister would stand, sign as a witness and give the family speech. "You are the family I have here," they say.`,
    stage: 'festival',
    cast: [{ ...YOU, pose: 'cheer' }, { role: 'friend', pose: 'laugh' }],
    choices: [
      c('all', `Do all of it, properly (about $${cost(s, 250)} for clothes and a gift).`, ok(`You hold a phone up through the whole ceremony so their mother can see. In your speech you say what a brother or sister would say. Their mother thanks you by name.`, { community: 8, wellbeing: 5, money: -cost(s, 250) })),
      c('speech', 'Give the speech, and keep the spending small.', ok(`You borrow a jacket. The speech is short, and people repeat one line of it afterwards. It was never about the gift.`, { community: 6, wellbeing: 4 })),
      c('guest', 'Come as a guest. The family role feels like too much.', ok(`They understand, and ask someone else. You clap as loudly as anyone, and feel a small regret during the speeches.`, { community: 1, wellbeing: -1 })),
    ],
  }), { when: (s) => settled(s) && band(s, 4), oddsPerYear: 0.25 }),

  def('yf-twenty-years', 'life', 2, (s) => {
    const y = yearsHere(s);
    return {
      id: 'yf-twenty-years',
      track: 'life',
      title: 'Half a life',
      body: `You do the sum on an ordinary evening: ${y} years here. Soon, or already, more of your adult life has been lived in this country than in the one you were born in. ${has(s, 'yf_lostParent') ? 'One of the people you left for is gone.' : 'The people you left are old now.'} ${hasChild(s) ? 'Your child has never lived anywhere else.' : 'The friends you made here have known you longer than most of your cousins have.'}`,
      stage: 'rooftop',
      cast: [{ ...YOU, pose: 'think' }],
      choices: [
        c('gather', `Mark it: a meal with everyone who made this place home (about $${cost(s, 200)}).`, ok(`You look down a long table at people from a dozen countries and one street. Somebody asks for a speech. You manage two sentences and have to sit down.`, { community: 8, wellbeing: 6, money: -cost(s, 200), flags: { yf_twentyYears: true } })),
        c('write', 'Write it down, the whole story, for whoever comes after you.', ok(`It takes months of evenings. The early chapters are harder to write than you expected. ${hasChild(s) ? 'Your child reads it in one sitting and is quiet afterwards.' : 'You send it home, and your sibling reads it aloud to the family.'}`, { family: 7, wellbeing: 5, flags: { yf_twentyYears: true } })),
        c('call', 'Call home and ask the question you never asked: was it right that I left?', ok(`A long silence on the line. "We missed you every day," comes the answer, "and we would tell you to go again." You did not know how much you needed both halves of that.`, { family: 8, wellbeing: 4, flags: { yf_twentyYears: true } })),
        c('pass', 'Let it pass. It is only a number.', ok(`You wash the dishes and go to bed. The number goes with you.`, { wellbeing: -1, flags: { yf_twentyYears: true } })),
      ],
    };
  }, { when: (s) => settled(s) && band(s, 18) && !has(s, 'yf_twentyYears') }),

  def('yf-grow-old-where', 'life', 1.3, (s) => {
    const free = canTravelFreely(s);
    return {
      id: 'yf-grow-old-where',
      track: 'life',
      title: 'Where will you grow old?',
      body: `A friend your age has bought a small plot at home, "for later". Another says they will never go back, their grave will be here. Over a long evening the question comes round to you. ${free ? 'You could choose either.' : 'For you the choice is not fully yours, and that is its own answer.'} ${hasChild(s) ? 'Your child is from here.' : ''}`,
      stage: 'rooftop',
      cast: [{ ...YOU, pose: 'sit' }, { role: 'friend', pose: 'talk' }],
      choices: [
        c('here', 'Say it out loud: here. This is home now.', ok(`Saying it costs something and settles something. You start to notice the place differently: as somewhere you will be old, not somewhere you are passing through.`, { wellbeing: 5, community: 4, family: -2 })),
        c('there', 'Say you still mean to go back one day.', ok(`Your friends nod. Most of them have said the same for twenty years. Still, it keeps a door open in your mind, and you call home more that month.`, { family: 5, wellbeing: 1 })),
        c('both', 'Say both, and that you have stopped needing one answer.', ok(`Someone laughs and says that is the most immigrant answer there is. It is also true. You sleep well.`, { wellbeing: 5, family: 2, community: 2 })),
        ...(hasPartner(s) ? [c('ask', `Go home and ask ${pWord(s)} what they want.`, ok(`It turns out they have been thinking about it for a year and were afraid to raise it. You do not agree on everything. But now it is a thing you are deciding together.`, { family: 6, wellbeing: 3 }))] : []),
      ],
    };
  }, { when: (s) => settled(s) && band(s, 14), oddsPerYear: 0.25 }),

  // ───────────────────────── A partner through the years ─────────────────────────

  def('yf-go-back-argument', 'life', 1.5, (s) => {
    const y = yearsHere(s);
    return {
      id: 'yf-go-back-argument',
      track: 'life',
      title: 'The argument about going back',
      body: y >= 11
        ? `It starts over something small and becomes the old argument. ${PWord(s)} says you talk about home as if you were only visiting here, after ${y} years. You say they have stopped missing anything. Neither of those is fair.`
        : `A bad week at work, a call from home, and suddenly you and ${pWord(s)} are arguing about whether to stay in this country at all. One of you wants to give it five more years. One of you wants a date.`,
      stage: 'apartment-night',
      cast: [{ ...YOU, pose: 'talk' }, { role: pRole(s), pose: 'talk' }],
      choices: [
        c('listen', 'Stop arguing your side. Ask what they are really afraid of.', ok(`It is not about the country. It is about their parents ageing, or about never feeling finished. You stay up late. Nothing is decided, and everything is lighter.`, { family: 6, wellbeing: 3 })),
        c('terms', 'Agree to a real review: a date, a list, what would make you stay or go.', ok(`You write it on paper and put it in a drawer. Having a date makes the days in between easier to live in.`, { family: 5, wellbeing: 4 })),
        c('win', 'Win the argument. You have the better reasons.', bad(`You do have the better reasons. ${PWord(s)} stops arguing and goes quiet for some days.`, { family: -5, wellbeing: -3 }, 'Being right is not the same as being heard.', 'No rule here. Couples who have moved countries often carry different amounts of homesickness, and it comes out as an argument about plans.')),
        c('drop', 'Change the subject. It always blows over.', ok(`It blows over. It will be back, on the next bad week.`, { family: -2, wellbeing: -1 })),
      ],
    };
  }, { when: (s) => settled(s) && hasPartner(s) && band(s, 3), oddsPerYear: 0.35 }),

  def('yf-two-careers', 'life', 1.3, (s) => ({
    id: 'yf-two-careers',
    track: 'life',
    title: 'Two lives, one address',
    body: `${PWord(s)} has a real chance at something they have wanted for years: a course, a role, a start of their own. It would mean evenings and weekends for a long while, and more of the home falling to you. For years, your plans came first. They do not say that. They do not need to.`,
    stage: 'kitchen',
    cast: [{ ...YOU, pose: 'sit' }, { role: pRole(s), pose: 'talk' }],
    choices: [
      c('back', 'Back them fully, and take over the home for a year.', ok(`You learn where everything is kept. ${hasChild(s) ? 'You do the school run and the fevers.' : 'You do the cooking and the bills.'} They come home late, tired and lit up. You had forgotten that look.`, { family: 8, wellbeing: -2, career: -2 })),
      c('split', 'Sit down and split the week on paper, hour by hour.', ok(`It is unromantic and it works. Neither of you gets everything. Both of you get something.`, { family: 5, wellbeing: 2 })),
      c('later', 'Ask them to wait one more year, until things are steadier.', bad(`They say fine. It is the third time it has been one more year.`, { family: -6, wellbeing: -2, career: 2 }, 'One more year adds up.', 'No rule here. The partner who followed often pays for the move in years of their own work, and the bill arrives late.')),
    ],
  }), { when: (s) => settled(s) && hasPartner(s) && band(s, 2, 16), oddsPerYear: 0.3 }),

  def('yf-inlaws-call', 'life', 1.2, (s) => {
    const y = yearsHere(s);
    return {
      id: 'yf-inlaws-call',
      track: 'life',
      title: 'The in-laws on the screen',
      body: has(s, 'marriedCitizen')
        ? `The weekly call with your family at home, with ${pWord(s)} beside you. Your mother speaks slowly and loudly for their benefit. Your ${y >= 8 ? 'aunt still asks' : 'aunt asks'} questions you have to translate, and some you choose not to.`
        : `${PWord(s)}'s parents call every Sunday. ${y >= 8 ? 'After all these years they still ask when you two are coming back for good.' : 'They are warm with you, and have opinions on how you live, eat and spend.'} The phone gets passed to you.`,
      stage: 'apartment',
      cast: [{ ...YOU, pose: 'phone' }, { role: pRole(s), pose: 'sit' }, { role: 'parent', pose: 'talk' }],
      choices: [
        c('warm', 'Lean in. Ask about their week, their health, the neighbours.', ok(`Twenty minutes of small news. Afterwards ${pWord(s)} squeezes your hand. These calls are how two families become one across a distance.`, { family: 6, wellbeing: 1 })),
        c('translate', has(s, 'marriedCitizen') ? `Teach ${pWord(s)} ten phrases in your language before the next call.` : 'Answer the hard question honestly: you do not know when, or if.', ok(has(s, 'marriedCitizen') ? `The accent is terrible and the effect is total. Your mother tells the whole street. Your aunt declares them family.` : `There is a silence, then a sigh, then a change of subject. It needed saying by someone, and it was kinder coming from you.`, { family: 5, wellbeing: 2 })),
        c('boundary', 'Agree with your partner on what is not up for discussion on these calls.', ok(`Money, children and your plans come off the table, politely. The next call is shorter and much calmer.`, { family: 2, wellbeing: 4 })),
        c('duck', 'Wave, say hello, find a reason to leave the room.', ok(`You get out of the call. ${PWord(s)} covers for you, again, and notices.`, { family: -3, wellbeing: 1 })),
      ],
    };
  }, { when: (s) => settled(s) && hasPartner(s) && band(s, 2), oddsPerYear: 0.3 }),

  def('yf-years-together', 'life', 1.2, (s) => {
    const y = yearsHere(s);
    return {
      id: 'yf-years-together',
      track: 'life',
      title: 'An anniversary, almost forgotten',
      body: y >= 12
        ? `Your anniversary falls on a weekday and you both nearly miss it. You have been through forms, moves, bad winters and long silences together. ${hasChild(s) ? 'These days you talk mostly about schedules.' : 'These days you can sit a whole evening without needing to talk.'}`
        : `Your anniversary is this week. Life here has been all logistics: papers, shifts, rent. You try to remember the last time the two of you did something for no reason.`,
      stage: 'kitchen',
      cast: [{ ...YOU, pose: 'cook' }, { role: 'spouse', pose: 'sit' }],
      choices: [
        c('evening', `Plan a real evening out (about $${cost(s, 110)}).`, ok(`You both dress up and feel faintly silly. By the second course you are talking the way you did before any of this. The walk home is slow.`, { family: 7, wellbeing: 5, money: -cost(s, 110) })),
        c('letter', 'Write them a letter, by hand, in the language you first spoke together.', ok(`It takes three drafts. They read it twice and put it in the box where the important papers are kept.`, { family: 8, wellbeing: 3 })),
        c('home', 'Cook the first meal you ever made for them.', ok(`It is still not very good. They eat all of it. You both remember the tiny kitchen it was first cooked in.`, { family: 6, wellbeing: 4 })),
        c('skip', 'Let it go this year. You are both exhausted.', ok(`You agree to do something at the weekend. The weekend fills up.`, { family: -3 })),
      ],
    };
  }, { when: (s) => settled(s) && hasSpouse(s) && band(s, 4), oddsPerYear: 0.35 }),

  def('yf-quiet-distance', 'life', 1.3, (s) => ({
    id: 'yf-quiet-distance',
    track: 'life',
    title: 'A quiet in the house',
    body: `You and ${pWord(s)} have not argued in months. You have not really talked either. Work, ${hasChild(s) ? 'the child, ' : ''}the calls home, the tiredness. One evening you notice you are both on your phones, each talking to people in another time zone.`,
    stage: 'apartment-night',
    cast: [{ ...YOU, pose: 'phone' }, { role: pRole(s), pose: 'phone' }],
    choices: [
      c('name', 'Put the phone down and say it: I miss you, and you are right here.', ok(`They look up, surprised, and then not surprised. It is an awkward, honest hour. Something that had been closing stays open.`, { family: 7, wellbeing: 4 })),
      c('walk', 'Start a small habit: a walk together after dinner, no phones.', ok(`The first walks are quiet. By the second week you are arguing happily about nothing. The habit holds through the winter.`, { family: 6, wellbeing: 5 })),
      c('help', `Find a counsellor who works with couples far from home (about $${cost(s, 400)} for a few sessions).`, ok(`It feels strange to tell a stranger. The counsellor has heard it before: two people who spent years surviving and forgot to stop. That helps more than you expected.`, { family: 8, wellbeing: 3, money: -cost(s, 400) })),
      c('wait', 'Leave it. Every couple has seasons.', bad(`The season goes on. You are kind to each other, like good housemates.`, { family: -5, wellbeing: -3 }, 'Quiet is not the same as peace.', 'No rule here. Couples under long pressure from work, papers and distance often drift without a single argument.')),
    ],
  }), { when: (s) => settled(s) && hasPartner(s) && band(s, 6), oddsPerYear: 0.25 }),

  // ───────────────────────── A child born here ─────────────────────────

  def('yf-child-born', 'life', 2.5, (s) => {
    const born = { yf_child: true, yf_childYear: yearsHere(s) };
    return {
      id: 'yf-child-born',
      track: 'life',
      title: 'A child arrives',
      body: `After months of waiting, you and ${pWord(s)} bring a baby home from a hospital across town. The grandparents meet their grandchild on a phone screen, crying and giving instructions at the same time. There is nobody down the hall to hand the baby to. It is the two of you.`,
      stage: 'bedroom',
      cast: [{ ...YOU, pose: 'carry' }, { role: pRole(s), pose: 'sit' }],
      choices: [
        c('friends', 'Say yes to every friend who offers food, laundry or an hour of holding.', ok(`A rota appears without you asking. People you met at work and on the bus become aunts and uncles. The child will grow up with a family you built by hand.`, { family: 10, community: 7, wellbeing: 3, money: -cost(s, 400), flags: born })),
        c('grandparent', `Bring a grandparent over to help for the first months, if a visa comes (about $${cost(s, 1900)}).`, ok(`The visa comes on the second try. For three months there is someone in the kitchen at dawn singing the songs you were raised on. When they leave, the apartment is too quiet.`, { family: 14, wellbeing: 5, money: -cost(s, 1900), flags: born })),
        c('alone', 'Manage it yourselves. You have managed everything else.', ok(`You manage. You are more tired than you have ever been, and prouder. Somewhere in the fourth week you both cry at the same time, and then laugh.`, { family: 9, wellbeing: -5, money: -cost(s, 400), flags: born })),
      ],
    };
  }, { when: (s) => settled(s) && hasPartner(s) && !hasChild(s) && band(s, 2, 14) && age(s) + yearsHere(s) <= 44, oddsPerYear: 0.3 }),

  def('yf-grandparents-screen', 'life', 1.3, (s) => ({
    id: 'yf-grandparents-screen',
    track: 'life',
    title: 'Grandparents in a rectangle',
    body: childAge(s) <= 3
      ? `Your child is learning that grandparents live inside the phone. They kiss the screen goodnight. Your ${has(s, 'yf_lostParent') ? 'parent sings' : 'parents sing'} down the line, and the child sings back, half a beat late.`
      : `Your child and their ${has(s, 'yf_lostParent') ? 'grandparent' : 'grandparents'} run out of things to say after two minutes. ${has(s, 'yf_homeLanguage') ? 'They share a language, but not a world.' : 'They share a few dozen words between them.'} Both sides look at you to fill the silence.`,
    stage: 'apartment',
    cast: [{ ...YOU, pose: 'phone' }, { role: 'parent', pose: 'wave' }],
    choices: [
      c('ritual', 'Give them something to do together: a song, a game, a recipe by video.', ok(`Your mother teaches a clapping game through the screen. Your child teaches her a word in English. It is a real thing between the two of them now, and it does not go through you.`, { family: 8, wellbeing: 3 })),
      c('stories', 'Ask the grandparents to tell stories of when you were small.', ok(`Your child is delighted to learn that you were once in trouble. You hear two stories you never knew.`, { family: 7, wellbeing: 4 })),
      c('photos', `Print photos both ways and post them (about $${cost(s, 50)}).`, ok(`A wall at home fills with pictures of a child who has never stood in that house. Your child's wall gets faces to go with the voices.`, { family: 5, money: -cost(s, 50) })),
      c('short', 'Keep the calls short. Children do not sit still.', ok(`Two minutes, a wave, done. The grandparents say they understand. They always say that.`, { family: -3 })),
    ],
  }), { when: (s) => settled(s) && hasChild(s) && childAge(s) >= 1 && childAge(s) <= 10, oddsPerYear: 0.4 }),

  def('yf-home-language', 'life', 1.5, (s) => ({
    id: 'yf-home-language',
    track: 'life',
    title: 'Which language at home?',
    body: childAge(s) >= 6
      ? `Your child has started answering you in English, even when you speak your own language. At school it is English all day. A teacher says kindly that children sort it out. Your mother says the child sounds like a foreigner.`
      : `Your child is starting to talk, and you have to decide what they will hear at home. Your language, English, or both. ${hasPartner(s) ? `You and ${pWord(s)} do not fully agree.` : 'Everyone you ask has a firm opinion.'}`,
    stage: 'kitchen',
    cast: [{ ...YOU, pose: 'cook' }, ...(hasPartner(s) ? [{ role: pRole(s), pose: 'talk' as const }] : [])],
    choices: [
      c('first', 'Your language at home, always. English will come from the world.', ok(`It takes patience, and some evenings it is a battle. But your child can talk to their grandparents without you in the middle.`, { family: 8, wellbeing: -1, flags: { yf_homeLanguage: true } })),
      c('both', 'Both, without rules: whatever comes out.', ok(`Your home invents its own mixed speech that nobody outside fully follows. Your child understands everything and answers mostly in English.`, { family: 4, wellbeing: 3 })),
      c('class', `Add a weekend language class with other children (about $${cost(s, 300)} a year).`, ok(`Your child complains every Saturday morning and comes home with friends who also have two names for everything.`, { family: 6, community: 4, money: -cost(s, 300), flags: { yf_homeLanguage: true } })),
      c('english', 'English only. You want nothing to hold them back here.', bad(`Their English is perfect, and so, soon, is their silence on calls home. Your mother talks to them through you.`, { family: -6, wellbeing: -2, flags: { yf_homeLanguage: false } }, 'A language is also a set of people.', 'No rule here. Many parents choose English out of love and later wish their children could speak with their own grandparents.')),
    ],
  }), { when: (s) => settled(s) && hasChild(s) && childAge(s) >= 2 && childAge(s) <= 9, oddsPerYear: 0.4 }),

  def('yf-child-school', 'life', 2, (s) => ({
    id: 'yf-child-school',
    track: 'life',
    title: 'The first day of school',
    body: `Your child starts school this week, with a bag too big for their back. The other parents seem to know the rules already: the forms, the lunch boxes, what to say at the gate. You went to school in another country, under another system. ${has(s, 'yf_homeLanguage') ? 'Your child speaks two languages and is about to find out which one counts here.' : ''} Your child's teacher gets their name slightly wrong.`,
    stage: 'campus',
    cast: [{ ...YOU, pose: 'wave' }, { role: 'professor', pose: 'talk' }, { role: 'stranger', pose: 'talk' }],
    choices: [
      c('name', 'Teach the teacher the name, kindly, until it is right.', ok(`It takes three tries and a smile. By Friday the whole class says it correctly. Your child will not have to shrink their name to fit.`, { family: 6, wellbeing: 3, flags: { yf_schoolStarted: true } })),
      c('parents', 'Stay at the gate and make yourself talk to the other parents.', ok(`It is awkward for a week. Then someone asks if your child can come to a birthday. You are in a group chat with forty strangers now, for the next ten years.`, { community: 7, wellbeing: 2, flags: { yf_schoolStarted: true } })),
      c('teacher', 'Ask for a meeting so the teacher can explain how school works here.', ok(`The teacher is glad you asked and explains everything, from reading logs to snow days. You leave with a folder and much less dread.`, { family: 4, community: 3, study: 1, flags: { yf_schoolStarted: true } })),
      c('drop', 'Drop them off quickly and go. You do not know what to say to anyone.', ok(`Your child walks in without looking back, which is good and also hurts. The gate will be there tomorrow.`, { wellbeing: -2, flags: { yf_schoolStarted: true } })),
    ],
  }), { when: (s) => settled(s) && hasChild(s) && childAge(s) >= 5 && childAge(s) <= 7 && !has(s, 'yf_schoolStarted') }),

  def('yf-other-parents', 'life', 1.2, (s) => ({
    id: 'yf-other-parents',
    track: 'life',
    title: 'A sleepover invitation',
    body: `Your child is invited to stay the night at a school friend's house. Where you grew up, ${childAge(s) >= 10 ? 'children that age did not sleep in strangers\' homes' : 'this was simply not done'}. Here it seems to be how friendships are made. Your child is already packing a bag.`,
    stage: 'apartment',
    cast: [{ ...YOU, pose: 'think' }, ...(hasPartner(s) ? [{ role: pRole(s), pose: 'talk' as const }] : [])],
    choices: [
      c('meet', 'Say yes, after you have met the parents over coffee.', ok(`The other parents are nervous about meeting you too. An hour later you have their number and a standing offer for school pick-ups.`, { community: 6, family: 3, wellbeing: 2 })),
      c('host', 'Offer to host at your home first.', ok(`Two children, a fort made of blankets, and your home's food met with suspicion and then second helpings. Your child sees their own house through a friend's eyes, and is proud of it.`, { community: 5, family: 5, wellbeing: 3 })),
      c('no', 'Say no. Some of your own rules come with you.', ok(`There are tears. You explain that families do things differently, and that it is all right to be a family that does. They half accept it.`, { family: -1, wellbeing: -1 })),
    ],
  }), { when: (s) => settled(s) && hasChild(s) && childAge(s) >= 6 && childAge(s) <= 12, oddsPerYear: 0.35 }),

  def('yf-child-translates', 'life', 1.5, (s) => ({
    id: 'yf-child-translates',
    track: 'life',
    title: 'Your child speaks for you',
    body: `At a counter, a clerk speaks fast and you miss a sentence. Before you can ask, your child answers for you, in perfect local English, and then explains it to you slowly. ${yearsHere(s) >= 15 ? `After ${yearsHere(s)} years your English is good.` : 'Your English is good.'} Theirs is native. The clerk now talks only to them.`,
    stage: 'bank',
    cast: [{ ...YOU, pose: 'idle' }, { role: 'teller', pose: 'talk' }],
    choices: [
      c('lead', 'Thank them, then turn back to the clerk and carry on yourself.', ok(`"I will take it from here." You ask the clerk to repeat it, and they do. In the car your child says sorry. You say there is nothing to be sorry for, and that it is your job, not theirs.`, { family: 5, wellbeing: 3 })),
      c('talk', 'Let it go at the counter. Talk about it at home.', ok(`You tell them you are glad of their help with a menu or a joke. Money, doctors and official letters are for adults, even when the adult is slower. They look relieved.`, { family: 7, wellbeing: 2 })),
      c('lean', 'Let them handle it. They are better at it than you.', bad(`It is quicker. Soon they are reading the bills and making the phone calls. They are very grown up for their age, everyone says.`, { family: -4, wellbeing: -2 }, 'They are still a child.', 'No rule is claimed here. A child should not have to carry adult news about money, health or papers. You can always ask whether an interpreter is available.')),
      c('class', `Sign up for an evening class to sharpen your own English (about $${cost(s, 180)}).`, ok(`You are the oldest in the room and the most stubborn. Your child helps with your homework and enjoys it far too much.`, { study: 4, family: 3, wellbeing: 2, money: -cost(s, 180) })),
    ],
  }), { when: (s) => settled(s) && hasChild(s) && childAge(s) >= 8 && childAge(s) <= 14, oddsPerYear: 0.4 }),

  def('yf-teen-questions', 'life', 1.6, (s) => {
    const free = canTravelFreely(s);
    const choices: Choice[] = [
      c('tell', 'Tell them all of it: why you left, what it cost, what you would do again.', ok(`You talk until midnight. They ask sharper questions than you expected, and you answer every one. At the end they say, "I did not know any of that." They stand a little differently afterwards.`, { family: 9, wellbeing: 4 }, free ? undefined : leaveLookback(s))),
      c('kitchen', 'Start with what can be touched: the food, the music, the old photos.', ok(`A Sunday of cooking with the old songs playing loud. They film it for their friends. It is not the whole story, but it is a way in.`, { family: 6, wellbeing: 4 })),
    ];
    if (free) {
      choices.push(c('trip', `Take them home for the summer (about $${cost(s, 4200)}).`, ok(`They are a foreigner there and they hate it for a week. Then a cousin their age takes them in hand. They come back with a second accent, forty new relatives and no more questions about where they are from.`, { family: 13, wellbeing: 5, money: -cost(s, 4200), flags: { yf_visitedHome: true } }, is(s, 'LPR') ? LB_LPR_TRIP : undefined)));
    } else {
      choices.push(c('why', 'Explain honestly why the family cannot simply visit.', ok(`You keep it plain and without fear: your papers do not let you leave and come back. They are quiet, then angry on your behalf, then gentle with you. It is a lot for a teenager, and they carry it well.`, { family: 6, wellbeing: -2 }, leaveLookback(s))));
    }
    choices.push(c('later', '"It is complicated. I will tell you when you are older."', bad(`They shrug and put their earphones back in. They will find some version of the story elsewhere.`, { family: -5, wellbeing: -2 }, 'They are older now.', 'No rule here. Teenagers who are not told the family story tend to fill the gap themselves.')));
    return {
      id: 'yf-teen-questions',
      track: 'life',
      title: '"Where are we from, really?"',
      body: `A school project asks for a family history. Your teenager, born here, puts down their pen. "People ask where I am from and I say here. Then they ask where I am really from. What do I tell them?" ${free ? '' : 'They have also started to ask why you never go back to visit.'}`,
      stage: 'kitchen',
      cast: [{ ...YOU, pose: 'sit' }],
      choices,
    };
  }, { when: (s) => settled(s) && hasChild(s) && childAge(s) >= 13 && childAge(s) <= 17, oddsPerYear: 0.45 }),

  def('yf-child-graduation', 'life', 2.5, (s) => {
    const none = noStatus(s);
    return {
      id: 'yf-child-graduation',
      track: 'life',
      title: 'A cap and a gown',
      body: `Your child graduates from high school today. Rows of folding chairs, a band slightly out of tune, a name read out that carries your family's name across a stage in this country. ${has(s, 'yf_lostParent') ? 'You think of the grandparent who did not live to see it.' : 'The grandparents are awake at three in the morning to watch the stream.'} ${none ? 'You sit near the back, as you have learned to do.' : ''}`,
      stage: 'festival',
      cast: [{ ...YOU, pose: 'cheer' }, ...(hasPartner(s) ? [{ role: pRole(s), pose: 'cheer' as const }] : [])],
      choices: [
        c('party', `Throw the party the whole community expects (about $${cost(s, 700)}).`, ok(`Everyone who ever babysat, tutored or fed this child comes. There are speeches in three languages. Your child is embarrassed and does not leave your side all night.`, { family: 10, community: 8, wellbeing: 6, money: -cost(s, 700), flags: { yf_childGraduated: true } }, none ? 'If your child is a US citizen, they can petition for a parent only once they are 21 (INA 201(b)(2)(A)(i)). Even then, a parent who was never inspected and admitted generally cannot finish the process from inside the US (INA 245(a)), and leaving can bring the 3 or 10 year bars (INA 212(a)(9)(B)). It is a question for a lawyer, not a plan to count on.' : undefined)),
        c('stream', 'Hold the phone up the whole ceremony so home can see.', ok(`Your arm aches for a day. At home, a room full of relatives cheers at a small screen when the name is read. Your child waves at the phone from the stage.`, { family: 12, wellbeing: 5, flags: { yf_childGraduated: true } })),
        c('words', 'Take them aside afterwards and tell them what this day means to you.', ok(`You say it badly, in two languages. They hug you hard and say, "I know. I always knew." Then their friends pull them away, which is how it should be.`, { family: 11, wellbeing: 7, flags: { yf_childGraduated: true } })),
        c('gift', `Give them the gift you could never have had at their age (about $${cost(s, 500)}).`, ok(`They open it and go quiet. Later you find the thank-you note on your pillow, written in careful letters in your first language.`, { family: 9, wellbeing: 4, money: -cost(s, 500), flags: { yf_childGraduated: true } })),
      ],
    };
  }, { when: (s) => settled(s) && hasChild(s) && childAge(s) >= 18 && !has(s, 'yf_childGraduated') }),
];

/** Optional sentences leave gaps when they are empty; close them so the text reads cleanly. */
const tidy = (t: string): string => t.replace(/\s+/g, ' ').trim();

export const CARDS: ChallengeDef[] = RAW.map((d) => ({
  ...d,
  build: (s: GameState) => {
    const ch = d.build(s);
    return { ...ch, body: tidy(ch.body) };
  },
}));
