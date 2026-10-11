#!/bin/bash
# Upscale photos 2x (ESRGAN) and cut out the subject (background removal).
# usage: prep-stills.sh out_dir photo1.jpg [photo2.png ...]
# Writes <name>.png (upscaled) and <name>-cut.png (transparent cut-out) to
# out_dir. Dependencies install once into ~/.cache/edit-kit (npm only).
set -euo pipefail
here=$(cd "$(dirname "$0")" && pwd)
out=$1; shift
mkdir -p "$out"
deps="$HOME/.cache/edit-kit"
if [ ! -d "$deps/node_modules/@imgly/background-removal-node" ]; then
  mkdir -p "$deps"
  (cd "$deps" && npm init -y >/dev/null && npm install --no-audit --no-fund \
    upscaler @upscalerjs/esrgan-medium @tensorflow/tfjs-node @imgly/background-removal-node@1.4.5 >/dev/null)
fi
up=(); cut=()
for f in "$@"; do
  name=$(basename "${f%.*}")
  up+=("$f:$name.png")
  cut+=("$out/$name.png:$out/$name-cut.png")
done
(cd "$out" && node "$here/upscale.js" "$deps/node_modules" . "${up[@]}" 2>&1 | grep -v "tensorflow/core\|oneDNN\|rebuild Tensor\|AVX\|Deprecation\|trace-deprecation\|Platform node")
node "$here/cutout.js" "$deps/node_modules" "${cut[@]}"
