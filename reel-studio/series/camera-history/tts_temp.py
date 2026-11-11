#!/usr/bin/env python3
"""TEMPORARY Jordanian voice-over for the camera-history series (Piper TTS, voice ar_JO-kareem-medium).

Stand-in until the approved ElevenLabs voice (Hamid) is available. Every file it writes is marked
temporary: the words.json carries "temp": true and the episodes show a «صوت مؤقت» tag while it is used.

    npm run series:tts -- 02          # one episode
    npm run series:tts -- all         # all ten

Setup (once, git-ignored):  python3 -m venv .tts && .tts/bin/pip install piper-tts
The voice model is downloaded to .cache/piper/ on first run.

Each phrase (split at ؟ … . ، :) is synthesised on its own and joined with a pause that matches its
punctuation, so phrase starts are exact; words inside a phrase are spread by letter count.
Output: public/vo/series/<NN>.mp3 + public/vo/series/<NN>.words.json (same format as the gimbal reel).
"""
import json
import re
import subprocess
import sys
import urllib.request
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCRIPTS = ROOT / "series/camera-history/scripts"
OUT = ROOT / "public/vo/series/temp"
CACHE = ROOT / ".cache/piper"
VOICE = "ar_JO-kareem-medium"
HF = "https://huggingface.co/rhasspy/piper-voices/resolve/main/ar/ar_JO/kareem/medium/"
PAUSE = [("…", 0.42), ("؟", 0.42), (".", 0.5), (":", 0.3), ("،", 0.22), (",", 0.22)]
LENGTH_SCALE = 0.66  # brisk explainer pace; the approved take will replace these files
TASHKEEL = re.compile(r"[ً-ٰٟـ]")


def ensure_model() -> Path:
    CACHE.mkdir(parents=True, exist_ok=True)
    for name in (f"{VOICE}.onnx", f"{VOICE}.onnx.json"):
        p = CACHE / name
        if not p.exists():
            print(f"downloading {name} …")
            subprocess.run(["curl", "-sSfL", "-o", str(p), HF + name], check=True)
    return CACHE / f"{VOICE}.onnx"


def letters(w: str) -> int:
    return max(1, len(re.sub(r"[^\w]", "", TASHKEEL.sub("", w))))


def phrases(text: str):
    words = text.split()
    out, cur = [], []
    for w in words:
        cur.append(w)
        if re.search(r"[؟?…،,:.»]$", w):
            out.append(cur)
            cur = []
    if cur:
        out.append(cur)
    return out


def pause_after(word: str) -> float:
    w = word.rstrip("»")
    for mark, sec in PAUSE:
        if w.endswith(mark):
            return sec
    return 0.12


def synth(model: Path, text: str, wav: Path):
    piper = ROOT / ".tts/bin/piper"
    # piper reads digits/Latin poorly; scripts spell numbers out in Arabic
    subprocess.run([str(piper), "-m", str(model), "--length-scale", str(LENGTH_SCALE), "--sentence-silence", "0", "-f", str(wav)],
                   input=text.encode(), check=True, capture_output=True)


def trim_silence(frames: bytes, width: int, rate: int, thresh=500) -> bytes:
    import array
    a = array.array("h", frames)
    i0 = next((i for i, v in enumerate(a) if abs(v) > thresh), 0)
    i1 = len(a) - next((i for i, v in enumerate(reversed(a)) if abs(v) > thresh), 0)
    pad = int(0.02 * rate)
    return a[max(0, i0 - pad):min(len(a), i1 + pad)].tobytes()


def episode(nn: str):
    src = sorted(SCRIPTS.glob(f"{nn}-*.txt"))
    if not src:
        sys.exit(f"no script for episode {nn}")
    text = " ".join(src[0].read_text(encoding="utf-8").split())
    model = ensure_model()
    OUT.mkdir(parents=True, exist_ok=True)
    tmp = OUT / f"_{nn}"
    tmp.mkdir(exist_ok=True)
    rate = 22050
    pcm = b""
    t = 0.25  # short lead-in
    pcm += b"\x00\x00" * int(t * rate)
    words_out = []
    for k, ph in enumerate(phrases(text)):
        wav = tmp / f"{k:02d}.wav"
        synth(model, " ".join(ph), wav)
        with wave.open(str(wav)) as w:
            rate = w.getframerate()
            frames = trim_silence(w.readframes(w.getnframes()), 2, rate)
        dur = len(frames) / 2 / rate
        total = sum(letters(x) + 1.2 for x in ph)
        acc = 0.0
        for x in ph:
            s = t + dur * acc / total
            acc += letters(x) + 1.2
            words_out.append({"word": x, "start": round(s, 3), "end": round(t + dur * acc / total, 3)})
        pcm += frames
        t += dur
        gap = pause_after(ph[-1])
        pcm += b"\x00\x00" * int(gap * rate)
        t += gap
    pcm += b"\x00\x00" * int(0.3 * rate)
    full = tmp / "full.wav"
    with wave.open(str(full), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(rate)
        w.writeframes(pcm)
    mp3 = OUT / f"{nn}.mp3"
    # gentle EQ + loudness to sit like the gimbal take; mono 44.1 kHz mp3
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(full), "-af", "highpass=f=70,loudnorm=I=-18:TP=-2:LRA=7",
                    "-ar", "44100", "-c:a", "libmp3lame", "-q:a", "2", str(mp3)], check=True)
    for f in tmp.iterdir():
        f.unlink()
    tmp.rmdir()
    meta = {"text": text, "temp": True, "source": f"TEMP voice: Piper {VOICE} (Jordanian), phrase-timed", "words": words_out}
    (OUT / f"{nn}.words.json").write_text(json.dumps(meta, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"ep{nn}: {t + 0.3:.1f} s, {len(words_out)} words → public/vo/series/{nn}.mp3 (TEMP)")


if __name__ == "__main__":
    which = sys.argv[1] if len(sys.argv) > 1 else "all"
    for nn in ([f"{i:02d}" for i in range(1, 11)] if which == "all" else [which.zfill(2)]):
        episode(nn)
