#!/usr/bin/env python3
"""Sound for the cave short (no music): desert wind, night crickets, rock roll + impact, stone
grinds on each move, dawn birds, soft chimes into memories, under voice.mp3 -> mix_raw.wav"""
import subprocess
import numpy as np
SR = 48000; FPS = 30; N = int(1800 / FPS * SR)
rng = np.random.default_rng(5)
def lp(x, a):
    y = np.empty_like(x); acc = 0.0
    for i, v in enumerate(x): acc += a * (v - acc); y[i] = acc
    return y
def env(n, a, d):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) / d)
out = np.zeros(N)
def add(t, s, g=1.0):
    i = int(t * SR); j = min(N, i + len(s)); out[i:j] += s[: j - i] * g
F = lambda f: f / FPS
t = np.arange(N) / SR
# wind bed (quieter inside the cave)
wind = lp(rng.standard_normal(N), 0.006); wind /= np.abs(wind).max()
inside = np.zeros(N)
for a, b in [(42, 148), (188, 283), (389, 676), (970, 1052), (1176, 1267), (1582, 1640)]: inside[int(F(a) * SR):int(F(b) * SR)] = 1
inside = np.convolve(inside, np.ones(4800) / 4800, "same")
out += wind * (0.12 - 0.08 * inside) * (0.7 + 0.3 * np.sin(2 * np.pi * t / 7))
# crickets at night outside (hook, roll, vigil)
def crickets(d):
    n = int(d * SR); tt = np.arange(n) / SR
    pulse = (np.sin(2 * np.pi * 28 * tt) > 0.6) * (np.sin(2 * np.pi * 0.9 * tt) > -0.2)
    return np.sin(2 * np.pi * 4300 * tt) * pulse * 0.025
for a, b in [(149, 388), (773, 900)]: add(F(a), crickets(F(b - a)))
# boulder: rumble while rolling, impact on landing
n = int(F(330 - 255) * SR); rum = lp(rng.standard_normal(n), 0.004); rum /= np.abs(rum).max()
add(F(255), rum * np.linspace(0.2, 1, n) * 0.6)
def thud(g=1.0):
    n = int(1.2 * SR); tt = np.arange(n) / SR
    return (np.sin(2 * np.pi * (60 * np.exp(-tt * 3) + 30) * tt) * env(n, 0.003, 0.35) + lp(rng.standard_normal(n), 0.05) * env(n, 0.002, 0.12)) * g
add(F(330), thud(1.0)); add(F(336), thud(0.4)); add(F(20), thud(0.5))
def grind(d, g):
    n = int(d * SR); x = lp(rng.standard_normal(n), 0.02); x /= np.abs(x).max()
    return x * np.sin(np.linspace(0, np.pi, n)) * (0.6 + 0.4 * np.sin(np.linspace(0, 40, n))) * g
add(F(975), grind(1.0, 0.4)); add(F(1180), grind(1.0, 0.5)); add(F(1615), grind(2.2, 0.6)); add(F(1690), thud(0.5))
# soft chime into each memory
def chime(f0):
    n = int(2.0 * SR); tt = np.arange(n) / SR
    return sum(a * np.sin(2 * np.pi * f0 * m * tt) for m, a in [(1, 1), (2.01, 0.3), (3.02, 0.1)]) * env(n, 0.005, 0.6) * 0.06
for f0, a in [(660, 677), (660, 1053), (660, 1268), (880, 1008), (520, 611)]: add(F(a), chime(f0))
# dawn birds
def chirp():
    n = int(0.12 * SR); tt = np.arange(n) / SR; f = 3200 + 1500 * np.sin(np.pi * tt / 0.12)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.01, 0.04) * 0.04
for k in range(30): add(F(1640) + k * 0.5 + rng.random() * 0.3, chirp())
for k in range(10): add(F(930) + k * 0.4 + rng.random() * 0.2, chirp() * 0.6)
# voice
v = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", "voice.mp3", "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout, np.float32)
out[: min(N, len(v))] += v[:N] * 1.4
out *= 0.89 / max(1e-9, np.abs(out).max())
st = np.stack([out, np.roll(out, 240) * 0.98 + out * 0.02], 1)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", "mix_raw.wav"], input=st.astype(np.float32).tobytes(), check=True)
