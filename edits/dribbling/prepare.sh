#!/bin/bash
# Rebuild public/ from the uploaded clips (not committed: third-party footage).
# usage: prepare.sh <uploads_dir>
# Each segment: cut the video area out of the screen recording / CapCut
# export, crop to 16:9, conform to 1920x1080 @ 60 fps.
set -euo pipefail
up=$1
pub="$(cd "$(dirname "$0")" && pwd)/public"
seg() { # name file-prefix start dur crop
  local src; src=$(ls "$up"/$2-*)
  ffmpeg -v error -y -ss "$3" -t "$4" -i "$src" \
    -vf "crop=$5,crop='min(iw,ih*16/9)':'min(ih,iw*9/16)',scale=1920:1080:flags=lanczos,fps=60" -an \
    -c:v libx264 -crf 14 -preset veryfast -pix_fmt yuv420p "$pub/$1.mp4"
  echo "$1 <- $2 @ $3 +$4"
}
F=2732:1536:0:256
# 04 elastico
seg el1 2f3623bc 0.0 2.3 $F            # Rashford v Brighton by the corner flag
seg el2 6c93860e 0.0 2.6 $F            # Douglas Costa v Ajax
# 02 body feints
seg bf1 8dea0cf5 5.5 5.2 1440:810:0:134   # Neymar (Santos) v Joinville
seg bf2 8dea0cf5 2.0 1.7 1440:810:0:134   # Neymar (PSG) v Lorient
seg bf3 c11d7f08 1.2 2.4 2732:1216:0:416  # Ronaldo v Compostela, slow motion
# 01 stepovers
seg st1 f9d5e664 2.35 2.1 1440:764:0:158  # Ronaldinho v Atletico
seg st2 f9d5e664 0.0 2.3 1440:810:0:134   # PSG no.10 v red no.19
# 03 la croqueta
seg cq1 7b935886 1.05 2.2 2732:1224:0:412 # Iniesta, Champions League
# 05 fake shot
seg fs1 86906b76 3.0 2.8 $F            # Rashford v Brighton: shape to shoot, defender slides
seg fs2 8b00eead 4.95 2.4 $F           # Mahrez (Man City) v Burnley
# 06 roulette
seg ro1 661653b8 6.4 2.6 $F            # Sergio Ramos (PSG) v Benfica, sole drag and turn
seg ro2 7d8ae258 1.0 3.9 $F            # Spurs no.12 v Chelsea, turning away under pressure
# opening / finale extras
seg mx1 01cc1eed 0.0 1.7 $F            # Messi v Chelsea
seg mx2 677c16d7 10.2 2.5 1440:810:0:134  # Mahrez (Leicester) v Arsenal
# soundtrack: the reference's music with its voice-over removed
# (tools/edit-kit/instrumental.py, UVR MDX-Net). Local use only.
tmpd=$(mktemp -d)
ffmpeg -v error -y -i "$up/e1f66500-v24025gl0000dafvkmvog65ra6at1dag.mp4" -vn -ac 2 -ar 44100 -t 61.0 "$tmpd/ref.wav"
python3 -I "$(dirname "$0")/../../tools/edit-kit/instrumental.py" "$tmpd/ref.wav" "$tmpd/inst.wav"
ffmpeg -v error -y -i "$tmpd/inst.wav" -ar 48000 -af "afade=t=out:st=60.3:d=0.7" "$pub/music.wav"
rm -rf "$tmpd"
echo "public/ ready"
