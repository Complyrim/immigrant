"""Download finished Higgsfield clips into trailer/clips/ (trailer shots) and trailer/loops/ (game loops).

Usage: python3 fetch_clips.py '<json of show_generations items>'
Matches each generation to its name by the start of its prompt and the start image.
"""
import json, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
NAMES = [
    ("Slow push-in through a busy airport", "9:16", "clips/trailer-01-airport.mp4"),
    ("Static camera at a border inspection", "9:16", "clips/trailer-02-booth.mp4"),
    ("Slow drift along the city street", "9:16", "clips/trailer-03-city.mp4"),
    ("Gentle dolly toward the window", "9:16", "clips/trailer-04-night.mp4"),
    ("Handheld tracking shot along warehouse", "9:16", "clips/trailer-05-work.mp4"),
    ("Slow orbit across the rooftop", "9:16", "clips/trailer-06-rooftop.mp4"),
    ("Slow push-in on the interview desk", "9:16", "clips/trailer-07-interview.mp4"),
    ("Wide shot of the ceremony hall", "9:16", "clips/trailer-08-ceremony.mp4"),
    ("Locked-off static camera. Only ambient motion: distant cars", "1:1", "loops/loop-city.mp4"),
    ("Locked-off static camera. Only ambient motion: steam", "1:1", "loops/loop-cafe.mp4"),
    ("Locked-off static camera. Only ambient motion: leaves and grass", "1:1", "loops/loop-park.mp4"),
]

items = json.loads(sys.argv[1])
for it in items:
    if it.get("status") != "completed" or it.get("model") != "seedance_2_0":
        continue
    p = it["params"]
    for start, ar, out in NAMES:
        if p["prompt"].startswith(start) and p.get("aspect_ratio") == ar:
            dest = os.path.join(HERE, out)
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            if not os.path.exists(dest):
                subprocess.run(["curl", "-s", "-o", dest, it["results"]["rawUrl"]], check=True)
                print("downloaded", out)
            break
