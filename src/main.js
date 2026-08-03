import { AudioEngine } from './audio/audioEngine.js';
import { Features } from './audio/features.js';
import { Reactivity, REACTIVITY_MODES } from './audio/reactivity.js';
import { SOURCE_LIST, CAMERA_INDEX, VIDEO_INDEX } from './engine/sources/manifest.js';
import { BLEND_MODES, KEY_SOURCES, KEY_MODES } from './engine/compositor.js';
import { MidiInput } from './control/midi.js';
import { DIVISIONS, SHAPES, shapeValue } from './control/loops.js';
import { MotionAnalyser } from './control/motion.js';
import { listUserPresets, saveUserPreset, removeUserPreset } from './control/userPresets.js';
import { attachRenderer } from './engine/attachRenderer.js';
import { createChannel } from './sync.js';

// Control window (laptop): captures audio, computes + shapes features, shows the
// control panel, reads the MIDI controller, and streams everything to the output
// window. Keep your DAW + this panel on the laptop; output goes to the projector.
const channel = createChannel();
const audio = new AudioEngine();
const midi = new MidiInput();
const reactivity = new Reactivity();
const motion = new MotionAnalyser();
let features = null;
let outputWin = null;
let cameraOn = false;
let cameraDeviceId = null; // chosen camera (empty = default); not saved in presets

// App state mirrored to the output window (reactivity + loops are used locally).
const state = {
  slotA: 0, slotB: 1, mix: 0,
  hue: 0, sat: 1,
  feedback: 0, rgbShift: 0, glitch: 0,
  // Degradation FX, applied in the display pass.
  pixelate: 0, posterize: 0, scanlines: 0, grain: 0,
  reactivity: 'punchy',
  // Compositing: how A and B overlap, and optional luma key.
  blend: 'mix',
  keyOn: false, keySource: 'b', keyMode: 'luma',
  keyThreshold: 0.5, keySoftness: 0.1, keyInvert: false,
  // Camera movement as a control signal, routed onto parameters (stacks with loops).
  motionOn: false, motionSens: 1,
  motionRoutes: [
    { target: 'mix',      enabled: false, depth: 0.5 },
    { target: 'feedback', enabled: false, depth: 0.5 },
    { target: 'glitch',   enabled: false, depth: 0.5 },
  ],
  // One BPM-synced loop per modulatable target; each adds motion on top of the base.
  loops: [
    { target: 'hue',          enabled: false, beats: 16, shape: 'ramp',     depth: 1.0 },
    { target: 'sat',          enabled: false, beats: 8,  shape: 'sine',     depth: 0.5 },
    { target: 'mix',          enabled: false, beats: 8,  shape: 'triangle', depth: 0.5 },
    { target: 'feedback',     enabled: false, beats: 8,  shape: 'sine',     depth: 0.5 },
    { target: 'keyThreshold', enabled: false, beats: 4,  shape: 'sine',     depth: 0.5 },
  ],
};

// Tempo for the loops — kept out of `state` so recalling a preset mid-song doesn't
// change the BPM. Pre-filled from the auto-estimate until the user sets it.
let tempo = 120;
let bpmLocked = false;
let phaseStart = performance.now() / 1000; // loop phase origin (re-aligned by Tap/Sync)
let tapTimes = [];
let quality = 1; // render-scale, per-machine perf setting (kept out of presets)
let motionLevel = 0; // latest smoothed motion reading, used by the routes
const motionRouteEls = [];
let noSoundActive = false;
let noSoundRafId = null;
const loopRowEls = []; // DOM refs per loop row, indexed alongside state.loops

