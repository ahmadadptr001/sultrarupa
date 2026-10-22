"""Fit every catalog accessory to the anoa, preserving the open Blender scene.

Run with Blender --background --python scripts/author-anoa-native-accessories.py.
Dimensions below are measured in Blender X/right, Y/back, Z/up metres.
The exported vertices are baked in the anoa's rest pose; the website attaches
them to its retargeted bones. UVs and the original character atlas are retained.
"""
import json
import math
import bpy
import bmesh
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
NATIVE = ROOT / "public" / "assets" / "character.df6ab95f65453426.glb"
TEX = ROOT / "public" / "assets" / "Character_Texture.2c62815965453426.png"
OUT = ROOT / "public" / "models" / "player-anoa-native-accessories.glb"

HEAD = {
    "Head-AstronautHelmet": "bubble",
    "Head-Beanie": "beanie",
    "Head-BearBeanie": "beanie",
    "Head-BikeHelmet": "bike",
    "Head-Bob": "hair2",
    "Head-BunnyCap": "tall",
    "Head-Cap": "hat",
    "Head-Crown": "hat",
    "Head-DeerHat": "tall",
    "Head-Dino": "tall",
    "Head-Fish": "fish",
    "Head-FrenchBeret": "beret",
    "Head-Glass1": "glasses",
    "Head-Glass2": "glasses",
    "Head-GraduationHat": "tall",
    "Head-Heaset": "headset",
    "Head-MotorcycleHelmet": "moto",
    "Head-Scuba": "scuba",
    "Head-Unicorn": "tall",
    "Head-Visor": "visor",
}

BODY = {
    "Body-Bumbag": (0.60, (0.0, -0.12, 1.00), "Spine1_M"),
    "Body-Buoy": (0.50, (0.0, 0.00, 1.05), "Chest_M"),
    "Body-Dino": (0.60, (0.0, 0.02, 0.95), "Chest_M"),
    "Body-JetPack": (0.60, (0.0, 0.28, 1.20), "Chest_M"),
    "Body-OxygenBottle": (0.60, (0.0, 0.28, 1.20), "Chest_M"),
    "Body-Shark": (0.55, (0.0, 0.08, 1.15), "Chest_M"),
    "Body-UrbanBackpack": (0.65, (0.0, 0.24, 1.18), "Chest_M"),
    "Body-Wings": (0.70, (0.0, 0.28, 1.35), "Chest_M"),
}

BOTTOM = {
    "Bottom-LowSneakers": ((1.10, 1.10, 1.55), 0.01),
    "Bottom-MidSneakers": ((1.00, 1.00, 1.15), 0.00),
    "Bottom-Sandals": ((0.90, 0.90, 1.25), 0.00),
    "Bottom-Palm": ((0.70, 0.70, 1.60), 0.02),
    "Bottom-Dino": ((0.85, 0.85, 1.20), 0.00),
    "Bottom-FastShoes": ((1.10, 1.10, 1.25), 0.01),
}
GROUND_SINK = 0.003

scene = bpy.data.scenes.new('Anoa fitted wardrobe')
scene['anoa_native_wardrobe'] = True
bpy.context.window.scene = scene
bpy.ops.import_scene.gltf(filepath=str(NATIVE))

native = set(scene.objects)
for obj in native:
    if obj.type == "ARMATURE":
        obj.data.pose_position = "REST"
bpy.context.view_layer.update()
depsgraph = bpy.context.evaluated_depsgraph_get()

img = bpy.data.images.load(str(TEX), check_existing=True)
img.pack()
mat = bpy.data.materials.new("CharacterAtlas")
mat.use_nodes = True
mat.diffuse_color = (1.0, 1.0, 1.0, 1.0)
nodes = mat.node_tree.nodes
nodes.clear()
out = nodes.new("ShaderNodeOutputMaterial")
bsdf = nodes.new("ShaderNodeBsdfPrincipled")
tex = nodes.new("ShaderNodeTexImage")
tex.image = img
mat.node_tree.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
mat.node_tree.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])

made = []


def source_obj(item):
    for obj in native:
        if obj.type != "MESH":
            continue
        if obj.name == "Chara_Low_Rig:" + item or obj.name.startswith("Chara_Low_Rig:" + item + "."):
            return obj
    raise KeyError(item)


