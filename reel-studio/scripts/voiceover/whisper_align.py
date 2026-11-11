#!/usr/bin/env python3
"""Local word timings for an Arabic voice-over (faster-whisper), in Reel Studio's words.json format.

    .venv/bin/python scripts/voiceover/whisper_align.py --audio rec.mp3|rec.wav \
        --text-file scripts/voiceover/gimbal-hook.txt --out vo/gimbal-hook [--model small] [--cues "هون" "محور الميل"]

Writes public/<out>.mp3 (WAV is converted with ffmpeg) and public/<out>.words.json.
The words are the APPROVED text's words (so cue matching is exact); their times come from Whisper's
word timestamps, mapped onto the approved text character by character (difflib), so dialect misreads,
split words (ب محور) or merged words do not shift the cues. Unmatched characters are interpolated.
Setup once:  python3 -m venv .venv && .venv/bin/pip install faster-whisper
"""
import argparse
import difflib
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TASHKEEL = re.compile(r"[ؐ-ًؚ-ٰٟۖ-ۭـ]")
PUNCT = re.compile(r"[؟،؛.,!?:;…\"'«»()\-–—\s]")


def norm(s: str) -> str:
    s = TASHKEEL.sub("", s)
    s = PUNCT.sub("", s)
    s = re.sub("[آأإٱ]", "ا", s)
    return s.replace("ى", "ي").replace("ة", "ه")


def char_times(words):
    """Whisper words -> (normalised chars, per-char (start, end)) spreading each word's span evenly."""
    chars, times = [], []
    for w in words:
        n = norm(w["word"])
        if not n:
            continue
        d = (w["end"] - w["start"]) / len(n)
        for i, c in enumerate(n):
            chars.append(c)
            times.append((w["start"] + i * d, w["start"] + (i + 1) * d))
    return "".join(chars), times


def align(target_words, whisper_words):
    src, src_t = char_times(whisper_words)
    tgt = [norm(w) for w in target_words]
    tgt_chars = "".join(tgt)
    t = [None] * len(tgt_chars)
    for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(None, src, tgt_chars, autojunk=False).get_opcodes():
        if tag == "equal":
            for k in range(i2 - i1):
                t[j1 + k] = src_t[i1 + k]
        elif tag == "replace" and i2 > i1:  # same region, different letters (dialect): spread proportionally
            s0, s1 = src_t[i1][0], src_t[i2 - 1][1]
            n = j2 - j1
            for k in range(n):
                t[j1 + k] = (s0 + (s1 - s0) * k / n, s0 + (s1 - s0) * (k + 1) / n)
    # interpolate gaps (inserted chars) between known neighbours
    known = [i for i, v in enumerate(t) if v]
    if not known:
        raise SystemExit("alignment failed: no characters matched — is the text right?")
    for i in range(len(t)):
        if t[i]:
            continue
        prev = max((k for k in known if k < i), default=None)
        nxt = min((k for k in known if k > i), default=None)
        a = t[prev][1] if prev is not None else t[nxt][0]
        b = t[nxt][0] if nxt is not None else t[prev][1]
        lo = prev if prev is not None else i - 1
        hi = nxt if nxt is not None else i + 1
        f0 = (i - lo - 1) / max(1, hi - lo - 1)
        f1 = (i - lo) / max(1, hi - lo - 1)
        t[i] = (a + (b - a) * f0, a + (b - a) * min(1, f1))
    out, k = [], 0
    for w, n in zip(target_words, tgt):
        span = t[k : k + len(n)] if n else [t[min(k, len(t) - 1)]]
        out.append({"word": w, "start": round(span[0][0], 3), "end": round(span[-1][1], 3)})
        k += len(n)
    return out


