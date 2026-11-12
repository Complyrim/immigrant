import type { CastSpec, Effects, GameState, StageId } from './types';
import { cultureOf } from './country';

/**
 * Short life moments played between tasks. They are not decisions with right or
 * wrong answers: the player picks how to spend the evening and watches it play out.
 */
export interface Script {
  /** Lines shown one after another while the scene plays. {names} are filled in. */
  lines: string[];
  /** Overrides the activity's default cast for this script. */
  cast?: CastSpec[];
  /** Overrides the automatic "With ..." line. */
  with?: string;
}

export interface Activity {
  id: string;
  label: string;
  blurb: string;
  stage: StageId;
  /** A special staging of the room: a film playing, or someone far away on a video call. */
  variant?: 'movie' | 'call';
  cast: CastSpec[];
  /** Alternative scripts; one is chosen per play and the last one used is skipped. */
  scripts: Script[];
  effects: Effects;
  weight: number;
  tag: 'rest' | 'social' | 'food' | 'fun' | 'fitness' | 'family' | 'study' | 'explore' | 'calm' | 'romance' | 'work';
  when?: (s: GameState) => boolean;
  /** What this really meant, revealed in the end-of-year review. */
  lookback?: string;
  /** Something that can happen at the end of the scene, such as meeting someone. */
  after?: (s: GameState, rng: () => number) => { text: string; effects?: Effects } | null;
}

const YOU = { role: 'player' } as const;
const inStatus = (s: GameState): boolean => !s.flags.outOfStatus;
/** Campus life (the library, campus events) belongs to enrolled students only, whatever route they arrived on. */
const enrolled = (s: GameState): boolean => s.flags.status === 'F1' && !s.flags.outOfStatus;
const affordable = (s: GameState): boolean => s.stats.money > -400;
const hasPartner = (s: GameState): boolean => Boolean(s.flags.dating) || s.profile.marital !== 'single';

