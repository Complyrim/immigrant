/**
 * Dev-only simulation harness (not imported by the game). In the browser console on ?debug:
 *   const { runSim } = await import('/src/dev/sim.ts'); await runSim(['F1', 'H1B'], 240)
 * Plays whole journeys with a semi-random policy and checks money statements, errors and outcomes.
 */
import { playableCountries } from '../engine/country';
import { Game } from '../engine/game';
import { pickActivities } from '../engine/activities';
import { createSeededRandom } from '../utils/random';
import type { Challenge, Profile, StatusId } from '../engine/types';

/** Wording that belongs to student life. A player who has never been a student should not meet it. */
const STUDENT_WORDS = /\b(I-20|DSO|international (student )?office|OPT|CPT|SEVIS|tuition|semester|syllabus|professor|classmates?|GPA|F-1|course ?load|campus|lecture|midterms?|dorm|thesis|student association)\b/i;
const textOf = (ch: Challenge): string =>
  [ch.title, ch.body, ch.narration ?? '', ...(ch.lines ?? []).map((l) => l.text), ...ch.choices.flatMap((c) => [c.label, c.note ?? '', c.success.text, c.fail?.text ?? ''])].join(' ');
/** Cards that may name school things to anyone: the ways into school (a change to F-1, an evening class, a child's school form) and a dental school clinic. */
const STUDENT_DOOR = new Set(['work-h1b-back-to-school', 'work-h1b-grace', 'b2-school-offer', 'yw-evening-class', 'ys-none-school-form', 'yh-dental-emergency']);

export interface SimReport {
  games: number;
  statements: number;
  badStatements: number;
  errors: string[];
  transitions: Record<string, number>;
  endings: Record<string, number>;
  yearsReached: Record<string, number>;
  cardsSeen: Record<string, number>;
  /** Card id to the statuses it was seen under. */
  cardStatuses: Record<string, Record<string, number>>;
  /** A card shown under a status its `statuses` list does not include (should stay empty). */
  statusMismatch: string[];
  /** Student wording met by someone who has never held a student status (card id: matched word, count). */
  studentLeaks: Record<string, number>;
  /** For journeys that ended out of money: average total per ledger label (most negative first). */
  brokeCauses: Record<string, Record<string, number>>;
}

/**
 * policy 'random': leans to the first choice, otherwise random. 'sensible': usually takes a choice that
 * reads as safe (a good outcome with no risky roll), declines illegal offers and rarely goes home.
 */