const el = (id) => document.getElementById(id);
const ui = {
  inputs: el('inputs'),
  refresh: el('refresh'),
  start: el('start'),
  openOutput: el('open-output'),
  modeNote: el('mode-note'),
  previewCanvas: el('preview-canvas'),
  slotA: el('slot-a'),
  slotB: el('slot-b'),
  mix: el('mix'),
  hue: el('hue'),
  sat: el('sat'),
  feedback: el('feedback'),
  rgbShift: el('rgb-shift'),
  glitch: el('glitch'),
  pixelate: el('pixelate'),
  posterize: el('posterize'),
  scanlines: el('scanlines'),
  grain: el('grain'),
  blend: el('blend'),
  keyOn: el('key-on'),
  keySource: el('key-source'),
  keyMode: el('key-mode'),
  keyCapture: el('key-capture'),
  keyClear: el('key-clear'),
  keyBgStatus: el('key-bg-status'),
  keyThreshold: el('key-threshold'),
  keySoftness: el('key-softness'),
  keyInvert: el('key-invert'),
  reactivityMode: el('reactivity'),
  bpmInput: el('bpm-input'),
  bpmTap: el('bpm-tap'),
  bpmSync: el('bpm-sync'),
  bpmDetected: el('bpm-detected'),
  loops: el('loops'),
  motionOn: el('motion-on'),
  motionSens: el('motion-sens'),
  motionStatus: el('motion-status'),
  motionRoutes: el('motion-routes'),
  motionMeter: el('m-motion'),
  camera: el('camera'),
  cameraSelect: el('camera-select'),
  cameraRefresh: el('camera-refresh'),
  videoFile: el('video-file'),
  savePresetName: el('save-name'),
  savePresetBtn: el('save-preset'),
  userPresets: el('user-presets'),
  quality: el('quality'),
  qualityVal: el('quality-val'),
  noSound: el('no-sound'),
  midiConnect: el('midi-connect'),
  midiReset: el('midi-reset'),
  midiStatus: el('midi-status'),
  midiMap: el('midi-map'),
  status: el('status'),
  bpm: el('bpm'),
  bass: el('m-bass'),
  mid: el('m-mid'),
  treble: el('m-treble'),
  rms: el('m-rms'),
};

// Param ranges + display labels, used for the sliders and to scale incoming MIDI
// CC (0..1). Order and labels match the slider rows so the MIDI mapping list lines
// up name-for-name with the bars.
const PARAMS = {
  mix:          { min: 0, max: 1,    el: ui.mix,          label: 'Crossfade' },
  hue:          { min: 0, max: 1,    el: ui.hue,          label: 'Hue' },
  sat:          { min: 0, max: 1.5,  el: ui.sat,          label: 'Sat' },
  feedback:     { min: 0, max: 0.98, el: ui.feedback,     label: 'Feedback' },
  rgbShift:     { min: 0, max: 0.02, el: ui.rgbShift,     label: 'RGB shift' },
  glitch:       { min: 0, max: 1,    el: ui.glitch,       label: 'Glitch' },
  keyThreshold: { min: 0, max: 1,    el: ui.keyThreshold, label: 'Key thresh' },
  keySoftness:  { min: 0, max: 0.5,  el: ui.keySoftness,  label: 'Key soft' },
  pixelate:     { min: 0, max: 1,    el: ui.pixelate,     label: 'Pixelate' },
  posterize:    { min: 0, max: 1,    el: ui.posterize,    label: 'Posterize' },
  scanlines:    { min: 0, max: 1,    el: ui.scanlines,    label: 'Scanlines' },
  grain:        { min: 0, max: 1,    el: ui.grain,        label: 'Grain' },
};

// Populate slot selectors from the shared source manifest. Option values are the
// manifest's pinned slot values (camera/video stay stable as sources are added).
for (const sel of [ui.slotA, ui.slotB]) {
  SOURCE_LIST.forEach((src) => {
    const opt = document.createElement('option');
    opt.value = String(src.value);
    opt.textContent = src.name;
    sel.appendChild(opt);
  });
}

// Populate the reactivity-mode selector.
for (const [key, m] of Object.entries(REACTIVITY_MODES)) {
  const opt = document.createElement('option');
  opt.value = key;
  opt.textContent = m.name;
  ui.reactivityMode.appendChild(opt);
}

// Populate the blend-mode and key-source selectors.
BLEND_MODES.forEach((m) => {
  const opt = document.createElement('option');
  opt.value = m.id;
  opt.textContent = m.name;
  ui.blend.appendChild(opt);
});
KEY_SOURCES.forEach((k) => {
  const opt = document.createElement('option');
  opt.value = k.id;
  opt.textContent = k.name;
  ui.keySource.appendChild(opt);
});
KEY_MODES.forEach((m) => {
  const opt = document.createElement('option');
  opt.value = m.id;
  opt.textContent = m.name;
  ui.keyMode.appendChild(opt);
});

