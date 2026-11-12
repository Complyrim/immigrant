import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

/** A look for a scene: tints for shadows and highlights, saturation, contrast, exposure, vignette and bloom. */
export interface Grade {
  shadow: [number, number, number];
  highlight: [number, number, number];
  sat: number;
  contrast: number;
  exposure: number;
  vignette: number;
  bloom: number;
}

export const NEUTRAL_GRADE: Grade = {
  shadow: [0.93, 0.98, 1.07],
  highlight: [1.04, 1.0, 0.94],
  sat: 1.06,
  contrast: 1.07,
  exposure: 1,
  vignette: 0.32,
  bloom: 0.45,
};

export type PostQuality = 'high' | 'mid' | 'low';

const GradeShader = {
  name: 'GradeShader',
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uVignette: { value: 0.32 },
    uAspect: { value: 1 },
    uShadow: { value: new THREE.Vector3(0.93, 0.98, 1.07) },
    uHighlight: { value: new THREE.Vector3(1.04, 1.0, 0.94) },
    uSat: { value: 1.06 },
    uContrast: { value: 1.07 },
    uExposure: { value: 1 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse; uniform float uVignette; uniform float uAspect;
    uniform vec3 uShadow; uniform vec3 uHighlight; uniform float uSat; uniform float uContrast; uniform float uExposure;
    varying vec2 vUv;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main() {
      vec4 t = texture2D(tDiffuse, vUv);
      vec3 c = max(t.rgb, vec3(0.0)) * uExposure;
      float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
      // split tone: shadows and highlights each get their own colour
      c *= mix(uShadow, uHighlight, smoothstep(0.02, 0.9, l));
      // film-like contrast around mid grey (linear)
      c = 0.18 * pow(c / 0.18, vec3(uContrast));
      float l2 = dot(c, vec3(0.2126, 0.7152, 0.0722));
      c = mix(vec3(l2), c, uSat);
      // vignette
      vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);
      float v = smoothstep(0.35, 1.05, length(p) * 1.15);
      c *= 1.0 - uVignette * v;
      // a hair of noise hides banding in soft gradients
      c += (hash(vUv * 1024.0) - 0.5) * 0.0035;
      gl_FragColor = vec4(c, t.a);
    }`,
};

/**
 * Post chain: scene (MSAA, half float) -> ambient occlusion -> bloom -> per-scene grade -> tone map + sRGB.
 * 'mid' drops ambient occlusion; 'low' is a plain `renderer.render`.
 */
export class Post {
  private composer: EffectComposer;
  private readonly ao: GTAOPass;
  private readonly bloom: UnrealBloomPass;
  private readonly grade: ShaderPass;
  private readonly output: OutputPass;
  private quality: PostQuality = 'high';
  private aoWanted = false;
  private w = 1;
  private h = 1;
  private readonly current: Grade = { ...NEUTRAL_GRADE, shadow: [...NEUTRAL_GRADE.shadow], highlight: [...NEUTRAL_GRADE.highlight] };
  private target: Grade = { ...NEUTRAL_GRADE, shadow: [...NEUTRAL_GRADE.shadow], highlight: [...NEUTRAL_GRADE.highlight] };

  constructor(
    private readonly renderer: THREE.WebGLRenderer,
    private readonly scene: THREE.Scene,
    private readonly camera: THREE.PerspectiveCamera,
  ) {
    const size = renderer.getSize(new THREE.Vector2());
    this.w = Math.max(1, size.x);
    this.h = Math.max(1, size.y);
    const rt = new THREE.WebGLRenderTarget(this.w, this.h, { type: THREE.HalfFloatType, samples: 4 });
    this.composer = new EffectComposer(renderer, rt);
    // only the first target needs MSAA; later passes are full-screen quads
    this.composer.renderTarget2.samples = 0;
    this.composer.addPass(new RenderPass(scene, camera));
    this.ao = new GTAOPass(scene, camera, this.w, this.h);
    this.ao.updateGtaoMaterial({ radius: 0.35, distanceExponent: 1.1, thickness: 0.8, scale: 0.9, samples: 10, distanceFallOff: 1, screenSpaceRadius: false });
    this.ao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 5, radiusExponent: 1, rings: 2, samples: 12 });
    this.ao.blendIntensity = 0.5;
    this.ao.enabled = false;
    this.composer.addPass(this.ao);
    this.bloom = new UnrealBloomPass(new THREE.Vector2(this.w, this.h), 0.45, 0.5, 0.9);
    this.composer.addPass(this.bloom);
    this.grade = new ShaderPass(GradeShader);
    this.composer.addPass(this.grade);
    this.output = new OutputPass();
    this.composer.addPass(this.output);
    this.setSize(this.w, this.h);
    this.apply();
  }

  setSize(width: number, height: number): void {
    this.w = Math.max(1, width);
    this.h = Math.max(1, height);
    this.composer.setPixelRatio(this.renderer.getPixelRatio());
    this.composer.setSize(this.w, this.h);
    this.grade.uniforms.uAspect.value = this.w / this.h;
  }

  get tier(): PostQuality {
    return this.quality;
  }

  setQuality(q: PostQuality | 'high' | 'low'): void {
    if (q === this.quality) return;
    this.quality = q;
    this.composer.renderTarget1.samples = q === 'low' ? 0 : 4;
    this.ao.enabled = this.aoWanted && q === 'high';
  }

  /** Ambient occlusion suits close scenes (people in rooms); it is skipped for the far city view. */
  setAO(on: boolean): void {
    this.aoWanted = on;
    this.ao.enabled = on && this.quality === 'high';
  }

  /** Blend toward a new look. Pass instant to snap, for example on the first scene. */
  setGrade(g: Grade, instant = false): void {
    this.target = { ...g, shadow: [...g.shadow], highlight: [...g.highlight] };
    if (instant) {
      Object.assign(this.current, this.target, { shadow: [...g.shadow], highlight: [...g.highlight] });
      this.apply();
    }
  }

  private apply(): void {
    const u = this.grade.uniforms;
    const c = this.current;
    (u.uShadow.value as THREE.Vector3).set(c.shadow[0], c.shadow[1], c.shadow[2]);
    (u.uHighlight.value as THREE.Vector3).set(c.highlight[0], c.highlight[1], c.highlight[2]);
    u.uSat.value = c.sat;
    u.uContrast.value = c.contrast;
    u.uExposure.value = c.exposure;
    u.uVignette.value = c.vignette;
    this.bloom.strength = c.bloom;
  }

  render(dt: number): void {
    // ease the look toward its target over about half a second
    const k = 1 - Math.exp(-Math.min(0.1, dt) * 5);
    const c = this.current;
    const t = this.target;
    for (let i = 0; i < 3; i++) {
      c.shadow[i] += (t.shadow[i] - c.shadow[i]) * k;
      c.highlight[i] += (t.highlight[i] - c.highlight[i]) * k;
    }
    c.sat += (t.sat - c.sat) * k;
    c.contrast += (t.contrast - c.contrast) * k;
    c.exposure += (t.exposure - c.exposure) * k;
    c.vignette += (t.vignette - c.vignette) * k;
    c.bloom += (t.bloom - c.bloom) * k;
    this.apply();
    if (this.quality === 'low') {
      this.renderer.render(this.scene, this.camera);
      return;
    }
    this.composer.render(dt);
  }

  dispose(): void {
    this.composer.renderTarget1.dispose();
    this.composer.renderTarget2.dispose();
    this.ao.dispose();
    this.bloom.dispose();
    this.grade.dispose();
    this.output.dispose();
  }
}
