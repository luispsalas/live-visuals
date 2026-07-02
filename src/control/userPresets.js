// User presets saved to the browser via localStorage — persist across sessions
// (not just the current one). Each entry stores the full app state bundle.
const KEY = 'live-visuals-user-presets';

export function listUserPresets() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch (e) {
    return [];
  }
}

export function saveUserPreset(name, state) {
  const presets = listUserPresets();
  // Deep-clone so nested data (e.g. the loops array) isn't shared by reference.
  presets.push({ id: Date.now(), name, state: JSON.parse(JSON.stringify(state)) });
  localStorage.setItem(KEY, JSON.stringify(presets));
  return presets;
}

export function removeUserPreset(id) {
  const presets = listUserPresets().filter((p) => p.id !== id);
  localStorage.setItem(KEY, JSON.stringify(presets));
  return presets;
}
