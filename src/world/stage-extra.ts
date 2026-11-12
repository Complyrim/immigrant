import * as THREE from 'three';
import type { CastSpec, StageId } from '../engine/types';
import { crowdLook, stdMat } from './Figure';
import type { FigureLook } from './Figure';
import { SB, SL, V, aim, m, rng, shadeHex, textTex, skylineTex, backdropTex, woodTex, tileTex, speckleTex, brickTex } from './stage-kit';
import type { Cfg, Slot } from './stage-kit';

type Builder = (b: SB, cast: CastSpec[], player: FigureLook) => Cfg;

const emis = (c: string, ei = 1.6): THREE.Material => m(c, { emissive: c, ei });

/* ------------------------------------------------------------------ bedroom (night) */

function bedroom(b: SB, cast: CastSpec[], player: FigureLook): Cfg {
  const acc = b.p(1);
  b.floor(12, 9, b.lit(woodTex(b, '#6e5038', 0.2, 5, 5, 4), 0.55), 0, -0.3);
  b.box(12, 3.3, 0.2, '#47557d', 0, 1.65, -3.3);
  b.box(0.2, 3.3, 9, '#3f4c72', -4.4, 1.65, 0.2);
  b.box(0.2, 3.3, 9, '#3f4c72', 4.4, 1.65, 0.2);
  // moonlit window above the bed
  const sky = backdropTex(b, [[0, '#0a1230'], [0.7, '#1c2a5c'], [1, '#34457a']], { stars: true, moon: true, skyline: '#0e1530', seed: 12 });
  b.window(2.1, 1.35, sky, 0.35, 1.95, -3.18, 0, '#d9d4c8', '#9fb8ff');
  b.glow('#9fb8ff', 3.2, 0.35, 1.95, -2.9, 0.18);
  b.dust(0.2, 1.5, -1.6, 2.4, 2.2, 2.2, 28, '#cfdcff', 0.05, 0.5, 0.012);

  // bed lying along x, head to the left
  const bx = -0.5, bz = -1.6;
  const bedG = b.bed(bx, bz, Math.PI / 2, '#d5d0e6', acc, 1.05, 2.05);
  void bedG;
  const duvet = b.sph(0.58, shadeHex(acc, -0.02), bx + 0.45, 0.72, bz, 1.0, 0.36, 1.0);
  duvet.scale.set(0.62, 0.16, 0.5);
  duvet.rotation.y = 0;
  // nightstand + phone glow + lamp (off) + clock
  const ns = b.grp(-2.25, 0, -2.55);
  b.box(0.55, 0.52, 0.45, '#5b4330', 0, 0.26, 0, 0, ns);
  b.box(0.5, 0.04, 0.4, '#7a5a40', 0, 0.54, 0, 0, ns);
  b.box(0.4, 0.14, 0.02, '#3a2a1e', 0, 0.38, 0.23, 0, ns);
  b.box(0.04, 0.03, 0.01, '#d6b070', 0, 0.38, 0.24, 0, ns);
  b.box(0.09, 0.012, 0.17, '#101216', 0.12, 0.566, 0.04, 0.4, ns);
  b.plane(0.08, 0.15, m('#bfe9ff', { emissive: '#7fd8ff', ei: 2.4 }), 0.12, 0.574, 0.04, 0.4, -Math.PI / 2, ns);
  b.glow('#7fd8ff', 1.1, -2.13, 0.7, -2.5, 0.45);
  const pl = b.light('#7fd8ff', 1.4, -2.0, 0.85, -2.3, 3.2);
  b.upd.push((_d, t) => { pl.intensity = 1.2 + Math.sin(t * 1.3) * 0.15; });
  b.lamp(-2.45, 0.56, -2.6, '#ffd9a0', false);
  b.box(0.12, 0.06, 0.05, '#1a1d24', -2.05, 0.59, -2.7);
  b.plane(0.08, 0.025, emis('#ff4a4a', 2), -2.05, 0.59, -2.674);
  // wardrobe with a suitcase on top
  b.box(1.5, 2.3, 0.65, '#5a4a40', 3.5, 1.15, -2.85);
  b.box(0.72, 2.1, 0.02, '#4a3c34', 3.14, 1.15, -2.51);
  b.box(0.72, 2.1, 0.02, '#4a3c34', 3.86, 1.15, -2.51);
  b.sph(0.03, '#d6b070', 3.45, 1.1, -2.48);
  b.sph(0.03, '#d6b070', 3.55, 1.1, -2.48);
  const suit = b.grp(3.5, 2.3, -2.85);
  b.box(0.8, 0.28, 0.5, '#c9473e', 0, 0.14, 0, 0, suit);
  b.box(0.82, 0.03, 0.52, '#8f2e29', 0, 0.28, 0, 0, suit);
  b.box(0.7, 0.025, 0.52, '#b8b2a4', 0.0, 0.16, 0.0, 0, suit).scale.set(1, 1, 1);
  b.box(0.16, 0.04, 0.05, '#222', 0, 0.3, 0.2, 0, suit);
  // desk + chair + closed laptop + poster wall
  b.desk(1.9, -2.85, 1.3, 0.62, 0, '#9a7650');
  b.laptop(1.9, 0.765, -2.9, 0.1, null);
  b.lamp(2.35, 0.77, -2.9, '#ffd9a0', false);
  b.chair(1.9, -2.15, Math.PI, '#4a5a82');
  b.books(1.4, 0.77, -2.95, 6, 0, 3);
  b.poster(-3.0, 2.0, -3.17, 0, 0.7, 1.0, 5);
  b.poster(-3.9, 1.8, -2.6, Math.PI / 2, 0.6, 0.85, 8);
  b.poster(1.9, 2.0, -3.17, 0, 0.5, 0.7, 14);
  // shelf + plant + rug + slippers
  b.box(1.2, 0.04, 0.26, '#7a5a40', -3.85, 1.55, -1.1, Math.PI / 2);
  b.books(-3.85, 1.57, -0.7, 7, Math.PI / 2, 4);
  b.plant(-3.9, -2.9, 1.2);
  b.rug(0.9, -0.4, 1.2, '#6a5f8f', '#8a7fb0', 0.8);
  b.box(0.12, 0.05, 0.28, '#d6708a', 1.7, 0.03, -0.35, 0.3);
  b.box(0.12, 0.05, 0.28, '#d6708a', 1.9, 0.03, -0.25, 0.2);
  // string lights over the window
  for (let i = 0; i < 12; i++) {
    const u = i / 11, x = -1.7 + u * 4.1, y = 3.05 - Math.sin(u * Math.PI) * 0.3;
    b.sph(0.035, emis(i % 2 ? '#ffd27a' : '#ff9ac0', 2), x, y, -3.1);
    if (i % 3 === 0) b.glow('#ffcf8a', 0.35, x, y, -3.05, 0.5);
  }

  const slots: Slot[] = [
    SL('player', bx + 0.2, bz, bx + 1.2, bz, 'sleep', { y: 0.52 }),
    SL('roommate', 1.9, -2.15, 1.9, -3.5, 'phone', { seat: 0.43, opt: true }),
  ];
  b.populate(slots, cast, player);
  return {
    camera: aim(V(0.9, 1.95, 3.1), V(-0.32, 0.6, -1.6), 40),
    background: '#0b1026',
    fog: { color: '#0b1026', near: 9, far: 22 },
    ambient: { sky: '#98a8e8', ground: '#4a3d58', intensity: 1.6 },
    key: { color: '#b9c8ff', intensity: 1.3, position: V(-2.5, 5, 3.5) },
  };
}

