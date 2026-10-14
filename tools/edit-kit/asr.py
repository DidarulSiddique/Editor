#!/usr/bin/env python3
"""Offline speech-to-text with Whisper small.en (sherpa-onnx, int8).

usage: asr.py audio [start end ...]   (pairs of seconds; default: whole file in 25 s windows)
Model: ~/.cache/edit-kit/asr/sherpa-onnx-whisper-small.en (from the sherpa-onnx GitHub releases).
"""
import os, subprocess, sys
import numpy as np
import sherpa_onnx

M = os.path.expanduser("~/.cache/edit-kit/asr/sherpa-onnx-whisper-small.en")
rec = sherpa_onnx.OfflineRecognizer.from_whisper(
    encoder=f"{M}/small.en-encoder.int8.onnx", decoder=f"{M}/small.en-decoder.int8.onnx", tokens=f"{M}/small.en-tokens.txt", num_threads=4)
path = sys.argv[1]
a = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", "16000", "-f", "f32le", "-"], capture_output=True, check=True).stdout, np.float32)
spans = [float(x) for x in sys.argv[2:]]
pairs = list(zip(spans[::2], spans[1::2])) or [(t, min(t + 25, len(a) / 16000)) for t in np.arange(0, len(a) / 16000, 25)]
for s0, s1 in pairs:
    st = rec.create_stream()
    st.accept_waveform(16000, a[int(s0 * 16000):int(s1 * 16000)])
    rec.decode_stream(st)
    print(f"[{s0:6.2f}-{s1:6.2f}] {st.result.text.strip()}")
