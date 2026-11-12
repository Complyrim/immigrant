import * as THREE from 'three';
import { beginCastScene, castSettled } from './MhFigure';
import { makeRelief } from './relief';
import { backdropDepth, backdropCookSpot, backdropCounter, backdropFor, backdropHorizon, backdropLight, backdropLounge, backdropMaxSpan, backdropPerson, backdropSeats } from './backdrops';
import type { SeatSpot } from './backdrops';
import { pbrMaterial } from './pbr';
import type { CastSpec, Pose } from '../engine/types';
import { ROLE_LOOKS, crowdLook, stdMat } from './Figure';
import type { FigureLook } from './Figure';
import { SB, SL, m, aim, V, rng, ryTo, setSeatStyle, skyGrad, skylineTex, booksTex, textTex, codeTex } from './stage-kit';
import type { Cfg, FigureLike, Slot, StageResult } from './stage-kit';
import type { StageId } from '../engine/types';
import { EXTRA_BUILDERS } from './stage-extra';
export type { StageResult } from './stage-kit';

/** The first line of the airport arrivals board: a flight from the player's home country. */
let boardLine = 'AI 101  DELHI      LANDED';
export function setBoardLine(line: string): void {
  boardLine = line.slice(0, 26);
}


function airport(b: SB, cast: CastSpec[], player: FigureLook): Cfg {
  const acc = b.p(0);
  const floorTex = b.canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#c9ced8';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = '#aab1be';
    g.lineWidth = 3;
    g.strokeRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,0.35)';
    g.fillRect(10, 10, 90, 18);
  });
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
  floorTex.repeat.set(9, 7);
  const fl = b.floor(24, 14, b.lit(floorTex, 0.28), 0, -0.5);
  fl.name = 'floor';
  // night apron window wall
  const apron = b.canvasTex(1024, 256, (g, w, h) => {
    skyGrad(g, w, h, [[0, '#050a1c'], [0.62, '#16224a'], [0.64, '#1d2a2e'], [1, '#101417']]);
    for (let i = 0; i < 70; i++) { g.fillStyle = `rgba(255,255,255,${0.2 + Math.random() * 0.5})`; g.fillRect(Math.random() * w, Math.random() * h * 0.5, 2, 2); }
    // plane
    g.fillStyle = '#e8ecf2';
    g.beginPath();
    g.ellipse(560, 150, 200, 26, 0, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.moveTo(690, 150); g.lineTo(770, 70); g.lineTo(790, 70); g.lineTo(745, 150); g.fill();
    g.fillStyle = '#b6bcc8';
    g.beginPath(); g.moveTo(520, 160); g.lineTo(430, 215); g.lineTo(470, 215); g.lineTo(600, 160); g.fill();
    g.fillStyle = acc;
    g.fillRect(500, 148, 150, 5);
    g.fillStyle = '#ffd88a';
    for (let x = 400; x < 700; x += 14) g.fillRect(x, 140, 6, 6);
    // jet bridge + runway lights
    g.fillStyle = '#7d8795';
    g.fillRect(250, 120, 140, 38);
    for (let x = 0; x < w; x += 36) { g.fillStyle = x % 72 ? '#4aa3ff' : '#ffd24a'; g.fillRect(x, 232, 6, 6); }
    for (let x = 0; x < w; x += 90) { g.fillStyle = '#ff4a4a'; g.fillRect(x + 20, 190, 4, 4); }
  });
  b.panel(26, 6.2, apron, 0, 3.1, -4.75);
  b.box(26, 0.9, 0.3, '#59616f', 0, 0.45, -4.5);
  for (let i = -5; i <= 5; i++) b.box(0.1, 5.4, 0.12, '#cfd5de', i * 2.4, 2.9, -4.45);
  b.box(26, 0.2, 0.2, '#cfd5de', 0, 5.4, -4.45);
  b.box(26, 0.1, 0.2, '#cfd5de', 0, 3.1, -4.45);
  // glow strip
  b.box(26, 0.05, 0.05, m(acc, { emissive: acc, ei: 1.4 }), 0, 0.92, -4.3);

  // booth
  b.box(0.75, 1.05, 1.9, '#e9ecf1', 0, 0.525, -0.3);
  b.box(0.92, 0.05, 2.0, '#2d3340', 0, 1.075, -0.3);
  b.box(0.02, 0.12, 1.7, m(acc, { emissive: acc, ei: 0.9 }), -0.38, 0.8, -0.3);
  b.box(0.02, 0.85, 1.7, m('#bfe3ff', { opacity: 0.2, rough: 0.1 }), 0.0, 1.55, -0.3);
  b.box(0.05, 0.05, 1.8, '#9aa3b0', 0, 1.99, -0.3);
  b.box(0.05, 0.95, 0.05, '#9aa3b0', 0, 1.52, 0.58);
  b.box(0.05, 0.95, 0.05, '#9aa3b0', 0, 1.52, -1.18);
  b.box(0.1, 2.3, 2.1, '#c7ced9', 1.6, 1.15, -0.4);
  b.box(1.4, 0.1, 2.1, '#aab3c0', 0.9, 2.3, -0.4);
  const pass = codeTex(b, 'doc', acc, 3);
  b.monitor(0.38, 1.1, -0.85, Math.PI / 2, pass, 0.42, 0.26);
  b.box(0.2, 0.04, 0.16, m('#1b3a5a', { emissive: '#4aa0ff', ei: 0.7 }), -0.08, 1.12, 0.22);
  b.box(0.25, 0.012, 0.32, '#e6d6a0', -0.2, 1.11, -0.55, 0.3);
  b.box(0.21, 0.004, 0.29, '#fafafa', -0.2, 1.12, -0.55, 0.3);
  b.box(0.09, 0.01, 0.13, '#1d2e5c', -0.04, 1.115, -0.1, -0.2);
  // sign
  const sign = textTex(b, 512, 128, '#0c1220', [
    { t: 'ARRIVALS', size: 70, color: '#ffd24a', y: 52 },
    { t: 'PASSPORT CONTROL', size: 26, color: '#e8ecf2', y: 104 },
  ], '#2b3550');
  b.box(3.2, 0.8, 0.12, '#0c1220', 0.3, 3.0, -3.0);
  b.panel(3.1, 0.78, sign, 0.3, 3.0, -2.93);
  b.cyl(0.02, 2.6, '#808896', -1.1, 4.3, -3.0, b.g, 6);
  b.cyl(0.02, 2.6, '#808896', 1.7, 4.3, -3.0, b.g, 6);
  // flight board
  const board = b.canvasTex(512, 256, (g, w, h) => {
    g.fillStyle = '#0a0f1c'; g.fillRect(0, 0, w, h);
    g.font = 'bold 22px monospace'; g.fillStyle = '#ffcf4a'; g.textAlign = 'left';
    g.fillText('FLIGHT   FROM       STATUS', 20, 30);
    g.fillStyle = '#e8ecf2';
    [boardLine, 'UA 842  FRANKFURT  LANDED', 'BA 117  LONDON     ON TIME', 'EK 203  DUBAI      DELAYED', 'LH 442  MUNICH     ON TIME'].forEach((s, i) => g.fillText(s, 20, 70 + i * 36));
  });
  b.box(2.5, 1.2, 0.1, '#0a0f1c', -4.2, 2.9, -4.35);
  b.panel(2.4, 1.1, board, -4.2, 2.9, -4.28);
  // flag
  b.cyl(0.025, 3.4, '#c8ccd4', 2.5, 1.7, -1.5, b.g, 8);
  const flagTex = b.canvasTex(260, 170, (g, w, h) => {
    for (let i = 0; i < 13; i++) { g.fillStyle = i % 2 ? '#f4f4f4' : '#b3202e'; g.fillRect(0, (h / 13) * i, w, h / 13 + 1); }
    g.fillStyle = '#26356b'; g.fillRect(0, 0, w * 0.42, h * 0.54);
    g.fillStyle = '#f4f4f4';
    for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) g.fillRect(8 + c * 20, 8 + r * 20, 5, 5);
  });
  const flagPivot = b.grp(2.5, 3.1, -1.5);
  const flag = b.panel(1.0, 0.65, flagTex, 0.52, 0, 0, 0, flagPivot);
  (flag.material as THREE.MeshBasicMaterial).side = THREE.DoubleSide;
  b.upd.push((_d, t) => { flagPivot.rotation.y = Math.sin(t * 1.2) * 0.12; });
  // stanchions + line
  b.stanchions(-1.3, 1.1, -5.3, 1.1, 5);
  b.stanchions(-1.3, -0.9, -5.3, -0.9, 5);
  b.box(2.2, 0.006, 0.07, '#e9c43a', 0, 0.01, 1.0);
  // second booth far right
  b.box(0.75, 1.05, 1.9, '#e9ecf1', 4.0, 0.525, -0.3);
  b.box(0.92, 0.05, 2.0, '#2d3340', 4.0, 1.075, -0.3);
  b.box(0.1, 2.3, 2.1, '#c7ced9', 5.6, 1.15, -0.4);
  b.person({ ...ROLE_LOOKS.officer, skin: '#8d5a3b', hairStyle: 'bald' }, 4.85, -0.3, -Math.PI / 2 + 0.3, 'idle', { lite: true });

  const slots: Slot[] = [
    SL('player', -0.68, -0.25, 0.1, -0.45, 'talk', { look: [0.85, 1.65, -0.3] }),
    SL('officer', 0.9, -0.3, -0.6, -0.3, 'talk', { look: [-0.68, 1.6, -0.25] }),
    SL('stranger', -2.0, 0.1, 1.5, 0.2, 'idle'),
    SL('stranger', -3.1, 0.1, 1.5, 0.2, 'phone'),
    SL('stranger', -4.2, 0.1, 1.5, 0.2, 'idle', { lite: true }),
  ];
  const pl = player.accessory === 'suitcase' ? player : { ...player, accessory: 'suitcase' as const };
  b.populate(slots, cast, pl);
  b.walker(crowdLook(41), -6.5, 2.0, -2.2, 2.0, 0.85, 0.3);
  b.walker(crowdLook(42), 6.5, 2.6, 2.4, 2.6, 0.7, 0.6);

  return {
    camera: aim(V(-1.0, 2.7, 7.3), V(0.1, 1.25, -0.3), 42),
    background: '#0b1226',
    fog: { color: '#0b1226', near: 14, far: 34 },
    ambient: { sky: '#dfe6f5', ground: '#8a8f9c', intensity: 1.35 },
    key: { color: '#fff1da', intensity: 1.7, position: V(-2, 6, 5) },
  };
}

function intlOffice(b: SB, cast: CastSpec[], player: FigureLook): Cfg {
  const acc = b.p(1);
  b.floor(16, 12, '#4a5568', 0, -1);
  b.box(16, 4, 0.2, '#e9e3d6', 0, 2, -3.3);
  b.box(0.2, 4, 12, '#ddd6c8', -5, 2, -1);
  b.box(0.2, 4, 12, '#ddd6c8', 5, 2, -1);
  b.box(16, 0.12, 0.12, '#8f8a7c', 0, 0.06, -3.18);
  // world map
  const map = b.canvasTex(1024, 512, (g, w, h) => {
    g.fillStyle = '#2f5d7c'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#7da38a';
    const polys: number[][] = [
      [60, 80, 250, 60, 330, 110, 300, 200, 260, 250, 200, 230, 150, 170, 90, 150],
      [260, 260, 330, 270, 360, 340, 320, 440, 280, 430, 260, 340],
      [450, 90, 540, 80, 560, 130, 500, 160, 450, 140],
      [460, 180, 560, 170, 620, 250, 580, 360, 520, 380, 480, 300, 450, 230],
      [560, 70, 800, 60, 900, 120, 850, 220, 740, 260, 660, 200, 620, 150],
      [800, 330, 900, 330, 910, 400, 820, 410],
    ];
    for (const p of polys) { g.beginPath(); g.moveTo(p[0], p[1]); for (let i = 2; i < p.length; i += 2) g.lineTo(p[i], p[i + 1]); g.closePath(); g.fill(); }
    g.fillStyle = '#f3b24a';
    g.beginPath(); g.moveTo(680, 210); g.lineTo(745, 215); g.lineTo(715, 300); g.closePath(); g.fill();
    g.strokeStyle = acc; g.lineWidth = 5; g.setLineDash([12, 8]);
    g.beginPath(); g.moveTo(715, 240); g.quadraticCurveTo(480, -20, 200, 150); g.stroke();
    g.fillStyle = '#ff5a5a'; g.beginPath(); g.arc(200, 150, 10, 0, 7); g.fill();
    g.beginPath(); g.arc(712, 245, 10, 0, 7); g.fill();
  });
  b.box(3.5, 1.9, 0.08, '#6b5a45', 0.1, 2.2, -3.18);
  b.panel(3.34, 1.74, map, 0.1, 2.2, -3.12);
  // posters
  const poster = (x: number, t1: string, t2: string, col: string): void => {
    const tx = textTex(b, 200, 280, '#fbfaf6', [{ t: t1, size: 30, color: col, y: 70 }, { t: t2, size: 18, color: '#555', y: 120, font: 'normal' }, { t: '• • •', size: 20, color: col, y: 200 }], col);
    b.panel(0.8, 1.1, tx, x, 2.0, -3.12);
  };
  poster(-3.4, 'WELCOME', 'F-1 students', acc);
  poster(-2.4, 'CPT / OPT', 'Ask your DSO', '#c9473e');
  poster(2.9, 'I-20', 'Keep it valid', '#2f7f86');
  // window
  const sky = skylineTex(b, 256, 256, 'day', 11, '#ffffff', true);
  b.window(1.2, 1.4, sky, 4.0, 2.1, -3.2);
  // cabinets
  for (let i = 0; i < 3; i++) {
    b.box(0.62, 1.4, 0.55, '#8c96a3', -3.9 + i * 0.66, 0.7, -2.9);
    for (let k = 0; k < 3; k++) b.box(0.2, 0.03, 0.02, '#d8dde3', -3.9 + i * 0.66, 0.35 + k * 0.42, -2.6);
  }
  // shelf
  b.box(1.8, 2.0, 0.4, '#6e5a44', 2.4, 1.0, -3.0);
  b.panel(1.7, 1.9, booksTex(b, 256, 256, 7, 5), 2.4, 1.0, -2.79);
  b.plant(3.6, -2.7, 1.2);
  // desk
  const dk = b.desk(0, -0.5, 0.9, 1.8, 0, '#a9784a');
  void dk;
  b.box(0.04, 0.5, 1.6, '#8a6038', 0.4, 0.45, -0.5);
  b.monitor(0.2, 0.765, -0.95, Math.PI / 2, codeTex(b, 'web', acc, 5), 0.42, 0.26);
  b.box(0.12, 0.015, 0.34, '#2a2d34', 0.3, 0.77, -0.5);
  b.box(0.22, 0.012, 0.3, '#fafafa', -0.2, 0.77, -0.3, 0.3);
  b.box(0.2, 0.012, 0.28, '#e6d6a0', -0.17, 0.78, -0.28, 0.4);
  b.cyl(0.04, 0.09, '#c9473e', -0.15, 0.82, -1.1);
  const np = textTex(b, 160, 40, '#2b3445', [{ t: 'INTERNATIONAL OFFICE', size: 13, color: '#fff', y: 20 }]);
  b.panel(0.3, 0.075, np, -0.3, 0.81, 0.25, -Math.PI / 2 + 0.0);
  // bench
  b.box(1.9, 0.06, 0.5, '#5b6272', -3.3, 0.4, -1.8);
  b.box(1.9, 0.5, 0.05, '#5b6272', -3.3, 0.7, -2.05);
  for (const sx of [-1, 1]) b.box(0.05, 0.4, 0.4, '#2b2e36', -3.3 + sx * 0.85, 0.2, -1.8);

  const slots: Slot[] = [
    SL('player', -0.9, -0.5, 0.0, -0.45, 'sit', { seat: 'chair', look: [0.9, 1.6, -0.5] }),
    SL('dso', 0.9, -0.5, 0.0, -0.4, 'talk', { seat: 'chair', look: [-0.9, 1.55, -0.5] }),
    SL('student', -3.7, -1.85, -3.7, 3, 'phone', { seat: 0.43, lite: true }),
    SL('student', -2.9, -1.85, -2.9, 3, 'idle', { seat: 0.43, lite: true }),
  ];
  b.populate(slots, cast, player, '#35506b');

  return {
    camera: aim(V(0.3, 2.4, 6.9), V(0, 1.2, -0.5), 44),
    background: '#d8d2c4',
    fog: null,
    ambient: { sky: '#fff3df', ground: '#8a8478', intensity: 1.5 },
    key: { color: '#fff0d6', intensity: 1.9, position: V(3, 6, 5) },
  };
}

