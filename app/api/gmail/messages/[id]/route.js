import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/authOptions';
import { getGmailMessage } from '../../../../../lib/gmail';

export async function GET(_request, { params }) {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    return Response.json({ error: 'Not connected to Google' }, { status: 401 });
  }

  try {
    const message = await getGmailMessage(session.accessToken, params.id);
    return Response.json({ message });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
