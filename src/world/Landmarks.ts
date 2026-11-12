import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { CityId } from '../engine/types';

export interface CityStyle {
  buildingColors: string[];
  heightScale: number;
  density: number;
  maxHeight: number;
  ground: string;
  skyTop: string;
  skyHorizon: string;
  fog: string;
  fogNear: number;
  fogFar: number;
  sunColor: string;
  windowLit: number;
  notes: string;
}

const STYLES: Record<CityId, CityStyle> = {
  nyc: {
    buildingColors: ['#4a5568', '#5a4f4a', '#3d4658', '#6b6358'],
    heightScale: 1.2, density: 1.2, maxHeight: 34, ground: '#2a2d33',
    skyTop: '#1b1f4a', skyHorizon: '#f08a5d', fog: '#6a4a66', fogNear: 90, fogFar: 330,
    sunColor: '#ffb27a', windowLit: 0.5, notes: 'Dense Midtown canyon, brownstones, East River and the Brooklyn Bridge',
  },
  chicago: {
    buildingColors: ['#2f3640', '#3d4452', '#586272', '#4a4038'],
    heightScale: 1.1, density: 1.0, maxHeight: 34, ground: '#3a3d42',
    skyTop: '#141c3d', skyHorizon: '#dc8468', fog: '#4d4a63', fogNear: 90, fogFar: 330,
    sunColor: '#ffc08a', windowLit: 0.45, notes: 'Steel and black-glass Loop towers beside the river and the lake',
  },
  la: {
    buildingColors: ['#c9b79c', '#b8a58a', '#d6c4a8', '#a69783'],
    heightScale: 0.55, density: 0.8, maxHeight: 22, ground: '#4a4538',
    skyTop: '#2a2358', skyHorizon: '#ff9e6b', fog: '#7a5a6e', fogNear: 100, fogFar: 380,
    sunColor: '#ffb36b', windowLit: 0.4, notes: 'Low sprawl of stucco, a small glass downtown, palms, freeways and mountains',
  },
  houston: {
    buildingColors: ['#6f7885', '#59626f', '#8a8f96', '#4b5563'],
    heightScale: 0.75, density: 0.7, maxHeight: 26, ground: '#3c4034',
    skyTop: '#1f2750', skyHorizon: '#f29a6a', fog: '#5f5668', fogNear: 100, fogFar: 360,
    sunColor: '#ffa660', windowLit: 0.42, notes: 'Flat humid horizon, glass downtown towers, stacked freeways, refinery glow',
  },
  bayarea: {
    buildingColors: ['#cbbfae', '#b5a89a', '#d9cfc2', '#9ea7a8'],
    heightScale: 0.6, density: 0.6, maxHeight: 20, ground: '#5a5a38',
    skyTop: '#2b2f5f', skyHorizon: '#ffb089', fog: '#8a7a8c', fogNear: 90, fogFar: 340,
    sunColor: '#ffc99a', windowLit: 0.4, notes: 'Golden hills, the bay, an orange bridge and a pale pointed skyline',
  },
  dallas: {
    buildingColors: ['#7a8794', '#5d6a78', '#8d99a6', '#4a5866'],
    heightScale: 0.8, density: 0.6, maxHeight: 28, ground: '#6a5f45',
    skyTop: '#1d2656', skyHorizon: '#ff8f5a', fog: '#7a5c5e', fogNear: 100, fogFar: 360,
    sunColor: '#ff9f5c', windowLit: 0.42, notes: 'Wide prairie, glowing neon towers, a lit ball tower and freeway stacks',
  },
  dc: {
    buildingColors: ['#d8d2c4', '#c4bcab', '#b0a592', '#a89a88'],
    heightScale: 0.35, density: 1.0, maxHeight: 13, ground: '#35452f',
    skyTop: '#25285a', skyHorizon: '#f4a6a0', fog: '#7c6a82', fogNear: 90, fogFar: 340,
    sunColor: '#ffc0a0', windowLit: 0.35, notes: 'Low even marble skyline: obelisk, dome, rowhouses, river and blossoms',
  },
  atlanta: {
    buildingColors: ['#58626b', '#6b7782', '#4a5560', '#7d8790'],
    heightScale: 0.8, density: 0.7, maxHeight: 26, ground: '#26422c',
    skyTop: '#1c2552', skyHorizon: '#f2906b', fog: '#4f5a60', fogNear: 80, fogFar: 300,
    sunColor: '#ffbd7a', windowLit: 0.4, notes: 'Towers rising out of a dense green canopy, gold spire, MARTA rail',
  },
};

export function cityStyle(id: CityId): CityStyle {
  const s = STYLES[id];
  return { ...s, buildingColors: [...s.buildingColors] };
}

/** Water areas (and similar) the lead may want to keep generic fill buildings out of. */
export interface Exclusion { x0: number; x1: number; z0: number; z1: number }
export function landmarkExclusions(id: CityId): Exclusion[] {
  switch (id) {
    case 'nyc': return [{ x0: -112, x1: -28, z0: -175, z1: -45 }];
    case 'chicago': return [{ x0: -140, x1: 140, z0: -64, z1: -53 }, { x0: 108, x1: 300, z0: -190, z1: 20 }];
    case 'bayarea': return [{ x0: -150, x1: 40, z0: -185, z1: -62 }];
    case 'dc': return [{ x0: -120, x1: -70, z0: -175, z1: -30 }, { x0: -50, x1: -20, z0: -145, z1: -115 }, { x0: 10, x1: 18, z0: -158, z1: -122 }];
    default: return [];
  }
}

// ------------------------------------------------------------------ utilities

type Rng = () => number;
function mk(seed: number): Rng {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const TAU = Math.PI * 2;
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const rr = (r: Rng, a: number, b: number): number => a + (b - a) * r();
const pick = <T,>(r: Rng, a: readonly T[]): T => a[Math.floor(r() * a.length) % a.length];

const CELL = 7.6;

function makeWindowTextures(lit: number, seed: number): { map: THREE.CanvasTexture; emi: THREE.CanvasTexture } {
  const r = mk(seed);
  const N = 8, P = 16, S = N * P;
  const ca = document.createElement('canvas');
  const ce = document.createElement('canvas');
  ca.width = ca.height = ce.width = ce.height = S;
  const ga = ca.getContext('2d');
  const ge = ce.getContext('2d');
  if (!ga || !ge) throw new Error('2D canvas unavailable');
  ga.fillStyle = '#ffffff';
  ga.fillRect(0, 0, S, S);
  ge.fillStyle = '#000000';
  ge.fillRect(0, 0, S, S);
  const warm = ['#ffd9a0', '#ffe6bd', '#ffc27a', '#bfe3ff', '#fff1d0'];
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      ga.fillStyle = '#6c7690';
      ga.fillRect(x * P + 3, y * P + 3, P - 6, P - 6);
      if (r() < lit) {
        ge.fillStyle = warm[Math.floor(r() * warm.length)];
        ge.fillRect(x * P + 3, y * P + 3, P - 6, P - 6);
      }
    }
  }
  const mkTex = (c: HTMLCanvasElement): THREE.CanvasTexture => {
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  };
  return { map: mkTex(ca), emi: mkTex(ce) };
}

class Mats {
  private cache = new Map<string, THREE.Material>();
  private tex = new Map<number, { map: THREE.CanvasTexture; emi: THREE.CanvasTexture }>();
  constructor(private readonly lit: number, private readonly seed: number) {}

  std(color: string, rough = 0.85, emissive = '#000000', ei = 0): THREE.MeshStandardMaterial {
    const k = `s${color}${rough}${emissive}${ei}`;
    let m = this.cache.get(k) as THREE.MeshStandardMaterial | undefined;
    if (!m) {
      m = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0.05, emissive, emissiveIntensity: ei });
      this.cache.set(k, m);
    }
    return m;
  }

  glow(color: string): THREE.MeshBasicMaterial {
    const k = `g${color}`;
    let m = this.cache.get(k) as THREE.MeshBasicMaterial | undefined;
    if (!m) {
      m = new THREE.MeshBasicMaterial({ color, toneMapped: false });
      this.cache.set(k, m);
    }
    return m;
  }

  glass(color: string, ei = 0.9, litMul = 1): THREE.MeshStandardMaterial {
    const k = `w${color}${ei}${litMul}`;
    let m = this.cache.get(k) as THREE.MeshStandardMaterial | undefined;
    if (!m) {
      const key = Math.round(litMul * 100);
      let t = this.tex.get(key);
      if (!t) {
        t = makeWindowTextures(Math.min(0.95, this.lit * litMul), this.seed + key);
        this.tex.set(key, t);
      }
      m = new THREE.MeshStandardMaterial({
        color, map: t.map, emissive: '#ffffff', emissiveMap: t.emi, emissiveIntensity: ei, roughness: 0.6, metalness: 0.05,
      });
      m.userData.cell = CELL;
      this.cache.set(k, m);
    }
    return m;
  }
}

function autoUV(g: THREE.BufferGeometry, cell: number): void {
  const p = g.attributes.position as THREE.BufferAttribute;
  const n = g.attributes.normal as THREE.BufferAttribute;
  let uv = g.attributes.uv as THREE.BufferAttribute | undefined;
  if (!uv) {
    uv = new THREE.BufferAttribute(new Float32Array(p.count * 2), 2);
    g.setAttribute('uv', uv);
  }
  for (let i = 0; i < p.count; i++) {
    const nx = Math.abs(n.getX(i)), ny = Math.abs(n.getY(i)), nz = Math.abs(n.getZ(i));
    if (ny > nx && ny > nz) uv.setXY(i, 0.004, 0.004);
    else if (nx >= nz) uv.setXY(i, p.getZ(i) / cell, p.getY(i) / cell);
    else uv.setXY(i, p.getX(i) / cell, p.getY(i) / cell);
  }
}

function trisGeo(pos: number[]): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array((pos.length / 3) * 2), 2));
  return g;
}

type V3 = THREE.Vector3;
type Shape = (phi: number) => number;
const regpoly = (n: number, a: number, rot = 0): Shape => (phi) => {
  const s = TAU / n;
  let m = (((phi - rot) % s) + s) % s;
  if (m > s / 2) m -= s;
  return a / Math.cos(m);
};
const ellipse = (rx: number, rz: number): Shape => (phi) => 1 / Math.sqrt((Math.cos(phi) / rx) ** 2 + (Math.sin(phi) / rz) ** 2);
const morph = (s0: Shape, s1: Shape, t: number): Shape => (phi) => s0(phi) * (1 - t) + s1(phi) * t;
const chamfered = (hw: number, cut: number): Shape => (phi) => {
  const c = Math.abs(Math.cos(phi)), s = Math.abs(Math.sin(phi));
  return Math.min(hw / Math.max(c, s, 1e-6), cut / Math.max(c + s, 1e-6));
};
function ringAt(s: Shape, y: number, n = 16, tilt?: (x: number, z: number) => number): V3[] {
  const out: V3[] = [];
  for (let k = 0; k < n; k++) {
    const th = (k / n) * TAU;
    const r = s(th);
    const x = r * Math.cos(th), z = r * Math.sin(th);
    out.push(new THREE.Vector3(x, y + (tilt ? tilt(x, z) : 0), z));
  }
  return out;
}

// ------------------------------------------------------------------ geometry batcher

interface Frame { x: number; y: number; z: number; ry: number }

class B {
  private parts = new Map<THREE.Material, THREE.BufferGeometry[]>();
  readonly extra = new THREE.Group();
  private fr: Frame = { x: 0, y: 0, z: 0, ry: 0 };
  private m4 = new THREE.Matrix4();
  private q = new THREE.Quaternion();
  private eu = new THREE.Euler();
  private pv = new THREE.Vector3();
  private sv = new THREE.Vector3();

  with(x: number, y: number, z: number, ry: number, fn: () => void): void {
    const p = this.fr;
    const c = Math.cos(p.ry), s = Math.sin(p.ry);
    this.fr = { x: p.x + x * c + z * s, y: p.y + y, z: p.z - x * s + z * c, ry: p.ry + ry };
    fn();
    this.fr = p;
  }

  private toWorld(x: number, y: number, z: number): [number, number, number] {
    const f = this.fr;
    const c = Math.cos(f.ry), s = Math.sin(f.ry);
    return [f.x + x * c + z * s, f.y + y, f.z - x * s + z * c];
  }

