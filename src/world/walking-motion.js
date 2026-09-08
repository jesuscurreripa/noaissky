// Feet follow continuous slopes; only jumps and ledges enter ballistic motion.
export function createWalkingMotion(){
 let vx=0,vz=0,vy=0,grounded=true,jumpBuffer=0;
 const eyeHeight=1.8,gravity=24,jumpSpeed=9;
 return {
  get grounded(){return grounded;},
  get speed(){return Math.hypot(vx,vz);},
  reset(position,height){vx=vz=vy=jumpBuffer=0;grounded=true;position.y=Math.max(.1,height(position.x,position.z))+eyeHeight;},
  requestJump(){jumpBuffer=.15;},
  clearInput(){jumpBuffer=0;},
  update(position,move,maxSpeed,dt,height,radius=Infinity){
   const steps=Math.max(1,Math.ceil(dt*120)),step=dt/steps;
   for(let i=0;i<steps;i++){
    const blend=1-Math.exp(-14*step);
    vx+=(move.x*maxSpeed-vx)*blend;vz+=(move.z*maxSpeed-vz)*blend;
    if(grounded&&jumpBuffer>0){vy=jumpSpeed;grounded=false;jumpBuffer=0;}
    jumpBuffer=Math.max(0,jumpBuffer-step);
    let x=position.x+vx*step,z=position.z+vz*step;
    const distance=Math.hypot(x,z);
    if(distance>radius){x*=radius/distance;z*=radius/distance;}
    const oldFloor=Math.max(.1,height(position.x,position.z))+eyeHeight;
    const floor=Math.max(.1,height(x,z))+eyeHeight;
    // Don't teleport up cliffs. Ordinary hills retain contact in both directions.
    const travel=Math.hypot(x-position.x,z-position.z);
    if(floor-position.y>Math.max(.12,travel*1.5)) {vx=vz=0;x=position.x;z=position.z;}
    const nextFloor=(x===position.x&&z===position.z)?oldFloor:floor;
    position.x=x;position.z=z;
    if(grounded&&oldFloor-nextFloor<=Math.max(.12,travel*1.5))position.y=nextFloor;
    else {
     grounded=false;
     position.y+=vy*step-.5*gravity*step*step;vy-=gravity*step;
     if(position.y<=nextFloor){position.y=nextFloor;vy=0;grounded=true;}
    }
   }
  }
 };
}
