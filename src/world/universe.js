import {retroPlanetMaterial} from './retro-planet.js';
import {createStar} from './solar.js';
import {getRock} from './asset-library.js';
import * as THREE from 'three';
import { rng, hashSeed, noiseGLSL, STAR } from './procedural.js';

export function makeGlowTexture() {
  const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
  const ctx=canvas.getContext('2d'),g=ctx.createRadialGradient(64,64,0,64,64,64);
  g.addColorStop(0,'rgba(255,255,240,1)');g.addColorStop(.06,'rgba(255,243,210,1)');g.addColorStop(.16,'rgba(255,212,155,.6)');g.addColorStop(.42,'rgba(255,155,105,.12)');g.addColorStop(1,'rgba(255,140,90,0)');
  ctx.fillStyle=g;ctx.fillRect(0,0,128,128);return new THREE.CanvasTexture(canvas);
}

export function createUniverse(planets,seedText){
  let orbitalTime=0;const group=new THREE.Group(),random=rng(hashSeed(seedText)),planetMeshes=[],moonMeshes=[];
  const sky=new THREE.Mesh(new THREE.SphereGeometry(50000,32,16),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,vertexShader:`varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec3 vP;${noiseGLSL}void main(){vec3 d=normalize(vP);float n=fbm(d*5.+${(random()*40).toFixed(2)});float band=pow(max(0.,1.-abs(d.y*.9-d.x*.45+.14)),7.);float dust=pow(fbm(d*15.),2.);vec3 col=vec3(.003,.009,.020);col+=vec3(.025,.15,.20)*band*n;col+=vec3(.22,.035,.04)*band*dust;col+=vec3(.025,.04,.075)*n;gl_FragColor=vec4(col,1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`}));group.add(sky);
  const positions=[],colors=[],color=new THREE.Color();
  for(let i=0;i<7000;i++){const p=new THREE.Vector3(random()*2-1,random()*2-1,random()*2-1).normalize().multiplyScalar(38000+random()*10000);positions.push(...p.toArray());color.setHSL(.06+random()*.58,.08+random()*.4,.35+random()*.6);colors.push(color.r,color.g,color.b);}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  const stars=new THREE.Points(geo,new THREE.PointsMaterial({vertexColors:true,size:26,transparent:true,opacity:.9,depthWrite:false}));group.add(stars);
  const star=createStar();group.add(star.group);const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:makeGlowTexture(),color:0xff9b36,blending:THREE.AdditiveBlending,depthWrite:false}));halo.scale.setScalar(4200);group.add(halo);
  group.add(new THREE.PointLight(0xffe5c0,180000000,0,2));
  for(const data of planets){
    const vertex=`varying vec3 vN;varying vec3 vP;varying vec3 vV;void main(){vec4 p=modelViewMatrix*vec4(position,1.);vV=normalize(cameraPosition-(modelMatrix*vec4(position,1.)).xyz);vN=normalize(mat3(modelMatrix)*normal);vP=position;gl_Position=projectionMatrix*p;}`;
    const mesh=new THREE.Mesh(new THREE.SphereGeometry(data.radius,64,40),retroPlanetMaterial(data));mesh.position.set(...data.position);mesh.rotation.z=.15;group.add(mesh);
    const atmosphere=new THREE.Mesh(new THREE.SphereGeometry(data.radius*1.03,48,32),new THREE.ShaderMaterial({uniforms:{color:{value:new THREE.Color(data.sky)}},transparent:true,depthWrite:false,side:THREE.BackSide,blending:THREE.AdditiveBlending,vertexShader:vertex,fragmentShader:`varying vec3 vN;varying vec3 vV;uniform vec3 color;void main(){float a=pow(1.-abs(dot(normalize(vN),normalize(vV))),3.);gl_FragColor=vec4(color,a*.65);}`}));atmosphere.position.copy(mesh.position);group.add(atmosphere);
    let ring=null;
    if(data.landable===false){const ringGeo=new THREE.RingGeometry(data.radius*1.4,data.radius*2.1,160,8);ring=new THREE.Mesh(ringGeo,new THREE.ShaderMaterial({side:THREE.DoubleSide,transparent:true,depthWrite:false,uniforms:{inner:{value:data.radius*1.4},outer:{value:data.radius*2.1}},vertexShader:`varying vec3 p;void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec3 p;uniform float inner;uniform float outer;void main(){float r=(length(p.xy)-inner)/(outer-inner);float stripe=smoothstep(.25,.4,.5+.5*sin(r*75.));float gap=smoothstep(.05,.11,abs(r-.62));gl_FragColor=vec4(mix(vec3(.35,.29,.49),vec3(.96,.72,.43),r),(.2+stripe*.45)*gap);}`}));ring.rotation.set(1.1,.28,.3);ring.position.copy(mesh.position);group.add(ring);}
    planetMeshes.push({mesh,atmosphere,ring,data});
    const moonRandom=rng(data.seed+1709),moonGeometry=new THREE.SphereGeometry(1,36,24);
    for(let i=0;i<data.moons;i++){
      const radius=data.radius*(.12+moonRandom()*.13),orbit=data.radius*(2.5+i*.75),phase=moonRandom()*Math.PI*2,inclination=(moonRandom()-.5)*.6;
      const moonMaterial=new THREE.ShaderMaterial({uniforms:{tint:{value:new THREE.Color().setHSL(.07+moonRandom()*.11,.06+moonRandom()*.15,.35+moonRandom()*.13)},sunDirection:{value:new THREE.Vector3(...data.position).normalize().negate()},seed:{value:data.seed*.013+i*13}},vertexShader:`varying vec3 vP;varying vec3 vN;void main(){vP=position;vN=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec3 vP;varying vec3 vN;uniform vec3 tint;uniform float seed;uniform vec3 sunDirection;${noiseGLSL}void main(){vec3 p=normalize(vP);float craters=fbm(p*25.+seed);float plains=fbm(p*5.+seed);float light=max(dot(normalize(vN),sunDirection),0.);vec3 c=tint*(.55+plains*.6+craters*.35)*(.07+light*1.7);gl_FragColor=vec4(c,1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`});
      const moon=new THREE.Mesh(moonGeometry,moonMaterial);moon.scale.setScalar(radius);moon.name=`${data.name} / Luna ${i+1}`;group.add(moon);moonMeshes.push({mesh:moon,parent:mesh,orbit,phase,inclination,speed:.0015/(i+1)});
    }

  }
  const rockSets=Array.from({length:3},(_,i)=>{const asset=getRock(i),mesh=new THREE.InstancedMesh(asset.geometry,asset.material,Math.ceil((400-i)/3));group.add(mesh);return mesh;});
  const dummy=new THREE.Object3D(),asteroids=[];
  for(let i=0;i<400;i++){const a=random()*Math.PI*2,r=STAR.beltInner+random()*(STAR.beltOuter-STAR.beltInner);dummy.position.set(Math.cos(a)*r,(random()-.5)*160,Math.sin(a)*r);const radius=2+random()*12;dummy.scale.set(radius,radius*(.6+random()*.7),radius);dummy.rotation.set(random()*6,random()*6,random()*6);dummy.updateMatrix();rockSets[i%3].setMatrixAt(Math.floor(i/3),dummy.matrix);asteroids.push({position:dummy.position.clone(),radius});}
  return {group,planets:planetMeshes,moons:moonMeshes,asteroids,update(time,camera,dt=0){orbitalTime+=dt;star.update(time);sky.position.copy(camera.position);stars.position.copy(camera.position);for(const p of planetMeshes){if(p.phase===undefined)p.phase=Math.atan2(p.data.position[0],-p.data.position[2]/Math.cos(p.data.inclination));const angle=p.phase+orbitalTime*2*Math.PI/p.data.orbitalPeriod,r=p.data.orbitRadius,inc=p.data.inclination;p.mesh.position.set(Math.sin(angle)*r,Math.cos(angle)*r*Math.sin(inc),-Math.cos(angle)*r*Math.cos(inc));p.data.position=p.mesh.position.toArray();p.atmosphere.position.copy(p.mesh.position);p.ring?.position.copy(p.mesh.position);p.mesh.material.uniforms.sunDirection.value.copy(p.mesh.position).normalize().negate();p.mesh.rotation.y=time*.008;}for(const moon of moonMeshes){const angle=moon.phase+time*moon.speed;moon.mesh.position.copy(moon.parent.position).add(new THREE.Vector3(Math.cos(angle)*moon.orbit,Math.sin(angle)*moon.orbit*Math.sin(moon.inclination),Math.sin(angle)*moon.orbit*Math.cos(moon.inclination)));moon.mesh.material.uniforms.sunDirection.value.copy(moon.mesh.position).normalize().negate();moon.mesh.rotation.y=time*.012;}},dispose(){disposeGroup(group);}};
}
export function disposeGroup(group){const geometries=new Set(),materials=new Set(),textures=new Set();group.traverse(o=>{if(o.isInstancedMesh)o.dispose();if(o.geometry&&!o.geometry.userData.sharedAsset)geometries.add(o.geometry);if(o.material)for(const m of Array.isArray(o.material)?o.material:[o.material]){if(m.userData.sharedAsset)continue;materials.add(m);if(m.map)textures.add(m.map);if(m.uniforms)for(const u of Object.values(m.uniforms))if(u.value?.isTexture)textures.add(u.value);}});for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();group.removeFromParent();}
