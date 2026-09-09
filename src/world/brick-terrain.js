import * as THREE from 'three';

// World-anchored joints remain stable when the CPU quadtree changes LOD.
export function createBrickTerrainMaterial(){
 const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.42,metalness:0,flatShading:true});material.userData.toyPlastic=true;
 material.onBeforeCompile=shader=>{
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nattribute vec3 terrainPosition;varying vec3 brickPosition;').replace('#include <begin_vertex>','#include <begin_vertex>\nbrickPosition=terrainPosition;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
varying vec3 brickPosition;
float brickJoint(vec2 p){
 vec2 footprint=max(fwidth(p),vec2(.0001));
 vec2 edge=min(fract(p),1.-fract(p));
 vec2 line=1.-smoothstep(vec2(.012),vec2(.012)+footprint*1.4,edge);
 return max(line.x,line.y)*(1.-smoothstep(.12,.6,max(footprint.x,footprint.y)));
}`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
vec3 brickNormal=abs(normalize(cross(dFdx(brickPosition),dFdy(brickPosition))));
vec2 brickUV=brickPosition.xz/8.;
if(brickNormal.y<.65){brickUV=vec2(brickNormal.x>brickNormal.z?brickPosition.z:brickPosition.x,brickPosition.y*4.)/8.;brickUV.x+=mod(floor(brickUV.y),2.)*.5;}
float joint=brickJoint(brickUV);
vec2 brickID=floor(brickUV);
float tint=fract(sin(dot(brickID,vec2(12.9898,78.233)))*43758.5453);
float detail=1.-smoothstep(.12,.6,max(fwidth(brickUV.x),fwidth(brickUV.y)));
diffuseColor.rgb*=mix(1.,.94+tint*.12,detail)*(1.-joint*.32);
`);
 };
 material.customProgramCacheKey=()=> 'construction-terrain-v1';return material;
}

// Shallow molded studs are visual trim, not metre-high collision steps.
// Appended into the existing chunk buffer: no object/draw call for each stud.
export function appendTerrainStuds({node,segments,height,positions,colors,coordinates,indices,colorAt}){
 if(node.size!==128)return;
 const step=node.size/segments;
 const vertex=(x,z,y,c)=>{const i=positions.length/3;positions.push(x,y,z);coordinates.push(node.x+x,y,node.z+z);colors.push(c.r,c.g,c.b);return i;};
 // Beveled slope plates follow the same two triangles as the base terrain.
 for(let z=0;z<segments;z++)for(let x=0;x<segments;x++){
  const px=x*step-node.size/2,pz=z*step-node.size/2;
  const h00=height(node.x+px,node.z+pz),h10=height(node.x+px+step,node.z+pz),h01=height(node.x+px,node.z+pz+step),h11=height(node.x+px+step,node.z+pz+step);
  const sample=(u,v)=>u+v<=1?h00+(h10-h00)*u+(h01-h00)*v:h11+(h01-h11)*(1-u)+(h10-h11)*(1-v);
  if(Math.min(h00,h10,h01,h11)<.5)continue;
  const c=colorAt(node.x+px+step/2,node.z+pz+step/2,sample(.5,.5)),corners=[[0,0],[0,1],[1,1],[1,0]],outer=[],inner=[],inset=.08/step;
  for(const [u,v] of corners){outer.push(vertex(px+u*step,pz+v*step,sample(u,v)+.002,c));const a=u?1-inset:inset,b=v?1-inset:inset;inner.push(vertex(px+a*step,pz+b*step,sample(a,b)+.045,c));}
  indices.push(inner[0],inner[1],inner[3],inner[3],inner[1],inner[2]);
  for(let i=0;i<4;i++){const j=(i+1)%4;indices.push(outer[i],outer[j],inner[i],outer[j],inner[j],inner[i]);}
 }
 for(let z=0;z<segments;z++)for(let x=0;x<segments;x++)for(const ox of [.25,.75])for(const oz of [.25,.75]){
  const px=(x+ox)*step-node.size/2,pz=(z+oz)*step-node.size/2,wx=node.x+px,wz=node.z+pz,h=height(wx,wz);
  if(h<.5||Math.abs(height(wx+1,wz)-height(wx-1,wz))>.35||Math.abs(height(wx,wz+1)-height(wx,wz-1))>.35)continue;
  const c=colorAt(wx,wz,h),center=vertex(px,pz,h+.1,c),ring=[];
  for(let i=0;i<8;i++){
   const angle=i*Math.PI/4,dx=Math.cos(angle)*.6,dz=Math.sin(angle)*.6,y=height(wx+dx,wz+dz);
   ring.push([vertex(px+dx,pz+dz,y+.1,c),vertex(px+dx,pz+dz,y,c)]);
  }
  for(let i=0;i<8;i++){const a=ring[i],b=ring[(i+1)%8];indices.push(center,b[0],a[0],a[0],b[0],a[1],b[0],b[1],a[1]);}
 }
}
