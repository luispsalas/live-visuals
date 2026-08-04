# Backlog

Rough, grouped by theme.

> **▶ Next session:** nothing blocking. The UX cluster (Crossfade-as-master clarity,
> Glitch → Degradation, fixed "No sound" label, clearer Motion enable, Reset button)
> is **done** — see *UI & UX polish* below. The motion camera bug (under Bugs) did
> not reproduce in a 2026-08-04 real-webcam session — see that entry for what that
> does and doesn't prove before treating it as fixed.

## Bugs
- **Motion sometimes doesn't perceive an open camera** *(intermittent — status:
  unconfirmed, not fixed).* `updateMotion()` reads `preview.renderer.cameraVideo()`,
  which only returns the `<video>` once `cameraSource.stream` is set — so the likely
  cause is timing: the camera is enabled but the stream/track isn't ready when motion
  first polls, or the video has no decoded frames yet (motion.js resets `prev` whenever
  `readyState < 2` / `paused`, so it can sit at zero and never accumulate).
  **2026-08-04:** tested with a real webcam, did not reproduce. No code in
  `motion.js`/`updateMotion()` has changed since this was filed, so that's evidence the
  bug is non-deterministic (e.g. a warm-up race that doesn't always lose), **not**
  confirmation of a fix — an intermittent bug needs several clean sessions, ideally
  covering the failure conditions below, before calling it closed. Downgraded from
  "needs a repro session" to "watch for recurrence"; re-open the investigation below if
  it happens again, ideally with the conditions noted (camera just enabled vs. already
  running, tab backgrounded/foregrounded, etc.).
  First diagnostics if it recurs: log `readyState` / `paused` / `videoWidth` while
  Motion is on; confirm the element motion reads is the same one the preview opened;
  consider re-calling `setVideo` on the stream's `loadeddata` event, or retrying until
  frames arrive. Related to the Motion tweaks item below.

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
- ~~**Motion analysis on a video-file source too**~~ — **done.** A **Watch** selector
  (Camera / Video file) in the Motion module picks the feed; `motion.js` itself needed
  no changes since `setVideo()` was already feed-agnostic. New `renderer.videoFileVideo()`
  mirrors the existing `cameraVideo()` getter. Enabling Motion only auto-enables the
  camera when Camera is the chosen feed (previously it always did); switching the
  selector while Motion is already on re-evaluates that too. Verified: status text for
  all four states (camera watching / camera off / video watching / no file loaded),
  auto-enable-camera logic in all three scenarios, and preset save/restore including
  migration of presets saved before this field existed (defaults to `'camera'`, applied
  through the real `applyState()` path with a crafted legacy bundle, no throw).
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
- **Illustrative reference images** — *in progress.* The most-felt gap before going
  public: this is a *visual* tool whose front page shows no visuals, so a reader cannot
  tell what it does. Cheaper and more flexible than the GIF below, and worth doing first:
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
  - **Status (2026-08-04):** a first batch of 9 screenshots existed in
    `~/Desktop/Video Performance Still/Repo Stills/`, using open-source stock video as
    Source material (thermal/keying/glitch treatments over crowd and street footage).
    **Checked their rights via the Archive.org metadata API — none of the three source
    items (`OABreathing`, `oa1stcameratestnbc`, `discoveringthemusicofafrica_202605`)
    carry an explicit license** (`licenseurl`/`rights` both empty). The two A/V Geeks
    ones explicitly invite contacting them (footage@avgeeks.com) before project use;
    the third (an educational film series upload) has no rights signal at all. None of
    that batch should ship without either that permission or a rights-confirmed
    replacement — **do not use the original 9 stills as-is.**
  - **Resolved with a sourcing list, not by clearing the original clips.** Identified
    genuinely public-domain replacement footage instead, verified the same way (API
    `licenseurl` check, not just page appearance or collection reputation): Prelinger
    Archives titles *A Trip Down Market Street* (1906, CC0), *Coney Island* (1940, PD),
    *The City* (1939, PD), *How a Watch Works* (1949, PD), *Lucky Strike: Square Dance*
    (1948, PD); NASA titles *8k_Earth_FullMoon_set* (CC0), *Apollo 16mm Onboard Select
    Views* (PD), *Expedition 66 U.S. Spacewalk* (CC0). Exact archive.org URLs and a
    suggested citation format are in the conversation that produced this list — pull
    them back out via `WebFetch`/`archive.org/metadata/<id>` if needed rather than
    re-deriving. **User is capturing new stills from this material next.**
  - Once the new stills exist: build the hero + gallery + blend-mode-thumbnail set from
    them, add a **Credits / Footage sources** note in the README citing each clip
    (title, year, archive.org URL, license), and only then remove the original
    unresolved-rights batch from the Desktop folder (don't delete before the new set
    is confirmed good).
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
### Documentation rework

1. ~~**USER-GUIDE — one clear track per operating system**~~ — **done (2026-08-04).**
   Section 3 ("Making it react to your music") split into two fully self-contained
   tracks, `### If you're on a Mac` / `### If you're on Windows`, each covering its
   fast/no-install path and its fallback top-to-bottom with no need to read the other
   platform's text. Subtitle line deleted. Also added a new **Motion** section (§6 —
   the feature had no guide coverage at all) and a **Reset** mention in Everyday use
   (§7) — both real content gaps found during the pass, not just structural changes.
   Renumbered §4–8 → §4–9 accordingly; the README's anchor link to §2 is unaffected
   (that section didn't move).

2. ~~**README — same treatment, simpler language**~~ — **done (2026-08-04).** Both
   named lines deleted ("Early and evolving…" and "No DAW at all?"). Controls section
   gained **System audio** and **Reset** (previously undocumented anywhere in either
   file), Privacy & security's permissions bullet updated to mention screen-share
   (previously only listed mic + camera, predating System audio). The audio-routing
   section keeps its existing compact Option A/B + table format rather than a full
   per-OS split — right call for a "quick reference, link to the Guide for detail"
   document; a full split here would just duplicate the Guide at the cost of brevity.

- ~~**Clarify how Quality / output resolution actually works**~~ — **done**, folded
  into the README rework. Now states plainly in three places (README Performance
  section, README Controls, in-app How-to-run panel) that the output window always
  fills the display at native resolution and Quality only changes how many pixels are
  shaded internally before the scale-up.

3. **Spanish version, once 1 and 2 have settled.** They have — this is next. A full
   Spanish document with all the user-facing information (not a cut-down FAQ), linked
   prominently from the README. Decisions to make: file layout (`README.es.md` +
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
