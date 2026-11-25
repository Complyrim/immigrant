# US-12 TRELLIS runbook (scheduled one-off tasks, 2 figures per day, 11-25 to 11-30)

Each scheduled task names two figures (`<short>` = the design name, `<id>` = `us_<short>`). Do them in the order given. Project root: `/Users/isekool/Documents/claude code/games/immigrant`. Read `trailer/cast3d/README.md` first, especially "11-21 run: us_advisor built" (the method and its pitfalls) and the "11-22 Higgsfield designs" table (watch items per figure).

## Hard rules
- Do not commit, push or publish anything. Nothing goes live.
- Do not edit `src/data/people.json` or any live `public/assets/mh/<id>.glb`. Test output is `public/assets/mh/<id>_hd.glb` only.
- Spend no money and no Higgsfield credits. Free Hugging Face ZeroGPU quota only.
- Exactly one TRELLIS call per figure. If TRELLIS refuses for quota ("exceeded your free ZeroGPU quota"), STOP the whole run: no retry, no loop, skip the remaining figure, note it in the README and report which figure is still owed.
- Never print, copy or move the HF token at ~/.cache/huggingface/token.
- Do not touch files another session is editing; only create/modify files under `trailer/cast3d/<id>/`, `trailer/review/cast3d-us12/`, the `_hd` test copies and the README section you append.

## The face gate comes first (11-24, operator instruction)

`us_officer` passed every mechanical check here (hands clear, no holes, clean rig, arms hanging
right) and the operator rejected it on sight: the TRELLIS face came out waxy and flat with a hard
crease down the nose, there were dark smudges on the shoulders, and the body read heavier and
softer than the MakeHuman original. It was reverted the same day. None of the checks in this
runbook measure the thing that decided it.

So: **as soon as the first build exists, compare its face to the MakeHuman face and stop there if
it loses.** Do not spend the ELBOW_MATCH build, the bonecheck retry loop, the magenta pass or the
full in-game strip on a figure whose face has already lost. The test is not "is the face
acceptable" but "is this face better than the MakeHuman one we already ship" - the MakeHuman
figure is the thing being replaced, and a tie is a fail, because a swap that is not an improvement
is not worth making.

Known TRELLIS face failures to look for: flat waxy skin with no shading variation across the
cheek, a hard crease edge down the nose or jaw, eyes that read as painted on, hair that merges
into the skull as one dark mass, dark smudges where the neck and shoulders meet. Also look at the
silhouette: TRELLIS tends to thicken and soften the body against the MakeHuman original.

A figure that loses the face gate is **not** a failure to fix by re-rigging. The rig cannot repair
a face; it comes out of TRELLIS that way. Record it, keep the files, move to the next figure.
Borderline calls are the operator's, not this session's: say which way it looks to you and leave
it for review.

## Per figure
1. `mkdir -p trailer/cast3d/<id>/trellis-hf` (empty it if it exists).
2. TRELLIS (run in background, wait; about 1-4 min), from `games/immigrant/trailer`:
   `~/.venvs/gv12/bin/python officer/scripts/trellis_run.py cast3d/hf-designs/<short>-a-1024.png cast3d/<id>/trellis-hf`
   The venv lives at `~/.venvs/gv12` (moved out of /tmp on 11-24 after a /tmp cleanup emptied the old one; python 3.12 + gradio_client 2.7.2). If `~/.venvs/gv12/bin/python -c "from gradio_client import Client"` fails, STOP and report (do not rebuild it).
   Rename `officer_trellis.glb` to `<id>_trellis.glb`.
3. Rig (from `games/immigrant`), into `trailer/cast3d/<id>/<id>_hd.glb`:
   `INTERIOR=1 NORMAL_VOTE=1 FACE_AGREE=1 [DRESS=1 for skirts/dresses: crowd_f2] ~/Applications/Blender.app/Contents/MacOS/Blender -b --python trailer/officer/scripts/rig_trellis_pose.py -- public/assets/mh/<id>.glb trailer/cast3d/<id>/trellis-hf/<id>_trellis.glb trailer/cast3d/<id>/<id>_hd.glb 25000`
   Save the log as `<id>_hd.rig.log`.
