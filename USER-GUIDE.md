# Live Audio-Reactive Visuals — User Guide

*[Versión en español](USER-GUIDE.es.md)*

This app listens to your music and paints moving visuals in time with it, which you
send to a projector or second screen. You perform it live from a MIDI controller —
riding a fader or knob to sweep an effect, hitting a pad to fire a saved look — or,
with no MIDI gear at hand, by snapping between up to 8 saved looks with the number
keys on your keyboard.

---

## 1. Getting started

**All you need is [Google Chrome](https://www.google.com/chrome/).** The app runs
inside the browser — there is nothing to install and no account to create.

**Open the app here: [https://luispsalas.github.io/live-visuals/](https://luispsalas.github.io/live-visuals/)**

Open that link in Chrome, then click the **No sound** button next to *Start*.
Visuals begin moving straight away. Change **Source A** and **Source B**, drag a few
sliders, and you have already used most of it.

That is genuinely all that is required to explore. Everything below is optional and
only needed for specific things.

> **If you were given a folder of files instead** — no link, just files on your
> computer — see *Running from a folder* at the end of this guide.

---

## 2. What Chrome will ask permission for (and why)

Chrome will show one or two permission pop-ups. They look alarming out of context,
so here is exactly what each one is and what it does:

| Chrome asks | Why the app needs it | What actually happens |
|---|---|---|
| **"Use your microphone?"** | This is the only way a browser can receive audio — including from the virtual cable carrying your music. | It reads whichever input **you** pick in the dropdown. It is not recording you, and nothing is sent anywhere. |
| **"Share your screen?"** | Only if you click **System audio**. Chrome has no "just give me the sound" option, so it uses the screen-share dialog to hand over audio. | The app **immediately discards the video** and keeps only the sound. |
| **"Use your camera?"** | Only if you turn on **Camera** or **Motion**. | The picture is drawn on screen and used for motion detection, then discarded. |

**Nothing leaves your computer.** The app has no server, no account and no analytics —
it makes no internet connections at all. Everything is processed on your machine and
thrown away frame by frame. Saved presets live only in this browser's local
storage — tied to this browser and computer, gone if you clear this site's browser
data, and not available on a different browser or machine.

You can review or revoke any of this at any time by clicking the icon at the left of
Chrome's address bar. If you never use the camera or audio features, you are never
asked at all.

---

## 3. Making it react to your music

The app cannot hear your computer's sound by itself — browsers aren't allowed to
listen to whatever is playing. **Pick your system below and follow that one track —
you don't need to read the other.**

### If you're on a Mac

**Music playing in a Chrome tab** (YouTube, Spotify web, SoundCloud)? Use the fast,
nothing-to-install option:

1. Click **System audio** in the Audio panel.
2. In Chrome's share dialog, pick the **Chrome Tab** option, choose the tab your
   music is playing in, and tick **"Share tab audio."**
3. Chrome shows a "sharing" bar while this is active — that's expected, ignore it.

**Running a DAW** (Ableton, Logic, etc.)? Chrome on a Mac can only share a browser
tab's audio, not your whole system, so you'll need a small free tool that routes
sound to the app instead:

1. Download and install **[BlackHole 2ch](https://existential.audio/blackhole/)**
   (free; you give an email address and they send the download link).
2. Open the Mac app **Audio MIDI Setup** (press ⌘+Space, type its name, press Return).
3. Click the **+** at the bottom-left → **Create Multi-Output Device**.
4. In the list, tick **both** *BlackHole 2ch* **and** your normal speakers or
   interface. Ticking both is what lets you still *hear* the music while the app
   listens to it.
5. In your DAW, set the audio **output** to that new Multi-Output Device.
6. Back in the app: click **Refresh**, choose **BlackHole**, click **Start**. Play
   something — the coloured meters should move.

*Note: with a Multi-Output Device selected, the Mac's volume keys stop working. Use
your DAW's volume or your speaker's own knob instead.*

### If you're on Windows

This is the easier platform — **System audio** captures your whole computer, DAW
included, with nothing to install:

1. Click **System audio** in the Audio panel.
2. In Chrome's share dialog, choose **Entire Screen**.
3. Tick **"Also share system audio"** at the bottom, then click **Share**.
4. The app now hears everything your computer plays, including your DAW. Chrome
   shows a "sharing" bar while this is active — that's expected, ignore it.

If you'd rather have a permanent virtual audio cable instead (no dialog each time):

1. Download and install **[VB-CABLE](https://vb-audio.com/Cable/)** (free; run the
   installer as Administrator, then restart).
2. In your DAW, set the audio **output** to **CABLE Input**.
3. To keep hearing the music: open Windows **Sound settings** → *More sound settings*
   → **Recording** tab → right-click **CABLE Output** → *Properties* → **Listen** tab
   → tick *Listen to this device* and choose your speakers.
4. In the app: click **Refresh**, choose **CABLE Output**, click **Start**.

*If VB-CABLE feels fiddly, [VoiceMeeter](https://vb-audio.com/Voicemeeter/) (also
free) does the same job with a proper mixer window, at the cost of a longer setup.*

> **Honest status:** the Mac/BlackHole path is tested and used regularly. The Windows
> instructions follow standard setups but have not been verified first-hand yet. If
> something doesn't match what you see, **No sound** mode still works on any machine.

---

## 4. The two views: Design vs Performance

The app has two modes. You don't set them manually — opening the output window
switches you into Performance, closing it returns you to Design.

| | **Design view** (default) | **Performance view** |
|---|---|---|
| **When** | Building and tweaking looks | Playing live to an audience |
| **Layout** | Big preview on the left, all controls on the right | Controls slim into a narrow strip so they sit next to your DAW; a small preview tucks into the corner as a monitor |
| **Where the visuals show** | In the preview inside the window | Full-screen on your projector / second screen |
| **How to get there** | Just open the app | Click **Open output window →** (top right), drag that window to your projector, press **f** for full screen |

To go back to Design view, just close the output window.

---

## 5. Blend modes — how two visuals combine

You can run **two sources at once** (Source A and Source B) and choose how they
overlap. The **Crossfade** slider fades between them; the **Blend** menu changes
the *math* of how they mix. Plain-language cheat sheet:

| Blend | What it does | Reach for it when… |
|---|---|---|
| **Mix** | Plain crossfade — the slider dials from A to B | You want a simple blend, or you're using the luma key (keep it on Mix then) |
| **Add** | Adds them together — everything gets brighter, colors pile toward white | Glows, light beams, bright energetic looks |
| **Screen** | A gentler brighten — lifts the darks without blowing out as fast as Add | Layering a bright feed over a darker one softly |
| **Multiply** | Multiplies them — everything gets darker; only areas bright in *both* survive | Tinting, shadows, moody darkening |
| **Difference** | Shows where the two *disagree* — inverted, psychedelic edges | Glitchy, trippy, high-contrast moiré looks |
| **Lighten** | Keeps whichever source is brighter, pixel by pixel | Letting the bright parts of each punch through |
| **Darken** | Keeps whichever source is darker, pixel by pixel | Letting the dark parts dominate |
| **Overlay** | Darks get darker, lights get lighter — a contrast boost | Punchy, high-contrast combinations |

**Tip:** if you're using the **luma key** (revealing one feed through another's
bright shapes — e.g. a camera through moving blobs), keep **Blend on Mix**. The
brightening modes (Screen/Add) fight the key and wash everything to white.

**Also worth knowing:** **Crossfade doubles as the master level for the key too.**
With Crossfade at 0, neither the blend nor the key has anything to show — the panel
will warn you with a small note if you turn Key on while Crossfade is still at 0.

*(Before/after thumbnails for each blend mode are planned — they'd explain this
faster than the words do.)*

---

## 6. Motion — letting movement drive the visuals

Alongside the music, the app can watch something *move* and turn that movement into
its own control signal — a second, independent way to shape the visuals.

1. In the **Motion** module, use **Watch** to pick what it looks at: your **Camera**,
   or a loaded **Video file** (if you choose Video file, movement *within* the clip
   drives things — not your own movement).
2. Click **Enable**. If you picked Camera, this turns the camera on for you.
3. Watch the **Motion** meter respond as things move in frame. Adjust **Sensitivity**
   if it feels too twitchy or too flat for your lighting/room.
4. Below that, tick a row to **route** motion onto a parameter (Crossfade, Feedback,
   Glitch) with a depth slider — motion now nudges that control on top of wherever
   its own slider sits.

A good first thing to try: route Motion onto **Crossfade**. Standing still holds
Source A; moving pushes toward Source B.

---

## 7. Everyday use (quick version)

1. Start your music; the audio meters in the app should move. (No music? Click
   **No sound** and everything still animates.)
2. Pick **Source A** and **Source B**, and slide **Crossfade** between them.
3. Play with **colour**, **feedback**, and **effects**; pick a **Reactivity** mode
   for how strongly the visuals punch to the beat.
4. Set the **BPM** (type or tap it) and switch on a **BPM loop** for motion that
   rides the tempo.
5. **Save** a look you like under **My presets** — recall it with its button, the
   number keys **1–8**, or a learned MIDI pad/key.
6. When you're ready to play out, **open the output window**, send it to the
   projector, and go full screen.

**Want to start over?** Click **Reset** (top right, next to Open output window) to
put every look/effect control back to its default. It asks you to confirm first, and
it leaves your tempo, Quality setting, MIDI mappings, and saved presets untouched.

> **Starter presets** are on the to-do list. For now the preset list starts empty —
> build a look you like and save it, and it will still be there next time **on this
> same browser and computer**. Presets aren't stored anywhere online — they live only
> in this browser's local storage, so they won't follow you to a different browser, a
> different computer, or survive clearing this browser's site data.

---

## 8. If it stutters

Work down this list; the first two fix almost everything.

1. **Lower the Quality slider** (Output module) to 60–75%, or 40–50% on a 4K
   projector. It renders internally at a smaller size and scales up to fill your
   screen — the picture softens a little, but the motion gets much smoother.
2. **Plug the laptop in.** On battery, both Mac and Windows slow the graphics chip
   down dramatically. This is the most commonly missed cause.
3. **Close other browser tabs and apps** — especially anything playing video, and
   video calls.
4. **Ease off the expensive controls:** **Feedback** and heavy **Pixelate** cost the
   most, and a camera or video source costs more than a generated one.

---

## 9. Running from a folder

Only needed if you were given the project files rather than a web link. You will need
**[Node.js](https://nodejs.org)** (choose the big **LTS** button and click through the
installer).

**Mac:** open the **Terminal** app, type `cd ` (with a space), drag the project folder
onto the window, press Return. **Windows:** right-click the folder and choose *Open in
Terminal*.

Then type these two lines, pressing Return after each — the first is only needed the
very first time:

```
npm install
npm run dev
```

It prints a web address like `http://localhost:5173`. Open that in Chrome. Leave that
window open while you use the app; closing it stops the app.
