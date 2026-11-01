(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./yarn-profile.js'):root.YarnProfile);if(typeof module==='object'&&module.exports)module.exports=api;else root.Fabric=api;})(typeof globalThis!=='undefined'?globalThis:this,function makeFabric(YarnProfile){
  'use strict';
  const HEIGHT={CH:.46,SC:.73,HDC:.86,DC:1.28,TR:1.72,DTR:2.08,SLST:.30,MR:.35};
  const add=(a,b)=>a.map((v,i)=>v+b[i]), sub=(a,b)=>a.map((v,i)=>v-b[i]);
  const mul=(a,s)=>a.map(v=>v*s), dot=(a,b)=>a.reduce((v,x,i)=>v+x*b[i],0);
  const len=a=>Math.hypot(...a), unit=(a,fallback=[1,0,0])=>len(a)>1e-8?mul(a,1/len(a)):[...fallback];
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const mix=(a,b,t)=>add(mul(a,1-t),mul(b,t));
  const point=n=>[n.x,n.y,n.z||0];
  const average=ps=>ps.length?mul(ps.reduce(add,[0,0,0]),1/ps.length):[0,0,0];
  function create(graph,options={}){
    const settings={tension:100,bending:45,quality:'balanced',relax:true,...options};
    settings.tension=Math.max(45,Math.min(155,+settings.tension||100));
    settings.bending=Math.max(0,Math.min(100,+settings.bending||0));
    const material=YarnProfile.resolve(settings),scale=material.scale;
    const width=material.pitchMm,chainPitch=width*.82;
    const count=graph.nodes.length,p=new Float64Array(count*3),seed=new Float64Array(count*3),weights=new Float64Array(count).fill(1);
    const nodes=graph.nodes,map=new Map(nodes.map(n=>[n.id,n]));
    const physicalRows=graph.rows.map(row=>({...row,ids:row.visualIds||row.ids}));
    const countedMembers=new Map();for(const head of nodes.filter(n=>n.countedTurn))for(let j=0;j<head.countedRun.length;j++)countedMembers.set(head.countedRun[j],{head,t:(j+1)/head.countedRun.length});
    const constraints=[],rowOf=new Map(),neighbours=new Map(),links=new Set(),orders=[];
    const cellWidths=Float64Array.from(nodes,n=>n.type==='CH'?(n.role==='foundation'||n.countedTurn?width:n.role==='turning'?width*.55:chainPitch):width*(n.post?.78:1)*(n.cable?.96:1));
    for(const n of nodes){n.nominalLength=(HEIGHT[n.type]||.73)*scale*material.heightScale;n.rowRise=n.countedTurn?.45*n.countedRun.length*scale*material.heightScale:Math.max(.35*scale,n.nominalLength-(n.post?.45*(map.get(n.parents[0])?.rowRise||0):0));}
    const at=id=>{const j=(id-1)*3;return[p[j],p[j+1],p[j+2]];};
    const put=(id,v)=>{const j=(id-1)*3;p[j]=v[0];p[j+1]=v[1];p[j+2]=v[2];};
    const key=(a,b)=>a<b?a*count+b:b*count+a;
    const height=n=>n.rowRise;
    const anchorPoint=a=>a.reduce((v,x)=>add(v,mul(at(x.id),x.weight)),[0,0,0]);
    for(const row of physicalRows){
      row.ids.forEach((id,i)=>{
        rowOf.set(id,row);
        neighbours.set(id,[row.ids[i-1]||(row.round?row.ids.at(-1):null),row.ids[i+1]||(row.round?row.ids[0]:null)]);
      });
    }

    const sharing=new Map();
    for(const n of nodes.filter(n=>n.type!=='CH'&&n.type!=='MR'&&n.role!=='join')){
      const k=n.row+'|'+n.parents.join(',');if(!sharing.has(k))sharing.set(k,[]);sharing.get(k).push(n);
    }
    for(const siblings of sharing.values())siblings.forEach((n,i)=>{
      n.branch={index:i,count:siblings.length};n.anchors=[];
      if(n.spaceTarget){
        const row=rowOf.get(n.id),ids=n.parents.slice();

        if(row&&row.dir!==map.get(ids[0])?.dir)ids.reverse();
        const t=(i+.65)/(siblings.length+.3),v=t*Math.max(0,ids.length-1),j=Math.floor(v),f=v-j;
        n.anchors=[{id:ids[j],weight:1-f}];if(f>1e-6)n.anchors.push({id:ids[Math.min(ids.length-1,j+1)],weight:f});
      }else n.anchors=n.parents.map(id=>({id,weight:1/n.parents.length}));
    });
    for(const n of nodes.filter(n=>n.countedTurn)){n.anchors=[{id:n.turnBase,weight:1}];n.branch={index:0,count:1};}

    for(const n of nodes){
      n.bodyAnchors=n.anchors;
      if(n.post&&n.parents.length===1){
        const parent=map.get(n.parents[0]),below=parent.anchors;
        if(below?.length){n.bodyAnchors=[{id:parent.id,weight:.55},...below.map(a=>({id:a.id,weight:a.weight*.45}))];}
      }
    }
    let previousRadius=0,roundDepth=0;
    for(const row of physicalRows){
      const members=row.ids.map(id=>map.get(id));
      if(row.round){
        const circumRadius=width/(2*Math.sin(Math.PI/Math.max(3,members.length)));
        const h=members.reduce((v,n)=>v+height(n),0)/members.length;
        const dr=circumRadius-previousRadius;
        let radius=circumRadius;
        if(row.index>1){
          radius=previousRadius+Math.max(-h*.94,Math.min(h*.94,dr));
          roundDepth+=Math.sqrt(Math.max(0,h*h-Math.min(h,Math.abs(dr))**2));
        }
        members.forEach((n,i)=>{
          const angle=-Math.PI/2+i*Math.PI*2/members.length;
          const ruffle=Math.max(0,circumRadius-radius)*.32*Math.sin(i*2.4);
          put(n.id,[Math.cos(angle)*radius,Math.sin(angle)*radius,roundDepth+ruffle]);
        });
        previousRadius=radius;continue;
      }
      if(row.index===0){members.forEach((n,i)=>put(n.id,[(i-(members.length-1)/2)*width,0,0]));continue;}
      const working=members.filter(n=>n.type!=='CH'||n.countedTurn);
      const bases=working.map(n=>anchorPoint(n.anchors||n.parents.map(id=>({id,weight:1/n.parents.length}))));
      const centre=average(bases),meanH=working.reduce((v,n)=>v+height(n),0)/Math.max(1,working.length);
      const pitches=members.map(m=>cellWidths[m.id-1]),total=pitches.reduce((a,b)=>a+b,0);let running=0;
      members.forEach((n,i)=>{
        const offset=running+pitches[i]*.5-total*.5;running+=pitches[i];
        const x=centre[0]+row.dir*offset;
        put(n.id,[x,centre[1]+meanH,n.loop==='blo'?(row.dir>0?.07*scale:-.07*scale):.003*scale*Math.sin(i*1.7+row.index)]);
      });

      const background=working.filter(n=>!n.cable),cableRise=background.length?background.reduce((a,n)=>a+height(n),0)/background.length:meanH;
      working.forEach(n=>{
        if(n.cable){const q=at(n.id);q[1]=centre[1]+cableRise;put(n.id,q);return;}
        const b=anchorPoint(n.anchors),branch=n.branch;
        const side=(branch.index-(branch.count-1)/2)*width;
        const initial=at(n.id);
        put(n.id,[initial[0]*.28+(b[0]+row.dir*side)*.72,b[1]+height(n),initial[2]]);
      });
      const ys=members.map(n=>at(n.id)[1]);
      members.forEach((n,i)=>{
        const q=at(n.id);q[1]=.5*ys[i]+.25*ys[Math.max(0,i-1)]+.25*ys[Math.min(ys.length-1,i+1)];put(n.id,q);
      });
    }

    for(const space of graph.spaces){
      const ids=space.ids,row=rowOf.get(ids[0]);if(!row)continue;
      const first=row.ids.indexOf(ids[0]),last=row.ids.indexOf(ids.at(-1));
      const before=map.get(row.ids[first-1]),after=map.get(row.ids[last+1]);
      if(!before||!after)continue;
      const a=at(before.id),b=at(after.id),chord=len(sub(b,a)),contour=(ids.length+1)*chainPitch;
      const sag=Math.sqrt(Math.max(.04*scale*scale,contour*contour-chord*chord))*.32;
      ids.forEach((id,i)=>{const t=(i+1)/(ids.length+1),q=mix(a,b,t);q[1]+=Math.sin(t*Math.PI)*sag;put(id,q);});
    }
    for(const n of nodes){
      if(n.type==='MR')put(n.id,[0,0,0]);
      if(n.role==='turning'&&countedMembers.has(n.id)){
        const {head,t}=countedMembers.get(n.id),q=mix(at(head.turnBase),at(head.id),t);q[0]-=head.dir*.12*scale*Math.sin(t*Math.PI);put(n.id,q);
      }else if(n.role==='turning'){
        const b=at(n.previous),q=[b[0]+n.dir*.10*scale,b[1]+chainPitch*.7,b[2]];put(n.id,q);
      }else if(n.role==='join'&&!n.countedJoin&&n.parents.length)put(n.id,add(at(n.parents[0]),[0,0,.04*scale]));
    }
    for(let i=0;i<nodes.length;i++){
      if(nodes[i].role!=='turning'||countedMembers.has(nodes[i].id))continue;
      const run=[];let j=i;while(j<nodes.length&&nodes[j].role==='turning'&&!countedMembers.has(nodes[j].id))run.push(nodes[j++]);
      const before=map.get(run[0].previous),after=nodes[j];
      if(before&&after&&after.type!=='CH'&&after.role!=='join'){
        const a=at(before.id),b=at(after.id),out=before.dir||1;
        b[0]+=out*cellWidths[after.id-1]*.30;
        for(let k=0;k<run.length;k++){const t=(k+1)/run.length,q=mix(a,b,t);q[0]+=out*width*.12*Math.sin(Math.PI*t);put(run[k].id,q);}
      }
      i=j-1;
    }
    seed.set(p);
    function edge(a,b,rest,stiffness,kind){
      if(!a||!b||a===b)return;
      constraints.push({ids:[a,b],coeff:[1,-1],rest,stiffness,kind});
      if(kind==='row'){const row=rowOf.get(a),delta=sub(at(b),at(a));orders.push({a:(a-1)*3,b:(b-1)*3,axis:row.round?unit(delta):[row.dir,0,0],minimum:rest*.38});}
      if(kind==='row'||kind==='post')links.add(key(a,b));
    }
    function multi(n,rest,stiffness=.72){
      if(!n.bodyAnchors?.length)return;
      constraints.push({ids:[n.id,...n.bodyAnchors.map(a=>a.id)],coeff:[1,...n.bodyAnchors.map(a=>-a.weight)],rest,stiffness,kind:'post'});
      for(const a of n.anchors)links.add(key(n.id,a.id));
    }
    for(const row of physicalRows){
      for(let i=0;i<row.ids.length;i++){
        const a=map.get(row.ids[i]),b=map.get(row.ids[(i+1)%row.ids.length]);
        if(i+1<row.ids.length||row.round)edge(a.id,b.id,(cellWidths[a.id-1]+cellWidths[b.id-1])*.5,.82,'row');
        if(!row.round&&i+2<row.ids.length){
          const c=map.get(row.ids[i+2]);
          if([a,b,c].every(n=>n.type!=='CH'))edge(a.id,c.id,(cellWidths[a.id-1]+2*cellWidths[b.id-1]+cellWidths[c.id-1])*.4925,.025+settings.bending*.00065,'bend');
        }
      }
    }
    for(const n of nodes){
      if(n.role==='turning'){const group=countedMembers.get(n.id);edge(n.id,n.previous,group?height(group.head)/group.head.countedRun.length:len(sub(at(n.id),at(n.previous))),.8,'turn');continue;}
      if(n.countedTurn){multi(n,height(n));edge(n.id,n.previous,height(n)/n.countedRun.length,.8,'turn');continue;}
      if(n.role==='join'){edge(n.id,n.parents[0],n.countedJoin?width:.05*scale,.9,'join');continue;}
      if(n.type==='CH'||n.type==='MR')continue;
      const h=height(n),branch=n.branch||{index:0,count:1},side=(branch.index-(branch.count-1)/2)*width;

      const nominal=n.post?n.nominalLength:h;
      const rest=n.cable?Math.max(nominal,len(sub(at(n.id),anchorPoint(n.bodyAnchors)))):Math.hypot(nominal,side*.25);
      multi(n,rest,n.cable?.84:.94);
      if(map.get(n.previous)?.role==='turning')edge(n.id,n.previous,len(sub(at(n.id),at(n.previous))),.85,'turn');
      if(n.decrease>1){for(let i=0;i<n.parents.length;i++)edge(n.id,n.parents[i],Math.hypot(h,(i-(n.parents.length-1)/2)*width),.38,'post');}
      if(!n.cable&&!n.post&&n.branch?.count===1&&!n.spaceTarget&&n.parents.length===1&&map.get(n.parents[0])?.type!=='MR'){
        const parent=n.parents[0],pair=neighbours.get(parent)||[];
        pair.forEach((id,k)=>{
          if(!id||map.get(id).type==='CH')return;
          edge(n.id,id,Math.hypot(h,width+(k===0?-side:side)),.055,'shear');
        });
      }
    }

    const offsets=new Uint32Array(constraints.length+1),rests=new Float64Array(constraints.length),alpha=new Float64Array(constraints.length),lambda=new Float64Array(constraints.length),inverseDen=new Float64Array(constraints.length);
    let entries=0;for(let i=0;i<constraints.length;i++){offsets[i]=entries;entries+=constraints[i].ids.length;}offsets[constraints.length]=entries;
    const ids=new Uint32Array(entries),coeff=new Float64Array(entries);
    constraints.forEach((c,i)=>{let den=0;for(let j=0;j<c.ids.length;j++){const k=offsets[i]+j;ids[k]=(c.ids[j]-1)*3;coeff[k]=c.coeff[j];den+=c.coeff[j]*c.coeff[j];}rests[i]=c.rest;alpha[i]=c.kind==='bend'?.65:c.kind==='shear'?.45:c.kind==='post'?.008:.002;inverseDen[i]=1/(den+alpha[i]);});
    const bends=[];
    for(const row of physicalRows)for(let j=row.round?0:1;j<(row.round?row.ids.length:row.ids.length-1);j++){
      const n=map.get(row.ids[j]);if(n.type==='CH'||!n.anchors?.length)continue;
      bends.push([(row.ids[(j+row.ids.length-1)%row.ids.length]-1)*3,(n.id-1)*3,(row.ids[(j+1)%row.ids.length]-1)*3,(n.anchors[0].id-1)*3]);
    }
    const materialBend=.025+settings.bending*.0004,snapshot=new Float64Array(p.length);
    let iteration=0,collisionPairs=0,converged=false,stable=0,lastMovement=Infinity;
    let tableSize=1;while(tableSize<count*4)tableSize*=2;
    const buckets=new Int32Array(tableSize),next=new Int32Array(count),cx=new Int32Array(count),cy=new Int32Array(count),cz=new Int32Array(count),mask=tableSize-1;
    const hash=(x,y,z)=>(Math.imul(x,73856093)^Math.imul(y,19349663)^Math.imul(z,83492791))&mask;
    function collide(){
      const minimum=material.radiusMm*2.4,minSq=minimum*minimum,cell=minimum*1.05;let found=0;buckets.fill(-1);
      for(let i=0;i<count;i++){
        if(nodes[i].role==='turning'||nodes[i].role==='join'||nodes[i].type==='MR')continue;
        const k=i*3,x=cx[i]=Math.floor(p[k]/cell),y=cy[i]=Math.floor(p[k+1]/cell),z=cz[i]=Math.floor(p[k+2]/cell);
        for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++)for(let dz=-1;dz<=1;dz++){
          const xx=x+dx,yy=y+dy,zz=z+dz;let j=buckets[hash(xx,yy,zz)];
          while(j>=0){
            if(cx[j]===xx&&cy[j]===yy&&cz[j]===zz&&!links.has(key(i+1,j+1))){
              const q=j*3,vx=p[k]-p[q],vy=p[k+1]-p[q+1],vz=p[k+2]-p[q+2],ds=vx*vx+vy*vy+vz*vz;
              if(ds<minSq&&ds>1e-12){const d=Math.sqrt(ds),m=(minimum-d)/d*.35;p[k]+=vx*m;p[k+1]+=vy*m;p[k+2]+=vz*m;p[q]-=vx*m;p[q+1]-=vy*m;p[q+2]-=vz*m;found++;}
            }j=next[j];
          }
        }
        const h=hash(x,y,z);next[i]=buckets[h];buckets[h]=i;
      }collisionPairs=found;
    }
    function step(steps=1){
      for(let pass=0;pass<steps&&!converged;pass++,iteration++){
        if(iteration%8===0)snapshot.set(p);
        for(let index=0;index<constraints.length;index++){
          const c=iteration%2?constraints.length-1-index:index,start=offsets[c],end=offsets[c+1];let x=0,y=0,z=0;
          for(let e=start;e<end;e++){const k=ids[e],w=coeff[e];x+=p[k]*w;y+=p[k+1]*w;z+=p[k+2]*w;}
          const d=Math.sqrt(x*x+y*y+z*z);if(d<1e-9)continue;
          const dl=(-(d-rests[c])-alpha[c]*lambda[c])*inverseDen[c];lambda[c]+=dl;const factor=dl/d;
          for(let e=start;e<end;e++){const k=ids[e],m=coeff[e]*factor;p[k]+=x*m;p[k+1]+=y*m;p[k+2]+=z*m;}
        }

        for(const o of orders){const a=o.a,b=o.b,n=o.axis,d=(p[b]-p[a])*n[0]+(p[b+1]-p[a+1])*n[1]+(p[b+2]-p[a+2])*n[2];if(d<o.minimum){const m=(o.minimum-d)*.48;for(let k=0;k<3;k++){p[a+k]-=n[k]*m;p[b+k]+=n[k]*m;}}}
        for(const [a,k,b,base] of bends){
          const tx=p[b]-p[a],ty=p[b+1]-p[a+1],tz=p[b+2]-p[a+2],ux=p[k]-p[base],uy=p[k+1]-p[base+1],uz=p[k+2]-p[base+2];
          let nx=ty*uz-tz*uy,ny=tz*ux-tx*uz,nz=tx*uy-ty*ux;const length=Math.sqrt(nx*nx+ny*ny+nz*nz);if(length<1e-9)continue;nx/=length;ny/=length;nz/=length;
          const d=((p[k]-(p[a]+p[b])*.5)*nx+(p[k+1]-(p[a+1]+p[b+1])*.5)*ny+(p[k+2]-(p[a+2]+p[b+2])*.5)*nz)*materialBend;p[k]-=nx*d;p[k+1]-=ny*d;p[k+2]-=nz*d;
        }
        if(iteration%8===0)collide();
        const first=physicalRows[0];
        if(first&&!first.round){
          const middle=first.ids[Math.floor(first.ids.length/2)],k=(middle-1)*3,dx=p[k]-seed[k],dy=p[k+1]-seed[k+1],dz=p[k+2]-seed[k+2];
          for(let j=0;j<p.length;j+=3){p[j]-=dx;p[j+1]-=dy;p[j+2]-=dz;}
          for(const id of [first.ids[0],first.ids.at(-1)]){const j=(id-1)*3;p[j+1]+=(seed[j+1]-p[j+1])*.08;p[j+2]+=(seed[j+2]-p[j+2])*.08;}
        }else if(nodes[0]?.type==='MR'){const dx=p[0],dy=p[1],dz=p[2];for(let j=0;j<p.length;j+=3){p[j]-=dx;p[j+1]-=dy;p[j+2]-=dz;}}
        if(iteration%8===7){let move=0;for(let k=0;k<p.length;k++)move=Math.max(move,Math.abs(p[k]-snapshot[k]));lastMovement=move/width;stable=iteration>63&&lastMovement<.0004?stable+1:0;converged=stable>=3;}
      }
    }
    function finish(){
      for(const n of nodes){const q=at(n.id);n.x=q[0];n.y=q[1];n.z=q[2];n.restHeight=height(n);n.restWidth=cellWidths[n.id-1];n.yarnRadius=material.radiusMm;n.headHeightScale=Math.min(1,material.heightScale);}
      for(const row of physicalRows){
        row.ids.forEach((id,i)=>{
          const n=map.get(id),left=at(row.ids[Math.max(0,i-1)]),right=at(row.ids[Math.min(row.ids.length-1,i+1)]);
          const tangent=row.round?unit(sub(at(row.ids[(i+1)%row.ids.length]),at(row.ids[(i+row.ids.length-1)%row.ids.length]))):unit(sub(right,left),[row.dir,0,0]);
          let up=n.anchors?.length?sub(at(id),anchorPoint(n.anchors)):row.round?unit([n.x,n.y,0]):[0,1,0];
          if(n.type==='CH')up=row.round?unit([n.x,n.y,0]):[0,1,0];
          up=sub(up,mul(tangent,dot(up,tangent)));
          if(len(up)<1e-7){up=cross([0,0,1],tangent);if(len(up)<1e-7)up=cross([0,1,0],tangent);}
          up=unit(up,[0,1,0]);
          const normal=unit(cross(tangent,up),[0,0,row.dir]);
          n.frame={u:tangent,v:up,n:normal};
        });
      }
      for(const n of nodes){
        if(n.role==='turning'||n.countedTurn){
          const prev=map.get(n.previous),group=countedMembers.get(n.id),normal=group?.head.frame?.n||prev.frame?.n||[0,0,n.dir];
          const tangent=unit(sub(point(n),point(prev)),[0,1,0]),side=unit(cross(normal,tangent),[-1,0,0]);
          n.frame={u:tangent,v:side,n:unit(cross(tangent,side),normal)};
        }else if(n.role==='join'&&!n.countedJoin)n.frame=map.get(n.parents[0]).frame;
        if(!n.frame)n.frame={u:[1,0,0],v:[0,1,0],n:[0,0,1]};
        n.footprints=[];
        if(n.anchors?.length){
          const b=anchorPoint(n.anchors),parent=map.get(n.anchors[0].id),f=parent.frame;
          if(n.decrease>1&&!n.spaceTarget){
            n.footprints=n.parents.map(id=>{const a=map.get(id);return {position:point(a),u:a.frame.u,n:a.frame.n,target:id};});
          }else{
            const siblings=n.branch?.count||1,offset=(n.branch.index-(siblings-1)/2)*Math.min(.19*scale,width/Math.max(2,siblings));
            const offsetU=n.spaceTarget?n.frame.u:f.u;
            const position=add(b,mul(n.frame.u,n.spaceTarget?0:offset));
            n.footprints=[{position:n.post?anchorPoint(n.bodyAnchors):position,u:offsetU,n:n.frame.n,target:parent.id,space:!!n.spaceTarget,post:!!n.post}];
          }
        }
      }
      for(const cable of graph.cables||[]){
        const row=physicalRows.find(r=>r.index===cable.row),nonCable=row.ids.map(id=>map.get(id)).filter(n=>!n.cable&&n.type!=='CH');
        const normals=(nonCable.length?nonCable:row.ids.map(id=>map.get(id))).map(n=>n.frame.n);
        cable.normal=unit(average(normals),[0,0,row.dir]);
        for(const id of cable.groups.flat())map.get(id).cable.normal=[...cable.normal];
      }
      for(const s of graph.spaces){const q=average(s.ids.map(at));s.x=q[0];s.y=q[1];s.z=q[2];}
      let sq=0,max=0,total=0;
      for(const c of constraints.filter(c=>c.kind==='post'||c.kind==='row')){
        const d=c.ids.reduce((v,id,j)=>add(v,mul(at(id),c.coeff[j])),[0,0,0]);
        const e=Math.abs(len(d)-c.rest)/Math.max(.1,c.rest);sq+=e*e;max=Math.max(max,e);total++;
      }
      graph.material=material;
      graph.physics={iterations:iteration,constraints:constraints.length,rmsStrain:Math.sqrt(sq/Math.max(1,total)),maxStrain:max,contactPairs:collisionPairs,
        mode:settings.relax?'compliant':'seed',tension:settings.tension,bending:settings.bending,converged,lastMovement,solver:'sparse-XPBD',postFootprints:true};
      return graph;
    }
    return {step,finish,settings,positions:p,constraints,width,height};
  }
  function iterations(options){return options?.relax===false?0:options?.quality==='fine'?480:options?.quality==='quick'?128:256;}
  function solve(graph,options={}){const solver=create(graph,options);solver.step(iterations(options));return solver.finish();}
  async function settle(graph,options={},onProgress){
    const solver=create(graph,options),total=iterations(options);
    for(let j=0;j<total;j+=32){solver.step(Math.min(32,total-j));onProgress?.(Math.min(total,j+32)/total);await new Promise(resolve=>setTimeout(resolve,0));}
    return solver.finish();
  }
  function workerSource(){return 'const YarnProfile=('+YarnProfile.factorySource()+')();const Fabric=('+makeFabric.toString()+')(YarnProfile);self.onmessage=async(e)=>{try{const graph=await Fabric.settle(e.data.graph,e.data.options,p=>self.postMessage({progress:p}));self.postMessage({graph});}catch(error){self.postMessage({error:error.message});}};';}
  return {create,solve,settle,iterations,workerSource,HEIGHT,factorySource:()=>makeFabric.toString()};
});
