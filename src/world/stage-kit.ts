import * as THREE from 'three';
import { pbrMaterial } from './pbr';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { CastSpec, Pose, Role } from '../engine/types';
import { Figure, ROLE_LOOKS, crowdLook, stdMat, unitBox, unitSphere, unitCyl, SEAT_HEIGHT, blobGeo, blobShadowMaterial } from './Figure';
import type { FigureLook, MatOpts } from './Figure';
import { HumanFigure, humansReady } from './HumanFigure';
import { MhFigure, castReady } from './MhFigure';

/** What the stage code needs from a person, whichever renderer draws them. */
export interface FigureLike {
  readonly group: THREE.Group;
  readonly look: FigureLook;
  readonly lite: boolean;
  pose: Pose;
  walkRate: number;
  setSeated(b: boolean): void;
  setPose(p: Pose): void;
  lookAt(target: THREE.Vector3 | null): void;
  update(dt: number, time: number): void;
  dispose(): void;
}

/** Set to false to always use the procedural figures. */
const USE_HUMANS = true;

let seatStyle: 'office' | 'wood' | 'bench' = 'office';
/** Which kind of seat chair() builds for the scene being made. */
export function setSeatStyle(style: 'office' | 'wood' | 'bench'): void {
  seatStyle = style;
}

export interface StageResult {
  group: THREE.Group;
  update(dt: number, time: number): void;
  dispose(): void;
  camera: { position: THREE.Vector3; target: THREE.Vector3; fov: number };
  background: string;
  fog: { color: string; near: number; far: number } | null;
  ambient: { sky: string; ground: string; intensity: number };
  key: { color: string; intensity: number; position: THREE.Vector3 };
  /** Painted scenes: half the width the people need at the stage centre. */
  span?: number;
  person?: number;
  /** Resolves when every person in the scene has loaded. */
  ready?: Promise<void>;
  /** Painted scenes: which part of the painting a narrow view should show (0 to 1 across it). */
  focusU?: number;
  dim?: number;
  /** Painted scenes: the camera that matches the painting (height, distance to the stage centre, focal length in painting heights, eye level as a fraction down the painting). */
  paintCam?: { h: number; d0: number; f: number; vh: number };
  /** The painting is raised into a depth relief: how far the camera may drift for parallax (0 to 1). */
  relief?: number;
  /** World position just above the head of the first visible person with this role (speech bubbles hang here). */
  anchor?(role: string): THREE.Vector3 | null;
  /** Painted scenes: called each frame with the way the painting maps to the world, so seated people stay on their painted seats. */
  fit?(m: PaintFrame): void;
}

export interface PaintFrame {
  /** Half the width of the painting that is on screen, as a fraction of the painting (0.5 or more when all of it shows). */
  half: number;
  /** Above 1 when the standing row is too wide for the view and has to stand further back. */
  back: number;
}

export type Cfg = Omit<StageResult, 'group' | 'update' | 'dispose' | 'span' | 'ready' | 'person' | 'fit' | 'focusU' | 'paintCam' | 'dim' | 'relief' | 'anchor'>;
export type Upd = (dt: number, t: number) => void;
export type C = string | THREE.Material;

export interface Slot {
  def: Role;
  x: number;
  z: number;
  fx: number;
  fz: number;
  pose: Pose;
  seat?: 'chair' | 'stool' | number;
  look?: [number, number, number];
  lite?: boolean;
  opt?: boolean;
  scale?: number;
  /** y offset of the figure (e.g. standing on a stage) */
  y?: number;
  alt?: { x: number; z: number; y: number; fx: number; fz: number };
}
export const SL = (def: Role, x: number, z: number, fx: number, fz: number, pose: Pose, o: Partial<Slot> = {}): Slot => ({ def, x, z, fx, fz, pose, ...o });
export const ryTo = (x: number, z: number, tx: number, tz: number): number => Math.atan2(tx - x, tz - z);

export interface Placed {
  role: Role;
  fig: FigureLike;
  slot: Slot;
}

const planeGeo = (() => {
  let g: THREE.PlaneGeometry | null = null;
  return (): THREE.PlaneGeometry => (g ??= new THREE.PlaneGeometry(1, 1));
})();
const coneGeo = (() => {
  let g: THREE.ConeGeometry | null = null;
  return (): THREE.ConeGeometry => (g ??= new THREE.ConeGeometry(1, 1, 24));
})();
const torusGeo = (() => {
  let g: THREE.TorusGeometry | null = null;
  return (): THREE.TorusGeometry => (g ??= new THREE.TorusGeometry(1, 0.06, 10, 32));
})();
const potGeo = (() => {
  let g: THREE.CylinderGeometry | null = null;
  return (): THREE.CylinderGeometry => (g ??= new THREE.CylinderGeometry(1, 0.7, 1, 28));
})();
const hiSph = (() => {
  let g: THREE.SphereGeometry | null = null;
  return (): THREE.SphereGeometry => (g ??= new THREE.SphereGeometry(1, 24, 16));
})();

export const m = (c: C, o?: MatOpts): THREE.Material => (typeof c === 'string' ? stdMat(c, o) : c);

/** Real photoscanned materials; set false to fall back to the painted canvas textures. */
const USE_PBR = true;

export function rng(seed: number): () => number {
  let a = (seed | 0) + 0x9e3779b9;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const shadeHex = (hex: string, amt: number): string => new THREE.Color(hex).offsetHSL(0, 0, amt).getStyle();
const lumOf = (hex: string): number => {
  const c = new THREE.Color(hex);
  return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
};

/* ---- shared geometry caches (module level, never disposed per stage) */
const bevelCache = new Map<string, THREE.BufferGeometry>();
function bevelBox(w: number, h: number, d: number): THREE.BufferGeometry {
  const key = `${w.toFixed(3)}:${h.toFixed(3)}:${d.toFixed(3)}`;
  let g = bevelCache.get(key);
  if (!g) {
    const mn = Math.min(w, h, d);
    if (mn < 0.035) g = new THREE.BoxGeometry(w, h, d);
    else g = new RoundedBoxGeometry(w, h, d, 2, Math.min(0.028, mn * 0.24));
    bevelCache.set(key, g);
  }
  return g;
}
/** Plain box with world-space UVs (one texture tile every 2 m) for walls and slabs. */
const slabCache = new Map<string, THREE.BufferGeometry>();
function slabBox(w: number, h: number, d: number): THREE.BufferGeometry {
  const key = `${w.toFixed(3)}:${h.toFixed(3)}:${d.toFixed(3)}`;
  let g = slabCache.get(key);
  if (!g) {
    g = new THREE.BoxGeometry(w, h, d);
    const uv = g.getAttribute('uv');
    const dims: Array<[number, number]> = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
    for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) {
      const i = f * 4 + k;
      uv.setXY(i, uv.getX(i) * dims[f][0] / 2, uv.getY(i) * dims[f][1] / 2);
    }
    slabCache.set(key, g);
  }
  return g;
}
const glowTexCache: { t: THREE.CanvasTexture | null; s: THREE.CanvasTexture | null; d: THREE.CanvasTexture | null } = { t: null, s: null, d: null };
function glowTex(): THREE.CanvasTexture {
  if (!glowTexCache.t) {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    if (g) {
      const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      gr.addColorStop(0, 'rgba(255,255,255,1)');
      gr.addColorStop(0.18, 'rgba(255,255,255,0.55)');
      gr.addColorStop(0.5, 'rgba(255,255,255,0.14)');
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr;
      g.fillRect(0, 0, 128, 128);
    }
    glowTexCache.t = new THREE.CanvasTexture(c);
  }
  return glowTexCache.t;
}
/** soft vertical fade (bright at v=1, clear at v=0) for light shafts */
function shaftTex(): THREE.CanvasTexture {
  if (!glowTexCache.s) {
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 128;
    const g = c.getContext('2d');
    if (g) {
      const h = g.createLinearGradient(0, 0, 64, 0);
      h.addColorStop(0, 'rgba(255,255,255,0)');
      h.addColorStop(0.5, 'rgba(255,255,255,1)');
      h.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = h;
      g.fillRect(0, 0, 64, 128);
      g.globalCompositeOperation = 'destination-in';
      const v = g.createLinearGradient(0, 0, 0, 128);
      v.addColorStop(0, 'rgba(255,255,255,1)');
      v.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = v;
      g.fillRect(0, 0, 64, 128);
    }
    glowTexCache.s = new THREE.CanvasTexture(c);
  }
  return glowTexCache.s;
}
function dustTex(): THREE.CanvasTexture {
  if (!glowTexCache.d) {
    const c = document.createElement('canvas');
    c.width = c.height = 32;
    const g = c.getContext('2d');
    if (g) {
      const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
      gr.addColorStop(0, 'rgba(255,255,255,1)');
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr;
      g.fillRect(0, 0, 32, 32);
    }
    glowTexCache.d = new THREE.CanvasTexture(c);
  }
  return glowTexCache.d;
}

