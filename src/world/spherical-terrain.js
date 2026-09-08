import * as THREE from 'three';
import {nodeDescriptor,childNodes,surfacePoint} from './planet-field.js';
import {buildPlanetChunk} from './planet-chunk.js';

export function createSphericalTerrain(planet,{maxLeaves=300,maxResident=480,maxLevel=14,segments=16,workerFactory=()=>new Worker(new URL('./planet-worker.js',import.meta.url),{type:'module'})}={}) {
  const radius=planet.radius*1000,group=new THREE.Group(),nodes=new Map(),roots=Array.from({length:6},(_,face)=>nodeDescriptor(face));
  let tick=0,disposed=false,busy=null,workerError=null;
  const worker=workerFactory();
  const stats={visible:6,resident:6,pending:0,triangles:0,level:0,error:null};
  const job=node=>({node,radius,seed:planet.seed,land:planet.land,rock:planet.rock||planet.land,segments});
  function install(node,data){
    const geometry=new THREE.BufferGeometry();
    for(const [name,array] of [['position',data.positions],['coarsePosition',data.coarse],['normal',data.normals],['color',data.colors]])geometry.setAttribute(name,new THREE.BufferAttribute(array,3));
    geometry.setIndex(new THREE.BufferAttribute(data.indices,1));geometry.computeBoundingSphere();geometry.boundingSphere.radius+=radius*node.width*.02+2000;
    const morph={value:node.level?0:1};
    const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1});
    material.onBeforeCompile=shader=>{shader.uniforms.tileMorph=morph;shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nattribute vec3 coarsePosition;uniform float tileMorph;').replace('#include <begin_vertex>','vec3 transformed=mix(coarsePosition,position,tileMorph);');};
    material.customProgramCacheKey=()=> 'spherical-terrain-morph-v1';
    const mesh=new THREE.Mesh(geometry,material);mesh.position.fromArray(data.center);mesh.visible=false;mesh.name=node.key;group.add(mesh);
    nodes.set(node.key,{node,mesh,morph,used:tick});
  }
  for(const root of roots)install(root,buildPlanetChunk(job(root)));
  worker.onmessage=({data})=>{
    if(disposed)return;
    if(data.error){workerError=data.error;busy=null;return;}
    if(busy?.node.key===data.key){install(busy.node,data.result);busy=null;}
  };
  worker.onerror=event=>{workerError=event.message||'Terrain worker failed';busy=null;};
  function release(key){const n=nodes.get(key);n.mesh.geometry.dispose();n.mesh.material.dispose();group.remove(n.mesh);nodes.delete(key);}
  return {group,radius,stats,update(camera,dt,viewportHeight=globalThis.innerHeight||720){
    if(disposed)return;tick++;
    const visitor=camera.position,viewerLength=visitor.length(),viewerDirection=visitor.clone().normalize(),focal=viewportHeight/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2)));
    const requests=new Map(),keep=new Set();let leaves=6;
    const nearestFirst=(a,b)=>surfacePoint(a.face,a.u+a.width/2,a.v+a.width/2,radius,planet.seed).distanceToSquared(visitor)-surfacePoint(b.face,b.u+b.width/2,b.v+b.width/2,radius,planet.seed).distanceToSquared(visitor);
    const viewProjection=new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse),frustum=new THREE.Frustum().setFromProjectionMatrix(viewProjection);
    for(const n of nodes.values())n.mesh.visible=false;
    function visit(node){
      const record=nodes.get(node.key);keep.add(node.key);record.used=tick;
      const center=surfacePoint(node.face,node.u+node.width/2,node.v+node.width/2,radius,planet.seed),extent=radius*node.width*.85+2500;
      const distance=Math.max(1,visitor.distanceTo(center)-extent*.7);
      // Conservative horizon test includes the complete tile's angular extent.
      const angle=Math.acos(THREE.MathUtils.clamp(center.clone().normalize().dot(viewerDirection),-1,1));
      const horizon=Math.acos(Math.min(1,(radius-2500)/Math.max(radius-2499,viewerLength)));
      if(node.level>1&&angle>horizon+node.width*1.5+.02)return;
      // World-space bounds and frustum, evaluated before camera-relative rendering.
      if(node.level>1&&!frustum.intersectsSphere(new THREE.Sphere(center,extent)))return;
      const spacing=radius*node.width/segments,pixels=spacing*focal/distance;
      const alreadySplit=childNodes(node).some(c=>nodes.has(c.key));
      const split=record.morph.value>=1&&pixels>(alreadySplit?24:32)&&node.level<maxLevel&&leaves+3<=maxLeaves;
      if(split){
        const children=childNodes(node);leaves+=3;
        let ready=true;
        for(const child of children){keep.add(child.key);if(!nodes.has(child.key)){ready=false;requests.set(child.key,{node:child,priority:distance/(node.level+1)});}}
        if(ready){for(const child of children.sort(nearestFirst))visit(child);return;}
      }
      // Parent stays until the full family is resident. Each new family morphs
      // from its exact parent's triangles; ancestors cannot subdivide mid-morph.
      record.mesh.visible=true;record.morph.value=Math.min(1,record.morph.value+dt*3);
    }
    // Roots are permanent fallback coverage, including after rapid reversals.
    for(const root of [...roots].sort(nearestFirst))visit(root);
    const candidates=[...nodes.entries()].filter(([key,n])=>n.node.level&&!keep.has(key)&&key!==busy?.node.key).sort((a,b)=>a[1].used-b[1].used);
    while(nodes.size>maxResident&&candidates.length)release(candidates.shift()[0]);
    if(!busy&&!workerError){const next=[...requests.values()].sort((a,b)=>a.priority-b.priority)[0];if(next){busy=next;worker.postMessage({key:next.node.key,job:job(next.node)});}}
    const visible=[...nodes.values()].filter(n=>n.mesh.visible);
    Object.assign(stats,{visible:visible.length,resident:nodes.size,pending:requests.size,triangles:visible.reduce((a,n)=>a+n.mesh.geometry.index.count/3,0),level:Math.max(0,...visible.map(n=>n.node.level)),error:workerError});
  },dispose(){disposed=true;worker.terminate();for(const key of [...nodes.keys()])release(key);group.removeFromParent();}};
}
