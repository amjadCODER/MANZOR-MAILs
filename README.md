# MANZOR Mail

نظام مبسط لربط بريد الجمعيات مرة واحدة ثم فتح الوارد والارسال منه من لوحة واحدة.

## ما تم تنفيذه
- بوابة دخول برمز سري قبل فتح النظام
- لا يظهر الرمز داخل الواجهة
- لوحة حسابات فعلية فقط بدون بيانات تجريبية
- Google OAuth لقراءة Gmail والارسال
- Microsoft OAuth لقراءة Outlook وHotmail وMicrosoft 365 والارسال
- Zoho OAuth (يتطلب مفاتيح Zoho وإعدادات الحساب)
- بريد مخصص عبر IMAP وSMTP
- حفظ التوكنات وكلمات المرور مشفرة داخل PostgreSQL
- قراءة الوارد وفتح الرسائل والرد والارسال

## النشر على Vercel
1. ارفع محتويات هذا المجلد إلى نفس مستودع `MANZOR-MAILs`.
2. أضف متغيرات `.env.example` في Vercel > Settings > Environment Variables.
3. أنشئ PostgreSQL في Supabase أو Neon وضع رابطها في `DATABASE_URL`.
4. شغل محليا أو من جهازك مرة واحدة:

```bash
npm install
npx prisma db push
npm run build
```

5. أضف Redirect URIs التالية في تطبيقات OAuth القديمة بدون حذف روابط نظام الإرسال:

```text
https://YOUR-DOMAIN/api/oauth/google/callback
https://YOUR-DOMAIN/api/oauth/microsoft/callback
https://YOUR-DOMAIN/api/oauth/zoho/callback
```

## الصلاحيات
Google:
- gmail.readonly
- gmail.send
- openid email profile

Microsoft:
- Mail.Read
- Mail.Send
- offline_access
- User.Read
- openid profile email

مهم: استخدم نفس مشاريع OAuth السابقة قدر الإمكان، وأضف Redirect URI والصلاحيات الجديدة فقط. لا تحذف إعدادات نظام إرسال البريد القديم.
