import { prisma } from '../../../lib/prisma';
import { encryptSecret } from '../../../lib/crypto';
import { requireSession } from '../../../lib/authGuard';

export async function GET() {
  const auth = await requireSession();
  if (auth.error) return auth.error;
  const accounts = await prisma.mailAccount.findMany({
    orderBy: { organizationName: 'asc' },
    select: { id: true, organizationName: true, email: true, provider: true, imapHost: true, smtpHost: true, connectionStatus: true, lastConnectedAt: true, createdAt: true }
  });
  return Response.json({ accounts });
}

export async function POST(request) {
  const auth = await requireSession();
  if (auth.error) return auth.error;
  const body = await request.json();
  const required = ['organizationName', 'email', 'imapHost', 'smtpHost', 'password'];
  for (const key of required) if (!body[key]) return Response.json({ error: `الحقل ${key} مطلوب` }, { status: 400 });

  const account = await prisma.mailAccount.create({
    data: {
      organizationName: body.organizationName.trim(),
      email: body.email.trim().toLowerCase(),
      provider: 'IMAP_SMTP',
      imapHost: body.imapHost.trim(),
      imapPort: Number(body.imapPort || 993),
      imapSecure: body.imapSecure !== false,
      smtpHost: body.smtpHost.trim(),
      smtpPort: Number(body.smtpPort || 465),
      smtpSecure: body.smtpSecure !== false,
      encryptedSecret: encryptSecret(body.password),
    },
    select: { id: true, organizationName: true, email: true, provider: true }
  });
  return Response.json({ account }, { status: 201 });
}
