---
name: cartoon-short
description: Turn a voiceover into a finished vertical (1080x1920) cartoon short - 2D bean-head character cards in an inked, painted 3D world (three.js in headless Chromium, no Remotion or GPU), with a synthesized music bed and SFX. Use for "make a cartoon short", "animated story short", "explainer cartoon", history/story narrations with characters, or when the user asks for the cartoon-short kit.
---

# cartoon-short

Kit supplied by the user (from `cartoon-short-kit.zip`). Pipeline: **voice in → shot plan → frames → mix → mp4**.
Built on github.com/mromidev/claude-animated-shorts (MIT): toon.ts, look values and readability rules.

Before starting, also read `edits/LESSONS.md` (the user's ratings and rules) and follow the GATE steps
of `/make-edit` (storyboard and credit spend need the user's OK).

## Files
- `engine/` — renderer: `main.js` (world helpers, cards, ink pass, lens blur, grade), `paint.js` (painted
  textures), `roman.js` (cast drawing on top of the Pen library), `motion.js` (motion helpers), `index.html`.
- `example/soldier/` — worked example "The Soldier Who Never Left": `story.js` (shot plan: SHOTS, lights,
  camera keys, actors, fx — all in frames at 30 fps) and `audio.py` (music bed + SFX cue table under voice.mp3).
  `stills.jpg` shows what it looks like.
- `tools/` — `setup.sh` (new project), `timing.py` (word/phrase timings), `render.mjs` (frames via
  Playwright), `sheet.py` (contact sheets), `finish.sh` (encode + loudness + black/freeze QA).

## Steps
1. **New project:** `bash .claude/skills/cartoon-short/tools/setup.sh <project_dir>` (put projects under
   `edits/<name>/`). It copies the engine and the soldier example as a starting point, and **downloads**
   three.js r160 (npm, else GitHub) and `toon.ts` from github.com/mromidev/claude-animated-shorts into
   `vendor/` (gitignored). Needs node ≥ 22.6, python3 + numpy, ffmpeg, git, Playwright Chromium.
   In this cloud environment Chromium is at `/opt/pw-browsers` (never run `playwright install`).
2. **Voice:** put the voiceover at `<project>/voice.mp3` and the script at `script.txt`, then
   `python3 timing.py voice.mp3 script.txt --out work` → `work/phrases.json`, `work/words.json`.
   Check the phrases against the waveform and hand-fix any that land in the wrong gap.
3. **Shot plan:** rewrite `web/story.js` for the new story (one shot per phrase or beat, frame ranges from
   the phrase times; cameras always creep on holds). Cast changes go in `web/roman.js`, then
   `cat web/toonbase.js web/roman.js > web/toon.js`.
4. **Stills first:** `node render.mjs stills 0,90,180,... 1` then `python3 sheet.py stills sheet.jpg` and
   review before the full render.
5. **Frames:** `node render.mjs frames 0-<TOTAL-1>` (add `RESUME=1` to continue an interrupted render).
6. **Audio:** rewrite the cue table in `audio.py` for the new shots → `mix_raw.wav` (synthesized bed + SFX
   under the voice). Note LESSONS.md: synthesized *music* was rated cheap before — prefer a real or
   generated track when the user has one; keep synthesis for SFX.
7. **Finish:** `bash finish.sh "Title"` → `out/<Title>.mp4` (loudnorm -14 LUFS, CRF 17), QA output and
   `out/qa_sheet.jpg`. Review the sheet, then deliver.
