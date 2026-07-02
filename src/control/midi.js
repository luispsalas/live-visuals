// Web MIDI input for the Akai MPD26 (or any controller).
//
// Bindings map an exact MIDI message (type + number) to a target:
//   - preset target  -> a pad (Note On)  selects a preset
//   - param target   -> a knob/fader (CC) drives a parameter 0..1
//
// Because bindings are tied to specific note/CC numbers, the app only reacts to
// the controls you actually learn here. That's how it shares the MPD26 with
// Ableton without collision: learn the app to one pad bank, map Ableton to the
// other (see README). No MIDI-channel filtering needed.

const STORAGE_KEY = 'live-visuals-midi';
const NOTE_ON = 0x90;
const CC = 0xb0;

function loadBindings() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch (e) {
    return {};
  }
}

export class MidiInput {
  constructor() {
    this.access = null;
    this.bindings = loadBindings(); // key "type,number" -> target
    this.learnTarget = null;
    this.onUserPreset = null; // (id) => void      saved preset pad
    this.onParam = null;      // (name, value0to1) => void
    this.onLearned = null;    // () => void, to refresh UI
    this.onStatus = null;     // (text) => void
  }

  async connect() {
    this.access = await navigator.requestMIDIAccess({ sysex: false });
    const attach = () => {
      const names = [];
      for (const input of this.access.inputs.values()) {
        input.onmidimessage = (e) => this._handle(e);
        names.push(input.name);
      }
      this.onStatus && this.onStatus(names.length ? `MIDI: ${names.join(', ')}` : 'MIDI: no inputs');
    };
    attach();
    this.access.onstatechange = attach; // re-attach on plug/unplug
  }

  // target = { kind:'preset', index } | { kind:'param', name }
  startLearn(target) {
    this.learnTarget = target;
  }

  // Human-readable label for whatever (if anything) is bound to this target.
  bindingLabel(target) {
    for (const [key, t] of Object.entries(this.bindings)) {
      if (this._sameTarget(t, target)) {
        const [type, num] = key.split(',').map(Number);
        return `${type === NOTE_ON ? 'pad' : 'CC'} ${num}`;
      }
    }
    return 'unmapped';
  }

  _sameTarget(a, b) {
    if (a.kind !== b.kind) return false;
    if (a.kind === 'preset') return a.index === b.index;
    if (a.kind === 'userPreset') return a.id === b.id;
    return a.name === b.name; // param
  }

  // Wipe every binding (used by the "Reset all MIDI mappings" button).
  clearAll() {
    this.bindings = {};
    localStorage.removeItem(STORAGE_KEY);
  }

  // Remove any binding pointing at a target (e.g. when a user preset is deleted).
  clearBinding(target) {
    let changed = false;
    for (const key of Object.keys(this.bindings)) {
      if (this._sameTarget(this.bindings[key], target)) {
        delete this.bindings[key];
        changed = true;
      }
    }
    if (changed) localStorage.setItem(STORAGE_KEY, JSON.stringify(this.bindings));
  }

  _handle(e) {
    const [status, d1, d2] = e.data;
    const type = status & 0xf0;

    if (this.learnTarget) {
      // Pads (Note On) bind presets; CCs bind params.
      const want = this.learnTarget.kind === 'param' ? CC : NOTE_ON;
      if (type !== want) return;
      // Clear any previous binding to this target, then set the new one.
      for (const key of Object.keys(this.bindings)) {
        if (this._sameTarget(this.bindings[key], this.learnTarget)) delete this.bindings[key];
      }
      this.bindings[`${type},${d1}`] = this.learnTarget;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.bindings));
      this.learnTarget = null;
      this.onLearned && this.onLearned();
      return;
    }

    const target = this.bindings[`${type},${d1}`];
    if (!target) return;
    if (target.kind === 'userPreset' && type === NOTE_ON && d2 > 0) {
      this.onUserPreset && this.onUserPreset(target.id);
    } else if (target.kind === 'param' && type === CC) {
      this.onParam && this.onParam(target.name, d2 / 127);
    }
  }
}
