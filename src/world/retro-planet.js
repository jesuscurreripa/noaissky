import {moldGLSL} from './molded-material.js';
import * as THREE from 'three';
import {noiseGLSL} from './procedural.js';

// Constructed globes: biome colors under a filtered molded panel finish.
export function retroPlanetMaterial(data){
 const types=['verdant','arid','volcanic','toxic','oceanic','crystalline','glacial','gas','icegiant'];
 return new THREE.ShaderMaterial({uniforms:{land:{value:new THREE.Color(data.land)},sea:{value:new THREE.Color(data.ocean)},accent:{value:new THREE.Color(data.vegetation)},ink:{value:new THREE.Color(data.ink)},paper:{value:new THREE.Color(data.horizon)},sunDirection:{value:new THREE.Vector3(...data.position).normalize().negate()},seed:{value:data.seed*.001},kind:{value:types.indexOf(data.key)}},vertexShader:`varying vec3 p;varying vec3 n;varying vec3 view;void main(){p=normalize(position);vec4 world=modelMatrix*vec4(position,1.);n=normalize(mat3(modelMatrix)*normal);view=normalize(cameraPosition-world.xyz);gl_Position=projectionMatrix*viewMatrix*world;}`,fragmentShader:`varying vec3 p;varying vec3 n;varying vec3 view;uniform vec3 land,sea,accent,ink,paper,sunDirection;uniform float seed,kind;${noiseGLSL}${moldGLSL}
void main(){vec3 d=normalize(p);float continent=fbm(d*3.7+seed);float detail=noise(d*18.+seed);float shoreline=kind==4.?.55:.48;float coast=smoothstep(shoreline-.012,shoreline+.012,continent);vec3 c=mix(sea,land,coast);
float terrace=smoothstep(.52,.54,continent)+smoothstep(.61,.63,continent);c=mix(c,paper,terrace*.13*coast);
if(kind==0.){c=mix(c,accent,smoothstep(.48,.57,noise(d*12.+seed))*coast*.58);}
if(kind==1.){float dunes=.5+.5*sin(d.y*52.+continent*15.);c=mix(land,accent,dunes*.12);c=mix(c,ink,smoothstep(.52,.58,noise(d*9.+seed))*.32);}
if(kind==2.){float fissure=1.-smoothstep(.018,.04,abs(continent-.48));c=mix(land,ink,smoothstep(.4,.65,detail));c+=sea*fissure*2.1;}
if(kind==3.){float folds=.5+.5*sin(d.y*29.+continent*30.);c=mix(land,sea,smoothstep(.38,.55,folds));c=mix(c,paper,smoothstep(.76,.9,folds)*.55);}
if(kind==5.){float facets=noise(floor(d*24.)+seed);c=mix(ink,land,smoothstep(.22,.72,facets));float veins=1.-smoothstep(.015,.034,abs(continent-.5));c=mix(c,accent,veins*.8);}
if(kind==6.){float fractures=1.-smoothstep(.014,.03,abs(continent-.47));c=mix(land,sea,fractures*.75);c=mix(c,paper,smoothstep(.45,.8,abs(d.y))*.55);}
if(kind>6.5){float bends=noise(d*7.+seed);float band=.5+.5*sin(d.y*(kind==7.?35.:22.)+bends*7.);c=mix(sea,land,smoothstep(.2,.35,band));c=mix(c,paper,smoothstep(.7,.76,band)*.7);float storm=length((d.xy-vec2(.34,-.25))*vec2(5.,12.));c=mix(c,accent,(1.-smoothstep(.6,1.,storm))*.85);}
if(kind==0.||kind==4.){float cloud=noise(d*10.+vec3(seed,seed+20.,seed));float ribbons=smoothstep(.58,.64,cloud);c=mix(c,paper,ribbons*.73);}
vec3 moldAxis=pow(abs(d),vec3(8.));moldAxis/=max(dot(moldAxis,vec3(1.)),.0001);
vec3 mold=moldPattern(d.yz*24.)*moldAxis.x+moldPattern(d.xz*24.)*moldAxis.y+moldPattern(d.xy*24.)*moldAxis.z;
c*=1.-mold.x*.3+mold.y*.065;
float light=dot(normalize(n),sunDirection);float shade=.15+.47*smoothstep(-.035,.04,light)+.46*smoothstep(.38,.55,light);c*=shade;c+=ink*(1.-smoothstep(-.1,.5,light))*.18;
vec3 halfLight=normalize(normalize(view)+sunDirection);float gloss=pow(max(dot(normalize(n),halfLight),0.),70.);c+=vec3(.22,.24,.25)*gloss;
float edge=pow(1.-abs(dot(normalize(n),normalize(view))),4.);c=mix(c,paper,edge*smoothstep(-.05,.25,light)*.45);gl_FragColor=vec4(c,1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`});
}
