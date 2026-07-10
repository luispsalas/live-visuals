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
  let fpsCap = 0;          // 0 = render every animation frame
  let lastFrame = 0;
  let lowQuality = null;   // when set, wins over the broadcast quality value
  let lastQuality = 1;

  channel.on((type, payload) => {
    if (type === 'features') latest = payload;
    else if (type === 'state') renderer.setState(payload);
    else if (type === 'camera') renderer.enableCamera(payload.on);
    else if (type === 'video-file') renderer.loadVideo(payload);
    else if (type === 'quality') {
      lastQuality = payload.value;
      renderer.setQuality(lowQuality ?? lastQuality);
    }
  });

  // Ask the control window to (re)send current state, so attaching late still
  // picks up the chosen slots / crossfade / colour / camera.
  channel.send('request-state');

  function loop(now) {
    if (!paused && (!fpsCap || now - lastFrame >= 1000 / fpsCap)) {
      lastFrame = now;
      renderer.setFeatures(latest);
      renderer.render();
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  return {
    renderer,
    // Pause skips render work but keeps receiving state, so resuming is instant.
    setPaused(p) { paused = p; },
    // Low-power mode for the perform-mode mini preview: capped fps + reduced
    // internal resolution, so it costs almost nothing next to the real output.
    setLowPower(on) {
      fpsCap = on ? 15 : 0;
      lowQuality = on ? 0.5 : null;
      renderer.setQuality(lowQuality ?? lastQuality);
    },
  };
}
