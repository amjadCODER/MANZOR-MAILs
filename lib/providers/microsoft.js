import { decryptSecret, encryptSecret } from '../crypto';
import { prisma } from '../prisma';
async function token(account) {
  if (account.tokenExpiresAt && account.tokenExpiresAt.getTime() > Date.now() + 60000) return decryptSecret(account.accessToken);
  const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: process.env.MICROSOFT_CLIENT_ID, client_secret: process.env.MICROSOFT_CLIENT_SECRET, refresh_token: decryptSecret(account.refreshToken), grant_type: 'refresh_token', scope: 'openid profile email offline_access User.Read Mail.Read Mail.Send' }), cache: 'no-store' });
  const data = await response.json();
  if (!response.ok) throw new Error('انتهى ربط Microsoft ويحتاج إعادة ربط');
  await prisma.mailAccount.update({ where: { id: account.id }, data: { accessToken: encryptSecret(data.access_token), refreshToken: data.refresh_token ? encryptSecret(data.refresh_token) : account.refreshToken, tokenExpiresAt: new Date(Date.now() + data.expires_in * 1000) } });
  return data.access_token;
}
export async function listMicrosoft(account, max = 30) {
  const access = await token(account);
  const url = `https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages?$top=${max}&$select=id,subject,from,receivedDateTime,bodyPreview,isRead&$orderby=receivedDateTime%20desc`;
  const data = await fetch(url, { headers: { Authorization: `Bearer ${access}` }, cache: 'no-store' }).then(r => r.json());
  if (data.error) throw new Error(data.error.message);
  return (data.value || []).map(m => ({ id: m.id, from: m.from?.emailAddress?.name || m.from?.emailAddress?.address || '', subject: m.subject || 'بدون عنوان', date: m.receivedDateTime, snippet: m.bodyPreview || '', unread: !m.isRead }));
}
export async function getMicrosoft(account, id) {
  const access = await token(account);
  const data = await fetch(`https://graph.microsoft.com/v1.0/me/messages/${encodeURIComponent(id)}?$select=id,subject,from,toRecipients,receivedDateTime,body`, { headers: { Authorization: `Bearer ${access}` }, cache: 'no-store' }).then(r => r.json());
  if (data.error) throw new Error(data.error.message);
  return { id: data.id, from: data.from?.emailAddress?.address || '', to: data.toRecipients?.map(x => x.emailAddress?.address).join(', '), subject: data.subject || 'بدون عنوان', date: data.receivedDateTime, body: String(data.body?.content || '').replace(/<[^>]*>/g, ' ') };
}
export async function sendMicrosoft(account, { to, subject, body }) {
  const access = await token(account);
  const response = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', { method: 'POST', headers: { Authorization: `Bearer ${access}`, 'content-type': 'application/json' }, body: JSON.stringify({ message: { subject, body: { contentType: 'Text', content: body }, toRecipients: [{ emailAddress: { address: to } }] }, saveToSentItems: true }) });
  if (!response.ok) { const data = await response.json(); throw new Error(data.error?.message || 'تعذر إرسال الرسالة'); }
  return { success: true };
}
