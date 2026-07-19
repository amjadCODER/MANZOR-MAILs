import { requireSession } from '../../../../lib/authGuard';
import { testImapSmtp } from '../../../../lib/providers/imapSmtp';

export async function POST(request) {
  const auth = await requireSession();
  if (auth.error) return auth.error;
  const body = await request.json();
  try {
    await testImapSmtp({
      email: body.email,
      imapHost: body.imapHost,
      imapPort: Number(body.imapPort || 993),
      imapSecure: body.imapSecure !== false,
      smtpHost: body.smtpHost,
      smtpPort: Number(body.smtpPort || 465),
      smtpSecure: body.smtpSecure !== false,
    }, body.password);
    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