/* ------------------------------------------------------------------ kitchen */

function kitchen(b: SB, cast: CastSpec[], player: FigureLook): Cfg {
  const acc = b.p(0);
  b.floor(13, 9, b.lit(tileTex(b, '#d9cdb8', '#c9bba2', '#a99d88', 15, 11), 0.4), 0, -0.3);
  b.box(13, 3.4, 0.2, '#f0e2c4', 0, 1.7, -3.4);
  b.box(0.2, 3.4, 9, '#ead9b8', -5, 1.7, 0.2);
  b.box(0.2, 3.4, 9, '#ead9b8', 5, 1.7, 0.2);
  // backsplash
  const splash = b.lit(tileTex(b, '#f4f1e8', '#ece7da', '#c8c2b2', 6, 1.2, 4), 0.25);
  b.plane(6.2, 0.62, splash, -0.6, 1.2, -3.29);
  // lower cabinets + counter
  const cab = '#4f7f78';
  b.box(6.2, 0.86, 0.66, cab, -0.6, 0.43, -3.0);
  for (let i = 0; i < 9; i++) {
    const x = -3.5 + i * 0.7;
    b.box(0.64, 0.74, 0.02, shadeHex(cab, 0.05), x, 0.43, -2.66);
    b.box(0.1, 0.015, 0.02, '#d6c9a8', x, 0.7, -2.64);
  }
  b.box(6.35, 0.06, 0.74, '#e4dccb', -0.6, 0.89, -3.0);
  // upper cabinets + shelf with dishes and spice jars
  b.box(1.9, 0.8, 0.34, cab, -3.1, 2.3, -3.2);
  b.box(1.9, 0.8, 0.34, cab, 2.1, 2.3, -3.2);
  b.box(2.4, 0.04, 0.26, '#8a6a4a', -0.5, 1.95, -3.25);
  const jarCols = ['#c9473e', '#e0a23f', '#6b8f4e', '#7a5cb0', '#d6708a', '#e07a3f'];
  for (let i = 0; i < 6; i++) {
    b.cyl(0.04, 0.12, m('#e8efef', { opacity: 0.55, rough: 0.1 }), -1.5 + i * 0.22, 2.03, -3.25, b.g, 16);
    b.cyl(0.042, 0.03, jarCols[i], -1.5 + i * 0.22, 2.1, -3.25, b.g, 16);
  }
  for (let i = 0; i < 5; i++) b.cyl(0.11, 0.015, i % 2 ? '#f4f4f0' : '#cfe0e8', 0.4 + i * 0.05, 2.0 + i * 0.016, -3.25, b.g, 24);
  // window over the sink with evening light
  const sky = backdropTex(b, [[0, '#7aa9e6'], [0.6, '#f2c49a'], [1, '#f7d9b0']], { skyline: '#7a6a8a', seed: 2 });
  b.window(1.4, 1.1, sky, 2.1, 1.55, -3.28, 0, '#f4f0e6');
  b.cyl(0.19, 0.03, '#a9b0b8', 0.3, 0.935, -3.0, b.g, 24);
  b.box(0.7, 0.02, 0.42, '#b9c0c8', 0.3, 0.915, -3.0);
  b.cyl(0.015, 0.3, '#cfd4da', 0.3, 1.08, -3.2, b.g, 10);
  b.box(0.012, 0.012, 0.15, '#cfd4da', 0.3, 1.22, -3.13);
  b.plant(2.45, -3.0, 0.6, 0.92);
  b.shaft(2.1, 1.5, -3.2, 0, 1.2, 4.5, 0.95, '#ffd9a0', 0.14);
  // island with the stove (cook stands behind it, facing the camera) and a prep end
  const isl = b.grp(-0.6, 0, -1.6);
  b.box(2.6, 0.86, 0.8, '#d9cfbd', 0, 0.43, 0, 0, isl);
  for (let i = 0; i < 4; i++) b.box(0.58, 0.7, 0.02, '#c4b89f', -0.95 + i * 0.63, 0.43, 0.41, 0, isl);
  b.box(2.72, 0.06, 0.9, '#2b2f36', 0, 0.89, 0, 0, isl);
  b.box(0.82, 0.03, 0.62, '#17191e', -0.7, 0.935, 0, 0, isl);
  for (const [dx, dz] of [[-0.18, -0.14], [0.18, -0.14], [-0.18, 0.14], [0.18, 0.14]]) b.ring(0.09, 0.012, '#3a3e46', -0.7 + dx, 0.95, dz, Math.PI / 2, 0, isl);
  b.cyl(0.17, 0.06, '#23262c', -0.7, 0.98, -0.14, isl, 28);
  b.cyl(0.152, 0.02, '#d9722e', -0.7, 0.998, -0.14, isl, 24);
  b.box(0.3, 0.025, 0.04, '#23262c', -0.7, 0.98, 0.12, 0, isl);
  b.glow('#ff9a4a', 0.55, -1.3, 1.0, -1.74, 0.3);
  b.steam(-1.3, 1.1, -1.74, 5, 0.45);
  for (const kx of [-0.9, -0.5]) b.cyl(0.022, 0.03, '#c9ced6', kx, 0.935, 0.34, isl, 12);
  // chopping board with vegetables and knife on the prep end
  b.box(0.52, 0.025, 0.34, '#c19a62', 0.55, 0.93, 0.05, 0, isl);
  b.sph(0.055, '#d9392e', 0.42, 0.99, 0.03, 1, 1, 1, isl);
  b.sph(0.05, '#d9392e', 0.5, 0.985, 0.12, 1, 1, 1, isl);
  b.cyl(0.03, 0.2, '#3f8f4e', 0.68, 0.97, 0.0, isl, 14).rotation.z = Math.PI / 2;
  b.sph(0.06, '#e8d2f0', 0.78, 0.99, 0.1, 1, 1, 1, isl);
  b.box(0.22, 0.012, 0.035, '#c9ced6', 0.55, 0.945, 0.22, 0.3, isl);
  b.box(0.1, 0.02, 0.03, '#2a2420', 0.7, 0.945, 0.24, 0.3, isl);
  for (let i = 0; i < 4; i++) b.cyl(0.035, 0.1, jarCols[(i + 2) % 6], 0.15 + i * 0.1, 0.97, 0.3, isl, 14);
  b.blob(-0.6, -1.6, 3.2, 1.6);
  // spice rack on the counter + kettle + dish rack
  for (let i = 0; i < 4; i++) b.cyl(0.035, 0.1, jarCols[(i + 2) % 6], 0.15 + i * 0.09, 0.97, -3.15, b.g, 14);
  b.cyl(0.1, 0.16, '#b85c38', 1.1, 1.0, -3.05, b.g, 24);
  b.sph(0.09, '#b85c38', 1.1, 1.1, -3.05, 1, 0.8, 1);
  b.box(0.5, 0.02, 0.3, '#9aa0a8', 3.6, 0.93, -3.0);
  for (let i = 0; i < 4; i++) b.cyl(0.1, 0.012, '#f4f4f0', 3.45 + i * 0.1, 1.0, -3.0, b.g, 20).rotation.z = 1.4;
  // fridge with magnets and notes
  b.box(1.0, 2.0, 0.78, '#cfd5dc', 4.35, 1.0, -2.95);
  b.box(1.0, 0.03, 0.8, '#9aa3ad', 4.35, 1.38, -2.95);
  b.box(0.04, 0.5, 0.05, '#8d949d', 3.88, 1.7, -2.55);
  b.box(0.04, 0.4, 0.05, '#8d949d', 3.88, 0.85, -2.55);
  const mg = ['#c9473e', '#e0a23f', '#3f8f4e', '#4a6fd6', '#d6708a'];
  for (let i = 0; i < 5; i++) {
    b.box(0.16, 0.2, 0.01, i % 2 ? '#fff6a8' : '#f4efe4', 4.1 + (i % 3) * 0.2, 1.55 + Math.floor(i / 3) * 0.25, -2.555, 0.1 * (i - 2));
    b.sph(0.022, mg[i], 4.1 + (i % 3) * 0.2, 1.62 + Math.floor(i / 3) * 0.25, -2.55, 1, 1, 0.5);
  }
  // pendant lamp and rail with hanging utensils
  b.cyl(0.006, 1.0, '#2a2420', -0.6, 3.2, -1.2, b.g, 6);
  const sh = b.cone(0.26, 0.2, '#e8d9b8', -0.6, 2.62, -1.2);
  sh.rotation.x = Math.PI;
  b.sph(0.07, emis('#fff0c0', 2.4), -0.6, 2.58, -1.2);
  b.glow('#ffd9a0', 1.6, -0.6, 2.55, -1.2, 0.55);
  b.light('#ffd2a0', 9, -0.6, 2.4, -0.8, 8);
  // dining table + chairs (right)
  b.cyl(0.55, 0.05, '#c19a62', 1.5, 0.76, -0.8, b.g, 32);
  b.cyl(0.06, 0.74, '#4a3a2c', 1.5, 0.38, -0.8, b.g, 12);
  b.cyl(0.3, 0.03, '#4a3a2c', 1.5, 0.015, -0.8, b.g, 24);
  b.cyl(0.11, 0.012, '#f4f4f0', 1.35, 0.795, -0.9, b.g, 24);
  b.cyl(0.11, 0.012, '#cfe0e8', 1.65, 0.795, -0.7, b.g, 24);
  b.cyl(0.05, 0.1, '#e0a23f', 1.52, 0.85, -0.8, b.g, 16);
  b.blob(1.5, -0.8, 1.7, 1.7);
  // dish stack and mugs by the sink
  for (let i = 0; i < 3; i++) b.cyl(0.07, 0.09, ['#e0a23f', '#4a6fd6', '#d6708a'][i], -0.15 + i * 0.12, 0.97, -3.12, b.g, 18);
  b.dust(0, 1.6, -1.5, 5, 2.2, 2.5, 26, '#fff0cc', 0.045, 0.45, 0.015);

  const slots: Slot[] = [
    SL('player', -1.3, -2.38, -1.3, 3, 'cook', { look: [-1.3, 1.0, -1.8] }),
    SL('roommate', 1.5, -1.65, 1.5, -0.8, 'laugh', { seat: 'chair', look: [-1.8, 1.4, -2.2] }),
    SL('friend', 2.25, -0.5, 1.5, -0.8, 'eat', { seat: 'chair', look: [1.5, 0.8, -0.8] }),
    SL('stranger', -0.7, -1.8, -1.6, -2.5, 'talk', { opt: true, lite: false }),
  ];
  b.populate(slots, cast, player, '#8a6a4a');
  void acc;
  return {
    camera: aim(V(0.6, 1.95, 4.5), V(-0.7, 1.12, -1.9), 42),
    background: '#3a2c22',
    fog: null,
    ambient: { sky: '#fff0d8', ground: '#8a7058', intensity: 1.35 },
    key: { color: '#ffd9a8', intensity: 1.6, position: V(3, 6, 4) },
  };
}

