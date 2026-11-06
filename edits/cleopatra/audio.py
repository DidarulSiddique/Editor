#!/usr/bin/env python3
"""Cleopatra mix: vidIQ music bed ducked under the narration + synthesized SFX on every reveal,
cut and transition (whooshes, coin clang, knife chops, hooves, crowd, sparkles, stamps). -> mix_raw.wav"""
import subprocess
import numpy as np
SR = 48000; FPS = 30; N = int(1800 / FPS * SR)
rng = np.random.default_rng(7)
F = lambda f: f / FPS
t_all = np.arange(N) / SR

def load(path, ch=1):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", str(ch), "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, ch).copy()
def lp(x, a):  # one-pole low-pass (vectorised via lfilter-like recursion in chunks)
    y = np.empty_like(x); acc = 0.0
    for i in range(len(x)): acc += a * (x[i] - acc); y[i] = acc
    return y
def env(n, a, d):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) / d)
def noise(n): return rng.standard_normal(n)
def hp(x):  # crude high-pass: x minus its low-pass
    return x - lp(x, 0.05)

sfx = np.zeros(N)
def add(t, s, g=1.0):
    i = int(t * SR)
    if i >= N: return
    j = min(N, i + len(s)); sfx[i:j] += s[: j - i] * g

def whoosh(d=0.5, up=True, g=0.25):
    n = int(d * SR); x = noise(n); y = np.zeros(n); acc = 0.0
    a = np.linspace(0.02, 0.25, n) if up else np.linspace(0.25, 0.02, n)
    for i in range(n): acc += a[i] * (x[i] - acc); y[i] = acc
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

# ---- transitions ----
for f, d, up, g in [(36, 0.45, False, 0.3), (282, 2.4, False, 0.3), (352, 0.4, True, 0.3), (412, 0.35, True, 0.22), (467, 0.35, True, 0.2), (563, 0.4, True, 0.22),
                    (697, 0.3, True, 0.25), (720, 2.4, False, 0.26), (860, 0.35, True, 0.2), (936, 2.6, True, 0.22), (1074, 0.3, True, 0.2), (1077, 1.5, False, 0.3),
                    (1176, 0.3, True, 0.2), (1253, 1.8, False, 0.24), (1425, 0.45, True, 0.3), (1478, 0.3, True, 0.2), (1519, 3.0, False, 0.22), (1622, 0.4, True, 0.26)]:
    add(F(f), whoosh(d, up, g))
# ---- reveals / impacts ----
add(F(14), sparkle(0.1)); add(F(98), boom(0.55, 60)); add(F(96), sparkle(0.12))
add(F(126), clang(0.4)); add(F(126), boom(0.35, 70))
add(F(176), sparkle(0.09)); add(F(208), sparkle(0.09)); add(F(240), crowd(1.4, 0.05))
add(F(282), tape(F(357 - 282), 0.05)); add(F(358), boom(0.45, 50)); add(F(368), pop(0.2, 700))
add(F(416), crowd(1.8, 0.05))
for k in range(9): add(F(418) + k * 0.6, boom(0.18, 45))           # marching
for k in range(56):                                                  # gallop: 4-beat clops
    base = F(471) + (k // 4) * 0.26; add(base + (k % 4) * 0.045, hoof(0.12 if k % 4 else 0.16))
add(F(532), whoosh(0.8, False, 0.12)); add(F(540), grind(0.9, 0.22)); add(F(556), boom(0.3, 48))
for c in [584, 598, 612, 626]: add(F(c), thwack(0.35)); add(F(c) - 0.1, whoosh(0.15, True, 0.12))
add(F(652), slide(0.1, True)); add(F(662), crowd(1.0, 0.035)); add(F(664), sparkle(0.08))
add(F(702), boom(0.55, 52)); add(F(724), waves(F(803 - 724), 0.05))
for i in range(6): add(F(810 + i * 7), pop(0.15, 820 + i * 40))
add(F(863), chime(988, 0.09, 2.0)); add(F(875), chime(1318, 0.07, 2.0)); add(F(900), sparkle(0.1))
for i in range(7): add(F(942 + i * 9.5), pop(0.13, 700))
add(F(1010), slide(0.08, True)); add(F(1040), pop(0.18, 820)); add(F(1053), slide(0.14)); add(F(1053), boom(0.15, 90))
add(F(1095), sparkle(0.14)); add(F(1100), boom(0.4, 60))
add(F(1128), chime(784, 0.08, 2.4)); add(F(1128), chime(1175, 0.06, 2.4)); add(F(1132), sparkle(0.1))
add(F(1179), crowd(2.6, 0.09)); add(F(1186), pop(0.18, 820)); add(F(1218), pop(0.16, 820))
add(F(1262), pop(0.22, 600)); add(F(1299), boom(0.45, 60)); add(F(1362), boom(0.45, 60))
add(F(1440), boom(0.6, 45)); add(F(1440), clang(0.15))
add(F(1530), crowd(1.6, 0.04)); add(F(1575), sparkle(0.12)); add(F(1592), boom(0.4, 55))
add(F(1626), boom(0.35, 50)); add(F(1652), pop(0.2, 700)); add(F(1709), sparkle(0.1)); add(F(1712), pop(0.18, 900))
# fire crackle under every hall/tent shot
for a, b in [(0, 357), (358, 415), (567, 699), (1077, 1124), (1318, 1437), (1482, 1625)]: add(F(a), crackle(F(b - a), 0.025))

# ---- voice + ducked music ----
voice = load("voice.wav")[:, 0]; vo = np.zeros(N); vo[: min(N, len(voice))] = voice[:N]
music = load("music.wav", 2); mu = np.zeros((N, 2)); mu[: min(N, len(music))] = music[:N]
# voice envelope (50 ms RMS, smoothed) -> duck depth
w = int(0.05 * SR); e = np.sqrt(np.convolve(vo ** 2, np.ones(w) / w, "same")); e = e / (e.max() + 1e-9)
act = np.clip(e * 6, 0, 1); act = np.convolve(act, np.ones(int(0.25 * SR)) / int(0.25 * SR), "same")
rv = np.sqrt(np.mean(vo[np.abs(vo) > 0.01] ** 2)); rm = np.sqrt(np.mean(mu ** 2))
gm = (rv / rm) * (0.42 - 0.24 * act)                  # ~ -7.5 dB under the voice when talking, ~ -2.5 dB in gaps
fade = np.minimum(1, t_all / 0.3) * np.minimum(1, (60 - t_all) / 1.2) * (1 - 0.3 * np.clip((t_all - 53.6) * 4, 0, 1) * np.clip((57.0 - t_all) * 4, 0, 1))  # clear the final question
mix = mu * (gm * fade)[:, None] + (vo * 1.0)[:, None] + np.stack([sfx, np.roll(sfx, 180)], 1) * rv * 3.2
mix *= 0.9 / np.abs(mix).max()
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", "mix_raw.wav"], input=mix.astype(np.float32).tobytes(), check=True)
print("mix_raw.wav", mix.shape)
