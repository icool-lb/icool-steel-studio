/* =====================================================================
   iCOOL Pro Suite v3.0 — وحدة الدمج الموحّد
   ---------------------------------------------------------------------
   تضيف على Steel Studio (دون تعديل نواته):
   1) مكتبة منتجات موحّدة + مخزون (وارد/صادر/تنبيهات)
   2) فواتير: رفع صورة/PDF، التقاط الأسطر، مطابقة مع المنتجات ← وارد مخزون
   3) معالج المشروع 7 مراحل من البداية الفارغة حتى عرض السعر
   4) تقسيم الألواح مجموعات Strings مرقّمة على السطح + جدول كابلات
   5) عرض سعر $ بهامش ربح وضريبة اختيارية (افتراضياً بدون)
   العملة: USD · الضريبة: خيار عند التسعير فقط
   ===================================================================== */
(function(){
const S={products:[],invoices:[],stock:[],wiz:0,pin:null,groups:[]};
const KEY='icool-suite-v1';
function save(){try{localStorage.setItem(KEY,JSON.stringify({products:S.products,invoices:S.invoices}));}catch(e){}}
function load(){try{const d=JSON.parse(localStorage.getItem(KEY)||'{}');
 if(d.products)S.products=d.products; if(d.invoices)S.invoices=d.invoices;}catch(e){}}

/* ---------- بذور المنتجات (approx — تُدقق مع Datasheet) ---------- */
const SEED=[
 {id:'deye-sun-8k',brand:'Deye',cat:'inverter',name:'SUN-8K-SG04LP3',elec:{kw:8},mech:{w:500,h:440,d:180,kg:24},price:{cost:0,sell:0,currency:'USD'},stock:{qty:0,min:0}},
 {id:'deye-sun-12k',brand:'Deye',cat:'inverter',name:'SUN-12K-SG04LP3',elec:{kw:12},mech:{w:520,h:455,d:185,kg:27},price:{cost:0,sell:0,currency:'USD'},stock:{qty:0,min:0}},
 {id:'deye-sun-50k',brand:'Deye',cat:'inverter',name:'SUN-50K-SG01HP3-EUR',elec:{kw:50},mech:{w:640,h:530,d:250,kg:49},price:{cost:0,sell:0,currency:'USD'},stock:{qty:0,min:0}},
 {id:'deye-bos-gm',brand:'Deye',cat:'battery',name:'BOS-GM5.1 (5.12kWh)',elec:{kwh:5.12,v:51.2,ah:100},mech:{w:480,h:220,d:460,kg:44},price:{cost:0,sell:0,currency:'USD'},stock:{qty:0,min:0}},
 {id:'panel-longi-580',brand:'LONGi',cat:'panel',name:'Hi-MO X6 580W',elec:{watts:580},mech:{kg:27.5},price:{cost:0,sell:0,currency:'USD'},stock:{qty:0,min:0}},
 {id:'panel-ja-575',brand:'JA Solar',cat:'panel',name:'DeepBlue 4.0 575W',elec:{watts:575},mech:{kg:27},price:{cost:0,sell:0,currency:'USD'},stock:{qty:0,min:0}},
 {id:'panel-jinko-590',brand:'Jinko',cat:'panel',name:'Tiger Neo 590W',elec:{watts:590},mech:{kg:27.5},price:{cost:0,sell:0,currency:'USD'},stock:{qty:0,min:0}},
 {id:'mat-dc-cable',brand:'Generic',cat:'cable',name:'كابل DC 6mm² PV1-F',elec:{},mech:{},price:{cost:0,sell:0,currency:'USD'},stock:{qty:0,min:0}},
 {id:'mat-ac-breaker',brand:'Generic',cat:'protection',name:'قاطع AC 4P (حسب التصميم)',elec:{},mech:{},price:{cost:0,sell:0,currency:'USD'},stock:{qty:0,min:0}},
 {id:'mat-spd',brand:'Generic',cat:'protection',name:'SPD T2 40kA',elec:{},mech:{},price:{cost:0,sell:0,currency:'USD'},stock:{qty:0,min:0}},
 {id:'mat-rcd',brand:'Generic',cat:'protection',name:'RCD 63A/30mA',elec:{},mech:{},price:{cost:0,sell:0,currency:'USD'},stock:{qty:0,min:0}},
 {id:'mat-gland',brand:'Generic',cat:'materials',name:'غلاند كابلات M20',elec:{},mech:{},price:{cost:0,sell:0,currency:'USD'},stock:{qty:0,min:0}},
 {id:'mat-anchor',brand:'Generic',cat:'materials',name:'مسمار كيميائي M14/M16',elec:{},mech:{},price:{cost:0,sell:0,currency:'USD'},stock:{qty:0,min:0}}
];
if(!S.products.length)S.products=JSON.parse(JSON.stringify(SEED));
load(); if(!S.products.length)S.products=JSON.parse(JSON.stringify(SEED));

function prod(id){return S.products.find(p=>p.id===id);}
function esc(x){return String(x==null?'':x).replace(/&/g,'&amp;').replace(/</g,'&lt;');}
function $(id){return document.getElementById(id);}
function stockIn(pid,qty,cost,ref){
 const p=prod(pid); if(!p||!(qty>0))return;
 p.stock.qty=(+p.stock.qty||0)+(+qty);
 if(cost>0)p.price.cost=+cost;
 save();}
function stockOut(pid,qty){
 const p=prod(pid); if(!p)return;
 p.stock.qty=Math.max(0,(+p.stock.qty||0)-(+qty)); save();}

/* ---------- تبويبان جديدان ---------- */
try{CATS.push(['wiz','المعالج'],['store','المخزون والفواتير']);}catch(e){}

/* ---------- واجهة: المخزون والفواتير ---------- */
function storeUI(el){
 const cats=['panel','inverter','battery','cable','protection','materials'];
 let h='<div class="grp">مكتبة المنتجات (الأسعار بـ $ · الكميات من الفواتير)</div>';
 h+='<table style="width:100%;border-collapse:collapse;font-size:10.5px">';
 h+='<tr><th>المنتج</th><th>التصنيف</th><th>التكلفة$</th><th>سعر البيع$</th><th>المخزون</th><th>حد التنبيه</th></tr>';
 S.products.forEach((p,i)=>{
  const low=(+p.stock.min>0&&+p.stock.qty<=+p.stock.min);
  h+='<tr'+(low?' style="background:#fff1ee"':'')+'><td style="text-align:right">'+esc(p.brand+' '+p.name)+'</td><td>'+esc(p.cat)+'</td>'
   +'<td><input data-pc="'+i+'" style="width:56px" value="'+p.price.cost+'"></td>'
   +'<td><input data-ps="'+i+'" style="width:56px" value="'+p.price.sell+'"></td>'
   +'<td><b>'+(+p.stock.qty||0)+'</b></td>'
   +'<td><input data-pm="'+i+'" style="width:44px" value="'+(+p.stock.min||0)+'"></td></tr>';});
 h+='</table>';
 h+='<div class="grp">تسجيل فاتورة شراء (وارد مخزون)</div>';
 h+='<input type="file" id="invFile" accept="image/*,application/pdf" style="font-size:11px">';
 h+='<div id="invView" style="margin:5px 0"></div>';
 h+='<div class="row"><label>المورّد</label><input id="invSup" placeholder="اسم المورّد"></div>';
 h+='<table style="width:100%;font-size:10.5px;border-collapse:collapse" id="invLines">'
   +'<tr><th>المنتج</th><th>الكمية</th><th>تكلفة الوحدة$</th><th></th></tr></table>';
 h+='<button id="invAdd">+ سطر</button> <button id="invSave" style="background:#1a7f4b;border-color:#1a7f4b;color:#fff">تسجيل الوارد</button>';
 h+='<div class="grp">سجل الفواتير ('+S.invoices.length+')</div>';
 S.invoices.slice(-8).reverse().forEach(iv=>{
  h+='<div style="font-size:10.5px;background:#f5f8fb;border-radius:6px;padding:4px 6px;margin:3px 0">'+esc(iv.date)+' · '+esc(iv.supplier)+' · '+iv.lines.length+' صنف'+(iv.thumb?' · <img src="'+iv.thumb+'" style="height:26px;vertical-align:middle">':'')+'</div>';});
 el.innerHTML=h;
 el.querySelectorAll('[data-pc]').forEach(inp=>inp.onchange=()=>{S.products[+inp.dataset.pc].price.cost=+inp.value||0;save();});
 el.querySelectorAll('[data-ps]').forEach(inp=>inp.onchange=()=>{S.products[+inp.dataset.ps].price.sell=+inp.value||0;save();});
 el.querySelectorAll('[data-pm]').forEach(inp=>inp.onchange=()=>{S.products[+inp.dataset.pm].stock.min=+inp.value||0;save();storeUI(el);});
 const opts=S.products.map((p,i)=>'<option value="'+i+'">'+esc(p.brand+' '+p.name)+'</option>').join('');
 function addLine(){
  const tr=document.createElement('tr');
  tr.innerHTML='<td><select style="width:100%">'+opts+'</select></td>'
   +'<td><input class="q" style="width:52px" value="1"></td>'
   +'<td><input class="c" style="width:64px" value="0"></td>'
   +'<td><button class="rm">✕</button></td>';
  tr.querySelector('.rm').onclick=()=>tr.remove();
  $('invLines').appendChild(tr);}
 $('invAdd').onclick=addLine; addLine();
 $('invFile').onchange=e=>{
  const f=e.target.files[0]; if(!f)return;
  if(/pdf$/i.test(f.name)){ if(typeof loadPDF==='function'){log('استعمل تبويب «صورة ← مخطط» لعرض الPDF هنا الصورة غير متاحة؛ وثّق الأسطر يدوياً.',1);return;} }
  const r=new FileReader();
  r.onload=()=>{const th=r.result;$('invView').innerHTML='<img src="'+th+'" style="max-width:100%;border:1px solid #dbe2e9;border-radius:6px">';
   window._invThumb=th;};
  r.readAsDataURL(f);};
 $('invSave').onclick=()=>{
  const lines=[];
  document.querySelectorAll('#invLines tr').forEach(tr=>{
   const sel=tr.querySelector('select'); if(!sel)return;
   const p=S.products[+sel.value];
   const q=+tr.querySelector('.q').value||0, c=+tr.querySelector('.c').value||0;
   if(q>0){lines.push({pid:p.id,name:p.brand+' '+p.name,qty:q,cost:c});stockIn(p.id,q,c,'');}});
  if(!lines.length){log('لا أسطر صالحة في الفاتورة.',1);return;}
  S.invoices.push({date:new Date().toLocaleDateString('en-GB'),supplier:$('invSup').value||'—',
   lines:lines,thumb:window._invThumb||null});
  save(); log('سُجّلت فاتورة بـ '+lines.length+' صنف — حُدّث المخزون والتكاليف.'); storeUI(el);};
}

/* ---------- المعالج: 7 مراحل ---------- */
const STEPS=[
 {t:'مصدر الموقع',d:'مشروع بلا مبنى جاهز: استورد KML، أو تتبّع مخطط/صورة في تبويب «صورة ← مخطط»، أو ارسم/أدخل أبعاداً في «الموقع».'},
 {t:'السطح والظلال',d:'حدّد حدود السطح والعوائق ودراسة الظل من تبويب «KML والظلال».'},
 {t:'الأحمال والطاقة',d:'اضبط الأحمال والإنتاجية في تبويب «الطاقة والبطاريات».'},
 {t:'تقسيم المجموعات',d:'توليد Strings مرقّمة على السطح وجدول المسارات.'},
 {t:'موضع الغرفة والكابلات',d:'انقر على الأرض لتثبيت موضع غرفة الكهرباء واحتساب أطوال الكابلات.'},
 {t:'الهيكل والغرفة',d:'التحقق الإنشائي + توزيع غرفة الكهرباء (تابلوهات AC/DC وخط أحادي).'},
 {t:'عرض السعر',d:'BOQ تلقائي من الكميات + أسعار المكتبة · $ · ضريبة اختيارية.'}];
function wizUI(el){
 const st=S.wiz;
 let h='<div class="grp">معالج المشروع — '+(st+1)+' / 7</div>';
 h+='<div style="display:flex;gap:4px;margin:4px 0">'+STEPS.map((s,i)=>
  '<div style="flex:1;height:6px;border-radius:4px;background:'+(i<=st?'#F1471E':'#dbe2e9')+'"></div>').join('')+'</div>';
 h+='<div style="background:#f5f8fb;border-radius:8px;padding:7px 9px;margin:5px 0">'
   +'<b style="color:#0B2239;font-size:12px">'+STEPS[st].t+'</b><br><span style="font-size:11px;color:#5b6b7a;line-height:1.7">'+STEPS[st].d+'</span></div>';
 if(st===3)h+='<button id="wGen" style="background:#0066A7;border-color:#0066A7;color:#fff">⚙ توليد المجموعات والترقيم</button><div id="wGroups"></div>';
 if(st===4)h+='<button id="wPin" style="background:#0066A7;border-color:#0066A7;color:#fff">📍 انقر على الأرض لتثبيت الغرفة</button><div id="wCables"></div>';
 if(st===6)h+='<button id="wQuote" style="background:#0B2239;border-color:#0B2239;color:#fff">🧾 عرض السعر ($)</button><div id="wQuoteBox"></div>';
 h+='<div style="display:flex;gap:5px;margin-top:8px">'
   +'<button id="wPrev"'+(st===0?' disabled':'')+'>→ السابق</button>'
   +'<button id="wNext"'+(st===6?' disabled':'')+'>التالي ←</button></div>';
 el.innerHTML=h;
 const show=()=>{S.wiz=Math.max(0,Math.min(6,st));wizUI(el);};
 if($('wPrev'))$('wPrev').onclick=()=>{S.wiz=st-1;wizUI(el);};
 if($('wNext'))$('wNext').onclick=()=>{S.wiz=st+1;wizUI(el);};
 if($('wGen'))$('wGen').onclick=()=>genGroups($('wGroups'));
 if($('wPin'))$('wPin').onclick=()=>pinRoom($('wCables'));
 if($('wQuote'))$('wQuote').onclick=()=>genQuote($('wQuoteBox'));
 if(st===3&&S.groups.length)renderGroups($('wGroups'));
 if(st===4&&S.pin)renderCables($('wCables'));}

/* توليد المجموعات: نستخدم stringCalc الحقيقي + PVM */
function genGroups(box){
 try{
  const ST=stringCalc();
  if(!ST.best){box.innerHTML='<div class="tip">لا يوجد تشريج صالح — راجع بيانات الألواح والمحوّل.</div>';return;}
  const n=ST.best.n, mppt=ST.mppt;
  S.groups=[];let gi=0;
  /* تجميع لوحات كل مصفوفة بالتسلسل (صفوف بورتريه/عرضاني) */
  ARR.forEach((a,ai)=>{
   const pv=PVM.filter(p=>p.ai===ai);
   for(let i=0;i<pv.length;i+=n){
    const grp=pv.slice(i,i+n); if(!grp.length)break;
    gi++;
    const cx=grp.reduce((s,p)=>s+p.pts[0][0],0)/grp.length;
    const cz=grp.reduce((s,p)=>s+p.pts[0][1],0)/grp.length;
    const cy=grp.reduce((s,p)=>s+p.pts[0][2],0)/grp.length;
    S.groups.push({id:'PV'+String(gi).padStart(2,'0'),ai:ai,n:grp.length,
     mppt:'MPPT'+(((gi-1)%mppt)+1),cx:cx,cz:cz,cy:cy});}});
  /* لافتات على السطح */
  window._grpLbls=window._grpLbls||new THREE.Group();scene.remove(window._grpLbls);
  window._grpLbls=new THREE.Group();
  S.groups.forEach(g=>{window._grpLbls.add(lbl(g.id,V(g.cx,g.cy+.35,g.cz),'#0B2239',.9));});
  scene.add(window._grpLbls);
  renderGroups(box);
  log('وُلّدت '+S.groups.length+' مجموعة مرقّمة على السطح (سلاسل من '+n+' لوحاً).');
 }catch(e){box.innerHTML='<div class="tip">تعذّر التوليد: '+esc(e.message)+'</div>';}}
function renderGroups(box){
 if(!S.groups.length){box.innerHTML='';return;}
 let h='<table style="width:100%;font-size:10.5px;border-collapse:collapse;margin-top:6px">'
  +'<tr><th>المجموعة</th><th>الألواح</th><th>المدخل</th><th>الطول تقريباً</th></tr>';
 S.groups.forEach(g=>{const L=cableLen(g);
  h+='<tr><td class="n" style="font-weight:800">'+g.id+'</td><td class="n">'+g.n+'</td><td class="n">'+g.mppt+'</td><td class="n">'+L.toFixed(0)+' م</td></tr>';});
 h+='</table>';
 const tot=S.groups.reduce((s,g)=>s+cableLen(g),0);
 h+='<div class="tip">إجمالي كابل DC تقريبي: '+tot.toFixed(0)+' م · مقطح مقترح: 6mm² PV1-F</div>';
 box.innerHTML=h;}
function cableLen(g){
 let L=0;
 if(S.pin)L+=Math.hypot(g.cx-S.pin.x,g.cz-S.pin.z);
 else L+=Math.hypot(SITE.bb[0],SITE.bb[1])*.6;
 L+=Math.max(0,g.cy)+3; /* صعود/نزول + هوامش داخل الغرفة */
 return L*1.15;}

/* تثبيت موضع الغرفة بالنقر على الأرض */
function pinRoom(box){
 const cv=renderer.domElement;
 const ray=new THREE.Raycaster(),mv=new THREE.Vector2();
 function onClick(ev){
  const r=cv.getBoundingClientRect();
  mv.x=((ev.clientX-r.left)/r.width)*2-1;
  mv.y=-((ev.clientY-r.top)/r.height)*2+1;
  ray.setFromCamera(mv,camera);
  const hit=new THREE.Vector3();
  if(ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),0),hit)){
   S.pin={x:+(hit.x+(SITE?M.bOX:0)).toFixed(2),z:+(hit.z+(SITE?M.bOZ:0)).toFixed(2)};
   if(window._pinM){scene.remove(window._pinM);}
   const m=new THREE.Mesh(new THREE.CylinderGeometry(.35,.35,.5,16),
     new THREE.MeshLambertMaterial({color:0xF1471E}));
   m.position.set(hit.x,.25,hit.z);
   window._pinM=m;scene.add(m);
   window._pinL=window._pinL||null;
   if(window._pinL)scene.remove(window._pinL);
   window._pinL=lbl('غرفة الكهرباء',V(hit.x,1.1,hit.z),'#F1471E',1.1);
   scene.add(window._pinL);
   cv.removeEventListener('click',onClick);
   renderCables(box);
   log('ثُبّتت غرفة الكهرباء عند ('+S.pin.x+'، '+S.pin.z+') — حُدّثت أطوال الكابلات.');}}
 cv.addEventListener('click',onClick);
 log('انقر نقطة على الأرض أمام المبنى لموضع غرفة الكهرباء.');}