function classroom(b: SB, cast: CastSpec[], player: FigureLook): Cfg {
  const acc = b.p(2);
  const wood = b.canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#b98f61'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#c29a6b' : '#b08558'; g.fillRect(0, i * 16, w, 15); g.fillStyle = 'rgba(0,0,0,0.15)'; g.fillRect(0, i * 16, w, 1); }
  });
  wood.wrapS = wood.wrapT = THREE.RepeatWrapping;
  wood.repeat.set(6, 4);
  b.floor(14, 11, b.lit(wood, 0.5), 0, 0);
  b.box(14, 4.2, 0.2, '#ece7dc', 0, 2.1, -4.2);
  b.box(0.2, 4.2, 11, '#e6e0d3', -5.2, 2.1, 0.5);
  b.box(0.2, 4.2, 11, '#e6e0d3', 5.2, 2.1, 0.5);
  // whiteboard
  const wb = b.canvasTex(1024, 360, (g, w, h) => {
    g.fillStyle = '#fbfbfa'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#1f3d8a'; g.font = 'italic 46px "Comic Sans MS", cursive'; g.textAlign = 'left'; g.textBaseline = 'middle';
    g.fillText('Supply = Demand', 40, 56);
    g.fillStyle = '#c0392b'; g.fillText('P* = (a - c) / (b + d)', 40, 130);
    g.fillStyle = '#1f3d8a'; g.fillText('dQ/dP < 0', 40, 205);
    g.fillStyle = '#1f7a4a'; g.fillText('MR = MC', 40, 285);
    g.strokeStyle = '#1f3d8a'; g.lineWidth = 4;
    g.beginPath(); g.moveTo(560, 40); g.lineTo(560, 310); g.lineTo(980, 310); g.stroke();
    g.strokeStyle = '#c0392b'; g.beginPath(); g.moveTo(580, 70); g.lineTo(950, 280); g.stroke();
    g.strokeStyle = '#1f7a4a'; g.beginPath(); g.moveTo(580, 280); g.lineTo(950, 70); g.stroke();
    g.fillStyle = '#222'; g.beginPath(); g.arc(765, 175, 8, 0, 7); g.fill();
  });
  b.box(4.7, 1.8, 0.1, '#9aa0a8', -0.3, 1.9, -4.08);
  b.panel(4.5, 1.58, wb, -0.3, 1.9, -4.02);
  b.box(4.5, 0.06, 0.12, '#9aa0a8', -0.3, 1.02, -3.98);
  b.box(2.2, 0.08, 0.1, '#e9e9ea', -0.3, 3.15, -4.05);
  const clk = b.canvasTex(128, 128, (g) => {
    g.fillStyle = '#fff'; g.beginPath(); g.arc(64, 64, 60, 0, 7); g.fill(); g.strokeStyle = '#222'; g.lineWidth = 6; g.stroke();
    g.lineWidth = 5; g.beginPath(); g.moveTo(64, 64); g.lineTo(64, 28); g.stroke(); g.beginPath(); g.moveTo(64, 64); g.lineTo(92, 74); g.stroke();
  });
  b.panel(0.5, 0.5, clk, 3.0, 3.3, -4.04);
  // right-wall windows
  const sky = skylineTex(b, 256, 256, 'day', 21, '#fff', true);
  for (let i = 0; i < 3; i++) b.window(1.5, 1.6, sky, 5.08, 2.2, -2.2 + i * 2.6, -Math.PI / 2);
  // door
  b.box(1.0, 2.2, 0.08, '#8a6038', -4.0, 1.1, -4.08);
  // lectern
  b.box(0.7, 1.05, 0.5, '#7a5a3a', 2.2, 0.525, -3.0);
  b.laptop(2.2, 1.05, -3.0, 0.0, codeTex(b, 'web', acc, 2));
  // desks (rows) - desk top in front of each seat (seat faces -z)
  const rows: Array<[number, number]> = [[-1.2, 0.6], [0, 0.6], [1.2, 0.6], [-1.2, -0.8], [0, -0.8], [1.2, -0.8], [-0.6, -2.1], [0.6, -2.1]];
  for (const [x, z] of rows) {
    b.box(0.85, 0.045, 0.5, '#d9c2a0', x, 0.74, z - 0.58);
    b.box(0.04, 0.72, 0.4, '#3a3d46', x - 0.37, 0.37, z - 0.58);
    b.box(0.04, 0.72, 0.4, '#3a3d46', x + 0.37, 0.37, z - 0.58);
  }
  b.laptop(-1.2, 0.765, 0.6 - 0.58 + 0.15, Math.PI, codeTex(b, 'doc', acc, 3));
  b.laptop(1.2, 0.765, -0.8 - 0.58 + 0.15, Math.PI, codeTex(b, 'web', acc, 4));

  const slots: Slot[] = [
    SL('player', 0, 0.6, 0, -3, 'sit', { seat: 'chair', look: [-0.3, 1.7, -3.5] }),
    SL('professor', -0.3, -3.2, -0.3, 3, 'present', { look: [0.2, 1.6, 6.0] }),
    SL('student', -1.2, 0.6, -1.2, -3, 'sit', { seat: 'chair', look: [-0.3, 1.7, -3.5] }),
    SL('student', 1.2, 0.6, 1.2, -3, 'type', { seat: 'chair' }),
    SL('student', -1.2, -0.8, -1.2, -3, 'sit', { seat: 'chair', lite: true, look: [-0.3, 1.7, -3.5] }),
    SL('student', 0, -0.8, 0, -3, 'sit', { seat: 'chair', lite: true }),
    SL('student', 1.2, -0.8, 1.2, -3, 'think', { seat: 'chair', lite: true }),
    SL('student', -0.6, -2.1, -0.6, -3, 'type', { seat: 'chair', lite: true }),
    SL('student', 0.6, -2.1, 0.6, -3, 'sit', { seat: 'chair', lite: true }),
  ];
  const placed = b.populate(slots, cast, player, '#3b4a63');
  const prof = placed.find((p) => p.role === 'professor');
  if (prof) prof.fig.lookAt(V(0.5, 1.5, 6));

  return {
    camera: aim(V(1.4, 3.1, 6.6), V(-0.1, 1.2, -1.0), 42),
    background: '#cfd6df',
    fog: null,
    ambient: { sky: '#fff6e6', ground: '#8f8470', intensity: 1.5 },
    key: { color: '#fff0d6', intensity: 1.8, position: V(5, 6, 3) },
  };
}

function lab(b: SB, cast: CastSpec[], player: FigureLook): Cfg {
  const acc = b.p(3);
  b.floor(16, 11, '#8e97a3', 0, -0.5);
  b.box(16, 4, 0.2, '#e8ecef', 0, 2, -3.6);
  b.box(0.2, 4, 11, '#dfe4e8', -5, 2, -0.5);
  b.box(0.2, 4, 11, '#dfe4e8', 5, 2, -0.5);
  // back bench
  b.box(6.2, 0.88, 0.8, '#d9dee4', 0, 0.44, -3.1);
  b.box(6.3, 0.05, 0.9, '#2f3640', 0, 0.9, -3.1);
  b.box(6.2, 0.04, 0.3, '#c0c6ce', 0, 1.9, -3.4);
  b.monitor(-2.2, 0.925, -3.15, 0, codeTex(b, 'code', acc, 1), 0.6, 0.36);
  b.monitor(-1.4, 0.925, -3.2, 0.15, codeTex(b, 'graph', acc, 2), 0.5, 0.3);
  b.monitor(1.0, 0.925, -3.2, -0.1, codeTex(b, 'graph', '#ffcb6b', 3), 0.5, 0.3);
  // wall tv
  b.box(2.2, 1.3, 0.08, '#101216', 0.0, 2.6, -3.48);
  b.panel(2.1, 1.2, codeTex(b, 'graph', acc, 8), 0.0, 2.6, -3.43);
  // scope + glassware + microscope
  b.box(0.4, 0.22, 0.3, '#3a4350', 2.0, 1.03, -3.1);
  b.plane(0.2, 0.14, m('#0f2a1a', { emissive: '#3fe08a', ei: 1.4 }), 2.0, 1.05, -2.94);
  for (let i = 0; i < 3; i++) {
    b.cyl(0.07, 0.2 + i * 0.05, m('#cfe8f5', { opacity: 0.4, rough: 0.1 }), 2.7 + i * 0.22, 1.03 + i * 0.025, -3.1, b.g, 12);
    b.cyl(0.055, 0.1 + i * 0.05, m(i === 1 ? '#e57373' : '#6fb7e9', { opacity: 0.8 }), 2.7 + i * 0.22, 0.97 + i * 0.02, -3.1, b.g, 12);
  }
  b.box(0.22, 0.03, 0.22, '#2a2d34', 0.2, 0.935, -3.0);
  b.cyl(0.025, 0.3, '#2a2d34', 0.2, 1.08, -3.05, b.g, 8);
  b.cyl(0.04, 0.22, '#d9dee4', 0.2, 1.15, -2.95, b.g, 10).rotation.x = 0.5;
  // server rack
  const led = b.canvasTex(64, 256, (g, w, h) => {
    g.fillStyle = '#1b1f26'; g.fillRect(0, 0, w, h);
    for (let y = 8; y < h; y += 14) { g.fillStyle = '#2c333d'; g.fillRect(4, y, w - 8, 10); g.fillStyle = Math.random() < 0.6 ? '#4ade80' : '#fbbf24'; g.fillRect(8, y + 3, 4, 4); g.fillStyle = '#4aa0ff'; g.fillRect(16, y + 3, 4, 4); }
  });
  b.box(0.8, 2.2, 0.8, '#15181d', -3.9, 1.1, -3.0);
  b.panel(0.7, 2.1, led, -3.9, 1.1, -2.59);
  // whiteboard right
  const wb = b.canvasTex(512, 320, (g, w, h) => {
    g.fillStyle = '#fbfbfa'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#1f3d8a'; g.lineWidth = 4;
    for (let c = 0; c < 3; c++) for (let r = 0; r < 3 - (c === 1 ? 0 : 0); r++) { g.beginPath(); g.arc(80 + c * 150, 70 + r * 80, 18, 0, 7); g.stroke(); }
    g.strokeStyle = '#c0392b';
    for (let r = 0; r < 3; r++) for (let r2 = 0; r2 < 3; r2++) { g.beginPath(); g.moveTo(98, 70 + r * 80); g.lineTo(212, 70 + r2 * 80); g.stroke(); }
    g.fillStyle = '#1f7a4a'; g.font = 'italic 34px "Comic Sans MS", cursive'; g.fillText('loss ↓  epochs →', 40, 300);
    g.fillStyle = '#1f3d8a'; g.fillText('x → f(x) → y', 330, 100);
  });
  b.box(2.5, 1.6, 0.08, '#9aa0a8', 3.8, 2.0, -3.5);
  b.panel(2.4, 1.5, wb, 3.8, 2.0, -3.45);
  // island bench
  b.box(2.2, 0.88, 0.9, '#d9dee4', 2.2, 0.44, -0.8);
  b.box(2.3, 0.05, 1.0, '#2f3640', 2.2, 0.9, -0.8);
  b.laptop(1.9, 0.925, -0.75, 0.3, codeTex(b, 'code', acc, 5));
  b.plant(-4.2, -1.5, 1.1);
  // 3d printer
  b.box(0.5, 0.5, 0.5, m('#9fb4c8', { opacity: 0.35 }), -0.6, 1.2, -3.1);
  b.box(0.52, 0.04, 0.52, '#2a2d34', -0.6, 0.95, -3.1);
  b.box(0.52, 0.04, 0.52, '#2a2d34', -0.6, 1.45, -3.1);
  b.box(0.12, 0.12, 0.12, acc, -0.6, 1.02, -3.1);

  const slots: Slot[] = [
    SL('player', -0.65, -1.35, 0.55, -1.0, 'talk', { look: [0.65, 1.65, -1.3] }),
    SL('advisor', 0.65, -1.35, -0.55, -1.0, 'talk', { look: [-0.65, 1.6, -1.35] }),
    SL('student', -2.6, -2.45, -2.6, -4, 'type', { seat: 'stool', lite: false }),
    SL('student', 2.8, -1.7, 2.0, -1.5, 'think', { lite: true }),
  ];
  b.populate(slots, cast, player, '#2e3d52');

  return {
    camera: aim(V(0.4, 2.5, 6.6), V(0, 1.25, -1.35), 42),
    background: '#cdd5de',
    fog: null,
    ambient: { sky: '#eaf3ff', ground: '#8c97a6', intensity: 1.55 },
    key: { color: '#f4f8ff', intensity: 1.7, position: V(2, 6, 5) },
  };
}

function apartment(b: SB, cast: CastSpec[], player: FigureLook, night: boolean): Cfg {
  const acc = b.p(1);
  const wallC = night ? '#3a3040' : '#e6dccb';
  const floorC = night ? '#3d2f28' : '#a97e56';
  b.floor(12, 9, floorC, 0, -0.3);
  b.box(12, 3.4, 0.2, wallC, 0, 1.7, -3.3);
  b.box(0.2, 3.4, 9, wallC, -4.6, 1.7, 0.2);
  b.box(0.2, 3.4, 9, wallC, 4.6, 1.7, 0.2);
  const sky = skylineTex(b, 512, 256, night ? 'night' : 'day', 33, acc);
  b.window(3.2, 1.7, sky, -0.2, 1.95, -3.18);
  b.box(3.6, 0.06, 0.3, '#f1efe9', -0.2, 1.05, -3.1);
  // rug
  b.rug(0.1, -0.7, 1.6, night ? '#4a3a52' : '#d9c7a6', night ? '#7a5a6a' : acc, 0.8);
  // sofa
  b.sofa(0.0, -2.62, 2.3, night ? '#5b4a6a' : '#6d7f95');
  b.sph(0.1, night ? '#c98b5a' : acc, -0.95, 0.6, -2.55, 1, 1, 0.4);
  b.sph(0.1, '#e0d6c3', 0.98, 0.6, -2.55, 1, 1, 0.4);
  // coffee table
  b.box(0.9, 0.04, 0.5, '#7a5a3a', 0.1, 0.38, -1.35);
  b.box(0.05, 0.36, 0.05, '#4a3622', -0.3, 0.18, -1.55);
  b.box(0.05, 0.36, 0.05, '#4a3622', 0.5, 0.18, -1.55);
  b.box(0.05, 0.36, 0.05, '#4a3622', -0.3, 0.18, -1.15);
  b.box(0.05, 0.36, 0.05, '#4a3622', 0.5, 0.18, -1.15);
  b.cyl(0.04, 0.09, '#e8e1d2', -0.1, 0.45, -1.3, b.g, 10);
  // kitchen left
  b.box(2.6, 0.9, 0.65, '#d6d0c4', -3.1, 0.45, -2.9);
  b.box(2.7, 0.05, 0.7, '#4a4d55', -3.1, 0.92, -2.9);
  b.box(0.9, 1.9, 0.7, '#cfd5dc', -4.2, 0.95, -2.9);
  b.box(2.2, 0.7, 0.3, '#e9e4d8', -3.0, 2.0, -3.12);
  b.cyl(0.07, 0.14, '#d9d9d9', -3.2, 1.0, -2.9, b.g, 10);
  b.box(0.4, 0.05, 0.3, '#9aa0a8', -2.5, 0.95, -2.9);
  // desk right + chair
  b.desk(3.0, -2.4, 1.5, 0.7, 0, '#b88a5c');
  const dsk = codeTex(b, 'code', acc, 7);
  b.laptop(3.0, 0.765, -2.5, 0.1, night ? dsk : codeTex(b, 'web', acc, 6), night);
  b.chair(3.0, -1.7, Math.PI, '#4a4f5c');
  // boxes
  b.box(0.6, 0.45, 0.5, '#b88c5a', 2.0, 0.225, -2.95, 0.2);
  b.box(0.55, 0.4, 0.5, '#c29764', 2.05, 0.65, -2.9, -0.1);
  b.box(0.5, 0.4, 0.45, '#b88c5a', 3.9, 0.2, -2.9, 0.3);
  b.box(0.4, 0.3, 0.4, '#c29764', 4.1, 0.15, -2.3, -0.4);
  // string lights
  const bulbM = [m('#ffe29a', { emissive: '#ffcf6a', ei: night ? 2.2 : 0.8 }), m('#ffd0e0', { emissive: '#ff9ac0', ei: night ? 2.0 : 0.6 })];
  for (let i = 0; i < 18; i++) {
    const u = i / 17, x = -3.8 + u * 7.6, y = 2.85 - Math.sin(u * Math.PI) * 0.38;
    b.sph(0.045, bulbM[i % 2], x, y, -3.1);
  }
  b.plant(-1.9, -3.0, 1.4);
  b.plant(4.0, -1.2, 1.2);
  b.box(0.55, 0.7, 0.04, '#f1efe9', 1.6, 2.0, -3.18);
  b.panel(0.48, 0.62, textTex(b, 120, 150, '#2f5d7c', [{ t: 'HOME', size: 28, color: '#ffd9a0', y: 75 }]), 1.6, 2.0, -3.15);
  // suitcase corner
  b.box(0.7, 0.45, 0.28, '#c9473e', -4.0, 0.225, -0.6, 0.5);
  b.box(0.7, 0.04, 0.3, '#7d2e29', -4.0, 0.47, -0.6, 0.5);

  const slots: Slot[] = [
    SL('player', -0.5, -2.7, -0.05, 0, night ? 'phone' : 'type', { seat: 0.43, look: [0.4, 1.45, 3] }),
    SL('roommate', 0.65, -2.7, -0.3, 0, 'talk', { seat: 0.43, opt: night, look: [-0.5, 1.45, 2] }),
  ];
  const cast2 = cast.filter((c) => c.role !== 'parent');
  const placed = b.populate(slots, cast2, player);
  const pl = placed.find((p) => p.role === 'player');
  if (!night && pl && pl.fig.pose === 'type') b.laptop(-0.5, 0.58, -2.4, Math.PI, codeTex(b, 'web', acc, 9), true);
  if (!night) {
    return {
      camera: aim(V(0.5, 2.2, 5.0), V(0.05, 1.1, -2.6), 42),
      background: '#cfd8e2',
      fog: null,
      ambient: { sky: '#fff1dc', ground: '#8d7a62', intensity: 1.6 },
      key: { color: '#ffe2b8', intensity: 1.8, position: V(-3, 5, 4) },
    };
  }
  // night extras: lamp, laptop glow, call tablet
  b.cyl(0.02, 1.5, '#2a2420', 1.7, 0.75, -2.5, b.g, 6);
  b.cyl(0.18, 0.025, '#2a2420', 1.7, 0.012, -2.5, b.g, 14);
  const shade = b.cone(0.22, 0.28, m('#ffd9a0', { emissive: '#ffb454', ei: 1.8 }), 1.7, 1.6, -2.5);
  shade.rotation.x = Math.PI;
  const lamp = b.light('#ffb866', 16, 1.5, 1.5, -2.2, 9);
  const fill = b.light('#ff9a5a', 4, -0.5, 1.6, 0.5, 8);
  const glow = b.light('#7fd8ff', 1.8, -0.35, 1.25, -2.0, 3);
  b.upd.push((_d, t) => { lamp.intensity = 16 + Math.sin(t * 3.1) * 0.3; glow.intensity = 1.8 + Math.sin(t * 2) * 0.2; fill.intensity = 4; });
  b.laptop(0.1, 0.4, -1.35, 0.0, dsk, true);
  const parent = cast.find((c) => c.role === 'parent');
  // tablet video call (always present as a prop; the parent shows when cast)
  const tab = b.grp(0.95, 0, -1.7, -0.55);
  b.box(0.5, 0.04, 0.3, '#3a2a22', 0, 0.62, 0, 0, tab);
  b.box(0.06, 0.6, 0.06, '#3a2a22', 0, 0.3, 0, 0, tab);
  b.box(0.62, 0.9, 0.04, '#0b0d12', 0, 1.1, 0, 0, tab);
  const callBg = b.canvasTex(128, 192, (g, w, h) => {
    skyGrad(g, w, h, [[0, '#3a2f46'], [1, '#c98f5a']]);
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(0, h - 26, w, 26);
    g.fillStyle = '#4ade80'; g.beginPath(); g.arc(w / 2 - 22, h - 13, 8, 0, 7); g.fill();
    g.fillStyle = '#ef4444'; g.beginPath(); g.arc(w / 2 + 22, h - 13, 8, 0, 7); g.fill();
  });
  const scr = b.plane(0.56, 0.84, new THREE.MeshBasicMaterial({ map: callBg, toneMapped: false }), 0, 1.1, 0.025, 0, 0, tab);
  void scr;
  if (parent) {
    const pf = b.person(ROLE_LOOKS.parent, 0, 0.74, 0.03, 'wave', { scale: 0.3 });
    tab.add(pf.group);
    pf.group.position.set(0, 0.74, 0.04);
    pf.group.rotation.y = 0;
    b.light('#ffd0a0', 1.5, 1.0, 1.4, -0.9, 3);
  }
  return {
    camera: aim(V(0.5, 2.1, 5.0), V(0.3, 1.2, -2.3), 44),
    background: '#0a0b14',
    fog: { color: '#0a0b14', near: 9, far: 20 },
    ambient: { sky: '#8a7fb0', ground: '#4a3630', intensity: 0.9 },
    key: { color: '#9bb1ff', intensity: 0.35, position: V(-3, 5, 4) },
  };
}

