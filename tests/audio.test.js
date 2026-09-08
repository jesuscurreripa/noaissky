import test from 'node:test';
import assert from 'node:assert/strict';
import {statSync} from 'node:fs';
import {audioMix} from '../src/audio/game-audio.js';
test('audio quietens when parked or paused, and responds to thrust',()=>{assert.equal(audioMix('paused').engine,0);assert.equal(audioMix('menu').music,0);assert.equal(audioMix('walking').engine,0);assert.ok(audioMix('space',1600).engine>audioMix('space',0).engine);assert.ok(audioMix('walking').music>0);});
test('bundled music and effects fit a small download budget',()=>{let total=0;for(const name of ['laser','hit','explosion','scan','landing','takeoff','warp','engine','rocket','outer-space']){const bytes=statSync(`public/audio/${name}.mp3`).size;assert.ok(bytes>100);total+=bytes;}assert.ok(total<1500000);});
test('rocket envelope follows launch and retro-thrust braking',()=>{
 assert.ok(audioMix('takeoff',30,.8).rocket>audioMix('takeoff',30,0).rocket);
 assert.ok(audioMix('takeoff',30,.8).cutoff>audioMix('takeoff',30,0).cutoff);
 assert.ok(audioMix('landing',20,.5).rocket>audioMix('landing',0,1).rocket);
 assert.equal(audioMix('landed').rocket,0);assert.equal(audioMix('paused').rumble,0);
 assert.ok(audioMix('landing',20,.5).music<audioMix('space',20).music);
});
