import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { exchangeCode, fetchProfile, tokenData } from '../../../../../lib/oauth';
import { verifyState } from '../../../../../lib/crypto';

export async function GET(request, { params }) {
  try {
    const url = new URL(request.url);
    if (url.searchParams.get('error')) throw new Error(url.searchParams.get('error_description') || 'تم الغاء الربط');
    const state = verifyState(url.searchParams.get('state'));
    if (state.provider !== params.provider || Date.now() - state.createdAt > 10 * 60 * 1000) throw new Error('انتهت صلاحية محاولة الربط');
    const tokens = await exchangeCode(params.provider, url.searchParams.get('code'), request);
    const profile = await fetchProfile(params.provider, tokens.access_token);
    if (!profile.email) throw new Error('لم نتمكن من معرفة عنوان البريد');
    const providerName = params.provider.toUpperCase();
    const account = await prisma.mailAccount.upsert({
      where: { email: profile.email.toLowerCase() },
      create: { organizationName: state.organizationName, email: profile.email.toLowerCase(), provider: providerName, ...tokenData(tokens), connectionStatus: 'CONNECTED', lastConnectedAt: new Date() },
      update: { organizationName: state.organizationName, provider: providerName, ...tokenData(tokens), connectionStatus: 'CONNECTED', lastConnectedAt: new Date() },
    });
    return NextResponse.redirect(new URL(`/mail/${account.id}`, request.url));
  } catch (error) {
    return NextResponse.redirect(new URL(`/accounts/new?error=${encodeURIComponent(error.message)}`, request.url));
  }
}