// Build one row per BPM loop (Hue / Sat / Crossfade / Feedback).
function buildLoopRows() {
  ui.loops.innerHTML = '';
  loopRowEls.length = 0;
  state.loops.forEach((loop, i) => {
    const row = document.createElement('div');
    row.className = 'loop-row';

    const en = document.createElement('input');
    en.type = 'checkbox';
    en.addEventListener('change', () => { state.loops[i].enabled = en.checked; sendState(); });

    const name = document.createElement('span');
    name.className = 'loop-label';
    name.textContent = PARAMS[loop.target].label;

    const div = document.createElement('select');
    DIVISIONS.forEach((d) => {
      const o = document.createElement('option');
      o.value = String(d.beats);
      o.textContent = d.label;
      div.appendChild(o);
    });
    div.addEventListener('change', () => { state.loops[i].beats = parseFloat(div.value); });

    const shp = document.createElement('select');
    SHAPES.forEach((s) => {
      const o = document.createElement('option');
      o.value = s;
      o.textContent = s;
      shp.appendChild(o);
    });
    shp.addEventListener('change', () => { state.loops[i].shape = shp.value; });

    const dep = document.createElement('input');
    dep.type = 'range';
    dep.min = '0'; dep.max = '1'; dep.step = '0.01';
    dep.className = 'loop-depth';
    dep.title = 'Depth';
    dep.addEventListener('input', () => { state.loops[i].depth = parseFloat(dep.value); });

    row.append(en, name, div, shp, dep);
    ui.loops.appendChild(row);
    loopRowEls[i] = { en, div, shp, dep };
  });
  syncLoopRows();
}

function syncLoopRows() {
  state.loops.forEach((loop, i) => {
    const r = loopRowEls[i];
    if (!r) return;
    r.en.checked = loop.enabled;
    r.div.value = String(loop.beats);
    r.shp.value = loop.shape;
    r.dep.value = String(loop.depth);
  });
}

// One row per motion route: enable, which parameter it drives, and how far.
function buildMotionRoutes() {
  ui.motionRoutes.innerHTML = '';
  motionRouteEls.length = 0;
  state.motionRoutes.forEach((route, i) => {
    const row = document.createElement('div');
    row.className = 'loop-row';

    const en = document.createElement('input');
    en.type = 'checkbox';
    en.addEventListener('change', () => { state.motionRoutes[i].enabled = en.checked; });

    const label = document.createElement('span');
    label.className = 'loop-label';
    label.textContent = 'drives';

    const tgt = document.createElement('select');
    Object.keys(PARAMS).forEach((name) => {
      const o = document.createElement('option');
      o.value = name;
      o.textContent = PARAMS[name].label;
      tgt.appendChild(o);
    });
    tgt.addEventListener('change', () => { state.motionRoutes[i].target = tgt.value; });

    const dep = document.createElement('input');
    dep.type = 'range';
    dep.min = '0'; dep.max = '1'; dep.step = '0.01';
    dep.className = 'loop-depth';
    dep.title = 'Depth';
    dep.addEventListener('input', () => { state.motionRoutes[i].depth = parseFloat(dep.value); });

    row.append(en, label, tgt, dep);
    ui.motionRoutes.appendChild(row);
    motionRouteEls[i] = { en, tgt, dep };
  });
  syncMotionRoutes();
}

function syncMotionRoutes() {
  state.motionRoutes.forEach((route, i) => {
    const r = motionRouteEls[i];
    if (!r) return;
    r.en.checked = route.enabled;
    r.tgt.value = route.target;
    r.dep.value = String(route.depth);
  });
}

function sendState() {
  channel.send('state', state);
}

