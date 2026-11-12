import * as THREE from 'three';
import { buildStage } from './world/Stage';
import type { StageResult } from './world/Stage';
import { Figure, ROLE_LOOKS, playerLookFor } from './world/Figure';
import type { CastSpec, Pose, Role, StageId } from './engine/types';

/*
  Visual harness.
    ?stage=<id>&roles=player,officer:talk&w=390&h=560&t=2
    ?lineup=<pose>&per=6&from=0&seat=1&cx=&cy=&cz=&ty=      (role lineup)
    ?sheet=airport,cafe,...|all&w=390&h=560&cols=3          (contact sheet of stages)
    ?poses=idle,talk,...&w=260&h=420&cols=6                 (contact sheet of poses, 2 people each)
*/

const ALL: StageId[] = ['airport', 'intl-office', 'classroom', 'lab', 'apartment', 'apartment-night', 'cafe', 'clinic', 'conference', 'festival', 'park', 'library', 'careerfair', 'street', 'bank', 'campus', 'bedroom', 'kitchen', 'club', 'gym', 'rooftop', 'walk'];

const DEFAULT_CAST: Partial<Record<StageId, string>> = {
  airport: 'player,officer',
  'intl-office': 'player,dso',
  classroom: 'player,professor',
  lab: 'player,advisor',
  apartment: 'player,roommate',
  'apartment-night': 'player,parent',
  cafe: 'player,owner',
  clinic: 'player,doctor,nurse',
  conference: 'player,stranger',
  festival: 'player,friend,friend',
  park: 'player,partner',
  library: 'player,friend',
  careerfair: 'player,recruiter',
  street: 'player,friend',
  bank: 'player,teller',
  campus: 'player,friend',
  bedroom: 'player:sleep',
  kitchen: 'player:cook,roommate:laugh',
  club: 'player:dance,friend:dance',
  gym: 'player:exercise,friend:exercise',
  rooftop: 'player:laugh,friend:laugh,roommate',
  walk: 'player:walk,friend:walk',
};

const q = new URLSearchParams(location.search);
const W = Number(q.get('w') ?? 390);
const H = Number(q.get('h') ?? 560);
const palette = ['#ff9f43', '#2ec4b6', '#e63946', '#4361ee'];
const look = playerLookFor({ sex: (q.get('sex') as 'female' | 'male' | 'other') ?? 'female', age: 23, marital: 'single' }, Number(q.get('seed') ?? 4));

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

function parseCast(s: string): CastSpec[] {
  const cast: CastSpec[] = s.split(',').filter(Boolean).map((r) => {
    const [role, pose] = r.split(':');
    const c: CastSpec = { role: role as Role };
    if (pose) c.pose = pose as Pose;
    return c;
  });
  if (!cast.some((c) => c.role === 'player')) cast.unshift({ role: 'player' });
  return cast;
}

interface Built {
  res: StageResult;
  scene: THREE.Scene;
  cam: THREE.PerspectiveCamera;
  meshes: number;
}

function assemble(res: StageResult, w: number, h: number): Built {
  const scene = new THREE.Scene();
  scene.add(res.group);
  scene.background = new THREE.Color(res.background);
  if (res.fog) scene.fog = new THREE.Fog(res.fog.color, res.fog.near, res.fog.far);
  scene.add(new THREE.HemisphereLight(res.ambient.sky, res.ambient.ground, res.ambient.intensity));
  const key = new THREE.DirectionalLight(res.key.color, res.key.intensity);
  key.position.copy(res.key.position);
  scene.add(key);
  const cam = new THREE.PerspectiveCamera(res.camera.fov, w / h, 0.1, 100);
  cam.position.copy(res.camera.position);
  cam.lookAt(res.camera.target);
  let meshes = 0;
  res.group.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) meshes++;
  });
  return { res, scene, cam, meshes };
}

function stageBuilt(id: StageId, castStr: string, w: number, h: number): Built {
  return assemble(buildStage(id, parseCast(castStr), look, palette), w, h);
}

function lineupBuilt(pose: string, w: number, h: number): Built {
  const g = new THREE.Group();
  const figs: Figure[] = [];
  const rl = Object.keys(ROLE_LOOKS) as Role[];
  const per = Number(q.get('per') ?? 6);
  const startI = Number(q.get('from') ?? 0);
  const sel = rl.slice(startI, startI + per);
  sel.forEach((r, i) => {
    const f = new Figure(r === 'player' ? look : ROLE_LOOKS[r]);
    f.group.position.set((i - (sel.length - 1) / 2) * (pose === 'sleep' ? 1.9 : 0.9), 0, 0);
    if (pose === 'sleep') f.group.rotation.y = Math.PI / 2;
    f.setPose((pose === '1' ? 'idle' : pose) as Pose);
    if (q.get('seat')) f.setSeated(true);
    g.add(f.group);
    figs.push(f);
  });
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.MeshStandardMaterial({ color: '#888' }));
  fl.rotation.x = -Math.PI / 2;
  fl.receiveShadow = true;
  g.add(fl);
  const res: StageResult = {
    group: g,
    update: (dt: number, t: number) => figs.forEach((f) => f.update(dt, t)),
    dispose: () => {},
    camera: { position: new THREE.Vector3(Number(q.get('cx') ?? 0), Number(q.get('cy') ?? 1.5), Number(q.get('cz') ?? 3.4)), target: new THREE.Vector3(0, Number(q.get('ty') ?? 1.0), 0), fov: 40 },
    background: '#b9c4d2',
    fog: null,
    ambient: { sky: '#ffffff', ground: '#888888', intensity: 1.5 },
    key: { color: '#ffffff', intensity: 1.8, position: new THREE.Vector3(2, 5, 4) },
  };
  return assemble(res, w, h);
}

