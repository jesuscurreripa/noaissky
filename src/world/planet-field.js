import * as THREE from 'three';

// Face bases share exactly the same cube-edge positions. Heights depend only on
// direction, never on face, tile, observer, or LOD.
export const CUBE_FACES = [
  [[1,0,0],[0,0,-1],[0,1,0]], [[-1,0,0],[0,0,1],[0,1,0]],
  [[0,1,0],[1,0,0],[0,0,-1]], [[0,-1,0],[1,0,0],[0,0,1]],
  [[0,0,1],[1,0,0],[0,1,0]], [[0,0,-1],[-1,0,0],[0,1,0]],
];
export function cubeDirection(face,u,v,target=new THREE.Vector3()) {
  const [n,a,b]=CUBE_FACES[face];
  return target.set(n[0]+a[0]*u+b[0]*v,n[1]+a[1]*u+b[1]*v,n[2]+a[2]*u+b[2]*v).normalize();
}
function noise(x,y,z,seed) {
  const ix=Math.floor(x),iy=Math.floor(y),iz=Math.floor(z);
  const fade=t=>t*t*(3-2*t),fx=fade(x-ix),fy=fade(y-iy),fz=fade(z-iz);
  const hash=(a,b,c)=>{let n=Math.imul(a,374761393)^Math.imul(b,668265263)^Math.imul(c,2147483647)^seed;n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;};
  let value=0;
  for(let a=0;a<2;a++)for(let b=0;b<2;b++)for(let c=0;c<2;c++)value+=hash(ix+a,iy+b,iz+c)*(a?fx:1-fx)*(b?fy:1-fy)*(c?fz:1-fz);
  return value;
}
export function planetHeight(direction,seed) {
  const {x,y,z}=direction;
  const continent=noise(x*3+11,y*3+7,z*3-9,seed)-.42;
  let h=continent*3800;
  // Finite bandwidth and amplitude: a reproducible surface for mesh AND physics.
  for(let i=0,frequency=12,amplitude=420;i<7;i++,frequency*=2,amplitude*=.43)
    h+=(noise(x*frequency,y*frequency,z*frequency,seed+i*101)-.5)*amplitude;
  return h;
}
export function surfacePoint(face,u,v,radius,seed,target=new THREE.Vector3()) {
  cubeDirection(face,u,v,target);return target.multiplyScalar(radius+planetHeight(target,seed));
}
export function radialAltitude(position,radius,seed) {
  const length=position.length();return length-radius-planetHeight(position.clone().divideScalar(length||1),seed);
}
export function constrainToGround(position,radius,seed,clearance=2) {
  const direction=position.clone().normalize();if(!direction.lengthSq())direction.set(0,0,1);
  const floor=radius+planetHeight(direction,seed)+clearance;
  if(position.length()<floor)position.copy(direction).multiplyScalar(floor);
  return position;
}
export function tangentOrientation(position,forward,target=new THREE.Quaternion()) {
  const up=position.clone().normalize();
  const heading=forward.clone().addScaledVector(up,-forward.dot(up));
  if(heading.lengthSq()<1e-10)heading.crossVectors(Math.abs(up.y)<.9?new THREE.Vector3(0,1,0):new THREE.Vector3(1,0,0),up);
  heading.normalize();
  return target.setFromRotationMatrix(new THREE.Matrix4().lookAt(new THREE.Vector3(),heading,up));
}
export function nodeDescriptor(face,level=0,x=0,y=0) {
  const width=2/2**level;
  return {face,level,x,y,width,u:-1+x*width,v:-1+y*width,key:`${face}/${level}/${x}/${y}`};
}
export function childNodes(n) {
  return [nodeDescriptor(n.face,n.level+1,n.x*2,n.y*2),nodeDescriptor(n.face,n.level+1,n.x*2+1,n.y*2),nodeDescriptor(n.face,n.level+1,n.x*2,n.y*2+1),nodeDescriptor(n.face,n.level+1,n.x*2+1,n.y*2+1)];
}
