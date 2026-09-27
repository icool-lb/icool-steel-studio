/* =====================================================================
   IC_CORE v4 — القاعدة الموحّدة الوحيدة للمنصة
   ---------------------------------------------------------------------
   مخزن واحد localStorage ['icool-v4'] يجمع: المشاريع، المنتجات، الفواتير، الإعدادات.
   كل تطبيق (الاستوديو الهندسي/التطبيق التجاري/الهيكل الخارجي) يقرأ ويكتب هنا فقط.
   الترحيل: يجمع تلقائياً البيانات القديمة (icool-suite-v1، icoolSolarPro).
   ===================================================================== */
const IC_CORE=(function(){
const KEY='icool-v4';
const DB={
 schema:4,
 projects:[],          /* {id,name,client,createdAt,updatedAt,site,design,quote,meta} */
 products:[],          /* مكتبة موحّدة (Deye/LONGi/JA/Jinko/مواد) */
 invoices:[],          /* {id,date,supplier,lines[],thumb} */
 settings:{currency:'USD',vatDefault:0,vatOptional:true,brand:'iCOOL SOLAR PRO'},
 runtime:{}            /* لقطات حيّة من الاستوديو */
};
function save(){try{localStorage.setItem(KEY,JSON.stringify(DB));}catch(e){}}
function load(){try{const d=JSON.parse(localStorage.getItem(KEY)||'null');
 if(d&&d.schema===4){Object.keys(DB).forEach(k=>{if(d[k]!==undefined)DB[k]=d[k];});return true;}return false;}catch(e){return false;}}

/* ---------- ترحيل من النسخ القديمة ---------- */
function migrate(){
 let moved=0;
 try{const old=JSON.parse(localStorage.getItem('icool-suite-v1')||'null');
  if(old){if(old.products&&old.products.length&&!DB.products.length){DB.products=old.products;moved++;}
   if(old.invoices&&old.invoices.length&&!DB.invoices.length){DB.invoices=old.invoices;moved++;}}}catch(e){}
 try{const pro=JSON.parse(localStorage.getItem('icoolSolarPro')||'null');
  if(pro&&!DB.projects.length){
   (pro.projects||[]).forEach(function(p){DB.projects.push({id:p.id,name:p.name,client:p.client||'',
    createdAt:p.createdAt||'',updatedAt:'',site:{source:'legacy-pro'},design:{},quote:{items:p.boq||[]},meta:{legacy:true}});moved++;});}}catch(e){}
 if(moved){save();}
 return moved;}

/* ---------- مشاريع ---------- */
function uid(){return 'p'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);}
function upsertProject(patch){
 let p=DB.projects.find(x=>x.id===patch.id);
 if(!p){p={id:patch.id||uid(),name:patch.name||'مشروع جديد',client:'',createdAt:new Date().toISOString(),
  site:{},design:{},quote:{items:[],margin:12,vatOn:false,vat:0},meta:{}};DB.projects.push(p);}
 Object.keys(patch).forEach(k=>{if(k!=='id')p[k]=patch[k];});
 p.updatedAt=new Date().toISOString();save();return p;}
function getProject(id){return DB.projects.find(x=>x.id===id);}
function listProjects(){return DB.projects.slice().sort((a,b)=>(b.updatedAt||'').localeCompare(a.updatedAt||''));}

/* ---------- منتجات ومخزون ---------- */
function seedProducts(){
 if(DB.products.length)return;
 DB.products=[
  {id:'deye-sun-8k',brand:'Deye',cat:'inverter',name:'SUN-8K-SG04LP3',elec:{kw:8},mech:{w:500,h:440,d:180,kg:24},price:{cost:0,sell:0,currency:'USD'},stock:{qty:0,min:0}},
  {id:'deye-sun-12k',brand:'Deye',cat:'inverter',name:'SUN-12K-SG04LP3',elec:{kw:12},mech:{w:520,h:455,d:185,kg:27},price:{cost:0,sell:0,currency:'USD'},stock:{qty:0,min:0}},
  {id:'deye-sun-50k',brand:'Deye',cat:'inverter',name:'SUN-50K-SG01HP3-EUR',elec:{kw:50},mech:{w:640,h:530,d:250,kg:49},price:{cost:0,sell:0,currency:'USD'},stock:{qty:0,min:0}},
  {id:'deye-bos-gm',brand:'Deye',cat:'battery',name:'BOS-GM5.1 (5.12kWh)',elec:{kwh:5.12,v:51.2,ah:100},mech:{w:480,h:220,d:460,kg:44},price:{cost:0,sell:0,currency:'USD'},stock:{qty:0,min:0}},
  {id:'panel-longi-580',brand:'LONGi',cat:'panel',name:'Hi-MO X6 580W',elec:{watts:580},mech:{kg:27.5},price:{cost:0,sell:0,currency:'USD'},stock:{qty:0,min:0}},
  {id:'panel-ja-575',brand:'JA Solar',cat:'panel',name:'DeepBlue 4.0 575W',elec:{watts:575},mech:{kg:27},price:{cost:0,sell:0,currency:'USD'},stock:{qty:0,min:0}},
  {id:'panel-jinko-590',brand:'Jinko',cat:'panel',name:'Tiger Neo 590W',elec:{watts:590},mech:{kg:27.5},price:{cost:0,sell:0,currency:'USD'},stock:{qty:0,min:0}},
  {id:'mat-dc-cable',brand:'Generic',cat:'cable',name:'كابل DC 6mm² PV1-F',elec:{},mech:{},price:{cost:0,sell:0,currency:'USD'},stock:{qty:0,min:0}},
  {id:'mat-ac-breaker',brand:'Generic',cat:'protection',name:'قاطع AC',elec:{},mech:{},price:{cost:0,sell:0,currency:'USD'},stock:{qty:0,min:0}},
  {id:'mat-spd',brand:'Generic',cat:'protection',name:'SPD T2 40kA',elec:{},mech:{},price:{cost:0,sell:0,currency:'USD'},stock:{qty:0,min:0}},
  {id:'mat-rcd',brand:'Generic',cat:'protection',name:'RCD 63A/30mA',elec:{},mech:{},price:{cost:0,sell:0,currency:'USD'},stock:{qty:0,min:0}},
  {id:'mat-anchor',brand:'Generic',cat:'materials',name:'مسمار كيميائي M14/M16',elec:{},mech:{},price:{cost:0,sell:0,currency:'USD'},stock:{qty:0,min:0}}];
 save();}
function prod(id){return DB.products.find(p=>p.id===id);}
function stockIn(pid,qty,cost){const p=prod(pid);if(!p||!(qty>0))return false;
 p.stock.qty=(+p.stock.qty||0)+(+qty);if(cost>0)p.price.cost=+cost;save();return true;}
function stockOut(pid,qty){const p=prod(pid);if(!p)return false;
 p.stock.qty=Math.max(0,(+p.stock.qty||0)-(+qty));save();return true;}
function addInvoice(inv){DB.invoices.push(inv);(inv.lines||[]).forEach(l=>stockIn(l.pid,l.qty,l.cost));save();}

/* ---------- حالة الاكتمال لكل مرحلة (للمعالج) ---------- */
function steps(){
 const p=DB.projects[0]||{};const rt=DB.runtime||{};
 const s1=!!(rt.SITE||p.site&&p.site.source);
 const s3=!!(rt.ST&&rt.ST.best);
 const s5=!!(rt.roomPin);
 const s7=!!(p.quote&&p.quote.items&&p.quote.items.length);
 return [
  {t:'الموقع والسطح',done:s1},
  {t:'الأحمال والطاقة',done:!!(rt.Z)},
  {t:'تقسيم المجموعات',done:s3},
  {t:'الغرفة والكابلات',done:s5},
  {t:'الهيكل الحديدي',done:!!(rt.R&&rt.R.tot)},
  {t:'عرض السعر',done:s7}];}

/* ---------- تهيئة ---------- */
if(!load()){migrate();seedProducts();save();}
return {DB:DB,save:save,upsertProject:upsertProject,getProject:getProject,listProjects:listProjects,
 prod:prod,stockIn:stockIn,stockOut:stockOut,addInvoice:addInvoice,steps:steps,migrate:migrate};
})();
if(typeof module!=='undefined')module.exports=IC_CORE;
