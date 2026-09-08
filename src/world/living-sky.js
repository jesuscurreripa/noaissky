import * as THREE from 'three';
import {rng} from './procedural.js';
export function createLivingSky(planet){
 const random=rng(planet.seed+923),alive=['Abundante','Resiliente','Escasa'].includes(planet.life),count=alive?28:130;
 if(alive){
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute([-1,0,.3,0,0,0,-.3,0,-.4,0,0,0,1,0,.3,.3,0,-.4],3));geometry.computeVertexNormals();
  const material=new THREE.MeshBasicMaterial({color:planet.ink,side:THREE.DoubleSide}),mesh=new THREE.InstancedMesh(geometry,material,count),dummy=new THREE.Object3D();const seeds=Array.from({length:count},()=>random()*6.28);
  material.onBeforeCompile=shader=>{shader.uniforms.wingTime={value:0};material.userData.shader=shader;shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nuniform float wingTime;').replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed.y+=abs(position.x)*sin(wingTime*5.+instanceMatrix[3].x*.03)*.5;');};mesh.frustumCulled=false;
  return {mesh,update(time){if(material.userData.shader)material.userData.shader.uniforms.wingTime.value=time;for(let i=0;i<count;i++){const a=time*.045+seeds[i],r=180+i*8;dummy.position.set(Math.cos(a)*r,140+Math.sin(a*2)*25+i%5*7,Math.sin(a)*r);dummy.rotation.y=-a;dummy.scale.setScalar(1.5);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);}mesh.instanceMatrix.needsUpdate=true;}};
 }
 const points=[];for(let i=0;i<count;i++)points.push((random()-.5)*160,random()*70,(random()-.5)*160);const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(points,3));const mesh=new THREE.Points(geometry,new THREE.PointsMaterial({color:planet.key==='volcanic'?0xffb06b:planet.horizon,size:planet.key==='glacial'?.16:.1,transparent:true,opacity:.6,depthWrite:false}));
 return {mesh,update(time,focus){mesh.position.copy(focus);const p=geometry.attributes.position;for(let i=0;i<count;i++)p.setY(i,(points[i*3+1]-time*2)%70+35);p.needsUpdate=true;}};
}
