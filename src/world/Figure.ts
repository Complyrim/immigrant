import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { Pose, Role, Sex, Marital } from '../engine/types';

export interface FigureLook {
  skin: string;
  hair: string;
  hairStyle: 'short' | 'long' | 'bun' | 'curly' | 'bald' | 'cap' | 'ponytail';
  top: string;
  bottom: string;
  shoes: string;
  /** scale 0.9 to 1.1 */
  height: number;
  build: 'slim' | 'average' | 'broad';
  accessory: 'none' | 'glasses' | 'backpack' | 'scarf' | 'headphones' | 'lanyard' | 'badge' | 'suitcase';
  uniform?: 'officer' | 'doctor' | 'nurse' | 'suit';
  /** optional extra: outer layer over the top colour */
  outer?: 'hoodie' | 'jacket' | 'none';
  /** softer silhouette, fuller lips, lashes. Derived from hair style when omitted. */
  fem?: boolean;
  /** Realistic people only: a dress, tunic or coat as the top, or a skirt or shorts as the bottom. */
  outfit?: 'dress' | 'kurta' | 'coat' | 'skirt' | 'shorts';
  /** Who this is in the story; picks the person from the cast. */
  role?: Role;
}

/* ------------------------------------------------------------------ caches */

const geoCache = new Map<string, THREE.BufferGeometry>();
function geo<T extends THREE.BufferGeometry>(key: string, make: () => T): T {
  let g = geoCache.get(key);
  if (!g) {
    g = make();
    geoCache.set(key, g);
  }
  return g as T;
}
export const unitBox = (): THREE.BoxGeometry => geo('box', () => new THREE.BoxGeometry(1, 1, 1));
export const unitSphere = (): THREE.SphereGeometry => geo('sph', () => new THREE.SphereGeometry(1, 20, 14));
export const unitCyl = (seg = 16): THREE.CylinderGeometry => geo('cyl' + seg, () => new THREE.CylinderGeometry(1, 1, 1, seg));
const hiSphere = (): THREE.SphereGeometry => geo('hisph', () => new THREE.SphereGeometry(1, 28, 20));
const rbox = (w: number, h: number, d: number, r: number): THREE.BufferGeometry =>
  geo(`rb${w}:${h}:${d}:${r}`, () => new RoundedBoxGeometry(w, h, d, 3, r));

export interface MatOpts {
  rough?: number;
  metal?: number;
  emissive?: string;
  ei?: number;
  opacity?: number;
  double?: boolean;
}
const matCache = new Map<string, THREE.MeshStandardMaterial>();
export function stdMat(color: string, o: MatOpts = {}): THREE.MeshStandardMaterial {
  const key = `${color}|${o.rough ?? ''}|${o.metal ?? ''}|${o.emissive ?? ''}|${o.ei ?? ''}|${o.opacity ?? ''}|${o.double ? 1 : 0}`;
  let m = matCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color,
      roughness: o.rough ?? 0.85,
      metalness: o.metal ?? 0,
      emissive: o.emissive ?? '#000000',
      emissiveIntensity: o.ei ?? 1,
      transparent: o.opacity !== undefined && o.opacity < 1,
      opacity: o.opacity ?? 1,
      side: o.double ? THREE.DoubleSide : THREE.FrontSide,
      depthWrite: o.opacity === undefined || o.opacity >= 1,
    });
    matCache.set(key, m);
  }
  return m;
}

let blobTex: THREE.CanvasTexture | null = null;
let blobMat: THREE.MeshBasicMaterial | null = null;
export function blobShadowMaterial(): THREE.MeshBasicMaterial {
  if (!blobMat) {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d');
    if (g) {
      const gr = g.createRadialGradient(32, 32, 2, 32, 32, 31);
      gr.addColorStop(0, 'rgba(0,0,0,0.5)');
      gr.addColorStop(0.5, 'rgba(0,0,0,0.22)');
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr;
      g.fillRect(0, 0, 64, 64);
    }
    blobTex = new THREE.CanvasTexture(c);
    blobMat = new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, toneMapped: false });
  }
  return blobMat;
}
export const blobGeo = (): THREE.PlaneGeometry => geo('blob', () => {
  const g = new THREE.PlaneGeometry(1, 1);
  g.rotateX(-Math.PI / 2);
  return g;
});

function shade(hex: string, amt: number): string {
  return new THREE.Color(hex).offsetHSL(0, 0, amt).getStyle();
}
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}
function mulberry(seed: number): () => number {
  let a = (seed | 0) + 0x6d2b79f5;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const clamp = (v: number, a: number, b: number): number => Math.max(a, Math.min(b, v));

/* ------------------------------------------------------------------ materials */

/** Soft fresnel rim added to the emissive term: gives the stylised "rim light" feel. */
function rimify(m: THREE.MeshStandardMaterial, rim: string, k: number): void {
  const c = new THREE.Color(rim);
  m.onBeforeCompile = (sh) => {
    sh.uniforms.rimC = { value: c.clone().multiplyScalar(k) };
    sh.fragmentShader = 'uniform vec3 rimC;\n' + sh.fragmentShader.replace(
      '#include <emissivemap_fragment>',
      `#include <emissivemap_fragment>
      { float rr = pow(1.0 - saturate(dot(normalize(vNormal), normalize(vViewPosition))), 2.4); totalEmissiveRadiance += rimC * rr; }`,
    );
  };
  m.customProgramCacheKey = () => 'figrim';
}

const texCache = new Map<string, THREE.CanvasTexture>();
function fabricTex(kind: 'weave' | 'denim' | 'knit'): THREE.CanvasTexture {
  let t = texCache.get(kind);
  if (t) return t;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const r = mulberry(kind.length * 977);
  if (g) {
    g.fillStyle = '#ececec';
    g.fillRect(0, 0, 64, 64);
    if (kind === 'weave') {
      for (let y = 0; y < 64; y += 2) for (let x = 0; x < 64; x += 2) {
        const v = ((x / 2 + y / 2) & 1) ? 226 : 244;
        g.fillStyle = `rgb(${v},${v},${v})`;
        g.fillRect(x, y, 2, 2);
      }
    } else if (kind === 'denim') {
      for (let x = 0; x < 64; x++) {
        const v = 214 + Math.floor(r() * 36);
        g.fillStyle = `rgb(${v},${v},${v})`;
        g.fillRect(x, 0, 1, 64);
      }
      for (let i = 0; i < 260; i++) { g.fillStyle = `rgba(255,255,255,${r() * 0.35})`; g.fillRect(Math.floor(r() * 64), Math.floor(r() * 64), 1, 2); }
    } else {
      for (let y = 0; y < 64; y += 4) for (let x = 0; x < 64; x += 3) {
        const v = 220 + Math.floor(r() * 30);
        g.fillStyle = `rgb(${v},${v},${v})`;
        g.fillRect(x, y, 2, 3);
      }
    }
  }
  t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(5, 5);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 2;
  texCache.set(kind, t);
  return t;
}

const clothCache = new Map<string, THREE.MeshPhysicalMaterial>();
function clothMat(color: string, kind: 'weave' | 'denim' | 'knit' = 'weave', rough = 0.86): THREE.MeshPhysicalMaterial {
  const key = `${color}|${kind}|${rough}`;
  let m = clothCache.get(key);
  if (!m) {
    const col = new THREE.Color(color);
    m = new THREE.MeshPhysicalMaterial({
      color: col,
      map: fabricTex(kind),
      roughness: rough,
      sheen: 0.8,
      sheenRoughness: 0.55,
      sheenColor: col.clone().lerp(new THREE.Color('#ffffff'), 0.5),
    });
    rimify(m, '#ffe8d2', 0.16);
    clothCache.set(key, m);
  }
  return m;
}
const skinCache = new Map<string, THREE.MeshStandardMaterial>();
function skinMat(color: string): THREE.MeshStandardMaterial {
  let m = skinCache.get(color);
  if (!m) {
    const c = new THREE.Color(color);
    m = new THREE.MeshStandardMaterial({ color: c, roughness: 0.58, emissive: c.clone().multiplyScalar(0.05), emissiveIntensity: 1 });
    rimify(m, '#ffd0b0', 0.2);
    skinCache.set(color, m);
  }
  return m;
}
const hairCache = new Map<string, THREE.MeshPhysicalMaterial>();
function hairMat(color: string): THREE.MeshPhysicalMaterial {
  let m = hairCache.get(color);
  if (!m) {
    const c = new THREE.Color(color);
    m = new THREE.MeshPhysicalMaterial({
      color: c,
      roughness: 0.42,
      sheen: 1,
      sheenRoughness: 0.35,
      sheenColor: c.clone().lerp(new THREE.Color('#fff2e0'), 0.55),
      clearcoat: 0.25,
      clearcoatRoughness: 0.4,
    });
    rimify(m, '#fff0dc', 0.22);
    hairCache.set(color, m);
  }
  return m;
}
const irisCache = new Map<string, THREE.CanvasTexture>();
function irisTex(color: string): THREE.CanvasTexture {
  let t = irisCache.get(color);
  if (!t) {
    const c = document.createElement('canvas');
    c.width = 4;
    c.height = 64;
    const g = c.getContext('2d');
    if (g) {
      const gr = g.createLinearGradient(0, 0, 0, 64);
      const base = new THREE.Color(color);
      gr.addColorStop(0, '#050404');
      gr.addColorStop(0.3, '#050404');
      gr.addColorStop(0.34, '#' + base.clone().multiplyScalar(0.55).getHexString());
      gr.addColorStop(0.62, '#' + base.clone().offsetHSL(0, 0, 0.1).getHexString());
      gr.addColorStop(0.88, '#' + base.clone().multiplyScalar(0.5).getHexString());
      gr.addColorStop(1, '#1a1210');
      g.fillStyle = gr;
      g.fillRect(0, 0, 4, 64);
    }
    t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    irisCache.set(color, t);
  }
  return t;
}
const eyeWhiteM = new THREE.MeshStandardMaterial({ color: '#f7f5f1', roughness: 0.25 });
const glintM = new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false });
const blushCache = new Map<string, THREE.MeshBasicMaterial>();
function blushMat(skin: string): THREE.MeshBasicMaterial {
  let m = blushCache.get(skin);
  if (!m) {
    m = new THREE.MeshBasicMaterial({ color: new THREE.Color(skin).lerp(new THREE.Color('#ff5a5a'), 0.5), transparent: true, opacity: 0.2, depthWrite: false });
    blushCache.set(skin, m);
  }
  return m;
}

/* ------------------------------------------------------------------ geometry helpers */

const V2 = THREE.Vector2;

/** Smooth tapered limb hanging down from y=0 (top cap above), rounded at both ends. */
function limbGeo(r0: number, r1: number, len: number, seg: number, bulge = 0): THREE.BufferGeometry {
  return geo(`limb${r0}:${r1}:${len}:${seg}:${bulge}`, () => {
    const pts: THREE.Vector2[] = [];
    const cap = 5;
    for (let i = 0; i <= cap; i++) {
      const a = (i / cap) * Math.PI * 0.5;
      pts.push(new V2(Math.sin(a) * r1, -len - Math.cos(a) * r1));
    }
    const mid = 7;
    for (let i = 1; i <= mid; i++) {
      const t = i / mid;
      pts.push(new V2(lerp(r1, r0, t) + Math.sin(t * Math.PI) * bulge, -len * (1 - t)));
    }
    for (let i = 1; i <= cap; i++) {
      const a = (i / cap) * Math.PI * 0.5;
      pts.push(new V2(Math.cos(a) * r0, Math.sin(a) * r0));
    }
    return new THREE.LatheGeometry(pts, seg);
  });
}

