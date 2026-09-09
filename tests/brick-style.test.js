import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createBrickExplorer} from '../src/world/brick-explorer.js';
import {createBrickClouds} from '../src/world/brick-clouds.js';
import {createBrickHorizon} from '../src/world/brick-horizon.js';
import {appendTerrainStuds,createBrickTerrainMaterial} from '../src/world/brick-terrain.js';
import {createTerrainQuadtree} from '../src/world/terrain-quadtree.js';
import {createSystem} from '../src/world/procedural.js';
import {disposeGroup} from '../src/world/universe.js';
const planet=createSystem('BRICK-STYLE')[3];
test('astronaut has foot-level origin, camera-compatible size and distinct rigid poses',()=>{
 const explorer=createBrickExplorer(),bounds=new THREE.Box3().setFromObject(explorer.mesh);
 assert.ok(Math.abs(bounds.min.y)<.02);assert.ok(bounds.max.y>2.3&&bounds.max.y<2.5);
 const arm=explorer.mesh.getObjectByName('rightArm'),leg=explorer.mesh.getObjectByName('leftLeg');
 explorer.play('Walk');explorer.mixer.update(.1);assert.ok(Math.abs(leg.rotation.x)>.1);
 explorer.play('Jump');for(let i=0;i<60;i++)explorer.mixer.update(1/60);assert.ok(arm.rotation.x<-.7);
 explorer.play('Wave');for(let i=0;i<60;i++)explorer.mixer.update(1/60);assert.ok(arm.rotation.z<-1.9);
 explorer.play('Idle');for(let i=0;i<60;i++)explorer.mixer.update(1/60);assert.ok(Math.abs(leg.rotation.x)<1e-6);
 explorer.mesh.traverse(o=>{if(o.material)assert.ok(o.material.userData.toyPlastic);});disposeGroup(explorer.mesh);
});
test('clouds are seeded opaque volumes in two draw batches with bounded drift',()=>{
 const a=createBrickClouds(planet),b=createBrickClouds(planet);
 assert.equal(a.mesh.children.length,2);
 for(let i=0;i<2;i++){
  const mesh=a.mesh.children[i];assert.ok(mesh.isInstancedMesh);assert.equal(mesh.material.transparent,false);
  assert.deepEqual(mesh.instanceMatrix.array,b.mesh.children[i].instanceMatrix.array);assert.ok(mesh.boundingSphere.radius>1000);
 }
 assert.equal(a.mesh.children[0].count,486);a.update(50000);assert.ok(Math.abs(a.mesh.position.x)<=90);assert.ok(Math.abs(a.mesh.position.z)<=35);
 let disposed=0;a.mesh.children.forEach(m=>m.addEventListener('dispose',()=>disposed++));disposeGroup(a.mesh);disposeGroup(b.mesh);assert.equal(disposed,2);
 const horizon=createBrickHorizon(planet);assert.equal(horizon.count,192);disposeGroup(horizon);
});
test('nearby studs have a bounded height; distant chunks do not carry tiny geometry',()=>{
 const data={node:{x:0,z:0,size:128},segments:16,height:()=>23,colorAt:()=>new THREE.Color('red'),positions:[],colors:[],coordinates:[],indices:[]};
 appendTerrainStuds(data);assert.ok(data.indices.length>0);assert.ok(data.indices.length/3<=27136);
 for(let i=1;i<data.positions.length;i+=3)assert.ok(data.positions[i]>=23&&data.positions[i]<=23.101);
 assert.equal(data.positions.length,data.colors.length);assert.equal(data.positions.length,data.coordinates.length);
 const far={...data,node:{...data.node,size:256},positions:[],indices:[]};appendTerrainStuds(far);assert.equal(far.indices.length,0);
});
test('decorated terrain preserves bounded quadtree coverage and disposes its buffers',()=>{
 const material=createBrickTerrainMaterial(),terrain=createTerrainQuadtree({height:()=>23,material,colorAt:()=>new THREE.Color('tan'),decorateGeometry:appendTerrainStuds});
 terrain.update({x:0,y:2,z:0});assert.ok(terrain.stats.leaves<=256);assert.ok(terrain.stats.triangles<1500000);assert.equal(terrain.stats.pending,0);
 for(const mesh of terrain.group.children){assert.equal(mesh.geometry.attributes.position.count,mesh.geometry.attributes.terrainPosition.count);assert.ok(Number.isFinite(mesh.geometry.boundingSphere.radius));}
 let disposed=0;terrain.group.children.forEach(m=>m.geometry.addEventListener('dispose',()=>disposed++));const count=terrain.group.children.length;terrain.dispose();assert.equal(disposed,count);material.dispose();
});
