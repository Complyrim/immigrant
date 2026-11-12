import * as THREE from 'three';
import { HumanFigure, loadHumans } from './world/HumanFigure';
import { ROLE_LOOKS, playerLookFor } from './world/Figure';
import type { FigureLook } from './world/Figure';
import { loadHdri, pbrMaterial } from './world/pbr';
import type { Pose } from './engine/types';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(780, 520);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.background = new THREE.Color('#2a2f3a');
const cam = new THREE.PerspectiveCamera(32, 780 / 520, 0.1, 100);
cam.position.set(0, 1.4, 8.6);
cam.lookAt(0, 0.9, 0);
const key = new THREE.DirectionalLight('#fff1dc', 2.2);
key.position.set(3, 5, 4);
key.castShadow = true;
scene.add(key, new THREE.HemisphereLight('#bcd2ff', '#4a3a30', 0.5));
const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 12), pbrMaterial('wood_floor', { repeat: [10, 4] }));
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);
void loadHdri(renderer, 'aft_lounge').then((e) => { scene.environment = e; scene.environmentIntensity = 0.3; });

const hud = document.getElementById('hud') as HTMLElement;
void loadHumans().then((ok) => {
  hud.textContent = ok ? 'loaded' : 'FAILED';
  if (!ok) return;
  const qs = new URLSearchParams(location.search);
  const rolesQ = qs.get('roles');
  const q = qs.get('poses') ?? (rolesQ ? rolesQ.split(',').map(() => 'idle').join(',') : null);
  const poses = (q ? q.split(',') : ['idle', 'talk', 'sit', 'walk', 'dance', 'sleep', 'cook']) as Pose[];
  const accs = ['backpack', 'glasses', 'headphones', 'scarf', 'lanyard', 'suitcase', 'badge'] as const;
  const pool = [
    playerLookFor({ sex: 'male', age: 24, marital: 'single' }, 3),
    ROLE_LOOKS.friend,
    ROLE_LOOKS.professor,
    ROLE_LOOKS.dso,
    ROLE_LOOKS.officer,
    ROLE_LOOKS.nurse,
    ROLE_LOOKS.roommate,
    playerLookFor({ sex: 'female', age: 24, marital: 'single' }, 5),
  ];
  cam.position.set(0, 1.25, 2.4 + poses.length * 0.95);
  cam.lookAt(0, 0.95, 0);
  const custom: Record<string, FigureLook> = {
    shorts: { ...pool[7], outfit: 'shorts', top: '#e0a23f', bottom: '#33466b', outer: 'none' },
    dress: { ...pool[7], outfit: 'dress', top: '#2fa08a', outer: 'none', hairStyle: 'ponytail' },
    skirt: { ...pool[7], outfit: 'skirt', top: '#d6485f', bottom: '#2a3a58', outer: 'none' },
    hoodie: { ...pool[0], outer: 'hoodie', top: '#4a6fd6' },
    tee: { ...pool[0], outer: 'none', top: '#3fa37a' },
  };
  const looks = rolesQ
    ? rolesQ.split(',').map((r) => custom[r] ?? (ROLE_LOOKS as Record<string, FigureLook>)[r] ?? pool[0])
    : poses.map((_, i) => ({ ...pool[i % pool.length], accessory: accs[i % accs.length], outer: 'hoodie' as const }));
  const figs = looks.map((l, i) => {
    const f = new HumanFigure(l);
    f.group.position.set((i - (poses.length - 1) / 2) * 1.35, 0, 0);
    f.setPose(poses[i]);
    if (new URLSearchParams(location.search).get('back')) f.group.rotation.y = Math.PI * 0.8;
    scene.add(f.group);
    return f;
  });
  (window as unknown as { __figs: unknown; __scene: unknown; __cam: unknown; __r: unknown }).__figs = figs;
  (window as unknown as { __scene: unknown }).__scene = scene;
  (window as unknown as { __cam: unknown }).__cam = cam;
  (window as unknown as { __r: unknown }).__r = renderer;
  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    const dt = clock.getDelta();
    for (const f of figs) f.update(dt, clock.elapsedTime);
    renderer.render(scene, cam);
  });
});
