# Backlog

Rough, unordered — implemented progressively, one small checkpoint per item.

## Transitions
- **Preset crossfade** — a short, tempo-aware dissolve between the outgoing and
  incoming look (instead of the current instant switch), so preset changes feel
  deliberate. Duration ideally beat-synced (e.g. ¼–1 bar).
- **General fade in / out control** — a master fade-to-black (and back), for clean
  starts, blackouts, and set transitions.

## Presets & media
- **Video files associated with presets** — review approaches for making a saved
  preset restore its actual clip (today the slot is restored but the file must be
  re-picked). Options to evaluate: File System Access API handles (Chrome, persistable
  permission) · storing clips in IndexedDB (persists, but heavy) · a small user "media
  library" the presets reference by id. Weigh size/permissions/UX.

## Sources & FX
- **Degradation FX** — posterize / pixelate / mosaic / scanlines / chroma bleed as a
  post step (the compositing option not yet built).
- **Camera/Video slot stability** — pin those slot indices (or migrate on load) so
  adding generative sources doesn't shift them and break older presets.

## Sync
- **OSC / Ableton Link bridge** — exact beat/tempo from a standalone Max patch (Link)
  over OSC → WebSocket, to replace the drifting onset-based BPM estimate.

## Demo & documentation
- ~~**Demo recording**~~ — **done (OBS).** "Live Visuals Demo" scene collection +
  "Live Visuals" profile configured locally (1080p60, hardware H.264, MP4 + BlackHole
  audio). Workflow documented in README → "Recording a demo".

## Housekeeping
- Choose a licence before any wider sharing.
