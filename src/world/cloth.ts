import * as THREE from 'three';

/**
 * Cloth material: a standard lit material plus garment detail drawn in the shader from the vertex's
 * bind-pose position, so it stays crisp at any distance and never swims when the body animates.
 * Detail includes stripes, plaid, polka dots, a button placket, a zip, a hoodie pouch, a chest pocket,
 * a chest print, a waistband with a belt buckle, jeans fading, and hem and cuff trims.
 */
export type ClothPattern = 'plain' | 'stripes' | 'plaid' | 'dots' | 'print';

export interface ClothSpec {
  color: THREE.ColorRepresentation;
  /** Second colour for patterns, buttons and trims. */
  trim?: THREE.ColorRepresentation;
  pattern?: ClothPattern;
  /** Pattern size in metres (stripe or check width, dot spacing). */
  scale?: number;
  /** 0 to 1: how strongly the pattern shows. */
  strength?: number;
  /** A front opening with buttons, from this height (0 feet, 1 head) up to the neck. 0 for none. */
  placketFrom?: number;
  buttons?: boolean;
  /** A zip down the front (a thin light line) from this height up. 0 for none. */
  zipFrom?: number;
  /** 'pouch' is a hoodie's belly pocket; 'chest' is a shirt or scrubs pocket. */
  pocket?: 'none' | 'pouch' | 'chest';
  /** Waistband between these heights, drawn darker with a small buckle at the front. */
  waist?: [number, number];
  belt?: boolean;
  /** Denim: lighter worn areas on the front of the thighs and darker cuffs. */
  denim?: boolean;
  /** A trim band at the garment's lower edge, at this height, in the trim colour. */
  hemAt?: number;
  roughness?: number;
  /** Brightness cap so whites do not blow out under bloom. */
  maxLightness?: number;
}

const PATTERN_ID: Record<ClothPattern, number> = { plain: 0, stripes: 1, plaid: 2, dots: 3, print: 4 };

const VERT_DECL = /* glsl */ `
varying vec3 vBind;
varying vec3 vBindN;
`;

const FRAG_DECL = /* glsl */ `
varying vec3 vBind;
varying vec3 vBindN;
uniform vec3 uTrim;
uniform vec4 uPat;   // id, scale, strength, unused
uniform vec4 uOpen;  // placketFrom, buttons, zipFrom, pocket (0 none, 1 pouch, 2 chest)
uniform vec4 uWaist; // from, to, belt, denim
uniform vec3 uBody;  // minY, height, hemAt
float aaStep(float edge, float x) { float w = fwidth(x) * 0.8; return smoothstep(edge - w, edge + w, x); }
float band(float lo, float hi, float x) { return aaStep(lo, x) * (1.0 - aaStep(hi, x)); }
`;

