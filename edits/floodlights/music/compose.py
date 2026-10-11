"""Original soundtrack for "Floodlights", synthesised from scratch.

80 BPM, A minor, 6 bars (18s). Structure, in bars of 3s:
  1  floodlight clunks + solo piano arpeggio   (hook)
  2  + warm pad
  3  + soft kick and hats
  4  build: snare roll, noise riser, gap
  5  DROP: trap drums, 808, piano melody      ("that's not failure")
  6  outro: piano + pad fade to silence        (loops back to the black open)

usage: python3 compose.py out.wav
"""
import sys
import wave

import numpy as np

SR = 44100
BPM = 80
BEAT = 60 / BPM
BAR = BEAT * 4
LENGTH = BAR * 6
N = int(LENGTH * SR)
rng = np.random.default_rng(7)

L = np.zeros(N)
R = np.zeros(N)


def t_of(n):
    return np.arange(n) / SR


def note_hz(name):
    names = {"C": -9, "D": -7, "E": -5, "F": -4, "G": -2, "A": 0, "B": 2}
    pitch, octave = name[:-1], int(name[-1])
    semis = names[pitch[0]] + (1 if "#" in pitch else 0) + (octave - 4) * 12
    return 440.0 * 2 ** (semis / 12)


def add(sig, at, gain=1.0, pan=0.0):
    """Mix a mono signal in at time `at` (seconds), pan -1..1."""
    i = int(at * SR)
    if i >= N:
        return
    sig = sig[: N - i] * gain
    L[i : i + len(sig)] += sig * np.sqrt((1 - pan) / 2) * 1.414
    R[i : i + len(sig)] += sig * np.sqrt((1 + pan) / 2) * 1.414


def lowpass(x, cutoff):
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc = (1 - a) * v + a * acc
        y[i] = acc
    return y


def fft_filter(x, lo=None, hi=None):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    if lo:
        X[f < lo] = 0
    if hi:
        X[f > hi] = 0
    return np.fft.irfft(X, len(x))


# ---------- instruments ----------

def piano(freq, dur=2.5, vel=1.0):
    t = t_of(int(dur * SR))
    sig = np.zeros_like(t)
    for k in range(1, 9):
        f = freq * k * (1 + 0.0004 * k * k)  # slight string inharmonicity
        sig += np.sin(2 * np.pi * f * t) * (1 / k**1.4) * np.exp(-t * (1.2 + 0.9 * k))
    attack = np.minimum(t / 0.004, 1)
    hammer = rng.normal(0, 1, len(t)) * np.exp(-t * 90) * 0.04
    return (sig * attack + hammer) * vel * 0.32


def pad(freqs, dur):
    t = t_of(int(dur * SR))
    sig = np.zeros_like(t)
    for f in freqs:
        for d in (-0.12, 0.0, 0.11):
            ph = rng.uniform(0, 1)
            sig += 2 * ((t * f * 2 ** (d / 12) + ph) % 1) - 1  # saw
    sig = lowpass(sig / (len(freqs) * 3), 900)
    env = np.minimum(t / 0.6, 1) * np.minimum((dur - t) / 0.6, 1)
    return sig * env * 0.5


def kick(level=1.0):
    t = t_of(int(0.5 * SR))
    f = 45 + 95 * np.exp(-t * 28)
    sig = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7)
    click = rng.normal(0, 1, len(t)) * np.exp(-t * 400) * 0.3
    return np.tanh((sig + click) * 1.6) * level


def snare(level=1.0):
    t = t_of(int(0.35 * SR))
    noise = fft_filter(rng.normal(0, 1, len(t)), 1200, 9000) * np.exp(-t * 16)
    body = np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30) * 0.6
    return (noise * 0.7 + body) * level


def clap(level=1.0):
    t = t_of(int(0.4 * SR))
    env = sum(np.exp(-np.maximum(t - o, 0) * 60) * (t >= o) for o in (0, 0.011, 0.022))
    env = env + np.exp(-t * 9) * 0.5
    return fft_filter(rng.normal(0, 1, len(t)), 900, 7000) * env * 0.5 * level