  private store(g: THREE.BufferGeometry, m: THREE.Material): void {
    const ng = g.index ? g.toNonIndexed() : g;
    for (const k of Object.keys(ng.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'uv') ng.deleteAttribute(k);
    if (!ng.attributes.uv) ng.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(ng.attributes.position.count * 2), 2));
    let a = this.parts.get(m);
    if (!a) { a = []; this.parts.set(m, a); }
    a.push(ng);
  }

  put(g: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, ry = 0, rx = 0, rz = 0, sx = 1, sy = 1, sz = 1): void {
    if (m.userData.cell) autoUV(g, m.userData.cell as number);
    const [wx, wy, wz] = this.toWorld(x, y, z);
    this.eu.set(rx, ry + this.fr.ry, rz, 'YXZ');
    this.q.setFromEuler(this.eu);
    this.pv.set(wx, wy, wz);
    this.sv.set(sx, sy, sz);
    this.m4.compose(this.pv, this.q, this.sv);
    g.applyMatrix4(this.m4);
    this.store(g, m);
  }

  /** Box with its BOTTOM centre at (x,y,z). */
  box(m: THREE.Material, x: number, y: number, z: number, w: number, h: number, d: number, ry = 0): void {
    this.put(new THREE.BoxGeometry(w, h, d), m, x, y + h / 2, z, ry);
  }

  /** Cylinder with its bottom centre at (x,y,z). */
  cyl(m: THREE.Material, x: number, y: number, z: number, rt: number, rb: number, h: number, seg = 12): void {
    this.put(new THREE.CylinderGeometry(rt, rb, h, seg), m, x, y + h / 2, z);
  }

  cone(m: THREE.Material, x: number, y: number, z: number, r: number, h: number, seg = 8): void {
    this.cyl(m, x, y, z, 0, r, h, seg);
  }

  /** Ellipsoid centred at (x,y,z). */
  ball(m: THREE.Material, x: number, y: number, z: number, r: number, sx = 1, sy = 1, sz = 1, ws = 10, hs = 7): void {
    this.put(new THREE.SphereGeometry(r, ws, hs), m, x, y, z, 0, 0, 0, sx, sy, sz);
  }

  /** Tapered box (rectangular frustum) with optional sloped top. Bottom centre at (x,y,z). */
  frus(m: THREE.Material, x: number, y: number, z: number, wb: number, db: number, wt: number, dt: number, h: number, ry = 0, tilt?: (x: number, z: number) => number): void {
    const g = new THREE.BoxGeometry(1, 1, 1);
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const top = p.getY(i) > 0;
      const px = p.getX(i) * (top ? wt : wb);
      const pz = p.getZ(i) * (top ? dt : db);
      p.setXYZ(i, px, (p.getY(i) + 0.5) * h + (top && tilt ? tilt(px, pz) : 0), pz);
    }
    g.computeVertexNormals();
    this.put(g, m, x, y, z, ry);
  }

  /** Triangular prism, ridge along local z, base on y. */
  prism(m: THREE.Material, x: number, y: number, z: number, w: number, d: number, h: number, ry = 0): void {
    const a = [-w / 2, 0, -d / 2], bb = [w / 2, 0, -d / 2], c = [0, h, -d / 2];
    const a2 = [-w / 2, 0, d / 2], b2 = [w / 2, 0, d / 2], c2 = [0, h, d / 2];
    const pos = [...a2, ...b2, ...c2, ...bb, ...a, ...c, ...a, ...a2, ...c2, ...a, ...c2, ...c, ...bb, ...c, ...c2, ...bb, ...c2, ...b2];
    this.put(trisGeo(pos), m, x, y, z, ry);
  }

  /** Loft between rings of equal point count (rings carry their own y, relative to y). */
  loft(m: THREE.Material, rings: V3[][], x: number, y: number, z: number, cap = true): void {
    const pos: number[] = [];
    const n = rings[0].length;
    const push = (v: V3): void => { pos.push(v.x, v.y, v.z); };
    for (let i = 0; i < rings.length - 1; i++) {
      const A = rings[i], Bn = rings[i + 1];
      for (let k = 0; k < n; k++) {
        const k2 = (k + 1) % n;
        push(A[k]); push(Bn[k]); push(A[k2]);
        push(A[k2]); push(Bn[k]); push(Bn[k2]);
      }
    }
    if (cap) {
      const T = rings[rings.length - 1];
      const c = new THREE.Vector3();
      for (const v of T) c.add(v);
      c.multiplyScalar(1 / n);
      for (let k = 0; k < n; k++) { push(c); push(T[(k + 1) % n]); push(T[k]); }
    }
    this.put(trisGeo(pos), m, x, y, z);
  }

  /** Thin box between two world points (frame ignored; use outside `with`). */
  beam(m: THREE.Material, ax: number, ay: number, az: number, bx: number, by: number, bz: number, tx: number, ty = tx): void {
    const dx = bx - ax, dy = by - ay, dz = bz - az;
    const hz = Math.hypot(dx, dz);
    const len = Math.hypot(hz, dy);
    if (len < 1e-4) return;
    this.put(new THREE.BoxGeometry(tx, ty, len), m, (ax + bx) / 2, (ay + by) / 2, (az + bz) / 2, Math.atan2(dx, dz), -Math.atan2(dy, hz));
  }

  finish(): THREE.Group {
    const grp = new THREE.Group();
    for (const [m, geos] of this.parts) {
      const merged = mergeGeometries(geos, false);
      for (const g of geos) g.dispose();
      if (!merged) continue;
      merged.computeBoundingSphere();
      grp.add(new THREE.Mesh(merged, m));
    }
    grp.add(this.extra);
    this.parts.clear();
    return grp;
  }
}

// ------------------------------------------------------------------ shared pieces

const FONT: Record<string, string[]> = {
  H: ['X...X', 'X...X', 'X...X', 'XXXXX', 'X...X', 'X...X', 'X...X'],
  O: ['.XXX.', 'X...X', 'X...X', 'X...X', 'X...X', 'X...X', '.XXX.'],
  L: ['X....', 'X....', 'X....', 'X....', 'X....', 'X....', 'XXXXX'],
  Y: ['X...X', 'X...X', '.X.X.', '..X..', '..X..', '..X..', '..X..'],
  W: ['X...X', 'X...X', 'X...X', 'X.X.X', 'X.X.X', 'XX.XX', 'X...X'],
  D: ['XXXX.', 'X...X', 'X...X', 'X...X', 'X...X', 'X...X', 'XXXX.'],
  T: ['XXXXX', '..X..', '..X..', '..X..', '..X..', '..X..', '..X..'],
  E: ['XXXXX', 'X....', 'X....', 'XXXX.', 'X....', 'X....', 'XXXXX'],
  C: ['.XXXX', 'X....', 'X....', 'X....', 'X....', 'X....', '.XXXX'],
  M: ['X...X', 'XX.XX', 'X.X.X', 'X...X', 'X...X', 'X...X', 'X...X'],
};

function pixelText(b: B, m: THREE.Material, text: string, x: number, y: number, z: number, px: number, ry: number, depth = 0.5): void {
  const total = text.length * 6 * px - px;
  b.with(x, y, z, ry, () => {
    for (let i = 0; i < text.length; i++) {
      const rows = FONT[text[i]];
      if (!rows) continue;
      for (let row = 0; row < 7; row++) {
        for (let col = 0; col < 5; col++) {
          if (rows[row][col] === 'X') b.box(m, -total / 2 + i * 6 * px + col * px + px / 2, (6 - row) * px, 0, px * 1.02, px * 1.02, depth);
        }
      }
    }
  });
}

const ROAD = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-22, 0, 8), new THREE.Vector3(-10, 0, 5), new THREE.Vector3(0, 0, -1),
  new THREE.Vector3(10, 0, -5), new THREE.Vector3(22, 0, 0),
]);
interface RoadPt { x: number; z: number; yaw: number }
function roadAt(u: number, off: number): RoadPt {
  const p = ROAD.getPointAt(u), t = ROAD.getTangentAt(u);
  return { x: p.x - t.z * off, z: p.z + t.x * off, yaw: Math.atan2(t.x, t.z) };
}
const nearSite = (x: number, z: number, extra = 0): boolean =>
  Math.hypot(x + 24, z - 14) < 9 + extra || (Math.abs(x - 24) < 12 + extra && Math.abs(z + 4) < 8 + extra);

function lamp(b: B, mt: Mats, x: number, z: number, faceYaw: number): void {
  const dark = mt.std('#252a35', 0.6);
  b.cyl(dark, x, 0, z, 0.07, 0.11, 4.6, 6);
  b.with(x, 0, z, faceYaw, () => {
    b.box(dark, 0, 4.5, 0.45, 0.1, 0.1, 1.0);
    b.box(mt.glow('#ffd9a0'), 0, 4.38, 0.85, 0.38, 0.08, 0.5);
  });
}

type TreeKind = 'oak' | 'pine' | 'palm' | 'blossom' | 'euca' | 'bare';
function tree(b: B, mt: Mats, r: Rng, kind: TreeKind, x: number, z: number, h: number): void {
  const trunk = mt.std('#4e3a2b');
  switch (kind) {
    case 'oak': {
      const g = mt.std(pick(r, ['#2f6a3a', '#3b7a42', '#27583a']), 0.9);
      b.cyl(trunk, x, 0, z, 0.12, 0.2, h * 0.5, 5);
      b.ball(g, x, h * 0.72, z, h * 0.34, 1, 0.9, 1, 7, 5);
      b.ball(g, x + h * 0.14, h * 0.6, z + h * 0.08, h * 0.22, 1, 0.9, 1, 6, 4);
      break;
    }
    case 'pine': {
      const g = mt.std(pick(r, ['#20502f', '#2a5f38']), 0.9);
      b.cyl(trunk, x, 0, z, 0.1, 0.16, h * 0.3, 5);
      b.cone(g, x, h * 0.2, z, h * 0.3, h * 0.55, 7);
      b.cone(g, x, h * 0.5, z, h * 0.22, h * 0.45, 7);
      break;
    }
    case 'blossom': {
      const g = mt.std(pick(r, ['#f2a7c3', '#f7bfd2', '#ee93b4']), 0.9, '#7a3050', 0.12);
      b.cyl(trunk, x, 0, z, 0.1, 0.18, h * 0.5, 5);
      b.ball(g, x, h * 0.7, z, h * 0.3, 1.1, 0.8, 1.1, 7, 5);
      b.ball(g, x + h * 0.18, h * 0.58, z, h * 0.2, 1, 0.8, 1, 6, 4);
      b.ball(g, x - h * 0.16, h * 0.6, z + h * 0.06, h * 0.2, 1, 0.8, 1, 6, 4);
      break;
    }
    case 'euca': {
      const g = mt.std('#4f7a5e', 0.9);
      b.cyl(mt.std('#8a8574'), x, 0, z, 0.1, 0.2, h * 0.6, 5);
      b.ball(g, x, h * 0.72, z, h * 0.2, 0.9, 1.7, 0.9, 6, 5);
      break;
    }
    case 'palm': {
      const f = mt.std(pick(r, ['#2b6b3a', '#357a40']), 0.8);
      const lean = rr(r, -0.12, 0.12);
      b.put(new THREE.CylinderGeometry(0.1, 0.22, h, 5), mt.std('#7a6a52'), x + Math.sin(lean) * h * 0.5, h / 2, z, 0, 0, lean);
      const tx = x + Math.sin(lean) * h;
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * TAU + r() * 0.3;
        b.put(new THREE.BoxGeometry(0.3, 0.05, 1.9), f, tx + Math.sin(a) * 0.85, h - 0.2, z + Math.cos(a) * 0.85, a, 0.42);
      }
      b.ball(f, tx, h, z, 0.3, 1, 0.8, 1, 5, 4);
      break;
    }
    default:
      break;
  }
}

function car(b: B, mt: Mats, x: number, z: number, yaw: number, color: string, kind: 'car' | 'cab' | 'van' = 'car'): void {
  const body = mt.std(color, 0.45);
  const glass = mt.std('#1a2230', 0.3, '#10161f', 0.2);
  b.with(x, 0, z, yaw, () => {
    b.box(mt.std('#14161b'), 0, 0.15, 0, 1.7, 0.4, 3.9);
    if (kind === 'van') {
      b.box(body, 0, 0.45, 0, 1.9, 1.7, 4.4);
      b.box(glass, 0, 1.2, 1.5, 1.92, 0.6, 1.3);
    } else {
      b.box(body, 0, 0.45, 0, 1.9, 0.75, 4.2);
      b.box(glass, 0, 1.2, -0.2, 1.7, 0.6, 2.2);
      b.box(body, 0, 1.78, -0.2, 1.6, 0.08, 2.0);
    }
    b.box(mt.glow('#fff1c8'), 0.6, 0.7, 2.1, 0.5, 0.2, 0.06);
    b.box(mt.glow('#fff1c8'), -0.6, 0.7, 2.1, 0.5, 0.2, 0.06);
    b.box(mt.glow('#ff2a2a'), 0.6, 0.7, -2.1, 0.5, 0.2, 0.06);
    b.box(mt.glow('#ff2a2a'), -0.6, 0.7, -2.1, 0.5, 0.2, 0.06);
    if (kind === 'cab') b.box(mt.glow('#fff0a0'), 0, 1.86, -0.2, 0.7, 0.28, 0.3);
  });
}

interface StreetOpts {
  trees?: TreeKind; treeStep?: number; treeOff?: number; lamps?: boolean; lampStep?: number;
  parked?: { u: number; side: 1 | -1; color: string; kind?: 'car' | 'cab' | 'van' }[];
}
function street(b: B, mt: Mats, r: Rng, o: StreetOpts): void {
  if (o.lamps !== false) {
    const step = o.lampStep ?? 0.085;
    for (let u = 0.04; u < 0.97; u += step) {
      for (const side of [1, -1] as const) {
        const p = roadAt(u + (side === 1 ? 0 : step / 2), side * 6.4);
        if (nearSite(p.x, p.z, 1)) continue;
        lamp(b, mt, p.x, p.z, p.yaw + (side === 1 ? Math.PI / 2 : -Math.PI / 2));
      }
    }
  }
  if (o.trees && o.trees !== 'bare') {
    const step = o.treeStep ?? 0.07;
    for (let u = 0.03; u < 0.98; u += step) {
      for (const side of [1, -1] as const) {
        const p = roadAt(u + r() * 0.02, side * (o.treeOff ?? 9.5) + rr(r, -0.8, 0.8));
        if (nearSite(p.x, p.z, 1.5)) continue;
        tree(b, mt, r, o.trees, p.x, p.z, rr(r, 4.2, 6.2));
      }
    }
  }
  for (const c of o.parked ?? []) {
    const p = roadAt(c.u, c.side * 3.9);
    if (nearSite(p.x, p.z, 1)) continue;
    car(b, mt, p.x, p.z, p.yaw + (c.side === 1 ? 0 : Math.PI), c.color, c.kind ?? 'car');
  }
}

function waterBox(b: B, mt: Mats, x0: number, x1: number, z0: number, z1: number, color = '#16304f', glints = 0, r?: Rng): void {
  b.box(mt.std(color, 0.25, '#0c1c36', 0.5), (x0 + x1) / 2, 0, (z0 + z1) / 2, x1 - x0, 0.14, z1 - z0);
  if (r) {
    const gl = mt.glow('#ffcf90');
    for (let i = 0; i < glints; i++) {
      b.box(gl, rr(r, x0, x1), 0.1, rr(r, z0, z1), rr(r, 0.2, 0.5), 0.05, rr(r, 2, 7));
    }
  }
}

function mound(b: B, m: THREE.Material, x: number, z: number, rx: number, h: number, rz: number): void {
  b.ball(m, x, 0, z, 1, rx, h, rz, 14, 8);
}

function waterTank(b: B, mt: Mats, x: number, y: number, z: number): void {
  const wood = mt.std('#6b4a33');
  for (const [dx, dz] of [[-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]]) b.box(wood, x + dx, y, z + dz, 0.12, 1.1, 0.12);
  b.cyl(wood, x, y + 1.1, z, 0.95, 0.95, 1.7, 10);
  b.cone(mt.std('#4a3626'), x, y + 2.8, z, 1.1, 0.8, 10);
}

interface Excl { x: number; z: number; r: number }

