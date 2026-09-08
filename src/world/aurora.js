import * as THREE from 'three';
export function createAurora(planet){
 const group=new THREE.Group();if(!['glacial','crystalline'].includes(planet.key))return {group,update(){}};
 const positions=[],uvs=[],indices=[],segments=72;
 for(let i=0;i<=segments;i++){const u=i/segments,angle=(u-.5)*2.3,r=3300;for(let j=0;j<2;j++){positions.push(Math.sin(angle)*r,1100+j*700,-Math.cos(angle)*r);uvs.push(u,j);}if(i<segments){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);
 const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,uniforms:{time:{value:0},tint:{value:new THREE.Color(planet.vegetation)}},vertexShader:`uniform float time;varying vec2 vUV;void main(){vUV=uv;vec3 p=position;p.y+=sin(uv.x*15.+time*.16)*140.;p.z+=sin(uv.x*22.-time*.12)*110.;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,fragmentShader:`uniform float time;uniform vec3 tint;varying vec2 vUV;void main(){float folds=.5+.5*sin(vUV.x*95.+sin(vUV.x*15.+time*.15)*3.);float curtain=smoothstep(0.,.16,vUV.y)*(1.-smoothstep(.25,1.,vUV.y));float ends=smoothstep(0.,.12,vUV.x)*(1.-smoothstep(.85,1.,vUV.x));vec3 c=mix(vec3(.12,.65,.54),tint,vUV.y);gl_FragColor=vec4(c,curtain*ends*(.11+folds*.14));
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`});const mesh=new THREE.Mesh(geometry,material);mesh.frustumCulled=false;group.add(mesh);return {group,update(time){material.uniforms.time.value=time;}};
}
