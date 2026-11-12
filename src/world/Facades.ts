import * as THREE from 'three';
import type { CityId } from '../engine/types';
import type { CityStyle, Exclusion } from './Landmarks';

/**
 * Architecturally varied city fill: glass curtain walls, masonry midrises, art deco stacks,
 * rowhouses and Victorians, stucco strips, warehouses and garden apartments. Every archetype
 * is baked into a handful of vertex-coloured BufferGeometries (one per material), so the whole
 * fill costs about ten draw calls. Windows come from shared canvas atlases whose UVs are set per
 * wall so a window keeps a constant real-world size.
 */

type Rng = () => number;

function mulberry32(seed: number): Rng {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashId(id: string, salt: number): number {
  let h = (2166136261 ^ salt) >>> 0;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619) >>> 0;
  return h;
}
const clamp = (v: number, a: number, b: number): number => Math.max(a, Math.min(b, v));
const col = (hex: string): THREE.Color => new THREE.Color(hex);
const shade = (c: THREE.Color, k: number): THREE.Color => c.clone().multiplyScalar(k);
const rr = (r: Rng, a: number, b: number): number => a + (b - a) * r();
const pickOf = <T,>(r: Rng, a: readonly T[]): T => a[Math.floor(r() * a.length) % a.length];

// ------------------------------------------------------------------ geometry accumulator

class Bucket {
  readonly p: number[] = [];
  readonly n: number[] = [];
  readonly u: number[] = [];
  readonly c: number[] = [];
  readonly i: number[] = [];

  /** v: 4 corners (12 numbers) CCW seen from outside; colours c0 for the first two, c1 for the last two. */
  quad(v: ArrayLike<number>, nx: number, ny: number, nz: number, uv: ArrayLike<number>, c0: THREE.Color, c1: THREE.Color): void {
    const b = this.p.length / 3;
    for (let k = 0; k < 12; k++) this.p.push(v[k]);
    for (let k = 0; k < 4; k++) this.n.push(nx, ny, nz);
    for (let k = 0; k < 8; k++) this.u.push(uv[k]);
    this.c.push(c0.r, c0.g, c0.b, c0.r, c0.g, c0.b, c1.r, c1.g, c1.b, c1.r, c1.g, c1.b);
    this.i.push(b, b + 1, b + 2, b, b + 2, b + 3);
  }

  /** Quad with computed normal and flat uvs (for slopes and ground decals). */
  quadAuto(v: number[], c: THREE.Color, uv?: number[]): void {
    const ax = v[3] - v[0], ay = v[4] - v[1], az = v[5] - v[2];
    const bx = v[6] - v[0], by = v[7] - v[1], bz = v[8] - v[2];
    let nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx;
    const l = Math.hypot(nx, ny, nz) || 1;
    nx /= l; ny /= l; nz /= l;
    this.quad(v, nx, ny, nz, uv ?? [0, 0, 1, 0, 1, 1, 0, 1], c, c);
  }

  tri(v: number[], c: THREE.Color): void {
    const ax = v[3] - v[0], ay = v[4] - v[1], az = v[5] - v[2];
    const bx = v[6] - v[0], by = v[7] - v[1], bz = v[8] - v[2];
    let nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx;
    const l = Math.hypot(nx, ny, nz) || 1;
    nx /= l; ny /= l; nz /= l;
    const b = this.p.length / 3;
    for (let k = 0; k < 9; k++) this.p.push(v[k]);
    for (let k = 0; k < 3; k++) { this.n.push(nx, ny, nz); this.c.push(c.r, c.g, c.b); }
    this.u.push(0, 0, 1, 0, 0.5, 1);
    this.i.push(b, b + 1, b + 2);
  }

  append(geo: THREE.BufferGeometry, m: THREE.Matrix4, c: THREE.Color): void {
    const pos = geo.getAttribute('position');
    const nor = geo.getAttribute('normal');
    const uv = geo.getAttribute('uv');
    const idx = geo.getIndex();
    const nm = new THREE.Matrix3().getNormalMatrix(m);
    const base = this.p.length / 3;
    const v = new THREE.Vector3();
    for (let k = 0; k < pos.count; k++) {
      v.fromBufferAttribute(pos, k).applyMatrix4(m);
      this.p.push(v.x, v.y, v.z);
      v.fromBufferAttribute(nor, k).applyMatrix3(nm).normalize();
      this.n.push(v.x, v.y, v.z);
      this.u.push(uv ? uv.getX(k) : 0, uv ? uv.getY(k) : 0);
      this.c.push(c.r, c.g, c.b);
    }
    if (idx) for (let k = 0; k < idx.count; k++) this.i.push(base + idx.getX(k));
    else for (let k = 0; k < pos.count; k++) this.i.push(base + k);
  }

  get tris(): number {
    return this.i.length / 3;
  }

  build(): THREE.BufferGeometry | null {
    if (this.i.length === 0) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.u, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.setIndex(this.p.length / 3 > 65535 ? new THREE.Uint32BufferAttribute(this.i, 1) : new THREE.Uint16BufferAttribute(this.i, 1));
    g.computeBoundingSphere();
    g.computeBoundingBox();
    return g;
  }
}

// ------------------------------------------------------------------ texture atlases

interface TexCfg { cw: number; ch: number; cols: number; rows: number }
const T = {
  glass: { cw: 1.2, ch: 3.8, cols: 8, rows: 8 },
  mas: { cw: 3.0, ch: 3.4, cols: 6, rows: 8 },
  deco: { cw: 2.4, ch: 3.4, cols: 8, rows: 8 },
  row: { cw: 2.8, ch: 3.0, cols: 6, rows: 8 },
  low: { cw: 4.0, ch: 3.4, cols: 4, rows: 6 },
  shop: { cw: 4.0, ch: 4.0, cols: 4, rows: 1 },
  plain: { cw: 4.0, ch: 4.0, cols: 1, rows: 1 },
} satisfies Record<string, TexCfg>;

interface TexSet { map: THREE.CanvasTexture; emi: THREE.CanvasTexture }

function mkc(w: number, h: number): { c: HTMLCanvasElement; g: CanvasRenderingContext2D } {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  if (!g) throw new Error('2D canvas unavailable');
  return { c, g };
}
function finishTex(c: HTMLCanvasElement): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** 1 warm, 2 cool, 3 TV blue, 4 dim amber, 5 bright white (0 = dark). */
function litGrid(r: Rng, cols: number, rows: number, lit: number, office: boolean): number[][] {
  const g: number[][] = [];
  const colBias = Array.from({ length: cols }, () => 0.55 + r() * 0.9);
  for (let y = 0; y < rows; y++) {
    const floorOn = office ? r() < lit * 1.15 : false;
    const rowBias = 0.35 + r() * 1.3;
    const run0 = Math.floor(r() * cols);
    const runLen = 2 + Math.floor(r() * (cols - 1));
    const row: number[] = [];
    for (let x = 0; x < cols; x++) {
      let code = 0;
      if (office) {
        const inRun = (x - run0 + cols) % cols < runLen;
        if (floorOn && (inRun || r() < 0.25)) code = r() < 0.12 ? 2 : r() < 0.75 ? 5 : 1;
        else if (r() < lit * 0.12) code = 4;
      } else if (y > 0 && r() < 0.28) {
        code = g[y - 1][x];
      } else if (r() < lit * rowBias * colBias[x]) {
        const k = r();
        code = k < 0.55 ? 1 : k < 0.7 ? 4 : k < 0.82 ? 2 : k < 0.93 ? 3 : 5;
      }
      row.push(code);
    }
    g.push(row);
  }
  return g;
}

const LIT: Record<number, [string, string]> = {
  1: ['#ffe6b4', '#f2a655'],
  2: ['#e8f4ff', '#9bc2ee'],
  3: ['#07101e', '#0a1630'],
  4: ['#e3a455', '#8c5a26'],
  5: ['#fff9ee', '#f2dcb0'],
};

function litFill(g: CanvasRenderingContext2D, code: number, x: number, y: number, w: number, h: number, r: Rng, simple: boolean): void {
  const [c0, c1] = LIT[code];
  const gr = g.createLinearGradient(0, y, 0, y + h);
  gr.addColorStop(0, c0);
  gr.addColorStop(1, c1);
  g.fillStyle = gr;
  g.fillRect(x, y, w, h);
  if (code === 3) {
    g.fillStyle = '#5f9bff';
    g.fillRect(x + w * 0.22, y + h * 0.5, w * 0.56, h * 0.28);
    g.fillStyle = 'rgba(120,170,255,0.3)';
    g.fillRect(x, y, w, h);
  } else if (!simple && code !== 5) {
    const k = r();
    if (k < 0.4) {
      g.fillStyle = 'rgba(130,56,30,0.6)';
      const left = r() < 0.5;
      g.fillRect(left ? x : x + w * 0.62, y, w * 0.38, h);
    } else if (k < 0.62) {
      g.fillStyle = 'rgba(0,0,0,0.42)';
      for (let yy = y + 1; yy < y + h * 0.55; yy += 3) g.fillRect(x, yy, w, 1);
    } else if (k < 0.75) {
      g.fillStyle = 'rgba(30,70,30,0.7)';
      g.fillRect(x + w * 0.1, y + h * 0.78, w * 0.3, h * 0.22);
    }
  }
  g.fillStyle = 'rgba(0,0,0,0.28)';
  g.fillRect(x, y, w, Math.max(2, h * 0.08));
}

interface CellSpec {
  wx: number; wy: number; ww: number; wh: number;
  wall: string; trim: string; glass: string;
  mx: number; my: number; frame: number;
  sill: boolean; lintel: boolean; brick: boolean; pier: boolean; office: boolean;
}

