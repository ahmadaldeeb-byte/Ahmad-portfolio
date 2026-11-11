"""Ep01 · الغرفة المعتمة — camera obscura: a dark room with a small hole (reconstruction).

Run:  blender -b --python series/camera-history/blender/ep01.py
Room interior y∈[0,4] (hole wall at y=0, back wall at y=4), outside y<0 with a tree, a house and the sun.
Also renders, with Cycles, what the hole "sees" (the outside view) → public/renders/ep01-outside.png;
Remotion shows that render upside-down on the back wall.
"""
import math
import sys
from pathlib import Path

import bpy

sys.path.insert(0, str(Path(__file__).parent))
from common import ROOT, box, cyl, empty, finish, gable, mat, plane, reset, sphere  # noqa: E402

reset()
wall = mat("wall_dark", (0.16, 0.15, 0.14), rough=0.95)
wall_in = mat("wall_inner", (0.82, 0.8, 0.76), rough=0.95)
grass = mat("grass", (0.32, 0.5, 0.22), rough=1.0)
trunk = mat("trunk", (0.32, 0.22, 0.14), rough=0.9)
leaf = mat("leaf", (0.2, 0.45, 0.18), rough=0.9)
house = mat("house", (0.85, 0.75, 0.6), rough=0.9)
roof = mat("roof", (0.6, 0.18, 0.12), rough=0.8)
sky = mat("sky", (0.55, 0.75, 1.0), emit=(0.55, 0.75, 1.0), emit_strength=1.2)

# room: floor, roof, side walls, back wall (screen), front wall with a hole at (0, 0, 1.5)
box("room_floor", (4.2, 4.2, 0.1), (0, 2, -0.05), wall)
box("room_roof", (4.2, 4.2, 0.1), (0, 2, 3.05), wall)
box("wall_side_l", (0.1, 4.2, 3.0), (-2.05, 2, 1.5), wall)
box("wall_side_r", (0.1, 4.2, 3.0), (2.05, 2, 1.5), wall)
box("wall_back", (4.2, 0.1, 3.0), (0, 4.05, 1.5), wall_in)
# front wall made of four blocks around a 10 cm square hole
H = 0.05
box("wall_front_l", (2.1 - H, 0.1, 3.0), (-(2.1 + H) / 2, 0, 1.5), wall)
box("wall_front_r", (2.1 - H, 0.1, 3.0), ((2.1 + H) / 2, 0, 1.5), wall)
box("wall_front_t", (2 * H, 0.1, 1.5 - H), (0, 0, 1.5 + H + (1.5 - H) / 2), wall)
box("wall_front_b", (2 * H, 0.1, 1.5 - H), (0, 0, (1.5 - H) / 2), wall)
empty("anchor_hole", (0, 0, 1.5))
empty("anchor_screen", (0, 3.99, 1.5))

# outside
plane("ground_out", (60, 40), (0, -20, -0.01), grass)
cyl("tree_trunk", 0.2, 2.4, (0.0, -7, 1.2), trunk)
for k, (x, z, r) in enumerate(((0, 3.2, 1.4), (-0.8, 2.8, 1.0), (0.8, 2.9, 1.0))):
    sphere(f"tree_leaf_{k}", r, (x, -7, z), leaf)
empty("anchor_tree_top", (0, -7, 4.4))
empty("anchor_tree_base", (0, -7, 0.05))
box("house", (3, 2.5, 2.2), (-4.5, -12, 1.1), house)
gable("house_roof", 3.2, 2.7, 1.3, (-4.5, -12, 2.2), roof)
sphere("sun", 0.9, (5, -25, 9), mat("sun", (1, 0.9, 0.6), emit=(1, 0.9, 0.6), emit_strength=10))
plane("sky_card", (80, 30), (0, -30, 10), sky, rot=(math.pi / 2, 0, 0))


def render_outside():
    """What the hole sees: camera at the hole looking out (Cycles)."""
    s = bpy.context.scene
    bpy.ops.object.camera_add(location=(0, -0.1, 1.5), rotation=(math.radians(88), 0, math.pi))
    cam = bpy.context.object
    cam.name = "_hole_camera"
    cam.data.lens = 18
    s.camera = cam
    bpy.ops.object.light_add(type="SUN", location=(4, -10, 8))
    sun = bpy.context.object
    sun.name = "_hole_sun"
    sun.data.energy = 4
    sun.rotation_euler = (0.9, 0.3, 2.6)
    s.render.engine = "CYCLES"
    s.cycles.samples = 24
    s.cycles.use_denoising = False
    s.render.resolution_x, s.render.resolution_y = 1024, 1024
    out = ROOT / "public/renders/ep01-outside.png"
    out.parent.mkdir(parents=True, exist_ok=True)
    s.render.filepath = str(out)
    bpy.ops.render.render(write_still=True)
    for n in ("_hole_camera", "_hole_sun"):
        bpy.data.objects.remove(bpy.data.objects[n], do_unlink=True)


render_outside()
finish("ep01", still_cam=(6.0, 1.0, 4.5), still_target=(0, 0, 1.5))
