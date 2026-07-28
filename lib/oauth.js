import { encryptSecret } from './crypto';

export const oauthProviders = {
  google: {
    authorize: 'https://accounts.google.com/o/oauth2/v2/auth',
    token: 'https://oauth2.googleapis.com/token',
    profile: 'https://www.googleapis.com/oauth2/v2/userinfo',
    clientId: () => process.env.GOOGLE_CLIENT_ID,
    clientSecret: () => process.env.GOOGLE_CLIENT_SECRET,
    scope: 'openid email profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send',
    extra: { access_type: 'offline', prompt: 'consent' },
  },
  microsoft: {
    authorize: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    token: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    profile: 'https://graph.microsoft.com/v1.0/me',
    clientId: () => process.env.MICROSOFT_CLIENT_ID,
    clientSecret: () => process.env.MICROSOFT_CLIENT_SECRET,
    scope: 'openid profile email offline_access User.Read Mail.Read Mail.Send',
    extra: {},
  },
  zoho: {
    authorize: 'https://accounts.zoho.com/oauth/v2/auth',
    token: 'https://accounts.zoho.com/oauth/v2/token',
    profile: 'https://mail.zoho.com/api/accounts',
    clientId: () => process.env.ZOHO_CLIENT_ID,
    clientSecret: () => process.env.ZOHO_CLIENT_SECRET,
    scope: 'ZohoMail.accounts.READ ZohoMail.messages.READ ZohoMail.messages.CREATE',
    extra: { access_type: 'offline', prompt: 'consent' },
  },
};

export function redirectUri(provider, request) {
  const base = process.env.APP_URL || new URL(request.url).origin;
  return `${base}/api/oauth/${provider}/callback`;
}

export async function exchangeCode(provider, code, request) {
  const config = oauthProviders[provider];
  const body = new URLSearchParams({
    code,
    client_id: config.clientId(),
    client_secret: config.clientSecret(),
    redirect_uri: redirectUri(provider, request),
    grant_type: 'authorization_code',
  });
  const response = await fetch(config.token, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body, cache: 'no-store' });
  const data = await response.json();
  if (!response.ok || !data.access_token) throw new Error(data.error_description || data.error || 'تعذر إكمال ربط البريد');
  return data;
}

export async function fetchProfile(provider, accessToken) {
  const config = oauthProviders[provider];
  const response = await fetch(config.profile, { headers: { Authorization: `Bearer ${accessToken}` }, cache: 'no-store' });
  const data = await response.json();
  if (!response.ok) throw new Error('تعذر قراءة بيانات البريد');
  if (provider === 'google') return { email: data.email, name: data.name };
  if (provider === 'microsoft') return { email: data.mail || data.userPrincipalName, name: data.displayName };
  const account = data.data?.[0] || data.accounts?.[0] || data;
  return { email: account.emailAddress?.[0] || account.primaryEmailAddress || account.emailAddress, name: account.accountDisplayName || account.displayName };
}

export function tokenData(tokens) {
  return {
    accessToken: encryptSecret(tokens.access_token),
    refreshToken: tokens.refresh_token ? encryptSecret(tokens.refresh_token) : undefined,
    tokenExpiresAt: tokens.expires_in ? new Date(Date.now() + Number(tokens.expires_in) * 1000) : null,
  };
}