export const ACTIVITIES: Activity[] = [
  {
    id: 'sleep',
    label: 'Sleep in',
    blurb: 'Ten hours of real rest.',
    stage: 'bedroom',
    cast: [{ ...YOU, pose: 'sleep' }],
    scripts: [
      { lines: [
      'You turn off the light. The city hums on outside the window.',
      'A siren fades. Somewhere a neighbor\'s music plays softly, then stops.',
      'You dream of your mother\'s kitchen, with the radio on.',
      'Morning arrives slowly. For once you are not in a hurry.',
      ] },
      { lines: ["The phone goes on the charger face down. The radiator knocks twice and settles.", "You think of everything due this week, then let each item float away.", "A neighbor's footsteps cross the ceiling and fade.", "You wake at noon, which feels like a small crime and a large gift."] },
      { lines: ["You pull the blanket over your head to shut out the streetlight.", "Your mind replays a conversation from the day, edits it, and lets it go.", "Rain starts against the glass, soft enough to count.", "You sleep deeper than you have since you landed."] },
      { lines: ["You set no alarm, which takes more courage than it should.", "The pillow is cool on one side. You find it and stay there.", "Somewhere in a dream you are explaining this city to someone from home, and getting it mostly right.", "You wake to full daylight and a quiet phone."] },
      { lines: ["You are asleep before the kettle you put on has finished boiling. It clicks off by itself.", "A delivery truck idles under the window, then pulls away.", "You wake once, check the time, and are delighted to have hours left.", "When you finally get up, the day feels a size bigger."] },
      { lines: ["Clean sheets tonight. You did the laundry for exactly this.", "The building settles: pipes, a door two floors down, someone laughing in the stairwell.", "You dream in two languages and understand both.", "Morning light reaches the far wall before you open your eyes."] },
      { lines: ["You leave the window open a finger's width for the cold air.", "Your shoulders come down from around your ears, one at a time.", "The last thing you hear is a train, far off, going somewhere without you.", "You wake rested, and it takes a moment to remember what that feels like."] },
    ],
    effects: { wellbeing: 4 },
    weight: 2,
    tag: 'rest',
  },
  {
    id: 'cook',
    label: 'Cook something from home',
    blurb: 'Cheaper, and tastes like somewhere else.',
    stage: 'kitchen',
    cast: [{ ...YOU, pose: 'cook' }, { role: 'roommate', pose: 'laugh' }],
    scripts: [
      { lines: [
      'Mustard seeds crackle in the pan and the whole apartment smells like home.',
      'You taste the dal and add a pinch more salt, the way your mother would.',
      '{roommate} wanders in and asks what smells so good.',
      'You share a plate at the counter, and for an hour the world is small and warm.',
      ] },
      { lines: ["You rinse the rice twice, the way you were taught, and set the pot on.", "Onions turn golden and the kitchen window fogs over.", "{roommate} drifts in, steals a spoonful and asks for the recipe.", "You write it on the back of a receipt and promise to cook again."] },
      { lines: ["You find the last of the spice packet your mother packed and ration it carefully.", "The smell reaches the hallway and a neighbor knocks to ask what you are making.", "{roommate} sets the table and you eat cross-legged on the floor.", "You do dishes together, and neither of you mentions how tired you were."] },
      { lines: ["You call home for the recipe and get three different versions and an argument.", "You pick your mother's, mostly, and your aunt's trick with the oil.", "{roommate} chops onions badly and cries more than the onions deserve.", "It does not taste like home. It tastes close, and close is a lot."] },
      { lines: ["The store was out of the right pepper, so you improvise with the wrong one.", "The smoke alarm has opinions. {roommate} fans it with a pizza box.", "You open every window and eat in your coats, laughing.", "It is too hot, slightly burnt, and the best thing you have eaten all month."] },
      { lines: ["Sunday: you cook one big pot to last the week, the way people on a budget do.", "You line up containers on the counter and label them with tape.", "{roommate} trades you two of theirs for two of yours.", "By Thursday you are tired of it, and grateful for it."] },
      { lines: ["{roommate} wants to learn, so tonight you teach.", "You show how to tell when the oil is ready by the sound it makes.", "They take notes on their phone as if there will be a test.", "They plate it up proudly, and you take a picture to send home."] },
      { lines: ["You are homesick tonight, so you make the thing you were given when you were ill as a child.", "It is plain and soft and needs nothing explained.", "{roommate} looks in, reads the room and just puts the kettle on.", "You eat slowly. The ache does not leave, but it sits down."] },

    ],
    effects: { wellbeing: 3, community: 2, money: 12 },
    weight: 2,
    tag: 'food',
  },
  {
    id: 'rooftop',
    label: 'Hang out with friends',
    blurb: 'A rooftop, snacks and nowhere to be.',
    stage: 'rooftop',
    cast: [{ ...YOU, pose: 'laugh' }, { role: 'friend', pose: 'laugh' }, { role: 'student', pose: 'talk' }],
    scripts: [
      { lines: [
      'The evening is warm. Someone brought speakers, someone brought chips.',
      'You trade stories about your first weeks, and everyone has one that is worse.',
      'The skyline turns gold, then blue. Nobody wants to be the first to leave.',
      'You walk home lighter than you left.',
      ] },
      { lines: ["{friend} texts the address and says to bring nothing, so you bring too much.", "Someone's cousin has a guitar and no sense of when to stop.", "{friend} tells the story of their first week here, and it somehow tops yours.", "You take the stairs down slowly, in no hurry for the night to end."] },
      { lines: ["The tar paper is still warm from the day. You sit with your back against a vent.", "{friend} and a neighbour argue over the best street food in the city.", "A plane crosses above the skyline, and you wonder who is on it.", "You leave with a promise to do this again before the weather turns."] },
      { lines: ["Folding chairs, a cooler, and a view someone else pays far more for.", "{friend} deals a card game with rules that change every round.", "Somebody loses badly and is made to sing. The singing is worse than the losing.", "You head down the stairs with your cheeks aching from laughing."] },
      { lines: ["The sun is still up when you arrive and long gone when anyone checks the time.", "{friend} asks what you would be doing tonight if you were back home, and everyone answers in turn.", "The answers get quieter and kinder as the bottle of soda goes round.", "You go home feeling known by a few more people."] },
      { lines: ["Somebody strung fairy lights along the railing and half of them work.", "{friend} has brought a speaker, and the playlist turns into a contest between countries.", "Your song gets the whole roof clapping, and you take a small bow.", "On the way out, three people ask you to send them that song."] },
      { lines: ["It is colder than anyone planned for. Blankets appear, and one very large thermos.", "You all sit close and pass around a bag of something salty.", "{friend} points out the few stars the city allows, and names them wrong with great confidence.", "You walk home with cold hands and a warm chest."] },
    ],
    effects: { community: 4, wellbeing: 3, money: -15 },
    weight: 2,
    tag: 'social',
    when: affordable,
  },
  {
    id: 'club',
    label: 'Go out dancing',
    blurb: 'Loud, sweaty and a little silly.',
    stage: 'club',
    cast: [{ ...YOU, pose: 'dance' }, { role: 'friend', pose: 'dance' }, { role: 'student', pose: 'dance' }],
    scripts: [
      { lines: [
      'The bass hits you in the chest before you reach the door.',
      'You do not know the song, then you do, then everyone is singing.',
      '{friend} pulls you onto the floor and you stop thinking for the first time in weeks.',
      'You leave with ringing ears, a hoarse voice and a grin.',
      ] },
      { lines: ["The line outside moves slowly and you spend it practicing a confident face.", "Inside, the floor is sticky and the lights are every colour at once.", "{friend} shouts a joke you cannot hear and you laugh anyway.", "The walk home is quiet, your ears ringing, your shoes in your hand."] },
      { lines: ["You nearly stay in. {friend} will not hear of it.", "The DJ plays something from home and for a second the whole room is yours.", "A stranger teaches you a step, and you teach it right back to {friend}.", "You get home at three, happy and a little dizzy."] },
      { lines: ["{friend} knows the person at the door, or says so. Either way you get in.", "The first song is too fast and the second is perfect.", "You dance badly on purpose until it turns into dancing well by accident.", "Outside, the cold air feels wonderful, and you share fries on the kerb."] },
      { lines: ["Tonight is a throwback night, and half the songs are older than you are.", "{friend} knows every word. You know every third one and shout it.", "A circle opens up and for ten seconds you are in the middle of it.", "You sleep with the beat still going somewhere behind your eyes."] },
      { lines: ["You stand at the edge for two songs, holding a drink like a ticket.", "Then the bass drops, {friend} grabs your wrist, and the edge is gone.", "Nobody here cares where you are from or what is due on Monday.", "You get home with tired feet and a lighter head."] },
      { lines: ["The room is small, the ceiling is low, and the band is live.", "The drummer grins at the crowd as if you are all in on something.", "{friend} loses a shoe, finds it, and holds it up to cheers.", "You walk home humming a song you will never find again."] },
    ],
    effects: { wellbeing: 4, community: 3, money: -35 },
    weight: 1.2,
    tag: 'fun',
    when: (s) => affordable(s) && s.stats.money > 150,
  },
  {
    id: 'gym',
    label: 'Work out',
    blurb: 'Burn off the week.',
    stage: 'gym',
    cast: [{ ...YOU, pose: 'exercise' }, { role: 'friend', pose: 'exercise' }],
    scripts: [
      { lines: [
      'The gym is almost empty at this hour. Fluorescent lights hum.',
      'You count your breaths, then your reps, and the noise in your head quiets.',
      'A stranger nods at you across the weights. You nod back.',
      'You leave tired in the good way.',
      ] },
      { lines: ["You pick the treadmill by the window and watch the street lights come on.", "Your playlist shuffles into a song from school days and you pick up the pace.", "The attendant says goodnight and you realize you stayed till closing.", "Your legs shake on the stairs, and you feel strangely proud."] },
      { lines: ["Nobody here knows you, and nobody wants anything from you.", "You try a machine you do not understand until someone shows you, kindly.", "The last set is the hardest. You do it anyway.", "A hot shower, then sleep that comes quickly."] },
      { lines: ["You almost talk yourself out of it at the door, then scan your card anyway.", "The rowing machine is free. You pull until your thoughts line up behind the rhythm.", "Someone at the next machine matches your pace, and it becomes a quiet race neither of you mentions.", "You walk out into the cold with steam coming off your shoulders."] },
      { lines: ["There is a drop-in class starting, and the instructor waves you in before you can decide.", "You are a beat behind for the first ten minutes and nobody minds.", "By the end you know the routine and the names of two people.", "You leave sore, laughing, and already planning to come back."] },
      { lines: ["You bring a list tonight: three exercises, three sets, no heroics.", "The mirror shows someone a little stronger than the last time you looked.", "A regular spots you on the last lift and says, good work, like it is nothing.", "You sleep hard and wake hungry."] },
      { lines: ["The pool lane is yours for half an hour.", "Underwater there are no emails and no forms, only the count of your strokes.", "You float on your back at the end and watch the ceiling lights blur.", "Your hair is still damp when you get home, and your head is clear."] },
    ],
    effects: { wellbeing: 3, study: 1 },
    weight: 1.4,
    tag: 'fitness',
    when: inStatus,
  },
  {
    id: 'walk',
    label: 'Take a long walk',
    blurb: 'No destination, just the city.',
    stage: 'walk',
    cast: [{ ...YOU, pose: 'walk' }, { role: 'friend', pose: 'walk' }],
    scripts: [
      { lines: [
      'You walk without a plan. Streetlights come on one by one.',
      'You pass a bakery, a barbershop, a mural that makes you stop.',
      'It begins to feel like a place where someone could live.',
      'You turn back when your feet say so.',
      ] },
      { lines: ["You take a different route home just to see what is on it.", "A street vendor hands you a free sample and a map of nothing.", "You stop at a bridge and watch the lights tremble on the water.", "You get lost, find your way, and call it exploring."] },
      { lines: ["{friend} falls in step beside you, and neither of you suggests a destination.", "You compare the city to the one you grew up in, and keep finding differences you like.", "A busker plays a tune you almost know, and you wait for the chorus.", "You say goodnight at the corner where your paths split."] },
      { lines: ["You get off the bus four stops early because the evening is too good to waste.", "A whole street smells of bread, then of laundry, then of rain that has not arrived.", "You read the names on the doorbells and wonder about each one.", "By the time you reach your door you have a favourite street."] },
      { lines: ["You follow the river path until the buildings thin out.", "Runners pass you, and a man fishing nods as if you are a regular.", "You find a bench with a view and give it ten full minutes.", "The walk back is shorter, the way walks back always are."] },
      { lines: ["{friend} wants to show you a neighbourhood you have never been to.", "There is a shop that sells only buttons, and a bakery with a line out the door.", "You buy one pastry and split it, walking.", "You go home with a new corner of the city in your pocket."] },
      { lines: ["The first cold evening of the season. You turn your collar up and go anyway.", "Windows are lit, and in each one a small scene: dinner, homework, a cat.", "You think about the windows back home and who is in them tonight.", "You come in with red ears and put the kettle on."] },
    ],
    effects: { wellbeing: 2, community: 1 },
    weight: 1.6,
    tag: 'explore',
  },
  {
    id: 'call-home',
    label: 'Call home',
    blurb: 'It is already tomorrow there.',
    stage: 'apartment-night',
    variant: 'call',
    cast: [{ ...YOU, pose: 'phone' }, { role: 'parent', pose: 'talk' }],
    scripts: [
      { lines: [
      'The call connects after three tries. Your mother\'s face fills the screen.',
      'She asks if you are eating. You say yes and she looks unconvinced.',
      'Your father waves from the background, pretending not to listen.',
      'You hang up with a lump in your throat and a lighter chest.',
      ], with: 'On the phone with your mother' },
      { lines: ["Your father answers, in the middle of the news, and mutes it for you.", "He asks about money first, then pretends he asked about weather.", "Your mother takes the phone and asks the questions he forgot, all at once.", "You hang up with a list of things to remember and a warm chest."], with: "On the phone with your father" },
      { lines: ["{sibling} picks up, out of breath, and says everyone is at the neighbor's.", "They hold the camera up to show the street, the dog and your old window.", "You hear your name called from another room, and laugh.", "The call drops mid-sentence. You stare at the screen for a while."], cast: [{ role: 'player', pose: 'phone' }, { role: 'student', pose: 'wave' }], with: "On the phone with {sibling} (your sibling)" },
      { lines: ["Your grandmother has never trusted video calls, so she talks a little loudly.", "She tells you who married, who moved and whose tomato plants did well.", "She asks if you are cold. It is a different kind of question than it sounds.", "You say you are fine, and she smiles like she knows better."], with: "On the phone with your grandmother" },
      { lines: ["Your mother answers from the kitchen with the phone propped against a tin.", "She wants to know what you cooked this week, and does not accept 'things' as an answer.", "She walks you through a recipe you already know, and you let her.", "After the call you write it down anyway, in her words."], with: "On the phone with your mother" },
      { lines: ["The power is out at home, so the call is a dark screen with a candle in it.", "Your father says the generator is resting, which means it is broken.", "They take turns holding the phone close so you can see a face.", "You hang up and turn on every light in your room, just because you can."], with: "On the phone with your parents" },
      { lines: ["Your mother asks, carefully, whether you need them to send money.", "You say no too quickly. She lets a silence sit, the way she does.", "Your father changes the subject to football and you love him for it.", "After the call you open your budget and look at it for a long time."], with: "On the phone with your parents" },
      { lines: ["There was a wedding last weekend. They show you the photos one at a time.", "Everyone asked about you. Your mother told them you are doing very well.", "You look for the space in the family photo where you would have stood.", "You tell her the outfit was beautiful, and mean it."], with: "On the phone with your mother" },
      { lines: ["Your father has questions about your papers and has written them on a list.", "You explain what you can and admit what you do not know yet.", "He reads your answers back to you slowly, to be sure he has them right.", "He ends with: 'Just follow the rules there.' You promise you are trying."], with: "On the phone with your father" },
      { lines: ["{sibling} calls you first for once, which means they want something.", "It is advice: an exam, a decision, a person. You pretend to be wise.", "They tease you about your new accent and you tease them about their hair.", "Before hanging up they say, quietly, that the house is too quiet now."], cast: [{ role: 'player', pose: 'phone' }, { role: 'student', pose: 'talk' }], with: "On the phone with {sibling} (your sibling)" },
      { lines: ["Your mother has been to the doctor and says it is nothing, twice.", "You ask what the doctor actually said. She tells you about the waiting room instead.", "Your father comes on and gives you the real version in three sentences.", "You stay on the line a little longer than usual, talking about nothing."], with: "On the phone with your parents" },

    ],
    effects: { family: 4, wellbeing: 1 },
    weight: 2,
    tag: 'family',
  },
  {
    id: 'library',
    label: 'Study at the library',
    blurb: 'Quiet, lamps and a coffee going cold.',
    stage: 'library',
    cast: [{ ...YOU, pose: 'type' }, { role: 'friend', pose: 'type' }],
    scripts: [
      { lines: [
      'The library is a hush of pages and keyboards.',
      'You and {classmate} work in silence, trading a look when something clicks.',
      'The coffee goes cold. The problem finally gives.',
      'You pack up feeling like you earned the night.',
      ] },
      { lines: ["You claim the table near the radiator and spread notes into a fort.", "{classmate} sits across from you and pretends not to look at your page.", "You trade pencils, then problem sets, then a granola bar.", "The lights flicker off at closing and you both groan, then laugh."] },
      { lines: ["The fourth floor is the quiet floor. The sixth is the secret floor.", "You read the same paragraph three times, then once for real.", "A text from home, unread, waits patiently in your pocket.", "You close the laptop at midnight with something finished."] },
      { lines: ["You find a carrel by the window, where the only view is your own reflection and the dark.", "The first hour is slow. The second hour something catches, and the pages start to move.", "{classmate} slides a note across: a drawing of you asleep on your books. You are not asleep. Not quite.", "You leave with a full page of notes and the drawing folded in your pocket."] },
      { lines: ["The group study room is booked for two hours and you use every minute.", "{classmate} explains the part you were stuck on, and you explain the part they were.", "The whiteboard fills up, gets photographed, and gets wiped clean.", "Walking out, you both agree the exam now looks possible."] },
      { lines: ["A librarian helps you find a book that is not where the catalogue says it is.", "It turns out to be exactly the one you needed, with someone's old pencil notes in the margins.", "You read until the announcement that the building is closing in fifteen minutes.", "You check the book out and carry it home like something won."] },
      { lines: ["Every seat is taken, so you sit on the floor between two shelves.", "It is quiet down here, and it smells of old paper.", "You finish the reading, then the next one, because nobody can find you.", "You stand up stiff and oddly pleased with yourself."] },
    ],
    effects: { study: 2, wellbeing: -1 },
    weight: 1,
    tag: 'study',
    when: enrolled,
  },
  {
    id: 'movie',
    label: 'Movie night',
    blurb: 'Blankets, a laptop and a bad film.',
    stage: 'apartment-night',
    variant: 'movie',
    cast: [{ ...YOU, pose: 'laugh' }, { role: 'roommate', pose: 'laugh' }, { role: 'friend', pose: 'laugh' }],
    scripts: [
      { lines: [
      'Three people, one couch and a laptop propped on a pile of books.',
      'The film is terrible. You commentate and everyone laughs.',
      'Someone falls asleep halfway through, blanket up to their chin.',
      'You turn it off and sit for a while in the dark, content.',
      ] },
      { lines: ["{roommate} insists the movie is a classic. You are not convinced.", "{friend} brings microwave popcorn and burns the first bag.", "You pause it every ten minutes to argue about the plot.", "By the credits you are all quoting lines you do not like."] },
      { lines: ["You pick a film from home and explain every joke, then give up and just watch.", "{roommate} laughs at the wrong parts, and so do you.", "The laptop fan whirs. {friend} brings out a second blanket.", "You fall asleep with the credits rolling, content."] },
      { lines: ["Lights off, curtains open, the city doing its own show behind the screen.", "It is a horror film. {friend} watches most of it through a blanket.", "{roommate} guesses the ending out loud and is told to leave their own home.", "Afterwards nobody wants to be first to walk down the dark hallway."] },
      { lines: ["Subtitles on, because three accents in one room is already enough.", "You realise halfway through that you have stopped reading them.", "{roommate} passes the popcorn without looking, like family does.", "The screen goes dark and your three faces look back from it, tired and at ease."] },
      { lines: ["{friend} brings a drive full of films and strong opinions about all of them.", "You vote. You lose. You watch the long one.", "Somewhere in the second hour it becomes very good, and nobody admits it first.", "You argue about the ending all the way through washing the bowls."] },

    ],
    effects: { community: 2, wellbeing: 2, money: -10 },
    weight: 1.6,
    tag: 'social',
  },
  {
    id: 'coffee',
    label: 'Coffee with a friend',
    blurb: 'An hour of real talk.',
    stage: 'cafe',
    cast: [{ ...YOU, pose: 'talk' }, { role: 'friend', pose: 'talk' }],
    scripts: [
      { lines: [
      'The cafe smells of roasted beans and rain on the window.',
      'You talk about nothing and about everything, in the right order.',
      '{friend} listens the way you wish more people did.',
      'You walk out with an empty cup and a lighter head.',
      ] },
      { lines: ["{friend} is late and arrives apologizing, hair still wet.", "You split a pastry and a long list of worries.", "Neither of you has answers, but the talking helps.", "You leave with a plan to meet again at the same table."] },
      { lines: ["The barista spells your name wrong, and you decide to keep it.", "{friend} shows photos from home, and you show yours.", "You talk about what you miss and what you do not.", "The rain stops. You walk out feeling less alone."] },
      { lines: ["{friend} has news and makes you guess. You guess wrong four times.", "It is good news, and you are glad for them with your whole chest.", "You order a second round to celebrate, the sweet kind.", "On the way out, {friend} says you were the first person they wanted to tell."] },
      { lines: ["The only free table is the wobbly one. You fold a napkin under the leg together.", "{friend} asks how you really are, and waits for the real answer.", "It takes a while to arrive. They do not hurry it.", "You walk out having said something aloud that needed saying."] },
      { lines: ["You try the drink with the long name. It tastes like dessert.", "{friend} is planning a trip and wants your opinion on everything.", "You draw a map on a receipt and argue happily over the route.", "You leave with the receipt in your pocket and a standing invitation."] },
      { lines: ["It is busy, so you take your cups to the bench outside.", "{friend} teaches you a phrase in their language, and you teach one in yours.", "You both pronounce them badly and correct each other without mercy.", "You say goodbye using the new words."] },
    ],
    effects: { community: 2, wellbeing: 1, money: -8 },
    weight: 1.4,
    tag: 'social',
  },
  {
    id: 'park',
    label: 'An afternoon in the park',
    blurb: 'Grass, light and nothing due.',
    stage: 'park',
    cast: [{ ...YOU, pose: 'sit' }, { role: 'friend', pose: 'laugh' }],
    scripts: [
      { lines: [
      'You lie on the grass and watch clouds drift over the skyline.',
      'A dog runs past with a stick, its owner running after it.',
      'You realize you have not thought about deadlines for an hour.',
      'The light goes long and golden, and you stay a little longer.',
      ] },
      { lines: ["You bring a book and read three pages before drifting.", "Kids chase a kite across the field and it never quite takes off.", "{friend} arrives with snacks and no agenda.", "You stay until the sprinklers click on."] },
      { lines: ["A pickup game of soccer starts up and someone waves you in.", "You miss, you laugh and you play better than you expected.", "{friend} keeps score loosely, which is the best way.", "You walk home grass-stained and glad."] },
      { lines: ["There is a free concert at the bandstand, and half the neighbourhood has brought chairs.", "You sit on the grass at the back, where the music arrives a little late.", "A small child dances with total commitment, and people clap for the child as much as the band.", "You stay for the encore and walk home in the dusk."] },
      { lines: ["You bring lunch in a container and eat it slowly on a bench.", "An older man at the next bench is feeding birds and telling them about his week.", "{friend} finds you, sits down, and steals a bite without asking.", "The afternoon goes nowhere at all, which was the plan."] },
      { lines: ["Somebody has set up chess boards on the stone tables.", "A stranger beats you in twelve moves, then shows you what you missed.", "The second game lasts longer. You count that as a win.", "You shake hands and promise to come back with better openings."] },
      { lines: ["The leaves have turned, and the whole park is the colour of tea.", "{friend} has a camera and makes you stand under the brightest tree.", "You send the photo home, and the replies start before you reach the gate.", "You keep one leaf and press it in a book."] },
    ],
    effects: { wellbeing: 3 },
    weight: 1.4,
    tag: 'calm',
  },
  {
    id: 'campus-event',
    label: 'Go to a campus event',
    blurb: 'Free food, loud music, strangers.',
    stage: 'festival',
    cast: [{ ...YOU, pose: 'cheer' }, { role: 'student', pose: 'talk' }, { role: 'friend', pose: 'wave' }],
    scripts: [
      { lines: [
      'String lights and food stalls spill across the lawn.',
      'You try three snacks you cannot name and like two of them.',
      'Someone hands you a flyer and a laugh.',
      'You leave with a full stomach and a new group chat.',
      ] },
      { lines: ["A student band is playing on a flatbed truck, loud and slightly off key.", "You meet the president of a club you did not know existed.", "{friend} drags you to the dance circle and you survive it.", "You leave with a tote bag, a sticker and two new numbers."] },
      { lines: ["The international students' night has food from twenty countries on one long table.", "Someone recognizes the dish you brought and shouts, delighted.", "{friend} introduces you to people you will see again.", "You sleep well, full of other people's cooking."] },
      { lines: ["It is trivia night in the student centre, and your table needs one more.", "You know nothing about baseball and everything about capital cities.", "{friend} high-fives you so hard after the geography round that your hand stings.", "Your team comes third and celebrates like it came first."] },
      { lines: ["An outdoor film is showing on a sheet hung between two trees.", "Somebody passes down a bag of popcorn, and it never comes back.", "{friend} whispers a running commentary that is better than the film.", "You fold your blanket at the end and realise you know people here now."] },
      { lines: ["There is a cultural showcase tonight, and the hall is full an hour early.", "Dances, songs, a poem read in a language you have never heard, and all of it gets cheered.", "A group from your part of the world performs, and your throat goes tight in a good way.", "You clap until your palms hurt."] },
      { lines: ["The club fair covers the whole quad: chess, hiking, robots, a choir that is singing right now.", "You sign up for two things you will go to and one you will not.", "{friend} talks you into the hiking club by promising there is food at the top.", "Your inbox will be noisy for weeks, and you do not mind."] },
    ],
    effects: { community: 3, wellbeing: 2 },
    weight: 1.2,
    tag: 'fun',
    when: enrolled,
  },
  {
    id: 'neighbors',
    label: 'Sit with the neighbors',
    blurb: 'Stoop, tea and low voices.',
    stage: 'rooftop',
    cast: [{ ...YOU, pose: 'talk' }, { role: 'friend', pose: 'talk' }],
    scripts: [
      { lines: [
      'The neighbors have a way of making you feel expected.',
      'Someone brings out tea and a plate of something fried.',
      'Nobody asks about papers. They ask about home.',
      'The night is quiet, and you are not the only one carrying something.',
      ] },
      { lines: ["The stoop is crowded, and a kettle somehow appears from nowhere.", "Someone shows a photo of home on a cracked phone.", "Nobody offers advice. They offer a chair.", "You go back inside feeling a little less invisible."] },
      { lines: ["A neighbor fixes your door latch without being asked.", "You trade recipes and warnings about which stores to avoid.", "The conversation turns to home, to the long wait, to small hopes.", "You say goodnight in two languages."] },
      { lines: ["A neighbour's daughter is doing homework on the steps and asks you to check her maths.", "You check it. She was right, and you tell her so.", "Her mother sends you home with a covered plate and will not hear a no.", "You wash the plate that night so you can return it full."] },
      { lines: ["The power is out on the whole block, so everyone has come outside.", "Someone lights candles in jars. Someone else has a radio that runs on batteries.", "Stories come easier in the dark: first jobs, long journeys, the people waiting back home.", "When the lights come back on, nobody goes in straight away."] },
      { lines: ["An older neighbour is teaching the building's children a card game.", "You are dealt in, and lose to a nine-year-old.", "Between hands, people trade what they know: which clinic is kind, which office has an interpreter.", "You go upstairs with a short list of names and a longer sense of belonging."] },
      { lines: ["It is someone's birthday, and the cake is cut on the stoop so that everybody gets some.", "The song is sung in three languages, one after another.", "Nobody here asks what you do. They ask if you have eaten.", "You carry a paper plate up the stairs and feel looked after."] },
    ],
    effects: { community: 3, wellbeing: 2 },
    weight: 3,
    tag: 'social',
    when: (s) => Boolean(s.flags.outOfStatus),
  },
  {
    id: 'quiet-hour',
    label: 'A quiet hour alone',
    blurb: 'Breathe. Nothing is asked of you.',
    stage: 'park',
    cast: [{ ...YOU, pose: 'think' }],
    scripts: [
      { lines: [
      'You find a bench away from the paths and sit.',
      'You let your thoughts come and go without chasing them.',
      'The wind carries voices from somewhere far off.',
      'You stand up steadier than you sat down.',
      ] },
      { lines: ["You sit with your back to a tree and watch the light change.", "Your breathing slows without you telling it to.", "A squirrel investigates your shoe and gives up.", "You stand, stretch and feel ready for the next thing."] },
      { lines: ["The bench faces a pond with a few patient ducks.", "You write three words in your notes app, and they are enough.", "A stranger nods in passing. You nod back.", "You walk away lighter."] },
      { lines: ["You walk to the far end of the park, where the path turns to gravel.", "You put your phone on silent and your hands in your pockets.", "For a while you count things: birds, breaths, the bells from a church you cannot see.", "Nothing is solved, and you feel better anyway."] },
      { lines: ["There is a low wall in the sun, and you sit on it like a cat.", "You think about the person you were when you arrived, and feel some tenderness for them.", "A leaf lands on your knee and you leave it there.", "You go back to your day unhurried."] },
      { lines: ["You bring a notebook and write a letter you may never send.", "It starts with the weather and ends somewhere more honest.", "You read it once, fold it, and put it away.", "The walk home feels like setting something down."] },
      { lines: ["Early mist is still on the grass and the park is almost empty.", "You say a few words quietly, a prayer or a habit or something between the two.", "A jogger passes and lifts a hand. The quiet closes again behind them.", "You carry some of that quiet with you for the rest of the day."] },
    ],
    effects: { wellbeing: 3 },
    weight: 1.2,
    tag: 'calm',
  },
  // ------------------------------------------------------------------ romance
  {
    id: 'dating-app',
    label: 'Swipe on a dating app',
    blurb: 'See who is out there.',
    stage: 'apartment-night',
    cast: [{ ...YOU, pose: 'phone' }],
    scripts: [
      { lines: [
      'You scroll through faces and short sentences, laughing at some and wincing at others.',
      'You edit your bio three times and take it back to the first version.',
      'A message arrives from {partner}, whose picture has a dog in it.',
      'You reply, delete it and then send it again.',
      ] },
      { lines: ["You write a bio, delete it and write it again, shorter.", "Your profile picture is from a good day. You hope it still counts.", "A match arrives: {partner}, who also studies late and likes bad coffee.", "You message back before you can overthink it."] },
      { lines: ["You swipe past a dozen faces and stop at one who wrote \"looking for someone to eat dumplings with\".", "{partner} replies in under a minute.", "You talk about home, about food, about whether it is weird to message so fast.", "You put the phone down smiling."] },
      { lines: ["The app asks for six photos. You have two you like and four of food.", "You upload one of the food ones anyway.", "{partner} messages first: what is that dish, and where can I get it?", "You type out the answer, and it turns into a conversation."] },
      { lines: ["A prompt asks for your most controversial opinion. You write that tea is better than coffee.", "{partner} disagrees immediately and at length.", "The argument is so friendly that you lose track of the hour.", "You say goodnight twice before either of you logs off."] },
      { lines: ["You nearly delete the app tonight. One more look, you tell yourself.", "{partner}'s profile says: new in town, still learning the bus routes.", "You write that you are too, and that the 14 never comes on time.", "They answer with a laughing face and a question."] },
      { lines: ["You swipe with a friend's advice in your head: be yourself, but with better lighting.", "{partner} likes your photo from the park and says so plainly.", "You talk about families, and how far away both of yours are.", "You put the phone on the charger and catch yourself smiling at the ceiling."] },
    ],
    effects: { wellbeing: 1 },
    weight: 1.6,
    tag: 'romance',
    when: (s) => s.profile.marital === 'single' && !s.flags.dating,
    after: (_s, rng) =>
      rng() < 0.38 ? { text: '{partner} suggests meeting, and you say yes before you can overthink it.', effects: { wellbeing: 2, flags: { dating: true } } } : null,
  },
  {
    id: 'first-date',
    label: 'A first date',
    blurb: 'Nervous, hopeful and slightly overdressed.',
    stage: 'cafe',
    cast: [{ ...YOU, pose: 'talk' }, { role: 'partner', pose: 'laugh' }],
    scripts: [
      { lines: [
      'You arrive early and rehearse three opening lines you will not use.',
      '{partner} arrives and the first lines you prepared vanish. You talk about home, about food, about nothing.',
      'The coffee goes cold. Nobody notices.',
      'You walk out into the evening, both pretending the night is not over.',
      ] },
      { lines: ["You pick a place that is not too loud and not too quiet, and you arrive early again.", "{partner} laughs at your first joke, which is brave of them.", "The conversation finds a thread and follows it for two hours.", "You say goodnight like it is a beginning."] },
      { lines: ["Rain ruins the plan, so you duck into a tiny noodle shop.", "{partner} orders for both of you and gets it exactly wrong, charmingly.", "You trade stories about leaving home, and nobody pretends it was easy.", "You walk to the station under one umbrella."] },
      { lines: ["You change your shirt twice and end up in the first one.", "{partner} is already there, standing to greet you, just as nervous.", "You find out you both hate the same famous film, and it feels like a secret.", "Neither of you looks at a phone for two hours."] },
      { lines: ["The cafe is full, so you share a table with a stranger doing a crossword.", "{partner} helps the stranger with seven across, and you like them a little more for it.", "The talk wanders from work to childhood to what each of you eats when nobody is watching.", "At the door you both start to say the same thing, and laugh."] },
      { lines: ["You are ten minutes late, and you arrive with an apology and wet shoes.", "{partner} has ordered you something warm and guessed right.", "You ask each other the big questions carefully and the small ones freely.", "You go home replaying it, and you find nothing you would take back."] },
      { lines: ["{partner} admits straight away to being nervous, and that makes it easy.", "You talk about the places you grew up, drawing streets on the table with a finger.", "The staff start stacking chairs, and you pretend not to notice.", "Outside you linger, and agree on a day."] },
    ],
    effects: { wellbeing: 4, community: 1, money: -25 },
    weight: 3,
    tag: 'romance',
    when: (s) => Boolean(s.flags.dating) && !s.flags.dated && s.stats.money > -400,
    after: () => ({ text: 'You and {partner} agree to see each other again.', effects: { flags: { dated: true } } }),
  },
  {
    id: 'date-night',
    label: 'A romantic dinner',
    blurb: 'Candles, good food and time just for two.',
    stage: 'rooftop',
    cast: [{ ...YOU, pose: 'laugh' }, { role: 'partner', pose: 'laugh' }],
    scripts: [
      { lines: [
      'Candles in jars, string lights overhead and the skyline lit up in the distance.',
      'You split a dessert and fight over the last bite.',
      '{partner} tells you something never told to anyone else, and you hold it carefully.',
      'The city hums below, and for a while it belongs to the two of you.',
      ] },
      { lines: ["You cook, badly, and {partner} eats it kindly.", "You pour something cheap into two good glasses.", "You talk about next year, carefully, like handling glass.", "The dishes wait. So does the rest of the world."] },
      { lines: ["A small restaurant, one candle and a menu in a language you both half-read.", "{partner} reaches over to steal a bite from your plate.", "You talk about the future in the conditional tense, then drop the condition.", "You walk home the long way."] },
      { lines: ["{partner} has found a place with six tables and no sign outside.", "The owner brings a dish you did not order and says to try it.", "You talk about your families, and what they would make of each other.", "You split the bill and the last spoonful."] },
      { lines: ["A picnic on the roof: a blanket, bread, and fruit cut with a borrowed knife.", "{partner} has made a playlist and is shy about it.", "One song is from your country, and they have learned the chorus.", "You stay until the food is gone and the city has gone quiet."] },
      { lines: ["It is the anniversary of the day you met, by one way of counting.", "{partner} counts it another way, so you agree to celebrate twice.", "You dress up for a restaurant that is a little too expensive and entirely worth it.", "You walk home arm in arm, full and unhurried."] },
      { lines: ["Both of you have had a hard week, and neither of you hides it.", "Dinner is simple. The talk is honest.", "{partner} reaches across the table and holds your hand until the plates are cleared.", "The week feels smaller by the time the bill comes."] },
    ],
    effects: { wellbeing: 5, community: 1, money: -45 },
    weight: 2,
    tag: 'romance',
    when: (s) => hasPartner(s) && s.stats.money > -300,
  },
  {
    id: 'kiss',
    label: 'Kiss under the streetlights',
    blurb: 'Slow down and stay close.',
    stage: 'walk',
    cast: [{ ...YOU, pose: 'talk' }, { role: 'partner', pose: 'talk' }],
    scripts: [
      { lines: [
      'You walk slowly beside {partner}, and your hands find each other without asking.',
      'You stop under a streetlight and neither of you moves away.',
      'Leaves rustle. The kiss is soft, then long, then it is just a smile in the dark.',
      'You walk home slower than you came.',
      ] },
      { lines: ["Rain starts, and {partner} pulls you under an awning.", "The street goes quiet around the two of you.", "The first kiss is brief and surprised, the second is not.", "You walk home with the feeling still in your chest."] },
      { lines: ["You say goodnight at the door and neither of you opens it.", "{partner} tucks your scarf in properly.", "The kiss is slow and certain.", "You climb the stairs two at a time."] },
      { lines: ["The last train has gone, so you walk, and neither of you is sorry.", "{partner} stops on the bridge to look at the water.", "You kiss with the whole city reflected below you.", "The rest of the walk passes in a pleasant blur."] },
      { lines: ["It starts to snow, the first of the year.", "{partner} catches a flake on a glove and holds it out for you to see.", "You kiss with cold noses and warm mouths.", "You go home with snow melting in your hair."] },
      { lines: ["{partner} is in the middle of a story and you are only half listening, in the best way.", "They notice, stop, and smile.", "The kiss finishes the sentence.", "They never do get to the end of the story."] },
      { lines: ["You have been apart for two weeks, and the station clock has been slow all evening.", "{partner} comes through the gate, looking for you.", "You kiss before either of you says hello.", "You carry their bag, and they hold your other hand the whole way home."] },
    ],
    effects: { wellbeing: 4 },
    weight: 2,
    tag: 'romance',
    when: hasPartner,
  },
  {
    id: 'night-together',
    label: 'Spend the night together',
    blurb: 'Close the door and turn off the phone.',
    stage: 'apartment-night',
    cast: [{ ...YOU, pose: 'sit' }, { role: 'partner', pose: 'sit' }],
    scripts: [
      { lines: [
      'A lamp, a quiet apartment, {partner} beside you and the sound of rain.',
      'You talk for a long time and then not at all.',
      'The door closes on the rest of the night. It belongs to the two of you.',
      'In the morning someone makes coffee and neither of you is in a hurry.',
      ] },
      { lines: ["{partner} stays, and the apartment sounds different with two people in it.", "You talk until the talking runs out, and then it is easy.", "The lamp goes off, the rain keeps on, the city keeps its own business.", "In the morning, you share one mug of coffee."] },
      { lines: ["You make tea, and neither of you drinks it.", "The night is private and tender and nobody else's business.", "You fall asleep to the sound of someone else breathing.", "Sunlight, toast, a note that says thank you in two languages."] },
      { lines: ["You cook together in a kitchen meant for one, bumping elbows.", "{partner} falls asleep on your shoulder before the film is halfway through.", "You turn it off and let the quiet stand.", "In the morning there are two toothbrushes in the cup."] },
      { lines: ["It is storming, and {partner} cannot go home in this. You are both glad.", "You lie awake talking about the houses you grew up in, room by room.", "The night is yours, and stays between the two of you.", "The storm has cleared by breakfast."] },
      { lines: ["{partner} reads to you from a book in their language, translating as they go.", "You catch about half of it and love all of it.", "The lamp goes out. What follows is nobody's business but yours.", "You wake to the smell of something frying."] },
      { lines: ["A long day ends with the door locked and both phones in a drawer.", "You tell each other the plain truth about how you are.", "You fall asleep slowly, hand in hand.", "Morning comes, and the day is easier to face."] },
    ],
    effects: { wellbeing: 5 },
    weight: 1.6,
    tag: 'romance',
    when: hasPartner,
  },
  // ------------------------------------------------------------------ side income
  {
    id: 'rideshare',
    label: 'Drive rideshare for a few hours',
    blurb: 'Quick cash behind the wheel.',
    stage: 'street',
    cast: [{ ...YOU, pose: 'idle' }, { role: 'stranger', pose: 'idle' }],
    scripts: [
      { lines: [
      'You log in and the app finds you a passenger within a minute.',
      'A passenger asks where you are from and what brought you here, and tips more than you expected.',
      'Another stays silent the whole way and leaves the car smelling of perfume.',
      'You count the money in the glovebox and tell yourself it was only a few hours.',
      ] },
      { lines: ["The first fare is a nurse heading home from a long shift, and she tips well.", "You learn which corners are quiet at ten at night.", "A rowdy group climbs in, and you take the long road to keep the peace.", "You park and count what you made, and what the gas cost."] },
      { lines: ["The app pings, and the passenger is waiting in the rain.", "A man on his way to the airport tells you about his daughter's wedding.", "You get lost once and the GPS pretends it was your idea.", "You log off with sore shoulders and a bit more cash."] },
      { lines: ["Friday night, and the map is glowing with requests.", "Two students in the back seat argue about a film, then ask you to settle it.", "A quiet woman with groceries thanks you by name when she gets out.", "At the end you add it up: the fares, the fuel, the hours."] },
      { lines: ["You start at the airport queue and wait forty minutes for a single ride.", "The passenger has been flying for a full day and falls asleep before the first light.", "You drive carefully and wake him gently outside his door.", "The tip arrives later, with a note that says thank you for the quiet."] },
      { lines: ["Rain pushes the prices up, and you stay out longer than you meant to.", "A chef heading home after closing tells you where to find the best late food in the city.", "Your eyes get heavy around midnight, and you call it a night there.", "The money helps. You would rather it came some other way."] },
      { lines: ["A passenger asks how long you have been driving, and you say not long.", "She says her father drove a cab for thirty years and put three children through school.", "You think about that for the rest of the shift.", "You park, stretch, and count the notes twice."] },
    ],
    effects: { money: 95, wellbeing: -1, flags: { sideGig: true } },
    lookback:
      'Driving for a rideshare app is work. An F-1 student needs prior authorization for off-campus work (8 CFR 214.2(f)(9)); an H-1B or O-1 worker may work only for the employer that petitioned (8 CFR 214.2(h)(2)(i)(C)); a visitor may not work at all. Unauthorized employment counts as not maintaining status (8 CFR 214.1(e)). For someone already out of status, it is unauthorized work and an added risk. Quick cash can carry a slow cost.',
    weight: 1.1,
    tag: 'work',
    when: (s) => s.stats.money < 900 && !s.flags.arrested,
  },
];

