#!/usr/bin/env python3
"""Lay the vidIQ voiceover (one take, public/vo-full.mp3) onto the edit.

Each section's line is cut into phrases at the take's own pauses, the
pauses are tightened to 0.18 s, the line is sped up slightly where it has
to fit its section, and placed just after the section starts. Writes
public/vo.wav (61 s), src/captions.json (phrase timings for subtitles) and
public/mix.wav (music ducked under the voice).
"""
import json, os, subprocess
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
PUB = os.path.join(HERE, "..", "public")
SR, END, GAP = 48000, 61.0, 0.18
S = [3.27, 10.3, 17.3, 24.27, 31.2, 38.13]

# (place at, tempo, colour, [(start, end, text) in the take])
LINES = [
    (0.32, 1.0, "#ffffff", [(0.0, 1.06, "The Art of Dribbling")]),
    (S[0] + 0.12, 1.05, "#c6ff3d", [(1.53, 2.40, "Stepovers."), (2.84, 4.92, "One of the most used skills in football."), (5.37, 7.93, "But just because it's simple, doesn't mean it's not good.")]),
    (S[1] + 0.12, 1.05, "#a46bff", [(8.48, 9.45, "Body feints."), (9.82, 10.84, "Messi's favourite."), (11.29, 12.43, "If the GOAT does it,"), (12.75, 14.01, "who are you not to try it?")]),
    (S[2] + 0.12, 1.05, "#2fe6ff", [(14.62, 15.57, "La Croqueta."), (16.04, 18.25, "So simple, but so effective."), (18.67, 20.47, "The king of tight spaces."), (20.94, 22.12, "Two touches of gold.")]),
    (S[3] + 0.12, 1.1, "#ffb21f", [(22.76, 23.75, "The Elastico."), (24.15, 26.60, "One of the flashiest one-v-one skills."), (27.08, 28.11, "Two things could happen."), (28.46, 29.80, "You embarrass the defender..."), (30.14, 31.56, "...or you get substituted.")]),
    (S[4] + 0.6, 1.05, "#ff3d8e", [(32.17, 32.99, "The fake shot."), (33.45, 35.45, "The simplest skill move on the list."), (35.90, 37.48, "Just send them to the shops.")]),
    (S[5] + 0.12, 1.05, "#ff6a2b", [(38.13, 38.76, "The roulette."), (39.27, 40.55, "A little difficult."), (40.55, 42.37, "But when it's done right, no one can stop you.")]),
]


def decode(path, af=None):
    cmd = ["ffmpeg", "-v", "error", "-i", path] + (["-af", af] if af else []) + ["-ac", "1", "-ar", str(SR), "-f", "f32le", "-"]
    return np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, np.float32)


def tempo(x, f):
    if abs(f - 1) < 1e-3:
        return x
    r = subprocess.run(["ffmpeg", "-v", "error", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-af", f"atempo={f}", "-f", "f32le", "-"], input=x.astype(np.float32).tobytes(), capture_output=True, check=True)
    return np.frombuffer(r.stdout, np.float32)


take = decode(os.path.join(PUB, "vo-full.mp3"), "highpass=f=70,acompressor=threshold=-20dB:ratio=3:attack=5:release=80,loudnorm=I=-16:TP=-2:LRA=7")
out = np.zeros(int(END * SR), np.float32)
caps = []
for at, f, col, phrases in LINES:
    t = at
    for a, b, text in phrases:
        seg = take[int(a * SR) : int(b * SR)].copy()
        fade = int(0.012 * SR)
        seg[:fade] *= np.linspace(0, 1, fade)
        seg[-fade:] *= np.linspace(1, 0, fade)
        seg = tempo(seg, f)
        i = int(t * SR)
        out[i : i + len(seg)] += seg[: len(out) - i]
        caps.append({"t0": round(t, 3), "t1": round(t + len(seg) / SR, 3), "text": text, "color": col})
        t += len(seg) / SR + GAP / f
    print(f"line at {at:6.2f} -> ends {t - GAP / f:6.2f}")

raw = os.path.join(PUB, "vo.f32")
out.tofile(raw)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", raw, "-ac", "2", "-c:a", "pcm_s24le", os.path.join(PUB, "vo.wav")], check=True)
os.remove(raw)
json.dump(caps, open(os.path.join(HERE, "..", "src", "captions.json"), "w"), indent=1)
# Music ducked ~8 dB under the voice, voice on top.
subprocess.run([
    "ffmpeg", "-v", "error", "-y", "-i", os.path.join(PUB, "music.wav"), "-i", os.path.join(PUB, "vo.wav"), "-filter_complex",
    "[0:a]volume=-3dB[m];[1:a]asplit[sc][v];[m][sc]sidechaincompress=threshold=0.02:ratio=5:attack=15:release=350:makeup=1[d];[d][v]amix=inputs=2:normalize=0:duration=first[o]",
    "-map", "[o]", "-ar", "48000", "-c:a", "pcm_s24le", os.path.join(PUB, "mix.wav")], check=True)
print("vo.wav, mix.wav, captions.json written")
