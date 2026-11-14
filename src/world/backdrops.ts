import * as THREE from 'three';
import type { StageId } from '../engine/types';
import metaRaw from '../data/backdrops.json';
import { readDepth } from './relief';
import type { DepthGrid, ReliefCam } from './relief';

/**
 * Painted scene backdrops (public/assets/backdrops/<stage>.jpg). When a stage has one, its coded room is
 * hidden and the 3D people stand in front of the painting. Add a stage id here once its image exists;
 * generate images with scripts/gen_backdrops.py.
 */
export const BACKDROP_IDS: StageId[] = [
  'airport', 'intl-office', 'classroom', 'lab', 'apartment', 'apartment-night', 'cafe', 'clinic', 'conference', 'festival', 'park',
  'library', 'careerfair', 'street', 'bank', 'campus', 'bedroom', 'kitchen', 'club', 'gym', 'rooftop', 'walk',
  'court', 'uscis', 'workplace', 'shelter', 'worksite', 'legal',
];

/** Painted skylines for the city view, one per city (public/assets/backdrops/city-<id>.jpg). */
export const CITY_PAINT_IDS = ['nyc', 'la', 'houston', 'bayarea', 'dallas', 'chicago', 'atlanta', 'dc'];
/** Painted scenes for the trip to work or campus (public/assets/backdrops/commute-<mode>.jpg). Walking uses the 'walk' scene. */
export const COMMUTE_PAINT_IDS = ['commute-bike', 'commute-transit', 'commute-car', 'commute-rideshare'];

/** Alternate paintings a stage borrows for particular moments (the passport booth for the arrival inspection). */
export const ALT_PAINT_IDS = ['airport-booth'];
/** Backdrops with a baked depth map (<id>-depth.png from scripts/bake_depth.py): these get a 3D relief. */
export const DEPTH_IDS: string[] = [...BACKDROP_IDS, ...COMMUTE_PAINT_IDS, ...ALT_PAINT_IDS, ...CITY_PAINT_IDS.map((c) => `city-${c}`)];
const depths = new Map<string, DepthGrid>();
/** The depth grid for a stage's painting, once loaded. */
export function backdropDepth(id: StageId): DepthGrid | null {
  return enabled ? depths.get(keyOf(id)) ?? null : null;
}

const base = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
const loaded = new Map<string, THREE.Texture>();
/** While set, a stage borrows another painting (the commute scenes are staged on the street layout). */
let alias: { stage: StageId; paint: string } | null = null;
export function setBackdropAlias(stage: StageId | null, paint?: string): void {
  alias = stage && paint && loaded.has(paint) ? { stage, paint } : null;
}
const keyOf = (id: StageId): string => (alias && alias.stage === id ? alias.paint : id);
export function paintReady(key: string): boolean {
  return enabled && loaded.has(key);
}
/** The painted skyline for a city, if it has loaded. */
export function cityPaint(cityId: string | null): THREE.Texture | null {
  return enabled && cityId ? loaded.get(`city-${cityId}`) ?? null : null;
}
/** The skyline's depth grid, once loaded (baked on a fixed near-to-far range, read with CITY_CAM). */
export function cityDepth(cityId: string | null): DepthGrid | null {
  return enabled && cityId ? depths.get(`city-${cityId}`) ?? null : null;
}
/** The virtual camera a skyline depth map was baked for (scripts/bake_depth.py, SKY_K / NEAR_K). */
export const CITY_CAM: ReliefCam = { h: 1, d0: 0, f: 1.1, vh: 0.5 };

export interface SkylineShot {
  /** Part of the painting on screen, as texture repeat and offset. */
  rx: number;
  ry: number;
  ox: number;
  oy: number;
  texAspect: number;
  /** Camera position in CITY_CAM space. */
  x: number;
  y: number;
  z: number;
}
/**
 * A slow crane shot over a skyline with depth: the frame pans across the painting while the camera itself
 * moves the same way, so the foreground slides past the skyline and the sky stays put. Kept small, because a
 * single painting has nothing behind its foreground to reveal.
 */
