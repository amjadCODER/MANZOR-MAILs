import { ImapFlow } from 'imapflow';
import nodemailer from 'nodemailer';
import { simpleParser } from 'mailparser';
import { decryptSecret, encryptSecret } from '../crypto';
import { prisma } from '../prisma';

async function token(account) {
  if (account.tokenExpiresAt && account.tokenExpiresAt.getTime() > Date.now() + 60000) return decryptSecret(account.accessToken);
  const response = await fetch('https://accounts.zoho.com/oauth/v2/token', {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: process.env.ZOHO_CLIENT_ID, client_secret: process.env.ZOHO_CLIENT_SECRET, refresh_token: decryptSecret(account.refreshToken), grant_type: 'refresh_token' }), cache: 'no-store'
  });
  const data = await response.json();
  if (!response.ok || !data.access_token) throw new Error('انتهى ربط Zoho ويحتاج اعادة ربط');
  await prisma.mailAccount.update({ where: { id: account.id }, data: { accessToken: encryptSecret(data.access_token), tokenExpiresAt: new Date(Date.now() + Number(data.expires_in || 3600) * 1000) } });
  return data.access_token;
}

async function client(account) {
  const accessToken = await token(account);
  return new ImapFlow({ host: 'imappro.zoho.com', port: 993, secure: true, auth: { user: account.email, accessToken }, logger: false });
}
export async function listZoho(account, max = 30) {
  const c = await client(account); await c.connect(); const lock = await c.getMailboxLock('INBOX');
  try { const start = Math.max(1, c.mailbox.exists - max + 1); const rows=[]; for await (const m of c.fetch(`${start}:*`, { uid:true,envelope:true,flags:true,source:true })) { const p=await simpleParser(m.source); rows.push({id:String(m.uid),from:m.envelope?.from?.[0]?.name||m.envelope?.from?.[0]?.address||'',subject:m.envelope?.subject||'بدون عنوان',date:m.envelope?.date,snippet:p.text?.slice(0,180)||'',unread:!m.flags?.has('\\Seen')}); } return rows.reverse(); } finally { lock.release(); await c.logout(); }
}
export async function getZoho(account, uid) {
  const c=await client(account); await c.connect(); const lock=await c.getMailboxLock('INBOX');
  try { const m=await c.fetchOne(String(uid),{uid:true,envelope:true,source:true},{uid:true}); if(!m) throw new Error('الرسالة غير موجودة'); const p=await simpleParser(m.source); return {id:String(uid),from:p.from?.text||'',to:p.to?.text||'',subject:p.subject||'بدون عنوان',date:p.date,body:p.text||String(p.html||'').replace(/<[^>]*>/g,' ')}; } finally { lock.release(); await c.logout(); }
}
export async function sendZoho(account,{to,subject,body}) {
  const accessToken=await token(account); const transporter=nodemailer.createTransport({host:'smtppro.zoho.com',port:465,secure:true,auth:{type:'OAuth2',user:account.email,accessToken}}); return transporter.sendMail({from:account.email,to,subject,text:body});
}
