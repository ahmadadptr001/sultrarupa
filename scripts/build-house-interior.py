"""Author the Sultrarupa interior in an isolated Blender scene.

Run in Blender's Python console or with blender --background --python this_file.
The immutable original GLB is the only geometry input. Export selects this scene's
meshes/empties only; saving a library leaves the user's open .blend untouched.
"""
from pathlib import Path
from math import cos, sin, pi
import hashlib
import json
import shutil

import bpy
from mathutils import Matrix, Vector

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'public/models/interiors/ruangan-kotak-besar.glb'
SOURCE = ROOT / 'backups/interiors/ruangan-kotak-besar-original.glb'
ARTIFACTS = ROOT / 'artifacts/interiors'
SOURCE_SHA256 = 'e0b821cd2bc3580046ed17e95dff29ba80014f85716d5ee9319455d01c140f40'

if not SOURCE.exists():
    if hashlib.sha256(OUTPUT.read_bytes()).hexdigest() != SOURCE_SHA256:
        raise RuntimeError('Original interior is missing; refusing to overwrite its backup.')
    SOURCE.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(OUTPUT, SOURCE)
if hashlib.sha256(SOURCE.read_bytes()).hexdigest() != SOURCE_SHA256:
    raise RuntimeError('Interior source backup differs from the original.')
ARTIFACTS.mkdir(parents=True, exist_ok=True)

# Retain earlier authoring scenes as snapshots while freeing the exact runtime
# node names (Blender otherwise silently suffixes InteriorDoor on a rebuild).
for previous_scene in bpy.data.scenes:
    if previous_scene.get('sultrarupaInterior'):
        for previous_object in previous_scene.objects:
            if not previous_object.name.startswith('Previous interior / '):
                previous_object.name = 'Previous interior / ' + previous_object.name

scene = bpy.data.scenes.new('Sultrarupa traditional interior')
scene['sultrarupaInterior'] = True
if bpy.context.window:
    bpy.context.window.scene = scene

