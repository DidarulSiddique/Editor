# Messi edit — v3 "Forever Remembered" (current)

`src/MessiV3.tsx`, composition `MessiV3`. Output: `out/messi-edit-v3.mp4`.

Rebuilt on the second reference (`97d7904d…mp4`), which is not a football
edit: it is a high-key watercolour anime character edit (Hunter x Hunter,
"The Fade", by.inx). Earlier versions were benchmarked on the Neymar
reference, so they could not look like this one.

## Reference breakdown (768x576 4:3, ~20 unique fps in a 30 fps file, 16.6 s)

Checked at 4 fps for the whole file, 10 fps for every shot, and a per-frame
difference/luma scan for cut times. The cuts fall about every 2 beats of a
152 BPM song. The edit runs two passes of the same eight shots. Each shot
enters with a fast move that eases out over about 0.5 s, then drifts.

| Time (pass 1 / pass 2) | Shot | Technique |
|---|---|---|
| 0.00–0.43 | blank paper | faint inner frame, white |
| 0.43 / 5.97 | Hisoka, red tint | whip in from the left (horizontal blur), "Hisoka" in red script writes on with a faint echo below |
| 1.13 / 6.60 | Killua, teal | whip from the right, giant faded face ghost behind, "Killua" bottom-left |
| 1.92 / 7.40 | Gon, yellow | fades up from white, "Gon" in yellow, small dark script line starts above |
| 2.60 / 8.10 | Gon + two big faded faces | pull-out zoom into a collage, "One Summer… Night—" / "The Fade… By.inx" in a second script |
| 3.43 / 8.90 | Gon punch, sky blue | whip from the left, push-in, no text |
| 4.23 / 9.73 | B&W trio + big green Leorio | double exposure, "The Fade" in black script |
| 5.00 / 10.50 | punch-in crop | diagonal checker floor, big ghost "The" over "The Fade"; pass 2 flickers between crops |
| 5.71 / 11.10 | white | smear out to white |
| 11.20–12.45 | black | small "by.inx" signature |

Identity: white paper, one pastel duotone per shot, coloured paper edges,
script type in the shot's colour with an echo, horizontal whip blur and ease-out
settles. There are no hard graphics.

## What v3 does with Messi

| Time | Shot (source) | Type |
|---|---|---|
| 0.00 | paper, a hairline frame draws itself | — |
| 0.43 | 785a0283 (Barça kiss), garnet | "Lionel" · FC BARCELONA · 2004 — 2021 · outline "10" |
| 1.13 | 1fa6cf3b (World Cup kiss), teal | "Andrés" · CAMPEÓN DEL MUNDO · QATAR 2022 · "2022" |
| 1.92 | d735f99e (full-length, Barça), gold | "Messi" · "1987" · "Rosario…" |
| 2.60 | collage: d735 + 785a, 1fa6, 12fb faces | "Rosario, 1987…" / "La Pulga —" |
| 3.43 | clip 5, 2.55 s, 0.55x, sky grade | push-in 1.18→1.42 tracking Messi |
| 4.23 | clip 3 (B&W) + clip 2 close-up (green) | "Forever Remembered" |
| 5.00 | punch-in, checker floor | ghost "Forever" over "Forever Remembered" |
| 5.97 | 1ffe19d4 (shirt to the crowd), garnet | "Barcelona" · 672 GOALS · 778 GAMES · "672" |
| 6.60 | 12fbf6b3 (Copa América kiss), teal | "Argentina" · COPA AMÉRICA · "10" |
| 7.40 | clip 1, 4.95 s, profile → hands to face, gold | "Leo" · "Forever…" |
| 8.10 | collage: 17d3 + 1fa6, 785a, d923 | "Forever Remembered…" / "since 2004 —" |
| 8.90 | clip 3, 6.0 s dribble, sky | push-in with tracking |
| 9.73 | clip 1 wide (B&W) + d923c80d cut-out (green) | "Forever Remembered" |
| 10.50 | punch-in + crop flicker, checker | ghost "Forever" over "Forever Remembered" |
| 11.10 | white, then black | `CREATOR` signature (edit the constant) |

How it is built:
- **Tints:** a single SVG filter per colour does a partial desaturate and then a lifted duotone. Footage gets a light 3x3 sharpen first and keeps more mid-tones.
- **Photos:** each photo is drawn as an illustration: the tinted cut-out sits over a faint copy of the full photo and fades out at the bottom.
- **Broadcast clutter:** scoreboards and channel bugs are hidden under paper haze or cropped out.
- **Motion blur:** only on whips, using an anisotropic SVG blur (`stdDeviation="N 0"`). Nothing else is blurred.
- **Type** (title lines use Allura, chosen for legibility):
  - Names: Mrs Saint Delafield, revealed by a moving mask so they write on, with an echo copy.
  - Second script line: Monsieur La Doulaise.
  - Captions: Cormorant Garamond in tracked caps.
  - Outline numerals sit behind the figures.
