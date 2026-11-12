"""Install downloaded MakeHuman asset packs (zips) into MPFB's user data, then list what is available."""
import sys, glob, os, json, bpy
src = sys.argv[sys.argv.index("--") + 1]
from bl_ext.blender_org.mpfb.services.assetservice import AssetService
from bl_ext.blender_org.mpfb.services.locationservice import LocationService
data_dir = LocationService.get_user_data()
print("DATA_DIR", data_dir)
for z in sorted(glob.glob(os.path.join(src, "*.zip"))):
    err = AssetService.check_asset_pack_zip(z)
    res = AssetService.fix_and_extract_asset_pack_zip(z, data_dir) if err in (None, "MACOS", "STRUCTURE") else err
    print("PACK", os.path.basename(z), "check:", err, "extract:", res)
AssetService.update_all_asset_lists()
out = {}
for sub, kind in [("clothes", "mhclo"), ("hair", "mhclo"), ("eyebrows", "mhclo"), ("eyelashes", "mhclo"), ("eyes", "mhclo"), ("teeth", "mhclo"), ("tongue", "mhclo"), ("proxymeshes", "proxy")]:
    try:
        out[sub] = sorted(str(p) for p in (AssetService.list_proxy_assets(sub) if kind == "proxy" else AssetService.list_mhclo_assets(sub)))
    except Exception as e:
        out[sub] = ["ERR " + str(e)]
out["skins"] = sorted(str(p) for p in AssetService.list_mhmat_assets("skins"))
json.dump(out, open("/tmp/mh_assets.json", "w"), indent=1)
for k, v in out.items():
    print("COUNT", k, len(v))
