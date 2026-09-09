import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {rng} from './procedural.js';

export function createBrickClouds(planet){
 const random=rng(planet.seed+917),group=new THREE.Group();group.name='Construction clouds';
 const count=54,pieces=9,material=new THREE.MeshStandardMaterial({color:'#fff7e7',roughness:.5,metalness:0});material.userData.toyPlastic=true;
 const blocks=new THREE.InstancedMesh(new RoundedBoxGeometry(1,1,1,1,.07),material,count*pieces);
 const studs=new THREE.InstancedMesh(new THREE.CylinderGeometry(.21,.21,.12,10),material,count*3);
 const dummy=new THREE.Object3D(),shade=new THREE.Color();
 for(let c=0;c<count;c++){
  const near=c<14,x=(random()-.5)*(near?1300:8500),z=near?300+random()*1100:(random()-.5)*8500,y=near?470+random()*260:750+random()*600,unit=near?65+random()*30:95+random()*45;
  for(let i=0;i<pieces;i++){
   const layer=i<6?0:1,col=i<6?i%3:i-6,row=i<6?Math.floor(i/3):.5;
   dummy.position.set(x+(col-1)*unit,y+layer*unit*.55,z+(row-.5)*unit);
   dummy.scale.set(unit*.98,unit*(layer?.6:.55),unit*.98);dummy.updateMatrix();blocks.setMatrixAt(c*pieces+i,dummy.matrix);
   shade.set(layer?'#fff8e6':'#d7e1eb');blocks.setColorAt(c*pieces+i,shade);
   if(layer){dummy.position.y+=unit*.36;dummy.scale.setScalar(unit);dummy.updateMatrix();studs.setMatrixAt(c*3+i-6,dummy.matrix);}
  }
 }
 blocks.computeBoundingSphere();studs.computeBoundingSphere();group.add(blocks,studs);
 return {mesh:group,update(time){group.position.x=Math.sin(time*.012)*90;group.position.z=Math.sin(time*.008)*35;}};
}
