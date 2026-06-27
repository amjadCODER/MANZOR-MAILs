export const emailAccounts = [
  {
    id: 'hifz-alneama',
    organizationName: 'جمعية حفظ النعمة',
    email: 'info@hifz-alneama.org.sa',
    unread: 8,
    lastMessage: 'تم استلام طلب تحديث بيانات الحوكمة للربع الحالي',
    updatedAt: 'قبل 12 دقيقة',
    accent: 'cyan',
  },
  {
    id: 'green-print',
    organizationName: 'جمعية البصمة الخضراء',
    email: 'info@gpksa.org',
    unread: 4,
    lastMessage: 'تأكيد جاهزية البريد الرسمي وربط النطاق',
    updatedAt: 'قبل 34 دقيقة',
    accent: 'blue',
  },
  {
    id: 'autism-support',
    organizationName: 'جمعية التوحد برجال ألمع',
    email: 'info@autism-rjal.org.sa',
    unread: 11,
    lastMessage: 'مرفق لكم الملفات المطلوبة لمراجعة الموقع الإلكتروني',
    updatedAt: 'قبل ساعة',
    accent: 'violet',
  },
  {
    id: 'afaq-media',
    organizationName: 'آفاق للإعلام',
    email: 'contact@afaq-media.sa',
    unread: 2,
    lastMessage: 'اعتماد النسخة النهائية من الحقيبة التدريبية',
    updatedAt: 'اليوم 08:10 ص',
    accent: 'teal',
  },
  {
    id: 'arshidni-hail',
    organizationName: 'جمعية أرشدني بحائل',
    email: 'info@arshidni-hail.org',
    unread: 6,
    lastMessage: 'استفسار بخصوص نموذج التواصل في الموقع',
    updatedAt: 'أمس 09:42 م',
    accent: 'purple',
  },
  {
    id: 'amal-special',
    organizationName: 'جمعية الأم المميزة',
    email: 'support@special-mother.org.sa',
    unread: 1,
    lastMessage: 'تم تحديث صلاحيات المستخدمين حسب الطلب',
    updatedAt: 'أمس 05:18 م',
    accent: 'blue',
  },
];

export const demoMessages = {
  'hifz-alneama': [
    {
      id: 'm-101',
      sender: 'أ. منى عبدالله',
      from: 'mona@hifz-alneama.org.sa',
      subject: 'تحديث بيانات الحوكمة للربع الحالي',
      preview: 'نرفق لكم آخر تحديثات ملفات الحوكمة ونأمل مراجعتها قبل الرفع النهائي...',
      body: 'السلام عليكم ورحمة الله وبركاته،\n\nنرفق لكم آخر تحديثات ملفات الحوكمة ونأمل مراجعتها قبل الرفع النهائي. نحتاج تأكيد استلامكم للملفات وتحديد الملاحظات إن وجدت.\n\nشاكرين تعاونكم.',
      date: '09:14 ص',
      unread: true,
      attachments: 2,
      tag: 'حوكمة',
    },
    {
      id: 'm-102',
      sender: 'قسم البرامج',
      from: 'programs@hifz-alneama.org.sa',
      subject: 'طلب تفعيل بريد البرامج',
      preview: 'نحتاج بريد مخصص للبرامج القادمة حتى يتم التواصل مع المستفيدين بشكل منظم...',
      body: 'نحتاج بريد مخصص للبرامج القادمة حتى يتم التواصل مع المستفيدين بشكل منظم، مع ربط البريد بالتوقيع الرسمي للجمعية.',
      date: '08:32 ص',
      unread: true,
      attachments: 0,
      tag: 'بريد',
    },
    {
      id: 'm-103',
      sender: 'منظور تيك',
      from: 'support@manzor-tech.sa',
      subject: 'تأكيد إنشاء الحساب',
      preview: 'تم إنشاء الحساب بنجاح ويمكنكم الآن استخدام المنصة لمتابعة البريد...',
      body: 'تم إنشاء الحساب بنجاح ويمكنكم الآن استخدام المنصة لمتابعة البريد والرسائل الواردة والصادرة من مكان واحد.',
      date: 'أمس',
      unread: false,
      attachments: 1,
      tag: 'منظور',
    },
  ],
};

export function getAccountById(id) {
  return emailAccounts.find((account) => account.id === id) || emailAccounts[0];
}

export function getMessagesByAccountId(id) {
  return demoMessages[id] || [
    {
      id: `${id}-001`,
      sender: 'إدارة الجمعية',
      from: getAccountById(id).email,
      subject: 'متابعة البريد الرسمي',
      preview: 'نأمل الاطلاع على الرسائل الواردة والتأكد من الرد على الطلبات المهمة...',
      body: 'نأمل الاطلاع على الرسائل الواردة والتأكد من الرد على الطلبات المهمة، وسيتم ربط هذا الصندوق لاحقًا مع البريد الحقيقي عبر API.',
      date: 'اليوم',
      unread: true,
      attachments: 0,
      tag: 'متابعة',
    },
    {
      id: `${id}-002`,
      sender: 'منظور تيك',
      from: 'support@manzor-tech.sa',
      subject: 'تهيئة صندوق البريد',
      preview: 'هذه رسالة تجريبية لعرض شكل صندوق الوارد داخل منصة MANZOR Mail...',
      body: 'هذه رسالة تجريبية لعرض شكل صندوق الوارد داخل منصة MANZOR Mail. سيتم لاحقًا استبدال البيانات التجريبية ببيانات حقيقية من Gmail API أو Microsoft Graph.',
      date: 'أمس',
      unread: false,
      attachments: 1,
      tag: 'Demo',
    },
  ];
}
