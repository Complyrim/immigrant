# One-figure proof: does the skirt tuck generalise? (us_officer, 2026-11-27)

Baseline rebuilt from `src/data/people.json` with the unmodified `make_people.py`. `cmp` against the
shipped `public/assets/mh/us_officer.glb` reports byte identical, so the baseline measured here is
the file that ships. Trial builds went to a scratch directory and were served under throwaway ids
(`zz_base`, `zz_fix`, `zz_forced`), all three since deleted. No live asset was changed.

## Measured penetration, current pipeline

`tuck_under` moved 0 vertices on this figure, as expected: it matches skirts only.

| pair | outside | near verts | worst |
|---|---|---|---|
| polo outside pants | 496 | 499 (99%) | +40.2 mm |
| pants outside polo | 210 | 484 (43%) | +45.6 mm |
| pants outside boots | 415 | 440 (94%) | +34.4 mm |
| boots outside pants | 658 | 911 (72%) | +47.7 mm |

Correct layering is lopsided: the outer garment sits outside nearly everywhere it is close, the
inner one hardly anywhere. Polo over pants is lopsided at 99 against 43, so the pant waist genuinely
pokes through the polo, the same fault and the same magnitude as the skirt case.

## Trial 1: detect the layering instead of naming the garment

Replacing the `is_skirt` test with the asymmetry test (outer at least 90% outside, inner at most
70%) needs no garment names:

    TUCK  pants inside polo  : outer 99% / inner 43% -> moved 209
    SKIP  pants <-> boots    : ambiguous (94% / 72%)

Same figure alone, identical camera, before against after:

| camera | pixels changed above 8/255 | max delta |
|---|---|---|
| dist 5.3 (the game camera) | 116 of 352,800, 0.03% | 113 |
| dist 1.5 (close up) | not re-measured after the method was fixed | |

The waist tuck is a close-up fix. At the distance the game renders, it is invisible.

## Trial 2: the skipped pair was the one that mattered

The 70% cutoff was the only thing holding the boots back. I guessed the 72% was inflated by boot
vertices below the pant hem, which are legitimately exposed and still count as outside. That guess
was wrong: recomputing the inner reading over only the vertices the fade would actually move gives
the same 72%. Pants at 94% are still the better candidate for the covering layer:

    FORCE boots inside pants : 94% / 72% -> moved 658

Rendered at game distance this removes every brown eruption from the trouser leg. Against the same
baseline, waist tuck plus boot tuck changes 1,345 of 352,800 pixels, 0.38%, concentrated exactly on
the blobs that were visible. Pixel count understates it: brown on dark navy reads clearly.

**"Most outside wins" is not a safe rule.** Tested on 12 more figures it reverses the shipped
behaviour on a sweater over a tiered skirt. See `sample-12-figures.md` for the rule that works.

## The black marks are not penetration

`MhFigure.ts:346` draws an inverted hull ink outline: a `MeshBasicMaterial` with `side: BackSide`,
pushed along the normals by 0.0068 for cloth and 0.0028 for everything else. Hiding the four ink
meshes at runtime removes every black gash on the boot and leaves the brown eruptions untouched.
Brown is geometry, black is the ink hull. The hull is a separate problem and the tuck neither helps
nor hurts it.

With the real tints applied (polo `#1f3358` over pants `#172338`) the dark wedge at the polo hem
barely registers, navy on navy. The boot eruption is the dominant fault at game distance.

## Numbers on this page were corrected on 2026-11-27

The first version of this file reported 0.44% and 3.44%. Both were measured against renders that
were not frozen, so they recorded the idle animation's random start phase, not geometry. Loading one
unchanged file twice differs by up to 14%. The figures above are the re-measured, frozen ones.

## Correction to an earlier claim

"Floating shoes" was wrong, at least at rest. Rest pose world z: boot sole min -0.0114 in Blender
before export, -0.0096 read back from the loaded GLB; body skin min +0.3433. The shadow catcher sits
at y = 0.004 (`Stage.ts:1959`), so the sole rests about 14 mm under the shadow plane. The boot is
buried, not floating. The idle pose lifts one foot, and the posed contact height was not measured.

## Bearing on the recommendation

Keeping MakeHuman holds, and the pipeline fix is worth more than the first trial suggested. The
automatic half is real once the tie-break replaces the hard cutoff. Still open: whether the rule is
safe across the other 243 figures, and the ink hull, which is the other half of what reads as
damage and is untouched by any of this.
