import * as THREE from 'three';
import { stdMat } from './Figure';

/**
 * A city bicycle for the cycling commute: a steel diamond frame with real tube joints, spoked wheels with
 * tyres and mudguards, a chainset that turns, pedals that stay level, swept-back bars with grips, a rear
 * rack and lights. Built in bike space: x forward, y up, z to the rider's right, in metres for a medium
 * frame; the caller scales it to the rider.
 *
 * It exposes where the rider's hands, feet and seat go, so the rider can hold the bars and pedal.
 */
export interface Bike {
  group: THREE.Group;
  /** Top of the saddle, where the rider sits. */
  saddle: THREE.Object3D;
  /** Where the wrists go: just behind and above each grip. */
  hands: { l: THREE.Object3D; r: THREE.Object3D };
  /** Where the ankles go: over each pedal, which stays level as the cranks turn. */
  feet: { l: THREE.Object3D; r: THREE.Object3D };
  /** Turn the wheels and cranks. */
  update(dt: number): void;
}

const unitCyl = new THREE.CylinderGeometry(1, 1, 1, 14, 1);
const unitBox = new THREE.BoxGeometry(1, 1, 1);
const unitSph = new THREE.SphereGeometry(1, 20, 14);
const UP = new THREE.Vector3(0, 1, 0);

