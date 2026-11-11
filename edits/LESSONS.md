# Edit lessons

The user's ratings and the rules they taught. `/make-edit` reads this first;
these rules override its defaults. Newest first.

## 2026-11-11 — Cleopatra v4 rebuild against 9 @ricksclip-style references (`edits/cleopatra-v4/`)
- **Measure the references, don't eyeball them.** At a 0.25 scene threshold the 9 references have 1–2 hard cuts each; v3 had 31.
  Their shot changes are 10–30-frame camera flights, push-ins and 4–6-frame dissolves, and their median frame-to-frame
  change is ~4.7 vs v3's 2.7 (the camera and cast never stop). **Rule:** no hard cuts in this style. Every shot carries a
  transition in (`tin`: D dissolve 7f, W whip with motion blur 8f, F zoom-through 9f), rendered by drawing the outgoing shot
  (forced via `setForce`) into a second target and compositing (`renderShot` + `compScene` in main.js).
- **Script shape that matches them:** one protagonist doing something that sounds wrong ("The queen of Egypt had to learn
  Egyptian… like a foreign language"), "You see,", second person ("Imagine you're a farmer on the Nile"), "How is that
  possible?", a backstory with a hook of its own ("It starts with a stolen body"), an everyday analogy (the landlord who never
  learns your name), and a visual payoff (a scribe gilding her image 400 years later). The last line repeats the hook so it loops.
- **vidIQ narration:** one call for the whole script (credits are charged per 1,000 characters *per call*). Chris read the
  1,235 characters in 75.5 s with a 2.4 s lead-in and 0.5–0.9 s pauses. `tighten.py` trims the lead-in, caps pauses at 0.34 s
  and adds 3% tempo → 65.1 s, which is Shorts pacing.
- **Word timings without Hugging Face:** sherpa-onnx models download from GitHub releases. The whisper models give no
  timestamps, but zipformer-small-en gives token times. Its tokens start with a space, not "▁", so `words.py` aligns ASR words to
  the script with difflib.
- **9:16 framing:** a chase reads best head-on (camera ahead of the horses, looking back). Side tracking only fits ~6 m of road
  and loses the chasers. A big relief or statue lit warm at night blows out to flat yellow: keep its point lights ≤ ~2.5 and
  bloom ≤ 1.5, and frame the payoff on a face.
- Speed: 4 Playwright workers render ~22 frames/min (~5 s per frame each), so a 66 s short takes ~90 min. Start it in the background early.
- **v4b, "the main focus is that Cleopatra wasn't Egyptian".** The user moved the hook mid-render to "The most famous Egyptian
  queen in history… was not Egyptian." **Rule:** when the user names the story's main point, it must be the first line and the
  last line (the loop). Never trade it for a cleverer side angle.
  - Script a hook change without re-rendering: voice only the new opening and closing lines (one vidIQ call, 28 credits).
    Splice them around the untouched middle of the old narration, and pad so the middle moves by a whole number of frames (+64).
  - Middle shots get `start + SHIFT` and keep their old frames: `finish.sh` links `frames/f(n-64)` into `frames_final/`.
    Only the new opening (0–357, including the transition into the first reused shot) and the new ending need rendering.
  - Say "was not Egyptian", never "wasn't Egyptian": the American t gets swallowed under music (see v3.1). Run ASR on the mix to check.
  - Killing a Playwright worker with `pkill -f "render.mjs frames 0-494"` did not stop it, and it rendered the obsolete hook anyway.
    Check with `ps` after killing a worker.

## 2026-11-06 — Cleopatra mini-documentary (references: bell-in-the-grave, "Why Perfect Railroads Don't Work", pirate storm oil)
- Built in `edits/cleopatra/` on the cave engine: 4 sets 1 km apart (throne hall, Macedonian battlefield + generals' tent,
  Alexandria with the Pharos, a Greece|Egypt split world), 32 shots in 60 s, a 360° orbit for the costume change,
  bloom + grain + split-tone (cool shadows, warm lights) in the ink pass. Captions: one word at a time, gold key words,
  a white title box ("WAS CLEOPATRA EGYPTIAN?") in the hook and payoff, yellow name tags, slam-in stamps.
