import * as THREE from 'three';
import { VERT, PRELUDE } from './shaderCommon.js';

// A single full-screen generative shader source. Wraps the shared prelude + a
// source body into a ShaderMaterial on a full-screen quad. Can render straight
// to screen (Phase 2) or into a render target (compositor, Phase 3+).
export class ShaderSource {
  constructor(def) {
    this.id = def.id;
    this.name = def.name;

    this.uniforms = {
      uTime: { value: 0 },
      uBass: { value: 0 },
      uMid: { value: 0 },
      uTreble: { value: 0 },
      uRms: { value: 0 },
      uOnset: { value: 0 },
      uMotion: { value: 0 },
      uMotionEnv: { value: 0 },
      uHue: { value: 0 },
      uSat: { value: 1 },
      uRes: { value: new THREE.Vector2(1, 1) },
    };

    this.scene = new THREE.Scene();
    this.camera = new THREE.Camera();
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: PRELUDE + '\n' + def.body,
      uniforms: this.uniforms,
    });
    this.scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));
  }

  setFeatures(f) {
    const u = this.uniforms;
    u.uBass.value = f.bass || 0;
    u.uMid.value = f.mid || 0;
    u.uTreble.value = f.treble || 0;
    u.uRms.value = f.rms || 0;
    u.uOnset.value = f.onsetEnv || 0;
    u.uMotion.value = f.motion || 0;
    u.uMotionEnv.value = f.motionEnv || 0;
  }

  setState(s) {
    if (s.hue !== undefined) this.uniforms.uHue.value = s.hue;
    if (s.sat !== undefined) this.uniforms.uSat.value = s.sat;
  }

  setSize(w, h) {
    this.uniforms.uRes.value.set(w, h);
  }

  // target = null renders to the screen; pass a WebGLRenderTarget to render off-screen.
  render(renderer, target = null) {
    this.uniforms.uTime.value = performance.now() / 1000;
    renderer.setRenderTarget(target);
    renderer.render(this.scene, this.camera);
    renderer.setRenderTarget(null);
  }
}
