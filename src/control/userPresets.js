// User presets saved to the browser via localStorage — persist across sessions
// (not just the current one). Each entry stores the full app state bundle.
const KEY = 'live-visuals-user-presets';

// One-time migration: presets saved before slot pinning used array positions for
// camera (8) and video (9); those are now generative slots, so remap to the
// pinned values (98/99, see manifest.js). `_v` marks a migrated/current state.
function migrate(presets) {
  let changed = false;
  for (const p of presets) {
    const s = p.state;
    if (!s || s._v >= 2) continue;
    for (const k of ['slotA', 'slotB']) {
      if (s[k] === 8) s[k] = 98;
      else if (s[k] === 9) s[k] = 99;
    }
    s._v = 2;
    changed = true;
  }
  if (changed) localStorage.setItem(KEY, JSON.stringify(presets));
  return presets;
}

export function listUserPresets() {
  try {
    return migrate(JSON.parse(localStorage.getItem(KEY)) || []);
  } catch (e) {
    return [];
  }
}

export function saveUserPreset(name, state) {
  const presets = listUserPresets();
  // Deep-clone so nested data (e.g. the loops array) isn't shared by reference.
  const clone = JSON.parse(JSON.stringify(state));
  clone._v = 2; // slot-pinning format version (see migrate)
  presets.push({ id: Date.now(), name, state: clone });
  localStorage.setItem(KEY, JSON.stringify(presets));
  return presets;
}

export function removeUserPreset(id) {
  const presets = listUserPresets().filter((p) => p.id !== id);
  localStorage.setItem(KEY, JSON.stringify(presets));
  return presets;
}
