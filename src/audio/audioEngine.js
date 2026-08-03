// Captures audio from a chosen input (e.g. BlackHole) and exposes an AnalyserNode.
// Lives in the control window, where mic permission is granted.
export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.analyser = null;
    this.source = null;
    this.stream = null;
    this.clock = null;
    this.onFrame = null; // called each audio block — drives analysis (not throttled when hidden)
  }

  // List available audio input devices.
  // Labels are only visible after a permission grant (see refreshInputs in main.js).
  async listInputs() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((d) => d.kind === 'audioinput');
  }

  // Start capturing from the given deviceId. Must be called from a user gesture.
  async start(deviceId) {
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        deviceId: deviceId ? { exact: deviceId } : undefined,
        // Disable processing so we get the raw signal from the DAW via BlackHole.
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
      video: false,
    });

    this.ctx = new AudioContext();
    if (this.ctx.state === 'suspended') await this.ctx.resume();

    this.source = this.ctx.createMediaStreamSource(this.stream);
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.6;
    this.source.connect(this.analyser);
    // Intentionally NOT connected to ctx.destination — we analyse only, no passthrough.

    // Analysis clock: a ScriptProcessorNode fires from the audio thread, so it keeps
    // running even when the control window is hidden/occluded (e.g. the output window
    // is fullscreen) — unlike requestAnimationFrame, which Chrome throttles when hidden.
    this.clock = this.ctx.createScriptProcessor(1024, 1, 1);
    this.source.connect(this.clock);
    const sink = this.ctx.createGain();
    sink.gain.value = 0; // silence — the node is only used as a clock, not for output
    this.clock.connect(sink);
    sink.connect(this.ctx.destination);
    this.clock.onaudioprocess = () => { if (this.onFrame) this.onFrame(); };

    return this.analyser;
  }

  get sampleRate() {
    return this.ctx ? this.ctx.sampleRate : 44100;
  }

  stop() {
    if (this.clock) this.clock.onaudioprocess = null;
    if (this.stream) this.stream.getTracks().forEach((t) => t.stop());
    if (this.ctx) this.ctx.close();
    this.ctx = this.analyser = this.source = this.stream = this.clock = null;
  }
}
