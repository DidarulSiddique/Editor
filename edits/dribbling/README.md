# The Art of Dribbling

61 s, 1920x1080, 60 fps football breakdown of six dribbling skills, built in
Remotion (`src/Dribbling.tsx`, composition `Dribbling`). Output:
`out/the-art-of-dribbling.mp4`.

## Reference breakdown (e1f66500…mp4, 1024x576, 30 fps, 64.3 s)

"The Beauty of Anime: Power Systems" by ace.amvs. The video was checked at
1 fps for its whole length and at 8 fps over the opening and a section card.
Cuts were found with a per-frame difference scan, and music sections with
`beats.py`: about 161 BPM, with a new section roughly every 7 s.

| Time | What happens | Technique |
|---|---|---|
| 0.0–3.3 | Title "THE BEAUTY OF / ANIME" | Glowing condensed type over blurred, darkened clips that change every ~0.4 s. Light streaks and bokeh. Keywords under the title swap on the beat (FIGHTS, EMOTION, SILENCE, STORY…) and resolve to "POWER SYSTEMS". Blur-out to black. |
| 3.3–59 | Eight concept sections, ~7 s each (Quirks, The Zone, Bankai, Devil Fruits, Pyrokinesis, Chakra, Anima, Domain Expansion) | Each opens on a title card: diagonal ribbons in the section's colour with the name repeated along them, a title plate top-left (big name, show name, small tagline), and pop-in plus signs, rings and zig-zags. Then 4–5 fast shots, white-flash and whip cuts, impact frames, and one strong colour per section. |
| 56.5–58.9 | Finale | Faces in slanted panels side by side. |
| 59.0–60.5 | End card | Blurry black "ACE / AMVS" on white. |

Principles carried over:
- One colour per concept.
- A named title card for every section.
- Diagonal kinetic ribbons.
- White-flash whip cuts on the music's section changes.
- A slanted-panel finale.
- A minimal white signature card.

## Clip map (all supplied clips; screen recordings cropped to the video area)

The clips were not labelled, so each was matched to a skill by watching the action. The first version had stepovers and elasticos swapped; corrected after review.

| Skill | Clip used | What it shows |
|---|---|---|
| 01 Stepovers | `f9d5e664` 2.35–4.45 s (st1) | Ronaldinho v Atlético |
| | `f9d5e664` 0.0–2.3 s (st2) | PSG no.10 v a red no.19 |
| 02 Body feints | `8dea0cf5` 5.5–10.7 s (bf1) | Neymar (Santos) v Joinville: shoulder feint, then the ball goes past the defender's right |
| | `c11d7f08` 1.2–3.6 s (bf3) | Ronaldo (Barcelona) v Compostela, slow motion (also used in the outro) |
| 03 La Croqueta | `7b935886` 1.05–3.25 s (cq1) | Iniesta (no.8), Champions League, ball moved from one foot to the other |
| 04 Elastico | `2f3623bc` 0.0–2.3 s (el1) | Man Utd no.10 (Rashford) v Brighton by the corner flag |
| | `6c93860e` (el2) | Juventus no.11 (Douglas Costa) v Ajax by the touchline |
| 05 Fake shot | `86906b76` 3.0–5.8 s (fs1) | Rashford v Brighton: shapes to shoot, the defender slides, he goes on and scores |
| | `8b00eead` (fs2) | Man City no.26 (Mahrez) v Burnley |
| 06 Roulette | `661653b8` 6.4–9.0 s (ro1) | PSG no.4 v Benfica: sole drag and turn between two players |
| | `7d8ae258` 1.0–4.9 s (ro2) | Spurs no.12 v Chelsea, turning away under pressure |
| Open / finale | `01cc1eed` (mx1), `677c16d7` 10.2 s (mx2) | Messi v Chelsea; Mahrez (Leicester) v Arsenal |

Not used:
- `b7735e7d`: the same Rashford fake shot as `86906b76`.
- `199e2b9d`: the La Croqueta page recording, where the video is small next to YouTube's interface.
- The rest of each recording: lock-screen, Control Centre, wide shots and CapCut end cards.

## Edit

