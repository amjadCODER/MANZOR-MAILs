# MANZOR Mail

نظام موحد لربط بريد الجمعيات مرة واحدة، ثم قراءة الوارد وإرسال الرسائل من لوحة واحدة.

## النسخة الحالية

- بوابة دخول برمز `ACCESS_CODE` ولا يظهر الرمز في الواجهة.
- Google وMicrosoft وZoho والبريد المخصص IMAP/SMTP.
- حفظ التوكنات وكلمات المرور مشفرة.
- عرض الرسائل بنفس HTML الأصلي قدر الإمكان، مع الصور الخارجية والصور المضمنة CID.
- نفس عارض الرسائل لجميع مزودي البريد، بدون واجهة منفصلة لكل مزود.
- إرسال نص عربي وصور مرفقة تظهر داخل الرسالة.
- الصور المرفوعة تحفظ في PostgreSQL داخل جدول `EmailAttachment` قبل الإرسال.
- تعطيل كاش مسارات الوارد والرسائل لتظهر آخر نسخة مباشرة.

## متغيرات Vercel الأساسية

انسخ أسماء المتغيرات من `.env.example` إلى:

`Vercel → Project Settings → Environment Variables`

الأساسية:

- `DATABASE_URL`
- `APP_URL`
- `ACCESS_CODE`
- `NEXTAUTH_SECRET`
- `CREDENTIALS_ENCRYPTION_KEY`

ثم مفاتيح المزود المطلوب.

## قاعدة البيانات

شغل ملف `supabase-manzor-mail.sql` كاملًا في Supabase SQL Editor. النظام أيضًا ينشئ جدول المرفقات تلقائيًا إذا لم يكن موجودًا.

يجب أن ينتهي `DATABASE_URL` بـ:

```text
?pgbouncer=true&schema=manzor_mail
```

أو يضاف `&schema=manzor_mail` إذا كان الرابط يحتوي خيارات مسبقًا.

## Redirect URIs

```text
https://YOUR-DOMAIN/api/oauth/google/callback
https://YOUR-DOMAIN/api/oauth/microsoft/callback
https://YOUR-DOMAIN/api/oauth/zoho/callback
```

## صلاحيات Google

- `openid`
- `email`
- `profile`
- `https://www.googleapis.com/auth/gmail.readonly`
- `https://www.googleapis.com/auth/gmail.send`

## صلاحيات Microsoft

- `openid`
- `profile`
- `email`
- `offline_access`
- `User.Read`
- `Mail.Read`
- `Mail.Send`

## اختبار محلي

```bash
npm install
npx prisma generate
npm run build
```

## حدود الصور

- حتى 3 صور في الرسالة.
- الحد الإجمالي 4 ميجابايت.
- الأنواع: JPG وPNG وWEBP وGIF.