function paintCells(s: CellSpec, cols: number, rows: number, W: number, H: number, lit: number, seed: number): TexSet {
  const r = mulberry32(seed);
  const a = mkc(cols * W, rows * H);
  const e = mkc(cols * W, rows * H);
  a.g.fillStyle = s.wall;
  a.g.fillRect(0, 0, cols * W, rows * H);
  e.g.fillStyle = '#000';
  e.g.fillRect(0, 0, cols * W, rows * H);
  const states = litGrid(r, cols, rows, lit, s.office);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const ox = x * W, oy = y * H;
      const wx = Math.round(ox + s.wx * W), wy = Math.round(oy + s.wy * H);
      const ww = Math.round(s.ww * W), wh = Math.round(s.wh * H);
      const fr = s.frame;
      if (s.brick) {
        a.g.fillStyle = 'rgba(0,0,0,0.10)';
        for (let yy = oy + 2; yy < oy + H; yy += 4) {
          a.g.fillRect(ox, yy, W, 1);
          a.g.fillStyle = 'rgba(0,0,0,0.06)';
          for (let xx = ox + ((yy >> 2) & 1) * 4; xx < ox + W; xx += 8) a.g.fillRect(xx, yy, 1, 4);
          a.g.fillStyle = 'rgba(0,0,0,0.10)';
        }
        a.g.fillStyle = `rgba(255,255,255,${0.02 + r() * 0.04})`;
        a.g.fillRect(ox + r() * W * 0.6, oy + r() * H * 0.6, W * 0.35, H * 0.3);
      }
      if (s.pier) {
        a.g.fillStyle = 'rgba(0,0,0,0.13)';
        for (let xx = ox; xx < ox + W; xx += 5) if (xx < wx - fr - 2 || xx > wx + ww + fr + 1) a.g.fillRect(xx, oy, 1, H);
        a.g.fillStyle = s.trim;
        a.g.fillRect(wx - fr - 3, wy + wh + fr, ww + 2 * fr + 6, Math.round(H * 0.12));
        a.g.fillStyle = 'rgba(0,0,0,0.22)';
        a.g.fillRect(wx - fr - 3, wy + wh + fr + Math.round(H * 0.12), ww + 2 * fr + 6, 2);
      }
      a.g.fillStyle = s.trim;
      a.g.fillRect(wx - fr, wy - fr, ww + 2 * fr, wh + 2 * fr);
      const gg = a.g.createLinearGradient(0, wy, 0, wy + wh);
      gg.addColorStop(0, '#0b111c');
      gg.addColorStop(1, s.glass);
      a.g.fillStyle = gg;
      a.g.fillRect(wx, wy, ww, wh);
      a.g.fillStyle = 'rgba(0,0,0,0.55)';
      a.g.fillRect(wx, wy, ww, 2);
      a.g.fillRect(wx, wy, 2, wh);
      a.g.fillStyle = s.trim;
      for (let i = 1; i < s.mx; i++) a.g.fillRect(Math.round(wx + (ww * i) / s.mx) - 1, wy, 2, wh);
      for (let j = 1; j < s.my; j++) a.g.fillRect(wx, Math.round(wy + (wh * j) / s.my) - 1, ww, 2);
      if (s.sill) {
        a.g.fillStyle = s.trim;
        a.g.fillRect(wx - fr - 2, wy + wh + fr, ww + 2 * fr + 4, 3);
        a.g.fillStyle = 'rgba(0,0,0,0.4)';
        a.g.fillRect(wx - fr - 2, wy + wh + fr + 3, ww + 2 * fr + 4, 2);
      }
      if (s.lintel) {
        a.g.fillStyle = s.trim;
        a.g.fillRect(wx - fr - 2, wy - fr - 4, ww + 2 * fr + 4, 4);
        a.g.fillStyle = 'rgba(0,0,0,0.25)';
        a.g.fillRect(wx - fr - 2, wy - fr, ww + 2 * fr + 4, 2);
      }
      a.g.fillStyle = 'rgba(0,0,0,0.14)';
      a.g.fillRect(ox, oy + H - 2, W, 2);
      const code = states[y][x];
      if (code) {
        litFill(e.g, code, wx, wy, ww, wh, r, false);
        e.g.fillStyle = '#000';
        for (let i = 1; i < s.mx; i++) e.g.fillRect(Math.round(wx + (ww * i) / s.mx) - 1, wy, 2, wh);
        for (let j = 1; j < s.my; j++) e.g.fillRect(wx, Math.round(wy + (wh * j) / s.my) - 1, ww, 2);
      }
    }
  }
  return { map: finishTex(a.c), emi: finishTex(e.c) };
}

function paintGlass(): TexSet {
  const { cols, rows } = T.glass;
  const W = 48, H = 128, SP = 26;
  const r = mulberry32(9101);
  const a = mkc(cols * W, rows * H);
  const e = mkc(cols * W, rows * H);
  e.g.fillStyle = '#000';
  e.g.fillRect(0, 0, cols * W, rows * H);
  const st = litGrid(r, cols, rows, 0.5, true);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const ox = x * W, oy = y * H;
      const gr = a.g.createLinearGradient(0, oy, 0, oy + H - SP);
      gr.addColorStop(0, '#a9bddb');
      gr.addColorStop(1, '#6a7f9f');
      a.g.fillStyle = gr;
      a.g.fillRect(ox, oy, W, H - SP);
      a.g.fillStyle = `rgba(255,255,255,${r() * 0.1})`;
      a.g.fillRect(ox, oy, W, H - SP);
      a.g.fillStyle = '#c3cad6';
      a.g.fillRect(ox, oy + H - SP, W, SP);
      a.g.fillStyle = '#4e5a70';
      a.g.fillRect(ox, oy + H - SP, W, 2);
      a.g.fillStyle = '#2a3243';
      a.g.fillRect(ox, oy + H - 2, W, 2);
      a.g.fillStyle = '#e3e8f0';
      a.g.fillRect(ox, oy, 2, H);
      a.g.fillStyle = '#6d7787';
      a.g.fillRect(ox + 2, oy, 1, H);
      const code = st[y][x];
      if (code) {
        litFill(e.g, code, ox + 3, oy + 4, W - 3, H - SP - 6, r, true);
        e.g.fillStyle = 'rgba(0,0,0,0.38)';
        e.g.fillRect(ox + 3, oy + H - SP - 18, W - 3, 14);
        if (r() < 0.3) {
          e.g.fillStyle = '#000';
          e.g.fillRect(ox + W * (0.3 + r() * 0.4), oy + 4, 2, H - SP - 6);
        }
      }
    }
  }
  return { map: finishTex(a.c), emi: finishTex(e.c) };
}

function paintShop(): TexSet {
  const S = 256;
  const a = mkc(S * 4, S);
  const e = mkc(S * 4, S);
  e.g.fillStyle = '#000';
  e.g.fillRect(0, 0, S * 4, S);
  const signs = ['#ff5a4a', '#4ad0ff', '#ffd24a', '#7dff9a'];
  for (let i = 0; i < 4; i++) {
    const ox = i * S;
    a.g.fillStyle = '#cfc9bd';
    a.g.fillRect(ox, 0, S, S);
    a.g.fillStyle = '#8f887c';
    a.g.fillRect(ox, S - 36, S, 36);
    if (i === 0 || i === 3) {
      if (i === 3) {
        for (let k = 0; k < 8; k++) {
          a.g.fillStyle = k % 2 ? '#f1e6d0' : '#c9473c';
          a.g.fillRect(ox + 14 + k * 28, 36, 28, 44);
        }
        a.g.fillStyle = 'rgba(0,0,0,0.3)';
        a.g.fillRect(ox + 14, 78, 224, 4);
      } else {
        a.g.fillStyle = '#2b2f3a';
        a.g.fillRect(ox + 14, 8, S - 28, 40);
        a.g.fillStyle = '#4a4f60';
        for (let k = 0; k < 6; k++) a.g.fillRect(ox + 30 + k * 32, 20, 20, 16);
      }
      a.g.fillStyle = '#1d2433';
      a.g.fillRect(ox + 16, 86, S - 32, 134);
      a.g.fillStyle = '#c8c2b6';
      a.g.fillRect(ox + 16, 86, 4, 134);
      a.g.fillRect(ox + S - 20, 86, 4, 134);
      a.g.fillRect(ox + 118, 86, 4, 134);
      const sg = i === 0 ? signs[0] : '#ffd8a0';
      if (i === 0) {
        e.g.fillStyle = sg;
        e.g.fillRect(ox + 14, 8, S - 28, 40);
        e.g.fillStyle = '#000';
        for (let k = 0; k < 6; k++) e.g.fillRect(ox + 30 + k * 32, 20, 6, 16);
      }
      const gr = e.g.createLinearGradient(0, 86, 0, 220);
      gr.addColorStop(0, '#fff0cc');
      gr.addColorStop(1, '#e8a05c');
      e.g.fillStyle = gr;
      e.g.fillRect(ox + 20, 90, 98, 126);
      e.g.fillRect(ox + 126, 90, 106, 126);
      e.g.fillStyle = 'rgba(40,20,10,0.7)';
      for (let k = 0; k < 4; k++) e.g.fillRect(ox + 28 + k * 26, 150 + (k % 2) * 20, 18, 50);
      if (i === 3) {
        e.g.fillStyle = '#ffe9b0';
        for (let k = 0; k < 7; k++) e.g.fillRect(ox + 20 + k * 34, 84, 8, 8);
      }
    } else if (i === 1) {
      a.g.fillStyle = '#7d8590';
      a.g.fillRect(ox + 10, 40, S - 20, 180);
      a.g.fillStyle = 'rgba(0,0,0,0.35)';
      for (let yy = 44; yy < 220; yy += 8) a.g.fillRect(ox + 10, yy, S - 20, 2);
      a.g.fillStyle = '#9a4b6a';
      a.g.fillRect(ox + 60, 120, 50, 40);
      e.g.fillStyle = '#6b7f9a';
      e.g.fillRect(ox + 20, 24, S - 40, 8);
    } else {
      a.g.fillStyle = '#20293a';
      a.g.fillRect(ox + 10, 52, S - 20, 168);
      a.g.fillStyle = '#9aa3b0';
      for (const xx of [10, 70, 130, 186, S - 14]) a.g.fillRect(ox + xx, 52, 4, 168);
      a.g.fillStyle = '#4b5365';
      a.g.fillRect(ox + 10, 14, S - 20, 28);
      const gr = e.g.createLinearGradient(0, 52, 0, 220);
      gr.addColorStop(0, '#f4fbff');
      gr.addColorStop(1, '#b9d6f2');
      e.g.fillStyle = gr;
      e.g.fillRect(ox + 14, 56, S - 28, 160);
      e.g.fillStyle = '#000';
      for (const xx of [70, 130, 186]) e.g.fillRect(ox + xx, 56, 4, 160);
      e.g.fillStyle = 'rgba(30,50,80,0.5)';
      e.g.fillRect(ox + 40, 150, 120, 36);
      e.g.fillStyle = '#e8f4ff';
      e.g.fillRect(ox + 20, 20, S - 40, 12);
    }
  }
  return { map: finishTex(a.c), emi: finishTex(e.c) };
}