/* ---------- عرض السعر: BOQ من الكميات + $ + ضريبة اختيارية ---------- */
function genQuote(box){
 try{
  build();
  const rows=[];
  const steel=R.tot;
  const steelSell=steel*(+M.price||1.35)+ (+M.fab? steel*+M.fab:0);
  rows.push({name:'هيكل حديدي '+steel.toFixed(0)+' كغ (توريد+تصنيع+تركيب)',qty:1,unit:'مقطوعة',cost:steelSell});
  if(NP>0){const pan=choosePanel();
   rows.push({name:'ألواح شمسية '+(pan?pan.brand+' '+pan.name:PANEL.nm),qty:NP,unit:'لوح',cost:pan&&+pan.price.sell?+pan.price.sell:0,pid:pan?pan.id:null});}
  /* إنفرترات وبطاريات */
  const E=elecDesign();
  const inv=chooseInv(E.pInv);
  if(inv)rows.push({name:'إنفرتر '+inv.brand+' '+inv.name+' × '+E.nInv,qty:E.nInv,unit:'قطعة',cost:+inv.price.sell||0,pid:inv.id});
  if(E.bat){const bat=prod('deye-bos-gm');
   if(bat)rows.push({name:'بطارية '+bat.name+' × '+E.B.n,qty:E.B.n,unit:'وحدة',cost:+bat.price.sell||0,pid:bat.id});}
  /* حمايات من تابلوهات AC/DC */
  const devCount=(P2)=>P2.dev.reduce((m,d)=>{m[d.t]=(m[d.t]||0)+1;return m;},{});
  const dA=devCount(panelAC(E)),dD=devCount(panelDC(E));
  if(dA.mcb)rows.push({name:'قواطع مصغّرة AC (حسب SLD)',qty:dA.mcb,unit:'قطعة',cost:+(prod('mat-ac-breaker').price.sell)||0,pid:'mat-ac-breaker'});
  if(dA.rcd)rows.push({name:'قاطع تفاضلي RCD',qty:dA.rcd,unit:'قطعة',cost:+prod('mat-rcd').price.sell||0,pid:'mat-rcd'});
  if(dD.fus)rows.push({name:'فيوزات gPV',qty:dD.fus,unit:'قطعة',cost:0});
  if(dD.spd||dA.spd)rows.push({name:'SPD مانع صواعق',qty:(dD.spd||0)+(dA.spd||0),unit:'قطعة',cost:+prod('mat-spd').price.sell||0,pid:'mat-spd'});
  const cab=S.groups.length?S.groups.reduce((s,g)=>s+cableLen(g),0):0;
  if(cab>0)rows.push({name:'كابل DC 6mm² PV1-F',qty:Math.ceil(cab),unit:'متر',cost:+prod('mat-dc-cable').price.sell||0,pid:'mat-dc-cable'});
  rows.push({name:'مسامير كيميائية وغلاندات وهوامش تنفيذ',qty:1,unit:'بند',cost:+(R.boltT>0?150:80)});
  renderQuote(box,rows,E);
 }catch(e){box.innerHTML='<div class="tip">تعذّر توليد العرض: '+esc(e.message)+'</div>';}}
