#!/usr/bin/env bash
# Review previews (540×960, full length, with Hamid's voice) → out/preview/CHNN-preview.mp4. Not the final export.
set -uo pipefail
cd "$(dirname "$0")/../.."
declare -A ID=([01]=CH01-CameraObscura [02]=CH02-FirstPhotograph [03]=CH03-FirstHuman [04]=CH04-FirstNegative [05]=CH05-HorseInMotion [06]=CH06-KodakFilm [07]=CH07-FirstColor [08]=CH08-SLRMirror [09]=CH09-FirstDigital [10]=CH10-PhoneCamera)
mkdir -p out/preview
for ep in "$@"; do
  out="out/preview/CH$ep-preview.mp4"
  echo "== $ep"
  npx remotion render src/index.ts "${ID[$ep]}" "$out" --scale=0.5 --codec=h264 --crf=26 --pixel-format=yuv420p --port=3400 --log=error 2>&1 | grep -v -E "404|Failed to load" | tail -3
  ffprobe -v error -show_entries stream=codec_type:format=duration -of compact "$out" | tr '\n' ' '; echo
done
echo ALL DONE
