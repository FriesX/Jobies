import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { reviewApplicationDocument } from '@/lib/gemini';
import { checkAiQuota, logAiUsage } from '@/lib/quota';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  // Check quota
  const quota = await checkAiQuota(session.id);
  if (!quota.allowed) {
    return NextResponse.json({ error: 'Daily AI usage quota exceeded.' }, { status: 429 });
  }

  const application = await prisma.application.findFirst({
    where: { id, userId: session.id },
    include: { job: true },
  });

  if (!application) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  }

  // Get source document text
  const sourceDoc = await prisma.document.findFirst({
    where: { userId: session.id, documentType: 'CV', processingStatus: 'READY' },
    orderBy: { createdAt: 'desc' },
  });

  const sourceText = sourceDoc?.extractedText || 'No source CV text available.';
  const tailoredContent = JSON.stringify(application.tailoredCvJson || {}) + '\n\n' + (application.coverLetterMarkdown || '');

  try {
    const feedback = await reviewApplicationDocument({
      sourceCvText: sourceText,
      tailoredDocText: tailoredContent,
      jobRawText: application.job.rawText,
    });

    const updated = await prisma.application.update({
      where: { id },
      data: {
        reviewerFeedback: feedback as any,
      },
    });

    await logAiUsage({
      userId: session.id,
      actionType: 'REVIEW_DOCUMENT',
      inputTokens: 1500,
      outputTokens: 500,
    });

    return NextResponse.json({
      reviewerFeedback: feedback,
      application: updated,
    });
  } catch (err: unknown) {
    console.error('Reviewer check failed:', err);
    const msg = err instanceof Error ? err.message : 'Reviewer check failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
