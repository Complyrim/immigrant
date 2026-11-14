import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js';
import type { Pose, Role } from '../engine/types';
import type { FigureLook } from './Figure';
import { GESTURES, SEATED_TALK, STANDING, attachAccessories, humanClips } from './HumanFigure';
import peopleJson from '../data/people.json';

/**
 * The cast: distinct people generated with MakeHuman (CC0), each with their own face, build, hair,
 * clothes and shoes (see scripts/mh/make_people.py and src/data/people.json). They share the skeleton
 * naming of the animation library, so every clip plays on every person. Materials are restyled here
 * into an illustrated look: banded light, matte surfaces, garment recolouring and ink outlines.
 */
const base = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');

interface Tint {
  color: string;
  lo?: number;
  hi?: number;
  /** Brightness multiplier, for turning a dark garment pale. */
  gain?: number;
  /** Ignore the texture's pattern and shade as one solid colour (for prints that read badly small). */
  flat?: boolean;
  /** Tint only these parts of the texture, [left, top, right, bottom] as fractions (for one-piece outfits). */
  uv?: number[][];
}
interface PersonDef {
  id: string;
  /** A home country id, or 'us' for the people every journey meets. */
  group: string;
  sex: 'f' | 'm';
  ageBand: 'young' | 'mid' | 'elder';
  roles: string[];
  hairTint?: string;
  skinTint?: string;
  tints?: Record<string, Tint>;
}

const PEOPLE = peopleJson as unknown as PersonDef[];
export const PEOPLE_IDS = PEOPLE.map((p) => p.id);
const BY_ID = new Map(PEOPLE.map((p) => [p.id, p]));

/* ------------------------------------------------------------------ loading */

let loader: GLTFLoader | null = null;
const pending = new Map<string, Promise<THREE.Group | null>>();
const ready = new Map<string, THREE.Group>();

function gltf(): GLTFLoader {
  if (!loader) {
    const draco = new DRACOLoader();
    draco.setDecoderPath(`${base}/assets/draco/`);
    loader = new GLTFLoader();
    loader.setDRACOLoader(draco);
  }
  return loader;
}

export function loadPerson(id: string): Promise<THREE.Group | null> {
  let p = pending.get(id);
  if (!p) {
    p = gltf()
      .loadAsync(`${base}/assets/mh/${id}.glb`)
      .then((g) => {
        ready.set(id, g.scene);
        return g.scene;
      })
      .catch((err) => {
        console.warn(`Person ${id} failed to load`, err);
        return null;
      });
    pending.set(id, p);
  }
  return p;
}

/* ------------------------------------------------------------------ casting */

interface CastContext {
  country: string;
  sex: 'f' | 'm';
}
let ctx: CastContext = { country: 'india', sex: 'f' };
let enabled = true;
const used = new Set<string>();

export function setCastEnabled(on: boolean): void {
  enabled = on;
}
export function castReady(): boolean {
  return enabled && humanClips() !== null;
}

/** Tell the cast whose journey this is, and fetch the people most likely to appear. */
export function setCastContext(country: string, sex: 'f' | 'm'): void {
  if (ctx.country === country && ctx.sex === sex && pending.size) return;
  ctx = { country: country in CC ? country : 'india', sex };
  const first = [castId('player'), castId('friend'), castId('parent'), castId('spouse'), castId('roommate'), 'us_officer'];
  void (async () => {
    for (const id of first) await loadPerson(id);
    // Then this country's own people and the general public; other countries' casts are never needed.
    for (const p of PEOPLE) if (p.group === ctx.country || p.group === 'us') await loadPerson(p.id);
  })();
}

const sceneLoads: Array<Promise<unknown>> = [];

/** Call when a new scene is built, so one person never appears twice in it. */
export function beginCastScene(): void {
  used.clear();
  sceneLoads.length = 0;
}

/** Resolves once everyone in the scene being built is on stage, so nobody appears late. */
export function castSettled(): Promise<void> {
  return Promise.all(sceneLoads.slice()).then(() => undefined);
}

/** Fetch the whole cast in the background (call once at start). */
export function preloadCast(): void {
  void (async () => {
    // Only the people every journey meets; the family and friends follow once the home country is known.
    for (const p of PEOPLE) if (p.group === 'us') await loadPerson(p.id);
  })();
}

/** Each home country has its own five people: two who can be the player, two friends and a parent. */
const CC: Record<string, string> = {
  india: 'in', mexico: 'mx', nigeria: 'ng', ghana: 'gh', kenya: 'ke', ethiopia: 'et', egypt: 'eg', china: 'cn', 'south-korea': 'kr',
  vietnam: 'vn', philippines: 'ph', 'united-kingdom': 'uk', germany: 'de', ukraine: 'ua', poland: 'pl', italy: 'it', canada: 'ca',
  guatemala: 'gt', 'el-salvador': 'sv', 'dominican-republic': 'do', brazil: 'br', colombia: 'co', venezuela: 've', peru: 'pe',
  ecuador: 'ec', australia: 'au', 'new-zealand': 'nz', fiji: 'fj', tonga: 'to', samoa: 'ws',
};

