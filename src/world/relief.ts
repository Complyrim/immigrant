import * as THREE from 'three';

/**
 * A painted backdrop raised into 3D. Each point of the painting is pushed out along the ray of the camera
 * that "painted" it, to the distance its depth map gives (scripts/bake_depth.py), so the picture looks the
 * same from the rest position and shows real parallax when the camera drifts. It draws behind everything
 * and writes no depth, so people and furniture always stay whole in front of it.
 *
 * Depth map encoding: byte = sqrt(k / 0.75) * 255, where k is the floor-equivalent (v - horizon);
 * distance Z = f * camH / k.
 */
export interface DepthGrid {
  w: number;
  h: number;
  data: Uint8ClampedArray;
}

export interface ReliefCam {
  h: number;
  d0: number;
  f: number;
  vh: number;
}

const K_MAX = 0.75;
const Z_MAX = 320;

export function readDepth(img: HTMLImageElement | ImageBitmap, size = 256): DepthGrid {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  if (!ctx) return { w: 1, h: 1, data: new Uint8ClampedArray([128]) };
  ctx.drawImage(img, 0, 0, size, size);
  const rgba = ctx.getImageData(0, 0, size, size).data;
  const data = new Uint8ClampedArray(size * size);
  for (let i = 0; i < data.length; i++) data[i] = rgba[i * 4];
  return { w: size, h: size, data };
}

/** Mirror a coordinate into [0, 1] the way MirroredRepeatWrapping does. */
const mirror = (u: number): number => {
  const m = ((u % 2) + 2) % 2;
  return m > 1 ? 2 - m : m;
};

function kAt(g: DepthGrid, u: number, v: number): number {
  const x = mirror(u) * (g.w - 1);
  const y = Math.min(1, Math.max(0, v)) * (g.h - 1);
  const x0 = Math.floor(x), y0 = Math.floor(y);
  const x1 = Math.min(g.w - 1, x0 + 1), y1 = Math.min(g.h - 1, y0 + 1);
  const fx = x - x0, fy = y - y0;
  const s = (xx: number, yy: number): number => {
    const b = g.data[yy * g.w + xx] / 255;
    return K_MAX * b * b;
  };
  const top = s(x0, y0) * (1 - fx) + s(x1, y0) * fx;
  const bot = s(x0, y1) * (1 - fx) + s(x1, y1) * fx;
  return top * (1 - fy) + bot * fy;
}

/** Build the relief mesh in stage space (camera at (0, cam.h, cam.d0) looking down -z). */
export function makeRelief(paint: THREE.Texture, depth: DepthGrid, cam: ReliefCam, texAspect: number, dim = 1): THREE.Mesh {
  // The sides run past the painting with the same mirrored continuation the flat backdrop uses.
  const u0 = -0.6, u1 = 1.6;
  // A little past the top and bottom too, so the camera's drift never shows an edge.
  const v0 = -0.1, v1 = 1.15;
  const cols = 220, rows = 130;
  const pos = new Float32Array((cols + 1) * (rows + 1) * 3);
  const uv = new Float32Array((cols + 1) * (rows + 1) * 2);
  let p = 0, q = 0;
  for (let j = 0; j <= rows; j++) {
    const v = v0 + ((v1 - v0) * j) / rows; // from the top
    for (let i = 0; i <= cols; i++) {
      const u = u0 + ((u1 - u0) * i) / cols;
      const k = Math.max(0.004, kAt(depth, u, v));
      const z = Math.min(Z_MAX, (cam.f * cam.h) / k);
      pos[p++] = ((u - 0.5) * texAspect * z) / cam.f;
      pos[p++] = cam.h - ((v - cam.vh) * z) / cam.f;
      pos[p++] = cam.d0 - z;
      uv[q++] = u;
      uv[q++] = 1 - v;
    }
  }
  const index: number[] = [];
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const a = j * (cols + 1) + i, b = a + 1, c = a + cols + 1, d = c + 1;
      index.push(a, c, b, b, c, d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setIndex(index);
  const map = paint.clone();
  map.wrapS = THREE.MirroredRepeatWrapping;
  map.repeat.set(1, 1);
  map.offset.set(0, 0);
  map.needsUpdate = true;
  const mat = new THREE.MeshBasicMaterial({ map, toneMapped: false, depthWrite: false, fog: false });
  mat.color.setScalar(dim);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.renderOrder = -100;
  mesh.frustumCulled = false;
  mesh.userData.keep = true;
  mesh.userData.relief = true;
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  return mesh;
}
