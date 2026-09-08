import * as THREE from 'three';
import {rng,noise2} from './procedural.js';

// Unreachable backdrop ridges frame the playable patch without detailed far terrain.
export function createPaintedHorizon(planet){
 const group=new THREE.Group(),random=rng(planet.seed+810);
 for(let layer=0;layer<2;layer++){
  const vertices=[],colors=[],indices=[],segments=160,base=3900+layer*1800;
  const ink=new THREE.Color(planet.ink).lerp(new THREE.Color(planet.horizon),.36+layer*.23);
  const highlight=ink.clone().lerp(new THREE.Color(planet.land),.25);
  const phase=random()*10;
  for(let i=0;i<=segments;i++){
   const angle=i/segments*Math.PI*2,x=Math.cos(angle),z=Math.sin(angle);
   const mass=noise2(x*3+phase,z*3+phase,planet.seed+layer*50);
   const ridge=160+Math.pow(mass,1.7)*1400+Math.pow(Math.abs(Math.sin(angle*13+phase)),5)*180;
   for(let row=0;row<3;row++){const radius=base+row*700,y=row===1?ridge:(row===0?-60:80);vertices.push(x*radius,y,z*radius);const tint=row===1?highlight:ink;colors.push(tint.r,tint.g,tint.b);}
   if(i<segments)for(let row=0;row<2;row++){const a=i*3+row,b=a+3;indices.push(a,b,a+1,b,b+1,a+1);}
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setIndex(indices);geometry.computeVertexNormals();
  const mesh=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide,fog:true}));group.add(mesh);
 }
 return group;
}