/* ------------------------------------------------------------------ club */

function club(b: SB, cast: CastSpec[], player: FigureLook): Cfg {
  b.bevel = true;
  const floorTex = b.canvasTex(256, 192, () => {});
  const cv = floorTex.image as HTMLCanvasElement;
  const fg = cv.getContext('2d');
  const tcols = ['#ff3d9a', '#2ee6ff', '#ffb02e', '#7a4dff', '#2eff9a', '#ff5a3a'];
  const paint = (t: number): void => {
    if (!fg) return;
    const cols = 8, rows = 6, cw = 256 / cols, rh = 192 / rows;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const k = Math.floor(t * 3.2 + x * 0.7 + y * 1.3 + Math.sin(x * 2 + y * 3) * 2);
      const on = (k * 7 + x * 3 + y) % 5;
      fg.fillStyle = on < 2 ? tcols[(x * 3 + y * 5 + k) % tcols.length] : '#1b1530';
      fg.fillRect(x * cw, y * rh, cw, rh);
      fg.strokeStyle = '#0a0716';
      fg.lineWidth = 3;
      fg.strokeRect(x * cw, y * rh, cw, rh);
    }
    floorTex.needsUpdate = true;
  };
  paint(0);
  const floorMat = b.lit(floorTex, 0.25, 0.85);
  b.floor(9, 5.6, floorMat, 0, -0.9, 0.01);
  b.floor(30, 20, '#120d22', 0, -3, 0);
  // walls
  b.box(26, 6, 0.3, '#1a1230', 0, 3, -5.0);
  b.box(0.3, 6, 18, '#17102a', -7, 3, -1);
  b.box(0.3, 6, 18, '#17102a', 7, 3, -1);
  // led wall behind the DJ with animated equaliser
  b.box(5.2, 2.6, 0.12, '#07050f', 0, 2.55, -4.85);
  const bars: THREE.Mesh[] = [];
  for (let i = 0; i < 14; i++) {
    const mm = new THREE.Mesh(new THREE.BoxGeometry(0.26, 1, 0.04), new THREE.MeshBasicMaterial({ color: new THREE.Color(tcols[i % tcols.length]), toneMapped: false }));
    mm.position.set(-1.95 + i * 0.3, 1.5, -4.77);
    b.g.add(mm);
    bars.push(mm);
  }
  // DJ riser + booth
  b.box(4.2, 0.28, 1.5, '#241a3a', 0, 0.14, -3.9);
  b.box(2.3, 1.0, 0.8, '#1d1630', 0, 0.78, -3.05);
  b.box(2.34, 0.06, 0.84, '#0d0a18', 0, 1.3, -3.05);
  b.box(2.34, 0.02, 0.02, emis('#ff3d9a', 2), 0, 1.18, -2.64);
  b.box(2.2, 0.02, 0.02, emis('#2ee6ff', 2), 0, 0.5, -2.64);
  for (const sx of [-0.65, 0.65]) {
    b.cyl(0.24, 0.04, '#d6d9e0', sx, 1.35, -3.05, b.g, 36);
    b.ring(0.2, 0.01, '#8a8f9a', sx, 1.375, -3.05, Math.PI / 2);
  }
  b.box(0.5, 0.05, 0.4, '#2a2d34', 0, 1.35, -3.05);
  b.laptop(0, 1.39, -3.3, 0, null, true);
  // speaker stacks
  for (const sx of [-3.6, 3.6]) {
    b.box(0.9, 1.9, 0.8, '#0f0c18', sx, 0.95, -4.0);
    b.cyl(0.3, 0.05, '#2a2535', sx, 0.55, -3.58, b.g, 28).rotation.x = Math.PI / 2;
    b.cyl(0.2, 0.05, '#2a2535', sx, 1.35, -3.58, b.g, 28).rotation.x = Math.PI / 2;
    b.glow('#7a4dff', 1.0, sx, 0.55, -3.5, 0.2);
  }
  // truss + moving heads + disco ball
  b.box(11, 0.1, 0.1, '#2a2d34', 0, 4.4, -2.2);
  b.box(0.1, 0.1, 5, '#2a2d34', -4, 4.4, -0.5);
  b.box(0.1, 0.1, 5, '#2a2d34', 4, 4.4, -0.5);
  const beamCols = ['#ff3d9a', '#2ee6ff', '#ffb02e', '#7a4dff', '#2eff9a', '#ff5a3a'];
  const beams: THREE.Group[] = [];
  const coneG = new THREE.ConeGeometry(0.55, 5.4, 24, 1, true);
  for (let i = 0; i < 6; i++) {
    const g = b.grp(-4.5 + i * 1.8, 4.35, -2.2);
    const mat = new THREE.MeshBasicMaterial({ color: beamCols[i], transparent: true, opacity: 0.1, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
    const cone = new THREE.Mesh(coneG, mat);
    cone.position.y = -2.7;
    g.add(cone);
    b.sph(0.09, emis(beamCols[i], 2.5), 0, -0.05, 0, 1, 1, 1, g);
    b.glow(beamCols[i], 0.7, -4.5 + i * 1.8, 4.3, -2.2, 0.6);
    beams.push(g);
  }
  const ball = b.sph(0.34, m('#d9dce6', { metal: 1, rough: 0.12 }), 0, 3.9, -0.8);
  b.cyl(0.006, 0.6, '#444', 0, 4.2, -0.8, b.g, 6);
  b.glow('#ffffff', 1.2, 0, 3.9, -0.8, 0.35);
  // bar on the right
  b.box(2.8, 1.05, 0.7, '#2a1f45', 5.0, 0.52, -1.9, 0.0);
  b.box(2.9, 0.06, 0.8, '#0f0c18', 5.0, 1.07, -1.9);
  b.box(2.6, 0.03, 0.03, emis('#2ee6ff', 2), 5.0, 0.95, -1.53);
  b.box(2.8, 2.0, 0.2, '#1d1630', 5.0, 2.0, -3.2);
  for (let i = 0; i < 8; i++) b.cyl(0.04, 0.26, m(beamCols[i % 6], { emissive: beamCols[i % 6], ei: 0.9, opacity: 0.85 }), 3.95 + i * 0.3, 1.7 + (i % 3) * 0.3, -3.05, b.g, 12);
  b.glow('#ffb02e', 2.2, 5.0, 1.9, -3.0, 0.3);
  for (let i = 0; i < 3; i++) {
    b.cyl(0.015, 0.7, '#9aa0a8', 4.1 + i * 0.9, 0.35, -1.0, b.g, 8);
    b.cyl(0.17, 0.07, '#d6708a', 4.1 + i * 0.9, 0.72, -1.0, b.g, 20);
  }
  // lights and haze
  const l1 = b.light('#ff3d9a', 16, -3, 3.2, -1.0, 11);
  const l2 = b.light('#2ee6ff', 16, 3, 3.2, -1.0, 11);
  const l3 = b.light('#ffb02e', 10, 0, 3.0, 0.8, 9);
  for (let i = 0; i < 4; i++) b.glow(i % 2 ? '#7a4dff' : '#ff3d9a', 5.5, -3 + i * 2, 0.9 + (i % 2) * 0.4, -1.8 + (i % 2), 0.1);
  b.dust(0, 2.0, -1.0, 9, 3.4, 5, 70, '#ffd0ff', 0.07, 0.6, 0.03);

  const dancers: Slot[] = [
    SL('player', -0.6, -0.5, 0, -3.5, 'dance'),
    SL('friend', 0.7, -0.75, 0, -3.5, 'dance'),
    SL('friend', 0, -3.95, 0, 3, 'dance', { y: 0.28 }),
    SL('stranger', -2.3, -1.2, 0, -3.2, 'dance'),
    SL('stranger', 2.2, -1.1, 0, -3.2, 'dance'),
    SL('stranger', -1.4, -2.2, 0, -3.2, 'dance', { lite: true }),
    SL('stranger', 1.4, -2.2, 0, -3.2, 'dance', { lite: true }),
    SL('stranger', -3.3, -0.3, 0, -3.2, 'dance', { lite: true }),
    SL('stranger', 3.3, -0.2, 0, -3.2, 'dance', { lite: true }),
  ];
  const placed = b.populate(dancers, cast, player);
  void placed;
  b.upd.push((dt, t) => {
    const beat = (t * 2.0) % 1;
    const kick = Math.pow(1 - beat, 3);
    l1.intensity = 14 + kick * 8;
    l2.intensity = 14 + (1 - kick) * 6;
    l3.intensity = 9 + kick * 5;
    bars.forEach((bm, i) => {
      const h = 0.25 + (Math.sin(t * 6 + i * 0.8) * 0.5 + 0.5) * (1.5 + kick * 0.7) * (0.5 + 0.5 * Math.sin(i * 0.5 + t));
      bm.scale.y = h;
      bm.position.y = 1.3 + h / 2 - 0.5;
    });
    beams.forEach((g, i) => {
      g.rotation.z = Math.sin(t * 0.8 + i * 1.3) * 0.5;
      g.rotation.x = Math.cos(t * 0.6 + i * 0.9) * 0.45;
    });
    ball.rotation.y += dt * 0.6;
    if (Math.floor(t * 4.5) !== Math.floor((t - dt) * 4.5)) paint(t);
  });
  return {
    camera: aim(V(0.3, 2.1, 6.3), V(0.0, 1.35, -1.3), 42),
    background: '#0a0714',
    fog: { color: '#120a24', near: 8, far: 22 },
    ambient: { sky: '#8a6ac0', ground: '#2a1840', intensity: 0.85 },
    key: { color: '#b49cff', intensity: 0.8, position: V(0, 6, 4) },
  };
}

/* ------------------------------------------------------------------ gym */

function gym(b: SB, cast: CastSpec[], player: FigureLook): Cfg {
  const acc = b.p(1);
  b.floor(16, 11, b.lit(speckleTex(b, '#3b4048', '#6a717c', 7, 5, 9), 0.7, 0, 0.02), 0, -0.4);
  b.floor(16, 0.12, '#f0f2f4', 0, -3.1);
  b.box(16, 4, 0.2, '#e8edf2', 0, 2, -3.5);
  b.box(0.2, 4, 11, '#e2e8ee', -6, 2, -0.4);
  b.box(0.2, 4, 11, '#e2e8ee', 6, 2, -0.4);
  b.box(16, 0.5, 0.22, acc, 0, 1.0, -3.38);
  // mirror wall panel with soft reflection streaks
  const mirror = b.canvasTex(512, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, h);
    gr.addColorStop(0, '#b6cde0');
    gr.addColorStop(0.5, '#dfe9f2');
    gr.addColorStop(1, '#a9bfd4');
    g.fillStyle = gr;
    g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,0.35)';
    for (const x of [80, 190, 330, 450]) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 40, 0); g.lineTo(x - 50, h); g.lineTo(x - 90, h); g.fill(); }
    g.strokeStyle = 'rgba(70,90,110,0.55)';
    g.lineWidth = 5;
    for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(i * (w / 4), 0); g.lineTo(i * (w / 4), h); g.stroke(); }
  });
  b.box(8.4, 2.2, 0.06, '#59606b', -1.6, 2.05, -3.36);
  b.panel(8.2, 2.05, mirror, -1.6, 2.05, -3.32);
  const mural = textTex(b, 512, 128, null, [{ t: 'MOVE', size: 110, color: acc, y: 66, font: '900' }]);
  b.panel(2.6, 0.65, mural, 4.6, 2.7, -3.38);
  // window band on the right wall with daylight
  const sky = backdropTex(b, [[0, '#8cc4f0'], [1, '#e6f3fb']], { skyline: '#9fb7cf', seed: 3 });
  for (let i = 0; i < 3; i++) b.window(1.7, 1.4, sky, 5.88, 2.3, -2.2 + i * 2.3, -Math.PI / 2, '#f4f6f8', '#fff3d2');
  b.dust(0.5, 2.0, -1.2, 9, 3, 4, 34, '#ffffff', 0.045, 0.4, 0.012);
  // mats
  const matG = [[-0.65, -0.55, '#4a6fd6'], [0.85, -0.65, '#7a5cb0']] as const;
  for (const [x, z, c] of matG) b.box(0.9, 0.025, 1.9, c, x, 0.0125, z - 0.1);
  // treadmills at the right, users facing -x
  const treadmill = (z: number): void => {
    const g = b.grp(3.5, 0, z, Math.PI / 2 * 1.0);
    b.box(0.85, 0.16, 1.9, '#23262c', 0, 0.16, 0, 0, g);
    b.box(0.6, 0.02, 1.75, '#15171c', 0, 0.255, 0, 0, g);
    for (const sx of [-0.4, 0.4]) b.box(0.05, 0.04, 1.8, '#9aa0a8', sx, 0.24, 0, 0, g);
    for (const sx of [-0.35, 0.35]) b.box(0.05, 1.1, 0.05, '#2a2d34', sx, 0.74, 0.85, 0, g);
    b.box(0.85, 0.2, 0.18, '#15171c', 0, 1.3, 0.85, 0, g);
    b.plane(0.5, 0.12, emis('#4ade80', 1.2), 0, 1.31, 0.762, 0, 0, g);
    b.box(0.8, 0.04, 0.05, '#2a2d34', 0, 1.1, 0.85, 0, g);
  };
  treadmill(-1.1);
  treadmill(-2.45);
  // free weights rack + dumbbells + bench + kettlebells
  b.box(1.9, 0.9, 0.5, '#2a2d34', -4.3, 0.45, -3.0);
  b.box(2.0, 0.04, 0.55, '#3a3f48', -4.3, 0.92, -3.0);
  b.box(2.0, 0.04, 0.55, '#3a3f48', -4.3, 0.48, -3.0);
  for (let i = 0; i < 7; i++) {
    const x = -5.05 + i * 0.25, w = 0.05 + (i % 4) * 0.012;
    b.cyl(0.011, 0.18, '#aeb4bc', x, 1.05, -3.0, b.g, 8).rotation.x = Math.PI / 2;
    b.sph(0.06 + (i % 4) * 0.01, '#2a2d34', x, 1.05, -3.09, 1, 1, w * 5);
    b.sph(0.06 + (i % 4) * 0.01, '#2a2d34', x, 1.05, -2.91, 1, 1, w * 5);
    b.cyl(0.011, 0.18, '#aeb4bc', x, 0.61, -3.0, b.g, 8).rotation.x = Math.PI / 2;
    b.sph(0.06 + ((i + 2) % 4) * 0.01, '#c9473e', x, 0.61, -3.09, 1, 1, 0.4);
    b.sph(0.06 + ((i + 2) % 4) * 0.01, '#c9473e', x, 0.61, -2.91, 1, 1, 0.4);
  }
  for (let i = 0; i < 3; i++) {
    b.sph(0.11, '#23262c', -2.7 + i * 0.3, 0.12, -2.4, 1, 1, 1);
    b.ring(0.07, 0.016, '#23262c', -2.7 + i * 0.3, 0.24, -2.4, 0, 0);
  }
  b.box(0.35, 0.14, 1.2, '#2a2d34', -3.6, 0.45, -1.2, 0.2);
  b.box(0.3, 0.1, 1.15, '#c9473e', -3.6, 0.55, -1.2, 0.2);
  for (const dz of [-0.45, 0.45]) b.box(0.06, 0.4, 0.06, '#2a2d34', -3.6 + dz * 0.2, 0.2, -1.2 + dz, 0.2);
  b.sph(0.34, acc, -2.2, 0.34, -0.6, 1, 1, 1);
  // water cooler, clock, plant, towels
  b.box(0.36, 0.95, 0.36, '#cfd5dc', 5.2, 0.48, 1.0);
  b.cyl(0.14, 0.34, m('#9fd2f0', { opacity: 0.55, rough: 0.1 }), 5.2, 1.2, 1.0, b.g, 20);
  const clk = b.canvasTex(128, 128, (g) => {
    g.fillStyle = '#fff'; g.beginPath(); g.arc(64, 64, 60, 0, 7); g.fill(); g.strokeStyle = '#222'; g.lineWidth = 6; g.stroke();
    g.lineWidth = 5; g.beginPath(); g.moveTo(64, 64); g.lineTo(64, 28); g.stroke(); g.beginPath(); g.moveTo(64, 64); g.lineTo(92, 74); g.stroke();
  });
  b.panel(0.5, 0.5, clk, 2.6, 3.2, -3.38);
  b.plant(-5.4, -2.9, 1.5);
  b.box(0.4, 0.05, 0.28, '#f4f4f4', -1.8, 0.6, -2.4, 0.2);
  b.shaft(5.85, 2.2, -1.0, -Math.PI / 2, 1.5, 6, 0.85, '#fff0cc', 0.1);
  b.light('#fff6e6', 10, 0, 3.4, -0.5, 14);

  const slots: Slot[] = [
    SL('player', -0.65, -0.55, -0.65, 3, 'exercise'),
    SL('friend', 0.85, -0.7, 0.85, 3, 'exercise'),
    SL('stranger', 3.5, -1.1, 0, -1.1, 'walk', { y: 0.27, lite: true }),
    SL('stranger', 3.5, -2.45, 0, -2.45, 'walk', { y: 0.27, lite: true }),
    SL('stranger', -3.6, -1.15, -3.6, 3, 'phone', { seat: 0.48, lite: true }),
  ];
  const placed = b.populate(slots, cast, player);
  for (const p of placed) if (p.fig.pose === 'walk') p.fig.walkRate = 0.75;
  return {
    camera: aim(V(0.3, 2.3, 6.4), V(0.1, 1.15, -0.9), 44),
    background: '#cfd8e2',
    fog: null,
    ambient: { sky: '#f4faff', ground: '#8a929e', intensity: 1.75 },
    key: { color: '#fff4e0', intensity: 1.7, position: V(4, 6, 4) },
  };
}

