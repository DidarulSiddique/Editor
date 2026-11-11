#!/usr/bin/env python3
"""Cleopatra v4 mix: vidIQ narration (Chris) + vidIQ music bed ducked under it + synthesized SFX on every transition and reveal -> mix_raw.wav"""
import subprocess
import numpy as np
import json
SR = 48000; FPS = 30; TOTAL = 2016; N = int(TOTAL / FPS * SR); END = TOTAL / FPS
rng = np.random.default_rng(7)
F = lambda f: f / FPS
t_all = np.arange(N) / SR

def load(path, ch=1):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", str(ch), "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, ch).copy()
def lp(x, a):  # one-pole low-pass y += a*(x - y), as an FFT convolution with its (truncated) impulse response
    x = np.asarray(x, float); k = int(min(len(x), 7 / a)); h = a * (1 - a) ** np.arange(k); m = len(x) + k
    L = 1 << (m - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, L) * np.fft.rfft(h, L), L)[: len(x)]
def env(n, a, d):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) / d)
def noise(n): return rng.standard_normal(n)
def hp(x):  # crude high-pass: x minus its low-pass
    return x - lp(x, 0.05)

sfx = np.zeros(N); amb = np.zeros(N)   # amb: beds (fire crackle) that duck under the voice like the music
def add(t, s, g=1.0, to=None):
    to = sfx if to is None else to; i = int(t * SR)
    if i >= N: return
    j = min(N, i + len(s)); to[i:j] += s[: j - i] * g

def whoosh(d=0.5, up=True, g=0.25):
    n = int(d * SR); x = noise(n); k = 8
    y = np.concatenate([lp(c, a) for c, a in zip(np.array_split(x, k), (np.linspace(0.02, 0.25, k) if up else np.linspace(0.25, 0.02, k)))])
    sh = np.sin(np.linspace(0, np.pi, n)) ** 1.5
    return y / (np.abs(y).max() + 1e-9) * sh * g
def boom(g=0.6, f0=55):
    n = int(1.4 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * (f0 * np.exp(-t * 2.5) + f0 * 0.5) * t) * env(n, 0.004, 0.45) + lp(noise(n), 0.08) * env(n, 0.002, 0.08) * 0.6) * g
def clang(g=0.35):
    n = int(1.6 * SR); t = np.arange(n) / SR
    return sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t * dcy) for f, a, dcy in [(820, 1, 2.2), (1390, 0.6, 3.0), (2210, 0.45, 4.0), (3170, 0.3, 5.5), (410, 0.5, 2.6)]) * env(n, 0.001, 9) * g / 2.8
def chime(f0=1320, g=0.12, d=1.2):
    n = int(d * SR); t = np.arange(n) / SR
    return sum(a * np.sin(2 * np.pi * f0 * m * t) for m, a in [(1, 1), (2.0, 0.35), (3.01, 0.15)]) * env(n, 0.004, d / 3) * g
def sparkle(g=0.1):
    out = np.zeros(int(0.9 * SR))
    for k in range(7):
        c = chime(1600 + 300 * k + rng.random() * 200, 1, 0.5); i = int(k * 0.07 * SR); out[i:i + len(c)] += c[: len(out) - i]
    return out * g / 3
def pop(g=0.18, f0=900):
    n = int(0.12 * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * np.cumsum(f0 * np.exp(-t * 18) + 200) / SR) * env(n, 0.002, 0.03) * g
def thwack(g=0.4):
    n = int(0.35 * SR); return (hp(noise(n)) * env(n, 0.001, 0.03) + boom(1, 90)[:n] * 0.6) * g
def hoof(g=0.12):
    n = int(0.09 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * 180 * t) * 0.8 + lp(noise(n), 0.3)) * env(n, 0.001, 0.015) * g