def world_mesh(src):
    ev = src.evaluated_get(depsgraph)
    me = bpy.data.meshes.new_from_object(ev, preserve_all_data_layers=True, depsgraph=depsgraph)
    for v in me.vertices:
        v.co = src.matrix_world @ v.co
    for attr in list(me.color_attributes):
        me.color_attributes.remove(attr)
    # glTF duplicates positions at UV seams; booleans need welded surfaces.
    bm = bmesh.new()
    bm.from_mesh(me)
    bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=0.00001)
    bm.to_mesh(me)
    bm.free()
    me.validate()
    return me


def bounds(me):
    pts = [v.co for v in me.vertices]
    mn = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    mx = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    return mn, mx


def place(me, scale, center):
    mn, mx = bounds(me)
    mid = (mn + mx) * 0.5
    sc = Vector(scale) if hasattr(scale, "__len__") else Vector((scale, scale, scale))
    for v in me.vertices:
        v.co = Vector(((v.co.x - mid.x) * sc.x + center[0],
                       (v.co.y - mid.y) * sc.y + center[1],
                       (v.co.z - mid.z) * sc.z + center[2]))
    me.update()


def place_anchor_bottom(me, scale, x, y, bottom):
    sc = Vector(scale) if hasattr(scale, "__len__") else Vector((scale, scale, scale))
    mn, mx = bounds(me)
    mid = (mn + mx) * 0.5
    center_z = bottom + (mx.z - mn.z) * sc.z * 0.5
    for v in me.vertices:
        v.co = Vector(((v.co.x - mid.x) * sc.x + x,
                       (v.co.y - mid.y) * sc.y + y,
                       (v.co.z - mid.z) * sc.z + center_z))
    me.update()


def mirror_x(me):
    bm = bmesh.new()
    bm.from_mesh(me)
    for v in bm.verts:
        v.co.x = -v.co.x
    bmesh.ops.reverse_faces(bm, faces=bm.faces)
    bm.to_mesh(me)
    bm.free()
    me.update()


def new_obj(name, me):
    me.name = name
    obj = bpy.data.objects.new(name, me)
    scene.collection.objects.link(obj)
    obj.data.materials.clear()
    obj.data.materials.append(mat)
    if me.uv_layers:
        me.uv_layers.active = me.uv_layers[0]
    made.append(obj)
    return obj


def fit_dimensions(me, size, center):
    low, high = bounds(me)
    extent = high - low
    place(me, tuple(size[i] / extent[i] for i in range(3)), center)


bpy.ops.import_scene.gltf(filepath=str(ROOT / 'public/models/player-anoa.glb'))
reference = next(obj for obj in bpy.context.selected_objects if obj.type == 'MESH')
reference.name = 'Anoa fitted reference'


def conform_foot(me, sign, height):
    """Give the enclosed shoes clearance over the actual hoof surface."""
    bm = bmesh.new(); bm.from_mesh(me)
    bmesh.ops.triangulate(bm, faces=list(bm.faces))
    bmesh.ops.subdivide_edges(bm, edges=list(bm.edges), cuts=2, use_grid_fill=True)
    bm.to_mesh(me); bm.free()
    for vertex in me.vertices:
        point = vertex.co
        # Leave the filled sole/footbed planar; projecting its internal vertices
        # onto a radial surface would collapse its triangles into the rim.
        if point.z < .04 or point.z > .34:
            continue
        t = max(0, min(1, point.z / height))
        center = Vector((sign * (.25 - .055 * t), .015, point.z))
        direction = point - center
        if direction.length < .001:
            continue
        distance = direction.length
        direction.normalize()
        found, hit, _normal, _index = reference.ray_cast(center, direction, distance=.4)
        if found and hit.x * sign > .03:
            clearance = (hit - center).length + .018
            if distance < clearance:
                vertex.co = center + direction * clearance
    me.update()