const R = 0.34; // wheel radius with tyre
const tyreGeo = new THREE.TorusGeometry(R - 0.021, 0.021, 12, 64);
const rimGeo = new THREE.TorusGeometry(R - 0.05, 0.011, 8, 64);
const guardGeo = new THREE.TorusGeometry(R + 0.025, 0.012, 6, 40, Math.PI * 0.62);
const ringGeo = new THREE.TorusGeometry(0.095, 0.008, 6, 40);
const cogGeo = new THREE.TorusGeometry(0.04, 0.007, 6, 24);
const spokeGeo = (() => {
  // 32 spokes per wheel, laced from the hub flanges (either side) to the rim, crossing as real wheels do.
  const pts: number[] = [];
  const n = 32;
  for (let i = 0; i < n; i++) {
    const side = i % 2 ? 1 : -1;
    const a = (i / n) * Math.PI * 2;
    const h = a + side * 0.35; // tangential lacing
    pts.push(Math.cos(h) * 0.022, Math.sin(h) * 0.022, side * 0.028, Math.cos(a) * (R - 0.055), Math.sin(a) * (R - 0.055), 0);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  return g;
})();

export function buildBike(frameColour: string): Bike {
  const paint = stdMat(frameColour, { rough: 0.32, metal: 0.45 });
  const black = stdMat('#18191c', { rough: 0.6, metal: 0.2 });
  const rubber = stdMat('#141414', { rough: 0.95 });
  const alloy = stdMat('#b9bdc4', { rough: 0.28, metal: 0.9 });
  const darkAlloy = stdMat('#5a5e66', { rough: 0.35, metal: 0.8 });
  const leather = stdMat('#3a2a1f', { rough: 0.7 });
  const spokeMat = new THREE.LineBasicMaterial({ color: '#c9ccd2', transparent: true, opacity: 0.85 });
  const g = new THREE.Group();

  const tube = (a: THREE.Vector3Like, b: THREE.Vector3Like, r: number, mat: THREE.Material, parent: THREE.Object3D = g): THREE.Mesh => {
    const va = new THREE.Vector3(a.x, a.y, a.z);
    const vb = new THREE.Vector3(b.x, b.y, b.z);
    const d = vb.clone().sub(va);
    const me = new THREE.Mesh(unitCyl, mat);
    me.scale.set(r, d.length(), r);
    me.position.copy(va).addScaledVector(d, 0.5);
    me.quaternion.setFromUnitVectors(UP, d.normalize());
    parent.add(me);
    return me;
  };
  const joint = (p: THREE.Vector3Like, r: number, mat: THREE.Material = paint): void => {
    const me = new THREE.Mesh(unitSph, mat);
    me.scale.setScalar(r);
    me.position.set(p.x, p.y, p.z);
    g.add(me);
  };
  const box = (w: number, h: number, d: number, mat: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D = g): THREE.Mesh => {
    const me = new THREE.Mesh(unitBox, mat);
    me.scale.set(w, h, d);
    me.position.set(x, y, z);
    parent.add(me);
    return me;
  };
  const v = (x: number, y: number, z = 0): THREE.Vector3 => new THREE.Vector3(x, y, z);

  // Frame geometry (side view): rear axle, bottom bracket, seat cluster, head tube, front axle.
  const rear = v(-0.52, R);
  const front = v(0.54, R);
  const bb = v(-0.08, 0.29);
  const seatTop = v(-0.24, 0.84);
  const headTop = v(0.36, 0.87);
  const headBot = v(0.415, 0.7);

  // Main triangle.
  tube(bb, seatTop, 0.017, paint);
  tube(seatTop, headTop.clone().add(v(-0.01, -0.03)), 0.015, paint);
  tube(bb, headBot.clone().add(v(-0.005, 0.02)), 0.019, paint);
  tube(headBot, headTop.clone().add(v(-0.006, 0.02)), 0.022, paint);
  joint(bb, 0.03, darkAlloy);
  joint(seatTop, 0.02);
  // Rear triangle: stays either side of the wheel.
  for (const z of [-0.05, 0.05]) {
    tube(bb.clone().add(v(0, 0, z * 0.5)), v(rear.x, rear.y, z), 0.01, paint);
    tube(seatTop.clone().add(v(0.01, -0.04, z * 0.3)), v(rear.x, rear.y, z), 0.009, paint);
    box(0.03, 0.03, 0.006, darkAlloy, rear.x, rear.y, z);
  }
  // Fork: crown under the head tube, two legs with a little forward rake to the front axle.
  box(0.05, 0.03, 0.11, paint, headBot.x + 0.005, headBot.y - 0.02, 0);
  for (const z of [-0.05, 0.05]) {
    const crown = v(headBot.x + 0.008, headBot.y - 0.03, z);
    const mid = v(headBot.x + 0.06, 0.5, z);
    tube(crown, mid, 0.012, paint);
    tube(mid, v(front.x, front.y, z), 0.011, paint);
  }

  // Seatpost and saddle.
  const postTop = v(-0.285, 0.98);
  tube(seatTop, postTop, 0.012, alloy);
  const saddleBody = new THREE.Group();
  saddleBody.position.copy(postTop).add(v(0, 0.025));
  g.add(saddleBody);
  const back = new THREE.Mesh(unitSph, leather);
  back.scale.set(0.085, 0.03, 0.085);
  back.position.set(-0.02, 0, 0);
  const nose = new THREE.Mesh(unitSph, leather);
  nose.scale.set(0.13, 0.026, 0.038);
  nose.position.set(0.07, 0.002, 0);
  saddleBody.add(back, nose);
  for (const z of [-0.035, 0.035]) tube(v(-0.06, -0.02, z), v(0.08, -0.012, z), 0.004, alloy, saddleBody);
  const saddle = new THREE.Object3D();
  saddle.position.set(-0.29, postTop.y + 0.055, 0);
  g.add(saddle);

  // Stem and swept-back city bars with grips, brake levers and a bell.
  const steerTop = v(0.345, 0.95);
  tube(headTop, steerTop, 0.014, darkAlloy);
  const clamp = v(0.4, 0.97);
  tube(steerTop, clamp, 0.016, darkAlloy);
  const hands = { l: new THREE.Object3D(), r: new THREE.Object3D() };
  for (const s of [-1, 1] as const) {
    const out = v(0.4, 0.97, s * 0.12);
    const bend = v(0.3, 1.03, s * 0.26);
    const end = v(0.16, 1.05, s * 0.29);
    tube(v(clamp.x, clamp.y, 0), out, 0.011, alloy);
    tube(out, bend, 0.011, alloy);
    tube(bend, end.clone().add(v(0.06, 0, -s * 0.008)), 0.011, alloy);
    tube(end.clone().add(v(0.07, 0, -s * 0.008)), end, 0.017, rubber);
    box(0.09, 0.012, 0.018, black, bend.x - 0.06, bend.y - 0.015, s * 0.27);
    const h = s < 0 ? hands.l : hands.r;
    // Wrist a hand's width behind the grip's middle and a little above it.
    h.position.set(end.x + 0.0, end.y + 0.045, end.z - s * 0.01);
    h.name = `bike-hand-${s < 0 ? 'l' : 'r'}`;
    g.add(h);
  }
  const bell = new THREE.Mesh(unitSph, alloy);
  bell.scale.set(0.022, 0.014, 0.022);
  bell.position.set(0.38, 0.99, -0.16);
  g.add(bell);
  // Front lamp and rear light.
  const lamp = box(0.05, 0.04, 0.045, stdMat('#f4f1e6', { emissive: '#fff6da', ei: 1.4, rough: 0.3 }), headTop.x + 0.06, 0.78, 0);
  void lamp;
  box(0.02, 0.04, 0.05, stdMat('#d23a2e', { emissive: '#ff2a1a', ei: 1.1, rough: 0.3 }), -0.67, 0.6, 0);

  // Rear rack over the back wheel.
  for (const z of [-0.09, 0.09]) {
    tube(v(-0.2, 0.69, z * 0.6), v(-0.36, 0.73, z), 0.006, black);
    tube(v(-0.36, 0.73, z), v(-0.66, 0.73, z), 0.007, black);
    tube(v(-0.6, 0.73, z), v(rear.x - 0.01, rear.y + 0.02, z * 0.9), 0.007, black);
  }
  for (const x of [-0.42, -0.54, -0.66]) tube(v(x, 0.73, -0.09), v(x, 0.73, 0.09), 0.005, black);

  // Wheels: tyre, rim, hub, laced spokes and a mudguard, turning about the axle.
  const wheels: THREE.Group[] = [];
  for (const at of [rear, front]) {
    const w = new THREE.Group();
    w.position.copy(at);
    g.add(w);
    w.add(new THREE.Mesh(tyreGeo, rubber), new THREE.Mesh(rimGeo, alloy), new THREE.LineSegments(spokeGeo, spokeMat));
    const hub = new THREE.Mesh(unitCyl, alloy);
    hub.scale.set(0.024, 0.07, 0.024);
    hub.rotation.x = Math.PI / 2;
    w.add(hub);
    wheels.push(w);
    const guard = new THREE.Mesh(guardGeo, black);
    guard.position.copy(at);
    guard.scale.set(1, 1, 3.2);
    guard.rotation.z = Math.PI * 0.2;
    g.add(guard);
  }

  // Drivetrain on the right side: chainring, cog, chain, cranks and level pedals.
  const drive = 0.075;
  const ring = new THREE.Mesh(ringGeo, darkAlloy);
  ring.position.set(bb.x, bb.y, drive);
  const ringDisc = new THREE.Mesh(unitCyl, darkAlloy);
  ringDisc.scale.set(0.088, 0.004, 0.088);
  ringDisc.rotation.x = Math.PI / 2;
  ring.add(ringDisc);
  ringDisc.position.set(0, 0, 0);
  g.add(ring);
  const cog = new THREE.Mesh(cogGeo, darkAlloy);
  cog.position.set(rear.x, rear.y, drive);
  g.add(cog);
  const chain = stdMat('#3c3f45', { rough: 0.5, metal: 0.7 });
  tube(v(bb.x, bb.y + 0.095, drive), v(rear.x, rear.y + 0.04, drive), 0.005, chain);
  tube(v(bb.x, bb.y - 0.095, drive), v(rear.x, rear.y - 0.04, drive), 0.005, chain);
  // Chain guard, as city bikes have.
  const cg = new THREE.Mesh(unitBox, paint);
  cg.scale.set(0.5, 0.025, 0.012);
  cg.position.set((bb.x + rear.x) / 2, (bb.y + rear.y) / 2 + 0.11, drive + 0.02);
  cg.rotation.z = Math.atan2(rear.y - bb.y, rear.x - bb.x) - Math.PI;
  g.add(cg);

  const crank = new THREE.Group();
  crank.position.copy(bb);
  g.add(crank);
  tube(v(0, 0, -0.11), v(0, 0, 0.11), 0.012, darkAlloy, crank);
  const CRANK = 0.17;
  const pedals: THREE.Group[] = [];
  const feet = { l: new THREE.Object3D(), r: new THREE.Object3D() };
  for (const s of [-1, 1] as const) {
    // Right crank points forward-down at the start; the left is opposite.
    const arm = new THREE.Group();
    arm.rotation.z = s > 0 ? 0 : Math.PI;
    crank.add(arm);
    box(CRANK + 0.03, 0.022, 0.012, darkAlloy, CRANK / 2, 0, s * 0.105, arm);
    const pedal = new THREE.Group();
    pedal.position.set(CRANK, 0, s * 0.105);
    arm.add(pedal);
    tube(v(0, 0, 0), v(0, 0, s * 0.05), 0.006, alloy, pedal);
    box(0.1, 0.022, 0.08, black, 0, 0, s * 0.085, pedal);
    box(0.104, 0.004, 0.084, stdMat('#e0a23f', { emissive: '#e0a23f', ei: 0.25 }), 0, -0.012, s * 0.085, pedal);
    const ankle = s < 0 ? feet.l : feet.r;
    // The ball of the foot over the pedal: the ankle sits behind and above it.
    ankle.name = `bike-foot-${s < 0 ? 'l' : 'r'}`;
    ankle.position.set(-0.075, 0.09, s * 0.085);
    pedal.add(ankle);
    pedals.push(pedal);
  }

  g.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) o.castShadow = true;
  });

  let crankA = 0;
  let wheelA = 0;
  return {
    group: g,
    saddle,
    hands,
    feet,
    update(dt) {
      // An easy commuting pace: about 60 pedal turns a minute.
      crankA -= dt * 6.3;
      wheelA -= dt * 6.3 * 2.4;
      crank.rotation.z = crankA;
      for (const w of wheels) w.rotation.z = wheelA;
      // Pedals stay level whatever the crank angle.
      for (const p of pedals) p.rotation.z = -crankA - (p.parent as THREE.Object3D).rotation.z;
    },
  };
}
