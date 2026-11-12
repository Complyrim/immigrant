import * as THREE from 'three';
import type { CityId } from './engine/types';
import { buildCampus, buildLandmarks, cityStyle } from './world/Landmarks';

const qs = new URLSearchParams(location.search);
const id = (qs.get('city') ?? 'nyc') as CityId;
const fixed = qs.get('angle');
const st = cityStyle(id);

const canvas = document.getElementById('c') as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(1);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
const scene = new THREE.Scene();

const sky = document.createElement('canvas');
sky.width = 4;
sky.height = 256;
const sg = sky.getContext('2d');
if (sg) {
  const gr = sg.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, st.skyTop);
  gr.addColorStop(0.75, st.skyHorizon);
  gr.addColorStop(1, st.skyHorizon);
  sg.fillStyle = gr;
  sg.fillRect(0, 0, 4, 256);
}
const skyTex = new THREE.CanvasTexture(sky);
skyTex.colorSpace = THREE.SRGBColorSpace;
scene.background = skyTex;
scene.fog = new THREE.Fog(st.fog, st.fogNear, st.fogFar);

const camera = new THREE.PerspectiveCamera(48, 1, 0.5, 600);
const hemi = new THREE.HemisphereLight(new THREE.Color(st.skyHorizon).lerp(new THREE.Color('#ffffff'), 0.5), '#223', 1.1);
const sun = new THREE.DirectionalLight(st.sunColor, 1.9);
sun.position.set(-30, 40, 20);
scene.add(hemi, sun);

const ground = new THREE.Mesh(new THREE.PlaneGeometry(500, 500), new THREE.MeshStandardMaterial({ color: st.ground, roughness: 0.95 }));
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

const curve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-22, 0, 8), new THREE.Vector3(-10, 0, 5), new THREE.Vector3(0, 0, -1),
  new THREE.Vector3(10, 0, -5), new THREE.Vector3(22, 0, 0),
]);
const pts = curve.getSpacedPoints(80);
const pos: number[] = [];
for (let i = 0; i < pts.length - 1; i++) {
  const a = pts[i], b = pts[i + 1];
  const d = new THREE.Vector3().subVectors(b, a).normalize();
  const n = new THREE.Vector3(-d.z, 0, d.x).multiplyScalar(5);
  for (const v of [a.clone().add(n), a.clone().sub(n), b.clone().add(n), b.clone().add(n), a.clone().sub(n), b.clone().sub(n)]) pos.push(v.x, 0.05, v.z);
}
const rg = new THREE.BufferGeometry();
rg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
rg.computeVertexNormals();
scene.add(new THREE.Mesh(rg, new THREE.MeshStandardMaterial({ color: '#232733', roughness: 0.85, side: THREE.DoubleSide })));

// stand-ins for home and generic fill so composition is judged fairly
const homeM = new THREE.Mesh(new THREE.BoxGeometry(5, 3.6, 4.5), new THREE.MeshStandardMaterial({ color: '#e9c46a' }));
homeM.position.set(-24, 1.8, 14);
scene.add(homeM);
const t0 = performance.now();
scene.add(buildLandmarks(id));
const campus = buildCampus(id);
campus.position.set(24, 0, -4);
scene.add(campus);
let meshes = 0;
scene.traverse((o) => { if (o instanceof THREE.Mesh) meshes++; });
document.getElementById('hud')!.textContent = `${id}  meshes=${meshes}  build=${(performance.now() - t0).toFixed(0)}ms`;

function resize(): void {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

let angle = fixed !== null ? parseFloat(fixed) : 0.6;
const look = qs.get('look');
const target = new THREE.Vector3(0, 8, -6);
if (look) { const [lx, ly, lz] = look.split(',').map(Number); target.set(lx, ly, lz); }
const camR = qs.get('cam');
let last = performance.now();
function tick(t: number): void {
  const dt = Math.min(0.05, (t - last) / 1000);
  last = t;
  if (fixed === null) angle += dt * 0.06;
  const r = 54;
  if (camR) {
    const [cx, cy, cz] = camR.split(',').map(Number);
    camera.position.set(cx, cy, cz);
  } else {
    camera.position.set(Math.cos(angle) * r, 17, Math.sin(angle) * r * 0.6 + 12);
  }
  camera.lookAt(target);
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
