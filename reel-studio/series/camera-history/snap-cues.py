#!/usr/bin/env python3
"""Check mid-phrase cue words against the recording's energy envelope and write hand-style corrections.

    python3 series/camera-history/snap-cues.py 01 02 …   (then re-run manual-timing to apply)

For every cue in src/series/epNN/EpNN.tsx whose word is NOT the first of its phrase (phrase-initial cues
already sit on a real pause), look for a clear energy dip (word boundary) within ±0.22 s of the
estimated start; if found, record it in public/vo/series/NN.fixes.json as "word#occurrence": seconds.
Prints a review table so each change can be checked by ear in Studio.
"""
import json
import math
import re
import struct
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(Path(__file__).parent))
from importlib import util  # noqa: E402

spec = util.spec_from_file_location("handoff", Path(__file__).parent / "build-vo-handoff.py")
H = util.module_from_spec(spec)
spec.loader.exec_module(H)

WIN = 0.02


def envelope(mp3):
    pcm = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", str(mp3), "-f", "s16le", "-ac", "1", "-ar", "8000", "-"], capture_output=True, check=True).stdout
    n = len(pcm) // 2
    s = struct.unpack(f"<{n}h", pcm)
    w = int(8000 * WIN)
    return [20 * math.log10(math.sqrt(sum(x * x for x in s[i:i + w]) / w) + 1) - 90.3 for i in range(0, n - w, w)]


def dip_near(db, t, span=0.22):
    k0, k1 = int((t - span) / WIN), int((t + span) / WIN)
    best = None
    for k in range(max(3, k0), min(len(db) - 4, k1)):
        local = db[k - 3:k + 4]
        if db[k] == min(local) and max(db[k - 6:k + 7]) - db[k] > 8:
            if best is None or abs(k * WIN - t) < abs(best - t):
                best = k * WIN
    return best


def main(eps):
    for nn in eps:
        words_file = ROOT / f"public/vo/series/{nn}.words.json"
        d = json.loads(words_file.read_text(encoding="utf-8"))
        w = d["words"]
        src = (ROOT / f"src/series/ep{nn}/Ep{nn}.tsx").read_text(encoding="utf-8")
        block = src[src.index("export const CUES"): src.index("];", src.index("export const CUES"))]
        cues = re.findall(r"\['(\w+)', '([^']+)'\]", block)
        db = envelope(ROOT / f"public/vo/series/{nn}.mp3")
        fixes_file = ROOT / f"public/vo/series/{nn}.fixes.json"
        fixes = json.loads(fixes_file.read_text()) if fixes_file.exists() else {}
        print(f"── CH{nn}")
        i0 = 0
        for cid, phrase in cues:
            i = H.find(w, phrase, i0)
            i0 = i + 1
            phrase_initial = i == 0 or re.search(r"[؟?…،,:.»]$", w[i - 1]["word"])
            if phrase_initial:
                print(f"   {cid:12s} «{w[i]['word']}» {w[i]['start']:6.2f}s  (after a pause: exact)")
                continue
            occ = sum(1 for x in w[: i + 1] if x["word"] == w[i]["word"])
            t = w[i]["start"]
            dip = dip_near(db, t)
            if dip is not None and abs(dip - t) > 0.04:
                fixes[f"{w[i]['word']}#{occ}"] = round(dip + WIN / 2, 3)
                print(f"   {cid:12s} «{w[i]['word']}» {t:6.2f}s → {dip + WIN / 2:6.2f}s  (snapped to word boundary)")
            else:
                print(f"   {cid:12s} «{w[i]['word']}» {t:6.2f}s  {'(boundary confirmed)' if dip is not None else '(no clear boundary: estimate kept, check by ear)'}")
        fixes_file.write_text(json.dumps(fixes, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main(sys.argv[1:] or [f"{i:02d}" for i in range(1, 11)])