function paintPlain(): THREE.CanvasTexture {
  const r = mulberry32(777);
  const a = mkc(256, 256);
  a.g.fillStyle = '#d8d8d8';
  a.g.fillRect(0, 0, 256, 256);
  for (let x = 0; x < 256; x += 8) {
    a.g.fillStyle = 'rgba(0,0,0,0.07)';
    a.g.fillRect(x, 0, 2, 256);
    a.g.fillStyle = 'rgba(255,255,255,0.05)';
    a.g.fillRect(x + 2, 0, 1, 256);
  }
  for (let k = 0; k < 900; k++) {
    a.g.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '255,255,255'},${r() * 0.05})`;
    a.g.fillRect(r() * 256, r() * 256, 2 + r() * 6, 2 + r() * 6);
  }
  return finishTex(a.c);
}

interface Atlas {
  glass: TexSet; mas: TexSet; deco: TexSet; row: TexSet; low: TexSet; shop: TexSet; plain: THREE.CanvasTexture;
  radial: THREE.CanvasTexture;
}
let ATLAS: Atlas | null = null;
function atlas(): Atlas {
  if (ATLAS) return ATLAS;
  const rad = mkc(128, 128);
  const gr = rad.g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.35, 'rgba(255,255,255,0.45)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  rad.g.fillStyle = gr;
  rad.g.fillRect(0, 0, 128, 128);
  const radial = new THREE.CanvasTexture(rad.c);
  radial.colorSpace = THREE.SRGBColorSpace;
  ATLAS = {
    glass: paintGlass(),
    mas: paintCells(
      { wx: 0.2, wy: 0.14, ww: 0.6, wh: 0.7, wall: '#bdb8b0', trim: '#f0ebe0', glass: '#2a3548', mx: 2, my: 2, frame: 3, sill: true, lintel: true, brick: true, pier: false, office: false },
      T.mas.cols, T.mas.rows, 84, 96, 0.55, 3101,
    ),
    deco: paintCells(
      { wx: 0.29, wy: 0.1, ww: 0.42, wh: 0.74, wall: '#bfbab0', trim: '#ebe5d6', glass: '#27324a', mx: 2, my: 4, frame: 2, sill: false, lintel: false, brick: false, pier: true, office: true },
      T.deco.cols, T.deco.rows, 64, 90, 0.5, 3202,
    ),
    row: paintCells(
      { wx: 0.27, wy: 0.14, ww: 0.4, wh: 0.64, wall: '#b8b0a8', trim: '#e8e0d2', glass: '#222c3e', mx: 2, my: 3, frame: 3, sill: true, lintel: true, brick: true, pier: false, office: false },
      T.row.cols, T.row.rows, 84, 90, 0.5, 3303,
    ),
    low: paintCells(
      { wx: 0.1, wy: 0.24, ww: 0.8, wh: 0.4, wall: '#d6d0c4', trim: '#f4f0e6', glass: '#2c3a50', mx: 4, my: 1, frame: 2, sill: false, lintel: false, brick: false, pier: false, office: true },
      T.low.cols, T.low.rows, 120, 102, 0.42, 3404,
    ),
    shop: paintShop(),
    plain: paintPlain(),
    radial,
  };
  return ATLAS;
}

interface Mats {
  glass: THREE.MeshStandardMaterial; mas: THREE.MeshStandardMaterial; deco: THREE.MeshStandardMaterial;
  row: THREE.MeshStandardMaterial; low: THREE.MeshStandardMaterial; shop: THREE.MeshStandardMaterial;
  plain: THREE.MeshStandardMaterial; glow: THREE.MeshBasicMaterial; pool: THREE.MeshBasicMaterial;
}
let MATS: Mats | null = null;
function materials(): Mats {
  const A = atlas();
  if (MATS) return MATS;
  const std = (t: TexSet, rough: number, extra: Partial<THREE.MeshStandardMaterialParameters> = {}): THREE.MeshStandardMaterial =>
    new THREE.MeshStandardMaterial({ map: t.map, emissiveMap: t.emi, emissive: '#ffffff', emissiveIntensity: 1.3, vertexColors: true, roughness: rough, ...extra });
  MATS = {
    glass: std(A.glass, 0.26, { metalness: 0.35, envMapIntensity: 1.3 }),
    mas: std(A.mas, 0.8),
    deco: std(A.deco, 0.72),
    row: std(A.row, 0.82),
    low: std(A.low, 0.85),
    shop: std(A.shop, 0.6),
    plain: new THREE.MeshStandardMaterial({ map: A.plain, vertexColors: true, roughness: 0.9 }),
    glow: new THREE.MeshBasicMaterial({ vertexColors: true }),
    pool: new THREE.MeshBasicMaterial({
      map: A.radial, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    }),
  };
  return MATS;
}

// ------------------------------------------------------------------ glow billboards (halos, aircraft warning lights)

interface GlowPt { x: number; y: number; z: number; c: THREE.Color; size: number; phase: number }

function glowMesh(list: GlowPt[]): THREE.Mesh | null {
  if (list.length === 0) return null;
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  const pos = new Float32Array(list.length * 3);
  const colr = new Float32Array(list.length * 3);
  const size = new Float32Array(list.length);
  const ph = new Float32Array(list.length);
  list.forEach((p, k) => {
    pos.set([p.x, p.y, p.z], k * 3);
    colr.set([p.c.r, p.c.g, p.c.b], k * 3);
    size[k] = p.size;
    ph[k] = p.phase;
  });
  g.setAttribute('iPos', new THREE.InstancedBufferAttribute(pos, 3));
  g.setAttribute('iColor', new THREE.InstancedBufferAttribute(colr, 3));
  g.setAttribute('iSize', new THREE.InstancedBufferAttribute(size, 1));
  g.setAttribute('iPhase', new THREE.InstancedBufferAttribute(ph, 1));
  g.instanceCount = list.length;
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTime: { value: 0 } }]),
    vertexShader: /* glsl */ `
      attribute vec3 iPos; attribute vec3 iColor; attribute float iSize; attribute float iPhase;
      uniform float uTime;
      varying vec2 vUv; varying vec3 vCol; varying float vA; varying float vFogDepth;
      void main() {
        vec4 mv = modelViewMatrix * vec4(iPos, 1.0);
        mv.xy += position.xy * iSize;
        vUv = position.xy;
        vCol = iColor;
        float a = 1.0;
        if (iPhase > -0.5) { a = 0.12 + 0.88 * smoothstep(-0.15, 0.55, sin(uTime * 2.3 + iPhase * 6.2831)); }
        vA = a;
        vFogDepth = -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 fogColor; uniform float fogNear; uniform float fogFar;
      varying vec2 vUv; varying vec3 vCol; varying float vA; varying float vFogDepth;
      void main() {
        float d = length(vUv);
        if (d > 1.0) discard;
        float core = exp(-d * d * 14.0);
        float halo = pow(1.0 - d, 2.6) * 0.5;
        float ff = smoothstep(fogNear, fogFar, vFogDepth);
        vec3 c = vCol * (core * 1.7 + halo) * vA * (1.0 - ff * 0.9);
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const m = new THREE.Mesh(g, mat);
  m.frustumCulled = false;
  m.renderOrder = 5;
  m.onBeforeRender = () => {
    mat.uniforms.uTime.value = performance.now() * 0.001;
  };
  return m;
}

// ------------------------------------------------------------------ building context

interface Ctx {
  rng: Rng;
  style: CityStyle;
  accent: THREE.Color;
  id: CityId;
  glass: Bucket; mas: Bucket; deco: Bucket; row: Bucket; low: Bucket; shop: Bucket; plain: Bucket; glow: Bucket; pool: Bucket;
  pts: GlowPt[];
  pal: THREE.Color[];
}

function newCtx(id: CityId, style: CityStyle, accent: THREE.Color, rng: Rng): Ctx {
  return {
    rng, style, accent, id,
    glass: new Bucket(), mas: new Bucket(), deco: new Bucket(), row: new Bucket(), low: new Bucket(), shop: new Bucket(),
    plain: new Bucket(), glow: new Bucket(), pool: new Bucket(), pts: [],
    pal: style.buildingColors.map((c) => col(c)),
  };
}

const ROOF = col('#2b2d34');

function palette(ctx: Ctx, lift = 1.5): THREE.Color {
  const c = pickOf(ctx.rng, ctx.pal).clone();
  c.offsetHSL((ctx.rng() - 0.5) * 0.02, 0, (ctx.rng() - 0.5) * 0.05);
  return c.multiplyScalar(lift);
}

function glowPt(ctx: Ctx, x: number, y: number, z: number, c: THREE.Color, size: number, phase = -1): void {
  ctx.pts.push({ x, y, z, c, size, phase });
}

/** Four textured walls with constant world-size UVs. Face bitmask: 1 +z, 2 -z, 4 +x, 8 -x. */
function walls(bk: Bucket, t: TexCfg, rng: Rng, x0: number, z0: number, x1: number, z1: number, y0: number, y1: number, c0: THREE.Color, c1: THREE.Color, faces = 15): void {
  const vo = Math.floor(rng() * t.rows) / t.rows;
  const v1 = vo + (y1 - y0) / t.ch / t.rows;
  const f = (blx: number, blz: number, brx: number, brz: number, nx: number, nz: number, bit: number): void => {
    const u0 = Math.floor(rng() * t.cols) / t.cols;
    if (!(faces & bit)) return;
    const len = Math.hypot(brx - blx, brz - blz);
    const u1 = u0 + len / t.cw / t.cols;
    bk.quad([blx, y0, blz, brx, y0, brz, brx, y1, brz, blx, y1, blz], nx, 0, nz, [u0, vo, u1, vo, u1, v1, u0, v1], c0, c1);
  };
  f(x0, z1, x1, z1, 0, 1, 1);
  f(x1, z0, x0, z0, 0, -1, 2);
  f(x1, z1, x1, z0, 1, 0, 4);
  f(x0, z0, x0, z1, -1, 0, 8);
}

function roofQuad(bk: Bucket, x0: number, z0: number, x1: number, z1: number, y: number, c: THREE.Color): void {
  bk.quad([x0, y, z1, x1, y, z1, x1, y, z0, x0, y, z0], 0, 1, 0, [0, 0, (x1 - x0) / 4, 0, (x1 - x0) / 4, (z1 - z0) / 4, 0, (z1 - z0) / 4], c, c);
}

/** Plain solid box (5 faces) in a bucket. */
function solid(bk: Bucket, rng: Rng, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, c: THREE.Color, topC?: THREE.Color): void {
  walls(bk, T.plain, rng, x0, z0, x1, z1, y0, y1, shade(c, 0.85), c);
  roofQuad(bk, x0, z0, x1, z1, y1, topC ?? c);
}

const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1);
const UNIT_CYL = new THREE.CylinderGeometry(1, 1, 1, 10);
const UNIT_CONE = new THREE.ConeGeometry(1, 1, 10);
const UNIT_ICO = new THREE.IcosahedronGeometry(1, 1);
const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _s = new THREE.Vector3();
const _p = new THREE.Vector3();
function put(bk: Bucket, g: THREE.BufferGeometry, x: number, y: number, z: number, sx: number, sy: number, sz: number, c: THREE.Color, ry = 0): void {
  _q.setFromEuler(_e.set(0, ry, 0));
  _m.compose(_p.set(x, y, z), _q, _s.set(sx, sy, sz));
  bk.append(g, _m, c);
}

