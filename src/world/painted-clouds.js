import * as THREE from 'three';
import {rng} from './procedural.js';

// A single instanced billboard draw: opaque painted lobes with a soft outer edge.
export function createPaintedClouds(planet){
 const random=rng(planet.seed+917),canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;
 const ctx=canvas.getContext('2d');
 ctx.shadowColor='#fff4db';ctx.shadowBlur=3;
 for(let layer=0;layer<3;layer++){
  ctx.fillStyle=['#b5a6bd','#e7d3c9','#fff0d5'][layer];
  for(let i=0;i<13;i++){const x=70+i*29,y=145-layer*19+Math.sin(i*2.2)*13,r=28+random()*26;ctx.beginPath();ctx.ellipse(x,y,r*1.2,r*.72,0,0,Math.PI*2);ctx.fill();}
 }
 const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;
 const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{map:{value:map},time:{value:0},haze:{value:new THREE.Color(planet.horizon)}},vertexShader:`uniform float time;varying vec2 cloudUV;varying float cloudDistance;void main(){cloudUV=uv;vec4 center=instanceMatrix*vec4(0.,0.,0.,1.);center.x+=sin(time*.009+center.z*.003)*50.;vec4 mv=modelViewMatrix*center;mv.xy+=position.xy*vec2(length(instanceMatrix[0].xyz),length(instanceMatrix[1].xyz));cloudDistance=-mv.z;gl_Position=projectionMatrix*mv;}`,fragmentShader:`uniform sampler2D map;uniform vec3 haze;varying vec2 cloudUV;varying float cloudDistance;void main(){vec4 c=texture2D(map,cloudUV);if(c.a<.035)discard;vec3 paint=c.rgb;paint=mix(paint,haze,smoothstep(500.,6500.,cloudDistance)*.6);gl_FragColor=vec4(paint,c.a*.82);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`});
 const mesh=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),material,54),dummy=new THREE.Object3D();
 for(let i=0;i<54;i++){const approach=i<14;dummy.position.set(approach?(random()-.5)*850:(random()-.5)*8500,approach?430+random()*300:700+random()*650,approach?300+random()*1100:(random()-.5)*8500);const width=approach?320+random()*300:500+random()*800;dummy.scale.set(width,width*.48,1);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);}
 mesh.frustumCulled=false;mesh.renderOrder=2;
 return {mesh,update(time){material.uniforms.time.value=time;}};
}
