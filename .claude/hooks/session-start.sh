#!/bin/bash
# Sets up the video-editing toolchain in Claude Code cloud sessions:
# HyperFrames + whisper.cpp, Remotion, and the YouTube automation agent.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

git submodule update --init --depth 1

# HyperFrames. bun rewrites upstream's bun.lock; restore it so the submodule stays clean.
(cd hyperframes && bun install && git checkout -- bun.lock && bun run build)

# whisper.cpp, built where HyperFrames looks for it.
WHISPER_DIR="$HOME/.cache/hyperframes/whisper"
mkdir -p "$WHISPER_DIR/models"
if [ ! -x "$WHISPER_DIR/whisper.cpp/build/bin/whisper-cli" ]; then
  rm -rf "$WHISPER_DIR/whisper.cpp"
  git clone --depth 1 https://github.com/ggml-org/whisper.cpp.git "$WHISPER_DIR/whisper.cpp"
  cmake -S "$WHISPER_DIR/whisper.cpp" -B "$WHISPER_DIR/whisper.cpp/build" -DCMAKE_BUILD_TYPE=Release
  cmake --build "$WHISPER_DIR/whisper.cpp/build" -j"$(nproc)" --config Release --target whisper-cli
fi
# The model host (huggingface.co) may be blocked by the network policy; don't fail the hook.
MODEL="$WHISPER_DIR/models/ggml-small.en.bin"
if [ ! -s "$MODEL" ]; then
  curl -sSfL -o "$MODEL.part" https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.en.bin \
    && mv "$MODEL.part" "$MODEL" \
    || { rm -f "$MODEL.part"; echo "warning: could not download Whisper model (is huggingface.co allowed?)" >&2; }
fi

# Remotion. A couple of optional packages and the sample-media download are blocked
# by the network policy, so install/build failures there are not fatal.
(cd remotion && bun install || true)
(cd remotion && TURBO_TELEMETRY_DISABLED=1 bunx turbo run make \
  --filter='!@remotion/media-parser' --filter='!@remotion/webcodecs' \
  --filter='!docs' --filter='!@remotion/it-tests' \
  --continue --no-update-notifier || true)

# YouTube automation agent.
(cd youtube-automation-agent && npm install --no-audit --no-fund)
