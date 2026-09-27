/* =====================================================================
   IC_EXPERTS v4 — ميثاق لجنة المهندسين ومحرك المراجعة
   ---------------------------------------------------------------------
   هذا هو «البرومبت» المكتوب لكل مهندس: دوره + ميثاقه + صلاحياته + قائمة فحصه.
   review(p) تستلم لقطة المشروع الموحّدة وتعيد ملاحظات بمستويات ok/warn/bad.
   القاعدة الحاكمة للجنة: لا قرار نهائي يُعتمد وملاحظة bad مفتوحة.
   ===================================================================== */
const IC_EXPERTS=(function(){
const CHARTERS={
 chief:'أنا المنسّق. أجمع ملاحظات التخصصات الستة، أحسم التعارض بينها (الإنشاء يسبق الجمال عند التعارض مع الكهرباء؟ لا — السلامة ثم الإنشاء ثم الاقتصاد)، وأوقّع إغلاق المرحلة. لا أصحّح حساباً بنفسي — أُعيده لصاحبه.',
 software:'أراجع سلامة البيانات: اكتمال المخطط، عدم تضارب المخزن، توافق الإصدارات، وقابلية الترحيل. أي حقل NaN أو مخزن مزدوج = bad.',
 electrical:'أراجع التشريج والحمايات والكابلات وفق IEC/EN: Voc مُصحّح للبرودة ضد حد المحوّل، تيار المداخل، الفيوزات والعوازل، هبوط الجهد، تنسيق الحمايات، SPD وRCD. رقم بلا مرجع معياري لا يمر.',
 energy:'أرSizing بأسوأ شهر لا بالمتوسط. أراجع الإشعاع المُدخل (ليس الافتراضي)، IAM، حرارة الخلية، فقد التظليل الهندسي الفعلي. النتيجة بلا مصدر إشعاع موثّق = warn دائم.',
 structural:'أراجع وفق EN 1991/1993 مبسّطاً: استغلال الفولاذ، الهبوط، الثبات ضد الرفع، المراسي والبليتات، الرياح بحسب فئة التضاريس. أي util>1 أو FS<1.2 = bad يوقف الاعتماد.',
 finance:'أراجع اكتمال الأسعار، هامش ≥ 10%، بيع ≥ 1.1×تكلفة، العملة USD، والضريبة اختيارية ظاهرة في العرض. عرض سعر ببند بلا سعر = warn؛ بند بخسارة = bad.',
 procurement:'أقارن احتياج التصميم بالمخزون الفعلي وأرصد الفجوات، وأربط كل فاتورة ببند BOQ. عجز مخزون دون فاتورة مرتبة = warn.'};
function lv(x){return x;}
const E=[
 {id:'chief',name:'المهندس المنسّق',color:'#F1471E',charter:CHARTERS.chief,
  review:function(p){const o=[];const bads=(p._findings||[]).filter(f=>f.level==='bad').length;
   if(!p.site||!p.site.source)o.push(['warn','لم تبدأ بعد — عرّف مصدر الموقع من شاشة البداية']);
   if(bads===0&&p.site&&p.design&&p.design.st)o.push(['ok','الملف هندسياً جاهز للاعتماد — بانتظار توقيعك']);
   else o.push(['warn',bads+' ملاحظة خطأ مفتوحة لدى التخصصات — الاعتماد موقوف']);
   return o;}},
 {id:'software',name:'مهندس البرمجيات',color:'#0066A7',charter:CHARTERS.software,
  review:function(p){const o=[];
   try{
    if(p._nan)o.push(['bad','حقول غير رقمية دخلت الحساب — راجع المدخلات']);
    else o.push(['ok','مخطط المشروع مكتمل وسليم رقمياً']);
    if(p.store&&p.store.products)o.push(['ok','المخزن الموحّد: '+p.store.products.length+' منتجاً']);
    else o.push(['warn','المخزن الموحّد فارغ']);
   }catch(e){o.push(['warn','تعذّر الفحص البرمجي']);}
   return o;}},
 {id:'electrical',name:'مهندس الكهرباء',color:'#7A5CC4',charter:CHARTERS.electrical,
  review:function(p){const o=[];const ST=p.ST,E=p.E;
   if(!ST){o.push(['warn','لا يوجد تشريج — أكمل مرحلة الألواح']);return o;}
   if(!ST.best){o.push(['bad','تعذّر التشريج: حدود المحوّل لا تقبل أي سلسلة']);return o;}
   const b=ST.best;
   if(b.vmax>+p.M.invVmax)o.push(['bad','Voc بارد '+b.vmax.toFixed(0)+'V > حد المحوّل '+p.M.invVmax+'V — زد السلاسل أو المحوّل']);
   else o.push(['ok','جهد السلاسل '+(b.vmax).toFixed(0)+'V ضمن '+p.M.invVmax+'V (IEC 62548)']);
   if(!b.okI)o.push(['bad','تيار المدخل '+b.iStr.toFixed(1)+'A > '+p.M.invIsc+'A — وزّع على MPPT أكثر']);
   else o.push(['ok','تيارات المداخل ضمن القدرة']);
   if(E){o.push(['ok','حمايات محسوبة: gPV '+E.strFuse+'A · عازل '+E.dcIso+'A · خرج '+E.acBrk+'A']);
    if(E.bat&&E.B&&E.B.cRate>E.B.c.cmax)o.push(['bad','معدل تفريغ البطاريات '+E.B.cRate.toFixed(2)+'C يتجاوز '+E.B.c.cmax+'C']);}
   else o.push(['warn','التصميم الكهربائي التفصيلي لم يُولَّد بعد']);
   return o;}},
 {id:'energy',name:'مهندس الطاقة',color:'#E0862A',charter:CHARTERS.energy,
  review:function(p){const o=[];const Z=p.Z,E=p.E;
   if(!E||!E.kwp){o.push(['warn','لا مصفوفة — أضف ألواحاً من المعالج']);return o;}
   if(Math.abs(+p.M.ghiY-1900)<1)o.push(['warn','الإشعاع الافتراضي لساحل لبنان — أدخل GHI موقعك من PVGIS']);
   else o.push(['ok','إشعاع مُدخل: '+p.M.ghiY+' kWh/م²']);
   if(Z){if(p.M.sysType!=='ongrid'&&Z.needOff>0&&Z.have<Z.needOff)
     o.push(['bad','أسوأ شهر: تحتاج '+Z.needOff+' لوحاً ومركّب '+Z.have+' — الحمل الليلي غير مغطّى']);
    else o.push(['ok','تغطية الأحمال '+(Z.cover*100).toFixed(0)+'%'+(Z.worstDaily?' · أسوأ شهر '+Z.needOff+' ≤ '+Z.have:'')]);}
   if(p.PVSH&&p.PVSH.tot>0){const sh=(p.PVSH.full+p.PVSH.part)/p.PVSH.tot;
    if(sh>.1)o.push(['warn','تظليل لحظي '+ (sh*100).toFixed(0)+'% من الألواح — تحقق من العوائق']);
    else o.push(['ok','تظليل لحظي ضمن الحد '+(sh*100).toFixed(0)+'%']);}
   return o;}},
 {id:'structural',name:'مهندس الإنشاء والميكانيك',color:'#1a7f4b',charter:CHARTERS.structural,
  review:function(p){const o=[];const R=p.R;
   if(!R||!R.tot){o.push(['warn','لا هيكل بعد — عرّف النموذج والأبعاد']);return o;}
   if(R.util>1)o.push(['bad','استغلال الفولاذ '+(R.util*100).toFixed(0)+'% — المقطع غير آمن (EN 1993)']);
   else o.push(['ok','استغلال '+(R.util*100).toFixed(0)+'% · هبوط L/'+R.defR.toFixed(0)]);
   if(R.defR<200)o.push(['warn','هبوط L/'+R.defR.toFixed(0)+' أدنى من L/200 المعتاد للألواح']);
   if(R.FS<1.2)o.push(['bad','الثبات ضد الرفع '+R.FS.toFixed(2)+' < 1.2 — عرّف وزناً/مراسي إضافية']);
   else o.push(['ok','الثبات ضد الرفع '+R.FS.toFixed(2)+' (EN 1991-1-4 §7.3 مبسّط)']);
   if((R.boltT||0)>20)o.push(['warn','شدّ المسامير '+R.boltT.toFixed(1)+' kN — تحقق من NRd/VRd المسماّر']);
   if(R.kgm2>25)o.push(['warn','الوزن النوعي '+R.kgm2.toFixed(1)+' كغ/م² مرتفع — راجع المقاطع']);
   return o;}},
 {id:'finance',name:'المدير المالي',color:'#0B2239',charter:CHARTERS.finance,
  review:function(p){const o=[];const st=p.store;
   if(!st||!st.products){o.push(['warn','لا مكتبة منتجات — لن يُبنى عرض السعر']);return o;}
   const miss=st.products.filter(x=>+x.price.sell<=0);
   if(miss.length)o.push(['warn',miss.length+' منتجاً بلا سعر بيع']);
   const loss=st.products.filter(x=>+x.price.cost>0&&+x.price.sell>0&&+x.price.sell<+x.price.cost*1.1);
   if(loss.length)o.push(['bad',loss.length+' منتجاً يُباع بخسارة (< 1.1× التكلفة)']);
   if(!miss.length&&!loss.length)o.push(['ok','أسعار المكتبة سليمة · العملة USD · الضريبة اختيارية']);
   if(p.quote&&p.quote.items&&p.quote.items.length)
    o.push(['ok','عرض سعر: '+p.quote.items.length+' بند · هامش '+(p.quote.margin||0)+'%'+(p.quote.vatOn?' · ضريبة '+p.quote.vat+'%':' · بدون ضريبة')]);
   else o.push(['warn','لا عرض سعر مولّد بعد — شغّل مرحلة التسعير']);
   return o;}},
 {id:'procurement',name:'مسؤول المشتريات',color:'#B9603A',charter:CHARTERS.procurement,
  review:function(p){const o=[];const st=p.store;const E=p.E;
   if(!st){o.push(['warn','لا مخزون مسجّل']);return o;}
   const lacks=[];
   const pan=st.products.find(x=>x.cat==='panel');
   const inv=st.products.find(x=>x.cat==='inverter');
   const bat=st.products.find(x=>x.id==='deye-bos-gm');
   if(pan&&p.NP>+(pan.stock.qty||0))lacks.push('ألواح '+p.NP+'/'+pan.stock.qty);
   if(inv&&E&&E.nInv>+(inv.stock.qty||0))lacks.push('إنفرتر '+E.nInv+'/'+inv.stock.qty);
   if(bat&&E&&E.bat&&E.B&&E.B.n>+(bat.stock.qty||0))lacks.push('بطاريات '+E.B.n+'/'+bat.stock.qty);
   if(lacks.length)o.push(['warn','عجز مخزون: '+lacks.join(' · ')+' — سجّل فاتورة وارد']);
   else o.push(['ok','المخزون يغطي المكوّنات الرئيسية']);
   o.push([(st.invoices&&st.invoices.length)?'ok':'warn','فواتير وارد: '+(st.invoices?st.invoices.length:0)]);
   return o;}}];
function review(p){
 const findings=[];
 E.forEach(function(ex){let items=[];try{items=ex.review(p)||[];}catch(e){items=[['warn','تعذّر فحص: '+e.message]];}
  items.forEach(function(it){findings.push({expert:ex.id,level:it[0],text:it[1]});});});
 p._findings=findings;
 return findings;}
return {E:E,CHARTERS:CHARTERS,review:review};
})();
if(typeof module!=='undefined')module.exports=IC_EXPERTS;