interface ClusterOpts {
  x0: number; x1: number; z0: number; z1: number; n: number; hMin: number; hMax: number; wMin: number; wMax: number;
  mats: THREE.Material[]; roof: THREE.Material; excl: Excl[]; tank?: boolean; spires?: boolean; bias?: number; setbacks?: number;
}
function cluster(b: B, mt: Mats, r: Rng, o: ClusterOpts): void {
  const placed: Excl[] = [...o.excl];
  const glowTop = mt.glow('#ffe1b0');
  let tries = 0;
  let count = 0;
  while (count < o.n && tries++ < o.n * 40) {
    const x = rr(r, o.x0, o.x1), z = rr(r, o.z0, o.z1);
    const w = rr(r, o.wMin, o.wMax), d = rr(r, o.wMin, o.wMax);
    const rad = Math.max(w, d) * 0.6;
    if (placed.some((p) => Math.hypot(p.x - x, p.z - z) < p.r + rad + 0.4)) continue;
    placed.push({ x, z, r: rad });
    count++;
    const cx = (o.x0 + o.x1) / 2, cz = (o.z0 + o.z1) / 2;
    const centre = 1 - Math.min(1, Math.hypot((x - cx) / ((o.x1 - o.x0) / 2), (z - cz) / ((o.z1 - o.z0) / 2)));
    const h = lerp(o.hMin, o.hMax, Math.pow(r(), 1.4) * (0.35 + 0.65 * Math.min(1, centre * (o.bias ?? 1.4))));
    const mat = pick(r, o.mats);
    const tiers = (o.setbacks ?? 2) > 0 && h > 16 && r() < 0.55 ? 2 + Math.floor(r() * 2) : 1;
    let y = 0, ww = w, dd = d;
    for (let t = 0; t < tiers; t++) {
      const th = t === tiers - 1 ? h - y : (h - y) * rr(r, 0.45, 0.6);
      b.box(mat, x, y, z, ww, th, dd);
      y += th;
      ww *= 0.78;
      dd *= 0.78;
    }
    b.box(o.roof, x, y, z, ww * 0.9, 0.5, dd * 0.9);
    if (r() < 0.6) b.box(o.roof, x + rr(r, -0.5, 0.5), y + 0.5, z, ww * 0.4, 0.9, dd * 0.4);
    if (o.tank && r() < 0.35) waterTank(b, mt, x + rr(r, -ww / 4, ww / 4), y + 0.5, z + rr(r, -dd / 4, dd / 4));
    if (o.spires && r() < 0.3) { b.cyl(o.roof, x, y + 0.5, z, 0.05, 0.12, rr(r, 3, 6), 4); }
    if (h > o.hMax * 0.75 && r() < 0.6) b.box(glowTop, x, y - 0.4, z, w * 0.5 * 0.78, 0.25, d * 0.5 * 0.78 + 0.02);
  }
}

type Pt3 = [number, number, number];
function bez(p0: Pt3, p1: Pt3, p2: Pt3, n: number): Pt3[] {
  const out: Pt3[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    out.push([u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1], u * u * p0[2] + 2 * u * t * p1[2] + t * t * p2[2]]);
  }
  return out;
}
function line(a: Pt3, c: Pt3, n: number): Pt3[] {
  const out: Pt3[] = [];
  for (let i = 0; i <= n; i++) out.push([lerp(a[0], c[0], i / n), lerp(a[1], c[1], i / n), lerp(a[2], c[2], i / n)]);
  return out;
}

function deck(b: B, mt: Mats, r: Rng, pts: Pt3[], w: number, pierEvery = 2, lights = true): void {
  const conc = mt.std('#6d6f74', 0.9);
  const barrier = mt.std('#8c8e93', 0.9);
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], c = pts[i + 1];
    b.beam(conc, a[0], a[1], a[2], c[0], c[1], c[2], w, 0.7);
    const dx = c[0] - a[0], dz = c[2] - a[2];
    const hl = Math.hypot(dx, dz) || 1;
    const nx = -dz / hl, nz = dx / hl;
    for (const s of [1, -1]) {
      const o = (w / 2 - 0.15) * s;
      b.beam(barrier, a[0] + nx * o, a[1] + 0.6, a[2] + nz * o, c[0] + nx * o, c[1] + 0.6, c[2] + nz * o, 0.3, 0.6);
    }
    if (i % pierEvery === 0 && a[1] > 1.5) {
      b.box(conc, a[0], 0, a[2], 1.3, a[1] - 0.35, 1.3);
      b.box(conc, a[0], a[1] - 0.8, a[2], w + 0.8, 0.5, 1.2, Math.atan2(dx, dz) + Math.PI / 2);
    }
    if (lights && r() < 0.55) {
      const t = r();
      const px = lerp(a[0], c[0], t) + nx * (r() < 0.5 ? 1.5 : -1.5), pz = lerp(a[2], c[2], t) + nz * (r() < 0.5 ? 1.5 : -1.5);
      const py = lerp(a[1], c[1], t) + 0.55;
      b.box(mt.glow(r() < 0.5 ? '#ffe9b8' : '#ff3a2a'), px, py, pz, 0.5, 0.25, 0.9, Math.atan2(dx, dz));
    }
  }
}

type Interchange = 'la' | 'houston' | 'dallas';
function interchange(b: B, mt: Mats, r: Rng, cx: number, cz: number, kind: Interchange): void {
  deck(b, mt, r, line([cx - 100, 6, cz], [cx + 100, 6, cz], 20), 8);
  if (kind === 'la') {
    deck(b, mt, r, bez([cx - 60, 6, cz + 2], [cx - 15, 8.5, cz - 14], [cx + 20, 11.5, cz - 34], 10), 5);
    deck(b, mt, r, bez([cx + 60, 6, cz + 2], [cx + 15, 9, cz - 12], [cx - 22, 11.5, cz - 34], 10), 5);
    deck(b, mt, r, line([cx - 28, 11.5, cz - 34], [cx + 28, 11.5, cz - 34], 8), 7);
  } else if (kind === 'houston') {
    deck(b, mt, r, line([cx - 100, 11, cz - 10], [cx + 100, 11, cz - 10], 20), 8);
    deck(b, mt, r, bez([cx - 50, 11, cz - 10], [cx - 20, 8, cz - 2], [cx + 10, 6, cz + 4], 8), 5);
    deck(b, mt, r, line([cx + 10, 6, cz + 4], [cx + 70, 6, cz + 4], 6), 5);
    deck(b, mt, r, line([cx + 20, 16, cz - 40], [cx + 20, 16, cz + 20], 8), 7);
  } else {
    deck(b, mt, r, line([cx - 100, 10, cz - 10], [cx + 100, 10, cz - 10], 20), 7);
    deck(b, mt, r, line([cx - 18, 13.5, cz - 56], [cx - 18, 13.5, cz + 26], 12), 7);
    deck(b, mt, r, bez([cx - 18, 13.5, cz - 20], [cx + 10, 12, cz - 14], [cx + 50, 10, cz - 10], 8), 4);
    deck(b, mt, r, bez([cx - 100, 6, cz + 6], [cx - 60, 6, cz + 6], [cx - 18, 13.5, cz - 10], 8), 4);
  }
}

function track(b: B, mt: Mats, x0: number, x1: number, z: number, y: number, color: string): void {
  const steel = mt.std(color, 0.7);
  b.box(steel, (x0 + x1) / 2, y, z, x1 - x0, 0.7, 4.4);
  b.box(mt.std('#1e2229'), (x0 + x1) / 2, y + 0.7, z, x1 - x0, 0.12, 3.8);
  for (const s of [-1.1, 1.1]) b.box(mt.std('#9aa0aa', 0.4), (x0 + x1) / 2, y + 0.82, z + s, x1 - x0, 0.1, 0.12);
  for (let x = x0 + 4; x < x1; x += 9) {
    for (const s of [-1.7, 1.7]) b.box(steel, x, 0, z + s, 0.7, y, 0.7);
    b.box(steel, x, y - 0.6, z, 0.9, 0.6, 4.6);
  }
}

function train(b: B, mt: Mats, x: number, y: number, z: number, cars: number, body: string, stripe: string, ry = Math.PI / 2): void {
  b.with(x, y + 0.85, z, ry, () => {
    for (let i = 0; i < cars; i++) {
      const zc = i * 5.2;
      b.box(mt.std(body, 0.35), 0, 0, zc, 2.6, 2.3, 5);
      b.box(mt.std(stripe, 0.4, stripe, 0.3), 0, 0.5, zc, 2.64, 0.35, 5.02);
      b.box(mt.glow('#ffe2a8'), 0, 1.15, zc, 2.66, 0.7, 4.3);
      b.box(mt.std('#20242c'), 0, -0.25, zc, 2.0, 0.3, 4.2);
    }
    b.box(mt.glow('#fff4d0'), 0, 0.6, -2.55, 1.0, 0.35, 0.06);
  });
}

interface RowOpts { w: number; d: number; hMin: number; hMax: number; colors: string[]; roof: 'flat' | 'gable'; stoop: boolean; bay: boolean; tank?: boolean; lit?: number; trim?: string }
function rowhouses(b: B, mt: Mats, r: Rng, x0: number, z: number, n: number, o: RowOpts): void {
  const trim = mt.std(o.trim ?? '#d8cfbf', 0.8);
  for (let i = 0; i < n; i++) {
    const h = rr(r, o.hMin, o.hMax);
    const x = x0 + (i + 0.5) * o.w;
    const wall = mt.glass(pick(r, o.colors), 0.7, o.lit ?? 1);
    b.box(wall, x, 0, z, o.w - 0.05, h, o.d);
    b.box(trim, x, h, z + 0.1, o.w + 0.05, 0.4, o.d + 0.2);
    if (o.roof === 'gable') b.prism(mt.std(pick(r, ['#5a4a46', '#4a5058', '#6a4a3e'])), x, h + 0.4, z, o.w + 0.1, o.d + 0.2, o.w * 0.45);
    if (o.stoop) {
      b.box(trim, x, 0, z + o.d / 2 + 0.5, 1.3, 0.8, 1.0);
      b.box(trim, x, 0, z + o.d / 2 + 1.2, 1.3, 0.4, 0.5);
      b.box(mt.glow('#ffd49a'), x, 0.8, z + o.d / 2 + 0.03, 0.7, 1.4, 0.08);
    }
    if (o.bay) b.box(wall, x, 1.1, z + o.d / 2 + 0.4, o.w * 0.5, h * 0.55, 0.8);
    if (o.tank && r() < 0.3) waterTank(b, mt, x, h + 0.4, z);
  }
}

function archOpening(b: B, m: THREE.Material, x: number, y: number, z: number, w: number, h: number, depth: number): void {
  b.box(m, x, y, z, w, h - w / 2, depth);
  b.put(new THREE.CylinderGeometry(w / 2, w / 2, depth, 10), m, x, y + h - w / 2, z, 0, Math.PI / 2);
}

function gothicWin(b: B, m: THREE.Material, x: number, y: number, z: number, w: number, h: number): void {
  b.box(m, x, y, z, w, h, 0.12);
  b.prism(m, x, y + h, z, w, 0.12, w * 0.9);
}

function column(b: B, m: THREE.Material, x: number, y: number, z: number, r: number, h: number): void {
  b.cyl(m, x, y, z, r, r * 1.08, h, 8);
}

// ------------------------------------------------------------------ cities