/** Pick up to three activities of different kinds that fit the player's situation. */
export function pickActivities(state: GameState, rng: () => number, n = 3): Activity[] {
  const pool = ACTIVITIES.filter((a) => !a.when || a.when(state));
  const chosen: Activity[] = [];
  const tags = new Set<string>();
  while (chosen.length < n && pool.length) {
    const candidates = pool.filter((a) => !chosen.includes(a) && !tags.has(a.tag));
    const list = candidates.length ? candidates : pool.filter((a) => !chosen.includes(a));
    if (!list.length) break;
    const total = list.reduce((s, a) => s + a.weight, 0);
    let r = rng() * total;
    let pick = list[list.length - 1];
    for (const a of list) {
      r -= a.weight;
      if (r <= 0) {
        pick = a;
        break;
      }
    }
    chosen.push(pick);
    tags.add(pick.tag);
  }
  return chosen;
}

/**
 * Pick one of the activity's scripts. Every script is used once before any comes round again, and the
 * same one never plays twice running, so each evening of the same kind is a different evening.
 */
export function pickScript(a: Activity, state: GameState, rng: () => number): Script {
  if (a.scripts.length === 1) return withCountry(a, a.scripts[0], 0, state);
  const lastKey = `lv_${a.id}`;
  const usedKey = `lu_${a.id}`;
  const last = Number(state.flags[lastKey] ?? -1);
  let used = Number(state.flags[usedKey] ?? 0);
  const all = a.scripts.map((_, i) => i);
  let options = all.filter((i) => !(used & (1 << i)) && i !== last);
  if (!options.length) {
    used = 0;
    options = all.filter((i) => i !== last);
  }
  const idx = options[Math.floor(rng() * options.length)];
  state.flags[lastKey] = idx;
  state.flags[usedKey] = used | (1 << idx);
  return withCountry(a, a.scripts[idx], idx, state);
}

/** The first cooking and call-home scripts come from the home country's culture file. */
function withCountry(a: Activity, sc: Script, idx: number, state: GameState): Script {
  if (idx !== 0) return sc;
  const cu = cultureOf(state.profile.country);
  if (!cu) return sc;
  if (a.id === 'cook') return { ...sc, lines: [...cu.foods.cookLines] };
  if (a.id === 'call-home') return { ...sc, lines: [...cu.familyCall] };
  return sc;
}

/** Blurb shown on the evening menu, with country detail where it matters. */
export function blurbOf(a: Activity, state: GameState): string {
  if (a.id === 'call-home') return cultureOf(state.profile.country)?.timeDifference ?? a.blurb;
  return a.blurb;
}
