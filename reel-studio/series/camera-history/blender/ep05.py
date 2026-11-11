"""Ep05 · الحصان اللي طار — Muybridge, Palo Alto track, June 1878 (reconstruction).

Run:  blender -b --python series/camera-history/blender/ep05.py
Track runs along +X. Camera shed on the near side (y=-4), white backdrop on the far side (y=+3) with vertical
lines every 27 inches (0.686 m, per the original card). 12 cameras 27 in apart; a thread from each camera's
shutter crosses the track. The horse itself is a card with Muybridge's frames, animated in Remotion.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from common import box, cyl, empty, finish, mat, plane, reset  # noqa: E402

reset()
dirt = mat("dirt", (0.55, 0.47, 0.36), rough=1.0)
white = mat("backdrop_white", (0.92, 0.92, 0.9), rough=0.9)
line = mat("backdrop_line", (0.15, 0.15, 0.15), rough=0.9)
shed = mat("shed_wood", (0.45, 0.33, 0.22), rough=0.8)
cam_wood = mat("camera_wood", (0.3, 0.2, 0.12), rough=0.6)
brass = mat("brass", (0.72, 0.55, 0.25), rough=0.35, metal=1.0)
thread = mat("thread", (0.95, 0.95, 0.9), rough=0.5)
grass = mat("grass", (0.5, 0.52, 0.3), rough=1.0)

SP = 0.686  # 27 inches
N = 12
x0 = -SP * (N - 1) / 2
plane("ground", (60, 40), (0, 0, -0.01), grass)
plane("track", (40, 5), (0, 0, 0.0), dirt)
# white backdrop with vertical lines (every 27 in) and horizontal lines (every 4 in, low)
box("backdrop", (14, 0.1, 2.6), (0, 3.0, 1.3), white)
for k in range(-10, 11):
    box(f"bd_vline_{k + 10}", (0.02, 0.02, 2.6), (k * SP, 2.94, 1.3), line)
for k in range(5):
    box(f"bd_hline_{k}", (14, 0.02, 0.012), (0, 2.94, 0.1 + k * 0.1016), line)
# camera shed on the near side
box("shed_back", (10, 0.2, 2.6), (0, -5.2, 1.3), shed)
box("shed_roof", (10, 1.6, 0.1), (0, -4.6, 2.65), shed, rot=(0.15, 0, 0))
box("shed_front_low", (10, 0.12, 0.8), (0, -3.9, 0.4), shed)
for i in range(N):
    x = x0 + i * SP
    g = empty(f"cam_{i:02d}", (x, -4.3, 1.25))
    box(f"cam_{i:02d}_body", (0.38, 0.5, 0.42), (x, -4.3, 1.25), cam_wood, bevel=0.01).parent = g
    cyl(f"cam_{i:02d}_lens", 0.08, 0.16, (x, -4.0, 1.25), brass, rot=(1.5708, 0, 0)).parent = g
    box(f"cam_{i:02d}_shutter", (0.2, 0.03, 0.2), (x, -3.91, 1.25), mat("shutter_black", (0.05, 0.05, 0.05), rough=0.4)).parent = g
    # thread from the shutter release across the track to the far side, at about chest height
    cyl(f"thread_{i:02d}", 0.006, 6.8, (x, -0.55, 1.05), thread, rot=(1.5708, 0, 0))
    empty(f"anchor_cam_{i:02d}", (x, -3.9, 1.25))
empty("anchor_thread", (x0 + 5 * SP, 0.0, 1.05))
empty("anchor_track", (0, 0, 0.8))

finish("ep05", still_cam=(-6.5, -9.5, 3.6), still_target=(0.5, 0, 0.9))
