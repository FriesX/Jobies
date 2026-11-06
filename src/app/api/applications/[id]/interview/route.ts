import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { generateInterviewPrep } from '@/lib/gemini';
import { checkAiQuota, logAiUsage } from '@/lib/quota';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  // Find analysis of type INTERVIEW_PREP for this application's job
  const application = await prisma.application.findFirst({
    where: { id, userId: session.id },
    include: {
      job: {
        include: {
          analyses: {
            where: { analysisType: 'INTERVIEW_PREP' },
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

  const prepData = application.job.analyses[0]?.outputJson || null;

  return NextResponse.json({ prepData, application });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const quota = await checkAiQuota(session.id);
  if (!quota.allowed) {
    return NextResponse.json({ error: 'Daily AI quota exceeded.' }, { status: 429 });
  }

  const application = await prisma.application.findFirst({
    where: { id, userId: session.id },
    include: { job: true },
  });

  if (!application) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: session.id },
  });

  const sourceCv = await prisma.document.findFirst({
    where: { userId: session.id, documentType: 'CV', processingStatus: 'READY' },
    orderBy: { createdAt: 'desc' },
  });

  const candidateProfile = `
Name: ${session.displayName || 'Candidate'}
Headline: ${profile?.headline || ''}
Skills: ${profile?.skills?.join(', ') || ''}
Experience Summary: ${profile?.experienceSummary || ''}
CV Content: ${sourceCv?.extractedText?.slice(0, 5000) || ''}
`;

  try {
    const prepData = await generateInterviewPrep({
      candidateProfile,
      jobTitle: application.job.title,
      jobCompany: application.job.company,
      jobRawText: application.job.rawText,
    });

    const analysis = await prisma.aIAnalysis.create({
      data: {
        userId: session.id,
        jobId: application.jobId,
        analysisType: 'INTERVIEW_PREP',
        model: 'gemini-3.8-flash',
        promptVersion: '1.0.0',
        inputDocumentIds: sourceCv ? [sourceCv.id] : [],
        outputJson: prepData as any,
        status: 'SUCCESS',
      },
    });

    await logAiUsage({
      userId: session.id,
      actionType: 'INTERVIEW_PREP',
      inputTokens: 1500,
      outputTokens: 800,
    });

    return NextResponse.json({ prepData, analysisId: analysis.id });
  } catch (err: unknown) {
    console.error('Interview prep generation failed:', err);
    const msg = err instanceof Error ? err.message : 'Interview prep failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
