import { NextResponse } from 'next/server';
import { ACCESS_COOKIE, accessCookieValue, validateCode } from '../../../../lib/access';

export async function POST(request) {
  const { code } = await request.json();
  if (!validateCode(code)) return NextResponse.json({ error: 'الرمز غير صحيح' }, { status: 401 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ACCESS_COOKIE, accessCookieValue(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}
