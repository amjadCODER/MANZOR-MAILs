import { prisma } from '../../../../lib/prisma';
export async function GET(_request, { params }) {
  const account = await prisma.mailAccount.findUnique({ where: { id: params.id }, select: { id: true, organizationName: true, email: true, provider: true, connectionStatus: true } });
  if (!account) return Response.json({ error: 'الحساب غير موجود' }, { status: 404 });
  return Response.json({ account });
}
export async function DELETE(_request, { params }) {
  await prisma.mailAccount.delete({ where: { id: params.id } });
  return Response.json({ ok: true });
}
