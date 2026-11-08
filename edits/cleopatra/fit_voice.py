#!/usr/bin/env python3
"""Swap the narrator without re-rendering: generate each line in another Kokoro v1.0 voice and fit it into the
current voice's caption slots (segs.txt), so the animation, captions, SFX and mouths keep their timing.
Speed is solved per line (Kokoro length ~ 1/speed), the last few % are closed with rubberband (pitch kept).
v3.1: the user picked am_michael from the audition.  usage: python3 fit_voice.py [voice=am_michael] [--dry]
-> voice.wav (48 kHz); the previous voice is kept as voice_<old>.wav by hand."""
import sys, subprocess, numpy as np
sys.argv = [a for a in sys.argv if a != "--dry"] + (["--dry"] if "--dry" in sys.argv else []); DRY = "--dry" in sys.argv
VOICE = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith("--") else "am_michael"
sys.argv = [sys.argv[0], "1.0", VOICE]                     # build_voice's tts/say/trim/db helpers, without running it
src = open("build_voice.py").read().split("units, k = [], 0")[0]; exec(src)
segs = [tuple(map(float, l.split())) for l in open("segs.txt")]
BASE = 1.14                                                # v3 base speed (Fable); the solver moves each line from here

def gen(text, k, s):
    a = tts.generate(text.replace("…", "..."), sid=SID, speed=s); x = trim(np.array(a.samples, np.float32), a.sample_rate); return x, a.sample_rate
def solve(text, k, target):
    s = BASE * SPEED.get(k, 1.0); best = None
    for it in range(7):
        x, sr = gen(text, k, s); L = len(x) / sr
        if best is None or abs(L / target - 1) < abs(best[3] / target - 1): best = (x, sr, s, L)
        if abs(L / target - 1) < 0.02: break
        s *= (L / target) ** (1.3 if it > 2 else 1)       # overshoot a little when Kokoro's length moves in steps
    return best
def stretch(x, sr, target, cap=0.04):                      # rubberband by at most 4% (pitch kept), then pad with silence
    r = min(1 + cap, max(1 - cap, len(x) / sr / target))
    if abs(r - 1) < 0.002: y = x
    else:
        raw = subprocess.run(["ffmpeg", "-v", "error", "-f", "f32le", "-ar", str(sr), "-ac", "1", "-i", "-", "-af",
                              f"rubberband=tempo={r:.5f}:pitchq=quality", "-f", "f32le", "-"], input=x.tobytes(), capture_output=True, check=True).stdout
        y = np.frombuffer(raw, np.float32)
    return y                                                # never cropped: a longer line runs into the gap after it

units, k = [], 0
while k < len(LINES):
    if k in JOIN: units.append((k, LINES[k] + " " + LINES[k + 1])); k += 2
    else: units.append((k, SAY.get(k, LINES[k]))); k += 1
y, rep, caps = None, [], []
for k, text in units:
    a = segs[k][0]; b = segs[k + 1][1] if k in JOIN else segs[k][1]
    x, sr, s, L = solve(text, k, b - a)
    if y is None: y = np.zeros(int((segs[-1][1] + 1.5) * sr), np.float32)
    z = stretch(x, sr, b - a); i0 = int(round(a * sr)); y[i0:i0 + len(z)] += z   # whole unit, never cropped
    r = len(z) / len(x)                                                      # time scale of the placed speech
    end = a + len(x) * r / sr
    if k in JOIN:  # caption boundary: the pause nearest the character-proportional spot (not the longest: "…" pauses are longer)
        d = db(x, sr); q = d < -40; runs, i = [], 0
        while i < len(d):
            if q[i]:
                j = i
                while j < len(d) and q[j]: j += 1
                if j - i >= 4 and i > 0 and j < len(d): runs.append(((i + j) / 2, j - i))
                i = j
            else: i += 1
        exp = len(d) * len(LINES[k]) / (len(LINES[k]) + len(LINES[k + 1]))
        c, w = min(runs, key=lambda u: abs(u[0] - exp)) if runs else (exp, 0)
        tc = a + c * 0.01 * r; caps += [(a, tc - w * 0.005 * r), (tc + w * 0.005 * r, end)]
        rep.append((k, s, L, b - a, f"caption split at {tc - a:.2f}s (expected {exp * 0.01 * r:.2f}s, pause {w * 10} ms)"))
    else: caps.append((a, end)); rep.append((k, s, L, b - a, ""))
for k, s, L, T, note in rep:
    print(f"{k:2d} speed {s:.2f} ({s / BASE / SPEED.get(k, 1):.2f}x plan)  raw {L:.2f}s -> slot {T:.2f}s  stretch {L / T:.3f} {note}")
y = y[: int(round(len(y)))]
if not DRY:
    wwrite("voice_fit_raw.wav", y, sr)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "voice_fit_raw.wav", "-ar", "48000", "voice.wav"], check=True)
    open("segs_caps.txt", "w").write("".join(f"{a:.2f} {b:.2f}\n" for a, b in caps))   # caption timing (subs.py); segs.txt keeps driving the animation
    print("voice.wav", round(len(y) / sr, 2), "s,", VOICE, "| caption drift vs slots:", " ".join(f"{c[1] - g[1]:+.2f}" for c, g in zip(caps, segs)))
