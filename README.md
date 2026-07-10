# Live Visuals

A lightweight, browser-based **audio-reactive visual instrument** for live performance.
Run it next to Ableton Live: it listens to your audio and projects generative visuals
full-screen on a second display, driven live from the keyboard or any MIDI controller.

Built with Three.js (WebGL) + Web Audio + Web MIDI. Two windows — a **control panel**
(keep on the laptop, beside Ableton) and a clean **output window** (send to the projector).

> Early and evolving; built to grow progressively.

## Quick start

1. Install [BlackHole 2ch](https://existential.audio/blackhole/). In *Audio MIDI Setup*
   make a **Multi-Output Device** (BlackHole + your speakers) and set it as Ableton's
   output, so you still hear sound.
2. `npm install && npm run dev`, then open the printed URL in **Chrome**.
   Click **Refresh → pick BlackHole → Start**.
3. Click **Open output window →**, drag it onto your projector (extended display),
   and press **f** for fullscreen.

The in-app **How to run** panel has the full checklist.

## Controls

- **Audio** — choose the input (BlackHole), Start, watch the bass/mid/treble/RMS meters and detected tempo.
- **Mix & effects** — two visual **sources** (A/B) with a **crossfade**; **hue/sat** colour; **feedback** trails, **RGB shift**, **glitch**; a **Reactivity** mode (Punchy → Smooth → Mellow → Ambient → None) setting how strongly transients drive motion; plus **camera** and **video-file** inputs.
- **Compositing** — how A and B overlap: **blend modes** (add / screen / multiply / difference / …) and a **luma key** (reveal one feed through another's brightness — or through the feedback buffer).
- **BPM loops** — tempo-synced motion as counterpoint to the audio reactivity: set the **BPM** (or Tap), then loop Hue / Sat / Crossfade / Feedback / Key over ¼-beat–8-bar cycles, with ramp / sine / triangle / square shapes.
- **My presets** — save and recall full looks (stored in the browser; number keys **1–8** fire the first eight; each is MIDI-mappable).
- **MIDI** — Connect, then **Learn** any parameter or preset onto a control. Works with any controller: pads or keyboard keys (Note On) trigger presets; knobs, faders, or the mod wheel (CC) drive parameters. Multiple devices at once are fine.
- **Output** — the top-bar button opens the projector window (**perform mode**: the panel slims down to share the screen with Ableton, and a low-power mini preview stays in the corner as a confidence monitor; close the output window to return to **design mode**, with the full-size preview). **Quality** (render scale) buys GPU headroom.

**Generative sources:** Plasma, Flow field, Kaleidoscope, Tunnel, Metaballs, Voronoi, Julia, Interference — plus four **keying mattes** (Ink blobs, Strobe bars, Iris, Pulse rings: high-contrast white-on-black shapes made for luma-keying the camera or a video through them) — plus live Camera and Video file.

## Recommendations

- **Share the screen with Ableton:** the panel is a slim vertical column when the window is narrow, and flows into multiple columns when wide — just resize.
- **For tight sync,** type or tap the BPM rather than trusting the drifting auto-estimate.
- **Layer motion:** let transients drive zoom/brightness while a slow BPM loop drifts the colour — two rhythms read as more musical than one.
- **On a 4K projector or if frames drop,** lower **Quality** to ~60–75% and keep the laptop plugged in.
- **Sharing one controller with Ableton:** learn the app to controls Ableton doesn't use (e.g. one pad bank for clips, the other for visuals) — macOS lets both read the same device at once, and the app only reacts to what you've learned.

## Techniques to try

- **Keyed feeds:** Source A generative, Source B camera/video, **Screen** blend, luma-key **from Feedback** → smeary, self-referential mattes.
- **Camera through a matte:** Source A = a keying matte (Ink blobs / Iris / Strobe bars / Pulse rings), Source B = Camera, luma-key **from Source A** → the camera appears only inside the moving white shapes; **invert** flips it.
- **Difference / Multiply** two generative sources for rich moiré-like overlaps.
- **Ambient** reactivity + a 4-bar **Hue** loop → slow, hypnotic colour drift for chill sets.

## Recording a demo

Use **OBS Studio** with the pre-configured **"Live Visuals Demo"** scene collection and
**"Live Visuals"** profile (1080p / 60 fps, Apple hardware H.264, crash-safe MP4 to `~/Movies`,
audio straight from BlackHole — the same feed the app analyzes).

1. Start the app and open the output window (it can stay windowed — no need for fullscreen).
2. Open OBS. In the **Demo** scene, double-click **Output window** and pick the Chrome
   window titled *Live Visuals — Output* (once per session; grant Screen Recording
   permission the first time).
3. Play in Ableton — the audio meter should move. Click **Start Recording**, perform,
   **Stop Recording**. The MP4 lands in `~/Movies`.

Tip: keep the output window at a decent size — OBS scales the capture to fit the
1080p frame, so a tiny window means a soft recording.

## Tech

Vite + Three.js. The control window analyses audio and streams state to the output
window over a `BroadcastChannel`; the output window owns the WebGL renderer. Audio
analysis runs on a Web Audio clock so reactivity survives fullscreen.