def crowd(d, g=0.12):
    n = int(d * SR); x = lp(noise(n), 0.12) - lp(noise(n), 0.01)
    sw = 0.6 + 0.4 * np.sin(np.linspace(0, 6 * np.pi, n)) ** 2
    return x / (np.abs(x).max() + 1e-9) * sw * np.minimum(1, np.linspace(0, 6, n)) * np.minimum(1, np.linspace(6, 0, n)) * g
def crackle(d, g=0.03):
    n = int(d * SR); x = np.zeros(n)
    for _ in range(int(d * 25)): i = rng.integers(0, n - 300); x[i:i + 300] += hp(noise(300)) * env(300, 0.0005, 0.002) * rng.random()
    return x * g + lp(noise(n), 0.02) * g * 0.6
def tape(d, g=0.08):  # rewind warble
    n = int(d * SR); t = np.arange(n) / SR; f = 1800 + 1400 * np.sin(2 * np.pi * 3.2 * t) + 800 * t / d
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * (0.5 + 0.5 * np.sin(2 * np.pi * 11 * t)) * g * np.minimum(1, t * 8)
def slide(g=0.12, up=False):
    n = int(0.45 * SR); t = np.arange(n) / SR; f = np.linspace(1400, 380, n) if not up else np.linspace(380, 1400, n)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.01, 0.2) * g
def grind(d=0.8, g=0.25):
    n = int(d * SR); x = lp(noise(n), 0.02); x /= np.abs(x).max()
    return x * np.sin(np.linspace(0, np.pi, n)) * g
def waves(d, g=0.06):
    n = int(d * SR); x = lp(noise(n), 0.04); x /= np.abs(x).max(); t = np.arange(n) / SR
    return x * (0.5 + 0.5 * np.sin(2 * np.pi * t / 3.2)) * g


def buzz(g=0.12):  # wrong-answer buzzer
    n = int(0.42 * SR); t = np.arange(n) / SR; x = np.sign(np.sin(2 * np.pi * 110 * t)) * 0.6 + np.sign(np.sin(2 * np.pi * 116 * t)) * 0.4
    return lp(x, 0.2) * env(n, 0.005, 0.3) * g
def tick(g=0.06):
    n = int(0.03 * SR); return hp(noise(n)) * env(n, 0.0005, 0.006) * g
def crickets(d, g=0.012):
    n = int(d * SR); t = np.arange(n) / SR; ch = (np.sin(2 * np.pi * 4300 * t) * (np.sin(2 * np.pi * 28 * t) > 0.3) * (np.sin(2 * np.pi * 0.9 * t + 1) > 0)).astype(float)
    return ch * g * np.minimum(1, t * 2) * np.minimum(1, (d - t) * 2)

# shot starts (frames) mirror web/story.js
SH = 64 / 30   # v4b: the middle block moved +64 frames (see web/story.js SHIFT)
PLAN = [('queen', 0.0, None), ('flip', 2.25, 'W'), ('smug', 3.40, 'F'), ('busts', 4.85, 'D'), ('dynasty', 6.40, 'W'), ('bustsQ', 8.70, 'W'), ('farm', 9.50, 'F'), ('enter', 11.35, 'D'), ('translator', 13.35, 'W'),
  ('shock', 15.0, 'W'), ('how', 16.2, 'F'), ('stolen', 17.4, 'D'), ('coffin', 19.25, 'F'), ('hijack', 20.85, 'W'), ('chase', 23.8, 'W'), ('trophy', 26.65, 'D'), ('crown', 29.45, 'F'),
  ('alex', 31.0, 'D'), ('kings', 33.95, 'W'), ('wedding', 34.75, 'W'), ('banquet', 36.15, 'W'), ('landlord', 38.05, 'D'), ('name', 41.6, 'W'), ('born', 43.1, 'D'), ('homework', 45.0, 'F'),
  ('learns', 46.45, 'W'), ('dress', 47.75, 'F'), ('isis', 49.3, 'F'), ('talk', 51.2, 'D'), ('crowd', 53.6, 'F'), ('scribe', 54.9, 'D'), ('gold', 58.6, 'F'), ('loop', 63.1333 - SH, 'D')]
