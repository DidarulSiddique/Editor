"""Word timings: zipformer ASR token timestamps aligned onto the script's words -> work/words.json
usage: python3 words.py voice.wav script.txt <model_dir>"""
import sys, json, re, difflib, numpy as np, soundfile as sf, sherpa_onnx
wav, script, md = sys.argv[1:4]
r = sherpa_onnx.OfflineRecognizer.from_transducer(encoder=md + "/encoder-epoch-99-avg-1.onnx", decoder=md + "/decoder-epoch-99-avg-1.onnx",
    joiner=md + "/joiner-epoch-99-avg-1.onnx", tokens=md + "/tokens.txt", num_threads=4, decoding_method="greedy_search")
a, sr = sf.read(wav, dtype="float32")
if sr != 16000:
    import subprocess; subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", wav, "-ac", "1", "-ar", "16000", "/tmp/_w16.wav"], check=True); a, sr = sf.read("/tmp/_w16.wav", dtype="float32")
f = int(0.02 * sr); e = np.array([np.sqrt(np.mean(a[i:i + f] ** 2)) for i in range(0, len(a), f)])
cuts = [0]
while (len(a) - cuts[-1]) / sr > 14:
    lo = cuts[-1] // f + int(7 / 0.02); hi = cuts[-1] // f + int(14 / 0.02); cuts.append((lo + int(np.argmin(e[lo:hi]))) * f)
cuts.append(len(a)); asr = []
for s, t in zip(cuts, cuts[1:]):
    st = r.create_stream(); st.accept_waveform(sr, a[s:t]); r.decode_stream(st); res = st.result
    cur = None
    for tok, ts in zip(res.tokens, res.timestamps):
        ts += s / sr
        tok = tok.replace("▁", " ")
        if tok.startswith(" ") or cur is None:
            if cur and cur["w"]: asr.append(cur)
            cur = {"w": tok.strip().lower(), "t0": ts, "t1": ts + 0.08}
        else: cur["w"] += tok.lower(); cur["t1"] = ts + 0.08
    if cur and cur["w"]: asr.append(cur)
# token end times: next word start (capped)
for i, w in enumerate(asr[:-1]): w["t1"] = min(max(w["t1"], w["t0"] + 0.12), asr[i + 1]["t0"])
sw = open(script).read().split(); norm = lambda x: re.sub(r"[^a-z']", "", x.lower())
sm = difflib.SequenceMatcher(None, [norm(x) for x in sw], [w["w"] for w in asr], autojunk=False)
out = [None] * len(sw)
for tag, i1, i2, j1, j2 in sm.get_opcodes():
    if tag == "equal":
        for k in range(i2 - i1): out[i1 + k] = (asr[j1 + k]["t0"], asr[j1 + k]["t1"])
    elif j2 > j1:  # spread the ASR span over the script words
        t0, t1 = asr[j1]["t0"], asr[j2 - 1]["t1"]
        for k in range(i2 - i1): out[i1 + k] = (t0 + (t1 - t0) * k / (i2 - i1), t0 + (t1 - t0) * (k + 1) / (i2 - i1))
for i in range(len(out)):  # unmatched script words: interpolate between neighbours
    if out[i] is None:
        p = next((out[j][1] for j in range(i - 1, -1, -1) if out[j]), 0.0); n = next((out[j][0] for j in range(i + 1, len(out)) if out[j]), p + 0.3)
        out[i] = (p, max(p + 0.1, n))
words = [{"w": w, "t0": round(t[0], 3), "t1": round(t[1], 3)} for w, t in zip(sw, out)]
json.dump(words, open("work/words.json", "w"), indent=0)
print(" ".join(w["w"] for w in asr)); print(len(sw), "script words;", sum(1 for t, *_ in sm.get_opcodes() if t != "equal"), "non-equal ops")
for w in words: print(f'{w["t0"]:6.2f} {w["w"]}', end=" |")
