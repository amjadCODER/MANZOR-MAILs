import { NextResponse } from 'next/server';

const ACCESS_COOKIE = 'manzor_access';

async function expectedToken() {
  const code = process.env.ACCESS_CODE;
  const secret = process.env.NEXTAUTH_SECRET;
  if (!code || !secret) return null;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(code));
  return Array.from(new Uint8Array(signature)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const publicPath = pathname === '/login' || pathname.startsWith('/api/access/') || pathname.startsWith('/api/oauth/') || pathname.startsWith('/_next/') || pathname === '/favicon.ico' || pathname.startsWith('/manzor-tech-logo');
  if (publicPath) return NextResponse.next();

  const expected = await expectedToken();
  const cookie = request.cookies.get(ACCESS_COOKIE)?.value;
  if (!expected || !cookie || cookie !== expected) return NextResponse.redirect(new URL('/login', request.url));
  return NextResponse.next();
}

export const config = { matcher: ['/((?!_next/static|_next/image).*)'] };
