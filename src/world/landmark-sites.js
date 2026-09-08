// Stable geographic features, shared by terrain generation, rendering and HUD.
const cache=new WeakMap();
const THEMES={
  volcanic:[['crater','Caldera de Ceniza','Calor extremo'],['canyon','Garganta de Basalto',''],['ruins','Observatorio Calcinado','']],
  toxic:[['crater','Cuenca Sulfurosa','Gas corrosivo'],['ruins','Estación Silenciosa',''],['canyon','Fisura Amarilla','']],
  arid:[['canyon','Cañón de los Ecos',''],['crater','Cráter del Viajero',''],['ruins','Puerta del Desierto','']],
  verdant:[['ruins','Santuario de las Raíces',''],['canyon','Valle de las Brumas',''],['crater','Anillo del Alba','']],
  oceanic:[['crater','Atolón del Horizonte',''],['ruins','Faro de las Mareas',''],['canyon','Canal de las Agujas','']],
  crystalline:[['spires','Corona Resonante',''],['canyon','Fractura Prismática',''],['ruins','Archivo de Cristal','']],
  glacial:[['spires','Catedral de Hielo',''],['crater','Cuenca Boreal',''],['ruins','Refugio del Silencio','']],
};
export function landmarkSites(planet){
  if(cache.has(planet))return cache.get(planet);
  const themes=THEMES[planet.key]||THEMES.arid,phase=(planet.seed%6283)/1000;
  const sites=themes.map(([kind,name,hazard],i)=>{
    const angle=phase+i*2.39996,distance=[780,1450,2150][i];
    return {id:`site-${i}`,kind,name,hazard,x:Math.cos(angle)*distance,z:Math.sin(angle)*distance,angle:angle+.6,radius:kind==='canyon'?360:kind==='ruins'?90:240};
  });cache.set(planet,sites);return sites;
}
export function landmarkRelief(x,z,base,planet){
  let h=base;
  for(const site of landmarkSites(planet)){
    const dx=x-site.x,dz=z-site.z,r=Math.hypot(dx,dz),falloff=Math.exp(-Math.pow(r/(site.radius*1.6),4));
    if(site.kind==='crater')h+=(145*Math.exp(-Math.pow((r-site.radius*.75)/(site.radius*.19),2))-75*Math.exp(-Math.pow(r/(site.radius*.52),4)))*falloff;
    else if(site.kind==='canyon'){
      const along=dx*Math.cos(site.angle)+dz*Math.sin(site.angle),across=-dx*Math.sin(site.angle)+dz*Math.cos(site.angle);
      const meander=across-35*Math.sin(along*.009),ends=Math.exp(-Math.pow(along/site.radius,6));
      h+=(70-145*Math.exp(-Math.pow(meander/65,4)))*ends*Math.exp(-Math.pow(across/210,4));
    }else if(site.kind==='spires')h+=120*Math.exp(-Math.pow(r/200,2));
    else{const t=Math.max(0,Math.min(1,(r-100)/90)),blend=t*t*(3-2*t);h=45*(1-blend)+h*blend;}
  }
  return h;
}
export function siteHazardAt(x,z,planet){
  return landmarkSites(planet).find(site=>site.hazard&&Math.hypot(x-site.x,z-site.z)<site.radius*.55)||null;
}
