"""Ep02 · أول صورة بالتاريخ — Niépce, Le Gras, 1826/27 (reconstruction).

Run:  blender -b --python series/camera-history/blender/ep02.py
Blender Z-up layout (metres): window wall on y=0, room interior y>0, courtyard outside y<0.
Named objects are animated from Remotion (src/series/ep02/Ep02.tsx); keep the names.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from common import box, cyl, empty, finish, gable, mat, plane, reset, sphere  # noqa: E402

reset()
plaster = mat("plaster", (0.78, 0.74, 0.66), rough=0.9)
stone = mat("stone", (0.62, 0.58, 0.5), rough=0.95)
wood = mat("wood", (0.36, 0.22, 0.12), rough=0.7)
wood_dark = mat("wood_dark", (0.2, 0.12, 0.07), rough=0.7)
brass = mat("brass", (0.72, 0.55, 0.25), rough=0.35, metal=1.0)
glass = mat("glass", (0.8, 0.9, 1.0), rough=0.05, alpha=0.15)
pewter = mat("pewter", (0.62, 0.62, 0.6), rough=0.35, metal=1.0)
bitumen = mat("bitumen", (0.24, 0.14, 0.05), rough=0.6)
image = mat("plate_image", (0.75, 0.72, 0.66), rough=0.5)  # Remotion maps the archive photo here
roof = mat("roof_tile", (0.42, 0.3, 0.24), rough=0.9)
leaf = mat("leaf", (0.22, 0.32, 0.16), rough=0.9)
ground = mat("ground", (0.4, 0.38, 0.3), rough=1.0)
oil = mat("lavender_oil", (0.75, 0.62, 0.85), rough=0.1, alpha=0.6)
velvet = mat("velvet", (0.12, 0.05, 0.06), rough=1.0)

# ── room ──────────────────────────────────────────────────────────────────────────────────────────
box("room_floor", (8, 6, 0.1), (0, 3, -0.05), wood_dark)
# window wall with an opening x∈[-0.6,0.6], z∈[1.0,2.2]
box("wall_left", (3.4, 0.3, 3.2), (-2.3, 0, 1.6), plaster)
box("wall_right", (3.4, 0.3, 3.2), (2.3, 0, 1.6), plaster)
box("wall_below", (1.2, 0.3, 1.0), (0, 0, 0.5), plaster)
box("wall_above", (1.2, 0.3, 1.0), (0, 0, 2.7), plaster)
box("window_sill", (1.4, 0.45, 0.06), (0, 0.08, 1.0), stone)
for i, x in enumerate((-0.6, 0.6)):
    box(f"window_jamb_{i}", (0.06, 0.32, 1.2), (x, 0, 1.6), wood)
box("window_head", (1.26, 0.32, 0.06), (0, 0, 2.2), wood)
# open casement (swung inward)
box("casement", (0.58, 0.04, 1.14), (-0.95, 0.4, 1.6), wood, rot=(0, 0, 0.9))

# ── Niépce's camera on the sill (wooden box, brass lens tube, plate holder at the back) ─────────────
cam = empty("camera_obscura", (0, 0.32, 1.22))
box("cam_body", (0.32, 0.46, 0.3), (0, 0.32, 1.22), wood, bevel=0.01)
box("cam_body_cut", (0.31, 0.45, 0.29), (0, 0.32, 1.22), wood_dark)  # inner shell shown in the cutaway
cyl("cam_lens", 0.06, 0.16, (0, 0.03, 1.22), brass, rot=(1.5708, 0, 0))
cyl("cam_lens_glass", 0.05, 0.005, (0, -0.05, 1.22), glass, rot=(1.5708, 0, 0))
box("plate_in_camera", (0.2, 0.012, 0.16), (0, 0.53, 1.22), pewter)
box("plate_in_camera_bitumen", (0.2, 0.004, 0.16), (0, 0.522, 1.22), bitumen)
empty("anchor_lens", (0, -0.05, 1.22))
empty("anchor_plate_in_camera", (0, 0.52, 1.22))

# ── work table with the hero plate and the lavender-oil tray ─────────────────────────────────────
box("table_top", (1.6, 0.9, 0.06), (2.6, 1.6, 0.8), wood)
for i, (x, y) in enumerate(((1.9, 1.25), (3.3, 1.25), (1.9, 1.95), (3.3, 1.95))):
    box(f"table_leg_{i}", (0.06, 0.06, 0.77), (x, y, 0.385), wood)
# plate: 20.3 × 16.5 cm pewter, bitumen layer, image layer (textured in Remotion)
box("plate_metal", (0.203, 0.165, 0.006), (2.3, 1.6, 0.836), pewter)
box("plate_bitumen", (0.203, 0.165, 0.002), (2.3, 1.6, 0.840), bitumen)
plane("plate_image", (0.2, 0.162), (2.3, 1.6, 0.8415), image)
empty("anchor_plate", (2.3, 1.6, 0.842))
# tray with lavender oil + white petroleum
box("tray", (0.34, 0.28, 0.04), (2.95, 1.6, 0.85), mat("tray", (0.85, 0.85, 0.82), rough=0.3))
plane("tray_oil", (0.3, 0.24), (2.95, 1.6, 0.865), oil)
cyl("oil_bottle", 0.04, 0.16, (3.25, 1.85, 0.91), mat("bottle", (0.35, 0.25, 0.45), rough=0.1, alpha=0.7))
empty("anchor_tray", (2.95, 1.6, 0.87))

# ── courtyard at Le Gras seen from the upstairs window ───────────────────────────────────────────
plane("courtyard_ground", (30, 30), (0, -12, -1.5), ground)
# left: pigeon-house (tall block, steep roof)
box("bld_pigeonhouse", (2.2, 2.2, 6.0), (-3.6, -7.5, 1.5), stone)
gable("bld_pigeonhouse_roof", 2.4, 2.4, 1.6, (-3.6, -7.5, 4.5), roof)
# centre: long barn with sloped roof
box("bld_barn", (6.0, 3.0, 3.0), (0.6, -11.5, 0.0), stone)
gable("bld_barn_roof", 6.2, 3.2, 1.4, (0.6, -11.5, 1.5), roof)
# right: bakehouse wing
box("bld_wing", (2.4, 5.0, 5.2), (4.2, -8.0, 1.1), stone)
gable("bld_wing_roof", 2.6, 5.2, 1.5, (4.2, -8.0, 3.7), roof)
# tree behind the barn
for i, (x, y, z, r) in enumerate(((-0.9, -14.0, 3.0, 1.4), (0.2, -14.6, 3.6, 1.2), (-1.8, -14.2, 2.6, 1.0))):
    sphere(f"tree_{i}", r, (x, y, z), leaf)
empty("anchor_courtyard", (0.6, -11.5, 2.4))
# sun (animated along an arc in Remotion)
sphere("sun", 0.8, (-8, -30, 10), mat("sun", (1, 0.9, 0.6), emit=(1, 0.85, 0.55), emit_strength=8))

# ── museum display (Harry Ransom Center, Austin) ─────────────────────────────────────────────────
box("case_base", (0.7, 0.5, 1.0), (-3.0, 2.6, 0.5), velvet)
box("case_glass", (0.6, 0.4, 0.5), (-3.0, 2.6, 1.25), glass)
box("plate_museum_frame", (0.3, 0.03, 0.26), (-3.0, 2.6, 1.22), mat("gilt", (0.6, 0.48, 0.25), rough=0.3, metal=1.0))
plane("plate_museum", (0.203, 0.165), (-3.0, 2.582, 1.22), image, rot=(1.5708, 0, 0))
empty("anchor_case", (-3.0, 2.58, 1.22))

finish("ep02", still_cam=(1.6, 4.2, 2.1), still_target=(0.2, 0.0, 1.3))