/** Spline profile (radius, y) turned into a smooth solid, scaled to an oval section. */
function profileGeo(key: string, prof: Array<[number, number]>, seg: number, sx: number, sz: number, samples = 28): THREE.BufferGeometry {
  return geo(key, () => {
    const curve = new THREE.SplineCurve(prof.map(([r, y]) => new V2(r, y)));
    const pts = curve.getPoints(samples).map((p) => new V2(Math.max(0.0005, p.x), p.y));
    const g = new THREE.LatheGeometry(pts, seg);
    g.applyMatrix4(new THREE.Matrix4().makeScale(sx, 1, sz));
    return g;
  });
}

/** Weld seams, recompute normals and add a dummy uv so the result merges with everything else. */
function smoothed(g: THREE.BufferGeometry): THREE.BufferGeometry {
  g.deleteAttribute('normal');
  g.deleteAttribute('uv');
  const w = mergeVertices(g, 1e-4);
  w.computeVertexNormals();
  w.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(w.getAttribute('position').count * 2), 2));
  return w;
}

/** A believable skull: squashed sphere, narrower jaw, forward chin. */
function headGeo(rx: number, ry: number, rz: number, fem: boolean): THREE.BufferGeometry {
  return geo(`head${rx}:${ry}:${rz}:${fem}`, () => {
    const g = new THREE.SphereGeometry(1, 36, 28);
    const p = g.getAttribute('position');
    for (let i = 0; i < p.count; i++) {
      let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      if (y < 0) {
        const d = -y;
        x *= 1 - (fem ? 0.36 : 0.28) * Math.pow(d, 1.5);
        z *= 1 + 0.05 * d - (z < 0 ? 0.1 * d : 0);
        y *= 1 + 0.07 * d;
      } else {
        // slightly flatter crown, fuller back of skull
        y *= 1 - 0.05 * y;
        if (z < 0) z *= 1.04;
      }
      p.setXYZ(i, x * rx, y * ry, z * rz);
    }
    return smoothed(g);
  });
}

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();
type V3 = [number, number, number];
function bake(g: THREE.BufferGeometry, p: V3 = [0, 0, 0], r: V3 = [0, 0, 0], s: V3 = [1, 1, 1]): THREE.BufferGeometry {
  _e.set(r[0], r[1], r[2]);
  _q.setFromEuler(_e);
  _m.compose(_p.set(p[0], p[1], p[2]), _q, _s.set(s[0], s[1], s[2]));
  const c = g.index ? g.toNonIndexed() : g.clone();
  return c.applyMatrix4(_m);
}

/* ------------------------------------------------------------------ figure */

const SEAT = 0, TORSO = 1, HEAD = 2, LSX = 3, LSZ = 4, LEX = 5, RSX = 6, RSZ = 7, REX = 8, AMP = 9, WALK = 10, SPEAK = 11,
  LAUGH = 12, SLEEP = 13, DANCE = 14, COOK = 15, EAT = 16, EXER = 17, GL = 18, GR = 19, POINT = 20, SMILE = 21, BROW = 22,
  ROLL = 23, WRX = 24, NP = 25;
export const BASE_SCALE = 0.93;
/** Height of the top of a chair seat that seated figures line up with. */
export const SEAT_HEIGHT = 0.43;

interface HandRig {
  g: THREE.Group;
  fingers: THREE.Object3D | null;
  index: THREE.Object3D | null;
  thumb: THREE.Object3D | null;
}

export class Figure {
  readonly group = new THREE.Group();
  readonly look: FigureLook;
  pose: Pose = 'idle';
  seated = false;
  walkRate = 1;

  private readonly P = new Float32Array(NP);
  private readonly T = new Float32Array(NP);
  private readonly phase: number;
  private readonly variant: number;
  private walkPh = 0;
  private exPh = 0;
  private yaw = 0;
  private pitch = 0;
  private dartX = 0;
  private dartY = 0;
  private target: THREE.Vector3 | null = null;
  private readonly tmp = new THREE.Vector3();

  private rig = new THREE.Group();
  private hips = new THREE.Group();
  private spine = new THREE.Group();
  private neck = new THREE.Group();
  private head = new THREE.Group();
  private armL = { sh: new THREE.Group(), el: new THREE.Group() };
  private armR = { sh: new THREE.Group(), el: new THREE.Group() };
  private legL = { hip: new THREE.Group(), knee: new THREE.Group(), ankle: new THREE.Group() };
  private legR = { hip: new THREE.Group(), knee: new THREE.Group(), ankle: new THREE.Group() };
  private handL: HandRig = { g: new THREE.Group(), fingers: null, index: null, thumb: null };
  private handR: HandRig = { g: new THREE.Group(), fingers: null, index: null, thumb: null };
  private eyeBalls: THREE.Group | null = null;
  private lids: THREE.Group | null = null;
  private liteEyes: THREE.Mesh | null = null;
  private browL: THREE.Mesh | null = null;
  private browR: THREE.Mesh | null = null;
  private mouthArc: THREE.Mesh | null = null;
  private lowerLip: THREE.Mesh | null = null;
  private cavity: THREE.Mesh | null = null;
  private teeth: THREE.Mesh | null = null;
  private tail: THREE.Group | null = null;
  private phone: THREE.Group | null = null;
  private spoon: THREE.Group | null = null;
  private suitcase: THREE.Group | null = null;
  private skirt: THREE.Mesh | null = null;
  private blob: THREE.Mesh | null = null;
  private readonly owned: THREE.BufferGeometry[] = [];
  private readonly parts = new Map<THREE.Object3D, Map<THREE.Material, THREE.BufferGeometry[]>>();
  private readonly baseScale: number;
  private readonly fem: boolean;
  private mouthY = 0;
  private faceZ = 0.1;
  private hc = 0.12;
  private tailPrev = 0;
  private tailV = 0;

  constructor(look: FigureLook, readonly lite = false) {
    this.look = look;
    this.phase = hash(look.skin + look.hair + look.top + look.bottom) * 20;
    this.variant = hash(look.top + look.shoes + look.hair);
    this.fem = look.fem ?? (look.hairStyle === 'long' || look.hairStyle === 'ponytail' || look.hairStyle === 'bun');
    this.baseScale = BASE_SCALE * look.height;
    this.group.scale.setScalar(this.baseScale);
    this.build();
    this.setPose('idle');
    for (let i = 0; i < NP; i++) this.P[i] = this.T[i];
    this.update(0.016, 0);
  }

  /** Queue geometry for merging into one mesh per (bone, material). */
  private add(bone: THREE.Object3D, mat: THREE.Material, g: THREE.BufferGeometry, p?: V3, r?: V3, s?: V3): void {
    let byMat = this.parts.get(bone);
    if (!byMat) { byMat = new Map(); this.parts.set(bone, byMat); }
    let list = byMat.get(mat);
    if (!list) { list = []; byMat.set(mat, list); }
    list.push(bake(g, p, r, s));
  }
  private flush(): void {
    for (const [bone, byMat] of this.parts) {
      for (const [mat, list] of byMat) {
        const g = list.length === 1 ? list[0] : mergeGeometries(list, false);
        if (!g) continue;
        if (list.length > 1) for (const l of list) l.dispose();
        this.owned.push(g);
        const me = new THREE.Mesh(g, mat);
        me.castShadow = true;
        bone.add(me);
      }
    }
    this.parts.clear();
  }
  /** A single dynamic mesh (animated on its own). */
  private mesh(g: THREE.BufferGeometry, mat: THREE.Material, parent: THREE.Object3D, p?: V3, r?: V3, s?: V3, shadow = false): THREE.Mesh {
    const me = new THREE.Mesh(g, mat);
    if (p) me.position.set(p[0], p[1], p[2]);
    if (r) me.rotation.set(r[0], r[1], r[2]);
    if (s) me.scale.set(s[0], s[1], s[2]);
    me.castShadow = shadow;
    parent.add(me);
    return me;
  }

