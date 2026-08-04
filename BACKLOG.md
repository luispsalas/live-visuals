# Backlog

Rough, grouped by theme.

> **▶ Next session:** the **motion camera bug** (under Bugs). The UX cluster
> (Crossfade-as-master clarity, Glitch → Degradation, fixed "No sound" label, clearer
> Motion enable, Reset button) is **done** — see *UI & UX polish* below, all five
> shipped and verified.
>
> ⚠️ The motion bug **needs the user at a machine with a working webcam** — camera
> capture is blocked in the agent's sandbox, so it cannot be reproduced or confirmed
> fixed without hands-on testing. Have Chrome open with the camera available.

## Bugs
- **Motion sometimes doesn't perceive an open camera** *(intermittent — needs a real
  webcam to repro; the sandbox blocks capture).* `updateMotion()` reads
  `preview.renderer.cameraVideo()`, which only returns the `<video>` once
  `cameraSource.stream` is set — so the likely cause is timing: the camera is enabled
  but the stream/track isn't ready when motion first polls, or the video has no decoded
  frames yet (motion.js resets `prev` whenever `readyState < 2` / `paused`, so it can
  sit at zero and never accumulate). First diagnostics: log `readyState` / `paused` /
  `videoWidth` while Motion is on; confirm the element motion reads is the same one the
  preview opened; consider re-calling `setVideo` on the stream's `loadeddata` event, or
  retrying until frames arrive. Related to the Motion tweaks item below.

## Transitions
- **Preset crossfade** — a short, tempo-aware dissolve between the outgoing and
  incoming look (instead of the current instant switch), so preset changes feel
  deliberate. Duration ideally beat-synced (e.g. ¼–1 bar).
- **General fade in / out control** — a master fade-to-black (and back), for clean
  starts, blackouts, and set transitions.

## Presets & media
- **Predesigned presets for a standard user-facing version** — a small curated set of
  ready-made looks that ship with the app, so a first-time user has something to play
  immediately without building presets from scratch. (User presets today are empty
  until you save your own.) Design decisions to make: keep them separate from user
  presets (read-only "factory" bank vs the editable "My presets"), pick a handful that
  showcase the range (a generative-only look, a camera-key look, a BPM-loop look, an
  ambient one), and avoid ones that depend on a camera/video being connected.
- **Video files associated with presets** — review approaches for making a saved
  preset restore its actual clip (today the slot is restored but the file must be
  re-picked). Options to evaluate: File System Access API handles (Chrome, persistable
  permission) · storing clips in IndexedDB (persists, but heavy) · a small user "media
  library" the presets reference by id. Weigh size/permissions/UX.

## Sources & FX
- **Review the webcam-effects catalog for new effects** — work through the reference
  table (the maintainer's private "html webcam" spreadsheet: ~85 effects in 11
  categories, each with its web technology, a performance rating, and the Max/Jitter
  equivalent) and decide what to add. Already covered by the app: hue/saturation,
  RGB split, glitch, feedback loop, luma key, kaleidoscope, tunnel, webcam mirror,
  audio-reactive FX. Strongest gaps, roughly in value order:
  - ~~Chroma key / difference key~~ — **difference key done** (Capture BG plate, see
    Compositing in the README). **Chroma key declined** — difference keying covers the
    same use case without needing a green screen.
  - ~~Motion-reactive FX / frame difference~~ — **done.** Camera frame-differencing in
    the control window (`src/control/motion.js`), routed onto parameters; `uMotion` /
    `uMotionEnv` are also exposed to every shader for future sources to use directly.
    Optical flow and MediaPipe segmentation remain as heavier, more capable options.
  - **Cheap, high-impact post effects** — Sobel edge detection, halftone, dithering,
    film grain, bloom, scanlines. All rated High or Very High, and they overlap with
    the Degradation FX item below (consider merging the two into one post-FX pass).
  - **Camera distortions** — twist, ripple, pinch/bulge, fisheye, barrel. All WebGL,
    all High, and they suit a live camera feed better than a generative source.
  - **Slit scan** — time smeared across an image axis; distinctive and hard to fake.
  Note the catalog assumes a single-video-filter pipeline, whereas this app is a
  two-slot A/B compositor, so decide per effect whether it belongs as a **source**, a
  **per-source filter**, or a **global post pass** before building anything.
- ~~**Degradation FX**~~ — **done.** Pixelate/mosaic, posterize, scanlines and grain in
  the display pass (`feedbackPass.js`), each a normal parameter so it is MIDI-mappable
  and motion-routable. Chroma bleed was already covered by the existing RGB shift.
  Still open from the same family: halftone, dithering, Sobel edges, bloom.
- ~~**Camera/Video slot stability**~~ — **done.** Camera/Video pinned to reserved slot
  values (98/99) in manifest.js so adding generative sources never shifts them; old
  presets migrate 8/9 → 98/99 on load.
