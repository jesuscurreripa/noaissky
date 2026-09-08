import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {cubeDirection,planetHeight,surfacePoint,radialAltitude,constrainToGround,tangentOrientation,nodeDescriptor} from '../src/world/planet-field.js';
import {buildPlanetChunk} from '../src/world/planet-chunk.js';
const radius=195000,seed=45678;

test('all twelve cube seams share identical geographic samples and heights',()=>{
  const points=new Map();
  for(let face=0;face<6;face++)for(let edge=0;edge<4;edge++)for(let i=1;i<16;i++){
    const t=-1+i/8,u=edge===0?-1:edge===1?1:t,v=edge===2?-1:edge===3?1:t;
    const d=cubeDirection(face,u,v),key=d.toArray().map(n=>n.toFixed(10)).join(',');
    const p=surfacePoint(face,u,v,radius,seed);
    if(points.has(key)){assert.ok(points.get(key).p.distanceTo(p)<1e-8);points.get(key).count++;}else points.set(key,{p,count:1});
  }
  assert.equal(points.size,180);assert.ok([...points.values()].every(p=>p.count===2));
});

test('radial collision and orientation work on every face and at both poles',()=>{
  for(let face=0;face<6;face++)for(const u of [-1,0,1])for(const v of [-1,0,1]){
    const d=cubeDirection(face,u,v),position=d.clone().multiplyScalar(radius-3000);
    constrainToGround(position,radius,seed,2);
    assert.ok(Math.abs(radialAltitude(position,radius,seed)-2)<1e-8);
    const q=tangentOrientation(position,d);
    assert.ok(new THREE.Vector3(0,1,0).applyQuaternion(q).distanceTo(d)<1e-8);
    assert.ok(Math.abs(new THREE.Vector3(0,0,-1).applyQuaternion(q).dot(d))<1e-8);
  }
});

test('global field is deterministic and remains continuous across tiny direction changes',()=>{
  const d=new THREE.Vector3(.2,.7,1).normalize();
  assert.equal(planetHeight(d,seed),planetHeight(d,seed));
  assert.notEqual(planetHeight(d,seed),planetHeight(d,seed+1));
  assert.ok(Math.abs(planetHeight(d,seed)-planetHeight(d.clone().add(new THREE.Vector3(1e-9,0,0)).normalize(),seed))<.01);
});

test('fine chunks begin on exact parent triangles, including all face orientations',()=>{
  for(let face=0;face<6;face++){
    const node=nodeDescriptor(face,5,15,18),data=buildPlanetChunk({node,radius,seed,land:'#aaa',rock:'#666',segments:8});
    for(let y=0;y<=8;y+=2)for(let x=0;x<=8;x+=2){const i=(y*9+x)*3;for(let axis=0;axis<3;axis++)assert.ok(Math.abs(data.positions[i+axis]-data.coarse[i+axis])<.002);}
    for(let i=0;i<9*9;i++){
      const p=new THREE.Vector3().fromArray(data.positions,i*3).add(new THREE.Vector3(...data.center));
      assert.ok(Math.abs(radialAltitude(p,radius,seed))<.01);
      const n=new THREE.Vector3().fromArray(data.normals,i*3);assert.ok(Math.abs(n.length()-1)<1e-6);assert.ok(n.dot(p.clone().normalize())>.7);
    }
    assert.ok(data.indices.every(i=>i<data.positions.length/3));
    // Top-side winding must face away from the planet on all six cube faces.
    const a=new THREE.Vector3().fromArray(data.positions,data.indices[0]*3),b=new THREE.Vector3().fromArray(data.positions,data.indices[1]*3),c=new THREE.Vector3().fromArray(data.positions,data.indices[2]*3);
    assert.ok(b.sub(a).cross(c.sub(a)).dot(new THREE.Vector3(...data.center))>0);
  }
});

import {createSphericalTerrain} from '../src/world/spherical-terrain.js';
test('streaming maintains a visible fallback and a bounded cache across camera reversals',()=>{
  let worker,terminated=false;
  const terrain=createSphericalTerrain({radius:195,seed,land:'#aaa',rock:'#666'},{maxLeaves:90,maxResident:150,maxLevel:7,segments:4,workerFactory:()=>worker={postMessage(data){this.pending=data;},terminate(){terminated=true;}}});
  const camera=new THREE.PerspectiveCamera(60,1,.1,radius*5);
  for(const face of [4,0,5,2,3,4]){
    const position=cubeDirection(face,.12,.15).multiplyScalar(radius+3000);camera.position.copy(position);camera.up.copy(new THREE.Vector3(0,1,0));camera.lookAt(0,0,0);camera.updateMatrixWorld(true);
    for(let i=0;i<130;i++){
      terrain.update(camera,.1,720);
      assert.ok(terrain.stats.visible>0);assert.ok(terrain.stats.visible<=90);
      assert.ok(terrain.stats.resident<=150);
      if(worker.pending){const data=worker.pending;worker.pending=null;worker.onmessage({data:{key:data.key,result:buildPlanetChunk(data.job)}});}
    }
  }
  assert.ok(terrain.stats.level>=3);
  terrain.dispose();assert.ok(terminated);assert.equal(terrain.group.children.length,0);
});