def fitted_sandal(sign, side):
    """Build a hoof sandal with a solid sole and open straps, without human socks."""
    vertices, faces, colors = [], [], []
    dark, tan, teal, brass = '#473322', '#bc9362', '#437e72', '#d6ab58'

    def surface(rings, color, cap=False, sides=32, sectors=None):
        offset = len(vertices)
        for z, cx, cy, rx, ry in rings:
            for step in range(sides):
                theta = 2 * math.pi * step / sides
                vertices.append((sign * (cx + rx * math.cos(theta)), cy + ry * math.sin(theta), z))
        for ring in range(len(rings) - 1):
            for step in range(sides):
                theta = 2 * math.pi * (step + .5) / sides
                if sectors and not sectors(theta):
                    continue
                a = offset + ring * sides + step
                b = offset + ring * sides + (step + 1) % sides
                face = (a, b, b + sides, a + sides)
                faces.append(face if sign > 0 else tuple(reversed(face))); colors.append(color)
        if cap:
            bottom = tuple(offset + i for i in reversed(range(sides)))
            top = tuple(offset + (len(rings) - 1) * sides + i for i in range(sides))
            faces.extend([bottom if sign > 0 else tuple(reversed(bottom)),
                          top if sign > 0 else tuple(reversed(top))])
            colors.extend([color, color])

    surface([(-.003, .25, .005, .153, .185), (.008, .25, .005, .164, .194),
             (.022, .25, .005, .164, .194)], dark, cap=True)
    surface([(.022, .25, .005, .164, .194), (.032, .25, .005, .157, .187)], tan, cap=True)
    # Broad toe strap; toes remain visible below it, as on an open sandal.
    surface([(.060, .246, .005, .149, .177), (.111, .232, .014, .128, .152)], teal,
            sectors=lambda theta: math.sin(theta) < -.15)
    surface([(.060, .246, .005, .151, .179), (.069, .244, .006, .147, .175)], brass,
            sectors=lambda theta: math.sin(theta) < -.15)
    # Heel cup connects the sole to the ankle strap instead of leaving a tall sock.
    surface([(.031, .25, .005, .153, .183), (.115, .225, .025, .119, .144),
             (.194, .202, .034, .106, .119)], teal,
            sectors=lambda theta: math.sin(theta) > .45)
    surface([(.180, .204, .032, .109, .122), (.223, .195, .032, .109, .122)], teal)
    surface([(.193, .201, .032, .112, .125), (.207, .198, .032, .112, .125)], brass)
    mesh = bpy.data.meshes.new('Hoof sandal ' + side)
    mesh.from_pydata(vertices, [], faces); mesh.update()
    # Store color per face before subdivision so Blender interpolates it along
    # the anatomical fit without introducing UV seams or atlas color bleeding.
    attribute = mesh.color_attributes.new(name='Col', type='BYTE_COLOR', domain='CORNER')
    for polygon, color in zip(mesh.polygons, colors):
        rgba = tuple(int(color[i:i+2], 16) / 255 for i in (1, 3, 5)) + (1,)
        for loop in polygon.loop_indices:
            attribute.data[loop].color_srgb = rgba
        polygon.use_smooth = True
    conform_foot(mesh, sign, .255)
    obj = bpy.data.objects.new('Wear_Bottom-Sandals_' + side, mesh)
    scene.collection.objects.link(obj)
    material = bpy.data.materials.get('Anoa fitted sandal colors')
    if material is None:
        material = bpy.data.materials.new('Anoa fitted sandal colors'); material.use_nodes = True
        bsdf = next(node for node in material.node_tree.nodes if node.type == 'BSDF_PRINCIPLED')
        color_node = material.node_tree.nodes.new('ShaderNodeVertexColor'); color_node.layer_name = 'Col'
        material.node_tree.links.new(color_node.outputs['Color'], bsdf.inputs['Base Color'])
        bsdf.inputs['Roughness'].default_value = .85
    mesh.materials.append(material)
    made.append(obj)
    return obj


