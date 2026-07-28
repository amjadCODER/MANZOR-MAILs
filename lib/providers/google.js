import nodemailer from 'nodemailer';
import { simpleParser } from 'mailparser';
import { decryptSecret, encryptSecret } from '../crypto';
import { prisma } from '../prisma';
import { buildOutgoingHtml, normalizeParsedMessage } from '../email-content';

async function token(account) {
  if (account.tokenExpiresAt && account.tokenExpiresAt.getTime() > Date.now() + 60000) return decryptSecret(account.accessToken);
  if (!account.refreshToken) return decryptSecret(account.accessToken);
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: decryptSecret(account.refreshToken),
      grant_type: 'refresh_token'
    }),
    cache: 'no-store'
  });
  const data = await response.json();
  if (!response.ok) throw new Error('انتهى ربط Google ويحتاج إعادة ربط');
  await prisma.mailAccount.update({
    where: { id: account.id },
    data: {
      accessToken: encryptSecret(data.access_token),
      tokenExpiresAt: new Date(Date.now() + Number(data.expires_in || 3600) * 1000)
    }
  });
  return data.access_token;
}

function header(headers, name) {
  return headers?.find((item) => item.name?.toLowerCase() === name.toLowerCase())?.value || '';
}

export async function listGoogle(account, max = 30) {
  const access = await token(account);
  const listResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?labelIds=INBOX&maxResults=${max}`, {
    headers: { Authorization: `Bearer ${access}` },
    cache: 'no-store'
  });
  const list = await listResponse.json();
  if (!listResponse.ok) throw new Error(list.error?.message || 'تعذر تحميل بريد Google');

  return Promise.all((list.messages || []).map(async ({ id }) => {
    const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`, {
      headers: { Authorization: `Bearer ${access}` },
      cache: 'no-store'
    });
    const message = await response.json();
    if (!response.ok) throw new Error(message.error?.message || 'تعذر قراءة رسالة Google');
    return {
      id,
      from: header(message.payload?.headers, 'From'),
      subject: header(message.payload?.headers, 'Subject') || 'بدون عنوان',
      date: header(message.payload?.headers, 'Date'),
      snippet: message.snippet || '',
      unread: (message.labelIds || []).includes('UNREAD')
    };
  }));
}

export async function getGoogle(account, id) {
  const access = await token(account);
  const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(id)}?format=raw`, {
    headers: { Authorization: `Bearer ${access}` },
    cache: 'no-store'
  });
  const message = await response.json();
  if (!response.ok) throw new Error(message.error?.message || 'تعذر فتح رسالة Google');
  const raw = Buffer.from(String(message.raw || '').replace(/-/g, '+').replace(/_/g, '/'), 'base64');
  const parsed = await simpleParser(raw);
  return normalizeParsedMessage(parsed, { id });
}

export async function sendGoogle(account, { to, subject, body, attachments = [] }) {
  const access = await token(account);
  const html = buildOutgoingHtml(body, attachments);
  const transport = nodemailer.createTransport({ streamTransport: true, buffer: true, newline: 'unix' });
  const generated = await transport.sendMail({
    from: account.email,
    to,
    subject,
    text: body,
    html,
    attachments: attachments.map((item) => ({
      filename: item.filename,
      content: item.content,
      contentType: item.contentType,
      cid: item.contentId,
      contentDisposition: item.disposition || 'inline'
    }))
  });
  const raw = Buffer.from(generated.message).toString('base64url');
  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${access}`, 'content-type': 'application/json' },
    body: JSON.stringify({ raw }),
    cache: 'no-store'
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || 'تعذر إرسال الرسالة');
  return data;
}
