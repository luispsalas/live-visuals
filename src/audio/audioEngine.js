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

  // Raw signal, no browser "helpfulness" — these would fight a music feed.
  static RAW = { echoCancellation: false, noiseSuppression: false, autoGainControl: false };

  // Start capturing from the given deviceId. Must be called from a user gesture.
  async start(deviceId) {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { deviceId: deviceId ? { exact: deviceId } : undefined, ...AudioEngine.RAW },
      video: false,
    });
    return this._setup(stream);
  }

  // Zero-install alternative: Chrome's screen-share picker can hand back the
  // system's own audio, so no virtual audio cable has to be installed. This is
  // the practical route on Windows, where BlackHole does not exist.
  //
  // Platform reality: on Windows, choosing "Entire Screen" and ticking "Also share
  // system audio" captures everything the machine plays, including a DAW. On macOS
  // Chrome cannot share system audio — only a browser tab's audio — so a Mac user
  // driving a DAW still needs BlackHole. Must be called from a user gesture.
  async startSystemAudio() {
    // video:true is required for the picker to appear at all; we throw the video
    // track away immediately and keep only the audio.
    const shared = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: AudioEngine.RAW,
    });
    shared.getVideoTracks().forEach((t) => t.stop());
    const audio = shared.getAudioTracks();
    if (!audio.length) {
      shared.getTracks().forEach((t) => t.stop());
      throw new Error('No audio was shared — re-run and tick "Share system audio" (or "Share tab audio") in the picker.');
    }
    return this._setup(new MediaStream(audio));
  }

  // No sound mode: no real input, but BPM loops and Motion still need a clock that
  // survives the control window being hidden/occluded — exactly the problem the
  // audio-thread clock below already solves. A silent oscillator stands in for a
  // real input purely to give the ScriptProcessorNode something to pull from;
  // requestAnimationFrame/setInterval can't offer the same guarantee (both are
  // throttled by Chrome once another window fully covers this one).
  async startSilentClock() {
    this.ctx = new AudioContext();
    if (this.ctx.state === 'suspended') await this.ctx.resume();

    const osc = this.ctx.createOscillator();
    osc.frequency.value = 440;
    osc.start();

    this.clock = this.ctx.createScriptProcessor(1024, 1, 1);
    osc.connect(this.clock);
    const sink = this.ctx.createGain();
    sink.gain.value = 0; // silent — same trick as _setup()'s clock sink
    this.clock.connect(sink);
    sink.connect(this.ctx.destination);
    this.clock.onaudioprocess = () => { if (this.onFrame) this.onFrame(); };
  }

  async _setup(stream) {
    this.stream = stream;
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
