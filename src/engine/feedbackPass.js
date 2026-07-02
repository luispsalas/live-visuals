import * as THREE from 'three';
import { VERT } from './sources/shaderCommon.js';

// Post stage after the compositor. Two passes:
//  1) accumulate: blend the current composite with a transformed (zoom/rotate)
//     copy of the previous frame -> video-feedback trails (ping-pong targets).
//  2) display: output the accumulated frame with RGB-shift + block glitch.
// At zero settings it passes the composite through cleanly.

const ACC_FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uScene;   // current composite
  uniform sampler2D uPrev;    // previous accumulated frame
  uniform float uFeedback;    // 0 = no trails, ->1 = long trails
  uniform float uZoom, uRotate;
  uniform vec2 uOffset;
  void main() {
    vec3 scene = texture2D(uScene, vUv).rgb;
    vec2 c = vUv - 0.5;
    float s = sin(uRotate), co = cos(uRotate);
    c = mat2(co, -s, s, co) * c;   // rotate previous frame
    c *= uZoom;                    // and zoom it
    c += uOffset;
    vec3 prev = texture2D(uPrev, c + 0.5).rgb;
    gl_FragColor = vec4(max(scene, prev * uFeedback), 1.0);
  }
`;

const DISP_FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uTex;
  uniform float uRgbShift, uGlitch, uTime, uOnset;
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  void main() {
    vec2 uv = vUv;
    // Horizontal block jitter on random scanlines for the glitch look.
    float line = floor(uv.y * 40.0);
    float n = hash(vec2(line, floor(uTime * 15.0)));
    uv.x += (n - 0.5) * uGlitch * step(0.7, n);

    // Chromatic aberration, nudged on onsets.
    float shift = uRgbShift + uOnset * 0.008;
    float r = texture2D(uTex, uv + vec2(shift, 0.0)).r;
    float g = texture2D(uTex, uv).g;
    float b = texture2D(uTex, uv - vec2(shift, 0.0)).b;
    gl_FragColor = vec4(r, g, b, 1.0);
  }
`;

function quad(fragmentShader, uniforms) {
  const scene = new THREE.Scene();
  const mat = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader, uniforms });
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));
  return scene;
}

export class FeedbackPass {
  constructor() {
    const opts = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false };
    this.histA = new THREE.WebGLRenderTarget(1, 1, opts);
    this.histB = new THREE.WebGLRenderTarget(1, 1, opts);
    this.camera = new THREE.Camera();

    this.accUniforms = {
      uScene: { value: null },
      uPrev: { value: null },
      uFeedback: { value: 0 },
      uZoom: { value: 1 },
      uRotate: { value: 0 },
      uOffset: { value: new THREE.Vector2(0, 0) },
    };
    this.accScene = quad(ACC_FRAG, this.accUniforms);

    this.dispUniforms = {
      uTex: { value: null },
      uRgbShift: { value: 0 },
      uGlitch: { value: 0 },
      uTime: { value: 0 },
      uOnset: { value: 0 },
    };
    this.dispScene = quad(DISP_FRAG, this.dispUniforms);

    this.bass = 0;
    this.onset = 0;
    this.feedback = 0;
    this.rgbShift = 0;
    this.glitch = 0;
  }

  // The last accumulated frame, used by the compositor for feedback-as-key.
  prevTexture() {
    return this.histA.texture;
  }

  setSize(w, h, pr = Math.min(window.devicePixelRatio, 2)) {
    const W = Math.floor(w * pr), H = Math.floor(h * pr);
    this.histA.setSize(W, H);
    this.histB.setSize(W, H);
  }

  setFeatures(f) {
    this.bass = f.bass || 0;
    this.onset = f.onsetEnv || 0;
  }

  setState(s) {
    if (s.feedback !== undefined) this.feedback = s.feedback;
    if (s.rgbShift !== undefined) this.rgbShift = s.rgbShift;
    if (s.glitch !== undefined) this.glitch = s.glitch;
  }

  render(renderer, sceneTexture) {
    const t = performance.now() / 1000;

    // 1) accumulate current scene + transformed previous frame into histB.
    this.accUniforms.uScene.value = sceneTexture;
    this.accUniforms.uPrev.value = this.histA.texture;
    this.accUniforms.uFeedback.value = this.feedback;
    this.accUniforms.uZoom.value = 0.995 - this.bass * 0.01;  // bass blooms trails inward
    this.accUniforms.uRotate.value = 0.002 + this.onset * 0.01;
    renderer.setRenderTarget(this.histB);
    renderer.render(this.accScene, this.camera);

    // 2) display histB to screen with RGB-shift + glitch.
    this.dispUniforms.uTex.value = this.histB.texture;
    this.dispUniforms.uRgbShift.value = this.rgbShift;
    this.dispUniforms.uGlitch.value = this.glitch;
    this.dispUniforms.uTime.value = t;
    this.dispUniforms.uOnset.value = this.onset;
    renderer.setRenderTarget(null);
    renderer.render(this.dispScene, this.camera);

    // Swap history buffers for next frame.
    const tmp = this.histA;
    this.histA = this.histB;
    this.histB = tmp;
  }
}
