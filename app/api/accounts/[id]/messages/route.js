import { prisma } from '../../../../../lib/prisma';
import { getMessage, listMessages } from '../../../../../lib/mail';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request, { params }) {
  try {
    const account = await prisma.mailAccount.findUnique({ where: { id: params.id } });
    if (!account) return Response.json({ error: 'الحساب غير موجود' }, { status: 404 });
    const messageId = new URL(request.url).searchParams.get('messageId');
    const result = messageId ? await getMessage(account, messageId) : await listMessages(account);
    return Response.json(messageId ? { message: result } : { messages: result }, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' }
    });
  } catch (error) {
    return Response.json({ error: error.message || 'تعذر تحميل البريد' }, { status: 500 });
  }
}
