import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createSystem,terrainHeight} from '../src/world/procedural.js';
import {landmarkSites,landmarkRelief,siteHazardAt} from '../src/world/landmark-sites.js';
import {flightSpeedStep,stoppingDistance,inspectLandingSite,findLandingSite,createLandingPath,landingPathPoint} from '../src/world/flight-handling.js';
import {audioMix} from '../src/audio/game-audio.js';

test('each solid world has three repeatable, separated destinations outside the arrival zone',()=>{
  const a=createSystem('LANDMARKS'),b=createSystem('LANDMARKS');
  for(let i=0;i<a.length;i++)if(a[i].landable){
    const sites=landmarkSites(a[i]);assert.deepEqual(sites,landmarkSites(b[i]));assert.equal(new Set(sites.map(s=>s.name)).size,3);
    for(const s of sites){assert.ok(Math.hypot(s.x,s.z)>700);assert.ok(Number.isFinite(terrainHeight(s.x,s.z,a[i])));}
    for(let x=0;x<3;x++)for(let y=x+1;y<3;y++)assert.ok(Math.hypot(sites[x].x-sites[y].x,sites[x].z-sites[y].z)>900);
    assert.equal(terrainHeight(0,0,a[i]),23);
  }
});
test('named craters deform both basin and rim, and hazards only affect their interior',()=>{
  const p=createSystem('CRATER')[0],site=landmarkSites(p)[0];
  assert.ok(landmarkRelief(site.x,site.z,20,p)<20);
  assert.ok(landmarkRelief(site.x+site.radius*.75,site.z,20,p)>100);
  assert.equal(siteHazardAt(site.x,site.z,p),site);
  assert.equal(siteHazardAt(site.x+site.radius,site.z,p),null);
  assert.equal(siteHazardAt(0,0,p),null);
});
test('landing inspection rejects wet ground, a hull-edge ridge, hazards and obstacles',()=>{
  assert.equal(inspectLandingSite(()=>0,0,0).safe,false);
  assert.equal(inspectLandingSite((x,z)=>Math.hypot(x,z)>8?30:20,0,0).safe,false);
  assert.equal(inspectLandingSite(()=>20,0,0,{obstacles:[{x:12,z:0,radius:5}]}).safe,false);
  assert.equal(inspectLandingSite(()=>20,0,0,{hazardAt:()=>({})}).safe,false);
  assert.equal(inspectLandingSite(()=>20,0,0).safe,true);
  assert.equal(findLandingSite(new THREE.Vector3(),()=>-20),null);
});
test('landing search finds a nearby dry site without sending the ship back to world origin',()=>{
  const origin=new THREE.Vector3(10000,100,-8000),height=(x,z)=>Math.hypot(x-10000,z+8000)<40?-3:25;
  const site=findLandingSite(origin,height);assert.ok(site);assert.ok(site.x>9700&&site.z<-7700);assert.ok(inspectLandingSite(height,site.x,site.z).safe);
});
test('landing path clears intervening ridges and structures and reaches the exact pad',()=>{
  const start=new THREE.Vector3(0,30,0),end=new THREE.Vector3(180,21.48,0),height=x=>x>60&&x<100?125:20;
  const path=createLandingPath(start,end,height,[{x:130,z:0,radius:20,top:160}]);
  assert.ok(path.cruise>=175);assert.deepEqual(landingPathPoint(path,0),start);assert.deepEqual(landingPathPoint(path,1),end);
  for(let i=0;i<1000;i++){const p=landingPathPoint(path,i/1000);assert.ok(p.y>=height(p.x)+1.47);if(p.x>110&&p.x<150)assert.ok(p.y>160);}
});
test('braking dominates boost, has predictable stopping range and is frame-rate independent',()=>{
  const simulate=hz=>{let speed=900,distance=0;for(let i=0;i<hz*2;i++){speed=flightSpeedStep(speed,900,{boost:true,brake:true,surface:true,dt:1/hz});distance+=speed*.3/hz;}return {speed,distance};};
  const a=simulate(30),b=simulate(120);assert.equal(a.speed,0);assert.equal(b.speed,0);
  assert.ok(b.distance<=stoppingDistance(900));assert.ok(Math.abs(b.distance-a.distance)<4);
  let slow=0,fast=0;for(let i=0;i<30;i++)slow=flightSpeedStep(slow,540,{surface:true,dt:1/30});for(let i=0;i<120;i++)fast=flightSpeedStep(fast,540,{surface:true,dt:1/120});assert.ok(Math.abs(slow-fast)<1e-8);
  assert.ok(audioMix('surface',500,0,true).rocket>audioMix('surface',500).rocket);assert.equal(audioMix('paused',500,0,true).rocket,0);
});
