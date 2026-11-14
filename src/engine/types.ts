export type Sex = 'female' | 'male' | 'other';
export type Marital = 'single' | 'married' | 'partnered';
export type Lifestyle = 'frugal' | 'balanced' | 'comfortable';
export type Housing = 'shared' | 'studio' | 'relatives';
export type Funding = 'family' | 'loan' | 'scholarship' | 'assistantship';
export type Reality = 'hopeful' | 'honest' | 'hard';
export type CommuteMode = 'walk' | 'bike' | 'transit' | 'car' | 'rideshare';
export type CityId = 'nyc' | 'la' | 'houston' | 'bayarea' | 'dallas' | 'chicago' | 'dc' | 'atlanta';
/** How you entered the US (chosen in setup). */
export type StatusId = 'F1' | 'H1B' | 'B2' | 'O1' | 'FAM' | 'EWI' | 'ASY';
export type Country =
  | 'nigeria' | 'ghana' | 'ethiopia' | 'kenya' | 'egypt'
  | 'india' | 'china' | 'philippines' | 'vietnam' | 'south-korea'
  | 'united-kingdom' | 'germany' | 'ukraine' | 'poland' | 'italy'
  | 'mexico' | 'canada' | 'guatemala' | 'el-salvador' | 'dominican-republic'
  | 'brazil' | 'colombia' | 'venezuela' | 'peru' | 'ecuador'
  | 'australia' | 'new-zealand' | 'fiji' | 'tonga' | 'samoa';
/** Your immigration status right now (changes during play). NONE means no lawful status. */
export type StatusCode =
  | 'F1' | 'OPT' | 'STEM_OPT' | 'H1B' | 'O1' | 'B2' | 'LPR' | 'CITIZEN'
  | 'ASY_PENDING' | 'ASYLEE' | 'AOS_PENDING' | 'NONE';
export type StatKey = 'study' | 'career' | 'legal' | 'family' | 'wellbeing' | 'community';
export type Track = 'status' | 'life' | 'work' | 'study' | 'era' | 'big';
export type Confidence = 'CONFIRMED' | 'LIKELY' | 'UNVERIFIED';

export interface Profile {
  name: string;
  age: number;
  sex: Sex;
  marital: Marital;
  country: Country;
  status: StatusId;
  cityId: CityId;
  arrivalYear: number;
  funding: Funding;
  housing: Housing;
  lifestyle: Lifestyle;
  reality: Reality;
  commute: CommuteMode;
  /** Optional names for the people in your life; blank means a random name. */
  names?: Partial<Record<'roommate' | 'friend' | 'classmate' | 'partner' | 'sibling', string>>;
}

export interface Stats {
  money: number;
  study: number;
  career: number;
  legal: number;
  family: number;
  wellbeing: number;
  community: number;
}

export type Flags = Record<string, boolean | number | string>;

export interface Effects {
  money?: number;
  study?: number;
  career?: number;
  legal?: number;
  family?: number;
  wellbeing?: number;
  community?: number;
  debt?: number;
  flags?: Flags;
}

export interface Mod {
  stat: StatKey | 'money';
  center: number;
  per: number;
  label: string;
}

export interface FlagMod {
  flag: string;
  delta: number;
  label: string;
}

export interface Roll {
  base: number;
  mods?: Mod[];
  flagMods?: FlagMod[];
}

export type StageId =
  | 'airport'
  | 'intl-office'
  | 'classroom'
  | 'lab'
  | 'apartment'
  | 'apartment-night'
  | 'cafe'
  | 'clinic'
  | 'conference'
  | 'festival'
  | 'park'
  | 'library'
  | 'careerfair'
  | 'street'
  | 'bank'
  | 'campus'
  // Between-task activity scenes:
  | 'bedroom'
  | 'kitchen'
  | 'club'
  | 'gym'
  | 'rooftop'
  | 'walk'
  // Scenes for the work, family and humanitarian routes (painted backdrops; a similar coded room is the fallback):
  | 'court'
  | 'uscis'
  | 'workplace'
  | 'shelter'
  | 'worksite'
  | 'legal';

export type Role =
  | 'player'
  | 'officer'
  | 'dso'
  | 'professor'
  | 'advisor'
  | 'roommate'
  | 'friend'
  | 'landlord'
  | 'doctor'
  | 'nurse'
  | 'recruiter'
  | 'parent'
  | 'partner'
  | 'spouse'
  | 'stranger'
  | 'owner'
  | 'student'
  | 'teller';

export type Pose =
  | 'idle'
  | 'talk'
  | 'sit'
  | 'wave'
  | 'phone'
  | 'walk'
  | 'type'
  | 'think'
  | 'carry'
  | 'present'
  | 'cheer'
  | 'sleep'
  | 'dance'
  | 'cook'
  | 'eat'
  | 'exercise'
  | 'laugh'
  /** Cricket and other bat-and-ball games: batting (bat in hand), bowling (ball in hand), fielding (ready crouch). */
  | 'bat'
  | 'bowl'
  | 'field';

