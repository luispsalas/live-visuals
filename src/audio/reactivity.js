// Reactive "modes": reshape the raw feature stream before it drives the visuals.
// Think of each mode as inserting [slide]/[onepole~] smoothing on the bands and a
// [line]-style decay envelope on transients, with adjustable gain. No shader
// changes needed — this just changes the control signals feeding them.
//
//   bandSmooth : one-pole smoothing factor for bands/RMS (higher = smoother/slower)
//   onsetGain  : peak height of the transient envelope (lower = gentler punches)
//   onsetDecay : per-frame decay of that envelope (higher = longer, more ambient)

// Gradient from snappy → static. `static: true` means visuals don't react at all
// (steady nominal values), so they still animate on time alone.
export const REACTIVITY_MODES = {
  punchy:  { name: 'Punchy',        bandSmooth: 0.40, onsetGain: 1.00, onsetDecay: 0.88 },
  smooth:  { name: 'Smooth',        bandSmooth: 0.65, onsetGain: 0.55, onsetDecay: 0.93 },
  mellow:  { name: 'Mellow',        bandSmooth: 0.80, onsetGain: 0.35, onsetDecay: 0.955 },
  ambient: { name: 'Ambient',       bandSmooth: 0.92, onsetGain: 0.12, onsetDecay: 0.985 },
  none:    { name: 'None (static)', static: true },
};

export class Reactivity {
  constructor() {
    this.bass = 0;
    this.mid = 0;
    this.treble = 0;
    this.rms = 0;
    this.env = 0;
  }

  process(raw, modeKey) {
    const m = REACTIVITY_MODES[modeKey] || REACTIVITY_MODES.punchy;

    // No reactivity: steady nominal values, visuals animate on uTime only.
    if (m.static) {
      return { bass: 0.4, mid: 0.4, treble: 0.4, rms: 0.35, onset: false, onsetEnv: 0, bpm: raw.bpm };
    }

    const a = m.bandSmooth; // one-pole: new = old*a + raw*(1-a)
    this.bass = this.bass * a + raw.bass * (1 - a);
    this.mid = this.mid * a + raw.mid * (1 - a);
    this.treble = this.treble * a + raw.treble * (1 - a);
    this.rms = this.rms * a + raw.rms * (1 - a);

    if (raw.onset) this.env = m.onsetGain; // bang -> set envelope peak
    else this.env *= m.onsetDecay;         // otherwise decay it down

    return {
      bass: this.bass,
      mid: this.mid,
      treble: this.treble,
      rms: this.rms,
      onset: raw.onset,
      onsetEnv: this.env,
      bpm: raw.bpm,
    };
  }
}