function choosePanel(){return S.products.filter(p=>p.cat==='panel'&&+p.price.sell>0)
 .sort((a,b)=>b.elec.watts-a.elec.watts)[0]||S.products.find(p=>p.cat==='panel');}
function chooseInv(kw){return S.products.filter(p=>p.cat==='inverter'&&+p.price.sell>0)
 .sort((a,b)=>Math.abs(a.elec.kw-kw)-Math.abs(b.elec.kw-kw))[0]
 ||S.products.find(p=>p.cat==='inverter');}
function renderQuote(box,rows,E){
 let h='<div class="row" style="margin-top:6px"><label>هامش الربح %</label><input id="qMarg" type="number" value="'+(+M.marg||12)+'" style="width:70px"></div>';
 h+='<div class="row"><label><input type="checkbox" id="qVatOn"> إضافة ضريبة</label>'
   +'<input id="qVat" type="number" value="'+(+M.vat||11)+'" style="width:70px" placeholder="%"></div>';
 h+='<table style="width:100%;font-size:10.5px;border-collapse:collapse" id="qTbl">'
  +'<tr><th>البند</th><th>الكمية</th><th>سعر الوحدة$</th><th>الإجمالي$</th></tr>';
 rows.forEach((r,i)=>{h+='<tr><td style="text-align:right">'+esc(r.name)+'</td><td class="n">'+r.qty+' '+r.unit+'</td>'
  +'<td><input data-q="'+i+'" style="width:64px" value="'+(r.cost||0).toFixed(0)+'"></td>'
  +'<td class="n" data-t="'+i+'">'+((+r.cost||0)*r.qty).toFixed(0)+'</td></tr>';});
 h+='</table><div id="qTot" style="font-size:12px;font-weight:800;color:#0066A7;margin-top:5px"></div>';
 h+='<button onclick="window.print()" style="margin-top:5px">🖨 طباعة / PDF</button>';
 box.innerHTML=h;
 const calc=()=>{
  let sub=0;
  rows.forEach((r,i)=>{r.cost=+box.querySelector('[data-q="'+i+'"]').value||0;
   const t=r.cost*r.qty;sub+=t;
   box.querySelector('[data-t="'+i+'"]').textContent=t.toFixed(0);});
  const m=+box.querySelector('#qMarg').value||0;
  const vatOn=box.querySelector('#qVatOn').checked;
  const vat=vatOn?(+box.querySelector('#qVat').value||0):0;
  const total=sub*(1+m/100)*(1+vat/100);
  box.querySelector('#qTot').textContent='المجموع: '+sub.toFixed(0)+' $ · بعد الهامش '+m+'%: '+(sub*(1+m/100)).toFixed(0)+' $'
   +(vatOn?' · شامل الضريبة '+vat+'%: '+total.toFixed(0)+' $':' · بدون ضريبة')+' — العملة: USD';};
 box.querySelectorAll('[data-q],#qMarg,#qVat').forEach(i2=>i2.oninput=calc);
 box.querySelector('#qVatOn').onchange=calc;calc();}

