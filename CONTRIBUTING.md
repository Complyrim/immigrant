# Contributing to Immigrant

Thank you for helping. This game is about real people's lives, so accuracy and respect matter as much as code.

## Before you start

1. **Agree to the [Contributor License Agreement](CLA.md).** Tick the box in your pull request. Pull requests
   without it cannot be merged.
2. **Open an issue first for anything large** (a new country, route, scene or system), so we can agree on the
   approach before you spend time on it.
3. **Read [ASSETS.md](ASSETS.md).** The painted backdrops and voice lines are not open licensed. Do not reuse
   them elsewhere, and never use them to train or evaluate an AI model.

## Run it

```bash
npm ci
npm run dev                                   # http://127.0.0.1:5188
npx tsc --noEmit -p .                         # type check
npx playwright test tests/smoke.spec.ts       # smoke tests, desktop and phone
```

For rules changes, run the whole-journey simulation described in the README and include its summary in your
pull request (errors, unbalanced statements, status mismatches).

## House rules for game text

- No em dashes or en dashes in anything a player reads. Use commas, full stops or colons.
- Never use the word "failed" in player-facing text.
- Plain, respectful language. People are never "illegals" or "aliens".
- Entry without inspection appears only through data and consequences, never as methods or instructions.
- Every number (fees, wait times, visa counts) needs a public source, added the way existing facts are.
- Legal mechanics need a source and a `// attorney review` comment until reviewed.
- Cultural details for a country should come from, or be checked by, people from that country.

## Assets you add

- Only CC0, public domain, or assets you made yourself and can license under the CLA.
- Say where each asset came from and its licence in `public/assets/CREDITS.md`.
- No AI-generated material from a service whose terms forbid this use.

## Pull requests

- Keep each pull request to one change, with a short description of what and why.
- Include screenshots for anything visible.
- The tests run automatically. A pull request needs green checks and a maintainer's approval to merge.

This is a game, not legal advice. Contributions must not present themselves as legal advice either.