def hat(level=1.0, open_=False):
    t = t_of(int((0.25 if open_ else 0.05) * SR))
    return fft_filter(rng.normal(0, 1, len(t)), 7000, None) * np.exp(-t * (14 if open_ else 90)) * 0.35 * level


def bass808(freq, dur):
    t = t_of(int(dur * SR))
    f = freq * (1 + 0.6 * np.exp(-t * 30))
    sig = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.2)
    return np.tanh(sig * 2.2) * 0.38


def clunk():
    """Stadium floodlight contactor slamming on: thud, metal click, hum."""
    t = t_of(int(1.2 * SR))
    thud = np.sin(2 * np.pi * 55 * t) * np.exp(-t * 18)
    click = fft_filter(rng.normal(0, 1, len(t)), 1500, 6000) * np.exp(-t * 70) * 0.8
    hum = sum(np.sin(2 * np.pi * 50 * k * t) / k for k in (1, 2, 3)) * 0.06 * np.exp(-t * 2)
    return np.tanh((thud + click + hum) * 1.5) * 0.8


def whoosh(dur=0.6, rising=True):
    t = t_of(int(dur * SR))
    noise = rng.normal(0, 1, len(t))
    out = np.zeros_like(t)
    steps = 24
    for s in range(steps):  # sweep a band through the noise
        a, b = s * len(t) // steps, (s + 1) * len(t) // steps
        c = 400 + 5000 * (s / steps if rising else 1 - s / steps)
        out[a:b] = fft_filter(noise[a:b], c * 0.6, c * 1.6)
    env = np.sin(np.pi * t / dur) ** 2
    return out * env * 0.6


def riser(dur):
    t = t_of(int(dur * SR))
    noise = fft_filter(rng.normal(0, 1, len(t)), 2000, None)
    tone = np.sin(2 * np.pi * np.cumsum(200 + 1200 * (t / dur) ** 2) / SR) * 0.15
    return (noise * 0.25 + tone) * (t / dur) ** 2


def impact():
    t = t_of(int(2.5 * SR))
    boom = np.sin(2 * np.pi * np.cumsum(30 + 60 * np.exp(-t * 6)) / SR) * np.exp(-t * 1.6)
    burst = fft_filter(rng.normal(0, 1, len(t)), 200, 6000) * np.exp(-t * 6) * 0.4
    return np.tanh((boom + burst) * 1.8) * 0.9


def ball_kick():
    t = t_of(int(0.3 * SR))
    return (np.sin(2 * np.pi * 110 * t) * np.exp(-t * 35) + fft_filter(rng.normal(0, 1, len(t)), 500, 3000) * np.exp(-t * 80) * 0.5) * 0.7


# ---------- arrangement ----------

CHORDS = [  # one chord per half bar: Am F C G, x3
    ("A2", ["A3", "C4", "E4"]),
    ("F2", ["A3", "C4", "F4"]),
    ("C3", ["G3", "C4", "E4"]),
    ("G2", ["G3", "B3", "D4"]),
] * 3

