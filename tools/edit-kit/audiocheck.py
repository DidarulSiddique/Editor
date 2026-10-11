"""Loudness report: integrated LUFS, true peak, and level per section.

usage: python3 -I audiocheck.py audio_or_video [--section SEC]

Targets for TikTok/Reels: about -14 LUFS integrated, peak below -1 dBTP,
and the drop/payoff section 2-4 dB louder than the intro (not 9 dB).
"""
import re
import subprocess
import sys

import numpy as np


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    path = sys.argv[1]
    section = float(sys.argv[sys.argv.index("--section") + 1]) if "--section" in sys.argv else 3.0
    r128 = subprocess.run(
        ["ffmpeg", "-i", path, "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True
    ).stderr
    integrated = re.findall(r"I:\s+(-?[\d.]+) LUFS", r128)
    peak = re.findall(r"Peak:\s+(-?[\d.]+) dBFS", r128)
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", "44100", "-f", "f32le", "-"], capture_output=True
    ).stdout
    x = np.frombuffer(raw, dtype=np.float32)
    print(f"integrated {integrated[-1] if integrated else '?'} LUFS   true peak {peak[-1] if peak else '?'} dBTP")
    n = int(section * 44100)
    for i in range(0, len(x), n):
        seg = x[i : i + n]
        if len(seg) < 4410:
            break
        rms = 20 * np.log10(np.sqrt((seg**2).mean()) + 1e-9)
        bar = "#" * max(0, int((rms + 40) / 1.5))
        print(f"{i / 44100:6.1f}s  {rms:6.1f} dB  {bar}")


if __name__ == "__main__":
    main()
