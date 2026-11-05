import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { prisma } from './db';
import { recordAuditLog } from './quota';

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'default-fallback-super-secret-key-32-chars-long'
);
const SESSION_COOKIE_NAME = 'job_search_session';

export interface SessionUser {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  googleSub: string;
}

/**
 * Creates an encrypted JWT session cookie for the authenticated user.
 */
export async function createSessionCookie(user: SessionUser) {
  const token = await new SignJWT({
    userId: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    googleSub: user.googleSub,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('14d') // 14 days session
    .sign(JWT_SECRET);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 14, // 14 days
    path: '/',
  });

  return token;
}

/**
 * Retrieves the current authenticated user session from the request cookie.
 */
export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get(SESSION_COOKIE_NAME);
    if (!tokenCookie?.value) return null;

    const { payload } = await jwtVerify(tokenCookie.value, JWT_SECRET);
    if (!payload.userId) return null;

    return {
      id: payload.userId as string,
      email: payload.email as string,
      displayName: (payload.displayName as string) || null,
      avatarUrl: (payload.avatarUrl as string) || null,
      googleSub: payload.googleSub as string,
    };
  } catch {
    return null;
  }
}

/**
 * Requires an authenticated user session, otherwise throws 401.
 */
export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    throw new Error('UNAUTHORIZED');
  }
  return session;
}

/**
 * Clears the session cookie (Logout).
 */
export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Upserts a User record in the database using their verified Google `sub`.
 */
export async function handleGoogleUserLogin(params: {
  googleSub: string;
  email: string;
  emailVerified: boolean;
  displayName?: string;
  avatarUrl?: string;
  ipAddress?: string;
}): Promise<SessionUser> {
  // Find or create by unique google_sub (PRD Section 6 Flow A requirement)
  let user = await prisma.user.findUnique({
    where: { googleSub: params.googleSub },
    include: { profile: true },
  });

  if (!user) {
    // If not found by sub, check if user with this email exists (link account)
    const existingByEmail = await prisma.user.findUnique({
      where: { email: params.email },
    });

    if (existingByEmail) {
      user = await prisma.user.update({
        where: { id: existingByEmail.id },
        data: {
          googleSub: params.googleSub,
          emailVerified: params.emailVerified,
          displayName: params.displayName || existingByEmail.displayName,
          avatarUrl: params.avatarUrl || existingByEmail.avatarUrl,
        },
        include: { profile: true },
      });
    } else {
      user = await prisma.user.create({
        data: {
          googleSub: params.googleSub,
          email: params.email,
          emailVerified: params.emailVerified,
          displayName: params.displayName,
          avatarUrl: params.avatarUrl,
          profile: {
            create: {
              headline: 'Job Seeker',
              targetRoles: [],
              industries: [],
              skills: [],
            },
          },
        },
        include: { profile: true },
      });
    }
  } else {
    // Update profile info if changed
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        email: params.email,
        emailVerified: params.emailVerified,
        displayName: params.displayName || user.displayName,
        avatarUrl: params.avatarUrl || user.avatarUrl,
      },
      include: { profile: true },
    });
  }

  const sessionUser: SessionUser = {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    googleSub: user.googleSub,
  };

  await recordAuditLog({
    userId: user.id,
    action: 'LOGIN',
    ipAddress: params.ipAddress,
    metadata: { provider: 'google' },
  });

  return sessionUser;
}
