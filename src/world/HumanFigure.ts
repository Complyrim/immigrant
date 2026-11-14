import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';
import type { Pose } from '../engine/types';
import type { FigureLook } from './Figure';
import { clothMaterial, type ClothSpec } from './cloth';

/**
 * Realistic people: the CC0 Quaternius "Universal Base Characters" bodies animated
 * with the CC0 "Universal Animation Library" motion-capture style clips. The free
 * bodies ship unclothed, so shirt, trousers and shoes are cut from the body mesh
 * itself (by bone weights) and share its skeleton. See public/assets/CREDITS.md.
 */
const base = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');

interface Assets {
  male: THREE.Group;
  female: THREE.Group;
  clips: Map<string, THREE.AnimationClip>;
  hair: Map<string, THREE.SkinnedMesh>;
  light: { male: THREE.Texture; female: THREE.Texture };
}

let assets: Assets | null = null;
let loading: Promise<boolean> | null = null;

export function humansReady(): boolean {
  return assets !== null;
}

/** The shared animation clips, once loaded. */
export function humanClips(): Map<string, THREE.AnimationClip> | null {
  return assets?.clips ?? null;
}

/** Start loading once (call at app start). Resolves false if anything failed, so callers can keep the procedural figures. */
export function loadHumans(withBodies = true): Promise<boolean> {
  if (!loading) {
    loading = (async () => {
      try {
        const gl = new GLTFLoader();
        if (!withBodies) {
          // The generated cast brings its own bodies; only the shared animation clips are needed.
          const anim = await gl.loadAsync(`${base}/assets/anim/ual1.glb`);
          const clips = new Map<string, THREE.AnimationClip>();
          for (const c of anim.animations) clips.set(c.name, c);
          const blank = new THREE.Texture();
          assets = { male: new THREE.Group(), female: new THREE.Group(), clips, hair: new Map(), light: { male: blank, female: blank } };
          return true;
        }
        const tl = new THREE.TextureLoader();
        const lightTex = (f: string): Promise<THREE.Texture> =>
          tl.loadAsync(`${base}/assets/people/tex/${f}`).then((t) => {
            t.flipY = false;
            t.colorSpace = THREE.SRGBColorSpace;
            t.wrapS = t.wrapT = THREE.RepeatWrapping;
            return t;
          });
        const hairNames = ['Hair_Buzzed', 'Hair_BuzzedFemale', 'Hair_Long', 'Hair_Buns', 'Hair_SimpleParted', 'Hair_Beard'];
        const hairs = Promise.all(hairNames.map((n) => gl.loadAsync(`${base}/assets/people/hair/${n}.gltf`)));
        const [male, female, anim, lm, lf, hairGltf] = await Promise.all([
          gl.loadAsync(`${base}/assets/people/male.gltf`),
          gl.loadAsync(`${base}/assets/people/female.gltf`),
          gl.loadAsync(`${base}/assets/anim/ual1.glb`),
          lightTex('male_light.jpg'),
          lightTex('female_light.jpg'),
          hairs,
        ]);
        const hair = new Map<string, THREE.SkinnedMesh>();
        hairGltf.forEach((g, i) => {
          g.scene.traverse((o) => {
            if ((o as THREE.SkinnedMesh).isSkinnedMesh && !hair.has(hairNames[i])) hair.set(hairNames[i], o as THREE.SkinnedMesh);
          });
        });
        const clips = new Map<string, THREE.AnimationClip>();
        for (const c of anim.animations) clips.set(c.name, c);
        assets = { male: male.scene, female: female.scene, clips, hair, light: { male: lm, female: lf } };
        return true;
      } catch (err) {
        console.warn('Realistic people failed to load; using procedural figures.', err);
        return false;
      }
    })();
  }
  return loading;
}

/* --------------------------------------------------------------- pose mapping */

type ClipName = string;
interface PoseClip {
  clip: ClipName;
  /** Freeze on the last frame (lying down). */
  hold?: boolean;
  speed?: number;
}

export const STANDING: Record<Pose, PoseClip> = {
  idle: { clip: 'Idle_Loop' },
  talk: { clip: 'Idle_Talking_Loop' },
  sit: { clip: 'Sitting_Idle_Loop' },
  wave: { clip: 'Interact', speed: 0.8 },
  phone: { clip: 'Idle_Loop' },
  walk: { clip: 'Walk_Loop' },
  type: { clip: 'Sitting_Idle_Loop' },
  think: { clip: 'Idle_Loop', speed: 0.6 },
  carry: { clip: 'Idle_Loop' },
  present: { clip: 'Idle_Talking_Loop', speed: 0.85 },
  cheer: { clip: 'Dance_Loop', speed: 0.8 },
  sleep: { clip: 'Death01', hold: true },
  dance: { clip: 'Dance_Loop' },
  cook: { clip: 'Interact', speed: 0.7 },
  eat: { clip: 'Sitting_Idle_Loop' },
  exercise: { clip: 'Jog_Fwd_Loop', speed: 0.9 },
  laugh: { clip: 'Idle_Talking_Loop', speed: 1.2 },
};

export const SEATED_TALK: ReadonlySet<Pose> = new Set<Pose>(['talk', 'laugh', 'present', 'wave']);

/* ------------------------------------------------------------ gesture overlays */

/**
 * Extra bone rotations layered over the clip after it plays, for poses the library has
 * no clip for. Angles are radians in each bone's own frame: for the arms local X swings
 * forward (positive) or back, local Z swings out (right arm -, left arm +); for the head
 * local Y turns and local X nods.
 */
interface Rot {
  bone: string;
  x?: number;
  y?: number;
  z?: number;
}
type Gesture = (t: number) => Rot[];
const wob = (t: number, hz: number, amp: number): number => Math.sin(t * Math.PI * 2 * hz) * amp;

export const GESTURES: Partial<Record<Pose, Gesture>> = {
  phone: (t) => [
    { bone: 'upperarm_r', x: 0.5, z: -0.1 },
    { bone: 'lowerarm_r', x: 2.05 },
    { bone: 'Head', z: -0.12, y: wob(t, 0.3, 0.06) },
  ],
  wave: (t) => [
    { bone: 'upperarm_r', z: -2.35, x: 0.2 },
    { bone: 'lowerarm_r', z: wob(t, 2.2, 0.45), x: 0.35 },
  ],
  type: (t) => [
    { bone: 'upperarm_r', x: 0.4 },
    { bone: 'upperarm_l', x: 0.4 },
    { bone: 'lowerarm_r', x: 1.15 + wob(t, 5, 0.04) },
    { bone: 'lowerarm_l', x: 1.15 + wob(t + 0.3, 4.3, 0.04) },
    { bone: 'Head', x: 0.18 },
  ],
  think: () => [
    { bone: 'upperarm_r', x: 0.55 },
    { bone: 'lowerarm_r', x: 2.4 },
    { bone: 'Head', x: 0.16, z: 0.1 },
  ],
  carry: () => [
    { bone: 'upperarm_r', x: 0.75, z: 0.15 },
    { bone: 'upperarm_l', x: 0.75, z: -0.15 },
    { bone: 'lowerarm_r', x: 1.1 },
    { bone: 'lowerarm_l', x: 1.1 },
  ],
  cheer: (t) => [
    { bone: 'upperarm_r', z: -2.75 - wob(t, 2, 0.18), x: 0.15 },
    { bone: 'upperarm_l', z: 2.75 + wob(t + 0.25, 2, 0.18), x: 0.15 },
    { bone: 'Head', x: -0.15 },
  ],
  present: (t) => [
    { bone: 'upperarm_r', x: 0.55, z: -0.35 - wob(t, 0.7, 0.12) },
    { bone: 'lowerarm_r', x: 0.85 + wob(t, 0.9, 0.15) },
  ],
  eat: (t) => {
    const k = (Math.sin(t * 1.6) + 1) / 2;
    return [
      { bone: 'upperarm_r', x: 0.35 + k * 0.15 },
      { bone: 'lowerarm_r', x: 1.1 + k * 1.0 },
      { bone: 'Head', x: 0.08 + k * 0.1 },
    ];
  },
  laugh: (t) => [
    { bone: 'spine_02', x: wob(t, 5.5, 0.045) },
    { bone: 'Head', x: -0.12 + wob(t, 5.5, 0.07) },
  ],
};