function cafe(b: SB, cast: CastSpec[], player: FigureLook): Cfg {
  const acc = b.p(0);
  const brick = pbrMaterial('brick_wall_005', { color: '#d8c0b4', repeat: [5.6, 1.6], roughness: 1 });
  b.floor(14, 10, '#6e5238', 0, -0.5);
  b.plane(14, 4, brick, 0, 2, -3.5);
  b.box(0.2, 4, 10, '#d9c9ac', -5, 2, -0.5);
  b.box(0.2, 4, 10, '#d9c9ac', 5, 2, -0.5);
  // back bar
  b.box(5.5, 0.95, 0.6, '#3a2a20', 0.6, 0.475, -3.1);
  b.box(5.6, 0.05, 0.7, '#8a6a4a', 0.6, 0.97, -3.1);
  b.box(5.2, 0.05, 0.3, '#6b4a30', 0.6, 1.9, -3.35);
  // espresso machine
  b.box(0.8, 0.4, 0.45, '#b9bfc8', 0.6, 1.2, -3.1);
  b.box(0.8, 0.05, 0.47, '#2a2d34', 0.6, 1.42, -3.1);
  for (const dx of [-0.2, 0.2]) { b.cyl(0.05, 0.06, '#2a2d34', 0.6 + dx, 1.05, -2.85, b.g, 10); b.cyl(0.035, 0.07, '#f4f4f4', 0.6 + dx, 0.99, -2.85, b.g, 10); }
  b.cyl(0.11, 0.3, '#2a2d34', -0.4, 1.12, -3.1, b.g, 12);
  b.sph(0.12, '#3a2a20', -0.4, 1.34, -3.1);
  b.box(0.4, 0.3, 0.3, '#c9473e', 1.8, 1.12, -3.1);
  // menu board
  const menu = b.canvasTex(512, 300, (g, w, h) => {
    g.fillStyle = '#20262b'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#8a6a4a'; g.lineWidth = 10; g.strokeRect(5, 5, w - 10, h - 10);
    g.fillStyle = '#f0e8d8'; g.textBaseline = 'middle';
    g.font = 'bold 40px "Comic Sans MS", cursive'; g.textAlign = 'center'; g.fillText('MENU', w / 2, 40);
    g.font = '28px "Comic Sans MS", cursive'; g.textAlign = 'left';
    [['Espresso', '3.00'], ['Latte', '4.50'], ['Masala Chai', '4.00'], ['Cold Brew', '4.25'], ['Croissant', '3.75']].forEach((r, i) => { g.fillText(r[0], 40, 95 + i * 38); g.textAlign = 'right'; g.fillText(r[1], w - 40, 95 + i * 38); g.textAlign = 'left'; });
  });
  b.panel(2.6, 1.52, menu, 1.7, 2.45, -3.42);
  // counter
  b.box(3.9, 1.0, 0.7, '#7a5a3a', 1.4, 0.5, -1.7);
  b.box(4.0, 0.06, 0.8, '#d9cdb5', 1.4, 1.03, -1.7);
  b.box(3.9, 0.12, 0.02, m(acc, { emissive: acc, ei: 0.6 }), 1.4, 0.9, -1.34);
  // pastry case
  b.box(0.9, 0.34, 0.45, m('#cfe8f5', { opacity: 0.35 }), 2.3, 1.23, -1.7);
  b.box(0.9, 0.04, 0.45, '#e9e2d0', 2.3, 1.08, -1.7);
  for (let i = 0; i < 4; i++) b.sph(0.07, i % 2 ? '#c98b4a' : '#e0b070', 2.0 + i * 0.2, 1.15, -1.7, 1, 0.6, 1);
  b.cyl(0.05, 0.1, '#f4f4f4', 0.7, 1.11, -1.55, b.g, 10);
  b.cyl(0.05, 0.1, '#f4f4f4', 0.85, 1.11, -1.5, b.g, 10);
  b.box(0.35, 0.28, 0.25, '#2a2d34', 0.1, 1.17, -1.7);
  b.plane(0.28, 0.2, m('#1a3a5a', { emissive: '#4aa0ff', ei: 0.8 }), 0.1, 1.2, -1.57);
  // pendant lamps
  for (let i = 0; i < 3; i++) {
    b.cyl(0.008, 1.2, '#222', -1.0 + i * 1.5, 3.4, -1.0, b.g, 4);
    const c = b.cone(0.22, 0.2, m('#2a2a2a'), -1.0 + i * 1.5, 2.72, -1.0);
    c.rotation.x = Math.PI;
    b.sph(0.07, m('#fff0c0', { emissive: '#ffd27a', ei: 2.4 }), -1.0 + i * 1.5, 2.68, -1.0);
  }
  b.light('#ffc88a', 14, 0.0, 2.5, -0.5, 9);
  b.light('#ffc88a', 8, 3.0, 2.5, 0.5, 8);
  // tables
  const table = (x: number, z: number): void => {
    b.cyl(0.38, 0.04, '#c9a97a', x, 0.74, z, b.g, 18);
    b.cyl(0.04, 0.72, '#2a2d34', x, 0.37, z, b.g, 8);
    b.cyl(0.2, 0.03, '#2a2d34', x, 0.015, z, b.g, 12);
    b.cyl(0.04, 0.1, '#f4f4f4', x + 0.1, 0.81, z - 0.05, b.g, 10);
  };
  table(-2.9, -0.9); table(-2.9, 0.9); table(3.4, 0.4);
  b.laptop(-3.0, 0.765, -0.98, 0.3, codeTex(b, 'web', acc, 4));
  // window left wall
  b.window(1.8, 1.8, skylineTex(b, 256, 256, 'dusk', 5, '#fff', true), -4.88, 1.9, -0.5, Math.PI / 2);
  b.panel(1.4, 0.35, textTex(b, 280, 70, null, [{ t: 'CHAI & CO.', size: 46, color: '#ffe3a0', y: 36, font: 'bold' }]), -4.8, 3.05, -0.5, Math.PI / 2);
  b.plant(-4.3, -2.7, 1.5);
  b.plant(4.2, -2.7, 1.3);

  const slots: Slot[] = [
    SL('player', -0.6, -1.05, 0.6, -2.0, 'talk', { look: [0.55, 1.7, -2.4] }),
    SL('owner', 0.55, -2.45, -0.3, 0.5, 'talk', { look: [-0.6, 1.65, -1.05] }),
    SL('stranger', -2.0, -0.2, -0.95, -1.0, 'phone', { lite: true }),
    SL('stranger', -3.5, -0.9, -2.9, -0.9, 'type', { seat: 'chair', lite: true }),
    SL('stranger', 2.9, 0.4, 3.4, 0.4, 'talk', { seat: 'chair', lite: true }),
    SL('stranger', 3.9, 0.4, 3.4, 0.4, 'sit', { seat: 'chair', lite: true }),
  ];
  b.populate(slots, cast, player, '#6b4a30');
  b.steam(0.6, 1.5, -3.0, 3, 0.3);
  return {
    camera: aim(V(-0.4, 2.4, 6.4), V(0.0, 1.25, -1.7), 44),
    background: '#3a2a20',
    fog: null,
    ambient: { sky: '#ffe8c8', ground: '#7a5a3a', intensity: 1.2 },
    key: { color: '#ffd9a8', intensity: 1.5, position: V(-2, 5, 5) },
  };
}

function clinic(b: SB, cast: CastSpec[], player: FigureLook): Cfg {
  const acc = b.p(1);
  b.floor(14, 10, '#d7dde0', 0, -0.5);
  b.box(14, 4, 0.2, '#e8f1f1', 0, 2, -3.6);
  b.box(0.2, 4, 10, '#e2eded', -5, 2, -0.5);
  b.box(0.2, 4, 10, '#e2eded', 5, 2, -0.5);
  b.box(14, 0.9, 0.22, m(acc, { rough: 0.7 }), 0, 0.45, -3.58);
  // reception
  b.box(2.8, 1.05, 0.6, '#f2f4f5', 1.6, 0.525, -2.0);
  b.box(3.0, 0.05, 0.85, '#c9a97a', 1.6, 1.07, -2.0);
  b.box(2.8, 0.1, 0.02, m(acc, { emissive: acc, ei: 0.7 }), 1.6, 0.9, -1.69);
  b.monitor(0.8, 1.095, -2.1, 0.0, codeTex(b, 'doc', acc, 4), 0.4, 0.25);
  b.cyl(0.05, 0.14, '#2f7f86', 2.4, 1.16, -2.0, b.g, 10);
  b.panel(1.8, 0.4, textTex(b, 360, 80, '#f2f4f5', [{ t: 'RECEPTION', size: 52, color: '#1f6f78', y: 42 }]), 1.9, 2.5, -3.47);
  // cross sign
  b.box(0.5, 0.14, 0.05, '#c9473e', 0.2, 3.1, -3.47);
  b.box(0.14, 0.5, 0.05, '#c9473e', 0.2, 3.1, -3.47);
  // chairs row facing +x
  for (let i = 0; i < 4; i++) {
    b.box(0.5, 0.06, 0.48, '#9fb5c4', -1.1, 0.43, -0.2 + i * 0.8 - 0.0);
    b.box(0.05, 0.4, 0.48, '#9fb5c4', -1.36, 0.66, -0.2 + i * 0.8);
    b.box(0.04, 0.4, 0.04, '#3a3d46', -1.0, 0.2, -0.2 + i * 0.8);
  }
  b.box(0.6, 0.04, 0.6, '#8a6a4a', -0.4, 0.4, 0.9);
  b.box(0.2, 0.02, 0.28, '#e0a23f', -0.4, 0.43, 0.9, 0.3);
  // exam alcove (back left)
  b.box(0.1, 2.6, 2.4, '#dbe6e6', -3.4, 1.3, -2.3);
  b.box(2.0, 0.55, 0.9, '#2f4a5a', -4.2, 0.5, -2.4);
  b.box(2.0, 0.08, 0.9, '#eef2f2', -4.2, 0.82, -2.4);
  b.box(0.5, 0.3, 0.9, '#eef2f2', -4.9, 0.98, -2.4).rotation.z = 0.5;
  const curtain = b.canvasTex(128, 64, (g, w, h) => { g.fillStyle = acc; g.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 12) { g.fillStyle = 'rgba(0,0,0,0.15)'; g.fillRect(x, 0, 5, h); } });
  b.plane(2.2, 2.2, b.lit(curtain, 0.9), -2.4, 1.3, -1.1);
  b.box(2.2, 0.06, 0.06, '#9aa0a8', -2.4, 2.45, -1.1);
  b.box(0.5, 0.8, 0.4, '#d6dcdf', -3.1, 1.6, -3.3);
  // wall chart
  b.panel(0.9, 1.2, textTex(b, 180, 240, '#fbfbfa', [{ t: 'WASH HANDS', size: 22, color: '#1f6f78', y: 40 }, { t: '20 seconds', size: 18, color: '#555', y: 80, font: 'normal' }, { t: '+', size: 90, color: '#c9473e', y: 160 }], '#1f6f78'), 3.9, 2.2, -3.48);
  b.plant(-4.5, -0.3, 1.4);
  b.plant(4.4, -2.9, 1.2);
  b.window(1.3, 1.2, skylineTex(b, 256, 256, 'day', 3, '#fff', true), -0.6, 2.4, -3.46);

  const slots: Slot[] = [
    SL('player', -0.7, -0.2, 1.2, -0.5, 'sit', { seat: 0.43, look: [0.3, 1.65, -1.5] }),
    SL('doctor', 0.45, -1.5, -0.7, -0.2, 'talk', { look: [-0.7, 1.3, -0.2] }),
    SL('nurse', 1.25, -2.8, 0.7, 0.5, 'talk', { look: [-0.5, 1.6, 0.5] }),
    SL('stranger', 2.9, 0.2, 1.0, 0.2, 'phone', { seat: 0.43, lite: true }),
  ];
  b.populate(slots, cast, player);
  return {
    camera: aim(V(0.2, 2.6, 6.2), V(-0.05, 1.2, -1.3), 46),
    background: '#dbe6e6',
    fog: null,
    ambient: { sky: '#f4fbff', ground: '#9aa8aa', intensity: 1.7 },
    key: { color: '#fff8ee', intensity: 1.6, position: V(2, 6, 5) },
  };
}

function conference(b: SB, cast: CastSpec[], player: FigureLook): Cfg {
  const acc = b.p(3);
  const presenting = cast.some((c) => c.role === 'player' && c.pose === 'present');
  const carpet = b.canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#2b3a55'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#34466a';
    for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) if ((i + j) % 2 === 0) g.fillRect(i * 22, j * 22, 22, 22);
  });
  carpet.wrapS = carpet.wrapT = THREE.RepeatWrapping;
  carpet.repeat.set(10, 7);
  b.floor(24, 16, b.lit(carpet, 0.95), 0, -1.5);
  b.box(24, 6, 0.3, '#161c2c', 0, 3, -5.6);
  b.box(0.3, 6, 16, '#161c2c', -8, 3, -2);
  b.box(0.3, 6, 16, '#161c2c', 8, 3, -2);
  // stage
  b.box(8, 0.45, 2.4, '#222a3c', 0, 0.225, -4.2);
  b.box(8, 0.03, 0.08, m(acc, { emissive: acc, ei: 0.8 }), 0, 0.46, -3.0);
  const slide = b.canvasTex(1024, 512, (g, w, h) => {
    skyGrad(g, w, h, [[0, '#14213d'], [1, '#274c77']]);
    g.fillStyle = '#ffffff'; g.font = 'bold 76px "Helvetica Neue", Arial'; g.textAlign = 'left'; g.textBaseline = 'middle';
    g.fillText('FRONTIER SYSTEMS', 60, 120);
    g.fillStyle = acc; g.font = 'bold 44px "Helvetica Neue", Arial'; g.fillText('Annual Research Conference', 60, 200);
    g.fillStyle = 'rgba(255,255,255,0.25)';
    for (let i = 0; i < 6; i++) { const bh = 60 + i * 28; g.fillRect(80 + i * 70, 470 - bh, 50, bh); }
    g.fillStyle = acc; g.fillRect(560, 300, 380, 8); g.fillRect(560, 340, 300, 8); g.fillRect(560, 380, 340, 8);
  });
  b.box(5.2, 2.6, 0.12, '#05070c', 0, 2.6, -5.35);
  b.panel(5.0, 2.45, slide, 0, 2.6, -5.27);
  b.box(0.8, 1.05, 0.55, '#2a3248', 0.0, 0.97, -3.95);
  b.box(0.85, 0.05, 0.6, '#c9a97a', 0.0, 1.5, -3.95);
  b.cyl(0.015, 0.4, '#222', 0.0, 1.72, -4.05, b.g, 6);
  // posters
  const poster = (x: number, z: number, seed: number, ry = 0): void => {
    const tx = b.canvasTex(240, 320, (g, w, h) => {
      const r = rng(seed);
      g.fillStyle = '#fbfaf6'; g.fillRect(0, 0, w, h);
      g.fillStyle = acc; g.fillRect(0, 0, w, 56);
      g.fillStyle = '#fff'; g.font = 'bold 20px Arial'; g.textAlign = 'center'; g.fillText('A STUDY OF SYSTEMS', w / 2, 34);
      g.fillStyle = '#c4ccd8';
      for (let y = 76; y < 150; y += 12) g.fillRect(14, y, 90 + r() * 30, 6);
      g.fillStyle = '#2f5d8a'; g.fillRect(130, 76, 96, 72);
      g.fillStyle = '#c0392b'; g.beginPath(); g.moveTo(134, 140); g.lineTo(180, 100); g.lineTo(222, 120); g.stroke();
      g.fillStyle = '#e6ebf2'; g.fillRect(14, 170, w - 28, 130);
      g.fillStyle = '#2f7f86'; for (let i = 0; i < 5; i++) g.fillRect(24 + i * 40, 290 - 20 - r() * 80, 26, 20 + r() * 80);
    });
    const g = b.grp(x, 0, z, ry);
    b.box(1.25, 1.7, 0.05, '#e8e8e8', 0, 1.55, 0, 0, g);
    b.panel(1.15, 1.55, tx, 0, 1.55, 0.03, 0, g);
    b.box(0.05, 0.8, 0.05, '#aaa', -0.5, 0.4, -0.1, 0, g);
    b.box(0.05, 0.8, 0.05, '#aaa', 0.5, 0.4, -0.1, 0, g);
  };
  if (!presenting) {
    poster(-0.2, -1.9, 1);
    poster(1.7, -1.9, 2);
  }
  poster(-2.3, -1.9, 3);
  poster(3.6, -1.9, 4);
  poster(-3.5, -3.0, 5, 0.3);
  // banner stands
  for (const x of [-5.5, 5.5]) {
    b.box(0.9, 2.2, 0.05, m(acc, { rough: 0.7 }), x, 1.1, -3.0);
    b.panel(0.8, 1.0, textTex(b, 160, 200, null, [{ t: 'FRONTIER', size: 30, color: '#fff', y: 60 }, { t: '2026', size: 30, color: '#fff', y: 110 }]), x, 1.4, -2.97);
  }
  // round tables with cups
  b.cyl(0.4, 0.04, '#e8e4dc', 4.0, 1.0, -0.4, b.g, 16); b.cyl(0.05, 1.0, '#555', 4.0, 0.5, -0.4, b.g, 8);
  b.cyl(0.4, 0.04, '#e8e4dc', -4.2, 1.0, -0.5, b.g, 16); b.cyl(0.05, 1.0, '#555', -4.2, 0.5, -0.5, b.g, 8);

  const slots: Slot[] = [
    SL('player', -1.1, -0.9, 0.5, -0.6, 'talk', { alt: { x: 0.0, z: -3.45, y: 0.45, fx: 0.4, fz: 3 }, look: [0.2, 1.65, -0.9] }),
    SL('stranger', presenting ? -2.0 : 0.25, presenting ? -0.6 : -0.9, presenting ? 0 : -1.0, presenting ? -3.5 : -0.8, 'talk', { look: [-1.1, 1.65, -0.9] }),
    SL('stranger', 2.7, -0.7, 1.6, -0.9, 'talk'),
    SL('stranger', 1.6, -0.7, 2.7, -0.9, 'idle', { lite: true }),
    SL('stranger', -3.4, -0.2, -4.2, -0.5, 'talk', { lite: true }),
    SL('stranger', -4.4, -0.7, -3.4, -0.2, 'idle', { lite: true }),
    SL('stranger', 4.3, -0.4, 3.6, 0.5, 'talk', { lite: true }),
  ];
  b.populate(slots, cast, player);
  b.walker(crowdLook(61), -3.0, 1.6, 3.0, 1.6, 0.8, 0.5);
  b.light('#9ab4ff', 12, 0, 3.5, -1.0, 12);
  return {
    camera: presenting ? aim(V(0.6, 2.4, 5.6), V(0.0, 1.55, -3.45), 44) : aim(V(-0.6, 2.6, 7.4), V(-0.35, 1.25, -0.9), 44),
    background: '#161c2c',
    fog: { color: '#161c2c', near: 12, far: 30 },
    ambient: { sky: '#cfd8f0', ground: '#4a5266', intensity: 1.3 },
    key: { color: '#ffffff', intensity: 1.6, position: V(2, 7, 5) },
  };
}

