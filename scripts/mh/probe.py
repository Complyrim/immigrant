"""Probe: create a default MakeHuman person with the game-engine rig and export it as GLB."""
import sys, bpy
out = sys.argv[sys.argv.index("--") + 1]
from bl_ext.blender_org.mpfb.services.humanservice import HumanService
from bl_ext.blender_org.mpfb.services.targetservice import TargetService
bpy.ops.wm.read_factory_settings(use_empty=True)
macro = TargetService.get_default_macro_info_dict()
print("MACRO", macro)
basemesh = HumanService.create_human(scale=0.1, macro_detail_dict=macro)
HumanService.add_builtin_rig(basemesh, "game_engine")
rig = basemesh.parent
print("RIG", rig, [b.name for b in rig.data.bones][:8], "verts", len(basemesh.data.vertices))
print("SHAPEKEYS", [k.name for k in basemesh.data.shape_keys.key_blocks][:12] if basemesh.data.shape_keys else None)
bpy.ops.object.select_all(action="SELECT")
bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", use_selection=True, export_apply=True, export_animations=False)
print("EXPORTED", out)
