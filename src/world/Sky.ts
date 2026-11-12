import * as THREE from 'three';
import type { CityStyle } from './Landmarks';

/**
 * Dusk sky dome. Radius 420, no scene.background needed.
 * The dome is centred on the camera: call `follow(camera)` every frame (or add the camera's
 * position yourself). `update(dt, time)` only advances clouds and star twinkle.
 */
export interface SkyHandle {
  group: THREE.Group;
  update(dt: number, time: number): void;
  follow(camera: THREE.Camera): void;
  dispose(): void;
}

const DOME_R = 420;

const DOME_VERT = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    vec4 p = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * p;
    gl_Position.z = gl_Position.w * 0.99999;
  }`;

const DOME_FRAG = /* glsl */ `
  uniform vec3 uTop; uniform vec3 uHorizon; uniform vec3 uFog; uniform vec3 uMoonDir; uniform vec3 uGlowDir;
  uniform float uTime;
  varying vec3 vDir;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
  }
  float fbm(vec2 p) {
    float a = 0.5, s = 0.0;
    for (int i = 0; i < 5; i++) { s += a * vnoise(p); p = p * 2.03 + vec2(17.0, 9.0); a *= 0.5; }
    return s;
  }

  vec4 clouds(vec3 d, float scale, float speed, float lowE, float cover, float seed) {
    // project onto a plane so clouds stretch toward the horizon like real cloud decks
    float e = max(d.y, 0.012);
    vec2 uv = d.xz / (e + 0.08) * scale;
    uv.x *= 0.38;                       // long and thin
    uv += vec2(uTime * speed, seed);
    float n = fbm(uv);
    float dens = smoothstep(cover, cover + 0.22, n);
    float edge = smoothstep(0.0, 0.5, e) * (1.0 - smoothstep(lowE, lowE + 0.22, e));
    dens *= edge;
    // underside lighting: sample toward the horizon glow, the difference approximates self shadow
    float n2 = fbm(uv + vec2(0.0, 0.16));
    float lit = clamp((n - n2) * 5.0 + 0.55, 0.0, 1.0);
    vec3 under = uHorizon * 1.35 + vec3(0.08, 0.03, 0.0);
    vec3 topc = mix(uTop, uHorizon, 0.35) * 0.9 + vec3(0.02, 0.02, 0.05);
    vec3 c = mix(topc, under, lit);
    return vec4(c, dens);
  }

  void main() {
    vec3 d = normalize(vDir);
    float e = d.y;
    // vertical gradient tuned to the game camera (sees about 0..0.4 of elevation)
    float t = clamp(e / 0.52, 0.0, 1.0);
    t = smoothstep(0.0, 1.0, t);
    vec3 col = mix(uHorizon, uTop, pow(t, 0.72));
    // warm glow around the sunset side
    float gl = max(dot(d, uGlowDir), 0.0);
    col += uHorizon * (pow(gl, 6.0) * 0.55 + pow(gl, 28.0) * 0.5) * (1.0 - smoothstep(0.0, 0.5, e));
    // clouds, two decks
    vec4 c1 = clouds(d, 2.2, 0.004, 0.34, 0.50, 3.0);
    col = mix(col, c1.rgb, c1.a * 0.85);
    vec4 c2 = clouds(d, 4.5, 0.007, 0.26, 0.55, 11.0);
    col = mix(col, c2.rgb, c2.a * 0.75);
    // moon
    float md = dot(d, uMoonDir);
    float ang = acos(clamp(md, -1.0, 1.0));
    float R = 0.034;
    float disc = 1.0 - smoothstep(R * 0.96, R, ang);
    vec3 up = normalize(cross(uMoonDir, vec3(0.0, 1.0, 0.0)));
    vec3 vp = cross(up, uMoonDir);
    vec2 mp = vec2(dot(d, up), dot(d, vp)) / R;
    float crater = fbm(mp * 3.0 + 4.0);
    float lim = 1.0 - 0.35 * pow(clamp(length(mp), 0.0, 1.0), 3.0);
    vec3 moonCol = mix(vec3(0.78, 0.8, 0.86), vec3(1.0, 0.97, 0.88), crater) * lim;
    float halo = exp(-ang * ang / (0.012 * 0.012 * 4.0)) * 0.2 + exp(-ang * 14.0) * 0.1;
    float cloudCover = (c1.a * 0.85 + c2.a * 0.75);
    col += vec3(0.75, 0.8, 1.0) * halo * (1.0 - 0.5 * min(cloudCover, 1.0));
    col = mix(col, moonCol * 1.05, disc * (1.0 - 0.7 * min(cloudCover, 1.0)));
    // haze band into fog colour
    float haze = exp(-max(e, 0.0) * 30.0);
    col = mix(col, uFog, clamp(haze * 0.88, 0.0, 1.0));
    col = mix(col, uFog, smoothstep(0.0, -0.06, e));
    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;

const STAR_VERT = /* glsl */ `
  attribute float aSize; attribute float aPhase; attribute float aTint;
  uniform float uTime; uniform float uPx;
  varying float vA; varying float vTint;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float e = normalize(position).y;
    float fade = smoothstep(0.03, 0.34, e);
    float tw = 0.62 + 0.38 * sin(uTime * (1.2 + aPhase * 2.0) + aPhase * 40.0);
    vA = fade * tw;
    vTint = aTint;
    gl_PointSize = aSize * uPx;
    gl_Position = projectionMatrix * mv;
    gl_Position.z = gl_Position.w * 0.99998;
  }`;
const STAR_FRAG = /* glsl */ `
  varying float vA; varying float vTint;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    if (d > 1.0) discard;
    float a = pow(1.0 - d, 2.2) * vA;
    vec3 c = mix(vec3(0.75, 0.85, 1.0), vec3(1.0, 0.88, 0.7), vTint);
    gl_FragColor = vec4(c * a * 1.6, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;

export function buildSky(style: CityStyle): SkyHandle {
  const group = new THREE.Group();
  group.name = 'sky';
  const top = new THREE.Color(style.skyTop);
  const hor = new THREE.Color(style.skyHorizon);
  const fog = new THREE.Color(style.fog);

  const moonDir = new THREE.Vector3(0.34, 0.27, -1).normalize();
  const glowDir = new THREE.Vector3(-0.55, 0.0, -0.85).normalize();

  const domeGeo = new THREE.SphereGeometry(DOME_R, 48, 32);
  const domeMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: false,
    fog: false,
    uniforms: {
      uTop: { value: top }, uHorizon: { value: hor }, uFog: { value: fog },
      uMoonDir: { value: moonDir }, uGlowDir: { value: glowDir }, uTime: { value: 0 },
    },
    vertexShader: DOME_VERT,
    fragmentShader: DOME_FRAG,
  });
  const dome = new THREE.Mesh(domeGeo, domeMat);
  dome.renderOrder = -1000;
  dome.frustumCulled = false;
  group.add(dome);

  // stars
  let s = 90210;
  const rnd = (): number => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
  const N = 520;
  const pos = new Float32Array(N * 3);
  const size = new Float32Array(N);
  const ph = new Float32Array(N);
  const tint = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const az = rnd() * Math.PI * 2;
    const el = 0.04 + Math.pow(rnd(), 0.8) * 0.9;
    const cy = Math.sqrt(1 - el * el);
    pos[i * 3] = Math.cos(az) * cy * (DOME_R * 0.98);
    pos[i * 3 + 1] = el * DOME_R * 0.98;
    pos[i * 3 + 2] = Math.sin(az) * cy * (DOME_R * 0.98);
    size[i] = rnd() < 0.08 ? 3.2 : 1.4 + rnd() * 1.1;
    ph[i] = rnd();
    tint[i] = rnd();
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  starGeo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  starGeo.setAttribute('aPhase', new THREE.BufferAttribute(ph, 1));
  starGeo.setAttribute('aTint', new THREE.BufferAttribute(tint, 1));
  const starMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    fog: false,
    uniforms: { uTime: { value: 0 }, uPx: { value: 1 } },
    vertexShader: STAR_VERT,
    fragmentShader: STAR_FRAG,
  });
  const stars = new THREE.Points(starGeo, starMat);
  stars.renderOrder = -999;
  stars.frustumCulled = false;
  stars.onBeforeRender = (renderer) => {
    starMat.uniforms.uPx.value = Math.max(1, renderer.getPixelRatio());
  };
  group.add(stars);

  return {
    group,
    update(_dt: number, time: number): void {
      domeMat.uniforms.uTime.value = time;
      starMat.uniforms.uTime.value = time;
    },
    follow(camera: THREE.Camera): void {
      group.position.copy(camera.position);
    },
    dispose(): void {
      domeGeo.dispose();
      domeMat.dispose();
      starGeo.dispose();
      starMat.dispose();
    },
  };
}

/**
 * Optional: a small PMREM environment cube-map of the sky for glass reflections.
 * Set `scene.environment = tex` and keep `scene.environmentIntensity` low (about 0.3 to 0.5).
 * Caller owns (and disposes) the returned texture.
 */
export function buildSkyEnvironment(renderer: THREE.WebGLRenderer, style: CityStyle): THREE.Texture {
  const sky = buildSky(style);
  const sc = new THREE.Scene();
  sc.add(sky.group);
  const pm = new THREE.PMREMGenerator(renderer);
  const rt = pm.fromScene(sc, 0, 1, 1000);
  pm.dispose();
  sky.dispose();
  return rt.texture;
}