// Sync every control in the panel to the current state (after presets / MIDI).
function updateControls() {
  ui.slotA.value = String(state.slotA);
  ui.slotB.value = String(state.slotB);
  ui.reactivityMode.value = state.reactivity;
  ui.blend.value = state.blend;
  ui.keyOn.checked = state.keyOn;
  ui.keySource.value = state.keySource;
  ui.keyMode.value = state.keyMode;
  ui.keyInvert.checked = state.keyInvert;
  for (const [name, p] of Object.entries(PARAMS)) p.el.value = String(state[name]);
  ui.motionOn.checked = state.motionOn;
  ui.motionSens.value = String(state.motionSens);
  syncLoopRows();
  syncMotionRoutes();
  syncKeyMode();
}

// Only show the background-plate controls when the difference key is selected.
function syncKeyMode() {
  document.body.classList.toggle('diffkey', state.keyMode === 'difference');
}

function setKeyRefStatus(captured) {
  ui.keyBgStatus.textContent = captured ? 'captured' : 'not captured';
}

function enableCamera(on) {
  cameraOn = on;
  channel.send('camera', { on, deviceId: cameraDeviceId });
  ui.camera.textContent = on ? 'Camera: on' : 'Camera: off';
  ui.camera.classList.toggle('on', on);
}

// List the available cameras (external, virtual, built-in) in the picker. Labels
// and stable deviceIds are only exposed once camera permission is granted, so
// pass { prompt: true } on an explicit user gesture to request it and fill them in.
async function refreshCameras({ prompt = false } = {}) {
  let cams = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'videoinput');
  if (prompt && (!cams.length || !cams[0].deviceId || !cams[0].label)) {
    try {
      const tmp = await navigator.mediaDevices.getUserMedia({ video: true });
      tmp.getTracks().forEach((t) => t.stop());
      cams = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'videoinput');
    } catch (e) { /* denied — keep the generic list */ }
  }
  ui.cameraSelect.innerHTML = '<option value="">Default camera</option>';
  cams.forEach((d, i) => {
    const opt = document.createElement('option');
    opt.value = d.deviceId;
    opt.textContent = d.label || `Camera ${i + 1}`;
    ui.cameraSelect.appendChild(opt);
  });
  // Keep the current selection if it still exists.
  ui.cameraSelect.value = cams.some((c) => c.deviceId === cameraDeviceId) ? cameraDeviceId : '';
  cameraDeviceId = ui.cameraSelect.value || null;
}

// Apply a saved state bundle (used by user presets, MIDI, and keyboard).
function applyState(bundle) {
  const b = JSON.parse(JSON.stringify(bundle)); // deep-clone (loops array)
  if (b.keyMode === undefined) b.keyMode = 'luma';   // presets saved before difference keying
  for (const k of ['pixelate', 'posterize', 'scanlines', 'grain']) {
    if (b[k] === undefined) b[k] = 0;                // presets saved before degradation FX
  }
  if (b.motionOn === undefined) {                    // presets saved before motion routing
    b.motionOn = false;
    b.motionSens = 1;
    b.motionRoutes = state.motionRoutes.map((r) => ({ ...r, enabled: false }));
  }
  Object.assign(state, b);
  updateControls();
  if (state.slotA === CAMERA_INDEX || state.slotB === CAMERA_INDEX) enableCamera(true);
  sendState();
}

// Per-frame loop modulation: send the effective value (base + loop offset) for each
// loop target. Only runs when a loop is enabled; otherwise the sliders drive params.
function sendDynamics(now) {
  const anyLoop = state.loops.some((l) => l.enabled);
  const anyMotion = state.motionOn && state.motionRoutes.some((r) => r.enabled);
  if (!anyLoop && !anyMotion) return;

  // Seed every modulatable target with its slider value — including disabled ones,
  // so a parameter snaps back the moment its loop or route is switched off.
  const eff = {};
  for (const loop of state.loops) eff[loop.target] = state[loop.target];
  for (const r of state.motionRoutes) eff[r.target] = state[r.target];

  for (const loop of state.loops) {
    if (!loop.enabled) continue;
    const p = PARAMS[loop.target];
    const cycleSec = loop.beats * (60 / tempo);
    let phase = cycleSec > 0 ? ((now - phaseStart) / cycleSec) % 1 : 0;
    if (phase < 0) phase += 1;
    eff[loop.target] += shapeValue(loop.shape, phase) * loop.depth * (p.max - p.min);
  }

  // Motion adds on top, so movement, tempo and the slider can stack on one param.
  if (anyMotion) {
    for (const r of state.motionRoutes) {
      if (!r.enabled) continue;
      const p = PARAMS[r.target];
      eff[r.target] += motionLevel * r.depth * (p.max - p.min);
    }
  }

  for (const name of Object.keys(eff)) {
    const p = PARAMS[name];
    eff[name] = name === 'hue'
      ? ((eff[name] % 1) + 1) % 1                              // wrap colour
      : Math.min(p.max, Math.max(p.min, eff[name]));           // clamp the rest
  }
  channel.send('state', eff);
}

