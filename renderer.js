(function () {
  'use strict';
  const T=window.THREE;
  const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
  class YarnView {
    constructor(container,onPick) {
      this.container=container;this.onPick=onPick;this.meshes=[];this.materials=new Map();this.needsRender=true;
      this.scene=new T.Scene();
      this.camera=new T.PerspectiveCamera(35,1,.1,1200);
      this.renderer=new T.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1,2));
      this.renderer.setClearColor(0xfbf8f1,1);
      this.renderer.outputColorSpace=T.SRGBColorSpace;
      this.renderer.toneMapping=T.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure=1.25;
      this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;
      container.appendChild(this.renderer.domElement);
      this.scene.add(new T.HemisphereLight(0xffffff,0xc5c9b1,2.2));
      const light=new T.DirectionalLight(0xfff6e8,3.1);light.position.set(-12,25,35);light.castShadow=true;
      light.shadow.mapSize.set(2048,2048);light.shadow.camera.left=-45;light.shadow.camera.right=45;
      light.shadow.camera.top=45;light.shadow.camera.bottom=-45;light.shadow.camera.far=160;
      light.shadow.bias=-.0004;light.shadow.normalBias=.025;light.shadow.radius=3;
      this.scene.add(light);this.scene.add(light.target);this.keyLight=light;
      const fill=new T.DirectionalLight(0xdde9ff,1);fill.position.set(12,-5,10);this.scene.add(fill);
      this.yarn=new T.Group();this.scene.add(this.yarn);
      const paper=new T.Mesh(new T.PlaneGeometry(800,800),new T.ShadowMaterial({color:0x58654f,opacity:.1}));
      paper.position.z=-.58;paper.receiveShadow=true;this.scene.add(paper);this.paper=paper;
      this.markers=new T.Group();this.scene.add(this.markers);
      this.target=V();this.yaw=-.28;this.pitch=.24;this.distance=36;this.fitDistance=36;
      this.raycaster=new T.Raycaster();this.pointer=new T.Vector2();
      this.bindControls();
      this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(container);
      const draw=()=>{if(this.needsRender){this.updateCamera();this.renderer.render(this.scene,this.camera);this.needsRender=false;}this.raf=requestAnimationFrame(draw);};draw();
    }
    resize() {
      const w=this.container.clientWidth,h=this.container.clientHeight;
      if (!w||!h) return;
      this.renderer.setSize(w,h);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();if(this.graph&&this.autoFit)this.fit();this.needsRender=true;
    }
    updateCamera() {
      this.camera.position.set(this.target.x+Math.sin(this.yaw)*Math.cos(this.pitch)*this.distance,this.target.y+Math.sin(this.pitch)*this.distance,this.target.z+Math.cos(this.yaw)*Math.cos(this.pitch)*this.distance);
      this.camera.far=Math.max(5000,this.distance*8);this.camera.near=Math.max(.01,this.distance/2000);this.camera.updateProjectionMatrix();
      this.camera.lookAt(this.target);this.camera.updateMatrixWorld();
    }
    bindControls() {
      const el=this.renderer.domElement,pointers=new Map();let start=null,moved=0,lastPinch=0;
      el.addEventListener('contextmenu',e=>e.preventDefault());
      el.addEventListener('pointerdown',e=>{
        el.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
        start={x:e.clientX,y:e.clientY};moved=0;lastPinch=0;
      });
      el.addEventListener('pointermove',e=>{
        if(!pointers.has(e.pointerId))return;
        const old=pointers.get(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
        const dx=e.clientX-old.x,dy=e.clientY-old.y;moved+=Math.abs(dx)+Math.abs(dy);if(moved>3)this.autoFit=false;
        if(pointers.size===2){
          const p=[...pointers.values()],dist=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);
          if(lastPinch)this.distance=Math.max(1,Math.min(50000,this.distance*lastPinch/dist));lastPinch=dist;
        }else if(e.shiftKey || e.buttons===2){
          const scale=this.distance*.0007;
          const right=V().setFromMatrixColumn(this.camera.matrixWorld,0),up=V().setFromMatrixColumn(this.camera.matrixWorld,1);
          this.target.addScaledVector(right,-dx*scale).addScaledVector(up,dy*scale);
        }else{this.yaw-=dx*.007;this.pitch=Math.max(-1.45,Math.min(1.45,this.pitch+dy*.007));}
        this.needsRender=true;
      });
      const end=e=>{
        if(start&&moved<6&&pointers.size===1){this.pick(e);}
        pointers.delete(e.pointerId);lastPinch=0;if(!pointers.size)start=null;
      };
      el.addEventListener('pointerup',end);el.addEventListener('pointercancel',e=>{pointers.delete(e.pointerId);start=null;});
      el.addEventListener('wheel',e=>{e.preventDefault();this.autoFit=false;this.distance=Math.max(1,Math.min(50000,this.distance*Math.exp(e.deltaY*.001)));this.needsRender=true;},{passive:false});
    }
    pick(e) {
      const r=this.renderer.domElement.getBoundingClientRect();
      this.pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);
      this.raycaster.setFromCamera(this.pointer,this.camera);
      const hits=this.raycaster.intersectObjects(this.yarn.children,true).filter(h=>h.object.visible && h.object.parent.visible && !h.object.userData.future);
      if(hits.length){const id=YarnBatches.Builder.pick(hits[0]);if(id)this.onPick?.(id);}
    }
    clearGroup(group) {
      group.traverse(o=>{if(o.geometry)o.geometry.dispose();});group.clear();
    }
    material(colour) {
      if(this.materials.has(colour))return this.materials.get(colour);
      const ghost=colour.endsWith('-ghost'),base=ghost?colour.slice(0,-6):colour;
      const m=new T.MeshStandardMaterial({color:base,roughness:.9,metalness:0,transparent:ghost,opacity:ghost?.10:1,depthWrite:!ghost});
      this.materials.set(colour,m);return m;
    }
    pointsFor(node,map) {
      return YarnGeometry.rawPath(node,map,this.radius||YarnProfile.resolve().radiusMm).points.map(p=>V(...p));
    }
    tube(points,radius,colours,stitch,detailed,phaseOffset=0) {
      this.carry ||= {};
      return YarnBatches.tube(points,radius,colours,stitch,detailed,phaseOffset,c=>this.material(c),this.carry);
    }
    geometryWorkerSource(){
      return 'const YarnProfile=('+YarnProfile.factorySource()+')();const Fabric=('+Fabric.factorySource()+')(YarnProfile);const YarnGeometry=('+YarnGeometry.factorySource()+')(YarnProfile);const YarnMeshCore=('+YarnBatches.Core.factorySource()+')();self.onmessage=async(e)=>{try{const {options,doLayout}=e.data;const graph=doLayout?await Fabric.settle(e.data.graph,options,p=>self.postMessage({phase:"Settling fabric",progress:p})):e.data.graph;self.postMessage({phase:"Constructing stitches",progress:0});const paths=YarnGeometry.generate(graph,options);graph.yarnContacts=await YarnGeometry.relaxContacts(paths,options,p=>self.postMessage({phase:"Relaxing yarn contacts",progress:p}));const packer=new YarnMeshCore.Builder(),carry={};let length=0;for(let i=0;i<paths.length;i++){length+=packer.addPath(paths[i],graph.nodes[i],options,graph.material.radiusMm,length,carry);if(i%32===31)self.postMessage({phase:"Building ply meshes",progress:(i+1)/paths.length});}const meshData=packer.finish();self.postMessage({graph,paths:paths.map(p=>({id:p.id,landmarks:p.landmarks})),meshData},YarnMeshCore.transfers(meshData));}catch(error){self.postMessage({error:error.message});}};';
    }
    async prepareGeometry(graph,settings,doLayout,token,onProgress){
      const fallback=async()=>{
        const report=(phase,p)=>{if(token!==this.buildToken)throw new Error('Build cancelled');onProgress?.({phase,progress:p});};
        if(doLayout)graph=await Fabric.settle(graph,settings,p=>report('Settling fabric',p));
        report('Constructing stitches',0);
        const paths=YarnGeometry.generate(graph,settings);
        graph.yarnContacts=await YarnGeometry.relaxContacts(paths,settings,p=>report('Relaxing yarn contacts',p));
        const packer=new YarnBatches.Core.Builder(),carry={};let length=0;
        for(let i=0;i<paths.length;i++){
          if(token!==this.buildToken)throw new Error('Build cancelled');
          length+=packer.addPath(paths[i],graph.nodes[i],settings,graph.material.radiusMm,length,carry);
          if(i%32===31){report('Building ply meshes',(i+1)/paths.length);await new Promise(resolve=>setTimeout(resolve,0));}
        }
        const meshData=packer.finish();
        return {graph,paths:paths.map(p=>({id:p.id,landmarks:p.landmarks})),meshData};
      };
      if(typeof Worker==='undefined')return fallback();
      return new Promise((resolve,reject)=>{
        let worker,url,done=false,fallbackStarted=false;
        const finish=(value,error)=>{
          if(done)return;done=true;worker?.terminate();if(url)URL.revokeObjectURL(url);
          if(this.cancelWorker===cancel)this.cancelWorker=null;
          error?reject(error):resolve(value);
        };
        const cancel=()=>finish(null);this.cancelWorker=cancel;
        const useFallback=()=>{
          if(done||fallbackStarted)return;fallbackStarted=true;worker?.terminate();if(url){URL.revokeObjectURL(url);url=null;}
          fallback().then(value=>finish(value),error=>finish(null,error));
        };
        try{
          url=URL.createObjectURL(new Blob([this.geometryWorkerSource()],{type:'text/javascript'}));worker=new Worker(url);
          worker.onmessage=e=>{
            if(token!==this.buildToken){finish(null);return;}
            if(e.data.error)finish(null,new Error(e.data.error));
            else if(e.data.paths)finish(e.data);
            else onProgress?.(e.data);
          };
          worker.onerror=useFallback;worker.postMessage({graph,options:settings,doLayout});
        }catch(_){useFallback();}
      });
    }
    cancelBuild(){this.buildToken=(this.buildToken||0)+1;this.cancelWorker?.();}
    async build(input,rawSettings,{fit=true,onProgress}={}) {
      const settings=YarnProfile.normalise(rawSettings),profile=YarnProfile.resolve(settings);
      const token=this.buildToken=(this.buildToken||0)+1;this.cancelWorker?.();
      const layoutKey=JSON.stringify([input.source,input.terminology,profile.key,settings.bending,settings.quality,settings.relax]);
      const shapeKey=layoutKey+'|contacts:'+settings.yarnContacts,meshKey=shapeKey+'|'+settings.renderMode;
      if(this.meshKey===meshKey&&this.batchSet){this.batchSet.recolour(settings);this.needsRender=true;return true;}
      let graph,paths,meshData;
      try{
        const reusable=this.layoutKey===layoutKey&&this.graph;
        const result=await this.prepareGeometry(reusable||input,settings,!reusable,token,onProgress);
        if(!result||token!==this.buildToken)return false;({graph,paths,meshData}=result);
      }catch(error){if(token!==this.buildToken)return false;throw error;}
      if(token!==this.buildToken)return false;
      const radius=profile.radiusMm,builder=new YarnBatches.Builder(c=>this.material(c));
      try{builder.consume(meshData,settings);}catch(error){this.clearGroup(builder.group);throw error;}
      if(token!==this.buildToken){this.clearGroup(builder.group);return false;}
      this.clearGroup(this.yarn);this.yarn.add(...builder.group.children.slice());this.batchSet=builder;this.meshes=builder.batches.map(b=>b.mesh);
      this.graph=graph;this.radius=radius;this.layoutKey=layoutKey;this.geometryKey=shapeKey;this.meshKey=meshKey;this.yarnPaths=paths;
      const bounds=new T.Box3().setFromObject(this.yarn),size=bounds.getSize(V());
      this.pieceDimensions={widthMm:size.x,heightMm:size.y,depthMm:size.z};
      this.paper.position.z=bounds.min.z-radius*2;this.paper.scale?.setScalar(Math.max(1,size.length()/150));
      if(this.keyLight){
        const centre=bounds.getCenter(V()),extent=Math.max(size.x,size.y,size.z,20);
        this.keyLight.position.copy(centre).add(V(-extent*.7,extent,extent*1.5));this.keyLight.target.position.copy(centre);
        const c=this.keyLight.shadow.camera;c.left=-extent;c.right=extent;c.top=extent;c.bottom=-extent;c.far=extent*6+100;c.updateProjectionMatrix();
        this.keyLight.shadow.normalBias=radius*.12;this.keyLight.shadow.needsUpdate=true;
      }
      if(fit)this.fit();this.needsRender=true;return true;
    }
    fit() {
      if(!this.graph)return;this.autoFit=true;
      const box=new T.Box3().setFromObject(this.yarn),size=box.getSize(V());this.target.copy(box.getCenter(V()));
      this.fitDistance=Math.max(size.y,size.x/this.camera.aspect)*.5/Math.tan(this.camera.fov*Math.PI/360)*1.22;
      this.distance=Math.max(5,this.fitDistance+size.z*.7);this.needsRender=true;
    }
    setView(view) {
      this.yaw=view==='back'?Math.PI:view==='front'?0:view==='edge'?Math.PI/2:-.28;this.pitch=view==='angle'?.24:0;this.needsRender=true;
    }
    setProgress(count,{future=false,mark=true,finished=false}={}) {
      this.clearGroup(this.markers);
      const selected=finished?null:this.graph?.nodes[count-1];
      this.batchSet?.progress(count,future);
      const scale=this.graph?.material?.scale||1;
      if(selected && mark){
        const addMarker=(pos,r,colour,normal)=>{
          const axis=V(...(normal||[0,0,1]));
          const m=new T.Mesh(new T.TorusGeometry(r,.02*scale,7,40),this.material(colour));
          m.quaternion.setFromUnitVectors(V(0,0,1),axis);m.position.copy(pos).addScaledVector(axis,.28*scale);this.markers.add(m);
        };
        addMarker(V(selected.x,selected.y,selected.z),.38*scale,'#bc765e',selected.frame?.n);
        for(const foot of this.yarnPaths?.[count-1]?.landmarks.feet||[])
          addMarker(V(...foot.position),.20*scale,'#d19b4a',selected.frame?.n);
      }
      this.needsRender=true;
    }
    focusStitch(id) {
      const n=this.graph?.nodes[id-1];if(!n)return;
      this.target.set(n.x,n.y,0);this.distance=Math.min(this.distance,(this.graph.material?.scale||1)*8);this.needsRender=true;
    }
    exportPNG() {this.updateCamera();this.renderer.render(this.scene,this.camera);return this.renderer.domElement.toDataURL('image/png');}
  }
  window.YarnView=YarnView;
})();
