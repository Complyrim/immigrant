#!/usr/bin/env python3
"""
Generate painted scene backdrops with the local SDXL Turbo model (free, runs on this Mac).

    python3 scripts/gen_backdrops.py cafe            # one scene
    python3 scripts/gen_backdrops.py all             # every scene
    python3 scripts/gen_backdrops.py cafe --seed 7   # try another variation

Images land in public/assets/backdrops/<scene>.jpg (1024x1024). Each prompt asks for an empty
foreground floor, because the 3D people stand there.
"""
import sys
import time
from pathlib import Path

STYLE = ("wide establishing shot, eye level, empty foreground floor in the lower third, no people, "
         "painterly digital illustration, soft cinematic lighting, rich detail, concept art for an animated film")

SCENES = {
    "airport": "international airport arrivals hall, passport control booths in the distance, large windows, overhead signs, polished floor, cool daylight",
    "intl-office": "university international student office, front desk, world map on the wall, bookshelves, potted plants, soft daylight from a window",
    "classroom": "university lecture classroom, rows of desks, whiteboard with equations, tall windows, morning light",
    "lab": "university computer science research lab, desks with monitors, whiteboards with diagrams, server rack, cool blue evening light",
    "apartment": "small shared student apartment living room, sofa, bookshelf, moving boxes, window with city view, warm afternoon light",
    "apartment-night": "small apartment living room at night, a single warm lamp, city lights through the window, string lights, quiet mood",
    "cafe": "cozy neighborhood coffee shop interior, exposed brick wall, wooden counter with espresso machine, chalkboard menu, pendant lamps, warm evening light",
    "clinic": "community health clinic waiting room, reception desk, rows of chairs, health posters, bright clean light",
    "conference": "conference hall with a stage and projector screen, rows of chairs, banners, blue stage lighting",
    "festival": "outdoor evening cultural festival on a campus lawn, string lights, food stalls, colorful banners, golden hour",
    "park": "city park in late afternoon, tall trees, a path, benches, skyline in the distance, golden light",
    "library": "university library reading room, tall bookshelves, long wooden tables with green lamps, quiet warm light",
    "careerfair": "university career fair in a large hall, company booths with banners, tables with brochures, bright light",
    "street": "city street in an American neighborhood at dusk, storefronts, parked cars, street lamps, crosswalk",
    "bank": "bank branch interior, teller counter with glass, marble floor, queue ropes, daylight",
    "campus": "university campus quad, red brick building with white columns and a clock tower, green lawn, trees, sunny day",
    "bedroom": "small bedroom at night, a bed with a blanket, moonlight through the window, city lights, desk with a lamp",
    "kitchen": "small apartment kitchen, stove with pots, spice jars on a shelf, tiled backsplash, warm overhead light",
    "club": "nightclub dance floor, colored spotlights and haze, DJ booth in the distance, neon magenta and blue",
    "gym": "campus gym interior, weight racks, treadmills by tall windows, rubber floor, evening light",
    "rooftop": "apartment rooftop at sunset, string lights, low seating, city skyline, golden and purple sky",
    "walk": "quiet tree lined city sidewalk in autumn at dusk, street lamps glowing, fallen leaves, brick buildings",
}

def main() -> None:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    seed = int(sys.argv[sys.argv.index("--seed") + 1]) if "--seed" in sys.argv else 11
    names = list(SCENES) if (not args or args[0] == "all") else args
    import torch
    from diffusers import AutoPipelineForText2Image
    dtype = torch.float16 if torch.backends.mps.is_available() else torch.float32
    pipe = AutoPipelineForText2Image.from_pretrained("stabilityai/sdxl-turbo", torch_dtype=dtype, variant="fp16" if dtype == torch.float16 else None)
    if torch.backends.mps.is_available():
        pipe = pipe.to("mps")
    out_dir = Path(__file__).resolve().parent.parent / "public" / "assets" / "backdrops"
    out_dir.mkdir(parents=True, exist_ok=True)
    for name in names:
        prompt = f"{SCENES[name]}, {STYLE}"
        t0 = time.time()
        g = torch.Generator(device="cpu").manual_seed(seed)
        img = pipe(prompt=prompt, num_inference_steps=4, guidance_scale=0.0, width=1024, height=1024, generator=g).images[0]
        img.convert("RGB").save(out_dir / f"{name}.jpg", quality=88)
        print(f"{name}: {time.time() - t0:.1f}s -> {out_dir / (name + '.jpg')}")

if __name__ == "__main__":
    main()
