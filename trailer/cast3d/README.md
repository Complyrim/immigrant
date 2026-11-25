# Cast 3D rebuild, batch 1 (started 2026-11-17)

Pipeline scripts: ../officer/scripts/
- flux_designs.py (11-17) / **flux_batch1.py** (11-18: same prompt + "arms straight down, palms to thighs, hands open, no pockets", photoreal; args `<cast3d dir> <id> <seeds,comma>`)
- trellis_run.py (always writes `officer_trellis.glb` in the out dir; rename after)
- rig_trellis.py (original, officer). **rig_trellis_pose.py** (11-18, use this one): same args. Before weight transfer it finds the TRELLIS arm (outermost slice cluster), poses the MH upper arms to match (2 passes), copies weights in that pose, then un-poses the mesh back to the MH rest pose. Then the old forearm fix (now skipped if < 20 section points or > 35 deg) and finger fold. Also folds `ball_*` toe weights into `foot_*` (stops shoes stretching into spikes).
- bonecheck.py; **anim_compare.py** (11-18): Blender renders of GLBs side by side in rest + the game's ual1 clips (Idle_Loop, Idle_Talking_Loop, Sitting_Idle_Loop, Walk_Loop), rotation-only retarget like the game, front/side/back. `ONLY=rest,idle` env var limits clips.

| Person | Design | 3D (TRELLIS.2 raw) | Rig + check | Status |
|---|---|---|---|---|
| us_dso | design-11.png | trellis/us_dso_trellis.glb | us_dso_hd.glb, hand HDdist 0.010 / 0.008 (pass) | **Passes hand check; visible defects; not ready for approval.** Copy at public/assets/mh/us_dso_hd.glb |
| us_professor | design-11 rejected (pocket); design-31 rejected (palms-up shrug, light skin, cartoonish); design-47 used | trellis/us_professor_trellis.glb | us_professor_hd.glb, hand HDdist 0.042 / 0.025 (**fail**) | **Failed: needs a new design.** Copy at public/assets/mh/us_professor_hd.glb is a failing test file only |
| us_owner | none | not yet | - | Not started: quota hit on the first FLUX call |

Images: `<id>/compare-anim.jpg` (5 poses; front: left = current MH, right = _hd; side: overlapped; back: left = _hd, right = current MH; `_full.jpg` = full size), `<id>/hd-poses-front.jpg` (_hd only, front, rest/idle/talk/sit/walk) and `<id>/hd-solo-idle-walk.jpg` (_hd only, idle + walk, front/side/back).
Note: the current us_dso.glb renders untinted (grey suit, auburn bob, leopard shoes); the game applies the plum from people.json. The _hd carries its own texture.
Render calibration: anim_compare.py on us_officer vs us_officer_hd (the one model checked in-game 11-17) shows arms hanging naturally in idle, matching PROGRESS.md, so the renders are treated as a fair proxy. Still provisional until seen in mh-test.html.

## 11-18 run
- HF ZeroGPU used: TRELLIS dso, FLUX professor seed 31, FLUX professor seed 47, TRELLIS professor = 4 runs. Run 5 (FLUX us_owner seed 47) returned "exceeded your ZeroGPU runs limit". Budget is about 4 runs/day.
- Dev-server preview (mh-test.html) was declined in this unattended run, so checks were done with Blender renders (anim_compare.py) instead of the browser. Re-check in mh-test.html before any approval.

## Problems found
- **Arm pose mismatch (fixed in rig_trellis_pose.py).** The MH rest pose holds arms ~43 deg out; TRELLIS designs hang them ~13 deg. The old rig_trellis.py found 0 wrist points and applied a bogus 68 deg forearm twist (hand HDdist 0.18).
- **us_dso**
  - Webbing under the arms: the armpit region TRELLIS fused to the jacket stretches into flaps when un-posed. Bat wings in rest pose; in idle it shows as bulky sleeves from the front and a big jacket fin sticking out behind the back in side view.
  - Leg stance mismatch: foot_l bone sits 9 cm outside the TRELLIS foot (same kind of mismatch the arms had). The left knee dent and the skirt hem holes/split in walk (back view) are probably symptoms of this. Not fixed: the leg needs the same pose-match treatment as the arms.
  - Sitting skirt deforms acceptably.
  - Hands open and readable; arms hang beside the hips, not behind.
  - Colours already match the design (plum, black hair); no recolour needed.
- **us_professor (fail)**: hands were nearly touching the trousers in design-47, so TRELLIS fused them. After rigging the hands smear into flat brown slabs in every pose. Skin also lighter than "dark brown". Shoes fine after the toe fold.
- **Design rule for next FLUX runs:** arms straight and held ~30-45 deg out from the body with clear background between hand and hip/thigh (matches the MH A-pose and avoids both webbing and fused hands). Ask for dark brown skin explicitly for the professor.

