import * as THREE from 'three';
export function keepCameraAboveGround(focus,desired,height,clearance=.65){
 const result=desired.clone();
 for(let i=1;i<=24;i++){const t=i/24,p=focus.clone().lerp(result,t),floor=Math.max(height(p.x,p.z),.1)+clearance;if(p.y<floor)result.y+=(floor-p.y)/t;}
 return result;
}
export function createWalkingCamera(){
 const focus=new THREE.Vector3();let initialized=false,distance=7;
 return {reset(){initialized=false;},zoom(delta){distance=THREE.MathUtils.clamp(distance+delta*.008,3.5,13);},update(camera,walker,yaw,pitch,sprint,dt,height){
 const anchor=walker.clone().add(new THREE.Vector3(0,.1,0));if(!initialized){focus.copy(anchor);initialized=true;}focus.lerp(anchor,1-Math.exp(-14*dt));
 const rotation=new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch,yaw,0,'YXZ'));
 const desired=focus.clone().add(new THREE.Vector3(.85,1,distance+(sprint?1:0)).applyQuaternion(rotation));
 const safe=keepCameraAboveGround(focus,desired,height);camera.position.lerp(safe,1-Math.exp(-10*dt));camera.position.copy(keepCameraAboveGround(focus,camera.position,height));
 camera.up.set(0,1,0);const look=focus.clone().add(new THREE.Vector3(0,0,-2).applyQuaternion(rotation));const aim=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(camera.position,look,camera.up));camera.quaternion.slerp(aim,1-Math.exp(-14*dt));camera.fov=THREE.MathUtils.damp(camera.fov,sprint?69:61,5,dt);camera.updateProjectionMatrix();
 }};
}
