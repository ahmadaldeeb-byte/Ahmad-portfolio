"""Ep04 · أول نيغاتيف — Talbot, the latticed window at Lacock Abbey, August 1835 (reconstruction).

Run:  blender -b --python series/camera-history/blender/ep04.py
Inside the South Gallery looking at the oriel window; Talbot's small "mousetrap" camera on a stand,
and a printing frame on the sill (negative over sensitised paper, printed by sunlight).
"""
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from common import box, cyl, empty, finish, mat, plane, reset  # noqa: E402

reset()
stone = mat("stone", (0.72, 0.68, 0.6), rough=0.95)
oak = mat("oak", (0.33, 0.22, 0.12), rough=0.7)
lead = mat("lead_came", (0.18, 0.18, 0.2), rough=0.5, metal=0.6)
glass = mat("glass", (0.85, 0.92, 1.0), rough=0.05, alpha=0.18)
brass = mat("brass", (0.72, 0.55, 0.25), rough=0.35, metal=1.0)
paper = mat("paper", (0.93, 0.9, 0.82), rough=0.9)
sky = mat("sky", (0.75, 0.85, 1.0), emit=(0.75, 0.85, 1.0), emit_strength=2.5)
floor_m = mat("floor", (0.3, 0.25, 0.2), rough=0.9)

# gallery wall (x across, z up), window opening x∈[-1.2,1.2], z∈[0.9,3.1] on y=0
box("floor", (8, 8, 0.1), (0, 3, -0.05), floor_m)
box("wall_l", (2.8, 0.5, 4.2), (-2.6, 0, 2.1), stone)
box("wall_r", (2.8, 0.5, 4.2), (2.6, 0, 2.1), stone)
box("wall_b", (2.4, 0.5, 0.9), (0, 0, 0.45), stone)
box("wall_t", (2.4, 0.5, 1.1), (0, 0, 3.65), stone)
box("sill", (2.5, 0.7, 0.06), (0, 0.15, 0.9), stone)
# stone mullions (3 lights) + transom
for i, x in enumerate((-0.4, 0.4)):
    box(f"mullion_{i}", (0.1, 0.4, 2.2), (x, 0, 2.0), stone)
box("transom", (2.4, 0.4, 0.1), (0, 0, 2.35), stone)
# diamond lattice of lead cames in each light, glass behind, bright sky outside
plane("sky_card", (8, 5), (0, -3, 2.0), sky, rot=(math.pi / 2, 0, 0))
for li, cx in enumerate((-0.8, 0.0, 0.8)):
    for ri, (z0, z1) in enumerate(((0.9, 2.3), (2.4, 3.1))):
        cz = (z0 + z1) / 2
        hgt = z1 - z0
        plane(f"glass_{li}{ri}", (0.7, hgt), (cx, 0.02, cz), glass, rot=(math.pi / 2, 0, 0))
        # diamond quarries: two families of diagonal cames, each line clipped to the light's rectangle
        sx, sz = 0.11, 0.17
        x0, x1, z0b, z1b = cx - 0.35, cx + 0.35, z0, z1
        for sgn in (1, -1):
            m = sgn * sz / sx
            for k in range(-40, 41):
                c0 = cz + k * sz  # line: z = c0 + m (x - cx)
                pts = []
                for x in (x0, x1):
                    z = c0 + m * (x - cx)
                    if z0b - 1e-6 <= z <= z1b + 1e-6:
                        pts.append((x, z))
                for z in (z0b, z1b):
                    x = cx + (z - c0) / m
                    if x0 - 1e-6 <= x <= x1 + 1e-6:
                        pts.append((x, z))
                pts = sorted(set((round(a, 5), round(b, 5)) for a, b in pts))
                if len(pts) < 2:
                    continue
                (ax, az), (bx, bz) = pts[0], pts[-1]
                L = math.hypot(bx - ax, bz - az)
                if L < 0.02:
                    continue
                box(f"came_{li}{ri}_{'a' if sgn > 0 else 'b'}{k}", (0.006, 0.01, L), ((ax + bx) / 2, 0.0, (az + bz) / 2), lead, rot=(0, math.atan2(bx - ax, bz - az), 0))
empty("anchor_window", (0, 0, 2.0))

# Talbot's "mousetrap" camera: small wooden box with a brass lens on a stand
box("mousetrap_body", (0.09, 0.09, 0.09), (0.2, 2.2, 1.35), oak, bevel=0.004)
cyl("mousetrap_lens", 0.018, 0.04, (0.2, 2.135, 1.35), brass, rot=(math.pi / 2, 0, 0))
cyl("stand_pole", 0.015, 1.3, (0.2, 2.2, 0.65), oak)
cyl("stand_foot", 0.15, 0.03, (0.2, 2.2, 0.015), oak)
plane("mousetrap_paper", (0.07, 0.07), (0.2, 2.243, 1.35), paper, rot=(math.pi / 2, 0, 0))
empty("anchor_camera", (0.2, 2.13, 1.35))
empty("anchor_paper", (0.2, 2.25, 1.35))

# printing frame on the sill: wooden frame, glass, negative, paper underneath (sunlight prints through)
box("print_frame", (0.22, 0.18, 0.025), (1.0, 0.35, 0.945), oak)
plane("print_paper", (0.17, 0.13), (1.0, 0.35, 0.959), paper)
plane("print_negative", (0.17, 0.13), (1.0, 0.35, 0.961), paper)
plane("print_glass", (0.19, 0.15), (1.0, 0.35, 0.963), glass)
empty("anchor_print", (1.0, 0.35, 0.965))

finish("ep04", still_cam=(1.2, 4.5, 1.8), still_target=(0, 0, 2.0))
