"""Ep09 · أول كاميرا رقمية — Steven Sasson's Kodak prototype, December 1975 (approximate reconstruction).

Run:  blender -b --python series/camera-history/blender/ep09.py
Toaster-sized box (≈3.6 kg): movie-camera lens at the front, CCD behind it, a stack of circuit boards,
a digital cassette recorder on the side and a battery pack. Proportions are approximate (from public
descriptions/photographs); model ×5. The CCD and its charge transfer are built in Remotion.
"""
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from common import box, cyl, empty, finish, mat, plane, reset  # noqa: E402

reset()
shell = mat("shell", (0.62, 0.63, 0.65), rough=0.4, metal=0.6)
black = mat("black", (0.05, 0.05, 0.06), rough=0.5)
pcb = mat("pcb_green", (0.1, 0.35, 0.18), rough=0.6)
chip = mat("chip", (0.08, 0.08, 0.09), rough=0.3)
cass = mat("cassette", (0.85, 0.85, 0.82), rough=0.5)
glass = mat("glass", (0.6, 0.75, 0.9), rough=0.02, alpha=0.35)
gold = mat("gold", (0.9, 0.7, 0.3), rough=0.3, metal=1.0)
batt = mat("battery", (0.15, 0.25, 0.6), rough=0.5)

# outer shell split for the cutaway (top + right side removable)
box("shell_bottom", (1.2, 1.0, 0.03), (0, 0, 0.015), shell)
box("shell_left", (0.03, 1.0, 0.8), (-0.6, 0, 0.4), shell)
box("shell_front", (1.2, 0.03, 0.8), (0, -0.5, 0.4), shell)
box("shell_back", (1.2, 0.03, 0.8), (0, 0.5, 0.4), shell)
box("shell_top", (1.2, 1.0, 0.03), (0, 0, 0.8), shell)
box("shell_right", (0.03, 1.0, 0.8), (0.6, 0, 0.4), shell)
# lens (borrowed movie-camera lens) and the CCD behind it
cyl("lens", 0.13, 0.32, (-0.25, -0.66, 0.45), black, rot=(math.pi / 2, 0, 0))
cyl("lens_glass", 0.1, 0.01, (-0.25, -0.825, 0.45), glass, rot=(math.pi / 2, 0, 0))
box("ccd_package", (0.12, 0.02, 0.1), (-0.25, -0.42, 0.45), chip)
box("ccd_die", (0.05, 0.005, 0.05), (-0.25, -0.432, 0.45), gold)
empty("anchor_ccd", (-0.25, -0.435, 0.45))
# circuit boards stack
for k in range(5):
    y = -0.3 + k * 0.12
    box(f"pcb_{k}", (0.55, 0.012, 0.6), (-0.2, y, 0.4), pcb)
    for j in range(4):
        box(f"pcb_{k}_ic{j}", (0.08, 0.02, 0.04), (-0.38 + j * 0.12, y + 0.016, 0.3 + (j % 2) * 0.2), chip)
empty("anchor_boards", (-0.2, 0.0, 0.7))
# cassette recorder on the right side
box("deck", (0.42, 0.6, 0.32), (0.33, 0.05, 0.2), black)
box("cassette", (0.34, 0.22, 0.03), (0.33, 0.05, 0.38), cass)
for k, x in enumerate((0.26, 0.40)):
    cyl(f"reel_{k}", 0.035, 0.035, (x, 0.05, 0.39), black)
empty("anchor_cassette", (0.33, 0.05, 0.4))
# battery pack (16 AA cells)
for k in range(8):
    cyl(f"cell_{k}", 0.022, 0.1, (0.18 + (k % 4) * 0.06, -0.33 + (k // 4) * 0.06, 0.62), batt, rot=(0, math.pi / 2, 0))
empty("anchor_battery", (0.27, -0.3, 0.64))
box("table", (6, 6, 0.1), (0, 0, -0.05), mat("table", (0.25, 0.22, 0.2), rough=0.8))

finish("ep09", still_cam=(2.0, -2.4, 1.6), still_target=(0, 0, 0.4))
