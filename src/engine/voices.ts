/**
 * Recorded voices. Every spoken line is recorded ahead of time with ElevenLabs (scripts/gen_voices.mjs);
 * the game never makes up a voice on the device. Each person gets a steady voice: people in fixed jobs
 * (the officer, the landlord) always sound the same, and the people around the player (friend, roommate,
 * partner, classmate) get a voice that matches whoever is cast in the part, a woman or a man.
 *
 * A clip is named after its voice and a hash of the exact words, so a line that is edited later, or one
 * with a name filled in, simply has no clip and shows as a speech bubble for reading time instead.
 */

export interface VoiceDef {
  /** ElevenLabs voice id. */
  id: string;
  /** For people reading the code. */
  name: string;
}

export const VOICES: Record<string, VoiceDef> = {
  officer: { id: 'pqHfZKP75CvOlQylNhV4', name: 'Bill' },
  dso: { id: 'XrExE9yKIg1WjnnlVkGX', name: 'Matilda' },
  advisor: { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah' },
  professor: { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George' },
  landlord: { id: 'nPczCjzI2devNBz1zQrb', name: 'Brian' },
  doctor: { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel' },
  nurse: { id: 'cjVigY5qzO86Huf0OWal', name: 'Eric' },
  recruiter: { id: 'hpp4J3VqNfWAUOO0d1Us', name: 'Bella' },
  owner: { id: 'Xb7hH8MSUJpSbSDYk0k2', name: 'Alice' },
  teller: { id: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Liam' },
  stranger: { id: 'IKne3meq5aSn9XLyUdCD', name: 'Charlie' },
  parent: { id: 'XB0fDUnXU5powFXDhCwa', name: 'Charlotte' },
  // The people around the player: two voices each for women and men, so a friend and a classmate in the
  // same scene do not sound alike.
  'peer1-f': { id: 'cgSgspJ2msm6clMCkdW9', name: 'Jessica' },
  'peer1-m': { id: 'bIHbv24MWmeRgasZH58o', name: 'Will' },
  'peer2-f': { id: 'FGY2WhTYpPnrIDTdsKH5', name: 'Laura' },
  'peer2-m': { id: 'iP95p4xoKVk53GoZ742B', name: 'Chris' },
  // The player: a voice of their own, a woman's or a man's to match the character.
  'you-f': { id: 'pFZP5JQG7iQjIQuC4Bku', name: 'Lily' },
  'you-m': { id: 'N2lVS1w4EtoT3dr4eOWO', name: 'Callum' },
  // Anyone else in a job: a clear voice that matches the person.
  'other-f': { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah' },
  'other-m': { id: 'cjVigY5qzO86Huf0OWal', name: 'Eric' },
};

const PEER1 = new Set(['friend', 'roommate']);
const PEER2 = new Set(['student', 'partner', 'spouse', 'classmate', 'sibling']);

/** The voice a person speaks with. Null for narration, which is read, not heard. */
export function voiceSlot(role: string, sex: 'f' | 'm' | null): string | null {
  if (role === 'narrator') return null;
  if (role === 'player') return `you-${sex ?? 'f'}`;
  if (VOICES[role]) return role;
  const s = sex ?? 'f';
  if (PEER1.has(role)) return `peer1-${s}`;
  if (PEER2.has(role)) return `peer2-${s}`;
  return `other-${s}`;
}

/** Roles whose voice depends on who is cast: lines they speak are recorded in both a woman's and a man's voice. */
export function slotsFor(role: string): string[] {
  if (role === 'narrator') return [];
  if (role === 'player') return ['you-f', 'you-m'];
  if (VOICES[role]) return [role];
  return [voiceSlot(role, 'f') as string, voiceSlot(role, 'm') as string];
}

/** Short, stable hash of the exact words of a line. */
export function textHash(text: string): string {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return (h >>> 0).toString(16).padStart(8, '0');
}

export function clipName(slot: string, text: string): string {
  return `${slot}-${textHash(text)}`;
}
