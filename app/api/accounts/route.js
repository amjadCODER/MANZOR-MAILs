import { prisma } from '../../../lib/prisma';
import { encryptSecret } from '../../../lib/crypto';

export async function GET() {
  const accounts = await prisma.mailAccount.findMany({ orderBy: { createdAt: 'desc' }, select: { id: true, organizationName: true, email: true, provider: true, connectionStatus: true, lastConnectedAt: true } });
  return Response.json({ accounts });
}
export async function POST(request) {
  try {
    const body = await request.json();
    for (const key of ['organizationName','email','password','imapHost','smtpHost']) if (!body[key]) return Response.json({ error: 'اكمل كل الحقول المطلوبة' }, { status: 400 });
    const account = await prisma.mailAccount.upsert({
      where: { email: body.email.trim().toLowerCase() },
      create: { organizationName: body.organizationName.trim(), email: body.email.trim().toLowerCase(), provider: 'IMAP_SMTP', encryptedSecret: encryptSecret(body.password), imapHost: body.imapHost.trim(), imapPort: Number(body.imapPort || 993), imapSecure: body.imapSecure !== false, smtpHost: body.smtpHost.trim(), smtpPort: Number(body.smtpPort || 465), smtpSecure: body.smtpSecure !== false, connectionStatus: 'CONNECTED', lastConnectedAt: new Date() },
      update: { organizationName: body.organizationName.trim(), encryptedSecret: encryptSecret(body.password), imapHost: body.imapHost.trim(), imapPort: Number(body.imapPort || 993), imapSecure: body.imapSecure !== false, smtpHost: body.smtpHost.trim(), smtpPort: Number(body.smtpPort || 465), smtpSecure: body.smtpSecure !== false, connectionStatus: 'CONNECTED', lastConnectedAt: new Date() },
    });
    return Response.json({ account }, { status: 201 });
  } catch (error) { return Response.json({ error: error.message }, { status: 500 }); }
}