// Sample the camera and update the meter. Driven by whichever clock is running
// (audio or the no-sound fallback), never requestAnimationFrame on its own — the
// control window gets throttled once the output window goes fullscreen.
function updateMotion(now) {
  motion.sensitivity = state.motionSens;
  motion.setVideo(state.motionOn ? preview.renderer.cameraVideo() : null);
  const m = motion.update(now);
  motionLevel = m.motion;
  ui.motionMeter.style.width = `${Math.min(m.motion * 100, 100)}%`;
  ui.motionStatus.textContent = !state.motionOn ? 'off'
    : motion.video ? 'watching camera'
    : 'camera off — enable Camera above';
  return m;
}

// Set one parameter from a normalized 0..1 value (used by MIDI CCs).
function setParam(name, v01) {
  const p = PARAMS[name];
  if (!p) return;
  state[name] = p.min + v01 * (p.max - p.min);
  p.el.value = String(state[name]);
  sendState();
}

// --- User presets (localStorage) ---
function applyUserPresetById(id) {
  const p = listUserPresets().find((x) => x.id === id);
  if (p) applyState(p.state);
}

function renderUserPresets() {
  ui.userPresets.innerHTML = '';
  for (const p of listUserPresets()) {
    const target = { kind: 'userPreset', id: p.id };
    const wrap = document.createElement('span');
    wrap.className = 'user-preset';

    const b = document.createElement('button');
    b.textContent = p.name;
    b.addEventListener('click', () => applyState(p.state));

    // Per-preset MIDI learn: shows the bound pad, or "MIDI" when unmapped.
    const learn = document.createElement('button');
    learn.className = 'learn';
    const label = midi.bindingLabel(target);
    learn.textContent = label === 'unmapped' ? 'MIDI' : label;
    learn.title = 'Learn a MIDI pad/key for this preset';
    learn.addEventListener('click', (e) => {
      e.stopPropagation();
      midi.startLearn(target);
      learn.textContent = 'press…';
    });

    const del = document.createElement('button');
    del.className = 'del';
    del.textContent = '×';
    del.title = 'Delete preset';
    del.addEventListener('click', (e) => {
      e.stopPropagation();
      midi.clearBinding(target);
      removeUserPreset(p.id);
      renderUserPresets();
    });

    wrap.append(b, learn, del);
    ui.userPresets.appendChild(wrap);
  }
}

ui.savePresetBtn.addEventListener('click', () => {
  const name = ui.savePresetName.value.trim() || `Preset ${listUserPresets().length + 1}`;
  saveUserPreset(name, state);
  ui.savePresetName.value = '';
  renderUserPresets();
});

// --- MIDI mapping panel ---
function buildMidiMap() {
  ui.midiMap.innerHTML = '';
  const addRow = (label, target) => {
    const row = document.createElement('div');
    row.className = 'midi-row';
    const name = document.createElement('span');
    name.className = 'midi-label';
    name.textContent = label;
    const learn = document.createElement('button');
    learn.textContent = 'Learn';
    const bind = document.createElement('span');
    bind.className = 'midi-bind';
    bind.dataset.target = JSON.stringify(target);
    bind.textContent = midi.bindingLabel(target);
    learn.addEventListener('click', () => {
      midi.startLearn(target);
      bind.textContent = 'press…';
    });
    row.append(name, learn, bind);
    ui.midiMap.appendChild(row);
  };
  Object.keys(PARAMS).forEach((name) => addRow(PARAMS[name].label, { kind: 'param', name }));
}