/* ------------------------------------------------------------------ rooftop */

function rooftop(b: SB, cast: CastSpec[], player: FigureLook): Cfg {
  const acc = b.p(0);
  b.floor(16, 12, b.lit(woodTex(b, '#8a6a4a', 0.2, 7, 6, 5), 0.6), 0, -1.2);
  // skyline backdrop
  const sky = backdropTex(b, [[0, '#2a2f6e'], [0.45, '#c4608a'], [0.75, '#f4a86a'], [1, '#ffd49a']], { stars: true, skyline: '#2a2347', seed: 7 });
  b.plane(46, 14, b.basic(sky), 0, 5.6, -17);
  const sky2 = skylineTex(b, 512, 160, 'dusk', 8, '#ffd9a0', true);
  b.plane(30, 6.0, new THREE.MeshBasicMaterial({ map: sky2, transparent: true, toneMapped: false, opacity: 0.9 }), 0, 2.4, -11);
  // parapet wall + rail
  b.box(16, 0.9, 0.35, '#7a6e66', 0, 0.45, -5.0);
  b.box(16, 0.08, 0.5, '#a89c92', 0, 0.94, -5.0);
  b.box(0.35, 0.9, 6, '#7a6e66', -7.8, 0.45, -2.2);
  b.box(0.35, 0.9, 6, '#7a6e66', 7.8, 0.45, -2.2);
  // pergola posts and string lights
  const postX = [-4.5, 4.5];
  for (const px of postX) {
    b.cyl(0.07, 3.2, '#4a3a2c', px, 1.6, -3.6, b.g, 12);
    b.cyl(0.07, 3.2, '#4a3a2c', px, 1.6, 1.4, b.g, 12);
  }
  b.box(9.4, 0.1, 0.12, '#4a3a2c', 0, 3.2, -3.6);
  b.box(9.4, 0.1, 0.12, '#4a3a2c', 0, 3.2, 1.4);
  const bulbs: THREE.Mesh[] = [];
  for (let row = 0; row < 3; row++) {
    const z = -3.6 + row * 2.5;
    for (let i = 0; i < 22; i++) {
      const u = i / 21, x = -4.5 + u * 9, y = 3.15 - Math.sin(u * Math.PI) * 0.45 - (i % 2) * 0.05;
      const bm = b.sph(0.04, emis(['#ffe29a', '#ffd0e0', '#bfe9ff'][i % 3], 2.6), x, y, z);
      bulbs.push(bm);
      if (i % 4 === 0) b.glow('#ffd28a', 0.55, x, y, z, 0.55);
    }
    b.box(9, 0.01, 0.01, '#222', 0, 3.1, z).scale.set(1, 1, 1);
  }
  // bean bags
  const bean = (x: number, z: number, c: string, ry = 0): void => {
    const g = b.grp(x, 0, z, ry);
    b.sph(0.5, c, 0, 0.3, 0, 1, 0.62, 1.0, g);
    b.sph(0.34, shadeHex(c, 0.05), 0, 0.5, -0.28, 1, 0.9, 0.7, g);
    b.blob(x, z, 1.5, 1.5);
  };
  bean(-1.0, -1.5, acc);
  bean(0.5, -1.7, '#4361ee');
  bean(1.9, -1.2, '#2ec4b6');
  bean(-2.4, -0.8, '#e0a23f', 0.4);
  // low table with snacks and drinks, lantern
  b.cyl(0.5, 0.05, '#c19a62', 0.3, 0.36, -0.6, b.g, 28);
  for (const a of [0, 2.1, 4.2]) b.cyl(0.03, 0.34, '#3a2a1e', 0.3 + Math.cos(a) * 0.3, 0.17, -0.6 + Math.sin(a) * 0.3, b.g, 8);
  for (let i = 0; i < 4; i++) b.cyl(0.03, 0.12, m(['#c9473e', '#e0a23f', '#3f8f4e', '#4a6fd6'][i], { emissive: '#000', rough: 0.3 }), 0.1 + i * 0.12, 0.45, -0.7 + (i % 2) * 0.1, b.g, 14);
  b.cyl(0.14, 0.02, '#f4f4f0', 0.45, 0.4, -0.45, b.g, 24);
  b.sph(0.05, '#e0b070', 0.42, 0.43, -0.45);
  b.cyl(0.07, 0.14, emis('#ffcf8a', 1.6), 0.0, 0.45, -0.52, b.g, 18);
  b.glow('#ffcf8a', 0.9, 0.0, 0.47, -0.52, 0.5);
  // planters, lantern posts
  for (const x of [-5.2, 5.2]) {
    b.box(0.9, 0.6, 0.45, '#6a5a4c', x, 0.3, -4.5);
    b.plant(x - 0.2, -4.5, 1.6, 0.6);
    b.plant(x + 0.2, -4.45, 1.2, 0.6);
  }
  b.plant(-3.6, 0.9, 1.4);
  b.plant(4.0, 0.7, 1.3);
  // vent, water tank silhouette
  b.box(0.9, 0.7, 0.9, '#6a6e78', 6.2, 0.35, -3.8);
  b.cyl(0.6, 1.4, '#7a665a', -6.3, 1.7, -4.0, b.g, 24);
  b.cyl(0.04, 1.0, '#4a3a2c', -6.3, 0.5, -4.0, b.g, 8);
  b.light('#ffb77a', 11, 0, 2.6, -1.0, 11);
  b.light('#ff9a6a', 6, -4, 1.4, -2.0, 8);
  b.upd.push((_d, t) => bulbs.forEach((bm, i) => { bm.scale.setScalar(0.04 * (1 + Math.sin(t * 2 + i) * 0.1)); }));
  b.dust(0, 1.8, -1.0, 11, 3, 6, 38, '#ffe0b0', 0.05, 0.5, 0.02);

  const slots: Slot[] = [
    SL('player', -1.0, -1.5, 0.3, -0.5, 'laugh', { seat: 0.3, look: [0.5, 1.2, -0.6] }),
    SL('friend', 0.5, -1.7, -0.7, -0.9, 'laugh', { seat: 0.3, look: [-1.0, 1.2, -1.5] }),
    SL('roommate', 1.9, -1.2, 0.5, -0.7, 'talk', { seat: 0.3, look: [0.4, 1.2, -1.2] }),
    SL('stranger', -2.4, -0.8, -1.0, -1.2, 'talk', { seat: 0.3, lite: true }),
    SL('stranger', 3.3, -2.8, 3.3, 3, 'idle', { lite: true }),
    SL('stranger', -3.3, -3.4, -3.3, 3, 'phone', { lite: true, opt: true }),
  ];
  b.populate(slots, cast, player);
  return {
    camera: aim(V(0.6, 2.0, 5.6), V(-0.2, 1.0, -1.1), 44),
    background: '#f0a070',
    fog: { color: '#e9a07c', near: 16, far: 38 },
    ambient: { sky: '#ffcfa8', ground: '#7a5a4a', intensity: 1.15 },
    key: { color: '#ff9a5a', intensity: 1.5, position: V(-7, 3.5, 3) },
  };
}

