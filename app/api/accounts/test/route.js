import { testImapSmtp } from '../../../../lib/providers/imap';
export async function POST(request) {
  try { await testImapSmtp(await request.json()); return Response.json({ ok: true }); }
  catch (error) { return Response.json({ error: `فشل الاتصال: ${error.message}` }, { status: 400 }); }
}
