import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {interceptPoint,steerFighter} from '../src/world/dogfight.js';
import {createRenderBudget} from '../src/world/render-budget.js';
test('interception leads a moving target and stays finite for unreachable targets',()=>{const origin=new THREE.Vector3(),target=new THREE.Vector3(0,0,-200),velocity=new THREE.Vector3(80,0,0);const aim=interceptPoint(origin,target,velocity,650);assert.ok(aim.x>0);assert.ok(Math.abs(aim.length()/650-aim.x/80)<1e-6);assert.ok(interceptPoint(origin,target,new THREE.Vector3(900,0,0),650).toArray().every(Number.isFinite));});
test('fighter retreats at close range without teleporting',()=>{const enemy={mesh:new THREE.Group(),phase:0};enemy.mesh.position.set(0,0,40);const before=enemy.mesh.position.clone();const state=steerFighter(enemy,new THREE.Vector3(),new THREE.Vector3(),0,1/60,[]);assert.equal(state.retreat,true);assert.ok(enemy.mesh.position.distanceTo(before)<3);assert.ok(enemy.mesh.quaternion.toArray().every(Number.isFinite));});
test('render budget ignores stalls and lowers resolution after sustained low frame rate',()=>{const budget=createRenderBudget(1.6);assert.equal(budget.sample(1,true),null);let result;for(let i=0;i<101;i++){const value=budget.sample(.04,true);if(value!==null)result=value;}assert.ok(result<1.6&&result>=1);});
