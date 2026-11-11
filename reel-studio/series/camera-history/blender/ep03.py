"""Ep03 · أول إنسان بصورة — Daguerre, Boulevard du Temple, Paris 1838 (reconstruction).

Run:  blender -b --python series/camera-history/blender/ep03.py
Zone A (x≈0): the boulevard seen from a high window, running diagonally away (like the original view).
Zone B (x≈20): the daguerreotype process — iodine box, mercury cabinet with spirit lamp, salt bath, case.
"""
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from common import box, cyl, empty, finish, gable, mat, plane, reset, sphere  # noqa: E402

reset()
stone = mat("stone", (0.7, 0.66, 0.58), rough=0.95)
stone2 = mat("stone2", (0.6, 0.57, 0.52), rough=0.95)
roof = mat("roof_slate", (0.32, 0.33, 0.36), rough=0.8)
road = mat("road", (0.45, 0.42, 0.36), rough=1.0)
walk = mat("sidewalk", (0.6, 0.58, 0.52), rough=1.0)
leaf = mat("leaf", (0.25, 0.32, 0.2), rough=0.9)
trunk = mat("trunk", (0.25, 0.2, 0.15), rough=0.9)
coat = mat("coat", (0.12, 0.12, 0.14), rough=0.8)
coat2 = mat("coat2", (0.3, 0.22, 0.16), rough=0.8)
skin = mat("skin", (0.75, 0.58, 0.46), rough=0.7)
wood = mat("wood", (0.36, 0.22, 0.12), rough=0.7)
copper = mat("copper", (0.72, 0.42, 0.26), rough=0.3, metal=1.0)
silver = mat("silver", (0.92, 0.92, 0.9), rough=0.08, metal=1.0)
iodine = mat("iodine_glass", (0.45, 0.2, 0.55), rough=0.1, alpha=0.5)
mercury = mat("mercury", (0.75, 0.76, 0.78), rough=0.05, metal=1.0)
flame = mat("flame", (1.0, 0.6, 0.2), emit=(1.0, 0.55, 0.15), emit_strength=6)
salt = mat("salt_water", (0.8, 0.88, 0.92), rough=0.05, alpha=0.5)
leather = mat("leather", (0.18, 0.08, 0.05), rough=0.6)
velvet = mat("velvet_red", (0.4, 0.05, 0.06), rough=1.0)
image = mat("plate_image", (0.8, 0.8, 0.78), rough=0.2, metal=0.6)

# ── A · the boulevard (road runs along the diagonal direction d) ──────────────────────────────────
ang = math.radians(35)
d = (math.sin(ang), math.cos(ang))  # unit vector along the boulevard (x, y)
n = (d[1], -d[0])  # across


def along(t, s=0.0):
    return (d[0] * t + n[0] * s, d[1] * t + n[1] * s)


plane("ground", (120, 120), (0, 30, -0.02), walk)
for i in range(1):
    pass
# road surface as a long plane rotated along d
plane("road", (12, 90), (*along(30, 0), 0.0), road, rot=(0, 0, -ang))
plane("sidewalk_l", (6, 90), (*along(30, -9), 0.01), walk, rot=(0, 0, -ang))
plane("sidewalk_r", (6, 90), (*along(30, 9), 0.01), walk, rot=(0, 0, -ang))
# building rows on both sides
for side, s0 in (("l", -16), ("r", 16)):
    for k in range(9):
        t = 4 + k * 8.5
        h = 11 + (k * 37 % 7)
        x, y = along(t, s0)
        b = box(f"bld_{side}{k}", (7.5, 8, h), (x, y, h / 2), stone if k % 2 else stone2, rot=(0, 0, -ang))
        r = gable(f"bld_{side}{k}_roof", 7.6, 8.2, 2.2, (x, y, h), roof)
        r.rotation_euler = (0, 0, -ang + math.pi / 2)
# rows of trees along both sidewalks
for side, s0 in (("l", -7.5), ("r", 7.5)):
    for k in range(10):
        x, y = along(3 + k * 7, s0)
        cyl(f"trunk_{side}{k}", 0.18, 3, (x, y, 1.5), trunk)
        sphere(f"tree_{side}{k}", 1.7, (x, y, 4.2), leaf, seg=12)
# pedestrians (capsule figures) and carriages — animated (and erased by the long exposure) in Remotion
for k in range(14):
    s = -8 + (k * 5.3 % 16) * 1.0
    x, y = along(6 + k * 4.2, s if abs(s) > 6 else s * 0.5)
    g = empty(f"ped_{k}", (x, y, 0))
    cyl(f"ped_{k}_body", 0.28, 1.25, (x, y, 0.85), coat if k % 2 else coat2, parent=None).parent = g
    sphere(f"ped_{k}_head", 0.18, (x, y, 1.65), skin).parent = g
