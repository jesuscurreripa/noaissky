import * as THREE from 'three';
import {rng} from './procedural.js';
import {illustrateMaterial} from './art-direction.js';

export function createRetroLandmarks(planet,height){
 const group=new THREE.Group(),random=rng(planet.seed+405),dummy=new THREE.Object3D();
 const crystal=['crystalline','glacial'].includes(planet.key),basalt=planet.key==='volcanic',reef=planet.key==='oceanic',toxic=planet.key==='toxic';
 const count=crystal?70:basalt?90:reef?45:toxic?42:25;
 const geometry=crystal?new THREE.ConeGeometry(1,4,5):basalt?new THREE.CylinderGeometry(.7,1,3,6):reef?new THREE.TorusGeometry(1,.22,6,14,Math.PI*1.75):toxic?new THREE.ConeGeometry(1,2,7):new THREE.CylinderGeometry(1,1.4,2,5);
 const material=illustrateMaterial(new THREE.MeshStandardMaterial({color:crystal?planet.vegetation:reef?planet.vegetation:planet.rock,flatShading:true,roughness:crystal?.38:1,metalness:crystal?.25:0,emissive:crystal?planet.vegetation:'#000000',emissiveIntensity:crystal?.1:0}),planet.ink,.75);
 const mesh=new THREE.InstancedMesh(geometry,material,count);mesh.castShadow=mesh.receiveShadow=true;
 for(let i=0;i<count;i++){
  const cluster=i%7,angle=cluster*2.399+planet.seed*.001,radius=320+(cluster%3)*380;
  const x=Math.cos(angle)*radius+(random()-.5)*180,z=Math.sin(angle)*radius+(random()-.5)*180,scale=9+random()*24;
  dummy.position.set(x,Math.max(height(x,z),2)+scale*(crystal?1.6:basalt?1.25:.65),z);dummy.rotation.set(0,random()*6.28,crystal?(random()-.5)*.3:0);dummy.scale.set(scale,scale*(.7+random()*.8),scale);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
 }
 group.add(mesh);return group;
}
