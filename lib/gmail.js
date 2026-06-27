const GMAIL_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';

function getHeader(headers = [], name) {
  return headers.find((header) => header.name?.toLowerCase() === name.toLowerCase())?.value || '';
}

function decodeBase64Url(value = '') {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const decoded = Buffer.from(normalized, 'base64').toString('utf8');
  return decoded;
}

function extractBody(payload) {
  if (!payload) return '';

  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  const parts = payload.parts || [];
  const plainPart = parts.find((part) => part.mimeType === 'text/plain' && part.body?.data);
  if (plainPart) return decodeBase64Url(plainPart.body.data);

  const htmlPart = parts.find((part) => part.mimeType === 'text/html' && part.body?.data);
  if (htmlPart) return decodeBase64Url(htmlPart.body.data).replace(/<[^>]*>/g, ' ');

  for (const part of parts) {
    const nested = extractBody(part);
    if (nested) return nested;
  }

  return '';
}

function toPreview(text = '') {
  return text.replace(/\s+/g, ' ').trim().slice(0, 180);
}

export async function gmailFetch(path, accessToken, options = {}) {
  const response = await fetch(`${GMAIL_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gmail API error ${response.status}: ${text}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

export async function getGmailMessages(accessToken, label = 'INBOX', maxResults = 10) {
  const list = await gmailFetch(`/messages?labelIds=${label}&maxResults=${maxResults}`, accessToken);
  const messageIds = list.messages || [];

  const messages = await Promise.all(
    messageIds.map(async (item) => {
      const message = await gmailFetch(`/messages/${item.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`, accessToken);
      const headers = message.payload?.headers || [];
      return {
        id: message.id,
        threadId: message.threadId,
        from: getHeader(headers, 'From'),
        subject: getHeader(headers, 'Subject') || '(No subject)',
        date: getHeader(headers, 'Date'),
        snippet: message.snippet,
        unread: message.labelIds?.includes('UNREAD') || false,
        labels: message.labelIds || [],
      };
    })
  );

  return messages;
}

export async function getGmailMessage(accessToken, id) {
  const message = await gmailFetch(`/messages/${id}?format=full`, accessToken);
  const headers = message.payload?.headers || [];
  const body = extractBody(message.payload);

  return {
    id: message.id,
    threadId: message.threadId,
    from: getHeader(headers, 'From'),
    to: getHeader(headers, 'To'),
    subject: getHeader(headers, 'Subject') || '(No subject)',
    date: getHeader(headers, 'Date'),
    body,
    preview: toPreview(body || message.snippet),
    snippet: message.snippet,
    labels: message.labelIds || [],
  };
}

function buildRawEmail({ to, subject, body }) {
  const message = [
    `To: ${to}`,
    'Content-Type: text/plain; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${subject}`,
    '',
    body,
  ].join('\n');

  return Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function sendGmailMessage(accessToken, payload) {
  const raw = buildRawEmail(payload);
  return gmailFetch('/messages/send', accessToken, {
    method: 'POST',
    body: JSON.stringify({ raw }),
  });
}
