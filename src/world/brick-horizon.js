import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {rng,noise2} from './procedural.js';

export function createBrickHorizon(planet){
 const count=192,random=rng(planet.seed+810),material=new THREE.MeshStandardMaterial({roughness:.5,metalness:0});material.userData.toyPlastic=true;
 const mesh=new THREE.InstancedMesh(new RoundedBoxGeometry(1,1,1,1,.025),material,count),dummy=new THREE.Object3D();mesh.name='Block mountain backdrop';
 for(let i=0;i<count;i++){
  const layer=Math.floor(i/96),angle=(i%96)/96*Math.PI*2,radius=4700+layer*1600;
  const h=160+Math.round(noise2(Math.cos(angle)*4,Math.sin(angle)*4,planet.seed+layer*50)*8)*120;
  dummy.position.set(Math.cos(angle)*radius,h/2-80,Math.sin(angle)*radius);dummy.scale.set(410,h,460);dummy.rotation.y=Math.round(angle/(Math.PI/2))*Math.PI/2;dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
  mesh.setColorAt(i,new THREE.Color(planet.rock).lerp(new THREE.Color(planet.horizon),.35+layer*.2+random()*.08));
 }
 mesh.computeBoundingSphere();return mesh;
}
