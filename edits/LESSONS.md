# Edit lessons

The user's ratings and the rules they taught. `/make-edit` reads this first;
these rules override its defaults. Newest first.

## 2026-10-12 — Messi v3 "Forever Ten" (second reference)
- The new reference was a high-key anime character edit, not football. Its
  style is soft (white paper, pastel duotones, hand-written script names,
  whip blur), so the house style from v2 (punch/shake/RGB, Bebas) did not
  fit. **Rule:** the reference's own visual language overrides the house
  style. Re-derive the system from each new reference.
- **Rule:** read cut times off a per-frame difference/luma scan, not only
  sheets. The settle curves after each cut show the camera move.
- Thumbnail reads were wrong again: the n1 "face" sat at x .48, not .2, and
  hands cover it after 5.05 s. A PiP zoom left a border in n2 until it was
  cropped past it. **Rule:** check every footage choice on a 480 px frame
  *and* a render still before the full render.
- Feedback: in the Mrs Saint Delafield script, "Forever Ten" read as "Forever
  Jew". Changed to "Forever Remembered", set in Allura. **Rule:** before
  render, read every script/handwritten line at small size as a stranger
  would and check it can't be misread as something offensive. Use a more
  legible script for any line that matters.
- Portrait photos in a landscape frame: frame them from the cut-out's
  alpha bounding box (head height), not the image box.

## 2026-10-12 — Messi v2: approved ("look how much better")
- **Rule:** never ship the first pass. After the first full render, do a
  hard self-critique against these rules and rebuild before sending.
- What made v2 land: speed ramps, word-by-word serif lyrics, display type
  between depth layers, split-screen + letterbox layouts, punch/shake/RGB
  on every hit, a narrative hook line in the first second.

## 2026-10-11 — Messi v2
- v1 feedback: "must be better… use mograph, viral fonts and layouts".
  The torn-paper/sticker scrapbook read as a template and most of it was
  static photos. **Rule:** footage first, with speed ramps and hit-synced
  punch/shake/RGB; photos only as 2.5D parallax, never flat stickers.
- **Rule:** editorial type pairing (italic serif lyrics word-by-word +
  ultra-condensed display between depth layers + tiny tracked labels).
- Heavy filter stacks can time out a render: pass `--timeout=240000`.

## 2026-10-11 — Messi "Blaugrana scrapbook" v1 (rejected: "must be better")
- Brief said Neymar; every supplied asset was Messi. Made a Messi edit and
  said so up front. **Rule:** check who is actually in the assets first.
- Screen-recorded sources need: crop of the video area, trimming of lock
  screen/Control Centre/player-UI frames, and checks for PiP zoom
  transitions (black edges). **Rule:** sheet every clip before choosing.
- Tracking keys read off small grids were wrong by up to 0.2. **Rule:**
  measure on 480 px frames at 5–10 fps and verify with a render still.
- Torn-paper entrances revealed black until scenes overlapped by 8 frames.
- Remotion outputs full-range yuvj420p; convert to limited yuv420p.

## 2026-10-11 — overall 5/10

### "Floodlights" (original, faceless) — 2/10
- Procedural 3D pitch read as a video game / screensaver. **Rule:** no
  code-drawn main visuals; use real or AI-generated footage, keep
  procedural for graphics and light effects.
- Music synthesised in Python sounded cheap. **Rule:** use a real track or
  `vidiq_generate_music`; synthesise only SFX.
- The story was told only in text over the same pitch. **Rule:** every
  text beat needs its own image that shows it; have a person (or a human
  trace) in most shots.
- Master peaked at +0.9 dBTP (found later by `audiocheck.py`). **Rule:**
  true-peak limit to -1 dBTP (fixed: limiter now runs at 4x sample rate, master is -14.6 LUFS / -1.5 dBTP).

### CR7 remake of the LeBron reference — 6/10
- Worked: cut-out layering with text behind the player, 3D clock ring,
  bloom transition, glitch hit, matching the reference's timing.
- Weak: stills instead of moving clips; borrowed song; no lyric sync
  (no transcription available). **Rule:** prefer moving clips, use
  image-to-video on stills when clips are missing, transcribe lyrics.

### CR7 "Villain of Football" — not scored separately
- Built from a vidIQ viral pattern; beat-synced, safe-zone layout,
  outline-in-front text. Same stills/music limits as above.
