"""Fit a replacement narration onto the already-rendered picture (no re-render).
1. Cap every pause at CAP (Shorts pacing).
2. Pick where each shot's first word lands. Each word lands as close to an even speed-up as possible, but no more than
   EARLY s before or LATE s after the word in the old voice that the shot was cut on (the picture may lead the word a little).
3. Time-stretch segment by segment with rubberband (pitch kept). Each segment is cut from a continuous stretch of the
   whole file at its own tempo, with 12 ms crossfades at the joins, so there are no edge artifacts.
usage: python3 fit.py new_voice.wav new_words.json old_words.json shots.json out.wav"""
import sys, json, re, subprocess, numpy as np, soundfile as sf
src, nw_p, ow_p, sh_p, dst = sys.argv[1:6]
CAP, EARLY, LATE, X = 0.30, 0.10, 0.28, 0.012
a, sr = sf.read(src, dtype="float32")
if a.ndim > 1: a = a.mean(1)
dur = len(a) / sr
err = subprocess.run(["ffmpeg", "-i", src, "-af", "silencedetect=n=-38dB:d=0.10", "-f", "null", "-"], capture_output=True, text=True).stderr
st = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", err)]; en = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", err)]
gaps = list(zip(st, en))
# 1) pause cap: raw -> capped time map (knots)
kr, kc, parts, pos, cpos = [0.0], [0.0], [], 0.0, 0.0
for s, e in gaps:
    if e - s <= CAP: continue
    keep = 0.04 if s < 0.01 else (0.30 if e >= dur - 0.01 else CAP)
    m0, m1 = s + keep / 2, e - keep / 2
    parts.append(a[int(pos * sr):int(m0 * sr)]); cpos += m0 - pos; pos = m1
    kr += [m0, m1]; kc += [cpos, cpos]
parts.append(a[int(pos * sr):]); kr.append(dur); kc.append(cpos + dur - pos)
b = np.concatenate(parts); cmap = lambda t: float(np.interp(t, kr, kc))
sf.write("/tmp/_cap.wav", b, sr)
# 2) anchors
NW, OW, SH = json.load(open(nw_p)), json.load(open(ow_p)), json.load(open(sh_p))
last = max(i for i, w in enumerate(NW) if w["w"].lower().startswith("gold"))  # the narration ends on "…in gold."
anch = []
for sid, f0, _ in SH:
    i = next((k for k, w in enumerate(OW) if w["t0"] >= f0 / 30 - 0.12), None)
    if i is not None and i <= last and (not anch or i > anch[-1][1]): anch.append((sid, i))
N = np.array([cmap(NW[i]["t0"]) for _, i in anch] + [cmap(NW[last]["t1"])])
O = np.array([OW[i]["t0"] for _, i in anch] + [OW[last]["t1"]])
n = np.diff(N); rbar = n.sum() / (O[-1] - O[0])
lo = np.r_[O[0], O[1:-1] - EARLY, O[-1] - 0.10]; hi = np.r_[O[0], O[1:-1] + LATE, O[-1] + 0.35]
L = np.clip(O[0] + np.r_[0, np.cumsum(n / rbar)], lo, hi)
w = 1 / (n / rbar) ** 2
for _ in range(20000):  # projected gradient on sum w*(d - n/rbar)^2
    d = np.diff(L); g = 2 * w * (d - n / rbar); grad = np.r_[0, g] - np.r_[g, 0]
    L = np.clip(L - 0.02 * grad, lo, hi)
r = n / np.diff(L)
for (sid, i), o, l, rk in zip(anch, O, L, r):
    print(f"{sid:10s} word '{OW[i]['w']}' old {o:6.2f} new {l:6.2f} ({l - o:+.2f})  tempo {rk:.3f}")
print(f"mean tempo {rbar:.3f}  range {r.min():.3f}-{r.max():.3f}  end {L[-1]:.2f}")
# 3) render: one continuous stretch per (quantized) tempo, then cut + crossfade
rq = np.round(r / 0.005) * 0.005; cache = {}
def stretched(t):
    if t not in cache:
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "/tmp/_cap.wav", "-af", f"rubberband=tempo={t:.4f}:transients=mixed:phase=laminar:window=standard", "-ar", str(sr), "/tmp/_rs.wav"], check=True)
        cache[t] = sf.read("/tmp/_rs.wav", dtype="float32")[0]
    return cache[t]
LEAD = 0.035  # cut a hair before each anchor word's onset
out = np.zeros(int((L[-1] + 1.0) * sr), np.float32)
for k in range(len(n)):
    y, t = stretched(rq[k]), rq[k]
    c0 = (N[k] - (LEAD if k else 0)) / t; c1 = (N[k + 1] - LEAD) / t if k + 1 < len(n) else len(y) / sr
    p0 = L[k] - (LEAD if k else 0)
    x0 = X if k else 0; x1 = X if k + 1 < len(n) else 0
    seg = y[max(0, int((c0 - x0) * sr)):int((c1 + x1) * sr)].copy()
    fi, fo = int(2 * x0 * sr), int(2 * x1 * sr)
    if fi: seg[:fi] *= np.linspace(0, 1, fi)
    if fo: seg[-fo:] *= np.linspace(1, 0, fo)
    i0 = int((p0 - x0) * sr); j = min(len(out), i0 + len(seg)); out[i0:j] += seg[:j - i0]
end = int((L[-1] + 0.30) * sr); out = out[:end]
out[-int(0.05 * sr):] *= np.linspace(1, 0, int(0.05 * sr))
sf.write(dst, out, sr)
print("raw", round(dur, 2), "-> capped", round(len(b) / sr, 2), "-> fitted", round(len(out) / sr, 2))