// ------------------------------------------------------------------ rooftop kit

interface RoofOpts { parapet?: boolean; tank?: boolean; mech?: number; antenna?: boolean; red?: boolean; heli?: boolean; low?: boolean }

function roofKit(ctx: Ctx, x0: number, z0: number, x1: number, z1: number, y: number, o: RoofOpts): void {
  const r = ctx.rng;
  const w = x1 - x0, d = z1 - z0;
  roofQuad(ctx.plain, x0, z0, x1, z1, y, ROOF);
  if (o.parapet !== false) {
    const pc = shade(ROOF, 1.5);
    const t = 0.35, hh = 0.75;
    solid(ctx.plain, r, x0, y, z1 - t, x1, y + hh, z1, pc);
    solid(ctx.plain, r, x0, y, z0, x1, y + hh, z0 + t, pc);
    solid(ctx.plain, r, x0, y, z0 + t, x0 + t, y + hh, z1 - t, pc);
    solid(ctx.plain, r, x1 - t, y, z0 + t, x1, y + hh, z1 - t, pc);
  }
  const n = o.mech ?? 0;
  for (let k = 0; k < n && w > 4 && d > 4; k++) {
    const bw = rr(r, 1.4, Math.min(3.4, w * 0.4)), bd = rr(r, 1.4, Math.min(3.4, d * 0.4)), bh = rr(r, 0.9, 1.9);
    const bx = rr(r, x0 + 1 + bw / 2, x1 - 1 - bw / 2), bz = rr(r, z0 + 1 + bd / 2, z1 - 1 - bd / 2);
    solid(ctx.plain, r, bx - bw / 2, y, bz - bd / 2, bx + bw / 2, y + bh, bz + bd / 2, pickOf(r, [col('#555a63'), col('#6a6e76'), col('#444851')]));
    if (r() < 0.5) put(ctx.plain, UNIT_CYL, bx, y + bh + 0.1, bz, Math.min(bw, bd) * 0.3, 0.25, Math.min(bw, bd) * 0.3, col('#2a2c31'));
  }
  if (o.tank && w > 5 && d > 5) {
    const tx = rr(r, x0 + 2, x1 - 2), tz = rr(r, z0 + 2, z1 - 2);
    put(ctx.plain, UNIT_CYL, tx, y + 0.9, tz, 0.55, 1.8, 0.55, col('#2a241f'));
    put(ctx.plain, UNIT_CYL, tx, y + 2.7, tz, 1.15, 2.1, 1.15, col('#6b4d34'));
    put(ctx.plain, UNIT_CONE, tx, y + 4.1, tz, 1.25, 0.9, 1.25, col('#3d2e22'));
  }
  if (o.antenna) {
    const ax = rr(r, x0 + 1.5, x1 - 1.5), az = rr(r, z0 + 1.5, z1 - 1.5), ah = rr(r, 3, 9);
    solid(ctx.plain, r, ax - 0.09, y, az - 0.09, ax + 0.09, y + ah, az + 0.09, col('#3b3e46'));
    if (o.red) glowPt(ctx, ax, y + ah + 0.2, az, col('#ff2418'), 1.5, r());
  } else if (o.red) {
    glowPt(ctx, (x0 + x1) / 2, y + 1, (z0 + z1) / 2, col('#ff2418'), 1.5, r());
  }
  if (o.heli && w > 8 && d > 8) {
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    put(ctx.plain, UNIT_CYL, cx, y + 0.06, cz, 3.4, 0.12, 3.4, col('#3e4450'));
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      glowPt(ctx, cx + Math.cos(a) * 3.3, y + 0.3, cz + Math.sin(a) * 3.3, k % 2 ? col('#7dffa8') : col('#ffffff'), 0.5);
    }
  }
}

function rimGlow(ctx: Ctx, x0: number, z0: number, x1: number, z1: number, y: number, c: THREE.Color, hgt = 0.3): void {
  const o = 0.04;
  walls(ctx.glow, T.plain, ctx.rng, x0 - o, z0 - o, x1 + o, z1 + o, y, y + hgt, c, c);
}

// ------------------------------------------------------------------ archetypes

/** Ground-floor shop band wrapping a footprint. */
function groundFloor(ctx: Ctx, x0: number, z0: number, x1: number, z1: number, tint: THREE.Color, h = 4): void {
  walls(ctx.shop, T.shop, ctx.rng, x0, z0, x1, z1, 0, h, shade(tint, 0.8), tint);
}

function glassTower(ctx: Ctx, cx: number, cz: number, lw: number, ld: number, th: number, capped: boolean): number {
  const r = ctx.rng, t = T.glass;
  const nx = clamp(Math.floor((lw * 0.95) / t.cw), 5, 11), nz = clamp(Math.floor((ld * 0.95) / t.cw), 5, 11);
  const w = nx * t.cw, d = nz * t.cw;
  let x0 = cx - w / 2, x1 = cx + w / 2, z0 = cz - d / 2, z1 = cz + d / 2;
  const floors = Math.max(capped ? 2 : 4, capped ? Math.floor((th - 4) / t.ch) : Math.round((th - 4) / t.ch));
  const base = palette(ctx, 1.0).lerp(col('#8fa8c6'), 0.55).multiplyScalar(1.7);
  const hz = col(ctx.style.skyHorizon);
  const bottom = shade(base, 0.7);
  const top = base.clone().lerp(hz, 0.22).multiplyScalar(1.35);
  groundFloor(ctx, x0, z0, x1, z1, col('#c8d4e6'));
  let y = 4;
  const twoTier = floors >= 10 && nx >= 8 && nz >= 8 && r() < 0.55;
  const lowerF = twoTier ? Math.round(floors * 0.62) : floors;
  const mid = bottom.clone().lerp(top, twoTier ? 0.55 : 1);
  walls(ctx.glass, t, r, x0, z0, x1, z1, y, y + lowerF * t.ch, bottom, mid);
  y += lowerF * t.ch;
  if (twoTier) {
    const ins = 2 * t.cw;
    roofKit(ctx, x0, z0, x1, z1, y, { parapet: true, mech: 1 });
    rimGlow(ctx, x0, z0, x1, z1, y + 0.1, col('#9fd0ff').multiplyScalar(0.9), 0.18);
    x0 += ins; x1 -= ins; z0 += ins; z1 -= ins;
    const upF = floors - lowerF;
    walls(ctx.glass, t, r, x0, z0, x1, z1, y, y + upF * t.ch, mid, top);
    y += upF * t.ch;
  }
  const tall = y > 24;
  roofKit(ctx, x0, z0, x1, z1, y, { parapet: true, mech: capped ? 1 : 2, antenna: !capped && r() < 0.6, red: tall, heli: tall && r() < 0.25, tank: false, low: capped });
  if (tall) {
    const cc = ctx.accent.clone().lerp(col('#ffe2b0'), 0.55).multiplyScalar(0.75);
    rimGlow(ctx, x0, z0, x1, z1, y - 0.5, cc, 0.35);
  }
  return y;
}

function masonryMid(ctx: Ctx, cx: number, cz: number, lw: number, ld: number, th: number, capped: boolean): number {
  const r = ctx.rng, t = T.mas;
  const nx = clamp(Math.floor(lw / t.cw), 2, 5), nz = clamp(Math.floor(ld / t.cw), 2, 5);
  const w = nx * t.cw, d = nz * t.cw;
  let x0 = cx - w / 2, x1 = cx + w / 2, z0 = cz - d / 2, z1 = cz + d / 2;
  const floors = Math.max(1, capped ? Math.floor((th - 4) / t.ch) : Math.round((th - 4) / t.ch));
  const limestone = r() < 0.4;
  const base = palette(ctx, limestone ? 2.6 : 1.55);
  groundFloor(ctx, x0, z0, x1, z1, shade(base, 1.0).lerp(col('#e6dccb'), 0.6));
  const c0 = shade(base, 0.8), c1 = base.clone();
  const setback = floors >= 6 && nx >= 4 && nz >= 4 && r() < 0.5;
  const mainF = setback ? floors - 2 : floors;
  let y = 4;
  walls(ctx.mas, t, r, x0, z0, x1, z1, y, y + mainF * t.ch, c0, c1);
  y += mainF * t.ch;
  const corn = shade(base, 1.35).lerp(col('#d8cdb8'), 0.3);
  const o = 0.35;
  solid(ctx.plain, r, x0 - o, y - 0.05, z0 - o, x1 + o, y + 0.5, z1 + o, corn);
  if (setback) {
    x0 += t.cw; x1 -= t.cw; z0 += t.cw; z1 -= t.cw;
    walls(ctx.mas, t, r, x0, z0, x1, z1, y + 0.5, y + 0.5 + 2 * t.ch, c0, c1);
    y += 0.5 + 2 * t.ch;
    solid(ctx.plain, r, x0 - o, y - 0.05, z0 - o, x1 + o, y + 0.45, z1 + o, corn);
  }
  roofKit(ctx, x0, z0, x1, z1, y + 0.45, { parapet: true, tank: !capped && floors >= 4 && r() < 0.7, mech: 1 + (r() < 0.5 ? 1 : 0), antenna: !capped && r() < 0.35, red: !capped && floors >= 9, low: capped });
  return y + 0.45;
}