  private build(): void {
    const L = this.look;
    const lite = this.lite;
    const fem = this.fem;
    const seg = lite ? 10 : 16;
    const w = (L.build === 'slim' ? 0.9 : L.build === 'broad' ? 1.14 : 1) * (fem ? 0.95 : 1);
    const limb = L.build === 'slim' ? 0.92 : L.build === 'broad' ? 1.12 : 1;
    const uni = L.uniform;
    const outer = L.outer ?? 'none';
    const isCoat = uni === 'doctor';
    const jacket = outer === 'jacket' || uni === 'suit' || uni === 'officer' || isCoat;
    const hoodie = outer === 'hoodie';
    const topCol = isCoat ? '#f1f4f6' : L.top;
    const skinM = skinMat(L.skin);
    const hairM = hairMat(L.hair);
    const topM = clothMat(topCol, hoodie ? 'knit' : 'weave');
    const topDark = clothMat(shade(topCol, -0.07), hoodie ? 'knit' : 'weave');
    const topLight = clothMat(shade(topCol, 0.08));
    const col = new THREE.Color(L.bottom);
    const denim = col.b > col.r + 0.04 && uni === undefined && L.bottom !== L.top;
    const bottomM = clothMat(L.bottom, denim ? 'denim' : 'weave', denim ? 0.8 : 0.86);
    const bottomDark = clothMat(shade(L.bottom, -0.06), denim ? 'denim' : 'weave');
    const soleLight = L.shoes === '#f0f0f0' || L.shoes === '#f2f2f2' || L.shoes === '#f4f4f4' || L.shoes === '#e8e8e8' || L.shoes === '#d8d2c6';
    const shoeM = stdMat(L.shoes, { rough: 0.55 });
    const soleM = stdMat(soleLight ? '#ffffff' : '#14161a', { rough: 0.7 });
    const longSleeve = isCoat || uni === 'officer' || uni === 'suit' || outer !== 'none' || hash(L.top) > 0.5;
    const tS = hoodie ? 1.08 : jacket ? 1.05 : 1;

    this.group.add(this.rig);
    this.rig.add(this.hips);
    this.hips.position.y = 0.94;
    // soft contact blob lives on the root
    this.blob = this.mesh(blobGeo(), blobShadowMaterial(), this.group, [0, 0.012, 0], undefined, [1.15 / this.baseScale, 1, 1.15 / this.baseScale]);
    this.blob.renderOrder = 1;

    // ---- pelvis + trousers hips
    this.add(this.hips, bottomM, hiSphere(), [0, 0.0, 0], [0, 0, 0], [0.168 * w * (fem ? 1.05 : 1), 0.115, 0.118]);
    if (uni === 'officer' || uni === 'suit' || (jacket && !lite)) {
      const beltM = stdMat('#1a1512', { rough: 0.5 });
      this.add(this.hips, beltM, new THREE.TorusGeometry(1, 0.1, 6, 20), [0, 0.085, 0], [Math.PI / 2, 0, 0], [0.16 * w, 0.115, 0.1]);
      this.add(this.hips, stdMat('#c9b07a', { metal: 0.8, rough: 0.3 }), rbox(0.04, 0.035, 0.01, 0.006), [0, 0.085, 0.118]);
    }

    // ---- spine / torso
    this.hips.add(this.spine);
    this.spine.position.y = 0.06;
    const prof: Array<[number, number]> = [
      [0.0, -0.08], [0.135, -0.07], [0.152, 0.0], [fem ? 0.122 : 0.133, 0.14], [fem ? 0.124 : 0.136, 0.26],
      [0.15, 0.37], [0.162, 0.455], [0.158, 0.505], [0.12, 0.55], [0.062, 0.578], [0.0, 0.59],
    ];
    const zs = 0.68;
    const torsoG = profileGeo(`torso${w}:${tS}:${fem}:${seg}`, prof, seg + 4, w * tS, zs * tS);
    this.add(this.spine, topM, torsoG);
    const rAt = (y: number): number => {
      for (let i = 1; i < prof.length; i++) {
        if (y <= prof[i][1]) {
          const t = (y - prof[i - 1][1]) / (prof[i][1] - prof[i - 1][1]);
          return lerp(prof[i - 1][0], prof[i][0], t);
        }
      }
      return 0.05;
    };
    const frontZ = (y: number): number => rAt(y) * zs * tS;
    const halfX = (y: number): number => rAt(y) * w * tS;
    // hem
    if (hoodie || jacket) {
      this.add(this.spine, topDark, new THREE.TorusGeometry(1, 0.1, 6, 22), [0, -0.035, 0], [Math.PI / 2, 0, 0], [0.147 * w * tS, 0.1 * zs * tS * 1.55, 0.04]);
    }
    // neck
    this.spine.add(this.neck);
    this.neck.position.y = 0.555;
    this.add(this.neck, skinM, profileGeo(`neck${seg}`, [[0.0, -0.06], [0.049, -0.05], [0.046, 0.03], [0.044, 0.12], [0.0, 0.135]], seg, 1, 0.95, 8));

    // ---- outfit details
    if (!lite) {
      if (hoodie) {
        // hood bunched behind the neck, kangaroo pocket, drawstrings
        this.add(this.spine, topM, hiSphere(), [0, 0.57, -0.055], [0.25, 0, 0], [0.1 * w, 0.06, 0.085]);
        this.add(this.spine, topDark, new THREE.TorusGeometry(1, 0.2, 8, 22, Math.PI * 1.3), [0, 0.585, 0.0], [Math.PI / 2 - 0.2, 0, Math.PI * 0.85], [0.075, 0.075, 0.06]);
        this.add(this.spine, topDark, rbox(0.2 * w, 0.1, 0.04, 0.02), [0, 0.12, frontZ(0.12) + 0.008], [0.1, 0, 0]);
        this.add(this.spine, topM, new THREE.CylinderGeometry(0.006, 0.006, 0.12, 6), [-0.03, 0.5, frontZ(0.5) + 0.012], [0, 0, 0.04]);
        this.add(this.spine, topM, new THREE.CylinderGeometry(0.006, 0.006, 0.12, 6), [0.03, 0.5, frontZ(0.5) + 0.012], [0, 0, -0.04]);
      } else if (uni === 'suit' || uni === 'officer' || outer === 'jacket') {
        const shirt = uni === 'officer' ? '#e6e9ef' : '#f4f3f0';
        const shirtM = clothMat(shirt);
        this.add(this.spine, shirtM, rbox(0.1 * w, 0.28, 0.02, 0.008), [0, 0.42, frontZ(0.42) - 0.006], [-0.03, 0, 0]);
        const lapM = clothMat(shade(topCol, 0.05));
        for (const s of [-1, 1]) {
          this.add(this.spine, lapM, rbox(0.052, 0.3, 0.022, 0.01), [s * 0.07 * w, 0.405, frontZ(0.4) + 0.006], [-0.03, s * 0.12, -s * 0.24]);
          this.add(this.spine, lapM, rbox(0.06, 0.05, 0.026, 0.012), [s * 0.085, 0.55, frontZ(0.55) - 0.004], [-0.1, s * 0.3, -s * 0.5]);
        }
        if (uni === 'suit' || uni === 'officer') {
          const tieM = clothMat(uni === 'officer' ? '#1a1f2e' : '#8a2f3f');
          this.add(this.spine, tieM, rbox(0.032, 0.2, 0.012, 0.005), [0, 0.37, frontZ(0.4) + 0.008], [-0.03, 0, 0]);
          this.add(this.spine, tieM, rbox(0.04, 0.035, 0.016, 0.006), [0, 0.5, frontZ(0.5) + 0.004]);
        } else {
          // zipper line + pocket flaps for the casual jacket
          this.add(this.spine, stdMat('#aeb4bd', { metal: 0.8, rough: 0.3 }), rbox(0.008, 0.46, 0.008, 0.003), [0, 0.28, frontZ(0.3) + 0.008]);
          this.add(this.spine, topDark, rbox(0.06, 0.04, 0.014, 0.006), [-0.09 * w, 0.1, frontZ(0.1) + 0.005], [0.05, 0, 0]);
          this.add(this.spine, topDark, rbox(0.06, 0.04, 0.014, 0.006), [0.09 * w, 0.1, frontZ(0.1) + 0.005], [0.05, 0, 0]);
        }
        for (let i = 0; i < 2 && uni !== undefined; i++) this.add(this.spine, stdMat('#2a2420', { rough: 0.4 }), unitSphere(), [0.02, 0.14 + i * 0.075, frontZ(0.2) + 0.007], [0, 0, 0], [0.01, 0.01, 0.006]);
      } else if (isCoat) {
        const coatLap = clothMat('#e6ebef');
        for (const s of [-1, 1]) this.add(this.spine, coatLap, rbox(0.05, 0.34, 0.02, 0.008), [s * 0.065 * w, 0.4, frontZ(0.4) + 0.006], [-0.03, s * 0.1, -s * 0.22]);
        this.add(this.spine, clothMat(L.top), rbox(0.1, 0.3, 0.012, 0.006), [0, 0.42, frontZ(0.42) - 0.004], [-0.02, 0, 0]);
      } else {
        // round collar band
        this.add(this.spine, clothMat(shade(topCol, 0.06)), new THREE.TorusGeometry(1, 0.17, 8, 20), [0, 0.568, 0.004], [Math.PI / 2 - 0.12, 0, 0], [0.068, 0.068, 0.06]);
      }
    }
    if (isCoat) {
      const coatM = clothMat('#f1f4f6');
      this.skirt = this.mesh(profileGeo(`coat${w}:${seg}`, [[0.0, 0.0], [0.17, -0.0], [0.19, -0.2], [0.2, -0.46], [0.19, -0.6], [0.0, -0.61]], seg + 4, w, 0.74), coatM, this.hips, [0, 0.0, 0], undefined, undefined, true);
      if (!lite) {
        const sm = stdMat('#2b2f36', { metal: 0.4, rough: 0.4 });
        this.add(this.neck, sm, new THREE.TorusGeometry(1, 0.22, 8, 18), [0, -0.03, 0.01], [Math.PI / 2 - 0.45, 0, 0], [0.085, 0.085, 0.085]);
        this.add(this.spine, stdMat('#9aa3ad', { metal: 0.7, rough: 0.3 }), new THREE.CylinderGeometry(0.022, 0.022, 0.012, 12), [0.07, 0.3, frontZ(0.3) + 0.012], [Math.PI / 2, 0, 0]);
        this.add(this.spine, sm, new THREE.TorusGeometry(1, 0.1, 6, 14, Math.PI), [0.035, 0.34, frontZ(0.34) + 0.01], [0, 0, Math.PI], [0.034, 0.12, 0.02]);
      }
    }
    if (uni === 'nurse' && !lite) {
      this.add(this.spine, skinM, rbox(0.06, 0.07, 0.02, 0.008), [0, 0.54, frontZ(0.54) - 0.002], [-0.2, 0, 0]);
      this.add(this.spine, topDark, rbox(0.06, 0.07, 0.014, 0.006), [0, 0.57, frontZ(0.57) - 0.012], [-0.4, 0, 0], [1.2, 1, 1]);
    }
    if (uni === 'officer') {
      const gold = stdMat('#e5b53a', { metal: 0.6, rough: 0.35 });
      this.add(this.spine, gold, hiSphere(), [0.1 * w, 0.4, frontZ(0.4) + 0.012], [0, 0, 0.2], [0.03, 0.036, 0.01]);
      if (!lite) for (const s of [-1, 1]) this.add(this.spine, gold, rbox(0.07, 0.014, 0.09, 0.006), [s * halfX(0.5) * 0.9, 0.53, 0], [0, 0, -s * 0.2]);
    }
    if (L.accessory === 'badge' && uni !== 'officer') {
      this.add(this.spine, stdMat('#d6a43a', { metal: 0.5, rough: 0.4 }), rbox(0.06, 0.07, 0.012, 0.005), [0.1 * w, 0.4, frontZ(0.4) + 0.008]);
    }
    if (L.accessory === 'lanyard') {
      const lan = clothMat('#c9473e');
      for (const s of [-1, 1]) this.add(this.spine, lan, rbox(0.014, 0.28, 0.008, 0.003), [s * 0.05, 0.43, frontZ(0.43) + 0.012], [-0.03, 0, s * 0.18]);
      this.add(this.spine, stdMat('#f8f8f8', { rough: 0.5 }), rbox(0.07, 0.095, 0.01, 0.004), [0, 0.28, frontZ(0.28) + 0.012]);
      this.add(this.spine, stdMat('#4a6fd6', { rough: 0.5 }), rbox(0.05, 0.02, 0.012, 0.003), [0, 0.3, frontZ(0.3) + 0.014]);
    }
    if (L.accessory === 'backpack') {
      const bp = clothMat(shade(L.top, -0.2));
      const bp2 = clothMat(shade(L.top, -0.3));
      this.add(this.spine, bp, rbox(0.3 * w, 0.4, 0.15, 0.05), [0, 0.28, -0.2]);
      this.add(this.spine, bp2, rbox(0.22 * w, 0.17, 0.05, 0.02), [0, 0.15, -0.3]);
      this.add(this.spine, stdMat('#c8ccd2', { metal: 0.6, rough: 0.35 }), rbox(0.1, 0.014, 0.012, 0.004), [0, 0.43, -0.285]);
      if (!lite) for (const s of [-1, 1]) {
        this.add(this.spine, bp2, rbox(0.045, 0.34, 0.02, 0.008), [s * 0.1 * w, 0.31, frontZ(0.3) * 0.5 - 0.02], [0, 0, 0]);
        this.add(this.spine, bp2, rbox(0.045, 0.02, 0.2, 0.008), [s * 0.1 * w, 0.49, -0.1], [0.0, 0, 0]);
      }
    }

    // ---- head
    this.neck.add(this.head);
    this.head.position.y = 0.085;
    this.head.scale.setScalar(1.13);
    const hc = 0.122;
    this.hc = hc;
    const rx = 0.106, ry = 0.128, rz = 0.114;
    this.add(this.head, skinM, headGeo(rx, ry, rz, fem), [0, hc, 0]);
    const faceZAt = (y: number): number => {
      const d = y / ry;
      return rz * Math.sqrt(Math.max(0.01, 1 - d * d)) * (1 + (d < 0 ? 0.05 * -d : 0));
    };
    this.faceZ = faceZAt(0);
    const eyeY = hc + 0.012;
    // ears
    if (!lite) {
      for (const s of [-1, 1]) this.add(this.head, skinM, hiSphere(), [s * (rx * 0.97), hc - 0.004, -0.008], [0, s * 0.3, 0], [0.012, 0.028, 0.02]);
    }
    // nose
    const noseY = hc - 0.022;
    this.add(this.head, skinM, hiSphere(), [0, noseY, faceZAt(-0.022) + 0.006], [0.35, 0, 0], [0.013, 0.018, 0.016]);
    if (!lite) this.add(this.head, skinM, hiSphere(), [0, noseY + 0.022, faceZAt(0.0) - 0.002], [0.1, 0, 0], [0.008, 0.018, 0.01]);

    // eyes
    const irisCol = ['#4a2e1c', '#3b2416', '#5a3a1e', '#2b2a35', '#3d4a3a'][Math.floor(hash(L.skin + L.hair) * 5)];
    const eyeR = lite ? 0.022 : 0.028;
    const ex = 0.047;
    const ez = faceZAt(0.012) - 0.026;
    if (lite) {
      const ge = bake(hiSphere(), [-ex, eyeY, ez + 0.012], [0, 0, 0], [0.016, 0.019, 0.012]);
      const ge2 = bake(hiSphere(), [ex, eyeY, ez + 0.012], [0, 0, 0], [0.016, 0.019, 0.012]);
      const mg = mergeGeometries([ge, ge2], false);
      ge.dispose(); ge2.dispose();
      if (mg) {
        this.owned.push(mg);
        // pivot for blinking: use a group at the eye line so scale.y squashes about it
        const pivot = new THREE.Group();
        pivot.position.set(0, eyeY, 0);
        mg.translate(0, -eyeY, 0);
        this.head.add(pivot);
        this.liteEyes = this.mesh(mg, stdMat('#1a1210', { rough: 0.3 }), pivot);
      }
    } else {
      this.eyeBalls = new THREE.Group();
      this.eyeBalls.position.set(0, eyeY, ez);
      this.head.add(this.eyeBalls);
      this.lids = new THREE.Group();
      this.lids.position.set(0, eyeY, ez);
      this.head.add(this.lids);
      const irisG = geo('irisCap', () => {
        const g = new THREE.SphereGeometry(eyeR * 1.012, 20, 8, 0, Math.PI * 2, 0, 0.82);
        g.rotateX(Math.PI / 2);
        return g;
      });
      const lidG = geo('lidDome', () => new THREE.SphereGeometry(eyeR * 1.1, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2));
      const scl: THREE.BufferGeometry[] = [];
      const iri: THREE.BufferGeometry[] = [];
      const lid: THREE.BufferGeometry[] = [];
      const gl: THREE.BufferGeometry[] = [];
      for (const s of [-1, 1]) {
        scl.push(bake(hiSphere(), [s * ex, 0, 0], [0, 0, 0], [eyeR, eyeR * 1.06, eyeR]));
        iri.push(bake(irisG, [s * ex, 0, 0], [0, 0, 0], [1, 1.06, 1]));
        lid.push(bake(lidG, [s * ex, 0, 0], [0, 0, 0], [1, 1.04, 1.02]));
        gl.push(bake(hiSphere(), [s * ex - 0.008, eyeY + 0.011, ez + eyeR * 0.98], [0, 0, 0], [0.0068, 0.0068, 0.005]));
        gl.push(bake(hiSphere(), [s * ex + 0.009, eyeY - 0.009, ez + eyeR * 0.95], [0, 0, 0], [0.0036, 0.0036, 0.003]));
      }
      const addMerged = (parts: THREE.BufferGeometry[], mat: THREE.Material, parent: THREE.Object3D): void => {
        const mg = mergeGeometries(parts, false);
        parts.forEach((p) => p.dispose());
        if (!mg) return;
        this.owned.push(mg);
        this.mesh(mg, mat, parent);
      };
      addMerged(scl, eyeWhiteM, this.eyeBalls);
      addMerged(iri, new THREE.MeshStandardMaterial({ map: irisTex(irisCol), roughness: 0.2 }), this.eyeBalls);
      addMerged(lid, skinM, this.lids);
      addMerged(gl, glintM, this.head);
      // brows
      const browM = hairMat(shade(L.hair, 0.02));
      const browG = geo(fem ? 'browF' : 'browM', () => {
        const g = new THREE.CapsuleGeometry(fem ? 0.0048 : 0.0068, 0.03, 3, 8);
        g.rotateZ(Math.PI / 2);
        return g;
      });
      const bz = faceZAt(0.06) - 0.004;
      this.browL = this.mesh(browG, browM, this.head, [ex, hc + 0.06, bz], [0, 0.4, 0.12]);
      this.browR = this.mesh(browG, browM, this.head, [-ex, hc + 0.06, bz], [0, -0.4, -0.12]);
      // blush
      const bl: THREE.BufferGeometry[] = [];
      for (const s of [-1, 1]) bl.push(bake(hiSphere(), [s * 0.066, hc - 0.04, faceZAt(-0.04) - 0.034], [0, s * 0.5, 0], [0.026, 0.017, 0.006]));
      const bm = mergeGeometries(bl, false);
      bl.forEach((p) => p.dispose());
      if (bm) { this.owned.push(bm); this.mesh(bm, blushMat(L.skin), this.head).renderOrder = 2; }
    }

    // mouth
    if (!lite) {
      const my = hc - 0.066;
      this.mouthY = my;
      const mz = faceZAt(-0.066);
      const lipCol = fem ? new THREE.Color(L.skin).lerp(new THREE.Color('#c0485a'), 0.55) : new THREE.Color(L.skin).lerp(new THREE.Color('#b0505a'), 0.42);
      const lipM = new THREE.MeshStandardMaterial({ color: lipCol, roughness: 0.4 });
      const arcG = geo('mouthArc', () => {
        const a = Math.PI * 0.62;
        const g = new THREE.TorusGeometry(1, 0.15, 6, 20, a);
        g.rotateZ(-Math.PI / 2 - a / 2);
        return g;
      });
      this.mouthArc = this.mesh(arcG, lipM, this.head, [0, my + 0.016, mz - 0.002], undefined, [0.026, 0.026, 0.045]);
      this.cavity = this.mesh(hiSphere(), stdMat('#3a0f14', { rough: 0.6 }), this.head, [0, my - 0.001, mz - 0.01], undefined, [0.02, 0.001, 0.01]);
      this.teeth = this.mesh(hiSphere(), stdMat('#f2efe8', { rough: 0.3 }), this.head, [0, my + 0.002, mz - 0.006], undefined, [0.017, 0.001, 0.008]);
      this.lowerLip = this.mesh(hiSphere(), lipM, this.head, [0, my - 0.006, mz - 0.004], undefined, [0.017, 0.0065, 0.009]);
    }

    // ---- hair
    this.buildHair(hc, rx, ry, rz, hairM, lite, fem);

    // ---- head accessories
    if (L.accessory === 'glasses' && !lite) {
      const gm = stdMat('#22262c', { rough: 0.35, metal: 0.3 });
      for (const s of [-1, 1]) {
        this.add(this.head, gm, new THREE.TorusGeometry(1, 0.08, 8, 22), [s * ex, eyeY, faceZAt(0.012) + 0.012], [0, 0, 0], [0.034, 0.03, 0.03]);
        this.add(this.head, gm, new THREE.CylinderGeometry(0.0028, 0.0028, 0.1, 6), [s * (ex + 0.036), eyeY + 0.002, faceZAt(0.012) - 0.04], [Math.PI / 2, 0, 0]);
      }
      this.add(this.head, gm, new THREE.CylinderGeometry(0.0028, 0.0028, 0.018, 6), [0, eyeY + 0.006, faceZAt(0.012) + 0.012], [0, 0, Math.PI / 2]);
    }
    if (L.accessory === 'headphones') {
      const hm = stdMat('#2a2d34', { rough: 0.45 });
      const pad = stdMat('#3a3f48', { rough: 0.8 });
      this.add(this.head, hm, new THREE.TorusGeometry(1, 0.045, 8, 28, Math.PI), [0, hc + 0.01, 0], [0, 0, 0], [rx * 1.14, ry * 1.1, rz * 1.1]);
      for (const s of [-1, 1]) {
        this.add(this.head, hm, new THREE.CylinderGeometry(0.042, 0.042, 0.03, 16), [s * (rx * 1.1), hc - 0.01, 0], [0, 0, Math.PI / 2]);
        this.add(this.head, pad, new THREE.CylinderGeometry(0.034, 0.034, 0.012, 14), [s * (rx * 1.02), hc - 0.01, 0], [0, 0, Math.PI / 2]);
      }
    }
    if (L.accessory === 'scarf') {
      const sm = clothMat('#d9632e', 'knit');
      this.add(this.neck, sm, new THREE.TorusGeometry(1, 0.34, 10, 22), [0, -0.005, 0.0], [Math.PI / 2, 0, 0], [0.075, 0.075, 0.075]);
      this.add(this.neck, sm, rbox(0.06, 0.2, 0.026, 0.01), [0.04, -0.12, 0.08], [0.1, 0, 0.1]);
    }

    // ---- arms
    const shoulderX = 0.152 * w * tS + 0.034;
    const armBuild = (arm: { sh: THREE.Group; el: THREE.Group }, hand: HandRig, side: number): void => {
      this.spine.add(arm.sh);
      arm.sh.position.set(side * shoulderX, 0.47, 0);
      const ua = 0.28, fa = 0.25;
      const r0 = 0.058 * limb, r1 = 0.046 * limb, r2 = 0.036 * limb;
      // shoulder cap + upper arm
      this.add(arm.sh, topM, hiSphere(), [0, 0, 0], [0, 0, 0], [r0 * 1.12, r0 * 1.12, r0 * 1.12]);
      if (longSleeve || !isCoat) {
        if (longSleeve) {
          this.add(arm.sh, topM, limbGeo(r0, r1, ua, seg, 0.003));
        } else {
          // short sleeve over a skin arm
          this.add(arm.sh, skinM, limbGeo(r0 * 0.95, r1, ua, seg));
          this.add(arm.sh, topM, limbGeo(r0 * 1.12, r0 * 1.0, 0.13, seg));
          this.add(arm.sh, topDark, new THREE.TorusGeometry(1, 0.14, 6, seg), [0, -0.135, 0], [Math.PI / 2, 0, 0], [r0 * 1.0, r0 * 1.0, r0 * 1.0]);
        }
      }
      arm.sh.add(arm.el);
      arm.el.position.y = -ua;
      this.add(arm.el, longSleeve ? topM : skinM, hiSphere(), [0, 0, 0], [0, 0, 0], [r1 * 0.98, r1 * 0.98, r1 * 0.98]);
      this.add(arm.el, longSleeve ? topM : skinM, limbGeo(r1, r2, fa, seg));
      if (longSleeve && !lite) {
        const cuffM = uni === 'suit' || uni === 'officer' || outer === 'jacket' ? clothMat('#f1efec') : hoodie ? topDark : topLight;
        this.add(arm.el, cuffM, new THREE.TorusGeometry(1, 0.2, 6, seg), [0, -fa + 0.015, 0], [Math.PI / 2, 0, 0], [r2 * 1.12, r2 * 1.12, r2 * 1.12]);
      }
      // hand
      arm.el.add(hand.g);
      hand.g.position.y = -fa - 0.01;
      this.buildHand(hand, side, skinM, lite);
    };
    armBuild(this.armL, this.handL, 1);
    armBuild(this.armR, this.handR, -1);

    // ---- legs
    const legBuild = (leg: { hip: THREE.Group; knee: THREE.Group; ankle: THREE.Group }, side: number): void => {
      this.hips.add(leg.hip);
      leg.hip.position.set(side * 0.085 * w, -0.03, 0);
      const th = 0.44, sh = 0.41;
      this.add(leg.hip, bottomM, limbGeo(0.094 * limb, 0.068 * limb, th, seg, 0.004));
      leg.hip.add(leg.knee);
      leg.knee.position.y = -th;
      this.add(leg.knee, bottomM, hiSphere(), [0, 0, 0], [0, 0, 0], [0.069 * limb, 0.069 * limb, 0.069 * limb]);
      this.add(leg.knee, bottomM, limbGeo(0.068 * limb, 0.046 * limb, sh, seg, 0.004));
      this.add(leg.knee, bottomDark, new THREE.TorusGeometry(1, 0.16, 6, seg), [0, -sh + 0.012, 0], [Math.PI / 2, 0, 0], [0.05 * limb, 0.05 * limb, 0.05 * limb]);
      leg.knee.add(leg.ankle);
      leg.ankle.position.y = -sh - 0.005;
      // shoe: oblong toe box, heel, rubber sole, laces hint
      this.add(leg.ankle, shoeM, hiSphere(), [0, -0.012, 0.055], [0.0, 0, 0], [0.05, 0.04, 0.12]);
      this.add(leg.ankle, shoeM, hiSphere(), [0, 0.0, -0.01], [0, 0, 0], [0.048, 0.05, 0.062]);
      this.add(leg.ankle, soleM, rbox(0.1, 0.026, 0.27, 0.012), [0, -0.05, 0.055]);
      if (!lite) {
        for (let i = 0; i < 3; i++) this.add(leg.ankle, soleLight ? soleM : stdMat(shade(L.shoes, 0.12), { rough: 0.6 }), new THREE.CylinderGeometry(0.0045, 0.0045, 0.05, 6), [0, 0.016 - i * 0.002, 0.04 + i * 0.026], [0.0, 0, Math.PI / 2], [1, 1, 1]);
      }
    };
    legBuild(this.legL, 1);
    legBuild(this.legR, -1);

    // ---- props
    this.phone = new THREE.Group();
    this.handR.g.add(this.phone);
    this.phone.position.set(-0.03, -0.075, 0.035);
    this.phone.rotation.set(-0.3, 0, -Math.PI / 2 * 0.0);
    this.add(this.phone, stdMat('#15171c', { rough: 0.3 }), rbox(0.012, 0.15, 0.075, 0.006));
    this.add(this.phone, stdMat('#9fe3ff', { emissive: '#7fd8ff', ei: 1.5, rough: 0.2 }), rbox(0.003, 0.138, 0.066, 0.002), [-0.0066, 0, 0]);
    this.phone.visible = false;

    this.spoon = new THREE.Group();
    this.handR.g.add(this.spoon);
    this.spoon.position.set(-0.02, -0.07, 0.02);
    this.spoon.rotation.set(-1.0, 0, 0.0);
    this.add(this.spoon, stdMat('#8a5a34', { rough: 0.6 }), new THREE.CylinderGeometry(0.007, 0.01, 0.2, 8), [0, -0.05, 0]);
    this.add(this.spoon, stdMat('#8a5a34', { rough: 0.6 }), hiSphere(), [0, -0.17, 0], [0, 0, 0], [0.026, 0.035, 0.012]);
    this.spoon.visible = false;

    if (L.accessory === 'suitcase') {
      const sc = new THREE.Group();
      const sm = stdMat('#c9473e', { rough: 0.4 });
      this.add(sc, sm, rbox(0.38, 0.56, 0.22, 0.05), [0, 0.32, 0]);
      this.add(sc, stdMat('#9d3730', { rough: 0.5 }), rbox(0.3, 0.46, 0.012, 0.01), [0, 0.32, 0.112]);
      this.add(sc, stdMat('#1f2228', { rough: 0.5 }), rbox(0.12, 0.03, 0.04, 0.012), [0, 0.62, 0]);
      for (const sx of [-0.14, 0.14]) this.add(sc, stdMat('#1f2228', { rough: 0.6 }), new THREE.CylinderGeometry(0.03, 0.03, 0.025, 12), [sx, 0.03, 0.07], [0, 0, Math.PI / 2]);
      this.flushTo(sc);
      this.suitcase = sc;
    }
    this.flush();
  }

