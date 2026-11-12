import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

/**
 * Real photoscanned materials and sky lighting from Poly Haven (CC0). Files live in
 * public/assets (see public/assets/CREDITS.md). Textures stream in after a scene
 * builds, so a surface shows its flat colour for a moment and then sharpens.
 */
const base = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
const loader = new THREE.TextureLoader();
const texCache = new Map<string, THREE.Texture>();
let maxAniso = 4;

export function setMaxAnisotropy(n: number): void {
  maxAniso = Math.max(1, Math.min(8, n));
}

function tex(path: string, srgb: boolean): THREE.Texture {
  const hit = texCache.get(path);
  if (hit) return hit;
  const t = loader.load(`${base}/assets/${path}`);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = maxAniso;
  texCache.set(path, t);
  return t;
}

export type PbrId =
  | 'brick_wall_005' | 'asphalt_02' | 'concrete_floor' | 'worn_tile_floor' | 'interior_tiles'
  | 'painted_plaster_wall' | 'beige_wall_001' | 'wood_floor' | 'wood_floor_deck' | 'plank_flooring'
  | 'brown_leather' | 'cobblestone_04' | 'concrete_tiles_02' | 'terrazzo_tiles' | 'blue_floor_tiles_01';

export interface PbrOptions {
  /** Multiplies the photo albedo. Use a pale tint of the scene's colour. */
  color?: THREE.ColorRepresentation;
  /** Tiles across the surface. */
  repeat?: [number, number];
  roughness?: number;
  normalScale?: number;
}

const matCache = new Map<string, THREE.MeshStandardMaterial>();

/** A shared PBR material. Textures are cached; each call with new options clones the maps' settings only. */
export function pbrMaterial(id: PbrId, o: PbrOptions = {}): THREE.MeshStandardMaterial {
  const rep = o.repeat ?? [1, 1];
  const key = `${id}|${new THREE.Color(o.color ?? '#ffffff').getHexString()}|${rep[0].toFixed(2)}|${rep[1].toFixed(2)}|${o.roughness ?? 1}|${o.normalScale ?? 1}`;
  const hit = matCache.get(key);
  if (hit) return hit;
  // Clone textures so each repeat setting is independent but the image data is shared.
  const own = (t: THREE.Texture): THREE.Texture => {
    const c = t.clone();
    c.repeat.set(rep[0], rep[1]);
    c.needsUpdate = true;
    return c;
  };
  const m = new THREE.MeshStandardMaterial({
    color: o.color ?? '#ffffff',
    map: own(tex(`tex/${id}/diff.jpg`, true)),
    normalMap: own(tex(`tex/${id}/nor.jpg`, false)),
    roughnessMap: own(tex(`tex/${id}/rough.jpg`, false)),
    roughness: o.roughness ?? 1,
  });
  m.normalScale.set(o.normalScale ?? 1, o.normalScale ?? 1);
  matCache.set(key, m);
  return m;
}

// ---------------------------------------------------------------- sky lighting

export type HdriId = 'belfast_sunset_puresky' | 'kloofendal_48d_partly_cloudy_puresky' | 'aft_lounge' | 'venice_sunset' | 'moonless_golf';

const hdrCache = new Map<string, Promise<THREE.Texture>>();

/** A prefiltered environment map from a Poly Haven HDRI, for image-based lighting and reflections. */
export function loadHdri(renderer: THREE.WebGLRenderer, id: HdriId): Promise<THREE.Texture> {
  let p = hdrCache.get(id);
  if (!p) {
    p = new Promise<THREE.Texture>((resolve, reject) => {
      new RGBELoader().load(
        `${base}/assets/hdri/${id}.hdr`,
        (hdr) => {
          const pm = new THREE.PMREMGenerator(renderer);
          const env = pm.fromEquirectangular(hdr).texture;
          hdr.dispose();
          pm.dispose();
          resolve(env);
        },
        undefined,
        reject,
      );
    });
    hdrCache.set(id, p);
  }
  return p;
}