/* -------------------------------------------------------------- clothing shells */

type Region = 'shirt' | 'pants' | 'shoes' | 'sole' | 'skirt' | 'shorts' | 'coat' | 'kurta' | 'dress';

/** Whether a skinned vertex belongs to a garment, from its dominant bone and bind-pose height (0 feet, 1 head). Garments overlap at the waist so no skin shows between them. */
function inRegion(region: Region, bone: string, y01: number, longSleeves: boolean): boolean {
  const thigh = bone.startsWith('thigh_');
  const calf = bone.startsWith('calf_');
  const torso = (sleeves: 'short' | 'long' | 'three-quarter'): boolean =>
    bone.startsWith('spine_') ||
    bone.startsWith('clavicle_') ||
    bone.startsWith('upperarm_') ||
    (sleeves === 'long' && bone.startsWith('lowerarm_')) ||
    (sleeves === 'three-quarter' && bone.startsWith('lowerarm_') && y01 > 0.52);
  switch (region) {
    case 'shoes':
      return bone.startsWith('foot_') || bone.startsWith('ball_') || (calf && y01 < 0.075);
    case 'sole':
      return (bone.startsWith('foot_') || bone.startsWith('ball_')) && y01 < 0.02;
    case 'pants':
      return thigh || (calf && y01 >= 0.075) || (bone === 'pelvis' && y01 < 0.58);
    case 'skirt':
      return (bone === 'pelvis' && y01 < 0.58) || (thigh && y01 > 0.3);
    case 'shorts':
      return (bone === 'pelvis' && y01 < 0.58) || (thigh && y01 > 0.31);
    case 'coat':
      return torso('long') || bone === 'pelvis' || (thigh && y01 > 0.27);
    case 'kurta':
      return torso('three-quarter') || bone === 'pelvis' || (thigh && y01 > 0.29);
    case 'dress':
      return torso('short') || bone === 'pelvis' || (thigh && y01 > 0.29);
    default:
      // A level hem: everything above the hip line, whichever bone moves it.
      return torso(longSleeves ? 'long' : 'short') || ((bone === 'pelvis' || thigh) && y01 > 0.522);
  }
}
/** How much each garment relaxes toward a smooth, hanging shape, and how far its hem flares out. */
const SMOOTH: Record<Region, number> = { shirt: 20, pants: 7, shoes: 2, sole: 1, skirt: 10, shorts: 7, coat: 22, kurta: 22, dress: 22 };
const FLARE: Partial<Record<Region, number>> = { skirt: 0.45, dress: 0.4, coat: 0.22, kurta: 0.25 };
/** Extra body for loose garments around the torso. */
const INFLATE: Partial<Record<Region, number>> = { coat: 0.1, kurta: 0.08, dress: 0.05, shirt: 0.05 };

const shellCache = new Map<string, THREE.BufferGeometry | null>();

function shellGeometry(body: THREE.SkinnedMesh, key: string, region: Region, offset: number, longSleeves: boolean): THREE.BufferGeometry | null {
  const hit = shellCache.get(key);
  if (hit !== undefined) return hit;
  const geo = buildShell(body, region, offset, longSleeves);
  shellCache.set(key, geo);
  return geo;
}

function makeShell(body: THREE.SkinnedMesh, key: string, region: Region, offset: number, longSleeves: boolean, material: THREE.Material): THREE.SkinnedMesh | null {
  const out = shellGeometry(body, key, region, offset, longSleeves);
  if (!out) return null;
  const mesh = new THREE.SkinnedMesh(out, material);
  mesh.bind(body.skeleton, body.bindMatrix);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.frustumCulled = false;
  return mesh;
}

