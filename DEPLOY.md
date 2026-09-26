# دليل النشر — GitHub + Vercel (خطوتان، ~3 دقائق)

## الخطوة 1: رفع المشروع إلى GitHub

### أ) عبر GitHub CLI (الأسهل)
```bash
# مرة واحدة فقط: ثبّت الأدوات
# Windows: winget install GitHub.cli
# Mac: brew install gh
gh auth login            # سجّل دخولك بالمتصفح
cd icool-studio
git init -b main
git add .
git commit -m "iCOOL Steel Studio v2 + As-Built studio + Deye pack"
gh repo create icool-steel-studio --public --source=. --push
```

### ب) يدوياً (بدون gh)
1. أنشئ مستودعاً فارغاً على github.com (اسمه مثلاً `icool-steel-studio`) — **لا** تضف README.
2. ثم:
```bash
cd icool-studio
git init -b main
git add .
git commit -m "iCOOL Steel Studio v2"
git remote add origin https://github.com/USER/icool-steel-studio.git
git push -u origin main
```

## الخطوة 2: النشر على Vercel

### الطريقة أ — الربط بالمستودع (موصى بها: تحديث تلقائي عند كل push)
1. ادخل app.vercel.com → **Add New → Project**.
2. اختر المستودع `icool-steel-studio` → **Import**.
3. إعدادات النشر: Framework = **Other** · Build Command = *اتركه فارغاً* · Output = *اتركه فارغاً*.
   ملف `vercel.json` موجود مسبقاً فلا تحتاج شيئاً آخر.
4. **Deploy**. ستحصل على رابط مثل `https://icool-steel-studio.vercel.app`
   وكل `git push` لاحق ينشر نسخة جديدة تلقائياً.

### الطريقة ب — CLI مباشرة (بدون ربط)
```bash
npm i -g vercel
cd icool-studio
vercel          # معاينة: رابط *.vercel.app مؤقت
vercel --prod   # النشر النهائي
```

## ملاحظات مهمة
- المنصة **ثابتة 100%** (HTML/JS + CDN) — لا تحتاج build ولا متغيرات بيئة.
- بيانات المشاريع تُحفظ في LocalStorage **لدى الزائر** — لا تمرّ عبر أي خادم (خصوصية كاملة).
- الروابط: `/` المنصة · `/panel-asbuilt-studio` استوديو التابلوه المنفّذ.
- لربط دومين خاص: Project → Settings → Domains.
- آخر حالة معروفة: الملفات تُقرأ من `/mnt/agents/output/icool-studio/` جاهزة.
