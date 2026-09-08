import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createPlanetFrame,renderRelative} from '../src/world/large-world.js';
import {selectTerrainLeaves,createTerrainQuadtree} from '../src/world/terrain-quadtree.js';

test('planet frames preserve metre coordinates at poles and convert orbital kilometres',()=>{
  for(const normal of [new THREE.Vector3(0,1,0),new THREE.Vector3(0,0,1),new THREE.Vector3(1,2,3)]){
    const f=createPlanetFrame({radius:6000,position:[1e8,0,0]},normal),p=new THREE.Vector3(45000,123.25,-17000);
    assert.ok(f.fromPlanet(f.toPlanet(p)).distanceTo(p)<1e-8);
    assert.equal(f.radius,6000000);
    assert.ok(Math.abs(f.toSystem(new THREE.Vector3()).x-1e11-f.up.x*f.radius)<.0001);
  }
});
test('render origin preserves sub-metre offsets at astronomical distances and restores on error',()=>{
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(),mesh=new THREE.Group();scene.add(mesh);
  camera.position.set(1e12,2e11,-1e12);mesh.position.copy(camera.position).add(new THREE.Vector3(.125,2,-3));
  const before=mesh.position.clone();
  assert.throws(()=>renderRelative(scene,camera,()=>{assert.equal(camera.position.length(),0);assert.equal(mesh.position.x,.125);throw Error('render');}));
  assert.deepEqual(mesh.position,before);assert.equal(camera.position.x,1e12);
});
test('quadtree covers root exactly within budget and concentrates detail near visitor',()=>{
  const leaves=selectTerrainLeaves({x:23000,y:2,z:-12000});
  assert.ok(leaves.length<=256);assert.equal(leaves.reduce((a,n)=>a+n.size*n.size,0),131072**2);
  const near=leaves.find(n=>Math.abs(n.x-23000)<=n.size/2&&Math.abs(n.z+12000)<=n.size/2);
  assert.equal(near.size,128);
  for(let i=0;i<leaves.length;i++)for(let j=i+1;j<leaves.length;j++){
    const a=leaves[i],b=leaves[j];assert.ok(Math.abs(a.x-b.x)>=(a.size+b.size)/2||Math.abs(a.z-b.z)>=(a.size+b.size)/2);
  }
});
test('terrain retains complete coverage while staging, then disposes replaced chunks',()=>{
  const material=new THREE.MeshBasicMaterial(),terrain=createTerrainQuadtree({height:(x,z)=>Math.sin(x*.01)*10+z*.001,material,colorAt:()=>new THREE.Color('green'),buildsPerFrame:4});
  terrain.update({x:0,y:2,z:0});const initial=terrain.group.children.filter(m=>m.visible);let disposed=0;
  for(const m of initial)m.geometry.addEventListener('dispose',()=>disposed++);
  terrain.update({x:40000,y:2,z:30000});assert.ok(terrain.stats.pending>0);assert.ok(initial.every(m=>m.visible));
  for(let i=0;i<100&&terrain.stats.pending;i++)terrain.update({x:40000,y:2,z:30000});
  assert.equal(terrain.stats.pending,0);assert.ok(disposed>0);assert.ok(terrain.stats.resident<=256);
  for(const mesh of terrain.group.children)for(const value of mesh.geometry.attributes.position.array)assert.ok(Number.isFinite(value));
  terrain.dispose();assert.equal(terrain.group.children.length,0);material.dispose();
});
