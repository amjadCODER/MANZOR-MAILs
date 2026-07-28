import { prisma } from '../../../../../lib/prisma';
import { getMessage, listMessages } from '../../../../../lib/mail';
export async function GET(request, { params }) {
  try {
    const account = await prisma.mailAccount.findUnique({ where: { id: params.id } });
    if (!account) return Response.json({ error: 'الحساب غير موجود' }, { status: 404 });
    const messageId = new URL(request.url).searchParams.get('messageId');
    const result = messageId ? await getMessage(account, messageId) : await listMessages(account);
    return Response.json(messageId ? { message: result } : { messages: result });
  } catch (error) { return Response.json({ error: error.message }, { status: 500 }); }
}
