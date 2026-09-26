/* =====================================================================
   iCOOL Steel Studio — Deye Realism Pack v1.0
   ---------------------------------------------------------------------
   غرض الملف: رفع واقعية غرفة الكهرباء لمشاريع Deye / Deye ESS
   - كتالوج أبعاد حقيقية (م approx — يُستكمل من Datasheet الرسمي قبل الاعتماد)
   - واجهات (Faces) مرسومة: شاشة LCD ملوّنة بمؤشرات PV/Grid/Battery،
     مؤشرات LED، منطقة AC/DC، Dongle واي فاي
   - بناة ثلاثية الأبعاد: جسم PBR + حامل حائط + لوح غلاندات + مكدس بطاريات
   طريقة الدمج في المنصة (3 خطوات):
     1) بعد تعريف EQLIB أضف: DEYE_PATCH.patchPlatform();
     2) استبدل تسمية invModel بمفاتيح DEYE_INV (تُبقى المفاتيح القديمة تعمل)
     3) في eqMeshR استدعِ DEYE_PATCH.build3D(e) بدل sbox/facedBox للأنواع inv/batw
   ملاحظة المدقّق: كل بُعد معلَّم بـ approx يجب مطابقته مع Datasheet
   Deye الرسمي (rev. 2025) قبل طباعة أي لوحة تنفيذية.
   ===================================================================== */