function castId(role: Role): string {
  const cc = CC[ctx.country] ?? 'in';
  const s = ctx.sex;
  const o = s === 'f' ? 'm' : 'f';
  switch (role) {
    case 'player':
      return `${cc}_${s}1`;
    case 'friend':
      return `${cc}_${s}2`;
    case 'spouse':
    case 'partner':
      return `${cc}_${o}2`;
    case 'parent':
      return `${cc}_mother`;
    case 'roommate':
      return `us_roommate_${s}`;
    default: {
      const p = PEOPLE.find((q) => q.group === 'us' && q.roles.includes(role));
      return p ? p.id : 'us_stranger';
    }
  }
}

function hash(t: string): number {
  let h = 2166136261;
  for (let i = 0; i < t.length; i++) h = Math.imul(h ^ t.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967296;
}

/** Who plays this figure. Named roles are fixed; passers-by and classmates come from everyone else. */
export function castFor(look: FigureLook, extra = false): string {
  const role = look.role;
  // Background extras never take a named part: the real officer, friend or parent is still to come.
  if (role && role !== 'student' && !extra) {
    const id = castId(role);
    if (!used.has(id)) {
      used.add(id);
      return id;
    }
  }
  const cc = CC[ctx.country] ?? 'in';
  const mine = new Set([`${cc}_${ctx.sex}1`, `${cc}_mother`]);
  const pool = PEOPLE.filter((p) => (p.group === 'us' || p.group === ctx.country) && !mine.has(p.id) && (p.roles.includes('student') || p.roles.includes('friend') || p.roles.includes('player') || p.roles.includes('roommate')));
  const start = Math.floor(hash(`${look.skin}${look.hair}${look.top}${look.bottom}${look.height}`) * pool.length);
  for (let i = 0; i < pool.length; i++) {
    const p = pool[(start + i) % pool.length];
    if (!used.has(p.id)) {
      used.add(p.id);
      return p.id;
    }
  }
  return pool[start].id;
}

/* ------------------------------------------------------------ illustrated look */

const DECL_V = /* glsl */ `
varying vec3 vBind;
uniform float uInflate;
`;
const DECL_F = /* glsl */ `
varying vec3 vBind;
uniform vec3 uTint;
uniform vec4 uTintP; // strength, from height, to height (0 feet, 1 head), brightness
uniform vec2 uBody;  // lowest point, height
uniform vec2 uLook;  // rim light strength, skin warmth (0 for cloth)
uniform vec4 uUvA;   // texture areas to tint; z = 0 means no limit
uniform vec4 uUvB;
uniform float uFlat; // 1 = solid colour, ignore the texture's pattern
uniform vec3 uPalShade; // the painting's shadow colour (luminance 1)
uniform vec3 uPalKey;   // the painting's light colour (luminance 1)
uniform vec2 uPal;      // palette strength, brush strength
float pHash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float pNoise(vec3 x) {
  vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(pHash(i), pHash(i + vec3(1, 0, 0)), f.x), mix(pHash(i + vec3(0, 1, 0)), pHash(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(pHash(i + vec3(0, 0, 1)), pHash(i + vec3(1, 0, 1)), f.x), mix(pHash(i + vec3(0, 1, 1)), pHash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
`;
const RECOLOUR = /* glsl */ `
{
  float l = mix(dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114)), 0.55, uFlat);
  float y01 = (vBind.y - uBody.x) / uBody.y;
  float inRange = step(uTintP.y, y01) * step(y01, uTintP.z);
#ifdef USE_MAP
  if (uUvA.z > 0.0) {
    vec2 t = vMapUv;
    float a = step(uUvA.x, t.x) * step(t.x, uUvA.z) * step(uUvA.y, t.y) * step(t.y, uUvA.w);
    float b = step(uUvB.x, t.x) * step(t.x, uUvB.z) * step(uUvB.y, t.y) * step(t.y, uUvB.w);
    inRange = max(a, b);
  }
#endif
  diffuseColor.rgb = mix(diffuseColor.rgb, min(vec3(1.0), uTint * (0.4 + 0.8 * l) * uTintP.w), uTintP.x * inRange);
}
`;
/** Light falls in two soft bands, as a painter would block it in, and shine is held back. */
const BANDS = /* glsl */ `
#if NUM_DIR_LIGHTS > 0
{
  float ndl = dot(normal, directionalLights[0].direction);
  float soft = max(ndl, 0.0);
  float band = smoothstep(0.0, 0.14, ndl) * 0.62 + smoothstep(0.46, 0.62, ndl) * 0.38;
  float k = soft > 0.001 ? min(2.4, band / soft) : 1.0;
  reflectedLight.directDiffuse *= mix(1.0, k, 0.8);
  // A little of the key light wraps into the shadow side, so dark skin and dark cloth keep their colour.
  reflectedLight.directDiffuse += directionalLights[0].color * diffuseColor.rgb * RECIPROCAL_PI * 0.2 * (1.0 - smoothstep(-0.1, 0.3, ndl));
  // Skin: light passing through warms the edge of the shadow, as it does on real skin.
  float term = smoothstep(-0.25, 0.05, ndl) * (1.0 - smoothstep(0.05, 0.35, ndl));
  reflectedLight.directDiffuse += directionalLights[0].color * diffuseColor.rgb * vec3(1.0, 0.45, 0.32) * RECIPROCAL_PI * uLook.y * term;
  // A thin rim of the scene's light along the silhouette lifts people off the painting.
  float rim = pow(1.0 - saturate(dot(normal, geometryViewDir)), 3.0) * smoothstep(-0.3, 0.2, ndl);
  reflectedLight.directDiffuse += directionalLights[0].color * mix(vec3(1.0), diffuseColor.rgb * 2.0, 0.5) * uLook.x * rim;
}
#endif
reflectedLight.directSpecular *= 0.18;
reflectedLight.indirectSpecular *= 0.3;
`;
/**
 * The painter's pass: shadows take the painting's shadow colour and lights its light colour, saturation
 * eases a touch, and fine vertical brush strokes (fixed to the body, so they move with it) break up the
 * smooth CG surfaces. Strength comes from the scene; 0 leaves the figure as rendered.
 */
const PAINT = /* glsl */ `
{
  float pl = dot(outgoingLight, vec3(0.2126, 0.7152, 0.0722));
  vec3 tone = mix(uPalShade, uPalKey, smoothstep(0.03, 0.45, pl));
  outgoingLight = mix(outgoingLight, outgoingLight * tone, uPal.x);
  float pl2 = dot(outgoingLight, vec3(0.2126, 0.7152, 0.0722));
  outgoingLight = mix(vec3(pl2), outgoingLight, 1.0 - 0.12 * uPal.x);
  vec3 q = (vBind - vec3(0.0, uBody.x, 0.0)) / uBody.y;
  float stroke = pNoise(q * vec3(38.0, 105.0, 38.0)) * 0.6 + pNoise(q * vec3(95.0, 260.0, 95.0)) * 0.4;
  outgoingLight *= 1.0 + (stroke - 0.5) * uPal.y;
}
`;

/** One set of palette uniforms shared by every figure: a scene sets it once and everyone takes it on. */
const PALETTE = {
  uPalShade: { value: new THREE.Color(1, 1, 1) },
  uPalKey: { value: new THREE.Color(1, 1, 1) },
  uPal: { value: new THREE.Vector2(0, 0) },
};
const unitLum = (hex: string, toward: number): THREE.Color => {
  const c = new THREE.Color(hex);
  const l = Math.max(0.05, 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b);
  c.multiplyScalar(1 / l);
  // Keep the hue but not the full push: a gentle bias, not a colour filter.
  return new THREE.Color(1, 1, 1).lerp(c, toward);
};
/**
 * Paint the cast with a scene's colours (from the painting's measured light), or pass null for a plain look.
 * Also tints the ink lines with the painting's shadow colour.
 */
export function setFigurePalette(p: { shade: string; key: string } | null): void {
  if (!p) {
    PALETTE.uPal.value.set(0, 0);
    for (const m of inkMats.values()) m.color.set('#1d1512');
    return;
  }
  PALETTE.uPalShade.value.copy(unitLum(p.shade, 0.55));
  PALETTE.uPalKey.value.copy(unitLum(p.key, 0.35));
  PALETTE.uPal.value.set(0.6, 0.14);
  const ink = new THREE.Color(p.shade).multiplyScalar(0.22).lerp(new THREE.Color('#1d1512'), 0.45);
  for (const m of inkMats.values()) m.color.copy(ink);
  inkTint.copy(ink);
}
const inkTint = new THREE.Color('#1d1512');

function illustrate(mat: THREE.MeshStandardMaterial, tint: Tint | null, bodyMinY: number, bodyH: number, inflate = 0, rim = 0.12, warmth = 0): void {
  const uniforms = {
    uLook: { value: new THREE.Vector2(rim, warmth) },
    uUvA: { value: new THREE.Vector4(...(tint?.uv?.[0] ?? [0, 0, 0, 0])) },
    uUvB: { value: new THREE.Vector4(...(tint?.uv?.[1] ?? tint?.uv?.[0] ?? [0, 0, 0, 0])) },
    uInflate: { value: inflate },
    uTint: { value: new THREE.Color(tint?.color ?? '#ffffff') },
    uTintP: { value: new THREE.Vector4(tint ? 0.94 : 0, tint?.lo ?? -1, tint?.hi ?? 3, tint?.gain ?? 1) },
    uBody: { value: new THREE.Vector2(bodyMinY, Math.max(0.1, bodyH)) },
    uFlat: { value: tint?.flat ? 1 : 0 },
  };
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uniforms, PALETTE);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>\n${DECL_V}`).replace('#include <begin_vertex>', '#include <begin_vertex>\n\tvBind = position;\n\ttransformed += normalize( normal ) * uInflate;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>\n${DECL_F}`)
      .replace('#include <color_fragment>', `#include <color_fragment>\n${RECOLOUR}`)
      .replace('#include <lights_fragment_end>', `#include <lights_fragment_end>\n${BANDS}`)
      .replace('#include <opaque_fragment>', `${PAINT}\n#include <opaque_fragment>`);
  };
  mat.customProgramCacheKey = () => 'immigrant-mh-v6';
}

