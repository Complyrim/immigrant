#!/usr/bin/env node
/**
 * Records every spoken line in the game with ElevenLabs (eleven_v3), one clip per line per voice, into
 * public/assets/voice/<voice>-<hash>.mp3, then rewrites src/data/voice-clips.json with the clips that exist.
 *
 *   node scripts/gen_voices.mjs --dry            count lines and characters per voice; spends nothing
 *   node scripts/gen_voices.mjs --budget 5000    record at most this many characters, then stop
 *   node scripts/gen_voices.mjs                  record everything still missing
 *
 * Lines are read straight from the source ({ who: '...', text: '...' } objects under src/engine). Lines with
 * a name filled in at play time ({roommate}, ${...}) cannot be recorded ahead and stay speech bubbles.
 * The player's own lines are never voiced. Clips that already exist are skipped, so it can be re-run.
 * The API key is read from the hub's credentials file and never written anywhere.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public/assets/voice');
const listFile = join(root, 'src/data/voice-clips.json');
const args = process.argv.slice(2);
const dry = args.includes('--dry');
const bi = args.indexOf('--budget');
const budget = bi >= 0 ? Number(args[bi + 1]) : Infinity;

// The voice table lives in TypeScript; read it with a tiny parse so this script needs no build step.
const vsrc = readFileSync(join(root, 'src/engine/voices.ts'), 'utf8');
const VOICES = {};
for (const m of vsrc.matchAll(/'?([\w-]+)'?: \{ id: '(\w+)', name: '(\w+)' \}/g)) VOICES[m[1]] = { id: m[2], name: m[3] };
const PEER1 = new Set(['friend', 'roommate']);
const PEER2 = new Set(['student', 'partner', 'spouse', 'classmate', 'sibling']);
const slotsFor = (role) => {
  if (role === 'player' || role === 'narrator') return [];
  if (VOICES[role]) return [role];
  const k = PEER1.has(role) ? 'peer1' : PEER2.has(role) ? 'peer2' : 'other';
  return [`${k}-f`, `${k}-m`];
};
const textHash = (text) => {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return (h >>> 0).toString(16).padStart(8, '0');
};

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.ts') ? [p] : [];
  });
}

const LINE = /\{\s*who:\s*'(\w+)',\s*text:\s*('(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|"(?:\\.|[^"\\])*")/g;
const jobs = new Map();
let skippedNamed = 0;
for (const file of walk(join(root, 'src/engine'))) {
  for (const m of readFileSync(file, 'utf8').matchAll(LINE)) {
    const [, who, lit] = m;
    if (lit.includes('${') || /\{\w+\}/.test(lit)) {
      skippedNamed++;
      continue;
    }
    const text = Function(`return ${lit}`)();
    for (const slot of slotsFor(who)) {
      const name = `${slot}-${textHash(text)}`;
      if (!jobs.has(name)) jobs.set(name, { name, slot, text, who });
    }
  }
}

const all = [...jobs.values()];
const missing = all.filter((j) => !existsSync(join(outDir, `${j.name}.mp3`)));
const per = {};
for (const j of missing) per[j.slot] = (per[j.slot] ?? 0) + j.text.length;
const chars = missing.reduce((n, j) => n + j.text.length, 0);
console.log(`${all.length} clips in all, ${missing.length} still to record, ${chars} characters. ${skippedNamed} lines carry a name and stay bubbles.`);
console.log(Object.entries(per).sort((a, b) => b[1] - a[1]).map(([s, n]) => `  ${s.padEnd(10)} ${VOICES[s]?.name.padEnd(10)} ${n}`).join('\n'));

function writeList() {
  const have = existsSync(outDir) ? readdirSync(outDir).filter((f) => f.endsWith('.mp3')).map((f) => f.slice(0, -4)) : [];
  const valid = new Set(all.map((j) => j.name));
  const list = have.filter((n) => valid.has(n)).sort();
  writeFileSync(listFile, `${JSON.stringify(list, null, 0)}\n`);
  console.log(`voice-clips.json: ${list.length} clips listed.`);
}

if (dry) process.exit(0);

const cred = readFileSync(resolve(root, '../../.agents/credentials/elevenlabs.txt'), 'utf8');
const key = (cred.match(/^ELEVENLABS_API_KEY=(\S+)/m) ?? [])[1];
if (!key || key.length !== 51) throw new Error('ElevenLabs key not found in the credentials file');
mkdirSync(outDir, { recursive: true });

let spent = 0;
let made = 0;
for (const j of missing) {
  if (spent + j.text.length > budget) break;
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICES[j.slot].id}?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: { 'xi-api-key': key, 'content-type': 'application/json', accept: 'audio/mpeg' },
    body: JSON.stringify({
      text: j.text,
      model_id: 'eleven_v3',
      voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.3, use_speaker_boost: true },
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`Stopped at ${j.name} (${VOICES[j.slot].name}): HTTP ${res.status} ${body.slice(0, 300)}`);
    break;
  }
  writeFileSync(join(outDir, `${j.name}.mp3`), Buffer.from(await res.arrayBuffer()));
  spent += j.text.length;
  made++;
  if (made % 10 === 0) console.log(`  ${made} recorded, ${spent} characters`);
}
console.log(`Recorded ${made} clips, ${spent} characters.`);
writeList();
