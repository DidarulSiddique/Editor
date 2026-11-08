#!/usr/bin/env python3
"""Narration v3: Kokoro v1.0 bm_fable with per-line pacing (lines.py); v2 was Lewis at a slower speed. Each sentence is generated on its own
(Kokoro works sentence by sentence anyway), so every caption chunk boundary is exact. Two sentences carry two
caption chunks; they are split at their longest internal pause. -> voice.wav (48 kHz) + segs.txt
usage: python3 build_voice.py [speed]"""
import os, sys, subprocess, wave, numpy as np, sherpa_onnx
speed = float(sys.argv[1]) if len(sys.argv) > 1 else 1.05
VOICE = sys.argv[2] if len(sys.argv) > 2 else "bm_fable"
from lines import LINES, JOIN, SPEED, PAUSE, SAY
# v3: Kokoro v1.0 (54 voices, better prosody); bm_fable = British male like Lewis but more expressive (v2's Lewis read flat)
M = os.path.expanduser("~/.cache/edit-kit/tts/kokoro-multi-lang-v1_0")
SIDS = {"bm_fable": 25, "bm_george": 26, "bm_lewis": 27, "am_fenrir": 14, "am_michael": 16, "am_puck": 18, "af_heart": 3}
SID, LEX = SIDS[VOICE], ("lexicon-gb-en.txt" if VOICE.startswith("b") else "lexicon-us-en.txt")
tts = sherpa_onnx.OfflineTts(sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(kokoro=sherpa_onnx.OfflineTtsKokoroModelConfig(
    model=f"{M}/model.onnx", voices=f"{M}/voices.bin", tokens=f"{M}/tokens.txt", data_dir=f"{M}/espeak-ng-data", dict_dir=f"{M}/dict",
    lexicon=f"{M}/{LEX}"), num_threads=4), max_num_sentences=1))

def say(text, k):
    a = tts.generate(text.replace("…", "..."), sid=SID, speed=speed * SPEED.get(k, 1.0)); return np.array(a.samples, np.float32), a.sample_rate
def db(x, sr, hop=0.01):
    fr = int(hop * sr); return np.array([20 * np.log10(np.sqrt(np.mean(x[i:i + fr] ** 2)) + 1e-9) for i in range(0, len(x) - fr, fr)])
def trim(x, sr, th=-45):
    d = db(x, sr); on = np.where(d > th)[0]; a = max(0, on[0] - 2); b = min(len(d), on[-1] + 3)
    return x[int(a * 0.01 * sr): int(b * 0.01 * sr)]
def wwrite(path, y, sr):
    w = wave.open(path, "wb"); w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes((np.clip(y, -1, 1) * 32767).astype("<i2").tobytes()); w.close()

units, k = [], 0
while k < len(LINES):
    if k in JOIN: units.append((k, LINES[k] + " " + LINES[k + 1])); k += 2
    else: units.append((k, SAY.get(k, LINES[k]))); k += 1
LEAD, GAP = 0.4, 0.24
out, t, segs, sr = [], LEAD, [], None
for k, text in units:
    x, sr = say(text, k); x = trim(x, sr)
    if not out: out.append(np.zeros(int(LEAD * sr), np.float32))
    if PAUSE.get(k): out.append(np.zeros(int(PAUSE[k] * sr), np.float32)); t += PAUSE[k]
    if k in JOIN:  # split at the longest pause in the middle 70%
        d = db(x, sr); n = len(d); lo, hi = int(n * 0.15), int(n * 0.85); quiet = d < -40; best, bi, i = 0, None, lo
        while i < hi:
            if quiet[i]:
                j = i
                while j < hi and quiet[j]: j += 1
                if j - i > best: best, bi = j - i, (i + j) // 2
                i = j
            else: i += 1
        print('join', k, 'longest pause', best * 10, 'ms')
        if bi is None or best < 8: bi, best = int(n * len(LINES[k]) / (len(LINES[k]) + len(LINES[k + 1]))), 0
        cut = bi * 0.01; segs.append((t, t + cut - best * 0.005)); segs.append((t + cut + best * 0.005, t + len(x) / sr))
    else: segs.append((t, t + len(x) / sr))
    out.append(x); t += len(x) / sr
    out.append(np.zeros(int(GAP * sr), np.float32)); t += GAP
y = np.concatenate(out)
wwrite("voice_slow_raw.wav", y, sr)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "voice_slow_raw.wav", "-ar", "48000", "voice.wav"], check=True)
assert len(segs) == len(LINES), len(segs)
open("segs.txt", "w").write("".join(f"{a:.2f} {b:.2f}\n" for a, b in segs))
old = [tuple(map(float, l.split())) for l in open("segs_v2.txt")]
print("voice.wav %.2f s (v2 %.2f), speech %.2f s (v2 %.2f)" % (len(y) / sr, old[-1][1], sum(b - a for a, b in segs), sum(b - a for a, b in old)))
print(" ".join("%.2f/%.2f" % (b - a, ob - oa) for (a, b), (oa, ob) in zip(segs, old)))
