import { createSeededRandom } from '../utils/random';
import { cultureOf } from './country';
import type { CastSpec, GameState, Role } from './types';

/**
 * The recurring people in the player's life. Names are fixed for the whole game
 * from its seed, so the roommate in the kitchen is the same roommate who shows up
 * in a later card. Names are illustrative and not tied to real individuals.
 */
export interface Person {
  name: string;
  female: boolean;
}

interface Pool {
  name: string;
  female: boolean;
}

const POOL: Pool[] = [
  { name: 'Priya', female: true },
  { name: 'Ananya', female: true },
  { name: 'Meera', female: true },
  { name: 'Kavya', female: true },
  { name: 'Divya', female: true },
  { name: 'Maya', female: true },
  { name: 'Jasmine', female: true },
  { name: 'Elena', female: true },
  { name: 'Aisha', female: true },
  { name: 'Grace', female: true },
  { name: 'Sofia', female: true },
  { name: 'Arjun', female: false },
  { name: 'Rohan', female: false },
  { name: 'Vikram', female: false },
  { name: 'Karan', female: false },
  { name: 'Aditya', female: false },
  { name: 'Daniel', female: false },
  { name: 'Marcus', female: false },
  { name: 'Omar', female: false },
  { name: 'Chen', female: false },
  { name: 'Jamal', female: false },
  { name: 'Tyler', female: false },
];

const SIBLINGS: Pool[] = [
  { name: 'Riya', female: true },
  { name: 'Neha', female: true },
  { name: 'Sanjana', female: true },
  { name: 'Aarav', female: false },
  { name: 'Ishaan', female: false },
  { name: 'Rahul', female: false },
];

export interface People {
  roommate: Person;
  friend: Person;
  classmate: Person;
  partner: Person;
  sibling: Person;
}

const cache = new Map<string, People>();

export function peopleFor(state: GameState): People {
  const custom = state.profile.names ?? {};
  const cacheKey = `${state.seed}|${JSON.stringify(custom)}`;
  const hit = cache.get(cacheKey);
  if (hit) return hit;
  const rng = createSeededRandom(state.seed ^ 0x51ed27);
  const used = new Set<string>();
  const take = (list: Pool[], filter?: (p: Pool) => boolean): Person => {
    const avail = list.filter((p) => !used.has(p.name) && (!filter || filter(p)));
    const pick = avail[Math.floor(rng() * avail.length)] ?? list[0];
    used.add(pick.name);
    return { name: pick.name, female: pick.female };
  };
  const sex = state.profile.sex;
  const sameSex = (p: Pool): boolean => (sex === 'other' ? true : (sex === 'female') === p.female);
  // Names from home for family and most roommates; a mix of home and other names for friends and partners.
  const cu = cultureOf(state.profile.country);
  const home: Pool[] = cu
    ? [...cu.names.female.map((name) => ({ name, female: true })), ...cu.names.male.map((name) => ({ name, female: false }))]
    : [...SIBLINGS, ...POOL.slice(0, 5), ...POOL.slice(11, 16)];
  const intl = POOL.filter((p) => !home.some((h) => h.name === p.name));
  const mixed = [...home, ...intl];
  const people: People = {
    roommate: take(rng() < 0.6 ? home : mixed, sameSex),
    friend: take(mixed),
    classmate: take(mixed),
    partner: take(mixed),
    sibling: take(home),
  };
  // Names the player typed in setup replace the random ones.
  for (const k of ['roommate', 'friend', 'classmate', 'partner', 'sibling'] as const) {
    // Names are placed into page HTML, so markup and brace characters are removed.
    const typed = (custom[k] ?? '').replace(/[<>&"'`{}\\]/g, '').trim().slice(0, 16);
    if (typed) people[k] = { ...people[k], name: typed };
  }
  cache.set(cacheKey, people);
  return people;
}

/** Replace {roommate}, {friend}, {classmate}, {partner}, {sibling} with this game's names. */
export function fill(text: string, state: GameState): string {
  if (!text.includes('{')) return text;
  const p = peopleFor(state);
  return text.replace(/\{(roommate|friend|classmate|partner|sibling)\}/g, (_m, k: keyof People) => p[k].name);
}

/** "With Priya (your roommate) and Daniel (your friend)" for the people on screen. */
export function withLine(cast: CastSpec[], state: GameState): string {
  const p = peopleFor(state);
  const m = state.profile.marital;
  const label = (role: Role): string | null => {
    switch (role) {
      case 'roommate':
        return `${p.roommate.name} (your roommate)`;
      case 'friend':
        return `${p.friend.name} (your friend)`;
      case 'student':
        return `${p.classmate.name} (a classmate)`;
      case 'partner':
        return m === 'married'
          ? `${p.partner.name} (your spouse)`
          : state.flags.dating || m === 'partnered'
            ? `${p.partner.name} (${m === 'partnered' ? 'your partner' : 'your date'})`
            : `${p.partner.name} (a date)`;
      case 'spouse':
        return `${p.partner.name} (your spouse)`;
      default:
        return null;
    }
  };
  const seen: string[] = [];
  for (const c of cast) {
    const l = label(c.role);
    if (l && !seen.includes(l)) seen.push(l);
  }
  return seen.length ? `With ${seen.join(', ')}` : '';
}
