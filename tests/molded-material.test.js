import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {applyMoldedFinish} from '../src/world/molded-material.js';
import {createBrickFluidMaterial} from '../src/world/brick-fluid.js';
import {retroPlanetMaterial} from '../src/world/retro-planet.js';
import {createSystem} from '../src/world/procedural.js';
import {disposeGroup} from '../src/world/universe.js';
function compile(material){const shader={uniforms:{},vertexShader:THREE.ShaderLib.standard.vertexShader,fragmentShader:THREE.ShaderLib.standard.fragmentShader};material.onBeforeCompile(shader);return shader;}
function expand(source){return source.replace(/#include <([\w_]+)>/g,(_,name)=>{assert.ok(THREE.ShaderChunk[name],`missing chunk ${name}`);return expand(THREE.ShaderChunk[name]);});}
test('molded finish preserves existing hooks and is applied only once',()=>{
 const m=new THREE.MeshStandardMaterial({metalness:.8,roughness:1});let called=0;m.onBeforeCompile=s=>{called++;s.uniforms.windTime={value:2};};
 applyMoldedFinish(m);const key=m.customProgramCacheKey();applyMoldedFinish(m);assert.equal(m.customProgramCacheKey(),key);
 const shader=compile(m);assert.equal(called,1);assert.equal(shader.uniforms.windTime.value,2);assert.equal(m.metalness,0);assert.equal(m.roughness,.34);
 assert.match(shader.fragmentShader,/normal=moldNormal/);assert.match(shader.vertexShader,/moldedPosition=position/);assert.equal((shader.fragmentShader.match(/float moldedRelief=/g)||[]).length,1);
 expand(shader.vertexShader);expand(shader.fragmentShader);m.dispose();
});
test('water, lava and toxic liquid use distinct opaque shaders and live time uniforms',()=>{
 const planets=createSystem('MOLDED-FLUIDS'),keys=new Set();
 for(const planet of [planets[0],planets[1],planets[3]]){
  const depth=new THREE.DataTexture(new Uint8Array([64]),1,1,THREE.RedFormat),m=createBrickFluidMaterial(planet,depth),shader=compile(m);keys.add(m.customProgramCacheKey());
  assert.equal(m.transparent,false);assert.equal(m.depthWrite,true);assert.equal(m.metalness,0);assert.equal(m.userData.toyPlastic,true);
  m.uniforms.time.value=17;assert.equal(shader.uniforms.time.value,17);
  assert.match(shader.fragmentShader,/validDepth/);assert.match(shader.fragmentShader,/moldPattern\(tileUV\)/);assert.doesNotMatch(shader.vertexShader,/p\.y\+=/);
  if(planet.fluid==='lava'){assert.ok(m.emissiveIntensity>1);assert.match(shader.fragmentShader,/molded.x\*\(1.4\+pulse/);}
  else assert.ok(m.roughness<.3);
  expand(shader.vertexShader);expand(shader.fragmentShader);
  let freed=0;depth.addEventListener('dispose',()=>freed++);const group=new THREE.Group();group.add(new THREE.Mesh(new THREE.PlaneGeometry(),m));disposeGroup(group);assert.equal(freed,1);
 }assert.equal(keys.size,3);
});
test('orbital planet finish retains biome and lighting uniforms',()=>{
 for(const planet of createSystem('TOY-GLOBES')){const m=retroPlanetMaterial(planet);assert.match(m.fragmentShader,/moldPattern\(d.yz/);assert.ok(m.uniforms.sunDirection.value.isVector3);assert.ok(m.uniforms.kind.value>=0);expand(m.fragmentShader);m.dispose();}
});