function festival(b: SB, cast: CastSpec[], player: FigureLook): Cfg {
  const grass = b.canvasTex(64, 64, (g, w, h) => { g.fillStyle = '#2d4a36'; g.fillRect(0, 0, w, h); for (let i = 0; i < 200; i++) { g.fillStyle = Math.random() < 0.5 ? '#35573f' : '#264030'; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); } });
  grass.wrapS = grass.wrapT = THREE.RepeatWrapping;
  grass.repeat.set(14, 10);
  b.floor(40, 28, b.lit(grass, 1), 0, -3);
  b.panel(60, 14, skylineTex(b, 1024, 256, 'night', 77, b.p(0), true), 0, 7, -16);
  for (const x of [-9, -5.5, 6, 9.5]) b.tree(x, -9, 2.2, '#1f3d2c', '#3a2a20');
  // rangoli
  const rang = b.canvasTex(512, 512, (g, w, h) => {
    const cx = w / 2, cy = h / 2;
    g.fillStyle = 'rgba(0,0,0,0)'; g.clearRect(0, 0, w, h);
    const cols = [b.p(0), b.p(1), b.p(2), b.p(3), '#ffd24a', '#ff6fa5', '#fff4e0', '#7be0a0'];
    const ring = (r: number, c: string): void => { g.fillStyle = c; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill(); };
    ring(250, '#fff4e0'); ring(236, cols[0]); ring(214, '#fff4e0'); ring(204, cols[1]);
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; g.fillStyle = cols[(i + 2) % cols.length]; g.beginPath(); g.ellipse(cx + Math.cos(a) * 160, cy + Math.sin(a) * 160, 36, 16, a, 0, 7); g.fill(); }
    ring(120, '#fff4e0'); ring(110, cols[2]);
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; g.fillStyle = cols[(i * 3) % cols.length]; g.beginPath(); g.ellipse(cx + Math.cos(a) * 66, cy + Math.sin(a) * 66, 34, 14, a, 0, 7); g.fill(); }
    ring(34, '#ffd24a'); ring(18, cols[0]);
    for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; g.fillStyle = '#fff'; g.beginPath(); g.arc(cx + Math.cos(a) * 228, cy + Math.sin(a) * 228, 5, 0, 7); g.fill(); }
  });
  b.plane(3.4, 3.4, new THREE.MeshBasicMaterial({ map: rang, transparent: true, toneMapped: false }), 0, 0.015, -0.4, 0, -Math.PI / 2);
  // stage
  b.box(5.5, 0.6, 2.2, '#2a2438', 0, 0.3, -6.2);
  b.box(5.5, 0.03, 2.2, m(b.p(3), { emissive: b.p(3), ei: 0.8 }), 0, 0.62, -6.2);
  b.panel(4.4, 0.9, textTex(b, 512, 100, '#1a1530', [{ t: 'CAMPUS  FEST', size: 70, color: '#ffd24a', y: 52 }]), 0, 3.0, -7.0);
  for (const [x, c] of [[-1.8, b.p(0)], [0, b.p(1)], [1.8, b.p(2)]] as Array<[number, string]>) {
    const s = b.cone(0.3, 0.7, m(c, { emissive: c, ei: 1.5, opacity: 0.55 }), x, 1.9, -6.0);
    s.rotation.x = 0.5;
  }
  b.box(0.5, 1.1, 0.4, '#15131c', -3.2, 0.55, -6.2);
  b.box(0.5, 1.1, 0.4, '#15131c', 3.2, 0.55, -6.2);
  // stalls
  const stall = (x: number, z: number, col: string, ry: number): void => {
    const g = b.grp(x, 0, z, ry);
    b.box(2.0, 0.95, 0.8, '#6b4a30', 0, 0.475, 0, 0, g);
    b.box(2.1, 0.05, 0.9, '#d9c8a8', 0, 0.97, 0, 0, g);
    for (const sx of [-1, 1]) b.box(0.06, 2.2, 0.06, '#8a8f99', sx * 0.95, 1.1, 0.4, 0, g);
    const awn = b.canvasTex(128, 32, (c, w, h) => { for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#fff4e0' : col; c.fillRect((w / 8) * i, 0, w / 8 + 1, h); } });
    const a = b.plane(2.2, 0.8, b.basic(awn), 0, 2.15, 0.5, 0, -0.4, g);
    void a;
    b.box(2.2, 0.06, 0.9, col, 0, 2.5, 0.1, 0, g);
    for (let i = 0; i < 3; i++) b.cyl(0.14, 0.14, '#9aa0a8', -0.5 + i * 0.5, 1.07, 0.0, g, 12);
    b.sph(0.045, m('#ffe2a0', { emissive: '#ffcf6a', ei: 2 }), 0, 2.4, 0.5, 1, 1, 1, g);
  };
  stall(-3.4, -3.6, b.p(0), 0.25);
  stall(3.4, -3.6, b.p(2), -0.25);
  b.steam(-3.9, 1.2, -3.3, 3, 0.5);
  b.steam(-3.4, 1.2, -3.3, 3, 0.45);
  b.steam(3.0, 1.2, -3.3, 3, 0.5);
  b.light('#ffb066', 18, -3.4, 2.2, -2.8, 9);
  b.light('#ff9aa8', 14, 3.4, 2.2, -2.8, 9);
  b.light('#ffd9a0', 12, 0, 3.2, 1.5, 10);
  // string lights
  const bm = [m('#ffe29a', { emissive: '#ffcf6a', ei: 2.4 }), m('#ff9ac0', { emissive: '#ff6fa5', ei: 2.4 }), m('#9ae0ff', { emissive: '#6ac8ff', ei: 2.4 }), m('#b6ff9a', { emissive: '#7be06a', ei: 2.4 })];
  for (const [z, y0] of [[-1.2, 3.9], [-4.0, 3.6]] as Array<[number, number]>) {
    for (const x of [-4.8, 4.8]) b.cyl(0.04, y0 + 0.4, '#3a3040', x, (y0 + 0.4) / 2, z, b.g, 6);
    for (let i = 0; i < 18; i++) {
      const u = i / 17;
      b.sph(0.05, bm[(i + (z < -2 ? 2 : 0)) % 4], -4.8 + u * 9.6, y0 + 0.3 - Math.sin(u * Math.PI) * 0.55, z);
    }
  }
  b.upd.push((_d, t) => { bm.forEach((mm, i) => { (mm as THREE.MeshStandardMaterial).emissiveIntensity = 2 + Math.sin(t * 2.2 + i * 1.7) * 0.9; }); });
  // crowd facing stage
  const crowd: Array<[number, number, Pose]> = [[-2.2, -3.0, 'cheer'], [-0.9, -3.4, 'idle'], [0.6, -3.1, 'cheer'], [1.9, -3.5, 'wave'], [2.9, -4.5, 'cheer'], [-1.6, -4.9, 'wave']];
  crowd.forEach(([x, z, p], i) => b.person(crowdLook(80 + i), x, z, ryTo(x, z, 0, -6.2) + (i % 2 ? 0.2 : -0.2), p, { lite: true }));
  const slots: Slot[] = [
    SL('player', -0.55, 1.2, 0.2, 5, 'cheer', { look: [0.6, 1.7, 3.5] }),
    SL('friend', 0.65, 1.1, -0.1, 5, 'wave', { look: [-0.5, 1.7, 3.5] }),
    SL('friend', 0.05, 2.4, 0.0, 5, 'talk', { look: [-0.5, 1.7, 3.5] }),
  ];
  b.populate(slots, cast, player);
  return {
    camera: aim(V(0.0, 2.7, 8.6), V(0.0, 1.2, 0.6), 44),
    background: '#0a1024',
    fog: { color: '#0a1024', near: 14, far: 34 },
    ambient: { sky: '#7f8cc0', ground: '#3a3a4a', intensity: 0.95 },
    key: { color: '#ffd9b0', intensity: 0.9, position: V(2, 6, 6) },
  };
}

function park(b: SB, cast: CastSpec[], player: FigureLook): Cfg {
  const grass = b.canvasTex(64, 64, (g, w, h) => { g.fillStyle = '#5fa05a'; g.fillRect(0, 0, w, h); for (let i = 0; i < 250; i++) { g.fillStyle = Math.random() < 0.5 ? '#6bb064' : '#54944f'; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); } });
  grass.wrapS = grass.wrapT = THREE.RepeatWrapping;
  grass.repeat.set(16, 12);
  b.floor(60, 40, b.lit(grass, 1), 0, -8);
  b.panel(80, 16, skylineTex(b, 1024, 200, 'day', 91, '#fff'), 0, 8.2, -22);
  // path
  b.plane(30, 1.8, m('#d9c9a3', { rough: 1 }), 0, 0.01, 1.2, 0, -Math.PI / 2);
  b.plane(1.8, 10, m('#d9c9a3', { rough: 1 }), 3.5, 0.011, -3.2, 0, -Math.PI / 2);
  // lake
  b.cyl(7.2, 0.1, '#8d8a80', -2.5, 0.03, -8.5, b.g, 40).scale.z = 2.7;
  b.cyl(6.9, 0.1, m('#4a98c8', { rough: 0.15, metal: 0.1 }), -2.5, 0.05, -8.5, b.g, 40).scale.z = 2.5;
  // fountain
  b.cyl(1.2, 0.35, '#a7a69e', 3.8, 0.17, -5.2, b.g, 24);
  b.cyl(1.05, 0.02, '#58a8d8', 3.8, 0.36, -5.2, b.g, 24);
  b.cyl(0.14, 1.1, '#b5b4ab', 3.8, 0.85, -5.2, b.g, 10);
  b.cyl(0.5, 0.1, '#b5b4ab', 3.8, 1.3, -5.2, b.g, 16);
  const jets: THREE.Mesh[] = [];
  for (let i = 0; i < 3; i++) jets.push(b.cone(0.12, 0.7, m('#d8f0ff', { opacity: 0.55, emissive: '#bfe6ff', ei: 0.3 }), 3.8, 1.7, -5.2));
  b.upd.push((_d, t) => jets.forEach((j, i) => { const s = 0.8 + Math.sin(t * 2 + i * 2) * 0.15; j.scale.set(0.12 * (1 + i * 0.4), 0.7 * s * (1 + i * 0.3), 0.12 * (1 + i * 0.4)); j.position.y = 1.4 + 0.35 * s * (1 + i * 0.3); }));
  // trees
  const tp: Array<[number, number, number]> = [[-4.5, -1.8, 1.3], [-2.8, -3.8, 1.5], [4.8, -1.6, 1.4], [2.2, -3.2, 1.2], [-6.2, -4.2, 1.7], [7, -4, 1.6], [-1.2, -5.5, 1.3], [6.5, 1.0, 1.5], [-6.5, 0.5, 1.4]];
  tp.forEach(([x, z, s]) => b.tree(x, z, s));
  // bench
  b.box(1.6, 0.05, 0.5, '#8a5a30', 0, 0.42, -0.35);
  b.box(1.6, 0.4, 0.05, '#8a5a30', 0, 0.68, -0.6).rotation.x = -0.1;
  for (const sx of [-1, 1]) { b.box(0.05, 0.42, 0.5, '#2a2d34', sx * 0.72, 0.21, -0.35); b.box(0.05, 0.3, 0.05, '#2a2d34', sx * 0.72, 0.55, -0.6); }
  // lamp post + flowers
  b.cyl(0.04, 2.6, '#2a2d34', -1.7, 1.3, -0.9, b.g, 8);
  b.sph(0.14, m('#fff4d0', { emissive: '#ffe2a0', ei: 0.6 }), -1.7, 2.7, -0.9);
  for (let i = 0; i < 12; i++) b.sph(0.07, [b.p(0), b.p(2), '#ffd24a', '#ff8ac0'][i % 4], -3.3 + (i % 6) * 0.22, 0.12, -1.4 - Math.floor(i / 6) * 0.25);

  const slots: Slot[] = [
    SL('player', -0.4, -0.5, 0.6, 3, 'talk', { seat: 0.43, look: [0.5, 1.4, 2.5] }),
    SL('partner', 0.42, -0.5, -0.5, 3, 'talk', { seat: 0.43, look: [-0.4, 1.4, 2.5] }),
  ];
  b.populate(slots, cast, player);
  b.walker(crowdLook(95), -5.5, 1.2, 5.5, 1.2, 1.0, 0.2);
  b.walker(crowdLook(96), 5.5, 1.5, -5.5, 1.5, 1.3, 0.7);
  return {
    camera: aim(V(0.5, 2.0, 6.0), V(0.0, 1.15, -0.5), 44),
    background: '#bfe0f5',
    fog: { color: '#cfe6f2', near: 18, far: 50 },
    ambient: { sky: '#e8f4ff', ground: '#6e8a5a', intensity: 1.6 },
    key: { color: '#fff1d0', intensity: 2.0, position: V(-4, 8, 5) },
  };
}