- **Facts used:** born Rosario 1987; nickname La Pulga; FC Barcelona 2004–2021, with 672 goals in 778 games; World Cup champion in Qatar 2022; Copa América winner. Year left off the Copa photo, since he won it in 2021 and 2024.

## Technical
- 1440x1080 (4:3, matches the reference), 60 fps, 747 frames, 12.45 s.
- H.264 High, yuv420p limited range BT.709, CRF 14 / preset slow (~8 Mb/s).
- AAC 48 kHz 320 kb/s, -14.3 LUFS integrated, -6.0 dBTP true peak.
- Checked: frame count; `blackdetect` (black only on the 11.2–12.43 s end card); contact sheets at 4 and 10 fps; side-by-side with the reference (`out/v3-vs-reference.png`).
- Soundtrack: the reference's song, used locally for timing. Post with the official sound in-app.

Render:
```bash
npx remotion render src/index.ts MessiV3 out/v3-raw.mp4 \
  --browser-executable=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell \
  --concurrency=4 --timeout=240000 --crf=12
ffmpeg -i out/v3-raw.mp4 -vf "scale=in_range=full:out_range=tv,format=yuv420p" \
  -c:v libx264 -crf 14 -preset slow -profile:v high -color_range tv -colorspace bt709 \
  -color_primaries bt709 -color_trc bt709 \
  -af "volume=1.5dB,aresample=192000,alimiter=limit=0.84:attack=3:release=60:level=disabled,aresample=48000" \
  -c:a aac -b:a 320k -movflags +faststart out/messi-edit-v3.mp4
```

---

# Messi edit — v2 and v1 "Blaugrana scrapbook"

**v2 (`src/MessiV2.tsx`, composition `MessiV2`)** replaces the scrapbook
look after feedback that v1 looked like a template. Changes:
- Speed ramps on every footage shot (time-remapped with `<Freeze>`:
  0.45x slow-motion into 2.2x snaps), zoom punch + shake + RGB split
  (SVG channel-offset filter) on every cut and strong onset.
- Editorial type: Instrument Serif italic lyrics revealed word by word on
  the sung times, Bebas Neue display words set *between* photo depth
  layers with an outline copy in front, tracked Inter labels and a
  timecode/number HUD.
- Layouts: letterbox for emotional beats, 3-panel split screen on "and
  the time", 2.5D parallax photos (blurred plate / type / cut-out),
  flicker cuts on "my" and "mind", light leak on the Argentina turn.
- Narrative hook: "he left barcelona in 2021." then the chorus plays
  out as Barça → Argentina, ending on the Copa América kiss.
- Footage sharpened (SVG convolve) and graded teal/warm.

Render v2 with `MessiV2` in place of `MessiEdit` below and
`--timeout=240000 --concurrency=3` (the freeze scene stacks heavy filters).

---

# v1 — "Blaugrana scrapbook"

11 s vertical football edit built in Remotion from the supplied clips and
photos, benchmarked against a Neymar TikTok edit.

**Subject note.** The brief asked for a Neymar edit, but every supplied clip
and photo shows Lionel Messi (Barcelona 2007–2018, Argentina trophies). No
Neymar footage was provided, so the edit is about Messi, using the Neymar
reference only as a style and quality benchmark.

## Reference breakdown (ac1c2a70…mp4, 768x576, 24 fps, 15.3 s)

