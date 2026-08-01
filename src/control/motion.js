// Motion analysis: frame-differencing the camera into a control signal — the
// visual counterpart to the audio features. Movement in front of the lens becomes
// a 0..1 value that can drive parameters, so a performer's gestures shape the
// visuals the same way the music does.
//
// Lives in the control window alongside the audio analyser (renderers stay pure
// and just consume the broadcast features). Deliberately tiny: motion is a coarse
// signal, so a 64x48 difference is plenty and stays cheap enough to run on the
// audio clock — which matters, because that clock keeps ticking when the control
// window is hidden behind the fullscreen output, and requestAnimationFrame does not.

const W = 64, H = 48;
const MIN_INTERVAL = 1 / 30; // analysing faster than this buys nothing
// Per-pixel change (summed RGB, max 765) below this is treated as sensor noise and
// ignored, so a still room reads as a flat zero instead of a shimmering floor.
const NOISE_FLOOR = 30;
// Turns the mean change into a usable 0..1 control: calibrated so an ordinary
// gesture lands mid-range rather than in the bottom tenth.
const GAIN = 20;

export class MotionAnalyser {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = W;
    this.canvas.height = H;
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    this.prev = null;      // previous downscaled frame
    this.video = null;
    this.raw = 0;          // latest sample, unsmoothed
    this.value = 0;        // smoothed 0..1 — the signal used for routing
    this.env = 0;          // decaying envelope, spikes on sudden movement
    this.sensitivity = 1;
    this.smooth = 0.75;    // higher = calmer
    this.last = 0;
  }

  // The <video> to watch (the preview renderer's camera), or null to stop.
  setVideo(video) {
    if (video === this.video) return;
    this.video = video;
    this.prev = null; // the stored frame belongs to the old feed
  }

  reset() {
    this.prev = null;
    this.raw = this.value = this.env = 0;
  }

  update(now) {
    const v = this.video;
    if (!v || v.readyState < 2 || !v.videoWidth || v.paused) {
      this.reset();
      return this.read();
    }

    let sampled = false;
    if (now - this.last >= MIN_INTERVAL) {
      this.last = now;
      this._sample();
      sampled = true;
    }

    // Smoothing and decay run every call, not just on sample frames, so the
    // signal stays continuous instead of stepping at the analysis rate.
    this.value += (this.raw - this.value) * (1 - this.smooth);
    this.env *= 0.94;
    if (sampled) this.env = Math.max(this.env, this.raw);
    return this.read();
  }

  _sample() {
    this.ctx.drawImage(this.video, 0, 0, W, H);
    const cur = this.ctx.getImageData(0, 0, W, H).data;
    if (!this.prev || this.prev.length !== cur.length) {
      this.prev = new Uint8ClampedArray(cur); // first frame: nothing to compare
      this.raw = 0;
      return;
    }
    let sum = 0;
    for (let i = 0; i < cur.length; i += 4) {
      const d = Math.abs(cur[i] - this.prev[i])
              + Math.abs(cur[i + 1] - this.prev[i + 1])
              + Math.abs(cur[i + 2] - this.prev[i + 2]);
      if (d > NOISE_FLOOR) sum += d; // gate per pixel, so noise never accumulates
    }
    this.prev.set(cur);
    const mean = sum / ((cur.length / 4) * 765); // 765 = max RGB distance
    this.raw = Math.min(1, mean * GAIN * this.sensitivity);
  }

  read() {
    return { motion: this.value, motionEnv: this.env };
  }
}