function nyc(b: B, mt: Mats, r: Rng): void {
  const stone = mt.glass('#bdb6a4', 0.75, 0.8);
  const steel = mt.std('#d5dbe3', 0.35, '#8a96a8', 0.4);
  const warmLight = mt.glow('#ffe0a8');
  const red = mt.glow('#ff3a30');
  const roof = mt.std('#33383f');
  const excl: Excl[] = [];

  // Empire State Building
  const ex = 14, ez = -86;
  let y = 0;
  const tiers: Pt3[] = [[15, 8, 6], [11.5, 6.4, 8], [8.6, 5.2, 7], [6.4, 4.2, 9], [4.8, 3.4, 4.5], [3.4, 2.8, 3]];
  tiers.forEach(([w, d, h], i) => {
    b.box(stone, ex, y, ez, w, h, d);
    y += h;
    if (i >= 3) b.box(warmLight, ex, y - 0.4, ez, w + 0.14, 0.3, d + 0.14);
  });
  b.frus(warmLight, ex, y, ez, 2.4, 2.0, 1.2, 1.0, 3.2);
  b.cyl(steel, ex, y + 3.2, ez, 0.1, 0.34, 6.2, 6);
  b.ball(red, ex, y + 9.5, ez, 0.2);
  excl.push({ x: ex, z: ez, r: 9 });

  // Chrysler Building
  const cx = 38, cz = -78;
  const chry = mt.glass('#a8a69a', 0.8, 0.7);
  y = 0;
  for (const [w, h] of [[9.5, 7], [7.8, 8], [6.2, 7]] as [number, number][]) { b.box(chry, cx, y, cz, w, h, w); y += h; }
  b.frus(steel, cx, y, cz, 3.6, 3.6, 1.0, 1.0, 12);
  const archM = mt.glow('#dbe6f6');
  for (let j = 0; j < 4; j++) {
    const R = 3.4 - j * 0.75;
    for (let a = 0; a < 4; a++) {
      b.put(new THREE.TorusGeometry(R, 0.13, 5, 14, Math.PI), archM, cx, y + j * 2.5, cz, (a * Math.PI) / 4);
      b.put(new THREE.TorusGeometry(R * 0.6, 0.1, 5, 12, Math.PI), archM, cx, y + j * 2.5, cz, (a * Math.PI) / 4);
    }
  }
  b.cyl(steel, cx, y + 10, cz, 0.05, 0.22, 8, 5);
  b.ball(warmLight, cx, y + 18.2, cz, 0.2);
  excl.push({ x: cx, z: cz, r: 7 });

  // One World Trade Center
  const wx = -20, wz = -102;
  const wtc = mt.glass('#a9bdd6', 0.85, 0.7);
  b.box(mt.std('#59606b', 0.7), wx, 0, wz, 8.4, 3.6, 8.4);
  const sq0 = regpoly(4, 3.0, 0), oct = regpoly(8, 3.0, 0), sq45 = regpoly(4, 3.0, Math.PI / 4);
  const rings: V3[][] = [];
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    const s = t < 0.5 ? morph(sq0, oct, t * 2) : morph(oct, sq45, (t - 0.5) * 2);
    rings.push(ringAt(s, 3.6 + t * 36.5, 16));
  }
  b.loft(wtc, rings, wx, 0, wz);
  b.box(warmLight, wx, 39.6, wz, 4.6, 0.3, 4.6, Math.PI / 4);
  b.cyl(steel, wx, 40.1, wz, 0.1, 0.36, 12.5, 6);
  b.ball(warmLight, wx, 52.7, wz, 0.26);
  excl.push({ x: wx, z: wz, r: 7 });

  // slanted-top tower (Citigroup Center style)
  b.frus(mt.glass('#98a3b0', 0.8, 0.7), -3, 0, -112, 6.6, 6.6, 6.6, 6.6, 29, 0, (x) => x * 0.95 + 3);
  excl.push({ x: -3, z: -112, r: 5 });
  // slim pencil tower
  b.box(mt.glass('#d7d3c8', 0.7, 0.6), 54, 0, -100, 3.4, 44, 3.4);
  excl.push({ x: 54, z: -100, r: 3 });

  const glasses = [mt.glass('#5b6475', 0.85), mt.glass('#6c7686', 0.85), mt.glass('#48505e', 0.85), mt.glass('#7b7568', 0.8), mt.glass('#8d939c', 0.8)];
  cluster(b, mt, r, { x0: -8, x1: 66, z0: -122, z1: -64, n: 30, hMin: 12, hMax: 34, wMin: 4.2, wMax: 8, mats: glasses, roof, excl, tank: true, spires: true });
  cluster(b, mt, r, { x0: -52, x1: -8, z0: -124, z1: -70, n: 12, hMin: 9, hMax: 22, wMin: 4, wMax: 7, mats: glasses, roof, excl, tank: true });
  cluster(b, mt, r, { x0: -10, x1: 70, z0: -165, z1: -125, n: 14, hMin: 10, hMax: 30, wMin: 5, wMax: 9, mats: glasses, roof, excl, tank: true });

  // East River + Brooklyn Bridge
  waterBox(b, mt, -112, -28, -175, -45, '#162c4a', 55, r);
  const gr = mt.std('#8b7e6c', 0.9, '#3a3228', 0.3);
  const cable = mt.std('#2a2a2e', 0.5);
  const T1 = -98, T2 = -42, bz = -62, ty = 24, dy = 8.6;
  for (const tx of [T1, T2]) {
    b.box(gr, tx, 0, bz, 3.8, ty - 2.5, 5.2);
    b.box(gr, tx, ty - 2.5, bz, 4.2, 0.6, 5.6);
    b.prism(gr, tx, ty - 1.9, bz, 3.4, 5.0, 1.8, 0);
    for (const s of [-1, 1]) {
      const dark = mt.glow('#ffcf8a');
      b.box(mt.std('#1a1814'), tx, dy - 0.2, bz + s * 2.64, 1.5, 5.4, 0.1);
      b.prism(mt.std('#1a1814'), tx, dy + 5.2, bz + s * 2.64, 1.5, 0.1, 2.2, Math.PI / 2 * 0 );
      b.box(dark, tx, 14, bz + s * 2.66, 0.3, 4, 0.08);
      b.box(dark, tx, 19, bz + s * 2.66, 0.3, 3, 0.08);
    }
  }
  b.box(mt.std('#4a4a50', 0.6), -70, dy - 0.3, bz, 118, 0.6, 4.6);
  b.box(mt.std('#4a4a50', 0.6), -70, dy + 0.3, bz, 118, 0.1, 4.7);
  const mid = (T1 + T2) / 2, half = (T2 - T1) / 2;
  const sag = (x: number): number => 11.6 + (ty - 11.6) * Math.pow((x - mid) / half, 2);
  for (const s of [-1.9, 1.9]) {
    let px = T1;
    for (let x = T1 + 2.8; x <= T2 + 0.01; x += 2.8) { b.beam(cable, px, sag(px), bz + s, x, sag(x), bz + s, 0.16); px = x; }
    for (let x = T1 + 2.8; x < T2 - 1; x += 2.8) b.beam(cable, x, sag(x), bz + s, x, dy + 0.3, bz + s, 0.06);
    b.beam(cable, T1, ty - 1, bz + s, -127, dy + 1, bz + s, 0.16);
    b.beam(cable, T2, ty - 1, bz + s, -14, dy + 1, bz + s, 0.16);
    for (const [tx, dir] of [[T1, -1], [T2, 1]] as [number, number][]) {
      for (let k = 1; k <= 7; k++) b.beam(cable, tx, ty - 1.5, bz + s, tx + dir * k * 5.2, dy + 0.4, bz + s, 0.05);
    }
  }
  // brownstones
  const brown = ['#7a4b3a', '#6f4436', '#8a5a44', '#5e3b30', '#8d6a52'];
  rowhouses(b, mt, r, 16, -36, 11, { w: 4.3, d: 9, hMin: 6.2, hMax: 8, colors: brown, roof: 'flat', stoop: true, bay: false, tank: true, trim: '#c9b9a0' });
  rowhouses(b, mt, r, -66, -36, 11, { w: 4.3, d: 9, hMin: 6.2, hMax: 8, colors: brown, roof: 'flat', stoop: true, bay: false, tank: true, trim: '#c9b9a0' });

  // street level
  street(b, mt, r, { trees: 'oak', treeStep: 0.12, treeOff: 8.2, parked: [{ u: 0.18, side: 1, color: '#f6c21a', kind: 'cab' }, { u: 0.5, side: -1, color: '#f6c21a', kind: 'cab' }, { u: 0.62, side: 1, color: '#f6c21a', kind: 'cab' }, { u: 0.8, side: -1, color: '#f6c21a', kind: 'cab' }, { u: 0.35, side: 1, color: '#2c3a52' }] });
  for (const [u, side] of [[0.3, -1], [0.7, 1]] as [number, 1 | -1][]) {
    const p = roadAt(u, side * 7.6);
    b.cyl(mt.std('#1f2a24'), p.x, 0, p.z, 0.07, 0.07, 3.2, 5);
    b.ball(mt.glow('#40ff88'), p.x, 3.3, p.z, 0.26, 1, 1, 1, 6, 5);
  }
}

function chicago(b: B, mt: Mats, r: Rng): void {
  const steel = mt.std('#8d939c', 0.4, '#454a52', 0.3);
  const red = mt.glow('#ff3a30');
  const roof = mt.std('#2b2f36');
  const excl: Excl[] = [];

  // Willis Tower
  const wx = -28, wz = -98, tw = 3.8;
  const wglass = mt.glass('#23262d', 0.7, 0.45);
  const band = mt.std('#6b7078', 0.5);
  const H: Record<number, number> = { 50: 24, 66: 32, 90: 43, 108: 52 };
  const grid = [[66, 90, 108], [50, 90, 108], [50, 66, 90]];
  grid.forEach((row, ri) => row.forEach((f, ci) => {
    const x = wx + (ci - 1) * tw, z = wz + (ri - 1) * tw;
    b.box(wglass, x, 0, z, tw - 0.04, H[f], tw - 0.04);
    b.box(band, x, H[f] - 0.4, z, tw, 0.5, tw);
    if (f === 108) {
      b.cyl(steel, x, H[f], z, 0.08, 0.14, 8.5, 5);
      b.ball(red, x, H[f] + 8.7, z, 0.16);
    }
  }));
  for (const yy of [16, 29, 41]) b.box(band, wx, yy, wz, tw * 3 + 0.1, 0.7, tw * 3 + 0.1);
  excl.push({ x: wx, z: wz, r: 8.5 });

  // John Hancock Center
  const hx = 46, hz = -84;
  const hg = mt.glass('#161920', 0.7, 0.45);
  const wB = 9.4, dB = 6.4, wT = 5.8, dT = 4.0, hh = 44;
  b.frus(hg, hx, 0, hz, wB, dB, wT, dT, hh);
  const brace = mt.std('#9aa1ab', 0.5, '#4a5058', 0.4);
  const wAt = (t: number): number => lerp(wB, wT, t) / 2 + 0.12;
  const dAt = (t: number): number => lerp(dB, dT, t) / 2 + 0.12;
  const secs = 4;
  for (let s = 0; s < secs; s++) {
    const t0 = s / secs, t1 = (s + 1) / secs;
    const y0 = t0 * hh, y1 = t1 * hh;
    for (const f of [1, -1]) {
      b.beam(brace, hx - wAt(t0), y0, hz + f * dAt(t0), hx + wAt(t1), y1, hz + f * dAt(t1), 0.26);
      b.beam(brace, hx + wAt(t0), y0, hz + f * dAt(t0), hx - wAt(t1), y1, hz + f * dAt(t1), 0.26);
      b.beam(brace, hx + f * wAt(t0), y0, hz - dAt(t0), hx + f * wAt(t1), y1, hz + dAt(t1), 0.26);
      b.beam(brace, hx + f * wAt(t0), y0, hz + dAt(t0), hx + f * wAt(t1), y1, hz - dAt(t1), 0.26);
    }
    b.box(brace, hx, y1 - 0.3, hz, wAt(t1) * 2, 0.5, dAt(t1) * 2);
  }
  b.box(roof, hx, hh, hz, wT, 1.2, dT);
  for (const s of [-1.3, 1.3]) {
    b.cyl(steel, hx + s, hh + 1.2, hz, 0.08, 0.16, 8.5, 5);
    b.ball(red, hx + s, hh + 9.8, hz, 0.15);
  }
  excl.push({ x: hx, z: hz, r: 6 });

  // Trump International stepped tower
  const tx = -2, tz = -74;
  const tg = mt.glass('#9fb2c6', 0.85, 0.7);
  let y = 0;
  for (const [w, h] of [[8.6, 14], [7.2, 11], [5.9, 10], [4.6, 8]] as [number, number][]) {
    b.box(tg, tx, y, tz, w, h, w);
    y += h;
    b.box(mt.glow('#e8f0ff'), tx, y - 0.3, tz, w + 0.1, 0.22, w + 0.1);
  }
  b.cyl(steel, tx, y, tz, 0.08, 0.5, 9, 6);
  excl.push({ x: tx, z: tz, r: 6 });
  // Aon style pale slab
  b.box(mt.glass('#d4d4cc', 0.7, 0.6), 22, 0, -100, 6.6, 42, 9);
  excl.push({ x: 22, z: -100, r: 6 });

  const glasses = [mt.glass('#3b4452', 0.85), mt.glass('#586272', 0.85), mt.glass('#2f3640', 0.85), mt.glass('#74808f', 0.8), mt.glass('#4a4038', 0.8)];
  cluster(b, mt, r, { x0: -62, x1: 70, z0: -128, z1: -68, n: 40, hMin: 10, hMax: 34, wMin: 4.4, wMax: 8.5, mats: glasses, roof, excl });
  cluster(b, mt, r, { x0: -70, x1: 80, z0: -172, z1: -132, n: 20, hMin: 8, hMax: 26, wMin: 5, wMax: 9, mats: glasses, roof, excl });

  // river, bascule bridges, lake
  waterBox(b, mt, -140, 140, -63, -54, '#1a3350', 40, r);
  waterBox(b, mt, 110, 300, -190, 20, '#183a5e', 90, r);
  const dk = mt.std('#3b4048', 0.7), lim = mt.std('#a8a290', 0.85);
  for (const bx of [-48, 18, 74]) {
    b.box(dk, bx, 2.2, -58.5, 5.4, 0.5, 18);
    for (const s of [-1, 1]) {
      b.box(dk, bx + s * 2.6, 2.7, -58.5, 0.16, 1.1, 18);
      for (let k = -3; k <= 3; k++) b.beam(dk, bx + s * 2.6, 2.7, -58.5 + k * 2.5, bx + s * 2.6, 3.8, -58.5 + k * 2.5 + 1.25, 0.1);
      for (const e of [-1, 1]) {
        b.box(lim, bx + s * 3.6, 0, -58.5 + e * 6.6, 2.4, 7, 2.8);
        b.box(mt.std('#5a6a60'), bx + s * 3.6, 7, -58.5 + e * 6.6, 2.8, 0.5, 3.2);
        b.box(mt.glow('#ffcf8a'), bx + s * 3.6, 4.2, -58.5 + e * 5.15, 0.8, 1.2, 0.06);
      }
    }
  }
  // elevated L
  track(b, mt, -95, 95, -28, 6.6, '#2f353d');
  train(b, mt, 8, 6.6, -28, 5, '#c5ccd4', '#d3302b');
  train(b, mt, -60, 6.6, -28, 4, '#c5ccd4', '#2a64c4');
  b.box(mt.std('#2f353d'), 40, 7.4, -30.5, 14, 0.3, 2.6);
  b.box(mt.glow('#ffd9a0'), 40, 7.7, -31.7, 14, 0.15, 0.1);
  // Ferris wheel on the lake front
  b.put(new THREE.TorusGeometry(8, 0.2, 6, 28), mt.glow('#6ec9ff'), 100, 9.5, -42);
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * TAU;
    b.beam(mt.glow('#3aa6e0'), 100, 9.5, -42, 100 + Math.cos(a) * 8, 9.5 + Math.sin(a) * 8, -42, 0.08);
    b.box(mt.glow('#ffd9a0'), 100 + Math.cos(a) * 8 - 0.35, 9.5 + Math.sin(a) * 8 - 0.7, -42, 0.7, 0.7, 0.7);
  }
  b.beam(steel, 100, 9.5, -42, 94, 0, -42, 0.3);
  b.beam(steel, 100, 9.5, -42, 106, 0, -42, 0.3);

  street(b, mt, r, { trees: 'oak', treeStep: 0.12, treeOff: 8.2, parked: [{ u: 0.2, side: 1, color: '#9a2a2a' }, { u: 0.45, side: -1, color: '#2e3d55' }, { u: 0.7, side: 1, color: '#d9d9d9' }, { u: 0.86, side: -1, color: '#4d5a4a' }] });
}