| Time | Section | Breakdown |
|---|---|---|
| 0.00 | Open | "THE ART OF DRIBBLING" over clips that change every 0.41 s. Keywords swap on the beat (CONTROL, BALANCE, TIMING, DECEPTION, NERVE), then "SIX SKILLS · ONE BALL". Whip-blur out. |
| 3.27 | 01 Stepovers | Card over the PSG no.10, then Ronaldinho freezes at the stepover: ring and orbit arrow on the ball, brackets on the defender. Second example with "BAIT". |
| 10.30 | 02 Body feints | Freeze before the move: dashed "SHOW" arrow from the shoulders, solid "GO" path of the ball round the defender. Ronaldo slow-mo with "SELL IT". |
| 17.30 | 03 La Croqueta | Freeze at the first touch: ball ring, path from foot 1 to foot 2, "INSIDE → INSIDE". Tight replay with "GLIDE". |
| 24.27 | 04 Elastico | Rashford freezes on the touch: "1 · OUT" and "2 · BACK" two-phase path. Douglas Costa with "SNAP". |
| 31.20 | 05 Fake shot | Freeze on the backswing with a dashed "THE SHOT HE SHOWS" line. A near-freeze on the defender sliding ("DEFENDER COMMITS"), then the finish. Mahrez with "NO SHOT". |
| 38.13 | 06 Roulette | Freeze: ring on the ball and a spin arc round the player. Second turn with "SPIN". |
| 45.13 | Recap | Six slanted panels, one per skill, then "SIX WAYS PAST A DEFENDER". |
| 52.13 | Outro | Messi, Mahrez, then "THE ART OF DRIBBLING" over the Ronaldo slow-mo. |
| 58.95 | End card | White card with "BRIGHTONBOYEDITS" in blurred black type. |

Design system:
- **Type:** Anton for titles and words; Inter 900/700/500 for tracked labels.
- **Section colours:** lime, violet, cyan, amber, pink and orange.
- **Transitions:** cuts on section changes get a white flash, a whip blur (horizontal SVG blur) and an RGB split. Strong beats get a small punch and shake.
- **Footage:** light 3x3 sharpen, then contrast and saturation. Blur is used only on whips and the title background.
- **Annotations:** placed on the frozen frame by measuring a gridded 960x540 still. They sit inside the footage's zoom transform, so they stay pinned to the image.

## Technical
- 1920x1080, 60 fps, 3660 frames, 61.0 s.
- H.264 High, yuv420p (limited range, BT.709), CRF 14 / preset slow.
- AAC 48 kHz, 320 kb/s, -13.8 LUFS integrated, -2.9 dBTP true peak.
- Verified: 3660 frames, no black frames (`blackdetect`), full 2 fps contact sheet reviewed.
- `out/the-art-of-dribbling-share.mp4`: 28 MB copy (CRF 25, ~3.6 Mb/s) for sending.
- Music: the reference's soundtrack with its voice-over removed (`tools/edit-kit/instrumental.py`, UVR MDX-Net Inst HQ 3 on onnxruntime), faded from 60.3 s. Use your own licensed track or the official sound when posting.

Reproduce:
```bash
npm install
./prepare.sh /path/to/uploads
npx remotion render src/index.ts Dribbling out/raw.mp4 \
  --browser-executable=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell \
  --concurrency=4 --timeout=240000 --crf=12
ffmpeg -i out/raw.mp4 -vf "scale=in_range=full:out_range=tv,format=yuv420p" -c:v libx264 -crf 14 -preset slow \
  -color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
  -af "volume=-3dB,aresample=192000,alimiter=limit=0.84:attack=3:release=60:level=disabled,aresample=48000" \
  -c:a aac -b:a 320k -movflags +faststart out/the-art-of-dribbling.mp4
```

## Voiceover (v3)

- Script by the channel. Voiced with vidIQ's stock "Adam – Dominant, Firm" AI voice: one 600-character take, 14 credits, 42.4 s.
- The take is saved as `public/vo-full.mp3`. It is not in git; regenerate it with vidIQ if it's lost.
- `vo/build.py`:
  - Splits the take at its own pauses and tightens each gap to 0.18 s.
  - Speeds lines up 5–10% where they need to fit their section, and starts each line just as its section opens.
  - Writes `public/vo.wav`, the subtitle timings in `src/captions.json`, and `public/mix.wav`, with the music sidechain-ducked about 8 dB under the voice.
- Subtitles: one phrase at a time, bottom centre, with the section's colour bar.