const SEATED: Pose[] = ['sit', 'type', 'eat', 'phone'];
function poseCell(pose: Pose, w: number, h: number): Built {
  const g = new THREE.Group();
  const figs: Figure[] = [];
  const looks = [look, ROLE_LOOKS.friend];
  looks.forEach((lk, i) => {
    const f = new Figure(lk);
    f.group.position.set(pose === 'sleep' ? 0 : (i - 0.5) * 0.95, 0, pose === 'sleep' ? (i - 0.5) * 1.1 : 0);
    if (pose === 'sleep') f.group.rotation.y = Math.PI / 2;
    if (SEATED.includes(pose)) f.setSeated(true);
    f.setPose(pose);
    if (SEATED.includes(pose)) {
      const c = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.5), new THREE.MeshStandardMaterial({ color: '#555' }));
      c.position.set(f.group.position.x, 0.4, 0.1);
      g.add(c);
    }
    g.add(f.group);
    figs.push(f);
  });
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.MeshStandardMaterial({ color: '#8d96a3' }));
  fl.rotation.x = -Math.PI / 2;
  fl.receiveShadow = true;
  g.add(fl);
  const sleep = pose === 'sleep';
  const res: StageResult = {
    group: g,
    update: (dt: number, t: number) => figs.forEach((f) => f.update(dt, t)),
    dispose: () => {},
    camera: { position: new THREE.Vector3(0, sleep ? 3.2 : 1.45, sleep ? 2.2 : 3.5), target: new THREE.Vector3(0, sleep ? 0.2 : 0.95, 0), fov: 38 },
    background: '#c3ccd8',
    fog: null,
    ambient: { sky: '#ffffff', ground: '#8a8f99', intensity: 1.4 },
    key: { color: '#fff4e0', intensity: 1.9, position: new THREE.Vector3(2, 5, 4) },
  };
  return assemble(res, w, h);
}

function warm(b: Built, t0: number): number {
  let tt = t0;
  for (let i = 0; i < 60; i++) b.res.update(0.033, (tt += 0.033));
  return tt;
}

const hud = document.getElementById('hud');
const sheet = q.get('sheet');
const posesQ = q.get('poses');
const fixed = q.get('t');

if (sheet || posesQ) {
  const cells: Array<() => Built> = [];
  if (sheet) {
    const ids = sheet === 'all' ? ALL : (sheet.split(',') as StageId[]);
    const castQ = q.get('roles');
    ids.forEach((id) => cells.push(() => stageBuilt(id, castQ ?? DEFAULT_CAST[id] ?? 'player', W, H)));
  } else if (posesQ) {
    (posesQ.split(',') as Pose[]).forEach((p) => cells.push(() => poseCell(p, W, H)));
  }
  const cols = Number(q.get('cols') ?? 3);
  const rows = Math.ceil(cells.length / cols);
  const out = document.createElement('canvas');
  out.width = cols * W;
  out.height = rows * H;
  out.style.display = 'block';
  const g2 = out.getContext('2d');
  document.body.appendChild(out);
  const counts: string[] = [];
  cells.forEach((mk, i) => {
    const b = mk();
    warm(b, fixed ? Number(fixed) : 1);
    renderer.render(b.scene, b.cam);
    g2?.drawImage(renderer.domElement, (i % cols) * W, Math.floor(i / cols) * H);
    counts.push(String(b.meshes));
    b.res.dispose();
  });
  if (hud) hud.textContent = `meshes: ${counts.join(' ')}`;
  (window as unknown as { __meshes: string }).__meshes = counts.join(' ');
} else {
  renderer.domElement.style.display = 'block';
  document.body.appendChild(renderer.domElement);
  const lineup = q.get('lineup');
  const stage = (q.get('stage') ?? 'airport') as StageId;
  const b = lineup ? lineupBuilt(lineup, W, H) : stageBuilt(stage, q.get('roles') ?? DEFAULT_CAST[stage] ?? 'player', W, H);
  if (hud) hud.textContent = `${lineup ? 'lineup' : stage} meshes=${b.meshes}`;
  (window as unknown as { __meshes: number }).__meshes = b.meshes;
  const clock = new THREE.Clock();
  let tt = warm(b, fixed ? Number(fixed) : 0);
  const frame = (): void => {
    const dt = Math.min(0.05, clock.getDelta());
    tt += dt;
    b.res.update(dt, tt);
    renderer.render(b.scene, b.cam);
    requestAnimationFrame(frame);
  };
  frame();
}
