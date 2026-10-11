#!/bin/bash
# Rebuild public/ from the original uploads.
# usage: prepare.sh <uploads_dir>
# Expects the screen recordings, photos and reference TikTok named as they
# were uploaded (see README). Footage and photos are not committed.
set -euo pipefail
up=$1
here=$(cd "$(dirname "$0")" && pwd)
kit="$here/../../tools/edit-kit"
pub="$here/public"
tmp=$(mktemp -d)

# 1. Footage: cut the video area out of each iPad screen recording, drop the
#    lock-screen/Control Centre frames, conform to 1920x1080 @ 60 fps.
norm() { # n src start end crop
  ffmpeg -v error -y -ss "$3" -to "$4" -i "$up/$2" \
    -vf "crop=$5,scale=1920:1080:flags=lanczos,fps=60" -an \
    -c:v libx264 -crf 14 -preset veryfast -pix_fmt yuv420p "$pub/n$1.mp4"
}
norm 2 5c8135d0-ScreenRecording_10-11-2026_20-29-27_1.mp4 0.9 10.7 2732:1536:0:256
norm 3 26c11841-ScreenRecording_10-11-2026_20-37-10_1.mp4 0.9 11.8 2664:1498:34:254
norm 4 ee66a409-ScreenRecording_10-11-2026_20-36-36_1.mp4 0.9 9.5 2664:1498:34:250
norm 5 c7ccacf4-ScreenRecording_10-11-2026_20-36-07_1.mp4 0.9 15.2 2664:1498:34:250

# 2. Photos: ESRGAN 2x + background-removal cut-outs.
for p in 785a0283 1ffe19d4 d735f99e 1fa6cf3b 17d36584 12fbf6b3; do cp "$up/$p-image.jpg" "$tmp/$p.jpg"; done
"$kit/prep-stills.sh" "$pub" "$tmp"/785a0283.jpg "$tmp"/1ffe19d4.jpg "$tmp"/d735f99e.jpg "$tmp"/1fa6cf3b.jpg "$tmp"/17d36584.jpg "$tmp"/12fbf6b3.jpg

# 3. Freeze-frame sticker (clip 3 at 4.0 s) and its cut-out.
ffmpeg -v error -y -ss 4.0 -i "$pub/n3.mp4" -frames:v 1 "$pub/freeze-4.0.png"
node "$kit/cutout.js" "$HOME/.cache/edit-kit/node_modules" "$pub/freeze-4.0.png:$pub/freeze-4.0-cut.png"

# 4. Soundtrack: the reference's song (local use only; add the official
#    sound in-app when posting).
ffmpeg -v error -y -i "$up/ac1c2a70-v14044g50000d8mjtb7og65mkjqtpbog.mp4" -vn -ac 2 -t 11.0 \
  -af "afade=t=out:st=10.4:d=0.6" "$pub/song.wav"

rm -rf "$tmp"
echo "public/ ready"