Inspected at 4 fps over the whole file and 10 fps (every 0.1 s) over the
11 s of content; cuts confirmed with ffmpeg scene detection. Song: about
63 BPM; the lyric cards ("the distance… the time between us… never change
my mind 'cause baby I would die for you") point to The Weeknd's "Die For You".

| Time | Shot | Technique |
|---|---|---|
| 0.00–1.50 | Neymar (Barça) volley, wide | Animated hand-drawn logo scribble with sparkle; magenta/green colour cast; rounded CRT-style frame; whip blur at 0.4 s |
| 1.50 | White flash | Small rotated "THE" |
| 1.60–2.20 | Collage card | Halftone cut-out Neymar (Brazil); huge rotated "DISTANCE"; green squares, red outline box; blur-out |
| 2.30 | White flash | — |
| 2.40–3.20 | Collage card | Magazine cover spinning in; B&W cut-out silhouette; yellow outline square; red "TIME" |
| 3.30–4.20 | Lyric screen | Red/orange gradient; "the time between us" typing big over blurred repeated lyric lines; circle-stroke swoosh at 4.2 |
| 4.30–4.80 | Neymar vs Croatia dribble | Light-streak ring trail around the ball; pink/green cast |
| 4.90 | White flash | — |
| 5.00–6.00 | Same dribble continues | "NEVER" riding along the body; glowing ball |
| 6.10–7.00 | Collage card | "CHANGE" (blue), green polygon, purple star, red halftone Neymar with World Cup; then "MY" / "MIND" in big yellow |
| 7.10–7.90 | Close tracking run | Huge text sliding *behind* the player (masked) |
| 8.00–9.00 | Wide dribble | Vertical "BABY" + small "would"; green tint |
| 9.00 | Dip to black | — |
| 9.10–9.90 | Collage card | Neymar crying on the grass; repeated "FOR YOU" column; star, vinyl record, trophy sticker |
| 10.00–11.00 | Black end card | Creator tag "KIET" |
| 11.00–15.30 | TikTok outro | (platform overlay, not part of the edit) |

Recurring identity: footage alternating with neon pop-art collage cards,
one lyric word per card, colour casts, halftone cut-outs, CRT frame.

## Creative summary — what is borrowed and what is new

Kept from the reference: the **structure** (footage ↔ lyric collage cards on
the vocal lines), the energy level, cut-outs with text behind the player, and
flash cuts.

Original to this edit:
- **Blaugrana scrapbook** look instead of neon pop-art: torn-paper cards that
  rip in from below, masking tape, white sticker borders, offset halftone
  prints of each silhouette, stamp lettering (Anton) + marker handwriting.
- **Hand-drawn tracking rings** that draw themselves around Messi, driven by
  per-0.1 s tracking keys, and the crop pans to follow him.
- **Freeze-frame sticker**: at 5.70 s the dribble freezes, the pitch fades to
  paper and Messi lifts off the frame as a sticker under a stamped NEVER.
- **Colour as story**: Barça blue/garnet for the club years, turning to
  Argentina sky blue on "change my mind", ending on the Copa América kiss.
- Different shot order, typography, transitions, opening hook and ending.

## Shot list (as rendered)

| Time | Source | Graphic |
|---|---|---|
| 0.00–1.54 | clip 5 (c7ccacf4) 2.42 s: sprint past Getafe | ring draws on 0.26 s hit, "leo.", outline "10" |
| 1.54–2.30 | photo 785a0283 (boot kiss) | "the DISTANCE" behind sticker, tape |
| 2.30–3.30 | photo 1ffe19d4 (shirt to the crowd) | "& the TIME" on garnet paper |
| 3.30–4.25 | photo d735f99e as halftone | "between us." lyric screen, scrolling lyric rows |
| 4.25–4.92 | clip 4 (ee66a409) 0.3 s: dribble vs Real Madrid | white ring |
| 4.92–6.08 | clip 3 (26c11841) 3.22 s → freeze at 4.0 s | "never", freeze → sticker + NEVER |
| 6.08–7.08 | photo 1fa6cf3b (World Cup kiss) | "CHANGE my MIND", sky-blue stripes, confetti |
| 7.08–8.04 | clip 2 (5c8135d0) 9.0 s, 0.47x slow-mo | "'cause" |
| 8.04–9.04 | clip 3 6.0 s: through Zaragoza defenders | ring, vertical "BABY" |
| 9.04–10.04 | photo 17d36584 (World Cup on shoulders) | "i'd die" + "FOR YOU" column |
| 10.04–11.00 | photo 12fbf6b3 (Copa América kiss) | "Leo" signature, "MESSI · 10", fade |

Not used, with reasons: clip 1 (180c42cb) — its strongest frames carry
YouTube player controls, the rest is wide; clip 6 (7075a4f2) — Messi is a
few pixels tall; clip 2 wide section — no Messi; photo d923c80d — same back
pose as 1ffe19d4, so redundant.

## Technical

- 1080x1920, 60 fps (660 frames), 11.0 s
- Video: H.264 High, yuv420p limited range (BT.709), CRF 12 / preset slow,
  about 20 Mb/s. Remotion renders full-range yuvj420p, so the master is
  converted with ffmpeg (`scale=in_range=full:out_range=tv`).
- Audio: AAC-LC 48 kHz 320 kb/s, -14.0 LUFS integrated, true peak -5.3 dBTP
  (song turned down 5.6 dB, limited at 4x sample rate).
- Verified: frame count 660, no black frames (`blackdetect`), every cut and
  transition reviewed on 4 fps and 10 fps contact sheets.
- Sources: iPad screen recordings 2732x2048 HEVC (variable ~55–60 fps);
  the video area was cropped out, conformed to 1920x1080 @ 60 fps. A 9:16
  crop of a 16:9 broadcast frame keeps only ~600 source pixels of width, so
  footage is soft at 1080 wide; upscaling does not restore that detail.
- Photos upscaled 2x (ESRGAN), cut out with @imgly/background-removal-node.
- Soundtrack: the reference's song, used locally for timing only. Post with
  the official sound in-app.

## Reproduce

```bash
cd edits/messi-edit
npm install
./prepare.sh /path/to/uploads        # rebuilds public/ from the originals
npx remotion render src/index.ts MessiEdit out/raw.mp4 \
  --browser-executable=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell \
  --concurrency=4 --crf=14
ffmpeg -i out/raw.mp4 -vf "scale=in_range=full:out_range=tv,format=yuv420p" \
  -c:v libx264 -crf 12 -preset slow -color_range tv -colorspace bt709 \
  -color_primaries bt709 -color_trc bt709 \
  -af "volume=-5.6dB,aresample=192000,alimiter=limit=0.84:attack=3:release=60:level=disabled,aresample=48000" \
  -c:a aac -b:a 320k -movflags +faststart out/messi-edit.mp4
```
