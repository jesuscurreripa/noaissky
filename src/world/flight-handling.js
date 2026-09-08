import * as THREE from 'three';
export function flightSpeedStep(speed,throttle,{boost=false,brake=false,surface=false,dt}={}){
  const target=brake?0:boost?(surface?900:1600):throttle;
  const rate=brake?8:target<speed?5:2.8;
  const next=THREE.MathUtils.damp(speed,target,rate,dt);
  return next<.2&&target===0?0:next;
}
export function stoppingDistance(speed,onSurface=true){return Math.max(0,speed)*(onSurface?.3:.36)/8;}

// Sample the complete hull footprint, not just two adjacent height samples.
export function inspectLandingSite(height,x,z,{obstacles=[],hazardAt=()=>null}={}){
  const center=height(x,z),samples=[center];
  for(let i=0;i<12;i++){const a=i*Math.PI/6;samples.push(height(x+Math.cos(a)*9,z+Math.sin(a)*9));}
  const low=Math.min(...samples),high=Math.max(...samples);
  const blocked=obstacles.some(o=>Math.hypot(x-o.x,z-o.z)<o.radius+10);
  const safe=samples.every(Number.isFinite)&&low>3&&high-low<2.2&&!blocked&&!hazardAt(x,z);
  return {safe,x,z,y:high+1.48,slope:high-low,reason:low<=3?'water':blocked?'obstacle':hazardAt(x,z)?'hazard':'slope'};
}
export function findLandingSite(origin,height,options={}){
  let best=null,bestScore=Infinity;
  for(let i=0;i<160;i++){
    const angle=i*2.399963,range=Math.sqrt(i)*22,x=origin.x+Math.cos(angle)*range,z=origin.z+Math.sin(angle)*range;
    const site=inspectLandingSite(height,x,z,options),score=range+site.slope*18;
    if(site.safe&&score<bestScore){best=site;bestScore=score;}
    if(best&&range>bestScore)break;
  }
  return best;
}
const ease=t=>t*t*(3-2*t);
export function createLandingPath(start,end,height,obstacles=[]){
  let cruise=Math.max(start.y,end.y+20);
  const distance=Math.hypot(end.x-start.x,end.z-start.z),steps=Math.max(1,Math.ceil(distance/6));
  for(let i=0;i<=steps;i++){const t=i/steps;cruise=Math.max(cruise,height(start.x+(end.x-start.x)*t,start.z+(end.z-start.z)*t)+18);}
  const dx=end.x-start.x,dz=end.z-start.z,lengthSq=dx*dx+dz*dz;
  for(const obstacle of obstacles){const t=lengthSq?THREE.MathUtils.clamp(((obstacle.x-start.x)*dx+(obstacle.z-start.z)*dz)/lengthSq,0,1):0;if(Math.hypot(obstacle.x-start.x-dx*t,obstacle.z-start.z-dz*t)<obstacle.radius+10&&Number.isFinite(obstacle.top))cruise=Math.max(cruise,obstacle.top+15);}
  return {start:start.clone(),end:end.clone(),cruise,duration:THREE.MathUtils.clamp(distance/45+Math.abs(cruise-start.y)/60+Math.abs(cruise-end.y)/45,4,18)};
}
export function landingPathPoint(path,t,target=new THREE.Vector3()){
  t=THREE.MathUtils.clamp(t,0,1);
  if(t<.2)return target.copy(path.start).setY(THREE.MathUtils.lerp(path.start.y,path.cruise,ease(t/.2)));
  if(t<.72){target.lerpVectors(path.start,path.end,ease((t-.2)/.52));target.y=path.cruise;return target;}
  return target.copy(path.end).setY(THREE.MathUtils.lerp(path.cruise,path.end.y,ease((t-.72)/.28)));
}