4. **Face gate.** Copy this first build to `public/assets/mh/<id>_hd.glb`, then capture the face
   close-up of `<id>_hd` and of the current `<id>` at the same camera in `mh-test.html` (the face
   panel of `cap.mjs` in `trailer/cast3d/us_advisor/tools/` already does this; the pair belongs in
   `trailer/review/cast3d-us12/<id>-face.png`). **View the image yourself** and judge it against
   the section above. If the new face does not clearly beat the MakeHuman one, STOP this figure:
   append the verdict `FACE FAIL` with what is wrong, keep the files where they are, delete
   `public/assets/mh/<id>_hd.glb` again so nothing stale sits next to the live models, and go to
   the next figure. Skip steps 5 to 8 entirely. Do not re-rig to try to fix a face.
5. `bonecheck.py` on the output (usage in README: `Blender -b --python trailer/officer/scripts/bonecheck.py -- public/assets/mh/<id>.glb <build>`). Hand HDdist must be under 0.02 on both hands. Also note the `lowerarm` (elbow) HDdist.
   **Also always rig a second build with `ELBOW_MATCH=1` added** (same command, output `trailer/cast3d/<id>/<id>_hd_elb.glb`, log `<id>_hd_elb.rig.log`) and bonecheck it. ELBOW_MATCH (11-24) poses the lower arm too, so the elbow bone lands on the arm surface (0.1-1.2 cm) instead of 3-10 cm outside it. If any hand prints 0.020, re-read it with `trailer/officer/scripts/bonecheck_5dp.py` (same args, 5 decimals) and use that number for pass/fail. Choose:
   - **ELBOW_MATCH build if its hands pass** (it is the better rig even when the default also passes). If its log shows `ELBOW DETECT FAILED` / `WRIST DETECT FAILED`, it did not build: use the default.
   - else the default build if its hands pass;
   - else re-rig the default with `POSE_PASSES=1`, then 2, then 3 (the 11-21 advisor drift; these do nothing when the log says the pose converged after 1 pass). Keep the best passing build and say which flags it needed. If none pass, keep the best and mark it FAIL.
   Rename the chosen build to `<id>_hd.glb` (keep the other as `<id>_hd_default.glb` or `<id>_hd_elb.glb`) and report both builds' hand and elbow numbers.
6. Copy the kept build to `public/assets/mh/<id>_hd.glb`.
7. In-game check on the dev server's `mh-test.html` (port 5188; if not answering, start it via the project's `.claude/launch.json`). Reuse the capture scripts in `trailer/cast3d/us_advisor/tools/` (cap.mjs, cap2.mjs, sheet.py) with the id changed. Idle, walk, sit, front and back next to the current MH; face, hands, armpit close-ups; magenta hole check. Try `ARM_WEB=1` only if armpit webbing shows, and reject it if it opens holes. If the kept build is the ELBOW_MATCH one, also run `cap.mjs` on the other build (copy it to `public/assets/mh/zz_<id>_cmp.glb`, capture into a scratch folder, then delete that file) and compare the elbows and sleeves in the magenta side views; if ELBOW_MATCH adds a new flap or hole there, keep the other build instead and say why.
8. Strip: `trailer/review/cast3d-us12/<id>-in-game.png`. View it yourself.

## After both figures
Append one dated section to `trailer/cast3d/README.md`: per figure the commands and flags, bonecheck numbers, what looks right, what is wrong, verdict (ready for review / not ready / FACE FAIL), file paths. Report in a few plain sentences: built or not, bonecheck pass/fail, strip paths, open problems, and that nothing was committed or published.