function library(b: SB, cast: CastSpec[], player: FigureLook): Cfg {
  const acc = b.p(2);
  const wood = b.canvasTex(64, 64, (g, w, h) => { g.fillStyle = '#6b4a30'; g.fillRect(0, 0, w, h); for (let i = 0; i < 4; i++) { g.fillStyle = i % 2 ? '#74513a' : '#634428'; g.fillRect(0, i * 16, w, 15); } });
  wood.wrapS = wood.wrapT = THREE.RepeatWrapping;
  wood.repeat.set(8, 6);
  b.floor(16, 12, b.lit(wood, 0.6), 0, -0.5);
  b.box(16, 5, 0.2, '#3a2c22', 0, 2.5, -4.2);
  b.box(0.2, 5, 12, '#3a2c22', -6, 2.5, -0.5);
  b.box(0.2, 5, 12, '#3a2c22', 6, 2.5, -0.5);
  const bk1 = booksTex(b, 512, 512, 5, 7);
  const bk2 = booksTex(b, 512, 512, 9, 7);
  for (let i = 0; i < 4; i++) {
    const x = -4.5 + i * 3;
    b.box(2.7, 4.2, 0.45, '#4a3424', x, 2.1, -3.9);
    b.panel(2.55, 4.1, i % 2 ? bk1 : bk2, x, 2.1, -3.66);
  }
  const sky = skylineTex(b, 256, 256, 'dusk', 14, '#ffd9a0', true);
  b.window(1.6, 2.2, sky, 5.88, 2.3, -1.5, -Math.PI / 2);
  b.window(1.6, 2.2, sky, 5.88, 2.3, 1.2, -Math.PI / 2);
  // long table
  b.box(4.6, 0.06, 0.9, '#a9784a', 0, 0.75, -1.25);
  for (const sx of [-1, 1]) b.box(0.08, 0.72, 0.8, '#6b4a30', sx * 2.1, 0.36, -1.25);
  b.laptop(-0.7, 0.78, -1.3, Math.PI, codeTex(b, 'doc', acc, 3));
  b.laptop(0.7, 0.78, -1.3, Math.PI, codeTex(b, 'web', acc, 4));
  b.laptop(2.0, 0.78, -1.0, 0.3, codeTex(b, 'code', acc, 5));
  for (let i = 0; i < 3; i++) b.box(0.32, 0.05, 0.24, ['#a63d3d', '#2f5d8a', '#3f7f5a'][i], -0.1 + i * 0.01, 0.805 + i * 0.05, -1.05, i * 0.15);
  b.box(0.3, 0.04, 0.22, '#d6d0c2', 1.4, 0.8, -1.0, 0.2);
  b.box(0.3, 0.04, 0.22, '#c99a3a', -1.7, 0.8, -1.05, -0.3);
  b.cyl(0.04, 0.09, '#f4f4f4', 0.2, 0.83, -1.35, b.g, 10);
  // banker lamps
  for (const x of [-1.5, 1.6]) {
    b.cyl(0.07, 0.03, '#2a5a3a', x, 0.79, -1.5, b.g, 10);
    b.cyl(0.015, 0.3, '#c9a24a', x, 0.94, -1.5, b.g, 6);
    const sh = b.cyl(0.12, 0.08, m('#2f8a52', { emissive: '#ffd27a', ei: 0.9 }), x, 1.12, -1.5, b.g, 14);
    sh.scale.x = 0.14;
    b.light('#ffd27a', 5, x, 1.2, -1.2, 4);
  }
  for (const x of [-1.2, 1.2]) {
    b.cyl(0.006, 1.3, '#222', x, 3.6, -0.9, b.g, 4);
    b.sph(0.2, m('#fff4d0', { emissive: '#ffd9a0', ei: 1.6 }), x, 2.9, -0.9);
  }
  b.light('#ffd9a0', 14, 0, 2.7, -0.6, 10);
  // near chairs (empty)
  b.chair(-1.0, 0.7, Math.PI + 0.3, '#5a3b2a');
  b.chair(1.1, 0.4, Math.PI - 0.4, '#5a3b2a');
  b.plant(-5.2, -2.6, 1.6);
  b.plant(5.1, -3.0, 1.4);
  const slots: Slot[] = [
    SL('player', -0.7, -2.0, 0.3, 3, 'type', { seat: 'chair', look: [0.3, 1.6, 3] }),
    SL('friend', 0.7, -2.0, -0.3, 3, 'talk', { seat: 'chair', look: [-0.7, 1.55, 3] }),
    SL('student', 2.2, -2.0, 2.2, 3, 'sit', { seat: 'chair', lite: true }),
    SL('student', -2.3, -2.0, -2.3, 3, 'think', { seat: 'chair', lite: true }),
  ];
  b.populate(slots, cast, player, '#5a3b2a');
  return {
    camera: aim(V(0.2, 2.6, 6.2), V(0.0, 1.3, -1.8), 44),
    background: '#2a2018',
    fog: null,
    ambient: { sky: '#ffe9c8', ground: '#7a5a3a', intensity: 1.15 },
    key: { color: '#ffdcae', intensity: 1.3, position: V(-2, 6, 5) },
  };
}

function careerfair(b: SB, cast: CastSpec[], player: FigureLook): Cfg {
  const gym = b.canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#c99a62'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#d1a46c' : '#c09058'; g.fillRect(0, i * 32, w, 31); }
    g.strokeStyle = '#f4f1e8'; g.lineWidth = 5; g.strokeRect(10, 10, w - 20, h - 20);
  });
  gym.wrapS = gym.wrapT = THREE.RepeatWrapping;
  gym.repeat.set(7, 6);
  b.floor(24, 18, b.lit(gym, 0.45), 0, -1.5);
  b.box(24, 7, 0.3, '#d9d6cc', 0, 3.5, -6.5);
  b.box(0.3, 7, 18, '#d9d6cc', -9, 3.5, -2.5);
  b.box(0.3, 7, 18, '#d9d6cc', 9, 3.5, -2.5);
  b.box(24, 0.1, 0.1, '#7a6a5a', 0, 2.2, -6.3);
  b.box(2.2, 1.4, 0.05, '#f4f1e8', 5.5, 4.8, -6.3);
  b.box(0.7, 0.05, 0.6, '#e06a2f', 5.5, 4.1, -6.0);
  // hanging banner
  b.panel(7.5, 0.85, textTex(b, 1024, 120, '#1c2a4a', [{ t: 'CAREER FAIR  •  HIRING NOW', size: 70, color: '#ffd24a', y: 62 }]), 0, 4.6, -6.3);
  const booth = (x: number, z: number, name: string, tag: string, col: string, w = 2.6): void => {
    const bn = textTex(b, 512, 400, col, [{ t: name, size: 82, color: '#ffffff', y: 150 }, { t: tag, size: 34, color: '#ffffffcc', y: 235, font: 'normal' }, { t: '— we are hiring —', size: 26, color: '#ffffff99', y: 330, font: 'normal' }]);
    b.box(w, 2.5, 0.08, '#e8e8e8', x, 1.25, z - 0.95);
    b.panel(w - 0.1, 2.3, bn, x, 1.28, z - 0.9);
    b.box(w, 0.85, 0.7, col, x, 0.425, z);
    b.box(w + 0.08, 0.05, 0.78, '#f4f4f4', x, 0.87, z);
    b.box(0.7, 0.14, 0.01, '#ffffff', x + w / 4, 0.65, z + 0.36);
    for (let i = 0; i < 3; i++) b.box(0.18, 0.04 + i * 0.01, 0.26, ['#fff', '#ffd24a', '#cfe8ff'][i], x - w / 2 + 0.4 + i * 0.25, 0.9 + i * 0.01, z + 0.1, i * 0.1);
    b.sph(0.09, '#c9473e', x + w / 2 - 0.4, 0.95, z + 0.1);
  };
  booth(0.6, -2.0, 'NORTHWIND', 'Systems & Cloud', '#1d5c8a');
  booth(-3.6, -2.6, 'BLUEFERN', 'Health Technology', '#2f7f86', 2.4);
  booth(4.9, -2.6, 'TALLMAST', 'Finance & Data', '#8a2f4b', 2.4);
  b.laptop(1.2, 0.9, -1.95, Math.PI, codeTex(b, 'web', b.p(0), 1));
  // pull-up banners
  for (const [x, z, c] of [[-1.5, -1.2, '#e06a2f'], [2.9, -1.4, '#2f7f86']] as Array<[number, number, string]>) {
    b.box(0.7, 1.9, 0.04, c, x, 1.05, z);
    b.box(0.5, 0.1, 0.1, '#2a2d34', x, 0.05, z);
    b.panel(0.55, 0.9, textTex(b, 110, 180, null, [{ t: 'JOIN', size: 28, color: '#fff', y: 60 }, { t: 'US', size: 28, color: '#fff', y: 100 }]), x, 1.4, z + 0.03);
  }
  // balloons
  const bcols = [b.p(0), b.p(1), b.p(2), b.p(3), '#ffd24a', '#ff8ac0'];
  const balloons: Array<{ me: THREE.Mesh; y: number; o: number }> = [];
  for (let i = 0; i < 9; i++) {
    const x = [-1.9, -2.1, -1.7, 2.6, 2.8, 2.45, -5.8, 6.6, 6.4][i], z = [-1.6, -1.8, -1.9, -2.4, -2.2, -2.5, -3.0, -3.6, -3.4][i];
    const y = 2.4 + (i % 3) * 0.35;
    b.cyl(0.004, y, '#dddddd', x, y / 2, z, b.g, 3);
    const me = b.sph(0.2, m(bcols[i % 6], { rough: 0.3 }), x, y + 0.2, z, 1, 1.2, 1);
    balloons.push({ me, y: y + 0.2, o: i });
  }
  b.upd.push((_d, t) => balloons.forEach((bl) => { bl.me.position.y = bl.y + Math.sin(t * 1.2 + bl.o) * 0.05; }));
  b.light('#fff0d6', 12, 0.0, 3.8, -0.5, 14);
  const slots: Slot[] = [
    SL('player', -0.75, -1.1, 0.55, -2.0, 'talk', { look: [0.9, 1.65, -2.65] }),
    SL('recruiter', 1.0, -2.65, -0.4, 0.5, 'talk', { look: [-0.75, 1.65, -1.1] }),
    SL('recruiter', -3.6, -3.1, -3.6, 3, 'idle', { lite: true }),
    SL('recruiter', 4.9, -3.1, 4.9, 3, 'idle', { lite: true }),
    SL('student', -2.5, -1.4, -3.4, -2.5, 'idle', { lite: true }),
    SL('student', -3.3, -1.1, -3.4, -2.5, 'phone', { lite: true }),
    SL('student', 3.8, -1.4, 4.7, -2.5, 'idle', { lite: true }),
    SL('student', 4.6, -1.0, 4.7, -2.5, 'talk', { lite: true }),
  ];
  b.populate(slots, cast, player);
  b.walker(crowdLook(71), -7.0, 1.4, -2.8, 1.4, 0.8, 0.4);
  b.walker(crowdLook(72), 7.0, 1.0, 2.8, 1.0, 0.7, 0.2);
  return {
    camera: aim(V(-0.4, 2.7, 7.9), V(0.1, 1.25, -1.9), 44),
    background: '#cfd2d8',
    fog: { color: '#cfd2d8', near: 16, far: 34 },
    ambient: { sky: '#fff6e4', ground: '#8a7a62', intensity: 1.55 },
    key: { color: '#fff0d6', intensity: 1.7, position: V(3, 7, 5) },
  };
}

function street(b: SB, cast: CastSpec[], player: FigureLook): Cfg {
  const acc = b.p(0);
  const sidewalk = b.canvasTex(64, 64, (g, w, h) => { g.fillStyle = '#b8b4ac'; g.fillRect(0, 0, w, h); g.strokeStyle = '#9d998f'; g.lineWidth = 2; g.strokeRect(0, 0, w, h); });
  sidewalk.wrapS = sidewalk.wrapT = THREE.RepeatWrapping;
  sidewalk.repeat.set(24, 6);
  b.plane(30, 4.0, b.lit(sidewalk, 0.95), 0, 0.0, -1.9, 0, -Math.PI / 2);
  b.plane(60, 14, m('#34373d', { rough: 0.95 }), 0, -0.005, 7.1, 0, -Math.PI / 2);
  b.box(30, 0.15, 0.2, '#9d998f', 0, 0.075, 0.1);
  for (let i = -8; i <= 8; i += 2) b.box(0.9, 0.006, 0.12, '#f1d96a', i * 1.7, 0.01, 4.5);
  for (let i = 0; i < 7; i++) b.box(0.45, 0.007, 3.6, '#f4f4f4', -3.2 + i * 0.75, 0.012, 1.9);
  // facade
  const fac = b.canvasTex(2048, 640, (g, w, h) => {
    const r = rng(12);
    skyGrad(g, w, h, [[0, '#4a4f5c'], [1, '#6a5a5a']]);
    for (let y = 20; y < 330; y += 60) for (let x = 24; x < w; x += 78) { g.fillStyle = r() < 0.5 ? '#ffd9a0' : '#2c3140'; g.fillRect(x, y, 44, 38); }
    const shops: Array<[string, string, string]> = [['BAKERY', '#d9824a', '#fff1d0'], ['PHARMACY', '#2f8a6a', '#e8fff4'], ['NOODLE BAR', '#c9473e', '#ffe9c8'], ['BOOKS', '#3d5a99', '#e0e8ff'], ['LAUNDRY', '#7a5cb0', '#efe6ff'], ['CAFE', '#b8863a', '#fff4d6']];
    shops.forEach((s, i) => {
      const x = i * 340 + 10;
      g.fillStyle = '#23262e'; g.fillRect(x, 360, 320, 280);
      g.fillStyle = s[2]; g.fillRect(x + 14, 420, 292, 180);
      g.fillStyle = 'rgba(255,214,150,0.5)'; g.fillRect(x + 14, 420, 292, 180);
      g.fillStyle = s[1]; g.fillRect(x, 340, 320, 70);
      g.fillStyle = '#fff'; g.font = 'bold 42px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s[0], x + 160, 376);
      g.fillStyle = '#23262e'; g.fillRect(x + 125, 480, 70, 160);
    });
  });
  b.panel(34, 10.6, fac, 0, 5.3, -4.05);
  // awnings
  for (let i = 0; i < 6; i++) { const aw = b.box(2.6, 0.08, 0.7, [acc, b.p(1), b.p(2), b.p(3)][i % 4], -7.3 + i * 2.78, 2.35, -3.7); aw.rotation.x = 0.25; }
  // bus shelter
  const sx = -0.9;
  b.box(2.2, 0.08, 1.1, '#2f4a5a', sx, 2.4, -1.4);
  b.box(2.1, 1.9, 0.03, m('#bfe3ff', { opacity: 0.22, rough: 0.1 }), sx, 1.4, -1.9);
  b.box(0.05, 2.4, 0.05, '#2f4a5a', sx - 1.05, 1.2, -1.9);
  b.box(0.05, 2.4, 0.05, '#2f4a5a', sx + 1.05, 1.2, -1.9);
  b.box(0.05, 2.4, 0.05, '#2f4a5a', sx - 1.05, 1.2, -0.9);
  b.box(0.05, 2.4, 0.05, '#2f4a5a', sx + 1.05, 1.2, -0.9);
  b.box(1.5, 0.05, 0.4, '#8a8f99', sx, 0.46, -1.7);
  const ad = textTex(b, 160, 220, '#1d3f8a', [{ t: 'SEE THE', size: 30, color: '#fff', y: 60 }, { t: 'CITY', size: 44, color: '#ffd24a', y: 120 }, { t: 'Route 12', size: 26, color: '#fff', y: 190, font: 'normal' }]);
  b.panel(0.7, 1.0, ad, sx + 0.55, 1.4, -1.86);
  // bus stop sign
  b.cyl(0.03, 2.8, '#6a707a', 1.1, 1.4, -0.5, b.g, 8);
  b.panel(0.5, 0.7, textTex(b, 100, 140, '#1d3f8a', [{ t: 'BUS', size: 28, color: '#fff', y: 40 }, { t: 'STOP', size: 28, color: '#fff', y: 74 }, { t: '12', size: 40, color: '#ffd24a', y: 116 }]), 1.1, 2.45, -0.46);
  // street lamp
  b.cyl(0.04, 4.2, '#2a2d34', 2.8, 2.1, -0.4, b.g, 8);
  b.box(0.5, 0.06, 0.2, '#2a2d34', 2.55, 4.2, -0.4);
  b.sph(0.12, m('#fff1c0', { emissive: '#ffd27a', ei: 2.2 }), 2.35, 4.12, -0.4);
  b.light('#ffd9a0', 22, 2.4, 3.9, 0.2, 9);
  // trees
  b.tree(-4.2, -0.2, 1.1, '#3f7f4a');
  b.tree(5.2, -0.3, 1.0, '#4a8a4a');
  // car
  const car = b.grp(3.6, 0, 2.7, 0);
  b.box(2.3, 0.5, 1.0, '#c9473e', 0, 0.45, 0, 0, car);
  b.box(1.3, 0.4, 0.9, '#c9473e', -0.1, 0.9, 0, 0, car);
  b.box(1.2, 0.3, 0.92, m('#9fd0ee', { opacity: 0.6, rough: 0.1 }), -0.1, 0.92, 0, 0, car);
  for (const [wx, wz] of [[-0.75, 0.5], [0.75, 0.5], [-0.75, -0.5], [0.75, -0.5]]) { const wh = b.cyl(0.24, 0.16, '#18181c', wx, 0.24, wz, car, 14); wh.rotation.x = Math.PI / 2; }
  b.box(0.06, 0.12, 0.2, m('#fff3b0', { emissive: '#fff3b0', ei: 1.5 }), 1.16, 0.5, 0.3, 0, car);
  b.box(0.06, 0.12, 0.2, m('#fff3b0', { emissive: '#fff3b0', ei: 1.5 }), 1.16, 0.5, -0.3, 0, car);

  const slots: Slot[] = [
    SL('player', -0.2, -0.9, 1.2, -0.4, 'phone', { look: [1.0, 1.6, -0.5] }),
    SL('friend', 0.95, -0.7, -0.2, -0.9, 'talk', { look: [-0.2, 1.6, -0.9] }),
    SL('stranger', -1.6, -1.55, 0.0, 3.0, 'idle', { seat: 0.46, lite: true }),
  ];
  b.populate(slots, cast, player);
  b.walker(crowdLook(33), -6, -2.7, 6, -2.7, 0.9, 0.5);
  b.walker(crowdLook(34), 6.5, -3.1, -6.5, -3.1, 1.1, 0.2);
  return {
    camera: aim(V(0.3, 2.1, 7.6), V(0.35, 1.2, -0.8), 46),
    background: '#e48a6a',
    fog: { color: '#d9906e', near: 16, far: 40 },
    ambient: { sky: '#ffd9bd', ground: '#6a5a5a', intensity: 1.35 },
    key: { color: '#ffb87a', intensity: 1.7, position: V(-5, 5, 5) },
  };
}

