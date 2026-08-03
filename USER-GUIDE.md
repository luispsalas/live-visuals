# Live Audio-Reactive Visuals — User Guide

> Plain-language guide for non-technical users. No technical background assumed.

This app listens to your music and paints moving visuals in time with it, which you
send to a projector or second screen. You drive it live from your keyboard or a MIDI
controller.

---

## 1. Getting started

**All you need is [Google Chrome](https://www.google.com/chrome/).** The app runs
inside the browser — there is nothing to install and no account to create.

Open the app's link in Chrome, then click the **No sound** button next to *Start*.
Visuals begin moving straight away. Change **Source A** and **Source B**, drag a few
sliders, and you have already used most of it.

That is genuinely all that is required to explore. Everything below is optional and
only needed for specific things.

> **If you were given a folder instead of a link**, see *Running from a folder* at
> the end of this guide.

---

## 2. Making it react to your music

The app cannot hear your computer's sound by itself — browsers aren't allowed to
listen to whatever is playing. So you install a small free "virtual cable" that
carries sound from your music software into the app. You do this once.

### On a Mac

1. Download and install **[BlackHole 2ch](https://existential.audio/blackhole/)**
   (free; you give an email address and they send the download link).
2. Open the Mac app **Audio MIDI Setup** (press ⌘+Space, type its name, press Return).
3. Click the **+** at the bottom-left → **Create Multi-Output Device**.
4. In the list, tick **both** *BlackHole 2ch* **and** your normal speakers or
   interface. Ticking both is what lets you still *hear* the music while the app
   listens to it.
5. In your music software, set the audio **output** to that new Multi-Output Device.
6. Back in the app: click **Refresh**, choose **BlackHole**, click **Start**. Play
   something — the coloured meters should move.

*Note: with a Multi-Output Device selected, the Mac's volume keys stop working. Use
your music software's volume or your speaker's own knob instead.*

### On a Windows PC

1. Download and install **[VB-CABLE](https://vb-audio.com/Cable/)** (free; run the
   installer as Administrator, then restart).
2. In your music software, set the audio **output** to **CABLE Input**.
3. To keep hearing the music: open Windows **Sound settings** → *More sound settings*
   → **Recording** tab → right-click **CABLE Output** → *Properties* → **Listen** tab
   → tick *Listen to this device* and choose your speakers.
4. In the app: click **Refresh**, choose **CABLE Output**, click **Start**.

*If that feels fiddly, [VoiceMeeter](https://vb-audio.com/Voicemeeter/) (also free)
does the same job with a proper mixer window, at the cost of a longer setup.*

> **Honest status:** the Mac path is tested and used regularly. The Windows path
> follows the standard VB-CABLE setup but has not been verified first-hand yet. If
> something doesn't match, **No sound** mode still works perfectly on any machine.

---

## 3. The two views: Design vs Performance

The app has two modes. You don't set them manually — opening the output window
switches you into Performance, closing it returns you to Design.

| | **Design view** (default) | **Performance view** |
|---|---|---|
| **When** | Building and tweaking looks | Playing live to an audience |
| **Layout** | Big preview on the left, all controls on the right | Controls slim into a narrow strip so they sit next to your music software; a small preview tucks into the corner as a monitor |
| **Where the visuals show** | In the preview inside the window | Full-screen on your projector / second screen |
| **How to get there** | Just open the app | Click **Open output window →** (top right), drag that window to your projector, press **f** for full screen |

To go back to Design view, just close the output window.

---

## 4. Blend modes — how two visuals combine

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

*(Before/after thumbnails for each blend mode are planned — they'd explain this
faster than the words do.)*

---

## 5. Everyday use (quick version)

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

> **Starter presets** are on the to-do list. For now the preset list starts empty —
> build a look you like and save it, and it will still be there next time.

---

## 6. If it stutters

Work down this list; the first two fix almost everything.

1. **Lower the Quality slider** (Output module) to 60–75%, or 40–50% on a 4K
   projector. The picture softens a little and the motion gets much smoother.
2. **Plug the laptop in.** On battery, both Mac and Windows slow the graphics chip
   down dramatically. This is the most commonly missed cause.
3. **Close other browser tabs and apps** — especially anything playing video, and
   video calls.
4. **Ease off the expensive controls:** **Feedback** and heavy **Pixelate** cost the
   most, and a camera or video source costs more than a generated one.

---

## 7. Running from a folder

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