# Each item has its own opening, rim or lens datum; tall decorations must not
# determine the fit of the hat's band. Glasses are aligned to the eyes at 1.50 m.
# (width, depth, height), centre Y, bottom Z.
HEAD_FIT = {
    'Head-AstronautHelmet': ((.60, .72, .58), -.10, 1.30),
    'Head-Beanie': ((.44, .43, .23), -.095, 1.565),
    'Head-BearBeanie': ((.47, .46, .32), -.095, 1.56),
    'Head-BikeHelmet': ((.48, .54, .26), -.09, 1.575),
    'Head-Bob': ((.49, .49, .24), -.11, 1.56),
    'Head-BunnyCap': ((.44, .42, .44), -.10, 1.57),
    'Head-Cap': ((.46, .46, .23), -.105, 1.57),
    'Head-Crown': ((.40, .40, .22), -.10, 1.605),
    'Head-DeerHat': ((.69, .34, .43), -.09, 1.57),
    'Head-Dino': ((.45, .56, .36), -.08, 1.57),
    'Head-Fish': ((.59, .51, .35), -.08, 1.585),
    'Head-FrenchBeret': ((.51, .49, .24), -.105, 1.61),
    'Head-Glass1': ((.44, .37, .12), -.18, 1.455),
    'Head-Glass2': ((.43, .36, .115), -.185, 1.455),
    'Head-GraduationHat': ((.69, .59, .30), -.09, 1.595),
    'Head-Heaset': ((.61, .24, .32), -.075, 1.43),
    'Head-MotorcycleHelmet': ((.54, .56, .43), -.10, 1.46),
    'Head-Scuba': ((.64, .48, .49), -.17, 1.32),
    'Head-Unicorn': ((.47, .21, .36), -.11, 1.55),
    'Head-Visor': ((.44, .43, .14), -.19, 1.59),
}


def horn_openings(obj):
    """Cut actual openings along the anoa's swept-back horn roots."""
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    for sign in (-1, 1):
        start = Vector((sign * .115, -.105, 1.645))
        end = Vector((sign * .278, .12, 1.92))
        direction = end - start
        def distance(point):
            t = (point - start).dot(direction) / direction.length_squared
            nearest = start + max(0, min(1, t)) * direction
            return (point - nearest).length, t
        nearby = [e for e in bm.edges if distance((e.verts[0].co + e.verts[1].co) * .5)[0] < .14]
        bmesh.ops.subdivide_edges(bm, edges=nearby, cuts=3, use_grid_fill=True)
        remove = []
        for face in bm.faces:
            d, t = distance(face.calc_center_median())
            if -.02 <= t <= 1.02 and d < .072 - .04 * max(0, min(1, t)):
                remove.append(face)
        # The source hats are open shells; cutting their surface avoids the
        # extra cutter faces a volume boolean would add to non-closed meshes.
        bmesh.ops.delete(bm, geom=remove, context='FACES')
    bm.to_mesh(obj.data)
    bm.free()
    obj.data.validate()


def keep_components(me, predicate):
    """Select complete mesh islands, never sever the opposite shoe at X=0."""
    bm = bmesh.new(); bm.from_mesh(me)
    unseen = set(bm.verts)
    remove = []
    while unseen:
        start = unseen.pop(); stack = [start]; component = [start]
        while stack:
            vertex = stack.pop()
            for edge in vertex.link_edges:
                other = edge.other_vert(vertex)
                if other in unseen:
                    unseen.remove(other); stack.append(other); component.append(other)
        center = sum((v.co for v in component), Vector()) / len(component)
        if not predicate(center): remove.extend(component)
    bmesh.ops.delete(bm, geom=remove, context='VERTS')
    bm.to_mesh(me); bm.free(); me.update()


for item, (size, y, bottom) in HEAD_FIT.items():
    me = world_mesh(source_obj(item))
    fit_dimensions(me, size, (0, y, bottom + size[2] / 2))
    if item == 'Head-Scuba':
        # The snorkel extends to one side; align the mask, not the combined bbox.
        for vertex in me.vertices:
            vertex.co.x += .055
            vertex.co.z += .018
    obj = new_obj('Wear_' + item, me)
    if item not in {'Head-Glass1', 'Head-Glass2', 'Head-Scuba', 'Head-Heaset'}:
        horn_openings(obj)

# Backpacks clear the existing traditional shoulder pads; the buoy is widened
# across the belly rather than stretched forward through the torso.
BODY_FIT = {
    'Body-Bumbag': ((.43, .53, .19), -.08, .92),
    'Body-Buoy': ((.72, .75, .32), -.035, .98),
    'Body-JetPack': ((.48, .29, .48), .35, 1.08),
    'Body-OxygenBottle': ((.43, .31, .55), .34, 1.075),
    'Body-Shark': ((.46, .62, .43), .105, 1.13),
    'Body-UrbanBackpack': ((.40, .39, .48), .29, 1.105),
    'Body-Wings': ((1.03, .39, .48), .33, 1.20),
}
for item, (size, y, z) in BODY_FIT.items():
    me = world_mesh(source_obj(item))
    fit_dimensions(me, size, (0, y, z))
    new_obj('Wear_' + item, me)