const DEYE_PATCH = (function(){

/* ---------- 1) الكتالوج ----------
   w,h,d بالمتر · kg · type: 'LV3' هجين ثلاثي الطور جهد منخفض (مع BOS-GM)
   'HV3' هجين جهد عالٍ (مع بطارية HV stack) · 'MICRO' مايكرو لتوسعة مستقبلية */
const DEYE_INV = {
 'SUN-5K-SG04LP3' :{n:'Deye SUN-5K-SG04LP3', kw:5, w:.500,h:.440,d:.180,kg:23, type:'LV3', approx:1},
 'SUN-6K-SG04LP3' :{n:'Deye SUN-6K-SG04LP3', kw:6, w:.500,h:.440,d:.180,kg:23, type:'LV3', approx:1},
 'SUN-8K-SG04LP3' :{n:'Deye SUN-8K-SG04LP3', kw:8, w:.500,h:.440,d:.180,kg:24, type:'LV3', approx:1},
 'SUN-10K-SG04LP3':{n:'Deye SUN-10K-SG04LP3',kw:10,w:.520,h:.455,d:.185,kg:26, type:'LV3', approx:1},
 'SUN-12K-SG04LP3':{n:'Deye SUN-12K-SG04LP3',kw:12,w:.520,h:.455,d:.185,kg:27, type:'LV3', approx:1},
 'SUN-15K-SG04LP3':{n:'Deye SUN-15K-SG04LP3',kw:15,w:.545,h:.470,d:.190,kg:30, type:'LV3', approx:1},
 'SUN-20K-SG04LP3':{n:'Deye SUN-20K-SG04LP3',kw:20,w:.545,h:.470,d:.190,kg:31, type:'LV3', approx:1},
 'SUN-30K-SG01HP3':{n:'Deye SUN-30K-SG01HP3-EUR',kw:30,w:.610,h:.500,d:.230,kg:42,type:'HV3', approx:1},
 'SUN-40K-SG01HP3':{n:'Deye SUN-40K-SG01HP3-EUR',kw:40,w:.610,h:.500,d:.230,kg:43,type:'HV3', approx:1},
 'SUN-50K-SG01HP3':{n:'Deye SUN-50K-SG01HP3-EUR',kw:50,w:.640,h:.530,d:.250,kg:49,type:'HV3', approx:1}
};
/* بطاريات Deye ESS — BOS-GM5.1 وحدات 51.2V/100Ah تُكدَّس، وBOS-A للجدار */
const DEYE_BAT = {
 'BOS-GM5.1'   :{n:'Deye BOS-GM5.1 (51.2V 100Ah)',w:.480,h:.220,d:.460,kg:44,kwh:5.12,stackMax:8, approx:1},
 'BOS-A'       :{n:'Deye BOS-A 51.2V 100Ah',        w:.520,h:.650,d:.210,kg:48,kwh:5.12, approx:1},
 'BOS-G'       :{n:'Deye BOS-G (HV stack module)',  w:.550,h:.220,d:.480,kg:55,kwh:5.12,stackMax:12, approx:1}
};

/* ---------- 2) خامات واقعية (تتطلب THREE ≥ r128 موجود في المنصة) ---------- */
function smat(col,rough,metal){
 const m=new THREE.MeshStandardMaterial({color:col,roughness:rough==null?.55:rough,metalness:metal||.15});
 if(m.color.convertSRGBToLinear)m.color.convertSRGBToLinear();
 return m;}
const MATS={
 body : smat(0xECEEEF,.42,.25),      // هيكل ألمنيوم فاتح
 dark : smat(0x2A2F33,.50,.40),      // غطاء طرفي
 rail : smat(0x9AA1A7,.35,.70),      // حامل الحائط
 gland: smat(0x1A1D20,.45,.30),
 plate: smat(0xD6DADD,.50,.35)
};

/* ---------- 3) واجهات Canvas للأجهزة ---------- */
function cv2(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function tex(c){const t=new THREE.CanvasTexture(c);
 if(THREE.sRGBEncoding)t.encoding=THREE.sRGBEncoding;return t;}

/* واجهة إنفرتر هجين: شاشة LCD ملوّنة + LED + مناطق AC/DC + Dongle */
function faceHybrid(lcd){
 const c=cv2(768,1024),x=c.getContext('2d');
 // جسم الجهاز
 const g=x.createLinearGradient(0,0,0,1024);
 g.addColorStop(0,'#F4F5F5');g.addColorStop(.62,'#E9EBEC');g.addColorStop(.63,'#D9DBDC');g.addColorStop(1,'#CFD2D3');
 x.fillStyle=g;x.fillRect(0,0,768,1024);
 x.strokeStyle='#B9BDC0';x.lineWidth=3;x.strokeRect(6,6,756,1012);
 // شريط علوي: مفاتيح DC وغطاء WiFi
 x.fillStyle='#E2E4E5';x.fillRect(30,36,708,120);
 for(let i=0;i<6;i++){x.fillStyle='#C7CACD';x.fillRect(60+i*112,56,84,58);
  x.fillStyle='#9AA0A4';x.fillRect(60+i*112,74,84,8);}
 x.fillStyle='#F5F6F6';x.fillRect(560,40,150,110);       // غطاء Dongle
 x.fillStyle='#2B6CB8';x.font='bold 26px Helvetica';x.textAlign='center';
 x.fillText('WiFi',635,128);
 // شاشة LCD
 x.fillStyle='#10151B';x.beginPath();x.roundRect(150,190,468,300,10);x.fill();
 x.strokeStyle='#3A4550';x.lineWidth=4;x.stroke();
 if(lcd){ // لوحة القياس: PV / Bat / Grid / Home
  x.fillStyle='#0E2A1F';x.fillRect(160,200,448,280);
  x.font='bold 30px Helvetica';
  x.fillStyle='#3FCF6B';x.textAlign='left'; x.fillText('PV',185,245);
  x.fillStyle='#4FB3FF';x.textAlign='right';x.fillText('GRID',585,245);
  x.fillStyle='#FFC845';x.textAlign='center';x.fillText('BAT',384,420);
  x.font='bold 44px Helvetica';x.fillStyle='#E8F6FF';x.textAlign='center';
  x.fillText('12.4 kW',384,300);
  x.font='28px Helvetica';x.fillText('96% · 51.2V',384,360);
  // أيقونات سهمية
  x.strokeStyle='#3FCF6B';x.lineWidth=5;x.beginPath();x.moveTo(280,300);x.lineTo(340,300);x.lineTo(330,288);x.moveTo(340,300);x.lineTo(330,312);x.stroke();
  x.strokeStyle='#4FB3FF';x.beginPath();x.moveTo(490,300);x.lineTo(430,300);x.lineTo(440,288);x.moveTo(430,300);x.lineTo(440,312);x.stroke();}
 else{x.fillStyle='#1B2836';x.font='bold 34px Helvetica';x.textAlign='center';
  x.fillText('Deye',384,330);x.fillStyle='#54627A';x.font='24px Helvetica';x.fillText('Hybrid Inverter',384,368);}
 // LED status
 [['#3FCF6B','RUN'],['#FFC845','WARN'],['#E05252','FAULT'],['#4FB3FF','COM']].forEach((L,i)=>{
  const lx=180+i*140;
  x.fillStyle=L[0];x.beginPath();x.arc(lx,540,10,0,7);x.fill();
  x.fillStyle='#6B7480';x.font='18px Helvetica';x.textAlign='center';x.fillText(L[1],lx,570);});
 // الشعار
 x.fillStyle='#0B5FBF';x.font='bold 62px Helvetica';x.textAlign='center';x.fillText('Deye',384,660);
 x.fillStyle='#7E868D';x.font='26px Helvetica';x.fillText('SUN-__K-SG04LP3',384,700);
 // منطقة AC (أسفل)
 x.fillStyle='#DDE0E2';x.fillRect(30,760,708,230);
 x.fillStyle='#2A2F33';x.fillRect(30,760,708,34);
 x.fillStyle='#fff';x.font='bold 22px Helvetica';x.textAlign='left';x.fillText('AC OUTPUT',46,786);
 x.fillStyle='#B9BDC0';
 for(let i=0;i<8;i++){x.fillRect(56+i*84,830,44,110);}     // غلاندات AC
 x.fillStyle='#8A9096';x.font='16px Helvetica';x.textAlign='center';
 x.fillText('PE',78,962);x.fillText('L1',162,962);x.fillText('L2',246,962);x.fillText('L3',330,962);
 x.fillText('N',414,962);x.fillText('GEN',498,962);x.fillText('CT',582,962);
 return tex(c);}

/* واجهة بطارية BOS-GM: حلقة SOC + مقابض */
function faceBattery(kwh,soc){
 const c=cv2(768,384),x=c.getContext('2d');
 x.fillStyle='#F2F3F4';x.fillRect(0,0,768,384);
 x.fillStyle='#E4E6E7';x.fillRect(0,0,768,54);
 x.fillStyle='#2A2F33';x.fillRect(24,12,140,30);       // زر الطاقة
 x.fillStyle='#3FCF6B';x.beginPath();x.arc(44,27,7,0,7);x.fill();
 // حلقة SOC
 x.strokeStyle='#D6DADD';x.lineWidth=16;x.beginPath();x.arc(384,190,86,0,7);x.stroke();
 x.strokeStyle='#2E9BE0';x.lineWidth=16;x.lineCap='round';
 x.beginPath();x.arc(384,190,86,-Math.PI/2,-Math.PI/2+Math.PI*2*(soc||96)/100);x.stroke();
 x.fillStyle='#16222e';x.font='bold 52px Helvetica';x.textAlign='center';
 x.fillText((soc||96)+'%',384,206);
 x.font='26px Helvetica';x.fillStyle='#7E868D';
 x.fillText('Deye BOS-GM5.1',384,330);
 x.fillText((kwh||5.12)+' kWh · LiFePO4',384,362);
 // مقبض علوي
 x.fillStyle='#C7CACD';x.fillRect(300,54,168,26);
 return tex(c);}

/* ---------- 4) بناة ثلاثية الأبعاد ---------- */
function sbox(w,h,d,m){const g=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);
 g.castShadow=true;g.receiveShadow=true;return g;}
function faced(w,h,d,t,col){
 const side=smat(col||0xECEEEF,.45,.2);
 const front=new THREE.MeshStandardMaterial({map:t,roughness:.42,metalness:.05});
 const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),[side,side,side,side,front,side]);
 m.castShadow=true;m.receiveShadow=true;return m;}