function la(b: B, mt: Mats, r: Rng): void {
  const steel = mt.std('#c9d2dc', 0.4, '#6a7584', 0.3);
  const roof = mt.std('#3a3d44');
  const warm = mt.glow('#ffe0a8');
  const excl: Excl[] = [];

  // Wilshire Grand with spire
  const wgx = -26, wgz = -86;
  const wgm = mt.glass('#8fb0cf', 0.9, 0.7);
  b.frus(wgm, wgx, 0, wgz, 7, 7, 7, 7, 39, 0, (x, z) => 3.5 - Math.max(Math.abs(x), Math.abs(z)) * 0.9 + 0.5);
  b.cone(mt.glow('#e8f2ff'), wgx, 39, wgz, 1.2, 11, 6);
  b.cyl(steel, wgx, 49, wgz, 0.05, 0.1, 3, 4);
  b.box(warm, wgx, 38, wgz, 7.2, 0.25, 7.2);
  excl.push({ x: wgx, z: wgz, r: 6.5 });
  // US Bank Tower: chamfered shaft + round stepped crown
  const ux = 4, uz = -102;
  const ug = mt.glass('#86a6c8', 0.9, 0.7);
  const rings: V3[][] = [];
  for (let i = 0; i <= 2; i++) rings.push(ringAt(chamfered(3.6, 4.6), i * 16.5, 16));
  b.loft(ug, rings, ux, 0, uz, false);
  b.cyl(ug, ux, 33, uz, 3.5, 3.5, 5, 16);
  b.cyl(ug, ux, 38, uz, 3.0, 3.2, 4.2, 16);
  b.cyl(ug, ux, 42.2, uz, 2.2, 2.6, 3, 16);
  b.cyl(warm, ux, 45.2, uz, 1.5, 1.5, 0.8, 12);
  b.cyl(warm, ux, 33, uz, 3.65, 3.65, 0.28, 16);
  b.cyl(warm, ux, 38, uz, 3.25, 3.25, 0.24, 16);
  excl.push({ x: ux, z: uz, r: 6 });
  // Gas Company Tower: notched crown
  const gx = -8, gz = -112;
  const gg = mt.glass('#7c92aa', 0.85, 0.7);
  b.box(gg, gx, 0, gz, 6.4, 30, 6.4);
  b.box(gg, gx - 1.1, 30, gz, 4.2, 4, 6.4);
  b.box(gg, gx + 1.1, 30, gz, 4.2, 7, 6.4);
  b.box(gg, gx - 1.5, 34, gz, 2.8, 4, 5);
  b.box(warm, gx, 29.8, gz, 6.5, 0.22, 6.5);
  excl.push({ x: gx, z: gz, r: 5.5 });
  // City Hall stepped pyramid
  const chx = 30, chz = -70;
  const cw = mt.glass('#e8e1cf', 0.7, 0.5), cwp = mt.std('#e8e1cf', 0.7, '#6a6455', 0.35);
  b.box(cw, chx, 0, chz, 16, 8, 8);
  b.box(cwp, chx, 8, chz, 11, 3, 6.5);
  b.box(cw, chx, 11, chz, 6.5, 10, 6.5);
  b.box(cwp, chx, 21, chz, 6.9, 0.6, 6.9);
  [[5.2, 2.2, 21.6], [4, 2.2, 23.8], [2.9, 2, 26], [1.9, 2, 28]].forEach(([w, h, yy]) => b.box(cwp, chx, yy, chz, w, h, w));
  b.cone(cwp, chx, 30, chz, 1.1, 3, 4);
  for (let k = -3; k <= 3; k++) column(b, cwp, chx + k * 1.8, 0, chz + 4.4, 0.28, 8);
  excl.push({ x: chx, z: chz, r: 9 });
  // Bonaventure-style cylinders
  const bx = -52, bz = -80;
  const bg = mt.glass('#9aa8b8', 0.8, 0.6);
  b.cyl(bg, bx, 0, bz, 3.4, 3.4, 20, 14);
  for (const [dx, dz] of [[-5.4, 0], [5.4, 0], [0, -5.4], [0, 5.4]]) b.cyl(bg, bx + dx, 0, bz + dz, 2.2, 2.2, 14, 12);
  excl.push({ x: bx, z: bz, r: 8 });

  const glasses = [mt.glass('#7f94ab', 0.85), mt.glass('#a2a9b3', 0.8), mt.glass('#6b7c92', 0.85), mt.glass('#c2b9a6', 0.7)];
  cluster(b, mt, r, { x0: -62, x1: 56, z0: -126, z1: -66, n: 28, hMin: 8, hMax: 28, wMin: 4.5, wMax: 8.5, mats: glasses, roof, excl });

  // distant hills, Hollywood sign and the San Gabriels
  const hillM = mt.std('#5e5a3c', 1);
  const hillM2 = mt.std('#6f6a46', 1);
  const hx = -88, hz = -186, hrx = 72, hry = 24, hrz = 32;
  mound(b, hillM, hx, hz, hrx, hry, hrz);
  mound(b, hillM2, hx + 70, hz - 4, 50, 15, 26);
  mound(b, hillM2, hx - 70, hz + 4, 50, 17, 28);
  mound(b, hillM, 60, -170, 70, 12, 24);
  const sz = -158;
  const sy = hry * Math.sqrt(Math.max(0, 1 - ((sz - hz) / hrz) ** 2)) - 1.2;
  pixelText(b, mt.std('#f0f2f4', 0.6, '#cfd6e0', 0.55), 'HOLLYWOOD', hx, sy, sz, 1.2, 0, 0.9);
  const mtn = mt.std('#4c4866', 1);
  const snow = mt.std('#bdb8d0', 1, '#6a6680', 0.3);
  const mr = mk(77);
  for (let i = 0; i < 24; i++) {
    const x = -300 + i * 26 + rr(mr, -8, 8);
    const h = rr(mr, 30, 62), rad = rr(mr, 36, 56);
    b.cone(mtn, x, -2, -250 + rr(mr, -12, 12), rad, h, 5);
    if (h > 50) b.cone(snow, x, -2 + h * 0.7, -250, rad * 0.3, h * 0.3, 5);
  }

  // freeway interchange, palms, street
  interchange(b, mt, r, -10, -32, 'la');
  for (let i = 0; i < 22; i++) {
    const x = -75 + i * 7;
    if (Math.abs(x) < 3) continue;
    tree(b, mt, r, 'palm', x, -27 + rr(r, -0.6, 0.6), rr(r, 7, 9.5));
  }
  street(b, mt, r, { trees: 'palm', treeStep: 0.1, treeOff: 8.2, parked: [{ u: 0.22, side: 1, color: '#c9ced6' }, { u: 0.5, side: -1, color: '#b3322f' }, { u: 0.72, side: 1, color: '#e2a52a' }, { u: 0.4, side: 1, color: '#1d3b66' }] });
}

function houston(b: B, mt: Mats, r: Rng): void {
  const roof = mt.std('#33373e');
  const warm = mt.glow('#ffe0a8');
  const excl: Excl[] = [];

  // JPMorgan Chase Tower: tall plain rectangle
  const jx = 0, jz = -98;
  b.box(mt.glass('#b9bcc2', 0.8, 0.6), jx, 0, jz, 6.8, 49, 6.8);
  b.box(warm, jx, 48.7, jz, 6.9, 0.35, 6.9);
  excl.push({ x: jx, z: jz, r: 6 });
  // Wells Fargo Plaza: angled glass top
  const wx = -30, wz = -92;
  b.frus(mt.glass('#4f8a7a', 0.9, 0.7), wx, 0, wz, 7, 7, 7, 7, 40, 0, (x) => (x + 3.5) * 1.15);
  b.box(mt.glow('#bfffe8'), wx, 39.6, wz, 7.1, 0.2, 7.1);
  excl.push({ x: wx, z: wz, r: 6 });
  // Bank of America Center: pink stepped gables
  const bx = 28, bz = -76;
  const pink = mt.glass('#c58f84', 0.8, 0.7);
  const pinkR = mt.std('#b07a70', 0.8, '#5a3028', 0.25);
  let y = 0;
  for (const [w, d, h] of [[9, 7, 10], [7.6, 5.8, 9], [6.2, 4.7, 8], [4.8, 3.8, 7]] as Pt3[]) {
    b.box(pink, bx, y, bz, w, h, d);
    y += h;
    b.prism(pinkR, bx, y, bz, w, d, 2.6);
    b.prism(pinkR, bx, y, bz, d, w, 2.4, Math.PI / 2);
  }
  b.cone(pinkR, bx, y, bz, 2.2, 6, 4);
  b.box(warm, bx, y - 0.4, bz, 4.9, 0.2, 3.9);
  excl.push({ x: bx, z: bz, r: 7 });
  // Pennzoil Place: twin sloped trapezoids
  const px = -62, pz = -82;
  const pg = mt.glass('#6e5a46', 0.8, 0.6);
  b.frus(pg, px - 3.6, 0, pz, 6.4, 8.6, 6.4, 8.6, 30, 0, (x) => (x + 3.2) * 0.95);
  b.frus(pg, px + 3.6, 0, pz, 6.4, 8.6, 6.4, 8.6, 30, 0, (x) => (3.2 - x) * 0.95);
  excl.push({ x: px, z: pz, r: 8 });
  // Williams Tower
  b.cyl(mt.glass('#8a96a4', 0.8, 0.6), 54, 0, -102, 3.4, 3.4, 40, 14);
  b.cyl(warm, 54, 40, -102, 3.4, 3.4, 0.3, 14);
  b.cone(mt.std('#8a96a4'), 54, 40.3, -102, 3.4, 4, 14);
  excl.push({ x: 54, z: -102, r: 5 });

  const glasses = [mt.glass('#6f7885', 0.85), mt.glass('#8a8f96', 0.8), mt.glass('#59626f', 0.85), mt.glass('#7d9096', 0.85), mt.glass('#a4aab2', 0.8)];
  cluster(b, mt, r, { x0: -78, x1: 74, z0: -130, z1: -66, n: 32, hMin: 8, hMax: 28, wMin: 4.5, wMax: 8.5, mats: glasses, roof, excl });

  interchange(b, mt, r, 0, -34, 'houston');
  // refinery glow far away
  const tank = mt.std('#8c929a', 0.7);
  const rf = mk(5);
  for (let i = 0; i < 9; i++) {
    const x = 70 + i * 9 + rr(rf, -2, 2), z = -210 + rr(rf, -8, 8);
    const h = rr(rf, 10, 22);
    b.cyl(tank, x, 0, z, 0.8, 1.2, h, 7);
    for (let k = 0; k < 4; k++) b.ball(mt.glow(k % 2 ? '#fff0c8' : '#ffb04a'), x, 2 + k * (h / 4.5), z + 1.1, 0.28, 1, 1, 1, 4, 3);
  }
  for (let i = 0; i < 6; i++) b.cyl(tank, 75 + i * 11, 0, -200, 4, 4, 5, 12);
  b.cyl(tank, 120, 0, -218, 0.3, 0.4, 30, 5);
  b.ball(mt.glow('#ff9a2e'), 120, 31, -218, 1.1, 1, 1.6, 1);
  b.ball(mt.glow('#ffd070'), 120, 31, -218, 0.6, 1, 1.6, 1);
  for (let i = 0; i < 40; i++) b.box(mt.glow(r() < 0.5 ? '#ffd9a0' : '#fff6e0'), rr(r, 60, 150), rr(r, 0.5, 4), rr(r, -224, -196), 0.3, 0.3, 0.3);

  street(b, mt, r, { trees: 'oak', treeStep: 0.1, treeOff: 8.5, parked: [{ u: 0.2, side: 1, color: '#d6d9de' }, { u: 0.55, side: -1, color: '#6d1f24' }, { u: 0.8, side: 1, color: '#2b3a4a', kind: 'van' }] });
}

function bayarea(b: B, mt: Mats, r: Rng): void {
  const orange = mt.std('#c43a1c', 0.55, '#7a1e08', 0.45);
  const roof = mt.std('#4a4d55');
  const steel = mt.std('#d9dde3', 0.4, '#667080', 0.3);
  const excl: Excl[] = [];

  // Bay
  waterBox(b, mt, -150, 40, -185, -62, '#183656', 80, r);
  // Golden Gate Bridge
  const T1 = -88, T2 = -16, bz = -100, th = 29, dy = 10.5;
  for (const tx of [T1, T2]) {
    for (const s of [-2.4, 2.4]) {
      b.frus(orange, tx, 0, bz + s, 2.0, 1.7, 1.2, 1.1, th);
    }
    for (const yy of [11.5, 15.5, 19.5, 23.5, 27.4]) b.box(orange, tx, yy, bz, 1.2, 1.0, 5.6);
    b.beam(orange, tx, 11.5, bz - 2.4, tx, 19.5, bz + 2.4, 0.4);
    b.beam(orange, tx, 11.5, bz + 2.4, tx, 19.5, bz - 2.4, 0.4);
    b.beam(orange, tx, 19.5, bz - 2.4, tx, 27.4, bz + 2.4, 0.4);
    b.beam(orange, tx, 19.5, bz + 2.4, tx, 27.4, bz - 2.4, 0.4);
    b.box(orange, tx, th, bz, 1.4, 0.5, 6.2);
  }
  const deckM = mt.std('#a8321a', 0.6, '#4a1608', 0.3);
  b.box(deckM, -30, dy - 0.5, bz, 170, 0.8, 4.4);
  b.box(deckM, -30, dy + 0.3, bz, 170, 0.9, 0.2);
  const mid = (T1 + T2) / 2, half = (T2 - T1) / 2;
  const sag = (x: number): number => dy + 1.6 + (th - 1 - dy - 1.6) * Math.pow((x - mid) / half, 2);
  for (const s of [-2.3, 2.3]) {
    let px = T1;
    for (let x = T1 + 2.4; x <= T2 + 0.01; x += 2.4) { b.beam(orange, px, sag(px), bz + s, x, sag(x), bz + s, 0.22); px = x; }
    for (let x = T1 + 2.4; x < T2 - 1; x += 2.4) b.beam(orange, x, sag(x), bz + s, x, dy, bz + s, 0.07);
    const side = (tx: number, ex: number): void => {
      const n = 10;
      let ppx = tx, ppy = th - 1;
      for (let i = 1; i <= n; i++) {
        const t = i / n;
        const x = lerp(tx, ex, t), yy = lerp(th - 1, dy + 1, t) - Math.sin(t * Math.PI) * 1.2;
        b.beam(orange, ppx, ppy, bz + s, x, yy, bz + s, 0.22);
        if (i > 1 && i < n) b.beam(orange, x, yy, bz + s, x, dy, bz + s, 0.07);
        ppx = x; ppy = yy;
      }
    };
    side(T1, -128);
    side(T2, 40);
  }
  for (let x = T1 + 6; x < T2; x += 12) b.box(mt.glow(r() < 0.5 ? '#fff0c8' : '#ff4a2a'), x, dy + 0.5, bz + rr(r, -1.3, 1.3), 0.5, 0.25, 0.9);
  b.ball(mt.glow('#ff3a30'), T1, th + 0.7, bz, 0.22);
  b.ball(mt.glow('#ff3a30'), T2, th + 0.7, bz, 0.22);

  // hills on either side
  const gold = mt.std('#7a7442', 1), green = mt.std('#4f6a3a', 1), gold2 = mt.std('#8a7f48', 1);
  mound(b, green, -135, -100, 40, 24, 34);
  mound(b, gold, -155, -80, 34, 18, 30);
  mound(b, gold2, -120, -135, 50, 16, 26);
  mound(b, gold, 56, -100, 28, 12, 34);
  mound(b, gold2, 40, -150, 90, 16, 24);
  mound(b, green, -40, -45, 70, 5, 12);
  mound(b, gold, 90, -45, 60, 6, 12);
  mound(b, gold2, 140, -110, 50, 20, 40);
  mound(b, gold, -60, -230, 140, 26, 30);
  mound(b, green, 80, -215, 120, 22, 30);

  // San Francisco skyline
  const sx = 66, sz = -112;
  const sfg = mt.glass('#c9d4de', 0.85, 0.7);
  const rings: V3[][] = [];
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    const rad = lerp(4.6, 3.1, Math.pow(t, 1.2));
    rings.push(ringAt(morph(ellipse(rad, rad), regpoly(4, rad * 0.9, 0.2), 0.0), 4 + t * 39, 16));
  }
  b.loft(sfg, rings, sx, 0, sz, false);
  b.cyl(sfg, sx, 0, sz, 4.7, 4.7, 4, 16);
  b.put(new THREE.SphereGeometry(3.1, 14, 6, 0, TAU, 0, Math.PI / 2), mt.glow('#ffe9c8'), sx, 43, sz);
  b.cyl(steel, sx, 46, sz, 0.05, 0.1, 3, 4);
  excl.push({ x: sx, z: sz, r: 6 });
  // Transamerica Pyramid
  const tx = 88, tz = -98;
  const tg = mt.glass('#e9e6de', 0.85, 0.7);
  b.frus(tg, tx, 0, tz, 7.2, 7.2, 1.7, 1.7, 34);
  b.box(tg, tx - 2.1, 14, tz, 1.1, 14, 2.2);
  b.box(tg, tx + 2.1, 14, tz, 1.1, 14, 2.2);
  b.frus(tg, tx, 34, tz, 1.7, 1.7, 0.9, 0.9, 6);
  b.cone(mt.glow('#fff1d8'), tx, 40, tz, 0.5, 8, 4);
  excl.push({ x: tx, z: tz, r: 5 });
  // Coit Tower
  b.cyl(mt.std('#e8e3d6', 0.8, '#6a665a', 0.3), 100, 0, -78, 1.0, 1.2, 10, 12);
  b.cyl(mt.std('#e8e3d6'), 100, 10, -78, 1.3, 1.1, 1, 12);
  const sfmats = [mt.glass('#c5c9cf', 0.8), mt.glass('#d9d3c7', 0.75), mt.glass('#aab3bf', 0.85), mt.glass('#e0d8c8', 0.7)];
  cluster(b, mt, r, { x0: 42, x1: 112, z0: -130, z1: -70, n: 24, hMin: 7, hMax: 22, wMin: 4, wMax: 7, mats: sfmats, roof, excl, setbacks: 0 });

  // fog bank over the strait
  const fogM = new THREE.MeshBasicMaterial({ color: '#e8d8e0', transparent: true, opacity: 0.2, depthWrite: false });
  for (const [fx, fz, fw] of [[-60, -130, 90], [-110, -110, 60], [-30, -150, 80]] as Pt3[]) {
    const f = new THREE.Mesh(new THREE.PlaneGeometry(fw, 9), fogM);
    f.position.set(fx, 15 + (fx % 3), fz);
    b.extra.add(f);
  }

  // Victorian row + eucalyptus
  rowhouses(b, mt, r, 18, -36, 9, { w: 4.4, d: 8, hMin: 8, hMax: 10, colors: ['#e7b9b0', '#b8d3c4', '#e9d79d', '#9fb6d6', '#d9a7c7', '#f0e6d2'], roof: 'gable', stoop: true, bay: true, trim: '#f4efe6' });
  rowhouses(b, mt, r, -60, -36, 9, { w: 4.4, d: 8, hMin: 8, hMax: 10, colors: ['#9fb6d6', '#e9d79d', '#e7b9b0', '#b8d3c4', '#d9a7c7'], roof: 'gable', stoop: true, bay: true, trim: '#f4efe6' });
  street(b, mt, r, { trees: 'euca', treeStep: 0.12, treeOff: 8.6, parked: [{ u: 0.24, side: 1, color: '#e9ecef' }, { u: 0.5, side: -1, color: '#b8c0c8' }, { u: 0.74, side: 1, color: '#2b4c3e' }] });
}

