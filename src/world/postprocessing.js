import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export function createPostProcessing(renderer,scene,camera){
  const pmrem=new THREE.PMREMGenerator(renderer),studio=new RoomEnvironment();
  const environment=pmrem.fromScene(studio,.04);scene.environment=environment.texture;scene.environmentIntensity=.28;studio.dispose();pmrem.dispose();
  const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));
  const bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),.22,.55,1.2);composer.addPass(bloom);composer.addPass(new OutputPass());
  const grade=new ShaderPass({uniforms:{tDiffuse:{value:null},time:{value:0},surface:{value:0},resolution:{value:new THREE.Vector2(innerWidth,innerHeight)}},vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`uniform sampler2D tDiffuse;uniform float time;uniform float surface;uniform vec2 resolution;varying vec2 vUv;
float random(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
void main(){vec3 c=texture2D(tDiffuse,vUv).rgb;float l=dot(c,vec3(.2126,.7152,.0722));
// Restrained split toning: cool ink shadows and warm paper highlights.
vec3 shadow=vec3(.026,.018,.041)*(1.-smoothstep(.0,.45,l));vec3 warm=vec3(.019,.009,-.011)*smoothstep(.45,.95,l);
c+=shadow+warm*surface;c=mix(vec3(l),c,1.08);c=(c-.5)*1.025+.5;
float vignette=smoothstep(.85,.2,length((vUv-.5)*vec2(1.,.85)));c*=.94+vignette*.06;
float grain=(random(floor(vUv*resolution))-.5)*.004;c+=grain;gl_FragColor=vec4(clamp(c,0.,1.),1.);}`});composer.addPass(grade);
  const cloudVeil=new ShaderPass({uniforms:{tDiffuse:{value:null},time:{value:0},amount:{value:0},tint:{value:new THREE.Color(.88,.91,.94)}},vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`uniform sampler2D tDiffuse;uniform float time;uniform float amount;uniform vec3 tint;varying vec2 vUv;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
float clouds(vec2 p){float n=0.,a=.5;for(int i=0;i<5;i++){n+=noise(p)*a;p=p*2.04+4.7;a*=.5;}return n;}
void main(){vec2 uv=vUv-.5;float a=clouds(uv*(3.8+sin(time*.4)*.5)+vec2(time*.23,-time*.17));float b=clouds(uv*7.3+vec2(-time*.31,time*.12)+18.);float density=smoothstep(.15,.78,a*.65+b*.35);float alpha=amount*(.64+density*.36);alpha=mix(alpha,1.,smoothstep(.82,1.,amount));vec3 color=mix(tint*.67,vec3(.96,.98,1.),density);vec3 scene=texture2D(tDiffuse,vUv).rgb;gl_FragColor=vec4(mix(scene,color,alpha),1.);}`});composer.addPass(cloudVeil);
  return {setAtmosphere(amount,color){cloudVeil.uniforms.amount.value=THREE.MathUtils.clamp(amount,0,1);cloudVeil.uniforms.tint.value.set(color).convertLinearToSRGB();cloudVeil.enabled=amount>.001;},render(time,onSurface){cloudVeil.uniforms.time.value=time;grade.uniforms.time.value=time;grade.uniforms.surface.value=onSurface?1:0;bloom.strength=onSurface?.13:.24;composer.render();},resize(){composer.setPixelRatio(renderer.getPixelRatio());composer.setSize(innerWidth,innerHeight);grade.uniforms.resolution.value.set(innerWidth,innerHeight);}};
}
