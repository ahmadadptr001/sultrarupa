"""Preserve the supplied carved frame while reducing its excessive mesh density.

Run by prepare-gallery-frame.mjs in a separate background Blender process. This
never opens, saves, or changes the user's interactive Blender document.
"""
import bpy
import json
import sys
from mathutils import Vector

source, destination, report_path = sys.argv[sys.argv.index('--') + 1:]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=source)
mesh_objects = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH']
before = sum(len(obj.data.polygons) for obj in mesh_objects)
depsgraph = bpy.context.evaluated_depsgraph_get()
samples = []
for x in [-0.47, -0.45, 0, 0.45, 0.47]:
    for y in [0.23, 0.25, 0.5, 0.95, 1.4, 1.64, 1.67]:
        hit, location, normal, index, obj, matrix = bpy.context.scene.ray_cast(
            depsgraph, Vector((x, -1, y)), Vector((0, 1, 0)))
        samples.append({'x': x, 'y': y, 'z': -location.y if hit else None})

for obj in mesh_objects:
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    modifier = obj.modifiers.new(name='Gallery mesh density', type='DECIMATE')
    modifier.decimate_type = 'COLLAPSE'
    modifier.ratio = 0.08
    modifier.use_collapse_triangulate = True
    bpy.ops.object.modifier_apply(modifier=modifier.name)

after = sum(len(obj.data.polygons) for obj in mesh_objects)
bpy.ops.export_scene.gltf(filepath=destination, export_format='GLB',
                          export_yup=True, export_animations=False,
                          export_cameras=False, export_lights=False)
with open(report_path, 'w', encoding='utf-8') as report:
    json.dump({'sourceTriangles': before, 'outputTriangles': after,
               'frontSurfaceSamples': samples}, report, indent=2)
