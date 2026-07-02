// Extracts reactive features from an AnalyserNode each frame:
// frequency bands (bass/mid/treble), loudness (RMS), onsets, and a rough tempo.
export class Features {
  constructor(analyser, sampleRate) {
    this.analyser = analyser;
    this.sampleRate = sampleRate;
    this.freq = new Uint8Array(analyser.frequencyBinCount);
    this.time = new Float32Array(analyser.fftSize);

    // Onset detection state (spectral flux with an adaptive threshold).
    this.prevSpectrum = new Float32Array(analyser.frequencyBinCount);
    this.fluxAvg = 0;
    this.onsetEnv = 0; // decaying 1->0 envelope, smooth for visuals

    // Rough tempo estimate from the spacing between onsets.
    this.lastOnsetTime = 0;
    this.intervals = [];
    this.bpm = 0;
  }

  // Convert a frequency in Hz to a frequency-bin index.
  binFor(hz) {
    const nyquist = this.sampleRate / 2;
    return Math.round((hz / nyquist) * this.freq.length);
  }

  // Average normalized magnitude (0..1) across a frequency range.
  bandEnergy(lowHz, highHz) {
    const lo = this.binFor(lowHz);
    const hi = Math.min(this.binFor(highHz), this.freq.length);
    let sum = 0;
    for (let i = lo; i < hi; i++) sum += this.freq[i];
    const n = Math.max(1, hi - lo);
    return sum / n / 255;
  }

  // `now` is seconds (performance.now() / 1000).
  update(now) {
    this.analyser.getByteFrequencyData(this.freq);
    this.analyser.getFloatTimeDomainData(this.time);

    const bass = this.bandEnergy(20, 250);
    const mid = this.bandEnergy(250, 2000);
    const treble = this.bandEnergy(2000, 12000);

    // RMS loudness from the time-domain signal (samples are -1..1).
    let sumSq = 0;
    for (let i = 0; i < this.time.length; i++) sumSq += this.time[i] * this.time[i];
    const rms = Math.sqrt(sumSq / this.time.length);

    // Spectral flux: sum of positive bin-to-bin increases since last frame.
    let flux = 0;
    for (let i = 0; i < this.freq.length; i++) {
      const v = this.freq[i] / 255;
      const diff = v - this.prevSpectrum[i];
      if (diff > 0) flux += diff;
      this.prevSpectrum[i] = v;
    }
    this.fluxAvg = this.fluxAvg * 0.95 + flux * 0.05; // adaptive baseline

    let onset = false;
    if (flux > this.fluxAvg * 1.5 && flux > 0.5 && now - this.lastOnsetTime > 0.12) {
      onset = true;
      this.onsetEnv = 1;
      if (this.lastOnsetTime > 0) {
        const interval = now - this.lastOnsetTime;
        // Keep plausible musical intervals (~40-240 BPM) for the estimate.
        if (interval > 0.25 && interval < 1.5) {
          this.intervals.push(interval);
          if (this.intervals.length > 8) this.intervals.shift();
          const avg = this.intervals.reduce((a, b) => a + b, 0) / this.intervals.length;
          this.bpm = Math.round(60 / avg);
        }
      }
      this.lastOnsetTime = now;
    }
    this.onsetEnv *= 0.9; // decay between onsets

    return { bass, mid, treble, rms, onset, onsetEnv: this.onsetEnv, bpm: this.bpm };
  }
}
