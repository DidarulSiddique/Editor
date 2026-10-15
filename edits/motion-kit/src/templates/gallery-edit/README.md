# Gallery Edit template

This template is built on reference R03 ("Love Me"). The code is in `GalleryEdit.tsx`; everything a new edit changes is in `config.ts`.

It runs 41 s at 1920x1080 and 30 fps:

| Time | Section | What it does |
|---|---|---|
| 0–1.9 s | Corridor | The camera flies down a 3D corridor of photo cards. |
| 1.9–14.1 s | Hero cards ×4 | Cut-out hero cards with extruded 3D "LOVE"/"ME", one word behind the player and one in front. |
| 14.1–15.3 s | OH / BABY | The two words either side of a spinning gilt frame. |
| 15.3–18.7 s | Tile wall | The camera pulls back from a wall of tiles, which drains to black and white. |
| 18.7–24.0 s | Clip run | Clips enter with a flash, a whip and an iris. |
| 24.0–26.4 s | YEA | A giant "YEA" sits behind the player. |
| 26.4–28.4 s | Photo strip | A strip of photos breaks apart. |
| 28.4–32.5 s | Gilt frames | A gilt frame on a wall, then a wall of frames that rolls as the camera pulls back. |
| 32.5–38.3 s | Starfield | The camera pushes through a frame into a starfield, then pulls back to a giant "ME". |
| 38.3–41.0 s | End card | The handle types on. |

## First real build: Messi, 2026-10-15

Clips are from the 4 screen recordings, with the video area cropped out (`r-clip1`–`3`, plus stills `rg-01`–`11`). The 12 photos were upscaled 2x and cut out with `tools/edit-kit/prep-stills.sh` (`m*.png`, `m*-cut.png`).

Rebuild them with:
```
tools/edit-kit/prep-stills.sh edits/motion-kit/public <photos…>
```