  private flushTo(root: THREE.Object3D): void {
    const byMat = this.parts.get(root);
    if (!byMat) return;
    for (const [mat, list] of byMat) {
      const g = list.length === 1 ? list[0] : mergeGeometries(list, false);
      if (!g) continue;
      this.owned.push(g);
      const me = new THREE.Mesh(g, mat);
      me.castShadow = true;
      root.add(me);
    }
    this.parts.delete(root);
  }

  private buildHand(h: HandRig, side: number, skinM: THREE.Material, lite: boolean): void {
    const inw = -side;
    if (lite) {
      this.add(h.g, skinM, hiSphere(), [0, -0.04, 0], [0, 0, 0], [0.034, 0.05, 0.034]);
      return;
    }
    // palm
    this.add(h.g, skinM, rbox(0.032, 0.07, 0.074, 0.014), [0, -0.035, 0]);
    this.add(h.g, skinM, hiSphere(), [0, 0.0, 0], [0, 0, 0], [0.026, 0.028, 0.03]);
    // three fingers as one curling slab, with finger separation grooves baked in as three capsules
    const fg = new THREE.Group();
    fg.position.set(0, -0.072, 0);
    h.g.add(fg);
    h.fingers = fg;
    for (let i = 0; i < 3; i++) {
      const z = 0.004 - i * 0.0185;
      const len = 0.052 - i * 0.003;
      this.add(fg, skinM, geo(`fing${len}`, () => {
        const g = new THREE.CapsuleGeometry(0.0095, len - 0.019, 3, 8);
        g.translate(0, -len / 2, 0);
        return g;
      }), [0, 0, z]);
    }
    this.flushTo(fg);
    const ig = new THREE.Group();
    ig.position.set(0, -0.072, 0.0275);
    h.g.add(ig);
    h.index = ig;
    this.add(ig, skinM, geo('findex', () => {
      const g = new THREE.CapsuleGeometry(0.0095, 0.045, 3, 8);
      g.translate(0, -0.027, 0);
      return g;
    }));
    this.flushTo(ig);
    const tg = new THREE.Group();
    tg.position.set(inw * 0.008, -0.022, 0.034);
    tg.rotation.set(-0.5, 0, 0);
    h.g.add(tg);
    h.thumb = tg;
    this.add(tg, skinM, geo('fthumb', () => {
      const g = new THREE.CapsuleGeometry(0.0115, 0.032, 3, 8);
      g.translate(0, -0.026, 0);
      return g;
    }));
    this.flushTo(tg);
  }