/* إنفرتر هجين Deye: جسم + واجهة + حامل حائط + لوح غلاندات سفلي */
function buildInv3D(model,e){
 const s=DEYE_INV[model]||DEYE_INV['SUN-8K-SG04LP3'];
 const g=new THREE.Group();
 const body=faced(s.w,s.h,s.d,faceHybrid(true),0xECEEEF);g.add(body);
 // حامل حائط (سكّان خلف الجهاز)
 [-s.w*.32,s.w*.32].forEach(x=>{
  const r=sbox(.05,s.h*.62,.03,MATS.rail);r.position.set(x,0,-s.d/2-.035);g.add(r);});
 // لوح غلاندات سفلي
 const pl=sbox(s.w*.86,.02,s.d*.7,MATS.plate);pl.position.set(0,-s.h/2-.015,0);g.add(pl);
 const rows=(s.type==='HV3')?3:2;
 for(let i=0;i<6;i++)for(let r2=0;r2<rows;r2++){
  const gl=new THREE.Mesh(new THREE.CylinderGeometry(.016,.018,.03,10),MATS.gland);
  gl.position.set(-s.w*.32+i*s.w*.128,-s.h/2-.03,-s.d*.24+r2*s.d*.22);g.add(gl);}
 g.userData={h:s.h,w:s.w,d:s.d,kg:s.kg,model:s.n};
 return g;}

/* مكدس بطاريات BOS-GM: n وحدات + قاعدة */
function buildBatStack3D(model,n,e){
 const s=DEYE_BAT[model]||DEYE_BAT['BOS-GM5.1'];
 n=Math.max(1,Math.min(s.stackMax||4,n||3));
 const g=new THREE.Group();
 const base=sbox(s.w+.06,.05,s.d+.06,smat(0x6E767D,.55,.35));
 base.position.y=-(n*s.h)/2-.025;g.add(base);
 for(let i=0;i<n;i++){
  const m=faced(s.w,s.h-.012,s.d,faceBattery(s.kwh,e&&e.soc||96),0xF2F3F4);
  m.position.y=-(n-1)*s.h/2+i*s.h;g.add(m);
  const hnd=sbox(.16,.03,.04,smat(0xC7CACD,.5,.3));
  hnd.position.set(0,m.position.y+s.h/2+.012,s.d*.1);g.add(hnd);}
 g.userData={h:n*s.h+.05,w:s.w,d:s.d,model:s.n,n:n};
 return g;}

