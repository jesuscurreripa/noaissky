import * as THREE from 'three';
// Fixed GPU/CPU pools bound the cost of overlapping explosions.
export function createCombatEffects(scene){
 const capacity=320,slots=Array.from({length:capacity},()=>({p:new THREE.Vector3(),v:new THREE.Vector3(),life:0,total:1})),dummy=new THREE.Object3D();let cursor=0;
 const mesh=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,0),new THREE.MeshBasicMaterial({color:0xffbe72,toneMapped:false}),capacity);mesh.frustumCulled=false;scene.add(mesh);
 const rings=Array.from({length:8},()=>{const mesh=new THREE.Mesh(new THREE.SphereGeometry(1,16,10),new THREE.MeshBasicMaterial({color:0x81e5ff,wireframe:true,transparent:true,opacity:0,depthWrite:false}));mesh.visible=false;scene.add(mesh);return {mesh,life:0,total:1,size:1};});let ringCursor=0;
 function burst(position,explosion=false){
  for(let i=0;i<(explosion?45:10);i++){const s=slots[cursor++%capacity];s.p.copy(position);s.v.set(Math.random()-.5,Math.random()-.5,Math.random()-.5).normalize().multiplyScalar(explosion?25+Math.random()*65:15+Math.random()*25);s.life=s.total=explosion?.7+Math.random()*.7:.25+Math.random()*.3;}
  const ring=rings[ringCursor++%rings.length];ring.mesh.position.copy(position);ring.life=ring.total=explosion?.65:.28;ring.size=explosion?25:4;ring.mesh.material.color.set(explosion?0xffac65:0x83e6ed);ring.mesh.visible=true;
 }
 function update(dt){let active=0;for(let i=0;i<capacity;i++){const s=slots[i];s.life=Math.max(0,s.life-dt);if(s.life>0)active++;s.p.addScaledVector(s.v,dt);dummy.position.copy(s.p);dummy.scale.setScalar(s.life>0?.12+s.life/s.total*.5:0);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);}mesh.visible=active>0;mesh.instanceMatrix.needsUpdate=true;for(const r of rings){r.life=Math.max(0,r.life-dt);r.mesh.visible=r.life>0;r.mesh.scale.setScalar(1+(1-r.life/r.total)*r.size);r.mesh.material.opacity=r.life/r.total*.5;}}
 function clear(){for(const s of slots)s.life=0;for(const r of rings)r.life=0;update(0);}
 clear();return {burst,update,clear};
}