  private buildHair(hc: number, rx: number, ry: number, rz: number, hairM: THREE.Material, lite: boolean, fem: boolean): void {
    const hs = this.look.hairStyle;
    const H = this.head;
    const capG = (theta: number, seg: number): THREE.BufferGeometry => geo(`hcap${theta}:${seg}`, () => new THREE.SphereGeometry(1, seg, 16, 0, Math.PI * 2, 0, theta));
    const sx = rx * 1.07, sy = ry * 1.07, sz = rz * 1.09;
    const seg = lite ? 14 : 26;
    const cap = (theta: number, tilt: number, k = 1): void => {
      this.add(H, hairM, capG(theta, seg), [0, hc + 0.004, -0.004], [-tilt, 0, 0], [sx * k, sy * k, sz * k]);
    };
    if (hs === 'short') {
      cap(Math.PI * 0.47, 0.55);
      this.add(H, hairM, hiSphere(), [0, hc + ry * 0.93, 0.045], [0.4, 0, 0], [0.075, 0.032, 0.058]);
      if (!lite) for (const s of [-1, 1]) this.add(H, hairM, hiSphere(), [s * rx * 0.99, hc + 0.015, 0.0], [0, 0, 0], [0.012, 0.045, 0.045]);
    } else if (hs === 'long') {
      cap(Math.PI * 0.5, 0.5);
      this.add(H, hairM, geo('longBack', () => profileGeo('longBackP', [[0.0, 0.0], [0.115, 0.0], [0.125, -0.12], [0.115, -0.26], [0.09, -0.36], [0.0, -0.39]], 18, 1, 0.55)), [0, hc - 0.02, -0.055], [0.08, 0, 0], [1, 1, 1]);
      this.add(H, hairM, hiSphere(), [0, hc + ry * 0.9, 0.05], [0.4, 0, 0], [0.085, 0.034, 0.06]);
      if (!lite) for (const s of [-1, 1]) {
        this.add(H, hairM, geo('lock', () => { const g = new THREE.CapsuleGeometry(0.02, 0.16, 4, 8); g.translate(0, -0.1, 0); return g; }), [s * (rx * 1.0), hc + 0.03, 0.025], [0.05, 0, -s * 0.04]);
      }
    } else if (hs === 'bun') {
      cap(Math.PI * 0.47, 0.55, 1.0);
      this.add(H, hairM, hiSphere(), [0, hc + ry * 0.93, 0.04], [0.4, 0, 0], [0.07, 0.03, 0.055]);
      this.add(H, hairM, hiSphere(), [0, hc + ry * 0.92, -0.075], [0, 0, 0], [0.056, 0.056, 0.056]);
      if (!lite) this.add(H, hairM, new THREE.TorusGeometry(1, 0.1, 6, 16), [0, hc + ry * 0.8, -0.07], [Math.PI / 2 - 0.4, 0, 0], [0.054, 0.054, 0.054]);
    } else if (hs === 'curly') {
      cap(Math.PI * 0.44, 0.5, 0.99);
      const pts: V3[] = [[-0.07, 0.1, 0.04], [0.07, 0.1, 0.04], [0, 0.135, 0.03], [0, 0.125, -0.06], [-0.1, 0.04, -0.03], [0.1, 0.04, -0.03], [0, 0.07, -0.11], [-0.075, 0.095, -0.07], [0.075, 0.095, -0.07], [-0.115, 0.0, 0.0], [0.115, 0.0, 0.0], [0, 0.145, 0.08]];
      const n = lite ? 5 : pts.length;
      for (let i = 0; i < n; i++) this.add(H, hairM, hiSphere(), [pts[i][0], hc + pts[i][1], pts[i][2]], [0, 0, 0], [0.052, 0.05, 0.052]);
    } else if (hs === 'ponytail') {
      cap(Math.PI * 0.47, 0.55);
      this.add(H, hairM, hiSphere(), [0, hc + ry * 0.93, 0.045], [0.4, 0, 0], [0.08, 0.032, 0.058]);
      const tg = new THREE.Group();
      tg.position.set(0, hc + 0.03, -0.118);
      H.add(tg);
      this.tail = tg;
      this.add(tg, hairM, geo('tail', () => {
        const pts: THREE.Vector2[] = [];
        const n = 9;
        for (let i = 0; i <= n; i++) {
          const t = i / n;
          pts.push(new V2(i === n ? 0.0 : 0.036 * (1 - t * 0.8) + Math.sin(t * Math.PI) * 0.01, -t * 0.27));
        }
        pts.unshift(new V2(0, 0.0));
        return new THREE.LatheGeometry(pts, 12);
      }), [0, 0, -0.01], [0.5, 0, 0]);
      this.add(tg, stdMat('#c9473e', { rough: 0.5 }), new THREE.TorusGeometry(1, 0.35, 8, 14), [0, 0.0, 0], [Math.PI / 2, 0, 0], [0.03, 0.03, 0.03]);
      this.flushTo(tg);
    } else if (hs === 'cap') {
      const capCol = this.look.top === this.look.hair ? '#2b3a55' : shade(this.look.top, -0.1);
      const capM = clothMat(capCol);
      this.add(H, capM, capG(Math.PI * 0.5, seg), [0, hc + 0.018, -0.002], [-0.1, 0, 0], [rx * 1.1, ry * 1.1, rz * 1.12]);
      this.add(H, capM, geo('brim', () => new THREE.CylinderGeometry(1, 1, 0.012, 20, 1, false, -Math.PI / 2.3, Math.PI / 1.15)), [0, hc + 0.03, 0.04], [0.16, 0, 0], [0.115, 1, 0.115]);
      this.add(H, capM, hiSphere(), [0, hc + ry * 1.03, 0.0], [0, 0, 0], [0.012, 0.012, 0.012]);
      this.add(H, hairM, geo('capHair', () => { const g = new THREE.SphereGeometry(1, 16, 10, 0, Math.PI * 2, Math.PI * 0.3, Math.PI * 0.35); return g; }), [0, hc - 0.012, -0.02], [0.3, 0, 0], [rx * 1.04, ry * 1.0, rz * 1.06]);
    } else if (hs === 'bald') {
      if (!lite) this.add(H, hairM, geo('baldRing', () => new THREE.SphereGeometry(1, 20, 6, 0, Math.PI * 2, Math.PI * 0.43, Math.PI * 0.14)), [0, hc + 0.01, -0.012], [0.12, 0, 0], [sx * 0.99, sy * 0.99, sz * 0.98]);
    }
    void fem;
  }

