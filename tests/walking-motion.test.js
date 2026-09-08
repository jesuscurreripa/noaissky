import test from 'node:test';
import assert from 'node:assert/strict';
import {createWalkingMotion} from '../src/world/walking-motion.js';
import {createSystem,terrainHeight} from '../src/world/procedural.js';
const idle={x:0,z:0};
test('walks uphill and downhill with continuous ground contact',()=>{
 for(const slope of [-.4,.4]){
  const motion=createWalkingMotion(),p={x:0,y:0,z:0},height=x=>20+x*slope;motion.reset(p,height);
  for(let i=0;i<180;i++){
   const last=p.y;motion.update(p,{x:1,z:0},10,1/60,height);
   assert.ok(motion.grounded);assert.ok(Math.abs(p.y-last)<.07);
   assert.ok(Math.abs(p.y-height(p.x)-1.8)<1e-8);
  }
 }
});
test('Space request produces one ballistic jump and lands without automatic repeat',()=>{
 const motion=createWalkingMotion(),p={x:0,y:0,z:0};motion.reset(p,()=>0);motion.requestJump();let peak=p.y;
 for(let i=0;i<120;i++){
  motion.update(p,idle,10,1/120,()=>0);peak=Math.max(peak,p.y);
  if(i===20)motion.requestJump(); // An early airborne press cannot double jump.
 }
 assert.ok(peak>3.5&&peak<3.7);assert.ok(motion.grounded);assert.ok(Math.abs(p.y-1.9)<1e-10);
 for(let i=0;i<60;i++)motion.update(p,idle,10,1/60,()=>0);
 assert.ok(Math.abs(p.y-1.9)<1e-10);
});
test('ledge descent falls under gravity and cliffs do not teleport the player',()=>{
 for(const destination of [0,30]){
  const height=x=>x<1?10:destination,motion=createWalkingMotion(),p={x:0,y:0,z:0};motion.reset(p,height);
  for(let i=0;i<30;i++){
   const last=p.y;motion.update(p,{x:1,z:0},10,1/120,height);
   assert.ok(Math.abs(p.y-last)<.1);
  }
  if(destination===30)assert.ok(p.x<1);else assert.ok(!motion.grounded&&p.y<11.8&&p.y>10);
 }
});
test('region bounds and input reset hold across frame rates',()=>{
 const results=[30,60,144].map(fps=>{
  const motion=createWalkingMotion(),p={x:0,y:0,z:0};motion.reset(p,()=>5);motion.requestJump();
  for(let i=0;i<fps;i++)motion.update(p,{x:1,z:0},10,1/fps,()=>5,4);
  assert.ok(Math.hypot(p.x,p.z)<=4);assert.ok(motion.grounded);
  motion.requestJump();motion.clearInput();motion.update(p,idle,10,1/fps,()=>5,4);assert.ok(motion.grounded);
  motion.reset(p,()=>10);assert.equal(p.y,11.8);assert.equal(motion.speed,0);
  return p.y;
 });assert.equal(results[0],results[2]);
});
test('arid terrain has no quantized vertical steps',()=>{
 const planet=createSystem('WALKING-TERRACES')[2];
 for(let x=300;x<900;x+=.3)assert.ok(Math.abs(terrainHeight(x+.001,350,planet)-terrainHeight(x,350,planet))<.02);
});

test('jump apex and travel are comparable at 30, 60 and 144 FPS',()=>{
 const results=[30,60,144].map(fps=>{
  const motion=createWalkingMotion(),p={x:0,y:0,z:0};motion.reset(p,()=>5);motion.requestJump();let peak=p.y;
  for(let i=0;i<fps;i++){motion.update(p,{x:1,z:0},10,1/fps,()=>5);peak=Math.max(peak,p.y);}
  return {x:p.x,peak};
 });
 for(const result of results){assert.ok(Math.abs(result.x-results[0].x)<.05);assert.ok(Math.abs(result.peak-results[0].peak)<.01);}
});
