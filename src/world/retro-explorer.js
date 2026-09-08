import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {illustrateMaterial} from './art-direction.js';

export function repaintExplorer(material){
 // Preserve the atlas layout, facial features and skinning, but limit its inks.
 const original=material.onBeforeCompile,key=material.customProgramCacheKey();
 material.onBeforeCompile=function(shader,renderer){original.call(this,shader,renderer);shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
float suitLight=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));
vec3 suitInk=vec3(.035,.045,.095),suitCream=vec3(.89,.78,.57),suitOrange=vec3(.9,.20,.07);
float suitChroma=max(diffuseColor.r,max(diffuseColor.g,diffuseColor.b))-min(diffuseColor.r,min(diffuseColor.g,diffuseColor.b));
vec3 suitBase=mix(suitCream,suitOrange,smoothstep(.06,.23,suitChroma));
diffuseColor.rgb=mix(suitInk,suitBase,smoothstep(.055,.22,suitLight))*(.82+.18*smoothstep(.2,.7,suitLight));`);};
 material.customProgramCacheKey=()=>key+':retro-suit-v1';material.roughness=.56;material.metalness=.16;material.needsUpdate=true;
}
export function addExplorerPack(root,model){
 const torso=model.getObjectByName('Torso');if(!torso)return;
 const parts=[];function part(geometry,color,x,y,z){geometry.translate(x,y,z);const c=new THREE.Color(color),colors=[];for(let i=0;i<geometry.attributes.position.count;i++)colors.push(c.r,c.g,c.b);geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));parts.push(geometry);}
 part(new THREE.BoxGeometry(.63,.73,.28),'#eee0ba',0,1.26,-.37);
 part(new THREE.BoxGeometry(.53,.11,.30),'#df623f',0,1.39,-.38);
 part(new THREE.BoxGeometry(.42,.24,.035),'#33405d',0,1.12,-.526);
 for(const x of [-.36,.36]){part(new THREE.CylinderGeometry(.11,.11,.61,10),'#f1c475',x,1.24,-.36);part(new THREE.CylinderGeometry(.115,.115,.09,10),'#456d79',x,1.12,-.36);}
 part(new THREE.BoxGeometry(.035,.48,.035),'#e9cd93',.26,1.84,-.38);
 const geometry=mergeGeometries(parts);parts.forEach(g=>g.dispose());const material=illustrateMaterial(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.65,metalness:.2}));
 const pack=new THREE.Mesh(geometry,material);pack.castShadow=true;root.add(pack);root.updateMatrixWorld(true);torso.attach(pack);
}
