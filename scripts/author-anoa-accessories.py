"""Author anoa-fitted CP accessories (crown, panda backpack, boot wraps).

Run:  blender --background --python scripts/author-anoa-accessories.py
Output: public/models/player-anoa-accessories.glb

Everything is authored in the anoa's glTF space (x right, y up, z forward),
the same space as JOINTS in public/assets/player-character.js. Blender uses
Z up / -Y forward, so B(x, y, z) = (x, -z, y).
"""
import math
import os

import bpy
from mathutils import Matrix, Vector

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
MODEL = os.path.join(ROOT, 'public', 'models', 'player-anoa.glb')
OUT = os.path.join(ROOT, 'public', 'models', 'player-anoa-accessories.glb')
PREVIEW = os.path.join(ROOT, 'artifacts', 'accessory-fit', 'custom')

WHITE = '#f6ecd6'
WHITE_SHADE = '#e8d4ae'
RED = '#c6412d'
RED_DARK = '#9c2c20'
GOLD = '#d9a33f'
GOLD_DARK = '#ad7826'
GREEN = '#4f7a3a'
GREEN_DARK = '#34562a'
BROWN = '#6a4429'
BROWN_DARK = '#3f2918'
LEATHER = '#5c3c25'
FUR = '#e6d4b2'
BLACK = '#2b2824'
BLACK_DEEP = '#191816'
PINK = '#c98b78'

MAT = None
REF = None


def b(p):
    return Vector((p[0], -p[2], p[1]))


def rgb(hex_value):
    h = hex_value.lstrip('#')
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))


def select_only(obj):
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj


def paint(obj, color, smooth=False):
    me = obj.data
    attribute = me.color_attributes.get('Col')
    if attribute is None:
        attribute = me.color_attributes.new(name='Col', type='BYTE_COLOR', domain='CORNER')
    r, g, bl = rgb(color)
    for datum in attribute.data:
        datum.color_srgb = (r, g, bl, 1.0)
    for polygon in me.polygons:
        polygon.use_smooth = smooth
    me.materials.clear()
    me.materials.append(MAT)
    obj.color = (r, g, bl, 1.0)


def apply_transform(obj, location=False):
    select_only(obj)
    bpy.ops.object.transform_apply(location=location, rotation=True, scale=True)


def basis_quat(x_axis, y_axis, z_axis):
    vx = b(x_axis).normalized()
    vy = b(y_axis).normalized()
    vz = b(z_axis).normalized()
    return Matrix((vx, vy, vz)).transposed().to_quaternion()


def ellipsoid(name, color, center, size, axes=None, segments=10, rings=6, smooth=False):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments, ring_count=rings, radius=1.0,
                                         location=b(center))
    obj = bpy.context.object
    obj.name = name
    if axes:
        obj.rotation_mode = 'QUATERNION'
        obj.rotation_quaternion = basis_quat(*axes)
    # Without a custom basis, dimensions are specified in glTF X/Y/Z order.
    # Blender is Z-up: keeping Y/Z unchanged flattened the panda's face and ears.
    obj.scale = size if axes else (size[0], size[2], size[1])
    apply_transform(obj)
    paint(obj, color, smooth)
    return obj


def box(name, color, center, size, bevel=0.0, yaw=0.0, smooth=False):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=b(center))
    obj = bpy.context.object
    obj.name = name
    obj.scale = (size[0], size[2], size[1])
    if yaw:
        obj.rotation_mode = 'XYZ'
        obj.rotation_euler = (0, 0, math.radians(yaw))
    apply_transform(obj)
    if bevel > 0:
        modifier = obj.modifiers.new('soft edges', 'BEVEL')
        modifier.width = bevel
        modifier.segments = 2
        modifier.limit_method = 'ANGLE'
        select_only(obj)
        bpy.ops.object.modifier_apply(modifier=modifier.name)
    paint(obj, color, smooth)
    return obj


