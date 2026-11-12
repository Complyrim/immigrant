// Whole-journey simulation without a browser: plays many journeys on every route through the real game
// rules and fails (exit code 1) on errors, money statements that do not balance, or a card shown under a
// status it is not written for.
//
//   node scripts/sim.mjs [gamesPerRoute]
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createServer } from 'vite';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const perRoute = Number(process.argv[2] ?? 60);
const server = await createServer({ root, configFile: false, logLevel: 'error', server: { middlewareMode: true, hmr: false }, appType: 'custom' });
try {
  const { ROUTES } = await server.ssrLoadModule('/src/engine/content/index.ts');
  const { runSim } = await server.ssrLoadModule('/src/dev/sim.ts');
  const ids = ROUTES.map((r) => r.id);
  const r = await runSim(ids, perRoute * ids.length);
  const mismatch = Object.keys(r.statusMismatch ?? {});
  console.log(`routes ${ids.join(', ')}`);
  console.log(`games ${r.games}, statements ${r.statements}, unbalanced ${r.badStatements}, errors ${r.errors.length}, status mismatches ${mismatch.length}`);
  console.log(`endings ${JSON.stringify(r.endings)}`);
  if (r.errors.length) console.error(r.errors.slice(0, 10).join('\n'));
  if (mismatch.length) console.error(`status mismatches: ${mismatch.slice(0, 10).join(', ')}`);
  if (r.errors.length || r.badStatements || mismatch.length) process.exitCode = 1;
} catch (e) {
  console.error(e);
  process.exitCode = 1;
}
await server.close();
