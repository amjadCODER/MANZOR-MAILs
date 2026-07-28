import { NextResponse } from 'next/server';
import { oauthProviders, redirectUri } from '../../../../lib/oauth';
import { signState } from '../../../../lib/crypto';

export async function GET(request, { params }) {
  const provider = params.provider;
  const config = oauthProviders[provider];
  if (!config || !config.clientId()) return NextResponse.redirect(new URL(`/accounts/new?error=${encodeURIComponent('اعدادات المزود غير مكتملة')}`, request.url));
  const url = new URL(request.url);
  const organizationName = url.searchParams.get('organizationName')?.trim();
  if (!organizationName) return NextResponse.redirect(new URL('/accounts/new?error=اكتب اسم الجمعية', request.url));
  const state = signState({ provider, organizationName, createdAt: Date.now() });
  const target = new URL(config.authorize);
  target.searchParams.set('client_id', config.clientId());
  target.searchParams.set('redirect_uri', redirectUri(provider, request));
  target.searchParams.set('response_type', 'code');
  target.searchParams.set('scope', config.scope);
  target.searchParams.set('state', state);
  Object.entries(config.extra).forEach(([key, value]) => target.searchParams.set(key, value));
  return NextResponse.redirect(target);
}
