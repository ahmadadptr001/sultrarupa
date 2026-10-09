"""Build a walkable Sulawesi silhouette from public-domain Natural Earth land data.
Run: uv run --with numpy --with shapely --with mapbox-earcut --with pillow python scripts/build-sulawesi-island.py
"""
import json,struct,math,heapq,random
from pathlib import Path
import numpy as np
import mapbox_earcut
from shapely.geometry import Polygon,Point,LineString,box,shape
from shapely.affinity import rotate,translate,scale
from shapely.ops import nearest_points
from PIL import Image, ImageDraw, ImageFilter
ROOT=Path(__file__).resolve().parents[1]
indonesia=shape(json.loads((ROOT/'data/geography/natural-earth-indonesia.geojson').read_text())['geometry'])
sulawesi=next(p for p in indonesia.geoms if p.contains(Point(120,-2)))
sulawesi=scale(translate(sulawesi,xoff=-121,yoff=1.7),xfact=40,yfact=-40,origin=(0,0)).simplify(1.1,preserve_topology=True)
outline=list(sulawesi.exterior.coords)
land=Polygon(outline)
GROUND=3.0
houses=[]
for name,target,width,depth,angle in [
 ('laika',(-16,20),8.3,18,0),('mekongga',(-47,104),16,17,0),
 ('bharugano-wuna',(29,87),9.6,18,-.3),('banua-tada',(60,-29),9.8,16,1.4)]:
 candidates=[]
 for dx in range(-20,21,2):
  for dz in range(-20,21,2):
   x,z=target[0]+dx,target[1]+dz
   footprint=translate(rotate(box(-width/2-1,-depth/2-1,width/2+1,depth/2+1),-angle*180/math.pi),xoff=x,yoff=z)
   if land.covers(footprint):candidates.append((dx*dx+dz*dz,x,z))
 if not candidates:raise ValueError('No site '+name)
 _,x,z=min(candidates)
 houses.append(dict(id=name,x=x,z=z,width=width,depth=depth,rotation=angle))
spawn_pt=nearest_points(Point(-65,145),land.buffer(-4))[1]
spawn=[round(spawn_pt.x,3),3.2,round(spawn_pt.y,3)]
stage=dict(x=-30,z=-10,radius=8,speakers=dict(x=-30,z=-16,rotation=0),dance=dict(x=-30,z=-7,radius=2.5,count=12))
guide_specs=[('lumense','laika',-16),('tenun-konawe','laika',16),('pomani','bharugano-wuna',-16),('kaghati-kolope','bharugano-wuna',16),('alionda','banua-tada',0),('lulo','mekongga',0)]
guides=[]
safe_guide_land=land.buffer(-7)
for name,home,lateral in guide_specs:
 h=next(h for h in houses if h['id']==home);a=h['rotation'];d=h['depth']/2+16
 p=Point(h['x']+math.sin(a)*d+math.cos(a)*lateral,h['z']+math.cos(a)*d-math.sin(a)*lateral)
 if name=='lulo':p=Point(-20,-7)
 # A full wandering circle must fit on land, outside house footprints.
 candidates=[]
 for x in np.arange(land.bounds[0],land.bounds[2],2):
  for z in np.arange(land.bounds[1],land.bounds[3],2):
   q=Point(x,z)
   if not safe_guide_land.contains(q):continue
   if any(q.distance(Point(other['x'],other['z']))<max(other['depth'],other['width'])/2+9 for other in houses):continue
   if any(q.distance(Point(other['x'],other['z']))<10 for other in guides):continue
   if q.distance(Point(stage['x'],stage['z']))<9:continue
   candidates.append((p.distance(q),x,z))
 _,x,z=min(candidates)
 guides.append(dict(id=name,homeId=home,x=round(x,3),z=round(z,3),rotation=a+math.pi,wanderRadius=3))
# Grid paths stay within the coast, avoiding straight lines across bays.
step=1.5;minx,minz,maxx,maxz=land.bounds
walkable=land.buffer(-1.8)
for h in houses:
 obstacle=translate(rotate(box(-h['width']*.45-1.0,-h['depth']*.42-1.0,h['width']*.45+1.0,h['depth']*.42+1.0),-h['rotation']*180/math.pi),xoff=h['x'],yoff=h['z'])
 walkable=walkable.difference(obstacle)
walk=set()
for i in range(math.ceil((maxx-minx)/step)+1):
 for k in range(math.ceil((maxz-minz)/step)+1):
  if walkable.contains(Point(minx+i*step,minz+k*step)):walk.add((i,k))
