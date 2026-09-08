import {buildPlanetChunk} from './planet-chunk.js';
self.onmessage=({data})=>{
  try{const result=buildPlanetChunk(data.job);self.postMessage({key:data.key,result},[result.positions.buffer,result.coarse.buffer,result.normals.buffer,result.colors.buffer,result.indices.buffer]);}
  catch(error){self.postMessage({key:data.key,error:String(error)});}
};
