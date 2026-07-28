import crypto from 'crypto';

function key() {
  const source = process.env.CREDENTIALS_ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET || 'change-this-key-before-production';
  return crypto.createHash('sha256').update(source).digest();
}

export function encryptSecret(value) {
  if (!value) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, encrypted].map((part) => part.toString('base64url')).join('.');
}

export function decryptSecret(value) {
  if (!value) return null;
  const [iv, tag, encrypted] = value.split('.').map((part) => Buffer.from(part, 'base64url'));
  const decipher = crypto.createDecipheriv('aes-256-gcm', key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

export function signState(payload) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', key()).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}

export function verifyState(state) {
  const [encoded, signature] = String(state || '').split('.');
  if (!encoded || !signature) throw new Error('حالة الربط غير صالحة');
  const expected = crypto.createHmac('sha256', key()).update(encoded).digest('base64url');
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) throw new Error('حالة الربط غير صالحة');
  return JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
}
