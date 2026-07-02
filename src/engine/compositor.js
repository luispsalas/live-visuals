import * as THREE from 'three';
import { VERT } from './sources/shaderCommon.js';

// Compositing options for the A/B mix, shared with the control UI.
export const BLEND_MODES = [
  { id: 'mix', name: 'Mix' },
  { id: 'add', name: 'Add' },
  { id: 'screen', name: 'Screen' },
  { id: 'multiply', name: 'Multiply' },
  { id: 'difference', name: 'Difference' },
  { id: 'lighten', name: 'Lighten' },
  { id: 'darken', name: 'Darken' },
  { id: 'overlay', name: 'Overlay' },
];
export const KEY_SOURCES = [
  { id: 'a', name: 'Source A' },
  { id: 'b', name: 'Source B' },
  { id: 'prev', name: 'Feedback' }, // previous output frame = feedback-as-key
];
const BLEND_INDEX = Object.fromEntries(BLEND_MODES.map((m, i) => [m.id, i]));
const KEY_INDEX = Object.fromEntries(KEY_SOURCES.map((k, i) => [k.id, i]));

// Combines slots A and B: a blend mode overlaps them, and an optional luma key
// gates where B (the blended layer) shows through, using the luminance of A, B,
// or the previous frame (feedback) as the matte. uMix is the overall opacity.
const MIX_FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D texA;
  uniform sampler2D texB;
  uniform sampler2D uPrevFrame;   // last output frame, for feedback keying
  uniform float uMix;
  uniform float uBlendMode;
  uniform float uKey;             // 0 off, 1 on
  uniform float uKeySource;       // 0 A, 1 B, 2 previous frame
  uniform float uKeyThresh, uKeySoft, uKeyInvert;

  float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

  vec3 blend(vec3 a, vec3 b, float m) {
    if (m < 0.5) return b;                          // mix (plain crossfade)
    if (m < 1.5) return a + b;                       // add
    if (m < 2.5) return 1.0 - (1.0 - a) * (1.0 - b); // screen
    if (m < 3.5) return a * b;                       // multiply
    if (m < 4.5) return abs(a - b);                  // difference
    if (m < 5.5) return max(a, b);                   // lighten
    if (m < 6.5) return min(a, b);                   // darken
    return vec3(                                     // overlay
      a.r < 0.5 ? 2.0 * a.r * b.r : 1.0 - 2.0 * (1.0 - a.r) * (1.0 - b.r),
      a.g < 0.5 ? 2.0 * a.g * b.g : 1.0 - 2.0 * (1.0 - a.g) * (1.0 - b.g),
      a.b < 0.5 ? 2.0 * a.b * b.b : 1.0 - 2.0 * (1.0 - a.b) * (1.0 - b.b));
  }

  void main() {
    vec3 a = texture2D(texA, vUv).rgb;
    vec3 b = texture2D(texB, vUv).rgb;
    vec3 blended = clamp(blend(a, b, uBlendMode), 0.0, 1.0);

    float amount = uMix;
    if (uKey > 0.5) {
      vec3 keyTex = uKeySource < 0.5 ? a : (uKeySource < 1.5 ? b : texture2D(uPrevFrame, vUv).rgb);
      float mask = smoothstep(uKeyThresh - uKeySoft, uKeyThresh + uKeySoft, luma(keyTex));
      if (uKeyInvert > 0.5) mask = 1.0 - mask;
      amount *= mask;
    }
    gl_FragColor = vec4(mix(a, blended, amount), 1.0);
  }
`;

export class Compositor {
  constructor(renderer, sources) {
    this.renderer = renderer;
    this.sources = sources;
    this.a = 0;
    this.b = 1;
    this.mix = 0;

    const opts = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false };
    this.targetA = new THREE.WebGLRenderTarget(1, 1, opts);
    this.targetB = new THREE.WebGLRenderTarget(1, 1, opts);

    this.uniforms = {
      texA: { value: this.targetA.texture },
      texB: { value: this.targetB.texture },
      uPrevFrame: { value: this.targetA.texture }, // set each frame by the renderer
      uMix: { value: 0 },
      uBlendMode: { value: 0 },
      uKey: { value: 0 },
      uKeySource: { value: 1 },
      uKeyThresh: { value: 0.5 },
      uKeySoft: { value: 0.1 },
      uKeyInvert: { value: 0 },
    };
    this.scene = new THREE.Scene();
    this.camera = new THREE.Camera();
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: MIX_FRAG,
      uniforms: this.uniforms,
    });
    this.scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));
  }

  setSize(w, h, pr = Math.min(window.devicePixelRatio, 2)) {
    const W = Math.floor(w * pr), H = Math.floor(h * pr);
    this.targetA.setSize(W, H);
    this.targetB.setSize(W, H);
    this.sources.forEach((s) => s.setSize(w, h));
  }

  setSlots(a, b) {
    if (a !== undefined) this.a = a;
    if (b !== undefined) this.b = b;
  }

  setMix(m) {
    this.mix = m;
  }

  // Previous output frame, used when keying from "Feedback".
  setPrevFrame(texture) {
    if (texture) this.uniforms.uPrevFrame.value = texture;
  }

  setFeatures(f) {
    this.sources[this.a].setFeatures(f);
    if (this.b !== this.a) this.sources[this.b].setFeatures(f);
  }

  setState(s) {
    this.sources.forEach((src) => src.setState && src.setState(s));
    if (s.blend !== undefined) this.uniforms.uBlendMode.value = BLEND_INDEX[s.blend] ?? 0;
    if (s.keyOn !== undefined) this.uniforms.uKey.value = s.keyOn ? 1 : 0;
    if (s.keySource !== undefined) this.uniforms.uKeySource.value = KEY_INDEX[s.keySource] ?? 1;
    if (s.keyThreshold !== undefined) this.uniforms.uKeyThresh.value = s.keyThreshold;
    if (s.keySoftness !== undefined) this.uniforms.uKeySoft.value = s.keySoftness;
    if (s.keyInvert !== undefined) this.uniforms.uKeyInvert.value = s.keyInvert ? 1 : 0;
  }

  // target = null renders to screen; pass a target to feed the feedback pass.
  render(target = null) {
    this.uniforms.uMix.value = this.mix;
    this.sources[this.a].render(this.renderer, this.targetA);
    this.sources[this.b].render(this.renderer, this.targetB);
    this.renderer.setRenderTarget(target);
    this.renderer.render(this.scene, this.camera);
    this.renderer.setRenderTarget(null);
  }
}
