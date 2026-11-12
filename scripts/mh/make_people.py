"""
Generate distinct MakeHuman people as game-ready GLB files.

    Blender -b --python make_people.py -- cast.json out_dir [only_id ...]

Each cast entry sets body sliders (gender, age, weight, muscle, height, proportions, ancestry mix), a skin,
hair, eyebrows, clothes and shoes. Output: <out_dir>/<id>.glb with the game-engine skeleton (bone names
match the animation library), textures shrunk to 1024 px WebP (keeps the transparency hair and lashes need).
"""
import sys, os, json, glob, bpy

argv = sys.argv[sys.argv.index("--") + 1:]
cast_file, out_dir, only = argv[0], argv[1], set(argv[2:])
from bl_ext.blender_org.mpfb.services.humanservice import HumanService
from bl_ext.blender_org.mpfb.services.targetservice import TargetService
from bl_ext.blender_org.mpfb.services.assetservice import AssetService

AssetService.update_all_asset_lists()
INDEX = {}
for sub in ["clothes", "hair", "eyebrows", "eyelashes", "eyes", "teeth"]:
    for p in AssetService.list_mhclo_assets(sub):
        INDEX[(sub, os.path.basename(os.path.dirname(str(p))))] = str(p)
for p in AssetService.list_mhmat_assets("skins"):
    INDEX[("skins", os.path.basename(os.path.dirname(str(p))))] = str(p)

def asset(sub, name):
    p = INDEX.get((sub, name))
    if not p:
        raise RuntimeError(f"missing asset {sub}/{name}")
    return p

import random, re
import bl_ext.blender_org.mpfb as _mpfb
TARGETS = os.path.join(os.path.dirname(_mpfb.__file__), "data", "targets")

# Face sliders: (folder, stem, both sides). A value below zero loads the "-decr" file, above zero "-incr".
FACE = [("nose", "nose-scale-horiz", 0), ("nose", "nose-scale-vert", 0), ("nose", "nose-scale-depth", 0), ("nose", "nose-hump", 0),
        ("nose", "nose-point-width", 0), ("nose", "nose-flaring", 0), ("nose", "nose-nostrils-width", 0),
        ("chin", "chin-width", 0), ("chin", "chin-height", 0), ("chin", "chin-prominent", 0), ("chin", "chin-bones", 0),
        ("mouth", "mouth-scale-horiz", 0), ("mouth", "mouth-scale-vert", 0), ("mouth", "mouth-lowerlip-volume", 0),
        ("head", "head-scale-horiz", 0), ("head", "head-scale-vert", 0), ("head", "head-fat", 0),
        ("forehead", "forehead-scale-vert", 0), ("forehead", "forehead-temple", 0),
        ("cheek", "cheek-bones", 1), ("cheek", "cheek-volume", 1), ("eyes", "eye-scale", 1), ("eyes", "eye-height2", 1),
        ("ears", "ear-scale", 1), ("ears", "ear-wing", 1)]
SHAPES = ["oval", "round", "square", "rectangular", "diamond", "triangular", "invertedtriangular"]

def tfile(folder, name):
    p = os.path.join(TARGETS, folder, name + ".target.gz")
    return p if os.path.exists(p) else None

def shape_face(base, spec):
    """Give each person their own nose, jaw, mouth, cheeks, eyes, ears and head shape (repeatable per id)."""
    rnd = random.Random(spec.get("faceSeed", spec["id"]))
    amp = spec.get("faceAmp", 0.62)
    loads = []
    for folder, stem, sided in FACE:
        v = rnd.uniform(-amp, amp)
        v = spec.get("face", {}).get(stem, v)
        if abs(v) < 0.08:
            continue
        suffix = "-incr" if v > 0 else "-decr"
        for side in (("l-", "r-") if sided else ("",)):
            f = tfile(folder, side + stem + suffix)
            if f:
                loads.append((f, abs(v)))
    f = tfile("head", "head-" + spec.get("headShape", rnd.choice(SHAPES)))
    if f:
        loads.append((f, rnd.uniform(0.3, 0.7)))
    for name, w in spec.get("targets", {}).items():
        folder = name.split("/")[0]
        f = tfile(folder, name.split("/")[1])
        if f:
            loads.append((f, w))
        else:
            print("NO TARGET", name)
    for f, w in loads:
        TargetService.load_target(base, f, weight=w)
    return len(loads)

