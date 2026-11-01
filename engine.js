(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Crochet = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const VERSION = '0.6.2';
  const MAX_STITCHES = 24000;
  const heights = {CH: .45, SC: .95, HDC: 1.25, DC: 1.65, TR: 2.05, DTR: 2.45, SLST: .32, MR: .4};
  const names = {CH:'Chain', SC:'Single crochet', HDC:'Half double crochet', DC:'Double crochet', TR:'Treble crochet', DTR:'Double treble crochet', SLST:'Slip stitch', MR:'Magic ring'};
  class PatternError extends Error {
    constructor(message, line, column = 1) { super(message); this.name = 'PatternError'; this.line = line; this.column = column; }
  }
  function lex(text, line) {
    const tokens = [];
    const re = /\s+|\/\/[^\n]*|#[0-9a-fA-F]{6}\b|@\d+|\d+|[A-Za-z][A-Za-z0-9_-]*|[\[\](),*/:;-]/gy;
    let p = 0;
    while (p < text.length) {
      re.lastIndex = p;
      const m = re.exec(text);
      if (!m) throw new PatternError(`Unexpected character “${text[p]}”.`, line, p + 1);
      p = re.lastIndex;
      if (!/^\s|^\/\//.test(m[0])) tokens.push({value:m[0].toUpperCase(), column:m.index + 1});
    }
    return tokens;
  }
  function parseLine(text, line, terminology) {
    const ts = lex(text, line); let i = 0;
    const peek = () => ts[i]?.value;
    const take = () => ts[i++]?.value;
    const fail = m => { throw new PatternError(m, line, ts[i]?.column || text.length + 1); };
    function number(fallback = 1) {
      if (!/^\d+$/.test(peek() || '')) return fallback;
      const n = +take();
      if (n < 1 || n > MAX_STITCHES) fail(`Counts must be between 1 and ${MAX_STITCHES}.`);
      return n;
    }
    function sequence(close) {
      const ops = [];
      while (i < ts.length) {
        if (peek() === close) { take(); return ops; }
        if ([',',';'].includes(peek())) { take(); continue; }
        if (['[','('].includes(peek())) {
          const bracket = take(), children = sequence(bracket === '[' ? ']' : ')');
          if (peek() === ',') take();
          if (peek() === 'REPEAT') take();
          let count = 1;
          if (/^X\d+$/.test(peek() || '')) count = +take().slice(1);
          else { if (['X','*'].includes(peek())) take(); count = number(1); }
          if (peek() === 'TIMES') take();
          if (!children.length || count < 1 || count > MAX_STITCHES) fail('Empty or excessive repeat.');
          ops.push({kind:'repeat', count, ops:children, line}); continue;
        }
        if ([']',')'].includes(peek())) fail('Unmatched closing bracket.');
        const column = ts[i]?.column;
        let prefix = null;
        if (/^\d+$/.test(peek() || '')) prefix = number();
        let word = take();
        if (!word) fail('Expected a stitch after the count.');
        if(prefix!==null&&['TURN','JOIN','CABLE','COLOUR','COLOR'].includes(word))fail('Put control instructions before any count; use brackets to repeat a cable.');
        if (word === 'TURN') { ops.push({kind:'turn',line}); continue; }
        if (word === 'JOIN') { const counted=peek()==='*';if(counted)take();ops.push({kind:'join',line,counted});continue; }
        if(word==='CABLE'){
          const first=number(null);if(first===null)fail('CABLE needs a/b group sizes.');
          if(take()!=='/')fail('Use CABLE 2/2 FRONT or CABLE 2/2 BACK.');
          const second=number(null);if(second===null)fail('CABLE needs a second group size.');
          const side=take();if(!['FRONT','BACK'].includes(side))fail('CABLE direction must be FRONT or BACK.');
          if(first+second>MAX_STITCHES)fail('The cable exceeds the preview stitch limit.');
          let token=peek(),type='TR',post='FP',loop='both';
          if(/^(?:FP|BP)?(?:SC|HDC|DC|TR|DTR|HTR|TTR)(?:BLO|FLO)?$/.test(token||'')){
            token=take();if(/^(FP|BP)/.test(token)){post=token.slice(0,2);token=token.slice(2);}else post=null;
            if(/(BLO|FLO)$/.test(token)){loop=token.slice(-3).toLowerCase();token=token.slice(0,-3);}
            type=terminology==='UK'?({DC:'SC',HTR:'HDC',TR:'DC',DTR:'TR',TTR:'DTR'})[token]||token:token;
          }
          if(!['SC','HDC','DC','TR','DTR'].includes(type))fail('Use a cable stitch token in the selected terminology.');
          if(post&&loop!=='both')fail('Choose a top-loop modifier or a post modifier, not both.');
          ops.push({kind:'cable',first,second,side:side.toLowerCase(),type,post,loop,line,column});continue;
        }
        if (['COLOUR','COLOR'].includes(word)) {
          const colour = take();
          if (!/^#[A-F0-9]{6}$/.test(colour || '')) fail('Use a six-digit colour, e.g. COLOUR #537F78.');
          ops.push({kind:'colour',colour,line}); continue;
        }
        if (['SK','SKIP'].includes(word)) { ops.push({kind:'skip', count:prefix || number(),line}); continue; }
        if (word === 'MAGIC' && peek() === 'RING') { take(); word = 'MR'; }
        if (word === 'SL' && ['ST','STITCH'].includes(peek())) { take(); word = 'SLST'; }
        if (word === 'CHAIN') word = 'CH';
        let loop = 'both', post = null, decrease = 1;
        if (/^(FP|BP)/.test(word)) { post = word.slice(0,2); word = word.slice(2); }
        if (/(BLO|FLO)$/.test(word)) { loop = word.slice(-3).toLowerCase(); word = word.slice(0,-3); }
        if (/\d+TOG$/.test(word)) {
          const m = word.match(/^(.*?)(\d+)TOG$/); word = m[1]; decrease = +m[2];
          if (decrease < 2 || decrease > 6) fail('Use a decrease of 2 to 6 stitches.');
        }
        let increase = 1;
        if (word === 'INC') { word = 'SC'; increase = 2; }
        if (word === 'DEC') { word = 'SC'; decrease = 2; }
        if (terminology === 'UK') {
          word = ({DC:'SC',HTR:'HDC',TR:'DC',DTR:'TR',TTR:'DTR'})[word] || word;
          if (word === 'SC') {                                         }
        }
        if (!(word in heights)) throw new PatternError(`Unrecognised instruction “${word}”. Open Language reference for the supported language.`,line,column);
        let count = prefix || number();
        let counted=peek()==='*';if(counted)take();
        if(counted&&word!=='CH')fail('Use * only on CH or JOIN; ordinary stitches already count.');
        if (['BLO','FLO'].includes(peek())) loop = take().toLowerCase();
        if (['FP','BP'].includes(peek())) post = take();
        let target = null;
        if (['IN','INTO'].includes(peek())) {
          take();
          if (peek() === 'THE') take();
          const value = take();
          if (/^@\d+$/.test(value || '')) target = {kind:'id',id:+value.slice(1)};
          else if (['SAME','NEXT','SKIPPED','RING'].includes(value)) target = {kind:value.toLowerCase()};
          else if (['CH-SP','SPACE'].includes(value)) target = {kind:'space', index:number(1)};
          else fail('Target must be NEXT, SAME, SKIPPED, RING, CH-SP n or @stitch-number.');
          if (['ST','STITCH'].includes(peek())) take();
        }
        if(post&&loop!=='both')fail('Choose a top-loop modifier or a post modifier, not both.');
        if (word === 'CH' && (target || post || loop !== 'both' || decrease > 1)) fail('Chains do not take a stitch target or loop modifier.');
        if(word==='MR'&&(count!==1||post||loop!=='both'||target||decrease!==1))fail('MR is a single starting ring without modifiers.');
        ops.push({kind:'stitch',type:word,count,loop,post,decrease,increase,target,counted,line,column});
      }
      if (close) fail(`Missing closing “${close}”.`);
      return ops;
    }
    return sequence(null);
  }
  function parse(source, terminology = 'US') {
    const rows = [], lines = source.replace(/\r/g,'').split('\n'); let expansion = 0;
    lines.forEach((original,index) => {
      const line = index + 1;
      const text = original.replace(/\/\/.*$/, '').trim();
      if (!text) return;
      const repeat = text.match(/^repeat\s+rows?\s+(\d+)(?:\s*[-–]\s*(\d+))?\s+(?:x\s*)?(\d+)\s*(?:times)?\s*$/i);
      if (repeat) {
        const first = +repeat[1], last = +(repeat[2] || repeat[1]), count = +repeat[3];
        if (first < 1 || last < first || last > rows.length || count < 1 || count > MAX_STITCHES) throw new PatternError('Row repeat must refer to earlier pattern rows and have a positive count.',line);
        const selected = rows.slice(first-1,last);
        if (rows.length + selected.length * count > MAX_STITCHES) throw new PatternError('Row repeat is too large for this preview.',line);
        for (let j=0; j<count; j++) selected.forEach(r => rows.push({...r, line, repeatedFrom:r.line, row:rows.length+1}));
        return;
      }
      const clean = text.replace(/^(?:row|round|rnd)\s*\d+\s*:\s*/i,'');
      const ops = parseLine(clean,line,terminology);
      function size(items, multiplier=1) {
        for (const op of items) {
          if (op.kind === 'repeat') size(op.ops, multiplier*op.count);
          else expansion += multiplier*(op.kind==='cable'?op.first+op.second:op.count||1);
          if (expansion > MAX_STITCHES*3) throw new PatternError(`This preview is limited to ${MAX_STITCHES.toLocaleString()} generated stitches.`,line);
        }
      }
      size(ops);
      rows.push({row:rows.length+1,line,text:original,ops});
    });
    if (!rows.length) throw new PatternError('Enter a pattern to generate some crochet.',1);
    return {rows,terminology,source};
  }
  function compile(source, options={}) {
    const parsed=typeof source==='string'?parse(source,options.terminology||'US'):source;
    const nodes=[],edges=[],spaces=[],rows=[],warnings=[],cables=[];
    let dir=1,rowIndex=0,foundation=[],anchors=[],current=[],cursor=0,active=false;
    let lastTarget=null,skipped=[],pendingChains=[],pendingTurn=null,ring=null,round=false;
    let colour=null,lastNode=null,groupCounter=0,lineContext=1;
    const byId=new Map();
    const error=message=>{throw new PatternError(message,lineContext);};
    function addNode(type,attrs={}){
      if(nodes.length>=MAX_STITCHES)error(`This preview supports up to ${MAX_STITCHES.toLocaleString()} stitches.`);
      const node={id:nodes.length+1,type,loop:'both',post:null,row:rowIndex,line:lineContext,colour,dir,round,x:0,y:0,z:0,parents:[],role:'stitch',countsAsStitch:type!=='MR',...attrs};
      if(lastNode){node.previous=lastNode.id;edges.push({from:lastNode.id,to:node.id,kind:'yarn'});}
      nodes.push(node);byId.set(node.id,node);
      for(const id of node.parents)edges.push({from:id,to:node.id,kind:'attachment',loop:node.loop,post:node.post});
      lastNode=node;return node;
    }
    function flushSpace(){
      if(!pendingChains.length)return;
      const ids=pendingChains.splice(0),members=ids.map(id=>byId.get(id));
      const centre=members.reduce((p,n)=>({x:p.x+n.x/members.length,y:p.y+n.y/members.length,z:0}),{x:0,y:0,z:0});
      spaces.push({id:`space-${++groupCounter}`,ids,row:rowIndex,...centre});
      for(const node of members)node.space=groupCounter;
    }
    function recordRow(){
      if(!current.length)return;
      const visualIds=current.flatMap(id=>{const n=byId.get(id);return n.role==='bridge'&&n.countedRun?n.countedRun:[id];});
      rows.push({index:rowIndex,ids:[...current],visualIds,stitchCount:current.length,round,dir});
    }
    function prepare(){
      if(active)return;
      if(!anchors.length&&foundation.length){
        anchors=foundation.slice(0,-1).reverse();dir=-1;
        if(!rows.some(r=>r.index===0))rows.push({index:0,ids:[...foundation],visualIds:[...foundation],stitchCount:foundation.length,round:false,dir:1});
        rowIndex=1;
      }
      if(!anchors.length&&!ring)error('Begin with a foundation chain or MR (magic ring).');
      active=true;
    }
    function chooseTarget(spec,decrease){
      if(spec?.kind==='same'){if(!lastTarget)error('INTO SAME needs a preceding stitch target.');return lastTarget;}
      if(spec?.kind==='ring'||(ring&&!anchors.length)){if(!ring)error('There is no magic ring to work into.');return[ring.id];}
      if(spec?.kind==='skipped'){const id=skipped.pop();if(!id)error('No skipped stitch is available in this row.');return[id];}
      if(spec?.kind==='id'){
        if(!byId.has(spec.id))error(`Stitch @${spec.id} does not exist yet.`);
        const at=anchors.indexOf(spec.id);if(at>=cursor)cursor=at+1;return[spec.id];
      }
      if(spec?.kind==='space'){
        const available=spaces.filter(s=>s.ids.some(id=>anchors.includes(id)))
          .sort((a,b)=>Math.min(...a.ids.map(id=>anchors.indexOf(id)).filter(i=>i>=0))-Math.min(...b.ids.map(id=>anchors.indexOf(id)).filter(i=>i>=0)));
        const space=available[spec.index-1];if(!space)error(`Chain space ${spec.index} does not exist in the supporting row.`);
        cursor=Math.max(cursor,...space.ids.map(id=>anchors.indexOf(id)).filter(i=>i>=0).map(i=>i+1));return[...space.ids];
      }
      if(cursor+decrease>anchors.length)error(`Row ${rowIndex}: no stitch left to work into (${cursor} of ${anchors.length} used). Check the stitch count or TURN.`);
      return anchors.slice(cursor,cursor+=decrease);
    }
    function work(type,targets,op,extra={}){
      const parents=targets.map(id=>byId.get(id));
      const base=parents.reduce((p,v)=>({x:p.x+v.x/targets.length,y:p.y+v.y/targets.length,z:0}),{x:0,y:0,z:0});
      const node=addNode(type,{x:base.x,y:base.y+heights[type],parents:targets,loop:op.loop||'both',post:op.post||null,decrease:op.decrease||1,spaceTarget:op.target?.kind==='space',...extra});
      current.push(node.id);lastTarget=targets;return node;
    }
    const flat=[];
    function expand(ops,row){for(const op of ops){if(op.kind==='repeat'){for(let i=0;i<op.count;i++)expand(op.ops,row);}else{if(flat.length>=MAX_STITCHES*3)throw new PatternError('The expanded program is too large for this preview.',row.line);flat.push({op,row});}}}
    for(const row of parsed.rows)expand(row.ops,row);
    const nextAction=i=>{for(let j=i+1;j<flat.length;j++)if(flat[j].op.kind!=='colour')return flat[j].op;return null;};
    let previousSource=null;
    for(let index=0;index<flat.length;index++){
      const {op,row}=flat[index];lineContext=row.line;
      if(previousSource!==row){if(previousSource)previousSource.end=nodes.length;row.start=nodes.length;previousSource=row;}
      if(op.kind==='colour'){colour=op.colour;continue;}
      if(op.kind==='skip'){
        prepare();if(cursor+op.count>anchors.length)error('SKIP exceeds the remaining stitches.');
        skipped.push(...anchors.slice(cursor,cursor+=op.count));continue;
      }
      if(op.kind==='cable'){
        flushSpace();prepare();const span=op.first+op.second;
        if(cursor+span>anchors.length)error(`CABLE ${op.first}/${op.second} needs ${span} remaining supporting stitches.`);
        const parents=anchors.slice(cursor,cursor+=span),groups=[parents.slice(op.first),parents.slice(0,op.first)];
        const cable={id:cables.length+1,row:rowIndex,first:op.first,second:op.second,side:op.side,parents,groups:[],over:[],under:[]};
        for(let group=0;group<2;group++){
          const over=op.side==='front'?group===1:group===0,ids=[];
          for(let j=0;j<groups[group].length;j++){
            const node=work(op.type,[groups[group][j]],op,{cable:{id:cable.id,group,index:j,span,side:op.side,over,first:op.first,second:op.second}});
            ids.push(node.id);(over?cable.over:cable.under).push(node.id);
          }
          cable.groups.push(ids);
        }
        for(const over of cable.over)for(const under of cable.under)edges.push({from:over,to:under,kind:'crossing',order:'over',cable:cable.id});
        cables.push(cable);continue;
      }
      if(op.kind==='turn'||op.kind==='join'){
        flushSpace();
        if(op.kind==='join'&&!round)error('JOIN needs rounds started with MR. Use TURN for flat rows.');
        if(round&&op.kind==='turn')error('Turned rounds are not supported. Use JOIN.');
        const startingFoundation=!current.length&&foundation.length&&!active;
        if(!current.length&&!startingFoundation)error('There is nothing to turn or join.');
        const turn=pendingTurn;pendingTurn=null;
        if(startingFoundation){
          if(!rows.some(r=>r.index===0))rows.push({index:0,ids:[...foundation],visualIds:[...foundation],stitchCount:foundation.length,round:false,dir:1});
          anchors=(turn?.counted?foundation:foundation.slice(0,-1)).slice().reverse();dir=-1;
        }else{
          if(cursor<anchors.length)warnings.push(`Row ${rowIndex} leaves ${anchors.length-cursor} supporting stitch(es) unworked.`);
          if(op.kind==='join'){
            const first=byId.get(current[0]);
            const join=addNode('SLST',{x:first.x,y:first.y,z:.12,parents:[first.id],role:'join',countedJoin:!!op.counted,countsAsStitch:!!op.counted});
            if(op.counted)current.push(join.id);
          }
          recordRow();anchors=round?[...current]:[...current].reverse();dir=round?1:-dir;
        }
        rowIndex++;current=[];cursor=0;active=false;lastTarget=null;skipped=[];
        if(turn?.counted){
          const head=byId.get(turn.ids.at(-1)),base=startingFoundation?foundation.at(-1):anchors[0];
          if(!base)error('A counted turning chain needs a supporting stitch.');
          for(const id of turn.ids){const n=byId.get(id);n.row=rowIndex;n.dir=dir;}
          head.role='counted-turn';head.countedTurn=true;head.turnBase=base;head.countedRun=turn.ids;head.countsAsStitch=true;
          current.push(head.id);cursor=startingFoundation?0:1;active=true;lastTarget=[base];
        }
        continue;
      }
      if(op.type==='MR'){
        if(nodes.length)error('MR must be the first stitch.');
        ring=addNode('MR',{role:'ring',round:true,countsAsStitch:false});round=true;rowIndex=1;active=true;continue;
      }
      if(op.type==='CH'){
        const followingTurn=nextAction(index)?.kind==='turn';
        const isFoundation=!active&&!anchors.length&&!ring&&!op.counted;
        const atStart=!current.length&&(anchors.length>0||!!ring);
        const turning=(!isFoundation&&(followingTurn||atStart))||(followingTurn&&current.length>0);
        if(op.counted&&!foundation.length&&!anchors.length&&!ring)error('A counted chain needs a foundation or supporting row first.');
        if(op.counted&&atStart&&!followingTurn)prepare();
        const baseForStanding=op.counted&&atStart&&!followingTurn?(anchors[cursor++]||ring?.id):null;
        if(op.counted&&atStart&&!followingTurn&&!baseForStanding)error('No supporting stitch remains for the counted starting chain.');
        const ids=[];
        for(let j=0;j<op.count;j++){
          const prev=lastNode;
          const node=addNode('CH',{role:isFoundation?'foundation':turning||op.counted&&followingTurn?'turning':'bridge',
            x:prev?prev.x+(turning?dir*.09:dir):0,y:prev?prev.y+(turning?.48:0):0,parents:prev?[prev.id]:[],
            countsAsStitch:isFoundation||!turning&&!op.counted,chainCount:op.count});
          ids.push(node.id);
          if(isFoundation)foundation.push(node.id);
          else if(!turning&&!op.counted){current.push(node.id);pendingChains.push(node.id);}
        }
        if(turning||op.counted&&followingTurn){
          for(const id of ids)byId.get(id).countsAsStitch=false;
          if(followingTurn)pendingTurn={ids,counted:!!op.counted};
          else if(op.counted){
            const head=byId.get(ids.at(-1));head.role='counted-turn';head.countedTurn=true;head.turnBase=baseForStanding;head.countedRun=ids;head.countsAsStitch=true;
            current.push(head.id);lastTarget=[baseForStanding];
          }
        }else if(op.counted){
          const head=byId.get(ids.at(-1));head.countedRun=ids;head.countsAsStitch=true;current.push(head.id);pendingChains.push(...ids);
        }
        continue;
      }
      flushSpace();prepare();let shared=null;
      for(let j=0;j<op.count;j++){
        const fixed=op.target&&!['same','skipped'].includes(op.target.kind);
        const targets=fixed&&shared?shared:chooseTarget(op.target,op.decrease);if(fixed)shared=targets;
        for(let k=0;k<op.increase;k++)work(op.type,targets,op);
      }
    }
    if(previousSource)previousSource.end=nodes.length;
    flushSpace();recordRow();
    if(!nodes.length)error('The pattern does not contain any stitches.');
    if(!rows.length&&foundation.length)rows.push({index:0,ids:[...foundation],visualIds:[...foundation],stitchCount:foundation.length,round:false,dir:1});

    for (const row of rows.filter(r=>!r.round && r.index>0)) {
      const members=row.ids.map(id=>byId.get(id));
      const supporting=members.filter(n=>n.type!=='CH').flatMap(n=>n.parents.map(id=>byId.get(id)));
      if (!supporting.length) continue;
      const mid=(Math.min(...supporting.map(n=>n.x))+Math.max(...supporting.map(n=>n.x)))/2;
      for (let i=0;i<members.length;i++) {
        const node=members[i]; node.x=mid+row.dir*(i-(members.length-1)/2);
        if (node.type!=='CH') node.y=node.parents.reduce((v,id)=>v+byId.get(id).y/node.parents.length,0)+heights[node.type];
      }
      for (let i=0;i<members.length;i++) {
        const node=members[i]; if (node.type!=='CH') continue;
        const before=members.slice(0,i).reverse().find(n=>n.type!=='CH');
        const after=members.slice(i+1).find(n=>n.type!=='CH');
        node.y=((before?.y ?? after?.y ?? node.y)+(after?.y ?? before?.y ?? node.y))/2+.2;
      }

      for(let pass=0;pass<2;pass++) {
        const ys=members.map(n=>n.y);
        members.forEach((n,i)=>n.y=.65*ys[i]+.175*ys[Math.max(0,i-1)]+.175*ys[Math.min(ys.length-1,i+1)]);
      }
    }

    for (const node of nodes.filter(n=>n.role==='turning')) {
      const previous=byId.get(node.previous); node.x=previous.x+node.dir*.09;node.y=previous.y+.48;
    }

    if (round) {
      const firstTheta=-Math.PI/2;
      let previousRadius=0;
      for (const row of rows.filter(r=>r.round)) {
        const radius=Math.max(.95,previousRadius+.8,row.ids.length/(2*Math.PI));
        previousRadius=radius;
        row.ids.forEach((id,i)=>{
          const node=byId.get(id), angle=firstTheta+i*2*Math.PI/row.ids.length;
          node.x=Math.cos(angle)*radius; node.y=Math.sin(angle)*radius;
          node.tangent={x:-Math.sin(angle),y:Math.cos(angle),z:0};
          node.outward={x:Math.cos(angle),y:Math.sin(angle),z:0};
        });
      }
      for (const node of nodes.filter(n=>n.role==='join')) {
        const p=byId.get(node.parents[0]); node.x=p.x;node.y=p.y;node.tangent=p.tangent;node.outward=p.outward;
      }
    }
    for (const space of spaces) {
      space.x=space.ids.reduce((v,id)=>v+byId.get(id).x/space.ids.length,0);
      space.y=space.ids.reduce((v,id)=>v+byId.get(id).y/space.ids.length,0);
    }
    return {version:VERSION,nodes,edges,spaces,rows,sourceRows:parsed.rows,warnings:[...new Set(warnings)],cables,terminology:parsed.terminology,source:parsed.source};
  }
  function describe(node, terminology='US') {
    const label = terminology==='UK' ? ({SC:'Double crochet',HDC:'Half treble crochet',DC:'Treble crochet',TR:'Double treble crochet',DTR:'Triple treble crochet'})[node.type] || names[node.type] : names[node.type];
    if (node.type==='MR') return 'Make a magic ring. The first round works into its centre.';
    if(node.countedTurn)return `Counted turning chain (${node.countedRun.length} chains): counts as one stitch in row ${node.row}.`;
    if (node.type==='CH') return `Make a chain${node.role==='turning'?' for the turn':node.role==='bridge'?' to form a chain bridge':''}.`;
    const where=node.loop==='blo'?'back loop only':node.loop==='flo'?'front loop only':node.post==='FP'?'around the front of the post':node.post==='BP'?'around the back of the post':'both top loops';
    const cable=node.cable?`${node.cable.first}/${node.cable.second} ${node.cable.side.toUpperCase()} cable, ${node.cable.over?'over':'under'} strand. `:'';
    return `${cable}${label}${node.decrease>1?` ${node.decrease} together`:''} ${where}; ${node.spaceTarget?'work into the chain space spanning':'target'} ${node.parents.map(id=>'@'+id).join(', ')}.`;
  }
  return {VERSION,MAX_STITCHES,heights,names,PatternError,parse,compile,describe};
});