function dallas(b: B, mt: Mats, r: Rng): void {
  const roof = mt.std('#33383f');
  const steel = mt.std('#c3cad2', 0.4, '#5a6470', 0.3);
  const red = mt.glow('#ff3a30');
  const green = mt.glow('#46ff9a');
  const excl: Excl[] = [];

  // Reunion Tower
  const rx = -34, rz = -92;
  const conc = mt.std('#a9a9a4', 0.7, '#3a3a38', 0.3);
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * TAU;
    b.put(new THREE.CylinderGeometry(0.4, 0.55, 30, 6), conc, rx + Math.cos(a) * 1.0, 15, rz + Math.sin(a) * 1.0);
  }
  b.cyl(conc, rx, 0, rz, 1.0, 1.4, 4, 8);
  b.cyl(mt.std('#32363d'), rx, 28, rz, 3.1, 3.1, 0.7, 14);
  const ballGeo = new THREE.IcosahedronGeometry(4.7, 1).toNonIndexed();
  const col: number[] = [];
  const cr = mk(9);
  const cpal = [new THREE.Color('#9ff0ff'), new THREE.Color('#ffffff'), new THREE.Color('#ffb870'), new THREE.Color('#7fc0ff')];
  for (let i = 0; i < ballGeo.attributes.position.count; i += 3) {
    const c = cpal[Math.floor(cr() * cpal.length)];
    for (let k = 0; k < 3; k++) col.push(c.r, c.g, c.b);
  }
  ballGeo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  const ball = new THREE.Mesh(ballGeo, new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }));
  ball.position.set(rx, 34, rz);
  b.extra.add(ball);
  b.put(new THREE.TorusGeometry(4.9, 0.14, 5, 28), mt.glow('#ffffff'), rx, 34, rz, 0, Math.PI / 2);
  b.cyl(steel, rx, 38.5, rz, 0.06, 0.2, 10, 5);
  b.ball(red, rx, 48.7, rz, 0.2);
  excl.push({ x: rx, z: rz, r: 6 });

  // Bank of America Plaza: dark tower with green neon outline
  const bx = 8, bz = -100;
  const bg = mt.glass('#1c2a3a', 0.6, 0.5);
  b.box(bg, bx, 0, bz, 6.4, 34, 6.4);
  b.box(bg, bx, 34, bz, 5.4, 4, 5.4);
  b.box(bg, bx, 38, bz, 4.4, 4, 4.4);
  b.box(bg, bx, 42, bz, 3.4, 3.2, 3.4);
  b.cyl(green, bx, 45.2, bz, 0.1, 0.18, 8.5, 5);
  for (const [w, y0, h] of [[6.4, 0, 34], [5.4, 34, 4], [4.4, 38, 4], [3.4, 42, 3.2]] as Pt3[]) {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box(green, bx + (sx * w) / 2, y0, bz + (sz * w) / 2, 0.24, h, 0.24);
    for (const sx of [-1, 1]) b.box(green, bx + (sx * w) / 2, y0 + h, bz, 0.14, 0.14, w);
    for (const sz of [-1, 1]) b.box(green, bx, y0 + h, bz + (sz * w) / 2, w, 0.14, 0.14);
  }
  for (const yy of [8, 16, 25]) {
    for (const s of [-1, 1]) b.box(green, bx, yy, bz + s * 3.2, 6.4, 0.1, 0.1);
  }
  excl.push({ x: bx, z: bz, r: 6 });
  // Renaissance Tower: spiky crown
  const nx = 38, nz = -84;
  const ng = mt.glass('#9aa0a8', 0.8, 0.6);
  b.box(ng, nx, 0, nz, 6.8, 36, 6.8);
  b.box(ng, nx, 36, nz, 5, 3, 5);
  b.cone(mt.glow('#ffe8c0'), nx, 39, nz, 2.0, 6, 4);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.cone(mt.std('#c9ced6', 0.5, '#6a7078', 0.4), nx + sx * 3.0, 36, nz + sz * 3.0, 0.5, 5, 4);
  for (const s of [-1, 1]) {
    b.cone(mt.std('#c9ced6', 0.5, '#6a7078', 0.4), nx + s * 3.0, 36, nz, 0.4, 3.5, 4);
    b.cone(mt.std('#c9ced6', 0.5, '#6a7078', 0.4), nx, 36, nz + s * 3.0, 0.4, 3.5, 4);
  }
  b.box(mt.glow('#ffe1b0'), nx, 35.7, nz, 6.9, 0.22, 6.9);
  excl.push({ x: nx, z: nz, r: 6 });
  // Fountain Place: faceted prism
  b.frus(mt.glass('#3f8aa0', 0.9, 0.7), -6, 0, -78, 6, 6, 6, 6, 34, Math.PI / 5, (x, z) => (x + z) * 0.6 + 2);
  excl.push({ x: -6, z: -78, r: 5 });

  const glasses = [mt.glass('#7a8794', 0.85), mt.glass('#5d6a78', 0.85), mt.glass('#8d99a6', 0.8), mt.glass('#4a5866', 0.85), mt.glass('#9fb0b4', 0.8)];
  cluster(b, mt, r, { x0: -62, x1: 66, z0: -130, z1: -66, n: 28, hMin: 8, hMax: 28, wMin: 4.5, wMax: 8.5, mats: glasses, roof, excl, spires: true });

  interchange(b, mt, r, 0, -34, 'dallas');
  // prairie hints: silos and pylons far off
  const sil = mt.std('#b9b4a6', 0.8);
  for (let i = 0; i < 6; i++) { b.cyl(sil, -90 + i * 3, 0, -170, 1.3, 1.3, 9, 8); b.cone(sil, -90 + i * 3, 9, -170, 1.4, 1, 8); }
  for (let i = 0; i < 8; i++) {
    const x = 60 + i * 14;
    b.cyl(mt.std('#5a5f68'), x, 0, -165, 0.15, 0.25, 12, 4);
    b.box(mt.std('#5a5f68'), x, 11, -165, 6, 0.2, 0.2);
  }
  street(b, mt, r, { trees: 'oak', treeStep: 0.12, treeOff: 8.8, parked: [{ u: 0.2, side: 1, color: '#c4c8ce', kind: 'van' }, { u: 0.55, side: -1, color: '#8c2a24' }, { u: 0.8, side: 1, color: '#25324a' }] });
}

function dc(b: B, mt: Mats, r: Rng): void {
  const marble = mt.std('#f1eee4', 0.55, '#8a8472', 0.45);
  const marbleG = mt.glass('#ece8dc', 0.6, 0.5);
  const roof = mt.std('#8a8c90');

  // Capitol (faces +z)
  const kx = 14, kz = -62;
  const cap = mt.std('#f0ece0', 0.6, '#7a7464', 0.4);
  b.box(marbleG, kx, 0, kz, 12, 9, 9);
  for (const s of [-1, 1]) {
    b.box(marbleG, kx + s * 11.5, 0, kz, 12, 7, 8);
    b.box(cap, kx + s * 5.8, 0, kz, 3, 6, 6);
    b.box(cap, kx + s * 11.5, 7, kz, 12.3, 0.5, 8.3);
  }
  b.box(cap, kx, 9, kz, 12.3, 0.5, 9.3);
  for (let k = -3; k <= 3; k++) column(b, cap, kx + k * 1.55, 0, kz + 4.9, 0.34, 8.6);
  b.prism(cap, kx, 8.6, kz + 4.8, 11, 1.2, 2.2);
  b.cyl(cap, kx, 9.5, kz, 4.8, 4.8, 1.2, 20);
  b.cyl(cap, kx, 10.7, kz, 3.9, 3.9, 4.6, 20);
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * TAU;
    column(b, cap, kx + Math.cos(a) * 4.0, 10.7, kz + Math.sin(a) * 4.0, 0.2, 4.6);
  }
  b.cyl(cap, kx, 15.3, kz, 4.3, 4.3, 0.5, 20);
  b.put(new THREE.SphereGeometry(3.6, 18, 8, 0, TAU, 0, Math.PI / 2), cap, kx, 15.8, kz, 0, 0, 0, 1, 1.05, 1);
  b.cyl(cap, kx, 19.6, kz, 1.0, 1.2, 2.4, 12);
  b.cone(cap, kx, 22, kz, 0.9, 1.6, 12);
  b.ball(mt.glow('#f4e6b8'), kx, 24, kz, 0.28);

  // Washington Monument
  const mx = 14, mz = -114;
  mound(b, mt.std('#3a5632', 1), mx, mz, 10, 1.4, 10);
  b.frus(marble, mx, 1, mz, 4.6, 4.6, 2.9, 2.9, 39);
  b.frus(marble, mx, 40, mz, 2.9, 2.9, 0.2, 0.2, 5);
  for (const s of [[1, 0], [-1, 0], [0, 1], [0, -1]]) b.ball(mt.glow('#ff3a30'), mx + s[0] * 0.7, 43, mz + s[1] * 0.7, 0.15);
  b.ball(mt.glow('#ff3a30'), mx, 45.4, mz, 0.2);

  // Reflecting pool + Lincoln Memorial
  waterBox(b, mt, 11.5, 16.5, -160, -126, '#27456a', 14, r);
  const lx = 14, lz = -170;
  const lin = mt.std('#eae6da', 0.6, '#7a7464', 0.4);
  for (let i = 0; i < 3; i++) b.box(lin, lx, i * 0.6, lz, 18 - i * 1.4, 0.6, 9.6 - i * 1.4);
  for (let k = 0; k < 8; k++) {
    column(b, lin, lx - 6.6 + k * 1.9, 1.8, lz + 3.6, 0.42, 5.6);
    column(b, lin, lx - 6.6 + k * 1.9, 1.8, lz - 3.6, 0.42, 5.6);
  }
  for (let k = 1; k < 4; k++) { column(b, lin, lx - 6.6, 1.8, lz - 3.6 + k * 1.8, 0.42, 5.6); column(b, lin, lx + 6.6, 1.8, lz - 3.6 + k * 1.8, 0.42, 5.6); }
  b.box(lin, lx, 7.4, lz, 16.4, 1.6, 8.8);
  b.box(lin, lx, 9, lz, 12, 1.1, 5.4);
  b.box(mt.glow('#ffd9a0'), lx, 2, lz, 5, 4.6, 0.3);

  // Potomac, Tidal Basin, Jefferson Memorial, blossoms
  waterBox(b, mt, -120, -70, -175, -30, '#1b3552', 40, r);
  b.put(new THREE.CylinderGeometry(14, 14, 0.14, 28), mt.std('#16304f', 0.25, '#0c1c36', 0.5), -34, 0.07, -130);
  const jx = -34, jz = -143;
  const jm = mt.std('#eeeadc', 0.6, '#7a7464', 0.4);
  b.cyl(jm, jx, 0, jz, 6.4, 6.6, 0.9, 20);
  b.cyl(jm, jx, 0.9, jz, 5.8, 5.9, 0.6, 20);
  for (let k = 0; k < 14; k++) {
    const a = (k / 14) * TAU;
    column(b, jm, jx + Math.cos(a) * 4.7, 1.5, jz + Math.sin(a) * 4.7, 0.3, 4.4);
  }
  b.cyl(jm, jx, 5.9, jz, 5.2, 5.2, 0.5, 20);
  b.put(new THREE.SphereGeometry(4.2, 18, 8, 0, TAU, 0, Math.PI / 2), jm, jx, 6.4, jz, 0, 0, 0, 1, 0.75, 1);
  b.cyl(jm, jx, 9.4, jz, 0.5, 0.5, 0.5, 8);
  for (let k = 0; k < 28; k++) {
    const a = (k / 28) * TAU;
    tree(b, mt, r, 'blossom', jx + Math.cos(a) * rr(r, 14.5, 18), -130 + Math.sin(a) * rr(r, 14.5, 18), rr(r, 4.5, 6));
  }

  // museum blocks along the Mall
  for (const [x, z, w] of [[-8, -96, 13], [36, -96, 13], [-8, -128, 13], [36, -130, 13], [-8, -76, 11], [38, -76, 11]] as Pt3[]) {
    b.box(marbleG, x, 0, z, 7, 7.2, w);
    b.box(mt.std('#d9d4c4'), x, 7.2, z, 7.4, 0.5, w + 0.4);
    for (let k = 0; k < 5; k++) column(b, marble, x + (x < 14 ? 3.7 : -3.7), 0, z - w / 2 + 1.2 + k * ((w - 2.4) / 4), 0.28, 6.8);
  }
  cluster(b, mt, r, { x0: -66, x1: 70, z0: -165, z1: -66, n: 20, hMin: 6, hMax: 12, wMin: 5, wMax: 9, mats: [marbleG, mt.glass('#c4bcab', 0.7, 0.5), mt.glass('#b0a592', 0.7, 0.5)], roof, excl: [{ x: kx, z: kz, r: 17 }, { x: mx, z: mz, r: 12 }, { x: 14, z: -145, r: 12 }, { x: 14, z: -170, r: 12 }, { x: -8, z: -96, r: 9 }, { x: 36, z: -96, r: 9 }, { x: -8, z: -128, r: 9 }, { x: 36, z: -130, r: 9 }, { x: -8, z: -76, r: 8 }, { x: 38, z: -76, r: 8 }, { x: -34, z: -135, r: 22 }], setbacks: 0 });

  // rowhouses and Metro sign
  const dcolors = ['#a4553f', '#c8b08a', '#40536b', '#d8b45a', '#8a6a8f', '#6e8a6c', '#b57a64'];
  rowhouses(b, mt, r, 18, -34, 11, { w: 3.7, d: 9, hMin: 8, hMax: 9.6, colors: dcolors, roof: 'flat', stoop: true, bay: true, trim: '#ece6d8' });
  rowhouses(b, mt, r, -62, -34, 11, { w: 3.7, d: 9, hMin: 8, hMax: 9.6, colors: dcolors, roof: 'flat', stoop: true, bay: true, trim: '#ece6d8' });
  const mp = roadAt(0.42, -7.4);
  b.box(mt.std('#4b3626', 0.6), mp.x, 0, mp.z, 0.6, 4.6, 0.6);
  b.box(mt.std('#4b3626', 0.6), mp.x, 4.6, mp.z, 2.0, 2.0, 0.5, mp.yaw);
  pixelText(b, mt.glow('#ffe7b8'), 'M', mp.x, 4.92, mp.z, 0.24, mp.yaw, 0.6);
  street(b, mt, r, { trees: 'blossom', treeStep: 0.1, treeOff: 8.4, parked: [{ u: 0.22, side: 1, color: '#1d2a3c' }, { u: 0.55, side: -1, color: '#cfd2d8' }, { u: 0.78, side: 1, color: '#7b2a2a' }] });
}