function decoStack(ctx: Ctx, cx: number, cz: number, lw: number, ld: number, th: number): number {
  const r = ctx.rng, t = T.deco;
  const nx = clamp(Math.floor(lw / t.cw), 4, 6), nz = clamp(Math.floor(ld / t.cw), 4, 6);
  let cX = nx, cZ = nz;
  const base = palette(ctx, 2.0).lerp(col('#d8c9a8'), 0.25);
  const c0 = shade(base, 0.78), c1 = base.clone();
  const floors = Math.max(7, Math.round((th - 4) / t.ch));
  groundFloor(ctx, cx - (cX * t.cw) / 2, cz - (cZ * t.cw) / 2, cx + (cX * t.cw) / 2, cz + (cZ * t.cw) / 2, base.clone().lerp(col('#e3d6b8'), 0.5));
  let y = 4;
  const splits = [0.55, 0.28, 0.17];
  let used = 0;
  for (let k = 0; k < 3; k++) {
    const f = k === 2 ? floors - used : Math.max(2, Math.round(floors * splits[k]));
    if (f <= 0 || cX < 1 || cZ < 1) break;
    const x0 = cx - (cX * t.cw) / 2, x1 = cx + (cX * t.cw) / 2, z0 = cz - (cZ * t.cw) / 2, z1 = cz + (cZ * t.cw) / 2;
    walls(ctx.deco, t, r, x0, z0, x1, z1, y, y + f * t.ch, c0, c1);
    y += f * t.ch;
    used += f;
    const o = 0.2;
    solid(ctx.plain, r, x0 - o, y - 0.05, z0 - o, x1 + o, y + 0.4, z1 + o, shade(base, 1.3));
    if (k < 2) {
      rimGlow(ctx, x0 - o, z0 - o, x1 + o, z1 + o, y + 0.4, ctx.accent.clone().lerp(col('#ffd890'), 0.5).multiplyScalar(1.3), 0.16);
      roofQuad(ctx.plain, x0, z0, x1, z1, y + 0.4, ROOF);
    }
    y += 0.4;
    if (cX - 2 < 1 || cZ - 2 < 1) break;
    cX -= 2; cZ -= 2;
  }
  const x0 = cx - (cX * t.cw) / 2, x1 = cx + (cX * t.cw) / 2, z0 = cz - (cZ * t.cw) / 2, z1 = cz + (cZ * t.cw) / 2;
  roofQuad(ctx.plain, x0, z0, x1, z1, y, ROOF);
  const sh = rr(r, 4, 9);
  put(ctx.plain, UNIT_CONE, cx, y + sh / 2, cz, Math.min(1.4, (x1 - x0) / 2.2), sh, Math.min(1.4, (z1 - z0) / 2.2), shade(base, 1.2));
  const crown = ctx.accent.clone().lerp(col('#fff0c0'), 0.5).multiplyScalar(1.8);
  glowPt(ctx, cx, y + 0.5, cz, crown, 3.2);
  glowPt(ctx, cx, y + sh + 0.2, cz, col('#ff2418'), 1.6, r());
  rimGlow(ctx, x0, z0, x1, z1, y - 0.5, crown, 0.35);
  return y + sh;
}

const ROWPAL: Partial<Record<CityId, string[]>> = {
  nyc: ['#6a4535', '#7a4a3c', '#8a6a50', '#5a4a44', '#9a8a76', '#74503f'],
  dc: ['#8a5a48', '#b3a58c', '#7d5646', '#bfb29a', '#8b7a6c'],
  chicago: ['#8a5a44', '#a37a58', '#745c4e', '#8c8478', '#6a4a3c'],
  bayarea: ['#d4a3ab', '#a9c4cc', '#dec88e', '#9db8a0', '#cf8f80', '#93a8cc', '#e3d9b8'],
};

function stoop(ctx: Ctx, x: number, zFront: number, face: number, c: THREE.Color): void {
  const r = ctx.rng;
  for (let k = 0; k < 5; k++) {
    const zz0 = face > 0 ? zFront + k * 0.42 : zFront - (k + 1) * 0.42;
    solid(ctx.plain, r, x - 0.8, 0, zz0, x + 0.8, 1.65 - k * 0.34, zz0 + 0.42, c);
  }
}

function pitchedRoof(ctx: Ctx, x0: number, z0: number, x1: number, z1: number, y: number, rise: number, alongX: boolean, c: THREE.Color): void {
  const ov = 0.35;
  const A = shade(c, 1.0), B = shade(c, 0.8);
  if (alongX) {
    const zm = (z0 + z1) / 2;
    ctx.plain.quadAuto([x0 - ov, y, z1 + ov, x1 + ov, y, z1 + ov, x1 + ov, y + rise, zm, x0 - ov, y + rise, zm], A);
    ctx.plain.quadAuto([x1 + ov, y, z0 - ov, x0 - ov, y, z0 - ov, x0 - ov, y + rise, zm, x1 + ov, y + rise, zm], B);
    ctx.plain.tri([x0, y, z1, x0, y + rise, zm, x0, y, z0], shade(c, 0.9));
    ctx.plain.tri([x1, y, z0, x1, y + rise, zm, x1, y, z1], shade(c, 0.9));
  } else {
    const xm = (x0 + x1) / 2;
    ctx.plain.quadAuto([x1 + ov, y, z1 + ov, x1 + ov, y, z0 - ov, xm, y + rise, z0 - ov, xm, y + rise, z1 + ov], A);
    ctx.plain.quadAuto([x0 - ov, y, z0 - ov, x0 - ov, y, z1 + ov, xm, y + rise, z1 + ov, xm, y + rise, z0 - ov], B);
    ctx.plain.tri([x0, y, z1, x1, y, z1, xm, y + rise, z1], shade(c, 0.9));
    ctx.plain.tri([x1, y, z0, x0, y, z0, xm, y + rise, z0], shade(c, 0.9));
  }
}

/** A run of attached townhouses facing +z (face = 1) or -z (face = -1). */
function rowhouses(ctx: Ctx, xStart: number, zEdge: number, depth: number, face: number, maxX: number, maxH: number): void {
  const r = ctx.rng, t = T.row;
  const victorian = ctx.id === 'bayarea';
  const pal = (ROWPAL[ctx.id] ?? ctx.style.buildingColors).map((c) => col(c));
  let x = xStart;
  let runBase = pickOf(r, pal);
  let floorsBase = 3 + Math.floor(r() * 2);
  if (maxH) floorsBase = Math.min(floorsBase, Math.floor((maxH + 1.8) / t.ch));
  while (true) {
    const cells = r() < 0.7 ? 2 : 3;
    const w = cells * t.cw;
    if (x + w > maxX + 1e-6) break;
    if (r() < (victorian ? 0.9 : 0.35)) runBase = pickOf(r, pal);
    const floors = clamp(floorsBase + (r() < 0.2 ? 1 : 0) - (r() < 0.15 ? 1 : 0), 2, maxH ? Math.floor((maxH + 1.8) / t.ch) : 5);
    const y0 = -1.8, y1 = y0 + floors * t.ch;
    const z0 = face > 0 ? zEdge - depth : zEdge;
    const z1 = face > 0 ? zEdge : zEdge + depth;
    const c1 = runBase.clone().multiplyScalar(victorian ? 1.5 : 1.45);
    const c0 = shade(c1, 0.8);
    walls(ctx.row, t, r, x, z0, x + w, z1, y0, y1, c0, c1);
    const fz = face > 0 ? z1 : z0;
    const trim = c1.clone().lerp(col('#f0e8d8'), 0.55);
    if (victorian) {
      pitchedRoof(ctx, x, z0, x + w, z1, y1, rr(r, 1.6, 2.6), false, pickOf(r, [col('#4a3b36'), col('#3c4650'), col('#5a4036')]));
      solid(ctx.plain, r, x - 0.02, y1 - 0.4, z0 - 0.02, x + w + 0.02, y1 + 0.05, z1 + 0.02, trim);
    } else {
      solid(ctx.plain, r, x - 0.15, y1 - 0.15, z0 - 0.15, x + w + 0.15, y1 + 0.6, z1 + 0.15, trim);
      roofQuad(ctx.plain, x, z0, x + w, z1, y1 + 0.6, ROOF);
      if (r() < 0.25) solid(ctx.plain, r, x + w * 0.3, y1 + 0.6, (z0 + z1) / 2 - 0.9, x + w * 0.3 + 1.8, y1 + 2.0, (z0 + z1) / 2 + 0.9, col('#4b4f58'));
    }
    // bay window over the upper floors
    if (floors >= 3 && r() < (victorian ? 0.8 : 0.5)) {
      const bx = x + w - t.cw;
      const bz0 = face > 0 ? fz : fz - 0.7;
      const bz1 = face > 0 ? fz + 0.7 : fz;
      walls(ctx.row, t, r, bx, bz0, bx + t.cw, bz1, y0 + t.ch, y0 + t.ch * Math.min(floors - 1, 3), c0, c1, face > 0 ? 1 | 4 | 8 : 2 | 4 | 8);
      roofQuad(ctx.plain, bx, bz0, bx + t.cw, bz1, y0 + t.ch * Math.min(floors - 1, 3), shade(trim, 0.8));
    }
    // door, stoop
    const dx = x + t.cw / 2;
    const dz = fz + face * 0.03;
    ctx.glow.quad([dx - 0.55, 1.65, dz, dx + 0.55, 1.65, dz, dx + 0.55, 3.7, dz, dx - 0.55, 3.7, dz], 0, 0, face, [0, 0, 1, 0, 1, 1, 0, 1], col('#ffb35a').multiplyScalar(1.2), col('#ffd9a0').multiplyScalar(1.5));
    if (r() < 0.6) glowPt(ctx, dx + 0.9, 3.0, fz + face * 0.15, col('#ffc070').multiplyScalar(0.7), 1.1);
    stoop(ctx, dx, fz, face, shade(trim, 0.9));
    if (r() < 0.45) put(ctx.plain, UNIT_ICO, x + w - 0.8, 0.4, fz + face * 1.4, 0.5, 0.45, 0.5, col('#2e4a2e'));
    x += w;
  }
}

function gardenApt(ctx: Ctx, cx: number, cz: number, lw: number, ld: number, floors: number, face: number): void {
  const r = ctx.rng, t = T.mas;
  const nx = clamp(Math.floor(lw / t.cw), 2, 5), nz = clamp(Math.floor(ld / t.cw), 2, 3);
  const w = nx * t.cw, d = nz * t.cw;
  const x0 = cx - w / 2, x1 = cx + w / 2, z0 = cz - d / 2, z1 = cz + d / 2;
  const base = palette(ctx, 1.9).lerp(col('#a8553f'), r() < 0.5 ? 0.45 : 0);
  const hh = floors * t.ch;
  walls(ctx.mas, t, r, x0, z0, x1, z1, 0, hh, shade(base, 0.85), base);
  pitchedRoof(ctx, x0, z0, x1, z1, hh, rr(r, 1.6, 2.4), w > d, pickOf(r, [col('#3d3a3a'), col('#4b3a32'), col('#31383f')]));
  const dz = face > 0 ? z1 + 0.03 : z0 - 0.03;
  ctx.glow.quad([cx - 0.6, 0.1, dz, cx + 0.6, 0.1, dz, cx + 0.6, 2.4, dz, cx - 0.6, 2.4, dz], 0, 0, face, [0, 0, 1, 0, 1, 1, 0, 1], col('#ffb35a'), col('#ffd9a0'));
  const nt = 3 + Math.floor(r() * 3);
  for (let k = 0; k < nt; k++) addTree(ctx, cx + rr(r, -lw / 2 - 1, lw / 2 + 1), cz + rr(r, -ld / 2 - 2, ld / 2 + 2), rr(r, 0.9, 1.5));
}

