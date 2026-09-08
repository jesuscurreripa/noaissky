import * as THREE from 'three';
import {planetHeight,radialAltitude,constrainToGround} from './planet-field.js';

// Navigation and collision are independent of the renderer and the visual LOD.
export function landingGuidance(position,targetDirection,radius,seed) {
  const up=position.clone().normalize(),height=radialAltitude(position,radius,seed);
  const target=targetDirection.clone().multiplyScalar(radius+planetHeight(targetDirection,seed)+2);
  const distance=position.distanceTo(target),angular=Math.acos(THREE.MathUtils.clamp(up.dot(targetDirection),-1,1));
  let direction,speed;
  if(angular>.025){
    direction=targetDirection.clone().addScaledVector(up,-targetDirection.dot(up));
    if(direction.lengthSq()<1e-10)direction.crossVectors(Math.abs(up.y)<.9?new THREE.Vector3(0,1,0):new THREE.Vector3(1,0,0),up);
    direction.normalize();
    const cruise=Math.max(3000,Math.min(radius*.2,angular*radius*.3));
    direction.addScaledVector(up,THREE.MathUtils.clamp((cruise-height)/3000,-.5,1)).normalize();
    speed=THREE.MathUtils.clamp(distance*.3,100,16000);
  }else{direction=target.clone().sub(position).normalize();speed=THREE.MathUtils.clamp(distance*.55,0,18000);}
  return {direction,speed,target,distance,finished:distance<.15&&height<2.2};
}

export function advanceRadialFlight(position,velocity,dt,radius,seed,clearance=2) {
  let contact=false;
  const steps=Math.max(1,Math.ceil(velocity.length()*dt/12));
  for(let i=0;i<steps;i++){
    position.addScaledVector(velocity,dt/steps);
    if(radialAltitude(position,radius,seed)<clearance){
      contact=true;constrainToGround(position,radius,seed,clearance);
      const normal=position.clone().normalize(),inward=velocity.dot(normal);
      if(inward<0)velocity.addScaledVector(normal,-inward);
    }
  }
  return contact;
}

export function advanceSurfaceWalker(direction,forward,rightInput,forwardInput,distance) {
  forward.addScaledVector(direction,-forward.dot(direction)).normalize();
  const right=new THREE.Vector3().crossVectors(forward,direction).normalize();
  const movement=forward.clone().multiplyScalar(forwardInput).addScaledVector(right,rightInput);
  if(movement.lengthSq())direction.addScaledVector(movement.normalize(),distance).normalize();
  return movement;
}
