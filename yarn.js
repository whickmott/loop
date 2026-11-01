(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./yarn-profile.js'):root.YarnProfile);if(typeof module==='object'&&module.exports)module.exports=api;else root.YarnGeometry=api;})(typeof globalThis!=='undefined'?globalThis:this,function makeYarnGeometry(YarnProfile){
  'use strict';
  const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),mul=(a,s)=>a.map(v=>v*s);
  const len=a=>Math.hypot(...a),unit=(a,f=[1,0,0])=>len(a)>1e-8?mul(a,1/len(a)):[...f];
  const dot=(a,b)=>a.reduce((v,x,i)=>v+x*b[i],0),mix=(a,b,t)=>add(mul(a,1-t),mul(b,t));
  const position=n=>[n.x,n.y,n.z||0];
  function radius(settings={}){return YarnProfile.resolve(settings).radiusMm;}
  function rawPath(node,map,r=YarnProfile.resolve().radiusMm){
    const top=position(node),f=node.frame||{u:[node.dir||1,0,0],v:[0,1,0],n:[0,0,1]};
    const u=f.u,v=f.v,n=f.n,w=node.restWidth||.82,scale=w/.82;
    const p=(base,x,y,z)=>add(base,add(mul(u,x*scale),add(mul(v,y*scale*(node.headHeightScale??1)),mul(n,z))));
    const head=[];
    const headDepth=Math.max(.145*scale,r*1.45),clearance=Math.max(.235*scale,r*2.1);
    const landmarks={headFront:p(top,0,-.14,headDepth),headBack:p(top,0,.025,-headDepth),feet:[]};
    if(node.type==='MR'){
      for(let j=0;j<=48;j++){const t=j/48*Math.PI*4;head.push(add(top,[Math.cos(t)*.30*scale,Math.sin(t)*.30*scale,j*.0016*scale]));}
      return {points:head,landmarks};
    }
    if(node.type==='CH'){
      const q=[[-.48,-.01,.06],[-.25,.15,.14],[.11,.17,.11],[.40,.065,-.115],
        [.30,-.15,-.155],[-.08,-.16,-.08],[-.29,-.035,.135],[-.11,.105,.21],[.19,.11,.08],[.44,-.01,.06]];
      return {points:q.map(a=>p(top,a[0],a[1],a[2]*Math.max(scale,r/.12))),landmarks};
    }
    let feet=node.footprints?.length?node.footprints.map(a=>({...a,position:[...a.position]})):
      node.parents.map(id=>{const a=map.get(id);return{position:position(a),u:a.frame?.u||u,n:n,target:id};});
    if(!feet.length)feet=[{position:p(top,0,-.7,0),u,n,target:null}];
    if(node.spaceTarget)feet=feet.slice(0,1);
    for(const foot of feet){
      const parent=map.get(foot.target);
      if(parent?.type==='MR'){
        foot.position=add(position(parent),mul(unit([node.x-parent.x,node.y-parent.y,0]),.30*scale));foot.u=u;
      }
      if(node.post&&parent&&!foot.post){
        const grand=parent.footprints?.[0]?.position||p(position(parent),0,-.6,0);
        foot.position=mix(position(parent),grand,.55);
      }

      const shift=node.loop==='blo'?-headDepth:node.loop==='flo'?headDepth:0;
      foot.position=add(foot.position,mul(n,shift));
      landmarks.feet.push({position:[...foot.position],target:foot.target,loop:node.loop,space:!!node.spaceTarget});
    }
    const pts=[p(top,-.43,-.04,headDepth*.85)];
    const merge=feet.length>1?p(top,0,-.23,0):top;
    const preWraps={SC:0,SLST:0,HDC:1,DC:1,TR:2,DTR:3}[node.type]||0;
    for(let index=0;index<feet.length;index++){
      const foot=feet[index],base=foot.position,fu=unit(foot.u,u),fv=unit(sub(merge,base),v);
      const footP=(x,y,z)=>add(base,add(mul(fu,x*scale),add(mul(fv,y*scale),mul(n,z))));
      if(index>0)pts.push(p(merge,-.07,-.10,clearance));
      if(node.type==='SC')pts.push(add(mix(base,merge,.52),add(mul(u,-.19*scale),mul(n,clearance*.72))));
      if(preWraps){

        const start=node.type==='HDC'?.84:.70,end=node.type==='HDC'?.70:.27;
        for(let j=0;j<=preWraps*10;j++){
          const t=j/(preWraps*10),height=start+(end-start)*t;
          const centre=mix(base,merge,height),angle=t*Math.PI*2*preWraps+Math.PI;
          pts.push(add(centre,add(mul(u,Math.cos(angle)*.17*scale),mul(n,Math.sin(angle)*.18*scale))));
        }
      }

      const wrapDepth=node.loop==='both'?clearance:Math.max(r*1.4,.15*scale);
      if(node.post){
        const sign=node.post==='FP'?1:-1;
        pts.push(footP(-.16,.04,sign*clearance),footP(-.24,-.10,-sign*clearance),
          footP(.18,-.16,-sign*clearance),footP(.20,.07,sign*clearance));
      }else{
        pts.push(footP(-.17,.055,wrapDepth),footP(-.19,-.13,wrapDepth*.75),
          footP(.035,-.175,-wrapDepth*.65),footP(.18,-.055,-wrapDepth),footP(.17,.10,-wrapDepth));
      }
      const endPoint=p(merge,index===feet.length-1?.27:.12,-.15,-headDepth*.9);
      const middle=mix(footP(.11,.10,-wrapDepth),endPoint,.55);
      pts.push(middle,endPoint);
    }

    const bodyEnd=pts.length;
    if(node.type==='HDC')pts.push(p(top,.17,-.22,-headDepth),p(top,.24,-.19,headDepth*.85));
    pts.push(p(top,.18,-.015,-headDepth),p(top,.34,-.065,-headDepth*.8),
      p(top,.25,-.17,.02*scale),p(top,.015,-.245,headDepth),p(top,-.265,-.105,headDepth),
      p(top,-.315,.01,-headDepth*.15),p(top,-.12,.095,-headDepth),
      p(top,.16,.065,-headDepth*.9),p(top,.31,-.01,headDepth*.7),p(top,.43,-.045,headDepth));
    if(node.cable){
      const base=feet[0].position,axis=sub(top,base),den=dot(axis,axis)||1,normal=node.cable.normal||n;
      const lift=(node.cable.over?2.8:-1.4)*r+(node.cable.over?1:-1)*.035*scale;
      for(let i=1;i<bodyEnd;i++){
        const t=dot(sub(pts[i],base),axis)/den;
        const weight=t>0&&t<.88?Math.sin(Math.PI*t/.88)**2:0;
        pts[i]=add(pts[i],mul(normal,lift*weight));
      }
      landmarks.cableCrossing={position:add(mix(base,top,.44),mul(normal,lift)),normal:[...normal],over:node.cable.over,cable:node.cable.id};
    }
    landmarks.entry=pts[0];landmarks.exit=pts.at(-1);
    return {points:pts,landmarks};
  }
  function sample(points,spacing){

    const out=[points[0]];
    for(let i=0;i<points.length-1;i++){
      const a=points[i],b=points[i+1],prev=points[Math.max(0,i-1)],next=points[Math.min(points.length-1,i+2)];
      const distance=len(sub(b,a));
      const tangent=(delta,max)=>mul(unit(delta),Math.min(len(delta)*.32,max));
      const m0=tangent(sub(b,prev),distance*.72),m1=tangent(sub(next,a),distance*.72);
      const steps=Math.max(2,Math.ceil(distance/spacing));
      for(let j=1;j<=steps;j++){
        const t=j/steps,t2=t*t,t3=t2*t;
        out.push(add(add(mul(a,2*t3-3*t2+1),mul(b,-2*t3+3*t2)),add(mul(m0,t3-2*t2+t),mul(m1,t3-t2))));
      }
    }
    return out;
  }
  function generate(graph,settings={}){
    const map=new Map(graph.nodes.map(n=>[n.id,n])),r=radius(settings),paths=[];let previous=null;
    for(const node of graph.nodes){
      const raw=rawPath(node,map,r),points=raw.points;
      if(previous){
        const gap=len(sub(points[0],previous));
        if(gap>r*.2){
          const normal=node.frame?.n||[0,0,1];
          points.unshift(previous,mix(previous,points[0],.5).map((v,k)=>v+normal[k]*Math.min(r*.45,gap*.08)));
        }else points.unshift(previous);
      }
      const dense=sample(points,r*.7);
      paths.push({id:node.id,points:dense,landmarks:raw.landmarks,normal:node.frame?.n||[0,0,1],colour:node.colour});
      previous=dense.at(-1);
    }
    return paths;
  }
  function contactStep(paths,r){

    const records=[],points=[],segments=[],arcValues=[],normals=[],joins=[];
    let distance=0,lastEnd=null,denseCount=0;
    for(const path of paths){
      const dense=path.points,lengths=new Float64Array(dense.length);denseCount+=dense.length;
      for(let i=1;i<dense.length;i++)lengths[i]=lengths[i-1]+len(sub(dense[i],dense[i-1]));
      const length=lengths.at(-1),steps=Math.max(1,Math.ceil(length/(r*1.2))),indices=[];
      const shared=lastEnd&&len(sub(lastEnd,dense[0]))<1e-8;let cursor=1;
      for(let j=0;j<=steps;j++){
        if(j===0&&shared){indices.push(points.length-1);continue;}
        const s=j/steps*length;while(cursor<dense.length-1&&lengths[cursor]<s)cursor++;
        const lo=Math.max(0,cursor-1),hi=cursor,t=(s-lengths[lo])/Math.max(1e-12,lengths[hi]-lengths[lo]);
        const q=j===steps?dense.at(-1):mix(dense[lo],dense[hi],Math.max(0,Math.min(1,t))),id=points.length;
        points.push(q);normals.push(path.normal||[0,0,1]);arcValues.push(distance+s);indices.push(id);
        if(j)segments.push([indices[j-1],id]);
      }
      records.push({path,lengths,length,steps,indices});distance+=length+(shared?0:r*6);lastEnd=dense.at(-1);
    }
    const count=points.length,p=new Float64Array(count*3),seed=new Float64Array(count*3),normal=new Float32Array(count*3);
    for(let i=0;i<count;i++){p.set(points[i],i*3);normal.set(normals[i],i*3);}seed.set(p);
    const sa=Uint32Array.from(segments,s=>s[0]),sb=Uint32Array.from(segments,s=>s[1]),rest=new Float64Array(segments.length),arc=Float64Array.from(arcValues);
    const minimum=r*1.87,limit=r*.42,skin=limit*2+.01*r,cutoff=minimum+skin,cell=minimum+r*1.2+skin;
    let tableSize=1;while(tableSize<segments.length*2)tableSize*=2;
    const buckets=new Int32Array(tableSize).fill(-1),next=new Int32Array(segments.length),cx=new Int32Array(segments.length),cy=new Int32Array(segments.length),cz=new Int32Array(segments.length),mask=tableSize-1;
    const hash=(x,y,z)=>(Math.imul(x,73856093)^Math.imul(y,19349663)^Math.imul(z,83492791))&mask;
    let pairs=new Uint32Array(Math.max(128,segments.length*12)),pairCount=0,contacts=0;

    let u=0,v=0,vx=0,vy=0,vz=0,ds=0;
    function closest(i,j){
      const a=sa[i]*3,b=sb[i]*3,c=sa[j]*3,d=sb[j]*3;
      const ax=p[b]-p[a],ay=p[b+1]-p[a+1],az=p[b+2]-p[a+2],bx=p[d]-p[c],by=p[d+1]-p[c+1],bz=p[d+2]-p[c+2],wx=p[a]-p[c],wy=p[a+1]-p[c+1],wz=p[a+2]-p[c+2];
      const aa=ax*ax+ay*ay+az*az,bb=ax*bx+ay*by+az*bz,cc=bx*bx+by*by+bz*bz,dd=ax*wx+ay*wy+az*wz,ee=bx*wx+by*wy+bz*wz,den=aa*cc-bb*bb;
      u=den>1e-14?Math.max(0,Math.min(1,(bb*ee-cc*dd)/den)):0;
      v=cc>1e-14?(bb*u+ee)/cc:0;
      if(v<0){v=0;u=aa>1e-14?Math.max(0,Math.min(1,-dd/aa)):0;}
      else if(v>1){v=1;u=aa>1e-14?Math.max(0,Math.min(1,(bb-dd)/aa)):0;}
      vx=wx+u*ax-v*bx;vy=wy+u*ay-v*by;vz=wz+u*az-v*bz;ds=vx*vx+vy*vy+vz*vz;
    }
    for(let i=0;i<segments.length;i++){
      const a=sa[i]*3,b=sb[i]*3;rest[i]=Math.hypot(p[b]-p[a],p[b+1]-p[a+1],p[b+2]-p[a+2]);
      const x=cx[i]=Math.floor((p[a]+p[b])*.5/cell),y=cy[i]=Math.floor((p[a+1]+p[b+1])*.5/cell),z=cz[i]=Math.floor((p[a+2]+p[b+2])*.5/cell);
      for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++)for(let dz=-1;dz<=1;dz++){
        const xx=x+dx,yy=y+dy,zz=z+dz;let j=buckets[hash(xx,yy,zz)];
        while(j>=0){
          if(cx[j]===xx&&cy[j]===yy&&cz[j]===zz&&arc[sa[i]]-arc[sb[j]]>=minimum*2.6){
            closest(i,j);if(ds<cutoff*cutoff){if(pairCount+2>pairs.length){const grow=new Uint32Array(pairs.length*2);grow.set(pairs);pairs=grow;}pairs[pairCount++]=i;pairs[pairCount++]=j;}
          }j=next[j];
        }
      }
      const h=hash(x,y,z);next[i]=buckets[h];buckets[h]=i;
    }
    function step(){
      contacts=0;
      for(let k=0;k<p.length;k++)p[k]+=(seed[k]-p[k])*.035;
      for(let pair=0;pair<pairCount;pair+=2){
        const i=pairs[pair],j=pairs[pair+1];closest(i,j);if(ds>=minimum*minimum)continue;contacts++;
        const d=Math.sqrt(ds),a=sa[i]*3,b=sb[i]*3,c=sa[j]*3,e=sb[j]*3;
        if(d<1e-8){vx=normal[a];vy=normal[a+1];vz=normal[a+2];}
        const wa=1-u,wb=u,wc=1-v,wd=v,den=wa*wa+wb*wb+wc*wc+wd*wd;
        const m=Math.min(r*.12,(minimum-d)*.45)/(Math.max(1e-8,d)*den);
        const factor=d<1e-8?Math.min(r*.12,minimum*.45)/den:m;
        const x=vx*factor,y=vy*factor,z=vz*factor;
        p[a]+=x*wa;p[a+1]+=y*wa;p[a+2]+=z*wa;p[b]+=x*wb;p[b+1]+=y*wb;p[b+2]+=z*wb;
        p[c]-=x*wc;p[c+1]-=y*wc;p[c+2]-=z*wc;p[e]-=x*wd;p[e+1]-=y*wd;p[e+2]-=z*wd;
      }
      for(let i=0;i<segments.length;i++){
        const a=sa[i]*3,b=sb[i]*3,dx=p[b]-p[a],dy=p[b+1]-p[a+1],dz=p[b+2]-p[a+2],d=Math.hypot(dx,dy,dz);
        if(d>1e-9){const m=(d-rest[i])/d*.35;p[a]+=dx*m;p[a+1]+=dy*m;p[a+2]+=dz*m;p[b]-=dx*m;p[b+1]-=dy*m;p[b+2]-=dz*m;}
      }

      for(let k=0;k<p.length;k+=3){const dx=p[k]-seed[k],dy=p[k+1]-seed[k+1],dz=p[k+2]-seed[k+2],ds=dx*dx+dy*dy+dz*dz;if(ds>limit*limit){const m=limit/Math.sqrt(ds);p[k]=seed[k]+dx*m;p[k+1]=seed[k+1]+dy*m;p[k+2]=seed[k+2]+dz*m;}}
    }
    function finish(){
      for(const record of records){
        const {path,lengths,length,steps,indices}=record;
        for(let j=0;j<path.points.length;j++){
          const s=length>1e-10?lengths[j]/length*steps:0,lo=Math.min(steps,Math.floor(s)),hi=Math.min(steps,lo+1),t=s-lo,a=indices[lo]*3,b=indices[hi]*3,q=path.points[j];
          path.points[j]=q.map((x,k)=>x+(p[a+k]-seed[a+k])*(1-t)+(p[b+k]-seed[b+k])*t);
        }
      }
      return {samplePoints:denseCount,rodPoints:count,candidatePairs:pairCount/2,contacts,minimumSeparation:minimum,maximumDisplacement:limit,method:'segment-capsules',passes:0};
    }
    return {step,finish};
  }
  async function relaxContacts(paths,settings={},onProgress){
    if(settings.yarnContacts===false)return {passes:0,disabledByUser:true};
    const r=radius(settings),solver=contactStep(paths,r),passes=settings.quality==='fine'?24:settings.quality==='quick'?6:12;
    for(let j=0;j<passes;j++){solver.step();onProgress?.((j+1)/passes);await new Promise(resolve=>setTimeout(resolve,0));}
    return {...solver.finish(),passes};
  }
  return {radius,rawPath,sample,generate,contactStep,relaxContacts,factorySource:()=>makeYarnGeometry.toString()};
});
