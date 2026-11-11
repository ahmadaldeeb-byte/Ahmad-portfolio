#!/usr/bin/env bash
# Render camera-history episodes to out/series/ (H.264, yuv420p, bt709). Usage: bash series/camera-history/render-all.sh 02 03 …
set -uo pipefail
cd "$(dirname "$0")/../.."
declare -A ID=([01]=CH01-CameraObscura [02]=CH02-FirstPhotograph [03]=CH03-FirstHuman [04]=CH04-FirstNegative [05]=CH05-HorseInMotion [06]=CH06-KodakFilm [07]=CH07-FirstColor [08]=CH08-SLRMirror [09]=CH09-FirstDigital [10]=CH10-PhoneCamera)
declare -A SLUG=([01]=camera-obscura [02]=first-photograph [03]=first-human [04]=first-negative [05]=horse-in-motion [06]=kodak-film [07]=first-color [08]=slr-mirror [09]=first-digital [10]=phone-camera)
mkdir -p out/series
for ep in "$@"; do
  tag=$(python3 -c "import json;print('TEMP-VOICE' if json.load(open('public/vo/series/$ep.words.json')).get('temp') else 'FINAL-VOICE')")
  out="out/series/CH$ep-${SLUG[$ep]}-$tag.mp4"
  rm -f out/series/CH$ep-${SLUG[$ep]}-*.mp4
  echo "== $ep → $out"
  npx remotion render src/index.ts "${ID[$ep]}" "$out" --codec=h264 --crf=18 --pixel-format=yuv420p --color-space=bt709 --port=3500 --log=error 2>&1 | grep -v -E "404|Failed to load" | tail -3
  ffprobe -v error -show_entries stream=codec_type,width,height:format=duration -of compact "$out" | tr '\n' ' '; echo
done
