import { Renderer } from './engine/renderer.js';
import { createChannel } from './sync.js';

// Output window (projector): owns the renderer, renders ONLY the canvas.
// Receives audio features + app state + media commands from the control window.
const canvas = document.getElementById('view');
const renderer = new Renderer(canvas);
const channel = createChannel();

let latest = { bass: 0, mid: 0, treble: 0, rms: 0, onsetEnv: 0 };
channel.on((type, payload) => {
  if (type === 'features') latest = payload;
  else if (type === 'state') renderer.setState(payload);
  else if (type === 'camera') renderer.enableCamera(payload.on);
  else if (type === 'video-file') renderer.loadVideo(payload);
  else if (type === 'quality') renderer.setQuality(payload.value);
});

// Ask the control window to (re)send current state, so opening this window late
// still picks up the chosen slots / crossfade / colour / camera.
channel.send('request-state');

function loop() {
  renderer.setFeatures(latest);
  renderer.render();
  requestAnimationFrame(loop);
}
loop();

// Fullscreen: drag this window onto the projector, then click the button or press "f".
function goFullscreen() {
  document.documentElement.requestFullscreen?.();
}
document.getElementById('fs').addEventListener('click', goFullscreen);
window.addEventListener('keydown', (e) => {
  if (e.key === 'f') goFullscreen();
});