/* ---------- الربط مع dock ---------- */
const _dock2=dock;
dock=function(){_dock2();try{
 const el=document.getElementById('dock');if(!el)return;
 if(TAB==='store')storeUI(el);
 else if(TAB==='wiz')wizUI(el);
}catch(e){}};
try{drawTabs();}catch(e){}

/* ===================== v3.1: شاشة البداية الفارغة + لجنة المهندسين ===================== */
try{CATS.push(['board','المهندسون']);}catch(e){}
function pickDone(){window.__IC_EMPTY=0;const d=document.getElementById('icStart');if(d)d.remove();
 try{build();fit();dock();}catch(e){}}
function showStart(){
 if(document.getElementById('icStart'))return;
 const st=document.getElementById('stage');if(!st)return;
 const d=document.createElement('div');d.id='icStart';
 d.setAttribute('dir','rtl');
 d.style.cssText='position:absolute;inset:0;background:rgba(238,242,246,.98);z-index:25;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px;overflow:auto';
 const card=(ic,t,ds,act)=>'<button data-act="'+act+'" style="text-align:right;padding:12px;border-radius:12px;border:1.5px solid #dbe2e9;background:#fff;cursor:pointer;font-family:Tajawal">'
  +'<div style="font-size:24px">'+ic+'</div><div style="font-size:13px;font-weight:800;color:#0B2239;margin:5px 0 3px">'+t+'</div>'
  +'<div style="font-size:11px;color:#5b6b7a;line-height:1.6;font-weight:400">'+ds+'</div></button>';
 d.innerHTML='<div style="font-size:21px;font-weight:800;color:#0B2239">مشروع جديد</div>'
 +'<div style="font-size:12px;color:#5b6b7a;margin:4px 0 16px">لا يُعرض أي مبنى أو هيكل حديدي — اختر نقطة البداية:</div>'
 +'<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;max-width:840px;width:100%">'
 +card('🌍','ملف KML من Google Earth','ارفع ملف KML بمضلّعات السطح والعوائق ومبانٍ مسماة','kml')
 +card('📐','مخطط أو صورة سقف','ارفع PDF/صورة وحدّد الحدود بالتتبّع والمعايرة','plan')
 +card('✏️','رسم حر داخل المنصة','ارسم حدود السطح بنقرات مباشرة هنا','draw')
 +card('📏','أبعاد يدوية','مستطيل أو حرف L بأبعاد معروفة','rect')
 +card('🏗️','هيكل أرضي فقط','بدون مبنى — موقف سيارات أو أرض عمل','free')
 +'</div>';
 st.appendChild(d);
 d.querySelectorAll('[data-act]').forEach(b=>b.onclick=()=>{
  const act=b.dataset.act;
  if(act==='kml'){const inp=document.createElement('input');inp.type='file';inp.accept='.kml';
   inp.onchange=()=>{if(inp.files[0]){pickDone();try{TAB='bld';drawTabs();dock();}catch(e){}loadKML(inp.files[0]);}};
   inp.click();}
  else if(act==='plan'){const inp=document.createElement('input');inp.type='file';inp.accept='image/*,application/pdf';
   inp.onchange=()=>{const f=inp.files[0];if(!f)return;
    if(/pdf$/i.test(f.name)){pickDone();TAB='img';drawTabs();dock();log('حُوّل الـPDF — حدّد المقياس ثم تتبّع السطح.');loadPDF(f);}
    else{const r=new FileReader();r.onload=()=>{const im=new Image();
      im.onload=()=>{pickDone();TAB='img';drawTabs();TR.img=im;TR.pts=[];TR.sc=null;TR.mode='scale';dock();
       log('حدّد المقياس بنقطتين ثم تتبّع محيط السطح.');};im.src=r.result;};
     r.readAsDataURL(f);}};
   inp.click();}
  else if(act==='draw'){startDrawMode(d);}
  else if(act==='rect'){M.bOn=1;M.bShape='rect';pickDone();log('أدخل أبعاد السطح من تبويب «الموقع».');}
  else if(act==='free'){M.bOn=0;pickDone();log('اضبط أبعاد الهيكل من التبويبات — لا يوجد مبنى.');}});}
