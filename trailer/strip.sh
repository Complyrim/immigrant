#!/bin/bash
# strip.sh <clip.mp4> <out.jpg>: six frames side by side, for checking a clip at a glance.
D="/Users/isekool/Documents/claude code/remotion/node_modules/@remotion/compositor-darwin-arm64"; export DYLD_LIBRARY_PATH="$D"
T=$(mktemp -d)
for t in 0 1 2 3 4 4.9; do "$D/ffmpeg" -v error -y -ss $t -i "$1" -frames:v 1 "$T/f_$t.jpg"; done
python3 - "$T" "$2" <<'PY'
import sys, glob
from PIL import Image
fs = sorted(glob.glob(sys.argv[1] + '/f_*.jpg'), key=lambda p: float(p.split('f_')[1][:-4]))
ims = [Image.open(f) for f in fs]
h = 420; ims = [im.resize((int(im.width * h / im.height), h)) for im in ims]
s = Image.new('RGB', (sum(i.width for i in ims), h))
x = 0
for im in ims: s.paste(im, (x, 0)); x += im.width
s.save(sys.argv[2], quality=85)
PY
rm -rf "$T"