function strip(ctx: Ctx, cx: number, cz: number, lw: number, ld: number, face: number, twoStory: boolean): number {
  const r = ctx.rng, t = T.low;
  const nx = clamp(Math.floor(lw / t.cw), 2, 6);
  const w = nx * t.cw, d = Math.min(ld, 12);
  const x0 = cx - w / 2, x1 = cx + w / 2, z0 = cz - d / 2, z1 = cz + d / 2;
  const tint = palette(ctx, 2.1).lerp(col('#e6dcc8'), 0.45);
  groundFloor(ctx, x0, z0, x1, z1, shade(tint, 1.0).lerp(col('#f2ead6'), 0.35), 4);
  let y = 4;
  if (twoStory) {
    walls(ctx.low, t, r, x0, z0, x1, z1, y, y + t.ch, shade(tint, 0.85), tint);
    y += t.ch;
  }
  // sign band + glowing sign on the street face
  const sc = ctx.accent.clone().lerp(pickOf(r, [col('#ff6a4a'), col('#4ad0ff'), col('#ffd24a'), col('#8cff9a')]), 0.6).multiplyScalar(1.5);
  const fz = face > 0 ? z1 : z0;
  const sw = w * rr(r, 0.35, 0.6);
  const sx = cx + rr(r, -w * 0.15, w * 0.15) - sw / 2;
  solid(ctx.plain, r, x0 - 0.1, y, z0 - 0.1, x1 + 0.1, y + 0.9, z1 + 0.1, shade(tint, 0.9));
  const zz = fz + face * 0.13;
  ctx.glow.quad([sx, y + 0.12, zz, sx + sw, y + 0.12, zz, sx + sw, y + 0.78, zz, sx, y + 0.78, zz], 0, 0, face, [0, 0, 1, 0, 1, 1, 0, 1], sc, sc);
  y += 0.9;
  roofKit(ctx, x0, z0, x1, z1, y, { parapet: false, mech: 2 + (r() < 0.5 ? 1 : 0) });
  return y;
}

function warehouse(ctx: Ctx, cx: number, cz: number, lw: number, ld: number, face: number): number {
  const r = ctx.rng;
  const w = Math.min(lw, 26), d = Math.min(ld, 14), hh = rr(r, 6.5, 9);
  const x0 = cx - w / 2, x1 = cx + w / 2, z0 = cz - d / 2, z1 = cz + d / 2;
  const base = pickOf(r, [col('#8d949c'), col('#7b858e'), col('#a09a8e'), col('#6e7880')]);
  walls(ctx.plain, T.plain, r, x0, z0, x1, z1, 0, hh, shade(base, 0.8), base);
  solid(ctx.plain, r, x0 - 0.1, hh - 0.1, z0 - 0.1, x1 + 0.1, hh + 0.5, z1 + 0.1, shade(base, 0.7));
  roofKit(ctx, x0, z0, x1, z1, hh + 0.5, { parapet: false, mech: 3 });
  const fz = face > 0 ? z1 : z0;
  const nd = Math.floor(w / 5);
  for (let k = 0; k < nd; k++) {
    const dx = x0 + 2.5 + k * 5;
    const zz = fz + face * 0.05;
    ctx.plain.quad([dx - 1.3, 0, zz, dx + 1.3, 0, zz, dx + 1.3, 3.6, zz, dx - 1.3, 3.6, zz], 0, 0, face, [0, 0, 0, 0, 0, 0, 0, 0], col('#17191e'), col('#17191e'));
    if (r() < 0.55) {
      const zl = fz + face * 0.09;
      ctx.glow.quad([dx - 1.1, 0.2, zl, dx + 1.1, 0.2, zl, dx + 1.1, 3.4, zl, dx - 1.1, 3.4, zl], 0, 0, face, [0, 0, 1, 0, 1, 1, 0, 1], col('#ff9a3c').multiplyScalar(0.9), col('#ffc070').multiplyScalar(1.1));
    }
    glowPt(ctx, dx, 4.3, fz + face * 0.5, col('#ffb05a').multiplyScalar(0.9), 1.6);
  }
  return hh + 0.5;
}

function addTree(ctx: Ctx, x: number, z: number, s: number): void {
  const r = ctx.rng;
  if (ctx.id === 'dc' && r() < 0.5) {
    put(ctx.plain, UNIT_CYL, x, 0.9 * s, z, 0.1 * s, 1.8 * s, 0.1 * s, col('#2e2420'));
    put(ctx.plain, UNIT_ICO, x, 2.5 * s, z, 1.3 * s, 1.0 * s, 1.3 * s, pickOf(r, [col('#e6a9bd'), col('#f0bccb'), col('#d996ae')]));
    return;
  }
  if ((ctx.id === 'la' || ctx.id === 'houston') && r() < 0.5) {
    const th = rr(r, 6, 9) * s * 0.7;
    put(ctx.plain, UNIT_CYL, x, th / 2, z, 0.14 * s, th, 0.14 * s, col('#4a3a2c'));
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI;
      const len = 2.2 * s;
      const cs = Math.cos(a) * len, sn = Math.sin(a) * len;
      ctx.plain.quadAuto([x - cs, th - 0.2, z - sn, x + cs, th - 0.2, z + sn, x + cs * 0.9, th + 0.3, z + sn * 0.9, x - cs * 0.9, th + 0.3, z - sn * 0.9], col('#254a2c'));
      ctx.plain.quadAuto([x + cs, th - 0.2, z + sn, x - cs, th - 0.2, z - sn, x - cs * 0.9, th + 0.3, z - sn * 0.9, x + cs * 0.9, th + 0.3, z + sn * 0.9], col('#254a2c'));
    }
    return;
  }
  const green = pickOf(r, [col('#26402a'), col('#2f4d2d'), col('#1f3824'), col('#3a5530')]);
  put(ctx.plain, UNIT_CYL, x, 0.8 * s, z, 0.12 * s, 1.6 * s, 0.12 * s, col('#2e2420'));
  put(ctx.plain, UNIT_ICO, x, 2.6 * s, z, 1.25 * s, 1.5 * s, 1.25 * s, green);
}

function car(ctx: Ctx, x: number, z: number, ry: number, c: THREE.Color): void {
  put(ctx.plain, UNIT_BOX, x, 0.55, z, 1.8, 0.7, 4.4, c, ry);
  put(ctx.plain, UNIT_BOX, x, 1.2, z, 1.55, 0.55, 2.3, shade(c, 0.45), ry);
}

function parkingLot(ctx: Ctx, x0: number, z0: number, x1: number, z1: number, cars: boolean): void {
  const r = ctx.rng;
  ctx.plain.quadAuto([x0, 0.2, z1, x1, 0.2, z1, x1, 0.2, z0, x0, 0.2, z0], col('#202329'));
  for (let x = x0 + 1.5; x < x1 - 0.5; x += 2.7) {
    ctx.plain.quadAuto([x, 0.22, z1 - 0.3, x + 0.14, 0.22, z1 - 0.3, x + 0.14, 0.22, z1 - 4.3, x, 0.22, z1 - 4.3].slice(0, 12), col('#8c8f94'));
  }
  if (cars) {
    for (let x = x0 + 2.4; x < x1 - 1; x += 2.7) {
      if (r() < 0.55) car(ctx, x, z1 - 2.6, Math.PI / 2 * 0 + (r() < 0.5 ? 0 : Math.PI), pickOf(r, [col('#7a7f88'), col('#8a2f2f'), col('#2d4468'), col('#c8c8c8'), col('#222428'), col('#a89a5c')]));
    }
  }
  const px = (x0 + x1) / 2, pz = (z0 + z1) / 2;
  solid(ctx.plain, r, px - 0.08, 0.2, pz - 0.08, px + 0.08, 5.6, pz + 0.08, col('#2f323a'));
  glowPt(ctx, px, 5.8, pz, col('#ffbb66').multiplyScalar(0.8), 2.2);
  ctx.pool.quadAuto([px - 6, 0.23, pz + 6, px + 6, 0.23, pz + 6, px + 6, 0.23, pz - 6, px - 6, 0.23, pz - 6], col('#ff9f4a').multiplyScalar(0.28));
}

// ------------------------------------------------------------------ the city fill

interface Weights { tall: [string, number][]; mid: [string, number][]; low: [string, number][] }
const W: Record<CityId, Weights> = {
  nyc: { tall: [['glass', 0.35], ['deco', 0.3], ['mas', 0.35]], mid: [['mas', 0.55], ['deco', 0.12], ['glass', 0.15], ['row', 0.18]], low: [['row', 0.62], ['mas', 0.3], ['strip', 0.08]] },
  chicago: { tall: [['glass', 0.5], ['deco', 0.2], ['mas', 0.3]], mid: [['mas', 0.5], ['glass', 0.25], ['deco', 0.1], ['row', 0.15]], low: [['row', 0.45], ['mas', 0.35], ['strip', 0.2]] },
  la: { tall: [['glass', 0.6], ['mas', 0.3], ['deco', 0.1]], mid: [['strip', 0.45], ['mas', 0.25], ['glass', 0.2], ['wh', 0.1]], low: [['strip', 0.45], ['wh', 0.2], ['garden', 0.2], ['mas', 0.15]] },
  houston: { tall: [['glass', 0.7], ['deco', 0.1], ['mas', 0.2]], mid: [['glass', 0.3], ['strip', 0.3], ['mas', 0.2], ['wh', 0.2]], low: [['strip', 0.4], ['wh', 0.35], ['garden', 0.1], ['mas', 0.15]] },
  bayarea: { tall: [['glass', 0.45], ['mas', 0.35], ['deco', 0.2]], mid: [['mas', 0.4], ['row', 0.3], ['strip', 0.15], ['glass', 0.15]], low: [['row', 0.62], ['garden', 0.15], ['strip', 0.15], ['mas', 0.08]] },
  dallas: { tall: [['glass', 0.65], ['deco', 0.15], ['mas', 0.2]], mid: [['glass', 0.3], ['strip', 0.3], ['mas', 0.2], ['wh', 0.2]], low: [['strip', 0.4], ['wh', 0.3], ['garden', 0.15], ['mas', 0.15]] },
  dc: { tall: [['mas', 0.6], ['glass', 0.3], ['deco', 0.1]], mid: [['mas', 0.6], ['row', 0.25], ['glass', 0.1], ['deco', 0.05]], low: [['row', 0.55], ['mas', 0.35], ['strip', 0.1]] },
  atlanta: { tall: [['glass', 0.5], ['mas', 0.3], ['deco', 0.2]], mid: [['mas', 0.35], ['garden', 0.25], ['glass', 0.25], ['strip', 0.15]], low: [['garden', 0.5], ['row', 0.2], ['mas', 0.15], ['strip', 0.15]] },
};
function choose(r: Rng, list: [string, number][]): string {
  let t = r() * list.reduce((a, b) => a + b[1], 0);
  for (const [k, w] of list) {
    t -= w;
    if (t <= 0) return k;
  }
  return list[0][0];
}

