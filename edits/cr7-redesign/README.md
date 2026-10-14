# The Greats on CR7 — redesign

A redesign of the manual TikTok edit (`b9e61265-export_1791959485159.mov`, 576x1024, 30 fps, 47.7 s). It's built in Remotion (`src/Redesign.tsx`, composition `Redesign`). Output: `out/cr7-redesign.mp4`.

## What the original was

| Time | Content |
|---|---|
| 0.07 | Ronaldo knee-slide celebration (Real Madrid), "Love me" text |
| 2.67 | Ian Wright, ITV Sport: "…it's not just ability. It is hard work…" |
| 12.87 | Bicycle kick |
| 15.13 | Rio Ferdinand: "…who had a massive impact… you can't look no further than Cristiano" |
| 21.37 | Celebration, purple kit |
| 24.13 | Pelé: "I think today, no doubt, the best player, the best scorer, the best forward, is Cristiano Ronaldo" (burned-in subtitles) |
| 33.20–44.5 | Highlights: celebration, orange kit, v Atlético, v Athletic Bilbao, Man Utd. Beat drop at 36.2 s, hits at 39.15 and 42.14 |
| 44.5 | TikTok outro |

Why it felt flat:
- The 16:9 footage sat in a small strip with 60% of the vertical frame black.
- The only typography was a repeated handwritten "Love me". The speakers had no names and their words weren't on screen, except Pelé's plain subtitles.
- Every cut was hard, with no movement or depth, and the colour was ungraded.
- The beat drop got no visual response, and the ending was the platform outro.

## Redesign

- **Layout:** one continuous glass card carries all the footage. On every cut it morphs to the next layout:
  - landscape cards for interviews;
  - wider, tilted cards for highlights;
  - a portrait card for the "SIUU" celebration;
  - a collapse into the end card.

  Between cuts it slowly pushes in. Moves leave a short trail of outlines in the section colour.
- **Depth:** a pre-blurred vertical copy of the footage, colour aura blobs in red, gold and violet, and a dot grid sit behind the card. Huge outlined words ("ICON", "SEVEN", "SIUU", "CR7") sit between the background and the card.
- **Interviews:**
  - A glass chip at the top reads "THE GREATS ON CR7 · 0n / 03".
  - A glass name plate (IAN WRIGHT · ARSENAL LEGEND, RIO FERDINAND · FORMER UNITED TEAMMATE, PELÉ · THREE-TIME WORLD CUP WINNER) types itself on.
  - The quote is set word by word in time with the speech: Inter 900 capitals, with key words in Instrument Serif italic in the section colour.
- **Pelé:** his superlatives build as a ladder of glass rows, then "CRISTIANO RONALDO" lands in a gradient. The card crop removes the old burned-in subtitles.
- **The drop:** each hit recalls one quote, "HARD WORK." (Wright), "MASSIVE IMPACT." (Ferdinand) and "THE BEST." (Pelé), with a punch, shake and flash.
- **Ending:** a glass end card with a gradient "CR7" and BRIGHTONBOYEDITS replaces the TikTok outro.
- **Colour and finish:** light 3x3 sharpen, then contrast and saturation lift on the footage, and fine grain over everything.

Quote wording comes from the interview audio, transcribed offline with Whisper small.en via sherpa-onnx (`tools/edit-kit/asr.py`) on the voice stem separated by `tools/edit-kit/instrumental.py`. Pelé's lines match his subtitles. Word timings are estimated within each spoken phrase.

## Technical
- 1080x1920, 60 fps, 46.6 s. H.264 High, yuv420p (BT.709), CRF 15.
- Audio: the original soundtrack (music and interviews), +15 dB with a true-peak limiter (the export was at -29.8 LUFS), faded where the TikTok outro began.

## Limitations
- **Footage quality:** the only footage is the old 576x1024 export, whose picture is 576x324. It's scaled 2x with Lanczos and a light sharpen, which looks cleaner but can't add detail. Original clips would make a big difference.
- **Baked-in text:** the handwritten "Love me" lyric is part of the highlight footage and can't be removed.
- **Third-party watermark:** the opening clip carries a TikTok watermark (@fahspam1), so that footage came from another creator. Credit them when you post.

Reproduce: `npm install && ./prepare.sh <uploads>`, then render `Redesign` as in the dribbling README.
