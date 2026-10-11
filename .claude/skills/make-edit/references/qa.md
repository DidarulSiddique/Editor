# Self-review checklist

Run before every render you send. Fix failures first.

## Look at it
- [ ] `tools/edit-kit/sheet.sh out.mp4 sheet.png 2` and read every frame.
- [ ] 10 fps sheets around each transition and the drop.
- [ ] Full-size stills of the hook frame, the turn, and the payoff.

## Story
- [ ] With sound off, can you tell what the edit is about by 3 s?
- [ ] Every text card has a matching image (not the same background).
- [ ] A person or human trace in most shots.
- [ ] The payoff is an image, in the final third.
- [ ] The last frame flows back into the first (loop) or asks for action.

## Text
- [ ] Inside safe zone: y 220–1540, x 70–940 on 1080x1920.
- [ ] Never fully hidden by the cut-out subject (use outline-in-front).
- [ ] No two phrases overlapping mid-transition.
- [ ] Readable on a phone: at least ~70 px, strong shadow or backing.

## Timing
- [ ] Cuts land on `beats.py` strong hits; the turn on the drop.
- [ ] Visual change every 2–4 s; emotional holds 1–2 s longer.
- [ ] Total 15–25 s unless the format needs longer.

## Audio
- [ ] `tools/edit-kit/audiocheck.py out.mp4`: about -14 LUFS, true peak
      below -1 dBTP (limit at 4x sample rate: `aresample=176400,alimiter=limit=0.84,aresample=44100`), payoff section 2–4 dB above
      the intro.
- [ ] SFX on hits (whoosh into cuts, impact on the drop) not louder than
      the music.

## Honesty
- [ ] Tell the user what is still weak before they find it.
- [ ] Ask for a score; log it in `edits/LESSONS.md`.