const FRAG_BODY = /* glsl */ `
{
  float y01 = (vBind.y - uBody.x) / uBody.y;
  float front = smoothstep(0.15, 0.45, vBindN.z);
  vec3 base = diffuseColor.rgb;
  // which horizontal coordinate runs across the surface here
  float across = abs(vBindN.z) > abs(vBindN.x) ? vBind.x : vBind.z;
  float s = max(uPat.y, 0.005);
  if (uPat.x > 0.5 && uPat.x < 1.5) {
    float m = aaStep(0.5, abs(fract(vBind.y / s) - 0.5) * 2.0);
    base = mix(base, uTrim, m * uPat.z);
  } else if (uPat.x > 1.5 && uPat.x < 2.5) {
    float a = aaStep(0.5, abs(fract(vBind.y / s) - 0.5) * 2.0);
    float b = aaStep(0.5, abs(fract(across / s) - 0.5) * 2.0);
    base = mix(base, uTrim, (a + b) * 0.5 * uPat.z);
    float la = 1.0 - aaStep(0.06, abs(fract(vBind.y / s + 0.25) - 0.5));
    float lb = 1.0 - aaStep(0.06, abs(fract(across / s + 0.25) - 0.5));
    base *= 1.0 - 0.22 * max(la, lb) * uPat.z;
  } else if (uPat.x > 2.5 && uPat.x < 3.5) {
    vec2 cell = vec2(across, vBind.y) / s;
    cell.x += step(1.0, mod(floor(cell.y), 2.0)) * 0.5;
    float d = length(fract(cell) - 0.5);
    base = mix(base, uTrim, (1.0 - aaStep(0.2, d)) * uPat.z);
  } else if (uPat.x > 3.5) {
    // a simple round chest print
    float d = length(vec2(vBind.x, (y01 - 0.725) * uBody.y));
    float ring = band(0.045, 0.06, d);
    float dotc = 1.0 - aaStep(0.028, d);
    base = mix(base, uTrim, max(ring, dotc) * front * uPat.z);
  }
  // front opening: a placket line and buttons, or a zip
  float ax = abs(vBind.x);
  if (uOpen.x > 0.0) {
    float on = front * aaStep(uOpen.x, y01);
    base *= 1.0 - 0.2 * on * band(0.013, 0.017, ax);
    if (uOpen.y > 0.5) {
      float by = fract(vBind.y / 0.082);
      float d = length(vec2(vBind.x, (by - 0.5) * 0.082));
      base = mix(base, uTrim, on * (1.0 - aaStep(0.0085, d)));
    }
  }
  if (uOpen.z > 0.0) {
    float on = front * aaStep(uOpen.z, y01);
    base = mix(base, uTrim, on * (1.0 - aaStep(0.0045, ax)) * 0.85);
  }
  if (uOpen.w > 0.5 && uOpen.w < 1.5) {
    // hoodie pouch: an outlined pocket across the belly
    float inside = band(0.575, 0.665, y01) * (1.0 - aaStep(0.125, ax));
    float inner = band(0.582, 0.658, y01) * (1.0 - aaStep(0.118, ax));
    base *= 1.0 - 0.26 * front * (inside - inner);
  } else if (uOpen.w > 1.5) {
    float px = vBind.x - 0.085;
    float inside = band(0.69, 0.74, y01) * (1.0 - aaStep(0.04, abs(px)));
    float inner = band(0.694, 0.736, y01) * (1.0 - aaStep(0.036, abs(px)));
    base *= 1.0 - 0.28 * front * (inside - inner);
  }
  // trousers: waistband, belt and buckle, denim wear
  if (uWaist.y > 0.0) {
    float wb = band(uWaist.x, uWaist.y, y01);
    base = mix(base, uWaist.z > 0.5 ? uTrim : base * 0.72, wb);
    if (uWaist.z > 0.5) {
      float buckle = wb * front * (1.0 - aaStep(0.022, ax));
      base = mix(base, vec3(0.78, 0.7, 0.45), buckle);
    }
    if (uWaist.w > 0.5) {
      float thigh = band(0.33, 0.5, y01) * front;
      base = mix(base, base * 1.28 + 0.03, thigh * 0.55);
      float cuff = 1.0 - aaStep(0.1, y01);
      base *= 1.0 - 0.12 * cuff;
    }
  }
  if (uBody.z > 0.0) {
    base = mix(base, uTrim, band(uBody.z, uBody.z + 0.016, y01));
  }
  diffuseColor.rgb = base;
}
`;

export function clothMaterial(spec: ClothSpec, bodyMinY: number, bodyHeight: number): THREE.MeshStandardMaterial {
  const cap = (c: THREE.ColorRepresentation): THREE.Color => {
    const col = new THREE.Color(c);
    const hsl = col.getHSL({ h: 0, s: 0, l: 0 });
    const max = spec.maxLightness ?? 0.78;
    if (hsl.l > max) col.setHSL(hsl.h, hsl.s, max);
    return col;
  };
  const mat = new THREE.MeshStandardMaterial({ color: cap(spec.color), roughness: spec.roughness ?? 0.92, metalness: 0, vertexColors: true });
  const uniforms = {
    uTrim: { value: cap(spec.trim ?? '#f1ece2') },
    uPat: { value: new THREE.Vector4(PATTERN_ID[spec.pattern ?? 'plain'], spec.scale ?? 0.06, spec.strength ?? 0.8, 0) },
    uOpen: {
      value: new THREE.Vector4(spec.placketFrom ?? 0, spec.buttons ? 1 : 0, spec.zipFrom ?? 0, spec.pocket === 'pouch' ? 1 : spec.pocket === 'chest' ? 2 : 0),
    },
    uWaist: { value: new THREE.Vector4(spec.waist?.[0] ?? 0, spec.waist?.[1] ?? 0, spec.belt ? 1 : 0, spec.denim ? 1 : 0) },
    uBody: { value: new THREE.Vector3(bodyMinY, Math.max(0.1, bodyHeight), spec.hemAt ?? 0) },
  };
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uniforms);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>\n${VERT_DECL}`)
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n\tvBind = position;\n\tvBindN = normalize( normal );');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>\n${FRAG_DECL}`)
      .replace('#include <color_fragment>', `#include <color_fragment>\n${FRAG_BODY}`);
  };
  mat.customProgramCacheKey = () => 'immigrant-cloth-v1';
  return mat;
}