PLAN = [(k, s + (SH if i >= 6 else 0), t) for i, (k, s, t) in enumerate(PLAN)]
A = {k: round(s * 30) for k, s, _ in PLAN}; NEXT = {PLAN[i][0]: round(PLAN[i + 1][1] * 30) if i + 1 < len(PLAN) else TOTAL for i in range(len(PLAN))}
T = lambda k, d=0: (A[k] + d) / FPS
# ---- transitions: whip = fast whoosh, zoom = rising whoosh, dissolve = soft swell ----
for k, s, tin in PLAN:
    if tin == 'W': add(s - 0.12, whoosh(0.32, True, 0.24))
    elif tin == 'F': add(s - 0.18, whoosh(0.42, True, 0.2))
    elif tin == 'D': add(s - 0.3, whoosh(0.8, False, 0.08))
# ---- story SFX ----
add(T('queen', 10), sparkle(0.1)); add(T('flip', 5), boom(0.45, 58)); add(T('flip', 6), sparkle(0.13)); add(T('smug', 12), sparkle(0.08)); add(T('smug', 32), sparkle(0.1)); add(T('smug', 33), pop(0.14, 700))
for i in range(7): add(T('busts', 4 + i * 5), pop(0.12, 760 + i * 30))
for n in range(1, 6): add(T('dynasty', n * 12 - 4), pop(0.15, 600 + n * 60)); add(T('dynasty', n * 12 - 3), sparkle(0.05))
for i in range(7): add(T('bustsQ', 4 + i * 7), pop(0.12, 820))
add(T('farm'), waves((NEXT['farm'] - A['farm']) / FPS, 0.04)); add(T('farm', 35), pop(0.1, 600))
add(T('enter'), crowd(2.0, 0.035)); add(T('translator', 18), pop(0.16, 700)); add(T('shock', 6), boom(0.3, 70)); add(T('shock', 7), slide(0.1))
add(T('how', 4), pop(0.2, 620))
add(T('stolen'), crickets((A['chase'] - A['stolen']) / FPS, 0.01), to=amb); add(T('coffin', 8), sparkle(0.1))
add(T('hijack', 14), slide(0.1, True)); add(T('hijack', 30), thwack(0.3)); add(T('hijack', 44), boom(0.2, 80))
for k in range(int((NEXT['chase'] - A['chase']) / FPS / 0.26) * 4): base = T('chase') + (k // 4) * 0.26; add(base + (k % 4) * 0.045, hoof(0.11 if k % 4 else 0.15))
add(T('chase', 10), crowd(2.2, 0.04)); add(T('chase', 46), whoosh(0.3, True, 0.18))
add(T('trophy'), crowd(2.6, 0.07)); add(T('trophy', 6), sparkle(0.1))
add(T('crown', 16), boom(0.45, 58)); add(T('crown', 18), sparkle(0.13)); add(T('crown', 18), chime(784, 0.07, 2.2)); add(T('crown', 22), crowd(1.4, 0.04))
add(T('alex'), waves((A['kings'] - A['alex']) / FPS, 0.05))
for i in range(6): add(T('kings', 2 + i * 3), pop(0.13, 820 + i * 40))
add(T('wedding'), chime(1046, 0.06, 1.6)); add(T('wedding', 8), chime(1318, 0.05, 1.6)); add(T('banquet', 2), pop(0.14, 760))
for k in range(int((A['name'] - A['landlord']) / FPS / 0.09)): add(T('landlord') + k * 0.09, tick(0.05))
for i in range(6): add(T('landlord', 10 + i * 12), whoosh(0.25, True, 0.06))
add(T('name', 6), pop(0.16, 600))
add(T('born'), chime(988, 0.08, 2.0)); add(T('born', 14), chime(1318, 0.06, 2.0)); add(T('born', 20), sparkle(0.09))
for k in range(int((A['learns'] - A['homework']) / FPS / 0.07)): add(T('homework') + k * 0.07, tick(0.045))
add(T('learns', 10), chime(1568, 0.1, 1.4)); add(T('learns', 10), sparkle(0.1))
add(T('dress', 17), sparkle(0.13)); add(T('dress', 20), boom(0.35, 60))
add(T('isis', 12), chime(784, 0.07, 2.4)); add(T('isis', 12), chime(1175, 0.05, 2.4)); add(T('isis', 14), sparkle(0.1))
add(T('talk', 4), pop(0.16, 820)); add(T('talk', 22), crowd(1.0, 0.03))
add(T('crowd'), crowd(1.8, 0.09)); add(T('crowd', 4), pop(0.16, 820))
add(T('scribe'), crickets((A['loop'] - A['scribe']) / FPS, 0.01), to=amb)
add(T('gold', 6), boom(0.4, 48)); add(T('gold', 6), chime(523, 0.07, 3.0)); add(T('gold', 10), chime(784, 0.06, 3.0)); add(T('gold', 14), chime(1046, 0.05, 3.0))
for i in range(4): add(T('gold', 8 + i * 9), sparkle(0.09))
add(T('loop', 6), sparkle(0.08)); add(T('loop', 80), boom(0.4, 58)); add(T('loop', 82), sparkle(0.13)); add(T('loop', 84), chime(1568, 0.08, 1.4))
for a, b in [('queen', 'busts'), ('dynasty', 'bustsQ'), ('enter', 'how'), ('crown', 'alex'), ('wedding', 'landlord'), ('dress', 'isis'), ('talk', 'crowd')]: add(T(a), crackle((A[b] - A[a]) / FPS, 0.02), to=amb)

# ---- voice + ducked music (music stretched to the picture so its finale lands on the payoff) ----
voice = load("voice.wav")[:, 0]; vo = np.zeros(N); vo[: min(N, len(voice))] = voice[:N]
mdur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", "music_raw.wav"], capture_output=True, text=True).stdout)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "music_raw.wav", "-af", f"rubberband=tempo={mdur / (END + 0.4):.5f}", "-ar", str(SR), "music_fit.wav"], check=True)
music = load("music_fit.wav", 2); mu = np.zeros((N, 2)); mu[: min(N, len(music))] = music[:N]
def movavg(x, w):
    c = np.concatenate([[0.0], np.cumsum(x)]); i = np.arange(len(x)); a = np.clip(i - w // 2, 0, len(x)); b = np.clip(i + w - w // 2, 0, len(x))
    return (c[b] - c[a]) / np.maximum(1, b - a)
e = np.sqrt(movavg(vo ** 2, int(0.05 * SR))); e = e / (e.max() + 1e-9)
act = movavg(np.clip(e * 6, 0, 1), int(0.25 * SR))
rv = np.sqrt(np.mean(vo[np.abs(vo) > 0.01] ** 2)); rm = np.sqrt(np.mean(mu ** 2))
gm = (rv / rm) * (0.40 - 0.27 * act)                 # ~ -10.5 dB under the voice, ~ -2.5 dB in the gaps
g0, g1 = T('gold'), T('loop')                       # the payoff: let the music swell
swell = 1 + 0.5 * np.clip((t_all - g0) * 2, 0, 1) * np.clip((g1 + 0.5 - t_all) * 2, 0, 1)
fade = np.minimum(1, t_all / 0.15) * np.minimum(1, (END - t_all) / 0.8) * swell
sfx += amb * (1 - 0.75 * act)
mix = mu * (gm * fade)[:, None] + (vo * 1.0)[:, None] + np.stack([sfx, np.roll(sfx, 180)], 1) * rv * 3.0
mix *= 0.9 / np.abs(mix).max()
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", "mix_raw.wav"], input=mix.astype(np.float32).tobytes(), check=True)
print("mix_raw.wav", mix.shape, END)