- **Scale rule:** a bean-head character is ~1.8 m tall, face at ~1.5 m. Tables and props must stay under ~1.1 m,
  or they hide the faces of anyone standing behind them (the map-cake hid the generals until the table came down).
- **Seated characters:** the card's legs behind a throne still count in the safe-frame check; mark seated shots `cu`.
- **Stage in the sun:** characters under a roof (colonnade, stoa) render as grey cut-outs; put them in the open.
- **Accuracy notes kept in the script:** "came from a Greek royal family" and "her royal bloodline? Macedonian Greek" (the
  dynasty), never "no Egyptian blood" (her mother is uncertain); "no Ptolemy before her is *known* to have" learned Egyptian (Plutarch).
- Credits: vidIQ music 25 credits; narration with local Kokoro (Lewis) because the balance couldn't cover both.

### Cleopatra v2 — "slow down the speaking a bit, more micro animations, she looks too small on the throne"
- Slower voice without a re-animation: regenerate per sentence at Kokoro speed 0.86 (0.92 barely changed the trimmed
  length), then map new frames → old story frames piecewise-linearly between caption-chunk anchors (`retime.py`,
  `toOld()` at the top of renderFrame). Music follows with `rubberband=tempo=old/new`. 60 s → 66 s.
- **Retime bug:** fractional old frames (84.4) fell between one shot's `b` and the next shot's `a`, so `shotAt` fell
  through to the last shot — a one-frame flash of the ending at 42 cuts. **Rule:** shot lookup is `[a, b+1)`, and after
  any retime check *every* frame at each cut (a sampled contact sheet hit one by luck).
- "Too small on the throne" = the throne's size relative to her *and* wide reveals that end 25 m back. Fix both: scale
  the seated queen (1.3×), lower the throne back, and end the pull-backs ~15 m from the throne.
- Micro-animation pass that reads on a phone: eye darts (saccades), breathing squash, courtiers glancing/whispering,
  dust motes in the light, brazier embers, banner flutter, birds in every sky, slight handheld camera drift.

### Cleopatra v3 — "better hook, give her legs and arms on the throne, the speaking is a little flat"
- **Hook:** lead with the contradiction in five words ("Egypt's most famous pharaoh… wasn't Egyptian.") and hedge
  it into a curiosity gap ("At least, not the way you think.") so it stays accurate and the video pays it off.
- **Seated characters need a real sit pose**, not a standing card hidden behind the seat (reads as a torso in a box).
  Card in front of a *shallow* seat, fixed heading (`face: 0`, no billboard turn into the seat), shins + sandals on a
  footstool, hands on armrests. Arms that reach armrests break the safe frame in close-ups: blend the pose by framing
  (hands in lap when the visible half-width at the card is < ~0.8 m, armrests when > ~1 m).
- **Voice:** Kokoro v0.19 Lewis (grade D+) reads flat. Kokoro v1.0 (`kokoro-multi-lang-v1_0`, 54 voices) has better
  prosody; `bm_fable` keeps a British male narrator with more melody. Add per-line speed (faster lists, slower
  reveals), pauses before reveals, and "!" where the voice should lift. Keep the script in one `lines.py`.
- Pitch-variance metrics are unreliable on low gravelly voices (YIN loses voicing); pick by the published voice grades.

### Cleopatra v3.1 — "the 3rd voice is the best" (am_michael from the 4-voice audition)
- **Swap a narrator without re-rendering:** `fit_voice.py` generates each line in the new voice, solves Kokoro speed per
  line to fill the old voice's caption slot, closes the last ≤4% with rubberband and pads the rest. `segs.txt` (animation)
  is untouched; `segs_caps.txt` holds the new voice's real timing for the captions. Michael lands at speed ~0.8–0.9.
- Never split a joined sentence at its *longest* pause ("…" pauses beat sentence boundaries) or crop a line to a slot —
  that cut "so completely… history made her its most" out of the payoff. Place units whole; cut captions at the pause
  nearest the character-proportional spot.