- **Motion section tweaks** — *low priority.* The feature works, but the section wants
  refinement in use. Nothing specific diagnosed yet, so first step is to note what
  actually feels off while performing. Likely candidates: the sensitivity range and its
  default (calibrated against synthetic feeds, not a real room), whether the smoothed
  value or the transient envelope is the better thing to route, only three route slots,
  no way to invert a route (movement *reducing* a parameter), and the meter giving no
  sense of where the motion is happening. Revisit after a real session with a camera.
- **Motion analysis on a video-file source too** — the frame-differencer only watches
  the live camera today; point it at the `<video>` of a playing video-file source as
  well, so movement *within* a clip can drive parameters. Low complexity —
  `motion.js`'s `setVideo()` already accepts any `<video>`; what's needed is a choice of
  which feed to analyse (camera vs the video source) and reading the video source's
  element. Pairs with the Motion tweaks above.
- **Text input as a visual layer** — review adding live text as a source/overlay
  (titles, lyrics, messages). Decisions to weigh: render approach (canvas-2D texture
  → GPU vs an HTML overlay on the output window), where it sits in the pipeline (its
  own slot so it can be blended/keyed like any feed, vs a post overlay on top of
  everything), font/size/color/position controls, and whether it can be audio-reactive
  or BPM-looped (e.g. pulse, flicker). Slot-based fits the existing compositor cleanly
  and lets you luma-key a camera through the letterforms.

## UI & UX polish
- ~~**Make Crossfade's master role evident**~~ — **done.** Went with a contextual hint
  over relabelling/auto-nudge/decoupling, since it's purely additive (no compositor or
  state-schema change, so no saved preset's look changes). An amber warning row appears
  under Key mode exactly when Key is on and Crossfade < 0.02, and clears the moment
  either condition does. Wired into the live Crossfade slider, the Key-on toggle, and
  `updateControls()` (covers presets + Reset). README's Compositing bullet updated.
- ~~**Move Glitch into the Degradation module**~~ — **done.** Row moved, PARAMS
  reordered to match (keeps the MIDI mapping list aligned with the sliders), README
  updated. Verified the slider still functions and broadcasts state.
- ~~**"No sound" as a fixed-label button**~~ — **done.** Label now stays "No sound";
  the `on` class tint carries the state, matching Camera/Start.
- ~~**Motion "Enable" on/off is unclear**~~ — **done.** Checkbox replaced with a tinted
  toggle button ("Motion: on"/"Motion: off"), matching the other audio/camera toggles.
  Still correctly turns the camera on when enabled.
- ~~**Add a "Reset" button**~~ — **done.** Lives in the topbar next to Open output
  window — always reachable without scrolling. Snapshots the initial `state` literal
  as `DEFAULT_STATE` and reuses `applyState()` for the restore. Confirms first (same
  pattern as Reset MIDI mappings). Verified: mangled controls return to defaults;
  tempo/Quality/MIDI/presets untouched; cancelling the confirm leaves state alone.

## Sync
- **OSC / Ableton Link bridge** — exact beat/tempo from a standalone Max patch (Link)
  over OSC → WebSocket, to replace the drifting onset-based BPM estimate.

## Demo & documentation
- ~~**Demo recording**~~ — **done (OBS).** "Live Visuals Demo" scene collection +
  "Live Visuals" profile configured locally (1080p60, hardware H.264, MP4 + BlackHole
  audio). Workflow documented in README → "Recording a demo".
- **Illustrative reference images** — the most-felt gap before going public: this is a
  *visual* tool whose front page shows no visuals, so a reader cannot tell what it
  does. Cheaper and more flexible than the GIF below, and worth doing first:
  - a **hero still** at the top of the README — one strong frame that says what this is;
  - a **UI screenshot** of the control panel in design mode, so the guide can point at
    real controls instead of describing them;
  - a small **gallery of example looks** (a few generative sources, a camera key, a
    degraded/retro look) to show range;
  - reuse the same stills as **blend-mode thumbnails** (see the item further down) so
    one capture session covers everything.
  Decide where they live (an `assets/` or `docs/` folder in-repo is simplest and keeps
  the Markdown portable) and keep them modest in size. Static images have none of the
  GIF's weight problem and render everywhere, including outside github.com.
- **Sample GIF / clip as a README illustration** — the motion counterpart to the stills
  above; do it after them, since a still already fixes the "cannot see what it does"
  problem at a fraction of the effort. review options for showing the tool
  in motion at the top of the README, since text alone doesn't convey what it does.
  Source material comes from the OBS workflow above. Points to weigh: an animated GIF
  is the only format that autoplays inline on GitHub, but it is heavyweight (keep it
  short and small — a few seconds, modest dimensions, budget well under ~10 MB or the
  README feels broken on slow connections); alternatives are a poster image linking to
  a video, or GitHub's own video upload (drag an MP4 into a README edit — it renders
  as a player, but only on github.com, and it breaks anywhere else the Markdown is
  read). Also decide where the file lives (an `assets/` folder in-repo vs an external
  host) and whether to show several short looks or one representative one. Ties into
  the starter-presets item — a GIF of a preset is a good showcase for both.
