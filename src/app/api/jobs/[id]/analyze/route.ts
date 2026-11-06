import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { analyzeJobFit } from '@/lib/gemini';
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

  // Check Quota
  const quota = await checkAiQuota(session.id);
  if (!quota.allowed) {
    return NextResponse.json(
      { error: 'Daily AI usage quota exceeded. Please try again tomorrow.' },
      { status: 429 }
    );
  }

  // Find job with strict tenant isolation
  const job = await prisma.jobPosting.findFirst({
    where: { id, userId: session.id },
  });

  if (!job) {
    return NextResponse.json({ error: 'Job posting not found.' }, { status: 404 });
  }

  // If job was REJECTED by posting guard, block AI execution
  if (job.integrityStatus === 'REJECTED') {
    return NextResponse.json(
      {
        error:
          'This job posting was rejected by the security gate due to high-risk prompt injection or exfiltration signatures.',
      },
      { status: 400 }
    );
  }

  // Fetch candidate profile and latest CV
  const profile = await prisma.profile.findUnique({
    where: { userId: session.id },
  });

  const latestCv = await prisma.document.findFirst({
    where: { userId: session.id, documentType: 'CV', processingStatus: 'READY' },
    orderBy: { createdAt: 'desc' },
  });

  const candidateFacts = `
Name: ${session.displayName || 'Candidate'}
Headline: ${profile?.headline || 'Professional'}
Location: ${profile?.location || 'Not specified'}
Work Authorization: ${profile?.workAuthorization || 'Not specified'}
Target Roles: ${profile?.targetRoles?.join(', ') || 'General'}
Skills: ${profile?.skills?.join(', ') || 'Not specified'}
Profile Summary: ${profile?.experienceSummary || ''}
${latestCv?.extractedText ? `\n--- SOURCE CV DOCUMENT (${latestCv.originalFilename}) ---\n${latestCv.extractedText.slice(0, 10000)}` : ''}
`;

  try {
    const analysisResult = await analyzeJobFit({
      candidateProfile: candidateFacts,
      jobTitle: job.title,
      jobCompany: job.company,
      jobRawText: job.rawText,
    });

    // Save AIAnalysis record
    const savedAnalysis = await prisma.aIAnalysis.create({
      data: {
        userId: session.id,
        jobId: job.id,
        analysisType: 'FIT_ANALYSIS',
        model: 'gemini-3.8-flash',
        promptVersion: '1.0.0',
        inputDocumentIds: latestCv ? [latestCv.id] : [],
        outputJson: analysisResult as any,
        status: 'SUCCESS',
      },
    });

    // Log AI Usage
    await logAiUsage({
      userId: session.id,
      actionType: 'FIT_ANALYSIS',
      inputTokens: Math.ceil(candidateFacts.length / 4) + Math.ceil(job.rawText.length / 4),
      outputTokens: 500,
    });

    await recordAuditLog({
      userId: session.id,
      action: 'RUN_FIT_ANALYSIS',
      resourceId: savedAnalysis.id,
      metadata: { jobId: job.id, score: analysisResult.score },
    });

    return NextResponse.json({
      analysis: savedAnalysis,
      result: analysisResult,
    });
  } catch (err: unknown) {
    console.error('Gemini Fit Analysis failed:', err);
    const msg = err instanceof Error ? err.message : 'AI Fit Analysis failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
