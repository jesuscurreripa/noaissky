import * as THREE from 'three';
export const easeFlight=t=>{t=THREE.MathUtils.clamp(t,0,1);return t*t*t*(t*(t*6-15)+10);};
export function flightQuaternion(direction){
  const d=direction.clone().normalize();if(d.lengthSq()<.1)d.set(0,0,-1);
  const up=Math.abs(d.y)>.98?new THREE.Vector3(0,0,1):new THREE.Vector3(0,1,0);
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(new THREE.Vector3(),d,up));
}
export function departureFrame(planet,normal){
  const outward=normal.clone().normalize();if(outward.lengthSq()<.1)outward.set(0,0,1);
  return {position:new THREE.Vector3(...planet.position).addScaledVector(outward,planet.radius+360),quaternion:flightQuaternion(outward)};
}
export function rebaseFlightCamera(camera,ship,position,quaternion){
  const inverse=ship.quaternion.clone().invert();
  const offset=camera.position.clone().sub(ship.position).applyQuaternion(inverse);
  const relativeRotation=inverse.clone().multiply(camera.quaternion);
  ship.position.copy(position);ship.quaternion.copy(quaternion);
  camera.position.copy(offset.applyQuaternion(quaternion).add(position));
  camera.quaternion.copy(quaternion).multiply(relativeRotation);camera.up.set(0,1,0).applyQuaternion(quaternion);
}
