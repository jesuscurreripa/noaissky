import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {departureFrame,rebaseFlightCamera,easeFlight} from '../src/world/flight-transition.js';
test('the departing planet stays behind the ship for every exit direction',()=>{
 const planet={position:[900,120,-300],radius:250};
 for(const normal of [[0,0,1],[0,0,-1],[1,0,0],[0,1,0],[0,-1,0],[1,2,-3],[0,0,0]]){
  const frame=departureFrame(planet,new THREE.Vector3(...normal)),fwd=new THREE.Vector3(0,0,-1).applyQuaternion(frame.quaternion),toPlanet=new THREE.Vector3(...planet.position).sub(frame.position);
  assert.ok(fwd.dot(toPlanet.normalize())<-.99999);assert.ok(Math.abs(frame.position.distanceTo(new THREE.Vector3(...planet.position))-610)<1e-6);
 }
});
test('scene handoff preserves camera position and rotation relative to the ship',()=>{
 const ship=new THREE.Object3D(),camera=new THREE.PerspectiveCamera();ship.position.set(22,44,-77);ship.rotation.set(.2,.6,.1);camera.position.copy(new THREE.Vector3(0,5,20).applyQuaternion(ship.quaternion).add(ship.position));camera.quaternion.copy(ship.quaternion);
 const frame=departureFrame({position:[-400,50,900],radius:300},new THREE.Vector3(1,1,0));rebaseFlightCamera(camera,ship,frame.position,frame.quaternion);
 const local=camera.position.clone().sub(ship.position).applyQuaternion(ship.quaternion.clone().invert());assert.ok(local.distanceTo(new THREE.Vector3(0,5,20))<1e-8);assert.ok(camera.quaternion.angleTo(ship.quaternion)<1e-7);
});
test('cloud and camera easing has smooth endpoints and cannot overshoot',()=>{assert.equal(easeFlight(0),0);assert.equal(easeFlight(1),1);for(let i=0;i<=100;i++)assert.ok(easeFlight(i/100)>=0&&easeFlight(i/100)<=1);assert.ok(easeFlight(.001)<1e-7);});
