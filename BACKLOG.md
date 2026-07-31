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
- **Degradation FX** — posterize / pixelate / mosaic / scanlines / chroma bleed as a
  post step (the compositing option not yet built).
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

## Housekeeping
- ~~**Choose a licence**~~ — **done. MIT** (see `LICENSE`), matching the Three.js and
  Vite dependency stack. Repo is still private; making it public is a separate step,
  best taken once the FAQ, starter presets, and the launcher question are settled.
