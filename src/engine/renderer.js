import * as THREE from 'three';
import { ShaderSource } from './sources/shaderSource.js';
import { TextureSource } from './sources/textureSource.js';
import { GENERATIVE } from './sources/generative.js';
import { Compositor } from './compositor.js';
import { FeedbackPass } from './feedbackPass.js';

// Owns the WebGL renderer, the source list, and the compositor. Source order
// must match manifest.js: generative sources first, then camera, then video.
export class Renderer {
  constructor(canvas) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.quality = 1; // internal render-scale (1 = full; lower = more headroom)

    const generative = GENERATIVE.map((def) => new ShaderSource(def));
    this.cameraSource = new TextureSource({ mirror: true });
    this.videoSource = new TextureSource({ mirror: false });
    this.sources = [...generative, this.cameraSource, this.videoSource];

    this.compositor = new Compositor(this.renderer, this.sources);
    this.feedback = new FeedbackPass();

    // Compositor renders here; the feedback pass consumes it and draws to screen.
    this.sceneTarget = new THREE.WebGLRenderTarget(1, 1, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: false,
    });

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    // Effective pixel ratio, scaled by the quality setting, applied everywhere.
    const pr = Math.min(window.devicePixelRatio, 2) * this.quality;
    this.renderer.setPixelRatio(pr);
    this.renderer.setSize(w, h, false);
    this.compositor.setSize(w, h, pr);
    this.feedback.setSize(w, h, pr);
    this.sceneTarget.setSize(Math.floor(w * pr), Math.floor(h * pr));
  }

  // Render-scale 0..1; lower = fewer pixels shaded = more GPU headroom (for 4K etc.).
  setQuality(q) {
    this.quality = Math.max(0.1, Math.min(1, q));
    this.resize();
  }

  setFeatures(f) {
    this.compositor.setFeatures(f);
    this.feedback.setFeatures(f);
  }

  setState(s) {
    if (s.slotA !== undefined || s.slotB !== undefined) {
      this.compositor.setSlots(s.slotA, s.slotB);
    }
    if (s.mix !== undefined) this.compositor.setMix(s.mix);
    this.compositor.setState(s);
    this.feedback.setState(s);
  }

  enableCamera(on) {
    if (on) this.cameraSource.useCamera();
    else this.cameraSource.stop();
  }

  loadVideo(blob) {
    this.videoSource.useBlob(blob);
  }

  render() {
    // Give the compositor last frame's feedback buffer (for feedback-as-key).
    this.compositor.setPrevFrame(this.feedback.prevTexture());
    this.compositor.render(this.sceneTarget);
    this.feedback.render(this.renderer, this.sceneTarget.texture);
  }
}