export function skylineShot(t: THREE.Texture, viewAspect: number, time: number, still: boolean): SkylineShot {
  const img = t.image as { width: number; height: number } | undefined;
  const texAspect = img && img.height ? img.width / img.height : 1;
  const zoom = 1.14;
  const rx = Math.min(1, viewAspect / texAspect) / zoom;
  const ry = Math.min(1, texAspect / viewAspect) / zoom;
  const sx = still ? 0 : Math.sin(time * 0.05);
  const sy = still ? 0 : Math.sin(time * 0.033 + 1);
  const push = still ? 0 : 0.5 - 0.5 * Math.cos(time * 0.07);
  const u = 0.5 + sx * 0.4;
  const v = 0.4 + sy * 0.25;
  return { rx, ry, ox: (1 - rx) * u, oy: (1 - ry) * v, texAspect, x: sx * 0.08, y: CITY_CAM.h - sy * 0.03, z: CITY_CAM.d0 - push * 0.3 };
}
/** Slow drift across a painted skyline: the picture covers the view, zoomed in a little so it has room to move. */
export function panCityPaint(t: THREE.Texture, viewAspect: number, time: number, still: boolean): void {
  const img = t.image as { width: number; height: number } | undefined;
  const texAspect = img && img.height ? img.width / img.height : 1;
  const zoom = 1.14;
  const rx = Math.min(1, viewAspect / texAspect) / zoom;
  const ry = Math.min(1, texAspect / viewAspect) / zoom;
  const u = still ? 0.5 : 0.5 + Math.sin(time * 0.05) * 0.5;
  const v = still ? 0.4 : 0.4 + Math.sin(time * 0.033 + 1) * 0.3;
  t.repeat.set(rx, ry);
  t.offset.set((1 - rx) * u, (1 - ry) * v);
}
let started = false;
let enabled = true;

/** Start loading every backdrop (call once at app start). Stages fall back to their coded room until loaded. */
export function preloadBackdrops(): void {
  if (started) return;
  started = true;
  const loader = new THREE.TextureLoader();
  for (const id of [...BACKDROP_IDS, ...COMMUTE_PAINT_IDS, ...ALT_PAINT_IDS, ...CITY_PAINT_IDS.map((c) => `city-${c}`)]) {
    loader.load(`${base}/assets/backdrops/${id}.jpg`, (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.matrixAutoUpdate = true;
      loaded.set(id, t);
    });
  }
  const il = new THREE.ImageLoader();
  for (const id of DEPTH_IDS) {
    il.load(`${base}/assets/backdrops/${id}-depth.png`, (img) => depths.set(id, readDepth(img)));
  }
}

export function setBackdropsEnabled(on: boolean): void {
  enabled = on;
}

export function backdropFor(id: StageId): THREE.Texture | null {
  return enabled ? loaded.get(keyOf(id)) ?? null : null;
}

export interface BackdropFrame {
  /** World height the view covers where the people stand. */
  viewHeight: number;
  /** Where their feet sit on screen, as a fraction up from the bottom. */
  feet: number;
  /** The part of the painting on screen: width and height shown, and where it starts. */
  rx: number;
  ry: number;
  ox: number;
  oy: number;
  texAspect: number;
}

/**
 * Fit a painting to the viewport and say how the camera must sit so people are the right size for the
 * room. `person` is how tall a standing adult should be as a fraction of the painting's height (from the
 * furniture and perspective in it), and `feetFromTop` is where the open foreground floor is. The
 * painting covers the view; on very wide views it stops zooming before people would outgrow the frame,
 * and the sides are filled with a mirrored continuation of the room.
 */
export function fitBackdrop(t: THREE.Texture, viewAspect: number, person = 0.52, feetFromTop = 0.9, focusU = 0.5): BackdropFrame {
  const img = t.image as { width: number; height: number } | undefined;
  const texAspect = img && img.height ? img.width / img.height : 1;
  if (t.wrapS !== THREE.MirroredRepeatWrapping) {
    t.wrapS = THREE.MirroredRepeatWrapping;
    t.needsUpdate = true;
  }
  // Fraction of the painting's height on screen: cover the view, but keep a standing adult within 82% of it.
  const ry = Math.max(Math.min(1, texAspect / viewAspect), Math.min(1, person / 0.82));
  const rx = (ry * viewAspect) / texAspect;
  const feetV = 1 - feetFromTop;
  const oy = Math.max(0, Math.min(1 - ry, feetV - 0.14 * ry));
  t.repeat.set(rx, ry);
  // A view narrower than the painting slides along it to wherever the people are.
  const ox = rx >= 1 ? (1 - rx) / 2 : Math.max(0, Math.min(1 - rx, focusU - rx / 2));
  t.offset.set(ox, oy);
  return { viewHeight: (1.7 * ry) / person, feet: (feetV - oy) / ry, rx, ry, ox, oy, texAspect };
}

/** How tall a standing adult is in this painting, as a fraction of its height. */
export function backdropPerson(id: StageId): number {
  return (META[keyOf(id)] as (BackdropLight & { person?: number }) | undefined)?.person ?? 0.52;
}

