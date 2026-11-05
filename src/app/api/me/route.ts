import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { checkAiQuota } from '@/lib/quota';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    include: {
      profile: true,
      _count: {
        select: {
          documents: true,
          jobPostings: true,
          applications: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const quota = await checkAiQuota(session.id);

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      googleSub: user.googleSub,
      createdAt: user.createdAt,
    },
    profile: user.profile,
    stats: user._count,
    quota,
  });
}