def silences(path: Path, below_peak_db: float = 32.0, min_dur: float = 0.07):
    """Pauses in the recording (ffmpeg silencedetect, threshold relative to the peak level)."""
    vd = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(path), "-af", "volumedetect", "-f", "null", "-"], capture_output=True, text=True).stderr
    m = re.search(r"max_volume: (-?[\d.]+) dB", vd)
    peak = float(m.group(1)) if m else 0.0
    sd = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(path), "-af", f"silencedetect=noise={peak - below_peak_db}dB:d={min_dur}", "-f", "null", "-"],
                        capture_output=True, text=True).stderr
    starts = [float(x) for x in re.findall(r"silence_start: (-?[\d.]+)", sd)]
    ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", sd)]
    return list(zip(starts, ends + [float("inf")] * (len(starts) - len(ends))))


def snap(words, pauses):
    """Whisper hands the pause before a word to that word: move starts to the end of an overlapping
    pause and ends to the start of one, so cue frames land on the real onset."""
    for w in words:
        for s0, s1 in pauses:
            if s0 <= w["start"] < s1 < w["end"]:
                w["start"] = round(s1, 3)
            if w["start"] < s0 < w["end"] <= s1 + 0.05:
                w["end"] = round(s0, 3)
    return words


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--audio", required=True)
    ap.add_argument("--text-file")
    ap.add_argument("--text")
    ap.add_argument("--out", default="vo/voiceover")
    ap.add_argument("--model", default="small", help="tiny|base|small|medium|large-v3|large-v3-turbo")
    ap.add_argument("--cues", nargs="*", default=["هون", "محور الميل"])
    a = ap.parse_args()
    text = (Path(ROOT, a.text_file).read_text(encoding="utf-8") if a.text_file else a.text or "").strip()
    if not text:
        sys.exit("give --text-file or --text (the approved script)")
    src = Path(a.audio).resolve()
    out = ROOT / "public" / a.out
    out.parent.mkdir(parents=True, exist_ok=True)
    mp3 = out.with_suffix(".mp3")
    if src.suffix.lower() == ".mp3":
        if src != mp3:
            shutil.copyfile(src, mp3)
    else:  # wav/m4a/... -> mp3 for the Remotion <Audio>
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(src), "-c:a", "libmp3lame", "-q:a", "2", str(mp3)], check=True)

    from faster_whisper import WhisperModel

    model = WhisperModel(a.model, device="cpu", compute_type="int8")
    # decode with ffmpeg (16 kHz mono float32): avoids PyAV version clashes, accepts mp3/wav/m4a
    import numpy as np

    pcm = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", str(src), "-f", "f32le", "-ac", "1", "-ar", "16000", "-"], check=True, capture_output=True).stdout
    audio = np.frombuffer(pcm, dtype=np.float32)
    segments, info = model.transcribe(
        audio, language="ar", word_timestamps=True, initial_prompt=text, beam_size=5,
        condition_on_previous_text=False, vad_filter=False,
    )
    ww = [{"word": w.word.strip(), "start": w.start, "end": w.end} for s in segments for w in (s.words or [])]
    heard = " ".join(w["word"] for w in ww)
    words = snap(align(text.split(), ww), silences(mp3))
    match = difflib.SequenceMatcher(None, norm(heard), norm(text), autojunk=False).ratio()
    json.dump(
        {"text": text, "source": f"local faster-whisper:{a.model} + char alignment", "heard": heard, "match": round(match, 3),
         "duration": round(info.duration, 3), "words": words},
        open(out.with_name(out.name + ".words.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1,
    )
    print(f"heard  : {heard}\nmatch  : {match:.2f} (approved text vs what Whisper heard)")
    for w in words:
        print(f"  {w['start']:6.2f}–{w['end']:5.2f}  {w['word']}")
    for cue in a.cues:
        c = cue.split()
        for i in range(len(words) - len(c) + 1):
            if all(norm(words[i + k]["word"]).endswith(norm(x)) for k, x in enumerate(c)):
                print(f"cue «{cue}» starts at {words[i]['start']:.2f}s (word «{words[i]['word']}») → frame {round(words[i]['start'] * 30)} + voiceFrom")
                break
        else:
            print(f"! cue «{cue}» not found")
    if match < 0.6:
        print("! low match: check the recording says the approved text, or try --model medium / large-v3")
    print(f"→ public/{a.out}.mp3 + public/{a.out}.words.json")


if __name__ == "__main__":
    main()