export function runSim(
  routes: StatusId[],
  n = 240,
  firstChoiceBias = 0.6,
  policy: 'random' | 'sensible' = 'random',
  housings: Profile['housing'][] = ['shared', 'relatives', 'studio'],
): SimReport {
  const rep: SimReport = { games: 0, statements: 0, badStatements: 0, errors: [], transitions: {}, endings: {}, yearsReached: {}, cardsSeen: {}, cardStatuses: {}, statusMismatch: [], studentLeaks: {}, brokeCauses: {} };
  const brokeN: Record<string, number> = {};
  for (let i = 0; i < n; i++) {
    const r = createSeededRandom(i * 13 + 5);
    const pick = <T,>(a: T[]): T => a[Math.floor(r() * a.length)];
    const all = playableCountries();
    const country = all[i % all.length];
    const status = routes[i % routes.length];
    const profile: Profile = {
      name: `T${i}`, age: 24, sex: pick(['female', 'male']), marital: pick(['single', 'single', 'married']), country, status,
      cityId: pick(['nyc', 'la', 'houston', 'chicago', 'dc', 'atlanta', 'bayarea']), arrivalYear: 2016 + Math.floor(r() * 9),
      funding: pick(['family', 'loan', 'scholarship', 'assistantship']), housing: pick(housings),
      lifestyle: pick(['frugal', 'balanced']), reality: pick(['hopeful', 'honest', 'hard']), commute: 'transit',
    };
    try {
      const g = new Game(profile, i * 101 + 7);
      rep.games++;
      let guard = 0;
      let prev: number | null = null;
      let last = String(g.state.flags.status);
      let wasStudent = status === 'F1';
      for (;;) {
        while (!g.finished && !g.state.ended && guard++ < 12000) {
          const ch = g.challenge;
          if (!ch) throw new Error(`no challenge at index ${g.state.index}`);
          rep.cardsSeen[ch.id] = (rep.cardsSeen[ch.id] ?? 0) + 1;
          const stNow = String(g.state.flags.status);
          if (['F1', 'OPT', 'STEM_OPT'].includes(stNow)) wasStudent = true;
          const cs = (rep.cardStatuses[ch.id] ??= {});
          cs[stNow] = (cs[stNow] ?? 0) + 1;
          if (ch && g.item?.def.statuses && !g.item.def.statuses.includes(stNow as never) && rep.statusMismatch.length < 50) {
            const prev = g.state.schedule[g.state.index - 1]?.def.id ?? '-';
            rep.statusMismatch.push(`${status} game ${i}: ${ch.id} under ${stNow}, year ${g.state.year} card ${g.state.index} after ${prev}`);
          }
          if (!wasStudent && !STUDENT_DOOR.has(ch.id)) {
            const m = textOf(ch).match(STUDENT_WORDS);
            if (m) rep.studentLeaks[`${ch.id}: ${m[0]}`] = (rep.studentLeaks[`${ch.id}: ${m[0]}`] ?? 0) + 1;
          }
          // Players rarely choose to end the journey, so the policy only goes home now and then.
          const staying = ch.choices.filter((c) => c.success.ends !== 'went-home');
          const pool = staying.length && r() > 0.08 ? staying : ch.choices;
          let choice = r() < firstChoiceBias ? pool[0] : pick(pool);
          if (policy === 'sensible') {
            const safe = pool.filter((c) => c.success.passed && !c.fail && !(c.success.effects.flags && (c.success.effects.flags.crime || c.success.effects.flags.unauthWork)));
            if (safe.length && r() < 0.8) choice = pick(safe);
          }
          const res = g.choose(choice.id);
          const now = String(g.state.flags.status);
          if (now !== last) {
            const k = `${last}>${now}`;
            rep.transitions[k] = (rep.transitions[k] ?? 0) + 1;
            last = now;
          }
          if (res.statement) {
            rep.statements++;
            const st = res.statement;
            const sum = st.lines.reduce((a, l) => a + l.amount, 0);
            if (st.opening + sum !== st.closing || (prev !== null && st.opening !== prev)) rep.badStatements++;
            prev = st.closing;
          }
          if (res.ending) break;
          if (res.pivot) {
            const opts = res.pivot.options.filter((o) => o.id !== 'home');
            g.resolvePivot(res.pivot, pick(opts.length ? opts : res.pivot.options).id);
            if (g.state.ended) break;
          }
          if (r() < 0.4 && !g.finished) {
            const a = pickActivities(g.state, createSeededRandom(guard), 3)[0];
            if (a) g.logActivity(a);
          }
          g.advance();
        }
        if (g.state.ended || !g.canContinue) {
          const e = g.summaryEnding();
          rep.endings[`${status}:${e.id}`] = (rep.endings[`${status}:${e.id}`] ?? 0) + 1;
          if (e.id === 'out-of-money') {
            brokeN[status] = (brokeN[status] ?? 0) + 1;
            const agg = (rep.brokeCauses[status] ??= {});
            for (const l of g.state.ledger) {
              const k = `${l.kind}:${l.label.replace(/\s*\(.*\)/, '')}`;
              agg[k] = (agg[k] ?? 0) + l.amount;
            }
          }
          rep.yearsReached[`${status}:${g.state.year + 1}`] = (rep.yearsReached[`${status}:${g.state.year + 1}`] ?? 0) + 1;
          break;
        }
        g.nextYear();
      }
    } catch (e) {
      const err = e as Error;
      rep.errors.push(`${status} ${i}: ${err.message} ${(err.stack ?? '').split('\n').slice(1, 3).join(' | ')}`);
    }
  }
  for (const [st, agg] of Object.entries(rep.brokeCauses)) {
    const n2 = brokeN[st] || 1;
    rep.brokeCauses[st] = Object.fromEntries(
      Object.entries(agg)
        .map(([k, v]) => [k, Math.round(v / n2)] as [string, number])
        .sort((a, b) => a[1] - b[1])
        .slice(0, 8),
    );
  }
  return rep;
}
