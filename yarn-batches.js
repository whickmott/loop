(function(root,factory){root.YarnBatches=factory(root.THREE,root.YarnMeshCore);})(typeof globalThis!=='undefined'?globalThis:this,function(T,Core){
  'use strict';
  function correctNormals(material){
    if(material.userData.loopNormalCorrection)return material;
    const prior=material.onBeforeCompile;
    material.onBeforeCompile=function(shader,renderer){prior?.call(this,shader,renderer);shader.vertexShader=shader.vertexShader.replace('#include <beginnormal_vertex>','#include <beginnormal_vertex>\nobjectNormal *= vec3(length(modelMatrix[0].xyz), length(modelMatrix[1].xyz), length(modelMatrix[2].xyz));');};
    material.customProgramCacheKey=()=> 'loop-compact-v1';material.userData.loopNormalCorrection=true;material.needsUpdate=true;return material;
  }
  function geometry(piece,compact=false){const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(piece.positions,3,compact));g.setAttribute('normal',new T.BufferAttribute(piece.normals,3,true));g.setIndex(new T.BufferAttribute(piece.indices,1));return g;}
  function tube(points,radius,colours,stitch,detailed,phaseOffset,material,carry){
    const group=new T.Group();group.userData.stitch=stitch;
    group.userData.length=Core.sweep(points,radius,colours.length>1?2:1,detailed,phaseOffset,carry,piece=>{
      const c=new T.Color(colours[piece.strand]).multiplyScalar(piece.shade),mesh=new T.Mesh(geometry(piece),material('#'+c.getHexString()));mesh.castShadow=true;mesh.userData={stitch,strand:piece.strand,shade:piece.shade};group.add(mesh);
    });return group;
  }
  class Builder{
    constructor(material){this.material=material;this.core=new Core.Builder();this.batches=[];this.group=new T.Group();}
    addPath(path,node,settings,radius,phaseOffset=0,carry={}){return this.core.addPath(path,node,settings,radius,phaseOffset,carry);}
    add(group,node){for(const mesh of group.children){this.core.addPiece({positions:mesh.geometry.attributes.position.array,normals:mesh.geometry.attributes.normal.array,indices:mesh.geometry.index.array,strand:mesh.userData.strand,shade:mesh.userData.shade,vertices:mesh.geometry.attributes.position.count},node);mesh.geometry.dispose();}}
    consume(records,settings){
      for(const r of records){
        const g=geometry(r,r.compact!==false),mesh=new T.Mesh(g,correctNormals(this.material('#ffffff')));mesh.castShadow=true;mesh.position.set(...r.origin);mesh.scale.set(...r.scale);
        const ghostGeometry=new T.BufferGeometry();ghostGeometry.setAttribute('position',g.attributes.position);ghostGeometry.setAttribute('normal',g.attributes.normal);ghostGeometry.setIndex(g.index);
        const ghost=new T.Mesh(ghostGeometry,correctNormals(this.material('#ffffff-ghost')));ghost.position.copy(mesh.position);ghost.scale.copy(mesh.scale);ghost.visible=false;ghost.userData.future=true;
        const record={mesh,ghost,ranges:r.ranges,source:r.source,shade:r.shade,count:r.count};mesh.userData.batch=record;this.group.add(mesh,ghost);this.batches.push(record);
      }this.recolour(settings);return this;
    }
    finish(settings){return this.consume(this.core.finish(),settings);}
    recolour(settings){for(const b of this.batches){const base=b.source==='primary'?settings.colour:b.source==='secondary'?settings.secondColour:b.source.slice(6),c=new T.Color(base).multiplyScalar(b.shade),hex='#'+c.getHexString();b.mesh.material=correctNormals(this.material(hex));b.ghost.material=correctNormals(this.material(hex+'-ghost'));}}
    progress(count,future){for(const b of this.batches){let lo=0,hi=b.ranges.length;while(lo<hi){const mid=(lo+hi)>>1;if(b.ranges[mid].id<=count)lo=mid+1;else hi=mid;}const end=lo?b.ranges[lo-1].end:0;b.mesh.geometry.setDrawRange(0,end);b.mesh.visible=end>0;b.ghost.geometry.setDrawRange(end,b.count-end);b.ghost.visible=!!future&&end<b.count;}}
    static pick(hit){const b=hit.object.userData.batch;if(!b)return null;const index=hit.faceIndex*3;let lo=0,hi=b.ranges.length;while(lo<hi){const mid=(lo+hi)>>1;if(b.ranges[mid].end<=index)lo=mid+1;else hi=mid;}return b.ranges[lo]?.id;}
  }
  return {tube,Builder,Core};
});
