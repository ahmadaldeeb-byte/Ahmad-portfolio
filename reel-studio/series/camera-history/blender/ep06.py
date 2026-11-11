"""Ep06 · «اكبس الزر» — the original Kodak (1888) and how film records light (reconstruction).

Run:  blender -b --python series/camera-history/blender/ep06.py
Box camera ≈ 8.3 × 9.5 × 16.5 cm (3¼ × 3¾ × 6½ in): leather body, lens + rotating barrel shutter at the front,
supply spool → focal plane → take-up spool at the back (roll for 100 round exposures), winding key and
shutter-setting string on top. Lengths in metres; the model is built ×10 for comfortable camera moves.
"""
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from common import box, cyl, empty, finish, mat, plane, reset  # noqa: E402

reset()
S = 10.0  # scale factor (model at 10×)
leather = mat("leather", (0.06, 0.05, 0.045), rough=0.75)
inner = mat("inner_black", (0.03, 0.03, 0.03), rough=0.9)
brass = mat("brass", (0.72, 0.55, 0.25), rough=0.35, metal=1.0)
glass = mat("lens_glass", (0.5, 0.65, 0.8), rough=0.02, alpha=0.4)
wood = mat("spool_wood", (0.5, 0.35, 0.2), rough=0.6)
film = mat("film_emulsion", (0.78, 0.66, 0.45), rough=0.5)
paper = mat("backing_paper", (0.25, 0.08, 0.06), rough=0.7)
steel = mat("steel", (0.6, 0.6, 0.62), rough=0.3, metal=1.0)

L, W, H = 0.165 * S, 0.083 * S, 0.095 * S  # length (y), width (x), height (z)
# body shell split so the cutaway can open the top and one side
box("body_bottom", (W, L, 0.004 * S), (0, 0, 0.002 * S), leather)
box("body_top", (W, L, 0.004 * S), (0, 0, H - 0.002 * S), leather)
box("body_left", (0.004 * S, L, H), (-W / 2 + 0.002 * S, 0, H / 2), leather)
box("body_right", (0.004 * S, L, H), (W / 2 - 0.002 * S, 0, H / 2), leather)
box("body_front", (W, 0.004 * S, H), (0, -L / 2 + 0.002 * S, H / 2), leather)
box("body_back", (W, 0.004 * S, H), (0, L / 2 - 0.002 * S, H / 2), leather)
box("inner_partition", (W * 0.9, 0.003 * S, H * 0.9), (0, -L / 2 + 0.035 * S, H / 2), inner)
# lens and rotating barrel shutter (a cylinder with a slot, set by pulling the string)
cyl("lens_barrel", 0.012 * S, 0.02 * S, (0, -L / 2 - 0.006 * S, H / 2), brass, rot=(math.pi / 2, 0, 0))
cyl("lens_glass", 0.009 * S, 0.002 * S, (0, -L / 2 - 0.016 * S, H / 2), glass, rot=(math.pi / 2, 0, 0))
cyl("barrel_shutter", 0.016 * S, 0.03 * S, (0, -L / 2 + 0.018 * S, H / 2), steel)
box("barrel_slot", (0.004 * S, 0.034 * S, 0.012 * S), (0, -L / 2 + 0.018 * S, H / 2), inner)
empty("anchor_shutter", (0, -L / 2 + 0.018 * S, H / 2))
empty("anchor_lens", (0, -L / 2 - 0.016 * S, H / 2))
# film roll: supply spool (front-low) → across the focal plane (back) → take-up spool
cyl("spool_supply", 0.009 * S, W * 0.85, (0, L / 2 - 0.045 * S, 0.016 * S), wood, rot=(0, math.pi / 2, 0))
cyl("roll_supply", 0.014 * S, W * 0.8, (0, L / 2 - 0.045 * S, 0.016 * S), paper, rot=(0, math.pi / 2, 0))
cyl("spool_takeup", 0.009 * S, W * 0.85, (0, L / 2 - 0.045 * S, H - 0.016 * S), wood, rot=(0, math.pi / 2, 0))
cyl("roll_takeup", 0.011 * S, W * 0.8, (0, L / 2 - 0.045 * S, H - 0.016 * S), paper, rot=(0, math.pi / 2, 0))
plane("film_gate", (W * 0.8, H * 0.62), (0, L / 2 - 0.03 * S, H / 2), film, rot=(math.pi / 2, 0, 0))
empty("anchor_film", (0, L / 2 - 0.031 * S, H / 2))
empty("anchor_spool", (0, L / 2 - 0.045 * S, 0.016 * S))
# winding key on top, string pull
cyl("winding_key", 0.008 * S, 0.006 * S, (W * 0.25, L / 2 - 0.045 * S, H + 0.003 * S), brass)
box("winding_key_wing", (0.02 * S, 0.004 * S, 0.006 * S), (W * 0.25, L / 2 - 0.045 * S, H + 0.009 * S), brass)
cyl("string_pull", 0.003 * S, 0.012 * S, (0, -L / 2 + 0.03 * S, H + 0.006 * S), mat("string", (0.85, 0.8, 0.7), rough=0.9))
empty("anchor_key", (W * 0.25, L / 2 - 0.045 * S, H + 0.01 * S))
# a table to stand on
box("table", (6, 6, 0.1), (0, 0, -0.05), mat("table", (0.3, 0.22, 0.16), rough=0.8))

finish("ep06", still_cam=(2.6, -2.4, 1.8), still_target=(0, 0, 0.45))
