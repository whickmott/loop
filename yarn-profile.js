(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.YarnProfile=api;})(typeof globalThis!=='undefined'?globalThis:this,function makeYarnProfile(){
  'use strict';
  const weights=[
    {id:'lace',name:'Lace / 2 ply',diameterMm:.70,hookMm:2.0},
    {id:'4ply',name:'4 ply',diameterMm:1.05,hookMm:2.75},
    {id:'sport',name:'Sport / 5 ply',diameterMm:1.30,hookMm:3.5},
    {id:'dk',name:'DK',diameterMm:1.65,hookMm:4.0},
    {id:'aran',name:'Aran',diameterMm:2.10,hookMm:5.0},
    {id:'chunky',name:'Chunky',diameterMm:2.75,hookMm:6.0},
    {id:'super-chunky',name:'Super chunky',diameterMm:4.20,hookMm:10.0},
    {id:'jumbo',name:'Jumbo',diameterMm:7.0,hookMm:16.0}
  ];
  const defaults={weight:'dk',autoHook:true,hookMm:4,diameterMm:null,useGauge:false,gaugeStitches:20,gaugeRows:22,renderMode:'full',yarnContacts:true};
  const clamp=(v,min,max,fallback)=>Number.isFinite(+v)?Math.max(min,Math.min(max,+v)):fallback;
  const category=id=>weights.find(w=>w.id===id)||weights.find(w=>w.id==='dk');
  function recommendedHook(weight,marled=false){const h=category(weight).hookMm*(marled?Math.SQRT2:1);return Math.round(h*4)/4;}
  function normalise(input={}){
    const s={...defaults,...input};
    const legacy=!input.weight&&Number.isFinite(+input.thickness)&&+input.thickness!==100?1.65*clamp(input.thickness,55,145,100)/100:null;
    if(legacy)s.weight=weights.reduce((best,w)=>Math.abs(Math.log(w.diameterMm/legacy))<Math.abs(Math.log(best.diameterMm/legacy))?w:best,weights[0]).id;
    const w=category(s.weight);
    s.weight=w.id;s.autoHook=s.autoHook!==false;
    s.hookMm=s.autoHook?recommendedHook(s.weight,!!s.marled):clamp(s.hookMm,.5,30,w.hookMm);
    s.diameterMm=s.diameterMm===null||s.diameterMm===''||s.diameterMm===undefined?null:clamp(s.diameterMm,.15,20,w.diameterMm);
    s.useGauge=!!s.useGauge;s.gaugeStitches=clamp(s.gaugeStitches,2,100,20);s.gaugeRows=clamp(s.gaugeRows,2,150,22);
    s.renderMode=s.renderMode==='smooth'?'smooth':'full';s.yarnContacts=s.yarnContacts!==false;

    if(legacy)s.diameterMm=legacy;
    delete s.thickness;return s;
  }
  function resolve(input={}){
    const s=normalise(input),w=category(s.weight),diameter=s.diameterMm??w.diameterMm;
    const effectiveDiameter=diameter*(s.marled?Math.SQRT2:1);
    const tension=clamp(s.tension,45,155,100),ease=1+(100-tension)*.004;

    const estimatedPitch=(1.05*s.hookMm+.65*effectiveDiameter)*ease;
    const pitch=s.useGauge?100/s.gaugeStitches:Math.max(2.05*effectiveDiameter,estimatedPitch);
    const scale=pitch/.82;
    const rowHeight=s.useGauge?100/s.gaugeRows:.73*scale;
    return {weight:w.id,name:w.name,hookMm:s.hookMm,strandDiameterMm:diameter,effectiveDiameterMm:effectiveDiameter,
      radiusMm:effectiveDiameter/2,pitchMm:pitch,rowHeightMm:rowHeight,scale,
      heightScale:rowHeight/(.73*scale),estimatedGaugeStitches:100/pitch,estimatedGaugeRows:100/rowHeight,
      measuredGauge:s.useGauge,marled:!!s.marled,
      key:JSON.stringify([w.id,s.hookMm,diameter,!!s.marled,pitch,rowHeight])};
  }
  return {weights,defaults,category,recommendedHook,normalise,resolve,factorySource:()=>makeYarnProfile.toString()};
});
