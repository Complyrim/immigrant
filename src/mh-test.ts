import * as THREE from 'three';
import { loadHumans } from './world/HumanFigure';
import { MhFigure, PEOPLE_IDS, loadPerson } from './world/MhFigure';
import { ROLE_LOOKS } from './world/Figure';
import type { Pose } from './engine/types';

/** Contact sheet for the cast: ?ids=a,b,c (or ?from=0&n=8) &pose=idle &dist=6 &acc=backpack */
const qs = new URLSearchParams(location.search);
const W = Number(qs.get('w') ?? 900);
const H = Number(qs.get('h') ?? 420);
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setSize(W, H);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color(qs.get('bg') ?? '#cfc6b8');
const from = Number(qs.get('from') ?? 0);
const ids = qs.get('ids')?.split(',') ?? PEOPLE_IDS.slice(from, from + Number(qs.get('n') ?? 8));
const cam = new THREE.PerspectiveCamera(30, W / H, 0.1, 100);
const dist = Number(qs.get('dist') ?? 1.6 + ids.length * 0.62);
const cy = Number(qs.get('cy') ?? 0.95);
cam.position.set(0, cy + 0.3, dist);
cam.lookAt(0, cy, 0);
const key = new THREE.DirectionalLight('#fff1dc', 2.4);
key.position.set(3, 5, 4);
scene.add(key, new THREE.HemisphereLight('#e6ecff', '#8a7a6c', 1.5));
const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 10), new THREE.MeshStandardMaterial({ color: '#a8997f' }));
floor.rotation.x = -Math.PI / 2;
scene.add(floor);
const hud = document.getElementById('hud') as HTMLElement;
void Promise.all([loadHumans(), ...ids.map((i) => loadPerson(i))]).then(() => {
  const poses = (qs.get('pose') ?? 'idle').split(',') as Pose[];
  const acc = qs.get('acc');
  const figs = ids.map((id, i) => {
    const role = (qs.get('role') ?? 'stranger') as keyof typeof ROLE_LOOKS;
    const look = acc ? { ...ROLE_LOOKS[role], accessory: acc as 'backpack' } : { ...ROLE_LOOKS[role], accessory: 'none' as const };
    const f = new MhFigure(look, false, id);
    f.group.position.x = (i - (ids.length - 1) / 2) * Number(qs.get('gap') ?? 0.85);
    if (qs.get('ry')) f.group.rotation.y = Number(qs.get('ry'));
    f.setPose(poses[i % poses.length]);
    scene.add(f.group);
    return f;
  });
  (window as unknown as { MhFigure: unknown; figs: unknown }).MhFigure = MhFigure;
  (window as unknown as { figs: unknown }).figs = figs;
  hud.textContent = `loaded ${ids.join(' ')}`;
  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    const dt = clock.getDelta();
    for (const f of figs) f.update(dt, clock.elapsedTime);
    renderer.render(scene, cam);
  });
});