/* ------------------------------------------------------------------ evening walk */

function walk(b: SB, cast: CastSpec[], player: FigureLook): Cfg {
  const speed = 1.15;
  // sky, ground, distant campus
  const sky = backdropTex(b, [[0, '#3a4380'], [0.4, '#c9648a'], [0.72, '#f6a56a'], [1, '#ffd9a0']], { stars: false, skyline: '#3a2f55', seed: 21 });
  b.plane(80, 22, b.basic(sky), 0, 9, -26);
  b.floor(60, 40, b.lit(speckleTex(b, '#5a7a3e', '#7a9a52', 12, 10, 3), 1), 0, -6);
  // scrolling path
  const pathTex = speckleTex(b, '#cdbf9f', '#a99978', 4, 1, 2);
  b.plane(60, 3.1, b.lit(pathTex, 0.95), 0, 0.012, -0.6, 0, -Math.PI / 2);
  b.box(60, 0.12, 0.18, '#a9a08c', 0, 0.06, -2.2);
  b.box(60, 0.12, 0.18, '#a9a08c', 0, 0.06, 1.0);
  // distant brick buildings with lit windows (static)
  const bt = brickTex(b, '#8a4a3c', 4, 1.4);
  for (let i = 0; i < 4; i++) {
    const x = -14 + i * 8 + (i % 2) * 2;
    const g = b.grp(x, 0, -13 - (i % 2) * 2);
    b.box(5.2, 5 + (i % 3), 3, b.lit(bt, 0.9), 0, 2.6 + (i % 3) * 0.5, 0, 0, g);
    for (let k = 0; k < 6; k++) for (let r = 0; r < 3; r++) b.plane(0.5, 0.7, emis('#ffd28a', 1.1), -2 + k * 0.8, 1.6 + r * 1.3, 1.52, 0, 0, g);
  }
  // scenery that scrolls past so the walkers progress along the path
  const period = 12;
  const scroll = b.grp(0, 0, 0);
  const treeCols = ['#c9602e', '#e0902e', '#a8452e', '#d6a02e', '#6b8f3e'];
  const r = rng(5);
  const addTree = (x: number, z: number, s: number, k: number): void => {
    b.cyl(0.14 * s, 2.0 * s, '#5a4030', x, 1.0 * s, z, scroll, 12);
    const blobs: Array<[number, number, number, number]> = [[0, 2.5, 0, 1.1], [0.7, 2.2, 0.3, 0.8], [-0.65, 2.3, -0.2, 0.85], [0.1, 3.1, 0.1, 0.75], [-0.3, 2.1, 0.7, 0.65], [0.4, 2.7, -0.6, 0.65]];
    blobs.forEach((bl, i) => b.sph(bl[3] * s, shadeHex(treeCols[k % treeCols.length], (i % 3 - 1) * 0.04 + (r() - 0.5) * 0.03), x + bl[0] * s, bl[1] * s, z + bl[2] * s, 1, 0.9, 1, scroll));
    b.blob(x, z, 2.6 * s, 2.6 * s);
  };
  for (let rep = -2; rep <= 2; rep++) {
    for (let i = 0; i < 3; i++) {
      const x = rep * period + i * 4 - 2;
      addTree(x, -3.6 - (i % 2) * 0.6, 1.0 + (i % 3) * 0.12, rep + i + 3);
      if (i !== 1) {
        const sc = shadeHex(treeCols[(i + rep + 7) % 5], -0.05);
        b.sph(0.32, sc, x + 1.6, 0.26, 2.3, 1.3, 0.8, 1.0, scroll);
        b.sph(0.24, shadeHex(sc, 0.05), x + 2.0, 0.2, 2.45, 1.2, 0.8, 1.0, scroll);
      }
    }
    // lamp posts
    for (const lz of [-2.45, -4.2]) {
      const x = rep * period + (lz > -3 ? 1 : 5);
      b.cyl(0.04, 3.0, '#2a2d34', x, 1.5, lz, scroll, 10);
      b.cyl(0.11, 0.05, '#2a2d34', x, 0.025, lz, scroll, 16);
      b.sph(0.14, emis('#ffd9a0', 2.4), x, 3.1, lz, 1, 1, 1, scroll);
      b.glow('#ffcf8a', 1.5, x, 3.1, lz, 0.6, scroll);
    }
    // bench
    const bx = rep * period + 8;
    b.box(1.5, 0.07, 0.45, '#8a6a4a', bx, 0.46, -2.55, 0, scroll);
    b.box(1.5, 0.4, 0.05, '#8a6a4a', bx, 0.72, -2.75, 0, scroll);
    for (const s of [-1, 1]) b.box(0.06, 0.45, 0.4, '#2a2d34', bx + s * 0.65, 0.22, -2.55, 0, scroll);
  }
  // falling leaves (points)
  const n = 70;
  const lp = new Float32Array(n * 3);
  const ph = new Float32Array(n);
  for (let i = 0; i < n; i++) { lp[i * 3] = (r() - 0.5) * 12; lp[i * 3 + 1] = r() * 4; lp[i * 3 + 2] = -4 + r() * 8; ph[i] = r() * 6.28; }
  const lgeo = new THREE.BufferGeometry();
  lgeo.setAttribute('position', new THREE.BufferAttribute(lp, 3));
  const leafTex = b.canvasTex(32, 32, (g) => { g.fillStyle = '#fff'; g.beginPath(); g.ellipse(16, 16, 11, 6, 0.6, 0, 7); g.fill(); });
  const lmat = new THREE.PointsMaterial({ map: leafTex, color: '#e0802e', size: 0.2, transparent: true, depthWrite: false, alphaTest: 0.1, sizeAttenuation: true });
  const lpts = new THREE.Points(lgeo, lmat);
  lpts.frustumCulled = false;
  b.g.add(lpts);
  const pathScroll = pathTex;
  b.upd.push((_d, t) => {
    scroll.position.x = -((t * speed) % period);
    pathScroll.offset.x = (t * speed) / 15;
    for (let i = 0; i < n; i++) {
      const u = (t * 0.22 + ph[i] / 6.28) % 1;
      lp[i * 3 + 1] = 4.2 - u * 4.2;
      lp[i * 3] = (((ph[i] * 1.9 + t * (-0.5) + Math.sin(t * 0.8 + ph[i]) * 0.3) % 12) + 12) % 12 - 6;
    }
    lgeo.attributes.position.needsUpdate = true;
  });
  b.light('#ffb277', 9, 0, 3.4, 0.5, 11);
  b.light('#ff9a6a', 5, -3, 3.2, -1, 8);
  b.dust(0, 1.8, -0.8, 10, 3, 6, 36, '#ffe0b0', 0.05, 0.5, 0.02);

  const slots: Slot[] = [
    SL('player', -0.5, -0.5, 6, -0.5, 'walk', { look: [0.4, 1.5, 3] }),
    SL('friend', 0.65, -0.35, 6, -0.35, 'walk', { look: [-0.4, 1.5, 3] }),
  ];
  const placed = b.populate(slots, cast, player);
  for (const p of placed) p.fig.walkRate = 0.95;
  // passers-by going the other way
  b.walker(crowdLook(61), 7, -1.5, -7, -1.5, 1.5, 0.4, true);
  b.walker(crowdLook(62), -8, 0.5, 8, 0.5, 1.9, 0.15, true);
  return {
    camera: aim(V(2.6, 1.6, 5.4), V(0.1, 1.15, -0.4), 42),
    background: '#f2a56e',
    fog: { color: '#e9a07c', near: 12, far: 36 },
    ambient: { sky: '#ffcfa8', ground: '#6a5a40', intensity: 1.15 },
    key: { color: '#ff9a5a', intensity: 1.6, position: V(-8, 3.5, 2) },
  };
}

/* ------------------------------------------------------------------ registry */

export const EXTRA_BUILDERS: Partial<Record<StageId, Builder>> = { bedroom, kitchen, club, gym, rooftop, walk };

// keep unused helper imports referenced for future stage additions
void stdMat; void textTex;