### Documentation rework (do these in order)

1. **USER-GUIDE — one clear track per operating system.** Right now Mac and Windows
   instructions are interleaved inside shared sections, so a reader has to constantly
   work out which lines apply to them. It reads as complex at exactly the moment they
   are trying to *start*. Restructure so a user picks their system once and then
   follows an uninterrupted sequence — accept the duplication between the two tracks;
   for end-user docs, clarity beats not repeating yourself. Also **delete the subtitle
   line** "Plain-language guide for non-technical users. No technical background
   assumed." — it states the obvious and slightly patronises.

2. **README — same treatment, simpler language.** Write for someone who just wants to
   follow a few steps for *their* system and start. Specifically: **delete** the line
   "Early and evolving; built to grow progressively." and **delete** the "No DAW at
   all?" sentence in the intro. Then review the whole flow — heading order, sentence
   length, how early the reader reaches something that works — with the same
   per-platform principle as the guide.

- **Clarify how Quality / output resolution actually works** (fold into the README
  rework, #2). The current line — *"the Quality slider scales the internal render
  resolution (100% = full)"* — is too terse to be understood. Explain plainly: the
  output **always fills the display at its native resolution**; Quality changes how many
  pixels are actually *shaded internally* before being scaled up to that display, so 50%
  renders at half-resolution and upscales — trading sharpness for GPU headroom. It is
  **not** the window/projector resolution and doesn't change it. Worth stating the
  concrete relationship (internal buffer ≈ display size × devicePixelRatio × Quality)
  for the curious, in plain words for everyone else.

3. **Spanish version, once 1 and 2 have settled.** A full Spanish document with all the
   user-facing information (not a cut-down FAQ), linked prominently from the README.
   Deliberately sequenced last so the English wording is stable first and the two
   don't drift immediately. Decisions to make: file layout (`README.es.md` +
   `USER-GUIDE.es.md` alongside the English, with a language link pair at the top of
   each, is the common GitHub convention) versus a `/docs` folder or the Wiki; and how
   to keep the versions in sync as the app changes. Worth a quick look at how other
   projects handle bilingual docs before committing to a structure.

## Sharing / distribution
- ~~**Friendly launcher for non-technical users**~~ — **resolved: host it.** The app is
  pure client-side, so `npm run build` produces a static `dist/` that runs from any
  host. `vite.config.js` uses `base: './'` and the output window opens by relative
  path, both verified against a simulated sub-path deploy. A manual-dispatch GitHub
  Pages workflow is in `.github/workflows/deploy.yml`.
  **Remaining decision (yours):** Pages on a *private* repo needs a paid GitHub plan;
  on the free plan the repo must be public. Alternatives: Netlify or Vercel free tiers
  deploy from a private repo. Nothing has been published yet.
- **Verify the Windows audio paths first-hand** — *delegated: a friend will test, since
  there is no Windows machine here.* Two routes exist and neither has been run on real
  Windows hardware: **System audio** (`getDisplayMedia` + "Also share system audio", no
  install — the code path is unit-tested with a synthetic stream but the Chrome picker
  behaviour is not) and **VB-CABLE**. Both stay flagged as unverified in the README and
  guide until confirmed. Worth asking the tester specifically: does the "Also share
  system audio" tickbox appear, does a DAW's output actually come through, and is the
  device named "CABLE Output" as documented.
- ~~**Add repository topics/tags on GitHub**~~ — **done.** 12 topics applied: `webgl`,
  `threejs`, `audio-reactive`, `visuals`, `vj`, `live-performance`, `generative-art`,
  `web-audio`, `web-midi`, `shaders`, `creative-coding`, `music-visualization`. The
  repo description was updated at the same time to match the current naming ("visual
  engine … alongside any DAW", was "visual instrument … alongside DAW"). Topics only
  become publicly searchable once the repo is public.
- **Blend-mode thumbnails for the guide** — a before/after image per mode would beat
  the prose table. Pairs with the README GIF item.

## Housekeeping
- **Purge the local git backup refs (review first)** — the email rewrite left the old
  history in `refs/original/refs/heads/main` and the tag `backup-before-email-rewrite`.
  These are **local only and were never pushed**, so nothing is exposed — they exist
  purely so the rewrite can be undone. Once the rewritten history is confirmed good
  (GitHub shows the noreply address, nothing looks lost), delete them and garbage
  collect so the old commits stop occupying the object store:
  ```
  git update-ref -d refs/original/refs/heads/main
  git tag -d backup-before-email-rewrite
  git reflog expire --expire=now --all && git gc --prune=now
  ```
  Irreversible once done — that is the point, so only run it deliberately.
- ~~**Choose a licence**~~ — **done. MIT** (see `LICENSE`), matching the Three.js and
  Vite dependency stack. Repo is still private; making it public is a separate step,
  best taken once the FAQ, starter presets, and the launcher question are settled.
