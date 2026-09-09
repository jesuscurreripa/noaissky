import * as THREE from 'three';

// A bounded CPU tree. The root covers a planetary tangent chart in metres.
export function selectTerrainLeaves(visitor, {size = 131072, minSize = 128, splitDistance = 2, maxLeaves = 256} = {}) {
  if (!(size > 0 && minSize > 0 && splitDistance > 0 && maxLeaves >= 1)) throw new RangeError('Invalid terrain budget');
  const leaves = [{x:0, z:0, size, level:0, key:'r'}];
  const distance = n => Math.hypot(Math.max(0, Math.abs(visitor.x-n.x)-n.size/2), Math.max(0, Math.abs(visitor.z-n.z)-n.size/2), Math.max(0, visitor.y || 0));
  for (;;) {
    let best = -1, score = Infinity;
    for (let i=0;i<leaves.length;i++) {
      const n=leaves[i], d=distance(n)/n.size;
      if (n.size/2 >= minSize && d < splitDistance && d < score) {best=i;score=d;}
    }
    if (best < 0 || leaves.length+3 > maxLeaves) break;
    const n=leaves.splice(best,1)[0], s=n.size/2;
    for (let i=0;i<4;i++) leaves.push({x:n.x+(i%2?1:-1)*s/2,z:n.z+(i<2?-1:1)*s/2,size:s,level:n.level+1,key:n.key+i});
  }
  return leaves;
}

export function createTerrainQuadtree({height, material, colorAt, size=131072, segments=16, maxLeaves=256, buildsPerFrame=8, decorateGeometry}) {
  const group=new THREE.Group(), meshes=new Map();
  group.name='CPU terrain quadtree';
  let desired=[], signature='', disposed=false;
  const stats={leaves:0,resident:0,pending:0,triangles:0};
  function build(node) {
    const positions=[],colors=[],coordinates=[],indices=[],step=node.size/segments;
    const append=(x,z,y)=>{positions.push(x,y,z);coordinates.push(node.x+x,y,node.z+z);const c=colorAt(node.x+x,node.z+z,y);colors.push(c.r,c.g,c.b);};
    for(let z=0;z<=segments;z++) for(let x=0;x<=segments;x++) {
      const px=x*step-node.size/2,pz=z*step-node.size/2;
      append(px,pz,height(node.x+px,node.z+pz));
    }
    const row=segments+1;
    for(let z=0;z<segments;z++)for(let x=0;x<segments;x++){const a=z*row+x;indices.push(a,a+row,a+1,a+1,a+row,a+row+1);}
    // Downward skirts cover cracks where adjacent leaves use different LODs.
    const edge=[];
    for(let x=0;x<segments;x++)edge.push(x);
    for(let z=0;z<segments;z++)edge.push(z*row+segments);
    for(let x=segments;x>0;x--)edge.push(segments*row+x);
    for(let z=segments;z>0;z--)edge.push(z*row);
    const bottom=positions.length/3;
    for(const a of edge)append(positions[a*3],positions[a*3+2],positions[a*3+1]-Math.max(64,node.size*.1));
    for(let i=0;i<edge.length;i++){const j=(i+1)%edge.length;indices.push(edge[i],bottom+i,edge[j],edge[j],bottom+i,bottom+j);}
    decorateGeometry?.({node,segments,height,positions,colors,coordinates,indices,colorAt});
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('terrainPosition',new THREE.Float32BufferAttribute(coordinates,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setIndex(indices);geometry.computeVertexNormals();geometry.computeBoundingSphere();
    const mesh=new THREE.Mesh(geometry,material);mesh.position.set(node.x,0,node.z);mesh.receiveShadow=true;mesh.visible=false;group.add(mesh);meshes.set(node.key,mesh);
  }
  return {group,stats,size,update(visitor) {
    if(disposed)return;
    const next=selectTerrainLeaves(visitor,{size,maxLeaves});
    const key=next.map(n=>n.key).sort().join(',');
    if(key!==signature){desired=next;signature=key;}
    const wanted=new Set(desired.map(n=>n.key));
    // Drop abandoned staging meshes; retain the visible cover until replacement is complete.
    for(const [key,mesh] of meshes)if(!mesh.visible&&!wanted.has(key)){mesh.geometry.dispose();group.remove(mesh);meshes.delete(key);}
    let budget=meshes.size===0?maxLeaves:buildsPerFrame;
    for(const n of desired)if(!meshes.has(n.key)&&budget-->0)build(n);
    const pending=desired.filter(n=>!meshes.has(n.key)).length;
    if(!pending)for(const [key,mesh] of meshes){if(wanted.has(key))mesh.visible=true;else{mesh.geometry.dispose();group.remove(mesh);meshes.delete(key);}}
    Object.assign(stats,{leaves:desired.length,resident:meshes.size,pending,triangles:[...meshes.values()].filter(m=>m.visible).reduce((n,m)=>n+m.geometry.index.count/3,0)});
  },dispose(){disposed=true;for(const mesh of meshes.values())mesh.geometry.dispose();meshes.clear();group.clear();group.removeFromParent();}};
}
