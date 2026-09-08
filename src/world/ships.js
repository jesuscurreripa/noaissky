import * as THREE from 'three';

// Hostile patrols remain lightweight procedural models.
export function makeEnemyShip(){
  const group=new THREE.Group();
  const dark=new THREE.MeshStandardMaterial({color:0x17252f,metalness:.55,roughness:.44});
  const edge=new THREE.MeshStandardMaterial({color:0x53616b,metalness:.7,roughness:.4});
  const orange=new THREE.MeshStandardMaterial({color:0xcc6c49,metalness:.55,roughness:.36});
  const body=new THREE.Mesh(new THREE.SphereGeometry(.85,12,8),dark);body.scale.set(1,.8,1.4);group.add(body);
  const beam=new THREE.Mesh(new THREE.BoxGeometry(4.3,.22,.28),edge);group.add(beam);
  for(const side of [-1,1]){
    const panel=new THREE.Mesh(new THREE.CylinderGeometry(1.55,1.55,.16,6),edge);panel.rotation.z=Math.PI/2;panel.position.x=side*2;group.add(panel);
    const inner=new THREE.Mesh(new THREE.CylinderGeometry(1.34,1.34,.19,6),dark);inner.rotation.z=Math.PI/2;inner.position.x=side*2;group.add(inner);
    const stripe=new THREE.Mesh(new THREE.BoxGeometry(.12,2.1,.13),orange);stripe.position.x=side*2.12;group.add(stripe);
  }
  const eye=new THREE.Mesh(new THREE.SphereGeometry(.48,12,8),new THREE.MeshBasicMaterial({color:0xf08a65}));eye.position.set(0,.08,-.91);eye.scale.set(1,.45,.3);group.add(eye);
  return group;
}
