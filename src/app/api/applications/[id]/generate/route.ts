import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { generateTailoredCv, generateCoverLetterMarkdown } from '@/lib/gemini';
import { checkAiQuota, logAiUsage, recordAuditLog } from '@/lib/quota';

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
    return NextResponse.json(
      { error: 'Daily AI usage quota exceeded. Please try again tomorrow.' },
      { status: 429 }
    );
  }

  const application = await prisma.application.findFirst({
    where: { id, userId: session.id },
    include: { job: true },
  });

  if (!application) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  }

  // Fetch candidate profile and latest uploaded CV document
  const profile = await prisma.profile.findUnique({
    where: { userId: session.id },
  });

  const sourceCv = await prisma.document.findFirst({
    where: { userId: session.id, documentType: 'CV', processingStatus: 'READY' },
    orderBy: { createdAt: 'desc' },
  });

  const candidateFacts = `
Candidate Name: ${session.displayName || 'Candidate'}
Email: ${session.email}
Headline: ${profile?.headline || 'Professional'}
Location: ${profile?.location || 'Not specified'}
Work Authorization: ${profile?.workAuthorization || 'Not specified'}
Key Skills: ${profile?.skills?.join(', ') || 'Not specified'}
Career Experience Summary:
${profile?.experienceSummary || ''}
`;

  const sourceCvText = sourceCv?.extractedText || candidateFacts;

  try {
    // 1. Generate Tailored CV JSON
    const tailoredCv = await generateTailoredCv({
      candidateProfile: candidateFacts,
      candidateSourceCvText: sourceCvText,
      jobTitle: application.job.title,
      jobCompany: application.job.company,
      jobRawText: application.job.rawText,
    });

    // 2. Generate Cover Letter Markdown
    const coverLetter = await generateCoverLetterMarkdown({
      candidateProfile: candidateFacts + '\n' + sourceCvText.slice(0, 3000),
      candidateName: session.displayName || 'Job Seeker',
      jobTitle: application.job.title,
      jobCompany: application.job.company,
      jobRawText: application.job.rawText,
    });

    // Update Application record
    const updatedApplication = await prisma.application.update({
      where: { id },
      data: {
        tailoredCvJson: tailoredCv as any,
        coverLetterMarkdown: coverLetter,
        selectedDocumentIds: sourceCv ? [sourceCv.id] : [],
      },
      include: { job: true },
    });

    // Record AI run
    await prisma.aIAnalysis.create({
      data: {
        userId: session.id,
        jobId: application.jobId,
        analysisType: 'TAILOR_DOCUMENTS',
        model: 'gemini-1.5-flash',
        promptVersion: '1.0.0',
        inputDocumentIds: sourceCv ? [sourceCv.id] : [],
        outputJson: { tailoredCv, hasCoverLetter: true } as any,
        status: 'SUCCESS',
      },
    });

    await logAiUsage({
      userId: session.id,
      actionType: 'GENERATE_DOCUMENTS',
      inputTokens: 2000,
      outputTokens: 1500,
    });

    await recordAuditLog({
      userId: session.id,
      action: 'GENERATE_TAILORED_DOCUMENTS',
      resourceId: id,
    });

    return NextResponse.json({
      application: updatedApplication,
      tailoredCv,
      coverLetter,
    });
  } catch (err: unknown) {
    console.error('Document generation error:', err);
    const msg = err instanceof Error ? err.message : 'Failed to generate tailored application documents';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
