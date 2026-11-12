import * as THREE from 'three';
import type { CityData } from '../engine/data';
import { buildFillBuildings, buildStreetLife } from './Facades';
import { buildCampus, buildLandmarks, cityStyle, landmarkExclusions } from './Landmarks';
import { NEUTRAL_GRADE, Post, type Grade } from './Post';
import { backdropEnv, CITY_CAM, cityDepth, cityPaint, fitBackdrop, paintReady, panCityPaint, setBackdropAlias, skylineShot } from './backdrops';
import { makeRelief } from './relief';
import { loadHdri, pbrMaterial, setMaxAnisotropy, type HdriId } from './pbr';
import { buildSky, buildSkyEnvironment, type SkyHandle } from './Sky';
import type { CastSpec, CityId, CommuteMode, Profile, StageId } from '../engine/types';

type Focus = 'orbit' | 'commute';

/** What the scene needs from a built stage (an interior or street scene with people in it). */
export interface StageHandle {
  group: THREE.Group;
  update(dt: number, time: number): void;
  dispose(): void;
  camera: { position: THREE.Vector3; target: THREE.Vector3; fov: number };
  background: string;
  fog: { color: string; near: number; far: number } | null;
  ambient: { sky: string; ground: string; intensity: number };
  key: { color: string; intensity: number; position: THREE.Vector3 };
  /** A painted backdrop that replaces the coded room. */
  backdrop?: THREE.Texture;
  span?: number;
  /** Painted scenes: a standing adult's height as a fraction of the painting. */
  person?: number;
  ready?: Promise<void>;
  focusU?: number;
  /** Painted scenes: how bright the painting is shown (below 1 for a room with the lights low). */
  dim?: number;
  fit?(m: { half: number; back: number }): void;
  paintCam?: { h: number; d0: number; f: number; vh: number };
  relief?: number;
  anchor?(role: string): THREE.Vector3 | null;
}
export type StageBuilder = (id: StageId, cast: CastSpec[], profile: Profile, variant?: 'movie' | 'call') => StageHandle;

const mix = (a: string, b: string, t: number): THREE.Color => new THREE.Color(a).lerp(new THREE.Color(b), t);

function disposeObject(o: THREE.Object3D): void {
  o.traverse((n) => {
    if (n instanceof THREE.Mesh) n.geometry.dispose();
  });
}

/**
 * A procedural city backdrop: skyline, a home, a campus and a road between them,
 * recoloured per city, with animated commute vehicles for the five modes.
 */
/** The colour look of each scene, and the colour and strength of the rim light that separates people from the background. */
interface Look {
  grade: Grade;
  rim: { color: string; intensity: number };
}
const g = (shadow: [number, number, number], highlight: [number, number, number], sat: number, contrast: number, exposure: number, vignette: number, bloom: number): Grade => ({ shadow, highlight, sat, contrast, exposure, vignette, bloom });
const WARM_ROOM: Look = { grade: g([0.92, 0.97, 1.07], [1.07, 1.0, 0.9], 1.1, 1.09, 1.0, 0.36, 0.42), rim: { color: '#c4d4ff', intensity: 0.28 } };
const OFFICE: Look = { grade: g([0.94, 0.99, 1.05], [1.03, 1.0, 0.96], 0.99, 1.06, 0.97, 0.3, 0.36), rim: { color: '#c4d4ff', intensity: 0.25 } };
const CLEAN: Look = { grade: g([0.95, 1.0, 1.06], [1.0, 1.0, 0.98], 0.96, 1.05, 0.9, 0.28, 0.25), rim: { color: '#d0deff', intensity: 0.2 } };
const GOLDEN: Look = { grade: g([0.94, 0.94, 1.1], [1.12, 1.0, 0.84], 1.14, 1.11, 1.0, 0.4, 0.5), rim: { color: '#ffb784', intensity: 0.5 } };
const DAY: Look = { grade: g([0.95, 0.99, 1.06], [1.05, 1.01, 0.93], 1.1, 1.07, 0.97, 0.3, 0.38), rim: { color: '#dbe6ff', intensity: 0.25 } };
const NIGHT: Look = { grade: g([0.9, 0.95, 1.14], [1.08, 0.98, 0.92], 1.1, 1.12, 1.05, 0.42, 0.5), rim: { color: '#a8c0ff', intensity: 0.35 } };
const CLUB: Look = { grade: g([0.88, 0.94, 1.18], [1.14, 0.94, 1.1], 1.22, 1.16, 1.0, 0.45, 0.75), rim: { color: '#ff7fd8', intensity: 0.6 } };
const AIRPORT: Look = { grade: g([0.9, 0.97, 1.1], [1.08, 1.0, 0.9], 1.02, 1.13, 0.98, 0.38, 0.4), rim: { color: '#b8cdff', intensity: 0.35 } };
const CITY_LOOK: Look = { grade: NEUTRAL_GRADE, rim: { color: '#ffffff', intensity: 0 } };
const STAGE_LOOK: Partial<Record<StageId, Look>> = {
  apartment: WARM_ROOM, kitchen: WARM_ROOM, cafe: WARM_ROOM, 'apartment-night': NIGHT, bedroom: NIGHT,
  'intl-office': OFFICE, classroom: OFFICE, library: OFFICE, bank: OFFICE, lab: OFFICE, careerfair: OFFICE, conference: OFFICE, gym: OFFICE,
  clinic: CLEAN, airport: AIRPORT, club: CLUB,
  campus: DAY, park: DAY, street: DAY, festival: GOLDEN, rooftop: GOLDEN, walk: GOLDEN,
  court: CLEAN, uscis: CLEAN, legal: OFFICE, workplace: OFFICE, shelter: NIGHT, worksite: WARM_ROOM,
};

