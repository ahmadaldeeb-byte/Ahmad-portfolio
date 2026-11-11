"""Ep10 · كاميرا الموبايل — voice-coil camera module with lens-shift OIS and autofocus (reconstruction).

Run:  blender -b --python series/camera-history/blender/ep10.py
Zone A: the phone (×10). Zone B (x≈20): the camera module enlarged ×100 and exploded along Z — cover glass,
lens barrel on a carrier wrapped by the AF coil, four magnets in the housing, leaf springs, sensor on its board,
and the gyroscope on the main board. Lens-shift OIS is shown (sensor-shift designs also exist).
"""
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from common import box, cyl, empty, finish, mat, plane, reset  # noqa: E402

reset()
alu = mat("aluminium", (0.55, 0.56, 0.6), rough=0.3, metal=1.0)
glass = mat("glass", (0.6, 0.75, 0.9), rough=0.02, alpha=0.3)
screen = mat("screen", (0.02, 0.02, 0.03), rough=0.1)
black = mat("black", (0.05, 0.05, 0.06), rough=0.4)
copper = mat("copper", (0.85, 0.45, 0.22), rough=0.3, metal=1.0)
magnet = mat("magnet", (0.45, 0.47, 0.52), rough=0.25, metal=0.9)
spring = mat("spring_steel", (0.75, 0.76, 0.8), rough=0.2, metal=1.0)
sensor = mat("sensor", (0.12, 0.15, 0.3), rough=0.2, metal=0.5)
pcb = mat("pcb", (0.1, 0.32, 0.18), rough=0.6)
chip = mat("chip", (0.08, 0.08, 0.09), rough=0.3)

# ── A · phone (75 × 155 × 8 mm, ×10) lying face-down so the camera bump shows ──────────────────────
phone = empty("phone", (0, 0, 0.5))
box("phone_body", (0.75, 1.55, 0.08), (0, 0, 0.5), alu, bevel=0.03).parent = phone
box("phone_screen", (0.72, 1.52, 0.004), (0, 0, 0.458), screen).parent = phone
box("camera_bump", (0.26, 0.26, 0.02), (-0.18, 0.5, 0.55), alu, bevel=0.01).parent = phone
cyl("bump_lens", 0.05, 0.012, (-0.22, 0.56, 0.565), black).parent = phone
cyl("bump_lens_glass", 0.04, 0.004, (-0.22, 0.56, 0.572), glass).parent = phone
empty("anchor_bump", (-0.22, 0.56, 0.575))

# ── B · module ×100 (≈ 10 mm cube → 1 m), exploded upward ─────────────────────────────────────────
ox = 20.0
box("mod_board", (1.6, 1.6, 0.06), (ox, 0, 0.03), pcb)
box("mod_sensor", (0.62, 0.48, 0.04), (ox, 0, 0.09), sensor)
empty("anchor_sensor", (ox, 0, 0.11))
box("gyro_chip", (0.18, 0.18, 0.06), (ox + 0.6, -0.55, 0.09), chip)
empty("anchor_gyro", (ox + 0.6, -0.55, 0.13))
# housing walls with four magnets
for k, (dx, dy, sx, sy) in enumerate(((0.55, 0, 0.06, 1.1), (-0.55, 0, 0.06, 1.1), (0, 0.55, 1.1, 0.06), (0, -0.55, 1.1, 0.06))):
    box(f"housing_{k}", (sx, sy, 0.7), (ox + dx, dy, 0.6), alu)
    box(f"magnet_{k}", (sx * 1.6 if sx < 0.1 else 0.5, sy * 1.6 if sy < 0.1 else 0.5, 0.36), (ox + dx * 0.86, dy * 0.86, 0.6), magnet)
empty("anchor_magnet", (ox + 0.47, 0, 0.6))
# lens carrier: barrel + elements + AF coil wound around it; leaf springs top/bottom
carrier = empty("lens_carrier", (ox, 0, 0.62))
cyl("lens_barrel", 0.28, 0.5, (ox, 0, 0.62), black).parent = carrier
for k, z in enumerate((0.42, 0.55, 0.68, 0.81)):
    cyl(f"lens_el_{k}", 0.22 - k * 0.02, 0.025, (ox, 0, z), glass).parent = carrier
bpy_coil = cyl("af_coil", 0.33, 0.16, (ox, 0, 0.62), copper)
bpy_coil.parent = carrier
for k, z in enumerate((0.36, 0.9)):
    box(f"leaf_spring_{k}", (0.9, 0.9, 0.01), (ox, 0, z), spring)
empty("anchor_coil", (ox + 0.33, 0, 0.62))
empty("anchor_lens", (ox, 0, 0.88))
box("cover_glass", (1.2, 1.2, 0.02), (ox, 0, 1.05), glass)

finish("ep10", still_cam=(ox + 2.0, -2.4, 2.0), still_target=(ox, 0, 0.55))
