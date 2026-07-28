import { prisma } from '../../../../../lib/prisma';
import { sendMessage } from '../../../../../lib/mail';
import { markAttachmentsSent, persistUploadedImages } from '../../../../../lib/attachments';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request, { params }) {
  try {
    const form = await request.formData();
    const to = String(form.get('to') || '').trim();
    const subject = String(form.get('subject') || '').trim();
    const body = String(form.get('body') || '').trim();
    if (!to || !subject || !body) return Response.json({ error: 'اكمل بيانات الرسالة' }, { status: 400 });

    const account = await prisma.mailAccount.findUnique({ where: { id: params.id } });
    if (!account) return Response.json({ error: 'الحساب غير موجود' }, { status: 404 });

    const files = form.getAll('images').filter((item) => typeof item !== 'string');
    const attachments = await persistUploadedImages(account.id, files);
    await sendMessage(account, { to, subject, body, attachments });
    await markAttachmentsSent(attachments.map((item) => item.id));

    return Response.json({ ok: true, attachments: attachments.map(({ content, ...item }) => item) });
  } catch (error) {
    return Response.json({ error: error.message || 'تعذر إرسال الرسالة' }, { status: 500 });
  }
}
