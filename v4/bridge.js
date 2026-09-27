/* IC_BRIDGE v4 — يعمل داخل الاستوديو الهندسي: يرد على طلبات اللقطة الموحّدة */
(function(){
function snap(){
 const pick={};
 try{['project','client','site','muni','bShape','bArch','bOn','cat','tpl','sysType','ghiY','lat','lon',
  'wind','snow','terrain','vat','marg','price','fab','loadD','loadNight','loadPk','invVmax','invVmin',
  'invIsc','invMppt','invKW','pWp','pVoc','pVmp','pIsc','pImp','batChem','batV','batVm','batAh','batDays'].forEach(k=>{pick[k]=M[k];});}catch(e){}
 const out={M:pick,SITE:SITE?{area:SITE.area,bb:SITE.bb,arch:SITE.arch,H:SITE.H}:null,
  NP:typeof NP!=='undefined'?NP:0,PVSH:typeof PVSH!=='undefined'?PVSH:null,
  R:null,ST:null,E:null,Z:null,VAL:typeof VAL!=='undefined'?VAL:null,
  roomPin:window.__roomPin||null};
 try{out.R=JSON.parse(JSON.stringify(typeof R!=='undefined'?R:null));}catch(e){out.R=null;}
 try{if(typeof stringCalc==='function')out.ST=stringCalc();}catch(e){}
 try{if(typeof elecDesign==='function')out.E=elecDesign();}catch(e){}
 try{if(typeof sizePanels==='function')out.Z=sizePanels();}catch(e){}
 return out;}
window.addEventListener('message',function(e){
 if(e.origin!==location.origin)return;
 const d=e.data||{};
 if(d.type==='ic-snap-request'){
  try{parent.postMessage({type:'ic-snap',snap:snap(),projectId:d.projectId||null},location.origin);}catch(err){}}
 if(d.type==='ic-nav'&&d.tab){try{TAB=d.tab;drawTabs();dock();}catch(e){}}});
})();
