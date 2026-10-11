#!/bin/bash
# Synthesise the soundtrack, then master it to about -14 LUFS for TikTok/Reels.
set -euo pipefail
cd "$(dirname "$0")/.."
tmp=$(mktemp -d)
python3 music/compose.py "$tmp/raw.wav"
ffmpeg -v error -y -i "$tmp/raw.wav" -af "acompressor=threshold=-24dB:ratio=2:attack=20:release=250:makeup=2" "$tmp/comp.wav"
measured=$(ffmpeg -i "$tmp/comp.wav" -af ebur128 -f null - 2>&1 | grep -A1 "Integrated loudness" | tail -1 | awk '{print $2}')
gain=$(python3 -c "print(-14.5 - ($measured))")
ffmpeg -v error -y -i "$tmp/comp.wav" -af "volume=${gain}dB,aresample=176400,alimiter=limit=0.84:attack=3:release=60:level=disabled,aresample=44100" -ar 44100 public/floodlights.wav
rm -rf "$tmp"
echo "mastered public/floodlights.wav (gain ${gain} dB)"
