import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { cookies } from 'next/headers';

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/google/callback`;

  if (!clientId) {
    return NextResponse.json(
      { error: 'GOOGLE_CLIENT_ID is not configured in environment variables.' },
      { status: 500 }
    );
  }

  // Generate cryptographic state & nonce (PRD Section 6 Flow A & Section 9.1 requirement)
  const state = crypto.randomBytes(24).toString('hex');
  const nonce = crypto.randomBytes(24).toString('hex');

  const cookieStore = await cookies();
  cookieStore.set('oauth_state', state, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 600, sameSite: 'lax', path: '/' });
  cookieStore.set('oauth_nonce', nonce, { httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 600, sameSite: 'lax', path: '/' });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    nonce,
    access_type: 'online',
    prompt: 'select_account',
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  return NextResponse.json({ url: authUrl });
}