  setSeated(b: boolean): void {
    this.seated = b;
    this.setPose(this.pose);
  }

  setPose(p: Pose): void {
    this.pose = p;
    if (p === 'sit') this.seated = true;
    const T = this.T;
    const s = this.seated;
    T[SEAT] = s ? 1 : 0;
    T[TORSO] = s ? -0.04 : 0;
    T[HEAD] = 0;
    T[LSX] = s ? -0.38 : 0; T[LSZ] = 0.1; T[LEX] = s ? -1.0 : -0.12;
    T[RSX] = T[LSX]; T[RSZ] = 0.1; T[REX] = T[LEX];
    T[AMP] = 0; T[WALK] = 0; T[SPEAK] = 0; T[LAUGH] = 0; T[SLEEP] = 0; T[DANCE] = 0; T[COOK] = 0; T[EAT] = 0; T[EXER] = 0;
    T[GL] = 0.35; T[GR] = 0.35; T[POINT] = 0; T[SMILE] = 0.35; T[BROW] = 0; T[ROLL] = 0; T[WRX] = 0;
    switch (p) {
      case 'talk':
        T[AMP] = 1; T[SPEAK] = 1; T[SMILE] = 0.5;
        T[LSX] = s ? -0.45 : -0.2; T[LEX] = s ? -1.1 : -0.8;
        T[RSX] = s ? -0.55 : -0.3; T[REX] = s ? -1.2 : -1.1;
        break;
      case 'wave':
        T[AMP] = 1; T[RSX] = -0.15; T[RSZ] = 2.55; T[REX] = -0.35; T[GR] = 0; T[SMILE] = 0.9;
        break;
      case 'phone':
        T[RSX] = -0.55; T[RSZ] = -0.08; T[REX] = -1.75; T[GR] = 0.7;
        T[LSX] = s ? -0.5 : -0.05;
        T[HEAD] = 0.35; T[TORSO] = s ? 0.1 : 0.04; T[SMILE] = 0.3;
        break;
      case 'walk':
        T[WALK] = 1; T[AMP] = 1; T[SMILE] = 0.4;
        break;
      case 'type':
        T[LSX] = -0.7; T[LEX] = -1.35; T[LSZ] = 0.05;
        T[RSX] = -0.7; T[REX] = -1.35; T[RSZ] = 0.05;
        T[HEAD] = 0.3; T[TORSO] = 0.08; T[GL] = 0.45; T[GR] = 0.45; T[SMILE] = 0.15;
        break;
      case 'think':
        T[RSX] = -0.6; T[RSZ] = -0.12; T[REX] = -2.3;
        T[LSX] = -0.5; T[LSZ] = -0.2; T[LEX] = -1.6;
        T[HEAD] = 0.12; T[ROLL] = 0.12; T[GR] = 0.6; T[POINT] = 1; T[BROW] = 0.5; T[SMILE] = 0.1;
        break;
      case 'carry':
        T[RSX] = 0.0; T[RSZ] = 0.12; T[REX] = -0.1; T[GR] = 0.9;
        break;
      case 'present':
        T[AMP] = 1; T[SPEAK] = 1; T[SMILE] = 0.55;
        T[RSX] = -0.8; T[RSZ] = 0.75; T[REX] = -0.25; T[GR] = 0.05;
        T[LSX] = -0.25; T[LEX] = -1.2;
        break;
      case 'cheer':
        T[AMP] = 1; T[SMILE] = 1; T[BROW] = 0.7;
        T[LSX] = -0.25; T[LSZ] = 2.6; T[LEX] = -0.2;
        T[RSX] = -0.25; T[RSZ] = 2.6; T[REX] = -0.2;
        T[HEAD] = -0.1; T[GL] = 0.9; T[GR] = 0.9;
        break;
      case 'sleep':
        T[SLEEP] = 1; T[SEAT] = 0; T[TORSO] = 0; T[SMILE] = 0.15;
        T[LSX] = 0.02; T[LSZ] = 0.14; T[LEX] = -0.2;
        T[RSX] = -0.1; T[RSZ] = 0.1; T[REX] = -0.55; T[GL] = 0.3; T[GR] = 0.3;
        T[ROLL] = 0.12;
        break;
      case 'dance':
        T[DANCE] = 1; T[AMP] = 1; T[SMILE] = 0.95; T[BROW] = 0.5;
        T[LSX] = -0.3; T[LSZ] = 0.8; T[LEX] = -1.2;
        T[RSX] = -0.3; T[RSZ] = 0.8; T[REX] = -1.2; T[GL] = 0.2; T[GR] = 0.2;
        break;
      case 'cook':
        T[COOK] = 1; T[TORSO] = 0.12; T[HEAD] = 0.4; T[SMILE] = 0.3;
        T[RSX] = -0.85; T[RSZ] = 0.1; T[REX] = -1.2; T[GR] = 0.85;
        T[LSX] = 0.1; T[LSZ] = 0.5; T[LEX] = -1.5; T[GL] = 0.5;
        break;
      case 'eat':
        T[EAT] = 1; T[TORSO] = 0.08; T[HEAD] = 0.1; T[SMILE] = 0.4;
        T[RSX] = -0.7; T[RSZ] = 0.05; T[REX] = -1.1; T[GR] = 0.85;
        T[LSX] = -0.55; T[LSZ] = 0.1; T[LEX] = -1.0;
        break;
      case 'exercise':
        T[EXER] = 1; T[AMP] = 1; T[SMILE] = 0.5; T[BROW] = 0.3; T[GL] = 0.7; T[GR] = 0.7;
        break;
      case 'laugh':
        T[LAUGH] = 1; T[AMP] = 1; T[SMILE] = 1; T[HEAD] = -0.22; T[TORSO] = -0.06; T[BROW] = 0.6;
        T[LSX] = -0.5; T[LSZ] = -0.1; T[LEX] = -1.8; T[GL] = 0.4;
        T[RSX] = -0.25; T[RSZ] = 0.5; T[REX] = -1.0; T[GR] = 0.1;
        break;
      default:
        break;
    }
    if (this.phone) this.phone.visible = p === 'phone';
    if (this.spoon) {
      this.spoon.visible = p === 'cook' || p === 'eat';
      this.spoon.rotation.x = p === 'cook' ? -1.25 : -0.7;
    }
    if (this.blob) this.blob.visible = p !== 'sleep';
    if (this.suitcase) {
      const sc = this.suitcase;
      if (p === 'carry') {
        this.handR.g.add(sc);
        sc.position.set(0, -0.66, 0.0);
        sc.rotation.set(0, Math.PI / 2, 0);
      } else {
        this.group.add(sc);
        sc.position.set(-0.5, 0, 0.12);
        sc.rotation.set(0, 0, 0);
      }
    }
  }

  lookAt(worldTarget: THREE.Vector3 | null): void {
    if (!worldTarget) {
      this.target = null;
      return;
    }
    if (!this.target) this.target = new THREE.Vector3();
    this.target.copy(worldTarget);
  }

  private hand(h: HandRig, grip: number, point: number): void {
    const inw = h === this.handL ? -1 : 1;
    if (h.fingers) h.fingers.rotation.z = inw * grip * 1.55;
    if (h.index) h.index.rotation.z = inw * lerp(grip * 1.5, 0.05, point);
    if (h.thumb) h.thumb.rotation.z = inw * (0.15 + grip * 0.65 * (1 - point * 0.5));
  }

