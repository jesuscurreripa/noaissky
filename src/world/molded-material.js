// Analytic molded relief: stable object-space pattern, filtered at pixel scale.
// Surface-gradient bump follows Three.js r180's bump mapping approach.
export const moldGLSL=`
vec3 moldPattern(vec2 uv){
 vec2 fw=max(fwidth(uv),vec2(.0001));
 float fade=1.-smoothstep(.12,.55,max(fw.x,fw.y));
 vec2 edge=min(fract(uv),1.-fract(uv));
 float joint=(1.-smoothstep(.015,.015+max(fw.x,fw.y)*1.5,min(edge.x,edge.y)))*fade;
 float radial=length(fract(uv*2.)-.5);
 float stud=(1.-smoothstep(.27,.32+max(fw.x,fw.y)*2.,radial))*fade;
 return vec3(joint,stud,fade);
}
vec3 moldNormal(vec3 surf,vec3 n,float h){
 vec3 dx=dFdx(surf),dy=dFdy(surf);
 vec3 rx=cross(dy,n),ry=cross(n,dx);
 float det=dot(dx,rx);
 vec3 grad=sign(det)*(dFdx(h)*rx+dFdy(h)*ry);
 return normalize(max(abs(det),1.e-8)*n-grad);
}
`;

export function applyMoldedFinish(material){
 if(!material.isMeshStandardMaterial||material.userData.toyPlastic)return material;
 material.userData.toyPlastic=true;material.metalness=0;material.roughness=.34;
 material.normalScale?.set(.12,.12);
 const previous=material.onBeforeCompile,key=material.customProgramCacheKey();
 material.onBeforeCompile=function(shader,renderer){
  previous.call(this,shader,renderer);
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 moldedPosition;').replace('#include <begin_vertex>','#include <begin_vertex>\nmoldedPosition=position;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 moldedPosition;\n'+moldGLSL);
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
vec3 moldFace=abs(normalize(cross(dFdx(moldedPosition),dFdy(moldedPosition))));
vec3 moldWeights=pow(moldFace,vec3(8.));moldWeights/=max(dot(moldWeights,vec3(1.)),.0001);
vec3 molding=moldPattern(moldedPosition.yz*1.5)*moldWeights.x+moldPattern(moldedPosition.xz*1.5)*moldWeights.y+moldPattern(moldedPosition.xy*1.5)*moldWeights.z;
diffuseColor.rgb*=1.-molding.x*.2+molding.y*.035;
float moldedRelief=(molding.y*.012-molding.x*.006);
`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\nnormal=moldNormal(-vViewPosition,normal,moldedRelief);');
 };
 material.customProgramCacheKey=()=>key+':molded-plastic-v1';material.needsUpdate=true;return material;
}
