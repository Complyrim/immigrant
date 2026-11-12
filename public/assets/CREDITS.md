# Asset credits

All assets below are CC0 (public domain) from Poly Haven (https://polyhaven.com). No attribution is required; credit is given as a courtesy.

## Textures (1k, used for floors, walls, brick and road)

- Wood Floor (`wood_floor`): Dimitrios Savva. https://polyhaven.com/a/wood_floor
- Interior Tiles (`interior_tiles`): Charlotte Baglioni. https://polyhaven.com/a/interior_tiles
- Concrete Floor (`concrete_floor`): eye-candy.xyz. https://polyhaven.com/a/concrete_floor
- Painted Plaster Wall (`painted_plaster_wall`): Amal Kumar. https://polyhaven.com/a/painted_plaster_wall
- Brick Wall 005 (`brick_wall_005`): Dario Barresi, Dimitrios Savva. https://polyhaven.com/a/brick_wall_005
- Asphalt 02 (`asphalt_02`): Rob Tuytel. https://polyhaven.com/a/asphalt_02

## HDRI skies (1k, used for image-based lighting)

- Belfast Sunset (Pure Sky) (`belfast_sunset_puresky`): Greg Zaal, Dimitrios Savva, Jarod Guest. https://polyhaven.com/a/belfast_sunset_puresky
- Kloofendal 48d Partly Cloudy (Pure Sky) (`kloofendal_48d_partly_cloudy_puresky`): Greg Zaal, Jarod Guest. https://polyhaven.com/a/kloofendal_48d_partly_cloudy_puresky
- Aft Lounge (`aft_lounge`): Greg Zaal. https://polyhaven.com/a/aft_lounge
- Venice Sunset (`venice_sunset`): Greg Zaal. https://polyhaven.com/a/venice_sunset
- Moonless Golf (`moonless_golf`): Greg Zaal. https://polyhaven.com/a/moonless_golf

## People and animation (CC0, Quaternius, https://quaternius.com)

- Universal Base Characters [Standard]: Superhero male and female bodies, eyebrows and six hairstyles. Textures downscaled to 1024 px. https://quaternius.itch.io/universal-base-characters
- Universal Animation Library [Standard]: motion-capture style clips (`public/assets/anim/ual1.glb`) for idle, talking, sitting, walking, dancing, jogging and more. https://quaternius.itch.io/universal-animation-library
- Shirts, trousers and shoes are generated in code from the body mesh; they are not separate assets.

## Scene backdrops

- The 28 painted scene backdrops in `backdrops/` were generated for this game with the Nano Banana 2 image model through the project owner's Creatify account (November 2026). Prompts are in `scripts/backdrop_prompts.json`.

## The cast: 32 distinct people (CC0, MakeHuman community, http://www.makehumancommunity.org)

Files: `assets/mh/*.glb`. Generated with Blender 4.5 LTS and the MPFB2 extension from the MakeHuman base
mesh, targets, skins, hair, clothes and shoes (MakeHuman system assets and community asset packs, all
released CC0). Each person is defined in `src/data/people.json` and built by `scripts/mh/make_people.py`;
to change or add someone, edit the JSON and run:

    Blender -b --python scripts/mh/make_people.py -- src/data/people.json public/assets/mh [id ...]

The "faceunits" expression pack was not used because its licence is not stated.
Mesh compression: Draco (decoder in `assets/draco`, Apache 2.0, Google).

## Painted city skylines and commute scenes

Files: `assets/backdrops/city-*.jpg` (8 cities) and `assets/backdrops/commute-*.jpg` (bike, transit, car,
ride-share). Generated for this game with Creatify (nano-banana-2) on 2026-11-11, same style brief as the
room backdrops.

## Depth for painted scenes (prototype, 2026-11-12)

`backdrops/<id>-depth.png` are baked by `scripts/bake_depth.py` with Depth Anything V2 Small
(Apache 2.0, https://huggingface.co/depth-anything/Depth-Anything-V2-Small-hf), run locally. Every painted
room and commute scene has one (32 maps), and each of the 8 city skylines (40 in all).

## Voice (prototype, 2026-11-12)

`voice/arrival-officer-*.mp3`: the border officer's lines on arrival day, ElevenLabs eleven_v3, voice "Bill",
generated with the project owner's ElevenLabs Startup Grant. Check the grant terms before release:
they were confirmed for social channels, not for a game or an open-source repository.