function refreshMidiLabels() {
  ui.midiMap.querySelectorAll('.midi-bind').forEach((el2) => {
    el2.textContent = midi.bindingLabel(JSON.parse(el2.dataset.target));
  });
}

midi.onUserPreset = (id) => applyUserPresetById(id);
midi.onParam = (name, v) => setParam(name, v);
midi.onStatus = (t) => { ui.midiStatus.textContent = t; };
midi.onLearned = () => { refreshMidiLabels(); renderUserPresets(); };

ui.midiConnect.addEventListener('click', async () => {
  try {
    await midi.connect();
    buildMidiMap();
  } catch (e) {
    ui.midiStatus.textContent = `MIDI error: ${e.message}`;
  }
});

ui.midiReset.addEventListener('click', () => {
  if (!confirm('Reset ALL MIDI mappings?\n\nThis clears every learned note and CC binding (parameters and saved presets). This cannot be undone.')) return;
  midi.clearAll();
  refreshMidiLabels();   // param rows back to "unmapped"
  renderUserPresets();   // saved-preset buttons back to "MIDI"
});

// --- Audio ---
async function refreshInputs() {
  try {
    const tmp = await navigator.mediaDevices.getUserMedia({ audio: true });
    tmp.getTracks().forEach((t) => t.stop());
  } catch (e) {
    ui.status.textContent = 'Microphone/audio permission denied.';
    return;
  }
  const inputs = await audio.listInputs();
  ui.inputs.innerHTML = '';
  for (const d of inputs) {
    const opt = document.createElement('option');
    opt.value = d.deviceId;
    opt.textContent = d.label || `Input ${d.deviceId.slice(0, 6)}`;
    ui.inputs.appendChild(opt);
  }
  ui.status.textContent = `${inputs.length} input(s) found — pick BlackHole, then Start.`;
}

async function start() {
  stopNoSound();
  try {
    const analyser = await audio.start(ui.inputs.value);
    features = new Features(analyser, audio.sampleRate);
    audio.onFrame = analyzeFrame; // driven by the audio clock (survives fullscreen)
    ui.status.textContent = 'Running — play audio in your DAW.';
    ui.start.classList.add('on');
  } catch (e) {
    ui.status.textContent = `Could not start audio: ${e.message}`;
  }
}

const STATIC_FEATURES = { bass: 0.4, mid: 0.4, treble: 0.4, rms: 0.35, onset: false, onsetEnv: 0, bpm: 0 };

function noSoundFrame() {
  if (!noSoundActive) return;
  const now = performance.now() / 1000;
  const m = updateMotion(now);
  channel.send('features', { ...STATIC_FEATURES, ...m });
  sendDynamics(now);
  noSoundRafId = requestAnimationFrame(noSoundFrame);
}

function startNoSound() {
  noSoundActive = true;
  ui.noSound.textContent = 'No sound: on';
  ui.noSound.classList.add('on');
  ui.start.classList.remove('on'); // the two are mutually exclusive
  ui.status.textContent = 'No sound mode — engine running, BPM loops active.';
  noSoundFrame();
}

function stopNoSound() {
  if (!noSoundActive) return;
  noSoundActive = false;
  cancelAnimationFrame(noSoundRafId);
  ui.noSound.textContent = 'No sound';
  ui.noSound.classList.remove('on');
}

// Called from the audio thread each block (not requestAnimationFrame), so it keeps
// running when the control window is hidden behind the fullscreen output window.
function analyzeFrame() {
  if (!features) return;
  const now = performance.now() / 1000;
  const raw = features.update(now);

  // Meters show the real input level, regardless of reactive mode.
  ui.bass.style.width = `${raw.bass * 100}%`;
  ui.mid.style.width = `${raw.mid * 100}%`;
  ui.treble.style.width = `${raw.treble * 100}%`;
  ui.rms.style.width = `${Math.min(raw.rms * 200, 100)}%`;
  ui.bpm.textContent = raw.bpm ? `~${raw.bpm} BPM` : '–';

  // Pre-fill the loop tempo from the auto-estimate until the user sets it manually.
  ui.bpmDetected.textContent = raw.bpm ? `detected ${raw.bpm}` : '';
  if (!bpmLocked && raw.bpm > 0) {
    tempo = raw.bpm;
    ui.bpmInput.value = String(Math.round(raw.bpm));
  }

  // Visuals get the mode-shaped signal plus motion, then any loop/route modulation.
  const m = updateMotion(now);
  channel.send('features', { ...reactivity.process(raw, state.reactivity), ...m });
  sendDynamics(now);
}

