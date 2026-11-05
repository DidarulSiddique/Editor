#!/usr/bin/env python3
"""Mix for RonaldoPortugal.tsx: voiceover + crowd bed + 8-bit SFX (blips on labels,
roars on goals/trophies, a whistle on era cards). usage: build-audio.py vo.wav out.wav"""
import subprocess, sys
import numpy as np
SR = 48000; END = 91.6; N = int(END * SR)
rng = np.random.default_rng(11)
def load(p):
    b = subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(b, np.float32).reshape(-1, 2).astype(np.float64)
def lp(x, a):
    y = np.empty_like(x); acc = 0.0
    for i, v in enumerate(x): acc += a * (v - acc); y[i] = acc
    return y
def env(n, a, d):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) / d)
out = np.zeros((N, 2))
def add(t, s, g=1.0):
    i = int(t * SR); s = s if s.ndim == 2 else np.stack([s, s], 1); j = min(N, i + len(s)); out[i:j] += s[: j - i] * g
def square(f, d, v=0.2):
    n = int(d * SR); t = np.arange(n) / SR
    return np.sign(np.sin(2 * np.pi * f * t)) * env(n, 0.002, d / 3) * v
def blip(): return np.concatenate([square(880, 0.05), square(1320, 0.07)])
def roar(d=2.2):
    n = int(d * SR); x = lp(rng.standard_normal(n), 0.05)
    return x / np.abs(x).max() * env(n, 0.25, d / 2.2) * 0.9
def whistle():
    n = int(0.45 * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * (2900 + 60 * np.sin(2 * np.pi * 38 * t)) * t) * env(n, 0.01, 0.25) * 0.25
# crowd bed
bed = lp(rng.standard_normal(N), 0.03); bed /= np.abs(bed).max()
t = np.arange(N) / SR
fade = np.minimum(1, t / 1.0) * np.minimum(1, (END - t) / 1.5)
out += np.stack([bed, np.roll(bed, 900)], 1) * (0.08 * fade)[:, None]
# era cards: whistle; label blips at scene starts; roars on goals/trophies
for a in [10.25, 26.9, 36.9, 61.9]: add(a, whistle(), 0.8)
for a in [0.0, 5.5, 9.0, 16.55, 20.2, 33.15, 40.05, 44.4, 49.7, 65.05, 68.8, 72.95, 75.95, 80.5, 81.8, 85.6, 88.0]: add(a + 0.05, blip(), 0.6)
for a in [0.2, 33.15 + 0.85, 33.15 + 1.55, 33.15 + 2.45, 44.4 + 2.6, 49.7 + 8.4, 49.7 + 9.9, 65.05 + 2.5, 68.8 + 2.6, 72.95 + 1.7, 75.95 + 1.0, 75.95 + 3.3]: add(a, roar(), 0.7)
vo = load(sys.argv[1]); add(0.0, vo * 10 ** (4 / 20), 1.0)
pcm = (np.clip(out, -1, 1) * 32767).astype("<i2").tobytes()
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "s16le", "-ar", str(SR), "-ac", "2", "-i", "-", sys.argv[2]], input=pcm, check=True)
