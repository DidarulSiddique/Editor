#!/usr/bin/env python3
"""Remove voice (singing or speech) from a track and keep the music.

Runs the UVR MDX-Net "Inst HQ 3" instrumental model with onnxruntime (no
torch needed). The model is fetched once from the UVR model repository on
GitHub into ~/.cache/edit-kit/uvr/.

usage: instrumental.py in.wav out.wav [--vocals vocals.wav]
Input is converted to 44.1 kHz stereo with ffmpeg first.
"""
import argparse
import os
import subprocess
import sys
import tempfile
import urllib.request

import numpy as np
import onnxruntime as ort

MODEL_URL = "https://github.com/TRvlvr/model_repo/releases/download/all_public_uvr_models/UVR-MDX-NET-Inst_HQ_3.onnx"
MODEL = os.path.expanduser("~/.cache/edit-kit/uvr/UVR-MDX-NET-Inst_HQ_3.onnx")
SR = 44100
N_FFT, HOP, DIM_F, DIM_T = 6144, 1024, 3072, 256
COMPENSATE = 1.022  # UVR's level compensation for this model
TRIM = N_FFT // 2
CHUNK = HOP * (DIM_T - 1)
GEN = CHUNK - 2 * TRIM
WIN = 0.5 - 0.5 * np.cos(2 * np.pi * np.arange(N_FFT) / N_FFT)  # periodic Hann


def stft(x):
    """x: [C, CHUNK] -> [C, F, T] complex, like torch.stft(center=True)."""
    p = np.pad(x, ((0, 0), (N_FFT // 2, N_FFT // 2)), mode="reflect")
    frames = np.lib.stride_tricks.sliding_window_view(p, N_FFT, axis=1)[:, ::HOP]  # [C, T, N_FFT]
    return np.fft.rfft(frames * WIN, axis=2).transpose(0, 2, 1)


def istft(spec, length):
    """spec: [C, F, T] complex -> [C, length], inverse of stft()."""
    frames = np.fft.irfft(spec.transpose(0, 2, 1), n=N_FFT, axis=2) * WIN  # [C, T, N_FFT]
    c, t, _ = frames.shape
    total = N_FFT + HOP * (t - 1)
    out = np.zeros((c, total))
    norm = np.zeros(total)
    for i in range(t):
        out[:, i * HOP : i * HOP + N_FFT] += frames[:, i]
        norm[i * HOP : i * HOP + N_FFT] += WIN**2
    out /= np.maximum(norm, 1e-8)
    return out[:, N_FFT // 2 : N_FFT // 2 + length]


def run(sess, chunk):
    spec = stft(chunk)[:, :DIM_F]  # [2, F, T]
    x = np.stack([spec[0].real, spec[0].imag, spec[1].real, spec[1].imag])[None].astype(np.float32)
    y = sess.run(None, {sess.get_inputs()[0].name: x})[0][0]  # [4, F, T]
    full = np.zeros((2, N_FFT // 2 + 1, DIM_T), dtype=np.complex128)
    full[0, :DIM_F] = y[0] + 1j * y[1]
    full[1, :DIM_F] = y[2] + 1j * y[3]
    return istft(full, CHUNK)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("inp")
    ap.add_argument("out")
    ap.add_argument("--vocals")
    a = ap.parse_args()
    if not os.path.exists(MODEL):
        os.makedirs(os.path.dirname(MODEL), exist_ok=True)
        print("fetching model…", file=sys.stderr)
        urllib.request.urlretrieve(MODEL_URL, MODEL)
    with tempfile.TemporaryDirectory() as td:
        raw = os.path.join(td, "in.f32")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", a.inp, "-ac", "2", "-ar", str(SR), "-f", "f32le", raw], check=True)
        mix = np.fromfile(raw, dtype=np.float32).reshape(-1, 2).T.astype(np.float64)
    n = mix.shape[1]
    pad = GEN - n % GEN
    mp = np.concatenate([np.zeros((2, TRIM)), mix, np.zeros((2, pad)), np.zeros((2, TRIM))], axis=1)
    sess = ort.InferenceSession(MODEL, providers=["CPUExecutionProvider"])
    parts = []
    for i in range(0, mp.shape[1] - 2 * TRIM, GEN):
        chunk = mp[:, i : i + CHUNK]
        # denoise as UVR does: average f(x) and -f(-x)
        w = 0.5 * (run(sess, chunk) - run(sess, -chunk))
        parts.append(w[:, TRIM:-TRIM])
        print(f"  {min(i + GEN, n) / SR:5.1f}/{n / SR:.1f}s", file=sys.stderr)
    inst = np.concatenate(parts, axis=1)[:, :n] * COMPENSATE

    def write(arr, path):
        with tempfile.TemporaryDirectory() as td:
            raw = os.path.join(td, "o.f32")
            arr.T.astype(np.float32).tofile(raw)
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", raw, "-c:a", "pcm_s24le", path], check=True)

    write(inst, a.out)
    if a.vocals:
        write(mix - inst, a.vocals)


if __name__ == "__main__":
    main()