export class SB {
  readonly g = new THREE.Group();
  /** Set in scenes where nobody would wear a backpack (home, work, a clinic): backpacks are left off. */
  noBags = false;
  readonly figs: FigureLike[] = [];
  readonly upd: Upd[] = [];
  readonly looks: Array<{ fig: FigureLike; v: THREE.Vector3 }> = [];
  private readonly tex: THREE.Texture[] = [];
  private readonly own: Array<{ dispose(): void }> = [];
  private readonly tmp = new THREE.Vector3();
  private readonly wallCache = new Map<string, THREE.Material>();
  /** set false to keep boxes sharp (e.g. buildings far away) */
  bevel = true;
  constructor(readonly pal: string[]) {}

  p(i: number): string {
    return this.pal[i % Math.max(1, this.pal.length)] ?? '#ffb454';
  }

  put<T extends THREE.Object3D>(o: T, x: number, y: number, z: number, ry = 0, parent: THREE.Object3D = this.g): T {
    o.position.set(x, y, z);
    o.rotation.y = ry;
    parent.add(o);
    const me = o as unknown as THREE.Mesh;
    if (me.isMesh) {
      const mt = me.material as THREE.Material;
      me.castShadow = !mt.transparent && !(mt as THREE.MeshStandardMaterial).emissiveMap;
      me.receiveShadow = true;
    }
    return o;
  }
  grp(x: number, y: number, z: number, ry = 0, parent: THREE.Object3D = this.g): THREE.Group {
    return this.put(new THREE.Group(), x, y, z, ry, parent);
  }
  /** textured, lightly noisy paint for large wall slabs */
  wallMat(c: string): THREE.Material {
    let mt = this.wallCache.get(c);
    if (!mt) {
      if (USE_PBR) {
        mt = pbrMaterial('painted_plaster_wall', { color: new THREE.Color(c), repeat: [2, 1.5], roughness: 0.95, normalScale: 0.8 });
        this.wallCache.set(c, mt);
        return mt;
      }
      const lum = lumOf(c);
      const t = this.canvasTex(128, 128, (g, w, h) => {
        const r = rng(Math.floor(lum * 9973) + c.length);
        g.fillStyle = '#ffffff';
        g.fillRect(0, 0, w, h);
        for (let i = 0; i < 900; i++) {
          const v = 238 + Math.floor(r() * 17);
          g.fillStyle = `rgba(${v},${v},${v},0.35)`;
          g.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 3);
        }
      });
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      mt = new THREE.MeshStandardMaterial({ color: c, map: t, roughness: 0.94 });
      this.own.push(mt);
      this.wallCache.set(c, mt);
    }
    return mt;
  }
  box(w: number, h: number, d: number, c: C, x: number, y: number, z: number, ry = 0, parent: THREE.Object3D = this.g): THREE.Mesh {
    const wall = typeof c === 'string' && ((w >= 5 && h >= 2.4 && d <= 0.4) || (d >= 5 && h >= 2.4 && w <= 0.4));
    const slab = wall || (typeof c !== 'string' && (w >= 5 || d >= 5) && Math.min(w, h, d) < 0.4);
    const geo = slab ? slabBox(w, h, d) : this.bevel ? bevelBox(w, h, d) : unitBox();
    const me = new THREE.Mesh(geo, wall ? this.wallMat(c as string) : m(c));
    if (!slab && !this.bevel) me.scale.set(w, h, d);
    this.put(me, x, y, z, ry, parent);
    if (wall && y - h / 2 > -0.5 && parent === this.g) {
      const col = c as string;
      const bc = lumOf(col) > 0.55 ? shadeHex(col, -0.16) : shadeHex(col, 0.22);
      if (w >= 5) this.box(w, 0.14, d + 0.05, bc, x, y - h / 2 + 0.07, z, ry);
      else this.box(w + 0.05, 0.14, d, bc, x, y - h / 2 + 0.07, z, ry);
    }
    return me;
  }
  cyl(r: number, h: number, c: C, x: number, y: number, z: number, parent: THREE.Object3D = this.g, seg = 16): THREE.Mesh {
    const me = new THREE.Mesh(unitCyl(Math.max(seg, 20)), m(c));
    me.scale.set(r, h, r);
    return this.put(me, x, y, z, 0, parent);
  }
  sph(r: number, c: C, x: number, y: number, z: number, sx = 1, sy = 1, sz = 1, parent: THREE.Object3D = this.g): THREE.Mesh {
    const me = new THREE.Mesh(r > 0.12 ? hiSph() : unitSphere(), m(c));
    me.scale.set(r * sx, r * sy, r * sz);
    return this.put(me, x, y, z, 0, parent);
  }
  cone(r: number, h: number, c: C, x: number, y: number, z: number, parent: THREE.Object3D = this.g): THREE.Mesh {
    const me = new THREE.Mesh(coneGeo(), m(c));
    me.scale.set(r, h, r);
    return this.put(me, x, y, z, 0, parent);
  }
  ring(r: number, tube: number, c: C, x: number, y: number, z: number, rx = 0, ry = 0, parent: THREE.Object3D = this.g): THREE.Mesh {
    const me = new THREE.Mesh(torusGeo(), m(c));
    me.scale.set(r, r, r * (tube / 0.06));
    me.rotation.x = rx;
    me.position.set(x, y, z);
    me.rotation.y = ry;
    parent.add(me);
    me.castShadow = true;
    return me;
  }
  plane(w: number, h: number, mat: THREE.Material, x: number, y: number, z: number, ry = 0, rx = 0, parent: THREE.Object3D = this.g): THREE.Mesh {
    const me = new THREE.Mesh(planeGeo(), mat);
    me.scale.set(w, h, 1);
    me.rotation.set(rx, ry, 0);
    me.position.set(x, y, z);
    me.receiveShadow = true;
    parent.add(me);
    return me;
  }
  floor(w: number, d: number, c: C, x = 0, z = 0, y = 0): THREE.Mesh {
    return this.plane(w, d, typeof c === 'string' ? this.floorMat(c, w, d) : c, x, y, z, 0, -Math.PI / 2);
  }
  /** plain colour floors get planks (warm browns) or grouted tiles (everything else) */
  floorMat(c: string, w: number, d: number): THREE.Material {
    const key = `fl|${c}|${w}|${d}`;
    let mt = this.wallCache.get(key);
    if (!mt) {
      const hsl = { h: 0, s: 0, l: 0 };
      new THREE.Color(c).getHSL(hsl);
      if (USE_PBR) {
        const tint = new THREE.Color(c).lerp(new THREE.Color('#ffffff'), 0.2).multiplyScalar(0.8);
        if (hsl.h > 0.02 && hsl.h < 0.13 && hsl.s > 0.18 && hsl.l < 0.7) {
          mt = pbrMaterial('wood_floor', { color: tint, repeat: [w / 2.4, d / 2.4], roughness: 0.9 });
        } else if (hsl.l > 0.55) {
          mt = pbrMaterial('interior_tiles', { color: tint, repeat: [w / 2.2, d / 2.2], roughness: 1 });
        } else {
          mt = pbrMaterial('concrete_floor', { color: tint, repeat: [w / 2.8, d / 2.8], roughness: 1 });
        }
        this.wallCache.set(key, mt);
        return mt;
      }
      if (hsl.h > 0.02 && hsl.h < 0.13 && hsl.s > 0.18 && hsl.l < 0.7) {
        const t = woodTex(this, shadeHex(c, 0.04), 0.18, Math.floor(hsl.h * 977), w / 2.6, d / 2.2);
        mt = this.lit(t, 0.55);
      } else {
        const t = tileTex(this, shadeHex(c, 0.012), shadeHex(c, -0.03), shadeHex(c, hsl.l > 0.5 ? -0.14 : 0.1), w / 1.6, d / 1.6);
        mt = this.lit(t, 0.38);
      }
      this.wallCache.set(key, mt);
    }
    return mt;
  }
  rug(x: number, z: number, r: number, c1: string, c2: string, squash = 1): THREE.Mesh {
    const t = this.canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = c1; g.fillRect(0, 0, w, h);
      const rr = [0.98, 0.84, 0.68, 0.5, 0.32, 0.16];
      rr.forEach((k, i) => { g.fillStyle = i % 2 ? c1 : c2; g.beginPath(); g.arc(w / 2, h / 2, k * w / 2, 0, 7); g.fill(); });
      g.strokeStyle = 'rgba(255,255,255,0.25)'; g.lineWidth = 2;
      for (let i = 0; i < 36; i++) { const a = (i / 36) * 6.283; g.beginPath(); g.moveTo(w / 2 + Math.cos(a) * w * 0.45, h / 2 + Math.sin(a) * h * 0.45); g.lineTo(w / 2 + Math.cos(a) * w * 0.49, h / 2 + Math.sin(a) * h * 0.49); g.stroke(); }
    });
    const mt = this.lit(t, 1);
    const me = new THREE.Mesh(unitCyl(48), [m(c2), mt, m(c2)]);
    me.scale.set(r, 0.014, r * squash);
    this.put(me, x, 0.007, z);
    me.castShadow = false;
    return me;
  }

  canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void): THREE.CanvasTexture {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const g = c.getContext('2d');
    if (g) draw(g, w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    this.tex.push(t);
    return t;
  }
  repeat(t: THREE.CanvasTexture, rx: number, ry: number): THREE.CanvasTexture {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(rx, ry);
    return t;
  }
  basic(t: THREE.Texture, opts: { op?: number } = {}): THREE.MeshBasicMaterial {
    const mm = new THREE.MeshBasicMaterial({ map: t, toneMapped: false, transparent: opts.op !== undefined, opacity: opts.op ?? 1 });
    this.own.push(mm);
    return mm;
  }
  lit(t: THREE.Texture, rough = 0.8, emissive = 0, bump = 0): THREE.MeshStandardMaterial {
    const mm = new THREE.MeshStandardMaterial({ map: t, roughness: rough, emissive: emissive > 0 ? '#ffffff' : '#000000', emissiveMap: emissive > 0 ? t : null, emissiveIntensity: emissive });
    if (bump > 0) { mm.bumpMap = t; mm.bumpScale = bump; }
    this.own.push(mm);
    return mm;
  }
  /** unlit textured panel */
  panel(w: number, h: number, t: THREE.Texture, x: number, y: number, z: number, ry = 0, parent: THREE.Object3D = this.g): THREE.Mesh {
    return this.plane(w, h, this.basic(t), x, y, z, ry, 0, parent);
  }
  light(color: string, intensity: number, x: number, y: number, z: number, dist = 9): THREE.PointLight {
    const l = new THREE.PointLight(color, intensity, dist, 2);
    l.position.set(x, y, z);
    this.g.add(l);
    return l;
  }

  /* ---------------------------------------------------------- atmosphere helpers */

  /** additive halo that always faces the camera */
  glow(color: string, size: number, x: number, y: number, z: number, op = 0.8, parent: THREE.Object3D = this.g): THREE.Sprite {
    const mat = new THREE.SpriteMaterial({ map: glowTex(), color, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    this.own.push(mat);
    const s = new THREE.Sprite(mat);
    s.scale.set(size, size, 1);
    s.position.set(x, y, z);
    parent.add(s);
    return s;
  }
  /** soft additive light shaft: bright at the window end, fading toward the floor */
  shaft(x: number, y: number, z: number, ry: number, w: number, len: number, angle: number, color = '#fff0c8', op = 0.16): THREE.Mesh {
    const mat = new THREE.MeshBasicMaterial({ map: shaftTex(), color, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
    this.own.push(mat);
    const me = new THREE.Mesh(planeGeo(), mat);
    me.scale.set(w, len, 1);
    const grp = new THREE.Group();
    grp.position.set(x, y, z);
    grp.rotation.y = ry;
    this.g.add(grp);
    me.rotation.x = angle - Math.PI / 2;
    me.position.set(0, (-Math.sin(angle) * len) / 2, (Math.cos(angle) * len) / 2);
    me.renderOrder = 3;
    grp.add(me);
    return me;
  }
  /** drifting dust motes / pollen / embers */
  dust(cx: number, cy: number, cz: number, sx: number, sy: number, sz: number, n = 40, color = '#fff4d8', size = 0.06, op = 0.55, rise = 0.02): void {
    const pos = new Float32Array(n * 3);
    const ph = new Float32Array(n);
    const r = rng(n * 31 + Math.floor(cx * 7));
    for (let i = 0; i < n; i++) {
      pos[i * 3] = cx + (r() - 0.5) * sx;
      pos[i * 3 + 1] = cy + (r() - 0.5) * sy;
      pos[i * 3 + 2] = cz + (r() - 0.5) * sz;
      ph[i] = r() * 6.28;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ map: dustTex(), color, size, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true, toneMapped: false });
    this.own.push(geo, mat);
    const pts = new THREE.Points(geo, mat);
    pts.frustumCulled = false;
    this.g.add(pts);
    const base = pos.slice();
    this.upd.push((_dt, t) => {
      for (let i = 0; i < n; i++) {
        const u = (t * rise + ph[i] / 6.28) % 1;
        pos[i * 3] = base[i * 3] + Math.sin(t * 0.3 + ph[i]) * 0.12;
        pos[i * 3 + 1] = cy - sy / 2 + (((base[i * 3 + 1] - (cy - sy / 2)) / sy + u) % 1) * sy;
        pos[i * 3 + 2] = base[i * 3 + 2] + Math.cos(t * 0.27 + ph[i]) * 0.1;
      }
      geo.attributes.position.needsUpdate = true;
    });
  }
  /** soft contact shadow */
  blob(x: number, z: number, w: number, d: number, op = 1, ry = 0): THREE.Mesh {
    const me = new THREE.Mesh(blobGeo(), blobShadowMaterial());
    me.scale.set(w, 1, d);
    me.renderOrder = 1;
    const mm = this.put(me, x, 0.008, z, ry);
    mm.castShadow = false;
    mm.receiveShadow = false;
    void op;
    return mm;
  }

  person(look: FigureLook, x: number, z: number, ry: number, pose: Pose, o: { seated?: boolean; y?: number; lite?: boolean; look?: [number, number, number]; scale?: number } = {}): FigureLike {
    if (this.noBags && look.accessory === 'backpack') look = { ...look, accessory: 'none' };
    const f: FigureLike = USE_HUMANS && castReady() ? new MhFigure(look, o.lite ?? false) : USE_HUMANS && humansReady() && !castReady() ? new HumanFigure(look, o.lite ?? false) : new Figure(look, o.lite ?? false);
    f.group.position.set(x, o.y ?? 0, z);
    f.group.rotation.y = ry;
    if (o.scale) f.group.scale.multiplyScalar(o.scale);
    if (o.seated) f.setSeated(true);
    f.group.userData.seated = Boolean(o.seated);
    f.setPose(pose);
    if (o.seated) f.setSeated(true);
    this.g.add(f.group);
    this.figs.push(f);
    if (o.look) {
      const v = new THREE.Vector3(o.look[0], o.look[1], o.look[2]);
      this.looks.push({ fig: f, v });
    }
    return f;
  }

  walker(look: FigureLook, ax: number, az: number, bx: number, bz: number, speed: number, phase = 0, lite = true): FigureLike {
    const f = this.person(look, ax, az, 0, 'walk', { lite });
    f.walkRate = speed;
    const len = Math.hypot(bx - ax, bz - az);
    let u = phase;
    let dir = 1;
    let ry = 0;
    this.upd.push((dt) => {
      u += (dir * speed * dt) / len;
      if (u >= 1) { u = 1; dir = -1; }
      if (u <= 0) { u = 0; dir = 1; }
      f.group.position.x = ax + (bx - ax) * u;
      f.group.position.z = az + (bz - az) * u;
      const target = Math.atan2((bx - ax) * dir, (bz - az) * dir);
      let d = target - ry;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      ry += d * Math.min(1, dt * 5);
      f.group.rotation.y = ry;
    });
    return f;
  }

  chair(x: number, z: number, ry: number, c: C = '#4a4f5c', back = true): THREE.Group {
    const g = this.grp(x, 0, z, ry);
    g.userData.keep = true;
    g.userData.chair = true;
    // The human models sit a little lower than the old figures the seat height was tuned for.
    if (USE_HUMANS && humansReady()) g.position.y -= 0.09;
    if (seatStyle === 'bench') {
      // A park bench for one: wooden slats on dark iron legs.
      const wood = m('#8a5a34');
      const iron = m('#23262c');
      for (const dz of [-0.06, 0.1, 0.26]) this.box(0.62, 0.035, 0.13, wood, 0, 0.4, dz, 0, g);
      if (back) for (const dy of [0.58, 0.74]) this.box(0.62, 0.11, 0.035, wood, 0, dy, -0.16, 0, g).rotation.x = -0.14;
      for (const dx of [-0.27, 0.27]) {
        this.box(0.045, 0.4, 0.045, iron, dx, 0.2, 0.28, 0, g);
        this.box(0.045, back ? 0.82 : 0.4, 0.045, iron, dx, back ? 0.41 : 0.2, -0.15, 0, g);
        this.box(0.045, 0.04, 0.46, iron, dx, 0.37, 0.07, 0, g);
      }
    } else if (seatStyle === 'wood') {
      // A plain wooden chair, the kind in a rented kitchen.
      const wood = m('#7a5536');
      this.box(0.42, 0.045, 0.42, wood, 0, 0.4, 0.1, 0, g);
      for (const dx of [-0.18, 0.18]) {
        this.box(0.04, 0.4, 0.04, wood, dx, 0.2, 0.28, 0, g);
        this.box(0.04, back ? 0.88 : 0.4, 0.04, wood, dx, back ? 0.44 : 0.2, -0.09, 0, g);
      }
      if (back) for (const dy of [0.62, 0.8]) this.box(0.36, 0.07, 0.03, wood, 0, dy, -0.09, 0, g);
    } else {
      const mat = m(c);
      this.box(0.44, 0.07, 0.44, mat, 0, 0.395, 0.1, 0, g);
      if (back) this.box(0.42, 0.36, 0.05, mat, 0, 0.7, -0.14, 0, g).rotation.x = -0.1;
      this.cyl(0.025, 0.36, '#2b2e36', 0, 0.18, 0.1, g, 12);
      this.box(0.5, 0.028, 0.06, '#2b2e36', 0, 0.025, 0.1, Math.PI / 4, g);
      this.box(0.5, 0.028, 0.06, '#2b2e36', 0, 0.025, 0.1, -Math.PI / 4, g);
    }
    this.blob(x, z + 0.1, 0.8, 0.8);
    return g;
  }

  /** place roles into slots, returning what was built */
  populate(slots: Slot[], cast: CastSpec[], player: FigureLook, chairCol: C = '#4a4f5c'): Placed[] {
    const n = slots.length;
    const taken: Array<CastSpec | null> = new Array(n).fill(null);
    const list = [...cast].sort((a, b) => (a.role === 'player' ? 0 : 1) - (b.role === 'player' ? 0 : 1));
    const rest: CastSpec[] = [];
    for (const s of list) {
      if (s.slot !== undefined) {
        const i = Math.max(0, Math.min(n - 1, s.slot));
        if (!taken[i]) { taken[i] = s; continue; }
      }
      rest.push(s);
    }
    const rest2: CastSpec[] = [];
    for (const s of rest) {
      const i = slots.findIndex((sl, k) => !taken[k] && sl.def === s.role);
      if (i >= 0) taken[i] = s; else rest2.push(s);
    }
    const generic = (r: Role): boolean => r === 'stranger' || r === 'student';
    let overflow = 0;
    for (const s of rest2) {
      let i = slots.findIndex((sl, k) => !taken[k] && generic(sl.def));
      if (i < 0) i = slots.findIndex((_sl, k) => !taken[k]);
      if (i >= 0) taken[i] = s;
      else {
        const sl = slots[n - 1];
        const lk = s.role === 'player' ? player : ROLE_LOOKS[s.role];
        const f = this.person(lk, sl.x + 0.9 * ++overflow, sl.z, ryTo(sl.x, sl.z, sl.fx, sl.fz), s.pose ?? 'idle');
        void f;
      }
    }
    const out: Placed[] = [];
    slots.forEach((sl, k) => {
      const spec = taken[k];
      if (!spec && sl.opt) return;
      const role = spec?.role ?? sl.def;
      let look: FigureLook;
      if (role === 'player') look = player;
      else if (role === 'student' || (!spec && role === 'stranger')) look = crowdLook(k * 5 + 3);
      else look = ROLE_LOOKS[role];
      const pose = spec?.pose ?? sl.pose;
      const moving = pose === 'walk' || pose === 'carry' || pose === 'cheer' || pose === 'present' || pose === 'dance' || pose === 'exercise' || pose === 'sleep' || pose === 'cook' || pose === 'laugh';
      let seated = !moving && sl.seat !== undefined;
      if (pose === 'laugh' && sl.seat !== undefined) seated = true;
      if (pose === 'eat' && sl.seat !== undefined) seated = true;
      let x = sl.x, z = sl.z, y = sl.y ?? 0, fx = sl.fx, fz = sl.fz;
      if (pose === 'present' && sl.alt) { x = sl.alt.x; z = sl.alt.z; y = sl.alt.y; fx = sl.alt.fx; fz = sl.alt.fz; }
      const ry = ryTo(x, z, fx, fz);
      if (seated && (sl.seat === 'chair' || sl.seat === 'stool')) this.chair(x, z, ry, chairCol, sl.seat === 'chair');
      else if (seated && typeof sl.seat === 'number') y = sl.seat - SEAT_HEIGHT;
      if (pose === 'sit' && !seated) { seated = true; this.chair(x, z, ry, chairCol); }
      const fig = this.person(look, x, z, ry, pose, { seated, y, lite: sl.lite && (!spec || generic(spec.role)), look: sl.look, scale: sl.scale });
      out.push({ role, fig, slot: sl });
    });
    return out;
  }

  steam(x: number, y: number, z: number, n = 3, size = 0.35): void {
    const t = this.canvasTex(64, 64, (g) => {
      const gr = g.createRadialGradient(32, 32, 2, 32, 32, 30);
      gr.addColorStop(0, 'rgba(255,255,255,0.7)');
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr;
      g.fillRect(0, 0, 64, 64);
    });
    const puffs: Array<{ me: THREE.Sprite; mat: THREE.SpriteMaterial; o: number }> = [];
    for (let i = 0; i < n; i++) {
      const mat = new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false, opacity: 0 });
      this.own.push(mat);
      const me = new THREE.Sprite(mat);
      me.position.set(x, y, z);
      this.g.add(me);
      puffs.push({ me, mat, o: i / n });
    }
    this.upd.push((_dt, tm) => {
      for (const p of puffs) {
        const u = (tm * 0.35 + p.o) % 1;
        p.me.position.set(x + Math.sin(tm + p.o * 6) * 0.04, y + u * 0.7, z);
        p.me.scale.setScalar(size * (0.6 + u));
        p.mat.opacity = Math.sin(u * Math.PI) * 0.5;
      }
    });
  }

  stanchions(x0: number, z0: number, x1: number, z1: number, n: number): void {
    for (let i = 0; i < n; i++) {
      const x = x0 + ((x1 - x0) * i) / (n - 1), z = z0 + ((z1 - z0) * i) / (n - 1);
      this.cyl(0.025, 0.9, '#b8bcc4', x, 0.45, z, this.g, 12);
      this.cyl(0.13, 0.03, '#2b2f38', x, 0.015, z, this.g, 20);
      this.sph(0.035, '#b8bcc4', x, 0.92, z);
      if (i > 0) {
        const px = x0 + ((x1 - x0) * (i - 1)) / (n - 1), pz = z0 + ((z1 - z0) * (i - 1)) / (n - 1);
        const len = Math.hypot(x - px, z - pz);
        this.box(len, 0.04, 0.014, '#1d3f8a', (x + px) / 2, 0.82, (z + pz) / 2, Math.atan2(-(z - pz), x - px));
      }
    }
  }

  laptop(x: number, y: number, z: number, ry: number, tex: THREE.Texture | null, glow = false): void {
    const g = this.grp(x, y, z, ry);
    this.box(0.32, 0.016, 0.22, '#c9ccd2', 0, 0.008, 0, 0, g);
    // Keyboard well with a hint of keys, and a trackpad.
    this.box(0.28, 0.002, 0.1, '#2b2e35', 0, 0.0168, -0.035, 0, g);
    for (let r = 0; r < 4; r++) this.box(0.26, 0.0008, 0.004, '#4a4e57', 0, 0.0182, -0.075 + r * 0.025, 0, g);
    this.box(0.11, 0.0015, 0.065, '#b7bbc3', 0, 0.0166, 0.065, 0, g);
    const lid = this.grp(0, 0.015, -0.1, 0, g);
    lid.rotation.x = -0.35;
    this.box(0.32, 0.22, 0.012, '#aeb2ba', 0, 0.11, 0, 0, lid);
    this.box(0.305, 0.205, 0.002, '#121418', 0, 0.11, 0.0062, 0, lid);
    const sm = tex ? this.basic(tex) : m('#1b2230', { emissive: glow ? '#4aa0ff' : '#000000', ei: 0.8 });
    this.plane(0.29, 0.19, sm, 0, 0.11, 0.0075, 0, 0, lid);
    if (glow) this.glow('#7fc4ff', 0.55, x, y + 0.2, z + 0.1, 0.22);
  }
  monitor(x: number, y: number, z: number, ry: number, tex: THREE.Texture, w = 0.55, h = 0.33): void {
    const g = this.grp(x, y, z, ry);
    this.box(0.18, 0.015, 0.16, '#2a2d34', 0, 0.008, 0, 0, g);
    this.box(0.03, h * 0.5, 0.03, '#2a2d34', 0, h * 0.25, 0, 0, g);
    this.box(w + 0.03, h + 0.03, 0.03, '#15171c', 0, h * 0.5 + 0.12, 0, 0, g);
    this.plane(w, h, this.basic(tex), 0, h * 0.5 + 0.12, 0.017, 0, 0, g);
  }
  plant(x: number, z: number, s = 1, y = 0): void {
    const g = this.grp(x, y, z);
    const pot = new THREE.Mesh(potGeo(), m('#b6603d'));
    pot.scale.set(0.15 * s, 0.26 * s, 0.15 * s);
    this.put(pot, 0, 0.13 * s, 0, 0, g);
    this.cyl(0.155 * s, 0.03 * s, '#c4704a', 0, 0.27 * s, 0, g, 24);
    this.cyl(0.13 * s, 0.01 * s, '#3a2a20', 0, 0.285 * s, 0, g, 20);
    const r = rng(Math.floor(x * 31 + z * 17 + 5));
    const cols = ['#3f8f4e', '#4aa35a', '#2f7d45', '#58b266'];
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + r();
      const lean = 0.55 + r() * 0.5;
      const leaf = this.sph(0.1 * s, cols[i % 4], Math.sin(a) * 0.1 * s, (0.5 + r() * 0.22) * s, Math.cos(a) * 0.1 * s, 0.7, 0.18, 2.1, g);
      leaf.rotation.set(-lean + 0.2, a, 0, 'YXZ');
      leaf.position.y = (0.38 + lean * 0.18) * s;
      leaf.position.x = Math.sin(a) * (0.1 + lean * 0.1) * s;
      leaf.position.z = Math.cos(a) * (0.1 + lean * 0.1) * s;
    }
    this.blob(x, z, 0.55 * s, 0.55 * s);
  }
  tree(x: number, z: number, s = 1, leaf = '#3f8a4a', trunk = '#6b4a30'): void {
    this.cyl(0.11 * s, 1.6 * s, trunk, x, 0.8 * s, z, this.g, 12);
    this.cone(0.2 * s, 0.4 * s, trunk, x, 0.2 * s, z);
    const r = rng(Math.floor(x * 13 + z * 7 + 3));
    const blobs: Array<[number, number, number, number]> = [[0, 2.1, 0, 0.9], [0.55, 1.85, 0.2, 0.62], [-0.5, 1.95, -0.2, 0.66], [0.1, 2.55, 0.1, 0.6], [-0.2, 1.75, 0.5, 0.5], [0.3, 2.2, -0.5, 0.5]];
    blobs.forEach((bl, i) => {
      const c = shadeHex(leaf, (i % 3 - 1) * 0.04 + (r() - 0.5) * 0.03);
      this.sph(bl[3] * s, c, x + bl[0] * s, bl[1] * s, z + bl[2] * s, 1, 0.9, 1);
    });
    this.blob(x, z, 2.2 * s, 2.2 * s);
  }
  desk(x: number, z: number, w: number, d: number, ry = 0, top = '#b88a5c', h = 0.74): THREE.Group {
    const g = this.grp(x, 0, z, ry);
    this.box(w, 0.05, d, top, 0, h, 0, 0, g);
    this.box(w - 0.06, 0.04, d - 0.06, shadeHex(top, -0.12), 0, h - 0.045, 0, 0, g);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) this.box(0.05, h - 0.03, 0.05, '#3a3d46', sx * (w / 2 - 0.06), (h - 0.03) / 2, sz * (d / 2 - 0.06), 0, g);
    this.blob(x, z, w + 0.4, d + 0.4);
    return g;
  }
  sofa(x: number, z: number, w: number, c: C, ry = 0): THREE.Group {
    const g = this.grp(x, 0, z, ry);
    g.userData.keep = true;
    const base = typeof c === 'string' ? shadeHex(c, -0.06) : c;
    this.box(w, 0.2, 0.9, base, 0, 0.26, 0, 0, g);
    this.box(w, 0.52, 0.22, c, 0, 0.63, -0.37, 0, g).rotation.x = -0.08;
    for (const s of [-1, 1]) this.box(0.2, 0.42, 0.92, c, s * (w / 2 - 0.1), 0.5, 0, 0, g);
    const seats = w > 1.8 ? 3 : 2;
    const sw = (w - 0.44) / seats;
    for (let i = 0; i < seats; i++) {
      this.box(sw - 0.01, 0.14, 0.68, c, -(w - 0.44) / 2 + sw * (i + 0.5), 0.43, 0.06, 0, g);
      this.box(sw - 0.04, 0.34, 0.16, c, -(w - 0.44) / 2 + sw * (i + 0.5), 0.66, -0.22, 0, g).rotation.x = -0.18;
    }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) this.cyl(0.03, 0.12, '#2a2420', sx * (w / 2 - 0.1), 0.06, sz * 0.38, g, 12);
    this.blob(x, z, w + 0.6, 1.5);
    return g;
  }
  bed(x: number, z: number, ry: number, sheet: string, blanket: string, w = 1.05, l = 2.05): THREE.Group {
    const g = this.grp(x, 0, z, ry);
    g.userData.keep = true;
    this.box(w + 0.1, 0.22, l + 0.1, '#6b4a30', 0, 0.2, 0, 0, g);
    this.box(w + 0.14, 0.7, 0.08, '#6b4a30', 0, 0.55, -l / 2 - 0.04, 0, g);
    this.box(w + 0.1, 0.4, 0.08, '#6b4a30', 0, 0.4, l / 2 + 0.04, 0, g);
    this.box(w, 0.2, l, '#eae5dc', 0, 0.41, 0, 0, g);
    this.box(w - 0.02, 0.07, l * 0.62, blanket, 0, 0.55, l * 0.18, 0, g);
    this.box(w, 0.045, l * 0.2, shadeHex(blanket, 0.12), 0, 0.57, -l * 0.12, 0, g);
    for (const sx of [-0.24, 0.24]) this.box(0.4, 0.12, 0.3, sheet, sx * w * 1.2, 0.55, -l / 2 + 0.22, 0, g);
    this.blob(x, z, w + 0.9, l + 0.9, 1, ry);
    return g;
  }
  lamp(x: number, y: number, z: number, color = '#ffd9a0', on = true, kind: 'table' | 'floor' = 'table', glowSize = 1.4): THREE.Group {
    const g = this.grp(x, y, z);
    const h = kind === 'floor' ? 1.4 : 0.28;
    this.cyl(kind === 'floor' ? 0.14 : 0.07, 0.025, '#2a2420', 0, 0.013, 0, g, 20);
    this.cyl(0.012, h, '#2a2420', 0, h / 2, 0, g, 8);
    const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.17, 0.2, 24, 1, true), new THREE.MeshStandardMaterial({ color: '#f4e6c8', emissive: on ? color : '#000000', emissiveIntensity: on ? 1.4 : 0, side: THREE.DoubleSide, roughness: 0.9 }));
    this.own.push(shade.geometry, shade.material as THREE.Material);
    shade.position.y = h + 0.06;
    g.add(shade);
    if (on) this.glow(color, glowSize, x, y + h + 0.05, z, 0.55);
    return g;
  }
  books(x: number, y: number, z: number, n: number, ry = 0, seed = 1): void {
    const r = rng(seed);
    const cols = ['#a63d3d', '#2f5d8a', '#3f7f5a', '#c99a3a', '#6b4a8a', '#d6d0c2', '#8a5a3a', '#2c3e50', '#b85c38'];
    let o = 0;
    const g = this.grp(x, y, z, ry);
    for (let i = 0; i < n; i++) {
      const bw = 0.03 + r() * 0.03, bh = 0.18 + r() * 0.12;
      const bk = this.box(bw, bh, 0.2, cols[Math.floor(r() * cols.length)], o + bw / 2, bh / 2, 0, 0, g);
      if (r() < 0.2) bk.rotation.z = 0.12;
      o += bw + 0.004;
    }
  }
  poster(x: number, y: number, z: number, ry: number, w: number, h: number, seed: number, base = '#f4efe4'): void {
    const r = rng(seed);
    const cols = [this.p(seed), this.p(seed + 1), '#2f5d8a', '#e0a23f', '#3f8a6a'];
    const t = this.canvasTex(160, Math.round(160 * h / w), (g, tw, th) => {
      g.fillStyle = base;
      g.fillRect(0, 0, tw, th);
      for (let i = 0; i < 5; i++) {
        g.fillStyle = cols[Math.floor(r() * cols.length)];
        if (r() < 0.5) { g.beginPath(); g.arc(r() * tw, r() * th, 14 + r() * 36, 0, 7); g.fill(); } else g.fillRect(r() * tw * 0.7, r() * th * 0.7, 20 + r() * 60, 16 + r() * 50);
      }
      g.fillStyle = 'rgba(0,0,0,0.65)';
      g.fillRect(tw * 0.1, th * 0.86, tw * 0.5, 5);
      g.fillRect(tw * 0.1, th * 0.9, tw * 0.3, 4);
    });
    this.box(w + 0.05, h + 0.05, 0.03, '#2b2420', x, y, z, ry);
    const dx = Math.sin(ry) * 0.02, dz = Math.cos(ry) * 0.02;
    this.panel(w, h, t, x + dx, y, z + dz, ry);
  }
  window(w: number, h: number, tex: THREE.Texture, x: number, y: number, z: number, ry = 0, frame = '#f1efe9', shaft: string | null = null): void {
    const g = this.grp(x, y, z, ry);
    this.plane(w, h, this.basic(tex), 0, 0, 0, 0, 0, g);
    const t = 0.07;
    this.box(w + 2 * t, t, 0.12, frame, 0, h / 2, 0.02, 0, g);
    this.box(w + 2 * t, t, 0.12, frame, 0, -h / 2, 0.02, 0, g);
    this.box(t, h, 0.12, frame, -w / 2, 0, 0.02, 0, g);
    this.box(t, h, 0.12, frame, w / 2, 0, 0.02, 0, g);
    this.box(t * 0.6, h, 0.08, frame, 0, 0, 0.02, 0, g);
    this.box(w, t * 0.6, 0.08, frame, 0, h * 0.1, 0.02, 0, g);
    this.box(w + 0.2, 0.05, 0.22, frame, 0, -h / 2 - 0.04, 0.08, 0, g);
    if (shaft) {
      this.shaft(x, y - h * 0.1, z, ry, w * 0.8, 4.2, 0.9, shaft, 0.13);
      this.shaft(x + Math.cos(ry) * w * 0.25, y - h * 0.1, z - Math.sin(ry) * w * 0.25, ry, w * 0.25, 5.2, 0.85, shaft, 0.1);
    }
  }

  tick(dt: number, time: number): void {
    for (const l of this.looks) {
      this.g.localToWorld(this.tmp.copy(l.v));
      l.fig.lookAt(this.tmp);
    }
    // People hidden by a painted scene are not animated: no reason to spend phone battery on them.
    for (const f of this.figs) if (f.group.visible) f.update(dt, time);
    for (const u of this.upd) u(dt, time);
  }
  free(): void {
    for (const f of this.figs) f.dispose();
    for (const t of this.tex) t.dispose();
    for (const o of this.own) o.dispose();
    this.g.removeFromParent();
  }
}

