"""Bake a depth map for each painted backdrop (public/assets/backdrops/<id>-depth.png).

Depth Anything V2 Small (Apache-2.0, huggingface.co/depth-anything/Depth-Anything-V2-Small-hf) gives
relative inverse depth. It is calibrated on the painting's own floor: for a level camera, a floor point
seen at v (fraction from the top) below the horizon vh has inverse depth proportional to (v - vh). A line
fitted on the lower middle of the picture maps the model's output to k = "floor-equivalent v - vh", so
the game recovers distance as Z = PAINT_F * camH / k with no other per-image numbers.

Stored as an 8-bit greyscale PNG with a square-root curve for precision far away: byte = sqrt(k / 0.75) * 255.

City skylines (city-*.jpg) have no floor to calibrate on and no people to match, so their relative depth is
spread over a fixed range instead: sky at k = SKY_K (far), the nearest foreground at k = NEAR_K, read by the
game with a virtual camera of height 1 and horizon 0.5 (see CITY_CAM in src/world/backdrops.ts).

Usage: python3 scripts/bake_depth.py [id ...]   (default: every backdrop, rooms and city skylines)
"""
import json, os, sys
import numpy as np
import torch
from PIL import Image
from transformers import AutoImageProcessor, AutoModelForDepthEstimation

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BD = os.path.join(ROOT, "public", "assets", "backdrops")
META = json.load(open(os.path.join(ROOT, "src", "data", "backdrops.json")))
K_MAX = 0.75
SKY_K, NEAR_K = 0.006, 0.35

name = "depth-anything/Depth-Anything-V2-Small-hf"
proc = AutoImageProcessor.from_pretrained(name)
model = AutoModelForDepthEstimation.from_pretrained(name).eval()


def bake_city(id_, disp):
    lo, hi = np.percentile(disp, [2, 99.5])
    n = np.clip((disp - lo) / max(1e-6, hi - lo), 0, 1)
    k = SKY_K + n * (NEAR_K - SKY_K)
    return k, f"city range {lo:.2f}..{hi:.2f}"


def bake(id_):
    im = Image.open(os.path.join(BD, id_ + ".jpg")).convert("RGB")
    W, H = im.size
    with torch.no_grad():
        pred = model(**proc(images=im, return_tensors="pt")).predicted_depth
    disp = torch.nn.functional.interpolate(pred[None], size=(H, W), mode="bicubic")[0, 0].numpy()
    if id_.startswith("city-"):
        k, note = bake_city(id_, disp)
        out = (np.sqrt(k / K_MAX) * 255).round().astype(np.uint8)
        Image.fromarray(out, "L").save(os.path.join(BD, id_ + "-depth.png"), optimize=True)
        print(id_, note)
        return
    vh = META.get(id_, {}).get("vh", 0.45)
    # Floor rows: from a little below the horizon to near the bottom. Furniture standing on the floor is
    # always nearer (higher disparity) than the floor behind it in the same row, so a low percentile across
    # the width follows the floor rather than a desk or a counter.
    rows = np.arange(int(H * min(0.95, vh + 0.15)), int(H * 0.97))
    v = (rows + 0.5) / H - vh
    med = np.percentile(disp[rows, int(W * 0.05):int(W * 0.95)], 20, axis=1)
    a, b = np.polyfit(v, med, 1)
    r2 = 1 - np.sum((med - (a * v + b)) ** 2) / max(1e-9, np.sum((med - med.mean()) ** 2))
    k = (disp - b) / a
    k = np.clip(k, 0.004, K_MAX)
    out = (np.sqrt(k / K_MAX) * 255).round().astype(np.uint8)
    Image.fromarray(out, "L").save(os.path.join(BD, id_ + "-depth.png"), optimize=True)
    print(id_, f"vh={vh} fit a={a:.3f} b={b:.3f} r2={r2:.3f} k range {k.min():.3f}..{k.max():.3f}")


ids = sys.argv[1:] or [f[:-4] for f in sorted(os.listdir(BD)) if f.endswith(".jpg") and not f.endswith("-depth.jpg")]
for i in ids:
    bake(i)
