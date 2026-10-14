# Player Edit template

This is a vertical 1080x1920, 60 fps football player edit of about 28 s for TikTok, Shorts and Reels. Every section uses a technique taken from the 16 benchmark references (`references/analysis/R01–R16.md`).

- Code: `PlayerEdit.tsx`
- Everything you change: `config.ts` (slots, text, music)
- Composition: `PlayerEdit` in the `edits/motion-kit` project

## Sections (times shown for the stand-in song; they re-time from `MUSIC.drop` and `MUSIC.beat`)

| Time | Section | Technique (reference) | Slot |
|---|---|---|---|
| 0.0–2.6 | **Hook** | The name assembles letter by letter in a glowing serif, with a gold hairline dropping into a picture-in-picture card. The card zooms through to the next section (R13 cold open, R03 glow). | CLIP 01 |
| 2.6–6.0 | **Name card** | A giant surname sits *behind* the cut-out player, with an outline copy in front. The jersey number "boils" through colours, and a gold serif word slams in from 300% (R15, R01, R04). | PHOTO 01 |
| 6.0–9.4 | **Quiet quote** | Letterboxed slow motion with a word-by-word serif caption, key words in gold italic (R07, R03). | CLIP 02 |
| 9.4–10.2 | **Pre-drop** | The colour drains, a red bar wipes down, then a white flash lands on the drop (R04). | (CLIP 02) |
| 10.2–19.1 | **Montage** | Six cuts, each 4 beats long, each zoom-popping in (R04). Each cut gets its own treatment, listed below the table. | CLIPS 03–08 |
| 19.1–22.1 | **Stat** | A number ticks up between gold hairlines over a darkened clip (R13). | CLIP 09 |
| 22.1–25.8 | **Photo wall** | A 2x3 wall of frames fills one per beat, the camera pulls back, then the gold surname appears (R16, R03). | PHOTOS 02–07 |
| 25.8–28.2 | **End** | Hold on black, then a tracked-out signature and handle (R04, R12). | — |

Montage treatments:
1. A giant translucent vertical word (R06).
2. A freeze-frame with a ring and arrow annotation.
3. A word that flips colour on every beat (R05).
4. A hue-cycle and invert flash with a neon frame (R12, R13).
5. A circle iris punch-in (R14).
6. A stack of repeated words sliding in opposite directions (R07).

## Swapping in real material
1. Put the clips, photos and song in `edits/motion-kit/public/`.
2. In `config.ts`, set each slot's `file` and `start` (the source second to begin at).
3. Set each slot's `focus` to where the player is in the 16:9 frame (x, y from 0 to 1), which drives the vertical crop.
4. Set `MUSIC.drop` and `MUSIC.beat` (`tools/edit-kit/beats.py` gives both), and fill in `TEXT`.
5. Re-measure the CLIP 04 freeze annotation on the real clip (ring at the ball, arrow along the real path), using a gridded still, never by guessing.
6. Set `PREVIEW = false`, render, then run the quality gate.
