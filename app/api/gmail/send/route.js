import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/authOptions';
import { sendGmailMessage } from '../../../../lib/gmail';

export async function POST(request) {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    return Response.json({ error: 'Not connected to Google' }, { status: 401 });
  }

  const payload = await request.json();

  if (!payload.to || !payload.subject || !payload.body) {
    return Response.json({ error: 'To, subject, and body are required' }, { status: 400 });
  }

  try {
    const result = await sendGmailMessage(session.accessToken, payload);
    return Response.json({ success: true, result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
