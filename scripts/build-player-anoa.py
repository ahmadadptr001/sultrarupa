"""Rebuild the Sultra Rupa player character from the local anoa base mesh.

Run in a separate Blender process:
  blender --background --factory-startup --python scripts/build-player-anoa.py

The author file (~/Downloads/karakter anoa/base_basic_shaded.glb) stays
untouched. Its baked shaded texture is emissive-only with a black base color,
the same unlit setup the previous player model used and what
public/assets/opening-boat.js convertMaterials() turns into a MeshBasicMaterial.
The web runtime (public/assets/player-character.js) procedurally skins this
geometry onto the game's own skeleton, so the authored pose, scale and origin
must survive the export untouched. Only seam duplicates are welded and the
2048px texture is re-encoded as JPEG.
"""

import json
import struct
from pathlib import Path

import bmesh
import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path.home() / "Downloads" / "karakter anoa" / "base_basic_shaded.glb"
DEST = ROOT / "public/models/player-anoa.glb"
PREVIEWS = ROOT / "artifacts/player"


def bounds(meshes):
    points = [obj.matrix_world @ Vector(corner) for obj in meshes for corner in obj.bound_box]
    low = Vector(tuple(min(p[i] for p in points) for i in range(3)))
    high = Vector(tuple(max(p[i] for p in points) for i in range(3)))
    return low, high


def triangle_count(meshes):
    for obj in meshes:
        obj.data.calc_loop_triangles()
    return sum(len(obj.data.loop_triangles) for obj in meshes)


def render_views(meshes):
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.samples = 12
    scene.cycles.use_denoising = True
    scene.render.resolution_x = 720
    scene.render.resolution_y = 900
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False
    scene.view_settings.view_transform = "Standard"
    if scene.world is None:
        scene.world = bpy.data.worlds.new("Inspection background")
    scene.world.color = (0.16, 0.18, 0.21)
    low, high = bounds(meshes)
    size = high - low
    center = (high + low) / 2
    cam_data = bpy.data.cameras.new("Inspection camera")
    cam_data.type = "ORTHO"
    cam_data.ortho_scale = max(size.z * 1.18, max(size.x, size.y) * 1.5)
    camera = bpy.data.objects.new("Inspection camera", cam_data)
    scene.collection.objects.link(camera)
    scene.camera = camera
    previews = []
    # Blender imports glTF Y-up into Z-up. Its -Y view is glTF +Z, the face side.
    for name, direction in [("front", (0, -1, 0.13)), ("back", (0, 1, 0.13)), ("side", (1, 0, 0.13)), ("three-quarter", (0.75, -1, 0.28))]:
        camera.location = center + Vector(direction).normalized() * size.length * 2
        camera.rotation_euler = (center - camera.location).to_track_quat("-Z", "Y").to_euler()
        scene.render.filepath = str(PREVIEWS / f"player-anoa-{name}.png")
        bpy.ops.render.render(write_still=True)
        previews.append(scene.render.filepath)
    return previews


def read_glb_json(path):
    data = path.read_bytes()
    chunk_length = struct.unpack_from("<I", data, 12)[0]
    return json.loads(data[20:20 + chunk_length])


DEST.parent.mkdir(parents=True, exist_ok=True)
PREVIEWS.mkdir(parents=True, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(SOURCE))
meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
source_triangles = triangle_count(meshes)
source_vertices = sum(len(obj.data.vertices) for obj in meshes)

for obj in meshes:
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    # Imported meshes split vertices along UV seams. Merge them before export so
    # the runtime skins each surface point once; UVs stay per face corner.
    mesh = bmesh.new()
    mesh.from_mesh(obj.data)
    bmesh.ops.remove_doubles(mesh, verts=list(mesh.verts), dist=0.00001)
    mesh.to_mesh(obj.data)
    mesh.free()
    obj.data.validate(clean_customdata=True)
    obj.data.update()
    obj.name = "Sultra player anoa"

for img in bpy.data.images:
    img.file_format = "JPEG"

bpy.ops.export_scene.gltf(
    filepath=str(DEST), export_format="GLB", use_selection=True,
    export_image_format="JPEG", export_jpeg_quality=92,
    export_cameras=False, export_lights=False, export_animations=False,
)

exported = read_glb_json(DEST)
mesh_json = exported["meshes"][0]["primitives"][0]
position_accessor = exported["accessors"][mesh_json["attributes"]["POSITION"]]
material_json = exported["materials"][0]
image_json = exported["images"][0]
image = next(img for img in bpy.data.images if img.size[0])
record = {
    "id": "player-anoa",
    "source": str(SOURCE),
    "output": str(DEST.relative_to(ROOT)),
    "sourceBytes": SOURCE.stat().st_size,
    "outputBytes": DEST.stat().st_size,
    "material": {
        "emissiveTexture": "emissiveTexture" in material_json,
        "emissiveFactor": material_json.get("emissiveFactor"),
        "baseColorFactor": material_json["pbrMetallicRoughness"].get("baseColorFactor"),
    },
    "sourceTriangles": source_triangles,
    "triangles": triangle_count(meshes),
    "sourceVertices": source_vertices,
    "vertices": sum(len(obj.data.vertices) for obj in meshes),
    "image": {"mimeType": image_json.get("mimeType"), "size": [round(v) for v in image.size]},
    "boundsGltf": {"min": position_accessor["min"], "max": position_accessor["max"]},
    "coordinateSystem": "glTF: Y up, +Z forward, base Y=0, authored pose kept for runtime skinning",
}
print("PLAYER_ANOA", json.dumps(record), flush=True)
record["previews"] = render_views(meshes)
(PREVIEWS / "asset-report.json").write_text(json.dumps(record, indent=2), encoding="utf-8")
print("PLAYER_ANOA_COMPLETE", flush=True)