export interface CastSpec {
  role: Role;
  pose?: Pose;
  /** Optional index into the stage's layout slots; defaults to the next free slot. */
  slot?: number;
}

export interface Outcome {
  text: string;
  effects: Effects;
  /** Internal scoring only; never shown to the player during play. */
  passed: boolean;
  /** A gentle aside shown when a decision was not good enough. Never says "failed". */
  comment?: string;
  /** Revealed in the end-of-year review: what the decision really meant. */
  lookback?: string;
  /** Ends the journey by this route (for example choosing to go home). */
  ends?: 'went-home';
}

export interface PivotOption {
  id: string;
  label: string;
  note?: string;
}

/** A crossroads: something big has happened and the journey does not simply end. */
export interface Pivot {
  kind: 'status-lost' | 'dismissed' | 'broke' | 'burnout';
  title: string;
  body: string;
  stage: StageId;
  options: PivotOption[];
}

export interface Choice {
  id: string;
  label: string;
  note?: string;
  roll?: Roll;
  success: Outcome;
  fail?: Outcome;
}

/** One spoken line in a scene: shown as a speech bubble over the speaker, with an optional recorded voice. */
export interface Line {
  who: Role;
  text: string;
  /** Audio file under public/assets/voice/, without extension. Player lines are never voiced. */
  voice?: string;
}

export interface Challenge {
  id: string;
  track: Track;
  title: string;
  body: string;
  /** When set, the scene plays these as speech bubbles and the card shows `narration` instead of `body`. */
  lines?: Line[];
  /** A short line for what nobody says out loud; used with `lines`. */
  narration?: string;
  choices: Choice[];
  /** 3D setting for this card and the people in it. */
  stage?: StageId;
  cast?: CastSpec[];
  /** Id of a fact card in india-f1.json. */
  fact?: string;
  /** A fact built on the fly, for example a policy event with its own source. */
  inlineFact?: Fact;
}

export interface ChallengeDef {
  id: string;
  track: Track;
  weight: number;
  months?: number[];
  when?: (s: GameState) => boolean;
  /** Only drawn while the current status (flags.status) is one of these. Omit for cards that fit anyone. */
  statuses?: StatusCode[];
  /** An urgent card (weight 20+) may come back this many months after it was last shown. */
  repeatAfter?: number;
  /** Chance this card is in the running in a given year (0 to 1). Use for rare events such as layoffs. */
  oddsPerYear?: number;
  /** Only drawn for these home countries. Omit for all. */
  countries?: Country[];
  build: (s: GameState) => Challenge;
}

export interface ScheduleItem {
  /** -1 is arrival day, 0 is the first month (August). */
  month: number;
  /** 0 early, 1 mid, 2 late in the month (arrival cards use 0 to 2 as well). */
  slot: number;
  /** True on the last card of a month; the month-end budget runs here. */
  last: boolean;
  def: ChallengeDef;
}

export interface LogEntry {
  month: number;
  title: string;
  track: Track;
  choice: string;
  passed: boolean;
  text: string;
  comment?: string;
  lookback?: string;
  deltas: Partial<Record<keyof Stats, number>>;
  /** Which year of the journey (0 is the first). */
  year?: number;
  oddsPct?: number;
  breakdown?: string[];
}

export interface Ending {
  id: string;
  title: string;
  kind: 'success' | 'mixed' | 'failed';
  text: string;
  tips: string[];
}

/** One change to the player's money, so the balance can always be explained. */
export interface LedgerEntry {
  year: number;
  month: number;
  kind: 'event' | 'evening' | 'monthly' | 'help';
  label: string;
  amount: number;
}

/** Opening balance plus itemised changes equals closing balance. `other` is any remainder (normally 0). */
export interface Statement {
  opening: number;
  lines: LedgerEntry[];
  closing: number;
  other: number;
}

export interface GameState {
  profile: Profile;
  seed: number;
  index: number;
  stats: Stats;
  debt: number;
  flags: Flags;
  log: LogEntry[];
  schedule: ScheduleItem[];
  ended: Ending | null;
  /** 0 for the first year. */
  year: number;
  startYear: number;
  ledger: LedgerEntry[];
  stmt: { open: number; from: number };
}

export interface ResultView {
  passed: boolean;
  /** A gentle aside when the decision was not good enough, or null. */
  comment: string | null;
  text: string;
  deltas: Partial<Record<keyof Stats, number>>;
  oddsPct: number | null;
  rolled: boolean;
  breakdown: string[];
  budget: BudgetLine[];
  /** Set on the last card of a month: every money change since the last statement. */
  statement: Statement | null;
  ending: Ending | null;
  /** When set, the UI shows a crossroads before moving on. */
  pivot: Pivot | null;
}

export interface BudgetLine {
  label: string;
  amount: number;
  estimate: boolean;
}

export interface Fact {
  id: string;
  title: string;
  text: string;
  source: string;
  confidence: Confidence | string;
  estimate: boolean;
}