/* ---------- 5) ترقيع المنصة ---------- */
function patchPlatform(){
 // أ) إثراء INVLIB القديم بمفاتيح Deye الجديدة (يحافظ على التوافق)
 if(typeof INVLIB!=='undefined'){
  Object.keys(DEYE_INV).forEach(k=>{const s=DEYE_INV[k];
   INVLIB[k]={n:s.n,kw:s.kw,w:Math.round(s.w*1000),h:Math.round(s.h*1000),d:Math.round(s.d*1000)};});
  if(typeof F!=='undefined'&&F.invModel)
   F.invModel.o=Object.keys(DEYE_INV).map(k=>[k,DEYE_INV[k].n]).concat([['gen','إنفرتر عام']]);}
 // ب) توجيه eqMeshR نحو البناة الواقعيين عند توفّر النوع
 if(typeof EQLIB!=='undefined'){
  const oldMesh=(typeof eqMeshR==='function')?eqMeshR:null;
  window.eqMeshR=function(e){
   const L=EQLIB[e.kind];
   if(e.kind==='inv'&&e.model&&DEYE_INV[e.model])return buildInv3D(e.model,e);
   if(e.kind==='batw'&&(e.model==='BOS-GM5.1'||e.model==='BOS-G'))return buildBatStack3D(e.model,e.n,e);
   if(e.kind==='batw'&&e.model==='BOS-A'){
    const g=new THREE.Group();
    const b=faced(.52,.65,.21,faceBattery(5.12,e.soc||96),0xF2F3F4);g.add(b);g.userData={h:.65,w:.52,d:.21};
    const pl=sbox(.54,.02,.23,smat(0x6E767D,.55,.35));pl.position.y=-.335;g.add(pl);
    return g;}
   return oldMesh?oldMesh(e):null;};}
 // ج) دمج اللوحات المنفّذة (As-Built) القادمة من استوديو الصور
 if(typeof window!=='undefined'){
  window.icoolImportAsBuilt=function(json){
   try{const d=JSON.parse(json);
    if(d.app!=='icool-asbuilt-panel')throw new Error('ملف JSON ليس من استوديو التابلوه المنفّذ.');
    if(typeof EQP!=='undefined'&&typeof ROOM!=='undefined'){
     (d.items||[]).forEach((it,i)=>{
      if(!U_AB[it.t])return;
      EQP.push({kind:it.t,tag:json.meta?json.meta.panel+'-'+(i+1):'AB-'+(i+1),
       name:it.label||U_AB[it.t].n,w:U_AB[it.t].w/1000,h:U_AB[it.t].h/1000,d:.12,
       x:1+i*.05,z:.2,rot:0,y:U_AB[it.t].y});});
     if(typeof buildRoom==='function')buildRoom();}
    return true;}catch(err){if(typeof log==='function')log('As-Built: '+err.message,1);return false;}};}
 const U_AB={
  mcb1:{n:'قاطع 1P (منفّذ)',w:17.5,h:88,y:1.4},mcb2:{n:'قاطع 2P (منفّذ)',w:35,h:88,y:1.4},
  mcb3:{n:'قاطع 3P (منفّذ)',w:52.5,h:88,y:1.4},mcb4:{n:'قاطع 4P (منفّذ)',w:70,h:88,y:1.4},
  rcd2:{n:'تفاضلي 2P (منفّذ)',w:35,h:88,y:1.4},rcd4:{n:'تفاضلي 4P (منفّذ)',w:70,h:88,y:1.4},
  iso2:{n:'عازل 2P (منفّذ)',w:35,h:88,y:1.4},iso4:{n:'عازل 4P (منفّذ)',w:70,h:88,y:1.4},
  fus:{n:'فيوز (منفّذ)',w:17.5,h:88,y:1.4},spd2:{n:'SPD 2P (منفّذ)',w:35,h:88,y:1.4},
  spd4:{n:'SPD 4P (منفّذ)',w:70,h:88,y:1.4},meter:{n:'عدّاد (منفّذ)',w:70,h:88,y:1.4},
  ct:{n:'CT (منفّذ)',w:35,h:88,y:1.4},blank:{n:'فراغ (منفّذ)',w:17.5,h:88,y:1.4}};
 window.U_AB=U_AB;}

return {INV:DEYE_INV,BAT:DEYE_BAT,buildInv3D:buildInv3D,buildBatStack3D:buildBatStack3D,
 faceHybrid:faceHybrid,faceBattery:faceBattery,patchPlatform:patchPlatform};
})();
if(typeof module!=='undefined')module.exports=DEYE_PATCH;