function buildShell(body: THREE.SkinnedMesh, region: Region, offset: number, longSleeves: boolean): THREE.BufferGeometry | null {
  const g = body.geometry;
  const pos = g.getAttribute('position');
  const nor = g.getAttribute('normal');
  const uv = g.getAttribute('uv');
  const si = g.getAttribute('skinIndex');
  const sw = g.getAttribute('skinWeight');
  const index = g.getIndex();
  if (!pos || !nor || !si || !sw || !index) return null;
  if (!g.boundingBox) g.computeBoundingBox();
  const box = g.boundingBox as THREE.Box3;
  const h = box.max.y - box.min.y;
  const bones = body.skeleton.bones;
  const n = pos.count;
  const ok = new Uint8Array(n);
  const isTorso = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    let best = 0;
    let bw = -1;
    for (let k = 0; k < 4; k++) {
      const w = sw.getComponent(i, k);
      if (w > bw) {
        bw = w;
        best = si.getComponent(i, k);
      }
    }
    const y01 = (pos.getY(i) - box.min.y) / h;
    const bn = bones[best]?.name ?? '';
    ok[i] = inRegion(region, bn, y01, longSleeves) ? 1 : 0;
    isTorso[i] = bn.startsWith('spine_') || bn === 'pelvis' ? 1 : 0;
  }
  const tris: number[] = [];
  for (let t = 0; t < index.count; t += 3) {
    const a = index.getX(t);
    const b = index.getX(t + 1);
    const c = index.getX(t + 2);
    if (ok[a] && ok[b] && ok[c]) tris.push(a, b, c);
  }
  if (!tris.length) return null;
  // Vertices that share a position (UV seams) are treated as one so the cloth stays closed.
  const keyOf = (i: number): string => `${Math.round(pos.getX(i) * 2000)},${Math.round(pos.getY(i) * 2000)},${Math.round(pos.getZ(i) * 2000)}`;
  const ids = new Int32Array(n);
  const keyId = new Map<string, number>();
  for (let i = 0; i < n; i++) {
    const k = keyOf(i);
    let id = keyId.get(k);
    if (id === undefined) {
      id = keyId.size;
      keyId.set(k, id);
    }
    ids[i] = id;
  }
  const nu = keyId.size;
  const U = new Float32Array(nu * 3);
  const N = new Float32Array(nu * 3);
  for (let i = 0; i < n; i++) {
    const u = ids[i] * 3;
    U[u] = pos.getX(i);
    U[u + 1] = pos.getY(i);
    U[u + 2] = pos.getZ(i);
    N[u] += nor.getX(i);
    N[u + 1] += nor.getY(i);
    N[u + 2] += nor.getZ(i);
  }
  for (let u = 0; u < nu; u++) {
    const l = Math.hypot(N[u * 3], N[u * 3 + 1], N[u * 3 + 2]) || 1;
    U[u * 3] += (N[u * 3] / l) * offset;
    U[u * 3 + 1] += (N[u * 3 + 1] / l) * offset;
    U[u * 3 + 2] += (N[u * 3 + 2] / l) * offset;
  }
  // Joint-ness: vertices shared between two bones sit at elbows, waist and knees, where cloth creases.
  const joint = new Float32Array(nu);
  for (let i = 0; i < n; i++) {
    let w1 = 0;
    let w2 = 0;
    for (let k = 0; k < 4; k++) {
      const w = sw.getComponent(i, k);
      if (w > w1) {
        w2 = w1;
        w1 = w;
      } else if (w > w2) w2 = w;
    }
    const j = w1 > 0 ? Math.min(1, w2 / w1) : 0;
    const u = ids[i];
    if (j > joint[u]) joint[u] = j;
  }
  // Only vertices that belong to this garment take part in sizing it.
  const used = new Uint8Array(nu);
  for (let t = 0; t < tris.length; t++) used[ids[tris[t]]] = 1;
  // Loose garments hang away from the torso instead of hugging it.
  const inflate = INFLATE[region];
  if (inflate) {
    let zSum = 0;
    let zN = 0;
    for (let u = 0; u < nu; u++) {
      if (!used[u]) continue;
      zSum += U[u * 3 + 2];
      zN++;
    }
    const cz = zSum / Math.max(1, zN);
    const torsoU = new Uint8Array(nu);
    for (let i = 0; i < n; i++) if (isTorso[i]) torsoU[ids[i]] = 1;
    for (let u = 0; u < nu; u++) {
      if (!torsoU[u] || !used[u]) continue;
      U[u * 3] *= 1 + inflate;
      U[u * 3 + 2] = cz + (U[u * 3 + 2] - cz) * (1 + inflate);
    }
  }
  // Skirts, dresses and coats hang as one tube that widens toward the hem, instead of wrapping each leg.
  const flare = FLARE[region];
  if (flare) {
    let minY = Infinity;
    let zSum = 0;
    let zN = 0;
    const hipY = box.min.y + h * 0.53;
    let hw = 0;
    let hd = 0;
    for (let u = 0; u < nu; u++) {
      if (!used[u]) continue;
      const y = U[u * 3 + 1];
      if (y < minY) minY = y;
      zSum += U[u * 3 + 2];
      zN++;
    }
    const cz = zSum / Math.max(1, zN);
    for (let u = 0; u < nu; u++) {
      if (!used[u]) continue;
      const y = U[u * 3 + 1];
      if (Math.abs(y - hipY) > h * 0.03) continue;
      hw = Math.max(hw, Math.abs(U[u * 3]));
      hd = Math.max(hd, Math.abs(U[u * 3 + 2] - cz));
    }
    if (hw > 0 && hd > 0) {
      for (let u = 0; u < nu; u++) {
        if (!used[u]) continue;
        const y = U[u * 3 + 1];
        if (y >= hipY) continue;
        const t = Math.min(1, Math.max(0, (hipY - y) / Math.max(0.01, hipY - minY)));
        const ang = Math.atan2((U[u * 3 + 2] - cz) / hd, U[u * 3] / hw);
        const grow = 1 + flare * t;
        const tx = Math.cos(ang) * hw * grow;
        const tz = cz + Math.sin(ang) * hd * grow;
        const blend = Math.min(1, t / 0.18);
        U[u * 3] += (tx - U[u * 3]) * blend;
        U[u * 3 + 2] += (tz - U[u * 3 + 2]) * blend;
      }
    }
  }
  // Neighbours and open edges (hems stay pinned).
  const nb: Array<Set<number>> = Array.from({ length: nu }, () => new Set<number>());
  const edgeCount = new Map<number, number>();
  const ek = (x: number, y: number): number => (x < y ? x * nu + y : y * nu + x);
  for (let t = 0; t < tris.length; t += 3) {
    const t3 = [ids[tris[t]], ids[tris[t + 1]], ids[tris[t + 2]]];
    for (let e = 0; e < 3; e++) {
      const x = t3[e];
      const y = t3[(e + 1) % 3];
      nb[x].add(y);
      nb[y].add(x);
      const key = ek(x, y);
      edgeCount.set(key, (edgeCount.get(key) ?? 0) + 1);
    }
  }
  const pinned = new Uint8Array(nu);
  edgeCount.forEach((c, key) => {
    if (c === 1) {
      pinned[Math.floor(key / nu)] = 1;
      pinned[key % nu] = 1;
    }
  });
  // Taubin smoothing: flattens muscle relief without shrinking the garment.
  const iters = SMOOTH[region];
  const tmp = new Float32Array(nu * 3);
  for (let it = 0; it < iters * 2; it++) {
    const lam = it % 2 === 0 ? 0.55 : -0.58;
    for (let u = 0; u < nu; u++) {
      const set = nb[u];
      if (pinned[u] || !set.size) {
        tmp[u * 3] = U[u * 3];
        tmp[u * 3 + 1] = U[u * 3 + 1];
        tmp[u * 3 + 2] = U[u * 3 + 2];
        continue;
      }
      let ax = 0;
      let ay = 0;
      let az = 0;
      set.forEach((v) => {
        ax += U[v * 3];
        ay += U[v * 3 + 1];
        az += U[v * 3 + 2];
      });
      const inv = 1 / set.size;
      tmp[u * 3] = U[u * 3] + (ax * inv - U[u * 3]) * lam;
      tmp[u * 3 + 1] = U[u * 3 + 1] + (ay * inv - U[u * 3 + 1]) * lam;
      tmp[u * 3 + 2] = U[u * 3 + 2] + (az * inv - U[u * 3 + 2]) * lam;
    }
    U.set(tmp);
  }
  // Cloth creases at the joints: a small displacement along the original surface direction.
  if (region !== 'shoes' && region !== 'sole') {
    for (let u = 0; u < nu; u++) {
      const jn = joint[u];
      if (jn < 0.05) continue;
      const nl = Math.hypot(N[u * 3], N[u * 3 + 1], N[u * 3 + 2]) || 1;
      const x = U[u * 3];
      const y = U[u * 3 + 1];
      const z = U[u * 3 + 2];
      const a = 0.0055 * jn * (0.5 + 0.5 * Math.sin(y * 230 + x * 80 + z * 55));
      U[u * 3] += (N[u * 3] / nl) * a;
      U[u * 3 + 1] += (N[u * 3 + 1] / nl) * a;
      U[u * 3 + 2] += (N[u * 3 + 2] / nl) * a;
    }
  }
  // Smooth normals from the new surface.
  const FN = new Float32Array(nu * 3);
  for (let t = 0; t < tris.length; t += 3) {
    const a = ids[tris[t]] * 3;
    const b = ids[tris[t + 1]] * 3;
    const c = ids[tris[t + 2]] * 3;
    const ux = U[b] - U[a];
    const uy = U[b + 1] - U[a + 1];
    const uz = U[b + 2] - U[a + 2];
    const vx = U[c] - U[a];
    const vy = U[c + 1] - U[a + 1];
    const vz = U[c + 2] - U[a + 2];
    const nx = uy * vz - uz * vy;
    const ny = uz * vx - ux * vz;
    const nz = ux * vy - uy * vx;
    for (const q of [a, b, c]) {
      FN[q] += nx;
      FN[q + 1] += ny;
      FN[q + 2] += nz;
    }
  }
  const out = new THREE.BufferGeometry();
  const p = new Float32Array(n * 3);
  const nn = new Float32Array(n * 3);
  const cc = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const u = ids[i] * 3;
    // Creases and open hems read slightly darker, like cloth in shadow.
    const shade = 1 - 0.16 * joint[ids[i]] - (pinned[ids[i]] ? 0.07 : 0);
    cc[i * 3] = cc[i * 3 + 1] = cc[i * 3 + 2] = shade;
    p[i * 3] = U[u];
    p[i * 3 + 1] = U[u + 1];
    p[i * 3 + 2] = U[u + 2];
    const l = Math.hypot(FN[u], FN[u + 1], FN[u + 2]) || 1;
    nn[i * 3] = FN[u] / l;
    nn[i * 3 + 1] = FN[u + 1] / l;
    nn[i * 3 + 2] = FN[u + 2] / l;
  }
  out.setAttribute('position', new THREE.BufferAttribute(p, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nn, 3));
  out.setAttribute('color', new THREE.BufferAttribute(cc, 3));
  if (uv) out.setAttribute('uv', uv);
  out.setAttribute('skinIndex', si);
  out.setAttribute('skinWeight', sw);
  out.setIndex(tris);
  return out;
}

