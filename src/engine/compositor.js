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
// How the matte is derived: from brightness, or from how far the frame has moved
// away from a captured still ("background plate") of the same feed.
export const KEY_MODES = [
  { id: 'luma', name: 'Luma (brightness)' },
  { id: 'difference', name: 'Difference (vs captured BG)' },
];
const BLEND_INDEX = Object.fromEntries(BLEND_MODES.map((m, i) => [m.id, i]));
const KEY_INDEX = Object.fromEntries(KEY_SOURCES.map((k, i) => [k.id, i]));
const KEY_MODE_INDEX = Object.fromEntries(KEY_MODES.map((m, i) => [m.id, i]));

// Combines slots A and B: a blend mode overlaps them, and an optional luma key
// gates where B (the blended layer) shows through, using the luminance of A, B,
// or the previous frame (feedback) as the matte. uMix is the overall opacity.
const MIX_FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D texA;
  uniform sampler2D texB;
  uniform sampler2D uPrevFrame;   // last output frame, for feedback keying
  uniform sampler2D uKeyRef;      // captured background plate, for difference keying
  uniform float uMix;
  uniform float uBlendMode;
  uniform float uKey;             // 0 off, 1 on
  uniform float uKeySource;       // 0 A, 1 B, 2 previous frame
  uniform float uKeyMode;         // 0 luma, 1 difference
  uniform float uHasKeyRef;       // 0 until a background plate is captured
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
      float mask;
      if (uKeyMode > 0.5) {
        // Difference key: distance from the captured still. Whatever has changed
        // since the plate was grabbed (a person walking in) becomes the matte.
        vec3 plate = texture2D(uKeyRef, vUv).rgb;
        mask = smoothstep(uKeyThresh - uKeySoft, uKeyThresh + uKeySoft, length(keyTex - plate));
        if (uHasKeyRef < 0.5) mask = 1.0;   // nothing captured yet: pass through
      } else {
        mask = smoothstep(uKeyThresh - uKeySoft, uKeyThresh + uKeySoft, luma(keyTex));
      }
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
    // Holds the still "background plate" grabbed for difference keying.
    this.refTarget = new THREE.WebGLRenderTarget(1, 1, opts);
    this.captureRequested = false;

    this.uniforms = {
      texA: { value: this.targetA.texture },
      texB: { value: this.targetB.texture },
      uPrevFrame: { value: this.targetA.texture }, // set each frame by the renderer
      uKeyRef: { value: this.refTarget.texture },
      uMix: { value: 0 },
      uBlendMode: { value: 0 },
      uKey: { value: 0 },
      uKeySource: { value: 1 },
      uKeyMode: { value: 0 },
      uHasKeyRef: { value: 0 },
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

    // Plain blit, used once per capture to freeze the key source into refTarget.
    this.copyUniforms = { uTex: { value: null } };
    this.copyScene = new THREE.Scene();
    this.copyScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: `
        precision highp float;
        varying vec2 vUv;
        uniform sampler2D uTex;
        void main() { gl_FragColor = vec4(texture2D(uTex, vUv).rgb, 1.0); }
      `,
      uniforms: this.copyUniforms,
    })));
  }

  // Grab the current key-source frame as the difference-key background plate.
  // Applied on the next render, when the source targets hold this frame.
  captureKeyRef() {
    this.captureRequested = true;
  }

  clearKeyRef() {
    this.captureRequested = false;
    this.uniforms.uHasKeyRef.value = 0;
  }

  setSize(w, h, pr = Math.min(window.devicePixelRatio, 2)) {
    const W = Math.floor(w * pr), H = Math.floor(h * pr);
    this.targetA.setSize(W, H);
    this.targetB.setSize(W, H);
    // Resizing wipes the plate's contents, so it has to be re-captured.
    if (this.refTarget.width !== W || this.refTarget.height !== H) {
      this.refTarget.setSize(W, H);
      this.uniforms.uHasKeyRef.value = 0;
    }
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
    if (s.keyMode !== undefined) this.uniforms.uKeyMode.value = KEY_MODE_INDEX[s.keyMode] ?? 0;
    if (s.keyThreshold !== undefined) this.uniforms.uKeyThresh.value = s.keyThreshold;
    if (s.keySoftness !== undefined) this.uniforms.uKeySoft.value = s.keySoftness;
    if (s.keyInvert !== undefined) this.uniforms.uKeyInvert.value = s.keyInvert ? 1 : 0;
  }

  // target = null renders to screen; pass a target to feed the feedback pass.
  render(target = null) {
    this.uniforms.uMix.value = this.mix;
    this.sources[this.a].render(this.renderer, this.targetA);
    this.sources[this.b].render(this.renderer, this.targetB);

    // Freeze the key source into the plate — after the sources have rendered, so
    // it captures the frame the user is actually looking at.
    if (this.captureRequested) {
      const src = this.uniforms.uKeySource.value;
      this.copyUniforms.uTex.value =
        src < 0.5 ? this.targetA.texture
        : src < 1.5 ? this.targetB.texture
        : this.uniforms.uPrevFrame.value;
      this.renderer.setRenderTarget(this.refTarget);
      this.renderer.render(this.copyScene, this.camera);
      this.captureRequested = false;
      this.uniforms.uHasKeyRef.value = 1;
    }

    this.renderer.setRenderTarget(target);
    this.renderer.render(this.scene, this.camera);
    this.renderer.setRenderTarget(null);
  }
}