  update(dt: number, time: number): void {
    const P = this.P, T = this.T;
    const k = 1 - Math.exp(-dt * 5);
    for (let i = 0; i < NP; i++) P[i] += (T[i] - P[i]) * k;
    const t = time + this.phase;
    const seat = P[SEAT], amp = P[AMP], walk = P[WALK], speak = P[SPEAK];
    const laugh = P[LAUGH], sleep = P[SLEEP], dance = P[DANCE], cook = P[COOK], exer = P[EXER];
    const standing = 1 - seat;
    this.walkPh += dt * walk * 6.2 * this.walkRate;
    const wp = this.walkPh;
    const sw = Math.sin(wp);
    this.exPh += dt * exer * (this.variant < 0.5 ? 6.6 : 4.2);
    const ep = this.exPh;
    const jacks = this.variant < 0.5 ? exer : 0;
    const squats = this.variant < 0.5 ? 0 : exer;
    const pose = this.pose;
    const cheerAmt = pose === 'cheer' ? amp : 0;
    const bt = t * 9.4; // dance beat
    const awake = 1 - sleep;

    // ---- look-at / eye darts
    let yawT = 0, pitchT = 0;
    if (this.target && sleep < 0.5) {
      this.group.updateWorldMatrix(true, false);
      this.tmp.copy(this.target);
      this.group.worldToLocal(this.tmp);
      const dx = this.tmp.x, dz = this.tmp.z;
      yawT = clamp(Math.atan2(dx, dz), -1.1, 1.1);
      const hy = 1.72 - 0.4 * seat;
      pitchT = clamp(Math.atan2(hy - this.tmp.y, Math.hypot(dx, dz)), -0.35, 0.45);
    } else {
      yawT = Math.sin(t * 0.4) * 0.07 + Math.sin(t * 0.13 + 1) * 0.06;
    }
    const ky = 1 - Math.exp(-dt * 4);
    this.yaw += (yawT - this.yaw) * ky;
    this.pitch += (pitchT - this.pitch) * ky;
    const dseed = Math.floor(t * 0.55);
    const dxT = (Math.sin(dseed * 12.9898) * 0.5) * 0.35;
    const dyT = (Math.sin(dseed * 78.233) * 0.5) * 0.2;
    const kd = 1 - Math.exp(-dt * 14);
    this.dartX += (dxT - this.dartX) * kd;
    this.dartY += (dyT - this.dartY) * kd;

    // ---- hips / torso
    const squatDrop = squats * (0.5 - 0.5 * Math.cos(ep)) * 0.34;
    const bob = walk * Math.abs(sw) * 0.035 + cheerAmt * Math.abs(Math.sin(t * 6)) * 0.07
      + dance * Math.abs(Math.sin(bt * 0.5)) * 0.04 + jacks * Math.abs(Math.sin(ep * 0.5)) * 0.1 + laugh * Math.sin(t * 14) * 0.006;
    this.hips.position.y = 0.94 - 0.4 * seat + bob - squatDrop;
    this.hips.position.x = standing * Math.sin(t * 0.4) * 0.012 + dance * Math.sin(bt * 0.25) * 0.05;
    this.hips.rotation.z = standing * Math.sin(t * 0.5) * 0.022 + walk * sw * 0.035 + dance * Math.sin(bt * 0.25) * 0.09;
    this.hips.rotation.y = walk * sw * 0.12 + dance * Math.sin(bt * 0.25 + 1) * 0.25 + this.yaw * 0.12 * seat;
    const breath = Math.sin(t * (sleep > 0.5 ? 1.1 : 1.7));
    const leanW = walk * 0.06;
    this.spine.rotation.set(
      P[TORSO] + breath * 0.012 * awake + leanW + squats * (0.5 - 0.5 * Math.cos(ep)) * 0.45 + dance * Math.sin(bt * 0.5) * 0.05,
      -this.hips.rotation.y * 0.8 + this.yaw * 0.28 * awake + dance * Math.sin(bt * 0.25 + 2) * 0.12,
      -this.hips.rotation.z * 0.8 + laugh * Math.sin(t * 15) * 0.045,
    );
    const chestS = 1 + breath * (sleep > 0.5 ? 0.02 : 0.008);
    this.spine.scale.set(chestS, 1, 1 + breath * 0.012);
    const nod = Math.sin(t * 2.6) * 0.05 * speak + dance * Math.sin(bt * 0.5) * 0.12 + laugh * Math.sin(t * 7) * 0.05;
    this.head.rotation.set(
      P[HEAD] + nod + this.pitch * 0.8 * awake,
      this.yaw * 0.72 * awake + Math.sin(t * 1.9) * 0.05 * speak + sleep * 0.4 + dance * Math.sin(bt * 0.25) * 0.2,
      Math.sin(t * 0.3) * 0.02 + P[ROLL] + dance * Math.sin(bt * 0.25 + 1.5) * 0.1,
    );

    // ---- arms
    let lsx = P[LSX], lsz = P[LSZ], lex = P[LEX], rsx = P[RSX], rsz = P[RSZ], rex = P[REX];
    let gl = P[GL], gr = P[GR], point = P[POINT];
    if (pose === 'talk' || pose === 'present') {
      const g1 = Math.sin(t * 1.3) * 0.5 + 0.5;
      rsx += Math.sin(t * 2.1) * 0.16 * amp;
      rex += Math.sin(t * 3.3) * 0.24 * amp;
      lsx += Math.sin(t * 1.7 + 1) * 0.09 * amp;
      lex += Math.sin(t * 2.4 + 1) * 0.14 * amp;
      rsz += Math.sin(t * 1.3) * 0.08 * amp;
      gr = lerp(0.05, 0.55, g1);
      gl = 0.35 + Math.sin(t * 1.9) * 0.2;
      point = pose === 'present' ? 0 : clamp(Math.sin(t * 0.7) * 2 - 0.8, 0, 1) * g1;
    } else if (pose === 'wave') {
      rex += Math.sin(t * 8) * 0.42 * amp;
    } else if (pose === 'cheer') {
      lsz += Math.sin(t * 7) * 0.12 * amp;
      rsz += Math.sin(t * 7 + 1) * 0.12 * amp;
    } else if (pose === 'walk') {
      lsx += sw * 0.5 * walk;
      rsx -= sw * 0.5 * walk;
      lex -= 0.25 * walk + Math.max(0, -sw) * 0.3 * walk;
      rex -= 0.25 * walk + Math.max(0, sw) * 0.3 * walk;
    } else if (pose === 'type') {
      lex += Math.sin(t * 9) * 0.04;
      rex += Math.sin(t * 8 + 2) * 0.04;
      gl = 0.45 + Math.sin(t * 11) * 0.12;
      gr = 0.45 + Math.sin(t * 9.5 + 1) * 0.12;
    } else if (pose === 'cook') {
      const a = t * 4.2;
      rsx += Math.sin(a) * 0.1 * cook;
      rsz += Math.cos(a) * 0.14 * cook;
      rex += Math.sin(a + 1) * 0.13 * cook;
    } else if (pose === 'eat') {
      const m = 0.5 - 0.5 * Math.cos((t / 3.4) * Math.PI * 2);
      const mm = m * m * (3 - 2 * m);
      rsx = lerp(-0.7, -0.5, mm);
      rex = lerp(-1.1, -2.5, mm);
      rsz = lerp(0.05, -0.1, mm);
      this.eatM = mm;
    } else if (pose === 'laugh') {
      const sh = Math.sin(t * 14);
      lsx += sh * 0.04; rsz += sh * 0.05;
      rex += Math.sin(t * 7) * 0.15;
    } else if (pose === 'dance') {
      const a = Math.sin(bt * 0.5);
      const v = this.variant;
      if (v < 0.4) { // arms up, pumping
        lsz = 2.2 + a * 0.3; rsz = 2.2 - a * 0.3; lsx = -0.2; rsx = -0.2; lex = -0.5 - a * 0.4; rex = -0.5 + a * 0.4;
      } else if (v < 0.7) { // side to side, hands at chest height
        lsx = -0.5 + a * 0.4; rsx = -0.5 - a * 0.4; lsz = 0.5; rsz = 0.5; lex = -1.3 + a * 0.3; rex = -1.3 - a * 0.3;
      } else { // one arm up, one down
        lsz = 2.4 + a * 0.2; rsz = 0.25 + Math.max(0, -a) * 0.3; lsx = -0.2; rsx = 0.1 - a * 0.3; lex = -0.4; rex = -0.6;
      }
      gl = gr = 0.2;
    } else if (pose === 'exercise') {
      if (this.variant < 0.5) { // jumping jacks: arms overhead and down
        const u = 0.5 - 0.5 * Math.cos(ep);
        lsz = rsz = lerp(0.12, 2.7, u); lsx = rsx = -0.15; lex = rex = lerp(-0.1, -0.3, u);
      } else { // squats: arms forward as counterweight
        const u = 0.5 - 0.5 * Math.cos(ep);
        lsx = rsx = lerp(-0.1, -1.45, u); lsz = rsz = 0.1; lex = rex = lerp(-0.1, -0.15, u);
      }
    }
    // idle micro-motion so arms are never frozen
    const br = Math.sin(t * 1.7) * 0.012 * awake;
    this.armL.sh.rotation.set(lsx + br, 0, lsz + Math.sin(t * 0.9) * 0.01);
    this.armR.sh.rotation.set(rsx + br, 0, -rsz - Math.sin(t * 0.9 + 1) * 0.01);
    this.armL.el.rotation.x = lex;
    this.armR.el.rotation.x = rex;
    this.hand(this.handL, gl, 0);
    this.hand(this.handR, gr, point);
    this.handR.g.rotation.x = pose === 'eat' || pose === 'phone' ? -0.4 : (pose === 'cook' ? -0.3 : 0);
    this.handL.g.rotation.x = 0;

    // ---- legs
    const shiftL = standing * Math.max(0, Math.sin(t * 0.5)) * 0.07;
    const shiftR = standing * Math.max(0, -Math.sin(t * 0.5)) * 0.07;
    let hL = -sw * 0.5 * walk * standing + seat * -1.45;
    let hR = sw * 0.5 * walk * standing + seat * -1.45;
    let kL = Math.max(0, Math.cos(wp)) * 0.7 * walk * standing + seat * 1.45 + standing * (0.03 + shiftL);
    let kR = Math.max(0, -Math.cos(wp)) * 0.7 * walk * standing + seat * 1.45 + standing * (0.03 + shiftR);
    let spread = 0.03 + seat * 0.05;
    if (squats > 0) {
      const u = 0.5 - 0.5 * Math.cos(ep);
      hL = hR = -u * 1.05; kL = kR = u * 1.95; spread += 0.12 * u;
    }
    if (jacks > 0) {
      const u = 0.5 - 0.5 * Math.cos(ep);
      spread += u * 0.42;
      kL = kR = 0.08 + (1 - u) * 0.1;
    }
    if (dance > 0) {
      const a = Math.sin(bt * 0.5);
      kL += dance * (0.25 + Math.max(0, a) * 0.4);
      kR += dance * (0.25 + Math.max(0, -a) * 0.4);
      hL -= dance * Math.max(0, a) * 0.25;
      hR -= dance * Math.max(0, -a) * 0.25;
    }
    if (sleep > 0) {
      kL += sleep * 0.12; kR += sleep * 0.3; hL -= sleep * 0.05; hR -= sleep * 0.2;
      spread += sleep * 0.1;
    }
    if (cook > 0) { kL += 0.06 * cook; kR += 0.1 * cook; }
    this.legL.hip.rotation.set(hL, 0, spread);
    this.legR.hip.rotation.set(hR, 0, -spread);
    this.legL.knee.rotation.x = kL;
    this.legR.knee.rotation.x = kR;
    this.legL.ankle.rotation.x = -(hL + kL) + sleep * 0.5;
    this.legR.ankle.rotation.x = -(hR + kR) + sleep * 0.5;
    if (this.skirt) {
      this.skirt.scale.y = 1 - seat * 0.55;
      this.skirt.rotation.x = -seat * 0.6;
    }

    // ---- lying down (sleep): whole rig rotates; the stage decides where the figure lies
    this.rig.rotation.x = -Math.PI * 0.5 * sleep;
    this.rig.position.set(0, 0.16 * sleep, 0.82 * sleep);

    // ---- face
    const bl = t % 3.9;
    const blink = bl < 0.14 ? 1 - Math.abs(bl - 0.07) / 0.07 : 0;
    const squint = laugh * 0.55 + sleep + P[SMILE] * 0.12;
    const lid = clamp(Math.max(blink, squint, sleep), 0, 1);
    if (this.lids) this.lids.rotation.x = lerp(-1.32, 0.9, lid);
    if (this.eyeBalls) {
      this.eyeBalls.rotation.set(-this.pitch * 0.5 * awake + this.dartY, this.yaw * 0.25 * awake + this.dartX, 0);
    }
    if (this.liteEyes) this.liteEyes.scale.y = lid > 0.5 ? 0.12 : 1;
    const mouthSpeak = Math.max(0, Math.sin(t * 13) * Math.sin(t * 5.3 + 1) * 0.5 + Math.sin(t * 8.1) * 0.35) * speak;
    let open = mouthSpeak * 0.7 + laugh * (0.55 + 0.4 * Math.max(0, Math.sin(t * 7)));
    if (pose === 'eat') {
      const chew = Math.max(0, Math.sin(t * 6)) * 0.22;
      open = Math.max(this.eatM > 0.82 ? (this.eatM - 0.82) * 4 : 0, chew * (this.eatM < 0.3 ? 1 : 0));
    }
    if (pose === 'cheer' || pose === 'dance') open = Math.max(open, 0.3 + 0.2 * Math.sin(t * 5));
    if (sleep > 0.5) open = 0.12 + 0.1 * Math.max(0, breath);
    if (pose === 'exercise') open = 0.2 + 0.2 * Math.max(0, Math.sin(ep));
    const sm = P[SMILE];
    if (this.mouthArc && this.lowerLip && this.cavity && this.teeth) {
      const my = this.mouthY, mz = this.faceZ;
      const wide = 1 + sm * 0.25 + laugh * 0.2;
      this.mouthArc.scale.set(0.026 * wide, 0.026 * (0.12 + sm * 0.75), 0.045);
      this.mouthArc.position.y = my + 0.016 - (sm * 0.004);
      this.cavity.scale.set(0.02 * wide * (0.6 + open * 0.6), Math.max(0.0004, open * 0.026), 0.01);
      this.cavity.position.y = my - open * 0.011 + 0.002;
      this.teeth.scale.set(0.017 * wide, laugh > 0.3 || open > 0.5 ? Math.min(0.006, open * 0.01) : 0.0003, 0.008);
      this.teeth.position.y = my + 0.004 - open * 0.002;
      this.lowerLip.position.set(0, my - 0.007 - open * 0.021, this.mouthArcZ(mz, open));
      this.lowerLip.scale.set(0.016 * wide, 0.0065, 0.009);
    }
    if (this.browL && this.browR) {
      const raise = P[BROW] * 0.012 + speak * Math.max(0, Math.sin(t * 2.3)) * 0.006 + (blink > 0 ? 0.002 : 0);
      this.browL.position.y = this.hc + 0.06 + raise;
      this.browR.position.y = this.hc + 0.06 + raise + (pose === 'think' ? 0.008 : 0);
      this.browL.rotation.z = 0.12 + (pose === 'think' ? -0.12 : 0);
      this.browR.rotation.z = -0.12 + (pose === 'think' ? -0.1 : 0);
    }
    // ponytail secondary motion
    if (this.tail) {
      const target = -this.head.rotation.y * 0.8 - walk * sw * 0.15 + dance * Math.sin(bt * 0.25) * 0.3;
      this.tailV += (target - this.tailPrev) * dt * 40 - this.tailV * dt * 6;
      this.tailPrev += this.tailV * dt;
      this.tail.rotation.z = clamp(this.tailPrev, -0.8, 0.8);
      this.tail.rotation.x = P[HEAD] * -0.4 + walk * Math.abs(sw) * 0.2 + Math.sin(t * 1.5) * 0.03;
    }
    if (this.blob) {
      const bs = 1.15 / this.baseScale;
      this.blob.scale.set(bs * (1 + seat * 0.1), 1, bs * (1 + seat * 0.1));
    }
  }
  private eatM = 0;
  private mouthArcZ(mz: number, open: number): number {
    return mz - 0.004 + open * 0.001;
  }

