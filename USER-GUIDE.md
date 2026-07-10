# Live Visuals — User Guide

> **DRAFT for review.** Plain-language guide for non-technical users. Sections
> marked **TBD** need a decision or testing before this is final — see the notes.

Live Visuals is an app that listens to your music and paints moving visuals in
time with it, which you send to a projector or second screen. You drive it live
from your keyboard or a MIDI controller.

---

## 1. Installing & running

> **TBD — the friendly way to launch.** Right now the app starts from a small
> text command in a terminal (steps below). That's a barrier for non-technical
> users. Options to decide between before release: **(a)** host it online so you
> just open a web link, **(b)** package it as a normal double-click app, or
> **(c)** ship a one-click launcher script. Until then, the steps below work.

You need three things: the **Chrome** browser, **Node.js** (a small free tool
that runs the app), and a way to send your computer's sound into the app.

### On a Mac

1. **Install Chrome** if you don't have it — [google.com/chrome](https://www.google.com/chrome/).
2. **Install Node.js** — go to [nodejs.org](https://nodejs.org/), download the
   button that says **LTS**, open the downloaded file, and click through the installer.
3. **Install BlackHole** (lets the app hear your music) —
   [existential.audio/blackhole](https://existential.audio/blackhole/). Then, in the
   Mac app *Audio MIDI Setup*, create a **Multi-Output Device** that ticks both
   **BlackHole** and your speakers, and set it as the sound output in Ableton — so
   you still hear sound while the app listens.
4. **Download the app** — on the project's GitHub page, click the green **Code**
   button → **Download ZIP**, then unzip it.
5. **Start it** — open the **Terminal** app, type `cd ` (with a space), drag the
   unzipped folder onto the Terminal window, and press Return. Then type these two
   lines, pressing Return after each (the first is only needed the very first time):
   ```
   npm install
   npm run dev
   ```
6. Terminal prints a web address like `http://localhost:5173`. Open it in **Chrome**.

### On a Windows PC

Steps 1, 2, 4, 5, 6 are the **same** as the Mac (Node.js and the ZIP download work
identically; use **Command Prompt** instead of Terminal — you can right-click the
folder and choose "Open in Terminal", or type `cd` then paste the folder path).

**The difference is the audio step (3).** BlackHole is Mac-only.

> **TBD — Windows audio routing.** The Windows equivalent of BlackHole is a free
> tool like **VB-CABLE** or **VoiceMeeter** (route Ableton's output into the virtual
> cable, then pick that cable as the app's input). This path is **not yet tested** —
> needs a pass on a Windows machine before we document exact clicks.

---

## 2. The two views: Design vs Performance

The app has two modes. You don't set them manually — opening the output window
switches you into Performance, closing it returns you to Design.

| | **Design view** (default) | **Performance view** |
|---|---|---|
| **When** | Building and tweaking looks | Playing live to an audience |
| **Layout** | Big preview on the left, all controls on the right | Controls slim into a narrow strip so they sit next to Ableton; a small preview tucks into the corner as a monitor |
| **Where the visuals show** | In the preview inside the window | Full-screen on your projector / second screen |
| **How to get there** | Just open the app | Click **Open output window →** (top right), drag that window to your projector, press **f** for full screen |

To go back to Design view, just close the output window.

---

## 3. Blend modes — how two visuals combine

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

> **TBD — worth a picture.** A small before/after thumbnail per blend mode would
> make this table much clearer than words. Add once we can grab screenshots.

---

## 4. Everyday use (quick version)

1. Start your music in Ableton; the audio meters in the app should move.
2. Pick **Source A** and **Source B**, and slide **Crossfade** between them.
3. Play with **colour**, **feedback**, and **effects**; pick a **Reactivity** mode
   for how strongly the visuals punch to the beat.
4. Set the **BPM** (type or tap it) and switch on a **BPM loop** for motion that
   rides the tempo.
5. **Save** a look you like under **My presets** — recall it with its button, the
   number keys **1–8**, or a learned MIDI pad/key.
6. When you're ready to play out, **open the output window**, send it to the
   projector, and go full screen.

> **TBD — starter presets.** New users currently open the app with an empty preset
> list. A small set of ready-made looks to start from is on the backlog.
