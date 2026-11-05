#!/usr/bin/env python3
"""Mix for BrightonTactics.tsx: tightened voiceover + dark ambient bed + whooshes on cuts
+ ball kicks on passes. usage: python3 -I build-audio.py vo.wav out.wav"""
import subprocess, sys
import numpy as np
SR = 48000; END = 70.8; N = int(END * SR)
rng = np.random.default_rng(3)
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
B = dict(how=7.0, bait=10.0, pass_=15.1, hunt=20.8, wide=27.7, but=32.0, c1=34.3, liv=40.2, c2=47.32, che=54.7, c3=61.4, cta=67.4)
# bed: low drone (two detuned saws, lowpassed) + air
t = np.arange(N) / SR
drone = sum(np.sin(2 * np.pi * f * t) for f in (55, 55.4, 82.4, 110.2)) / 4
air = lp(rng.standard_normal(N), 0.01)
air /= np.abs(air).max()
bed = drone * 0.05 + air * 0.05
fade = np.minimum(1, t / 1.0) * np.minimum(1, (END - t) / 1.5)
out += np.stack([bed, np.roll(bed, 700)], 1) * fade[:, None]
def whoosh(d=0.5):
    n = int(d * SR); x = rng.standard_normal(n); k = np.linspace(0, 1, n)
    a = 0.03 + 0.3 * np.sin(np.pi * k) ** 2; y = np.empty(n); acc = 0.0
    for i in range(n): acc += a[i] * (x[i] - acc); y[i] = acc
    return (y - lp(y, 0.01)) * np.sin(np.pi * k) ** 1.5
def kick():
    n = int(0.25 * SR); tt = np.arange(n) / SR
    body = np.sin(2 * np.pi * (140 * np.exp(-tt * 30) + 60) * tt) * env(n, 0.001, 0.05)
    return body * 0.9 + lp(rng.standard_normal(n), 0.4) * env(n, 0.0005, 0.008) * 0.6
def net():
    n = int(0.8 * SR); return lp(rng.standard_normal(n), 0.08) * env(n, 0.01, 0.25) * 1.2
for c in B.values(): add(c - 0.22, whoosh(), 0.55)
kicks = [0.0, 0.7, 2.65, B["pass_"] + 0.5, B["pass_"] + 1.5, B["hunt"] + 0.4, B["c1"] + 2.6, B["c2"] + 3.7, B["c3"] + 0.5, B["c3"] + 3.25]
kicks += [B["liv"] + d for d in (0.3, 1.4, 2.5, 3.6, 4.7, 5.8)] + [B["che"] + d for d in (2.3, 3.5)]
for k in kicks: add(k, kick(), 0.5)
add(3.15, net(), 0.5); add(B["c3"] + 3.7, net(), 0.5); add(B["che"] + 3.95, net(), 0.5)
vo = load(sys.argv[1]); add(0.0, vo * 10 ** (3 / 20), 1.0)
pcm = (np.clip(out, -1, 1) * 32767).astype("<i2").tobytes()
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "s16le", "-ar", str(SR), "-ac", "2", "-i", "-", sys.argv[2]], input=pcm, check=True)