/** Light measured from each painting (scripts measure it into src/data/backdrops.json). */
export interface BackdropLight {
  sky: string;
  ground: string;
  key: string;
  /** Overall brightness, 0 to 1. */
  lum: number;
  /** Which side the painting is brighter on: negative left, positive right. */
  side: number;
  floorLum: number;
}
const META = metaRaw as unknown as Record<string, BackdropLight>;

export function backdropLight(id: StageId): BackdropLight | null {
  return META[keyOf(id)] ?? null;
}

/** Narrow paintings (a kitchen aisle, a bus): the widest a row of people can be, in metres, before they overlap the scenery. */
export function backdropMaxSpan(id: StageId): number | null {
  return (META[keyOf(id)] as (BackdropLight & { maxSpan?: number }) | undefined)?.maxSpan ?? null;
}

/**
 * Somewhere to sit in a painting: a sofa, a bench, a row of bus seats. `u` and `v` are where the seat
 * surface is in the image (0 to 1 from the left and from the top), `s` is how big a person is there
 * compared with one standing in the foreground, and `ry` is which way the seat faces (0 toward the
 * viewer, positive toward the right of the picture, pi away from the viewer).
 */
export interface SeatSpot {
  u: number;
  /** Painted seats: where the seat surface is, and how big a person is there (1 = foreground). */
  v?: number;
  s?: number;
  /** Built seats: where the seat meets the painted floor. Its size follows from the painting's perspective. */
  vf?: number;
  ry?: number;
  /** How many people fit, and how far apart they sit in metres. */
  n?: number;
  gap?: number;
  /** 'across': two people facing each other over a table. Default is side by side. */
  layout?: 'row' | 'across';
  /** How far each person turns toward the middle of the seat, in radians. */
  fan?: number;
  /** Furniture to build when the painting has none there. */
  prop?: 'bench' | 'stools' | 'chairs' | 'office' | 'wood' | 'table';
  /** A seat at a desk or table: people typing or eating take it first. */
  desk?: boolean;
}
type SeatMeta = BackdropLight & { seats?: SeatSpot[]; lounge?: boolean; vh?: number; cookAt?: { u: number; vf: number; ry: number } };
/** A service counter in the painting: staff stand behind it (hidden below the counter top), the player in front. */
export interface CounterSpot {
  roles: string[];
  /** Where the counter top is, and how big a person is there (1 = foreground). */
  u: number;
  v: number;
  s: number;
  ry: number;
  cust?: { u: number; vf: number; ry: number };
}
export function backdropCounter(id: StageId): CounterSpot | null {
  return (META[keyOf(id)] as (BackdropLight & { counter?: CounterSpot }) | undefined)?.counter ?? null;
}
/** Background people for this painting: standing spots, or walkers crossing between two points, all on its floor. */
export type ExtraSpot = { u: number; vf: number; ry: number; pose: string } | { walk: [number, number]; vf: number; speed: number };
export function backdropExtras(id: StageId): ExtraSpot[] {
  return ((META[keyOf(id)] as { extras?: ExtraSpot[] } | undefined)?.extras ?? []) as ExtraSpot[];
}
/** Where someone cooking stands in this painting (at its stove), if it has one. */
export function backdropCookSpot(id: StageId): { u: number; vf: number; ry: number } | null {
  return (META[keyOf(id)] as SeatMeta | undefined)?.cookAt ?? null;
}
/** Where the painting's eye level is, as a fraction down from its top: the line its floor recedes toward. */
export function backdropHorizon(id: StageId): number {
  return (META[keyOf(id)] as SeatMeta | undefined)?.vh ?? 0.45;
}
export function backdropSeats(id: StageId): SeatSpot[] {
  return (META[keyOf(id)] as SeatMeta | undefined)?.seats ?? [];
}
/** Scenes where people at rest sit down if there is room (a living room, a bus), not only those whose pose says so. */
export function backdropLounge(id: StageId): boolean {
  return Boolean((META[keyOf(id)] as SeatMeta | undefined)?.lounge);
}

const envCache = new Map<string, THREE.Texture>();

/** The painting itself as the people's ambient light and reflections, so their colours belong to the scene. */
export function backdropEnv(renderer: THREE.WebGLRenderer, id: StageId): THREE.Texture | null {
  const key = keyOf(id);
  const hit = envCache.get(key);
  if (hit) return hit;
  const tex = loaded.get(key);
  if (!tex) return null;
  const eq = tex.clone();
  eq.mapping = THREE.EquirectangularReflectionMapping;
  eq.needsUpdate = true;
  const pm = new THREE.PMREMGenerator(renderer);
  const env = pm.fromEquirectangular(eq).texture;
  pm.dispose();
  eq.dispose();
  envCache.set(key, env);
  return env;
}
