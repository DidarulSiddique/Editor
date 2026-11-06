#!/bin/bash
# encode frames + mix + captions -> out/cleopatra.mp4 (mastered to -14 LUFS)
set -e
cd "$(dirname "$0")"
mkdir -p out
python3 subs.py > subs.ass
ffmpeg -v error -y -i mix_raw.wav -af "loudnorm=I=-14:TP=-1.5:LRA=7,aresample=48000" -ar 48000 mix.wav
ffmpeg -v error -y -framerate 30 -i frames/f%04d.jpg -i mix.wav -map 0:v:0 -map 1:a:0 \
  -vf "subtitles=subs.ass:fontsdir=/home/user/Editor/edits/motion-kit/public/fonts" \
  -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart out/cleopatra.mp4
ls -la out/cleopatra.mp4
