import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

// Original construction-toy astronaut. All parts are rigid and pivot at their sockets.
export function createBrickExplorer(index=0){
 const root=new THREE.Group();root.name='Construction astronaut';
 const plastic=color=>{const m=new THREE.MeshStandardMaterial({color,roughness:.32,metalness:0});m.userData.toyPlastic=true;return m;};
 const suit=plastic(index%2?'#ee7845':'#f2ead5'),dark=plastic('#25394d'),gold=plastic('#f4c34f'),blue=plastic('#368ec0'),white=plastic('#fff5dc');
 const box=new RoundedBoxGeometry(1,1,1,1,.075);
 const part=(parent,geometry,material,x,y,z,sx=1,sy=1,sz=1)=>{const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=m.receiveShadow=true;parent.add(m);return m;};
 const body=new THREE.Group();body.name='body';root.add(body);
 part(body,box,suit,0,1.23,0,.83,.73,.48);
 part(body,box,dark,0,.82,0,.76,.17,.44);
 part(body,box,blue,0,1.25,.255,.47,.36,.045);
 for(let i=0;i<3;i++)part(body,box,i===0?gold:white,-.13+i*.13,1.29,.288,.075,.06,.025);
 part(body,box,white,0,1.13,.286,.3,.045,.025);
 part(body,new THREE.CylinderGeometry(.29,.29,.1,16),dark,0,1.63,0);
 part(body,new THREE.CylinderGeometry(.36,.36,.48,20),gold,0,1.91,.02);
 // Helmet shell and opaque smoked visor avoid transparency sorting artifacts.
 part(body,box,suit,0,1.94,-.055,.91,.73,.75);
 part(body,box,dark,0,1.95,.34,.72,.43,.14);
 part(body,box,blue,0,2.04,.419,.49,.035,.014);
 part(body,new THREE.CylinderGeometry(.14,.14,.095,16),suit,0,2.35,-.04);
 part(body,box,blue,0,1.27,-.37,.61,.66,.29);
 for(const side of [-1,1])part(body,new THREE.CylinderGeometry(.115,.115,.59,12),white,side*.23,1.27,-.54);
 const arms=[],legs=[];
 for(const side of [-1,1]){
  const arm=new THREE.Group();arm.name=side<0?'leftArm':'rightArm';arm.position.set(side*.55,1.48,0);body.add(arm);arms.push(arm);
  part(arm,box,suit,0,-.23,0,.28,.51,.32);
  part(arm,new THREE.CylinderGeometry(.135,.135,.12,12),dark,0,-.5,0);
  const claw=part(arm,new THREE.TorusGeometry(.14,.055,6,14,Math.PI*1.55),gold,0,-.65,.03);claw.rotation.z=-Math.PI*.275;
  const leg=new THREE.Group();leg.name=side<0?'leftLeg':'rightLeg';leg.position.set(side*.23,.79,0);body.add(leg);legs.push(leg);
  part(leg,box,suit,0,-.31,0,.36,.6,.4);part(leg,box,dark,0,-.68,.09,.38,.21,.59);
 }
 let state='Idle',time=0;
 const mixer={update(dt){time+=dt;const moving=state==='Walk'||state==='Run',run=state==='Run',swing=moving?Math.sin(time*(run?13:8))*(run?.8:.46):0,blend=1-Math.exp(-18*dt);
  legs.forEach((leg,i)=>leg.rotation.x+=((state==='Jump'?(i===0?-.35:.25):swing*(i?1:-1))-leg.rotation.x)*blend);
  arms.forEach((arm,i)=>{const wave=state==='Wave'&&i===1;arm.rotation.x+=((state==='Jump'?-.8:wave?-.3:swing*(i?-1:1))-arm.rotation.x)*blend;arm.rotation.z+=((wave?-2.3+Math.sin(time*6)*.25:(i?-.08:.08))-arm.rotation.z)*blend;});
  body.position.y+=( (moving?Math.abs(Math.sin(time*(run?13:8)))*.035:0)-body.position.y)*blend;
 },stopAllAction(){state='Idle';},getRoot(){return root;},uncacheRoot(){}};
 return {mesh:root,mixer,play(name){if(['Idle','Walk','Run','Wave','Jump'].includes(name))state=name;},name:index%2?'Rae · Exploradora':'Finn · Explorador'};
}