  dispose(): void {
    this.group.parent?.remove(this.group);
    for (const g of this.owned) g.dispose();
    this.owned.length = 0;
    // materials and shared base geometries are module-level caches.
  }
}

/* ------------------------------------------------------------------ looks */

const S = {
  fair: '#f0cfae',
  light: '#e5b992',
  tan: '#d19c72',
  brown: '#a9714a',
  deep: '#7a4a30',
  dark: '#5c3825',
};

export const ROLE_LOOKS: Record<Role, FigureLook> = {
  player: { skin: '#a9714a', hair: '#1a1210', hairStyle: 'short', top: '#2e7d9a', bottom: '#2d4a73', shoes: '#f0f0f0', height: 1, build: 'average', accessory: 'backpack', outer: 'hoodie' },
  officer: { skin: S.tan, hair: '#1c1612', hairStyle: 'short', top: '#1f3358', bottom: '#172338', shoes: '#101216', height: 1.04, build: 'average', accessory: 'none', uniform: 'officer' },
  dso: { skin: S.light, hair: '#3a2a22', hairStyle: 'bun', top: '#8a3a5a', bottom: '#2f3340', shoes: '#3b2f2a', height: 0.96, build: 'average', accessory: 'lanyard', outer: 'jacket', fem: true, outfit: 'skirt' },
  professor: { skin: S.deep, hair: '#8c8c90', hairStyle: 'short', top: '#7a6a4f', bottom: '#3a3f4a', shoes: '#4a3a2c', height: 1.05, build: 'average', accessory: 'glasses', outer: 'jacket', fem: false },
  advisor: { skin: S.tan, hair: '#1f1814', hairStyle: 'ponytail', top: '#3d4c8c', bottom: '#2c2f38', shoes: '#2a2a2e', height: 0.98, build: 'slim', accessory: 'lanyard', outer: 'jacket', fem: true },
  roommate: { skin: S.fair, hair: '#6b4a2e', hairStyle: 'curly', top: '#6c7480', bottom: '#2b3040', shoes: '#d8d2c6', height: 1.02, build: 'average', accessory: 'headphones', outer: 'hoodie', fem: false },
  friend: { skin: S.brown, hair: '#161010', hairStyle: 'long', top: '#d29a2e', bottom: '#2b4f78', shoes: '#f0f0f0', height: 0.97, build: 'slim', accessory: 'none', outer: 'jacket', fem: true },
  landlord: { skin: S.light, hair: '#b8b4ae', hairStyle: 'bald', top: '#55709a', bottom: '#4a4238', shoes: '#3a2f27', height: 1.0, build: 'broad', accessory: 'none', fem: false },
  doctor: { skin: S.deep, hair: '#1c1412', hairStyle: 'bun', top: '#7aa7c7', bottom: '#2c3340', shoes: '#f4f4f4', height: 0.99, build: 'average', accessory: 'none', uniform: 'doctor', fem: true, outfit: 'coat' },
  nurse: { skin: S.tan, hair: '#2a1d16', hairStyle: 'short', top: '#2a9d9a', bottom: '#2a9d9a', shoes: '#f4f4f4', height: 1.02, build: 'average', accessory: 'badge', uniform: 'nurse', fem: false },
  recruiter: { skin: S.fair, hair: '#b0753a', hairStyle: 'ponytail', top: '#862f4b', bottom: '#262932', shoes: '#262626', height: 0.99, build: 'slim', accessory: 'lanyard', uniform: 'suit', fem: true },
  parent: { skin: '#a56b46', hair: '#1c1412', hairStyle: 'bun', top: '#9b2f3f', bottom: '#d9c9a8', shoes: '#4a3a2c', height: 0.94, build: 'average', accessory: 'scarf', fem: true, outfit: 'kurta' },
  partner: { skin: '#c28a5e', hair: '#241914', hairStyle: 'curly', top: '#2fa08a', bottom: '#33384a', shoes: '#f0f0f0', height: 1.0, build: 'average', accessory: 'none', outer: 'jacket' },
  spouse: { skin: '#9a6340', hair: '#17110e', hairStyle: 'short', top: '#4a6fb5', bottom: '#33384a', shoes: '#2e2b29', height: 1.04, build: 'average', accessory: 'none', fem: false },
  stranger: { skin: S.light, hair: '#4a3a2c', hairStyle: 'cap', top: '#4a5a42', bottom: '#2f343e', shoes: '#3a3a3a', height: 1.0, build: 'average', accessory: 'none', outer: 'jacket', fem: false },
  owner: { skin: S.tan, hair: '#2a1e18', hairStyle: 'bun', top: '#b8553a', bottom: '#2b2b30', shoes: '#2b2b30', height: 0.97, build: 'average', accessory: 'none', fem: true, outfit: 'dress' },
  student: { skin: S.brown, hair: '#1c1412', hairStyle: 'short', top: '#7a5cb0', bottom: '#3a4d6f', shoes: '#e8e8e8', height: 1.0, build: 'average', accessory: 'backpack' },
  teller: { skin: S.deep, hair: '#14100e', hairStyle: 'short', top: '#9cc4e4', bottom: '#2a2f3c', shoes: '#241f1c', height: 1.02, build: 'average', accessory: 'lanyard', uniform: 'suit', fem: false },
};

for (const [r, l] of Object.entries(ROLE_LOOKS)) l.role = r as Role;

const SKINS = [S.fair, S.light, S.tan, S.brown, S.deep, S.dark, '#c28a5e', '#e0b48c'];
const HAIRS = ['#1a1210', '#2a1b14', '#4a3226', '#6b4a2e', '#b0753a', '#8c8c90', '#101010'];
const TOPS = ['#c9473e', '#2e7d9a', '#e0a23f', '#6b8f4e', '#7a5cb0', '#d6708a', '#4a6fd6', '#cfd3d9', '#3d4452', '#e07a3f', '#2fa08a'];
const BOTTOMS = ['#2d4a73', '#33384a', '#4a4238', '#222630', '#5a6a8a', '#6f5b4a'];
const HAIRSTYLES: FigureLook['hairStyle'][] = ['short', 'long', 'bun', 'curly', 'ponytail', 'short', 'long', 'cap', 'bald'];
const BUILDS: FigureLook['build'][] = ['slim', 'average', 'broad', 'average'];

/** A varied, respectful background person. */
export function crowdLook(seed: number): FigureLook {
  const r = mulberry(seed * 7919 + 13);
  const pick = <T,>(a: T[]): T => a[Math.floor(r() * a.length)];
  const acc: FigureLook['accessory'][] = ['none', 'none', 'backpack', 'glasses', 'headphones', 'backpack', 'scarf'];
  const outer: NonNullable<FigureLook['outer']>[] = ['none', 'hoodie', 'jacket', 'none'];
  const hs = pick(HAIRSTYLES);
  return {
    skin: pick(SKINS),
    hair: pick(HAIRS),
    hairStyle: hs,
    top: pick(TOPS),
    bottom: pick(BOTTOMS),
    shoes: pick(['#f0f0f0', '#222222', '#6b4a2e', '#c9473e']),
    height: 0.92 + r() * 0.16,
    build: pick(BUILDS),
    accessory: pick(acc),
    outer: pick(outer),
    outfit: hs === 'long' || hs === 'bun' || hs === 'ponytail' ? pick([undefined, undefined, 'dress', 'skirt', 'shorts', undefined]) : pick([undefined, undefined, undefined, 'shorts', undefined]),
  };
}

export function playerLookFor(p: { sex: Sex; age: number; marital: Marital }, seed: number, tones?: string[]): FigureLook {
  const r = mulberry(Math.floor(seed) * 31 + 7);
  const pick = <T,>(a: T[]): T => a[Math.floor(r() * a.length)];
  const skin = pick(tones && tones.length ? tones : ['#a9714a', '#9a6340', '#b57d52', '#8d5a3b', '#c08a5e', '#a06a45']);
  const hairStyle: FigureLook['hairStyle'] =
    p.sex === 'female' ? pick(['long', 'ponytail', 'long']) : p.sex === 'male' ? 'short' : pick(['short', 'curly']);
  const grey = p.age >= 40;
  const top = pick(['#2e7d9a', '#e07a3f', '#7a5cb0', '#3fa37a', '#d6485f', '#4a6fd6', '#e0a23f']);
  const marriedAdj = p.marital === 'single' ? 0 : 0.0;
  return {
    skin,
    hair: grey ? '#3a3532' : pick(['#1a1210', '#16100e', '#241812']),
    hairStyle,
    top,
    bottom: pick(['#2d4a73', '#33466b', '#2a3a58']),
    shoes: '#f2f2f2',
    height: 0.95 + r() * 0.1 + marriedAdj,
    build: p.sex === 'male' ? pick(['average', 'broad']) : p.sex === 'female' ? pick(['slim', 'average']) : 'average',
    accessory: 'backpack',
    outer: r() < 0.65 ? 'hoodie' : 'none',
    fem: p.sex === 'female' ? true : p.sex === 'male' ? false : r() < 0.5,
    role: 'player',
    outfit: p.sex === 'female' ? pick([undefined, 'skirt', undefined, 'dress']) : undefined,
  };
}
