import {illustrateMaterial} from './art-direction.js';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export const SHIP_CREDIT={title:'Rusty Spaceship – Orange',author:'Sousinho',source:'https://sketchfab.com/3d-models/rusty-spaceship-orange-18541ebed6ce44a9923f9b8dc30d87f5',license:'https://creativecommons.org/licenses/by/4.0/'};

export async function loadPlayerShip(onProgress){
  const gltf=await new GLTFLoader().loadAsync('/models/rusty-spaceship.glb',onProgress);
  const ship=new THREE.Group(),model=gltf.scene;
  model.name='Rusty Spaceship — Sousinho';
  // The original model points along +Z and is offset from its origin.
  // Keep the gameplay origin stable, with a -Z nose and an 11.8 m hull.
  model.rotation.y=Math.PI;model.updateMatrixWorld(true);
  let bounds=new THREE.Box3().setFromObject(model);
  model.scale.multiplyScalar(11.8/bounds.getSize(new THREE.Vector3()).z);model.updateMatrixWorld(true);
  bounds=new THREE.Box3().setFromObject(model);const center=bounds.getCenter(new THREE.Vector3());
  model.position.sub(center);model.position.y+=center.y-bounds.min.y-.85;
  const materials=new Set();
  model.traverse(object=>{
    if(!object.isMesh)return;object.castShadow=true;object.receiveShadow=true;
    for(const material of Array.isArray(object.material)?object.material:[object.material]){
      if(materials.has(material))continue;materials.add(material);
      material.transparent=true;material.alphaToCoverage=true;material.alphaTest=.025;
      material.depthTest=true;material.depthWrite=true;material.depthFunc=THREE.LessEqualDepth;
      material.envMapIntensity=1.1;material.normalScale?.set(.18,.18);material.roughness=Math.max(material.roughness,.42);illustrateMaterial(material,'#414567',.7);
      const paintHook=material.onBeforeCompile,paintKey=material.customProgramCacheKey();
      const cockpit=material.name==='cockpit';
      material.onBeforeCompile=function(shader,renderer){paintHook.call(this,shader,renderer);shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
float hullLight=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));
vec3 enamel=${cockpit?'vec3(.08,.25,.29)':'mix(vec3(.055,.07,.12),vec3(.94,.33,.10),smoothstep(.035,.25,hullLight))'};
diffuseColor.rgb=mix(diffuseColor.rgb,enamel,.48);
`);};material.customProgramCacheKey=()=>paintKey+':retro-enamel-'+cockpit;
      if(cockpit){material.roughness=.22;material.metalness=.6;}
      for(const key of ['map','normalMap','metalnessMap','roughnessMap','emissiveMap'])if(material[key])material[key].anisotropy=8;
      material.needsUpdate=true;
    }
  });
  ship.add(model);

  // A single amber engine matches the central thruster in the supplied model.
  const flameMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,uniforms:{time:{value:0},power:{value:.6}},vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec2 vUv;uniform float time;uniform float power;void main(){float taper=pow(vUv.y,.7);float flicker=.78+.13*sin(vUv.y*35.-time*35.)+.08*sin(vUv.x*30.+time*21.);vec3 color=mix(vec3(1.,.15,.015),vec3(1.,.8,.25),pow(vUv.y,2.));gl_FragColor=vec4(color*2.2,taper*flicker*power*.66);}`});
  const flame=new THREE.Mesh(new THREE.CylinderGeometry(.38,.025,3.4,24,6,true),flameMaterial);flame.geometry.rotateX(-Math.PI/2);flame.position.set(0,.6,7.3);flame.userData.exhaust=true;ship.add(flame);
  const glowCanvas=document.createElement('canvas');glowCanvas.width=glowCanvas.height=128;const ctx=glowCanvas.getContext('2d'),gradient=ctx.createRadialGradient(64,64,0,64,64,64);gradient.addColorStop(0,'#fff5c7');gradient.addColorStop(.12,'#ffe495');gradient.addColorStop(.3,'#ff982d88');gradient.addColorStop(1,'#ff631000');ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);
  const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(glowCanvas),blending:THREE.AdditiveBlending,depthWrite:false}));glow.position.set(0,.6,5.8);glow.scale.setScalar(2.2);glow.userData.engine=true;ship.add(glow);

  // Retractable supports are attached to the imported hull, not baked into it.
  const gear=new THREE.Group();gear.userData.landingGear=true;gear.visible=false;
  const strutMaterial=new THREE.MeshStandardMaterial({color:0x718082,metalness:.8,roughness:.35}),footMaterial=new THREE.MeshStandardMaterial({color:0x25353c,metalness:.5,roughness:.7});
  for(const [x,z] of [[-1.45,1.4],[1.45,1.4],[0,-3.5]]){
    const strut=new THREE.Mesh(new THREE.CylinderGeometry(.065,.08,.7,8),strutMaterial);strut.position.set(x,-1.02,z);strut.castShadow=true;gear.add(strut);
    const foot=new THREE.Mesh(new THREE.BoxGeometry(.55,.12,.7),footMaterial);foot.position.set(x,-1.39,z);foot.castShadow=true;gear.add(foot);
  }
  ship.add(gear);ship.userData.credit=SHIP_CREDIT;
  return ship;
}
export function updatePlayerShip(ship,time,speed,grounded){
  for(const child of ship.children)if(child.userData.exhaust){child.material.uniforms.time.value=time;child.material.uniforms.power.value=grounded?.08:.35+Math.min(speed/300,1)*.65;child.scale.z=grounded?.12:.6+Math.min(speed/300,1)*1.5;child.position.z=5.65+1.7*child.scale.z;}
}
