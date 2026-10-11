"""Find the tempo, beat grid and strongest hits in a music file.

usage: python3 -I beats.py music.wav [--offset SEC] [--json out.json]

Prints BPM, beat period and the strong onsets (cut points). --offset shifts
reported times as if the music started SEC seconds in (for trimmed intros).
"""
import json
import subprocess
import sys

import numpy as np

SR, HOP, WIN = 11025, 256, 1024


def load(path):
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
        capture_output=True, check=True,
    ).stdout
    return np.frombuffer(raw, dtype=np.float32)


def analyse(x):
    n = (len(x) - WIN) // HOP
    frames = np.stack([x[i * HOP : i * HOP + WIN] * np.hanning(WIN) for i in range(n)])
    spec = np.log1p(np.abs(np.fft.rfft(frames, axis=1)))
    flux = np.maximum(np.diff(spec, axis=0), 0).sum(1)
    flux = (flux - flux.mean()) / (flux.std() + 1e-9)
    t = np.arange(len(flux)) * HOP / SR

    ac = np.correlate(flux, flux, "full")[len(flux) - 1 :]
    lags = np.arange(len(ac)) * HOP / SR
    window = (lags > 0.3) & (lags < 1.5)
    period = float(lags[window][np.argmax(ac[window])])

    hits = []
    for i in range(1, len(flux) - 1):
        if flux[i] > 1.5 and flux[i] >= flux[i - 1] and flux[i] >= flux[i + 1]:
            if not hits or t[i] - hits[-1]["t"] > 0.25:
                hits.append({"t": round(float(t[i]), 3), "strength": round(float(flux[i]), 2)})
    return period, hits, len(x) / SR


def main():
    args = sys.argv[1:]
    if not args:
        sys.exit(__doc__)
    offset = float(args[args.index("--offset") + 1]) if "--offset" in args else 0.0
    out = args[args.index("--json") + 1] if "--json" in args else None
    period, hits, dur = analyse(load(args[0]))
    hits = [{**h, "t": round(h["t"] - offset, 3)} for h in hits if h["t"] >= offset]
    strong = sorted(hits, key=lambda h: -h["strength"])[: max(6, len(hits) // 3)]
    strong = sorted(strong, key=lambda h: h["t"])
    print(f"duration {dur - offset:.2f}s  tempo {60 / period:.1f} BPM  beat {period:.3f}s")
    print("strong hits (cut here):", " ".join(f"{h['t']:.2f}" for h in strong))
    print("all onsets:", " ".join(f"{h['t']:.2f}({h['strength']})" for h in hits))
    if out:
        with open(out, "w") as f:
            json.dump({"bpm": 60 / period, "beat": period, "duration": dur - offset, "strong": strong, "onsets": hits}, f, indent=1)


if __name__ == "__main__":
    main()
