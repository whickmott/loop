(function () {
  'use strict';
  const $=id=>document.getElementById(id);
  function pixelPattern(chart,palette){
    const width=chart[0].length;
    const lines=['COLOUR '+palette['.'],'CH '+(width+1)+', TURN'];
    function runs(row){
      const parts=[];
      for(let i=0;i<row.length;){
        let end=i+1;while(end<row.length&&row[end]===row[i])end++;
        parts.push('COLOUR '+palette[row[i]],'SLST '+(end-i));i=end;
      }
      return parts.join(', ');
    }
    for(const row of [...chart].reverse()){
      const reverse=[...row].reverse().join('');
      if(row===reverse)lines.push('['+runs(row)+', CH 1, TURN] x2');
      else lines.push(runs(reverse)+', CH 1, TURN',runs(row)+', CH 1, TURN');
    }
    return lines.join('\n');
  }
  const examples=[
    {"id":"swatch","group":"Start here","name":"Your first swatch","description":"16 stitches × 12 rows. Follow the foundation and turns, then change x10 to make the swatch taller.","source":"CH 17, TURN\nSC 16, CH 1, TURN\nREPEAT ROW 2 x10\nSC 16","yarn":{"colour":"#718E80"},"view":"front"},
    {"id":"counted","group":"Start here","name":"A square with counted turning chains","description":"12 stitches × 8 rows. CH 3* counts as the first stitch; each row then needs 11 DC in US terms, or 11 TR in UK terms.","source":"CH 11, CH 3*, TURN\nDC 11, CH 3*, TURN\nREPEAT ROW 2 x6\nDC 11","yarn":{"colour":"#D1937D"},"view":"front"},
    {"id":"ribbed","group":"Texture","name":"Ribbed cuff panel","description":"24 stitches × 16 rows. HDC BLO forms ridges across a flat cuff panel. Compare Front and Back to see the unused loops.","source":"CH 25, TURN\nHDCblo 24, CH 2, TURN\nREPEAT ROW 2 x14\nHDCblo 24","yarn":{"weight":"aran","colour":"#718E80"},"view":"angle"},
    {"id":"alternating","group":"Texture","name":"Alternating ribbing","description":"15 stitches × 16 rows. SC / HDC BLO repeats show how short and taller stitches build texture together.","source":"CH 16, TURN\nSC 15, CH 2, TURN\nSC 1 [HDCblo 1 SC 1] x7, CH 2, TURN\nREPEAT ROW 3 x13\nSC 1 [HDCblo 1 SC 1] x7","yarn":{"colour":"#B4CDDB"},"view":"angle"},
    {"id":"basketweave","group":"Texture","name":"Basketweave panel","description":"24 stitches × 18 rows. Three-post blocks switch every four rows. The nested repeats form raised, woven squares.","source":"CH 25, TURN\nDC 24, CH 3, TURN\n[[FPDC 3 BPDC 3] x4, CH 3, TURN] x4\n[[BPDC 3 FPDC 3] x4, CH 3, TURN] x4\nREPEAT ROWS 3-4 x1\nDC 24","yarn":{"weight":"aran","colour":"#C4AA87"},"view":"angle"},
    {"id":"mesh","group":"Lace & crossings","name":"Open mesh","description":"25 stitch positions × 10 rows. Eight chain spaces line up into an open grid; each CH 2 spans two skipped targets.","source":"CH 26, TURN\nDC 25, CH 3, TURN\nDC 1 [CH 2, SK 2, DC 1] x8, CH 3, TURN\nREPEAT ROW 3 x7\nDC 25","yarn":{"weight":"sport","colour":"#D1937D"},"view":"front"},
    {"id":"lace","group":"Lace & crossings","name":"Shell lace","description":"17 stitch positions × 10 rows. Alternate four chain arches with fans of three stitches worked into each named chain space.","source":"CH 18, TURN\nSC 17, CH 1, TURN\nSC 1 [CH 3, SK 3, SC 1] x4, CH 1, TURN\nSC 1, DC 3 INTO CH-SP 1, SC 1, DC 3 INTO CH-SP 2, SC 1, DC 3 INTO CH-SP 3, SC 1, DC 3 INTO CH-SP 4, SC 1, CH 1, TURN\nREPEAT ROWS 3-4 x3\nSC 17","yarn":{"colour":"#AFC6B5"},"view":"front"},
    {"id":"crossed","group":"Lace & crossings","name":"Crossed stitch panel","description":"16 stitches × 9 rows. Each pair skips a target, works ahead and returns INTO SKIPPED. Step through a pair to follow the crossing.","source":"CH 17, TURN\nDC 16, CH 3, TURN\n[SK 1, DC 1, DC 1 INTO SKIPPED] x8, CH 3, TURN\nREPEAT ROW 3 x6\nDC 16","yarn":{"colour":"#B4CDDB"},"view":"angle"},
    {"id":"ropes","group":"Lace & crossings","name":"Opposing rope cables","description":"24 stitches × 18 rows. Six-stitch ropes cross in opposite directions; back-post return rows keep the cables raised on the same face.","source":"CH 26 TURN\nSK 1 HDC 24 TURN\nCH 2 HDC 3 FPDC 6 HDC 6 FPDC 6 HDC 3 TURN\nCH 2 HDC 3 BPDC 6 HDC 6 BPDC 6 HDC 3 TURN\nCH 2 HDC 3 CABLE 3/3 FRONT FPTR HDC 6 CABLE 3/3 BACK FPTR HDC 3 TURN\nCH 2 HDC 3 BPDC 6 HDC 6 BPDC 6 HDC 3 TURN\nREPEAT ROWS 3-6 x3\nCH 2 HDC 3 FPDC 6 HDC 6 FPDC 6 HDC 3","yarn":{"weight":"aran","colour":"#B4CDDB"},"view":"front"},
    {"id":"diamond","group":"Shaping & rounds","name":"Shaped diamond","description":"15 rows, widening from 3 to 17 stitches and back to 3. Increases and decreases at both edges shape the fabric without skips.","source":"CH 4, TURN\nSC 3, CH 1, TURN\nINC 1, SC 1, INC 1, CH 1, TURN\nINC 1, SC 3, INC 1, CH 1, TURN\nINC 1, SC 5, INC 1, CH 1, TURN\nINC 1, SC 7, INC 1, CH 1, TURN\nINC 1, SC 9, INC 1, CH 1, TURN\nINC 1, SC 11, INC 1, CH 1, TURN\nINC 1, SC 13, INC 1, CH 1, TURN\nDEC 1, SC 13, DEC 1, CH 1, TURN\nDEC 1, SC 11, DEC 1, CH 1, TURN\nDEC 1, SC 9, DEC 1, CH 1, TURN\nDEC 1, SC 7, DEC 1, CH 1, TURN\nDEC 1, SC 5, DEC 1, CH 1, TURN\nDEC 1, SC 3, DEC 1, CH 1, TURN\nDEC 1, SC 1, DEC 1","yarn":{"colour":"#718E80"},"view":"front"},
    {"id":"coaster","group":"Shaping & rounds","name":"Striped round coaster","description":"Six rounds: 6, 12, 18, 24, 30 and 36 stitches. Six evenly spaced increases per round keep the disc flat; JOIN closes each round.","source":"MR, SC 6, JOIN\nINC 6, JOIN\nCOLOUR #D1937D\n[SC 1, INC 1] x6, JOIN\n[SC 2, INC 1] x6, JOIN\nCOLOUR #718E80\n[SC 3, INC 1] x6, JOIN\n[SC 4, INC 1] x6, JOIN","yarn":{"colour":"#E6D6BA"},"view":"front"},
    {"id":"basket","group":"Shaping & rounds","name":"Little basket","description":"Grow a six-round base to 36 stitches, turn the corner with a BLO round, then keep 36 stitches around the walls. A slip-stitch rim finishes it.","source":"MR, SC 6, JOIN\nINC 6, JOIN\n[SC 1, INC 1] x6, JOIN\n[SC 2, INC 1] x6, JOIN\n[SC 3, INC 1] x6, JOIN\n[SC 4, INC 1] x6, JOIN\nSCblo 36, JOIN\nSC 36, JOIN\nREPEAT ROW 8 x7\nSLST 36, JOIN","yarn":{"weight":"chunky","colour":"#C4AA87"},"view":"angle"},
    {"id":"heart","group":"Pixel colourwork","name":"Pixel heart","description":"15 stitches × 26 rows, two colours. Each pixel is two slip-stitch rows high; colour runs reverse on return rows to preserve the chart.","yarn":{"colour":"#E9DCCB"},"view":"front","source":pixelPattern(["...............","...HHH...HHH...","..HHHHH.HHHHH..",".HHHHHHHHHHHHH.",".HHHHHHHHHHHHH.",".HHHHHHHHHHHHH.","..HHHHHHHHHHH..","...HHHHHHHHH...","....HHHHHHH....",".....HHHHH.....","......HHH......",".......H.......","..............."],{".":"#E9DCCB","H":"#C8758C"})},
    {"id":"robot","group":"Pixel colourwork","name":"Pixel robot","description":"29 stitches × 66 rows, six colours. A larger slip-stitch chart with a face, control panel and contrasting details. Open Front to read the motif.","yarn":{"colour":"#EFE4CF"},"view":"front","source":pixelPattern([".............................",".............NNN.............",".............NRN.............",".............NNN.............","..............N..............","..............N..............","......NNNNNNNNNNNNNNNNN......","......NTLLLLLLLLLLLLLTN......","......NTTTTTTTTTTTTTTTN......","....NNNTNNNNNTTTNNNNNTNNN....","....NGNTNLNLNTTTNLNLNTNGN....","....NGNTNLNLNTTTNLNLNTNGN....","....NGNTNNNNNTTTNNNNNTNGN....","....NNNTTTTTTTTTTTTTTTNNN....","......NTTTNLLLLLLLNTTTN......","......NTTTTTTTTTTTTTTTN......","......NNNNNNNNNNNNNNNNN......","............NGGGN............",".......NNNNNNNNNNNNNNN.......","....NNNNTLLLLLLLLLLLTNNNN....","....NTNNTTTTTTTTTTTTTNNTN....","....NTNNTTNNNNNNNNNTTNNTN....","....NTNNTTNLRRLLGLNTTNNTN....","....NTNNTTNLLLLLGLNTTNNTN....","....NNNNTTNNNNNNNNNTTNNNN....","...NNNNNTTTTTTTTTTTTTNNNNN...","...NGGGNNNNNNNNNNNNNNNGGGN...","...NNNNN.NLLN...NLLN.NNNNN...",".........NLLN...NLLN.........",".........NNNN...NNNN.........",".......NTTTTTN.NTTTTTN.......",".......NNNNNNN.NNNNNNN.......","............................."],{".":"#EFE4CF","N":"#263449","T":"#4C9DA5","L":"#B9E4DE","G":"#E5B24A","R":"#D66C64"})}
  ];
  const presets=Object.fromEntries(examples.map(example=>[example.id,example.source]));
  let graph=null,view=null,count=0,finished=true,playing=false,playTime=0,lastFrame=0,building=false;
  const solverDefaults={bending:45,quality:'balanced',relax:true,renderMode:'full',yarnContacts:true};
  const defaults={...YarnProfile.defaults,colour:'#718e80',secondColour:'#e6d6ba',marled:false,tension:100,bending:45,quality:'balanced',relax:true};
  let settings={...defaults};
  let terminology='US',dirty=false,rebuildTimer=null;
  const mobileLayout=window.matchMedia('(max-width:760px)');
  function showPane(pane){
    document.body.dataset.mobilePane=pane;
    for(const name of ['pattern','preview'])$(name+'-panel').hidden=mobileLayout.matches&&pane!==name;
    document.querySelectorAll('[data-pane]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.pane===pane)));
  }
  document.querySelectorAll('[data-pane]').forEach(button=>button.addEventListener('click',()=>showPane(button.dataset.pane)));
  mobileLayout.addEventListener('change',()=>{
    const editing=$('pattern-panel').contains(document.activeElement);
    showPane(editing?'pattern':document.body.dataset.mobilePane||'preview');
  });
  showPane(document.body.dataset.mobilePane||'preview');
  let timelineCollapsed=false;
  function setTimelineCollapsed(collapsed,persist=true){
    timelineCollapsed=collapsed;
    $('timeline-content').hidden=collapsed;
    $('timeline-panel').classList.toggle('collapsed',collapsed);
    $('toggle-timeline').setAttribute('aria-expanded',String(!collapsed));
    $('toggle-timeline').setAttribute('aria-label',(collapsed?'Show':'Hide')+' Follow the pattern panel');
    $('timeline-toggle-label').textContent=collapsed?'Show':'Hide';
    if(persist)try{localStorage.setItem('loop-timeline-collapsed',String(collapsed));}catch(_){}
  }
  $('toggle-timeline').addEventListener('click',()=>setTimelineCollapsed(!timelineCollapsed));
  try{setTimelineCollapsed(localStorage.getItem('loop-timeline-collapsed')==='true',false);}catch(_){}

  function convertTerms(text,from,to) {
    if(from===to)return text;
    const us={SC:'SC',HDC:'HDC',DC:'DC',TR:'TR',DTR:'DTR'};
    const uk={DC:'SC',HTR:'HDC',TR:'DC',DTR:'TR',TTR:'DTR'};
    const output=to==='UK'?{SC:'DC',HDC:'HTR',DC:'TR',TR:'DTR',DTR:'TTR'}:us;
    const input=from==='UK'?uk:us;
    return text.replace(/\b(FP|BP)?(SC|HDC|DC|TR|DTR|HTR|TTR)(\d+TOG)?(BLO|FLO)?\b/gi,(whole,post,st,tog,loop)=>{
      const canonical=input[st.toUpperCase()];return canonical?(post||'')+output[canonical]+(tog||'')+(loop||''):whole;
    });
  }
  function diagnostics(message,error=false,warnings=[]) {
    const el=$('diagnostics');el.className=error?'error':'';el.textContent=message;
    for(const w of warnings){const p=document.createElement('div');p.className='warn';p.textContent=w;el.appendChild(p);}
  }
  function lineNumbers() {
    $('line-numbers').textContent=$('pattern').value.split('\n').map((_,i)=>i+1).join('\n');
    $('line-numbers').scrollTop=$('pattern').scrollTop;
  }
  function persist() {
    try{localStorage.setItem('loop-project-v1',JSON.stringify(project()));}catch(_){                                                     }
  }
  function project() {return {app:'Loop',version:Crochet.VERSION,pattern:$('pattern').value,terminology:$('terminology').value,yarn:settings};}
  function restore(payload) {
    if(typeof payload.pattern!=='string')throw new Error('This project has no pattern text.');
    $('pattern').value=payload.pattern;
    terminology=payload.terminology==='UK'?'UK':'US';$('terminology').value=terminology;
    const s=payload.yarn||{};
    const colour=v=>/^#[0-9a-f]{6}$/i.test(v||'');
    const profile=YarnProfile.normalise(s);
    const tension=[85,100,115].reduce((best,n)=>Math.abs(n-(+s.tension||100))<Math.abs(best-(+s.tension||100))?n:best,100);
    settings={...defaults,...profile,...solverDefaults,colour:colour(s.colour)?s.colour:'#718e80',secondColour:colour(s.secondColour)?s.secondColour:'#e6d6ba',marled:!!s.marled,tension};
    syncYarn();lineNumbers();matchExample();
  }
  function syncYarn() {
    settings={...YarnProfile.normalise(settings),...solverDefaults};
    const profile=YarnProfile.resolve(settings);
    $('yarn-weight').value=settings.weight;$('hook-size').value=settings.hookMm;$('auto-hook').checked=settings.autoHook;
    $('strand-diameter').value=profile.strandDiameterMm;$('use-gauge').checked=settings.useGauge;
    $('gauge-stitches').value=settings.gaugeStitches;$('gauge-rows').value=settings.gaugeRows;
    $('gauge-stitches').disabled=!settings.useGauge;$('gauge-rows').disabled=!settings.useGauge;
    $('material-summary').textContent=`${profile.measuredGauge?'Measured':'Estimated'} gauge: ${profile.estimatedGaugeStitches.toFixed(1)} stitches × ${profile.estimatedGaugeRows.toFixed(1)} rows per 10 cm (${terminology==='UK'?'DC':'SC'}).`;
    $('tension').value=settings.tension;
    $('yarn-colour').value=settings.colour;$('second-colour').value=settings.secondColour;
    $('marled').checked=settings.marled;
    $('second-colour').disabled=!settings.marled;

    for(const [id,key]of[['main-colour-hex','colour'],['second-colour-hex','secondColour']]){
      if(document.activeElement!==$(id))$(id).value=settings[key].toUpperCase();
    }
    $('second-colour-hex').disabled=!settings.marled;$('second-thread').classList.toggle('inactive',!settings.marled);
  }
  async function generate() {
    if(building)return;
    if(!view){diagnostics($('loading-message').textContent,true);return;}
    stop();let next;
    try{next=Crochet.compile($('pattern').value,{terminology:$('terminology').value});}
    catch(e){diagnostics(`Line ${e.line||1}: ${e.message}`,true);return;}
    const generationStarted=performance.now();
    building=true;$('generate').disabled=true;$('pattern').disabled=true;$('example').disabled=true;$('terminology').disabled=true;
    document.querySelectorAll('.yarn-controls input,.yarn-controls select,#reset-yarn,#import-button,#file-input').forEach(el=>el.disabled=true);
    $('loading').style.display='flex';$('cancel-build').hidden=false;$('loading-message').textContent='Generating your yarn…';
    diagnostics('Building yarn geometry…');
    await new Promise(resolve=>requestAnimationFrame(()=>setTimeout(resolve,0)));
    try{
      const success=await view.build(next,settings,{onProgress:reportProgress});
      if(!success){diagnostics('Generation cancelled.');return;}
      graph=view.graph;count=graph.nodes.length;finished=true;dirty=false;
      $('progress').max=graph.nodes.length;$('progress').value=count;
      const worked=graph.rows.filter(r=>r.index>0).length,stitches=graph.rows.filter(r=>r.index>0).reduce((n,r)=>n+r.ids.length,0);
      $('mesh-stats').textContent=`${stitches} stitches · ${worked} ${graph.rows.some(r=>r.round)?'rounds':'rows'}`;
      diagnostics(`${graph.rows.filter(r=>r.index>0).reduce((n,r)=>n+r.ids.length,0)} stitches · ${((performance.now()-generationStarted)/1000).toFixed(1)} s`,false,graph.warnings.slice(0,3));
      showPane('preview');updateDimensions();buildRowList();updateProgress();persist();
    }catch(e){diagnostics(`Could not generate the yarn: ${e.message}`,true);}
    finally{
      building=false;$('generate').disabled=false;$('pattern').disabled=false;$('example').disabled=false;$('terminology').disabled=false;
      document.querySelectorAll('.yarn-controls input,.yarn-controls select,#reset-yarn,#import-button,#file-input').forEach(el=>el.disabled=false);syncYarn();
      $('loading').style.display='none';$('cancel-build').hidden=true;
    }
  }
  function updateDimensions(){const d=view.pieceDimensions;if(d)$('piece-size').textContent=`Approx. ${(d.widthMm/10).toFixed(1)} × ${(d.heightMm/10).toFixed(1)} cm`;}
  function reportProgress({phase,progress}){$('loading-message').textContent=phase+'… '+Math.round((progress||0)*100)+'%';diagnostics(phase+'…');}
  function buildRowList() {
    $('row-list').replaceChildren();
    for(const row of graph.rows){
      const b=document.createElement('button');b.className='row-chip';b.dataset.row=row.index;
      b.textContent=row.index===0?'Foundation':`${row.round?'Round':'Row'} ${row.index}`;
      const small=document.createElement('small');small.textContent=`${row.ids.length} stitches`;b.appendChild(small);
      b.title='Show this row, then use the timeline to step through its stitches.';
      b.addEventListener('click',()=>{stop();count=Math.max(...row.ids);finished=false;updateProgress();});
      $('row-list').appendChild(b);
    }
  }
  function updateProgress() {
    if(!graph)return;
    count=Math.max(0,Math.min(graph.nodes.length,count));$('progress').value=count;
    $('progress-label').textContent=`${count} / ${graph.nodes.length}`;
    $('progress').setAttribute('aria-valuetext',finished?`Finished piece, ${count} stitches`:`Stitch ${count} of ${graph.nodes.length}`);
    view.setProgress(count,{future:$('show-future').checked,mark:$('show-target').checked,finished});
    if(count===0){$('stitch-label').textContent='Before the first stitch';$('stitch-description').textContent='Press play or step forward to build the pattern.';}
    else if(finished){$('stitch-label').textContent='Finished piece';$('stitch-description').textContent='Click a stitch to inspect its target, or move the timeline to follow the construction.';}
    else{
      const node=graph.nodes[count-1],type=displayType(node.type)+(node.loop==='both'?'':` ${node.loop.toUpperCase()}`)+(node.post?` ${node.post}`:'');
      $('stitch-label').textContent=`Stitch ${node.id} · ${type} · ${node.row===0?'Foundation':`${node.round?'Round':'Row'} ${node.row}`}`;
      $('stitch-description').textContent=Crochet.describe(node,graph.terminology)+` Source line ${node.line}.`;
    }
    const node=graph.nodes[count-1];
    document.querySelectorAll('.row-chip').forEach(b=>b.classList.toggle('selected',!finished&&node&&+b.dataset.row===node.row));
  }
  function displayType(type) {return graph?.terminology==='UK'?({SC:'DC',HDC:'HTR',DC:'TR',TR:'DTR',DTR:'TTR'})[type]||type:type;}
  function stop(){playing=false;$('play').textContent='Play';$('play').setAttribute('aria-label','Play construction');}
  function step(delta){if(!graph)return;stop();count+=delta;finished=false;updateProgress();}
  function tick(time){
    if(playing&&!building&&graph){
      playTime+=(time-lastFrame)/1000;
      const interval=1/+$('speed').value;
      if(playTime>=interval){count+=Math.floor(playTime/interval);playTime%=interval;finished=false;if(count>=graph.nodes.length){count=graph.nodes.length;stop();}updateProgress();}
    }
    lastFrame=time;requestAnimationFrame(tick);
  }
  async function rebuildYarn(){
    syncYarn();persist();
    if(!graph||building)return;
    building=true;stop();$('loading').style.display='flex';$('cancel-build').hidden=false;$('generate').disabled=true;
    $('pattern').disabled=true;$('example').disabled=true;$('terminology').disabled=true;
    document.querySelectorAll('.yarn-controls input,.yarn-controls select,#reset-yarn,#import-button,#file-input').forEach(el=>el.disabled=true);
    try{
      const resizing=view.graph?.material?.key!==YarnProfile.resolve(settings).key;
      const success=await view.build(graph,settings,{fit:resizing,onProgress:reportProgress});
      if(success){graph=view.graph;updateDimensions();updateProgress();diagnostics(`${graph.rows.filter(r=>r.index>0).reduce((n,r)=>n+r.ids.length,0)} stitches · Yarn updated.`,false,graph.warnings.slice(0,3));}
      else diagnostics('Generation cancelled.');
    }catch(e){diagnostics(e.message,true);}
    finally{building=false;$('loading').style.display='none';$('cancel-build').hidden=true;$('generate').disabled=false;$('pattern').disabled=false;$('example').disabled=false;$('terminology').disabled=false;document.querySelectorAll('.yarn-controls input,.yarn-controls select,#reset-yarn,#import-button,#file-input').forEach(el=>el.disabled=false);syncYarn();}
  }
  function scheduleYarn(){syncYarn();clearTimeout(rebuildTimer);rebuildTimer=setTimeout(rebuildYarn,160);}
  function download(data,name,type){
    const blob=data instanceof Blob?data:new Blob([data],{type});
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);
  }
  function describeExample(id){
    const example=examples.find(item=>item.id===id);
    $('example').value=example?example.id:'';
    $('example-description').textContent=example?example.description:'';
    $('example-description').hidden=!example;
  }
  function matchExample(){
    const example=examples.find(item=>convertTerms(item.source,'US',terminology)===$('pattern').value);
    describeExample(example?.id);
  }
  function selectCamera(name){
    view?.setView(name);
    document.querySelectorAll('[data-view]').forEach(button=>{
      const selected=button.dataset.view===name;
      button.classList.toggle('active',selected);button.setAttribute('aria-pressed',String(selected));
    });
  }
  function applyExample(id){
    const example=examples.find(item=>item.id===id);if(!example)return;
    clearTimeout(rebuildTimer);
    settings={...defaults,...example.yarn};
    $('pattern').value=convertTerms(example.source,'US',terminology);
    describeExample(id);dirty=true;syncYarn();lineNumbers();selectCamera(example.view);
  }
  const exampleGroups=new Map();
  for(const example of examples){
    let group=exampleGroups.get(example.group);
    if(!group){group=document.createElement('optgroup');group.label=example.group;exampleGroups.set(example.group,group);$('example').appendChild(group);}
    const option=document.createElement('option');option.value=example.id;option.textContent=example.name;group.appendChild(option);
  }
  $('pattern').addEventListener('input',()=>{describeExample();lineNumbers();dirty=true;diagnostics('Pattern changed. Generate to update the fabric.');persist();});
  $('pattern').addEventListener('scroll',()=>{$('line-numbers').scrollTop=$('pattern').scrollTop;});
  $('pattern').addEventListener('keydown',e=>{if(e.key==='Tab'){e.preventDefault();const start=e.target.selectionStart,end=e.target.selectionEnd;e.target.setRangeText('  ',start,end,'end');describeExample();lineNumbers();dirty=true;persist();}});
  $('generate').addEventListener('click',generate);
  $('example').addEventListener('change',()=>{
    applyExample($('example').value);persist();generate();
  });
  $('terminology').addEventListener('change',()=>{
    $('pattern').value=convertTerms($('pattern').value,terminology,$('terminology').value);terminology=$('terminology').value;lineNumbers();generate();
  });
  $('progress').addEventListener('input',()=>{stop();count=+$('progress').value;finished=false;updateProgress();});
  $('previous').addEventListener('click',()=>step(-1));$('next').addEventListener('click',()=>step(1));
  $('play').addEventListener('click',()=>{
    if(playing){stop();return;}if(!graph)return;if(count>=graph.nodes.length)count=0;
    playing=true;finished=false;playTime=0;$('play').textContent='Pause';$('play').setAttribute('aria-label','Pause construction');updateProgress();
  });
  $('show-all').addEventListener('click',()=>{if(!graph)return;stop();count=graph.nodes.length;finished=true;updateProgress();});
  $('show-future').addEventListener('change',updateProgress);$('show-target').addEventListener('change',updateProgress);
  document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{
    view?.setView(b.dataset.view);document.querySelectorAll('[data-view]').forEach(c=>{c.classList.toggle('active',b===c);c.setAttribute('aria-pressed',String(b===c));});
  }));
  $('fit').addEventListener('click',()=>view?.fit());
  $('yarn-colour').addEventListener('input',()=>{settings.colour=$('yarn-colour').value;scheduleYarn();});
  $('second-colour').addEventListener('input',()=>{settings.secondColour=$('second-colour').value;scheduleYarn();});
  for(const [id,key]of[['main-colour-hex','colour'],['second-colour-hex','secondColour']]){
    $(id).addEventListener('change',()=>{let value=$(id).value.trim();if(!value.startsWith('#'))value='#'+value;if(/^#[0-9a-f]{6}$/i.test(value)){settings[key]=value.toLowerCase();scheduleYarn();}else syncYarn();});
  }
  $('marled').addEventListener('change',()=>{settings.marled=$('marled').checked;scheduleYarn();});
  $('yarn-weight').addEventListener('change',()=>{settings.weight=$('yarn-weight').value;settings.diameterMm=null;scheduleYarn();});
  $('hook-size').addEventListener('change',()=>{settings.autoHook=false;settings.hookMm=+$('hook-size').value;scheduleYarn();});
  $('auto-hook').addEventListener('change',()=>{settings.autoHook=$('auto-hook').checked;scheduleYarn();});
  $('strand-diameter').addEventListener('change',()=>{settings.diameterMm=+$('strand-diameter').value;scheduleYarn();});
  $('use-gauge').addEventListener('change',()=>{settings.useGauge=$('use-gauge').checked;scheduleYarn();});
  $('gauge-stitches').addEventListener('change',()=>{settings.gaugeStitches=+$('gauge-stitches').value;scheduleYarn();});
  $('gauge-rows').addEventListener('change',()=>{settings.gaugeRows=+$('gauge-rows').value;scheduleYarn();});
  $('cancel-build').addEventListener('click',()=>view?.cancelBuild());
  $('reset-yarn').addEventListener('click',()=>{settings={...defaults};scheduleYarn();});
  $('tension').addEventListener('change',()=>{settings.tension=+$('tension').value;scheduleYarn();});
  $('save-pattern').addEventListener('click',()=>download(JSON.stringify(project(),null,2),'my-pattern.crochet','application/json'));
  $('export-image').addEventListener('click',()=>{if(!graph)return;const a=document.createElement('a');a.href=view.exportPNG();a.download='crochet.png';a.click();});
  $('import-button').addEventListener('click',()=>$('file-input').click());
  $('file-input').addEventListener('change',async e=>{
    const file=e.target.files[0];if(!file)return;
    try{
      if(file.size>1000000)throw new Error('Choose a pattern file smaller than 1 MB.');
      const text=await file.text();
      if(text.trim().startsWith('{'))restore(JSON.parse(text));
      else{$('pattern').value=text;lineNumbers();matchExample();}
      await generate();
    }catch(err){diagnostics(`Could not open the pattern: ${err.message}`,true);}
    e.target.value='';
  });
  LanguageReference.render($('language-reference'));
  $('help').addEventListener('click',()=>$('help-dialog').showModal());$('close-help').addEventListener('click',()=>$('help-dialog').close());
  $('help-dialog').addEventListener('click',e=>{if(e.target===$('help-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
  window.addEventListener('keydown',e=>{
    if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();generate();}
    if(e.target.closest('textarea,input,select,button,a,summary,dialog')||e.target===$('pattern-panel')||$('help-dialog').open)return;
    if(e.key==='ArrowLeft'){e.preventDefault();step(-1);}if(e.key==='ArrowRight'){e.preventDefault();step(1);}
    if(e.key===' '){e.preventDefault();$('play').click();}
  });
  for(const weight of YarnProfile.weights){const option=document.createElement('option');option.value=weight.id;option.textContent=weight.name;$('yarn-weight').appendChild(option);}
  applyExample('swatch');
  try{const stored=localStorage.getItem('loop-project-v1');if(stored)restore(JSON.parse(stored));}catch(_){}
  syncYarn();lineNumbers();matchExample();
  try{
    view=new YarnView($('viewport'),id=>{stop();count=id;finished=false;updateProgress();});
    selectCamera(examples.find(example=>example.id===$('example').value)?.view||'angle');
    $('loading').style.display='none';$('cancel-build').hidden=true;generate();requestAnimationFrame(tick);
  }catch(error){
    const message=window.THREE?'The 3D view needs WebGL. Try a browser with hardware acceleration enabled.':'The 3D library could not load. Check your internet connection, then reload Loop.';
    $('loading-message').textContent=message;
    $('generate').disabled=true;diagnostics(window.THREE?`WebGL could not start: ${error.message}`:message,true);
  }

  window.Loop={get graph(){return graph;},get view(){return view;},presets,generate};
})();
