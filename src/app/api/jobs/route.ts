import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const jobs = await prisma.jobPosting.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: 'desc' },
    include: {
      analyses: {
        where: { analysisType: 'FIT_ANALYSIS' },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      applications: {
        select: { id: true, status: true },
      },
    },
  });

  return NextResponse.json({ jobs });
}