// Re-send state + camera status when the output window asks (e.g. it opened late).
channel.on((type) => {
  if (type === 'request-state') {
    sendState();
    channel.send('quality', { value: quality });
    if (cameraOn) channel.send('camera', { on: true, deviceId: cameraDeviceId });
  }
});

// --- Panel wiring ---
ui.refresh.addEventListener('click', refreshInputs);
ui.start.addEventListener('click', start);
ui.noSound.addEventListener('click', () => { if (noSoundActive) stopNoSound(); else startNoSound(); });

// Design mode (default): inline preview + sidebar. Perform mode (output window
// open): the panel returns to the slim card grid that shares the screen with
// the DAW, and the preview shrinks to a low-power corner monitor (15 fps, half
// resolution) so it costs almost nothing next to the real output. Closing the
// output window returns to design mode automatically.
const preview = attachRenderer(ui.previewCanvas);

function setPerformMode(on) {
  document.body.classList.toggle('perform', on);
  preview.setLowPower(on);
  ui.modeNote.textContent = on
    ? 'Perform mode — output window is live; corner preview mirrors it at low power. Close the output window to return.'
    : 'Design mode — visuals render in the preview.';
}

ui.openOutput.addEventListener('click', () => {
  // Relative, not '/output.html', so it also resolves when the app is hosted under
  // a sub-path (e.g. GitHub Pages at /live-visuals/).
  outputWin = window.open('output.html', 'live-visuals-output', 'width=1280,height=720');
  setPerformMode(true);
});

// Detect the output window closing (there's no cross-window close event).
setInterval(() => {
  if (document.body.classList.contains('perform') && (!outputWin || outputWin.closed)) {
    setPerformMode(false);
  }
}, 1000);

ui.slotA.addEventListener('change', () => { state.slotA = parseInt(ui.slotA.value, 10); sendState(); });
ui.slotB.addEventListener('change', () => { state.slotB = parseInt(ui.slotB.value, 10); sendState(); });
ui.mix.addEventListener('input', () => { state.mix = parseFloat(ui.mix.value); sendState(); });
ui.hue.addEventListener('input', () => { state.hue = parseFloat(ui.hue.value); sendState(); });
ui.sat.addEventListener('input', () => { state.sat = parseFloat(ui.sat.value); sendState(); });
ui.feedback.addEventListener('input', () => { state.feedback = parseFloat(ui.feedback.value); sendState(); });
ui.rgbShift.addEventListener('input', () => { state.rgbShift = parseFloat(ui.rgbShift.value); sendState(); });
ui.glitch.addEventListener('input', () => { state.glitch = parseFloat(ui.glitch.value); sendState(); });
ui.pixelate.addEventListener('input', () => { state.pixelate = parseFloat(ui.pixelate.value); sendState(); });
ui.posterize.addEventListener('input', () => { state.posterize = parseFloat(ui.posterize.value); sendState(); });
ui.scanlines.addEventListener('input', () => { state.scanlines = parseFloat(ui.scanlines.value); sendState(); });
ui.grain.addEventListener('input', () => { state.grain = parseFloat(ui.grain.value); sendState(); });
ui.reactivityMode.addEventListener('change', () => { state.reactivity = ui.reactivityMode.value; });

// Motion: enabling it turns the camera on too, since it has nothing to watch otherwise.
ui.motionOn.addEventListener('change', () => {
  state.motionOn = ui.motionOn.checked;
  if (state.motionOn && !cameraOn) enableCamera(true);
});
ui.motionSens.addEventListener('input', () => { state.motionSens = parseFloat(ui.motionSens.value); });

