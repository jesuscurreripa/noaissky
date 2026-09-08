import * as THREE from 'three';
import {flightQuaternion} from './flight-transition.js';
export function interceptPoint(origin,target,velocity,projectileSpeed){
 const delta=target.clone().sub(origin),a=velocity.lengthSq()-projectileSpeed**2,b=2*delta.dot(velocity),c=delta.lengthSq();let t=0;
 if(Math.abs(a)<1e-6){if(b<0)t=-c/b;}else{const disc=b*b-4*a*c;if(disc>=0){const r=Math.sqrt(disc),roots=[(-b-r)/(2*a),(-b+r)/(2*a)].filter(v=>v>0);if(roots.length)t=Math.min(...roots);}}
 return target.clone().addScaledVector(velocity,Math.min(t,2));
}
export function steerFighter(enemy,target,playerVelocity,time,dt,bodies){
 const position=enemy.mesh.position,delta=target.clone().sub(position),distance=delta.length(),toward=delta.clone().normalize();
 const side=new THREE.Vector3().crossVectors(toward,new THREE.Vector3(0,1,0));if(side.lengthSq()<.01)side.set(1,0,0);side.normalize();
 const retreat=distance<75,strafe=Math.sin(time*.7+enemy.phase),desired=toward.clone().multiplyScalar(retreat?-.55:1).addScaledVector(side,retreat?1.3:strafe*.65);desired.y+=Math.sin(time*.9+enemy.phase)*.28;
 for(const body of bodies){const away=position.clone().sub(new THREE.Vector3(...body.position)),limit=body.radius+170;const clearance=away.length();if(clearance<limit)desired.addScaledVector(away.normalize(),(1-clearance/limit)*4+2);}
 desired.normalize();enemy.velocity??=desired.clone().multiplyScalar(80);
 const cruise=distance>450?Math.min(680,playerVelocity.length()+130):95+Math.min(playerVelocity.length()*.65,320);
 enemy.velocity.lerp(desired.multiplyScalar(cruise),1-Math.exp(-1.7*dt));position.addScaledVector(enemy.velocity,dt);
 const facing=flightQuaternion(enemy.velocity);enemy.mesh.quaternion.slerp(facing,1-Math.exp(-4*dt));
 const forward=new THREE.Vector3(0,0,-1).applyQuaternion(enemy.mesh.quaternion);return {distance,aligned:forward.dot(toward)>.89,retreat};
}