function atlanta(b: B, mt: Mats, r: Rng): void {
  const roof = mt.std('#2f353c');
  const gold = mt.glow('#ffbb36');
  const excl: Excl[] = [];

  // Bank of America Plaza
  const bx = 2, bz = -100;
  const bg = mt.glass('#3a3a40', 0.7, 0.5);
  b.box(bg, bx, 0, bz, 6.6, 38, 6.6);
  b.box(bg, bx, 38, bz, 5.4, 3.5, 5.4);
  b.box(bg, bx, 41.5, bz, 4.2, 3.5, 4.2);
  b.frus(gold, bx, 45, bz, 3.2, 3.2, 2.2, 2.2, 3.2);
  b.frus(gold, bx, 48.2, bz, 2.2, 2.2, 1.2, 1.2, 3.2);
  b.frus(gold, bx, 51.4, bz, 1.2, 1.2, 0.3, 0.3, 3.4);
  b.cyl(gold, bx, 54.8, bz, 0.04, 0.12, 5, 4);
  b.box(gold, bx, 37.8, bz, 6.7, 0.2, 6.7);
  excl.push({ x: bx, z: bz, r: 6 });
  // Westin Peachtree Plaza
  const wx = -26, wz = -84;
  const wg = mt.glass('#7f8fa0', 0.9, 0.7);
  b.cyl(wg, wx, 0, wz, 4.6, 4.6, 42, 18);
  for (const a of [0, 1, 2, 3, 4]) b.cyl(wg, wx + Math.cos(a * 1.26) * 6.6, 0, wz + Math.sin(a * 1.26) * 6.6, 1.8, 1.8, 11, 10);
  b.cyl(wg, wx, 0, wz, 8.4, 8.4, 4.5, 20);
  b.cyl(mt.glow('#bfe3ff'), wx, 42, wz, 4.7, 4.7, 0.35, 18);
  b.cyl(mt.glass('#9fb0c2', 1, 1), wx, 42.35, wz, 2.7, 2.7, 2.6, 14);
  b.cone(mt.std('#5a6470'), wx, 44.95, wz, 2.9, 1.2, 14);
  excl.push({ x: wx, z: wz, r: 9 });
  // 191 Peachtree
  const px = 34, pz = -88;
  const pg = mt.glass('#8e8a80', 0.8, 0.6);
  b.box(pg, px, 0, pz, 6.6, 36, 6.6);
  b.box(pg, px, 36, pz, 5, 3, 5);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    b.cone(mt.std('#c9ced6', 0.5, '#8a8070', 0.4), px + sx * 2.9, 36, pz + sz * 2.9, 0.55, 8, 4);
  }
  b.cone(mt.glow('#ffe0a8'), px, 39, pz, 1.3, 7, 4);
  b.box(mt.glow('#ffe1b0'), px, 35.7, pz, 6.7, 0.22, 6.7);
  excl.push({ x: px, z: pz, r: 6 });

  const glasses = [mt.glass('#58626b', 0.85), mt.glass('#6b7782', 0.85), mt.glass('#4a5560', 0.85), mt.glass('#7d8790', 0.8), mt.glass('#8e8a80', 0.8)];
  cluster(b, mt, r, { x0: -60, x1: 66, z0: -128, z1: -66, n: 22, hMin: 8, hMax: 28, wMin: 4.5, wMax: 8, mats: glasses, roof, excl, spires: true });

  // rolling terrain + dense canopy
  const g1 = mt.std('#2a4d32', 1), g2 = mt.std('#33603a', 1);
  mound(b, g1, -80, -70, 60, 5, 26);
  mound(b, g2, 80, -80, 60, 6, 30);
  mound(b, g1, 0, -160, 150, 12, 26);
  mound(b, g2, -100, -130, 50, 9, 30);
  mound(b, g1, 100, -135, 50, 10, 30);
  let cnt = 0;
  for (let i = 0; i < 700 && cnt < 360; i++) {
    const x = rr(r, -120, 120), z = rr(r, -28, -170);
    if (excl.some((e) => Math.hypot(e.x - x, e.z - z) < e.r + 3)) continue;
    if (Math.abs(x) < 38 && z > -34) continue;
    cnt++;
    tree(b, mt, r, r() < 0.25 ? 'pine' : 'oak', x, z, rr(r, 6, 12));
  }
  // MARTA elevated line
  track(b, mt, -95, 95, -28, 6.2, '#59606a');
  train(b, mt, 20, 6.2, -28, 4, '#d9dde2', '#2e6fd0');
  b.box(mt.std('#2e6fd0', 0.5, '#2e6fd0', 0.2), -38, 7.1, -28, 16, 0.3, 4.8);
  b.box(mt.std('#f08a2a', 0.5, '#f08a2a', 0.2), -38, 6.8, -30.3, 16, 0.2, 0.2);
  street(b, mt, r, { trees: 'oak', treeStep: 0.07, treeOff: 8.4, parked: [{ u: 0.2, side: 1, color: '#d2d6dc' }, { u: 0.52, side: -1, color: '#3d4a60' }, { u: 0.78, side: 1, color: '#7e2d2a' }] });
}

// ------------------------------------------------------------------ campuses

function campusNyc(b: B, mt: Mats): void {
  const stone = mt.glass('#c8b9a0', 0.55, 0.5);
  const lim = mt.std('#d8cbb2', 0.8, '#5a5040', 0.3);
  const dome = mt.std('#6f8c80', 0.7, '#2a3a34', 0.3);
  const brick = mt.glass('#a2573f', 0.65, 0.7);
  b.box(mt.std('#a89d88'), 0, 0, 0, 14, 0.5, 9);
  b.box(mt.std('#b3a892'), 0, 0.5, 0.5, 12, 0.5, 7);
  b.box(stone, 0, 1.0, -0.5, 11, 6.5, 6);
  for (const s of [-1, 1]) b.box(brick, s * 6.0, 0.5, -1.5, 3.6, 6.5, 5);
  for (let k = 0; k < 6; k++) column(b, lim, -3.75 + k * 1.5, 1.0, 3.0, 0.32, 6.5);
  b.box(lim, 0, 7.5, 3.0, 9.2, 0.7, 1.8);
  b.prism(lim, 0, 8.2, 3.0, 9.2, 1.8, 1.6);
  b.cyl(lim, 0, 7.5, -1, 4.3, 4.5, 3.2, 18);
  for (let k = 0; k < 14; k++) {
    const a = (k / 14) * TAU;
    column(b, lim, Math.cos(a) * 3.9, 10.7, Math.sin(a) * 3.9 - 1, 0.17, 2.2);
  }
  b.cyl(lim, 0, 12.9, -1, 4.2, 4.2, 0.4, 18);
  b.put(new THREE.SphereGeometry(4.0, 18, 8, 0, TAU, 0, Math.PI / 2), dome, 0, 13.3, -1);
  b.cyl(lim, 0, 17.3, -1, 0.5, 0.6, 1.8, 8);
  b.cone(dome, 0, 19.1, -1, 0.7, 1.6, 8);
  for (let k = 0; k < 4; k++) b.box(mt.glow('#ffcf8a'), -3.9 + k * 2.6, 3.0, 3.0 + 0.0 - 3.05, 0.9, 2.2, 0.08);
}

function campusChicago(b: B, mt: Mats): void {
  const lime = mt.glass('#c9c2ac', 0.7, 0.6);
  const limeP = mt.std('#cfc8b2', 0.8, '#5e5846', 0.3);
  const slate = mt.std('#3d4652', 0.7);
  const win = mt.glow('#ffcf8a');
  b.box(mt.std('#7a8570', 1), 0, 0, 0, 14, 0.2, 9);
  // front gothic wing
  b.box(lime, 0, 0.2, 2.4, 14, 5.4, 3.6);
  b.prism(slate, 0, 5.6, 2.4, 3.8, 14, 1.8, Math.PI / 2);
  for (let k = 0; k < 7; k++) {
    gothicWin(b, win, -5.7 + k * 1.9, 1.8, 4.25, 0.55, 2.2);
    b.box(limeP, -5.7 + k * 1.9 + 0.95, 0.2, 4.35, 0.35, 5.6, 0.4);
    b.cone(limeP, -5.7 + k * 1.9 + 0.95, 5.8, 4.35, 0.28, 1.2, 4);
  }
  for (const s of [-1, 1]) {
    b.box(lime, s * 6.2, 0.2, -1.6, 3.4, 8.5, 4);
    b.prism(slate, s * 6.2, 8.7, -1.6, 3.4, 4, 2.4);
    gothicWin(b, win, s * 6.2, 4, 0.45, 0.6, 3);
  }
  // chapel with tower
  b.box(lime, 0, 0.2, -2.2, 5.6, 9, 4);
  b.prism(slate, 0, 9.2, -2.2, 5.6, 4, 2.6);
  b.box(lime, 0, 0.2, -3.2, 3.2, 22, 3.2);
  b.box(limeP, 0, 22.2, -3.2, 3.6, 0.6, 3.6);
  b.box(lime, 0, 22.8, -3.2, 2.6, 4.2, 2.6);
  for (const s of [-1, 1]) for (const t of [-1, 1]) {
    b.box(limeP, s * 1.35, 22.8, -3.2 + t * 1.35, 0.5, 5, 0.5);
    b.cone(limeP, s * 1.35, 27.8, -3.2 + t * 1.35, 0.4, 1.8, 4);
  }
  b.cone(slate, 0, 27, -3.2, 1.7, 7, 4);
  gothicWin(b, win, 0, 8, -0.95, 0.9, 3.4);
  gothicWin(b, win, 0, 14, -1.55, 0.7, 3.6);
  gothicWin(b, win, 0, 23.4, -1.85, 0.8, 2.6);
}

function campusLa(b: B, mt: Mats): void {
  const brick = mt.glass('#9a5a3c', 0.6, 0.6);
  const trim = mt.std('#d6c3a0', 0.8, '#5a5040', 0.3);
  const dark = mt.glow('#ffc47a');
  const roofM = mt.std('#7a2f22', 0.7);
  b.box(mt.std('#8a8a70', 1), 0, 0, 0, 14, 0.2, 9);
  b.box(trim, 0, 0.2, 2.5, 12, 0.5, 3);
  b.box(brick, 0, 0.7, 0, 8.4, 10, 5.4);
  b.prism(roofM, 0, 10.7, 0, 5.6, 8.4, 2.2, Math.PI / 2);
  archOpening(b, dark, 0, 0.7, 2.75, 3.2, 7, 0.3);
  b.box(trim, 0, 8.8, 2.72, 3.6, 0.5, 0.2);
  b.put(new THREE.CircleGeometry(0.9, 14), dark, 0, 10, 2.75);
  for (const s of [-1, 1]) {
    b.box(brick, s * 5.0, 0.2, 0, 3.2, 17, 3.4);
    b.box(trim, s * 5.0, 17.2, 0, 3.7, 0.5, 3.9);
    archOpening(b, dark, s * 5.0, 13, 1.75, 1.2, 3.2, 0.2);
    archOpening(b, dark, s * 5.0, 7.5, 1.75, 0.9, 2.2, 0.2);
    b.cone(roofM, s * 5.0, 17.7, 0, 2.3, 3.2, 4);
    b.cone(trim, s * 5.0, 20.9, 0, 0.2, 1.6, 6);
  }
  b.cyl(trim, 0, 11, -0.5, 2.4, 2.6, 1.8, 14);
  b.put(new THREE.SphereGeometry(2.4, 14, 7, 0, TAU, 0, Math.PI / 2), mt.std('#8a5a3e', 0.7), 0, 12.8, -0.5);
  b.cone(trim, 0, 15.1, -0.5, 0.25, 1.4, 6);
}