def apply_masks(ob):
    """Delete the geometry the mask modifiers hide (helper shapes, skin under clothes). The exporter cannot
    apply modifiers on a mesh that keeps shape keys, and the face needs its blink and mouth shapes."""
    import bmesh
    kill = set()
    for m in [m for m in ob.modifiers if m.type == "MASK"]:
        if m.vertex_group in ob.vertex_groups:
            gi = ob.vertex_groups[m.vertex_group].index
            for v in ob.data.vertices:
                inside = any(g.group == gi and g.weight > 0 for g in v.groups)
                if inside == bool(m.invert_vertex_group):
                    kill.add(v.index)
        ob.modifiers.remove(m)
    bm = bmesh.new()
    bm.from_mesh(ob.data)
    bm.verts.ensure_lookup_table()
    bmesh.ops.delete(bm, geom=[bm.verts[i] for i in kill], context="VERTS")
    bm.to_mesh(ob.data)
    bm.free()

def cull_covered(base, reach=0.035):
    """Remove skin that lies under clothes or shoes, so it can never poke through when the body moves.
    A vertex goes only if it and all its neighbours are covered, which leaves a rim of skin under every
    hem, cuff and neckline."""
    import bmesh
    from mathutils.bvhtree import BVHTree
    verts, polys = [], []
    for ob in bpy.data.objects:
        if ob.type != "MESH" or not (ob.name.startswith("cloth__") or ob.name.startswith("shoe__")):
            continue
        off = len(verts)
        mw = ob.matrix_world
        verts.extend(mw @ v.co for v in ob.data.vertices)
        polys.extend([off + i for i in p.vertices] for p in ob.data.polygons)
    if not polys:
        return 0
    tree = BVHTree.FromPolygons(verts, polys)
    mw = base.matrix_world
    rot = mw.to_3x3()
    covered = set()
    for v in base.data.vertices:
        o = mw @ v.co
        n = (rot @ v.normal).normalized()
        hit = tree.ray_cast(o - n * 0.002, n, reach)
        if hit[0] is not None:
            covered.add(v.index)
    bm = bmesh.new()
    bm.from_mesh(base.data)
    bm.verts.ensure_lookup_table()
    kill = []
    for v in bm.verts:
        if v.index in covered and all(e.other_vert(v).index in covered for e in v.link_edges):
            ring2 = all(e2.other_vert(e.other_vert(v)).index in covered for e in v.link_edges for e2 in e.other_vert(v).link_edges)
            if ring2:
                kill.append(v)
    n = len(kill)
    bmesh.ops.delete(bm, geom=kill, context="VERTS")
    bm.to_mesh(base.data)
    bm.free()
    return n

def add_expressions(base, spec):
    """Three face shapes kept for the game to animate: blink, mouth open, smile."""
    TargetService.bake_targets(base)
    race = max(spec.get("race", {"caucasian": 1}).items(), key=lambda kv: kv[1])[0]
    d = os.path.join(TARGETS, "expression", "units", race)
    for out, names in (("blink", ["eye-left-closure", "eye-right-closure"]), ("open", ["mouth-open"]), ("smile", ["mouth-corner-puller", "mouth-elevation"])):
        keys = [TargetService.load_target(base, os.path.join(d, n + ".target.gz"), weight=(0.6 if out == "smile" else 1.0)) for n in names]
        base.shape_key_add(name=out, from_mix=True)
        for k in keys:
            base.shape_key_remove(k)
        base.data.shape_keys.key_blocks[out].value = 0.0

def kind_of(sub, name):
    if sub != "clothes":
        return {"eyes": "eyes", "eyebrows": "brows", "eyelashes": "lashes", "hair": "hair"}[sub]
    if re.search(r"beard|moustache", name):
        return "beard"
    if re.search(r"glasses", name):
        return "glasses"
    if re.search(r"hat|cap$|fedora", name):
        return "hat"
    if re.search(r"shoes|boots|flats|booties|t-bar", name):
        return "shoe"
    return "cloth"

def add(base, sub, name, kind):
    before = set(bpy.data.objects)
    HumanService.add_mhclo_asset(asset(sub, name), base, asset_type=kind, subdiv_levels=0, material_type="GAMEENGINE")
    tag = kind_of(sub, name) + "__" + name
    for ob in set(bpy.data.objects) - before:
        if ob.type == "MESH":
            ob.name = tag
            ob.data.name = tag
            for sl in ob.material_slots:
                if sl.material:
                    sl.material.name = tag

EYE_DIR = os.path.join(os.path.dirname(os.path.dirname(asset("eyes", "high-poly"))), "materials")

def eye_colour(spec):
    """Mostly browns, as in most of the world; lighter colours only where the ancestry mix makes them plausible."""
    if spec.get("eyeColor"):
        return spec["eyeColor"]
    rnd = random.Random(spec["id"] + "eyes")
    cauc = spec.get("race", {}).get("caucasian", 0.33)
    if cauc > 0.6:
        return rnd.choice(["brown", "brownlight", "blue", "bluegreen", "green", "grey", "brown"])
    if cauc > 0.4:
        return rnd.choice(["brown", "brown", "brownlight", "brownlight", "green"])
    return "brown"

