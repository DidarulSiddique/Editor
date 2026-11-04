#!/usr/bin/env python3
"""Sound bed for AfterDeath.tsx: no music, a soft wind/room tone + synthesised SFX
on the animation's cues (whooshes on transitions, footsteps, card flips, a book thud,
soft chimes on day tiles and source tags). Times mirror S in AfterDeath.tsx.

usage: python3 -I build-audio.py out.wav
"""
import subprocess
import sys

import numpy as np

SR = 48000
END = 62.0
S = dict(hook=0, teach=3.6, soul=6.6, funeral=12.4, steps=17.4, grave=24.4, dua=32.4, mourn=38.4, deeds=44.4, turn=52.4, cta=58.4)
rng = np.random.default_rng(7)
N = int(END * SR)
out = np.zeros((N, 2))


def lowpass(x, a):  # one-pole, a in (0,1): smaller = darker
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc += a * (v - acc)
        y[i] = acc
    return y


def add(t, sig, gain=1.0, pan=0.0):
    i = int(t * SR)
    if sig.ndim == 1:
        sig = np.stack([sig * (1 - max(0, pan)), sig * (1 + min(0, pan))], 1)
    j = min(N, i + len(sig))
    out[i:j] += sig[: j - i] * gain


def env(n, a, d):  # attack/decay in seconds
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) / d)


def whoosh(dur=0.55):
    n = int(dur * SR)
    x = rng.standard_normal(n)
    t = np.linspace(0, 1, n)
    # sweep a resonant-ish band: blend two lowpasses whose cutoff rises then falls
    a = 0.02 + 0.25 * np.sin(np.pi * t) ** 2
    y = np.empty(n)
    acc = 0.0
    for i in range(n):
        acc += a[i] * (x[i] - acc)
        y[i] = acc
    y -= lowpass(y, 0.01)
    return y * np.sin(np.pi * t) ** 1.5 * 0.9


def chime(f=880.0, dur=1.6):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = sum(a * np.sin(2 * np.pi * f * m * t) for m, a in [(1, 1), (2.01, 0.35), (3.02, 0.12), (4.2, 0.05)])
    return s * env(n, 0.004, 0.45) * 0.18


def step():
    n = int(0.16 * SR)
    x = rng.standard_normal(n)
    y = lowpass(x, 0.06) * env(n, 0.003, 0.035)
    thump = np.sin(2 * np.pi * 70 * np.arange(n) / SR) * env(n, 0.002, 0.03)
    return (y * 1.6 + thump * 0.5) * 0.7


def thud():
    n = int(0.9 * SR)
    t = np.arange(n) / SR
    f = 90 * np.exp(-t * 4) + 45
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, 0.18)
    slap = lowpass(rng.standard_normal(n), 0.15) * env(n, 0.001, 0.02)
    return body * 0.9 + slap * 0.6


def flip():
    n = int(0.22 * SR)
    x = rng.standard_normal(n)
    y = x - lowpass(x, 0.3)
    return y * env(n, 0.01, 0.05) * 0.5


# --- bed: soft wind (slow-moving lowpassed noise) + faint low room hum
wind = lowpass(rng.standard_normal(N), 0.004)
wind /= np.abs(wind).max()
mod = 0.6 + 0.4 * np.sin(2 * np.pi * np.arange(N) / SR / 9.0)
hum = np.sin(2 * np.pi * 55 * np.arange(N) / SR) * 0.02 + np.sin(2 * np.pi * 82.5 * np.arange(N) / SR) * 0.01
bed = wind * mod * 0.12 + hum
fade = np.minimum(1, np.arange(N) / SR / 1.5) * np.minimum(1, (END - np.arange(N) / SR) / 2.0)
out += np.stack([bed, np.roll(bed, 900)], 1) * fade[:, None]

# --- transitions
for t in [S["teach"] + 2.25, S["funeral"] - 0.3, S["steps"] - 0.3, S["grave"] - 0.65, S["dua"] - 0.65, S["mourn"] - 0.3, S["deeds"] - 0.3, S["turn"] - 0.3, S["cta"] - 0.3]:
    add(t, whoosh(), 0.9)

# --- chimes: hook strip, day tiles, source tags
add(S["hook"] + 0.6, chime(660, 2.2), 0.8)
add(S["teach"] + 0.1, chime(990, 2.0), 0.9)
for t in [S["funeral"] + 0.8, S["mourn"] + 0.5, S["mourn"] + 1.1, S["mourn"] + 1.7]:
    add(t, chime(784), 1.0)
for i, t in enumerate([S["deeds"] + 4.6, S["deeds"] + 5.0, S["deeds"] + 5.4, S["deeds"] + 5.8]):
    add(t, chime(784 * 2 ** (i * 2 / 12)), 0.7)
for t in [S["soul"] + 1.8, S["funeral"] + 1.0, S["steps"] + 2.2, S["grave"] + 2.4, S["dua"] + 0.6, S["mourn"] + 2.0, S["deeds"] + 3.2]:
    add(t, chime(1320, 1.0), 0.45)
add(S["soul"] + 2.6, chime(523, 3.0) + 0, 0.9)  # the soul rises
add(S["turn"] + 2.9, chime(587, 3.0), 0.9)  # "Yours are being written now."

# --- footsteps walking away (matches the prints)
for i in range(9):
    add(S["steps"] + 1.6 + i * 0.42, step(), 0.9 * (1 - i * 0.08), pan=0.1 + i * 0.07)
# --- card flips, book thud
for i in range(3):
    add(S["grave"] + 2.0 + i * 1.6, flip(), 1.0)
    add(S["grave"] + 2.05 + i * 1.6, thud() * 0.35, 1.0)
add(S["deeds"] + 1.72, thud(), 1.0)

out *= 10 ** (-3 / 20) / max(1e-9, np.abs(out).max())
pcm = (np.clip(out, -1, 1) * 32767).astype("<i2").tobytes()
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "s16le", "-ar", str(SR), "-ac", "2", "-i", "-", sys.argv[1]], input=pcm, check=True)
