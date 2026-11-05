import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const job = await prisma.jobPosting.findFirst({
    where: { id, userId: session.id },
    include: {
      analyses: {
        orderBy: { createdAt: 'desc' },
      },
      applications: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!job) {
    return NextResponse.json({ error: 'Job posting not found' }, { status: 404 });
  }

  return NextResponse.json({ job });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  await prisma.jobPosting.deleteMany({
    where: { id, userId: session.id },
  });

  return NextResponse.json({ success: true });
}
