import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {keepCameraAboveGround,createWalkingCamera} from '../src/world/walking-camera.js';
test('third-person camera clears a ridge between the character and camera',()=>{
 const focus=new THREE.Vector3(0,2,0),desired=new THREE.Vector3(0,3,8),height=(x,z)=>z>3&&z<5?4:0;
 const result=keepCameraAboveGround(focus,desired,height);
 for(let i=1;i<=24;i++){const p=focus.clone().lerp(result,i/24);assert.ok(p.y>=height(p.x,p.z)+.65-1e-8);}
 assert.deepEqual(desired.toArray(),[0,3,8]);
});
test('camera zoom stays bounded and sprint changes field of view smoothly',()=>{
 const camera=new THREE.PerspectiveCamera(61,1,.1,1000),rig=createWalkingCamera(),walker=new THREE.Vector3(0,1.8,0);camera.position.set(0,3,7);rig.zoom(-1e6);
 for(let i=0;i<120;i++)rig.update(camera,walker,0,-.15,false,1/60,()=>0);
 assert.ok(camera.position.distanceTo(walker)>3);rig.zoom(1e6);rig.update(camera,walker,0,-.15,true,1/60,()=>0);assert.ok(camera.fov>61&&camera.fov<69);
 for(let i=0;i<120;i++)rig.update(camera,walker,0,-.15,false,1/60,()=>0);assert.ok(camera.position.distanceTo(walker)<14);
});
