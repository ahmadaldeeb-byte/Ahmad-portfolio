"""Shared helpers for the camera-history Blender scenes (Blender 4.x, run headless).

Each episode script builds named objects, then calls `finish(ep)` which:
  - saves the editable scene   → series/camera-history/blender/<ep>.blend
  - exports glTF binary        → public/models/<ep>.glb   (Y-up, what Remotion/three loads)
  - writes label anchors       → src/series/<ep>/anchors.json  (empties named "anchor_*", converted to Y-up)
  - renders a Cycles still      → series/camera-history/blender/<ep>-still.png (look-dev reference)
Remotion animates objects by name; keep names stable when editing the .blend.
"""
import json
import math
from pathlib import Path

import bpy

ROOT = Path(__file__).resolve().parents[3]


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    s = bpy.context.scene
    s.unit_settings.system = "METRIC"
    return s


_mats = {}


def mat(name, color, rough=0.5, metal=0.0, alpha=1.0, emit=None, emit_strength=0.0):
    if name in _mats:
        return _mats[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    if alpha < 1:
        b.inputs["Alpha"].default_value = alpha
        m.blend_method = "BLEND"
    if emit:
        b.inputs["Emission Color"].default_value = (*emit, 1)
        b.inputs["Emission Strength"].default_value = emit_strength
    _mats[name] = m
    return m


def _finish_obj(o, name, material, parent=None):
    o.name = name
    if o.data:
        o.data.name = name
    if material:
        o.data.materials.append(material)
    if parent:
        o.parent = parent
    return o


def box(name, size, loc, material=None, rot=(0, 0, 0), parent=None, bevel=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = bpy.context.object
    o.scale = size
    bpy.ops.object.transform_apply(scale=True)
    if bevel:
        mod = o.modifiers.new("bevel", "BEVEL")
        mod.width = bevel
        mod.segments = 2
        bpy.ops.object.modifier_apply(modifier="bevel")
    return _finish_obj(o, name, material, parent)


def cyl(name, r, depth, loc, material=None, rot=(0, 0, 0), parent=None, verts=32):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=depth, location=loc, rotation=rot, vertices=verts)
    return _finish_obj(bpy.context.object, name, material, parent)


def sphere(name, r, loc, material=None, parent=None, seg=24):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=loc, segments=seg, ring_count=seg // 2)
    o = bpy.context.object
    bpy.ops.object.shade_smooth()
    return _finish_obj(o, name, material, parent)


def plane(name, size, loc, material=None, rot=(0, 0, 0), parent=None):
    bpy.ops.mesh.primitive_plane_add(size=1, location=loc, rotation=rot)
    o = bpy.context.object
    o.scale = (size[0], size[1], 1)
    bpy.ops.object.transform_apply(scale=True)
    return _finish_obj(o, name, material, parent)


def gable(name, w, d, h, loc, material=None, parent=None):
    """Pitched roof: triangular prism, ridge along X."""
    verts = [(-w / 2, -d / 2, 0), (w / 2, -d / 2, 0), (w / 2, d / 2, 0), (-w / 2, d / 2, 0), (-w / 2, 0, h), (w / 2, 0, h)]
    faces = [(0, 1, 2, 3), (0, 1, 5, 4), (3, 2, 5, 4), (0, 4, 3), (1, 2, 5)]
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.update()
    o = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(o)
    o.location = loc
    if material:
        me.materials.append(material)
    if parent:
        o.parent = parent
    return o


def empty(name, loc, parent=None):
    o = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(o)
    o.location = loc
    if parent:
        o.parent = parent
    return o


def group(name, loc=(0, 0, 0)):
    return empty(name, loc)


def still(ep, cam_loc, target, lens=35, res=(540, 960), samples=24):
    s = bpy.context.scene
    bpy.ops.object.camera_add(location=cam_loc)
    cam = bpy.context.object
    cam.name = "_still_camera"
    cam.data.lens = lens
    d = [target[i] - cam_loc[i] for i in range(3)]
    cam.rotation_euler = (math.atan2(math.hypot(d[0], d[1]), -d[2]), 0, math.atan2(d[1], d[0]) - math.pi / 2)
    s.camera = cam
    bpy.ops.object.light_add(type="SUN", location=(4, -6, 8))
    sun = bpy.context.object
    sun.name = "_still_sun"
    sun.data.energy = 3.0
    sun.rotation_euler = (0.7, 0.2, 0.6)
    w = bpy.data.worlds.new("_still_world")
    w.use_nodes = True
    w.node_tree.nodes["Background"].inputs["Color"].default_value = (0.03, 0.035, 0.05, 1)
    w.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.6
    s.world = w
    s.render.engine = "CYCLES"
    s.cycles.samples = samples
    s.cycles.use_denoising = False  # this Blender build has no OpenImageDenoise
    s.render.resolution_x, s.render.resolution_y = res
    s.render.filepath = str(ROOT / f"series/camera-history/blender/{ep}-still.png")
    bpy.ops.render.render(write_still=True)
    # keep the look-dev camera/light out of the exported model
    for n in ("_still_camera", "_still_sun"):
        bpy.data.objects.remove(bpy.data.objects[n], do_unlink=True)


def finish(ep, still_cam=None, still_target=(0, 0, 0)):
    out_blend = ROOT / f"series/camera-history/blender/{ep}.blend"
    out_glb = ROOT / f"public/models/{ep}.glb"
    out_anchor = ROOT / f"src/series/{ep}/anchors.json"
    for p in (out_glb, out_anchor):
        p.parent.mkdir(parents=True, exist_ok=True)
    # objects parented with `o.parent = g` keep their world position (scripts create them in world space)
    for o in bpy.data.objects:
        if o.parent is not None and o.matrix_parent_inverse == o.matrix_parent_inverse.Identity(4):
            o.matrix_parent_inverse = o.parent.matrix_world.inverted()
    bpy.context.view_layer.update()
    anchors = {}
    for o in bpy.data.objects:
        if o.name.startswith("anchor_"):
            x, y, z = o.matrix_world.translation
            anchors[o.name[7:]] = [round(x, 4), round(z, 4), round(-y, 4)]  # Blender Z-up → glTF Y-up
    out_anchor.write_text(json.dumps(anchors, indent=1))
    bpy.ops.export_scene.gltf(filepath=str(out_glb), export_format="GLB", use_selection=False, export_apply=True, export_yup=True, export_extras=True)
    if still_cam:
        still(ep, still_cam, still_target)
    bpy.ops.wm.save_as_mainfile(filepath=str(out_blend))
    print(f"[{ep}] saved {out_blend.name}, {out_glb.name}, {len(anchors)} anchors")