def world(n):return (minx+n[0]*step,minz+n[1]*step)
def near(p):return min(walk,key=lambda n:(world(n)[0]-p[0])**2+(world(n)[1]-p[1])**2)
def route(a,b):
 start,end=near(a),near(b);queue=[(0,start)];came={};cost={start:0}
 while queue:
  _,cur=heapq.heappop(queue)
  if cur==end:break
  for di,dk in [(1,0),(-1,0),(0,1),(0,-1),(1,1),(1,-1),(-1,1),(-1,-1)]:
   n=(cur[0]+di,cur[1]+dk)
   if n not in walk or not walkable.covers(LineString([world(cur),world(n)])):continue
   val=cost[cur]+math.hypot(di,dk)
   if val<cost.get(n,1e9):
    cost[n]=val;came[n]=cur;heapq.heappush(queue,(val+math.hypot(n[0]-end[0],n[1]-end[1]),n))
 if end not in cost:raise ValueError(f'Disconnected path to {b}, grid end {world(end)}')
 pts=[world(end)]
 while end!=start:end=came[end];pts.append(world(end))
 return list(LineString(pts[::-1]).simplify(1.0).coords)
center=(houses[0]['x'],houses[0]['z']+13)
paths=[route((spawn[0],spawn[2]),center)]
for g in guides:paths.append(route(center,(g['x'],g['z'])))
for h in houses:
 d=(h['depth']/2+1.5)*(-1 if h['id']=='banua-tada' else 1);a=h['rotation']
 lateral=h['width']*({'bharugano-wuna':.2,'banua-tada':-.12}.get(h['id'],0))
 h['entrance']=dict(x=round(h['x']+math.sin(a)*d+math.cos(a)*lateral,3),z=round(h['z']+math.cos(a)*d-math.sin(a)*lateral,3))
 paths.append(route(center,(h['entrance']['x'],h['entrance']['z'])))
paths.append(route(center,(stage['x'],stage['z']+8)))
# Extend a nature walk towards the northern peninsula.
north=nearest_points(Point(147,-116),land.buffer(-3))[1]
paths.append(route(center,(north.x,north.y)))
road=LineString(paths[0]).buffer(1.25)
for p in paths[1:]:road=road.union(LineString(p).buffer(1.25))
road=road.intersection(land)
plazas=Point(stage['x'],stage['z']).buffer(9)
for h in houses:
 footprint=translate(rotate(box(-h['width']/2-1,-h['depth']/2-1,h['width']/2+1,h['depth']/2+1),-h['rotation']*180/math.pi),xoff=h['x'],yoff=h['z'])
 plazas=plazas.union(footprint).union(Point(h['entrance']['x'],h['entrance']['z']).buffer(3))
random.seed(94)
forest=[]
forest_land=land.buffer(-4)
for _ in range(4000):
 x,z=random.uniform(minx,maxx),random.uniform(minz,maxz);p=Point(x,z)
 if not forest_land.contains(p) or road.distance(p)<3:continue
 if any(math.hypot(x-h['x'],z-h['z'])<17 for h in houses):continue
 if any(math.hypot(x-g['x'],z-g['z'])<7 for g in guides):continue
 if math.hypot(x-stage['x'],z-stage['z'])<13:continue
 if math.hypot(x-spawn[0],z-spawn[2])<9:continue
 if any(math.hypot(x-f['x'],z-f['z'])<6 for f in forest):continue
 forest.append(dict(asset=['PalmTree','TreeRoundA','TreeRoundF'][len(forest)%3],x=round(x,2),z=round(z,2),scale=round(random.uniform(.8,1.25),2),rotation=round(random.uniform(0,6.28),3)))
 if len(forest)>=180:break
decor=[]
# Reuse the original stone, bush and wall meshes around the new coastline.
shore=land.buffer(-4).boundary
for at in np.arange(0,shore.length,12):
 p=shore.interpolate(at)
 if road.distance(p)<3 or plazas.distance(p)<3:continue
 decor.append(dict(asset='RockA',x=round(p.x,2),z=round(p.y,2),y=3.3,scale=round(random.uniform(2.5,4.5),2),rotation=random.uniform(0,math.tau)))
for tree in forest[::2]:
 decor.append(dict(asset='BushA',x=tree['x']+1.6,z=tree['z']+1,y=GROUND,scale=1.5,rotation=tree['rotation']))
