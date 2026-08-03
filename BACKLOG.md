# Backlog

Rough, unordered — implemented progressively, one small checkpoint per item.

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
  table (Google Drive `1PQOHESuo55kcgsgtugP-avf7ZKfCucocOQDG3OR2JKQ`: ~85 effects in 11
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
- **Text input as a visual layer** — review adding live text as a source/overlay
  (titles, lyrics, messages). Decisions to weigh: render approach (canvas-2D texture
  → GPU vs an HTML overlay on the output window), where it sits in the pipeline (its
  own slot so it can be blended/keyed like any feed, vs a post overlay on top of
  everything), font/size/color/position controls, and whether it can be audio-reactive
  or BPM-looped (e.g. pulse, flicker). Slot-based fits the existing compositor cleanly
  and lets you luma-key a camera through the letterforms.

## Sync
- **OSC / Ableton Link bridge** — exact beat/tempo from a standalone Max patch (Link)
  over OSC → WebSocket, to replace the drifting onset-based BPM estimate.

## Demo & documentation
- ~~**Demo recording**~~ — **done (OBS).** "Live Visuals Demo" scene collection +
  "Live Visuals" profile configured locally (1080p60, hardware H.264, MP4 + BlackHole
  audio). Workflow documented in README → "Recording a demo".
- **Sample GIF / clip as a README illustration** — review options for showing the tool
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
- **Bilingual FAQ (English + Spanish) for non-technical users** — review GitHub's own
  documentation conventions first (what a repo can host and how it's presented:
  README vs `/docs` folder vs the Wiki vs GitHub Pages; language-switching patterns
  such as `README.es.md` + a link pair at the top; whether Discussions' Q&A category
  fits better than a static file). Then write a FAQ aimed at someone who has never
  used GitHub or a terminal: what the app is, what you need to run it, how to get it,
  common problems (no sound reaching the app, camera not listed, projector setup),
  and where to ask for help. Keep both languages in sync — decide whether they live in
  one file or two. Pairs with `USER-GUIDE.md` (also a draft) and with the unresolved
  "friendly launcher" question, which changes the install answers.

## Sharing / distribution
- ~~**Friendly launcher for non-technical users**~~ — **resolved: host it.** The app is
  pure client-side, so `npm run build` produces a static `dist/` that runs from any
  host. `vite.config.js` uses `base: './'` and the output window opens by relative
  path, both verified against a simulated sub-path deploy. A manual-dispatch GitHub
  Pages workflow is in `.github/workflows/deploy.yml`.
  **Remaining decision (yours):** Pages on a *private* repo needs a paid GitHub plan;
  on the free plan the repo must be public. Alternatives: Netlify or Vercel free tiers
  deploy from a private repo. Nothing has been published yet.
- **Verify the Windows audio path first-hand** — the VB-CABLE steps in the user guide
  follow the standard setup but have not been tested on a real Windows machine. Flagged
  as unverified in both the README and the guide until someone runs it.
- **Blend-mode thumbnails for the guide** — a before/after image per mode would beat
  the prose table. Pairs with the README GIF item.

## Housekeeping
- ~~**Choose a licence**~~ — **done. MIT** (see `LICENSE`), matching the Three.js and
  Vite dependency stack. Repo is still private; making it public is a separate step,
  best taken once the FAQ, starter presets, and the launcher question are settled.
