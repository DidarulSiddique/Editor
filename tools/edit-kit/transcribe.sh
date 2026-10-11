#!/bin/bash
# Word-timed transcript (lyrics or speech) via whisper.cpp, as JSON + SRT.
# usage: transcribe.sh media out_prefix [model=small.en]
# Needs the model in ~/.cache/hyperframes/whisper/models (downloaded from
# huggingface.co, which must be allowed in the environment's network policy).
set -euo pipefail
in=$1; prefix=$2; model=${3:-small.en}
dir="$HOME/.cache/hyperframes/whisper"
cli="$dir/whisper.cpp/build/bin/whisper-cli"
weights="$dir/models/ggml-$model.bin"
[ -x "$cli" ] || { echo "whisper-cli missing: run the session start hook" >&2; exit 2; }
if [ ! -s "$weights" ]; then
  curl -sSfL -o "$weights.part" "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-$model.bin" && mv "$weights.part" "$weights" \
    || { rm -f "$weights.part"; echo "no Whisper model: allow huggingface.co in the environment network settings" >&2; exit 3; }
fi
tmp=$(mktemp -d)
ffmpeg -v error -y -i "$in" -ar 16000 -ac 1 "$tmp/a.wav"
"$cli" -m "$weights" -f "$tmp/a.wav" -ml 1 -oj -osrt -of "$prefix" >/dev/null 2>&1
rm -rf "$tmp"
echo "wrote $prefix.json and $prefix.srt"