const STAGE_ENV: Partial<Record<StageId, { id: HdriId; intensity: number }>> = {
  campus: { id: 'kloofendal_48d_partly_cloudy_puresky', intensity: 0.25 },
  park: { id: 'kloofendal_48d_partly_cloudy_puresky', intensity: 0.27 },
  festival: { id: 'venice_sunset', intensity: 0.25 },
  street: { id: 'kloofendal_48d_partly_cloudy_puresky', intensity: 0.23 },
  rooftop: { id: 'belfast_sunset_puresky', intensity: 0.25 },
  walk: { id: 'venice_sunset', intensity: 0.23 },
  'apartment-night': { id: 'moonless_golf', intensity: 0.20 },
  bedroom: { id: 'moonless_golf', intensity: 0.18 },
  club: { id: 'moonless_golf', intensity: 0.14 },
  airport: { id: 'aft_lounge', intensity: 0.23 },
  apartment: { id: 'aft_lounge', intensity: 0.23 },
  kitchen: { id: 'aft_lounge', intensity: 0.23 },
  cafe: { id: 'aft_lounge', intensity: 0.23 },
  'intl-office': { id: 'aft_lounge', intensity: 0.20 },
  classroom: { id: 'aft_lounge', intensity: 0.20 },
  lab: { id: 'aft_lounge', intensity: 0.18 },
  clinic: { id: 'aft_lounge', intensity: 0.20 },
  conference: { id: 'aft_lounge', intensity: 0.23 },
  library: { id: 'aft_lounge', intensity: 0.18 },
  careerfair: { id: 'aft_lounge', intensity: 0.23 },
  bank: { id: 'aft_lounge', intensity: 0.20 },
  gym: { id: 'aft_lounge', intensity: 0.20 },
};