/* ------------------------------------------------------------ texture painters */

export type G2 = CanvasRenderingContext2D;
export function skyGrad(g: G2, w: number, h: number, stops: Array<[number, string]>): void {
  const gr = g.createLinearGradient(0, 0, 0, h);
  for (const [o, c] of stops) gr.addColorStop(o, c);
  g.fillStyle = gr;
  g.fillRect(0, 0, w, h);
}
export function skylineTex(b: SB, w: number, h: number, mode: 'day' | 'night' | 'dusk', seed: number, accent: string, near = false): THREE.CanvasTexture {
  return b.canvasTex(w, h, (g) => {
    const r = rng(seed);
    if (mode === 'day') skyGrad(g, w, h, [[0, '#7fb8ee'], [1, '#d8ecfb']]);
    else if (mode === 'dusk') skyGrad(g, w, h, [[0, '#33407a'], [0.55, '#e48a6a'], [1, '#f7c58a']]);
    else skyGrad(g, w, h, [[0, '#070b1c'], [0.7, '#1b2347'], [1, '#2d2a55']]);
    if (mode !== 'day') {
      for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(255,255,255,${0.2 + r() * 0.5})`; g.fillRect(r() * w, r() * h * 0.4, 2, 2); }
    }
    const layers = near ? 2 : 3;
    for (let l = 0; l < layers; l++) {
      const base = mode === 'day' ? ['#9fb7cf', '#7f9ab6', '#5f7a98'][l] : mode === 'dusk' ? ['#6a5a86', '#4a4068', '#2e2848'][l] : ['#1a2040', '#141a36', '#0d1226'][l];
      let x = -10;
      while (x < w) {
        const bw = 40 + r() * 70, bh = h * (0.2 + r() * 0.35) * (1 + l * 0.2);
        g.fillStyle = base;
        g.fillRect(x, h - bh, bw, bh);
        if (l === layers - 1 || mode !== 'day') {
          for (let wy = h - bh + 8; wy < h - 8; wy += 11) {
            for (let wx = x + 5; wx < x + bw - 6; wx += 9) {
              const lit = r() < (mode === 'day' ? 0.12 : 0.45);
              g.fillStyle = lit ? (r() < 0.12 ? accent : mode === 'day' ? '#cfe6ff' : '#ffd9a0') : 'rgba(0,0,0,0.12)';
              g.fillRect(wx, wy, 4, 6);
            }
          }
        }
        x += bw + 2 + r() * 6;
      }
    }
  });
}
export function booksTex(b: SB, w: number, h: number, seed: number, shelves: number): THREE.CanvasTexture {
  return b.canvasTex(w, h, (g) => {
    const r = rng(seed);
    g.fillStyle = '#3a2a1e';
    g.fillRect(0, 0, w, h);
    const sh = h / shelves;
    const cols = ['#a63d3d', '#2f5d8a', '#3f7f5a', '#c99a3a', '#6b4a8a', '#d6d0c2', '#8a5a3a', '#2c3e50', '#b85c38'];
    for (let s = 0; s < shelves; s++) {
      let x = 6;
      const y1 = (s + 1) * sh - 8;
      while (x < w - 10) {
        const bw = 7 + r() * 11, bh = sh * (0.55 + r() * 0.35);
        g.fillStyle = cols[Math.floor(r() * cols.length)];
        g.fillRect(x, y1 - bh, bw, bh);
        g.fillStyle = 'rgba(255,255,255,0.25)';
        g.fillRect(x + 2, y1 - bh + 6, bw - 4, 2);
        x += bw + 1;
      }
      g.fillStyle = '#6b4a30';
      g.fillRect(0, y1, w, 8);
    }
  });
}
export function textTex(b: SB, w: number, h: number, bg: string | null, lines: Array<{ t: string; size: number; color: string; y: number; font?: string; x?: number; align?: CanvasTextAlign }>, border?: string): THREE.CanvasTexture {
  return b.canvasTex(w, h, (g) => {
    if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); } else g.clearRect(0, 0, w, h);
    if (border) { g.strokeStyle = border; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6); }
    for (const l of lines) {
      g.fillStyle = l.color;
      g.font = `${l.font ?? 'bold'} ${l.size}px "Helvetica Neue", Arial, sans-serif`;
      g.textAlign = l.align ?? 'center';
      g.textBaseline = 'middle';
      g.fillText(l.t, l.x ?? w / 2, l.y);
    }
  });
}
export function codeTex(b: SB, kind: 'code' | 'graph' | 'doc' | 'web' | 'call', accent: string, seed: number): THREE.CanvasTexture {
  return b.canvasTex(256, 160, (g, w, h) => {
    const r = rng(seed);
    if (kind === 'code') {
      g.fillStyle = '#10161f';
      g.fillRect(0, 0, w, h);
      const cols = ['#7fd0ff', '#ffcb6b', '#c3e88d', '#f78c6c', '#c792ea'];
      for (let y = 10, i = 0; y < h - 6; y += 12, i++) {
        let x = 10 + (i % 3) * 14;
        for (let k = 0; k < 4; k++) {
          const lw = 14 + r() * 34;
          g.fillStyle = cols[Math.floor(r() * cols.length)];
          g.fillRect(x, y, lw, 5);
          x += lw + 6;
        }
      }
    } else if (kind === 'graph') {
      g.fillStyle = '#0d1b24';
      g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(255,255,255,0.15)';
      g.lineWidth = 1;
      for (let i = 1; i < 6; i++) { g.beginPath(); g.moveTo(0, (h / 6) * i); g.lineTo(w, (h / 6) * i); g.stroke(); }
      g.strokeStyle = accent;
      g.lineWidth = 3;
      g.beginPath();
      for (let x = 0; x <= w; x += 8) { const y = h * 0.55 + Math.sin(x * 0.05) * h * 0.2 - x * 0.08 + r() * 6; if (x === 0) g.moveTo(x, y); else g.lineTo(x, y); }
      g.stroke();
      g.strokeStyle = '#6ee7a8';
      g.beginPath();
      for (let x = 0; x <= w; x += 8) { const y = h * 0.75 - Math.cos(x * 0.04) * h * 0.12 - x * 0.05; if (x === 0) g.moveTo(x, y); else g.lineTo(x, y); }
      g.stroke();
    } else if (kind === 'doc') {
      g.fillStyle = '#f2f4f7';
      g.fillRect(0, 0, w, h);
      g.fillStyle = accent;
      g.fillRect(0, 0, w, 22);
      for (let y = 34; y < h - 8; y += 14) { g.fillStyle = '#aab2bd'; g.fillRect(14, y, 60 + r() * (w - 90), 6); }
    } else if (kind === 'web') {
      g.fillStyle = '#eef2f7';
      g.fillRect(0, 0, w, h);
      g.fillStyle = '#2b3445';
      g.fillRect(0, 0, w, 16);
      g.fillStyle = accent;
      g.fillRect(14, 30, 110, 60);
      g.fillStyle = '#c4ccd8';
      for (let y = 34; y < 100; y += 14) g.fillRect(138, y, 90, 6);
      for (let i = 0; i < 3; i++) { g.fillStyle = '#d5dbe4'; g.fillRect(14 + i * 80, 108, 70, 40); }
    } else {
      g.fillStyle = '#1b1612';
      g.fillRect(0, 0, w, h);
      g.fillStyle = '#e1b36c';
      g.fillRect(8, 8, w - 16, h - 16);
    }
  });
}

export const V = (x: number, y: number, z: number): THREE.Vector3 => new THREE.Vector3(x, y, z);

/** Camera that looks at  with the subject centred (ndc 0 = frame centre; positive pushes the subject up). */
export function aim(pos: THREE.Vector3, focus: THREE.Vector3, fov: number, ndc = 0): { position: THREE.Vector3; target: THREE.Vector3; fov: number } {
  if (ndc === 0) return { position: pos, target: focus, fov };
  const dir = new THREE.Vector3().subVectors(focus, pos);
  const len = dir.length();
  const yaw = Math.atan2(dir.x, dir.z);
  const pitch = Math.atan2(dir.y, Math.hypot(dir.x, dir.z)) - Math.atan(ndc * Math.tan((fov * Math.PI) / 360));
  const target = new THREE.Vector3(Math.cos(pitch) * Math.sin(yaw), Math.sin(pitch), Math.cos(pitch) * Math.cos(yaw)).multiplyScalar(len).add(pos);
  return { position: pos, target, fov };
}

/* ------------------------------------------------------------ richer surface painters */

export function woodTex(b: SB, base: string, plank = 0.16, seed = 3, rx = 6, ry = 5): THREE.CanvasTexture {
  const t = b.canvasTex(256, 256, (g, w, h) => {
    const r = rng(seed);
    const n = Math.max(2, Math.round(1 / plank / 2));
    const ph = h / n;
    for (let i = 0; i < n; i++) {
      g.fillStyle = shadeHex(base, (r() - 0.5) * 0.07);
      g.fillRect(0, i * ph, w, ph);
      g.strokeStyle = 'rgba(0,0,0,0.07)';
      for (let k = 0; k < 7; k++) {
        const y = i * ph + r() * ph;
        g.beginPath();
        g.moveTo(0, y);
        g.bezierCurveTo(w * 0.3, y + (r() - 0.5) * 5, w * 0.6, y + (r() - 0.5) * 5, w, y + (r() - 0.5) * 3);
        g.lineWidth = 0.6 + r();
        g.stroke();
      }
      g.fillStyle = 'rgba(0,0,0,0.28)';
      g.fillRect(0, i * ph, w, 1.4);
      const sx = r() * w;
      g.fillRect(sx, i * ph, 1.3, ph);
    }
  });
  return b.repeat(t, rx, ry);
}
export function tileTex(b: SB, c1: string, c2: string, grout = '#b9bec6', rx = 8, ry = 8, n = 2): THREE.CanvasTexture {
  const t = b.canvasTex(128, 128, (g, w, h) => {
    const r = rng(11);
    const s = w / n;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      g.fillStyle = (x + y) % 2 ? c1 : c2;
      g.fillRect(x * s, y * s, s, s);
      g.fillStyle = `rgba(255,255,255,${0.05 + r() * 0.08})`;
      g.fillRect(x * s + 2, y * s + 2, s - 4, s * 0.4);
    }
    g.strokeStyle = grout;
    g.lineWidth = 2.5;
    for (let i = 0; i <= n; i++) {
      g.beginPath(); g.moveTo(i * s, 0); g.lineTo(i * s, h); g.stroke();
      g.beginPath(); g.moveTo(0, i * s); g.lineTo(w, i * s); g.stroke();
    }
  });
  return b.repeat(t, rx, ry);
}
export function speckleTex(b: SB, base: string, speck: string, rx = 6, ry = 6, seed = 5): THREE.CanvasTexture {
  const t = b.canvasTex(128, 128, (g, w, h) => {
    const r = rng(seed);
    g.fillStyle = base;
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 700; i++) {
      g.fillStyle = r() < 0.5 ? speck : shadeHex(base, (r() - 0.5) * 0.1);
      g.globalAlpha = 0.2 + r() * 0.4;
      g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2);
    }
    g.globalAlpha = 1;
  });
  return b.repeat(t, rx, ry);
}
export function brickTex(b: SB, base = '#9b4a38', rx = 5, ry = 2): THREE.CanvasTexture {
  const t = b.canvasTex(256, 256, (g, w, h) => {
    const r = rng(17);
    g.fillStyle = '#6e6a64';
    g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 16) for (let x = (y / 16) % 2 ? -16 : 0; x < w; x += 32) {
      g.fillStyle = shadeHex(base, (r() - 0.5) * 0.12);
      g.fillRect(x + 1.5, y + 1.5, 29, 13);
      g.fillStyle = 'rgba(255,255,255,0.07)';
      g.fillRect(x + 1.5, y + 1.5, 29, 3);
    }
  });
  return b.repeat(t, rx, ry);
}
/** soft backdrop gradient with optional stars and a moon */
export function backdropTex(b: SB, stops: Array<[number, string]>, opt: { stars?: boolean; moon?: boolean; skyline?: string; seed?: number } = {}): THREE.CanvasTexture {
  return b.canvasTex(512, 256, (g, w, h) => {
    skyGrad(g, w, h, stops);
    const r = rng(opt.seed ?? 4);
    if (opt.stars) for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(255,255,255,${0.25 + r() * 0.6})`; g.fillRect(r() * w, r() * h * 0.6, 1.6, 1.6); }
    if (opt.moon) {
      const gr = g.createRadialGradient(w * 0.72, h * 0.28, 4, w * 0.72, h * 0.28, 60);
      gr.addColorStop(0, 'rgba(255,255,255,0.55)');
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr;
      g.fillRect(0, 0, w, h);
      g.fillStyle = '#f4f1e2';
      g.beginPath(); g.arc(w * 0.72, h * 0.28, 17, 0, 7); g.fill();
      g.fillStyle = 'rgba(180,176,160,0.4)';
      g.beginPath(); g.arc(w * 0.72 - 5, h * 0.28 - 3, 4, 0, 7); g.fill();
      g.beginPath(); g.arc(w * 0.72 + 6, h * 0.28 + 5, 3, 0, 7); g.fill();
    }
    if (opt.skyline) {
      let x = -10;
      while (x < w) {
        const bw = 22 + r() * 40, bh = h * (0.12 + r() * 0.3);
        g.fillStyle = opt.skyline;
        g.fillRect(x, h - bh, bw, bh);
        g.fillStyle = 'rgba(255,214,150,0.8)';
        for (let wy = h - bh + 6; wy < h - 6; wy += 9) for (let wx = x + 4; wx < x + bw - 5; wx += 8) if (r() < 0.32) g.fillRect(wx, wy, 3, 4);
        x += bw + r() * 4;
      }
    }
  });
}
