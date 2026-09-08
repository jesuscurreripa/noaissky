import * as THREE from 'three';
import {STAR,noiseGLSL,rng} from './procedural.js';
export function createStar(){
 const group=new THREE.Group(),random=rng(771),uniforms={time:{value:0}};
 const material=new THREE.ShaderMaterial({uniforms,vertexShader:`varying vec3 p;varying vec3 n;varying vec3 v;void main(){p=position;n=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);v=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}`,fragmentShader:`varying vec3 p;varying vec3 n;varying vec3 v;uniform float time;${noiseGLSL}void main(){vec3 d=normalize(p);float granules=fbm(d*48.+vec3(time*.045,0.,time*.017));float cells=fbm(d*10.+time*.025);float spots=smoothstep(.61,.74,cells);float limb=.45+.55*pow(max(dot(n,v),0.),.4);vec3 c=mix(vec3(1.,.13,.008),vec3(1.8,1.15,.32),granules)*2.8;c*=limb*(1.-spots*.83);gl_FragColor=vec4(c,1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`});
 group.add(new THREE.Mesh(new THREE.SphereGeometry(STAR.radius,96,64),material));
 const corona=new THREE.Mesh(new THREE.SphereGeometry(STAR.radius*1.32,64,48),new THREE.ShaderMaterial({uniforms,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexShader:`varying vec3 n;varying vec3 v;varying vec3 p;void main(){p=position;n=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);v=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}`,fragmentShader:`varying vec3 n;varying vec3 v;varying vec3 p;uniform float time;${noiseGLSL}void main(){float rim=pow(1.-abs(dot(n,v)),2.);float threads=fbm(normalize(p)*23.+time*.06);gl_FragColor=vec4(1.,.28,.035,rim*(.1+threads*.5));}`}));group.add(corona);
 const flares=[];
 for(let i=0;i<22;i++){const root=new THREE.Group(),angle=random()*Math.PI*2,axis=new THREE.Vector3(Math.cos(angle)*Math.sqrt(1-Math.pow((i/22)*2-1,2)),(i/22)*2-1,Math.sin(angle)*Math.sqrt(1-Math.pow((i/22)*2-1,2)));root.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),axis);const points=[],height=90+random()*190,width=65+random()*140;for(let j=0;j<=40;j++){const t=j/40;points.push(new THREE.Vector3(Math.cos(t*Math.PI)*width,Math.sqrt(STAR.radius**2-width**2)+Math.sin(t*Math.PI)*height,Math.sin(t*Math.PI*2)*20));}const geometry=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),48,5+random()*8,6,false),mat=new THREE.MeshBasicMaterial({color:0xff811d,transparent:true,opacity:.8,blending:THREE.AdditiveBlending,depthWrite:false});root.add(new THREE.Mesh(geometry,mat));group.add(root);flares.push({root,mat,phase:random()*6.28});}
 return {group,update(time){uniforms.time.value=time;group.rotation.y=time*.006;for(const f of flares){const pulse=.5+.5*Math.sin(time*.6+f.phase);f.root.scale.setScalar(1+pulse*.06);f.mat.opacity=.4+pulse*.55;}}};
}
// Radial interpolation around the star keeps a safe arc even for opposite endpoints.
export function solarRoute(start,end){
 const straight=new THREE.LineCurve3(start.clone(),end.clone());
 if(straight.getPoints(200).every(p=>p.length()>=STAR.heatRadius))return straight;
 const a=start.clone().normalize(),b=end.clone().normalize(),angle=Math.acos(THREE.MathUtils.clamp(a.dot(b),-1,1));
 let axis=new THREE.Vector3().crossVectors(a,b);if(axis.lengthSq()<1e-10){axis.crossVectors(a,new THREE.Vector3(0,1,0));if(axis.lengthSq()<1e-10)axis.crossVectors(a,new THREE.Vector3(1,0,0));}axis.normalize();
 const curve=new THREE.Curve();curve.getPoint=(t,target=new THREE.Vector3())=>{if(t===0)return target.copy(start);if(t===1)return target.copy(end);return target.copy(a).applyAxisAngle(axis,angle*t).multiplyScalar(THREE.MathUtils.lerp(start.length(),end.length(),t));};return curve;
}