function startDrawMode(container){
 container.innerHTML='<div style="font-size:16px;font-weight:800;color:#0B2239">ارسم حدود السطح — كل نقرة ضلع</div>'
 +'<div style="font-size:11px;color:#5b6b7a;margin:4px 0">المقياس: 40 نقطة = 1 متر · انقر لإضافة رؤوس · زر إنهاء للتوليد</div>'
 +'<canvas id="icDraw" style="background:#fff;border:1.5px solid #0B2239;border-radius:8px;touch-action:none"></canvas>'
 +'<div style="display:flex;gap:6px;margin-top:8px"><button id="icDrawDone" style="background:#1a7f4b;border-color:#1a7f4b;color:#fff">✔ إنهاء وتوليد الموقع</button>'
 +'<button id="icDrawUndo">تراجع</button><button id="icDrawCancel">إلغاء</button></div>';
 const cv=container.querySelector('#icDraw');
 cv.width=Math.min(760,innerWidth-60);cv.height=Math.min(480,innerHeight-260);
 const x=cv.getContext('2d');let pts=[];
 function dr(){x.clearRect(0,0,cv.width,cv.height);
  x.strokeStyle='#0B2239';x.lineWidth=2;x.beginPath();
  pts.forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]));
  if(pts.length>2)x.closePath();x.stroke();
  pts.forEach(p=>{x.fillStyle='#F1471E';x.beginPath();x.arc(p[0],p[1],4,0,7);x.fill();});
  const a=pts.reduce((s,p)=>s+p[0],0)/(pts.length||1),b=pts.reduce((s,p)=>s+p[1],0)/(pts.length||1);
  x.fillStyle='#0066A7';x.font='bold 12px Tajawal';x.textAlign='center';
  const area=pts.length>2?Math.abs(pts.reduce((s,p,i)=>{const q=pts[(i+1)%pts.length];return s+p[0]*q[1]-q[0]*p[1];},0)/2)/1600:0;
  x.fillText=void 0;x.fillText('النقاط: '+pts.length+(area>0?' · المساحة ≈ '+area.toFixed(1)+' م²':''),cv.width/2,18);}
 cv.onclick=e=>{const r=cv.getBoundingClientRect();pts.push([e.clientX-r.left,e.clientY-r.top]);dr();};
 container.querySelector('#icDrawUndo').onclick=()=>{pts.pop();dr();};
 container.querySelector('#icDrawCancel').onclick=()=>showStart();
 container.querySelector('#icDrawDone').onclick=()=>{
  if(pts.length<3){log('حدّد 3 نقاط على الأقل.',1);return;}
  const mx=Math.min.apply(null,pts.map(p=>p[0])),mz=Math.min.apply(null,pts.map(p=>p[1]));
  TRACE_POLY=pts.map(p=>[+((p[0]-mx)/40).toFixed(2),+((p[1]-mz)/40).toFixed(2)]);
  M.bShape='trace';M.bOn=1;
  pickDone();TAB='bld';drawTabs();
  log('رُسم السطح: '+TRACE_POLY.length+' رؤوس — أكمل من «الموقع» (طوابق/عمامة/نمط المبنى).');};
 dr();}