function bank(b: SB, cast: CastSpec[], player: FigureLook): Cfg {
  const acc = b.p(3);
  const marble = b.canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#e5e0d6'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#c8c0b2'; g.fillRect(0, 0, w / 2, h / 2); g.fillRect(w / 2, h / 2, w / 2, h / 2);
  });
  marble.wrapS = marble.wrapT = THREE.RepeatWrapping;
  marble.repeat.set(10, 8);
  b.floor(16, 12, b.lit(marble, 0.3), 0, -0.5);
  b.box(16, 4.5, 0.2, '#e8e0cf', 0, 2.25, -3.6);
  b.box(0.2, 4.5, 12, '#e2dac8', -5, 2.25, -0.5);
  b.box(0.2, 4.5, 12, '#e2dac8', 5, 2.25, -0.5);
  b.box(16, 0.9, 0.24, '#5a4634', 0, 0.45, -3.58);
  b.panel(3.2, 0.7, textTex(b, 512, 112, '#14284a', [{ t: 'HARBOR TRUST', size: 66, color: '#e9c46a', y: 58 }], '#e9c46a'), 0.2, 3.2, -3.47);
  // vault door
  b.cyl(0.9, 0.25, m('#8a8f99', { metal: 0.6, rough: 0.35 }), 3.4, 1.4, -3.4, b.g, 28).rotation.x = Math.PI / 2;
  b.cyl(0.6, 0.27, '#6d727c', 3.4, 1.4, -3.38, b.g, 24).rotation.x = Math.PI / 2;
  b.ring(0.25, 0.04, '#d6b25a', 3.4, 1.4, -3.2);
  // teller line
  b.box(5.2, 1.1, 0.7, '#5a4634', 0.4, 0.55, -1.5);
  b.box(5.3, 0.06, 0.8, '#d9d0bc', 0.4, 1.13, -1.5);
  b.box(5.2, 0.12, 0.02, m(acc, { emissive: acc, ei: 0.5 }), 0.4, 0.92, -1.14);
  const glass = m('#bfe3ff', { opacity: 0.16, rough: 0.1 });
  b.box(5.2, 0.9, 0.02, glass, 0.4, 1.65, -1.5);
  b.box(5.2, 0.05, 0.05, '#8a6a3a', 0.4, 2.12, -1.5);
  for (const x of [-2.2, -0.9, 0.4, 1.7, 3.0]) b.box(0.06, 1.0, 0.06, '#8a6a3a', x, 1.6, -1.5);
  b.box(0.6, 0.02, 0.3, '#a67c3a', -0.3, 1.17, -1.5);
  b.box(0.6, 0.02, 0.3, '#a67c3a', 1.3, 1.17, -1.5);
  b.monitor(1.0, 1.16, -1.95, 0.0, codeTex(b, 'doc', acc, 4), 0.4, 0.25);
  b.box(0.2, 0.012, 0.28, '#fafafa', 0.1, 1.17, -1.35, 0.2);
  b.cyl(0.04, 0.1, '#8a6a3a', -0.9, 1.19, -1.35, b.g, 8);
  // rope queue
  b.stanchions(-2.4, 0.2, -2.4, 2.6, 4);
  b.stanchions(-1.6, 0.2, -1.6, 2.6, 4);
  // chairs right
  for (let i = 0; i < 3; i++) { b.box(0.5, 0.06, 0.5, '#2f4a6b', 3.6, 0.43, 0.0 + i * 0.7); b.box(0.05, 0.42, 0.5, '#2f4a6b', 3.85, 0.66, 0.0 + i * 0.7); b.box(0.05, 0.4, 0.05, '#2a2d34', 3.5, 0.2, i * 0.7); }
  // brochure rack + atm + plants
  b.box(0.5, 1.2, 0.3, '#8a6a3a', 2.4, 0.6, -0.3);
  for (let i = 0; i < 4; i++) b.box(0.4, 0.2, 0.02, ['#e9c46a', '#2f7f86', '#c9473e', '#fff'][i], 2.4, 0.3 + i * 0.28, -0.13);
  b.box(0.9, 1.9, 0.6, '#2a3a5a', -4.4, 0.95, -2.8);
  b.plane(0.5, 0.35, m('#102a3a', { emissive: '#4aa0ff', ei: 1.1 }), -4.4, 1.5, -2.49);
  b.plant(-3.4, -3.0, 1.7);
  b.plant(4.4, -3.1, 1.6);
  // pendant
  for (const x of [-3.2, 3.6]) { b.cyl(0.006, 1.5, '#222', x, 3.7, -2.0, b.g, 4); b.sph(0.18, m('#fff0d0', { emissive: '#ffd9a0', ei: 1.8 }), x, 2.95, -2.0); }
  b.light('#ffe0b0', 14, 0.4, 3.0, 0.0, 11);
  const slots: Slot[] = [
    SL('player', -0.7, -0.65, 0.8, -1.1, 'talk', { look: [0.75, 1.65, -2.15] }),
    SL('teller', 0.8, -2.15, -0.1, 0.5, 'talk', { look: [-0.7, 1.65, -0.65] }),
    SL('stranger', -2.0, 0.9, -2.0, -1.2, 'idle', { lite: true }),
    SL('stranger', 3.6, 0.0, 2.6, 0.0, 'phone', { seat: 0.43, lite: true }),
    SL('teller', 3.0, -2.15, 3.0, 0.5, 'type', { lite: true }),
  ];
  b.populate(slots, cast, player);
  return {
    camera: aim(V(-0.3, 2.6, 7.4), V(0.05, 1.25, -1.4), 44),
    background: '#d8cfba',
    fog: null,
    ambient: { sky: '#fff1dc', ground: '#8a7a62', intensity: 1.5 },
    key: { color: '#ffe8c8', intensity: 1.6, position: V(2, 6, 5) },
  };
}

function campus(b: SB, cast: CastSpec[], player: FigureLook): Cfg {
  const grass = b.canvasTex(64, 64, (g, w, h) => { g.fillStyle = '#5da259'; g.fillRect(0, 0, w, h); for (let i = 0; i < 250; i++) { g.fillStyle = Math.random() < 0.5 ? '#68b062' : '#529650'; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); } });
  grass.wrapS = grass.wrapT = THREE.RepeatWrapping;
  grass.repeat.set(20, 16);
  b.floor(70, 50, b.lit(grass, 1), 0, -8);
  b.panel(100, 20, skylineTex(b, 1024, 200, 'day', 5, '#fff', true), 0, 10, -30);
  // brick building
  const brick = pbrMaterial('brick_wall_005', { color: '#d8bfb2', repeat: [5, 1.8], roughness: 1 });
  b.box(16, 5.4, 1.2, brick, 0, 2.7, -10.5);
  b.box(16.2, 0.25, 1.4, '#e8e2d4', 0, 5.4, -10.5);
  const win = b.canvasTex(64, 128, (g, w, h) => { g.fillStyle = '#e8e2d4'; g.fillRect(0, 0, w, h); g.fillStyle = '#4a6a8a'; g.fillRect(6, 6, w - 12, h - 12); g.fillStyle = '#e8e2d4'; g.fillRect(w / 2 - 2, 6, 4, h - 12); g.fillRect(6, h / 2 - 2, w - 12, 4); g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(8, 8, 18, h - 16); });
  for (const row of [1.3, 3.6]) for (let i = -6; i <= 6; i++) { if (Math.abs(i) < 2) continue; b.panel(0.75, 1.3, win, i * 1.15, row + 0.5, -9.88); }
  // portico
  b.box(4.6, 0.3, 2.6, '#e8e2d4', 0, 0.15, -9.3);
  for (let i = 0; i < 6; i++) b.cyl(0.22, 4.4, '#efe9db', -2.0 + i * 0.8, 2.5, -8.3, b.g, 16);
  b.box(4.8, 0.5, 2.2, '#e8e2d4', 0, 4.95, -9.2);
  const pedShape = new THREE.Shape();
  pedShape.moveTo(-2.4, 0); pedShape.lineTo(2.4, 0); pedShape.lineTo(0, 1.1); pedShape.closePath();
  const ped = new THREE.ExtrudeGeometry(pedShape, { depth: 2.2, bevelEnabled: false });
  const pm = new THREE.Mesh(ped, stdMat('#e8e2d4'));
  pm.position.set(0, 5.2, -10.3);
  b.g.add(pm);
  b.box(1.4, 2.2, 0.1, '#5a3b28', 0, 1.2, -9.85);
  // clock tower
  b.box(1.8, 3.2, 1.8, brick, 0, 7.2, -10.5);
  b.box(2.1, 0.25, 2.1, '#e8e2d4', 0, 8.9, -10.5);
  b.cone(1.3, 1.6, '#4a6a5a', 0, 9.8, -10.5).scale.z = 1.3;
  const clk = b.canvasTex(128, 128, (g) => { g.fillStyle = '#fbfaf4'; g.beginPath(); g.arc(64, 64, 60, 0, 7); g.fill(); g.strokeStyle = '#222'; g.lineWidth = 5; g.stroke(); for (let i = 0; i < 12; i++) { const a = (i / 12) * 6.283; g.beginPath(); g.moveTo(64 + Math.cos(a) * 50, 64 + Math.sin(a) * 50); g.lineTo(64 + Math.cos(a) * 58, 64 + Math.sin(a) * 58); g.stroke(); } g.lineWidth = 6; g.beginPath(); g.moveTo(64, 64); g.lineTo(64, 24); g.stroke(); g.lineWidth = 4; g.beginPath(); g.moveTo(64, 64); g.lineTo(94, 52); g.stroke(); });
  b.panel(1.2, 1.2, clk, 0, 7.6, -9.58);
  // paths
  b.plane(2.6, 14, m('#cdbfa5', { rough: 1 }), 0, 0.012, -3.2, 0, -Math.PI / 2).rotation.z = 0;
  b.plane(30, 2.0, m('#cdbfa5', { rough: 1 }), 0, 0.011, 1.3, 0, -Math.PI / 2);
  // trees, bench
  const tp: Array<[number, number, number]> = [[-4.5, -3.0, 1.6], [4.5, -3.2, 1.7], [-7, -6, 1.8], [7.2, -6, 1.8], [-3.2, -7.2, 1.5], [3.4, -7.4, 1.5], [6.0, 0.0, 1.5], [-6.2, 0.2, 1.4]];
  tp.forEach(([x, z, s]) => b.tree(x, z, s));
  b.box(1.4, 0.05, 0.45, '#8a5a30', 2.4, 0.43, -1.4); b.box(1.4, 0.35, 0.04, '#8a5a30', 2.4, 0.65, -1.62);
  for (const sx of [-1, 1]) b.box(0.05, 0.43, 0.45, '#2a2d34', 2.4 + sx * 0.62, 0.21, -1.4);
  // bike rack
  const bike = (x: number, z: number, c: string): void => {
    const g = b.grp(x, 0, z, Math.PI / 2 + 0.1);
    for (const wx of [-0.45, 0.45]) { const w = b.ring(0.32, 0.03, '#222', wx, 0.34, 0, 0, Math.PI / 2, g); void w; }
    b.box(0.9, 0.04, 0.04, c, 0, 0.55, 0, 0, g).rotation.z = -0.15;
    b.box(0.04, 0.4, 0.04, c, -0.1, 0.5, 0, 0, g);
    b.box(0.04, 0.3, 0.04, '#222', 0.42, 0.6, 0, 0, g);
    b.box(0.04, 0.04, 0.3, '#222', 0.42, 0.78, 0, 0, g);
  };
  bike(-2.9, 0.1, '#2f7f86'); bike(-2.9, 0.65, '#c9473e'); bike(-2.9, -0.45, '#e0a23f');
  b.box(0.04, 0.3, 1.8, '#8a8f99', -2.5, 0.15, 0.1);
  b.cyl(0.04, 0.6, '#8a8f99', -2.5, 0.3, 1.0, b.g, 6);

  const slots: Slot[] = [
    SL('player', -0.2, 0.2, 0.6, 3, 'wave', { look: [0.5, 1.7, 3] }),
    SL('friend', 0.85, 0.0, -0.3, 3, 'talk', { look: [-0.2, 1.7, 1.5] }),
    SL('student', 2.4, -1.4, 2.4, 3, 'type', { seat: 0.43, lite: true }),
  ];
  b.populate(slots, cast, player);
  b.walker(crowdLook(21), -7, -3.4, 7, -3.4, 1.0, 0.3);
  b.walker(crowdLook(22), 7, -4.6, -7, -4.6, 1.2, 0.7);
  b.walker(crowdLook(23), 1.9, -7, 1.9, -1.0, 0.9, 0.1);
  b.walker(crowdLook(24), -1.9, -1.2, -1.9, -7.0, 1.0, 0.6);
  return {
    camera: aim(V(0.3, 1.9, 8.2), V(0.3, 1.25, 0.0), 46),
    background: '#a7d2f2',
    fog: { color: '#cfe6f4', near: 22, far: 60 },
    ambient: { sky: '#eaf5ff', ground: '#6e8a5a', intensity: 1.6 },
    key: { color: '#fff2d6', intensity: 2.0, position: V(-5, 9, 6) },
  };
}

/* ------------------------------------------------------------ entry */

type Builder = (b: SB, cast: CastSpec[], player: FigureLook) => Cfg;
const BUILDERS: Partial<Record<StageId, Builder>> = {
  airport,
  'intl-office': intlOffice,
  classroom,
  lab,
  apartment: (b, c, p) => apartment(b, c, p, false),
  'apartment-night': (b, c, p) => apartment(b, c, p, true),
  cafe,
  clinic,
  conference,
  festival,
  park,
  library,
  careerfair,
  street,
  bank,
  campus,
  ...EXTRA_BUILDERS,
};
// Route scenes reuse the closest coded room when painted backdrops are switched off.
BUILDERS.court = BUILDERS.conference;
BUILDERS.uscis = BUILDERS['intl-office'];
BUILDERS.legal = BUILDERS['intl-office'];
BUILDERS.workplace = BUILDERS.lab;
BUILDERS.shelter = BUILDERS['apartment-night'];
BUILDERS.worksite = BUILDERS.kitchen;

const HOMELY = new Set<StageId>(['apartment', 'apartment-night', 'bedroom', 'kitchen', 'cafe', 'shelter', 'worksite', 'club']);
const OUTDOOR = new Set<StageId>(['festival', 'park', 'street', 'campus', 'rooftop', 'walk']);

/** Height of the surface a seated person rests on, above their own origin. */
const SIT_H = 0.34;
const STOOL_H = 0.7;
/** How far behind the standing row the seated groups are placed. */
/** Focal length of the painted scenes' camera, in painting heights (about a 49 degree view). */
const PAINT_F = 1.1;
/** People who sit down when a scene invites it; staff and officials stay on their feet. */
const LOUNGERS = new Set<string>(['player', 'roommate', 'friend', 'parent', 'partner', 'spouse', 'stranger', 'student']);

/** Show only the part of a person inside these planes (a call window, or above a counter top). */
function clipFigure(f: FigureLike, planes: THREE.Plane[]): void {
  f.group.userData.clip = planes;
  f.group.userData.noShadow = true;
  // If their model has already loaded, its materials exist now and take the planes directly.
  f.group.traverse((o) => {
    const me = o as THREE.Mesh;
    if (!me.isMesh || Array.isArray(me.material)) return;
    me.castShadow = false;
    if ((me.material as THREE.MeshBasicMaterial).isMeshBasicMaterial) {
      // Ink outlines share one material between everybody, so this person gets their own copy.
      const src = me.material;
      const own = src.clone();
      own.onBeforeCompile = src.onBeforeCompile;
      own.customProgramCacheKey = src.customProgramCacheKey;
      me.material = own;
    }
    me.material.clippingPlanes = planes;
    me.material.needsUpdate = true;
  });
}

/** Furniture for a seating spot, built around the seat surface at y = 0 with the floor at `floor` below it. */
function seatProp(b: SB, g: THREE.Group, kind: NonNullable<SeatSpot['prop']>, n: number, gap: number, floor: number, desk = false): void {
  const wood = m('#8a5a34');
  const iron = m('#23262c');
  const w = n * gap + 0.2;
  const leg = -floor;
  if (kind === 'bench') {
    for (const dz of [-0.08, 0.08, 0.24]) b.box(w, 0.035, 0.13, wood, 0, -0.02, dz, 0, g);
    for (const dy of [0.2, 0.36]) b.box(w, 0.11, 0.035, wood, 0, dy, -0.2, 0, g).rotation.x = -0.14;
    for (const dx of [-w / 2 + 0.08, w / 2 - 0.08]) {
      b.box(0.05, leg, 0.05, iron, dx, -leg / 2, 0.26, 0, g);
      b.box(0.05, leg + 0.46, 0.05, iron, dx, (0.46 - leg) / 2, -0.19, 0, g);
      b.box(0.05, 0.04, 0.5, iron, dx, -0.05, 0.04, 0, g);
      b.box(0.05, 0.04, 0.4, iron, dx, 0.2, 0.06, 0, g);
    }
  } else if (kind === 'stools') {
    for (let i = 0; i < n; i++) {
      const x = (i - (n - 1) / 2) * gap;
      b.cyl(0.17, 0.05, wood, x, -0.03, 0.08, g, 20);
      b.cyl(0.025, leg, iron, x, -leg / 2, 0.08, g, 10);
      b.cyl(0.2, 0.025, iron, x, floor + 0.013, 0.08, g, 20);
      b.ring(0.15, 0.02, iron, x, floor + 0.3, 0.08, Math.PI / 2, 0, g);
    }
  } else if (kind === 'chairs') {
    const pad = m('#3f5f8a');
    b.box(w, 0.05, 0.06, iron, 0, -0.08, 0.05, 0, g);
    for (let i = 0; i < n; i++) {
      const x = (i - (n - 1) / 2) * gap;
      b.box(gap - 0.08, 0.05, 0.42, pad, x, -0.025, 0.1, 0, g);
      b.box(gap - 0.08, 0.38, 0.05, pad, x, 0.3, -0.14, 0, g).rotation.x = -0.1;
    }
    for (const dx of [-w / 2 + 0.1, w / 2 - 0.1]) {
      b.box(0.05, leg, 0.05, iron, dx, -leg / 2, 0.05, 0, g);
      b.box(0.05, 0.03, 0.5, iron, dx, floor + 0.015, 0.05, 0, g);
    }
  } else if (kind === 'office') {
    const pad = m('#3a3f4a');
    for (let i = 0; i < n; i++) {
      const x = (i - (n - 1) / 2) * gap;
      b.box(0.46, 0.07, 0.46, pad, x, -0.035, 0.08, 0, g);
      b.box(0.44, 0.42, 0.06, pad, x, 0.34, -0.16, 0, g).rotation.x = -0.1;
      b.box(0.05, 0.14, 0.05, iron, x, 0.06, -0.15, 0, g);
      b.cyl(0.03, leg - 0.1, iron, x, -(leg - 0.1) / 2 - 0.07, 0.08, g, 12);
      for (const a of [0, 1.257, 2.513, 3.77, 5.027]) b.box(0.3, 0.035, 0.05, iron, x + Math.sin(a) * 0.15, floor + 0.05, 0.08 + Math.cos(a) * 0.15, a + Math.PI / 2, g);
    }
    if (desk) {
      // Their workstation just behind them: they have swivelled round from it to talk.
      const top = m('#d8d2c6');
      const dz = -0.72;
      const ty = floor + 0.74;
      b.box(w + 0.3, 0.04, 0.7, top, 0, ty, dz, 0, g);
      for (const sx of [-1, 1]) b.box(0.04, 0.72, 0.62, m('#9a958c'), sx * ((w + 0.3) / 2 - 0.04), floor + 0.36, dz, 0, g);
      b.box(w + 0.3, 0.42, 0.03, m('#6f7a86'), 0, ty + 0.21, dz - 0.36, 0, g);
      for (let i = 0; i < n; i++) {
        const x = (i - (n - 1) / 2) * gap;
        b.box(0.56, 0.34, 0.03, m('#15171c'), x, ty + 0.3, dz - 0.18, 0, g);
        b.box(0.5, 0.28, 0.005, m('#3d6f9e'), x, ty + 0.3, dz - 0.163, 0, g);
        b.box(0.05, 0.12, 0.05, iron, x, ty + 0.08, dz - 0.2, 0, g);
        b.box(0.42, 0.02, 0.14, m('#2a2c31'), x, ty + 0.03, dz + 0.05, 0, g);
        b.cyl(0.04, 0.1, '#e8e1d2', x + 0.32, ty + 0.07, dz + 0.02, g, 12);
      }
    }
  } else if (kind === 'wood') {
    for (let i = 0; i < n; i++) {
      const x = (i - (n - 1) / 2) * gap;
      b.box(0.42, 0.045, 0.42, wood, x, -0.022, 0.1, 0, g);
      for (const dx of [-0.18, 0.18]) {
        b.box(0.04, leg, 0.04, wood, x + dx, -leg / 2, 0.28, 0, g);
        b.box(0.04, leg + 0.5, 0.04, wood, x + dx, (0.5 - leg) / 2, -0.09, 0, g);
      }
      for (const dy of [0.28, 0.44]) b.box(0.36, 0.07, 0.03, wood, x, dy, -0.09, 0, g);
    }
  } else {
    // A small table with a wooden chair at each end, seen from the side.
    b.box(gap - 0.3, 0.045, 0.7, wood, 0, 0.4, 0.05, 0, g);
    for (const dx of [-1, 1]) for (const dz of [-1, 1]) b.box(0.05, leg + 0.4, 0.05, wood, dx * (gap / 2 - 0.22), (0.4 - leg) / 2, 0.05 + dz * 0.28, 0, g);
    b.cyl(0.05, 0.1, '#e8e1d2', -0.12, 0.47, 0.1, g, 12);
    b.cyl(0.05, 0.1, '#c9473e', 0.14, 0.47, -0.05, g, 12);
    for (const sx of [-1, 1]) {
      const cx = sx * (gap / 2 + 0.08);
      b.box(0.42, 0.045, 0.42, wood, cx - sx * 0.1, -0.022, 0, 0, g);
      for (const dz of [-0.18, 0.18]) {
        b.box(0.04, leg, 0.04, wood, cx - sx * 0.28, -leg / 2, dz, 0, g);
        b.box(0.04, leg + 0.5, 0.04, wood, cx + sx * 0.09, (0.5 - leg) / 2, dz, 0, g);
      }
      for (const dy of [0.26, 0.42]) b.box(0.03, 0.07, 0.36, wood, cx + sx * 0.09, dy, 0, 0, g);
    }
  }
}

