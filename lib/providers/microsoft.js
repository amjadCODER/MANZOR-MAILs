import { decryptSecret, encryptSecret } from '../crypto';
import { prisma } from '../prisma';
import { buildOutgoingHtml, sanitizeEmailHtml } from '../email-content';

async function token(account) {
  if (account.tokenExpiresAt && account.tokenExpiresAt.getTime() > Date.now() + 60000) return decryptSecret(account.accessToken);
  const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.MICROSOFT_CLIENT_ID,
      client_secret: process.env.MICROSOFT_CLIENT_SECRET,
      refresh_token: decryptSecret(account.refreshToken),
      grant_type: 'refresh_token',
      scope: 'openid profile email offline_access User.Read Mail.Read Mail.Send'
    }),
    cache: 'no-store'
  });
  const data = await response.json();
  if (!response.ok) throw new Error('انتهى ربط Microsoft ويحتاج إعادة ربط');
  await prisma.mailAccount.update({
    where: { id: account.id },
    data: {
      accessToken: encryptSecret(data.access_token),
      refreshToken: data.refresh_token ? encryptSecret(data.refresh_token) : account.refreshToken,
      tokenExpiresAt: new Date(Date.now() + Number(data.expires_in || 3600) * 1000)
    }
  });
  return data.access_token;
}

async function graph(access, url) {
  const response = await fetch(url, { headers: { Authorization: `Bearer ${access}` }, cache: 'no-store' });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || 'تعذر الاتصال بـ Microsoft');
  return data;
}

export async function listMicrosoft(account, max = 30) {
  const access = await token(account);
  const url = `https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages?$top=${max}&$select=id,subject,from,receivedDateTime,bodyPreview,isRead&$orderby=receivedDateTime%20desc`;
  const data = await graph(access, url);
  return (data.value || []).map((message) => ({
    id: message.id,
    from: message.from?.emailAddress?.name || message.from?.emailAddress?.address || '',
    subject: message.subject || 'بدون عنوان',
    date: message.receivedDateTime,
    snippet: message.bodyPreview || '',
    unread: !message.isRead
  }));
}

async function microsoftAttachments(access, id) {
  const data = await graph(access, `https://graph.microsoft.com/v1.0/me/messages/${encodeURIComponent(id)}/attachments?$top=50`);
  const output = [];
  for (const item of data.value || []) {
    let attachment = item;
    if (item['@odata.type'] === '#microsoft.graph.fileAttachment' && !item.contentBytes) {
      attachment = await graph(access, `https://graph.microsoft.com/v1.0/me/messages/${encodeURIComponent(id)}/attachments/${encodeURIComponent(item.id)}`);
    }
    if (attachment.contentBytes) {
      output.push({
        filename: attachment.name || 'attachment',
        contentType: attachment.contentType || 'application/octet-stream',
        contentId: attachment.contentId || '',
        contentDisposition: attachment.isInline ? 'inline' : 'attachment',
        size: attachment.size || 0,
        content: Buffer.from(attachment.contentBytes, 'base64')
      });
    }
  }
  return output;
}

export async function getMicrosoft(account, id) {
  const access = await token(account);
  const data = await graph(access, `https://graph.microsoft.com/v1.0/me/messages/${encodeURIComponent(id)}?$select=id,subject,from,toRecipients,receivedDateTime,body,bodyPreview`);
  const attachments = await microsoftAttachments(access, id);
  return {
    id: data.id,
    from: data.from?.emailAddress?.name || data.from?.emailAddress?.address || '',
    to: data.toRecipients?.map((item) => item.emailAddress?.address).join(', ') || '',
    subject: data.subject || 'بدون عنوان',
    date: data.receivedDateTime,
    text: data.bodyPreview || '',
    html: sanitizeEmailHtml(data.body?.contentType === 'html' ? data.body.content : `<pre>${data.body?.content || ''}</pre>`, attachments),
    attachments: attachments.map(({ content, ...meta }) => meta),
    snippet: data.bodyPreview || ''
  };
}

export async function sendMicrosoft(account, { to, subject, body, attachments = [] }) {
  const access = await token(account);
  const response = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
    method: 'POST',
    headers: { Authorization: `Bearer ${access}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      message: {
        subject,
        body: { contentType: 'HTML', content: buildOutgoingHtml(body, attachments) },
        toRecipients: [{ emailAddress: { address: to } }],
        attachments: attachments.map((item) => ({
          '@odata.type': '#microsoft.graph.fileAttachment',
          name: item.filename,
          contentType: item.contentType,
          contentBytes: Buffer.from(item.content).toString('base64'),
          isInline: true,
          contentId: item.contentId
        }))
      },
      saveToSentItems: true
    }),
    cache: 'no-store'
  });
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error?.message || 'تعذر إرسال الرسالة');
  }
  return { success: true };
}