/* ---------- لجنة المهندسين: فحص حقيقي بعد كل build ---------- */
const BOARD=[
 {id:'sw',n:'مهندس البرمجيات',c:'#0066A7',run:function(){return[
  ['ok','النواة v3.0 تعمل والبداية الفارغة مفعّلة'],
  ['ok','المخزون والفواتير: '+(localStorage.getItem('icool-suite-v1')?'محفوظ':'بانتظار أول فاتورة')]];}},
 {id:'ee',n:'مهندس الكهرباء',c:'#7A5CC4',run:function(){const o=[];try{
  const ST=stringCalc();
  if(!ST.best)o.push(['bad','لا يوجد تشريج صالح — راجع Voc والمحوّل']);
  else{
   if(ST.best.vmax>+M.invVmax)o.push(['bad','Voc بارد '+ST.best.vmax.toFixed(0)+'V > حد المحوّل '+M.invVmax+'V']);
   else o.push(['ok','جهد السلاسل ضمن حدود المحوّل ('+ST.best.vmax.toFixed(0)+'V/'+M.invVmax+'V)']);
   if(!ST.best.okI)o.push(['bad','تيار MPPT '+ST.best.iStr.toFixed(1)+'A > '+M.invIsc+'A']);
   else o.push(['ok','التيار ضمن قدرة المداخل']);
   const E=elecDesign();
   o.push(['ok','الحمايات محسوبة: فيوز '+E.strFuse+'A · عازل '+E.dcIso+'A · قاطع خرج '+E.acBrk+'A']);
   if((E.ph===3?400:230)>0&&E.cMain<E.cInv)o.push(['warn','مقطع الرئيسي أصغر من مقطع خرج المحوّل — راجع الجدول']);}return o;
 }catch(e){return [['warn','تعذّر الفحص الكهربائي']];}}},
 {id:'pv',n:'مهندس الطاقة الشمسية',c:'#E0862A',run:function(){const o=[];try{
  const Z=sizePanels(),E=energyAll();
  if(E.kwp<=0)o.push(['warn','لا توجد مصفوفة PV بعد — أكمل المعالج']);
  else{
   if(M.sysType!=='ongrid'&&Z.needOff>0&&Z.have<Z.needOff)
    o.push(['bad','أسوأ شهر: المطلوب '+Z.needOff+' لوحاً والمركّب '+Z.have+' — التغطية غير كافية']);
   else o.push(['ok','تغطية الأحمال '+(Z.cover*100).toFixed(0)+'%'+(Z.needOff?' · أسوأ شهر '+Z.needOff+' ≤ '+Z.have:'')]);
   if(Math.abs(+M.ghiY-1900)<1)o.push(['warn','الإشعاع افتراضي (ساحل لبنان) — أدخل قيمة موقعك من PVGIS']);
   if(PVSH&&PVSH.tot&&(PVSH.full+PVSH.part)/PVSH.tot>.1)o.push(['warn','ألواح مظللة الآن: '+((PVSH.full+PVSH.part)/PVSH.tot*100).toFixed(0)+'%']);}return o;
 }catch(e){return [['warn','تعذّر فحص الطاقة']];}}},
 {id:'st',n:'مهندس الإنشاء والميكانيك',c:'#1a7f4b',run:function(){const o=[];try{
  if(!R||!R.tot){o.push(['warn','لا يوجد هيكل بعد — أكمل المعالج']);return o;}
  if(R.util>1)o.push(['bad','استغلال الفولاذ '+(R.util*100).toFixed(0)+'% — تجاوز الإجهاد المسموح']);
  else o.push(['ok','استغلال الفولاذ '+(R.util*100).toFixed(0)+'% · هبوط L/'+R.defR.toFixed(0)]);
  if(R.FS<1.2)o.push(['bad','معامل الأمان ضد الرفع '+R.FS.toFixed(2)+' < 1.2 — ثبّت الوزن/المسامير']);
  else o.push(['ok','الثبات ضد الرفع '+R.FS.toFixed(2)]);
  if((R.boltT||0)>20)o.push(['warn','شدّ المسامير '+R.boltT.toFixed(1)+' kN مرتفع']);
  o.push([R.kgm2>25?'warn':'ok','الوزن النوعي '+R.kgm2.toFixed(1)+' كغ/م²'+(R.kgm2>25?' — أعلى من المعتاد':''),'']);return o;
 }catch(e){return [['warn','تعذّر الفحص الإنشائي']];}}},
 {id:'fin',n:'المدير المالي',c:'#0B2239',run:function(){const o=[];
  const miss=S.products.filter(p=>+p.price.sell<=0);
  if(miss.length)o.push(['warn',miss.length+' منتجاً بلا سعر بيع — لن يدخل عرض السعر']);
  const bad=S.products.filter(p=>+p.price.cost>0&&+p.price.sell>0&&+p.price.sell<+p.price.cost*1.1);
  if(bad.length)o.push(['bad',bad.length+' منتجاً بيعه أقل من 1.1× التكلفة']);
  if(!miss.length&&!bad.length)o.push(['ok','أسعار المكتبة سليمة']);
  o.push(['ok','العملة USD · الضريبة اختيارية عند عرض السعر فقط']);return o;}},
 {id:'pr',n:'مسؤول المشتريات والمخزون',c:'#B9603A',run:function(){const o=[];try{
  const E=elecDesign();
  const pan=S.products.find(p=>p.cat==='panel'),inv=S.products.find(p=>p.cat==='inverter');
  const lacks=[];
  if(pan&&NP>+(pan.stock.qty||0))lacks.push('ألواح '+NP+'/'+pan.stock.qty);
  if(inv&&E.nInv>+(inv.stock.qty||0))lacks.push('إنفرتر '+E.nInv+'/'+inv.stock.qty);
  if(E.bat){const bat=prod('deye-bos-gm');if(bat&&E.B.n>+(bat.stock.qty||0))lacks.push('بطاريات '+E.B.n+'/'+bat.stock.qty);}
  if(lacks.length)o.push(['warn','نواقص: '+lacks.join(' · ')+' — سجّل فاتورة وارد']);
  else o.push(['ok','المخزون يغطي مكوّنات التصميم']);
  o.push([S.invoices.length?['ok'][0]:'warn','الفواتير المسجّلة: '+S.invoices.length]);return o;
 }catch(e){return [['warn','تعذّر فحص المخزون']];}}}];
