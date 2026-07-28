import crypto from 'crypto';

export const ACCESS_COOKIE = 'manzor_access';

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function expectedToken() {
  return crypto.createHmac('sha256', required('NEXTAUTH_SECRET')).update(required('ACCESS_CODE')).digest('hex');
}

export function validateCode(code) {
  const expected = required('ACCESS_CODE');
  const actualBuffer = Buffer.from(String(code || ''));
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(actualBuffer, expectedBuffer);
}

export function accessCookieValue() {
  return expectedToken();
}

export function hasValidAccess(request) {
  try {
    return request.cookies.get(ACCESS_COOKIE)?.value === expectedToken();
  } catch {
    return false;
  }
}