type Detail = 'collar-crew' | 'collar-shirt' | 'tie' | 'cap' | 'stethoscope' | 'v-neck';

interface OutfitPlan {
  top: Region;
  topOffset: number;
  topColor: string;
  bottom: Region | null;
  bottomOffset: number;
  bottomColor: string;
  long: boolean;
  details: Detail[];
}

/** Chooses garments and details from the figure's role, outfit and layers. */
function planOutfit(look: FigureLook): OutfitPlan {
  const plan: OutfitPlan = {
    top: 'shirt',
    topOffset: 0.012,
    topColor: look.top,
    bottom: 'pants',
    bottomOffset: 0.016,
    bottomColor: look.bottom,
    long: false,
    details: ['collar-crew'],
  };
  if (look.outer === 'hoodie') {
    plan.long = true;
    plan.topOffset = 0.026;
    plan.details = [];
  } else if (look.outer === 'jacket') {
    plan.long = true;
    plan.topOffset = 0.021;
    plan.details = ['collar-shirt'];
  }
  switch (look.uniform) {
    case 'officer':
      plan.long = true;
      plan.topOffset = 0.021;
      plan.details = ['collar-shirt', 'tie', 'cap'];
      break;
    case 'suit':
      plan.long = true;
      plan.topOffset = 0.021;
      plan.details = ['collar-shirt', 'tie'];
      break;
    case 'nurse':
      plan.bottomColor = look.top;
      plan.details = ['v-neck'];
      break;
    case 'doctor':
      plan.details = ['collar-shirt', 'stethoscope'];
      break;
    default:
  }
  switch (look.outfit) {
    case 'dress':
      plan.top = 'dress';
      plan.topOffset = 0.018;
      plan.bottom = null;
      plan.details = ['collar-crew'];
      break;
    case 'kurta':
      plan.top = 'kurta';
      plan.topOffset = 0.022;
      plan.long = false;
      plan.details = ['collar-crew'];
      break;
    case 'coat':
      plan.top = 'coat';
      plan.topOffset = 0.03;
      plan.topColor = '#e9eef0';
      plan.long = true;
      plan.details = ['collar-shirt', 'stethoscope'];
      break;
    case 'skirt':
      plan.bottom = 'skirt';
      plan.bottomOffset = 0.02;
      break;
    case 'shorts':
      plan.bottom = 'shorts';
      plan.bottomOffset = 0.016;
      break;
    default:
  }
  return plan;
}

