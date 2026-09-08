import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {landingGuidance,advanceRadialFlight,advanceSurfaceWalker} from '../src/world/planet-motion.js';
import {planetHeight,radialAltitude} from '../src/world/planet-field.js';
const radius=195000,seed=9876;

test('assisted landing reaches the same saved coordinates from orbit and across a hemisphere',()=>{
  const target=new THREE.Vector3(.18,.22,1).normalize();
  for(const start of [target.clone().multiplyScalar(radius*1.35),new THREE.Vector3(-1,0,0).multiplyScalar(radius*1.2)]){
    const position=start.clone(),velocity=new THREE.Vector3();let complete=false;
    for(let i=0;i<24000;i++){
      const g=landingGuidance(position,target,radius,seed);if(g.finished){complete=true;break;}
      velocity.lerp(g.direction.multiplyScalar(g.speed),1-Math.exp(-4/60));
      advanceRadialFlight(position,velocity,1/60,radius,seed);
      assert.ok(radialAltitude(position,radius,seed)>1.99999);
    }
    assert.ok(complete,'must converge without teleportation');
    assert.ok(position.distanceTo(target.clone().multiplyScalar(radius+planetHeight(target,seed)+2))<.15);
  }
});

test('antipodal guidance stays finite and does not point through the planet',()=>{
  const target=new THREE.Vector3(0,1,0),position=new THREE.Vector3(0,-radius-5000,0);
  const guidance=landingGuidance(position,target,radius,seed);
  assert.ok(guidance.direction.toArray().every(Number.isFinite));assert.ok(guidance.direction.length()>.99);
  assert.ok(guidance.direction.dot(position.clone().normalize())>=0);
});

test('maximum boosted flight cannot tunnel below the radial ground',()=>{
  const d=new THREE.Vector3(1,2,3).normalize(),position=d.clone().multiplyScalar(radius+planetHeight(d,seed)+100),velocity=d.clone().multiplyScalar(-44000);
  assert.ok(advanceRadialFlight(position,velocity,.05,radius,seed));assert.ok(radialAltitude(position,radius,seed)>=1.99999);assert.ok(velocity.dot(d)>-.001);
});

test('walking moves tangentially with stable surface distance and no diagonal speed bonus',()=>{
  const start=new THREE.Vector3(0,1,0),forward=new THREE.Vector3(1,0,0);
  for(const input of [[0,1],[1,1]]){
    const direction=start.clone();for(let i=0;i<600;i++)advanceSurfaceWalker(direction,forward.clone(),...input,6/60/radius);
    assert.ok(Math.abs(direction.length()-1)<1e-12);
    const distance=Math.acos(direction.dot(start))*radius;
    assert.ok(Math.abs(distance-60)<.05);
  }
});