def torus(name, color, center, major, minor, axes=None, major_segments=24, minor_segments=6,
          stretch=(1.0, 1.0), smooth=False):
    bpy.ops.mesh.primitive_torus_add(major_radius=major, minor_radius=minor,
                                     major_segments=major_segments, minor_segments=minor_segments,
                                     location=b(center))
    obj = bpy.context.object
    obj.name = name
    if axes:
        obj.rotation_mode = 'QUATERNION'
        obj.rotation_quaternion = basis_quat(*axes)
    obj.scale = (stretch[0], stretch[1], 1.0)
    apply_transform(obj)
    paint(obj, color, smooth)
    return obj


def tube(name, color, points, radius, smooth=True):
    curve = bpy.data.curves.new(name, 'CURVE')
    curve.dimensions = '3D'
    curve.resolution_u = 6
    spline = curve.splines.new('BEZIER')
    spline.bezier_points.add(len(points) - 1)
    for point, coordinate in zip(spline.bezier_points, points):
        point.co = b(coordinate)
        point.handle_left_type = point.handle_right_type = 'AUTO'
    curve.bevel_depth = radius
    curve.bevel_resolution = 2
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    select_only(obj)
    bpy.ops.object.convert(target='MESH')
    object_mesh = bpy.context.object
    object_mesh.name = name
    paint(object_mesh, color, smooth)
    return object_mesh