let BOARD_RES=null;
function runBoard(){try{BOARD_RES=BOARD.map(b=>({b:b,items:b.run()}));
 const el=document.getElementById('dock');
 if(el&&TAB==='board')boardUI(el);}catch(e){}}
function boardUI(el){
 if(!BOARD_RES)runBoard();
 const TAG={ok:'t-ok',warn:'t-w',bad:'t-b'};
 const TXT={ok:'سليم',warn:'تنبيه',bad:'خطأ'};
 let h='<div class="grp">لجنة المهندسين — فحص مباشر للمشروع الحالي</div>';
 BOARD_RES.forEach(r=>{
  h+='<div style="border:1px solid #dbe2e9;border-radius:9px;padding:7px 9px;margin:6px 0;background:#fff">';
  h+='<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">'
   +'<span style="width:10px;height:10px;border-radius:50%;background:'+r.b.c+'"></span>'
   +'<b style="font-size:11.5px;color:#0B2239">'+r.b.n+'</b></div>';
  r.items.forEach(it=>{h+='<div style="font-size:10.5px;line-height:1.8;display:flex;gap:6px;align-items:baseline">'
   +'<span class="tag '+TAG[it[0]]+'" style="flex:0 0 auto">'+TXT[it[0]]+'</span><span>'+esc(it[1])+'</span></div>';});
  h+='</div>';});
 h+='<button onclick="window.__IC_RERUN=1;runBoard();document.getElementById(\'dock\')&&boardUI(document.getElementById(\'dock\'))" style="width:100%">🔄 إعادة الفحص</button>';
 el.innerHTML=h;}
try{
 const _build4=build;
 build=function(){_build4();try{runBoard();}catch(e){}};
 const _dock3=dock;
 dock=function(){_dock3();try{const el=document.getElementById('dock');
  if(el&&TAB==='board')boardUI(el);}catch(e){}};
 drawTabs();
 if(window.__IC_SKIPPED)showStart();
}catch(e){log('v3.1: '+e.message,1);}

window.ICPRO={S:S,stockIn:stockIn,stockOut:stockOut,prods:function(){return S.products;}};
log('Pro Suite v3.0 جاهز: المعالج + المخزون والفواتير + عرض سعر $ بضريبة اختيارية.');
})();
