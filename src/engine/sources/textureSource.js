import * as THREE from 'three';
import { VERT, COLOR_GLSL } from './shaderCommon.js';

// A source backed by a <video> element — used for both the webcam and a video file.
// Renders the video as a "cover"-fit texture with global hue/sat + a subtle
// bass/onset zoom so it reacts a little to the music. Lives in the output window.
const FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uTex;
  uniform bool uHasTex;
  uniform vec2 uRes;      // output resolution
  uniform vec2 uTexRes;   // video resolution
  uniform float uHue, uSat, uRms, uBass, uOnset;
  uniform float uMirror;
  ${COLOR_GLSL}

  void main() {
    if (!uHasTex) { gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }

    // Cover-fit the video into the output without stretching.
    float sa = uRes.x / uRes.y;
    float ta = uTexRes.x / uTexRes.y;
    vec2 scale = (sa > ta) ? vec2(1.0, ta / sa) : vec2(sa / ta, 1.0);
    vec2 uv = (vUv - 0.5) / scale + 0.5;

    // Subtle audio-reactive zoom.
    float zoom = 1.0 - uBass * 0.08 - uOnset * 0.05;
    uv = (uv - 0.5) * zoom + 0.5;

    if (uMirror > 0.5) uv.x = 1.0 - uv.x;   // selfie-mirror the webcam

    vec3 col = texture2D(uTex, uv).rgb;
    vec3 hsv = rgb2hsv(col);
    hsv.x = fract(hsv.x + uHue);
    hsv.y = clamp(hsv.y * uSat, 0.0, 1.0);
    col = hsv2rgb(hsv);
    col *= 0.7 + uRms * 0.8;                 // loudness nudges brightness
    gl_FragColor = vec4(col, 1.0);
  }
`;

export class TextureSource {
  constructor(opts = {}) {
    this.video = document.createElement('video');
    this.video.muted = true;
    this.video.playsInline = true;
    this.video.loop = true;
    this.texture = null;
    this.stream = null;
    this.objectUrl = null; // revoked when a new video is loaded / on stop

    this.uniforms = {
      uTex: { value: null },
      uHasTex: { value: false },
      uRes: { value: new THREE.Vector2(1, 1) },
      uTexRes: { value: new THREE.Vector2(16, 9) },
      uHue: { value: 0 },
      uSat: { value: 1 },
      uRms: { value: 0 },
      uBass: { value: 0 },
      uOnset: { value: 0 },
      uMirror: { value: opts.mirror ? 1 : 0 },
    };

    this.scene = new THREE.Scene();
    this.camera = new THREE.Camera();
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: this.uniforms,
    });
    this.scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));
  }

  _ready() {
    if (this.texture) this.texture.dispose(); // free the previous GPU texture
    this.texture = new THREE.VideoTexture(this.video);
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
    this.uniforms.uTex.value = this.texture;
    this.uniforms.uHasTex.value = true;
    this.uniforms.uTexRes.value.set(this.video.videoWidth || 16, this.video.videoHeight || 9);
  }

  async useCamera() {
    try {
      this.stop();
      this.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      this.video.srcObject = this.stream;
      await this.video.play();
      if (this.video.videoWidth) this._ready();
      else this.video.onloadedmetadata = () => this._ready();
    } catch (e) {
      console.error('Camera error:', e);
    }
  }

  useBlob(blob) {
    this.stop();
    this.video.srcObject = null;
    if (this.objectUrl) URL.revokeObjectURL(this.objectUrl); // free the previous blob URL
    this.objectUrl = URL.createObjectURL(blob);
    this.video.src = this.objectUrl;
    this.video.onloadeddata = () => {
      this.video.play();
      this._ready();
    };
  }

  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    this.video.pause(); // don't keep decoding an unseen file video
    if (this.texture) { this.texture.dispose(); this.texture = null; this.uniforms.uTex.value = null; }
    this.uniforms.uHasTex.value = false;
  }

  setFeatures(f) {
    this.uniforms.uRms.value = f.rms || 0;
    this.uniforms.uBass.value = f.bass || 0;
    this.uniforms.uOnset.value = f.onsetEnv || 0;
  }

  setState(s) {
    if (s.hue !== undefined) this.uniforms.uHue.value = s.hue;
    if (s.sat !== undefined) this.uniforms.uSat.value = s.sat;
  }

  setSize(w, h) {
    this.uniforms.uRes.value.set(w, h);
  }

  render(renderer, target = null) {
    if (this.texture) this.texture.needsUpdate = true;
    renderer.setRenderTarget(target);
    renderer.render(this.scene, this.camera);
    renderer.setRenderTarget(null);
  }
}