def loft(name, color, rings, sides=16, cap_top=False, cap_bottom=False, smooth=False
         ):
    vertices = []
    for y, center_x, center_z, radius_x, radius_z in rings:
        for step in range(sides):
            angle = 2 * math.pi * step / sides
            vertices.append(b((center_x + radius_x * math.cos(angle), y,
                               center_z + radius_z * math.sin(angle))))
    faces = []
    for ring in range(len(rings) - 1):
        for step in range(sides):
            lower = ring * sides + step
            lower_next = (step + 1) % sides + ring * sides
            upper_next = (step + 1) % sides + (ring + 1) * sides
            upper = (ring + 1) * sides + step
            faces.append((lower, lower_next, upper_next, upper))
    if cap_bottom:
        faces.append(tuple(reversed(range(sides))))
    if cap_top:
        start = (len(rings) - 1) * sides
        faces.append(tuple(range(start, start + sides)))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata([tuple(v) for v in vertices], [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    paint(obj, color, smooth)
    return obj


def join(parts, name):
    bpy.ops.object.select_all(action='DESELECT')
    for part in parts:
        part.select_set(True)
    bpy.context.view_layer.objects.active = parts[0]
    bpy.ops.object.join()
    obj = bpy.context.object
    obj.name = name
    obj.data.name = name
    apply_transform(obj, location=True)
    return obj


# ---------------------------------------------------------------- crown
def crown_hit(theta_degrees):
    """Project a ray onto the anoa's forehead/temple at band height."""
    t = math.radians(theta_degrees)
    height = 1.596 + 0.050 * (1 - math.cos(t))
    radial = Vector((math.sin(t), -math.cos(t), 0.0))
    origin = Vector((0.0, 0.0, height)) + radial * 0.9
    found, location, normal, _index = REF.ray_cast(origin, -radial)
    if not found:
        position = Vector((0.335 * math.sin(t), height, 0.055 + 0.275 * math.cos(t)))
        outward = Vector((math.sin(t), 0.50, math.cos(t))).normalized()
        return position, outward
    if normal.dot(radial) < 0:
        normal = -normal
    location = location + normal * 0.018
    position = Vector((location.x, location.z, -location.y))
    outward = Vector((normal.x, normal.z, -normal.y)).normalized()
    return position, outward


def crown_frame(theta_degrees):
    position, outward = crown_hit(theta_degrees)
    before, _ = crown_hit(theta_degrees - 2)
    after, _ = crown_hit(theta_degrees + 2)
    tangent = (after - before).normalized()
    outward = (outward - tangent * outward.dot(tangent)).normalized()
    up = outward.cross(tangent).normalized()
    return position, tangent, up, outward


def flower(parts, name, position, tangent, up, outward, scale, petal_color, core_color):
    for layer, (offset, count, petal_scale, shade) in enumerate((
            (0.009, 5, 1.0, 0.0),
            (0.014, 5, 0.72, 1.0))):
        for index in range(count):
            angle = 2 * math.pi * index / count + (0.32 if layer else 0.0)
            direction = tangent * math.cos(angle) + up * math.sin(angle)
            width_axis = -tangent * math.sin(angle) + up * math.cos(angle)
            center = position + outward * offset + direction * (0.030 * scale * petal_scale)
            color = WHITE_SHADE if (shade and petal_color == WHITE) else petal_color
            parts.append(ellipsoid(
                f'{name}_petal{layer}_{index}', color, center,
                (0.033 * scale * petal_scale, 0.022 * scale * petal_scale,
                 0.0055 * scale), axes=(direction, width_axis, outward),
                segments=8, rings=5))
    parts.append(ellipsoid(f'{name}_core', core_color, position + outward * 0.020,
                           (0.013 * scale, 0.013 * scale, 0.009 * scale),
                           axes=(tangent, up, outward), segments=8, rings=5))


def build_crown():
    parts = []
    band_points = [crown_frame(degrees)[0] for degrees in range(-72, 73, 6)]
    parts.append(tube('crown_vine', GREEN_DARK, band_points, 0.011))
    wire_points = [crown_frame(degrees)[0] + crown_frame(degrees)[2] * 0.011
                   for degrees in range(-66, 67, 11)]
    parts.append(tube('crown_wire', GOLD, wire_points, 0.0042))

    flowers = [
        (-66, 0.80, RED, GOLD), (-44, 0.90, WHITE, GOLD_DARK),
        (-22, 1.00, RED, GOLD), (0, 1.14, WHITE, GOLD),
        (22, 1.00, RED, GOLD), (44, 0.90, WHITE, GOLD_DARK),
        (66, 0.80, RED, GOLD),
    ]
    for index, (degrees, scale, petal_color, core_color) in enumerate(flowers):
        position, tangent, up, outward = crown_frame(degrees)
        flower(parts, f'crown_flower{index}', position, tangent, up, outward,
               scale, petal_color, core_color)

    for index, degrees in enumerate((-70, -55, -33, -11, 11, 33, 55, 70)):
        position, tangent, up, outward = crown_frame(degrees)
        direction = tangent * (1 if index % 2 else -1)
        leaf_axes = (direction, up, outward)
        center = position + up * 0.018 + outward * 0.002
        parts.append(ellipsoid(f'crown_leaf{index}', GREEN, center,
                               (0.052, 0.018, 0.006), axes=leaf_axes,
                               segments=8, rings=4))
        tip = position + direction * 0.040 + up * 0.026 + outward * 0.004
        parts.append(ellipsoid(f'crown_leaf_tip{index}', GREEN_DARK, tip,
                               (0.028, 0.011, 0.005), axes=leaf_axes,
                               segments=6, rings=3))
    for index, degrees in enumerate((-55, -33, -11, 11, 33, 55)):
        position, tangent, up, outward = crown_frame(degrees)
        parts.append(ellipsoid(f'crown_bead{index}', GOLD,
                               position + up * -0.016 + outward * 0.010,
                               (0.009, 0.009, 0.009), segments=8, rings=4))
    return join(parts, 'Accessory_Head')


# ------------------------------------------------------------- backpack
def build_backpack():
    parts = []
    parts.append(box('pack_body', BLACK, (0, 1.075, -0.345), (0.42, 0.40, 0.215),
                     bevel=0.060))
    parts.append(box('pack_lid', BLACK_DEEP, (0, 1.283, -0.355), (0.36, 0.06, 0.175),
                     bevel=0.03))
    parts.append(ellipsoid('pack_face', WHITE, (0, 1.085, -0.458),
                           (0.155, 0.165, 0.014), segments=20, rings=10))
    for side, sign in (('L', 1), ('R', -1)):
        parts.append(ellipsoid(f'pack_eye_patch_{side}', BLACK_DEEP,
                               (sign * 0.063, 1.118, -0.470),
                               (0.044, 0.054, 0.007),
                               axes=((math.cos(math.radians(sign * 24)), math.sin(math.radians(sign * 24)), 0),
                                     (-math.sin(math.radians(sign * 24)), math.cos(math.radians(sign * 24)), 0),
                                     (0, 0, 1)),
                               segments=12, rings=6))
        parts.append(ellipsoid(f'pack_eye_{side}', WHITE,
                               (sign * 0.066, 1.124, -0.477),
                               (0.0105, 0.0105, 0.008), segments=8, rings=5))
        parts.append(ellipsoid(f'pack_cheek_{side}', PINK,
                               (sign * 0.112, 1.063, -0.466),
                               (0.020, 0.012, 0.004), segments=8, rings=4))
        parts.append(ellipsoid(f'pack_ear_{side}', BLACK_DEEP,
                               (sign * 0.152, 1.340, -0.418),
                               (0.070, 0.070, 0.030), segments=12, rings=6))
        parts.append(ellipsoid(f'pack_ear_inner_{side}', PINK,
                               (sign * 0.154, 1.342, -0.456),
                               (0.042, 0.042, 0.007), segments=10, rings=5))
        parts.append(ellipsoid(f'pack_arm_{side}', BLACK_DEEP,
                               (sign * 0.232, 1.010, -0.395),
                               (0.032, 0.088, 0.050), segments=10, rings=6))
        parts.append(ellipsoid(f'pack_foot_{side}', BLACK_DEEP,
                               (sign * 0.085, 0.892, -0.452),
                               (0.050, 0.026, 0.034), segments=10, rings=5))
        strap = [(sign * 0.140, 1.255, -0.380), (sign * 0.212, 1.300, -0.120),
                 (sign * 0.222, 1.245, 0.070), (sign * 0.182, 1.105, 0.208),
                 (sign * 0.160, 1.010, 0.228)]
        parts.append(tube(f'pack_strap_{side}', BROWN_DARK, strap, 0.016))
        parts.append(box(f'pack_buckle_{side}', GOLD,
                         (sign * 0.183, 1.060, 0.232), (0.046, 0.052, 0.018),
                         bevel=0.008))
        parts.append(box(f'pack_buckle_inset_{side}', BROWN_DARK,
                         (sign * 0.183, 1.060, 0.244), (0.022, 0.026, 0.006)))

    parts.append(ellipsoid('pack_nose', BLACK_DEEP, (0, 1.045, -0.474),
                           (0.024, 0.017, 0.010), segments=10, rings=5))
    parts.append(tube('pack_mouth', BLACK_DEEP,
                      [(0, 1.032, -0.472), (0.020, 1.024, -0.469),
                       (0.037, 1.033, -0.467)], 0.0035))
    parts.append(tube('pack_mouth_mirror', BLACK_DEEP,
                      [(0, 1.032, -0.472), (-0.020, 1.024, -0.469),
                       (-0.037, 1.033, -0.467)], 0.0035))
    parts.append(tube('pack_handle', BROWN_DARK,
                      [(-0.070, 1.300, -0.378), (-0.050, 1.352, -0.373),
                       (0.050, 1.352, -0.373), (0.070, 1.300, -0.378)], 0.011))
    parts.append(box('pack_tag', GOLD, (0.132, 0.910, -0.463),
                     (0.055, 0.036, 0.013), bevel=0.006))
    parts.append(box('pack_tag_slot', BLACK_DEEP, (0.132, 0.910, -0.471),
                     (0.033, 0.006, 0.004)))
    return join(parts, 'Accessory_Body')


# ---------------------------------------------------------------- boots
BOOT_SOLE = [
    (0.000, 0.255, 0.005, 0.150, 0.180),
    (0.018, 0.255, 0.005, 0.154, 0.185),
    (0.034, 0.255, 0.005, 0.149, 0.179),
]
BOOT_BODY = [
    (0.040, 0.255, 0.005, 0.147, 0.177),
    (0.075, 0.250, 0.005, 0.143, 0.172),
    (0.120, 0.238, 0.000, 0.132, 0.152),
    (0.165, 0.220, -0.005, 0.118, 0.128),
    (0.205, 0.202, 0.000, 0.108, 0.112),
    (0.235, 0.194, 0.004, 0.114, 0.120),
]
BOOT_CUFF = [
    (0.220, 0.196, 0.004, 0.116, 0.122),
    (0.236, 0.194, 0.005, 0.124, 0.131),
    (0.252, 0.194, 0.006, 0.128, 0.136),
    (0.266, 0.194, 0.006, 0.118, 0.126),
]


def mirror_rings(rings, sign):
    return [(y, sign * x, z, rx, rz) for y, x, z, rx, rz in rings]


def build_boot(sign, suffix):
    parts = []
    parts.append(loft(f'boot_sole{suffix}', BROWN_DARK,
                      mirror_rings(BOOT_SOLE, sign), sides=22, smooth=True))
    welt = [(0.034, 0.255, 0.005, 0.152, 0.183),
            (0.043, 0.255, 0.005, 0.151, 0.182)]
    parts.append(loft(f'boot_welt{suffix}', GOLD, mirror_rings(welt, sign), sides=22))
    parts.append(loft(f'boot_body{suffix}', LEATHER,
                      mirror_rings(BOOT_BODY, sign), sides=22, smooth=True))
    parts.append(loft(f'boot_cuff{suffix}', FUR,
                      mirror_rings(BOOT_CUFF, sign), sides=22, smooth=True))

    band_one = [(0.142, 0.229, -0.003, 0.128, 0.140),
                (0.152, 0.229, -0.003, 0.129, 0.141)]
    parts.append(loft(f'boot_band_one{suffix}', GOLD,
                      mirror_rings(band_one, sign), sides=22))
    red_band = [(0.168, 0.218, -0.003, 0.119, 0.126),
                (0.180, 0.218, -0.003, 0.120, 0.127)]
    parts.append(loft(f'boot_red{suffix}', RED_DARK,
                      mirror_rings(red_band, sign), sides=22))
    band_two = [(0.198, 0.210, -0.001, 0.112, 0.118),
                (0.208, 0.210, -0.001, 0.113, 0.119)]
    parts.append(loft(f'boot_band_two{suffix}', GOLD,
                      mirror_rings(band_two, sign), sides=22))

    parts.append(box(f'boot_buckle{suffix}', GOLD,
                     (sign * 0.324, 0.188, -0.002), (0.020, 0.048, 0.052), bevel=0.008))
    parts.append(box(f'boot_buckle_slot{suffix}', BROWN_DARK,
                     (sign * 0.335, 0.188, -0.002), (0.006, 0.022, 0.026)))

    parts.append(ellipsoid(f'boot_toe{suffix}', BROWN,
                           (sign * 0.255, 0.070, 0.098),
                           (0.125, 0.047, 0.082), segments=16, rings=8, smooth=True))
    toe_trim = [(sign * 0.145, 0.058, 0.172), (sign * 0.255, 0.048, 0.186),
                (sign * 0.365, 0.058, 0.172)]
    parts.append(tube(f'boot_toe_trim{suffix}', GOLD, toe_trim, 0.005))

    rows = [
        (0.229, 0.150, 0.140),
        (0.211, 0.185, 0.122),
        (0.197, 0.215, 0.122),
    ]
    eyelet_points = []
    for index, (xc, y, z) in enumerate(rows):
        for side in (-1, 1):
            point = (sign * (xc + side * 0.027), y, z + 0.004)
            parts.append(ellipsoid(f'boot_eyelet{index}{side}{suffix}', GOLD, point,
                                   (0.007, 0.007, 0.007), segments=8, rings=4))
            eyelet_points.append(point)
    lace_a = [eyelet_points[0], eyelet_points[3], eyelet_points[4]]
    lace_b = [eyelet_points[1], eyelet_points[2], eyelet_points[5]]
    parts.append(tube(f'boot_lace_a{suffix}', FUR, lace_a, 0.0032))
    parts.append(tube(f'boot_lace_b{suffix}', FUR, lace_b, 0.0032))
    return join(parts, f'Accessory_Bottom_{suffix}')


# -------------------------------------------------------------- preview
def preview_renders(accessories):
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_WORKBENCH'
    scene.display.shading.light = 'STUDIO'
    scene.display.shading.color_type = 'VERTEX'
    scene.display.shading.show_shadows = True
    scene.display.shading.show_cavity = True
    scene.display.shading.background_type = 'VIEWPORT'
    scene.display.shading.background_color = (0.88, 0.90, 0.92)
    scene.render.resolution_x = 720
    scene.render.resolution_y = 820
    scene.render.film_transparent = False

    camera_data = bpy.data.cameras.new('preview camera')
    camera = bpy.data.objects.new('preview camera', camera_data)
    bpy.context.scene.collection.objects.link(camera)
    scene.camera = camera
    camera_data.type = 'ORTHO'

    def shoot(name, location, rotation, scale):
        camera.location = location
        camera.rotation_euler = rotation
        camera_data.ortho_scale = scale
        scene.render.filepath = os.path.join(PREVIEW, f'{name}.png')
        bpy.ops.render.render(write_still=True)

    shoot('front', (0, -5, 1.02), (math.pi / 2, 0, 0), 2.10)
    shoot('back', (0, 5, 1.02), (math.pi / 2, 0, math.pi), 2.10)
    shoot('side', (5, 0, 1.02), (math.pi / 2, 0, math.pi / 2), 2.10)
    shoot('head-front', (0, -4, 1.55), (math.pi / 2, 0, 0), 0.95)
    shoot('head-side', (4, 0, 1.55), (math.pi / 2, 0, math.pi / 2), 0.95)
    shoot('back-close', (0, 4, 1.18), (math.pi / 2, 0, math.pi), 0.92)
    shoot('feet', (0, -4, 0.24), (math.pi / 2, 0, 0), 0.80)
    shoot('three-quarter', (-3.4, -3.4, 1.8), (math.radians(66), 0, -math.pi / 4), 2.15)

    select_only(accessories[0])
    for accessory in accessories[1:]:
        accessory.select_set(True)


# ------------------------------------------------------------------ main
def main(render_previews=True):
    global MAT, REF
    # Keep the user's open project intact when run through Blender MCP.
    scene = bpy.data.scenes.new('Anoa custom accessories')
    bpy.context.window.scene = scene
    os.makedirs(PREVIEW, exist_ok=True)

    bpy.ops.import_scene.gltf(filepath=MODEL)
    REF = next(obj for obj in scene.objects if obj.type == 'MESH')
    bpy.ops.object.select_all(action='DESELECT')

    MAT = bpy.data.materials.new('AccessoryVertexColor')
    MAT.use_nodes = True
    nodes = MAT.node_tree.nodes
    bsdf = next(node for node in nodes if node.type == 'BSDF_PRINCIPLED')
    bsdf.inputs['Base Color'].default_value = (1.0, 1.0, 1.0, 1.0)
    bsdf.inputs['Metallic'].default_value = 0.0
    bsdf.inputs['Roughness'].default_value = 0.86
    if 'Emission Strength' in bsdf.inputs:
        bsdf.inputs['Emission Strength'].default_value = 0.0
    vertex_color = nodes.new('ShaderNodeVertexColor')
    vertex_color.layer_name = 'Col'
    MAT.node_tree.links.new(vertex_color.outputs['Color'], bsdf.inputs['Base Color'])
    MAT.diffuse_color = (1.0, 1.0, 1.0, 1.0)

    crown = build_crown()
    backpack = build_backpack()
    left = build_boot(1, 'L')
    right = build_boot(-1, 'R')
    accessories = [crown, backpack, left, right]

    if render_previews:
        preview_renders(accessories)

    bpy.ops.object.select_all(action='DESELECT')
    for accessory in accessories:
        accessory.select_set(True)
    bpy.context.view_layer.objects.active = accessories[0]
    bpy.ops.export_scene.gltf(
        filepath=OUT, export_format='GLB', use_selection=True, use_active_scene=True,
        export_yup=True, export_apply=True,
        export_vertex_color='ACTIVE', export_active_vertex_color_when_no_material=True,
        export_materials='EXPORT', export_texcoords=False, export_normals=True,
        export_animations=False, export_skins=False, export_cameras=False, export_lights=False,
    )
    for accessory in accessories:
        print('ACCESSORY', accessory.name, len(accessory.data.vertices), len(accessory.data.polygons))
    print('WROTE', OUT)


if __name__ == '__main__':
    main()