const PARKING_CITIES: CityId[] = ['la', 'houston', 'dallas'];
const PAVE = col('#3a3e47');
const STREET = col('#16181f');
const STREET_W = 8;
const XS = 36;
const ZS = 30;

function overlapsRect(x0: number, z0: number, x1: number, z1: number, e: Exclusion, pad: number): boolean {
  return x1 > e.x0 - pad && x0 < e.x1 + pad && z1 > e.z0 - pad && z0 < e.z1 + pad;
}

/** Fill one lot with a building (or a park / parking lot). */
function lot(ctx: Ctx, x0: number, z0: number, x1: number, z1: number, exclusions: Exclusion[], skipChance: number): void {
  const r = ctx.rng, st = ctx.style;
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  const lw = x1 - x0, ld = z1 - z0;
  if (lw < 6.5 || ld < 6.5) return;
  if (Math.abs(cx) > 120) return;
  if (cz < -176) return;
  if (exclusions.some((e) => overlapsRect(x0, z0, x1, z1, e, 1.5))) return;
  if (x1 > -40 && x0 < 40 && z1 > -24 && z0 < 24) return;
  const w = W[ctx.id];
  const face = r() < 0.5 ? 1 : -1;
  if (r() < skipChance) {
    if (PARKING_CITIES.includes(ctx.id) && r() < 0.7) parkingLot(ctx, x0 + 0.8, z0 + 0.8, x1 - 0.8, z1 - 0.8, cz > -90);
    else {
      ctx.plain.quadAuto([x0 + 0.5, 0.2, z1 - 0.5, x1 - 0.5, 0.2, z1 - 0.5, x1 - 0.5, 0.2, z0 + 0.5, x0 + 0.5, 0.2, z0 + 0.5], col('#2c4630').lerp(col(st.ground), 0.2));
      const n = Math.floor((lw * ld) / 28);
      for (let k = 0; k < n; k++) addTree(ctx, rr(r, x0 + 1.5, x1 - 1.5), rr(r, z0 + 1.5, z1 - 1.5), rr(r, 0.9, 1.6));
    }
    return;
  }
  const low = Math.abs(cx) < 75 && cz > -70;
  const centerBoost = Math.max(0, 1 - Math.abs(cx) / 100);
  let h = 6 + r() * 26 * st.heightScale * (0.4 + centerBoost) + (r() < 0.05 ? 24 * st.heightScale : 0);
  h = Math.min(low ? Math.min(st.maxHeight, 11) : st.maxHeight, h);
  const kind = choose(r, h < 10 ? w.low : h < 20 ? w.mid : w.tall);
  // lot margins
  const mw = lw - 1.2, md = ld - 1.2;
  let top = 0;
  switch (kind) {
    case 'glass': top = glassTower(ctx, cx, cz, mw, md, Math.max(h, 14), low); break;
    case 'deco': top = low ? masonryMid(ctx, cx, cz, mw, md, h, true) : decoStack(ctx, cx, cz, mw, md, Math.max(h, 24)); break;
    case 'mas': top = masonryMid(ctx, cx, cz, mw, md, Math.max(h, 11), low); break;
    case 'row': {
      const depth = Math.min(md, 11);
      const xs = x0 + 0.6;
      const zEdge = face > 0 ? cz + depth / 2 : cz - depth / 2;
      rowhouses(ctx, xs, zEdge, depth, face, x1 - 0.6, low ? 10.5 : 14);
      top = 12;
      break;
    }
    case 'strip': top = strip(ctx, cx, cz - face * 1.5, mw, Math.min(md - 3, 11), face, !low && r() < 0.35); if (cz > -120) parkingLot(ctx, x0 + 0.8, face > 0 ? cz + 5 : z0 + 0.5, x1 - 0.8, face > 0 ? z1 - 0.5 : cz - 5, true); break;
    case 'wh': top = warehouse(ctx, cx, cz - face * 1.5, mw, Math.min(md - 3, 14), face); break;
    case 'garden': gardenApt(ctx, cx, cz, mw, md, 2 + Math.floor(r() * 2), face); top = 9; break;
    default: break;
  }
  void top;
}

function bsp(ctx: Ctx, x0: number, z0: number, x1: number, z1: number, depth: number, ex: Exclusion[], skip: number): void {
  const r = ctx.rng;
  const w = x1 - x0, d = z1 - z0;
  const leaf = (w <= 17 && d <= 15) || depth > 3 || (depth > 0 && w < 24 && d < 22 && r() < 0.15);
  if (leaf) {
    lot(ctx, x0, z0, x1, z1, ex, skip);
    return;
  }
  const alongX = w / 17 > d / 15;
  const f = rr(r, 0.4, 0.6);
  if (alongX) {
    const m = x0 + w * f;
    bsp(ctx, x0, z0, m, z1, depth + 1, ex, skip);
    bsp(ctx, m, z0, x1, z1, depth + 1, ex, skip);
  } else {
    const m = z0 + d * f;
    bsp(ctx, x0, z0, x1, m, depth + 1, ex, skip);
    bsp(ctx, x0, m, x1, z1, depth + 1, ex, skip);
  }
}

function slab(ctx: Ctx, x0: number, z0: number, x1: number, z1: number, c: THREE.Color): void {
  const y = 0.2;
  walls(ctx.plain, T.plain, ctx.rng, x0, z0, x1, z1, 0, y, shade(c, 0.6), shade(c, 0.9));
  roofQuad(ctx.plain, x0, z0, x1, z1, y, c);
}

export function buildFillBuildings(id: CityId, style: CityStyle, accent: THREE.Color, exclusions: Exclusion[]): THREE.Group {
  const rng = mulberry32(hashId(id, 1));
  const ctx = newCtx(id, style, accent, rng);
  const mats = materials();
  const em = 0.6 + style.windowLit * 1.6;
  for (const m of [mats.glass, mats.mas, mats.deco, mats.row, mats.low]) m.emissiveIntensity = em;
  mats.shop.emissiveIntensity = em * 0.62;
  const skip = clamp(0.1 + (1 - style.density) * 0.45, 0.08, 0.35);

  // streets first (flat dark strips), then block slabs and lots
  const sx0 = -128, sx1 = 128, sz0 = -186, sz1 = -10;
  const streetColor = STREET.clone().lerp(col(style.ground), 0.1);
  for (let j = 0; j < 6; j++) {
    const zc = -34 - ZS * j;
    ctx.plain.quadAuto([sx0, 0.06, zc + STREET_W / 2, sx1, 0.06, zc + STREET_W / 2, sx1, 0.06, zc - STREET_W / 2, sx0, 0.06, zc - STREET_W / 2], streetColor);
  }
  for (let k = -4; k <= 3; k++) {
    const xc = 18 + XS * k;
    ctx.plain.quadAuto([xc - STREET_W / 2, 0.06, sz1, xc + STREET_W / 2, 0.06, sz1, xc + STREET_W / 2, 0.06, sz0, xc - STREET_W / 2, 0.06, sz0], streetColor);
  }
  const blockC = PAVE.clone().lerp(col(style.ground), 0.25);
  // street lamps / traffic lights as soft dots, sparse and irregular
  const lamp = col('#ffb862').multiplyScalar(0.9);
  const lampWhite = col('#fff0d8').multiplyScalar(0.55);
  const lampRed = col('#ff3b2a').multiplyScalar(0.6);
  for (let j = 0; j < 6; j++) {
    const zc = -34 - ZS * j;
    for (let x = sx0; x < sx1; x += 9) {
      if (rng() < 0.45 || (Math.abs(x) < 40 && zc > -40)) continue;
      glowPt(ctx, x + rr(rng, -2, 2), 5.2, zc + (rng() < 0.5 ? 3.6 : -3.6), lamp, 1.7);
    }
    for (let x = sx0; x < sx1; x += 7) {
      if (rng() < 0.7 || (Math.abs(x) < 40 && zc > -40)) continue;
      glowPt(ctx, x + rr(rng, -2, 2), 0.7, zc + (rng() < 0.5 ? 1.5 : -1.5), rng() < 0.5 ? lampWhite : lampRed, 0.7);
    }
  }
  for (let k = -4; k <= 3; k++) {
    const xc = 18 + XS * k;
    for (let z = sz1 - 24; z > sz0; z -= 9) {
      if (rng() < 0.45) continue;
      glowPt(ctx, xc + (rng() < 0.5 ? 3.6 : -3.6), 5.2, z + rr(rng, -2, 2), lamp, 1.7);
    }
  }

  for (let k = -4; k <= 3; k++) {
    const bx0 = 18 + XS * k + STREET_W / 2;
    const bx1 = 18 + XS * (k + 1) - STREET_W / 2;
    for (let j = 0; j < 6; j++) {
      const bz1 = j === 0 ? -10 : -34 - ZS * (j - 1) - STREET_W / 2;
      const bz0 = -34 - ZS * j + STREET_W / 2;
      if (exclusions.some((e) => overlapsRect(bx0, bz0, bx1, bz1, e, 0))) {
        // partially wet blocks still get their lots filtered individually
      }
      if (!(bx1 > -40 && bx0 < 40 && bz1 > -24 && bz0 < 24)) slab(ctx, bx0, bz0, bx1, bz1, blockC);
      bsp(ctx, bx0, bz0, bx1, bz1, 0, exclusions, skip);
    }
  }

  // front rows framing the road
  const home = { x0: -29, x1: -18, z0: 9, z1: 20 };
  for (const side of [1, -1] as const) {
    let x = -38;
    slab(ctx, -41, side > 0 ? 12.5 : -23.5, 41, side > 0 ? 23.5 : -14.5, blockC.clone().multiplyScalar(0.95));
    while (x < 36) {
      const maxH = 10.5;
      const kind = choose(rng, W[id].low);
      const depth = side > 0 ? rr(rng, 6, 7.6) : rr(rng, 4.4, 5.6);
      const zFront = side > 0 ? 14 + rr(rng, 0, 1) : -16 - rr(rng, 0, 1);
      const face = 1;
      const z0 = side > 0 ? zFront : zFront - depth;
      const z1 = side > 0 ? zFront + depth : zFront;
      if (kind === 'row' || kind === 'mas' && PARKING_CITIES.every((c) => c !== id) && rng() < 0.4) {
        const n = 3 + Math.floor(rng() * 3);
        const len = n * 5.6;
        if (!(x < home.x1 && x + len > home.x0 && z1 > home.z0 && z0 < home.z1)) {
          rowhouses(ctx, x, face > 0 ? z1 : z0, depth, face, Math.min(x + len, 40), maxH);
          if (side > 0) { /* fronts face the road (-z) */ }
        }
        x += len + rr(rng, 0.3, 1.2);
      } else {
        const bw = rr(rng, 7, 12);
        if (!(x < home.x1 && x + bw > home.x0 && z1 > home.z0 && z0 < home.z1)) {
          const cxx = x + bw / 2, czz = (z0 + z1) / 2;
          if (kind === 'garden') gardenApt(ctx, cxx, czz, bw, depth, 2, face);
          else if (kind === 'wh') warehouse(ctx, cxx, czz, bw, depth, face);
          else if (kind === 'mas') masonryMid(ctx, cxx, czz, bw, depth, 11, true);
          else strip(ctx, cxx, czz, bw, depth, face, false);
        }
        x += bw + rr(rng, 0.4, 1.4);
      }
    }
  }

  const g = new THREE.Group();
  g.name = `fill-${id}`;
  const add = (b: Bucket, m: THREE.Material, name: string): void => {
    const geo = b.build();
    if (!geo) return;
    const mesh = new THREE.Mesh(geo, m);
    mesh.name = name;
    mesh.matrixAutoUpdate = false;
    g.add(mesh);
  };
  add(ctx.glass, mats.glass, 'glass');
  add(ctx.mas, mats.mas, 'masonry');
  add(ctx.deco, mats.deco, 'deco');
  add(ctx.row, mats.row, 'rowhouse');
  add(ctx.low, mats.low, 'lowrise');
  add(ctx.shop, mats.shop, 'shopfront');
  add(ctx.plain, mats.plain, 'details');
  add(ctx.glow, mats.glow, 'glow');
  add(ctx.pool, mats.pool, 'pools');
  const gm = glowMesh(ctx.pts);
  if (gm) {
    gm.name = 'halos';
    g.add(gm);
  }
  return g;
}

