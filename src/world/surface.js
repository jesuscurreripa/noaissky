import {moldGLSL} from './molded-material.js';
import {createBrickFluidMaterial} from './brick-fluid.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {createBrickTerrainMaterial,appendTerrainStuds} from './brick-terrain.js';
import {createDestinationLandmarks} from './destination-landmarks.js';
import {createLandingEffects} from './landing-effects.js';
import {siteHazardAt} from './landmark-sites.js';
import {createTerrainQuadtree} from './terrain-quadtree.js';
import {createPlanetFrame} from './large-world.js';
import {createAurora} from './aurora.js';
import {createLivingSky} from './living-sky.js';
import {createRetroLandmarks} from './retro-landmarks.js';
import {createBrickHorizon} from './brick-horizon.js';
import {illustrateMaterial} from './art-direction.js';
import {createBrickClouds} from './brick-clouds.js';
import {createExplorer} from './asset-library.js';
import * as THREE from 'three';
import { rng, noise2, fbm, terrainHeight, noiseGLSL } from './procedural.js';
import { makeGlowTexture, disposeGroup } from './universe.js';
import { createMeadow } from './meadow.js';

export function createSurface(planet, normal) {
  const random=rng(planet.seed),group=new THREE.Group(),dummy=new THREE.Object3D();
  const height=(x,z)=>terrainHeight(x,z,planet),land=new THREE.Color(planet.land),grassColor=new THREE.Color(planet.grass),rockColor=new THREE.Color(planet.rock);
  const terrainMat=createBrickTerrainMaterial();
  const frame=createPlanetFrame(planet, normal);
  const terrain=createTerrainQuadtree({height,material:terrainMat,decorateGeometry:appendTerrainStuds,colorAt(x,z,y){
    const wet=THREE.MathUtils.smoothstep(y,0,10),variation=fbm(x*.024,z*.024,planet.seed+8,3);
    const c=land.clone().lerp(grassColor,Math.min(.7,variation*wet));
    if(y>105)c.lerp(rockColor,Math.min(.65,(y-105)/180));
    if(planet.key==='glacial'&&y>90)c.lerp(new THREE.Color('#f3f5ed'),.6);
    if(y<2)c.multiplyScalar(.8);return c;
  }});
  group.add(terrain.group);terrain.update(new THREE.Vector3(0,82,130));
  group.add(createBrickHorizon(planet));group.add(createRetroLandmarks(planet,height));
  const destinations=createDestinationLandmarks(planet,height);group.add(destinations.group);
  const landingEffects=createLandingEffects(planet,height);group.add(landingEffects.group);
  const depthSize=256,depthPixels=new Uint8Array(depthSize*depthSize);
  for(let z=0;z<depthSize;z++)for(let x=0;x<depthSize;x++)depthPixels[z*depthSize+x]=Math.round(THREE.MathUtils.clamp((height((x/depthSize-.5)*8000,(z/depthSize-.5)*8000)+128)/512,0,1)*255);
  const depthMap=new THREE.DataTexture(depthPixels,depthSize,depthSize,THREE.RedFormat);depthMap.minFilter=depthMap.magFilter=THREE.LinearFilter;depthMap.needsUpdate=true;
  const waterMat=createBrickFluidMaterial(planet,depthMap);const water=new THREE.Mesh(new THREE.PlaneGeometry(terrain.size,terrain.size,1,1),waterMat);water.geometry.rotateX(-Math.PI/2);water.position.y=.1;group.add(water);water.visible=!['arid','crystalline','glacial'].includes(planet.key);

  const sterile=planet.life==='Nula'||planet.life==='Microbiana';const treeData=[],rockData=[],crystalData=[],grassData=[];
  for(let i=0;i<520;i++){
    const angle=random()*Math.PI*2,dist=45+Math.pow(random(),.85)*1700,x=Math.cos(angle)*dist,z=Math.sin(angle)*dist,y=height(x,z);
    if(y>4&&y<200&&noise2(x*.014,z*.014,planet.seed+4)>.33)treeData.push({x,y,z,s:5+random()*17,a:random()*6.28});
  }
  // Near-field plants make a landing immediately interesting.
  for(let i=0;i<36;i++){const a=random()*6.28,r=34+random()*180,x=Math.cos(a)*r,z=Math.sin(a)*r,y=height(x,z);if(y>3)treeData.push({x,y,z,s:5+random()*10,a:random()*6.28});}
  if(planet.tree==='none')treeData.length=0;
  const trunkMat=new THREE.MeshStandardMaterial({color:planet.key==='verdant'?'#e9c3a2':planet.vegetation,roughness:.95});
  const canopyMat=new THREE.MeshStandardMaterial({color:planet.vegetation,roughness:.74,side:THREE.DoubleSide,emissive:planet.vegetation,emissiveIntensity:.16});
  const undersideMat=new THREE.MeshStandardMaterial({color:planet.key==='verdant'?'#f6b987':planet.grass,roughness:.8,emissive:planet.key==='verdant'?'#7f2418':'#244b6b',emissiveIntensity:.32});
  function instances(geometry,material,data,transform){const mesh=new THREE.InstancedMesh(geometry,material,data.length);for(let i=0;i<data.length;i++){dummy.position.set(data[i].x,data[i].y,data[i].z);dummy.rotation.set(0,data[i].a||0,0);dummy.scale.setScalar(1);transform(dummy,data[i]);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);}mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);return mesh;}
  if(planet.tree==='mushroom'){
    instances(new RoundedBoxGeometry(.15,1,.15,1,.02).translate(0,.5,0),trunkMat,treeData,(d,t)=>{d.scale.setScalar(t.s);});
    instances(new RoundedBoxGeometry(2,.52,2,1,.07).translate(0,.26,0),canopyMat,treeData,(d,t)=>{d.position.y+=t.s*.96;d.scale.set(t.s*.76,t.s*.57,t.s*.76);});
    instances(new RoundedBoxGeometry(1.9,.12,1.9,1,.04),undersideMat,treeData,(d,t)=>{d.position.y+=t.s*.96;d.scale.set(t.s*.76,t.s*.57,t.s*.76);});
    instances(new THREE.ConeGeometry(.18,.28,8),trunkMat,treeData,(d,t)=>{d.position.y+=t.s*.09;d.scale.setScalar(t.s);});
    const pods=treeData.filter((_,i)=>i%3===0);
    instances(new RoundedBoxGeometry(2,.52,2,1,.07).translate(0,.26,0),canopyMat,pods,(d,t)=>{d.position.x+=t.s*.17;d.position.y+=t.s*.5;d.scale.set(t.s*.32,t.s*.30,t.s*.32);});
  } else if(planet.tree==='crystal') {
    const ice=new THREE.MeshStandardMaterial({color:'#8fa9d8',metalness:.3,roughness:.21,emissive:'#37517a',emissiveIntensity:.25});
    instances(new THREE.ConeGeometry(.34,1.9,5),ice,treeData,(d,t)=>{d.position.y+=t.s*.8;d.scale.set(t.s,t.s,t.s);d.rotation.z=Math.sin(t.a)*.18;});
    instances(new THREE.ConeGeometry(.25,1.2,5),canopyMat,treeData,(d,t)=>{d.position.x+=t.s*.25;d.position.y+=t.s*.45;d.scale.set(t.s,t.s,t.s);d.rotation.z=.32;});
  } else {
    instances(new RoundedBoxGeometry(.32,1,.32,1,.04),canopyMat,treeData,(d,t)=>{d.position.y+=t.s*.5;d.scale.setScalar(t.s);});
    instances(new RoundedBoxGeometry(.42,.42,.42,1,.05),canopyMat,treeData,(d,t)=>{d.position.y+=t.s;d.scale.set(t.s,t.s*.6,t.s);});
    instances(new RoundedBoxGeometry(.2,.6,.2,1,.025),canopyMat,treeData,(d,t)=>{d.position.x+=t.s*.23;d.position.y+=t.s*.6;d.rotation.z=-.8;d.scale.setScalar(t.s);});
  }
  for(let i=0;i<900;i++){const x=(random()-.5)*3800,z=(random()-.5)*3800,y=height(x,z);if(y>1&&Math.hypot(x,z)>25)rockData.push({x,y,z,s:.4+Math.pow(random(),3)*13,a:random()*6.28});}
  for(let variant=0;variant<3;variant++){const asset={geometry:new RoundedBoxGeometry(1.7,1.6,1.8,1,.12)};const paintedRock=new THREE.MeshStandardMaterial({color:planet.rock,roughness:1,flatShading:true});instances(asset.geometry,paintedRock,rockData.filter((_,i)=>i%3===variant),(d,t)=>{d.position.y+=t.s*.3;d.scale.set(t.s,t.s*.6,t.s*.85);});}
  for(let i=0;i<180;i++){const a=random()*6.28,r=35+random()*600,x=Math.cos(a)*r,z=Math.sin(a)*r,y=height(x,z);if(y>3)crystalData.push({x,y,z,s:1.1+random()*3,a:random()*6.28});}
  const crystalMat=new THREE.MeshStandardMaterial({color:planet.key==='verdant'?'#68d6c7':planet.key==='arid'?'#eec482':'#cc99e2',metalness:.4,roughness:.18,emissive:planet.key==='verdant'?'#258a79':'#695194',emissiveIntensity:.35});
  instances(new THREE.OctahedronGeometry(1,0),crystalMat,crystalData,(d,t)=>{d.position.y+=t.s;d.scale.set(t.s*.32,t.s,t.s*.3);d.rotation.z=.2;});
  instances(new THREE.OctahedronGeometry(1,0),crystalMat,crystalData,(d,t)=>{d.position.x+=t.s*.4;d.position.y+=t.s*.5;d.scale.set(t.s*.23,t.s*.6,t.s*.21);d.rotation.z=-.3;});
  const meadow=createMeadow(planet,height);group.add(meadow.group);

  // Wind-eroded arches and suspended mineral masses give each world a skyline.
  const archMaterial=new THREE.MeshStandardMaterial({color:planet.rock,roughness:1,flatShading:true});
  const archGeometry=new THREE.TorusGeometry(1,.16,9,42,Math.PI);
  const archPositions=archGeometry.attributes.position;
  for(let i=0;i<archPositions.count;i++){const x=archPositions.getX(i),y=archPositions.getY(i),z=archPositions.getZ(i);const n=noise2(x*9,y*9,planet.seed)*.06;archPositions.setXYZ(i,x+n,y+n,z+n);}archGeometry.computeVertexNormals();
  const arches=[];
  for(let i=0;i<(['arid','verdant','oceanic'].includes(planet.key)?7:0);i++){const angle=random()*6.28,dist=350+random()*2100,x=Math.cos(angle)*dist,z=Math.sin(angle)*dist;arches.push({x,y:Math.max(0,height(x,z))-3,z,s:85+random()*140,a:random()*6.28});}
  instances(archGeometry,archMaterial,arches,(d,t)=>{d.scale.set(t.s,t.s*(.8+Math.sin(t.a)*.2),t.s*.9);d.rotation.z=Math.sin(t.a)*.13;});
  const levitating=[];
  for(let i=0;i<(planet.key==='crystalline'?5:0);i++){const angle=random()*6.28,dist=450+random()*1600,x=Math.cos(angle)*dist,z=Math.sin(angle)*dist;levitating.push({x,y:height(x,z)+120+random()*90,z,s:15+random()*35,a:random()*6.28});}
  instances(new THREE.IcosahedronGeometry(1,1),archMaterial,levitating,(d,t)=>{d.scale.set(t.s,t.s*.65,t.s*.8);d.rotation.z=t.a;});
  instances(new THREE.ConeGeometry(.7,2,6),archMaterial,levitating,(d,t)=>{d.position.y-=t.s*.65;d.scale.set(t.s*.65,t.s*.7,t.s*.65);d.rotation.z=Math.PI;});

  // Broad alien ferns break up the thin grass silhouette close to the ground.
  const fernVertices=[],fernColors=[];
  for(let leaf=0;leaf<7;leaf++){const a=leaf*Math.PI*2/7,dx=Math.cos(a),dz=Math.sin(a),sx=-dz,sz=dx;const pts=[[0,0,0],[dx*.6+sx*.25,.6,dz*.6+sz*.25],[dx*1.6,.85,dz*1.6],[dx*.6-sx*.25,.6,dz*.6-sz*.25]];for(const index of [0,1,2,0,2,3]){fernVertices.push(...pts[index]);const c=new THREE.Color(index===2?'#d3b988':'#618a79');fernColors.push(c.r,c.g,c.b);}}
  const fernGeometry=new THREE.BufferGeometry();fernGeometry.setAttribute('position',new THREE.Float32BufferAttribute(fernVertices,3));fernGeometry.setAttribute('color',new THREE.Float32BufferAttribute(fernColors,3));fernGeometry.computeVertexNormals();
  instances(fernGeometry,new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:.85}),treeData.filter((_,i)=>!sterile&&i%2===0),(d,t)=>{d.position.x+=t.s*.35;d.scale.setScalar(t.s*.25);});

  const skyMaterial=new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,uniforms:{zenith:{value:new THREE.Color(planet.sky)},horizon:{value:new THREE.Color(planet.horizon)},sunColor:{value:new THREE.Color(planet.sun)}},vertexShader:`varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec3 vP;uniform vec3 zenith;uniform vec3 horizon;uniform vec3 sunColor;void main(){vec3 d=normalize(vP);float t=smoothstep(-.04,.65,d.y);vec3 c=mix(horizon,zenith,t);float sun=max(dot(d,normalize(vec3(-.6,.38,-.6))),0.);c+=sunColor*pow(sun,600.)*2.;c+=sunColor*pow(sun,16.)*.14;gl_FragColor=vec4(c,1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`});const sky=new THREE.Mesh(new THREE.SphereGeometry(9500,32,16),skyMaterial);sky.renderOrder=-10;group.add(sky);
  const paintedClouds=createBrickClouds(planet);group.add(paintedClouds.mesh);
  const moonMat=new THREE.ShaderMaterial({vertexShader:`varying vec3 p;varying vec3 n;void main(){p=position;n=normal;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec3 p;varying vec3 n;${noiseGLSL}${moldGLSL}void main(){float terrain=fbm(p*.009);float l=max(dot(n,normalize(vec3(-1,1,1))),0.);vec3 c=mix(vec3(.31,.42,.49),vec3(.74,.75,.70),terrain);vec3 axis=pow(abs(normalize(p)),vec3(8.));axis/=max(dot(axis,vec3(1.)),.0001);vec3 tiles=moldPattern(p.yz*.035)*axis.x+moldPattern(p.xz*.035)*axis.y+moldPattern(p.xy*.035)*axis.z;c*=1.-tiles.x*.3+tiles.y*.06;gl_FragColor=vec4(c*(.35+l*.7),1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`});const moon=new THREE.Mesh(new THREE.SphereGeometry(680,64,48),moonMat);moon.position.set(1500,1900,-5100);group.add(moon);moon.visible=planet.moons>0;
  const ring=new THREE.Mesh(new THREE.RingGeometry(840,1170,180),new THREE.ShaderMaterial({transparent:true,side:THREE.DoubleSide,depthWrite:false,vertexShader:`varying vec3 ringPosition;void main(){ringPosition=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec3 ringPosition;void main(){float r=(length(ringPosition.xy)-840.)/330.;float stripes=.58+.22*sin(r*280.)+.11*sin(r*670.);float gap=smoothstep(.015,.045,abs(r-.63));float edge=smoothstep(0.,.08,r)*(1.-smoothstep(.9,1.,r));vec3 c=mix(vec3(.63,.59,.57),vec3(.92,.83,.71),r);gl_FragColor=vec4(c,stripes*gap*edge*.27);}`}));ring.position.copy(moon.position);ring.rotation.set(.6,.2,-.5);group.add(ring);ring.visible=false;

  const sunGlow=new THREE.Sprite(new THREE.SpriteMaterial({map:makeGlowTexture(),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false}));sunGlow.position.set(-4200,2700,-4200);sunGlow.scale.setScalar(1400);group.add(sunGlow);

  // Seeded alien grazers: simple articulated bodies, rather than imported models.
  const fauna=[],bodyMat=new THREE.MeshStandardMaterial({color:planet.key==='verdant'?'#70a6a0':planet.key==='arid'?'#a1a48e':'#b0a8b9',roughness:.85}),hornMat=new THREE.MeshStandardMaterial({color:'#e4ccb0',roughness:.8});
  const sphereGeo=new RoundedBoxGeometry(2,2,2,1,.18),limbGeo=new RoundedBoxGeometry(.24,1.7,.24,1,.04);
  for(let i=0;i<(sterile?0:14);i++){
    const animal=new THREE.Group(),body=new THREE.Mesh(sphereGeo,bodyMat);body.scale.set(1.05,.7,1.65);body.position.y=1.7;animal.add(body);
    const neck=new THREE.Mesh(sphereGeo,bodyMat);neck.scale.set(.36,1.1,.4);neck.position.set(0,2.5,-1);neck.rotation.x=-.2;animal.add(neck);
    const head=new THREE.Mesh(sphereGeo,bodyMat);head.scale.set(.48,.4,.7);head.position.set(0,3.35,-1.32);animal.add(head);
    for(const side of [-1,1]){const horn=new THREE.Mesh(new THREE.ConeGeometry(.12,.9,5),hornMat);horn.position.set(side*.32,3.9,-1.25);horn.rotation.z=-side*.4;animal.add(horn);const eye=new THREE.Mesh(new THREE.SphereGeometry(.07,5,4),new THREE.MeshBasicMaterial({color:0x182e30}));eye.position.set(side*.43,3.42,-1.54);animal.add(eye);}
    const legs=[];for(const x of [-.7,.7])for(const z of [-.9,.9]){const leg=new THREE.Mesh(limbGeo,bodyMat);leg.position.set(x,.85,z);animal.add(leg);legs.push(leg);}
    const angle=random()*Math.PI*2,r=65+random()*150,center=new THREE.Vector3(Math.cos(angle)*r,0,Math.sin(angle)*r);animal.scale.setScalar(.9+random()*.7);group.add(animal);fauna.push({mesh:animal,legs,center,phase:random()*6.28,speed:.1+random()*.1});
  }
  const motesGeo=new THREE.BufferGeometry(),motes=[];for(let i=0;i<300;i++)motes.push((random()-.5)*600,5+random()*40,(random()-.5)*600);motesGeo.setAttribute('position',new THREE.Float32BufferAttribute(motes,3));const motesMesh=new THREE.Points(motesGeo,new THREE.PointsMaterial({color:0xffe7ad,size:.18,transparent:true,opacity:.7}));group.add(motesMesh);
  const aurora=createAurora(planet);group.add(aurora.group);
  const livingSky=createLivingSky(planet);group.add(livingSky.mesh);
  const resources=crystalData.map((p,i)=>({position:new THREE.Vector3(p.x,p.y+p.s,p.z),name:planet.resource,id:`mineral-${i}`,type:'MINERAL',scanned:false}));
  for(let i=0;i<Math.min(treeData.length,50);i++){const t=treeData[i];resources.push({position:new THREE.Vector3(t.x,t.y+t.s*.5,t.z),name:planet.tree==='mushroom'?'Umbra corallina':planet.tree==='crystal'?'Prisma boreal':'Xerophyta solis',id:`flora-${i}`,type:sterile?'MINERAL':'FLORA',scanned:false});}
  resources.push(...destinations.destinations);
  const explorers=[];
  for(let i=0;i<4;i++){const explorer=createExplorer(i);let x=0,z=0;for(let attempt=0;attempt<30;attempt++){const a=random()*Math.PI*2,r=18+random()*55;x=Math.cos(a)*r;z=Math.sin(a)*r;if(height(x,z)>3)break;}if(height(x,z)<3){x=15+i*3;z=0;}explorer.mesh.position.set(x,height(x,z),z);explorer.mesh.rotation.y=random()*Math.PI*2;group.add(explorer.mesh);explorer.home=explorer.mesh.position.clone();explorers.push(explorer);resources.push({position:explorer.mesh.position,name:explorer.name,id:`explorer-${i}`,type:'EXPLORADOR',scanned:false});}
  fauna.forEach((a,i)=>resources.push({position:a.mesh.position,name:'Cervus astralis',id:`fauna-${i}`,type:'FAUNA',scanned:false}));
  group.traverse(object=>{if(object.material)for(const material of Array.isArray(object.material)?object.material:[object.material])illustrateMaterial(material,planet.ink,.5);});
  const obstacles=[...destinations.obstacles.map(o=>({...o,top:height(o.x,o.z)+180})),...treeData.map(t=>({x:t.x,z:t.z,radius:t.s*.8,top:t.y+t.s*2})),...rockData.filter(r=>r.s>2).map(r=>({x:r.x,z:r.z,radius:r.s,top:r.y+r.s}))];
  return {group,height,resources,fauna,planet,frame,terrain,obstacles,landmarks:destinations.destinations,landingEffects,hazardAt:(x,z)=>siteHazardAt(x,z,planet),update(time,dt,camera,visitor=camera.position){terrain.update(visitor);aurora.update(time);livingSky.update(time,visitor);waterMat.uniforms.time.value=time;for(const [index,explorer] of explorers.entries()){const near=explorer.mesh.position.distanceTo(visitor)<18;explorer.play(near?'Wave':'Idle');if(near&&dt>0){const direction=visitor.clone().sub(explorer.mesh.position);direction.y=0;const yaw=Math.atan2(direction.x,direction.z),q=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),yaw);explorer.mesh.quaternion.slerp(q,1-Math.exp(-3*dt));}explorer.mixer.update(dt);}meadow.group.visible=!sterile&&camera.position.y-height(camera.position.x,camera.position.z)<210;if(meadow.group.visible)meadow.update(time,camera.position);sky.position.copy(camera.position);paintedClouds.update(time);for(const a of fauna){const danger=a.mesh.position.distanceTo(visitor)<22;if(danger&&dt>0){const away=a.mesh.position.clone().sub(visitor);away.y=0;away.normalize();const trial=a.center.clone().addScaledVector(away,dt*9);if(height(trial.x,trial.z)>3&&trial.length()<900)a.center.copy(trial);}const t=time*a.speed+a.phase;let x=a.center.x+Math.cos(t)*25,z=a.center.z+Math.sin(t)*25;let y=height(x,z);if(y<2){x=a.center.x;z=a.center.z;y=Math.max(2,height(x,z));}a.mesh.position.set(x,y,z);a.mesh.rotation.y=-t;a.legs.forEach((leg,i)=>leg.rotation.x=Math.sin(time*3+a.phase+i%2*Math.PI)*.27);}motesMesh.rotation.y=time*.005;},dispose(){terrain.dispose();terrainMat.dispose();for(const e of explorers){e.mixer.stopAllAction();e.mixer.uncacheRoot(e.mixer.getRoot());}disposeGroup(group);}};
}
