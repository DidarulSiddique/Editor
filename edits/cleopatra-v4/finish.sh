#!/bin/bash
# frames + mix + captions -> out/cleopatra-v4.mp4 (-14 LUFS, -1.5 dBTP), then QA: black/freeze scan + contact sheet
set -e
cd "$(dirname "$0")"
mkdir -p out
python3 audio.py
python3 subs.py > subs.ass
ffmpeg -v error -y -i mix_raw.wav -af "loudnorm=I=-14:TP=-1.5:LRA=7,aresample=48000" -ar 48000 mix.wav
ffmpeg -v error -y -framerate 30 -i frames/f%04d.jpg -i mix.wav -map 0:v:0 -map 1:a:0 -vf "subtitles=subs.ass" \
  -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart out/cleopatra-v4.mp4
ffprobe -v error -show_entries format=duration -of csv=p=0 out/cleopatra-v4.mp4
ffmpeg -hide_banner -i out/cleopatra-v4.mp4 -vf "blackdetect=d=0.1:pix_th=0.06,freezedetect=n=0.002:d=0.6" -f null - 2>&1 | grep -E "black_start|freeze_start" || echo "QA: no black or frozen stretches"
ffmpeg -v error -y -i out/cleopatra-v4.mp4 -vf "fps=1/2,scale=216:-1,tile=8x5" -frames:v 1 out/qa_sheet.jpg
