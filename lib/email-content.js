import sanitizeHtml from 'sanitize-html';

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function textToHtml(text = '') {
  return `<div dir="auto" style="white-space:pre-wrap;line-height:1.9;font-family:Arial,Tahoma,sans-serif">${escapeHtml(text).replace(/\r?\n/g, '<br>')}</div>`;
}

function inlineCidImages(html, attachments = []) {
  let result = String(html || '');
  for (const attachment of attachments) {
    if (!attachment?.contentId || !attachment?.content || !String(attachment.contentType || '').startsWith('image/')) continue;
    const cid = String(attachment.contentId).replace(/[<>]/g, '');
    const dataUrl = `data:${attachment.contentType};base64,${Buffer.from(attachment.content).toString('base64')}`;
    result = result.replace(new RegExp(`cid:${cid.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi'), dataUrl);
  }
  return result;
}

export function sanitizeEmailHtml(html = '', attachments = []) {
  const withInlineImages = inlineCidImages(html, attachments);
  const clean = sanitizeHtml(withInlineImages, {
    allowedTags: [
      ...sanitizeHtml.defaults.allowedTags,
      'style', 'link',
      'img', 'picture', 'source', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th',
      'center', 'font', 'section', 'article', 'header', 'footer', 'main', 'figure', 'figcaption',
      'svg', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'g', 'defs', 'use'
    ],
    allowedAttributes: {
      '*': ['class', 'id', 'style', 'title', 'dir', 'lang', 'width', 'height', 'align', 'valign', 'role', 'aria-*', 'data-*', 'background', 'bgcolor', 'border', 'cellpadding', 'cellspacing'],
      a: ['href', 'name', 'target', 'rel', 'title', 'style', 'class'],
      img: ['src', 'srcset', 'alt', 'title', 'width', 'height', 'style', 'class', 'loading'],
      source: ['src', 'srcset', 'type', 'media'],
      link: ['rel', 'href', 'type', 'media'],
      font: ['color', 'face', 'size', 'style'],
      svg: ['viewBox', 'width', 'height', 'fill', 'xmlns', 'style'],
      path: ['d', 'fill', 'stroke', 'stroke-width'],
      circle: ['cx', 'cy', 'r', 'fill', 'stroke'],
      rect: ['x', 'y', 'width', 'height', 'rx', 'fill', 'stroke'],
      line: ['x1', 'x2', 'y1', 'y2', 'stroke', 'stroke-width'],
      polyline: ['points', 'fill', 'stroke', 'stroke-width'],
      polygon: ['points', 'fill', 'stroke', 'stroke-width'],
      use: ['href', 'xlink:href']
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel', 'data', 'cid'],
    allowedSchemesByTag: { img: ['http', 'https', 'data', 'cid'], source: ['http', 'https', 'data'], link: ['http', 'https'], a: ['http', 'https', 'mailto', 'tel'] },
    allowProtocolRelative: true,
    allowedStyles: {
      '*': {
        color: [/^.*$/], 'background-color': [/^.*$/], background: [/^.*$/],
        'font-size': [/^.*$/], 'font-family': [/^.*$/], 'font-weight': [/^.*$/], 'font-style': [/^.*$/],
        'text-align': [/^.*$/], 'text-decoration': [/^.*$/], 'line-height': [/^.*$/], 'letter-spacing': [/^.*$/],
        display: [/^.*$/], width: [/^.*$/], height: [/^.*$/], 'max-width': [/^.*$/], 'min-width': [/^.*$/],
        margin: [/^.*$/], 'margin-left': [/^.*$/], 'margin-right': [/^.*$/], 'margin-top': [/^.*$/], 'margin-bottom': [/^.*$/],
        padding: [/^.*$/], 'padding-left': [/^.*$/], 'padding-right': [/^.*$/], 'padding-top': [/^.*$/], 'padding-bottom': [/^.*$/],
        border: [/^.*$/], 'border-radius': [/^.*$/], 'border-collapse': [/^.*$/], 'vertical-align': [/^.*$/],
        float: [/^.*$/], position: [/^.*$/], top: [/^.*$/], left: [/^.*$/], right: [/^.*$/], bottom: [/^.*$/],
        overflow: [/^.*$/], 'white-space': [/^.*$/]
      }
    },
    disallowedTagsMode: 'discard',
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { target: '_blank', rel: 'noopener noreferrer' }, true),
      img: (tagName, attribs) => ({ tagName, attribs: { ...attribs, loading: 'lazy' } })
    }
  });

  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base target="_blank"><style>html,body{margin:0;padding:0;background:#fff;color:#111}body{font-family:Arial,Tahoma,sans-serif;overflow-wrap:anywhere}img{max-width:100%;height:auto}table{max-width:100%}a{cursor:pointer}</style></head><body>${clean}</body></html>`;
}

export function normalizeParsedMessage(parsed, fallback = {}) {
  const attachments = (parsed.attachments || []).map((item) => ({
    filename: item.filename || 'attachment',
    contentType: item.contentType || 'application/octet-stream',
    contentId: item.cid || item.contentId || '',
    contentDisposition: item.contentDisposition || 'attachment',
    size: item.size || item.content?.length || 0,
    content: item.content
  }));
  const text = parsed.text || '';
  const rawHtml = parsed.html || textToHtml(text);
  return {
    id: fallback.id,
    from: parsed.from?.text || fallback.from || '',
    to: parsed.to?.text || fallback.to || '',
    subject: parsed.subject || fallback.subject || 'بدون عنوان',
    date: parsed.date || fallback.date || null,
    text,
    html: sanitizeEmailHtml(rawHtml, attachments),
    attachments: attachments.map(({ content, ...meta }) => meta),
    snippet: text.slice(0, 220)
  };
}

export function buildOutgoingHtml(body = '', attachments = []) {
  const imageBlocks = attachments
    .filter((item) => String(item.contentType || '').startsWith('image/'))
    .map((item) => `<div style="margin-top:18px"><img src="cid:${escapeHtml(item.contentId)}" alt="${escapeHtml(item.filename)}" style="max-width:100%;height:auto;border-radius:8px"></div>`)
    .join('');
  return `<!doctype html><html><head><meta charset="utf-8"></head><body dir="auto" style="font-family:Arial,Tahoma,sans-serif;line-height:1.9;color:#111">${textToHtml(body)}${imageBlocks}</body></html>`;
}
