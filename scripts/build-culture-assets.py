import bpy,json
from pathlib import Path
root=Path(__file__).resolve().parents[1]
downloads=Path.home()/'Downloads'
for slug in ['laika','bharugano-wuna','banua tada','mekongga']:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    bpy.ops.import_scene.gltf(filepath=str(downloads / ('rumah adat '+slug+'.glb')))
    meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
    for obj in meshes:
        bpy.context.view_layer.objects.active=obj
        obj.select_set(True)
        # glTF duplicates vertices along UV/normal seams. Reconnect coincident
        # geometry before decimating, otherwise isolated tiny faces disappear.
        before=len(obj.data.vertices)
        bpy.ops.object.mode_set(mode='EDIT')
        bpy.ops.mesh.select_all(action='SELECT')
        bpy.ops.mesh.remove_doubles(threshold=0.00001)
        bpy.ops.object.mode_set(mode='OBJECT')
        print('WELDED',slug,before,len(obj.data.vertices),flush=True)
        mod=obj.modifiers.new('Web detail','DECIMATE')
        mod.ratio=0.1
        bpy.ops.object.modifier_apply(modifier=mod.name)
        obj.name='Rumah adat '+slug
    for img in bpy.data.images:
        if img.size[0]>2048 or img.size[1]>2048:
            ratio=2048/max(img.size)
            img.scale(round(img.size[0]*ratio),round(img.size[1]*ratio))
    path=root/'public/models/culture'/(slug.replace(' ','-')+'.glb')
    bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True)
    print('CULTURE_ASSET',slug,path.stat().st_size,flush=True)
    for img in list(bpy.data.images):
        if img.name not in ['Render Result','Viewer Node']: bpy.data.images.remove(img)
print('ALL CULTURE ASSETS READY',flush=True)
