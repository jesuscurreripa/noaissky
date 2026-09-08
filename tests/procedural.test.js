import test from 'node:test';
import assert from 'node:assert/strict';
import {createSystem, terrainHeight, noise2, rng} from '../src/world/procedural.js';
test('same seed reconstructs the entire planetary system',()=>{assert.deepEqual(createSystem('NO-AI-2026'),createSystem('NO-AI-2026'));assert.notDeepEqual(createSystem('NO-AI-2026'),createSystem('ANOTHER'));});
test('all planetary terrains have a clear dry arrival site and finite varied terrain',()=>{for(const p of createSystem('FRONTIER')){assert.equal(terrainHeight(0,0,p),23);const heights=[];for(let x=-3000;x<=3000;x+=121){const h=terrainHeight(x,x*.7,p);assert.ok(Number.isFinite(h));heights.push(h);}assert.ok(Math.max(...heights)-Math.min(...heights)>30);assert.ok(Math.abs(terrainHeight(.01,0,p)-23)<.01);}});
test('noise is continuous across cell boundaries and repeatable random stays bounded',()=>{assert.ok(Math.abs(noise2(.99999,2,5)-noise2(1.00001,2,5))<.001);const a=rng(22),b=rng(22);for(let i=0;i<100;i++){const v=a();assert.equal(v,b());assert.ok(v>=0&&v<1);}});