for h in houses:
 for side in [-1,1]:
  a=h['rotation'];lx=side*(h['width']/2+3);lz=-1
  x=h['x']+lx*math.cos(a)+lz*math.sin(a);z=h['z']-lx*math.sin(a)+lz*math.cos(a)
  wall=translate(rotate(box(-.4,-5,.4,5),-a*180/math.pi),xoff=x,yoff=z)
  if land.buffer(-3).covers(wall):
   decor.append(dict(asset='Wall',x=x,z=z,y=GROUND+.65,scaleXYZ=[1.5,.65,.75],rotation=a))
decor.append(dict(asset='SpeakersOn',x=stage['speakers']['x'],z=stage['speakers']['z'],y=GROUND,scale=1,rotation=0))

# Native terrain channels: red paving, green meadow, blue path, alpha land.
# UVs and pixels use the same normalized X/Z range (the loader uses flipY=false).
resolution=2048
def mask(geometry):
 image=Image.new('L',(resolution,resolution));draw=ImageDraw.Draw(image)
 def coords(ring):return [((x-minx)/(maxx-minx)*(resolution-1),(z-minz)/(maxz-minz)*(resolution-1)) for x,z in ring.coords]
 def paint(p):
  if p.is_empty:return
  if p.geom_type!='Polygon':
   for part in p.geoms:paint(part)
   return
  draw.polygon(coords(p.exterior),fill=255)
  for hole in p.interiors:draw.polygon(coords(hole),fill=0)
 paint(geometry)
 return image.filter(ImageFilter.GaussianBlur(1.5))
alpha=mask(land.buffer(-3))
paths_mask=mask(road.union(plazas))
grass_mask=mask(land.buffer(-3.5).difference(road.buffer(.65)).difference(plazas.buffer(.5)))
Image.merge('RGBA',(Image.new('L',alpha.size),grass_mask,paths_mask,alpha)).save(ROOT/'public/models/culture/terrain-splat.png')
Image.merge('RGB',(grass_mask,grass_mask,grass_mask)).save(ROOT/'public/models/culture/grass-splat.png')
P=[];N=[];UV=[];C=[];I=[]
def triangle(a,b,c,color):
 a,b,c=map(lambda v:np.array(v,dtype=float),(a,b,c))
 normal=np.cross(b-a,c-a);normal/=max(np.linalg.norm(normal),1e-9)
 start=len(P)
 for p in [a,b,c]:P.append(p.tolist());N.append(normal.tolist());UV.append([(p[0]-minx)/(maxx-minx),(p[2]-minz)/(maxz-minz)]);C.append(color)
 I.extend([start,start+1,start+2])
def top(poly,y,color):
 if poly.is_empty:return
 if poly.geom_type=='MultiPolygon':
  for part in poly.geoms:top(part,y,color)
  return
 rings=[list(poly.exterior.coords)[:-1]]+[list(r.coords)[:-1] for r in poly.interiors]
 coords=np.array([p for r in rings for p in r],dtype=np.float64)
 ends=np.cumsum([len(r) for r in rings],dtype=np.uint32)
 idx=mapbox_earcut.triangulate_float64(coords,ends)
 for at in range(0,len(idx),3):
  vs=[[coords[i][0],y(coords[i]) if callable(y) else y,coords[i][1]] for i in idx[at:at+3]]
  if np.cross(np.subtract(vs[1],vs[0]),np.subtract(vs[2],vs[0]))[1]<0:vs[1],vs[2]=vs[2],vs[1]
  triangle(*vs,color)
interior=land.buffer(-3.0)
top(interior,GROUND,[1,1,1])
top(land.difference(interior),lambda p: .15+(GROUND-.15)*min(1,Point(p).distance(land.boundary)/3),[1,1,1])
for i,(x,z) in enumerate(outline[:-1]):
 nx,nz=outline[i+1]
 triangle([x,.15,z],[nx,.15,nz],[x,-4,z],[1,1,1])
 triangle([nx,.15,nz],[nx,-4,nz],[x,-4,z],[1,1,1])