export function buildStage(id: StageId, cast: CastSpec[], player: FigureLook, palette: string[], variant?: 'movie' | 'call'): StageResult {
  beginCastScene();
  // Seats that belong: a park bench outdoors, a wooden chair at home or in a kitchen, an office chair elsewhere.
  setSeatStyle(OUTDOOR.has(id) ? 'bench' : HOMELY.has(id) ? 'wood' : 'office');
  const b = new SB(palette);
  const build = BUILDERS[id] ?? airport;
  const cfg = build(b, cast, player);
  const backdrop = backdropFor(id);
  let span = 0;
  let paintFit: StageResult['fit'];
  let paintFocus = 0.5;
  let paintDim = 1;
  let paintCam: StageResult['paintCam'];
  let relief: THREE.Mesh | null = null;
  // Someone sitting on a painted seat or standing behind a painted counter is pinned to the picture; the
  // depth model's guess for that furniture is never exact, so the camera drifts less in those scenes.
  let pinned = false;
  if (backdrop) {
    // Painted backdrop: hide the coded room, keep the people and the furniture they use.
    const people = new Set(b.figs.map((f) => f.group));
    for (const child of b.g.children) {
      const light = (child as THREE.Light).isLight;
      if (!people.has(child as THREE.Group) && !child.userData.keep && !light) child.visible = false;
    }
    // Restage for an eye-level painting: the main characters stand in a row in the foreground, where the
    // painting's floor is; background extras are left to the painting.
    // The player and the named people of the moment come first; passers-by fill what room is left.
    const rank = (f: { look: FigureLook }): number => (f.look.role === 'player' ? 0 : f.look.role && f.look.role !== 'student' && f.look.role !== 'stranger' ? 1 : 2);
    let main = b.figs
      .filter((f) => !f.lite)
      .map((f, i) => ({ f, i }))
      .sort((p, q) => rank(p.f) - rank(q.f) || p.i - q.i)
      .slice(0, 4)
      .map((p) => p.f);
    for (const f of b.figs) if (!main.includes(f)) f.group.visible = false;
    // On a call home the other person is far away: they appear in a call window, never in the room.
    let remote: FigureLike | null = null;
    if (variant === 'call') {
      remote = main.find((f) => f.look.role !== 'player') ?? null;
      for (const f of main) if (f.look.role !== 'player' && f !== remote) f.group.visible = false;
      main = main.filter((f) => f.look.role === 'player');
    }
    const furniture = b.g.children.filter((ch) => ch.userData.keep);
    b.looks.length = 0;
    // The camera that would have painted this picture: level, at the painting's eye height, far enough
    // back that someone at the stage centre is the size the room implies. Anything placed on the ground
    // then lands on the painted floor at the right size, seen from the right height.
    const img = backdrop.image as { width: number; height: number } | undefined;
    const texA = img && img.height ? img.width / img.height : 1;
    const vh = backdropHorizon(id);
    const d0 = (1.7 * PAINT_F) / backdropPerson(id);
    const camH = (1.7 * (0.9 - vh)) / backdropPerson(id);
    const K = d0 / PAINT_F;
    paintCam = { h: camH, d0, f: PAINT_F, vh };
    // With a depth map the painting becomes a relief in the same space as the people, so the camera can drift.
    const depthGrid = backdropDepth(id);
    if (depthGrid && variant !== 'call') {
      relief = makeRelief(backdrop, depthGrid, paintCam, texA);
      b.g.add(relief);
    }
    // Who sits where. The painting's own seats come first (a sofa, a bench, bus seats), then furniture built
    // to match; people sit facing each other or the room, not lined up toward the viewer.
    // Staff and officials sit only when the scene says so outright; they are not parked on a spare chair.
    const wantsSeat = (f: FigureLike): boolean => f.pose === 'sit' || f.pose === 'type' || f.pose === 'eat' || (Boolean(f.group.userData.seated) && LOUNGERS.has(f.look.role ?? 'stranger') && f.pose !== 'sleep');
    const lounge = backdropLounge(id);
    const atRest = (f: FigureLike): boolean => lounge && LOUNGERS.has(f.look.role ?? 'stranger') && (f.pose === 'idle' || f.pose === 'talk' || f.pose === 'phone' || f.pose === 'think' || f.pose === 'laugh');
    const spots = variant === 'call' ? [...backdropSeats(id)].reverse() : backdropSeats(id);
    const groups = spots.map((spot) => {
      const seatH = spot.prop === 'stools' ? STOOL_H : SIT_H;
      // A painted seat is pinned where the picture shows it, at the size the picture shows. A built seat
      // stands on the painted floor, and the floor's perspective gives its distance and so its size.
      const depth = spot.vf !== undefined ? (PAINT_F * camH) / Math.max(0.04, spot.vf - vh) : d0 / (spot.s ?? 1);
      const y = spot.vf !== undefined ? seatH : camH - (((spot.v ?? 0.6) - vh) * depth) / PAINT_F;
      return { spot, node: new THREE.Group(), who: [] as FigureLike[], cap: spot.layout === 'across' ? 2 : spot.n ?? 1, depth, y, seatH, size: d0 / depth };
    });
    const inGroup = new Set<FigureLike>();
    // Where there is a service counter with someone behind it, the player goes up to the window unless the scene sits them down.
    const service = backdropCounter(id);
    const served = Boolean(service?.cust && main.some((f) => service.roles.includes(f.look.role ?? '')));
    for (const f of main) {
      if (f.pose === 'sleep' || !(wantsSeat(f) || atRest(f))) continue;
      if (served && f.look.role === 'player' && f.pose !== 'sit' && f.pose !== 'type' && f.pose !== 'eat') continue;
      const desk = f.pose === 'type' || f.pose === 'eat';
      const free = groups.filter((g) => g.who.length < g.cap);
      // People who came to talk share a seat that already has someone on it before starting a new one.
      const g = (desk ? free.find((q) => q.spot.desk) : undefined) ?? free.find((q) => q.who.length > 0) ?? free[0];
      if (!g) continue;
      g.who.push(f);
      inGroup.add(f);
    }
    const used = groups.filter((g) => g.who.length > 0);
    // Built seats (not painted ones) swivel toward whoever is standing to talk, so nobody seated has their
    // back to the person addressing them.
    const staffRoles = backdropCounter(id)?.roles ?? [];
    const talkers = main.filter((f) => !inGroup.has(f) && f.pose !== 'cook' && f.pose !== 'sleep' && !staffRoles.includes(f.look.role ?? ''));
    const seatMid = used.length ? used.reduce((a, g) => a + g.spot.u * g.who.length, 0) / Math.max(1, inGroup.size) : 0.5;
    for (const g of used) {
      const { spot, node, who } = g;
      const gap = spot.gap ?? 0.55;
      const across = spot.layout === 'across';
      const floor = -g.seatH;
      if (spot.prop) seatProp(b, node, spot.prop, across ? 2 : spot.prop === 'bench' ? Math.max(who.length, Math.min(g.cap, 2)) : who.length, gap, floor, Boolean(spot.desk) && spot.prop === 'office');
      node.rotation.y = spot.ry ?? 0;
      if (spot.prop && talkers.length) node.rotation.y = (seatMid < 0.5 ? 1 : -1) * 0.95;
      node.position.set(((spot.u - 0.5) * g.depth * texA) / PAINT_F, g.y, d0 - g.depth);
      who.forEach((f, i) => {
        const lx = across ? (i ? gap / 2 : -gap / 2) : (i - (who.length - 1) / 2) * gap;
        const turn = across ? (i ? -Math.PI / 2 : Math.PI / 2) : -Math.sign(lx) * (spot.fan ?? 0);
        node.add(f.group);
        f.group.position.set(lx, -SIT_H, 0);
        f.group.rotation.y = turn;
        f.group.userData.seated = true;
        // Someone on painted furniture cannot cast a shadow on it; someone on a built seat shadows the floor.
        f.group.userData.noShadow = !spot.prop;
        f.setSeated(true);
        // Someone typing has a laptop on their lap, turned with them, screen toward them.
        if (f.pose === 'type') {
          b.laptop(0, 0.71, 0.14, Math.PI, null, false);
          f.group.add(b.g.children[b.g.children.length - 1]);
        }
      });
      const shade = b.blob(0, 0, (across ? gap : who.length * gap) + 0.5, 0.9);
      node.add(shade);
      shade.position.set(0, floor + 0.008, 0.2);
      if (!spot.prop) {
        pinned = true;
        shade.visible = false;
        node.traverse((o) => { o.castShadow = false; });
      }
      b.g.add(node);
    }
    const atDepth = (u: number, vf: number): THREE.Vector3 => {
      const depth = (PAINT_F * camH) / Math.max(0.04, vf - vh);
      return new THREE.Vector3(((u - 0.5) * depth * texA) / PAINT_F, 0, d0 - depth);
    };
    // Whoever is cooking stands at the painted stove, facing it.
    const cookAt = backdropCookSpot(id);
    const cook = cookAt ? main.find((f) => f.pose === 'cook' && !inGroup.has(f)) : undefined;
    if (cook && cookAt) {
      const at = atDepth(cookAt.u, cookAt.vf);
      cook.group.position.copy(at);
      cook.group.rotation.y = cookAt.ry;
      b.blob(at.x, at.z + 0.05, 1.0, 0.6);
    }
    let focusFix: number | null = null;
    // Staff work behind the painted counter: only what shows above the counter top is drawn. The player
    // steps up to the window.
    const counter = backdropCounter(id);
    const clerk = counter ? main.find((f) => counter.roles.includes(f.look.role ?? '') && !inGroup.has(f)) : undefined;
    let customer: FigureLike | undefined;
    if (counter && clerk) {
      pinned = true;
      const depth = d0 / counter.s;
      const top = camH - ((counter.v - vh) * depth) / PAINT_F;
      clerk.group.position.set(((counter.u - 0.5) * depth * texA) / PAINT_F, top - 1.02, d0 - depth);
      clerk.group.rotation.y = counter.ry;
      clerk.group.userData.seated = false;
      clerk.setSeated(false);
      clipFigure(clerk, [new THREE.Plane(new THREE.Vector3(0, 1, 0), -top)]);
      customer = counter.cust ? main.find((f) => f.look.role === 'player' && !inGroup.has(f) && f !== cook) : undefined;
      if (customer && counter.cust) {
        const at = atDepth(counter.cust.u, counter.cust.vf);
        customer.group.position.copy(at);
        customer.group.rotation.y = counter.cust.ry;
        if (customer.group.userData.seated) {
          customer.group.userData.seated = false;
          customer.setSeated(false);
        }
        b.blob(at.x, at.z + 0.05, 1.0, 0.6);
        // A narrow view follows the player to the window, and passers-by make way.
        focusFix = (counter.u + counter.cust.u) / 2 - 0.04;
        for (const f of main) if (f !== customer && f !== clerk && !cast.some((c) => c.role === f.look.role)) f.group.visible = false;
        main = main.filter((f) => f.group.visible);
      }
    }
    /** Something everyone watches (a film) or the player looks at (the call window). */
    let watch: THREE.Vector3 | null = null;
    if (variant === 'movie') {
      // A laptop on a low table with its back to us, and its light playing over the people watching.
      const at = atDepth(0.46, 0.88);
      const set = b.grp(at.x, 0, at.z);
      b.box(0.7, 0.04, 0.45, '#5a4030', 0, 0.4, 0, 0, set);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box(0.04, 0.4, 0.04, '#3a2a20', sx * 0.3, 0.2, sz * 0.18, 0, set);
      b.laptop(-0.08, 0.42, 0, Math.PI, null, false);
      const lap = b.g.children[b.g.children.length - 1];
      set.add(lap);
      const bowl = b.cyl(0.11, 0.09, '#e8e1d2', 0.24, 0.47, 0.02, set, 20);
      void bowl;
      for (let i = 0; i < 9; i++) b.sph(0.03, i % 2 ? '#f6e7a8' : '#fff6d0', 0.24 + Math.sin(i * 2.4) * 0.06, 0.53 + (i % 3) * 0.012, 0.02 + Math.cos(i * 2.4) * 0.06, 1, 1, 1, set);
      const glow = b.light('#9cc4ff', 3, at.x - 0.08, 0.9, at.z - 0.9, 10);
      const warm = new THREE.Color('#ffc890');
      const cool = new THREE.Color('#9cc4ff');
      b.upd.push((_dt, t) => {
        // Scenes cut, explosions flash, quiet scenes glow: the light never sits still.
        const cut = Math.floor(t * 0.45);
        const level = 0.55 + 0.45 * Math.abs(Math.sin(cut * 12.9898) * 43758.5453 % 1);
        glow.intensity = 3.4 * level * (0.9 + 0.1 * Math.sin(t * 23));
        glow.color.copy(cool).lerp(warm, Math.abs(Math.sin(cut * 7.13)) > 0.7 ? 0.7 : 0.1);
      });
      watch = new THREE.Vector3(at.x - 0.08, 0.6, at.z);
    }
    if (variant === 'call' && remote) {
      // The call window floats beside the player: the far-away room, daylight where here it is night.
      const u = 0.53;
      const v = 0.45;
      const depth = d0 * 0.8;
      const k = 0.544 / backdropPerson(id);
      const win = new THREE.Group();
      const cx = ((u - 0.5) * depth * texA) / PAINT_F;
      const cy = camH - ((v - vh) * depth) / PAINT_F;
      win.position.set(cx, cy - 1.42 * k, d0 - depth);
      win.scale.setScalar(k);
      const w = 0.68;
      const h = 0.86;
      const room = b.canvasTex(256, 320, (g, tw, th) => {
        skyGrad(g, tw, th, [[0, '#f3e2c0'], [1, '#d9b98c']]);
        g.fillStyle = '#bfe3ff'; g.fillRect(tw * 0.58, th * 0.08, tw * 0.34, th * 0.3);
        g.fillStyle = '#fff7da'; g.fillRect(tw * 0.58, th * 0.08, tw * 0.34, th * 0.1);
        g.strokeStyle = '#8a6a4a'; g.lineWidth = 6; g.strokeRect(tw * 0.58, th * 0.08, tw * 0.34, th * 0.3);
        g.fillStyle = '#8a5a3a'; g.fillRect(tw * 0.06, th * 0.2, tw * 0.36, 8);
        for (let i = 0; i < 5; i++) { g.fillStyle = ['#b85c38', '#3f7f5a', '#c99a3a', '#2f5d8a', '#a63d3d'][i]; g.fillRect(tw * 0.08 + i * 16, th * 0.2 - 30 - (i % 2) * 8, 12, 30 + (i % 2) * 8); }
        g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(0, th - 44, tw, 44);
        g.fillStyle = '#ef4444'; g.beginPath(); g.arc(tw / 2, th - 22, 13, 0, 7); g.fill();
        g.fillStyle = '#4ade80'; g.beginPath(); g.arc(22, 22, 8, 0, 7); g.fill();
      });
      b.panel(w, h, room, 0, 1.42, -0.3, 0, win);
      const rim = m('#14161c');
      const t = 0.05;
      b.box(w + 2 * t, t, 0.05, rim, 0, 1.42 + h / 2 + t / 2, -0.29, 0, win);
      b.box(w + 2 * t, t, 0.05, rim, 0, 1.42 - h / 2 - t / 2, -0.29, 0, win);
      b.box(t, h, 0.05, rim, -w / 2 - t / 2, 1.42, -0.29, 0, win);
      b.box(t, h, 0.05, rim, w / 2 + t / 2, 1.42, -0.29, 0, win);
      win.traverse((o) => { o.castShadow = false; o.receiveShadow = false; });
      b.g.add(win);
      // Only the part of them inside the window shows.
      remote.group.userData.clip = [
        new THREE.Plane(new THREE.Vector3(1, 0, 0), -(cx - (w / 2) * k)),
        new THREE.Plane(new THREE.Vector3(-1, 0, 0), cx + (w / 2) * k),
        new THREE.Plane(new THREE.Vector3(0, 1, 0), -(cy - (h / 2) * k + 0.05 * k)),
        new THREE.Plane(new THREE.Vector3(0, -1, 0), cy + (h / 2) * k),
      ];
      remote.group.userData.noShadow = true;
      clipFigure(remote, remote.group.userData.clip as THREE.Plane[]);
      remote.group.userData.seated = false;
      remote.setSeated(false);
      remote.setPose('talk');
      win.add(remote.group);
      remote.group.visible = true;
      remote.group.position.set(0, 0, 0);
      remote.group.rotation.set(0, 0, 0);
      remote.group.scale.setScalar(1);
      const day = new THREE.PointLight('#fff1d6', 2.2, 2.2 * k, 2);
      day.position.set(0.2, 1.6, 0.9);
      win.add(day);
      watch = new THREE.Vector3(cx, cy, d0 - depth);
      focusFix = 0.44;
    }
    // The people left standing gather to one side of whoever is seated, turned toward them.
    const standers = main.filter((f) => !inGroup.has(f) && f !== cook && f !== clerk && f !== customer);
    const seatU = used.length ? used.reduce((a, g) => a + g.spot.u * g.who.length, 0) / inGroup.size : 0.5;
    const side = seatU < 0.5 ? 1 : -1;
    // Closer together when there are more people, so nobody is cut off by the frame.
    const count = standers.length;
    const open = count >= 4 ? 0.72 : count === 3 ? 0.95 : 1.2;
    // In a narrow aisle the row closes up and people stand in depth instead, one a step behind the next.
    const room = backdropMaxSpan(id);
    // Beside a seated group there is less room, so the row closes up there too.
    const gap = room && count > 1 ? Math.min(open, room / (count - 1)) : used.length && count > 1 ? Math.min(open, 0.8) : open;
    const tight = gap < 0.7 || (used.length > 0 && count > 1);
    // The standing row starts where the seated group ends, so nobody stands in front of anyone sitting.
    const seatHalf = used.reduce((a, g) => Math.max(a, (((g.who.length - 1) * (g.spot.gap ?? 0.55)) / 2 + 0.35) * g.size + Math.abs(g.spot.u - seatU) * K), 0);
    const rowFree = used.length ? Math.max(0.1, Math.min(0.9, seatU + side * ((seatHalf + ((count - 1) * gap) / 2 + 0.3) / K + 0.02))) : 0.5;
    // In a narrow room (a kitchen aisle, a bus) the people standing stay in the aisle.
    const aisle = room ? Math.max(0, room - (count - 1) * gap) / (2 * K) : 0;
    const rowU = room ? Math.max(0.5 - aisle, Math.min(0.5 + aisle, rowFree)) : rowFree;
    const focusU = used.length ? (standers.length ? (seatU + rowU) / 2 : seatU) : 0.5;
    const row = new THREE.Group();
    b.g.add(row);
    let rowHalf = 0;
    standers.forEach((f, i) => {
      const ox = f.group.position.x;
      const oz = f.group.position.z;
      const nx = (i - (count - 1) / 2) * gap;
      const nz = tight ? (i % 2 ? -0.75 : 0.1) : i % 2 ? 0.3 : 0;
      const sitter = wantsSeat(f);
      // Someone the coded room had seated, but who stands in this staging, gets up.
      if (!sitter && f.group.userData.seated) {
        f.group.userData.seated = false;
        f.setSeated(false);
        f.group.position.y = 0;
      }
      // A sleeper's bed lies across the frame. Everyone else turns toward the others: toward whoever is
      // seated if anyone is, otherwise toward the middle of the group.
      let facing = 0;
      let couchBed = false;
      // A three-quarter turn: people visibly face each other in conversation, while their faces still read.
      if (f.pose === 'sleep') facing = Math.PI / 2;
      // Talking to someone seated further back: the body cheats toward the viewer (about 30 degrees) and the
      // head turns the rest of the way, so the face still reads.
      else if (used.length) facing = Math.atan2(-side * 0.8 - nx * 0.5, 1.3);
      else if (count > 1) facing = Math.atan2(-nx, sitter ? 0.5 : 0.55);
      else if (sitter) facing = 0.5;
      for (const k of furniture) {
        // Chairs go with sitters, beds and couches only with sleepers; nobody standing carries furniture along.
        if (sitter ? !k.userData.chair : f.pose !== 'sleep' || k.userData.chair) continue;
        if (k.userData.placed || Math.hypot(k.position.x - ox, k.position.z - oz) > 0.75) continue;
        k.position.x += nx - ox;
        k.position.z += nz - oz;
        k.rotation.y = facing;
        k.userData.placed = true;
        // A couch is long from side to side (a bed is long front to back): it stays facing the room and the
        // sleeper lies along its seat, head to one arm and feet to the other.
        if (f.pose === 'sleep') {
          const size = new THREE.Box3().setFromObject(k).getSize(new THREE.Vector3());
          const turned = Math.abs(Math.sin(facing)) > 0.5;
          const longX = turned ? size.z > size.x : size.x > size.z;
          if (longX) {
            k.rotation.y = 0;
            k.position.x = nx;
            k.position.z = nz - 0.05;
            couchBed = true;
          }
        }
      }
      f.group.position.x = couchBed ? nx + 0.9 : nx;
      f.group.position.z = nz;
      if (couchBed) f.group.position.y = 0.44;
      f.group.rotation.y = facing;
      // Anyone sitting needs a seat, even if the coded room used a beanbag, bench or stool.
      if (sitter && !furniture.some((k) => k.userData.placed && Math.hypot(k.position.x - nx, k.position.z - nz) < 0.4)) {
        // The coded room may have seated them lower (a beanbag or bench); a chair needs the standard height.
        f.group.position.y = 0;
        const seat = b.chair(nx, nz, facing, '#4a4f5c');
        seat.userData.placed = true;
        furniture.push(seat);
      }
      // A soft contact shadow grounds each person on the painted floor.
      if (f.pose !== 'sleep') row.add(b.blob(nx, nz + 0.05, 1.15, 0.7));
      rowHalf = Math.max(rowHalf, Math.abs(nx) + (f.pose === 'sleep' ? 1.3 : 0.62));
    });
    for (const k of furniture) {
      if (!k.userData.placed) k.visible = false;
      else row.add(k);
    }
    for (const f of standers) row.add(f.group);
    // Everyone looks at someone: the player at the nearest other person, the others at the player.
    const gaze = !watch && main.length > 1 ? main.filter((f) => f !== cook).map((f, i) => ({ fig: f, to: main[i === 0 ? 1 : 0], v: new THREE.Vector3() })) : [];
    for (const q of gaze) b.looks.push({ fig: q.fig, v: q.v });
    if (watch) for (const f of main) b.looks.push({ fig: f, v: watch });
    paintFit = (m) => {
      // A view narrower than the painting keeps the seats in frame first, then fits the standing row beside
      // them (overlapping the end of the seat a little if it must) so nobody is cut off by the edge.
      let focus = focusU;
      let rowAt = rowU;
      if (used.length && m.half < 0.5) {
        const seatEdge = seatU - side * (seatHalf / K + 0.02);
        focus = side > 0 ? Math.min(focus, seatEdge + m.half) : Math.max(focus, seatEdge - m.half);
        // Widths along the painting are fractions of its width, which is texA image-heights across.
        const slack = Math.max(0, m.half - rowHalf / (K * m.back * texA));
        rowAt = side > 0 ? Math.min(rowAt, focus + slack) : Math.max(rowAt, focus - slack);
      }
      paintFocus = focusFix ?? focus;
      // A row too wide for the view stands further into the room, where the floor has space for it.
      row.position.z = -(m.back - 1) * d0;
      row.position.x = used.length ? (rowAt - 0.5) * K * m.back * texA : 0;
      b.g.updateMatrixWorld(true);
      for (const q of gaze) {
        q.to.group.getWorldPosition(q.v);
        q.v.y += q.to.group.userData.seated ? 1.2 : 1.55;
        b.g.worldToLocal(q.v);
      }
    };
    paintFit({ half: 0.5, back: 1 });
    // Half the width the group needs (arms and all), so the camera can keep everyone inside the frame.
    span = used.length ? (standers.length ? (rowHalf + seatHalf) * 0.75 : 0) : rowHalf;
    // A medium shot from about the shins up: floor contact never has to match the painting.
    // Light the people with colours measured from the painting, from its brighter side.
    const lit = backdropLight(id);
    if (lit) {
      const sky = new THREE.Color(lit.sky).lerp(new THREE.Color('#ffffff'), 0.22);
      cfg.ambient = { sky: `#${sky.getHexString()}`, ground: lit.ground, intensity: 1.2 + lit.lum * 1.2 };
      cfg.key = { color: lit.key, intensity: 1.25 + lit.lum * 1.5, position: new THREE.Vector3(lit.side >= 0 ? 5 : -5, 7, 4.5) };
    }
    if (variant === 'movie') {
      // Lights low: the screen and the city outside do the lighting.
      cfg.ambient = { ...cfg.ambient, intensity: cfg.ambient.intensity * 0.5 };
      cfg.key = { ...cfg.key, intensity: cfg.key.intensity * 0.35 };
      paintDim = 0.5;
    }
    // A full-body shot at eye level: the painting's open floor is where the people stand and cast shadows.
    const lying = main.some((f) => f.pose === 'sleep');
    void standers;
    cfg.camera = lying
      ? { position: new THREE.Vector3(0, 1.5, 5.2), target: new THREE.Vector3(0, 0.55, 0), fov: 30 }
      : { position: new THREE.Vector3(0, 1.4, 6.3), target: new THREE.Vector3(0, 0.98, 0), fov: 30 };
    const catcher = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShadowMaterial({ opacity: 0.34 }));
    catcher.rotation.x = -Math.PI / 2;
    catcher.position.y = 0.004;
    catcher.receiveShadow = true;
    b.g.add(catcher);
  } else {
    decorate(id, b, cfg);
  }
  // one shadow-casting key light that shares the stage's key direction
  const sun = new THREE.DirectionalLight(cfg.key.color, cfg.key.intensity * 0.62);
  const ext = OUTDOOR.has(id) ? 13 : 9;
  const centre = new THREE.Vector3(cfg.camera.target.x, 0, Math.max(-6, Math.min(2, cfg.camera.target.z)));
  sun.position.copy(cfg.key.position.clone().normalize().multiplyScalar(18).add(centre));
  sun.target.position.copy(centre);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  const sc = sun.shadow.camera;
  sc.left = -ext; sc.right = ext; sc.top = ext * 0.8; sc.bottom = -ext * 0.8; sc.near = 1; sc.far = 40;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.035;
  sun.shadow.radius = 3;
  b.g.add(sun, sun.target);
  cfg.key = { ...cfg.key, intensity: cfg.key.intensity * 0.38 };
  if (relief) (relief.material as THREE.MeshBasicMaterial).color.setScalar(paintDim);
  const fit = paintFit;
  const out: StageResult = {
    group: b.g,
    update: (dt, time) => b.tick(dt, time),
    dispose: () => b.free(),
    ...cfg,
    ...(backdrop ? { backdrop, fog: null, span, person: backdropPerson(id), focusU: paintFocus, paintCam, dim: paintDim, relief: relief ? (pinned ? 0.3 : 1) : 0 } : {}),
    ready: castSettled(),
    anchor: (role) => {
      const f = b.figs.find((q) => q.look.role === role && q.group.visible);
      if (!f) return null;
      const box = new THREE.Box3().setFromObject(f.group);
      if (box.isEmpty()) return null;
      return new THREE.Vector3((box.min.x + box.max.x) / 2, box.max.y + 0.06, (box.min.z + box.max.z) / 2);
    },
  };
  if (backdrop && fit) {
    out.fit = (m) => {
      fit(m);
      out.focusU = paintFocus;
    };
  }
  return out;
}