export class CityScene {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(48, 1, 0.5, 600);
  private readonly world = new THREE.Group();
  private readonly traveler = new THREE.Group();
  private readonly hemi = new THREE.HemisphereLight('#ffffff', '#223', 1.1);
  private readonly sun = new THREE.DirectionalLight('#ffd9a0', 1.9);
  private readonly curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-22, 0, 8),
    new THREE.Vector3(-10, 0, 5),
    new THREE.Vector3(0, 0, -1),
    new THREE.Vector3(10, 0, -5),
    new THREE.Vector3(22, 0, 0),
  ]);

  private focus: Focus = 'orbit';
  private angle = 0.6;
  private progress = 0;
  private playing = false;
  private resolvePlay: (() => void) | null = null;
  private playMs = 3500;
  private playStart = 0;
  private mode: CommuteMode = 'transit';
  private reduced = false;
  private raf = 0;
  private last = 0;
  private cityId: CityId | null = null;
  private groundMat = new THREE.MeshStandardMaterial({ color: '#1a2236', roughness: 0.95 });
  private snow = 0;
  private observer: ResizeObserver | null = null;
  private sky: SkyHandle | null = null;
  /** The painted skyline raised into 3D, for the city on screen. */
  private skyline: THREE.Mesh | null = null;
  private envTex: THREE.Texture | null = null;
  private post: Post;
  private readonly rim = new THREE.DirectionalLight('#ffffff', 0);
  private qualityFrames = 0;
  private qualityTime = 0;
  private stage: StageHandle | null = null;
  private stageEnvToken = 0;
  private stageBuilder: StageBuilder | null = null;
  private view: 'city' | 'stage' = 'city';
  private cityLook = {
    sky: new THREE.Color('#ffffff'),
    ground: new THREE.Color('#223344'),
    hemi: 1.1,
    sun: 1.9,
    background: new THREE.Color('#0a1030') as THREE.Color | THREE.Texture,
    fog: new THREE.Fog('#1b2440', 55, 190),
  };

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    // A person on a video call is cut to the edges of the call window.
    this.renderer.localClippingEnabled = true;
    // Phones have dense screens and small GPUs: cap the sharpness there so frames stay smooth.
    const phone = window.matchMedia('(pointer: coarse)').matches;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, phone ? 1.5 : 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    setMaxAnisotropy(this.renderer.capabilities.getMaxAnisotropy());
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.scene.add(this.hemi, this.sun, this.rim, this.rim.target, this.world, this.traveler);
    this.post = new Post(this.renderer, this.scene, this.camera);
    if (phone) this.post.setQuality('mid');
    this.sun.position.set(-30, 40, 20);
    this.camera.position.set(34, 14, 20);
    this.setCommute('transit');
    this.resize();
    window.addEventListener('resize', this.onResize);
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(canvas);
  }

  private readonly onResize = (): void => this.resize();

  resize(): void {
    const w = Math.max(1, this.canvas.clientWidth);
    const h = Math.max(1, this.canvas.clientHeight);
    this.renderer.setSize(w, h, false);

    this.post.setSize(w, h);
    this.applyLayout();
  }

  /** The canvas now has its own area, so the camera simply follows the canvas aspect. */
  private applyLayout(): void {
    const w = Math.max(1, this.canvas.clientWidth);
    const h = Math.max(1, this.canvas.clientHeight);
    this.camera.clearViewOffset();
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  setReducedMotion(on: boolean): void {
    this.reduced = on;
  }

  private paused = false;
  private pausedAt = 0;
  /** Scene time in seconds; it stands still while the game is paused. */
  private clockT = 0;

  /** Freeze everything on screen (people, camera, the commute) or carry on from the same moment. */
  setPaused(on: boolean): void {
    if (on === this.paused) return;
    this.paused = on;
    if (on) this.pausedAt = performance.now();
    else this.playStart += performance.now() - this.pausedAt;
  }

  start(): void {
    this.last = performance.now();
    const tick = (t: number): void => {
      const dt = this.paused ? 0 : Math.min(0.05, (t - this.last) / 1000);
      this.last = t;
      this.clockT += dt;
      this.update(dt, this.clockT);
      this.post.render(dt);
      this.adaptQuality(dt);
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
    (window as unknown as { __scene?: CityScene }).__scene = this;
  }

  dispose(): void {
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.onResize);
    this.observer?.disconnect();
    this.post.dispose();
    this.sky?.dispose();
    this.envTex?.dispose();
    disposeObject(this.world);
    this.renderer.dispose();
  }

  setFocus(f: Focus): void {
    this.focus = f;
  }

  /** Calendar month 0 to 11; tints the ground and light for the season. */
  setMonth(calendarMonth: number): void {
    const winter = [11, 0, 1].includes(calendarMonth);
    const summer = [5, 6, 7].includes(calendarMonth);
    this.snow = winter ? 0.55 : [10, 2].includes(calendarMonth) ? 0.2 : 0;
    this.sun.color.set(summer ? '#ffd28a' : winter ? '#cfe4ff' : '#ffe2b5');
    this.sun.intensity = summer ? 2.1 : winter ? 1.5 : 1.8;
    this.applyGround();
  }

  private baseGround = new THREE.Color('#1a2236');
  private applyGround(): void {
    this.groundMat.color.copy(this.baseGround).lerp(new THREE.Color('#dfe8f5'), this.snow);
  }

  setCommute(mode: CommuteMode): void {
    this.mode = mode;
    this.traveler.clear();
    const mat = (c: string, e = 0): THREE.MeshStandardMaterial =>
      new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, metalness: 0.2, emissive: new THREE.Color(c).multiplyScalar(e) });
    const person = (y = 0): THREE.Group => {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.7, 4, 8), mat('#f4a261'));
      body.position.y = y + 1.1;
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 8), mat('#d9a27a'));
      head.position.y = y + 1.85;
      const pack = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.25), mat('#2a9d8f'));
      pack.position.set(0, y + 1.3, 0.3);
      g.add(body, head, pack);
      return g;
    };
    const box = (w: number, h: number, d: number, c: string, e = 0): THREE.Mesh => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c, e));
    if (mode === 'walk') {
      this.traveler.add(person());
    } else if (mode === 'bike') {
      const p = person(0.45);
      this.traveler.add(p);
      for (const z of [-0.7, 0.7]) {
        const w = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.06, 6, 16), mat('#222'));
        w.rotation.y = Math.PI / 2;
        w.position.set(0, 0.5, z);
        this.traveler.add(w);
      }
    } else if (mode === 'transit') {
      const body = box(2.6, 2.4, 9, '#2a6f97');
      body.position.y = 1.6;
      const stripe = box(2.62, 0.4, 9.02, '#f2cc8f', 0.4);
      stripe.position.y = 1.1;
      const windows = box(2.64, 0.7, 8.4, '#9fd3ff', 0.6);
      windows.position.y = 2.2;
      this.traveler.add(body, stripe, windows);
    } else if (mode === 'car') {
      const body = box(2.1, 0.8, 4.4, '#e63946');
      body.position.y = 0.8;
      const cabin = box(1.8, 0.7, 2.2, '#1d3557');
      cabin.position.set(0, 1.5, 0.2);
      this.traveler.add(body, cabin);
    } else {
      const body = box(2.1, 0.8, 4.4, '#222831');
      body.position.y = 0.8;
      const cabin = box(1.8, 0.7, 2.2, '#393e46');
      cabin.position.set(0, 1.5, 0.2);
      const sign = box(0.9, 0.18, 0.4, '#ffd23f', 1);
      sign.position.set(0, 1.95, 0.2);
      this.traveler.add(body, cabin, sign);
    }
    this.placeTraveler(this.progress);
  }

  /** Animate the traveler from home to campus. Resolves when it arrives. */
  playCommute(ms = 3500, profile?: Profile): Promise<void> {
    // Painted trip: the traveller, as themselves, in a scene for how they get around.
    const paint = this.mode === 'walk' ? null : `commute-${this.mode}`;
    const base: StageId = this.mode === 'walk' ? 'walk' : 'street';
    if (profile && this.stageBuilder && paintReady(paint ?? 'walk')) {
      const pose = this.mode === 'walk' ? 'walk' : this.mode === 'rideshare' || this.mode === 'transit' ? 'phone' : 'idle';
      this.showStage(base, [{ role: 'player', pose }], profile, paint ?? undefined);
      if (this.view === 'stage') return new Promise((resolve) => window.setTimeout(resolve, this.reduced ? 600 : ms));
    }
    this.showCity();
    this.progress = 0;
    this.playMs = this.reduced ? 600 : ms;
    this.playStart = performance.now();
    this.playing = true;
    this.focus = 'commute';
    return new Promise((resolve) => {
      this.resolvePlay = resolve;
    });
  }

  private placeTraveler(t: number): void {
    const p = this.curve.getPointAt(Math.min(1, Math.max(0, t)));
    const tan = this.curve.getTangentAt(Math.min(1, Math.max(0, t)));
    const bob = this.mode === 'walk' || this.mode === 'bike' ? Math.abs(Math.sin(t * 90)) * 0.12 : 0;
    this.traveler.position.set(p.x, bob, p.z);
    this.traveler.rotation.y = Math.atan2(tan.x, tan.z);
  }

  // ---------- stages ----------

  setStageBuilder(builder: StageBuilder): void {
    this.stageBuilder = builder;
  }

  /** Show a setting with people in it. Falls back to the city view if no builder is plugged in. */
  showStage(id: StageId, cast: CastSpec[], profile: Profile, paint?: string, variant?: 'movie' | 'call'): void {
    if (!this.stageBuilder) {
      this.showCity();
      return;
    }
    // An officer at the airport means the arrival inspection: stage it at a passport booth, not in the concourse.
    if (!paint && id === 'airport' && cast.some((c) => c.role === 'officer') && paintReady('airport-booth')) paint = 'airport-booth';
    setBackdropAlias(paint ? id : null, paint);
    try {
      this.buildAndShowStage(id, cast, profile, variant);
    } finally {
      setBackdropAlias(null);
    }
  }

  private buildAndShowStage(id: StageId, cast: CastSpec[], profile: Profile, variant?: 'movie' | 'call'): void {
    if (!this.stageBuilder) return;
    this.clearStage();
    let stage: StageHandle;
    try {
      stage = this.stageBuilder(id, cast, profile, variant);
    } catch (err) {
      console.error('Stage failed to build', id, err);
      this.showCity();
      return;
    }
    this.stage = stage;
    // Everyone walks on together: the people stay hidden until the whole group has loaded.
    if (stage.ready) {
      stage.group.visible = false;
      void stage.ready.then(() => (stage.group.visible = true));
    }
    this.view = 'stage';
    this.world.visible = false;
    this.traveler.visible = false;
    if (this.sky) this.sky.group.visible = false;
    this.scene.environment = null;
    const paintedEnv = stage.backdrop ? backdropEnv(this.renderer, id) : null;
    if (paintedEnv) {
      this.stageEnvToken++;
      this.scene.environment = paintedEnv;
      this.scene.environmentIntensity = 0.6;
    } else {
      this.applyStageEnv(id);
    }
    this.scene.add(stage.group);
    this.scene.backgroundIntensity = stage.dim ?? 1;
    if (stage.backdrop) {
      this.scene.background = stage.backdrop;
    } else {
      this.scene.background = new THREE.Color(stage.background);
    }
    this.scene.fog = stage.fog ? new THREE.Fog(stage.fog.color, stage.fog.near, stage.fog.far) : null;
    this.hemi.color.set(stage.ambient.sky);
    this.hemi.groundColor.set(stage.ambient.ground);
    this.hemi.intensity = stage.ambient.intensity;
    this.sun.color.set(stage.key.color);
    this.sun.intensity = stage.key.intensity;
    this.sun.position.copy(stage.key.position);
    this.camera.fov = stage.camera.fov;
    this.camera.position.copy(stage.camera.position);
    this.camera.lookAt(stage.camera.target);
    this.applyLook(STAGE_LOOK[id] ?? OFFICE, stage.camera.position, stage.camera.target);
    // A painting already carries its own soft shadowing; skipping the extra pass saves a full redraw of everyone.
    if (stage.backdrop) this.post.setAO(false);
    this.applyLayout();
  }

  /** Colour grade, ambient occlusion and a rim light placed behind the subjects, opposite the camera. */
  private applyLook(look: Look, camPos: THREE.Vector3 | null, target: THREE.Vector3 | null): void {
    this.post.setGrade(look.grade);
    this.post.setAO(camPos !== null);
    this.qualityFrames = 0;
    this.qualityTime = 0;
    if (camPos && target) {
      const dir = new THREE.Vector3().subVectors(target, camPos).setY(0).normalize();
      const side = new THREE.Vector3(-dir.z, 0, dir.x);
      this.rim.position.copy(target).addScaledVector(dir, 9).addScaledVector(side, 3).add(new THREE.Vector3(0, 5.5, 0));
      this.rim.target.position.copy(target);
      this.rim.color.set(look.rim.color);
      this.rim.intensity = look.rim.intensity;
    } else {
      this.rim.intensity = 0;
    }
  }

  /** Real HDRI lighting for the stage: bright sky for outdoor scenes, a lounge interior for rooms, dusk or night for evenings. */
  private applyStageEnv(id: StageId): void {
    const pick = STAGE_ENV[id] ?? { id: 'aft_lounge' as HdriId, intensity: 0.22 };
    const token = ++this.stageEnvToken;
    loadHdri(this.renderer, pick.id)
      .then((env) => {
        if (token !== this.stageEnvToken || this.view !== 'stage') return;
        this.scene.environment = env;
        this.scene.environmentIntensity = pick.intensity;
      })
      .catch(() => undefined);
  }

  /** Back to the city backdrop (menus, commute, summary). */
  showCity(): void {
    this.stageEnvToken++;
    this.clearStage();
    if (this.view === 'city') return;
    this.view = 'city';
    this.world.visible = true;
    this.traveler.visible = true;
    if (this.sky) this.sky.group.visible = true;
    if (this.envTex) {
      this.scene.environment = this.envTex;
      this.scene.environmentIntensity = 0.45;
    }
    this.scene.backgroundIntensity = 1;
    this.scene.background = this.cityLook.background;
    this.scene.fog = this.cityLook.fog;
    this.applyLook(CITY_LOOK, null, null);
    this.hemi.color.copy(this.cityLook.sky);
    this.hemi.groundColor.copy(this.cityLook.ground);
    this.hemi.intensity = this.cityLook.hemi;
    this.sun.intensity = this.cityLook.sun;
    this.sun.position.set(-30, 40, 20);
    this.camera.fov = 48;
    this.applyLayout();
  }

  /** Work done to draw one frame (for performance checks): draw calls, triangles, skinned people, quality tier. */
  frameStats(): { calls: number; triangles: number; textures: number; geometries: number; tier: string; pixels: number } {
    const info = this.renderer.info;
    info.autoReset = false;
    info.reset();
    this.post.render(0);
    const out = { calls: info.render.calls, triangles: info.render.triangles, textures: info.memory.textures, geometries: info.memory.geometries, tier: this.post.tier, pixels: this.canvas.width * this.canvas.height };
    info.autoReset = true;
    return out;
  }

  /** Steps quality down (ambient occlusion first, then all post-processing) if frames run slow. Never steps back up. */
  private adaptQuality(dt: number): void {
    if (this.post.tier === 'low') return;
    this.qualityFrames += 1;
    this.qualityTime += dt;
    if (this.qualityFrames < 120) return;
    const avg = this.qualityTime / this.qualityFrames;
    this.qualityFrames = 0;
    this.qualityTime = 0;
    if (avg > 0.034) this.post.setQuality(this.post.tier === 'high' ? 'mid' : 'low');
  }

  private dropSkyline(): void {
    if (!this.skyline) return;
    this.scene.remove(this.skyline);
    this.skyline.geometry.dispose();
    const m = this.skyline.material as THREE.MeshBasicMaterial;
    m.map?.dispose();
    m.dispose();
    this.skyline = null;
    // The skyline shot bends the projection; give the coded city its normal lens back.
    this.applyLayout();
  }

  private clearStage(): void {
    if (!this.stage) return;
    this.scene.remove(this.stage.group);
    this.stage.dispose();
    this.stage = null;
  }

  // ---------- city building ----------

  setCity(city: CityData): void {
    if (this.cityId === city.id) return;
    this.cityId = city.id;
    this.dropSkyline();
    this.world.traverse((o) => {
      if (o instanceof THREE.Mesh) o.geometry.dispose();
    });
    this.world.clear();
    if (this.sky) {
      this.scene.remove(this.sky.group);
      this.sky.dispose();
    }
    this.envTex?.dispose();

    const st = cityStyle(city.id);
    const accent = mix(city.palette[2] ?? '#ffb36b', '#ffb36b', 0.35);
    this.baseGround = new THREE.Color(st.ground);
    const bg = new THREE.Color(st.fog);
    this.scene.background = bg;
    this.scene.fog = new THREE.Fog(st.fog, st.fogNear, st.fogFar);
    this.hemi.color.copy(mix(st.skyHorizon, '#ffffff', 0.55));
    this.hemi.groundColor.copy(mix(st.ground, '#101522', 0.5));
    this.sun.color.set(st.sunColor);
    this.cityLook.sky.copy(this.hemi.color);
    this.cityLook.ground.copy(this.hemi.groundColor);
    this.cityLook.hemi = this.hemi.intensity;
    this.cityLook.sun = this.sun.intensity;
    this.cityLook.background = bg;
    this.cityLook.fog = this.scene.fog as THREE.Fog;
    this.applyGround();

    this.sky = buildSky(st);
    this.sky.group.visible = this.view === 'city';
    this.scene.add(this.sky.group);
    this.envTex = buildSkyEnvironment(this.renderer, st);
    if (this.view === 'city') {
      this.scene.environment = this.envTex;
      this.scene.environmentIntensity = 0.45;
    }

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), this.groundMat);
    ground.rotation.x = -Math.PI / 2;
    this.world.add(ground);
    this.world.add(this.roadMesh());
    this.world.add(this.siteHome());
    const campus = buildCampus(city.id);
    campus.position.set(24, 0, -4);
    this.world.add(campus);

    this.world.add(buildFillBuildings(city.id, st, accent, landmarkExclusions(city.id)));
    this.world.add(buildStreetLife(city.id, st, accent));
    this.world.add(buildLandmarks(city.id));
  }

  private roadMesh(): THREE.Object3D {
    const g = new THREE.Group();
    const pts = this.curve.getSpacedPoints(80);
    const pos: number[] = [];
    const uv: number[] = [];
    let run = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      const d = new THREE.Vector3().subVectors(b, a).normalize();
      const n = new THREE.Vector3(-d.z, 0, d.x).multiplyScalar(2.2);
      const verts = [
        a.clone().add(n), a.clone().sub(n), b.clone().add(n),
        b.clone().add(n), a.clone().sub(n), b.clone().sub(n),
      ];
      for (const v of verts) pos.push(v.x, 0.05, v.z);
      const v0 = run / 4;
      run += a.distanceTo(b);
      const v1 = run / 4;
      uv.push(0, v0, 1, v0, 0, v1, 0, v1, 1, v0, 1, v1);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.computeVertexNormals();
    const asphalt = pbrMaterial('asphalt_02', { color: '#8d93a6', repeat: [1, 1], roughness: 0.95 }).clone();
    asphalt.side = THREE.DoubleSide;
    g.add(new THREE.Mesh(geo, asphalt));
    const dashMat = new THREE.MeshBasicMaterial({ color: '#e9d8a6' });
    const dashGeo = new THREE.BoxGeometry(0.2, 0.05, 1.2);
    for (let i = 2; i < pts.length - 2; i += 3) {
      const m = new THREE.Mesh(dashGeo, dashMat);
      m.position.set(pts[i].x, 0.09, pts[i].z);
      const nx = pts[i + 1].x - pts[i].x;
      const nz = pts[i + 1].z - pts[i].z;
      m.rotation.y = Math.atan2(nx, nz);
      g.add(m);
    }
    return g;
  }

  private siteHome(): THREE.Object3D {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(5, 3.6, 4.5), new THREE.MeshStandardMaterial({ color: '#e9c46a', roughness: 0.7 }));
    body.position.y = 1.8;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(4, 2, 4), new THREE.MeshStandardMaterial({ color: '#9c4a3b', roughness: 0.8 }));
    roof.position.y = 4.6;
    roof.rotation.y = Math.PI / 4;
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.7, 0.1), new THREE.MeshBasicMaterial({ color: '#ffd9a0' }));
    door.position.set(0, 0.9, 2.3);
    g.add(body, roof, door);
    g.position.set(-24, 0, 14);
    return g;
  }

  // ---------- per-frame ----------

  private update(dt: number, time: number): void {
    if (this.view === 'stage' && this.stage) {
      if (this.skyline) this.skyline.visible = false;
      this.stage.update(dt, time);
      const c = this.stage.camera;
      const sway = this.reduced ? 0 : 1;
      if (this.stage.backdrop) {
        // The painting sets the scale: the camera sits so people are the size the room's furniture implies,
        // with their feet on its foreground floor, whatever shape the view is.
        const fr = fitBackdrop(this.stage.backdrop, this.camera.aspect, this.stage.person ?? 0.52, 0.9, this.stage.focusU ?? 0.5);
        const half = (fr.viewHeight * this.camera.aspect) / 2;
        // If the standing group is wider than the view, they stand a little further into the room.
        const back = Math.max(1, Math.min(1.3, (this.stage.span ?? 0) / Math.max(0.05, half)));
        this.stage.fit?.({ half: fr.rx / 2, back });
        const pc = this.stage.paintCam ?? { h: 1.4, d0: 3.4, f: 1.1, vh: 0.45 };
        // A level camera at the painting's eye height, with the lens shifted so the painting's horizon and
        // the part of it on screen line up exactly with what the 3D camera sees.
        // A painting with depth lets the camera drift slowly, so the room opens up around the people.
        const drift = (this.stage.relief ?? 0) * sway;
        this.camera.position.set(Math.sin(time * 0.19) * 0.16 * drift, pc.h + Math.sin(time * 0.13 + 1) * 0.04 * drift, pc.d0 - (0.5 - 0.5 * Math.cos(time * 0.09)) * 0.25 * drift);
        this.camera.quaternion.identity();
        const n = this.camera.near;
        const fa = this.camera.far;
        const mid = fr.ox + fr.rx / 2;
        this.camera.projectionMatrix.set(
          (2 * pc.f) / (fr.rx * fr.texAspect), 0, (-2 * (0.5 - mid)) / fr.rx, 0,
          0, (2 * pc.f) / fr.ry, (-2 * (1 - pc.vh - fr.oy - fr.ry / 2)) / fr.ry, 0,
          0, 0, -(fa + n) / (fa - n), (-2 * fa * n) / (fa - n),
          0, 0, -1, 0,
        );
        this.camera.projectionMatrixInverse.copy(this.camera.projectionMatrix).invert();
        return;
      }
      this.camera.position.set(c.position.x + Math.sin(time * 0.25) * 0.12 * sway, c.position.y + Math.sin(time * 0.31) * 0.05 * sway, c.position.z);
      this.camera.lookAt(c.target);
      return;
    }
    // A painted skyline replaces the coded city when one exists for this city.
    const paint = cityPaint(this.cityId);
    if (!paint) this.dropSkyline();
    let shotSet = false;
    if (paint) {
      if (this.scene.background !== paint) {
        this.scene.background = paint;
        this.scene.fog = null;
        this.world.visible = false;
        this.traveler.visible = false;
        if (this.sky) this.sky.group.visible = false;
      }
      const depth = cityDepth(this.cityId);
      if (depth && !this.skyline) {
        const img = paint.image as { width: number; height: number };
        this.skyline = makeRelief(paint, depth, CITY_CAM, img.width / img.height);
        this.scene.add(this.skyline);
      }
      if (this.skyline) {
        // With depth, the camera itself glides, so the near rooftops and trees slide past the skyline.
        this.skyline.visible = true;
        const s = skylineShot(paint, this.camera.aspect, time, this.reduced);
        this.camera.position.set(s.x, s.y, s.z);
        this.camera.quaternion.identity();
        const n = this.camera.near;
        const fa = this.camera.far;
        const f = CITY_CAM.f;
        this.camera.projectionMatrix.set(
          (2 * f) / (s.rx * s.texAspect), 0, (-2 * (0.5 - (s.ox + s.rx / 2))) / s.rx, 0,
          0, (2 * f) / s.ry, (-2 * (1 - CITY_CAM.vh - s.oy - s.ry / 2)) / s.ry, 0,
          0, 0, -(fa + n) / (fa - n), (-2 * fa * n) / (fa - n),
          0, 0, -1, 0,
        );
        this.camera.projectionMatrixInverse.copy(this.camera.projectionMatrix).invert();
        shotSet = true;
      } else {
        panCityPaint(paint, this.camera.aspect, time, this.reduced);
      }
    } else if (this.sky) {
      this.sky.update(dt, time);
      this.sky.follow(this.camera);
    }
    if (this.playing) {
      const t = ((this.paused ? this.pausedAt : performance.now()) - this.playStart) / this.playMs;
      this.progress = Math.min(1, t);
      this.placeTraveler(this.progress);
      if (t >= 1) {
        this.playing = false;
        const done = this.resolvePlay;
        this.resolvePlay = null;
        done?.();
      }
    }
    if (shotSet) return;
    if (this.focus === 'orbit') {
      if (!this.reduced) this.angle += dt * 0.1;
      const a = Math.sin(this.angle) * 0.45;
      const target = new THREE.Vector3(Math.sin(a) * 58, 20 + Math.sin(time * 0.3) * 0.5, 62 + (1 - Math.cos(a)) * 8);
      this.camera.position.lerp(target, Math.min(1, dt * 2));
      this.camera.lookAt(0, 17, -70);
    } else {
      const p = this.traveler.position;
      const offsets: Record<CommuteMode, [number, number, number]> = {
        walk: [-4.5, 2.8, 6.5],
        bike: [-5, 3.2, 7.5],
        transit: [-15, 7, 20],
        car: [-9, 4.6, 13],
        rideshare: [-9, 4.6, 13],
      };
      const [ox, oy, oz] = offsets[this.mode];
      const back = new THREE.Vector3(ox, oy, oz).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.traveler.rotation.y);
      const target = new THREE.Vector3(p.x + back.x, p.y + back.y, p.z + back.z);
      this.camera.position.lerp(target, Math.min(1, dt * 3));
      this.camera.lookAt(p.x, p.y + (this.mode === 'transit' ? 2 : 1.4), p.z);
    }
  }

  /** Where a person with this role stands on screen (above their head), in CSS pixels within the canvas. */
  screenOf(role: string): { x: number; y: number } | null {
    const p = this.view === 'stage' ? this.stage?.anchor?.(role) : null;
    if (!p) return null;
    p.project(this.camera);
    if (p.z > 1 || p.z < -1) return null;
    return { x: ((p.x + 1) / 2) * this.canvas.clientWidth, y: ((1 - p.y) / 2) * this.canvas.clientHeight };
  }

  get ready(): boolean {
    return this.cityId !== null;
  }
}
