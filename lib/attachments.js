import crypto from 'crypto';
import { prisma } from './prisma';

const MAX_FILE_SIZE = 3 * 1024 * 1024;
const MAX_FILES = 3;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

let ensured = false;

export async function ensureAttachmentTable() {
  if (ensured) return;
  await prisma.$executeRawUnsafe('CREATE SCHEMA IF NOT EXISTS manzor_mail');
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS manzor_mail."EmailAttachment" (
      "id" text PRIMARY KEY,
      "accountId" text NOT NULL,
      "filename" text NOT NULL,
      "contentType" text NOT NULL,
      "size" integer NOT NULL,
      "content" bytea NOT NULL,
      "contentId" text,
      "disposition" text NOT NULL DEFAULT 'inline',
      "createdAt" timestamptz NOT NULL DEFAULT now(),
      "sentAt" timestamptz
    )
  `);
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "EmailAttachment_accountId_idx" ON manzor_mail."EmailAttachment" ("accountId")');
  ensured = true;
}

export async function persistUploadedImages(accountId, files) {
  const imageFiles = files.filter((file) => file && file.size > 0);
  if (imageFiles.length > MAX_FILES) throw new Error(`الحد الاقصى ${MAX_FILES} صور`);
  const totalSize = imageFiles.reduce((sum, file) => sum + file.size, 0);
  if (totalSize > 4 * 1024 * 1024) throw new Error('الحجم الاجمالي للصور يجب ألا يتجاوز 4 ميجابايت');
  await ensureAttachmentTable();
  const saved = [];
  for (const file of imageFiles) {
    if (!ALLOWED_TYPES.has(file.type)) throw new Error('المسموح صور JPG وPNG وWEBP وGIF فقط');
    if (file.size > MAX_FILE_SIZE) throw new Error('حجم الصورة الواحدة يجب ألا يتجاوز 3 ميجابايت');
    const content = Buffer.from(await file.arrayBuffer());
    const id = crypto.randomUUID();
    const contentId = `${id}@manzor-mail`;
    const row = await prisma.emailAttachment.create({
      data: {
        id,
        accountId,
        filename: file.name || `image-${id}`,
        contentType: file.type,
        size: content.length,
        content,
        contentId,
        disposition: 'inline'
      }
    });
    saved.push({
      id: row.id,
      filename: row.filename,
      contentType: row.contentType,
      size: row.size,
      content: Buffer.from(row.content),
      contentId: row.contentId,
      disposition: row.disposition
    });
  }
  return saved;
}

export async function markAttachmentsSent(ids = []) {
  if (!ids.length) return;
  await ensureAttachmentTable();
  await prisma.emailAttachment.updateMany({ where: { id: { in: ids } }, data: { sentAt: new Date() } });
}