# Dino is a pair of gloves authored on an outstretched humanoid. Separate the
# hands and rotate the opening onto the anoa's lowered forearms before sizing.
for side, sign in [('L', 1), ('R', -1)]:
    me = world_mesh(source_obj('Body-Dino'))
    keep_components(me, lambda p: p.x * sign > .75)
    from mathutils import Matrix
    low, high = bounds(me); middle = (low + high) * .5
    rotation = Matrix.Rotation(sign * math.radians(70), 3, 'Y')
    for v in me.vertices: v.co = rotation @ (v.co - middle)
    fit_dimensions(me, (.225, .245, .31), (sign * .457, -.045, .60))
    new_obj('Wear_Body-Dino_' + side, me)

tail = world_mesh(source_obj('Body-Dino'))
keep_components(tail, lambda p: abs(p.x) < .5)
fit_dimensions(tail, (.30, .50, .45), (0, .40, .77))
new_obj('Wear_Body-Dino_Tail', tail)

# Width follows the hoof, while the upper opening follows the inward-sloping
# ankle. The same ground plane is shared by every option.
FOOT_FIT = {
    'Bottom-LowSneakers': ((.335, .395, .245), -.006),
    'Bottom-MidSneakers': ((.335, .395, .32), -.006),
    'Bottom-Sandals': ((.325, .37, .255), -.005),
    'Bottom-Palm': ((.33, .58, .23), -.11),
    'Bottom-Dino': ((.34, .40, .305), -.01),
    'Bottom-FastShoes': ((.345, .41, .27), -.01),
}
for item, (size, y) in FOOT_FIT.items():
    if item == 'Bottom-Sandals':
        fitted_sandal(-1, 'R')
        fitted_sandal(1, 'L')
        continue
    right = world_mesh(source_obj(item))
    keep_components(right, lambda p: p.x < 0)
    left = right.copy()
    mirror_x(left)
    for side, me in [("R", right), ("L", left)]:
        sign = 1 if side == 'L' else -1
        fit_dimensions(me, size, (sign * .25, y, size[2] * .5 - GROUND_SINK))
        for v in me.vertices:
            t = max(0, min(1, v.co.z / size[2]))
            v.co.x -= sign * .055 * t
        if item not in {'Bottom-Sandals', 'Bottom-Palm'}:
            conform_foot(me, sign, size[2])
        new_obj(f"Wear_{item}_{side}", me)

bpy.ops.object.select_all(action="DESELECT")
for obj in made:
    obj.select_set(True)
bpy.context.view_layer.objects.active = made[0]
bpy.ops.export_scene.gltf(
    filepath=str(OUT),
    export_format="GLB",
    use_selection=True,
    use_active_scene=True,
    export_yup=True,
    export_apply=True,
    export_materials="EXPORT",
    export_texcoords=True,
    export_normals=True,
    export_vertex_color="ACTIVE",
    export_animations=False,
    export_skins=False,
    export_cameras=False,
    export_lights=False,
)

for obj in made:
    mn, mx = bounds(obj.data)
    print("WEAR", obj.name, len(obj.data.vertices), len(obj.data.polygons),
          tuple(round(v, 4) for v in mn), tuple(round(v, 4) for v in mx))
print("WROTE", OUT)

# Keep only our authoring objects in this scene, leaving other user scenes alone.
for obj in native:
    bpy.data.objects.remove(obj, do_unlink=True)
for obj in made:
    obj.hide_set(obj.name not in {'Wear_Head-Glass2', 'Wear_Body-UrbanBackpack',
                                'Wear_Bottom-LowSneakers_L', 'Wear_Bottom-LowSneakers_R'})
report = [{'node': obj.name, 'vertices': len(obj.data.vertices),
           'boundsBlender': [list(v) for v in bounds(obj.data)]} for obj in made]
report_path = ROOT / 'artifacts/accessory-fit'
report_path.mkdir(parents=True, exist_ok=True)
(report_path / 'native-fit-report.json').write_text(json.dumps(report, indent=2))
