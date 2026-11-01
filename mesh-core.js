(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.YarnMeshCore=api;})(typeof globalThis!=='undefined'?globalThis:this,function makeYarnMeshCore(){
  'use strict';
  const radial=8,COS=Float64Array.from({length:radial},(_,i)=>Math.cos(i/radial*Math.PI*2)),SIN=Float64Array.from({length:radial},(_,i)=>Math.sin(i/radial*Math.PI*2));
  function sweep(points,radius,strands=1,detailed=true,phaseOffset=0,carry={},emit){
    const count=points.length,arc=new Float64Array(count);
    const x=i=>Array.isArray(points[i])?points[i][0]:points[i].x,y=i=>Array.isArray(points[i])?points[i][1]:points[i].y,z=i=>Array.isArray(points[i])?points[i][2]:points[i].z;
    for(let i=1;i<count;i++)arc[i]=arc[i-1]+Math.hypot(x(i)-x(i-1),y(i)-y(i-1),z(i)-z(i-1));
    const length=arc.at(-1)||0,segments=Math.max(32,Math.ceil(length/(radius*7.5)*(detailed?24:12)),Math.ceil(count*.75));
    const carrier=new Float64Array((segments+1)*3),frames=new Float32Array((segments+1)*6);let cursor=1;
    for(let i=0;i<=segments;i++){
      const s=i/segments*length;while(cursor<count-1&&arc[cursor]<s)cursor++;
      const a=Math.max(0,cursor-1),b=Math.min(count-1,cursor),t=(s-arc[a])/Math.max(1e-12,arc[b]-arc[a]),k=i*3;
      carrier[k]=x(a)+(x(b)-x(a))*t;carrier[k+1]=y(a)+(y(b)-y(a))*t;carrier[k+2]=z(a)+(z(b)-z(a))*t;
    }
    let px=carry.normal?.[0]??0,py=carry.normal?.[1]??0,pz=carry.normal?.[2]??1;
    for(let i=0;i<=segments;i++){
      const a=Math.max(0,i-1)*3,b=Math.min(segments,i+1)*3,k=i*6;let tx=carrier[b]-carrier[a],ty=carrier[b+1]-carrier[a+1],tz=carrier[b+2]-carrier[a+2],m=Math.hypot(tx,ty,tz)||1;tx/=m;ty/=m;tz/=m;
      const d=px*tx+py*ty+pz*tz;let nx=px-d*tx,ny=py-d*ty,nz=pz-d*tz;m=Math.hypot(nx,ny,nz);
      if(m<1e-9){nx=-ty*tx;ny=1-ty*ty;nz=-ty*tz;m=Math.hypot(nx,ny,nz)||1;}
      nx/=m;ny/=m;nz/=m;frames[k]=nx;frames[k+1]=ny;frames[k+2]=nz;frames[k+3]=ty*nz-tz*ny;frames[k+4]=tz*nx-tx*nz;frames[k+5]=tx*ny-ty*nx;px=nx;py=ny;pz=nz;
    }
    carry.normal=[px,py,pz];
    const plies=detailed?3:1,centres=new Float64Array((segments+1)*3);
    for(let strand=0;strand<strands;strand++)for(let ply=0;ply<plies;ply++){
      const sr=strands===2?radius*.61:radius,pr=sr*(detailed?.58:1);
      for(let i=0;i<=segments;i++){
        const distance=phaseOffset+i/segments*length,bundle=distance/(radius*18)*Math.PI*2+strand*Math.PI,phase=distance/(sr*7.5)*Math.PI*2+ply*Math.PI*2/plies;
        const co=strands===2?radius*.40:0,fo=detailed?sr*.42:0,nx=Math.cos(bundle)*co+Math.cos(phase)*fo,ny=Math.sin(bundle)*co+Math.sin(phase)*fo,k=i*6,j=i*3;
        centres[j]=carrier[j]+frames[k]*nx+frames[k+3]*ny;centres[j+1]=carrier[j+1]+frames[k+1]*nx+frames[k+4]*ny;centres[j+2]=carrier[j+2]+frames[k+2]*nx+frames[k+5]*ny;
      }
      for(let start=0;start<segments;){
        const end=Math.min(segments,start+7499),rings=end-start+1,vertices=rings*radial,positions=new Float32Array(vertices*3),normals=new Int8Array(vertices*3),indices=new Uint16Array((rings-1)*radial*6);
        for(let i=start;i<=end;i++){
          const a=Math.max(0,i-1)*3,b=Math.min(segments,i+1)*3,k=i*3,f=i*6;let tx=centres[b]-centres[a],ty=centres[b+1]-centres[a+1],tz=centres[b+2]-centres[a+2],m=Math.hypot(tx,ty,tz)||1;tx/=m;ty/=m;tz/=m;
          const dot=frames[f]*tx+frames[f+1]*ty+frames[f+2]*tz;let nx=frames[f]-dot*tx,ny=frames[f+1]-dot*ty,nz=frames[f+2]-dot*tz;m=Math.hypot(nx,ny,nz)||1;nx/=m;ny/=m;nz/=m;
          const bx=ty*nz-tz*ny,by=tz*nx-tx*nz,bz=tx*ny-ty*nx;
          for(let q=0;q<radial;q++){
            const x=nx*COS[q]+bx*SIN[q],y=ny*COS[q]+by*SIN[q],z=nz*COS[q]+bz*SIN[q],v=((i-start)*radial+q)*3;
            positions[v]=centres[k]+x*pr;positions[v+1]=centres[k+1]+y*pr;positions[v+2]=centres[k+2]+z*pr;normals[v]=Math.round(x*127);normals[v+1]=Math.round(y*127);normals[v+2]=Math.round(z*127);
          }
        }
        let at=0;for(let i=0;i<rings-1;i++)for(let q=0;q<radial;q++){const a=i*radial+q,b=i*radial+(q+1)%radial,c=(i+1)*radial+q,d=(i+1)*radial+(q+1)%radial;indices[at++]=a;indices[at++]=b;indices[at++]=c;indices[at++]=b;indices[at++]=d;indices[at++]=c;}
        emit({positions,normals,indices,strand,shade:detailed?1+(ply-1)*.035:1,vertices});start=end;
      }
    }
    return length;
  }
  class Builder{
    constructor(){this.open=new Map();this.records=[];this.capacity=60000;this.indexCache=new Map();this.quantisationError=0;}
    addPath(path,node,settings,radius,phaseOffset=0,carry={}){
      return sweep(path.points,radius,settings.marled?2:1,settings.renderMode!=='smooth',phaseOffset,carry,piece=>this.addPiece(piece,node,radius));
    }
    addPiece(piece,node,radius=1){
      const source=piece.strand===1?'secondary':node.colour?'fixed:'+node.colour:'primary',key=source+'|'+piece.shade,pos=piece.positions;
      const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];for(let k=0;k<pos.length;k++) {const a=k%3;min[a]=Math.min(min[a],pos[k]);max[a]=Math.max(max[a],pos[k]);}
      let b=this.open.get(key);

      if(b&&(b.vertices+piece.vertices>this.capacity||min.some((x,k)=>Math.max(max[k],b.max[k])-Math.min(x,b.min[k])>radius*65535*.006))){this.flush(key);b=null;}
      if(!b){b={source,radius,shade:piece.shade,key,positions:new Float32Array(this.capacity*3),normals:new Int8Array(this.capacity*3),indices:new Uint16Array(this.capacity*6),vertices:0,count:0,ranges:[],pattern:[],min:[...min],max:[...max]};this.open.set(key,b);}
      const offset=b.vertices;b.positions.set(pos,offset*3);b.normals.set(piece.normals,offset*3);
      for(let i=0;i<piece.indices.length;i++)b.indices[b.count+i]=piece.indices[i]+offset;
      b.vertices+=piece.vertices;b.count+=piece.indices.length;b.ranges.push({id:node.id,end:b.count});b.pattern.push(piece.vertices);
      for(let k=0;k<3;k++){b.min[k]=Math.min(b.min[k],min[k]);b.max[k]=Math.max(b.max[k],max[k]);}
    }
    maxExtentForRadius(batch){return batch.radius*65535*.006;}
    flush(key){
      const b=this.open.get(key);if(!b)return;
      let scale=b.max.map((v,k)=>Math.max(1e-7,v-b.min[k]));
      const compact=Math.max(...scale)<=this.maxExtentForRadius(b),positions=compact?new Uint16Array(b.vertices*3):b.positions.slice(0,b.vertices*3);
      if(compact)for(let k=0;k<positions.length;k++)positions[k]=Math.round((b.positions[k]-b.min[k%3])/scale[k%3]*65535);
      const pattern=b.pattern.join(','),cached=this.indexCache.get(pattern),indices=cached||b.indices.slice(0,b.count);if(!cached)this.indexCache.set(pattern,indices);
      const error=compact?Math.hypot(...scale)/131070:0,origin=compact?b.min:[0,0,0];if(!compact)scale=[1,1,1];
      this.records.push({positions,normals:b.normals.slice(0,b.vertices*3),indices,compact,origin,scale,ranges:b.ranges,source:b.source,shade:b.shade,count:b.count});
      this.quantisationError=Math.max(this.quantisationError,error);this.open.delete(key);
    }
    finish(){for(const key of [...this.open.keys()])this.flush(key);this.indexCache.clear();return this.records;}
  }
  function transfers(records){const buffers=new Set();for(const r of records)for(const name of ['positions','normals','indices'])buffers.add(r[name].buffer);return [...buffers];}
  return {sweep,Builder,transfers,factorySource:()=>makeYarnMeshCore.toString()};
});
