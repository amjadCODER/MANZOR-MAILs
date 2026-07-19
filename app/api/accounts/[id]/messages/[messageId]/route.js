import { prisma } from '../../../../../../lib/prisma';
import { requireSession } from '../../../../../../lib/authGuard';
import { getMessage } from '../../../../../../lib/providers';

export async function GET(_request, { params }) {
  const auth = await requireSession();
  if (auth.error) return auth.error;
  const account = await prisma.mailAccount.findUnique({ where: { id: params.id } });
  if (!account) return Response.json({ error: 'الحساب غير موجود' }, { status: 404 });
  try {
    const message = await getMessage(account, { googleAccessToken: auth.session.accessToken }, params.messageId);
    return Response.json({ message });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 502 });
  }
}
