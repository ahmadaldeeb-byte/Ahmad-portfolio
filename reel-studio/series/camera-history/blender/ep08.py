"""Ep08 · المراية اللي بتطير — inside an SLR (reconstruction, cut in half along the optical axis).

Run:  blender -b --python series/camera-history/blender/ep08.py
Optical axis along +Y at z=0.45 (model ×10). Mirror at 45° hinged at its upper-rear edge (it swings up under the
focusing screen), focusing screen, pentaprism, eyepiece, focal-plane shutter curtains, sensor/film plane.
Only the right half of the body shell is modelled, so the side view is a true section.
"""
import math
import sys
from pathlib import Path

import bpy

sys.path.insert(0, str(Path(__file__).parent))
from common import box, cyl, empty, finish, mat, plane, reset  # noqa: E402

reset()
body = mat("body_black", (0.04, 0.04, 0.045), rough=0.5)
cut = mat("section_cut", (0.75, 0.32, 0.12), rough=0.6)  # cut faces in a warm section colour
metal = mat("metal", (0.55, 0.56, 0.6), rough=0.3, metal=1.0)
mirror = mat("mirror", (0.95, 0.95, 0.97), rough=0.02, metal=1.0)
glass = mat("glass", (0.75, 0.88, 1.0), rough=0.02, alpha=0.35)
screen = mat("focus_screen", (0.85, 0.88, 0.9), rough=0.6, alpha=0.6)
sensor = mat("sensor", (0.12, 0.15, 0.3), rough=0.2, metal=0.5)
curtain = mat("curtain", (0.08, 0.08, 0.09), rough=0.7)
AX = 0.45

# body shell: right half only (x > 0) so the section is visible from -X
box("body_side_right", (0.02, 0.8, 0.95), (0.7, 0.1, 0.475), body)
box("body_bottom", (0.7, 0.8, 0.03), (0.35, 0.1, 0.015), body)
box("body_front_cut", (0.7, 0.03, 0.95), (0.35, -0.29, 0.475), body)
box("body_back_cut", (0.7, 0.03, 0.7), (0.35, 0.49, 0.35), body)
box("section_face", (0.004, 0.8, 0.95), (0.0, 0.1, 0.475), cut)  # thin cut face (made translucent in Remotion)
# lens: barrel + three elements
cyl("lens_barrel", 0.3, 0.6, (0, -0.6, AX), body, rot=(math.pi / 2, 0, 0))
for k, (y, r) in enumerate(((-0.86, 0.25), (-0.62, 0.22), (-0.38, 0.2))):
    cyl(f"lens_element_{k}", r, 0.05, (0, y, AX), glass, rot=(math.pi / 2, 0, 0))
empty("anchor_lens", (0, -0.6, AX))
# mirror: hinged at its upper-rear edge
hinge = empty("mirror_hinge", (0, 0.12, 0.69))
m = plane("mirror", (0.5, 0.44), (0, 0.12 - 0.155, 0.69 - 0.155), mirror, rot=(math.pi / 4, 0, 0))  # faces front-up: lens → screen
m.parent = hinge
empty("anchor_mirror", (0, -0.035, 0.535))
# focusing screen + pentaprism + eyepiece
box("focus_screen", (0.5, 0.36, 0.01), (0, -0.02, 0.72), screen)
verts2d = [(-0.2, 0.73), (0.16, 0.73), (0.27, 0.87), (0.06, 1.06), (-0.2, 0.96)]
vs = [(x, y, z) for x in (-0.25, 0.25) for (y, z) in verts2d]
faces = [(0, 1, 2, 3, 4), (9, 8, 7, 6, 5)] + [(i, (i + 1) % 5, 5 + (i + 1) % 5, 5 + i) for i in range(5)]
me = bpy.data.meshes.new("pentaprism")
me.from_pydata(vs, [], faces)
me.update()
pr = bpy.data.objects.new("pentaprism", me)
bpy.context.collection.objects.link(pr)
me.materials.append(glass)
empty("anchor_prism", (0, 0.03, 0.93))
cyl("eyepiece", 0.09, 0.14, (0, 0.38, 0.86), body, rot=(math.pi / 2, 0, 0))
cyl("eyepiece_glass", 0.07, 0.01, (0, 0.45, 0.86), glass, rot=(math.pi / 2, 0, 0))
empty("anchor_eyepiece", (0, 0.45, 0.86))
# focal-plane shutter (two curtains) and sensor
box("curtain_first", (0.5, 0.012, 0.36), (0, 0.28, AX), curtain)
box("curtain_second", (0.5, 0.012, 0.36), (0, 0.286, AX + 0.4), curtain)
box("sensor", (0.46, 0.02, 0.32), (0, 0.32, AX), sensor)
empty("anchor_sensor", (0, 0.31, AX))
empty("anchor_shutter", (0, 0.28, AX))
box("table", (6, 6, 0.1), (0, 0, -0.05), mat("table", (0.12, 0.12, 0.13), rough=0.8))

finish("ep08", still_cam=(-2.6, -1.0, 0.9), still_target=(0, 0.0, 0.55))