# Arpeggio: root, fifth, octave, third, rising through each chord.
for i, (root, tones) in enumerate(CHORDS):
    start = i * BAR / 2
    bar = int(start // BAR)
    if bar >= 5 and start >= LENGTH - BAR / 2:
        vel = 0.55
    else:
        vel = 0.8
    pattern = [tones[0], tones[2], tones[1], tones[2]]
    for j, n in enumerate(pattern):
        add(piano(note_hz(n), 2.2, vel * (1.0 if j == 0 else 0.75)), start + j * BEAT / 2, pan=-0.2 + 0.13 * j)
    add(piano(note_hz(root), 3.0, 0.55), start, pan=0)  # left hand
    if bar >= 1:
        add(pad([note_hz(root) * 2] + [note_hz(n) for n in tones], BAR / 2 + 0.4), start, 0.5 if bar < 4 else 0.7)

# Melody over the drop (bars 5-6), simple and singable.
MELODY = [("E5", 0, 1.5), ("D5", 1.5, 0.75), ("C5", 2.25, 0.75), ("C5", 3.0, 1.5), ("B4", 4.5, 0.75), ("A4", 5.25, 0.75)]
for n, at, d in MELODY:
    add(piano(note_hz(n), d + 1.5, 1.0), BAR * 4 + at, pan=0.1)

# Floodlights switching on (bar 1).
for k, at in enumerate((0.05, 0.55, 1.05)):
    add(clunk(), at, 0.9, pan=(-0.5, 0.5, 0.0)[k])

# Ball kicked as "but you still lace up" lands.
add(ball_kick(), 4.5, 0.8)

# Bar 3: soft heartbeat kick + closed hats.
for b in range(4):
    add(kick(0.55), BAR * 2 + b * BEAT)
    for h in range(2):
        add(hat(0.5), BAR * 2 + b * BEAT + h * BEAT / 2, pan=0.3)

# Whooshes on "no scouts / no cameras / no crowd".
for at in (7.5, 8.25, 9.0):
    add(whoosh(0.5), at - 0.25, 0.6)

# Bar 4: build. Snare roll accelerating, riser, then a short gap.
roll = []
pos = BAR * 3 + BEAT * 2
step = BEAT / 2
while pos < BAR * 4 - 0.25:
    roll.append(pos)
    step = max(step * 0.82, BEAT / 8)
    pos += step
for k, at in enumerate(roll):
    add(snare(0.25 + 0.6 * k / len(roll)), at, pan=0.1)
add(riser(BAR - 0.25), BAR * 3, 0.9)
for b in range(2):
    add(kick(0.6), BAR * 3 + b * BEAT)

# Bar 5: DROP. Half-time trap pattern, 808 following the chords.
drop = BAR * 4
add(impact(), drop, 0.45)
for b in range(4):
    beat = drop + b * BEAT
    if b in (0,):
        add(kick(1.0), beat)
    if b == 1:
        add(kick(0.9), beat + BEAT / 2)
    if b == 2:
        add(clap(1.0), beat, pan=0.05)
        add(snare(0.5), beat)
    for h in range(4 if b == 3 else 2):  # hat roll on the last beat
        add(hat(0.7), beat + h * BEAT / (4 if b == 3 else 2), pan=0.35)
add(hat(0.6, open_=True), drop + BEAT * 1.5, pan=-0.3)
for k, root in enumerate(["A1", "F1"]):
    add(bass808(note_hz(root), BAR / 2), drop + k * BAR / 2)

# Bar 6: outro, kick on one only, then let it ring out.
add(kick(0.7), BAR * 5)
add(whoosh(1.2, rising=False), LENGTH - 1.6, 0.4)


# ---------- mix ----------

def reverb(x, seconds=2.2, mix=0.22, seed=0):
    n = int(seconds * SR)
    ir = np.random.default_rng(seed).normal(0, 1, n) * np.exp(-np.arange(n) / SR * 3.2)
    ir = lowpass(ir, 5000)
    size = 1 << int(np.ceil(np.log2(len(x) + n)))
    wet = np.fft.irfft(np.fft.rfft(x, size) * np.fft.rfft(ir, size), size)[: len(x)]
    wet /= np.max(np.abs(wet)) + 1e-9
    return x * (1 - mix) + wet * mix * np.max(np.abs(x))


L = reverb(L, seed=1)
R = reverb(R, seed=2)

# Fade the last 1.5s to silence so the loop restarts cleanly from black.
fade = np.ones(N)
fade[-int(1.5 * SR):] = np.linspace(1, 0, int(1.5 * SR)) ** 2
L *= fade
R *= fade

peak = max(np.abs(L).max(), np.abs(R).max())
L = np.tanh(L / peak * 1.2) * 0.89
R = np.tanh(R / peak * 1.2) * 0.89

out = sys.argv[1] if len(sys.argv) > 1 else "floodlights.wav"
with wave.open(out, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((np.stack([L, R], axis=1) * 32767).astype(np.int16).tobytes())
print(f"wrote {out}: {LENGTH:.1f}s, {BPM} BPM")
