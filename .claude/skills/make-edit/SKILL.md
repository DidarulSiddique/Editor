---
name: make-edit
description: Make a short-form video edit (TikTok/Reels/Shorts) end to end with a story, not just effects - research what is working, write the story beats, storyboard for approval, source or generate footage and music, assemble beat-synced motion graphics in Remotion, self-review against retention rules, render. Use for "make an edit", "make a viral video", "remake this edit", "football edit", "tribute edit", or any request to produce a finished short video.
---

# make-edit

A story-first pipeline for short-form edits. It exists because effects alone
scored badly: the first original edit (procedural visuals, synthesised music,
text-only story) was rated 2/10, and the reference remake 6/10. The fix is
story structure, real footage and real music, and a review loop.

**Before anything else, read `edits/LESSONS.md`.** It holds the user's ratings
and the rules learned from them. Every rule there overrides a default here.

Tools live in `tools/edit-kit/` (beats, loudness, contact sheets,
transcription). Projects live in `edits/<name>/` as Remotion projects; copy
the structure of `edits/cr7-edit` (footage + cutouts + layered scenes) or
`edits/floodlights` (procedural + synthesised audio).

## The pipeline

Work through these in order. Steps marked **GATE** stop for the user's OK.

### 1. Brief
Pin down in one line each: subject, audience, emotion the viewer should
leave with, platform (default TikTok 9:16, 1080x1920), length (default
15–25 s). If the user gave a reference video, analyse it first (step 1b).

**1b. Reference analysis.** `tools/edit-kit/sheet.sh ref.mp4 sheet.png 2`
for the whole thing, then 10 fps sheets around every transition. Run
`beats.py` on its audio and `transcribe.sh` for lyrics. Write down: shot
list with timings, what each transition does frame by frame, text style and
placement, colour per scene, where text sits behind the subject. The remake
should copy structure and timing, not just "vibe".

### 2. Research what is working
Use vidIQ (`vidiq_instagram_tiktok_outlier_search`, `vidiq_outliers`; ~5
credits per call; check `vidiq_balance` first, it is free). Pull 5–10
outliers, then name the pattern in one sentence: hook (first 3 s), format,
pacing, text style, audio type, loop/CTA. Do not copy a single video; copy
the pattern several outliers share.

### 3. Story beats (see `references/story.md`)
Write the edit as beats before any visuals:
- **Hook (0–3 s):** a promise or tension, shown, not only written.
- **Build:** each beat escalates; one idea per beat; a visual change every
  2–4 s, but hold emotional shots longer.
- **Turn:** the moment the meaning flips (usually on the music drop).
- **Payoff:** in the final third, an *image* that pays off the hook.
- **Loop/CTA:** end on a frame that flows back into the start, or a
  comment/tag prompt that gives a reason to engage.

Every line of on-screen text must be paired with an image that shows it.
Text-only beats are a known failure (LESSONS.md).

### 4. Storyboard — **GATE**
Write `edits/<name>/storyboard.md`: one row per shot with time range, beat,
what we see (camera, subject, light), on-screen text, transition in/out,
music moment, and source (user clip / stock / generated / procedural).
For generated shots include the exact prompt. Show the user the storyboard
and the credit estimate. **Do not spend credits until the user approves.**

### 5. Source material (see `references/sourcing.md`)
Priority: the user's own clips → stock (Pexels/Mixkit, if the network
allows) → AI-generated video (vidIQ `vidiq_generate_video`) → procedural.
Real people, real light and real texture beat anything procedural. For
music: a real track (the user's choice, licensed stock, or
`vidiq_generate_music`) beats synthesis; synthesis is for SFX and stems.
Quote total credits before generating; generate one test shot first and
review it before batching the rest.

Prepare stills: upscale small photos (`ESRGAN`, see sourcing.md), cut out
subjects (`@imgly/background-removal-node`) so text and effects can sit
behind them.

### 6. Assemble
- Run `beats.py` on the final music; put cuts on strong hits and the turn
  on the drop. Offset the track (`trimBefore`) if its intro is weak.
- Lyrics: `transcribe.sh` → sync on-screen words to sung words.
- Layering: background → behind-text/effects → cut-out subject → front
  text/particles → grade → flash → grain.
- Respect TikTok safe zones: keep text within y 220–1540, x 70–940.
- Reuse the building blocks in `edits/cr7-edit/src/CR7Edit.tsx`
  (`Layered`, `Particles`, `Grain`, `Vignette`) and `Villain.tsx`
  (`Slam`, `Counter`, `SpeedLines`, `Rings`, hit-driven shake/punch/flash).

### 7. Self-review (see `references/qa.md`)
Render stills and a full contact sheet; review against the QA checklist:
story readable with sound off, hook lands in 3 s, every beat has an image,
text legible and inside safe zones, no frame where text is hidden by the
subject, transitions on beats, `audiocheck.py` within targets. Fix, then
render. Never send a render you have not looked at.

### 8. Deliver and log
Send the video, state plainly what is still weak, and ask for a score out
of 10. Append the score and the lessons to `edits/LESSONS.md` (what worked,
what did not, the rule that follows). Commit the project (not footage or
copyrighted music).

## Rendering notes
- Browser: `--browser-executable=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell`
- 4 CPUs: pass `--concurrency=4`; long renders go in the background with a
  long timeout.
- Software 3D: Chrome sorts 3D planes by centre depth without splitting.
  Put each 3D object in its own camera layer, painted far → near.
- Avoid CSS `filter` / `blur` on very large layers; it is the main render
  cost. Bake colours instead.
