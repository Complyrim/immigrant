#!/bin/bash
# boomerang.sh <in.mp4> <out.mp4>: forward then backward, so the loop has no jump. Uses only demuxers (Remotion's ffmpeg has no reverse filter).
D="/Users/isekool/Documents/claude code/remotion/node_modules/@remotion/compositor-darwin-arm64"; export DYLD_LIBRARY_PATH="$D"
T=$(mktemp -d)
"$D/ffmpeg" -v error -i "$1" "$T/f_%04d.png"
N=$(ls "$T"/f_*.png | wc -l | tr -d ' ')
i=0
for f in $(ls "$T"/f_*.png); do i=$((i+1)); cp "$f" "$T/o_$(printf %04d $i).png"; done
for f in $(ls "$T"/f_*.png | sort -r | sed '1d;$d'); do i=$((i+1)); cp "$f" "$T/o_$(printf %04d $i).png"; done
"$D/ffmpeg" -v error -y -framerate 24 -i "$T/o_%04d.png" -c:v libx264 -pix_fmt yuv420p -crf 26 -preset slow -movflags +faststart -an -x264-params colorprim=bt709:transfer=bt709:colormatrix=bt709 "$2"
rm -rf "$T"
echo "$2: $N frames forward, $i total"
