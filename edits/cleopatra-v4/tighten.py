"""Tighten the vidIQ narration: trim the lead-in, cap every pause (Shorts pacing), slight tempo lift.
usage: python3 tighten.py voice_raw.mp3 voice.wav"""
import sys, subprocess, re, numpy as np, soundfile as sf
src, dst = sys.argv[1], sys.argv[2]
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-ac", "1", "-ar", "44100", "/tmp/_v.wav"], check=True)
a, sr = sf.read("/tmp/_v.wav", dtype="float32")
err = subprocess.run(["ffmpeg", "-i", "/tmp/_v.wav", "-af", "silencedetect=n=-38dB:d=0.22", "-f", "null", "-"], capture_output=True, text=True).stderr
st = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", err)]; en = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", err)]
gaps = list(zip(st, en))
if en and (not st or en[0] < st[0]): gaps = [(0.0, en[0])] + list(zip(st, en[1:]))
CAP = 0.34; out = []; pos = 0
for i, (s, e) in enumerate(gaps):
    keep = 0.04 if s < 0.01 else (0.30 if e >= len(a) / sr - 0.01 else CAP)
    out.append(a[int(pos * sr):int(s * sr)]); L = min(e - s, keep)
    out.append(a[int(s * sr):int((s + L / 2) * sr)]); out.append(a[int((e - L / 2) * sr):int(e * sr)]); pos = e
out.append(a[int(pos * sr):]); b = np.concatenate(out)
sf.write("/tmp/_t.wav", b, sr)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "/tmp/_t.wav", "-af", "rubberband=tempo=1.03", "-ar", "44100", dst], check=True)
print(len(a) / sr, "->", len(b) / sr / 1.03)
