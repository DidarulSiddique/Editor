#!/bin/bash
# Contact sheet of a video: frames at FPS, timestamped, tiled for review.
# usage: sheet.sh video.mp4 out.png [fps=2] [cols=8] [width=220] [start=0] [duration=all]
set -euo pipefail
in=$1; out=$2; fps=${3:-2}; cols=${4:-8}; width=${5:-220}; start=${6:-0}; dur=${7:-}
total=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$in")
span=${dur:-$(python3 -c "print($total - $start)")}
frames=$(python3 -c "import math; print(max(1, math.ceil($span * $fps)))")
rows=$(python3 -c "import math; print(math.ceil($frames / $cols))")
ffmpeg -v error -y -ss "$start" ${dur:+-t "$dur"} -i "$in" \
  -vf "fps=$fps,scale=$width:-1,drawtext=text='%{pts\:hms}':x=4:y=4:fontsize=14:fontcolor=yellow:box=1:boxcolor=black@0.6,tile=${cols}x${rows}" \
  -frames:v 1 "$out"
echo "$out: $frames frames, ${cols}x${rows}"