function campusHouston(b: B, mt: Mats): void {
  const brick = mt.glass('#d29a78', 0.6, 0.6);
  const cream = mt.std('#eadcc0', 0.8, '#5a5040', 0.3);
  const band = mt.std('#a55a44', 0.8);
  const dark = mt.glow('#ffc88a');
  b.box(mt.std('#8a9070', 1), 0, 0, 0, 14, 0.2, 9);
  b.box(brick, 0, 0.2, 1.4, 14, 6, 4.8);
  b.box(band, 0, 0.2 + 2.0, 1.4, 14.1, 0.35, 4.9);
  b.box(band, 0, 0.2 + 4.2, 1.4, 14.1, 0.35, 4.9);
  b.box(cream, 0, 6.2, 1.4, 14.2, 0.5, 5.0);
  for (let k = 0; k < 7; k++) {
    if (k === 3) continue;
    archOpening(b, dark, -5.7 + k * 1.9, 0.2, 3.85, 1.3, 3.3, 0.2);
    b.put(new THREE.TorusGeometry(0.85, 0.07, 4, 10, Math.PI), cream, -5.7 + k * 1.9, 2.9, 3.86);
  }
  // central sallyport tower
  b.box(brick, 0, 0.2, 0, 4.6, 17, 4.6);
  archOpening(b, mt.std('#1c1a1a'), 0, 0.2, 2.35, 2.2, 4.8, 0.3);
  b.put(new THREE.TorusGeometry(1.4, 0.12, 4, 12, Math.PI), cream, 0, 3.7, 2.4);
  b.box(band, 0, 6.2, 0, 4.7, 0.4, 4.7);
  b.box(band, 0, 12.5, 0, 4.7, 0.4, 4.7);
  b.box(cream, 0, 17.2, 0, 5.2, 0.6, 5.2);
  b.box(brick, 0, 17.8, 0, 4.0, 3.8, 4.0);
  for (const s of [[0, 2.05, 0], [0, -2.05, 0], [2.05, 0, 1], [-2.05, 0, 1]]) {
    archOpening(b, dark, s[0] + (s[2] ? 0 : 0), 18.1, s[1], 1.1, 2.8, 0.15);
  }
  b.put(new THREE.ConeGeometry(3.2, 3.6, 4), mt.std('#8a4a36', 0.7), 0, 23.4, 0, Math.PI / 4);
  b.cone(cream, 0, 25.5, 0, 0.2, 1.4, 6);
  for (const s of [-1, 1]) for (const t of [-1, 1]) b.box(cream, s * 2.0, 17.8, t * 2.0, 0.4, 4.3, 0.4);
}

function campusBay(b: B, mt: Mats): void {
  const sand = mt.glass('#d8b27a', 0.6, 0.6);
  const sandP = mt.std('#d8b27a', 0.8, '#6a5030', 0.3);
  const tile = mt.std('#b3482f', 0.7, '#4a1a10', 0.2);
  const dark = mt.glow('#ffc47a');
  b.box(mt.std('#a09070', 1), 0, 0, 0, 14, 0.2, 9);
  // arcade
  b.box(sand, 2.8, 0.2, 2.6, 9.6, 4.6, 3.6);
  b.prism(tile, 2.8, 4.8, 2.6, 4.6, 9.8, 1.8, Math.PI / 2);
  for (let k = 0; k < 6; k++) {
    archOpening(b, mt.std('#3a2c20'), 0 + k * 1.6, 0.2, 4.45, 1.1, 3.4, 0.2);
    archOpening(b, dark, 0 + k * 1.6, 0.2, 4.4, 0.8, 2.6, 0.1);
    b.cyl(sandP, 0.8 + k * 1.6, 0.2, 4.55, 0.16, 0.18, 3.4, 6);
  }
  // side wing
  b.box(sand, -4.6, 0.2, -1.4, 4, 5, 5);
  b.prism(tile, -4.6, 5.2, -1.4, 4.4, 5.2, 1.9);
  // Hoover Tower
  const hx = -1.2, hz = -1.2;
  b.box(sand, hx, 0.2, hz, 3.4, 4, 3.4);
  b.box(sand, hx, 4.2, hz, 2.6, 15, 2.6);
  for (const s of [-1, 1]) b.box(dark, hx + s * 0.55, 6, hz + 1.32, 0.35, 2, 0.06);
  b.box(sandP, hx, 19.2, hz, 3.2, 0.7, 3.2);
  b.box(sand, hx, 19.9, hz, 2.9, 5, 2.9);
  for (const [dx, dz, ry] of [[0, 1.46, 0], [0, -1.46, 0], [1.46, 0, 1], [-1.46, 0, 1]]) {
    b.with(hx + dx, 20.3, hz + dz, ry ? Math.PI / 2 : 0, () => {
      for (const s of [-0.7, 0, 0.7]) archOpening(b, mt.std('#2a1f18'), s, 0, 0, 0.6, 3.6, 0.1);
    });
  }
  b.box(sandP, hx, 24.9, hz, 3.3, 0.5, 3.3);
  b.frus(tile, hx, 25.4, hz, 2.8, 2.8, 1.6, 1.6, 3.4);
  b.box(sand, hx, 28.8, hz, 1.6, 1.6, 1.6);
  b.put(new THREE.ConeGeometry(1.5, 3.2, 4), tile, hx, 31.4, hz, Math.PI / 4);
  b.cone(sandP, hx, 33, hz, 0.1, 1.4, 4);
}

function campusDallas(b: B, mt: Mats): void {
  const brick = mt.glass('#9b4a35', 0.65, 0.7);
  const white = mt.std('#f1ede4', 0.6, '#6a6458', 0.4);
  const dome = mt.std('#7d8a82', 0.7, '#2a332e', 0.25);
  b.box(mt.std('#7f8a62', 1), 0, 0, 0, 14, 0.2, 9);
  b.box(white, 0, 0.2, 0.6, 13, 0.8, 7);
  b.box(brick, 0, 1.0, 0.5, 12, 6.6, 5.4);
  b.box(white, 0, 7.6, 0.5, 12.3, 0.5, 5.7);
  b.prism(mt.std('#4d5560'), 0, 8.1, 0.5, 5.8, 12, 1.4, Math.PI / 2);
  for (let k = 0; k < 6; k++) column(b, white, -2.75 + k * 1.1, 1.0, 3.7, 0.3, 6.6);
  b.box(white, 0, 7.6, 3.7, 6.6, 0.5, 1.6);
  b.prism(white, 0, 8.1, 3.7, 6.6, 1.6, 1.9);
  for (let k = 0; k < 5; k++) b.box(mt.glow('#ffcf8a'), -5.0 + k * 2.5, 2.4, 3.22 - 0.4, 0.8, 2.2, 0.08);
  b.cyl(brick, 0, 8.4, -0.6, 2.6, 2.7, 4, 18);
  b.cyl(white, 0, 12.4, -0.6, 2.8, 2.8, 0.4, 18);
  b.put(new THREE.SphereGeometry(2.7, 16, 8, 0, TAU, 0, Math.PI / 2), dome, 0, 12.8, -0.6, 0, 0, 0, 1, 0.9, 1);
  b.cyl(white, 0, 15.2, -0.6, 0.9, 0.9, 1.4, 8);
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * TAU;
    column(b, white, Math.cos(a) * 0.8, 15.2, Math.sin(a) * 0.8 - 0.6, 0.1, 1.4);
  }
  b.cyl(white, 0, 16.6, -0.6, 1.0, 1.0, 0.25, 8);
  b.put(new THREE.SphereGeometry(0.9, 10, 6, 0, TAU, 0, Math.PI / 2), white, 0, 16.85, -0.6);
  b.cone(white, 0, 17.75, -0.6, 0.12, 1.2, 4);
}

function campusDc(b: B, mt: Mats): void {
  const stone = mt.glass('#8c8574', 0.55, 0.5);
  const stoneP = mt.std('#a39b86', 0.8, '#4a4538', 0.3);
  const slate = mt.std('#3b4452', 0.7);
  const win = mt.glow('#ffcf8a');
  b.box(mt.std('#4a6040', 1), 0, 0, 0, 14, 0.2, 9);
  b.box(stone, 0, 0.2, 0, 14, 7, 5);
  b.prism(slate, 0, 7.2, 0, 5.8, 14, 3, Math.PI / 2);
  for (let k = 0; k < 8; k++) {
    if (k === 3 || k === 4) continue;
    gothicWin(b, win, -6.2 + k * 1.75, 1.8, 2.55, 0.5, 2.0);
    gothicWin(b, win, -6.2 + k * 1.75, 4.6, 2.55, 0.5, 1.6);
  }
  for (const s of [-1, 1]) {
    b.box(stone, s * 6.3, 0.2, 0.4, 2.6, 11, 4.2);
    b.cone(slate, s * 6.3, 11.2, 0.4, 2.2, 5.5, 4);
    b.cone(stoneP, s * 6.3, 16.6, 0.4, 0.15, 1.4, 4);
    b.box(stoneP, s * 6.3, 5, 2.55, 0.3, 4, 0.5);
  }
  // clock tower
  b.box(stone, 0, 0.2, 0.4, 4.2, 18, 3.8);
  b.box(stoneP, 0, 18.2, 0.4, 4.7, 0.6, 4.3);
  b.box(stone, 0, 18.8, 0.4, 3.4, 5, 3.0);
  b.put(new THREE.CircleGeometry(1.0, 20), mt.glow('#fff1c8'), 0, 21, 1.93);
  b.box(mt.std('#26221c'), 0, 21, 1.94, 0.1, 0.8, 0.04);
  gothicWin(b, win, 0, 6, 2.35, 0.9, 3.4);
  gothicWin(b, win, 0, 11.5, 2.35, 0.8, 3.0);
  b.cone(slate, 0, 23.8, 0.4, 2.3, 8.5, 4);
  b.cone(stoneP, 0, 32.2, 0.4, 0.1, 1.8, 4);
  for (const s of [-1, 1]) for (const t of [-1, 1]) b.cone(stoneP, s * 1.9, 18.8, 0.4 + t * 1.6, 0.4, 3, 4);
}

function campusAtlanta(b: B, mt: Mats, r: Rng): void {
  const brick = mt.glass('#9b4a38', 0.65, 0.7);
  const trim = mt.std('#e6dfcf', 0.8, '#5a5448', 0.3);
  const roofM = mt.std('#4a3c36', 0.7);
  b.box(mt.std('#3c5a3a', 1), 0, 0, 0, 14, 0.2, 9);
  b.box(brick, 0, 0.2, 0.8, 9, 8, 5);
  b.box(trim, 0, 8.2, 0.8, 9.4, 0.5, 5.4);
  b.prism(roofM, 0, 8.7, 0.8, 5, 9.2, 1.8, Math.PI / 2);
  for (let k = 0; k < 4; k++) for (const yy of [1.4, 4.4]) b.box(mt.glow('#ffcf8a'), -3.2 + k * 2.1, yy, 3.32, 0.8, 1.7, 0.06);
  // tower
  b.box(brick, 0, 0.2, 0.8, 3.8, 17, 3.8);
  b.box(trim, 0, 17.2, 0.8, 4.3, 0.6, 4.3);
  b.box(brick, 0, 17.8, 0.8, 3.2, 3.6, 3.2);
  b.cone(roofM, 0, 21.4, 0.8, 2.8, 3.2, 4);
  b.box(trim, 0, 6, 2.72, 3.2, 0.4, 0.2);
  b.box(trim, 0, 12, 2.72, 3.2, 0.4, 0.2);
  for (const yy of [2.5, 8, 14]) b.box(mt.glow('#ffcf8a'), 0, yy, 2.72, 0.9, 2.2, 0.06);
  // TECH sign
  b.box(mt.std('#2a2a2e', 0.6), 0, 24.4, 0.8, 7.6, 3.1, 0.6);
  b.box(trim, 0, 24.3, 0.8, 0.5, 4, 0.5);
  pixelText(b, mt.glow('#ffb347'), 'TECH', 0, 24.7, 1.18, 0.34, 0, 0.3);
  // wings
  for (const s of [-1, 1]) {
    b.box(brick, s * 6.4, 0.2, -0.4, 2.8, 5.4, 4);
    b.prism(roofM, s * 6.4, 5.6, -0.4, 3, 4.2, 1.4);
  }
  // trees among the buildings
  for (const [x, z, h] of [[-6.5, 3.8, 8], [6.5, 3.6, 9], [-6, -3.6, 10], [6.2, -3.5, 8.5], [3.4, 4.1, 6]] as Pt3[]) tree(b, mt, r, 'oak', x, z, h);
}

// ------------------------------------------------------------------ exports

const CITY_SEED: Record<CityId, number> = { nyc: 11, la: 23, houston: 37, bayarea: 41, dallas: 53, chicago: 67, dc: 71, atlanta: 83 };

export function buildLandmarks(id: CityId): THREE.Group {
  const st = STYLES[id];
  const mt = new Mats(st.windowLit, CITY_SEED[id]);
  const r = mk(CITY_SEED[id] * 101);
  const b = new B();
  switch (id) {
    case 'nyc': nyc(b, mt, r); break;
    case 'chicago': chicago(b, mt, r); break;
    case 'la': la(b, mt, r); break;
    case 'houston': houston(b, mt, r); break;
    case 'bayarea': bayarea(b, mt, r); break;
    case 'dallas': dallas(b, mt, r); break;
    case 'dc': dc(b, mt, r); break;
    case 'atlanta': atlanta(b, mt, r); break;
  }
  const g = b.finish();
  g.name = `landmarks-${id}`;
  return g;
}

export function buildCampus(id: CityId): THREE.Group {
  const st = STYLES[id];
  const mt = new Mats(Math.max(0.5, st.windowLit), CITY_SEED[id] + 5);
  const r = mk(CITY_SEED[id] * 31);
  const b = new B();
  switch (id) {
    case 'nyc': campusNyc(b, mt); break;
    case 'chicago': campusChicago(b, mt); break;
    case 'la': campusLa(b, mt); break;
    case 'houston': campusHouston(b, mt); break;
    case 'bayarea': campusBay(b, mt); break;
    case 'dallas': campusDallas(b, mt); break;
    case 'dc': campusDc(b, mt); break;
    case 'atlanta': campusAtlanta(b, mt, r); break;
  }
  const g = b.finish();
  g.name = `campus-${id}`;
  return g;
}
