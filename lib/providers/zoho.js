import { ImapFlow } from 'imapflow';
import nodemailer from 'nodemailer';
import { simpleParser } from 'mailparser';
import { decryptSecret, encryptSecret } from '../crypto';
import { prisma } from '../prisma';
import { buildOutgoingHtml, normalizeParsedMessage } from '../email-content';

async function token(account) {
  if (account.tokenExpiresAt && account.tokenExpiresAt.getTime() > Date.now() + 60000) return decryptSecret(account.accessToken);
  const response = await fetch('https://accounts.zoho.com/oauth/v2/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.ZOHO_CLIENT_ID,
      client_secret: process.env.ZOHO_CLIENT_SECRET,
      refresh_token: decryptSecret(account.refreshToken),
      grant_type: 'refresh_token'
    }),
    cache: 'no-store'
  });
  const data = await response.json();
  if (!response.ok || !data.access_token) throw new Error('انتهى ربط Zoho ويحتاج اعادة ربط');
  await prisma.mailAccount.update({
    where: { id: account.id },
    data: { accessToken: encryptSecret(data.access_token), tokenExpiresAt: new Date(Date.now() + Number(data.expires_in || 3600) * 1000) }
  });
  return data.access_token;
}

async function client(account) {
  const accessToken = await token(account);
  return new ImapFlow({ host: 'imappro.zoho.com', port: 993, secure: true, auth: { user: account.email, accessToken }, logger: false });
}

export async function listZoho(account, max = 30) {
  const connection = await client(account);
  await connection.connect();
  const lock = await connection.getMailboxLock('INBOX');
  try {
    const start = Math.max(1, connection.mailbox.exists - max + 1);
    const rows = [];
    for await (const message of connection.fetch(`${start}:*`, { uid: true, envelope: true, flags: true, source: true })) {
      const parsed = await simpleParser(message.source);
      rows.push({
        id: String(message.uid),
        from: message.envelope?.from?.[0]?.name || message.envelope?.from?.[0]?.address || '',
        subject: message.envelope?.subject || 'بدون عنوان',
        date: message.envelope?.date,
        snippet: parsed.text?.slice(0, 180) || '',
        unread: !message.flags?.has('\\Seen')
      });
    }
    return rows.reverse();
  } finally {
    lock.release();
    await connection.logout();
  }
}

export async function getZoho(account, uid) {
  const connection = await client(account);
  await connection.connect();
  const lock = await connection.getMailboxLock('INBOX');
  try {
    const message = await connection.fetchOne(String(uid), { uid: true, envelope: true, source: true }, { uid: true });
    if (!message) throw new Error('الرسالة غير موجودة');
    return normalizeParsedMessage(await simpleParser(message.source), { id: String(uid) });
  } finally {
    lock.release();
    await connection.logout();
  }
}

export async function sendZoho(account, { to, subject, body, attachments = [] }) {
  const accessToken = await token(account);
  const transporter = nodemailer.createTransport({ host: 'smtppro.zoho.com', port: 465, secure: true, auth: { type: 'OAuth2', user: account.email, accessToken } });
  return transporter.sendMail({
    from: account.email,
    to,
    subject,
    text: body,
    html: buildOutgoingHtml(body, attachments),
    attachments: attachments.map((item) => ({ filename: item.filename, content: item.content, contentType: item.contentType, cid: item.contentId, contentDisposition: 'inline' }))
  });
}
