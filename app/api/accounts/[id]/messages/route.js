import { prisma } from '../../../../../lib/prisma';
import { requireSession } from '../../../../../lib/authGuard';
import { listMessages } from '../../../../../lib/providers';

export async function GET(request, { params }) {
  const auth = await requireSession();
  if (auth.error) return auth.error;
  const account = await prisma.mailAccount.findUnique({ where: { id: params.id } });
  if (!account) return Response.json({ error: 'الحساب غير موجود' }, { status: 404 });
  try {
    const messages = await listMessages(account, { googleAccessToken: auth.session.accessToken }, 30);
    return Response.json({ account: { id: account.id, organizationName: account.organizationName, email: account.email, provider: account.provider }, messages });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 502 });
  }
}