// Compositing / keying.
ui.blend.addEventListener('change', () => { state.blend = ui.blend.value; sendState(); });
ui.keyOn.addEventListener('change', () => { state.keyOn = ui.keyOn.checked; sendState(); });
ui.keySource.addEventListener('change', () => {
  state.keySource = ui.keySource.value;
  // The plate belongs to whichever feed it was grabbed from, so switching feeds invalidates it.
  channel.send('key-ref', { capture: false });
  setKeyRefStatus(false);
  sendState();
});
ui.keyMode.addEventListener('change', () => { state.keyMode = ui.keyMode.value; syncKeyMode(); sendState(); });
ui.keyCapture.addEventListener('click', () => { channel.send('key-ref', { capture: true }); setKeyRefStatus(true); });
ui.keyClear.addEventListener('click', () => { channel.send('key-ref', { capture: false }); setKeyRefStatus(false); });
ui.keyInvert.addEventListener('change', () => { state.keyInvert = ui.keyInvert.checked; sendState(); });
ui.keyThreshold.addEventListener('input', () => { state.keyThreshold = parseFloat(ui.keyThreshold.value); sendState(); });
ui.keySoftness.addEventListener('input', () => { state.keySoftness = parseFloat(ui.keySoftness.value); sendState(); });

// BPM field: typing locks tempo to manual (stops auto pre-fill).
ui.bpmInput.addEventListener('input', () => {
  const v = parseFloat(ui.bpmInput.value);
  if (v > 0) { tempo = v; bpmLocked = true; }
});
// Tap tempo: average recent taps, lock tempo, and align the loop phase to the tap.
ui.bpmTap.addEventListener('click', () => {
  const now = performance.now() / 1000;
  tapTimes = tapTimes.filter((t) => now - t < 2.0);
  tapTimes.push(now);
  if (tapTimes.length >= 2) {
    const intervals = tapTimes.slice(1).map((t, i) => t - tapTimes[i]);
    const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    tempo = Math.max(20, Math.min(300, 60 / avg));
    ui.bpmInput.value = String(Math.round(tempo));
  }
  bpmLocked = true;
  phaseStart = now;
});
// Sync: re-align all loop phases to now (without changing tempo).
ui.bpmSync.addEventListener('click', () => { phaseStart = performance.now() / 1000; });

// Quality (render scale): show % while dragging, apply on release to avoid realloc thrash.
ui.quality.addEventListener('input', () => {
  ui.qualityVal.textContent = `${Math.round(parseFloat(ui.quality.value) * 100)}%`;
});
ui.quality.addEventListener('change', () => {
  quality = parseFloat(ui.quality.value);
  channel.send('quality', { value: quality });
});

ui.camera.addEventListener('click', async () => {
  enableCamera(!cameraOn);
  if (cameraOn) {
    state.slotB = CAMERA_INDEX; ui.slotB.value = String(CAMERA_INDEX); sendState();
    await refreshCameras({ prompt: true }); // permission is now granted → real labels/ids
  }
});

// Switch the live camera to the chosen device (re-opens the stream if it's on).
ui.cameraSelect.addEventListener('change', () => {
  cameraDeviceId = ui.cameraSelect.value || null;
  if (cameraOn) enableCamera(true);
});
ui.cameraRefresh.addEventListener('click', () => refreshCameras({ prompt: true }));
// Virtual cameras (OBS, etc.) appear/disappear at runtime — keep the list fresh.
navigator.mediaDevices.addEventListener?.('devicechange', () => refreshCameras());

ui.videoFile.addEventListener('change', () => {
  const file = ui.videoFile.files[0];
  if (!file) return;
  channel.send('video-file', file); // Blob travels via structured clone
  state.slotB = VIDEO_INDEX;
  ui.slotB.value = String(VIDEO_INDEX);
  sendState();
});

// Keyboard fallback: number keys 1-8 fire the first 8 saved presets (in order).
window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return; // don't hijack the name field
  if (e.key >= '1' && e.key <= '8') {
    const p = listUserPresets()[parseInt(e.key, 10) - 1];
    if (p) applyState(p.state);
  }
});

buildLoopRows();
buildMotionRoutes();
ui.bpmInput.value = String(tempo);
updateControls();
renderUserPresets();
refreshInputs();
refreshCameras(); // populate whatever's visible without a permission prompt
