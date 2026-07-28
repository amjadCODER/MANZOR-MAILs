import { decryptSecret, encryptSecret } from '../crypto';
import { prisma } from '../prisma';

async function token(account) {
  if (account.tokenExpiresAt && account.tokenExpiresAt.getTime() > Date.now() + 60000) return decryptSecret(account.accessToken);
  if (!account.refreshToken) return decryptSecret(account.accessToken);
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID, client_secret: process.env.GOOGLE_CLIENT_SECRET, refresh_token: decryptSecret(account.refreshToken), grant_type: 'refresh_token' }),
    cache: 'no-store',
  });
  const data = await response.json();
  if (!response.ok) throw new Error('انتهى ربط Google ويحتاج إعادة ربط');
  await prisma.mailAccount.update({ where: { id: account.id }, data: { accessToken: encryptSecret(data.access_token), tokenExpiresAt: new Date(Date.now() + data.expires_in * 1000) } });
  return data.access_token;
}

function header(headers, name) { return headers?.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || ''; }
function decode(data) { return data ? Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8') : ''; }
function bodyPart(payload) {
  if (payload?.body?.data) return decode(payload.body.data);
  for (const part of payload?.parts || []) {
    if (part.mimeType === 'text/plain' && part.body?.data) return decode(part.body.data);
  }
  for (const part of payload?.parts || []) {
    if (part.body?.data) return decode(part.body.data).replace(/<[^>]*>/g, ' ');
  }
  return '';
}
export async function listGoogle(account, max = 30) {
  const access = await token(account);
  const list = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?labelIds=INBOX&maxResults=${max}`, { headers: { Authorization: `Bearer ${access}` }, cache: 'no-store' }).then(r => r.json());
  if (list.error) throw new Error(list.error.message);
  return Promise.all((list.messages || []).map(async ({ id }) => {
    const m = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`, { headers: { Authorization: `Bearer ${access}` }, cache: 'no-store' }).then(r => r.json());
    return { id, from: header(m.payload?.headers, 'From'), subject: header(m.payload?.headers, 'Subject') || 'بدون عنوان', date: header(m.payload?.headers, 'Date'), snippet: m.snippet || '', unread: (m.labelIds || []).includes('UNREAD') };
  }));
}
export async function getGoogle(account, id) {
  const access = await token(account);
  const m = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`, { headers: { Authorization: `Bearer ${access}` }, cache: 'no-store' }).then(r => r.json());
  if (m.error) throw new Error(m.error.message);
  return { id, from: header(m.payload?.headers, 'From'), to: header(m.payload?.headers, 'To'), subject: header(m.payload?.headers, 'Subject') || 'بدون عنوان', date: header(m.payload?.headers, 'Date'), body: bodyPart(m.payload), snippet: m.snippet || '' };
}
export async function sendGoogle(account, { to, subject, body }) {
  const access = await token(account);
  const raw = Buffer.from(`To: ${to}\r\nSubject: ${subject}\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${body}`).toString('base64url');
  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', { method: 'POST', headers: { Authorization: `Bearer ${access}`, 'content-type': 'application/json' }, body: JSON.stringify({ raw }) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || 'تعذر إرسال الرسالة');
  return data;
}
