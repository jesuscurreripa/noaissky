import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createSystem,STAR,solarExposure} from '../src/world/procedural.js';
import {solarRoute} from '../src/world/solar.js';
test('nine distinct worlds have separated orbits outside the star and asteroid belt',()=>{
 const planets=createSystem('NO-AI-2026');assert.equal(new Set(planets.map(p=>p.key)).size,9);
 for(let i=0;i<planets.length;i++){const p=planets[i];assert.ok(Math.abs(Math.hypot(...p.position)-p.orbitRadius)<1e-8);assert.ok(p.orbitRadius-p.radius>STAR.heatRadius);if(i)assert.ok(p.orbitRadius-planets[i-1].orbitRadius>p.radius+planets[i-1].radius);}
 assert.ok(planets[4].orbitRadius+planets[4].radius*6<STAR.beltInner+1000);
 assert.ok(planets[5].orbitRadius-planets[5].radius*3>STAR.beltOuter);
 assert.equal(planets.filter(p=>!p.landable).length,2);
});
test('solar heating rises inward and ends outside the danger zone',()=>{assert.equal(solarExposure(4000),0);assert.equal(solarExposure(STAR.exclusionRadius),1);assert.ok(solarExposure(1500)>solarExposure(2400));});
test('automatic routes avoid the sun and preserve every destination',()=>{
 const points=createSystem('NO-AI-2026').map(p=>new THREE.Vector3(...p.position));points.push(new THREE.Vector3(1160,0,0),new THREE.Vector3(-5000,0,0));
 for(const start of points)for(const end of points){const route=solarRoute(start,end);assert.ok(route.getPoint(0).distanceTo(start)<1e-7);assert.ok(route.getPoint(1).distanceTo(end)<1e-7);assert.ok(route.getPoints(600).every(p=>p.length()>STAR.exclusionRadius));}
});