const inkMats = new Map<number, THREE.MeshBasicMaterial>();
/** A back-facing hull pushed out along the normals: a thin dark ink line, like the painted scenes. */
function inkMaterial(push: number): THREE.MeshBasicMaterial {
  let m = inkMats.get(push);
  if (!m) {
    m = new THREE.MeshBasicMaterial({ color: inkTint.clone(), side: THREE.BackSide });
    m.onBeforeCompile = (sh) => {
      sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>\n\ttransformed += normalize( normal ) * ${push.toFixed(4)};`);
    };
    m.customProgramCacheKey = () => `immigrant-ink-${push}`;
    inkMats.set(push, m);
  }
  return m;
}

/* ------------------------------------------------------------------- figure */

const CUTOUT = new Set(['hair', 'brows', 'lashes', 'beard']);
/** Standing poses where the feet should rest flat on the floor. */
const FLAT_FOOT = new Set<Pose>(['idle', 'talk', 'wave', 'carry', 'think', 'phone', 'laugh', 'cook', 'present', 'cheer', 'type']);
/** Shoe assets that read badly at game size: a plain white texture (reads as socks) or a leopard print (reads as
 * bare feet). They are shaded as solid leather instead. */
const PLAIN_SHOES = new Set(['toigo_ankle_boots_female', 'toigo_flats']);

export class MhFigure {
  readonly group = new THREE.Group();
  readonly look: FigureLook;
  readonly castId: string;
  pose: Pose = 'idle';
  walkRate = 1;
  private seated = false;
  private mixer: THREE.AnimationMixer | null = null;
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
  private phoneProp: THREE.Object3D | null = null;
  private boxProp: THREE.Object3D | null = null;
  private batProp: THREE.Object3D | null = null;
  private ballProp: THREE.Object3D | null = null;
  private gone = false;
  private face: { mesh: THREE.Mesh; blink: number; open: number; smile: number } | null = null;
  private nextBlink = 1 + Math.random() * 4;
  private blinkT = -1;
  private readonly clips = new Map<string, THREE.AnimationClip>();
  private pelvisRest = 1;
  /** Rest-pose differences between these skeletons and the animation library's, corrected on every frame. */
  static fix: Array<[string, number, number, number]> = [];
  /** Poses that read better on these bodies with a different base clip. */
  static poseClip: Partial<Record<Pose, { clip: string; hold?: boolean; speed?: number }>> = { wave: { clip: 'Idle_Loop' } };
  static gestureFix: Partial<Record<Pose, Array<[string, number, number, number]>>> = {
    wave: [['upperarm_r', 0, 0, -0.8]],
    // The shared typing gesture folds these arms up to the face; open the elbows so the hands rest on the laptop.
    type: [['lowerarm_r', -0.8, 0, 0], ['lowerarm_l', -0.8, 0, 0]],
  };
  private static readonly q = new THREE.Quaternion();
  private static readonly e = new THREE.Euler();
  private static readonly v = new THREE.Vector3();

  constructor(look: FigureLook, readonly lite = false, forceId?: string) {
    this.look = look;
    this.castId = forceId ?? castFor(look, lite);
    const src = ready.get(this.castId);
    if (src) this.build(src);
    else
      sceneLoads.push(
        loadPerson(this.castId).then((g) => {
          if (g && !this.gone) this.build(g);
        }),
      );
  }

  private build(src: THREE.Group): void {
    const def = BY_ID.get(this.castId);
    const root = cloneSkinned(src) as THREE.Group;
    const meshes: THREE.SkinnedMesh[] = [];
    root.traverse((o) => {
      if ((o as THREE.SkinnedMesh).isSkinnedMesh) meshes.push(o as THREE.SkinnedMesh);
      if ((o as THREE.Bone).isBone) this.bones.set(o.name, o);
    });
    const pb = this.bones.get('pelvis');
    if (pb) this.pelvisRest = pb.position.length();
    const kindOf = (m: THREE.SkinnedMesh): [string, string] => {
      const n = (m.material as THREE.Material).name || m.name;
      const i = n.indexOf('__');
      return i < 0 ? ['cloth', n] : [n.slice(0, i), n.slice(i + 2).replace(/\.\d+$/, '')];
    };
    const body = meshes.find((m) => kindOf(m)[0] === 'body');
    const bg = (body ?? meshes[0]).geometry;
    if (!bg.boundingBox) bg.computeBoundingBox();
    const bb = bg.boundingBox as THREE.Box3;
    const minY = bb.min.y;
    const bodyH = bb.max.y - bb.min.y;
    if (body?.morphTargetDictionary) {
      const d = body.morphTargetDictionary;
      this.face = { mesh: body, blink: d.blink ?? -1, open: d.open ?? -1, smile: d.smile ?? -1 };
    }
    const hasHat = meshes.some((m) => kindOf(m)[0] === 'hat');
    const ink: THREE.SkinnedMesh[] = [];
    for (const m of meshes) {
      const [kind, asset] = kindOf(m);
      m.frustumCulled = false;
      m.castShadow = !this.group.userData.noShadow;
      m.receiveShadow = kind !== 'lashes' && kind !== 'brows';
      const mat = (m.material as THREE.MeshStandardMaterial).clone();
      const clip = this.group.userData.clip as THREE.Plane[] | undefined;
      if (clip) mat.clippingPlanes = clip;
      this.owned.push(mat);
      m.material = mat;
      const cut = CUTOUT.has(kind);
      mat.transparent = false;
      mat.depthWrite = true;
      // Soft, anti-aliased edges on hair, brows and lashes instead of a hard cut-out.
      mat.alphaTest = cut ? 0.22 : 0;
      mat.alphaToCoverage = cut;
      mat.side = cut || kind === 'cloth' ? THREE.DoubleSide : THREE.FrontSide;
      mat.metalness = 0;
      mat.roughness = kind === 'eyes' ? 0.06 : kind === 'shoe' ? 0.6 : kind === 'body' ? 0.7 : kind === 'hair' || kind === 'beard' ? 0.55 : 0.92;
      mat.normalMap = null;
      let tint: Tint | null = def?.tints?.[asset] ?? null;
      // These boots come with a plain white texture that reads as socks: give them leather, varied per person.
      if (!tint && kind === 'shoe' && PLAIN_SHOES.has(asset)) {
        const leather = ['#2a1f19', '#141313', '#5a3c26', '#3d1c22', '#1f2638'];
        let h = 0;
        for (const ch of this.castId) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
        tint = { color: leather[h % leather.length], gain: 0.85, flat: true };
      }
      if ((kind === 'hair' || kind === 'beard' || kind === 'brows') && def?.hairTint) tint = { color: def.hairTint };
      if (kind === 'body' && def?.skinTint) mat.color.set(def.skinTint);
      if (kind === 'eyes') {
        // Eyes carry a little of their own light, so faces stay alive in dim scenes.
        mat.emissive = new THREE.Color('#ffffff');
        mat.emissiveMap = mat.map;
        mat.emissiveIntensity = 0.25;
      } else {
        // Clothes sit a few millimetres proud of the body so skin never shows through the cloth.
        const rim = kind === 'hair' || kind === 'beard' ? 0.22 : kind === 'body' ? 0.16 : kind === 'lashes' || kind === 'brows' ? 0 : 0.1;
        illustrate(mat, tint, minY, bodyH, kind === 'cloth' ? 0.006 : kind === 'shoe' ? 0.002 : 0, rim, kind === 'body' ? 0.35 : 0);
      }
      // A cap sits over the hair; hide the hair rather than let it poke through.
      if (kind === 'hair' && hasHat) m.visible = false;
      if (kind === 'body' || kind === 'cloth' || kind === 'shoe' || kind === 'hat') ink.push(m);
    }
    // Feet on the floor.
    const box = new THREE.Box3().setFromObject(root, true);
    // Real people differ in height, but nobody towers: keep everyone between about 1.5 and 1.8 m.
    const tall = box.max.y - box.min.y;
    const fit = tall > 1.8 ? 1.8 / tall : tall < 1.5 ? 1.5 / tall : 1;
    root.scale.multiplyScalar(fit);
    root.position.y = -box.min.y * fit;
    this.group.add(root);

    // Things worn at the neck and head were fitted to another skeleton, so only body-worn ones carry over.
    const acc = this.look.accessory;
    const worn = acc === 'scarf' || acc === 'glasses' || acc === 'headphones' ? { ...this.look, accessory: 'none' as const } : this.look;
    const props = attachAccessories(root, this.group, worn, this.owned);
    this.phoneProp = props.phone;
    this.boxProp = props.box;
    this.batProp = props.bat;
    this.ballProp = props.ball;
    if (this.look.uniform === 'officer') officerKit(this.group, meshes, this.bones, this.owned);
    if (!this.lite) {
      for (const m of ink) {
        let inkMat = inkMaterial(kindOf(m)[0] === 'cloth' ? 0.0068 : 0.0028);
        const clipTo = this.group.userData.clip as THREE.Plane[] | undefined;
        if (clipTo) {
          const key = inkMat.customProgramCacheKey;
          const onCompile = inkMat.onBeforeCompile;
          inkMat = inkMat.clone();
          inkMat.onBeforeCompile = onCompile;
          inkMat.customProgramCacheKey = key;
          inkMat.clippingPlanes = clipTo;
          this.owned.push(inkMat);
        }
        const line = new THREE.SkinnedMesh(m.geometry, inkMat);
        line.bind(m.skeleton, m.bindMatrix);
        line.frustumCulled = false;
        (m.parent ?? root).add(line);
      }
    }
    this.mixer = new THREE.AnimationMixer(root);
    this.clipKey = '';
    this.setPose(this.pose);
  }

  /**
   * The library's clips carry its own skeleton's bone lengths. Playing those on a person with different
   * proportions would stretch them, so only rotations are kept, and the hip travel is scaled to this
   * person's leg length (so feet stay on the floor when sitting or walking).
   */
  private clipFor(name: string): THREE.AnimationClip | null {
    const hit = this.clips.get(name);
    if (hit) return hit;
    const src = humanClips()?.get(name);
    if (!src) return null;
    const ref = humanClips()?.get('A_TPose') ?? src;
    const refTrack = ref.tracks.find((t) => t.name === 'pelvis.position');
    const pelvis = this.bones.get('pelvis');
    const srcLen = refTrack ? Math.hypot(refTrack.values[0], refTrack.values[1], refTrack.values[2]) : 0;
    const k = pelvis && srcLen > 0.001 ? this.pelvisRest / srcLen : 1;
    const tracks: THREE.KeyframeTrack[] = [];
    for (const t of src.tracks) {
      if (t.name.endsWith('.quaternion')) tracks.push(t);
      else if (t.name === 'pelvis.position') {
        const v = new Float32Array(t.values.length);
        for (let i = 0; i < v.length; i++) v[i] = t.values[i] * k;
        tracks.push(new THREE.VectorKeyframeTrack(t.name, Array.from(t.times), Array.from(v)));
      }
    }
    const clip = new THREE.AnimationClip(name, src.duration, tracks);
    this.clips.set(name, clip);
    return clip;
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
    if (!this.mixer) return;
    let spec = MhFigure.poseClip[p] ?? STANDING[p];
    if (this.seated) spec = SEATED_TALK.has(p) ? { clip: 'Sitting_Talking_Loop' } : { clip: 'Sitting_Idle_Loop' };
    const key = `${spec.clip}|${spec.hold ? 1 : 0}`;
    if (key === this.clipKey) return;
    this.clipKey = key;
    const clip = this.clipFor(spec.clip);
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

  /** Hold the carried box between the palms: centred on the hands, level with the body, as wide as the grip. */
  private gripBox(boxObj: THREE.Object3D): void {
    const hl = this.bones.get('hand_l');
    const hr = this.bones.get('hand_r');
    const parent = boxObj.parent;
    if (!hl || !hr || !parent) return;
    this.group.updateMatrixWorld(true);
    const a = hl.getWorldPosition(new THREE.Vector3());
    const b = hr.getWorldPosition(new THREE.Vector3());
    const span = a.distanceTo(b);
    const mid = a.add(b).multiplyScalar(0.5);
    // Palms hold the box a little below its top edge.
    const s = parent.getWorldScale(new THREE.Vector3()).x || 1;
    mid.y -= 0.06;
    boxObj.position.copy(parent.worldToLocal(mid));
    const pq = parent.getWorldQuaternion(new THREE.Quaternion()).invert();
    boxObj.quaternion.copy(pq.multiply(this.group.getWorldQuaternion(new THREE.Quaternion())));
    // The box (0.42 wide) fits between the hands, never narrower than a small carton.
    boxObj.scale.set(Math.max(0.7, Math.min(1.3, (span - 0.04) / (0.42 * s))), 1, 1);
  }

  /**
   * The library's clips were made for another skeleton, and on these people the feet tip forward so they
   * look as if they stand on tiptoe. While standing, turn each foot so the ball of the foot sits level with
   * the heel (a few millimetres lower, as feet rest), keeping the foot's heading.
   */
  private levelFeet(): void {
    const v = MhFigure.v;
    for (const side of ['l', 'r'] as const) {
      const foot = this.bones.get(`foot_${side}`);
      const ball = this.bones.get(`ball_${side}`);
      if (!foot || !ball || !foot.parent) continue;
      foot.updateWorldMatrix(true, true);
      const heel = foot.getWorldPosition(new THREE.Vector3());
      const toe = ball.getWorldPosition(v);
      const dir = toe.sub(heel);
      const len = dir.length();
      if (len < 1e-4) continue;
      dir.divideScalar(len);
      const flat = Math.hypot(dir.x, dir.z);
      if (flat < 1e-3) continue;
      // Target: the same heading, dropping only slightly toward the toe (about 8 degrees).
      const target = new THREE.Vector3(dir.x / flat, 0, dir.z / flat).multiplyScalar(Math.cos(0.14));
      target.y = -Math.sin(0.14);
      if (dir.angleTo(target) < 0.03) continue;
      const turn = new THREE.Quaternion().setFromUnitVectors(dir, target.normalize());
      const fw = foot.getWorldQuaternion(new THREE.Quaternion());
      const pw = foot.parent.getWorldQuaternion(new THREE.Quaternion());
      foot.quaternion.copy(pw.invert().multiply(turn.multiply(fw)));
    }
  }

  private static readonly gesturing: ReadonlySet<Pose> = new Set<Pose>(['talk', 'present', 'laugh', 'think', 'phone']);

  private rot(bone: string, x: number, y: number, z: number, w: number): void {
    const b = this.bones.get(bone);
    if (!b) return;
    MhFigure.e.set(x * w, y * w, z * w, 'XYZ');
    b.quaternion.multiply(MhFigure.q.setFromEuler(MhFigure.e));
  }

  update(dt: number, _time: number): void {
    void _time;
    if (!this.mixer) return;
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
    this.blend = Math.min(1, this.blend + dt * 4);
    // These people carry their heads a little lower and their arms a little wider than the library's
    // own skeleton, so lift the chin and settle the arms.
    for (const [bn, x, y, z] of MhFigure.fix) this.rot(bn, x, y, z, 1);
    if (this.pose !== 'sleep') {
      this.rot('spine_03', -0.05, 0, 0, 1);
      this.rot('neck_01', -0.12, 0, 0, 1);
      this.rot('Head', -0.2, 0, 0, 1);
      if (!this.seated) {
        // Hanging arms settle in toward the body; gesturing arms open a little instead, so on a fuller build
        // the forearms stay in front of the torso rather than passing into it (hands looked detached).
        const arm = MhFigure.gesturing.has(this.pose) ? -0.1 : 0.13;
        this.rot('upperarm_r', 0, 0, arm, 1);
        this.rot('upperarm_l', 0, 0, -arm, 1);
        // A narrower, more natural stance than the library's wide-footed default.
        this.rot('thigh_r', 0, 0, -0.07, 1);
        this.rot('thigh_l', 0, 0, 0.07, 1);
      }
    }
    const g = GESTURES[this.pose];
    if (g) for (const r of g(this.clock)) this.rot(r.bone, r.x ?? 0, r.y ?? 0, r.z ?? 0, this.blend);
    const gf = MhFigure.gestureFix[this.pose];
    if (gf) for (const [bn, x, y, z] of gf) this.rot(bn, x, y, z, this.blend);
    if (!this.seated && FLAT_FOOT.has(this.pose)) this.levelFeet();
    this.animateFace(dt);
    if (this.phoneProp) this.phoneProp.visible = this.pose === 'phone';
    if (this.boxProp) this.boxProp.visible = this.pose === 'carry';
    if (this.boxProp && this.pose === 'carry') this.gripBox(this.boxProp);
    if (this.batProp) this.batProp.visible = this.pose === 'bat';
    if (this.ballProp) this.ballProp.visible = this.pose === 'bowl';
    let yaw = 0;
    let pitch = 0;
    const head = this.bones.get('Head');
    if (this.target && head) {
      const v = MhFigure.v;
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

  /** Blinks every few seconds, a moving mouth while speaking, and a smile for the happy poses. */
  private animateFace(dt: number): void {
    const f = this.face;
    const inf = f?.mesh.morphTargetInfluences;
    if (!f || !inf) return;
    const p = this.pose;
    let blink = 0;
    if (p === 'sleep') blink = 1;
    else {
      this.nextBlink -= dt;
      if (this.nextBlink <= 0) {
        this.blinkT = 0;
        this.nextBlink = 2.2 + Math.random() * 4;
      }
      if (this.blinkT >= 0) {
        this.blinkT += dt;
        const u = this.blinkT / 0.16;
        blink = u >= 1 ? 0 : Math.sin(u * Math.PI);
        if (u >= 1) this.blinkT = -1;
      }
    }
    const t = this.clock;
    const speaking = p === 'talk' || p === 'present' || p === 'phone' || p === 'laugh';
    // Syllables: two sines beating against each other, gated into short pauses.
    const syll = Math.max(0, Math.sin(t * 9.1 + this.phase) * 0.6 + Math.sin(t * 5.3 + this.phase * 2) * 0.4);
    const pause = Math.sin(t * 0.9 + this.phase) > -0.55 ? 1 : 0;
    const open = p === 'laugh' ? 0.45 + syll * 0.25 : speaking ? syll * 0.5 * pause : p === 'eat' ? Math.max(0, Math.sin(t * 6)) * 0.25 : 0;
    const smile = p === 'laugh' || p === 'cheer' || p === 'dance' ? 0.85 : p === 'wave' ? 0.6 : speaking ? 0.2 : 0.08;
    const k = Math.min(1, dt * 14);
    if (f.blink >= 0) inf[f.blink] = blink;
    if (f.open >= 0) inf[f.open] += (open - inf[f.open]) * k;
    if (f.smile >= 0) inf[f.smile] += (smile - inf[f.smile]) * k;
  }

  dispose(): void {
    this.gone = true;
    this.mixer?.stopAllAction();
    for (const d of this.owned) d.dispose();
  }
}

/**
 * Uniform details for a border or immigration officer, so the role reads at a glance: a shield badge and a
 * name plate on the chest, a patch on each shoulder and a duty belt with a buckle (no weapon). Each part is
 * placed by finding the actual shirt surface, then attached to the nearest bone so it moves with the body.
 */
function officerKit(group: THREE.Group, meshes: THREE.SkinnedMesh[], bones: Map<string, THREE.Object3D>, owned: Array<{ dispose(): void }>): void {
  // Work in the figure's own space: lift it out of the world for a moment.
  const saved = { p: group.position.clone(), q: group.quaternion.clone(), s: group.scale.clone(), parent: group.parent };
  saved.parent?.remove(group);
  group.position.set(0, 0, 0);
  group.quaternion.identity();
  group.scale.set(1, 1, 1);
  group.updateMatrixWorld(true);
  const ray = new THREE.Raycaster();
  const at = (name: string): THREE.Vector3 | null => {
    const b = bones.get(name);
    return b ? b.getWorldPosition(new THREE.Vector3()) : null;
  };
  /** The outermost surface met travelling from `from` toward `to`, stopping before `to`. */
  const surface = (from: THREE.Vector3, to: THREE.Vector3, closest = false): THREE.Vector3 | null => {
    const dir = to.clone().sub(from);
    const far = dir.length();
    ray.set(from, dir.normalize());
    ray.far = far;
    const hits = ray.intersectObjects(meshes, false).filter((h) => h.distance < far);
    if (!hits.length) return null;
    return (closest ? hits[hits.length - 1] : hits[0]).point;
  };
  const mat = (color: string, metal = 0, rough = 0.7): THREE.MeshStandardMaterial => {
    const m = new THREE.MeshStandardMaterial({ color, metalness: metal, roughness: rough });
    owned.push(m);
    return m;
  };
  const put = (mesh: THREE.Mesh, bone: string): void => {
    owned.push(mesh.geometry);
    mesh.castShadow = false;
    const b = bones.get(bone);
    if (b) b.attach(mesh);
    else group.add(mesh);
  };
  const chest = at('spine_03');
  const pelvis = at('pelvis');
  const s1 = at('spine_01');
  const collar = at('clavicle_l');
  if (chest && collar) {
    // Pocket height: a little over halfway from the chest bone up to the collarbone.
    const y = chest.y + (collar.y - chest.y) * 0.55;
    // Shield badge on the left chest (the officer's left is +x; the figure faces +z).
    const bp = surface(new THREE.Vector3(0.095, y, 1), new THREE.Vector3(0.095, y, chest.z));
    if (bp) {
      const shield = new THREE.Shape();
      shield.moveTo(0, 0.034);
      shield.lineTo(0.026, 0.022);
      shield.lineTo(0.022, -0.012);
      shield.quadraticCurveTo(0.012, -0.03, 0, -0.038);
      shield.quadraticCurveTo(-0.012, -0.03, -0.022, -0.012);
      shield.lineTo(-0.026, 0.022);
      shield.closePath();
      const geo = new THREE.ExtrudeGeometry(shield, { depth: 0.004, bevelEnabled: true, bevelThickness: 0.0015, bevelSize: 0.0015, bevelSegments: 1 });
      const badge = new THREE.Mesh(geo, mat('#d9b54a', 0.6, 0.35));
      badge.position.set(bp.x, bp.y, bp.z + 0.008);
      put(badge, 'spine_03');
    }
    // Name plate on the right chest.
    const np = surface(new THREE.Vector3(-0.095, y - 0.005, 1), new THREE.Vector3(-0.095, y - 0.005, chest.z));
    if (np) {
      const plate = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.017, 0.004), mat('#c9ccd2', 0.5, 0.4));
      plate.position.set(np.x, np.y, np.z + 0.009);
      put(plate, 'spine_03');
    }
  }
  // A patch high on each sleeve, facing out.
  for (const side of ['l', 'r'] as const) {
    const sh = at(`upperarm_${side}`);
    const el = at(`lowerarm_${side}`);
    if (!sh || !el) continue;
    const mid = sh.clone().lerp(el, 0.28);
    const sx = side === 'l' ? 1 : -1;
    const pp = surface(new THREE.Vector3(mid.x + sx * 0.5, mid.y, mid.z), mid);
    if (!pp) continue;
    const patch = new THREE.Group();
    const disc = new THREE.Mesh(new THREE.CircleGeometry(0.034, 20), mat('#1b2a4a', 0, 0.8));
    const rim = new THREE.Mesh(new THREE.RingGeometry(0.031, 0.037, 24), mat('#d9b54a', 0.4, 0.5));
    const star = new THREE.Mesh(new THREE.CircleGeometry(0.011, 5), mat('#e8e4d8', 0, 0.6));
    rim.position.z = 0.0005;
    star.position.z = 0.001;
    for (const m of [disc, rim, star]) {
      (m.material as THREE.Material).side = THREE.DoubleSide;
      owned.push(m.geometry);
      patch.add(m);
    }
    patch.position.set(pp.x + sx * 0.01, pp.y, pp.z + 0.008);
    // Turned partly toward the front, the way a sleeve patch is seen on someone facing you.
    patch.rotation.y = sx * Math.PI * 0.36;
    const b = bones.get(`upperarm_${side}`);
    if (b) b.attach(patch);
  }
  // Duty belt round the waist, sized to the body there.
  if (pelvis && s1) {
    const y = pelvis.y + (s1.y - pelvis.y) * 0.55;
    const c = new THREE.Vector3(pelvis.x, y, pelvis.z);
    const front = surface(new THREE.Vector3(c.x, y, 1), c);
    const back = surface(new THREE.Vector3(c.x, y, -1), c);
    const left = surface(new THREE.Vector3(1, y, c.z), c, true);
    const right = surface(new THREE.Vector3(-1, y, c.z), c, true);
    if (front && back && left && right) {
      const rx = (left.x - right.x) / 2 + 0.012;
      const rz = (front.z - back.z) / 2 + 0.012;
      const cz = (front.z + back.z) / 2;
      const cx = (left.x + right.x) / 2;
      const geo = new THREE.CylinderGeometry(1, 1, 0.042, 40, 1, true);
      geo.scale(rx, 1, rz);
      const m = mat('#121318', 0, 0.55);
      m.side = THREE.DoubleSide;
      const belt = new THREE.Mesh(geo, m);
      belt.position.set(cx, y, cz);
      put(belt, 'pelvis');
      const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.034, 0.008), mat('#b9bcc4', 0.7, 0.3));
      buckle.position.set(cx, y, cz + rz + 0.003);
      put(buckle, 'pelvis');
      // Two small pouches on the belt, one each side.
      for (const sx of [1, -1]) {
        const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 0.03), mat('#1a1b20', 0, 0.6));
        const a = sx * 0.95;
        pouch.position.set(cx + Math.sin(a) * rx, y - 0.01, cz + Math.cos(a) * rz);
        pouch.rotation.y = a;
        put(pouch, 'pelvis');
      }
    }
  }
  group.position.copy(saved.p);
  group.quaternion.copy(saved.q);
  group.scale.copy(saved.s);
  saved.parent?.add(group);
  group.updateMatrixWorld(true);
}
