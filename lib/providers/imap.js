import { ImapFlow } from 'imapflow';
import nodemailer from 'nodemailer';
import { simpleParser } from 'mailparser';
import { decryptSecret } from '../crypto';

function config(account) { return { host: account.imapHost, port: account.imapPort || 993, secure: account.imapSecure, auth: { user: account.email, pass: decryptSecret(account.encryptedSecret) }, logger: false }; }
export async function testImapSmtp(data) {
  const client = new ImapFlow({ host: data.imapHost, port: Number(data.imapPort || 993), secure: data.imapSecure !== false, auth: { user: data.email, pass: data.password }, logger: false });
  await client.connect(); await client.logout();
  const transporter = nodemailer.createTransport({ host: data.smtpHost, port: Number(data.smtpPort || 465), secure: data.smtpSecure !== false, auth: { user: data.email, pass: data.password } });
  await transporter.verify();
}
export async function listImap(account, max = 30) {
  const client = new ImapFlow(config(account));
  await client.connect(); const lock = await client.getMailboxLock('INBOX');
  try {
    const start = Math.max(1, client.mailbox.exists - max + 1); const rows = [];
    for await (const m of client.fetch(`${start}:*`, { uid: true, envelope: true, flags: true, source: true })) {
      rows.push({ id: String(m.uid), from: m.envelope?.from?.[0]?.name || m.envelope?.from?.[0]?.address || '', subject: m.envelope?.subject || 'بدون عنوان', date: m.envelope?.date, snippet: (await simpleParser(m.source)).text?.slice(0, 180) || '', unread: !m.flags?.has('\\Seen') });
    }
    return rows.reverse();
  } finally { lock.release(); await client.logout(); }
}
export async function getImap(account, uid) {
  const client = new ImapFlow(config(account)); await client.connect(); const lock = await client.getMailboxLock('INBOX');
  try { const m = await client.fetchOne(String(uid), { uid: true, envelope: true, source: true }, { uid: true }); if (!m) throw new Error('الرسالة غير موجودة'); const parsed = await simpleParser(m.source); return { id: String(uid), from: parsed.from?.text || '', to: parsed.to?.text || '', subject: parsed.subject || 'بدون عنوان', date: parsed.date, body: parsed.text || String(parsed.html || '').replace(/<[^>]*>/g, ' ') }; } finally { lock.release(); await client.logout(); }
}
export async function sendImap(account, { to, subject, body }) {
  const transporter = nodemailer.createTransport({ host: account.smtpHost, port: account.smtpPort || 465, secure: account.smtpSecure, auth: { user: account.email, pass: decryptSecret(account.encryptedSecret) } });
  return transporter.sendMail({ from: account.email, to, subject, text: body });
}
