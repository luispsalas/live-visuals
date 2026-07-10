import { Renderer } from './renderer.js';
import { createChannel } from '../sync.js';

// Wire a Renderer on the given canvas to the app's BroadcastChannel: features,
// state, camera, video-file, and quality messages all drive it. Used by both the
// output window (projector) and the inline design-mode preview — BroadcastChannel
// delivers across windows AND between instances in the same window, so the
// control window's own preview subscribes exactly like a remote window.
export function attachRenderer(canvas) {
  const renderer = new Renderer(canvas);
  const channel = createChannel();
  let latest = { bass: 0, mid: 0, treble: 0, rms: 0, onsetEnv: 0 };
  let paused = false;

  channel.on((type, payload) => {
    if (type === 'features') latest = payload;
    else if (type === 'state') renderer.setState(payload);
    else if (type === 'camera') renderer.enableCamera(payload.on);
    else if (type === 'video-file') renderer.loadVideo(payload);
    else if (type === 'quality') renderer.setQuality(payload.value);
  });

  // Ask the control window to (re)send current state, so attaching late still
  // picks up the chosen slots / crossfade / colour / camera.
  channel.send('request-state');

  function loop() {
    if (!paused) {
      renderer.setFeatures(latest);
      renderer.render();
    }
    requestAnimationFrame(loop);
  }
  loop();

  return {
    renderer,
    // Pause skips render work but keeps receiving state, so resuming is instant.
    setPaused(p) { paused = p; },
  };
}
