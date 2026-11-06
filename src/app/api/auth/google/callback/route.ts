import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { handleGoogleUserLogin, createSessionCookie } from '@/lib/auth';
import { jwtVerify, createRemoteJWKSet } from 'jose';

const GOOGLE_CERTS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));

function getBaseUrl(): string {
  let url = (process.env.NEXTAUTH_URL || 'http://localhost:3000').trim().replace(/\/+$/, '');
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }
  return url;
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const appBaseUrl = getBaseUrl();

  if (error) {
    return NextResponse.redirect(`${appBaseUrl}/login?error=${encodeURIComponent(error)}`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${appBaseUrl}/login?error=missing_code_or_state`);
  }

  const cookieStore = await cookies();
  const savedState = cookieStore.get('oauth_state')?.value;
  const savedNonce = cookieStore.get('oauth_nonce')?.value;

  // Verify CSRF state
  if (!savedState || savedState !== state) {
    return NextResponse.redirect(`${appBaseUrl}/login?error=invalid_state`);
  }

  // Clear single-use OAuth cookies
  cookieStore.delete('oauth_state');
  cookieStore.delete('oauth_nonce');

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${appBaseUrl}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${appBaseUrl}/login?error=server_configuration_error`);
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      console.error('Google token exchange error:', errText);
      return NextResponse.redirect(`${appBaseUrl}/login?error=token_exchange_failed`);
    }

    const tokenData = await tokenResponse.json();
    const idToken = tokenData.id_token;

    // Verify Google ID Token (signature, aud, iss, exp, nonce)
    const { payload } = await jwtVerify(idToken, GOOGLE_CERTS, {
      audience: clientId,
      issuer: ['https://accounts.google.com', 'accounts.google.com'],
    });

    if (savedNonce && payload.nonce !== savedNonce) {
      return NextResponse.redirect(`${appBaseUrl}/login?error=invalid_nonce`);
    }

    const googleSub = payload.sub;
    const email = payload.email as string;
    const emailVerified = Boolean(payload.email_verified);
    const displayName = (payload.name as string) || email.split('@')[0];
    const avatarUrl = payload.picture as string | undefined;

    if (!googleSub || !email) {
      return NextResponse.redirect(`${appBaseUrl}/login?error=invalid_token_payload`);
    }

    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';

    // Upsert user by google_sub & generate session
    const sessionUser = await handleGoogleUserLogin({
      googleSub,
      email,
      emailVerified,
      displayName,
      avatarUrl,
      ipAddress: clientIp,
    });

    await createSessionCookie(sessionUser);

    return NextResponse.redirect(`${appBaseUrl}/`);
  } catch (err: unknown) {
    console.error('Google callback error:', err);
    return NextResponse.redirect(`${appBaseUrl}/login?error=internal_auth_error`);
  }
}