def set_eye_colour(spec):
    png = os.path.join(EYE_DIR, eye_colour(spec) + "_eye.png")
    img = bpy.data.images.load(png, check_existing=True)
    for ob in bpy.data.objects:
        if ob.type == "MESH" and ob.name.startswith("eyes__"):
            for sl in ob.material_slots:
                if sl.material and sl.material.use_nodes:
                    for node in sl.material.node_tree.nodes:
                        if node.type == "TEX_IMAGE":
                            node.image = img

def build(spec):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    macro = TargetService.get_default_macro_info_dict()
    for k in ["gender", "age", "muscle", "weight", "proportions", "height", "cupsize", "firmness"]:
        if k in spec:
            macro[k] = spec[k]
    if "race" in spec:
        macro["race"] = spec["race"]
    base = HumanService.create_human(scale=0.1, macro_detail_dict=macro)
    nface = shape_face(base, spec)
    HumanService.add_builtin_rig(base, "game_engine")
    HumanService.set_character_skin(asset("skins", spec["skin"]), base, skin_type="GAMEENGINE")
    base.name = "body__skin"
    for sl in base.material_slots:
        if sl.material:
            sl.material.name = "body__skin"
    add(base, "eyes", "low-poly", "Eyes")
    set_eye_colour(spec)
    add(base, "eyebrows", spec.get("eyebrows", "eyebrow001"), "Eyebrows")
    add(base, "eyelashes", spec.get("eyelashes", "eyelashes01"), "Eyelashes")
    if spec.get("hair"):
        add(base, "hair", spec["hair"], "Hair")
    for name in spec.get("clothes", []):
        add(base, "clothes", name, "Clothes")
    rig = base.parent
    # Bone names as the animation library expects them.
    for old, new in (("Root", "root"), ("head", "Head")):
        if old in rig.data.bones:
            rig.data.bones[old].name = new
    # Cleaned copies of CC0 textures (a project logo painted out of two shirts).
    patched = os.path.join(os.path.dirname(os.path.abspath(__file__)), "patched")
    for img in bpy.data.images:
        alt = os.path.join(patched, os.path.basename(bpy.path.abspath(img.filepath)))
        if img.filepath and os.path.exists(alt):
            img.filepath = alt
            img.reload()
    skin_imgs = set()
    for mat in bpy.data.materials:
        if not mat.use_nodes:
            continue
        for node in mat.node_tree.nodes:
            # The illustrated look has no use for fine surface relief, and dropping it saves download size.
            if node.type == "NORMAL_MAP":
                for out in node.outputs:
                    for link in list(out.links):
                        mat.node_tree.links.remove(link)
            if node.type == "TEX_IMAGE" and node.image and mat.name.startswith("body__"):
                skin_imgs.add(node.image.name)
    for img in bpy.data.images:
        cap = 1024 if img.name in skin_imgs else 512
        if img.size[0] > cap or img.size[1] > cap:
            img.scale(min(cap, img.size[0]), min(cap, img.size[1]))
    for ob in bpy.data.objects:
        if ob.type == "MESH":
            for m in list(ob.modifiers):
                if m.type == "SUBSURF":
                    ob.modifiers.remove(m)
    add_expressions(base, spec)
    apply_masks(base)
    culled = cull_covered(base)
    # Phone budgets: some community shoes and suits are modelled far denser than a game can afford.
    BUDGET = {"shoe": 2400, "cloth": 6000, "hair": 4500, "beard": 1500, "glasses": 1200, "hat": 1500}
    for ob in bpy.data.objects:
        if ob.type != "MESH" or "__" not in ob.name:
            continue
        cap = BUDGET.get(ob.name.split("__")[0])
        tris = sum(len(p.vertices) - 2 for p in ob.data.polygons)
        if cap and tris > cap:
            d = ob.modifiers.new("Budget", "DECIMATE")
            d.ratio = cap / tris
            d.use_collapse_triangulate = True
    bpy.ops.object.select_all(action="SELECT")
    out = os.path.join(out_dir, spec["id"] + ".glb")
    bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", use_selection=True, export_apply=True, export_animations=False,
                              export_image_format="WEBP", export_image_quality=76, export_morph=True, export_morph_normal=False, export_morph_tangent=False, export_try_sparse_sk=True, export_yup=True,
                              export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=6,
                              export_draco_position_quantization=14, export_draco_normal_quantization=10, export_draco_texcoord_quantization=12)
    print("BUILT", spec["id"], "%.2fMB" % (os.path.getsize(out) / 1e6), "face targets", nface, "skin hidden", culled, "meshes", [o.name for o in bpy.data.objects if o.type == "MESH"])

os.makedirs(out_dir, exist_ok=True)
for spec in json.load(open(cast_file)):
    if only and spec["id"] not in only:
        continue
    try:
        build(spec)
    except Exception as e:
        import traceback
        print("FAILED", spec.get("id"), e)
        traceback.print_exc()
