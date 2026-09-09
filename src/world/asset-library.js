import {createBrickExplorer} from './brick-explorer.js';
import {illustrateMaterial} from './art-direction.js';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
const files={fighterA:'Spaceship_FernandoTheFlamingo',fighterB:'Spaceship_RaeTheRedPanda',rockA:'Rock_1',rockB:'Rock_2',rockC:'Rock_Large_2'};
const assets={},rockCache=[];
export async function loadAssetLibrary(){
  const loader=new GLTFLoader();
  await Promise.all(Object.entries(files).map(async([key,file])=>{const gltf=await loader.loadAsync(`/models/quaternius/${file}.glb`);gltf.scene.traverse(o=>{if(!o.isMesh)return;o.castShadow=o.receiveShadow=true;o.geometry.userData.sharedAsset=true;for(const m of Array.isArray(o.material)?o.material:[o.material]){m.userData.sharedAsset=true;m.envMapIntensity=.85;m.roughness=Math.max(m.roughness,.48);illustrateMaterial(m);if(m.map)m.map.anisotropy=4;}});assets[key]=gltf;}));
}
export function createFighter(index=0){
  const model=assets[index%2?'fighterB':'fighterA'].scene.clone(true),ship=new THREE.Group();model.rotation.y=Math.PI;model.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3()),scale=6/Math.max(size.x,size.z);
  model.scale.multiplyScalar(scale);model.position.sub(center.multiplyScalar(scale));ship.add(model);const glow=new THREE.Mesh(new THREE.ConeGeometry(.3,2.5,8),new THREE.MeshBasicMaterial({color:0x79e7ff,toneMapped:false}));glow.rotation.x=Math.PI/2;glow.position.set(0,0,3.3);ship.add(glow);return ship;
}
export function getRock(index=0){
  const key=index%3;
  if(!rockCache[key]){
    const model=assets[['rockA','rockB','rockC'][key]].scene;model.updateMatrixWorld(true);const parts=[],materials=[];
    model.traverse(o=>{if(!o.isMesh)return;let g=o.geometry.clone().applyMatrix4(o.matrixWorld);if(g.index){const expanded=g.toNonIndexed();g.dispose();g=expanded;}for(const attr of Object.keys(g.attributes))if(!['position','normal','uv'].includes(attr))g.deleteAttribute(attr);if(!g.attributes.normal)g.computeVertexNormals();if(!g.attributes.uv)g.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(g.attributes.position.count*2),2));parts.push(g);materials.push(Array.isArray(o.material)?o.material[0]:o.material);});
    const geometry=mergeGeometries(parts,true);for(const p of parts)p.dispose();geometry.computeBoundingSphere();const {center,radius}=geometry.boundingSphere;geometry.translate(-center.x,-center.y,-center.z);geometry.scale(1/radius,1/radius,1/radius);geometry.computeBoundingSphere();rockCache[key]={geometry,material:materials};
  }
  return {geometry:rockCache[key].geometry.clone(),material:rockCache[key].material};
}
export const createExplorer=createBrickExplorer;