# Import only into this new scene. Apply the original mesh's transform in world
# coordinates before raising the walls, keeping its floor and baked UVs intact.
bpy.ops.import_scene.gltf(filepath=str(SOURCE))
source_objects = list(scene.objects)
mesh_objects = [obj for obj in source_objects if obj.type == 'MESH']
points = [obj.matrix_world @ vertex.co for obj in mesh_objects for vertex in obj.data.vertices]
low = Vector(tuple(min(p[axis] for p in points) for axis in range(3)))
high = Vector(tuple(max(p[axis] for p in points) for axis in range(3)))
offset = Vector(((low.x + high.x) / 2, (low.y + high.y) / 2, low.z))
for obj in mesh_objects:
    world = obj.matrix_world.copy()
    obj.parent = None
    for vertex in obj.data.vertices:
        point = world @ vertex.co - offset
        if point.z > 0.03:
            point.z = 0.03 + (point.z - 0.03) * 1.28
        vertex.co = point
    obj.matrix_world = Matrix.Identity(4)
    obj.name = 'TraditionalRoomShell'
    obj.data.update()
    # The source texture already contains its lighting. Match the browser's
    # MeshBasicMaterial preview without relighting the baked image in Blender.
    for mat in obj.data.materials:
        if not mat or not mat.use_nodes:
            continue
        bsdf = next((n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
        texture = next((n for n in mat.node_tree.nodes if n.type == 'TEX_IMAGE'), None)
        if bsdf and texture:
            mat.node_tree.links.new(texture.outputs['Color'], bsdf.inputs['Emission Color'])
            bsdf.inputs['Emission Strength'].default_value = 1.0
            bsdf.inputs['Base Color'].default_value = (0, 0, 0, 1)
for obj in source_objects:
    if obj.type != 'MESH' and not obj.children:
        bpy.data.objects.remove(obj, do_unlink=True)

def srgb(value):
    return value / 12.92 if value <= 0.04045 else ((value + 0.055) / 1.055) ** 2.4

PALETTE = {
    'wood': (0.48, 0.30, 0.17), 'woodlight': (0.64, 0.43, 0.25),
    'wooddark': (0.28, 0.17, 0.10), 'edge': (0.39, 0.24, 0.13),
    'straw': (0.72, 0.60, 0.38), 'strawlight': (0.84, 0.73, 0.49),
    'strawdark': (0.48, 0.38, 0.22), 'indigo': (0.20, 0.29, 0.34),
    'cream': (0.84, 0.76, 0.57), 'red': (0.55, 0.20, 0.15),
    'clay': (0.65, 0.36, 0.25), 'claylight': (0.72, 0.46, 0.31),
    'black': (0.15, 0.13, 0.11), 'gold': (0.81, 0.60, 0.21),
    'leaf': (0.54, 0.53, 0.28),
}

# One shared vertex-color material keeps the new geometry inexpensive to draw.
# Directional shading is written into COLOR_0 for the website's unlit renderer.
material = bpy.data.materials.new('Interior vertex-lit natural materials')
material.use_nodes = True
nodes = material.node_tree.nodes
bsdf = next(n for n in nodes if n.type == 'BSDF_PRINCIPLED')
color_node = nodes.new('ShaderNodeVertexColor')
color_node.layer_name = 'Color'
material.node_tree.links.new(color_node.outputs['Color'], bsdf.inputs['Base Color'])
material.node_tree.links.new(color_node.outputs['Color'], bsdf.inputs['Emission Color'])
bsdf.inputs['Emission Strength'].default_value = 1
bsdf.inputs['Roughness'].default_value = 1

def paint(obj, color, variation=0):
    if isinstance(color, str):
        color = PALETTE[color]
    mesh = obj.data
    mesh.materials.clear()
    mesh.materials.append(material)
    attr = mesh.color_attributes.get('Color') or mesh.color_attributes.new(
        name='Color', type='FLOAT_COLOR', domain='CORNER')
    light = Vector((-0.4, -0.6, 1)).normalized()
    for face in mesh.polygons:
        normal = obj.matrix_world.to_3x3() @ face.normal
        shade = 0.72 + 0.28 * max(0, normal.normalized().dot(light))
        shade *= 1 + variation * (((face.index * 17) % 11) / 10 - 0.5)
        rgba = tuple(srgb(min(1, max(0, c * shade))) for c in color) + (1,)
        for loop in face.loop_indices:
            attr.data[loop].color = rgba
    return obj

def box(name, location, size, color):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    paint(obj, color)
    return obj

def group(name, objects, collider=False, house_ids=None):
    root = bpy.data.objects.new(name, None)
    scene.collection.objects.link(root)
    for obj in objects:
        obj.parent = root
    if collider:
        root['interiorCollider'] = True
    if house_ids:
        root['houseIds'] = house_ids
    return root

def merge(name, objects, collider=False, house_ids=None):
    bpy.ops.object.select_all(action='DESELECT')
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.object.join()
    obj = bpy.context.object
    obj.name = name
    if collider:
        obj['interiorCollider'] = True
    if house_ids:
        obj['houseIds'] = house_ids
    return obj

def rod(name, a, b, width, color):
    a, b = Vector(a), Vector(b)
    obj = box(name, (a + b) / 2, (width, width, (b - a).length), color)
    obj.rotation_euler = (b - a).to_track_quat('Z', 'Y').to_euler()
    paint(obj, color)
    return obj

def ring(name, location, radius, thickness, color, segments=32):
    verts, faces = [], []
    for i in range(segments):
        angle = 2 * pi * i / segments
        for j in range(6):
            section = 2 * pi * j / 6
            r = radius + thickness * cos(section)
            verts.append((location[0] + r * cos(angle), location[1] + r * sin(angle), location[2] + thickness * sin(section)))
    for i in range(segments):
        for j in range(6):
            faces.append((i*6+j, ((i+1)%segments)*6+j, ((i+1)%segments)*6+(j+1)%6, i*6+(j+1)%6))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    scene.collection.objects.link(obj)
    return paint(obj, color)

def vessel(name, location, profile, color, segments=28):
    verts, faces = [], []
    for radius, height in profile:
        for i in range(segments):
            angle = 2*pi*i/segments
            verts.append((location[0]+radius*cos(angle), location[1]+radius*sin(angle), location[2]+height))
    for row in range(len(profile)-1):
        for i in range(segments):
            faces.append((row*segments+i, row*segments+(i+1)%segments, (row+1)*segments+(i+1)%segments, (row+1)*segments+i))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    scene.collection.objects.link(obj)
    paint(obj, color, 0.08)
    return obj

# Exposed timber follows the existing room; nothing extends its footprint.
beams = []
for y in (-5.2, 0, 5.2):
    beams.append(box('Ceiling crossbeam', (0, y, 4.94), (15.6, 0.24, 0.30), 'wooddark'))
for x in (-5.3, 5.3):
    beams.append(box('Ceiling runner', (x, 0, 5.03), (0.18, 15.6, 0.19), 'wood'))
for x in (-7.78, 7.78):
    beams.append(box('Wall upper rail', (x, 0, 4.25), (0.17, 15.7, 0.21), 'wooddark'))
    for y in (-5.2, 0, 5.2):
        beams.append(box('Timber upright', (x, y, 2.48), (0.23, 0.25, 4.9), 'wood'))
beams.append(box('Rear wall upper rail', (0, 7.78, 4.25), (15.7, 0.17, 0.21), 'wooddark'))
merge('Exposed timber structure', beams)

# A single closed door is a deliberate portal back to the island. Its framing
# overlays the source wall without cutting or remapping the baked texture.
door_parts = [box('Door recess', (0, 7.86, 1.52), (2.08, 0.04, 3.04), 'black')]
for x in (-1.0, 1.0):
    door_parts.append(box('Door jamb', (x, 7.66, 1.52), (0.19, 0.27, 3.04), 'wooddark'))
door_parts.append(box('Door lintel', (0, 7.66, 3.04), (2.22, 0.30, 0.21), 'woodlight'))
door_parts.append(box('Door threshold', (0, 7.61, 0.07), (2.1, 0.40, 0.09), 'wooddark'))
door_parts.append(box('Door leaf', (0, 7.76, 1.49), (1.75, 0.12, 2.88), 'wood'))
for x in (-0.47, 0.47):
    for z, h in ((0.91, 1.17), (2.17, 1.01)):
        door_parts.append(box('Inset wood panel', (x, 7.68, z), (0.66, 0.05, h), 'wooddark'))
        door_parts.append(box('Raised wood panel', (x, 7.64, z), (0.56, 0.04, h-0.12), 'woodlight'))
for z in (0.20, 1.53, 2.80):
    door_parts.append(box('Door cross rail', (0, 7.61, z), (1.74, 0.08, 0.11), 'wood'))
door_parts.append(box('Door centre stile', (0, 7.61, 1.49), (0.10, 0.07, 2.84), 'wood'))
door_parts.append(box('Wooden door grip', (0.68, 7.48, 1.35), (0.07, 0.09, 0.29), 'wooddark'))
merge('InteriorDoor', door_parts)

vent = [box('Vent shadow', (0, 7.86, 3.75), (3.5, 0.035, 0.56), 'black')]
for z in (3.46, 4.04):
    vent.append(box('Vent frame', (0, 7.76, z), (3.7, 0.12, 0.09), 'woodlight'))
for i in range(19):
    vent.append(box('Vent slat', (-1.71+i*0.19, 7.73, 3.75), (0.055, 0.12, 0.56), 'wood'))
merge('Timber ventilation grille', vent)

# Flat woven mat: fine alternating strands plus a restrained woven border.
mat_parts = [box('Woven mat base', (0, 0.2, 0.055), (5.4, 3.8, 0.045), 'strawdark')]
for i in range(64):
    mat_parts.append(box('Mat warp', (-2.64+i*0.084, 0.2, 0.081), (0.044, 3.72, 0.012), 'straw' if i%2 else 'strawlight'))
for j in range(43):
    mat_parts.append(box('Mat weft', (0, -1.64+j*0.087, 0.088), (5.3, 0.024, 0.012), 'straw'))
for y in (-1.57, 1.97):
    for dy, color in ((0,'indigo'),(-0.075,'cream'),(0.075,'cream')):
        mat_parts.append(box('Mat woven edging', (0, y+dy, 0.099), (5.30, 0.055, 0.014), color))
for x in (-2.56, 2.56):
    mat_parts.append(box('Mat short edging', (x, 0.2, 0.10), (0.055, 3.7, 0.014), 'indigo'))
merge('Woven sitting mat', mat_parts)

for side in (-1, 1):
    x, y = side*5.5, 1.7
    parts = []
    for dx in (-0.26, 0, 0.26):
        parts.append(box('Bench seat board', (x+dx,y,0.57), (0.245,2.9,0.105), 'woodlight'))
    for dy in (-1.12,1.12):
        for dx in (-0.25,0.25):
            parts.append(box('Bench foot', (x+dx,y+dy,0.28), (0.13,0.16,0.52), 'wooddark'))
        parts.append(box('Bench support', (x,y+dy,0.45), (0.75,0.17,0.16), 'wood'))
    parts.append(box('Bench stretcher', (x,y,0.24), (0.12,2.45,0.13), 'wood'))
    merge('Low timber bench left' if side<0 else 'Low timber bench right', parts, collider=True)

folded = [box('Folded handwoven cloth',(-5.5,1.4,0.66),(0.72,1.5,0.08),'indigo')]
for y in (0.78,0.9,1.9,2.02):
    folded.append(box('Cloth woven bands',(-5.5,y,0.707),(0.71,0.045,0.012),'cream'))
merge('Folded woven cloth', folded)

def basket(name, location, scale=1):
    x,y,z = location
    s = scale
    parts = [vessel(name,location,[(0.29*s,0.04),(0.38*s,0.20*s),(0.46*s,0.66*s),(0.43*s,0.72*s),(0.39*s,0.71*s),(0.34*s,0.20*s),(0.22*s,0.07)],'straw')]
    for i in range(12):
        h=(0.13+i*0.048)*s
        r=(0.36+0.13*(h/s-0.13)/0.53)*s
        parts.append(ring('Basket horizontal weave',(x,y,z+h),r,0.012*s,'strawdark'))
    for i in range(20):
        angle=2*pi*i/20
        parts.append(rod('Basket vertical weave',(x+0.34*s*cos(angle),y+0.34*s*sin(angle),z+0.12*s),(x+0.43*s*cos(angle),y+0.43*s*sin(angle),z+0.70*s),0.016*s,'strawlight'))
    parts.append(ring('Basket bound rim',(x,y,z+0.72*s),0.43*s,0.035*s,'strawlight'))
    return merge(name,parts,collider=True)

basket('Woven storage basket',(-4.7,5.9,0.025),1.2)
basket('Small woven basket',(-5.8,5.45,0.025),0.78)
for name, loc, size, color in (
    ('Clay water vessel',(4.9,5.8,0.025),1.05,'clay'),
    ('Small clay vessel',(5.85,5.35,0.025),0.72,'claylight'),
):
    profile=[(0.23,0),(0.35,0.10),(0.48,0.40),(0.42,0.71),(0.23,0.92),(0.21,1.02),(0.27,1.05),(0.27,1.10),(0.18,1.10),(0.17,1.02),(0.19,0.91),(0.34,0.68),(0.39,0.40),(0.25,0.12),(0.12,0.09)]
    pot=vessel(name,loc,[(r*size,z*size) for r,z in profile],color)
    pot['interiorCollider']=True

# Modest generic woven textile; the bands are a visual interpretation, not a
# named ceremonial motif. House-specific objects below are separately tagged.
cloth=[box('Hanging woven cloth',(-4.0,7.74,2.2),(1.6,0.035,2.0),'indigo')]
for z in (1.32,1.43,2.92,3.03):
    cloth.append(box('Hanging cloth border',(-4.0,7.71,z),(1.58,0.025,0.055),'cream'))
for x in (-4.7,-3.3):
    cloth.append(box('Cloth long border',(x,7.71,2.2),(0.045,0.025,1.9),'red'))
cloth.append(rod('Textile timber rod',(-4.92,7.66,3.25),(-3.08,7.66,3.25),0.06,'wooddark'))
merge('Woven wall textile',cloth)

# Kaghati Kolope leaf-kite interpretation, only in the Muna house/museum.
kite_mesh=bpy.data.meshes.new('Leaf kite mesh')
kite_mesh.from_pydata([(3.35,7.68,3.18),(2.62,7.68,2.24),(3.35,7.68,1.22),(4.08,7.68,2.24)],[],[(0,1,2,3)])
kite_mesh.update()
kite=bpy.data.objects.new('Leaf kite body',kite_mesh)
scene.collection.objects.link(kite)
paint(kite,'leaf')
kite_parts=[kite,rod('Kite bamboo spine',(3.35,7.64,1.20),(3.35,7.64,3.20),0.025,'strawdark'),rod('Kite bamboo cross',(2.60,7.64,2.24),(4.10,7.64,2.24),0.025,'strawdark')]
for z in (1.7,2.0,2.5,2.8):
    span=0.7*(1-abs(z-2.24)/1.02)
    kite_parts.append(rod('Kite leaf stitching',(3.35-span,7.63,z),(3.35+span,7.63,z),0.011,'strawlight'))
merge('Muna leaf kite',kite_parts,house_ids=['bharugano-wuna'])

# Tabere-inspired fern strokes and its documented palette belong to Mekongga.
fern_parts=[box('Mekongga lintel accent',(0,7.52,3.29),(2.22,0.04,0.28),'black')]
for z in (3.17,3.41):
    fern_parts.append(box('Mekongga red border',(0,7.49,z),(2.22,0.025,0.032),'red'))
for side in (-1,1):
    fern_parts.append(rod('Fern stem',(side*0.08,7.47,3.22),(side*0.93,7.47,3.33),0.025,'gold'))
    for i in range(5):
        x=side*(0.25+i*0.14)
        fern_parts.append(rod('Fern frond',(x,7.46,3.25+i*0.018),(x-side*0.09,7.46,3.36+i*0.003),0.018,'gold'))
merge('Mekongga fern lintel',fern_parts,house_ids=['mekongga'])

# Camera is stored in the independent authoring file, never exported to the app.
camera_data=bpy.data.cameras.new('Interior review camera')
camera=bpy.data.objects.new('Interior review camera',camera_data)
scene.collection.objects.link(camera)
camera.location=(0,-6.1,1.65)
camera.rotation_euler=(Vector((0,6.4,2.08))-camera.location).to_track_quat('-Z','Y').to_euler()
camera_data.lens=22
scene.camera=camera
scene.render.resolution_x=1400
scene.render.resolution_y=900
scene.render.resolution_percentage=100
scene.world=bpy.data.worlds.new('Interior preview world')
scene.world.color=(0.15,0.15,0.15)
try:
    scene.view_settings.view_transform='Standard'
except TypeError:
    pass

export_props=bpy.ops.export_scene.gltf.get_rna_type().properties
export_args=dict(filepath=str(OUTPUT),use_selection=True,use_active_scene=True,export_extras=True)
# Blender's dynamic format enum may expose no items through RNA. The exporter
# defaults to GLB for a .glb path, so leave it at the operator default.
if 'export_vertex_color' in export_props:
    color_options={item.identifier for item in export_props['export_vertex_color'].enum_items}
    if 'ACTIVE' in color_options:
        export_args['export_vertex_color']='ACTIVE'
if 'export_all_vertex_colors' in export_props:
    export_args['export_all_vertex_colors']=True
bpy.ops.object.select_all(action='DESELECT')
for obj in scene.objects:
    if obj.type in {'MESH','EMPTY'}:
        obj.select_set(True)
bpy.context.view_layer.objects.active=mesh_objects[0]
bpy.ops.export_scene.gltf(**export_args)

blend_path=ARTIFACTS/'traditional-house-interior.blend'
bpy.data.libraries.write(str(blend_path),{scene},path_remap='RELATIVE',fake_user=True,compress=True)
metadata={
    'source':str(SOURCE.relative_to(ROOT)),
    'sourceSha256':SOURCE_SHA256,
    'output':str(OUTPUT.relative_to(ROOT)),
    'outputBytes':OUTPUT.stat().st_size,
    'roomFootprint':[16.1,16.1],
    'heightBefore':round(high.z-low.z,4),
    'heightAfter':round(0.03+(high.z-low.z-0.03)*1.28,4),
    'doorBlender':[0,7.7,1.5],
    'colliders':[obj.name for obj in scene.objects if obj.get('interiorCollider')],
    'houseVariants':{obj.name:list(obj['houseIds']) for obj in scene.objects if obj.get('houseIds')},
    'scene':scene.name,
}
(ARTIFACTS/'interior-build.json').write_text(json.dumps(metadata,indent=2),encoding='utf-8')
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type=='VIEW_3D':
            area.spaces.active.region_3d.view_perspective='CAMERA'
print(json.dumps(metadata,indent=2))