// ------------------------------------------------------------------ street life

const ROAD = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-22, 0, 8), new THREE.Vector3(-10, 0, 5), new THREE.Vector3(0, 0, -1), new THREE.Vector3(10, 0, -5), new THREE.Vector3(22, 0, 0),
]);
let ROAD_TAB: THREE.Vector3[] | null = null;
function roadAt(x: number): { z: number; slope: number } {
  if (!ROAD_TAB) ROAD_TAB = ROAD.getSpacedPoints(240);
  const t = ROAD_TAB;
  const first = t[0], last = t[t.length - 1];
  if (x <= first.x) {
    const s = (t[3].z - first.z) / (t[3].x - first.x);
    return { z: first.z + s * (x - first.x), slope: s };
  }
  if (x >= last.x) {
    const s = (last.z - t[t.length - 4].z) / (last.x - t[t.length - 4].x);
    return { z: last.z + s * (x - last.x), slope: s };
  }
  for (let i = 0; i < t.length - 1; i++) {
    if (x >= t[i].x && x <= t[i + 1].x) {
      const k = (x - t[i].x) / Math.max(1e-6, t[i + 1].x - t[i].x);
      return { z: t[i].z + (t[i + 1].z - t[i].z) * k, slope: (t[i + 1].z - t[i].z) / Math.max(1e-6, t[i + 1].x - t[i].x) };
    }
  }
  return { z: last.z, slope: 0 };
}
/** Point at lateral offset `off` (positive towards +z) from the road centre line at parameter x. */
function roadPoint(x: number, off: number): { x: number; z: number; ang: number } {
  const { z, slope } = roadAt(x);
  const k = 1 / Math.sqrt(1 + slope * slope);
  return { x: x - slope * off * k, z: z + off * k, ang: Math.atan2(1, slope) - Math.PI / 2 };
}

export function buildStreetLife(id: CityId, style: CityStyle, accent: THREE.Color): THREE.Group {
  const rng = mulberry32(hashId(id, 7));
  const ctx = newCtx(id, style, accent, rng);
  const mats = materials();
  const walk = PAVE.clone().lerp(col(style.ground), 0.2).multiplyScalar(1.1);
  const lampC = col('#ffb862');
  const homeBand = (x: number, side: number): boolean => side > 0 && x > -28 && x < -19;
  const campusBand = (x: number, side: number): boolean => side < 0 && x > 13;

  // sidewalk ribbons
  for (const side of [1, -1] as const) {
    const o0 = side * 5.4, o1 = side * 9.6;
    for (let x = -34; x < 34; x += 2) {
      const a0 = roadPoint(x, o0), a1 = roadPoint(x, o1), b0 = roadPoint(x + 2, o0), b1 = roadPoint(x + 2, o1);
      const y = 0.18;
      const q = side > 0
        ? [a0.x, y, a0.z, b0.x, y, b0.z, b1.x, y, b1.z, a1.x, y, a1.z]
        : [a1.x, y, a1.z, b1.x, y, b1.z, b0.x, y, b0.z, a0.x, y, a0.z];
      ctx.plain.quadAuto(q, walk);
    }
  }

  // crosswalks
  for (const cxw of [-14, 14]) {
    for (let o = -4.5; o <= 4.5; o += 1.1) {
      const a = roadPoint(cxw - 1.4, o), b = roadPoint(cxw + 1.4, o);
      const hw = 0.28;
      ctx.plain.quadAuto([a.x, 0.12, a.z + hw, b.x, 0.12, b.z + hw, b.x, 0.12, b.z - hw, a.x, 0.12, a.z - hw], col('#b8b8b0'));
    }
  }

  // curb lights
  for (const side of [1, -1] as const) {
    for (let x = -26; x <= 26; x += 3.2) {
      if (homeBand(x, side) || campusBand(x, side)) continue;
      const p = roadPoint(x, side * 5.2);
      glowPt(ctx, p.x, 0.35, p.z, col('#ffc67a').multiplyScalar(0.7), 0.55);
    }
  }

  // lamp posts with halos and light pools
  let flip = 1;
  for (let x = -25; x <= 25; x += 8.5) {
    const side = flip;
    flip = -flip;
    if (homeBand(x, side) || campusBand(x, side)) continue;
    const p = roadPoint(x, side * 7.6);
    const toRoad = -side;
    solid(ctx.plain, rng, p.x - 0.08, 0.18, p.z - 0.08, p.x + 0.08, 5.6, p.z + 0.08, col('#23262d'));
    solid(ctx.plain, rng, p.x - 0.06, 5.5, Math.min(p.z, p.z + toRoad * 1.5), p.x + 0.06, 5.66, Math.max(p.z, p.z + toRoad * 1.5), col('#23262d'));
    const hz = p.z + toRoad * 1.5;
    ctx.glow.quad([p.x - 0.22, 5.42, hz + 0.22, p.x + 0.22, 5.42, hz + 0.22, p.x + 0.22, 5.42, hz - 0.22, p.x - 0.22, 5.42, hz - 0.22], 0, -1, 0, [0, 0, 1, 0, 1, 1, 0, 1], lampC.clone().multiplyScalar(2), lampC.clone().multiplyScalar(2));
    glowPt(ctx, p.x, 5.35, hz, lampC.clone().multiplyScalar(0.9), 2.4);
    ctx.pool.quadAuto([p.x - 5, 0.2, hz + 5, p.x + 5, 0.2, hz + 5, p.x + 5, 0.2, hz - 5, p.x - 5, 0.2, hz - 5], lampC.clone().multiplyScalar(0.3));
  }

  // storefront spill along the front rows
  for (const side of [1, -1] as const) {
    let x = -37;
    while (x < 36) {
      const w = rr(rng, 3, 7);
      if (rng() < 0.7) {
        const zc = side > 0 ? 12.6 : -14.4;
        const c = (rng() < 0.65 ? col('#ffb45a') : rng() < 0.5 ? col('#6fc4ff') : accent.clone()).multiplyScalar(0.4);
        ctx.pool.quadAuto([x, 0.22, zc + 1.8, x + w, 0.22, zc + 1.8, x + w, 0.22, zc - 1.8, x, 0.22, zc - 1.8], c);
      }
      x += w + rr(rng, 0.5, 2.5);
    }
  }

  // parked cars along the kerb
  const carCols = ['#7a7f88', '#8a2f2f', '#2d4468', '#c8c8c8', '#222428', '#a89a5c', '#3e6a52'].map((c) => col(c));
  for (let x = -24; x <= 24; x += rr(rng, 5.5, 9.5)) {
    const side = rng() < 0.5 ? 1 : -1;
    if (homeBand(x, side) || campusBand(x, side)) continue;
    const p = roadPoint(x, side * 6.4);
    const c = pickOf(rng, carCols);
    put(ctx.plain, UNIT_BOX, p.x, 0.62, p.z, 4.4, 0.75, 1.85, c, -Math.atan(roadAt(x).slope));
    put(ctx.plain, UNIT_BOX, p.x, 1.26, p.z, 2.3, 0.55, 1.6, shade(c, 0.4), -Math.atan(roadAt(x).slope));
    const dir = Math.atan(roadAt(x).slope);
    const tx = Math.cos(dir) * 2.2, tz = Math.sin(dir) * 2.2;
    glowPt(ctx, p.x - tx, 0.75, p.z - tz, col('#ff2a22').multiplyScalar(0.8), 0.55);
  }

  // street trees
  for (let x = -26; x <= 26; x += rr(rng, 6, 10)) {
    const side = rng() < 0.5 ? 1 : -1;
    if (homeBand(x, side) || campusBand(x, side)) continue;
    const p = roadPoint(x, side * 9.0);
    addTree(ctx, p.x, p.z, rr(rng, 1, 1.5));
  }

  const g = new THREE.Group();
  g.name = `street-${id}`;
  const add = (b: Bucket, m: THREE.Material, name: string): void => {
    const geo = b.build();
    if (!geo) return;
    const mesh = new THREE.Mesh(geo, m);
    mesh.name = name;
    mesh.matrixAutoUpdate = false;
    g.add(mesh);
  };
  add(ctx.plain, mats.plain, 'street-details');
  add(ctx.glow, mats.glow, 'street-glow');
  add(ctx.pool, mats.pool, 'street-pools');
  const gm = glowMesh(ctx.pts);
  if (gm) {
    gm.name = 'street-halos';
    g.add(gm);
  }
  return g;
}