/** Per-stage atmosphere: glow, light shafts, dust and other finishing touches. */
function decorate(id: StageId, b: SB, _cfg: Cfg): void {
  const warm = '#ffd9a0';
  switch (id) {
    case 'airport':
      b.glow('#ffd88a', 3.2, 0.3, 3.0, -2.8, 0.22);
      b.dust(0, 2.0, -1, 10, 3, 5, 36, '#e8f0ff', 0.04, 0.35, 0.012);
      break;
    case 'intl-office':
      b.shaft(4.0, 2.0, -3.1, 0, 1.0, 5.5, 0.95, '#fff0c8', 0.14);
      b.dust(0, 1.8, -1, 6, 3, 4, 30, '#fff4d8', 0.045, 0.5, 0.012);
      break;
    case 'classroom':
      for (let i = 0; i < 3; i++) b.shaft(5.0, 2.1, -2.2 + i * 2.6, -Math.PI / 2, 1.3, 7, 0.78, '#fff0c8', 0.1);
      b.dust(0, 1.8, -1, 7, 3, 5, 40, '#fff4d8', 0.045, 0.5, 0.012);
      break;
    case 'lab':
      b.glow('#7fd8ff', 3.4, 0, 2.6, -3.3, 0.16);
      b.dust(0, 1.8, -1, 8, 3, 4, 26, '#e0f0ff', 0.04, 0.4, 0.012);
      break;
    case 'apartment':
      b.shaft(-0.2, 1.9, -3.1, 0, 2.9, 5.6, 0.9, '#fff0c8', 0.15);
      b.shaft(0.8, 1.9, -3.1, 0, 0.9, 6.6, 0.82, '#fff0c8', 0.1);
      b.dust(0, 1.4, -1.8, 5, 2.6, 3, 34, '#fff4d8', 0.05, 0.55, 0.014);
      break;
    case 'apartment-night':
      b.glow(warm, 2.6, 1.7, 1.55, -2.5, 0.5);
      b.glow('#7fc4ff', 1.0, 0.1, 0.7, -1.3, 0.3);
      b.glow('#ffd27a', 4.5, 0, 2.9, -3.0, 0.1);
      b.shaft(-0.2, 1.9, -3.1, 0, 2.6, 5.6, 0.9, '#9fb8ff', 0.07);
      b.dust(0, 1.4, -1.8, 5, 2.6, 3, 24, '#ffd9a0', 0.045, 0.45, 0.012);
      break;
    case 'cafe':
      for (const x of [-1.0, 0.5, 2.0]) b.glow('#ffd27a', 1.5, x, 2.66, -1.0, 0.5);
      b.shaft(-4.8, 1.9, -0.5, Math.PI / 2, 1.5, 6, 0.85, '#ffc890', 0.13);
      b.dust(0, 1.8, -1.5, 8, 2.8, 4, 34, warm, 0.045, 0.5, 0.012);
      break;
    case 'clinic':
      b.glow('#ffffff', 5, 0, 3.0, -1.5, 0.08);
      b.dust(0, 1.8, -1, 8, 3, 4, 24, '#f0fbff', 0.04, 0.35, 0.012);
      break;
    case 'conference':
      b.glow('#6aa0ff', 6, 0, 3.0, -4.0, 0.16);
      b.dust(0, 2.2, -1, 10, 3.5, 6, 40, '#b0c8ff', 0.05, 0.5, 0.012);
      break;
    case 'festival':
      b.glow('#ffd27a', 5, 0, 3.0, -2.8, 0.16);
      b.dust(0, 1.8, 0, 9, 3, 6, 46, '#ffe9a8', 0.055, 0.7, 0.025);
      break;
    case 'park':
      b.shaft(-2.5, 6.5, -4.5, 0, 1.4, 9, 1.05, '#fff2c0', 0.11);
      b.shaft(1.8, 6.5, -4.5, 0, 1.0, 9, 1.1, '#fff2c0', 0.08);
      b.dust(0, 1.5, 0, 8, 2.6, 6, 40, '#fff6cc', 0.05, 0.6, 0.014);
      break;
    case 'library':
      b.dust(0, 1.8, -1.5, 7, 3, 4, 34, warm, 0.04, 0.45, 0.01);
      break;
    case 'careerfair':
      b.glow('#ffffff', 5, 0, 3.4, -1.5, 0.1);
      b.dust(0, 1.8, -1.5, 9, 3, 5, 24, '#fff4d8', 0.045, 0.4, 0.012);
      break;
    case 'street':
      b.glow(warm, 2.4, 2.4, 3.9, 0.2, 0.5);
      b.dust(0, 1.8, 0, 9, 3, 6, 30, warm, 0.045, 0.5, 0.012);
      break;
    case 'bank':
      for (const x of [-1.5, 1.6]) b.glow('#ffd27a', 0.9, x, 1.15, -1.5, 0.5);
      b.dust(0, 1.8, -1, 8, 3, 4, 24, '#fff4d8', 0.04, 0.4, 0.01);
      break;
    case 'campus':
      b.shaft(-3, 6.5, -4, 0, 1.4, 9, 1.0, '#fff2c0', 0.1);
      b.dust(0, 1.6, 0, 9, 2.8, 6, 36, '#fff6cc', 0.05, 0.6, 0.014);
      break;
    default:
      break;
  }
  void _cfg;
}
