import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { recordAuditLog } from '@/lib/quota';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const applications = await prisma.application.findMany({
    where: { userId: session.id },
    orderBy: { updatedAt: 'desc' },
    include: {
      job: {
        select: {
          id: true,
          title: true,
          company: true,
          location: true,
          sourceUrl: true,
          integrityStatus: true,
        },
      },
    },
  });

  return NextResponse.json({ applications });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { jobId, status = 'SAVED', notes } = body;

    if (!jobId) {
      return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
    }

    // Verify job belongs to user
    const job = await prisma.jobPosting.findFirst({
      where: { id: jobId, userId: session.id },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job posting not found' }, { status: 404 });
    }

    // Find any existing application for this job
    let application = await prisma.application.findFirst({
      where: { jobId, userId: session.id },
    });

    if (!application) {
      application = await prisma.application.create({
        data: {
          userId: session.id,
          jobId,
          status,
          notes,
        },
        include: {
          job: true,
        },
      });

      await recordAuditLog({
        userId: session.id,
        action: 'CREATE_APPLICATION',
        resourceId: application.id,
        metadata: { jobId, title: job.title, company: job.company },
      });
    }

    return NextResponse.json({ application });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create application';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
