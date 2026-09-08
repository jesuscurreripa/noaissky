import * as THREE from 'three';
import {rng,noise2} from './procedural.js';

// A deterministic meadow follows the viewer. Blades are regenerated only when
// crossing a 64 m cell; geometry and materials remain shared on the GPU.
export function createMeadow(planet,height){
  const group=new THREE.Group(),count=8500,dummy=new THREE.Object3D(),color=new THREE.Color();
  const vertices=[],colors=[],indices=[];
  for(let blade=0;blade<3;blade++){
    const a=blade*Math.PI/3,dx=Math.cos(a),dz=Math.sin(a),sideX=-dz,sideZ=dx;
    const levels=[[0,.14,0],[.35,.11,.055],[.72,.07,.16],[1,0,.26]];
    const start=vertices.length/3;
    for(const [y,width,bend] of levels){for(const sign of [-1,1]){vertices.push(dx*bend+sideX*width*sign,y,dz*bend+sideZ*width*sign);const c=new THREE.Color().setRGB(.62+y*.38,.62+y*.38,.62+y*.38);colors.push(c.r,c.g,c.b);}}
    for(let i=0;i<3;i++){const k=start+i*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.setIndex(indices);geo.computeVertexNormals();
  const material=new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,side:THREE.DoubleSide,roughness:.9,emissive:planet.grass,emissiveIntensity:.065});
  material.onBeforeCompile=shader=>{shader.uniforms.windTime={value:0};material.userData.shader=shader;shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nuniform float windTime;').replace('#include <begin_vertex>','#include <begin_vertex>\nfloat gust=sin(windTime*1.3+instanceMatrix[3].x*.065+instanceMatrix[3].z*.048);transformed.x+=gust*position.y*position.y*.2;transformed.z+=cos(windTime+instanceMatrix[3].x*.08)*position.y*.06;');};
  const grass=new THREE.InstancedMesh(geo,material,count);grass.receiveShadow=true;grass.frustumCulled=false;group.add(grass);
  const flowerCount=450,flowerGeo=new THREE.IcosahedronGeometry(.19,0),flowerMat=new THREE.MeshStandardMaterial({color:planet.key==='glacial'?'#c9b9f1':'#f2d68c',emissive:planet.key==='glacial'?'#795cc1':'#ac6a21',emissiveIntensity:.25,roughness:.8});
  const flowers=new THREE.InstancedMesh(flowerGeo,flowerMat,flowerCount);flowers.frustumCulled=false;group.add(flowers);
  let cellX=Infinity,cellZ=Infinity;
  function regenerate(x,z){
    cellX=Math.round(x/64);cellZ=Math.round(z/64);const cx=cellX*64,cz=cellZ*64,random=rng(planet.seed+cellX*374761+cellZ*668265);
    const low=new THREE.Color(planet.grass).multiplyScalar(.78),high=new THREE.Color(planet.grass).lerp(new THREE.Color(planet.horizon),.4);
    for(let i=0;i<count;i++){
      const px=cx+(random()-.5)*340,pz=cz+(random()-.5)*340,py=height(px,pz),patch=noise2(px*.04,pz*.04,planet.seed+25);
      const dry=py>1.8&&py<210,clearing=Math.hypot(px,pz)<13;
      dummy.position.set(px,py-.03,pz);dummy.rotation.set(0,random()*6.28,0);const scale=dry&&!clearing&&patch>.25?.35+random()*1.15:0;
      dummy.scale.set(scale,scale*(.65+random()*.65),scale);dummy.updateMatrix();grass.setMatrixAt(i,dummy.matrix);color.copy(low).lerp(high,random());grass.setColorAt(i,color);
    }
    for(let i=0;i<flowerCount;i++){const px=cx+(random()-.5)*230,pz=cz+(random()-.5)*230,py=height(px,pz),scale=py>2&&Math.hypot(px,pz)>15?.6+random()*.65:0;dummy.position.set(px,py+.45+random()*.7,pz);dummy.rotation.set(random()*3,random()*6,random()*3);dummy.scale.setScalar(scale);dummy.updateMatrix();flowers.setMatrixAt(i,dummy.matrix);}
    grass.instanceMatrix.needsUpdate=true;grass.instanceColor.needsUpdate=true;flowers.instanceMatrix.needsUpdate=true;
  }
  return {group,update(time,position){if(material.userData.shader)material.userData.shader.uniforms.windTime.value=time;if(Math.round(position.x/64)!==cellX||Math.round(position.z/64)!==cellZ)regenerate(position.x,position.z);}};
}
