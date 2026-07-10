import { attachRenderer } from './engine/attachRenderer.js';

// Output window (projector): renders ONLY the canvas. All channel wiring is
// shared with the design-mode preview (see attachRenderer.js).
attachRenderer(document.getElementById('view'));

// Fullscreen: drag this window onto the projector, then click the button or press "f".
function goFullscreen() {
  document.documentElement.requestFullscreen?.();
}
document.getElementById('fs').addEventListener('click', goFullscreen);
window.addEventListener('keydown', (e) => {
  if (e.key === 'f') goFullscreen();
});