for k in range(4):
    x, y = along(10 + k * 12, -2 + 4 * (k % 2))
    g = empty(f"carriage_{k}", (x, y, 0))
    box(f"carriage_{k}_box", (1.6, 2.6, 1.4), (x, y, 1.4), coat).parent = g
    for w in range(4):
        wx, wy = (x + (0.8 if w % 2 else -0.8) * n[0] + (1 if w < 2 else -1) * d[0], y + (0.8 if w % 2 else -0.8) * n[1] + (1 if w < 2 else -1) * d[1])
        cyl(f"carriage_{k}_wheel{w}", 0.55, 0.12, (wx, wy, 0.55), wood, rot=(0, math.pi / 2, -ang)).parent = g
    box(f"carriage_{k}_horse", (0.6, 1.8, 1.4), (x + 2.2 * d[0], y + 2.2 * d[1], 1.0), coat2).parent = g
# the man having his boots blacked (stands still) + the shoe-shiner (bent over)
mx, my = along(9, -6.6)
man = empty("man_still", (mx, my, 0))
cyl("man_leg_down", 0.12, 0.9, (mx, my, 0.45), coat).parent = man
cyl("man_leg_up", 0.12, 0.8, (mx + 0.25, my, 0.75), coat, rot=(0, 0.6, 0)).parent = man
cyl("man_body", 0.3, 0.9, (mx, my, 1.35), coat).parent = man
sphere("man_head", 0.19, (mx, my, 1.98), skin).parent = man
box("shine_stand", (0.4, 0.3, 0.5), (mx + 0.5, my, 0.25), wood).parent = man
shiner = empty("shoeshiner", (mx + 0.95, my, 0))
cyl("shiner_body", 0.28, 0.8, (mx + 0.95, my, 0.65), coat2, rot=(0, -0.7, 0)).parent = shiner
sphere("shiner_head", 0.17, (mx + 0.7, my, 1.05), skin).parent = shiner
empty("anchor_man", (mx, my, 2.0))
empty("anchor_street", (*along(25, 0), 0))

# ── B · process bench at x≈20 ────────────────────────────────────────────────────────────────────
ox = 20.0
box("bench", (3.2, 1.2, 0.08), (ox, 0, 0.9), wood)
# the plate: copper back + polished silver face + image layer (textured in Remotion)
plate = empty("plate", (ox - 1.0, 0, 1.28))
box("plate_copper", (0.216, 0.164, 0.004), (ox - 1.0, 0, 1.28), copper).parent = plate
box("plate_silver", (0.216, 0.164, 0.0015), (ox - 1.0, 0, 1.2829), silver).parent = plate
plane("plate_image", (0.21, 0.16), (ox - 1.0, 0, 1.2840), image).parent = plate
empty("anchor_plate", (ox - 1.0, 0, 1.285))
# iodine box (wooden box, iodine crystals in a dish under glass)
box("iodine_box", (0.4, 0.34, 0.32), (ox - 1.0, 0, 1.1), wood)
plane("iodine_glass", (0.36, 0.3), (ox - 1.0, 0, 1.262), iodine)
for k in range(9):
    sphere(f"iodine_vapor_{k}", 0.012, (ox - 1.0 + ((k * 7) % 9 - 4) * 0.035, ((k * 5) % 7 - 3) * 0.035, 1.27), mat("vapor_violet", (0.6, 0.3, 0.8), emit=(0.6, 0.3, 0.9), emit_strength=2, alpha=0.8), seg=8)
empty("anchor_iodine", (ox - 1.0, 0, 1.27))
# mercury cabinet: angled plate holder above a dish heated by a spirit lamp
box("mercury_cabinet", (0.38, 0.34, 0.5), (ox + 0.0, 0, 1.19), wood)
cyl("mercury_dish", 0.09, 0.03, (ox + 0.0, 0, 0.99), mercury)
cyl("spirit_lamp", 0.06, 0.1, (ox + 0.0, 0.0, 0.9 + 0.05 - 0.06), mat("glass_lamp", (0.7, 0.8, 0.8), rough=0.1, alpha=0.6))
sphere("lamp_flame", 0.025, (ox + 0.0, 0, 0.95), flame, seg=10)
empty("anchor_mercury", (ox + 0.0, 0, 1.45))
# salt bath
box("salt_tray", (0.34, 0.28, 0.04), (ox + 0.9, 0, 0.96), mat("tray", (0.85, 0.85, 0.82), rough=0.3))
plane("salt_water", (0.3, 0.24), (ox + 0.9, 0, 0.985), salt)
empty("anchor_salt", (ox + 0.9, 0, 0.99))
# leather case (open): base and lid
box("case_base", (0.26, 0.2, 0.025), (ox + 1.25, 0.35, 0.955), leather)
box("case_velvet", (0.24, 0.18, 0.004), (ox + 1.25, 0.35, 0.97), velvet)
box("case_lid", (0.26, 0.2, 0.025), (ox + 1.25, 0.56, 1.05), leather, rot=(1.2, 0, 0))
empty("anchor_case", (ox + 1.25, 0.35, 0.98))

finish("ep03", still_cam=(-14, -20, 22), still_target=(8, 18, 0))
