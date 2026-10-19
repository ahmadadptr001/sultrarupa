"""Prepare local monument scans for the island without changing their originals.

Run in a separate Blender process:
  blender --background --factory-startup --python scripts/build-monument-assets.py

Use the PBR variant's diffuse/base-color map instead of the shaded texture, which
contains baked directional shadows. Export that color as an unlit material so
every side stays equally illuminated in the game's convertMaterials loader.
"""

import json
from pathlib import Path

import bmesh
import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public/models/culture"
PREVIEWS = ROOT / "artifacts/monuments"
ASSETS = [
    ("tugu-mtq", "tugu mtq asset glb", "Tugu MTQ", 70000),
    ("patung-oputa", "patung oputa", "Patung Oputa", 90000),
]


def bounds(meshes):
    points = [obj.matrix_world @ Vector(corner) for obj in meshes for corner in obj.bound_box]
    low = Vector(tuple(min(p[i] for p in points) for i in range(3)))
    high = Vector(tuple(max(p[i] for p in points) for i in range(3)))
    return low, high


def triangle_count(meshes):
    for obj in meshes:
        obj.data.calc_loop_triangles()
    return sum(len(obj.data.loop_triangles) for obj in meshes)


def use_unlit_base_color(meshes):
    materials = {material for obj in meshes for material in obj.data.materials if material}
    kept_images = set()
    for material in materials:
        nodes = material.node_tree.nodes
        principled = next(node for node in nodes if node.type == "BSDF_PRINCIPLED")
        color_input = principled.inputs["Base Color"]
        if not color_input.is_linked or color_input.links[0].from_node.type != "TEX_IMAGE":
            raise ValueError(f"Missing source base-color texture in {material.name}")
        image = color_input.links[0].from_node.image
        kept_images.add(image)
        image.colorspace_settings.name = "sRGB"
        nodes.clear()
        texture = nodes.new("ShaderNodeTexImage")
        texture.image = image
        texture.label = "Original diffuse color without baked directional light"
        output = nodes.new("ShaderNodeOutputMaterial")
        # Blender treats color connected to Surface as strength-one emission.
        # Its glTF exporter recognizes this as KHR_materials_unlit, preserving
        # the base-color texture without normal, metallic, or lighting inputs.
        material.node_tree.links.new(texture.outputs["Color"], output.inputs["Surface"])
        material.name = "Monument - evenly lit original color"
        material.use_backface_culling = False
    for image in list(bpy.data.images):
        if image not in kept_images:
            bpy.data.images.remove(image)


def render_views(slug, meshes):
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
    cam_data.ortho_scale = max(size.z * 1.22, max(size.x, size.y) * 1.5)
    camera = bpy.data.objects.new("Inspection camera", cam_data)
    scene.collection.objects.link(camera)
    scene.camera = camera
    previews = []
    # Blender imports glTF Y-up into Z-up. Its -Y view is glTF +Z.
    for name, direction in [("front", (0, -1, 0.13)), ("back", (0, 1, 0.13)), ("side", (1, 0, 0.13)), ("three-quarter", (0.75, -1, 0.28))]:
        camera.location = center + Vector(direction).normalized() * size.length * 2
        camera.rotation_euler = (center - camera.location).to_track_quat("-Z", "Y").to_euler()
        scene.render.filepath = str(PREVIEWS / f"{slug}-{name}.png")
        bpy.ops.render.render(write_still=True)
        previews.append(scene.render.filepath)
    return previews


OUTPUT.mkdir(parents=True, exist_ok=True)
PREVIEWS.mkdir(parents=True, exist_ok=True)
report = []
for slug, folder, label, target in ASSETS:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    source = Path.home() / "Downloads" / folder / "base_basic_pbr.glb"
    bpy.ops.import_scene.gltf(filepath=str(source))
    meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    source_triangles = triangle_count(meshes)
    source_vertices = sum(len(obj.data.vertices) for obj in meshes)
    original_images = [{"name": img.name, "size": list(img.size)} for img in bpy.data.images]
    use_unlit_base_color(meshes)
    for obj in meshes:
        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)
        # Imported scans split vertices along UV seams. Merge geometry before
        # collapse; UV coordinates remain stored per face corner.
        mesh = bmesh.new()
        mesh.from_mesh(obj.data)
        bmesh.ops.remove_doubles(mesh, verts=list(mesh.verts), dist=0.00001)
        mesh.to_mesh(obj.data)
        mesh.free()
        obj.data.validate(clean_customdata=True)
        obj.data.update()
        modifier = obj.modifiers.new("Web detail", "DECIMATE")
        modifier.ratio = min(1.0, target / source_triangles)
        modifier.use_collapse_triangulate = True
        bpy.ops.object.modifier_apply(modifier=modifier.name)
        obj.data.validate(clean_customdata=True)
        obj.data.update()
        obj.name = label
    for img in bpy.data.images:
        if max(img.size) > 2048:
            ratio = 2048 / max(img.size)
            img.scale(round(img.size[0] * ratio), round(img.size[1] * ratio))
        # JPEG reduces download size while preserving the original base color.
        img.file_format = "JPEG"
    low, high = bounds(meshes)
    dest = OUTPUT / f"{slug}.glb"
    bpy.ops.export_scene.gltf(
        filepath=str(dest), export_format="GLB", use_selection=True,
        export_image_format="JPEG", export_jpeg_quality=92,
        export_cameras=False, export_lights=False, export_animations=False,
    )
    record = {
        "id": slug, "source": str(source), "output": str(dest.relative_to(ROOT)),
        "sourceBytes": source.stat().st_size, "outputBytes": dest.stat().st_size,
        "material": "KHR_materials_unlit, source PBR base-color only; no baked directional lighting",
        "sourceTriangles": source_triangles, "triangles": triangle_count(meshes),
        "sourceVertices": source_vertices,
        "verticesBeforeExportSeams": sum(len(obj.data.vertices) for obj in meshes),
        "sourceImages": original_images,
        "images": [{"name": img.name, "size": list(img.size)} for img in bpy.data.images],
        "boundsGltf": {"min": [low.x, low.z, -high.y], "max": [high.x, high.z, -low.y]},
        "sizeGltf": [high.x-low.x, high.z-low.z, high.y-low.y],
        "coordinateSystem": "glTF: Y up; original orientation retained; base Y=0",
    }
    print("MONUMENT_ASSET", json.dumps(record), flush=True)
    report.append(record)
    (PREVIEWS / "asset-report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    record["previews"] = render_views(slug, meshes)
    (PREVIEWS / "asset-report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
print("MONUMENT_ASSETS_COMPLETE", flush=True)
