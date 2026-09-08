import * as THREE from 'three';
import {cubeDirection,surfacePoint,planetHeight,nodeDescriptor} from './planet-field.js';

// Pure CPU builder, also imported by the Worker and deterministic tests.
export function buildPlanetChunk({node,radius,seed,land,rock,segments=16}) {
  const center=surfacePoint(node.face,node.u+node.width/2,node.v+node.width/2,radius,seed);
  const positions=[],coarse=[],normals=[],colors=[],indices=[];
  const base=new THREE.Color(land),peak=new THREE.Color(rock),sea=new THREE.Color('#183744');
  const parent=node.level?nodeDescriptor(node.face,node.level-1,Math.floor(node.x/2),Math.floor(node.y/2)):node;
  const cache=new Map();
  function parentVertex(x,y){const key=x+','+y;if(!cache.has(key))cache.set(key,surfacePoint(node.face,parent.u+x*parent.width/segments,parent.v+y*parent.width/segments,radius,seed));return cache.get(key);}
  function coarsePoint(u,v){
    const gx=THREE.MathUtils.clamp((u-parent.u)/parent.width*segments,0,segments),gy=THREE.MathUtils.clamp((v-parent.v)/parent.width*segments,0,segments);
    const x=Math.min(segments-1,Math.floor(gx)),y=Math.min(segments-1,Math.floor(gy)),fx=gx-x,fy=gy-y;
    // Same diagonal and winding as the parent grid.
    if(fx+fy<=1)return parentVertex(x,y).clone().multiplyScalar(1-fx-fy).addScaledVector(parentVertex(x+1,y),fx).addScaledVector(parentVertex(x,y+1),fy);
    return parentVertex(x+1,y+1).clone().multiplyScalar(fx+fy-1).addScaledVector(parentVertex(x,y+1),1-fx).addScaledVector(parentVertex(x+1,y),1-fy);
  }
  for(let y=0;y<=segments;y++)for(let x=0;x<=segments;x++){
    const u=node.u+x*node.width/segments,v=node.v+y*node.width/segments,d=cubeDirection(node.face,u,v),h=planetHeight(d,seed),p=d.clone().multiplyScalar(radius+h);
    const a=new THREE.Vector3().crossVectors(Math.abs(d.y)<.9?new THREE.Vector3(0,1,0):new THREE.Vector3(1,0,0),d).normalize(),b=new THREE.Vector3().crossVectors(d,a);
    const eps=2/radius;
    const ha=planetHeight(d.clone().addScaledVector(a,eps).normalize(),seed)-planetHeight(d.clone().addScaledVector(a,-eps).normalize(),seed);
    const hb=planetHeight(d.clone().addScaledVector(b,eps).normalize(),seed)-planetHeight(d.clone().addScaledVector(b,-eps).normalize(),seed);
    const normal=d.clone().addScaledVector(a,-ha/4).addScaledVector(b,-hb/4).normalize();
    positions.push(...p.sub(center).toArray());coarse.push(...(node.level?coarsePoint(u,v).sub(center):p).toArray());normals.push(...normal.toArray());
    const color=h<0?sea.clone().lerp(base,.25):base.clone().lerp(peak,THREE.MathUtils.clamp((h-300)/1600,0,1));
    color.multiplyScalar(.9+.1*Math.sin(h*.015));colors.push(color.r,color.g,color.b);
  }
  const row=segments+1;
  for(let y=0;y<segments;y++)for(let x=0;x<segments;x++){const a=y*row+x;indices.push(a,a+1,a+row,a+1,a+row+1,a+row);}
  const edge=[];for(let x=0;x<segments;x++)edge.push(x);for(let y=0;y<segments;y++)edge.push(y*row+segments);for(let x=segments;x>0;x--)edge.push(segments*row+x);for(let y=segments;y>0;y--)edge.push(y*row);
  const bottom=positions.length/3,depth=Math.max(150,node.width*radius*.08);
  for(const index of edge){const d=new THREE.Vector3(...positions.slice(index*3,index*3+3)).add(center).normalize();for(let axis=0;axis<3;axis++){positions.push(positions[index*3+axis]-d.getComponent(axis)*depth);coarse.push(coarse[index*3+axis]-d.getComponent(axis)*depth);normals.push(normals[index*3+axis]);colors.push(colors[index*3+axis]);}}
  for(let i=0;i<edge.length;i++){const j=(i+1)%edge.length;indices.push(edge[i],edge[j],bottom+i,edge[j],bottom+j,bottom+i);}
  return {center:center.toArray(),positions:new Float32Array(positions),coarse:new Float32Array(coarse),normals:new Float32Array(normals),colors:new Float32Array(colors),indices:new Uint16Array(indices)};
}