function hashText(t: string): number {
  let h = 2166136261;
  for (let i = 0; i < t.length; i++) h = Math.imul(h ^ t.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967296;
}

/** Garment detail for an outfit: patterns, buttons, zips, pockets, waistbands and trims, varied per person. */
function styleOutfit(plan: OutfitPlan, look: FigureLook): { top: ClothSpec; bottom: ClothSpec } {
  const r1 = hashText(`${look.top}${look.hair}${look.skin}a`);
  const r2 = hashText(`${look.bottom}${look.top}${look.height}b`);
  const base = new THREE.Color(plan.topColor);
  const hsl = base.getHSL({ h: 0, s: 0, l: 0 });
  const darker = `#${base.clone().multiplyScalar(0.62).getHexString()}`;
  const lighter = `#${base.clone().lerp(new THREE.Color('#ffffff'), 0.6).getHexString()}`;
  const contrast = hsl.l > 0.5 ? darker : lighter;
  const top: ClothSpec = { color: plan.topColor, trim: contrast };
  if (plan.top === 'coat') {
    Object.assign(top, { maxLightness: 0.68, placketFrom: 0.3, buttons: true, trim: '#aeb4ba', pocket: 'chest' } satisfies Partial<ClothSpec>);
  } else if (plan.top === 'kurta') {
    Object.assign(top, { placketFrom: 0.69, buttons: true, trim: '#d9b25a', hemAt: 0.296 } satisfies Partial<ClothSpec>);
  } else if (plan.top === 'dress') {
    if (r1 < 0.36) Object.assign(top, { pattern: 'dots', scale: 0.07, strength: 0.85, trim: lighter } satisfies Partial<ClothSpec>);
    else if (r1 < 0.62) Object.assign(top, { pattern: 'stripes', scale: 0.05, strength: 0.4 } satisfies Partial<ClothSpec>);
    top.hemAt = 0.296;
  } else if (look.uniform === 'officer') {
    Object.assign(top, { placketFrom: 0.5, buttons: true, trim: '#c9a84a', pocket: 'chest' } satisfies Partial<ClothSpec>);
  } else if (look.uniform === 'suit') {
    Object.assign(top, { placketFrom: 0.5, buttons: true, trim: darker } satisfies Partial<ClothSpec>);
  } else if (look.uniform === 'nurse') {
    top.pocket = 'chest';
  } else if (look.outer === 'hoodie') {
    top.pocket = 'pouch';
    if (r1 < 0.5) Object.assign(top, { zipFrom: 0.5, trim: '#c9ccd2' } satisfies Partial<ClothSpec>);
  } else if (look.outer === 'jacket') {
    Object.assign(top, { placketFrom: 0.5, buttons: true, trim: darker } satisfies Partial<ClothSpec>);
    if (r1 < 0.35) Object.assign(top, { pattern: 'plaid', scale: 0.075, strength: 0.5 } satisfies Partial<ClothSpec>);
  } else if (r1 < 0.34) {
    Object.assign(top, { pattern: 'stripes', scale: 0.045, strength: 0.75 } satisfies Partial<ClothSpec>);
  } else if (r1 < 0.54) {
    Object.assign(top, { pattern: 'print', strength: 0.9 } satisfies Partial<ClothSpec>);
  }
  const bc = new THREE.Color(plan.bottomColor);
  const bh = bc.getHSL({ h: 0, s: 0, l: 0 });
  const bottom: ClothSpec = { color: plan.bottomColor, trim: '#3a2a1e' };
  if (plan.bottom === 'pants' || plan.bottom === 'shorts') {
    bottom.waist = [0.553, 0.58];
    bottom.denim = bh.h > 0.5 && bh.h < 0.72 && bh.s > 0.18;
    bottom.belt = look.uniform !== 'nurse' && r2 < 0.6;
  } else if (plan.bottom === 'skirt') {
    bottom.hemAt = 0.306;
    bottom.trim = `#${bc.clone().lerp(new THREE.Color('#ffffff'), 0.5).getHexString()}`;
    if (r2 < 0.35) Object.assign(bottom, { pattern: 'plaid', scale: 0.07, strength: 0.45 } satisfies Partial<ClothSpec>);
  }
  return { top, bottom };
}

function hairFor(look: FigureLook, female: boolean): string | null {
  switch (look.hairStyle) {
    case 'bald':
      return null;
    case 'long':
    case 'ponytail':
      return 'Hair_Long';
    case 'bun':
      return 'Hair_Buns';
    case 'curly':
      return 'Hair_SimpleParted';
    case 'cap':
      return 'Hair_Buzzed';
    default:
      return female ? 'Hair_BuzzedFemale' : 'Hair_SimpleParted';
  }
}

/* -------------------------------------------------------------------- the figure */

const REF_LIGHT = new THREE.Color('#e3bf9c');
const REF_DARK = new THREE.Color('#8b5a3c');
const TARGET_HEIGHT = 1.7;

function tintFor(skin: THREE.Color, ref: THREE.Color): THREE.Color {
  return new THREE.Color(Math.min(1.35, skin.r / ref.r), Math.min(1.35, skin.g / ref.g), Math.min(1.35, skin.b / ref.b));
}

/** Backpack, glasses, lanyard and the other carried things, plus the phone and box props (hidden until a pose needs them). */
export function attachAccessories(root: THREE.Object3D, group: THREE.Group, look: FigureLook, owned: Array<{ dispose(): void }>): { phone: THREE.Object3D | null; box: THREE.Object3D | null } {
  let phone: THREE.Object3D | null = null;
  let boxProp: THREE.Object3D | null = null;
    const find = (n: string): THREE.Object3D | undefined => root.getObjectByName(n);
    const std = (c: string, r = 0.7): THREE.MeshStandardMaterial => {
      const m = new THREE.MeshStandardMaterial({ color: c, roughness: r });
      owned.push(m);
      return m;
    };
    const keep = <T extends THREE.BufferGeometry>(g: T): T => {
      owned.push(g);
      return g;
    };
    const box = (w: number, h: number, d: number, c: string, parent: THREE.Object3D, x: number, y: number, z: number, r = 0.7): THREE.Mesh => {
      const me = new THREE.Mesh(keep(new THREE.BoxGeometry(w, h, d)), std(c, r));
      me.position.set(x, y, z);
      me.castShadow = true;
      parent.add(me);
      return me;
    };
    const spine = find('spine_03');
    const head = find('Head');
    const neck = find('neck_01');
    const acc = look.accessory;
    // Bone frames: Y runs along the bone (up for spine and head), Z is forward, X is the character's left.
    if (acc === 'backpack' && spine) {
      // A daypack: rounded shell, front pocket with a zip, side bottle pockets, grab handle and padded straps.
      const bp = new THREE.Group();
      bp.position.set(0, 0, -0.17);
      spine.add(bp);
      const fabric = std('#3d4a63', 0.9);
      const trim = std('#2a3245', 0.85);
      const shell = new THREE.Mesh(keep(new RoundedBoxGeometry(0.3, 0.4, 0.15, 3, 0.05)), fabric);
      shell.castShadow = true;
      bp.add(shell);
      const pocket = new THREE.Mesh(keep(new RoundedBoxGeometry(0.22, 0.16, 0.06, 3, 0.025)), trim);
      pocket.position.set(0, -0.08, -0.085);
      bp.add(pocket);
      box(0.2, 0.008, 0.008, '#c9a24a', bp, 0, -0.005, -0.115, 0.4);
      for (const sx of [-1, 1]) {
        const side = new THREE.Mesh(keep(new RoundedBoxGeometry(0.04, 0.14, 0.1, 2, 0.015)), trim);
        side.position.set(sx * 0.165, -0.11, 0);
        bp.add(side);
      }
      const handle = new THREE.Mesh(keep(new THREE.TorusGeometry(0.035, 0.009, 6, 14, Math.PI)), trim);
      handle.position.set(0, 0.2, 0.02);
      bp.add(handle);
      for (const sx of [-0.1, 0.1]) {
        const strap = new THREE.Mesh(keep(new RoundedBoxGeometry(0.045, 0.34, 0.022, 2, 0.008)), trim);
        strap.position.set(sx, 0.01, 0.12);
        spine.add(strap);
      }
    }
    if (acc === 'glasses' && head) {
      const rim = std('#14161a', 0.4);
      for (const sx of [-0.036, 0.036]) {
        const ring = new THREE.Mesh(keep(new THREE.TorusGeometry(0.026, 0.004, 8, 20)), rim);
        ring.position.set(sx, 0.095, 0.098);
        head.add(ring);
      }
      box(0.02, 0.004, 0.004, '#14161a', head, 0, 0.1, 0.1, 0.4);
    }
    if (acc === 'headphones' && head) {
      const band = new THREE.Mesh(keep(new THREE.TorusGeometry(0.095, 0.009, 8, 24, Math.PI)), std('#22242a', 0.5));
      band.position.set(0, 0.1, 0.0);
      band.rotation.z = 0;
      band.rotation.y = Math.PI / 2;
      band.rotation.x = 0;
      head.add(band);
      for (const sx of [-0.095, 0.095]) {
        const cup = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.036, 0.036, 0.03, 16)), std('#2c2f38', 0.5));
        cup.rotation.z = Math.PI / 2;
        cup.position.set(sx, 0.095, 0.0);
        head.add(cup);
      }
    }
    if (acc === 'scarf' && neck) {
      const sc = new THREE.Mesh(keep(new THREE.TorusGeometry(0.07, 0.028, 10, 22)), std('#b8433a', 0.95));
      sc.rotation.x = Math.PI / 2;
      sc.position.set(0, 0.07, 0.0);
      neck.add(sc);
      box(0.07, 0.2, 0.03, '#b8433a', neck, 0.03, -0.04, 0.085, 0.95);
    }
    if ((acc === 'lanyard' || acc === 'badge') && spine) {
      if (acc === 'lanyard') {
        box(0.018, 0.3, 0.012, '#c0392b', spine, 0, 0.0, 0.118, 0.8);
        box(0.07, 0.1, 0.012, '#f3f1ea', spine, 0, -0.16, 0.122, 0.6);
      } else {
        box(0.07, 0.04, 0.01, '#f3f1ea', spine, 0.1, 0.04, 0.12, 0.6);
      }
    }
    if (acc === 'suitcase') {
      // A hard-shell carry-on: rounded shell with ribs, a zip seam, four spinner wheels and a pulled-up handle.
      const sc = new THREE.Group();
      sc.position.set(-0.42, 0, 0.12);
      group.add(sc);
      const W = 0.36, H = 0.56, D = 0.23;
      const shell = new THREE.Mesh(keep(new RoundedBoxGeometry(W, H, D, 4, 0.035)), std('#33507f', 0.42));
      shell.position.y = 0.07 + H / 2;
      shell.castShadow = true;
      sc.add(shell);
      const ribMat = std('#3d5d92', 0.38);
      for (const x of [-0.11, 0, 0.11]) {
        for (const z of [D / 2 + 0.002, -D / 2 - 0.002]) {
          const rib = new THREE.Mesh(keep(new RoundedBoxGeometry(0.03, H - 0.08, 0.012, 2, 0.005)), ribMat);
          rib.position.set(x, shell.position.y, z);
          sc.add(rib);
        }
      }
      box(W + 0.006, H - 0.03, 0.012, '#1d2433', sc, 0, shell.position.y, 0, 0.6);
      const metal = std('#b9bec7', 0.3);
      const dark = std('#1b1d22', 0.6);
      for (const x of [-W / 2 + 0.05, W / 2 - 0.05]) {
        for (const z of [-D / 2 + 0.045, D / 2 - 0.045]) {
          const w = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.026, 0.026, 0.024, 16)), dark);
          w.rotation.z = Math.PI / 2;
          w.position.set(x, 0.028, z);
          sc.add(w);
          box(0.03, 0.04, 0.03, '#2a2d33', sc, x, 0.06, z, 0.5);
        }
      }
      for (const x of [-0.07, 0.07]) {
        const rod = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.008, 0.008, 0.36, 10)), metal);
        rod.position.set(x, 0.07 + H + 0.17, -D / 2 + 0.03);
        sc.add(rod);
      }
      const grip = new THREE.Mesh(keep(new RoundedBoxGeometry(0.19, 0.03, 0.035, 2, 0.012)), dark);
      grip.position.set(0, 0.07 + H + 0.35, -D / 2 + 0.03);
      sc.add(grip);
      const top = new THREE.Mesh(keep(new RoundedBoxGeometry(0.12, 0.022, 0.03, 2, 0.01)), dark);
      top.position.set(0, 0.07 + H + 0.012, 0.02);
      sc.add(top);
    }
    // Hand and chest props shown only for the poses that use them.
    const hand = find('hand_r');
    if (hand) {
      const ph = box(0.07, 0.014, 0.135, '#15171c', hand, 0.0, 0.07, 0.0, 0.3);
      ph.visible = false;
      phone = ph;
    }
    if (spine) {
      // A moving box: cardboard with packing tape over the flap seam and a shipping label.
      const bx = new THREE.Group();
      bx.position.set(0, 0, 0.32);
      spine.add(bx);
      const card = new THREE.Mesh(keep(new RoundedBoxGeometry(0.42, 0.28, 0.3, 2, 0.008)), std('#b7864f', 0.95));
      card.castShadow = true;
      bx.add(card);
      box(0.43, 0.012, 0.004, '#8e6436', bx, 0, 0.14, 0, 0.9);
      const tape = std('#d9b47c', 0.45);
      const tTop = new THREE.Mesh(keep(new THREE.BoxGeometry(0.07, 0.004, 0.31)), tape);
      tTop.position.set(0, 0.142, 0);
      bx.add(tTop);
      for (const z of [0.152, -0.152]) {
        const t = new THREE.Mesh(keep(new THREE.BoxGeometry(0.07, 0.11, 0.004)), tape);
        t.position.set(0, 0.09, z);
        bx.add(t);
      }
      box(0.13, 0.08, 0.004, '#f2efe6', bx, -0.11, -0.03, 0.152, 0.8);
      for (const dy of [-0.012, -0.03, -0.048]) box(0.09, 0.006, 0.003, '#5b5650', bx, -0.11, dy, 0.155, 0.8);
      bx.visible = false;
      boxProp = bx;
    }
  return { phone, box: boxProp };
}