def write_glb(path,scale=1,tx=0,tz=0):
 positions=np.array(P,dtype=np.float32)*scale;positions[:,0]+=tx;positions[:,2]+=tz
 # Keep sea and ground heights consistent in the intro preview.
 positions[:,1]=np.array(P)[:,1]
 arrays=[(positions,5126,'VEC3'),(np.array(N,dtype=np.float32),5126,'VEC3'),(np.array(UV,dtype=np.float32),5126,'VEC2'),(np.array(C,dtype=np.float32),5126,'VEC3'),(np.array(I,dtype=np.uint32),5125,'SCALAR')]
 binary=bytearray();views=[];accessors=[]
 for arr,comp,typ in arrays:
  binary.extend(b'\0'*((-len(binary))%4));raw=arr.tobytes();views.append(dict(buffer=0,byteOffset=len(binary),byteLength=len(raw)))
  acc=dict(bufferView=len(views)-1,componentType=comp,count=len(arr),type=typ)
  if len(accessors)==0:acc.update(min=positions.min(axis=0).tolist(),max=positions.max(axis=0).tolist())
  accessors.append(acc);binary.extend(raw)
 # Lightweight closed collision boxes keep the player outside the house walls.
 cp=[];cn=[];cu=[];ci=[]
 for h in houses:
  w,d=h['width']*.45,h['depth']*.42
  verts=np.array([[-w,3,-d],[w,3,-d],[w,17,-d],[-w,17,-d],[-w,3,d],[w,3,d],[w,17,d],[-w,17,d]],dtype=float)
  a=h['rotation'];x=verts[:,0].copy();z=verts[:,2].copy()
  verts[:,0]=(x*math.cos(a)+z*math.sin(a)+h['x'])*scale+tx
  verts[:,2]=(-x*math.sin(a)+z*math.cos(a)+h['z'])*scale+tz
  for face in [(0,2,1),(0,3,2),(4,5,6),(4,6,7),(0,4,7),(0,7,3),(1,2,6),(1,6,5),(3,7,6),(3,6,2),(0,1,5),(0,5,4)]:
   tri=verts[list(face)];normal=np.cross(tri[1]-tri[0],tri[2]-tri[0]);normal/=np.linalg.norm(normal)
   for p in tri:ci.append(len(cp));cp.append(p);cn.append(normal);cu.append([0,0])
 for arr,comp,typ in [(np.array(cp,dtype=np.float32),5126,'VEC3'),(np.array(cn,dtype=np.float32),5126,'VEC3'),(np.array(cu,dtype=np.float32),5126,'VEC2'),(np.array(ci,dtype=np.uint32),5125,'SCALAR')]:
  binary.extend(b'\0'*((-len(binary))%4));raw=arr.tobytes();views.append(dict(buffer=0,byteOffset=len(binary),byteLength=len(raw)))
  acc=dict(bufferView=len(views)-1,componentType=comp,count=len(arr),type=typ)
  if len(accessors)==5:acc.update(min=arr.min(axis=0).tolist(),max=arr.max(axis=0).tolist())
  accessors.append(acc);binary.extend(raw)
 data=dict(asset=dict(version='2.0',generator='Sultrarupa / Natural Earth silhouette'),scene=0,scenes=[dict(nodes=[0,1,2])],nodes=[dict(name='SceneBase',mesh=0),dict(name='Props'),dict(name='SceneCollider',mesh=1)],meshes=[dict(primitives=[dict(attributes=dict(POSITION=0,NORMAL=1,TEXCOORD_0=2,COLOR_0=3),indices=4)]),dict(primitives=[dict(attributes=dict(POSITION=5,NORMAL=6,TEXCOORD_0=7),indices=8)])],accessors=accessors,bufferViews=views,buffers=[dict(byteLength=len(binary))])
 raw=json.dumps(data,separators=(',',':')).encode();raw+=b' '*((-len(raw))%4);binary+=b'\0'*((-len(binary))%4)
 path.write_bytes(struct.pack('<III',0x46546c67,2,28+len(raw)+len(binary))+struct.pack('<II',len(raw),0x4e4f534a)+raw+struct.pack('<II',len(binary),0x004e4942)+binary)
 return [positions.min(axis=0).tolist(),positions.max(axis=0).tolist()]
main_bounds=write_glb(ROOT/'public/models/culture/sulawesi-island.glb')
intro_bounds=write_glb(ROOT/'public/models/culture/sulawesi-intro.glb',.60,135,-58)
main_bounds[1][1]=24
intro_bounds[1][1]=18
layout=dict(groundY=GROUND,bounds=main_bounds,introBounds=intro_bounds,spawn=spawn,houses=houses,guides=guides,forest=forest,decor=decor,stage=stage,outline=outline,paths=paths,introTransform=dict(scale=.60,x=135,z=-58))
(ROOT/'public/assets/sultra-island-layout.js').write_text('// Silhouette: Natural Earth (public domain). Exhibition sites are interpretive.\nexport default '+json.dumps(layout,separators=(',',':'))+';\n')
(ROOT/'public/models/culture/island-layout.json').write_text(json.dumps(layout,indent=2))
print(json.dumps(dict(bounds=main_bounds,spawn=spawn,houses=houses,guides=guides,trees=len(forest),terrainTriangles=len(I)//3),indent=2))
