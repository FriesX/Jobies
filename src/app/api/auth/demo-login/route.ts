import { NextRequest, NextResponse } from 'next/server';
import { handleGoogleUserLogin, createSessionCookie, clearSessionCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = body.email || 'jobseeker.demo@example.com';
    const displayName = body.name || 'Demo Job Seeker';
    const googleSub = `demo-sub-${Buffer.from(email).toString('hex').slice(0, 16)}`;

    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';

    const sessionUser = await handleGoogleUserLogin({
      googleSub,
      email,
      emailVerified: true,
      displayName,
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`,
      ipAddress: clientIp,
    });

    await createSessionCookie(sessionUser);

    return NextResponse.json({ success: true, user: sessionUser });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Demo login failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
