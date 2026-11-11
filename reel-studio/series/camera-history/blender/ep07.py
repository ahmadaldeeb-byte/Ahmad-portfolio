"""Ep07 · أول صورة ملوّنة — Maxwell & Sutton's three-colour projection (1861) → Bayer filter (1976).

Run:  blender -b --python series/camera-history/blender/ep07.py
Zone A: three magic lanterns side by side, each with its colour filter (red / green / blue), aimed at one screen.
Zone B (x≈30): a modern image-sensor package; the Bayer mosaic itself is generated in Remotion.
"""
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from common import box, cyl, empty, finish, mat, plane, reset  # noqa: E402

reset()
wood = mat("lantern_wood", (0.3, 0.2, 0.12), rough=0.6)
brass = mat("brass", (0.72, 0.55, 0.25), rough=0.35, metal=1.0)
screen = mat("screen", (0.85, 0.85, 0.85), rough=0.95)
floor = mat("floor", (0.12, 0.11, 0.1), rough=0.9)
ceramic = mat("ceramic", (0.75, 0.72, 0.66), rough=0.6)
silicon = mat("silicon", (0.16, 0.18, 0.24), rough=0.25, metal=0.5)
gold = mat("gold_pads", (0.9, 0.7, 0.3), rough=0.3, metal=1.0)
glass = mat("cover_glass", (0.8, 0.9, 1.0), rough=0.02, alpha=0.2)
filters = {"red": (0.9, 0.05, 0.05), "green": (0.05, 0.75, 0.15), "blue": (0.1, 0.2, 0.95)}

box("floor", (12, 12, 0.1), (0, 2, -0.05), floor)
plane("screen", (3.2, 2.4), (0, 6.0, 1.6), screen, rot=(math.pi / 2, 0, 0))
empty("anchor_screen", (0, 5.98, 1.6))
for i, (name, col) in enumerate(filters.items()):
    x = (i - 1) * 0.7
    box(f"lantern_{name}", (0.42, 0.5, 0.5), (x, 0, 1.1), wood, bevel=0.01)
    cyl(f"lantern_{name}_chimney", 0.06, 0.25, (x, -0.05, 1.47), brass)
    cyl(f"lantern_{name}_lens", 0.09, 0.22, (x, 0.35, 1.12), brass, rot=(math.pi / 2, 0, 0))
    cyl(f"filter_{name}", 0.1, 0.012, (x, 0.47, 1.12), mat(f"filter_{name}", col, rough=0.1, alpha=0.75, emit=col, emit_strength=0.6), rot=(math.pi / 2, 0, 0))
    empty(f"anchor_filter_{name}", (x, 0.48, 1.12))
    box(f"stand_{name}", (0.5, 0.6, 0.85), (x, 0, 0.425), wood)

# sensor package (zone B): ceramic body, gold pads, silicon die, cover glass
ox = 30.0
box("sensor_body", (1.2, 1.0, 0.12), (ox, 0, 0.06), ceramic)
for k in range(10):
    box(f"pad_t{k}", (0.05, 0.08, 0.01), (ox - 0.45 + k * 0.1, 0.46, 0.125), gold)
    box(f"pad_b{k}", (0.05, 0.08, 0.01), (ox - 0.45 + k * 0.1, -0.46, 0.125), gold)
box("sensor_die", (0.72, 0.54, 0.02), (ox, 0, 0.13), silicon)
box("sensor_glass", (0.86, 0.68, 0.01), (ox, 0, 0.2), glass)
empty("anchor_die", (ox, 0, 0.14))

finish("ep07", still_cam=(2.4, -3.0, 2.2), still_target=(0, 2.5, 1.2))
