import * as THREE from 'three';
export function createLandingEffects(planet,height){
  const group=new THREE.Group(),guide=new THREE.Group();group.add(guide);
  const ringMaterial=new THREE.MeshBasicMaterial({color:'#bceba7',transparent:true,opacity:.8,depthWrite:false,side:THREE.DoubleSide});
  const ring=new THREE.Mesh(new THREE.RingGeometry(8,8.5,48),ringMaterial);ring.rotation.x=-Math.PI/2;guide.add(ring);
  const crossGeometry=new THREE.BoxGeometry(3,.08,.25);
  for(let i=0;i<4;i++){const cross=new THREE.Mesh(crossGeometry,ringMaterial);cross.position.set(Math.cos(i*Math.PI/2)*11,0,Math.sin(i*Math.PI/2)*11);cross.rotation.y=i*Math.PI/2;guide.add(cross);}
  guide.visible=false;
  const count=128,slots=Array.from({length:count},()=>({position:new THREE.Vector3(),velocity:new THREE.Vector3(),life:0})),positions=new Float32Array(count*3),life=new Float32Array(count);
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setAttribute('life',new THREE.BufferAttribute(life,1));
  const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{tint:{value:new THREE.Color(planet.key==='glacial'?'#dce8ef':planet.land)}},vertexShader:'attribute float life;varying float alpha;void main(){alpha=life;vec4 p=modelViewMatrix*vec4(position,1.);gl_PointSize=clamp(500.*life/max(1.,-p.z),1.,36.);gl_Position=projectionMatrix*p;}',fragmentShader:'uniform vec3 tint;varying float alpha;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;gl_FragColor=vec4(tint,alpha*.32*(1.-smoothstep(.12,.5,d)));\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}'});
  const dust=new THREE.Points(geometry,material);dust.frustumCulled=false;group.add(dust);let cursor=0,credit=0;
  return {group,setGuide(site,visible){guide.visible=!!site&&visible;if(site)guide.position.set(site.x,site.y-1.28,site.z);},update(dt,shipPosition,active,speed=0){
    const ground=height(shipPosition.x,shipPosition.z),altitude=shipPosition.y-ground;
    const strength=active&&ground>0?Math.max(0,1-altitude/38):0;
    credit+=dt*70*strength;
    while(credit>=1){credit--;const p=slots[cursor++%count],a=Math.random()*Math.PI*2,r=3+Math.random()*6;p.position.set(shipPosition.x+Math.cos(a)*r,ground+.4,shipPosition.z+Math.sin(a)*r);p.velocity.set(Math.cos(a)*(5+speed*.015),1+Math.random()*3,Math.sin(a)*(5+speed*.015));p.life=1;}
    let activeCount=0;
    for(let i=0;i<count;i++){const p=slots[i];p.life=Math.max(0,p.life-dt*.7);if(p.life>0){activeCount++;p.position.addScaledVector(p.velocity,dt);}positions[i*3]=p.position.x;positions[i*3+1]=p.position.y;positions[i*3+2]=p.position.z;life[i]=p.life;}
    dust.visible=activeCount>0;geometry.attributes.position.needsUpdate=true;geometry.attributes.life.needsUpdate=true;
  }};
}
