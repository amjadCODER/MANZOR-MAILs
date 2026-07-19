# MANZOR Mail 2.0

منصة موحدة لإدارة بريد الجمعيات ودعم أكثر من مزود خدمة.

## البنية

- Gmail / Google Workspace: يستمر عبر Gmail API وGoogle OAuth الموجودين سابقا.
- Outlook وMicrosoft 365 وYahoo وZoho وGoDaddy وبقية المزودات: IMAP للاستقبال وSMTP للإرسال.
- PostgreSQL + Prisma لحفظ حسابات الجمعيات والحملات وسجل المستلمين.
- تشفير كلمات مرور IMAP/SMTP باستخدام AES-256-GCM قبل حفظها في قاعدة البيانات.
- قراءة MIME وBase64 وQuoted Printable ورسائل HTML عبر mailparser.
- حملات بريدية من Excel مع إزالة التكرار ودعم `{{name}}` و`{{email}}`.

## التشغيل المحلي

1. انسخ `.env.example` إلى `.env.local` وعبئ القيم.
2. نفذ:

```bash
npm install --legacy-peer-deps
npx prisma generate
npx prisma db push
npm run dev
```

## قاعدة البيانات

استخدم PostgreSQL حقيقية. يمكن استخدام Supabase Postgres أو Neon أو قاعدة PostgreSQL على VPS. لا يستخدم المشروع SQLite.

## إعداد Google

لا تحذف مشروع Google Cloud القديم. ضع نفس `GOOGLE_CLIENT_ID` و`GOOGLE_CLIENT_SECRET` في متغيرات البيئة وأضف رابط callback التالي في Google Cloud:

```text
https://YOUR-DOMAIN/api/auth/callback/google
```

## إعداد حسابات البريد الأخرى

من الصفحة الرئيسية اختر `إضافة بريد جمعية` ثم اختر المزود. بعض المزودات تتطلب App Password وتفعيل IMAP/SMTP من لوحة البريد. الحسابات التي تمنع كلمة المرور التقليدية تحتاج OAuth خاص بالمزود.

## النشر على Vercel

اربط المستودع وأضف متغيرات البيئة ثم نفذ `prisma db push` على قاعدة الإنتاج قبل أول تشغيل.

مهم: قراءة البريد عند الطلب تعمل على Vercel. الحملات الكبيرة لا ينبغي تنفيذها داخل طلب Serverless طويل؛ للإنتاج استخدم Worker/Queue على VPS أو خدمة خلفية مستقلة. النسخة الحالية مناسبة للاختبار والحملات الصغيرة والمتوسطة بحسب مهلة خطة Vercel.

## أمان وتشغيل

- لا ترفع `.env.local` إلى GitHub.
- ضع بريد الإدارة في `ADMIN_EMAILS`.
- استخدم قيمة طويلة وعشوائية لـ `CREDENTIALS_ENCRYPTION_KEY` ولا تغيرها بعد تخزين الحسابات.
- لا تستخدم كلمات المرور الأساسية عندما يوفر المزود App Password.

## الربط الدائم لحسابات البريد

- حسابات Gmail وGoogle Workspace تربط مرة واحدة عبر OAuth
- النظام يحفظ Refresh Token مشفرا في PostgreSQL ويجدد Access Token تلقائيا
- حسابات IMAP وSMTP تحفظ بياناتها مشفرة وتفتح مباشرة من بطاقة الجمعية
- لا يطلب تسجيل الدخول مجددا الا اذا الغى مزود البريد الصلاحية او تغيرت كلمة المرور

بعد تحديث قاعدة البيانات شغل:

```bash
npx prisma generate
npx prisma db push
```

واضف رابط `GOOGLE_ACCOUNT_REDIRECT_URI` نفسه في Google Cloud Console ضمن Authorized redirect URIs
