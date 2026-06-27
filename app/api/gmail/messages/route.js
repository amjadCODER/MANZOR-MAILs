import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/authOptions';
import { getGmailMessages } from '../../../../lib/gmail';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    return Response.json({ error: 'Not connected to Google' }, { status: 401 });
  }

  try {
    const messages = await getGmailMessages(session.accessToken, 'INBOX', 12);
    return Response.json({ messages });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
