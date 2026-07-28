import crypto from 'crypto';

export const ACCESS_COOKIE = 'manzor_access';

function expectedToken() {
  const code = process.env.ACCESS_CODE || '1608';
  const secret = process.env.NEXTAUTH_SECRET || 'manzor-mail-local-secret';
  return crypto.createHmac('sha256', secret).update(code).digest('hex');
}

export function validateCode(code) {
  const expected = process.env.ACCESS_CODE || '1608';
  const a = Buffer.from(String(code || ''));
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function accessCookieValue() {
  return expectedToken();
}

export function hasValidAccess(request) {
  return request.cookies.get(ACCESS_COOKIE)?.value === expectedToken();
}
