import * as THREE from 'three';
import {landmarkSites} from './landmark-sites.js';
export function createDestinationLandmarks(planet,height){
  const group=new THREE.Group(),sites=landmarkSites(planet),obstacles=[];
  const stone=new THREE.MeshStandardMaterial({color:planet.rock,roughness:1,flatShading:true});
  const accent=new THREE.MeshStandardMaterial({color:planet.vegetation,roughness:.5,emissive:planet.vegetation,emissiveIntensity:.3});
  const box=new THREE.BoxGeometry(1,1,1),spire=new THREE.ConeGeometry(1,1,5);
  function piece(geometry,material,x,z,y,sx,sy,sz,rotation=0){const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);mesh.rotation.y=rotation;mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);return mesh;}
  const destinations=sites.map(site=>{
    if(site.kind==='ruins'){
      for(const side of [-1,1])piece(box,stone,site.x+side*32,site.z,45+48,15,96,20);
      piece(box,stone,site.x,site.z,45+100,80,14,24);
      for(let i=0;i<6;i++){const a=i*Math.PI/3,x=site.x+Math.cos(a)*65,z=site.z+Math.sin(a)*65;piece(box,stone,x,z,height(x,z)+15+i*3,9,30+i*6,9,a);}
      obstacles.push({x:site.x,z:site.z,radius:85});
    }else if(site.kind==='spires'){
      for(let i=0;i<9;i++){const a=i*2.399,r=35+Math.sqrt(i)*38,x=site.x+Math.cos(a)*r,z=site.z+Math.sin(a)*r,h=90+(i%3)*45;piece(spire,accent,x,z,height(x,z)+h/2,22,h,22,a);obstacles.push({x,z,radius:24});}
    }else if(site.kind==='crater'){
      for(let i=0;i<12;i++){const a=i*Math.PI/6,x=site.x+Math.cos(a)*site.radius*.76,z=site.z+Math.sin(a)*site.radius*.76;piece(box,stone,x,z,height(x,z)+14,12,28+(i%3)*12,15,a);obstacles.push({x,z,radius:12});}
    }else{
      const a=site.angle,x=site.x+Math.sin(a)*100,z=site.z-Math.cos(a)*100;
      piece(box,stone,x,z,height(x,z)+38,20,76,20,a);piece(box,accent,x,z,height(x,z)+78,23,4,23,a);obstacles.push({x,z,radius:18});
    }
    return {...site,position:new THREE.Vector3(site.x,height(site.x,site.z)+8,site.z),type:'LUGAR DE INTERÉS',scanned:false};
  });
  return {group,destinations,obstacles};
}
