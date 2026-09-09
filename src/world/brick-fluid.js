import * as THREE from 'three';
import {moldGLSL} from './molded-material.js';

export function createBrickFluidMaterial(planet,depthMap){
 const lava=planet.fluid==='lava',toxic=planet.key==='toxic';
 const material=new THREE.MeshStandardMaterial({color:planet.ocean,roughness:lava?.36:.2,metalness:0,emissive:lava?'#ff4808':toxic?'#5a8619':'#000000',emissiveIntensity:lava?1.5:toxic?.15:0});
 material.name=lava?'Molded lava':toxic?'Molded toxic liquid':'Molded water';material.userData.toyPlastic=true;
 // Exposed independently of compilation, so time updates and cleanup are reliable.
 material.uniforms={time:{value:0},depthMap:{value:depthMap}};
 material.onBeforeCompile=shader=>{
  Object.assign(shader.uniforms,material.uniforms);
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 fluidPosition;').replace('#include <begin_vertex>','#include <begin_vertex>\nfluidPosition=position;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 fluidPosition;uniform float time;uniform sampler2D depthMap;\n'+moldGLSL);
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
vec2 tileUV=fluidPosition.xz/8.;
vec3 molded=moldPattern(tileUV);
vec2 tileID=floor(tileUV);
float pulse=.5+.5*sin(tileID.x*.73+tileID.y*.51-time*.65);
vec2 depthUV=fluidPosition.xz/8000.+.5;
float validDepth=step(0.,depthUV.x)*step(depthUV.x,1.)*step(0.,depthUV.y)*step(depthUV.y,1.);
float bed=texture2D(depthMap,clamp(depthUV,0.,1.)).r*512.-128.;
float shallow=(1.-smoothstep(0.,12.,max(0.,-bed)))*validDepth;
float relief=molded.y*.12-molded.x*.045;
${lava?`diffuseColor.rgb=mix(vec3(.075,.022,.016),diffuseColor.rgb,.16+pulse*.12);diffuseColor.rgb*=1.-molded.x*.25;`:`diffuseColor.rgb*=.82+pulse*.12+molded.y*.07;diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*1.3+vec3(.035,.065,.055),shallow*.5);diffuseColor.rgb*=1.-molded.x*.3;`}
`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\nnormal=moldNormal(-vViewPosition,normal,relief);');
  shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
${lava?'totalEmissiveRadiance*=.12+pulse*.12+molded.x*(1.4+pulse*.5);':'totalEmissiveRadiance*=.8+pulse*.2;'}
`);
 };
 material.customProgramCacheKey=()=>`brick-fluid-v1-${lava}-${toxic}`;return material;
}