## Remaining
1. us_professor: new FLUX design with arms out ~40 deg (1 FLUX + 1 TRELLIS run).
2. us_owner: FLUX design (rust #b8553a shift dress, black low bun, East Asian woman in her forties, same arm rule) + TRELLIS (2 runs).
3. us_dso: leg pose-match in rig_trellis_pose.py (feet/knees, like the arms), then re-check hem; decide whether the armpit webbing is acceptable; a redesign with arms further out would likely fix it (2 runs).
4. View all _hd files in mh-test.html in the browser before showing the operator.

## Quality review before more runs (11-18, operator asked)
| Model | Design source | Design OK? | 3D result | Verdict |
|---|---|---|---|---|
| us_officer | Higgsfield (chat unlimited) | Yes: realistic, arms ~30 deg out, hands clear | Clean, rigged, navy recolour, holds up at booth size | **Pass** (only one) |
| us_dso | FLUX.1-dev | Partly: cartoon/toy style, arms close to body | Armpit webbing in every pose, knee dent, hem split in walk | Fail as is; redesign |
| us_professor | FLUX.1-dev (3 tries) | No: pocket / shrug / hands on thighs; cartoon; light skin | Hands fused into slabs, coat flaps | Fail |

Findings:
- The 3D step copies the design faithfully, so design quality decides the result. Pass rate so far 1 of 3 models, 1 of 5 designs.
- FLUX does not follow pose wording (pocket, shrug, hands on thighs) and drifts to a toy-like cartoon look that will not match the officer or the painted scenes. The Higgsfield design followed the A-pose and matched a realistic look.
- Gate before any TRELLIS run: a clear gap (background visible) between each hand and the hips, arms 30-45 deg out, realistic adult proportions, skin and clothes per people.json. Reject the design otherwise; it costs nothing to regenerate on Higgsfield unlimited, but a TRELLIS run costs 1 of ~4 daily.
- Next: make professor + owner (and a dso redo) designs on Higgsfield unlimited with the officer's prompt pattern, check them against the gate, then spend HF runs only on passing designs.

## Higgsfield designs (11-18, unlimited, nano_banana_2, 2K 3:4) in hf-designs/
- professor-a (ce02d02f-548c-4550-b2a5-f4f7405491b6) PASS, pick. professor-b (287f9c06) PASS.
- owner-a (4e83ff15-303e-4e10-a9a2-c98f91d47133) PASS, pick. owner-b (44fa0263) PASS.
- dso-a (b04ff678-8e5d-409e-9550-fd751750e0be) PASS, pick (arms ~50 deg out; should fix the armpit webbing). Second dso image blocked by Higgsfield's nsfw filter (false positive, business suit).
- 5 of 5 pass the gate vs 1 of 5 for FLUX. Next: TRELLIS on the 3 picks (3 HF runs, fits one day) with rig_trellis_pose.py.

## 11-19 run (Higgsfield designs)
Scheduled, unattended. TRELLIS.2 via free ZeroGPU only (gradio_client 2.7.2, venv gv12). No Higgsfield credits, no money. Live `<id>.glb` files and people.json not touched (people.json shows modified in git, but its mtime is Nov 17 13:27, before this run). Nothing committed or deployed.

| Person | Design | TRELLIS | Hand HDdist (l / r) | Renders (rest/idle/talk/sit/walk, front/side/back) | Verdict |
|---|---|---|---|---|---|
| us_professor | hf-designs/professor-a-1024.png | us_professor/trellis-hf/us_professor_trellis.glb (40 s) | 0.023 / **0.039** (bar ~0.02) | Hands separate and readable in all poses viewed; no armpit webbing; arms hang beside the hips in idle; trousers hold in walk; brown shoes sound. Defects: dark jacket-hem tab hangs at the crotch (sit, idle front); in sit the jacket back bunches into a bulge with flaps at the seat | **Fail on the hand gate** (hand_r 0.039); renders otherwise look clean; needs the in-game view. Non-passing test copy at public/assets/mh/us_professor_hd.glb (replaces the 11-18 one, which was 0.042 / 0.025) |
| us_owner | hf-designs/owner-a-1024.png | us_owner/trellis-hf/us_owner_trellis.glb (41 s) | 0.013 / 0.015 (pass) | Hands, arms and armpits fine. Dress fails: large skin-coloured patch shows through the dress front in idle, talk and walk (absent in rest); hem collapses in sit and exposes thighs/crotch; small holes on the back in walk; eyes render as dark sockets; shoes white (design beige); foot_l 6.4 cm off the mesh (same leg-stance mismatch as dso 11-18) | **Fail.** Not copied to public |
| us_dso | hf-designs/dso-a-1024.png | **not made**: run 3 returned "You have exceeded your free ZeroGPU quota (120s requested vs. 0s left)" after preprocessing. Stopped, no retry | - | - | **Not done.** us_dso/trellis-hf/ now holds preprocessed.png only (clear it before the next run). Old 11-18 failing test file still at public/assets/mh/us_dso_hd.glb |

Run count: 2 TRELLIS runs completed, the 3rd refused by quota. Observed: the refusal is a ZeroGPU seconds quota (each image_to_3d requests 120 s); 11-18 fitted 4 calls, today only 2.

Professor hand miss, likely cause: rig_trellis_pose.py's arm pose-match did not converge. Pass 2 still left 8.3 deg (l) / 6.3 deg (r) between the TRELLIS and MH arm (owner converged to 0.7 / 2.1). The forearm fix then moved the right wrist 4.2 cm at 9.2 deg. Measured: hand_r nearest surface is offset (-0.022, -0.011, +0.030) from the bone head. No-run fix: a third pose pass (or loop until < 2 deg) for this mesh, then re-rig and re-check.

Owner colour: unverified. Skin and shoes render true in Blender while the dress renders dark brown against the rust #b8553a design, so this is probably not only lighting; a quick texture probe picked up skin tone and proved nothing. Recolouring is moot while the dress geometry fails.

Images: `<id>/hf-compare_<pose>_<view>.png` (poses rest, idle, talk, sit, walk; views front/side/back; front: left = current MH, right = _hd; back: left = _hd; side: both overlapped).
Only Blender renders were checked: starting the dev server for mh-test.html was declined in this unattended run.

### Remaining
1. us_dso: TRELLIS on hf-designs/dso-a-1024.png (1 run, fresh quota), then rig + checks.
2. us_professor: add a 3rd arm pose pass in rig_trellis_pose.py, re-rig from the existing us_professor_trellis.glb (no run), re-check hands; tidy the jacket-hem tab. Then view `mh-test.html?ids=us_professor,us_professor_hd&gap=1.0&dist=4.2`.
3. us_owner: either (a) TRELLIS on owner-b (1 run) or (b) fix in rigging with no run: weight the lower dress to pelvis/thighs with a smoothed falloff, remove hidden leg faces under the dress, and add the leg pose-match (feet/knees) that dso also needs.
4. View every _hd in mh-test.html before showing the operator. Nothing goes into people.json without operator approval.

## 11-19 PM: professor rig fix (no GPU run)
Re-rigged `us_professor/trellis-hf/us_professor_trellis.glb` with an updated `rig_trellis_pose.py` (output `us_professor_hd2.glb`, copied to `public/assets/mh/us_professor_hd.glb` as the test file). Nothing in people.json, nothing committed or live.
- The morning note was wrong about the arm pose: the "8.3 / 6.3 deg left" lines were pass 2's own correction, which was applied; a 3rd pass measures 0.8 / 0.7 deg. Arm pose passes now loop until under 2 deg (`POSE_PASSES`, default 6).
- Real hand miss: the right forearm's cuff centre was 3.2 cm off the wrist bone. The forearm straighten now repeats until the cuff is centred within 1 cm (`FOREARM_ITERS`, default 3; section radius 0.09). hand_l HDdist 0.023 -> 0.007; hand_r 0.039 -> 0.033. hand_r stays over the 0.02 bar because the right cuff is thicker (mean radius 4.8 cm vs 3.2 cm left), not because it is off-centre; renders show both hands clean in every pose.
- Tab between the knees when sitting: it was the centre front jacket hem / fly (rest z 0.78-0.88), ~75% on the pelvis, so it hung straight down while the thighs swung forward. Probe with the real Sitting_Idle_Loop clip: 121 vertices under the seat line before, 12 after. Fixes (all on by default, generic for any TRELLIS body): `CROTCH_CUT` (removes the fused sheet between the inner thighs, ties inner-thigh verts to their own leg) and `BACK_HEM` (front centre below the hip goes to its own thigh with a 6 cm fade; seat seam below the hip to its own thigh; back of hip above that 60% to the pelvis so the coat tail does not flare).
- Verdict: **pass in Blender renders** (rest, idle, talk, sit, walk; front/side/back). Not yet viewed in the game (mh-test.html). Sheet: trailer/review/cast3d-batch2/us_professor-fixed-sheet.jpg; work renders in us_professor/fix2/.
- In-game check (mh-test.html, game renderer, idle/sit/sit side/talk/walk + face close-up): poses, hands and suit hold up; no tab when sitting. Face at close range is the weak spot: thick white moustache over the mouth and the eyes lost behind solid black glasses. Reads fine at scene distance. Sheet: trailer/review/cast3d-batch2/us_professor-in-game.jpg.
- 11-19 late: lab check found (1) the professor's head washed out = the lab painting's glowing monitors blooming over anyone in front (old model too; white hair made it worse): lab now has its own look with bloom 0.08 (CityScene.ts LAB); (2) every built chair/bench/stool sat people 0.30 m too far back (the sitting clip puts the hips a thigh's length behind the feet): Stage.ts SEAT_REACH. rig_trellis_pose.py now also recalculates normals outward (TRELLIS winds about half the faces inward); professor re-rigged as trellis-hf/us_professor_hd4.glb (copied to public us_professor.glb locally, not yet live).

## 11-20 run (batch 3)
Scheduled, unattended. Free ZeroGPU only (gradio_client, venv gv12); no money, no Higgsfield credits. people.json and the live `<id>.glb` files not touched; nothing committed or deployed. Test copies only: public/assets/mh/us_dso_hd.glb and us_owner_hd.glb (both replaced).

**Runs used: 2 of 2 TRELLIS calls, both succeeded** (dso 43 s, owner-b 31 s). No quota refusal.

| Person | Design | TRELLIS | Final rig | Hand HDdist (l / r) | Blender renders | Game (mh-test.html, port 5188) | Verdict |
|---|---|---|---|---|---|---|---|
| us_dso | hf-designs/dso-a-1024.png | us_dso/trellis-hf/us_dso_trellis.glb | trellis-hf/us_dso_hd.glb (= _hd_dress5, `DRESS=1 NORMAL_VOTE=1`) | 0.004 / 0.005 (pass) | Hands clean; **no armpit webbing** (dso-a's arms-out design fixed the 11-18 failure); arms beside the hips in idle; plum and black hair match the design; heels sound; eyes fine. Defects: small notch at the skirt hem in idle/talk/walk; **sit: skirt front splits into an inverted V with a pale wedge under the seat** | Upper body clean in idle/talk/walk/sit. **Dark patches at the skirt hem and on the thighs**, worst in sit | **Fail** (sit + in-game hem/leg patches) |
| us_owner (owner-b) | hf-designs/owner-b-1024.png | us_owner/trellis-hf-b/us_owner_trellis_b.glb | trellis-hf-b/us_owner_hd.glb (= _hd_dress5, same flags) | 0.015 / 0.015 (pass) | Rust dress reads as rust (no recolour needed; owner-a's dark brown did not recur). With the fixes: no skin through the dress in idle/talk/walk; hem stays over the thighs in sit (small centre gap). Defects: hem notch at one side in idle/talk/walk; glossy streaks on the dress; shoes white (design beige); foot_l 7.6 cm off | **Dark patches on both upper arms/armholes and specks on the dress front** in every pose | **Fail in game** (passes in Blender) |

Images: us_dso/hf-compare_*.png (final); us_owner/hf-compare-b-final_*.png (final), hf-compare-b_*.png (before fixes; owner-a's hf-compare_*.png kept). Intermediate rigs/renders: *_dress*, hf-compare*-dress*. Sheets: trailer/review/cast3d-batch3/us_dso-sheet.jpg, us_owner-sheet.jpg (design + rest/idle/talk/sit/walk front + walk back, Blender renders; these look cleaner than the game). **In-game strips (the verdict rests on these): us_dso-in-game.jpg, us_owner-in-game.jpg** (idle + sit, left = current MH, right = _hd).

**The public test copies us_dso_hd.glb and us_owner_hd.glb are NON-PASSING test files** (kept only so mh-test.html can show them; us_owner_hd.glb is new in that folder). Neither is in people.json.

### What the default rig did wrong on skirts/dresses (found this run)
1. `CROTCH_CUT` (11-19, for trousers) cut a slit straight up the front and back of the skirt/dress. `BACK_HEM` likewise is for jackets.
2. TRELLIS builds the legs and torso inside a dress as hidden geometry (65% of verts at hip height on owner-b were enclosed on all 8 sides); rigged, they push through the cloth.
3. The 11-19 outward-normal recalc (`recalc_face_normals`) turned whole islands inside out on dso (white/skin patches on jacket, skirt and legs even in rest pose). The raw TRELLIS mesh was clean (checked by rendering it with backface culling); the 25K decimate was not the cause.

### Fixes added to rig_trellis_pose.py (all env flags, default OFF; professor output unchanged)
- `DRESS=1`: turns CROTCH_CUT and BACK_HEM off; finds the hem with a centre-line ray; after the arm pose-match and forearm fix, deletes faces enclosed on all 8 horizontal sides between hem and 10 cm under the shoulder (`DRESS_TOP=hip` limits it to hip + 5 cm); then weights the lower dress pelvis -> both thighs with a smoothstep toward the hem, own-side thigh slightly more at the sides (`DRESS_BIAS`, default 0.25; 0 made no visible difference on dso sit). First version ran the sweep before the arm match and broke dso's hands (0.08 / 0.09); moved after, back to 0.004 / 0.005.
- `NORMAL_VOTE=1`: after the recalc, per connected island, rays along +/- normal vote which side is outside and flip the island. Fixed dso in Blender. `NORMAL_VOTE=2` adds a per-face flip pass (20 faces on owner-b); no visible change in game. Without any vote, owner-b's legs render black in the game.
- `NORMAL_RECALC=0` skips the 11-19 recalc (default 1). Tested with DRESS=1 on both: the in-game patches stayed about the same (owner-b slightly worse), so it is not the answer.
- Default path checked: with no flags the edited script gives a byte-identical professor GLB to a copy with all 11-20 additions stripped (302 lines, same as before). That output differs from trellis-hf/us_professor_hd4.glb (28,613 vs 28,605 verts), so hd4 was made with an earlier script version; the live us_professor.glb was not touched.
- owner-a re-rigged with the same flags (us_owner/trellis-hf/us_owner_hd_dress.glb, renders hf-compare-a-dress_*): worse than owner-b: a large cloth flap tears off the right arm in rest/idle/talk/walk, sit hem splits, dress still dark brown. owner-b is the better base.
- Side views (final): dso has no jacket fin (11-18 failure gone); owner-b side fine.
- Not done: a leg pose-match for feet/knees (foot_l 4.3 cm off on dso, 7.6 cm on owner-b).

### What remains
1. **Dark patches in the game renderer** (front faces only + ink outlines) on both models, though the Blender renders look clean. Next: render with backface culling in Blender (anim_compare does not cull, which is why it missed this), find the faces (probably wrong-way faces at armholes/hem, or holes letting the outline hull show), then fix the normals logic or close the holes. Until anim_compare culls, every check must include mh-test.html.
2. dso sit: skirt front split / pale wedge under the seat.
3. Leg pose-match (feet/knees) for both.
4. owner-b shoes white vs beige (recolor.py could fix it); hem notch on both.
5. No GPU needed for any of these; the TRELLIS meshes are saved.

## 11-20 evening: dark patches and skirt split (follow-up session)
No GPU used; both TRELLIS meshes re-rigged from the saved files. Nothing committed, people.json and the live `<id>.glb` files untouched. Test copies replaced: public/assets/mh/us_dso_hd.glb and us_owner_hd.glb (= trellis-hf/us_dso_hd_dress14.glb and trellis-hf-b/us_owner_hd_dress14.glb).

**Final command (both):** `DRESS=1 NORMAL_VOTE=1 FACE_AGREE=1 INTERIOR=1 Blender -b --python trailer/officer/scripts/rig_trellis_pose.py -- public/assets/mh/<id>.glb <trellis.glb> <out.glb> 25000`

### Causes found
1. **Imported custom normals (static patches).** The glTF import keeps TRELLIS's own per-corner normals and the export writes them back, so they never follow a winding fix. 352 (dso) / 241 (owner) triangles were wound against their own normals: the game culled them and the black ink hull behind showed through. `FACE_AGREE` alone (flip faces to agree with vertex normals) only took dso from 352 to 286; **clearing the custom split normals** (now part of `FACE_AGREE=1`) took both to 2.
2. **Nested layers (streaks on legs and skirt, worst in sit).** TRELLIS builds legs, skirt and torso as several surfaces a few mm apart: over half of dso's leg faces had another surface within 5 mm behind them. Wherever the layers cross, an inner layer pokes through the skin and its back-facing ink hull draws black. Ink push size and polygon offset made no difference, which ruled out hull thickness. `INTERIOR=1` deletes every face from which no ray in the hemisphere around its normal escapes (64-direction sphere): 13,547 faces on dso and 11,739 on owner-b, leaving 7,425 and 8,958.
3. **One-sided drawing of open cloth.** A TRELLIS body is skin and open cloth (hems, armholes) in one mesh, but the game drew it front-side only, where MakeHuman cloth is double-sided. **Game change (uncommitted):** `src/world/MhFigure.ts`: `asset === 'trellis'` added to the DoubleSide condition. Affects only `body__trellis` meshes, none of which is in people.json; tsc clean.

### Checked (mh-test.html, port 5188, game renderer, no page overrides)
- dso: clean in idle, walk and sit, front and back; small notch at the skirt hem remains. **Skirt split: no see-through any more** (magenta floor + background, ink off, 4 yaws x idle/walk/sit: no holes in either model; the area under the seated hem shows the skirt's inside).
- owner-b: dress specks and leg patches gone. **Still failing: skin flaps at both armholes** (black on their back side) and a small dark mark below the hem in walk.
- Hands (bonecheck.py HDdist l / r): dso 0.006 / 0.005, owner-b 0.015 / 0.016 (pass, < 0.02). owner-b lowerarm (elbow) 0.047 / 0.047; foot_l dso 4.3 cm, owner 7.6 cm off as before.
- Professor: no-flag build byte-identical to the batch-3 baseline (`prof/us_professor_check.glb`).
- Strips: trailer/review/cast3d-batch3/us_dso-in-game-fixed.jpg, us_owner-in-game-fixed.jpg.

### Tried, did not help (flags kept, default off, marked TRIED in the script)
`DRESS_LEGS` (sweep down the legs; no effect), `LEG_MATCH` (slide legs onto the bone line; legs were 3-7 cm knock-kneed vs the bones, but moving them did not remove the streaks), `SMOOTH_LOWER` (much worse: pushes nested layers through each other), `ARMPIT_CUT` and `STRETCH_CUT` (owner-b armhole flaps stayed or got worse).

### What remains
1. owner-b armhole flaps: geometry flaps from the upper arm, already in the batch-3 model; not mixed arm/torso weights (snapping them changed nothing). Next idea: look at the arm pose-match on owner-b's arms-close design, or try owner-b with an arms-out design like dso-a.
2. Leg pose-match for feet (unchanged), owner-b shoe colour, hem notch on dso.

## 11-20 night: owner-b armhole flaps fixed (same session)
**Cause:** TRELLIS fused a web of thin sheets between owner-b's inner arm and the side of the dress. The weight transfer gave the sheets to the torso, so in the rest pose (arms out) they hang along the arm. When the game lowers the arms they stay where they were and stick out sideways as the flaps, black on the back. Seen in the game by colouring each vertex by arm weight in the bind pose. Measured from the shoulder joint, torso-led faces sit at about -25 to -5 deg from straight down and the arm at about 43 deg. The web is the roughly 50 torso-led faces per side between 0 and 20 deg.

**Fix:** new flag `ARM_WEB=1` in rig_trellis_pose.py (default off; it runs after the weights are final, before `FACE_AGREE`). Below the shoulder and within 1.4x upper-arm length of it, it deletes three kinds of face:
- torso-led faces outward of the shoulder (`ARM_WEB_OUT`, default 2 deg): 67 faces on owner-b
- arm-led spikes hanging in toward the body (`ARM_WEB_SPIKE`, default 12 deg): 10 faces
- faces whose vertices split between arm and torso, arm-weight spread over 0.4 (`ARM_WEB_SPREAD`): 75 faces
A wider cut (`OUT=-3 SPIKE=18`, dress19) made the armhole edge more jagged without removing more, so the defaults stand.

**owner-b command now:** `DRESS=1 NORMAL_VOTE=1 FACE_AGREE=1 INTERIOR=1 ARM_WEB=1 ...` → trellis-hf-b/us_owner_hd_dress18.glb = us_owner_hd.glb = public/assets/mh/us_owner_hd.glb (test copy only, not in people.json). dso is unchanged (dress14, built without ARM_WEB).

**Checked in game (mh-test.html):**
- Flaps gone in idle, walk and sit, front and side.
- Magenta hole check at 4 yaws x idle/walk/sit, full body and upper body: no holes.
- Hands 0.015 / 0.016 (unchanged, pass).
- Strip: trailer/review/cast3d-batch3/us_owner-in-game-fixed.jpg (replaced; top row MH, bottom row _hd).

**Still visible on owner-b:**
- Tiny dark nubs right at the armpit in idle and sit.
- A ragged edge of skin at the side of the armhole, seen side-on.
- Glossy streaks on the dress front, white shoes (design beige), foot_l 7.6 cm off.

## 11-20 night: owner-b armpit nubs, tried and not fixed (same session)

The small dark nubs right at the owner's armpits are still there. Nothing was rebuilt, `us_owner_hd.glb` is still dress18, and `rig_trellis_pose.py` is unchanged.

**What the nubs are.** They are the inside of the mesh seen through holes, not leftover webbing.
- Rendering the body FrontSide-only turns the shards black.
- A weight-coloured render with back faces in green shows the green clustered at both armpits.
- The TRELLIS mesh is far from watertight: 9,782 open edges overall, about 550 within 16 cm of each shoulder. Most of those form branching, non-simple loops.

**Tried in the browser (setIndex and skin-attribute edits on the live model), none clearly better:**
- Snapping mixed arm/torso weights (0.1 to 0.9) to one side, at four zone sizes. The dress edge got dragged onto the arm and the shards stayed.
- Laplacian smoothing of armpit weights, 6 and 12 passes. More shards and new holes.
- Removing small islands and dangling faces. Opened see-through holes in the inner arm.
- Removing faces that fold over (normal turns past 100, 70 or 50 degrees in idle, walk or sit; 71, 112 and 192 faces). At 100 degrees it barely changed; stronger settings opened holes.
- Capping the 74 small simple hole loops with fans. With one winding the caps render black; with the other they close a few slits in walk and sit but leave the dark shards and add a couple of small black triangles.

**Conclusion.** Mesh surgery on this candidate isn't removing the nubs. The real fix is a cleaner TRELLIS candidate (a watertight or less-holey armpit), or remeshing the body before rigging. Probe scripts are in the session scratchpad: `diag.mjs`, `wcol.mjs`, `proto.mjs`, `smooth.mjs`, `fold.mjs`, `cap.mjs`, `capb.mjs`, `bnd.mjs`.

## 11-21 early: us_advisor (next figure)
- **Design: done.** `hf-designs/advisor-a.png` (896x1200) and `advisor-a-1024.png`. Higgsfield nano_banana_2 (the server ran it as nano_banana_flash), 1.5 credits with the operator's OK; job 56233e2c-3093-43ef-aba3-880bc4bacf5a; 3.5 credits left, free plan. The look follows people.json and the current MH model: about 28, light bronze skin with mixed features, dark brown high ponytail, burgundy pinstripe blouse, charcoal knee-length pencil skirt, black ankle boots. **Passes the gate:** arms about 25-30 deg out (a little under the 30-45 aim), wide clear gap between each hand and the hips, realistic proportions.
- **TRELLIS: not run.** One attempt at 07:10 UTC was refused: "exceeded your free ZeroGPU quota (120s requested vs. 0s left)". Batch 3's 2 runs about 14 hours earlier used up the quota. No retry. `us_advisor/trellis-hf/` holds preprocessed.png only if preprocessing ran; clear it before the next run.
- **Next:** with fresh quota, `gv12/bin/python officer/scripts/trellis_run.py cast3d/hf-designs/advisor-a-1024.png cast3d/us_advisor/trellis-hf`, rename `officer_trellis.glb` to `us_advisor_trellis.glb`, then rig with `DRESS=1 NORMAL_VOTE=1 FACE_AGREE=1 INTERIOR=1` (plus `ARM_WEB=1` if armhole flaps show) and check in mh-test.html.

## 11-21 run: us_advisor built (scheduled, unattended)
Free ZeroGPU only, **1 TRELLIS call, succeeded** (about 45 s, no quota refusal). No money, no Higgsfield credits. people.json and the live `us_advisor.glb` not touched; nothing committed or deployed. Test copy: public/assets/mh/us_advisor_hd.glb (new, not in people.json). The preview tool's server start was declined, but port 5188 was already answering, so the in-game checks ran against that server.

**Files:** design hf-designs/advisor-a-1024.png → us_advisor/trellis-hf/us_advisor_trellis.glb (raw) → **us_advisor/us_advisor_hd.glb** (= public copy; log us_advisor_hd.rig.log). Kept for reference: us_advisor_hd_p6.glb (default 6 pose passes, fails bonecheck) and us_advisor_hd_armweb.glb (ARM_WEB=1, rejected). Capture scripts: us_advisor/tools/ (cap.mjs = body/close-up/magenta panels, cap2.mjs = armpit front/back, sheet.py = contact sheets; run with node from games/immigrant while the dev server is up).

**Commands (from games/immigrant):**
- Default, as planned: `DRESS=1 NORMAL_VOTE=1 FACE_AGREE=1 INTERIOR=1 Blender -b --python trailer/officer/scripts/rig_trellis_pose.py -- public/assets/mh/us_advisor.glb trailer/cast3d/us_advisor/trellis-hf/us_advisor_trellis.glb <out> 25000`. **Fails bonecheck: hand HDdist 0.049 / 0.015.** Cause from the log: the arm pose-match loop diverges on this mesh. After pass 2 it was 1.5 / 4.9 deg off, but the right arm then drifts to 13, 15, 29 and 44 deg over passes 3-6, and the left forearm fix is skipped (7 section points). The rig is deterministic: a re-run gave a byte-identical GLB.
- **Used: same flags plus `POSE_PASSES=1`.** Hands 0.019 / 0.018: **passes only with a non-default flag, by a thin margin** (limit 0.02). POSE_PASSES=2 gave 0.020 / 0.024 and POSE_PASSES=3 gave 0.020 / 0.060, both fails. Other HDdist values: elbows 0.032 / 0.032, Head 0.036, foot_l 0.073 (7.3 cm off; owner-b was 7.6, dso 4.3).
- **`ARM_WEB=1` tried and rejected** (with POSE_PASSES=1): it cut web 46, spike 4, bridge 103 faces and left the hands unchanged (0.019 / 0.018). It removed the walk shards, but the magenta check showed **new see-through holes at the armpit/sleeve**: big in walk-90 and sit-270, a slit in idle-0. Enclosed upper-body magenta went from 0-35 px to 35-372 px per panel. The no-ARM_WEB build has no holes, so it stays.

**Checked in game** (mh-test.html, port 5188, game renderer, headless Chromium via Playwright): idle, walk and sit, front and back, next to the current MH. Close-ups of the face (front/side/back) and hands (idle/walk/sit). Armpits in idle/walk/sit from the front, the back and +/-0.5 rad (the first armpit shots at +/-1.2 rad were too side-on to show them).
- Right: dark high ponytail, plum blouse, dark pencil skirt to the knee and black ankle boots, all following the design; arms hang naturally beside the hips in idle and walk; hands read as hands; no armpit webbing or holes.
- **Magenta hole check** (ink off, magenta background and floor, 4 yaws x idle/walk/sit, flood fill from the border, every hit zoomed): only real gaps were enclosed (arm or wrist against the hip, between the legs, hand on the knee in sit), plus 1-3 px slivers where the wrist meets the hip in idle 0/90/180/270. **No see-through holes.**
- Wrong:
  1. **Face:** dark sunken eye sockets, smeared red mouth, crack lines on the cheek. The eyes read as dark holes even in the full-body panels, not just close up.
  2. **Small dark shards on the outside of the upper arms and elbows** (idle front-left/right, walk back and front). These are TRELLIS fragments at the sleeve; ARM_WEB removes them but opens holes.
  3. Ragged notch at the skirt hem, front right, in idle and walk (like dso).
  4. In sit, the skirt's dark inside shows between the thighs.
  5. Faint dark streaks on the lower legs.
  6. The skirt renders near-black where the design is charcoal grey, and the blouse pinstripes barely read.
  7. The hand margin is thin (0.018-0.019 vs 0.02).

**Strip:** trailer/review/us_advisor-in-game.png. Row 1: idle/walk/sit, front and back, L = current MH, R = _hd. Row 2: the design, face, hands, armpits. Row 3: armpits (walk back/front, sit) and magenta panels. An earlier JPG version is at trailer/review/cast3d-batch3/us_advisor-in-game.jpg.

**Verdict:** builds and passes the hand check (only with POSE_PASSES=1); no holes in game. **Not ready for approval:** face, arm shards, hem notch. Next:
1. Make the pose-match keep its best pass (the lowest max angle) instead of the last, so the default flags pass.
2. Look at the face (texture/geometry).
3. Find a narrower arm-shard cut than ARM_WEB, for example only faces sticking outward beyond the sleeve surface.
4. Recolour the skirt to charcoal (recolor.py).

## 11-22 Higgsfield designs: the 12 US cast without one (operator OK "Yes, the 12 US", then "yes" to the 18-credit batch)
nano_banana_2 (served as nano_banana_flash), 3:4, default resolution (896x1200; "2k" quoted 2 cr each, not used), 1.5 credits each, one batch, **18 credits spent, 43.5 → 25.5 left**. No reshoots. Prompts: hf-designs/us12-prompts.json (advisor-a pattern; look from people.json + the current MH model in mh-test.html). Files: hf-designs/<short>-a.png + <short>-a-1024.png (765x1024). Contact sheet: hf-designs/us12-sheet.jpg. Gate = arms 30-45 deg out with clear background between each hand and the hips, full body, plain background.

| short | job id | gate | notes |
|---|---|---|---|
| roommate_m | 268af704-c40f-4ed2-be67-ca16570be12f | PASS | ~40 deg, wide gaps |
| roommate_f | 247e4d9a-ffb0-4b7c-89a5-a9b39b0039d0 | PASS | ~35 deg; shorts, so bare thighs (watch the crotch fill in TRELLIS) |
| landlord | 405cb510-aebf-4fc1-b066-c100b2bb4293 | PASS | ~35 deg; belly reads; hands clear of the jeans |
| doctor | 177cfb84-62ff-4838-a2ef-bc880f6874c0 | PASS | ~35 deg; white jacket reads a little like a chef's tunic (matches the MH double-breasted suit); wristwatch on left wrist |
| nurse | ccf94622-d897-4a0c-8528-0fc4c275c298 | PASS | ~40 deg, teal scrubs, white sneakers |
| recruiter | 9252054e-51e5-4014-8b03-2f05c256730c | PASS | ~30 deg (low end), gaps clear; slate trouser suit, auburn hair down |
| stranger | 1e0f0ca6-1b5b-41e2-8aff-1482df622e4a | PASS | ~25-30 deg, gaps clear, but palms turned up and cupped (fingers may need the finger-fold fix); warmer background |
| teller | ddcc39b6-7962-4a29-a133-c101466ffc4d | PASS | ~40 deg, black suit, striped tie |
| crowd_f1 | 9c692288-61d8-4225-bec0-9e5740a74a5e | PASS | ~40 deg; braids |
| crowd_m1 | ab782290-8944-4965-95bb-ec061d48f8bd | PASS | ~40 deg; red cable-knit sweater |
| crowd_f2 | 9ae93a55-3218-442e-a34a-5a1a264fa3c2 | PASS | ~40 deg; long tiered skirt (expect dress-style rig issues, use DRESS=1) |
| crowd_m2 | 7e0afa79-a342-4b09-bf0a-ce14fa68f72b | PASS | ~45 deg; overalls over white tee |

Not done here (by instruction): no TRELLIS, people.json untouched, nothing committed or deployed.

## 11-23: US-12 TRELLIS runs scheduled
Six one-off scheduled tasks, 10:30 AM MST, two figures a day (free ZeroGPU fits about 2 runs/day), all following `US12-RUN.md`: day1 11-24 roommate_m + roommate_f · day2 11-25 landlord + doctor · day3 11-26 nurse + recruiter · day4 11-27 teller + stranger · day5 11-28 crowd_f1 + crowd_m1 · day6 11-29 crowd_f2 + crowd_m2 (ends with a 12-figure tally). Task ids `immigrant-us12-3d-day1`..`day6`. Each stops on a quota refusal without retry. Outputs: `<id>_hd.glb` test copies and strips in `trailer/review/cast3d-us12/`; people.json and live models untouched, nothing committed. Depends on the gv12 venv in a /tmp scratchpad (a reboot would remove it; the runs then stop and report).

## 11-24 US-12 day 1 (roommate_m + roommate_f): BLOCKED, no TRELLIS run made

Scheduled task `immigrant-us12-3d-day1`, unattended. **Neither figure was built. Both are still owed.** No HF ZeroGPU quota was used (the failure happened locally, before any network call), no money, no Higgsfield credits. people.json and the live `us_roommate_m.glb` / `us_roommate_f.glb` are byte-identical to their state at the start of the run (sha256 checked before and after). No `_hd` test copies exist for either roommate. Nothing committed, pushed or published.

**Cause: the gv12 venv has been emptied by a /tmp cleanup.** `/private/tmp/claude-501/-Users-isekool-Documents-claude-code/d76cd298-e916-4771-af9d-76aa3124d203/scratchpad/gv12` still exists and `bin/python` still resolves (a symlink to the uv CPython 3.12.16), but every regular file under it is gone: `pyvenv.cfg` is missing, so the interpreter never enters venv mode, and `lib/python3.12/site-packages/` is a tree of empty directories (`gradio_client/`, `huggingface_hub/`, … all `total 0`, `__pycache__` empty). Whole venv: 1 regular file left (`site-packages/yaml/_yaml.cpython-312-darwin.so`) plus the three `bin/python*` symlinks. The sibling `scratchpad/gv` venv has 0 regular files. The pruned directories (`bin/`, `site-packages/` and its children) carry mtime 22 Nov 00:00, so the cleanup ran that night; `lib/` and `lib/python3.12/` still read 17 Nov, because only files were removed.

- `trellis_run.py` fails at `from gradio_client import Client, handle_file` → `ModuleNotFoundError: No module named 'gradio_client'` (exit 1). With `PYTHONPATH` pointed at the dead site-packages it gets one step further and fails with `ImportError: cannot import name 'Client' from 'gradio_client' (unknown location)` — the import resolves as an empty namespace package.
- Searched for a replacement as the runbook requires: no other `gv12` under any `/private/tmp/claude-501/-Users-isekool-Documents-claude-code/*/scratchpad/`, and, searching all of `/private/tmp/claude-501` at full depth, no `pyvenv.cfg` and no non-empty `gradio_client/client.py` anywhere. The system `python3` has no `gradio_client` either. Per the hard rule, the run stopped here and did not rebuild the venv.
- `trailer/cast3d/us_roommate_m/trellis-hf/` was created (runbook step 1) and is empty — no `preprocessed.png`, so TRELLIS was never contacted. `us_roommate_f/` was not created.
- Checked and still in place for when the runs resume: Blender at `~/Applications/Blender.app`, dev server answering on port 5188, the uncommitted `asset === 'trellis'` DoubleSide line at `src/world/MhFigure.ts:465`, and both designs (`hf-designs/roommate_m-a-1024.png`, `roommate_f-a-1024.png`) — reviewed, both still pass the gate (m ~40 deg arms with wide gaps; f ~35 deg, shorts with clear background between the thighs).

**Owed: roommate_m and roommate_f (day 1 in full).** Days 2-6 (`immigrant-us12-3d-day2`..`day6`, 11-25 to 11-29) will fail the same way at their first command unless the venv is restored first; each is written to stop and report, so nothing will be damaged, but no figure will be built. Restoring it is one `uv venv` + `pip install gradio_client==2.7.2`, which this run was not allowed to do. Two ways to do it: recreate it at a `/private/tmp/claude-501/-Users-isekool-Documents-claude-code/*/scratchpad/gv12` path, which the runbook finds on its own, or put it somewhere durable outside `/tmp` so a cleanup cannot empty it again — but that second one also needs the hard-coded path in `US12-RUN.md` updated, which this run did not touch.

Also worth noting for the schedule: day 1's two figures have no slot of their own in the six-day plan, so even if the venv is restored today, day 6's 12-figure tally will come up two short unless roommate_m and roommate_f are given a run somewhere. The scheduled tasks were not altered.

## 11-24 fix after the blocked day 1: venv moved out of /tmp, roommates rescheduled
- New venv at `~/.venvs/gv12` (uv, CPython 3.12, `gradio_client==2.7.2`); `from gradio_client import Client, handle_file` checked OK. `trellis_run.py` imports nothing else. No TRELLIS call made, no quota used.
- `US12-RUN.md` step 2 now calls `~/.venvs/gv12/bin/python`; if the import check fails, the run stops and reports (still no rebuilding inside a run).
- New one-off task `immigrant-us12-3d-day7`, 11-30 10:30 AM MST: roommate_m + roommate_f (makeup for day 1), then the 12-figure tally. Day 6's tally line was moved to day 7. Days 2-6 unchanged otherwise.

## 11-24 PM: US-12 day 1 run by hand (roommate_m + roommate_f)
The operator asked to run day 1 now instead of waiting. Starting the scheduled task was refused (day 1 is a fired, disabled one-off; starting day 7 by hand was blocked by the permission classifier), so the runbook was followed in the interactive session. **2 TRELLIS calls, both succeeded** (~1 min each, no quota refusal) with the new `~/.venvs/gv12`. No money, no Higgsfield credits. people.json and the live `us_roommate_m.glb` / `us_roommate_f.glb` untouched; nothing committed or published.

**Commands** (from games/immigrant): `INTERIOR=1 NORMAL_VOTE=1 FACE_AGREE=1 Blender -b --python trailer/officer/scripts/rig_trellis_pose.py -- public/assets/mh/<id>.glb trailer/cast3d/<id>/trellis-hf/<id>_trellis.glb trailer/cast3d/<id>/<id>_hd.glb 25000`, log `<id>_hd.rig.log`. POSE_PASSES=1/2/3 each tried: **byte-identical to the default** on both figures, because the pose match converges after pass 1 here (wrist error m 1.1 / 0.3 deg, f 0.5 / 0.9 deg), so the flag cannot help. ARM_WEB not tried (no armpit webbing seen). Hand distances re-read unrounded with a 5-decimal copy of bonecheck (scratch only; bonecheck.py itself unchanged).

| id | hand HDdist l / r | elbows | Head | foot_l | bonecheck | in game | verdict |
|---|---|---|---|---|---|---|---|
| us_roommate_m | 0.02004 / 0.02106 | 0.090 / 0.101 | 0.015 | 0.031 | **FAIL by ~1 mm** (the live MH's own hands read 0.019) | no see-through holes | not ready |
| us_roommate_f | 0.01404 / 0.01971 | 0.048 / 0.058 | 0.065 | 0.048 | pass, thin margin on the right | no see-through holes | not ready |

**Magenta hole check** (ink off, 4 yaws x idle/walk/sit, flood fill from the border, larger regions zoomed): every enclosed region was a real gap (arm against the torso or hip, between the legs, the f sit hem 4-9 px). **No see-through holes on either figure.**

**roommate_m.** Right: build, short brown hair, tee + jeans + grey shoes as designed; arms hang naturally; hands read as hands. Wrong: (1) the brick-red tee renders near-black maroon and the neckline reads as a deep V (design: crew neck); (2) face washed out with a smeared red mouth and blank eyes (same class as the advisor); (3) black shards at both sleeve hems in every pose, and **a large black shard at the neck/shoulder in the side face view**; (4) elbows 9-10 cm from the surface (advisor 3 cm), though the forearm fix ran (42/54 section points, 3.5-4.6 deg); (5) hands fail by 1 mm.

**roommate_f.** Right: black bob, tee, black shorts, dark shoes; no crotch hole in idle/walk; hands pass. Wrong: (1) **dark tear-like shards across the upper back** of the tee in idle/walk/sit back views (dark geometry, not see-through); (2) **the shorts vanish from the front in sit**: bare thigh runs up to the shirt hem, with a dark blob between the legs (the crotch-fill risk flagged on 11-22); (3) face is a smeared mask; (4) periwinkle tee reads purple; (5) shard at the left sleeve; (6) Head bone 6.5 cm off the surface.

**Files:** raw `trailer/cast3d/<id>/trellis-hf/<id>_trellis.glb` (+ trellis.log), build `trailer/cast3d/<id>/<id>_hd.glb` = test copy `public/assets/mh/<id>_hd.glb`. Strips: `trailer/review/cast3d-us12/us_roommate_m-in-game.png`, `us_roommate_f-in-game.png` (row 1 design + idle/walk/sit, L = current MH, R = _hd; row 2 face, hands, armpits; row 3 magenta).

**Schedule:** day 7 (`immigrant-us12-3d-day7`, 11-30) was rewritten to build only roommates still owed; both are now built, so on 11-30 it should find nothing to do and just give the 12-figure tally. Day 6 carries the tally again too.

## 11-24 evening: ELBOW_MATCH rig fix; roommate_m now passes
**Cause of roommate_m's 1 mm hand miss:** the elbow, not the wrist. bonecheck had the `lowerarm` bones 9-10 cm from the surface, and a ray probe showed them fully outside the arm (0 hits through the bone, 9 cm behind the mesh elbow). The MH rest arm is bent at the elbow (wrist forward), TRELLIS arms are straight, and the pose-match only rotated the upper arm until the MH wrist met the TRELLIS wrist, so the MH elbow ended up in empty space; the forearm fix then pivoted about that point. The arm scan window was also fixed at z 1.2..0.45 m, below roommate_m's elbow (z 1.27). us_advisor had the same fault at 3 cm.

**Fix:** `ELBOW_MATCH=1` in `rig_trellis_pose.py` (default off). Per pass it rotates the upper arm so the MH elbow lands on the centre of the TRELLIS arm at upper-arm length from the shoulder, then the lower arm so the MH wrist lands on the TRELLIS arm at forearm length from that elbow; the un-pose inverts both bones; the scan window runs from 10 cm under the shoulder to 25 cm under the wrist. Raises `ELBOW/WRIST DETECT FAILED` if a ring has under 10 points. It does not settle under the 2 deg convergence test (lower arm oscillates 1-4 deg), so it runs all 6 passes; the elbow stays within 1 cm from pass 2.

**Regression** (scratch outputs; old script vs new with flag off vs on, same flags as each figure's build; hand l / r, elbow l / r):

| figure | flag off vs old script | hands off → on | elbows off → on |
|---|---|---|---|
| us_advisor (DRESS, POSE_PASSES=1) | byte-identical | 0.019 / 0.018 → **0.002 / 0.007** | 0.032 / 0.032 → 0.001 / 0.006 |
| us_dso (DRESS) | byte-identical | 0.006 / 0.005 → 0.010 / 0.009 (slightly worse, still pass) | 0.007 / 0.006 → 0.006 / 0.012 |
| us_owner (DRESS, ARM_WEB) | byte-identical | 0.015 / 0.016 → 0.015 / 0.015 | 0.047 / 0.047 → 0.002 / 0.004 |
| us_roommate_f | byte-identical | 0.014 / 0.020 → 0.017 / 0.020 (left slightly worse, still pass) | 0.048 / 0.058 → 0.001 / 0.001 |
| us_roommate_m | byte-identical to the 11-24 PM build | 0.02004 / 0.02106 → **0.01950 / 0.01998 (pass)** | 0.090 / 0.101 → 0.007 / 0.002 |

So nothing scheduled changes unless the flag is set. **Elbow placement, probed:** with the flag on, the elbow bone sits on the arm surface (0.1-1.2 cm from it, rays 0.1-1.2 cm to one side and 5-15 cm to the other; the parity test is mixed, so some are just outside), not centred like the MH's own elbow (2.5 cm in). Much better than 3-10 cm outside, not ideal; the likely limit is the inner-elbow fold collapsing when the 55-67 deg rest bend is baked in. **In game, flag-on advisor** (scratch capture, file removed afterwards): arms and hands look natural; side views show an angular dark flap at the inner elbow, about the same amount of shard as the kept build has in the same views, just in a different spot; no see-through holes. Only the 5 figures above were tested with the flag on; the dso/owner/advisor/roommate_f builds in use were not replaced.

**roommate_m kept build = ELBOW_MATCH** (`us_roommate_m_hd.glb` = `public/assets/mh/us_roommate_m_hd.glb`; the earlier default is kept as `us_roommate_m_hd_default.glb`). **The hands are at the limit, not a reliable pass:** the 6-pass build reads 0.01950 / 0.01998 (bonecheck's 3-decimal print shows 0.019 / 0.020), but the same flags stopped at 2-5 passes give left 0.0213 / 0.0214 / 0.0180 / 0.0212 and right 0.0199-0.0200, so 2 of 5 stopping points pass. No pass-count was picked to make it pass; the build is the script's normal 6-pass output. The wrist is about 5.6 cm across vs 4.7 on the MH and the bone sits 2.0 / 3.6 cm from opposite sides, so the number is mostly the TRELLIS wrist thickness. In game (strip `trailer/review/cast3d-us12/us_roommate_m-in-game.png`, replaced): arms hang straighter; the black spike at the back of the elbow and most of the sleeve-hem shard are gone, some creasing remains on the upper arm; magenta check shows only real gaps (hand-hip, arm-torso, legs), no see-through holes. The face, shirt colour, V-looking neckline and the neck shard in side view are unchanged. Verdict: **at the hand limit** (operator's call whether 0.02 is the right gate for a wrist this thick), **not ready for approval** (face, colour, neck shard). `officer/scripts/bonecheck_5dp.py` = bonecheck with 5-decimal output (bonecheck.py untouched).

**Runbook:** `US12-RUN.md` step 4 now always builds an ELBOW_MATCH copy as well and prefers it when its hands pass, so days 2-7 use it from tomorrow. Pre-change script kept at `officer/scripts/rig_trellis_pose.pre-elbow-1124.py` (the scripts folder is not under git).

## 2026-11-24 (evening): us_officer reverted, DSO stays

Operator looked at `trailer/review/live-officer-dso.jpg` and rejected the officer on looks:
the Higgsfield/TRELLIS face is waxy and flat with a hard nose edge, there are dark smudges on
the shoulders, and the body reads heavier and softer than the MakeHuman original. The female
DSO in the same sheet is clearly better and stays live.

- `public/assets/mh/us_officer.glb` restored to the MakeHuman build (521,420 bytes) from f76c643^.
- `us_officer_hd.glb` (482,980) kept on disk, not loaded by the game.
- `us_dso.glb` = `us_dso_hd.glb` stays live. `us_professor.glb` unchanged, still the HD build.
- Lesson for the remaining ten: a clean bonecheck and a hole-free magenta pass do not mean the
  face survives the pipeline. Judge the close-up face next to the MakeHuman original before
  proposing a swap. The officer passed every mechanical gate and still lost to the original.

**Face gate is now step 4 of the runbook** (operator, 11-24, after the officer revert). The face
of the first build is compared to the MakeHuman face before any other check; a face that does not
clearly beat the original ends that figure's run as `FACE FAIL`, with no ELBOW_MATCH build, no
bonecheck retries, no magenta pass and no in-game strip. Full wording and the failure signs are in
`US12-RUN.md` under "The face gate comes first". The four already-built figures held back on faces
(owner, advisor, roommate_m, roommate_f) stay held; nothing is to be re-rigged to try to fix them.
