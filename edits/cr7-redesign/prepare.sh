#!/bin/bash
# Rebuild public/ from the old TikTok export (the only copy of the footage).
# usage: prepare.sh <uploads_dir>
set -euo pipefail
up=$1
pub="$(cd "$(dirname "$0")" && pwd)/public"
src="$up/b9e61265-export_1791959485159.mov"
# The 16:9 picture sits at y=350 in the 576x1024 export. Lift it to 1152x648
# with Lanczos and a light unsharp so the browser isn't scaling a tiny image.
ffmpeg -v error -y -t 44.6 -i "$src" -vf "crop=576:324:0:350,scale=1152:648:flags=lanczos,unsharp=5:5:0.55:5:5:0,fps=30" \
  -an -c:v libx264 -crf 12 -preset slow -pix_fmt yuv420p "$pub/footage.mp4"
# Original soundtrack (music + interview speech), faded where the TikTok
# outro starts.
ffmpeg -v error -y -i "$src" -vn -ac 2 -ar 48000 -t 46.6 -af "volume=15dB,aresample=192000,alimiter=limit=0.84:attack=3:release=80:level=disabled,aresample=48000,afade=t=out:st=44.2:d=1.4" "$pub/audio.wav"
# Pre-blurred vertical background plate (cheaper than a CSS blur per frame).
ffmpeg -v error -y -i "$pub/footage.mp4" -vf "scale=-2:1920,crop=1080:1920,gblur=sigma=38,eq=saturation=1.5:brightness=-0.06,fps=30" -c:v libx264 -crf 20 -preset slow -pix_fmt yuv420p "$pub/bg.mp4"
echo "public/ ready"