- **ASR the final mix, not just the voice.** American "wasn't Egyptian" flaps the t → "was an Egyptian" under music
  (fixed with a TTS-only spelling "wasn't…", `SAY` in lines.py); an unducked fire-crackle bed and a chop SFX on "cake"
  masked final consonants ("slice" → "sluts"). Ambience beds duck under the voice like music; no hits on key words;
  music ~-10.5 dB under the voice. Test with several window offsets — a window starting on a word's onset misreads.

## 2026-11-06 — Cave v2: "can't see the full picture on phone and iPad"
- Players fill the screen with a 9:16 video: phones trim ~100 px off each side, iPads ~240 px off top and bottom.
  Most shots had faces/bodies at the frame edges, so they got cut.
- **Rule:** keep every character fully inside the safe frame x 110–970, y 250–1670 (1080×1920). Only declared
  close-ups (`cu`) may run off the bottom. In 9:16 a bean-head character is nearly as wide as the frame at close
  range: "close-ups" must be medium shots (camera distance × tan(fov/2) ≥ ~1.1 m for one character, ≥ ~2.3 m for
  three standing together), groups stand close and staggered in depth, and single-subject shots show only that subject.
- **Tool:** `edits/three-men-cave/v2/check.mjs` projects each character's drawn pixels through the camera for every
  frame and lists safe-frame violations per shot — run it before every render (target: only entrances/exits).
- Animation: use the kit's `idle()` on every character, `camFromKeys` with ease-out starts, hops/squash on reactions,
  bob on walks; dress every set densely.

## 2026-11-06 — THE QUALITY BAR for every animation (user: "every animation should be like this… it's going absolutely viral")
Two references from @ricksclip: "The fastest gun in the west had one rule: never draw first" (60 s) and
"He poured cooking oil into the sea" (68 s). Bean-head 2D cards in painted 3D worlds (the cartoon-short look).
What they do that our "Three Men in the Cave" (and earlier explainers) did not:
- **Hook = a paradox in the first sentence** (a rule or action that seems wrong: "never draw first",
  "poured oil into the sea"), shown in the first 1–2 s. Not "Three men were travelling…".
- **Second person** ("Imagine you're standing in the street…", "So you grab for your gun…") puts the viewer in it.
- **Escalate the mystery, then ask it out loud** (~20 s: "How is that possible?") — a mid-video re-hook.
- **Explain with an everyday analogy** cutaway ("the last time your phone slid off a table", "ever blown on a bowl of soup?").
- **Payoff is a big visual**, not a moral line (the gunman face-down in the dirt; the wave crashing onto the pirates).
  No comment CTA at the end; the payoff is the ending.
- **A new shot every ~1.5–2.5 s** (≈30 shots per minute): close-ups on objects (bullet, holster, oil pot, phone),
  low angles, POV through a barrel/porthole, macro cutaways; holds no longer than ~4 s.
- **Bright, saturated daylight worlds** (deep blue sky, warm sand, turquoise sea); night/storm scenes still read
  vivid blue, never muddy brown. Dense set dressing (shopfronts with signs, crates, lanterns, cannonballs).
- **Expressive acting**: sweat drops, eyes popping, fire/speed trails on fast moves, characters falling, reacting.
- **Captions one word at a time**, white heavy font with dark outline, centred at ~60% height.
- **Mouths**: no flicker. Our talk() swapped the whole face (eyes too) every 4 frames → "jittery". Animate the mouth
  only, at a calm rate, and only while that character's line is playing.
- **Rule:** before any animated short, write the script on this pattern (paradox hook → you-are-there → escalation →
  "how is that possible?" → analogy → visual payoff), plan ≥25 shots per minute, light it bright, and check stills
  side by side with these references before the full render.

## 2026-10-15 — Player Edit template: "terrible, looks AI, no zooms/transitions/3D text"
- I built the template from a summary of 16 references instead of copying the
  strongest one's actual moves. Result: flat 2D cards, hard cuts, generic type.
- **Rule:** when a reference is given, rebuild ITS shot list and camera moves
  first (3D card corridor, extruded serif words, gilt frames, push-through,
  recursion), then customise. Every shot needs camera motion and every cut a
  designed transition; type must be dimensional (real extrusion, perspective).
- 3D in Remotion: own camera + per-item CSS perspective, painted far→near
  (GalleryEdit `Space`), extrusion = stacked layers along the word's normal.

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
