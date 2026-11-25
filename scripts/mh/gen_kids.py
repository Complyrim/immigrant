"""
Write the children's cast (scripts/mh/kids.json) from the adult cast in src/data/people.json.

    python3 scripts/mh/gen_kids.py

Each home country gets one child at two ages: `<cc>_kid` (about 4) and `<cc>_teen` (about 13 or 14), the same
child growing up, so the same sex in both. They take the ancestry mix, skin texture, skin tint and hair
colour of that country's player cast (`<cc>_f1` / `<cc>_m1`), so they look like the player's own family.
Build them with make_people.py; `--merge` also writes them into people.json (adult entries untouched).
"""
import json, os, sys, hashlib

HERE = os.path.dirname(os.path.abspath(__file__))
PEOPLE = os.path.join(HERE, "..", "..", "src", "data", "people.json")
OUT = os.path.join(HERE, "kids.json")

people = json.load(open(PEOPLE))
by_id = {p["id"]: p for p in people if not p.get("ageBand") in ("child", "teen")}
groups = []
for p in people:
    if p["id"].endswith("_f1") and p["group"] != "us" and p["group"] not in [g for g, _ in groups]:
        groups.append((p["group"], p["id"][:2]))

# MakeHuman's age slider: 0 = 1 year, 0.1875 = 11 years, 0.5 = 25 years.
def mh_age(years):
    return (years - 1) / 10 * 0.1875 if years <= 11 else 0.1875 + (years - 11) / 14 * 0.3125

def young_skin(skin, sex):
    """Children's skin: the parent's texture family, never an aged or made-up one."""
    s = skin.replace("middleage_", "young_").replace("mindfront_skin_male_african_middleage", "young_african_male")
    s = s.replace("onlytheghosts_middle_aged_eurasian_female", "onlytheghosts_young_eurasian_female")
    return s

AFRO = lambda race: race.get("african", 0) >= 0.5
HAIR = {
    ("f", "kid", False): ["braid01", "long01", "toigo_blunt_bob_with_bangs"],
    ("f", "kid", True): ["elvs_french_braid_variation", "braid01"],
    ("m", "kid", False): ["short02", "cortu_short_messy_hair", "short01"],
    ("m", "kid", True): ["short04", "afro01"],
    ("f", "teen", False): ["long01", "ponytail01", "o4saken_long01", "bob02"],
    ("f", "teen", True): ["elvs_french_braid_variation", "braid01", "elvs_reverse_french_braid_bun"],
    ("m", "teen", False): ["cortu_short_messy_hair", "short02", "short04"],
    ("m", "teen", True): ["short04", "afro01"],
}
CLOTHES = {
    ("f", "kid"): [["toigo_basic_tucked_t-shirt", "cortu_cargo_pants", "toigo_ballet_flats"],
                   ["toigo_basic_tucked_t-shirt", "toigo_tiered_skirt", "toigo_ballet_flats"]],
    ("m", "kid"): [["elvs_crude_t-shirt_male", "cortu_cargo_pants", "shoes02"],
                   ["namuhekam_male_polo_shirt", "cortu_cargo_pants", "shoes03"]],
    ("f", "teen"): [["toigo_fisherman_sweater", "toigo_wool_pants", "toigo_ankle_boots_female"],
                    ["toigo_basic_tucked_t-shirt", "toigo_wool_pants", "shoes03"]],
    ("m", "teen"): [["male_casualsuit03", "shoes03"], ["elvs_crude_t-shirt_male", "cortu_cargo_pants", "shoes02"]],
}
COLOURS = ["#c9473e", "#e0a23f", "#2f8a6a", "#4a6fd6", "#7a5cb0", "#d6708a", "#2e7d9a", "#e07a3f"]
TOPS = {"toigo_basic_tucked_t-shirt", "elvs_crude_t-shirt_male", "namuhekam_male_polo_shirt", "toigo_fisherman_sweater"}
BOTTOMS = {"cortu_cargo_pants": "#3a4a6a", "toigo_wool_pants": "#33384a", "toigo_tiered_skirt": "#3a4a6a"}

def pick(seq, key):
    return seq[int(hashlib.md5(key.encode()).hexdigest(), 16) % len(seq)]

kids = []
for i, (group, cc) in enumerate(groups):
    # The same child at both ages; boys and girls alternate across countries.
    sex = "f" if i % 2 == 0 else "m"
    parent = by_id.get(f"{cc}_{sex}1") or by_id[f"{cc}_f1"]
    other = by_id.get(f"{cc}_{'m' if sex == 'f' else 'f'}1")
    race = parent["race"]
    skin, tint = young_skin(parent["skin"], sex), parent.get("skinTint")
    # Where the two parents look clearly different (the Dominican Republic, Brazil), the child takes after both:
    # the mean ancestry mix and a mid-brown skin between theirs.
    if other and abs(other["race"].get("african", 0) - race.get("african", 0)) >= 0.15:
        race = {k: round((race.get(k, 0) + other["race"].get(k, 0)) / 2, 3) for k in ("asian", "caucasian", "african")}
        skin, tint = f"toigo_light_skin_{'female' if sex == 'f' else 'male'}_bronze", "#bf8f66"
    for stage, years in (("kid", 4), ("teen", 13.5)):
        key = f"{cc}_{stage}"
        hair = pick(HAIR[(sex, stage, AFRO(race))], key)
        clothes = pick(CLOTHES[(sex, stage)], key)
        tints = {}
        for c in clothes:
            if c in TOPS:
                tints[c] = {"color": pick(COLOURS, key + c)}
            elif c in BOTTOMS:
                tints[c] = {"color": BOTTOMS[c]}
        spec = {
            "id": key, "group": group, "sex": sex, "ageBand": "child" if stage == "kid" else "teen", "roles": ["child"],
            "gender": 0.0 if sex == "f" else 1.0, "age": round(mh_age(years), 3),
            "weight": 0.38 if stage == "teen" else 0.5, "muscle": 0.4 if stage == "teen" else 0.5, "height": 0.5,
            "cupsize": 0.15 if stage == "teen" else 0.5,
            "proportions": 0.5, "race": race,
            "skin": skin, "hair": hair,
            "eyebrows": "eyebrow001" if stage == "kid" else "eyebrow002",
            "clothes": clothes,
            # Skin and hair colour come from the parent so the child reads as theirs.
            "hairTint": parent.get("hairTint") or (other or {}).get("hairTint") or "#1a1412",
            "tints": tints,
            "faceAmp": 0.35,
        }
        if tint:
            spec["skinTint"] = tint
        kids.append(spec)

if "--merge" in sys.argv:
    keep = [p for p in people if p.get("ageBand") not in ("child", "teen")]
    json.dump(keep + kids, open(PEOPLE, "w"), indent=2, ensure_ascii=False)
    open(PEOPLE, "a").write("\n")
    print("merged", len(kids), "children into people.json")
json.dump(kids, open(OUT, "w"), indent=1)
print("wrote", len(kids), "children to", OUT)
