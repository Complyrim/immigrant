import * as THREE from 'three';
import type { CityId } from './engine/types';
import { buildCampus, buildLandmarks, cityStyle, landmarkExclusions } from './world/Landmarks';
import { buildFillBuildings, buildStreetLife } from './world/Facades';
import { buildSky, buildSkyEnvironment } from './world/Sky';
import { Post } from './world/Post';

const qs = new URLSearchParams(location.search);
const id = (qs.get('city') ?? 'nyc') as CityId;
const usePost = qs.get('post') !== '0';
const W = parseInt(qs.get('w') ?? '', 10) || window.innerWidth;
const H = parseInt(qs.get('h') ?? '', 10) || window.innerHeight;
const fixedT = qs.get('t');
const st = cityStyle(id);

const canvas = document.getElementById('c') as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
canvas.style.width = `${W}px`;
canvas.style.height = `${H}px`;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled = false;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(st.fog, st.fogNear, st.fogFar);
const camera = new THREE.PerspectiveCamera(48, W / H, 0.5, 600);
camera.position.set(0, 20, 62);

const hemi = new THREE.HemisphereLight(new THREE.Color(st.skyHorizon).lerp(new THREE.Color('#ffffff'), 0.55), new THREE.Color(st.ground).lerp(new THREE.Color('#101522'), 0.5), 1.1);
const sun = new THREE.DirectionalLight(st.sunColor, 1.9);
sun.position.set(-30, 40, 20);
scene.add(hemi, sun);

const sky = buildSky(st);
scene.add(sky.group);
scene.environment = buildSkyEnvironment(renderer, st);
scene.environmentIntensity = 0.45;

const ground = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), new THREE.MeshStandardMaterial({ color: st.ground, roughness: 0.95 }));
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

const curve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-22, 0, 8), new THREE.Vector3(-10, 0, 5), new THREE.Vector3(0, 0, -1), new THREE.Vector3(10, 0, -5), new THREE.Vector3(22, 0, 0),
]);
const pts = curve.getSpacedPoints(80);
const pos: number[] = [];
for (let i = 0; i < pts.length - 1; i++) {
  const a = pts[i], b = pts[i + 1];
  const d = new THREE.Vector3().subVectors(b, a).normalize();
  const n = new THREE.Vector3(-d.z, 0, d.x).multiplyScalar(4.6);
  for (const v of [a.clone().add(n), a.clone().sub(n), b.clone().add(n), b.clone().add(n), a.clone().sub(n), b.clone().sub(n)]) pos.push(v.x, 0.05, v.z);
}
const rg = new THREE.BufferGeometry();
rg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
rg.computeVertexNormals();
scene.add(new THREE.Mesh(rg, new THREE.MeshStandardMaterial({ color: '#232733', roughness: 0.85, side: THREE.DoubleSide })));

const homeM = new THREE.Mesh(new THREE.BoxGeometry(5, 3.6, 4.5), new THREE.MeshStandardMaterial({ color: '#e9c46a' }));
homeM.position.set(-24, 1.8, 14);
scene.add(homeM);

const accent = new THREE.Color('#ffb36b');
const t0 = performance.now();
const fill = buildFillBuildings(id, st, accent, landmarkExclusions(id));
const tFill = performance.now() - t0;
const life = buildStreetLife(id, st, accent);
scene.add(fill, life);
scene.add(buildLandmarks(id));
const campus = buildCampus(id);
campus.position.set(24, 0, -4);
scene.add(campus);
const cb = new THREE.Box3().setFromObject(campus);

let tris = 0;
let calls = 0;
for (const grp of [fill, life]) {
  grp.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      calls++;
      const g = o.geometry as THREE.BufferGeometry;
      tris += g.index ? g.index.count / 3 : (g.getAttribute('position')?.count ?? 0) / 3;
    }
  });
}

const post = new Post(renderer, scene, camera);
post.setSize(W, H);
post.setQuality(usePost ? 'high' : 'low');

const hud = document.getElementById('hud');
let frames = 0;
let acc = 0;
let last = performance.now();
let ft = 0;
function tick(t: number): void {
  const dt = Math.min(0.05, (t - last) / 1000);
  last = t;
  const time = fixedT !== null ? parseFloat(fixedT) : t / 1000;
  const a = Math.sin(time * 0.1 * 6 + 0.6) * 0.45;
  camera.position.set(Math.sin(a) * 58, 20 + Math.sin(time * 0.3) * 0.5, 62 + (1 - Math.cos(a)) * 8);
  if (fixedT !== null) camera.position.set(0, 20, 62);
  camera.lookAt(0, 17, -70);
  sky.follow(camera);
  sky.update(dt, time);
  post.render(dt);
  frames++;
  acc += dt;
  ft = ft * 0.9 + dt * 100;
  if (hud && acc > 0.5) {
    hud.textContent = `${id} post=${usePost ? 1 : 0}  fillTris=${Math.round(tris)} calls=${calls} build=${tFill.toFixed(0)}ms  ${(frames / acc).toFixed(0)}fps  campus x:${cb.min.x.toFixed(0)}..${cb.max.x.toFixed(0)} z:${cb.min.z.toFixed(0)}..${cb.max.z.toFixed(0)}`;
    frames = 0;
    acc = 0;
  }
  void ft;
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
(window as unknown as { __info: unknown }).__info = { tris, calls };
