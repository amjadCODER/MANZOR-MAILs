import { prisma } from '../../../../../lib/prisma';
import { sendMessage } from '../../../../../lib/mail';
export async function POST(request, { params }) {
  try {
    const body = await request.json();
    if (!body.to || !body.subject || !body.body) return Response.json({ error: 'اكمل بيانات الرسالة' }, { status: 400 });
    const account = await prisma.mailAccount.findUnique({ where: { id: params.id } });
    if (!account) return Response.json({ error: 'الحساب غير موجود' }, { status: 404 });
    await sendMessage(account, body);
    return Response.json({ ok: true });
  } catch (error) { return Response.json({ error: error.message }, { status: 500 }); }
}
