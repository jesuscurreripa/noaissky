import {ART_PALETTES} from './art-direction.js';
// All world generation is repeatable: a seed always produces the same universe.
export function hashSeed(text) {
  let h = 2166136261;
  for (const char of String(text)) { h ^= char.charCodeAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
export function rng(seed) {
  let state = seed >>> 0;
  return () => { state += 0x6D2B79F5; let t = state; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
const smooth = t => t*t*(3-2*t);
export function noise2(x, y, seed=0) {
  const ix=Math.floor(x), iy=Math.floor(y), fx=smooth(x-ix), fy=smooth(y-iy);
  const hash=(a,b)=>{let n=Math.imul(a,374761393)+Math.imul(b,668265263)+Math.imul(seed,144269);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;};
  const a=hash(ix,iy), b=hash(ix+1,iy), c=hash(ix,iy+1), d=hash(ix+1,iy+1);
  return (a+(b-a)*fx)*(1-fy)+(c+(d-c)*fx)*fy;
}
export function fbm(x,y,seed,octaves=5){let n=0,a=.5;for(let i=0;i<octaves;i++){n+=noise2(x,y,seed+i*17)*a;x=x*2.03+7.7;y=y*2.03+3.1;a*=.5;}return n;}
const BIOMES = [
  {key:'verdant',type:'MUNDO EXUBERANTE',prefix:['Ely','Aure','Sola','Aste'],suffix:['sium','lia','ra','lys'],land:'#ba805f',vegetation:'#c23559',grass:'#b25c68',ocean:'#16858b',sky:'#278fa8',horizon:'#dbb49d',sun:'#fff2ce',temperature:'24°C',atmosphere:'Respirable',life:'Abundante',resource:'Cobre',tree:'mushroom'},
  {key:'glacial',type:'MUNDO GLACIAL',prefix:['Nive','Bore','Cry','Vela'],suffix:['ris','alis','on','ra'],land:'#bfdde1',vegetation:'#7877bc',grass:'#9aaec9',ocean:'#2b7499',sky:'#4d79b1',horizon:'#c6c0dc',sun:'#e6eaff',temperature:'−42°C',atmosphere:'Cristalina',life:'Resiliente',resource:'Cristal de escarcha',tree:'crystal'},
  {key:'arid',type:'MUNDO ÁRIDO',prefix:['Osi','Ig','Ar','Khe'],suffix:['ris','nara','akis','pra'],land:'#b96647',vegetation:'#63816c',grass:'#b29963',ocean:'#397d73',sky:'#92768c',horizon:'#e1a17e',sun:'#ffe0a7',temperature:'61°C',atmosphere:'Polvorienta',life:'Escasa',resource:'Ferrita',tree:'cactus'},
];
const variant=(base,fields)=>({...BIOMES[base],...fields});
const WORLDS=[
 variant(2,{key:'volcanic',type:'MUNDO VOLCÁNICO',land:'#29242c',grass:'#443235',ocean:'#ff400b',sky:'#362431',horizon:'#d5713e',vegetation:'#672e25',temperature:'410°C',life:'Nula',atmosphere:'Ceniza',resource:'Obsidiana',tree:'none',fluid:'lava'}),
 variant(2,{key:'toxic',type:'MUNDO TÓXICO',land:'#817b38',grass:'#8eaa32',ocean:'#5b9a25',sky:'#5c703c',horizon:'#d4cf78',vegetation:'#c7c44b',temperature:'176°C',life:'Microbiana',atmosphere:'Corrosiva',resource:'Azufre',tree:'none'}),
 BIOMES[2],BIOMES[0],
 variant(0,{key:'oceanic',type:'MUNDO OCEÁNICO',land:'#cab899',grass:'#5aab90',ocean:'#075e9c',sky:'#347cb1',horizon:'#9fd5da',vegetation:'#52baa8',temperature:'12°C',resource:'Perla abisal'}),
 variant(2,{key:'gas',type:'GIGANTE GASEOSO',land:'#d6ac79',ocean:'#a16649',vegetation:'#eee0b9',sky:'#d9ba95',temperature:'−105°C',life:'Nula',atmosphere:'Hidrógeno / helio',landable:false,tree:'none'}),
 variant(1,{key:'crystalline',type:'MUNDO CRISTALINO',land:'#55466f',grass:'#8c6aa0',vegetation:'#70f2ed',ocean:'#394b77',sky:'#484077',horizon:'#bd9cc9',temperature:'−128°C',life:'Nula',resource:'Cuarzo resonante'}),
 variant(1,{key:'icegiant',type:'GIGANTE DE HIELO',land:'#6bbfc9',ocean:'#28649c',vegetation:'#b5e7e5',temperature:'−190°C',life:'Nula',atmosphere:'Hidrógeno / metano',landable:false,tree:'none'}),
 {...BIOMES[1],temperature:'−218°C',life:'Nula'}
];
export const STAR={radius:650,exclusionRadius:1150,heatRadius:2900,beltInner:12800,beltOuter:13800};
export function solarExposure(distance){return Math.max(0,Math.min(1,(STAR.heatRadius-distance)/(STAR.heatRadius-STAR.exclusionRadius)));}
export function createSystem(seedText) {
  const seed=hashSeed(seedText), random=rng(seed),names=new Set();
  return Array.from({length:9},(_,i)=>{
    const biome=WORLDS[i];
    let name=biome.prefix[Math.floor(random()*biome.prefix.length)]+biome.suffix[Math.floor(random()*biome.suffix.length)];
    if(names.has(name))name+=` ${i+1}`;names.add(name);
    const angle=i*2.399+random()*.3, distance=[3600,5500,7500,9500,11500,16000,19700,23600,27700][i],inclination=(random()-.5)*.035;
    return {landable:true,...biome,...ART_PALETTES[biome.key],orbitRadius:distance,inclination,orbitalPeriod:1800*Math.pow(distance/3600,1.5),id:i,seed:Math.floor(random()*1000000),name,radius:(biome.landable===false?430:180)+random()*65,position:[Math.sin(angle)*distance,Math.cos(angle)*distance*Math.sin(inclination),-Math.cos(angle)*distance*Math.cos(inclination)],moons:i<2?0:1+Math.floor(random()*3),code:`${(seed%900+100)}.${i+1}`,discovered:false};
  });
}
export function terrainHeight(x,z,planet) {
  const seed=planet.seed;
  const low=(fbm(x*.0015,z*.0015,seed)-.43)*135;
  const hills=(fbm(x*.006,z*.006,seed+90,4)-.45)*24;
  const mountain=Math.pow(Math.max(0,noise2(x*.0012+50,z*.0012-30,seed+8)-.43)*2.1,2.3)*440;
  const distance=Math.hypot(x,z), mountainFade=smooth(Math.min(1,Math.max(0,(distance-230)/600)));
  let h=low+hills+mountain*mountainFade;
  if(planet.key==='glacial')h+=Math.abs(fbm(x*.003,z*.003,seed+72)-.5)*60;
  if(planet.key==='arid')h=Math.round(h/5)*2.5+h*.5;
  if(planet.key==='volcanic'){const r=Math.hypot(x-580,z+400);h+=260*Math.exp(-Math.pow((r-230)/125,2))-130*Math.exp(-Math.pow(r/110,2));}
  if(planet.key==='oceanic')h=h*.65-25;
  if(planet.key==='crystalline')h+=Math.pow(Math.abs(Math.sin(x*.005)*Math.cos(z*.005)),8)*130;
  // Every generated world includes one clear, dry arrival site.
  const arrival=smooth(Math.min(1,distance/110));
  return 23*(1-arrival)+h*arrival;
}
export const noiseGLSL = `
float hash(vec3 p){p=fract(p*.3183099+vec3(.1,.2,.3));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float noise(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p=p*2.03+3.1;a*=.5;}return v;}`;
