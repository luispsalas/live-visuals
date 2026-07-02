// BPM-synced LFOs ("loops"): slow, tempo-locked motion that runs as a counterpoint
// to the fast transient-driven effects. Each loop modulates one parameter on top of
// its base (slider) value.

// Cycle lengths in beats (assuming 4/4, so 1 bar = 4 beats).
export const DIVISIONS = [
  { label: '¼ beat', beats: 0.25 },
  { label: '½ beat', beats: 0.5 },
  { label: '1 beat', beats: 1 },
  { label: '2 beats', beats: 2 },
  { label: '1 bar', beats: 4 },
  { label: '2 bars', beats: 8 },
  { label: '4 bars', beats: 16 },
  { label: '8 bars', beats: 32 },
];

export const SHAPES = ['ramp', 'sine', 'triangle', 'square'];

// Value of a shape at phase 0..1. `ramp` returns 0..1 (one-way sweep, good for hue
// rotation); the rest return -1..1 (oscillate around the base value).
export function shapeValue(shape, phase) {
  switch (shape) {
    case 'ramp': return phase;
    case 'sine': return Math.sin(2 * Math.PI * phase);
    case 'triangle': return 1 - 4 * Math.abs(phase - 0.5);
    case 'square': return phase < 0.5 ? 1 : -1;
    default: return 0;
  }
}