/** Drop-in for Figure: same members the stage code uses. */
export class HumanFigure {
  readonly group = new THREE.Group();
  readonly look: FigureLook;
  pose: Pose = 'idle';
  walkRate = 1;
  private seated = false;
  private readonly mixer: THREE.AnimationMixer;
  private action: THREE.AnimationAction | null = null;
  private clipKey = '';
  private readonly owned: Array<{ dispose(): void }> = [];
  private readonly phase = Math.random() * 6;
  private readonly bones = new Map<string, THREE.Object3D>();
  private blend = 0;
  private acc = 0;
  private clock = Math.random() * 10;
  private target: THREE.Vector3 | null = null;
  private lookYaw = 0;
  private lookPitch = 0;
  private slim: Array<[string, number, number]> = [];
  private readonly headScale = new THREE.Vector3(1, 1, 1);
  private details: Detail[] = [];
  private topColor = '#888888';
  private phoneProp: THREE.Object3D | null = null;
  private boxProp: THREE.Object3D | null = null;
  private static readonly q = new THREE.Quaternion();
  private static readonly e = new THREE.Euler();
  private static readonly v = new THREE.Vector3();

  constructor(look: FigureLook, readonly lite = false) {
    if (!assets) throw new Error('HumanFigure used before loadHumans() resolved');
    this.look = look;
    const female = look.fem ?? (look.hairStyle === 'long' || look.hairStyle === 'ponytail' || look.hairStyle === 'bun');
    const src = female ? assets.female : assets.male;
    const root = cloneSkinned(src) as THREE.Group;

    const skin = new THREE.Color(look.skin);
    const dark = skin.getHSL({ h: 0, s: 0, l: 0 }).l < 0.4;
    const hair = new THREE.Color(look.hair);
    let body: THREE.SkinnedMesh | null = null;
    root.traverse((o) => {
      const m = o as THREE.SkinnedMesh;
      if (!m.isSkinnedMesh) return;
      m.frustumCulled = false;
      m.castShadow = true;
      m.receiveShadow = true;
      const mat = (m.material as THREE.MeshStandardMaterial).clone();
      this.owned.push(mat);
      m.material = mat;
      const name = (mat.name || '').toLowerCase();
      if (name.includes('superhero')) {
        body = m;
        if (!dark) mat.map = female ? assets!.light.female : assets!.light.male;
        mat.color.copy(tintFor(skin, dark ? REF_DARK : REF_LIGHT));
        // Matte skin with softer surface detail sits better against a painted scene.
        mat.roughness = Math.max(0.78, mat.roughness);
        mat.metalness = 0;
        if (mat.normalScale) mat.normalScale.multiplyScalar(0.82);
      } else if (name.includes('eye') && !name.includes('brow')) {
        // Eyes carry a little of their own light and a wet shine, so faces stay alive in dim scenes.
        mat.emissive = new THREE.Color('#ffffff');
        mat.emissiveMap = mat.map;
        mat.emissiveIntensity = 0.22;
        mat.roughness = 0.18;
      } else if (name.includes('hair') || name.includes('eyebrow')) {
        mat.color.copy(hair).multiplyScalar(2.6);
        if (look.hairStyle === 'bald') m.visible = false;
      }
    });

    // Fit to the stage's scale: feet on the floor, height from the look.
    const bodyMesh = body as THREE.SkinnedMesh | null;
    const box = new THREE.Box3().setFromObject(root, true);
    const h = Math.max(0.5, box.max.y - box.min.y);
    const s = (TARGET_HEIGHT * look.height) / h;
    const width = look.build === 'slim' ? 0.9 : look.build === 'broad' ? 1.0 : 0.94;
    root.scale.set(s * width, s, s * width);
    root.position.y = -box.min.y * s;
    this.group.add(root);

    // Clothes, cut from the body.
    if (bodyMesh) {
      const plan = planOutfit(look);
      const g0 = bodyMesh.geometry;
      if (!g0.boundingBox) g0.computeBoundingBox();
      const bb = g0.boundingBox as THREE.Box3;
      const cloth = (spec: ClothSpec): THREE.MeshStandardMaterial => {
        const mt = clothMaterial(spec, bb.min.y, bb.max.y - bb.min.y);
        this.owned.push(mt);
        return mt;
      };
      const style = styleOutfit(plan, look);
      const parts: Array<[Region, number, THREE.Material]> = [];
      if (plan.bottom) parts.push([plan.bottom, plan.bottomOffset, cloth(style.bottom)]);
      parts.push([plan.top, plan.topOffset, cloth(style.top)]);
      parts.push(['shoes', 0.019, cloth({ color: look.shoes, roughness: 0.6, maxLightness: 0.66 })]);
      parts.push(['sole', 0.03, cloth({ color: '#d8d4cb', roughness: 0.7, maxLightness: 0.7 })]);
      const parent = bodyMesh.parent ?? root;
      for (const [r, off, mat] of parts) {
        const shell = makeShell(bodyMesh, `${female ? 'f' : 'm'}|${r}|${off}|${plan.long ? 1 : 0}`, r, off, plan.long, mat);
        if (shell) parent.add(shell);
      }
      this.details = plan.details;
      this.topColor = plan.topColor;
    }
    const capped = this.details.includes('cap') && !['long', 'ponytail', 'bun'].includes(look.hairStyle);
    if (bodyMesh && look.hairStyle !== 'bald' && !capped) {
      const style = hairFor(look, female);
      const srcHair = style ? assets.hair.get(style) : undefined;
      if (srcHair) {
        const hm = (srcHair.material as THREE.MeshStandardMaterial).clone();
        hm.color.copy(hair).multiplyScalar(2.4);
        hm.roughness = 0.7;
        this.owned.push(hm);
        const mesh = new THREE.SkinnedMesh(srcHair.geometry, hm);
        mesh.bind(bodyMesh.skeleton, bodyMesh.bindMatrix);
        mesh.frustumCulled = false;
        mesh.castShadow = true;
        (bodyMesh.parent ?? root).add(mesh);
      }
      if (!female && look.build === 'broad') {
        const bm = assets.hair.get('Hair_Beard');
        if (bm) {
          const bmat = (bm.material as THREE.MeshStandardMaterial).clone();
          bmat.color.copy(hair).multiplyScalar(2.2);
          this.owned.push(bmat);
          const beard = new THREE.SkinnedMesh(bm.geometry, bmat);
          beard.bind(bodyMesh.skeleton, bodyMesh.bindMatrix);
          beard.frustumCulled = false;
          (bodyMesh.parent ?? root).add(beard);
        }
      }
    }
    root.traverse((o) => {
      if ((o as THREE.Bone).isBone) this.bones.set(o.name, o);
    });
    if (look.outer === 'hoodie') {
      const neckBone = this.bones.get('neck_01');
      if (neckBone) {
        const hoodMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(look.top).multiplyScalar(0.92), roughness: 0.9 });
        const hoodGeo = new THREE.SphereGeometry(0.1, 20, 14, 0, Math.PI * 2, Math.PI * 0.35, Math.PI * 0.65);
        this.owned.push(hoodMat, hoodGeo);
        const hood = new THREE.Mesh(hoodGeo, hoodMat);
        hood.scale.set(1.15, 0.85, 0.7);
        hood.position.set(0, 0.02, -0.085);
        hood.rotation.x = Math.PI * 0.62;
        hood.castShadow = true;
        neckBone.add(hood);
      }
    }
    this.addDetails();
    this.addAccessory(root, look);
    // Slimmer, less superhero build. Chest width and depth shrink (the Y axis runs along the spine);
    // the neck restores so the head keeps its size. Arms thin down with the chest.
    const m = female ? 0.97 : look.build === 'broad' ? 0.97 : look.build === 'slim' ? 0.88 : 0.92;
    // No two heads quite alike: small differences in width, height and depth.
    this.headScale.set(0.95 + hashText(`${look.skin}${look.hair}w`) * 0.1, 0.97 + hashText(`${look.top}${look.height}h`) * 0.07, 0.96 + hashText(`${look.bottom}${look.skin}d`) * 0.08);
    this.slim = [
      ['spine_02', m, m],
      ['spine_03', m, m],
      ['neck_01', 1 / (m * m), 1 / (m * m)],
    ];

    if (!lite) this.addOutlines(root);

    this.mixer = new THREE.AnimationMixer(root);
    this.setPose('idle');
  }

  /** Collars, ties, a cap and a stethoscope, hung on the bones so they move with the body. */
  private addDetails(): void {
    const neck = this.bones.get('neck_01');
    const spine = this.bones.get('spine_03');
    const head = this.bones.get('Head');
    const own = <T extends { dispose(): void }>(o: T): T => {
      this.owned.push(o);
      return o;
    };
    const std = (c: THREE.ColorRepresentation, r = 0.8): THREE.MeshStandardMaterial => own(new THREE.MeshStandardMaterial({ color: c, roughness: r }));
    const top = new THREE.Color(this.topColor);
    const darker = top.clone().multiplyScalar(0.7);
    const paper = new THREE.Color('#dedbd2');
    const ring = (parent: THREE.Object3D | undefined, radius: number, tube: number, color: THREE.ColorRepresentation, y: number, z = 0): void => {
      if (!parent) return;
      const me = new THREE.Mesh(own(new THREE.TorusGeometry(radius, tube, 8, 24)), std(color));
      me.rotation.x = Math.PI / 2;
      me.position.set(0, y, z);
      me.castShadow = true;
      parent.add(me);
    };
    const box = (parent: THREE.Object3D | undefined, w: number, h: number, d: number, color: THREE.ColorRepresentation, x: number, y: number, z: number): THREE.Mesh | null => {
      if (!parent) return null;
      const me = new THREE.Mesh(own(new THREE.BoxGeometry(w, h, d)), std(color));
      me.position.set(x, y, z);
      me.castShadow = true;
      parent.add(me);
      return me;
    };
    for (const d of this.details) {
      switch (d) {
        case 'collar-crew':
          ring(neck, 0.066, 0.011, darker, 0.015);
          break;
        case 'collar-shirt':
          ring(neck, 0.071, 0.014, paper, 0.02);
          break;
        case 'tie': {
          const c = this.look.uniform === 'officer' ? '#14161c' : '#8a2c3a';
          box(spine, 0.034, 0.27, 0.012, c, 0, -0.04, 0.124);
          box(neck, 0.042, 0.045, 0.022, c, 0, 0.0, 0.074);
          break;
        }
        case 'cap': {
          if (!head) break;
          const c = this.look.top;
          const crown = new THREE.Mesh(own(new THREE.CylinderGeometry(0.098, 0.104, 0.075, 20)), std(c, 0.7));
          crown.position.set(0, 0.165, -0.005);
          crown.castShadow = true;
          head.add(crown);
          const visor = box(head, 0.15, 0.01, 0.075, '#0f1116', 0, 0.13, 0.108);
          if (visor) visor.rotation.x = 0.12;
          box(head, 0.03, 0.03, 0.01, '#d4af37', 0, 0.165, 0.099);
          break;
        }
        case 'stethoscope': {
          ring(neck, 0.083, 0.007, '#1c1f26', 0.045);
          const loop = new THREE.Mesh(own(new THREE.TorusGeometry(0.05, 0.006, 8, 20, Math.PI)), std('#1c1f26', 0.5));
          loop.rotation.z = Math.PI;
          loop.position.set(0, 0.07, 0.118);
          spine?.add(loop);
          const piece = new THREE.Mesh(own(new THREE.SphereGeometry(0.02, 12, 10)), std('#9aa3ad', 0.35));
          piece.position.set(0, 0.015, 0.126);
          spine?.add(piece);
          break;
        }
        default:
      }
    }
  }

  private addAccessory(root: THREE.Object3D, look: FigureLook): void {
    const r = attachAccessories(root, this.group, look, this.owned);
    this.phoneProp = r.phone;
    this.boxProp = r.box;
  }

  private static outlineMat: THREE.MeshBasicMaterial | null = null;

  /** A thin dark ink line around the figure (a back-facing hull pushed out along the normals), like the painted scenes. */
  private addOutlines(root: THREE.Object3D): void {
    if (!HumanFigure.outlineMat) {
      const m = new THREE.MeshBasicMaterial({ color: '#1d1512', side: THREE.BackSide });
      m.onBeforeCompile = (sh) => {
        sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n\ttransformed += normalize( normal ) * 0.0042;');
      };
      HumanFigure.outlineMat = m;
    }
    const meshes: THREE.SkinnedMesh[] = [];
    root.traverse((o) => {
      const m = o as THREE.SkinnedMesh;
      if (!m.isSkinnedMesh || !m.visible) return;
      const matName = ((m.material as THREE.Material).name || '').toLowerCase();
      if (/eye/i.test(m.name) || matName.includes('eye')) return;
      meshes.push(m);
    });
    for (const m of meshes) {
      const line = new THREE.SkinnedMesh(m.geometry, HumanFigure.outlineMat);
      line.bind(m.skeleton, m.bindMatrix);
      line.frustumCulled = false;
      (m.parent ?? root).add(line);
    }
  }

  setSeated(b: boolean): void {
    if (this.seated === b) return;
    this.seated = b;
    this.setPose(this.pose);
  }

  setPose(p: Pose): void {
    if (p !== this.pose) this.blend = 0;
    this.pose = p;
    if (p === 'sit' || p === 'eat' || p === 'type') this.seated = true;
    let spec = STANDING[p];
    if (this.seated) {
      spec = SEATED_TALK.has(p) ? { clip: 'Sitting_Talking_Loop' } : { clip: 'Sitting_Idle_Loop' };
    }
    const key = `${spec.clip}|${spec.hold ? 1 : 0}`;
    if (key === this.clipKey) return;
    this.clipKey = key;
    const clip = assets?.clips.get(spec.clip);
    if (!clip) return;
    const next = this.mixer.clipAction(clip);
    next.reset();
    next.enabled = true;
    if (spec.hold) {
      next.setLoop(THREE.LoopOnce, 1);
      next.clampWhenFinished = true;
      next.time = Math.max(0, clip.duration - 0.001);
      next.paused = true;
    } else {
      next.setLoop(THREE.LoopRepeat, Infinity);
      next.paused = false;
      next.time = (this.phase * 0.37) % Math.max(0.1, clip.duration);
    }
    next.timeScale = spec.speed ?? 1;
    if (this.action && this.action !== next && spec.hold) {
      // A held pose (lying down) switches at once: a paused clip cannot finish a cross-fade.
      this.action.stop();
      next.play();
    } else if (this.action && this.action !== next) {
      next.play();
      this.action.crossFadeTo(next, 0.25, false);
    } else {
      next.play();
    }
    this.action = next;
  }

  lookAt(worldTarget: THREE.Vector3 | null): void {
    if (!worldTarget) {
      this.target = null;
      return;
    }
    if (!this.target) this.target = new THREE.Vector3();
    this.target.copy(worldTarget);
  }

  private rot(bone: string, x: number, y: number, z: number, w: number): void {
    const b = this.bones.get(bone);
    if (!b) return;
    HumanFigure.e.set(x * w, y * w, z * w, 'XYZ');
    b.quaternion.multiply(HumanFigure.q.setFromEuler(HumanFigure.e));
  }

  update(dt: number, _time: number): void {
    void _time;
    // Background crowd figures animate at about 30 fps to save phone battery and frame time.
    if (this.lite) {
      this.acc += dt;
      if (this.acc < 1 / 30) return;
      dt = this.acc;
      this.acc = 0;
    }
    if (this.pose === 'walk' && this.action) this.action.timeScale = Math.max(0.4, this.walkRate);
    this.mixer.update(dt);
    this.clock += dt;
    // Everything below runs after the clip, because the clip rewrites every bone each frame.
    for (const [n, sx, sz] of this.slim) this.bones.get(n)?.scale.set(sx, 1, sz);
    this.bones.get('Head')?.scale.copy(this.headScale);
    this.blend = Math.min(1, this.blend + dt * 4);
    const g = GESTURES[this.pose];
    if (g) for (const r of g(this.clock)) this.rot(r.bone, r.x ?? 0, r.y ?? 0, r.z ?? 0, this.blend);
    if (this.phoneProp) this.phoneProp.visible = this.pose === 'phone';
    if (this.boxProp) this.boxProp.visible = this.pose === 'carry';
    // Head and neck turn toward whatever the stage asked them to look at.
    let yaw = 0;
    let pitch = 0;
    const head = this.bones.get('Head');
    if (this.target && head) {
      const v = HumanFigure.v;
      head.getWorldPosition(v);
      this.group.worldToLocal(v);
      const t = this.group.worldToLocal(this.target.clone());
      const dx = t.x - v.x;
      const dy = t.y - v.y;
      const dz = t.z - v.z;
      yaw = Math.max(-1.0, Math.min(1.0, Math.atan2(dx, dz)));
      pitch = Math.max(-0.4, Math.min(0.4, Math.atan2(-dy, Math.hypot(dx, dz))));
    }
    const k = Math.min(1, dt * 6);
    this.lookYaw += (yaw - this.lookYaw) * k;
    this.lookPitch += (pitch - this.lookPitch) * k;
    if (Math.abs(this.lookYaw) + Math.abs(this.lookPitch) > 0.001) {
      this.rot('neck_01', this.lookPitch * 0.4, this.lookYaw * 0.4, 0, 1);
      this.rot('Head', this.lookPitch * 0.6, this.lookYaw * 0.6, 0, 1);
    }
  }

  dispose(): void {
    this.mixer.stopAllAction();
    for (const d of this.owned) d.dispose();
  }
}
