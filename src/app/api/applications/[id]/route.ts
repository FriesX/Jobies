import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { recordAuditLog } from '@/lib/quota';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const application = await prisma.application.findFirst({
    where: { id, userId: session.id },
    include: {
      job: {
        include: {
          analyses: {
            where: { analysisType: 'FIT_ANALYSIS' },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      },
    },
  });

  if (!application) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  }

  return NextResponse.json({ application });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const { status, notes, followUpDate, appliedAt, coverLetterMarkdown } = body;

    const existing = await prisma.application.findFirst({
      where: { id, userId: session.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const updated = await prisma.application.update({
      where: { id },
      data: {
        status: status !== undefined ? status : existing.status,
        notes: notes !== undefined ? notes : existing.notes,
        followUpDate: followUpDate !== undefined ? (followUpDate ? new Date(followUpDate) : null) : existing.followUpDate,
        appliedAt: appliedAt !== undefined ? (appliedAt ? new Date(appliedAt) : null) : existing.appliedAt,
        coverLetterMarkdown: coverLetterMarkdown !== undefined ? coverLetterMarkdown : existing.coverLetterMarkdown,
      },
      include: {
        job: true,
      },
    });

    if (status && status !== existing.status) {
      await recordAuditLog({
        userId: session.id,
        action: 'UPDATE_APPLICATION_STATUS',
        resourceId: id,
        metadata: { from: existing.status, to: status },
      });
    }

    return NextResponse.json({ application: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update application';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
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

  await prisma.application.deleteMany({
    where: { id, userId: session.id },
  });

  return NextResponse.json({ success: true });
}
