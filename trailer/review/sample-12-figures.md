# Testing the tie-break rule on 12 more figures (2026-11-27)

Sample chosen to cover every risk case in the cast: 48 distinct garment combinations exist, and
these 13 figures (12 plus `us_officer`) span skirts with a loose top, skirts with a tucked tee,
trousers with ankle boots, trousers with low shoes, one-piece dresses, a one-piece suit, cargo
trousers with three different tops, and both kid and adult proportions.

11 of the 12 rebuilt baselines are byte identical to the shipped GLB. `ea_f2` differs by 24 bytes
and its shipped file is dated 12 November against 25 November for the rest, so it most likely predates a
pipeline change rather than showing nondeterminism. Not confirmed.

## Two measurement errors found and fixed first

Both inflated everything I reported in the previous round.

1. **zsh did not word split the id list.** The first build run matched no one and produced nothing.
2. **The pixel diff was measuring the idle animation, not geometry.** Loading the same file twice
   gave 3.8% to 14.3% apparent change. `MhFigure` seeds `phase` and `clock` with `Math.random()`,
   and `phase` sets the action's start time. Freezing `phase`, `clock`, the action time, the mixer
   and the figure's own `update` makes repeat renders of one file differ by exactly 0 pixels.

A third error affected only the comparison: plain shoes take their colour from a hash of the cast
id (`MhFigure.ts:471`), so rendering the two variants under different throwaway ids changed the shoe
colour. Re-measured by keeping one id and swapping the file between passes.

**The officer numbers in the previous round were wrong.** Corrected: the waist tuck changes 0.03% of
pixels at game distance, not 0.44%, and waist plus boots changes 0.38%, not 3.44%.

## The tie-break rule as proposed is unsafe

"Most outside wins" reverses the shipped behaviour on `cn_f2`, a fisherman sweater over a tiered
skirt. Both directions read high (100% against 90%), the skirt read higher, so the skirt was treated
as the covering layer and the sweater was pulled inside it. The result is a dark band across the
belly with sweater fragments poking through, clearly worse than the baseline. That combination
covers 10 people, and the shipped skirt rule already handles it correctly.

The underlying problem is that most pairs are not lopsided at all. Across the sample: sweater
against wool trousers 99/100, crude tee against cargo trousers 100/95, tucked tee against cargo
trousers 100/98, tucked tee against wool trousers 100/100. With margins of 0 to 5 points, the
larger reading is noise. `us_officer` passed only because its pairs were genuinely lopsided.

## Where the thresholds belong

The first margin I tried, 90% outside and a 20 point gap, was set after seeing these 13 figures and
sat right on top of both winners. Measuring all 11 wearers of `culturalibre_male_boots` shows it
would have silently skipped two of the people it exists for: `vn_m2` reads 89% and `ca_m2` reads
86%, both under the 90% floor.

Reading every pair across the boot wearers and the sample gives a real separation:

- pairs that must fire (boots under trousers, shoes under trousers): gaps of 20 to 82
- pairs that must not fire (shirt under trousers, sweater under skirt): gaps of 0 to 10

Nothing at all lands between 11 and 19, so a 15 point gap floor sits in a measured valley rather
than on a tuned edge. The outer floor drops to 85 because the lowest real reading is 86, and it does
no work anyway: every pair that must be rejected reads 100% in its stronger direction, so the gap
carries the whole signal.

At 85 and 15 the rule fires on all 11 boot wearers, still skips the sweater over the skirt (gap 3)
and every shirt-under-trouser pair, and leaves `cn_f2` byte-for-byte on the shipped skirt rule.

## What it changes, keeping the shipped skirt rule and adding this pass

| id | change at game distance | note |
|---|---|---|
| cn_f2 | 0.00% | skirt rule unchanged, no regression |
| mx_mother, in_f2, mx_f2, ea_f2 | 0.00% | nothing fired |
| ke_f1 | 0.03% | |
| vn_teen | 0.03% | shoes into suit trouser, invisible |
| mx_f1 | 0.04% | |
| mx_kid | 0.11% | |
| ke_m1 | 0.15% | |
| us_officer | 0.38% | boots through trouser fixed |
| se_m2 | 0.67% | boots through trouser fixed |
| in_kid | 0.91% | trouser silhouette shifts, no visible gain or harm |

Two clear visible wins in this sample, no regressions, the rest neutral. The honest reach is the
11 male-boot wearers out of 237 people, since the ankle-boot and low-shoe tucks measured 0.03% to
0.15% and are invisible.

Checked beyond one frozen idle frame: `us_officer`, `se_m2` and `ca_m2` were compared front and
back (`ry=3.14`), standing and at a frozen mid-stride walk. All eight panels lose the brown
eruptions and none gains new damage. Changes run 0.20% to 1.15%.

## What the percentages do not say

Pixel count is a poor proxy for whether something reads. The boot eruptions are brown on dark navy,
so 0.38% of pixels is highly visible, while `in_kid` at 0.91% is invisible. Judge by eye as well.

## Still unfixed

The ink hull (`MhFigure.ts:346`) remains the other half of the damage. The black wedge at the
waistband shows on `se_m2` and `us_officer` in both variants, and no tuck touches it.

## Applied, 2026-11-27

`tuck_lopsided()` added to `scripts/mh/make_people.py`, running after `tuck_under()` and before
`cull_covered()`, at an 85% outer floor and a 15 point gap. The `shell` helper was lifted out of
`tuck_under` to module scope as `_shell` so both passes share it; `tuck_under` itself is otherwise
untouched. Rebuilding `cn_f2` (720 vertices through the skirt rule), `mx_mother`, `in_f2` and
`mx_f2` gives files byte identical to the shipped ones, so the existing path is unchanged.

The 11 `culturalibre_male_boots` wearers were rebuilt and installed: mx_m2, us_officer, se_m2,
et_m2, vn_m2, uk_m2, de_m2, pl_m2, ca_m2, nz_m2, fj_m2. Each moved 608 to 867 vertices, each
changed in all four checked views (0.20% to 1.15% of pixels), and all 11 lose the brown eruptions
with no new damage. File sizes moved by at most 72 bytes. Rendered under their real ids with real
tints, no console errors.

Nobody else was rebuilt. The script change means a future full rebuild would also alter figures
whose shoes read a wide enough gap, for example shoes into cargo trousers, which measured 0.03% to
0.15% and is invisible. 35 of the 48 garment combinations remain untested.

Not committed and not pushed. The ink hull is still untouched and is the black mark at the
waistband on every figure in `boots11-installed.png`.
