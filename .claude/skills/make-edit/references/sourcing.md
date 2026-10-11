# Sourcing footage and music

## Decision order
1. **User's own clips/photos.** Best for real players. Upload via chat;
   files land in `/root/.claude/uploads/<session>/`.
2. **Stock** (Pexels Videos, Mixkit, Freesound for SFX). Needs these hosts
   allowed in the environment network settings, and only applies from a
   new session: `videos.pexels.com`, `images.pexels.com`, `mixkit.co`,
   `assets.mixkit.co`, `freesound.org`, `cdn.freesound.org`. Check with
   `curl -s -o /dev/null -w '%{http_code}' https://mixkit.co`.
   `vidiq_generate_broll` (1 credit) finds Pexels clips even when the
   downloads themselves are blocked. Credit photographers when required.
3. **AI-generated video** via vidIQ `vidiq_generate_video`:
   - Models: `veo-3.1` / `veo-3.1-fast` (best look, 4/6/8 s, audio),
     `kling-3` / `kling-3-pro`, `seedance-2` (1–15 s), `minimax-h3`
     (4–15 s, video input), `gemini-omni-flash` (3–10 s, audio).
   - Cost = seconds x model rate x 20 credits; the exact quote comes back
     on submit. Tell the user the total before starting several shots.
   - Image-to-video: `startFrameB64` from a photo animates real stills.
   - Prompt like a cinematographer: subject, action, camera move, lens,
     light, weather, mood, grade. One action per shot.
   - Never re-run a delivered shot without the user asking; poll
     `vidiq_job_poll` until done.
   - Do not generate real, identifiable people (players) from text; use
     the user's photos as start frames, or keep generated figures
     anonymous (backs, silhouettes, boots).
4. **Procedural** (code-drawn) only for graphics, UI, particles, light
   effects. Not for main visuals (LESSONS.md: procedural pitch scored 2/10).

## Music
- Best: a real track. On TikTok/Reels the user can add the licensed sound
  in-app; we time the cut to its BPM (`beats.py` on any copy of it).
- `vidiq_generate_music` (25 credits): describe genre + mood +
  instrumentation + tempo; add "instrumental". Royalty-free WAV.
- Our own synthesis (`edits/floodlights/music/compose.py`) is for SFX:
  floodlight clunks, impacts, whooshes, risers. Not for the main track.
- Borrowed copyrighted songs: local tests only, never committed.

## Stills prep
`tools/edit-kit/prep-stills.sh out_dir photo1.jpg photo2.jpg ...` upscales
each photo 2x (ESRGAN) and writes a transparent cut-out next to it
(`<name>-cut.png`, same size, so layers align). First run installs its npm
dependencies into `~/.cache/edit-kit` (about a minute).

## Voice
`vidiq_voiceover_generate` (14 credits / 1000 chars) for narrated formats.
