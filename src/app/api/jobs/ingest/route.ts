import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { inspectPostingIntegrity } from '@/lib/security/posting-guard';
import { checkAiQuota, logAiUsage, recordAuditLog } from '@/lib/quota';
import { scrapeJobWithHeadlessBrowser } from '@/lib/scraper';
import { analyzeJobFit } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { url, rawText, title, company, location, autoAnalyze = true } = body;

    let contentToInspect = '';
    let resolvedTitle = title || '';
    let resolvedCompany = company || '';
    let resolvedLocation = location || '';
    let sourceHost: string | null = null;
    let sourceUrl: string | null = null;
    let isAuthWall = false;
    let warnings: string[] = [];

    if (url) {
      sourceUrl = url;
      try {
        const parsedUrl = new URL(url);
        sourceHost = parsedUrl.hostname;
      } catch {
        return NextResponse.json({ error: 'Invalid URL provided.' }, { status: 400 });
      }

      // Execute Headless Browser Dynamic Scraping
      const scraped = await scrapeJobWithHeadlessBrowser(url);
      contentToInspect = scraped.rawText;
      isAuthWall = scraped.isAuthWall;
      warnings = scraped.warnings || [];

      if (!resolvedTitle) resolvedTitle = scraped.title;
      if (!resolvedCompany) resolvedCompany = scraped.company;
      if (!resolvedLocation && scraped.location) resolvedLocation = scraped.location;
    } else if (rawText) {
      contentToInspect = rawText;
      if (!resolvedTitle) resolvedTitle = 'Untitled Opportunity';
      if (!resolvedCompany) resolvedCompany = 'Undisclosed Employer';
    } else {
      return NextResponse.json(
        { error: 'Either a job URL or pasted job text must be provided.' },
        { status: 400 }
      );
    }

    // Run Deterministic Posting Safety Gate (PRD Section 5.4)
    const integrity = inspectPostingIntegrity(contentToInspect);

    // Compute content hash
    const contentHash = crypto
      .createHash('sha256')
      .update(integrity.cleanedText)
      .digest('hex');

    // Check duplicate within user's library
    const existing = await prisma.jobPosting.findFirst({
      where: {
        userId: session.id,
        contentHash,
      },
      include: {
        analyses: {
          where: { analysisType: 'FIT_ANALYSIS' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (existing) {
      return NextResponse.json({
        job: existing,
        duplicate: true,
        message: 'This job description has already been ingested into your library.',
      });
    }

    // Save job posting
    const job = await prisma.jobPosting.create({
      data: {
        userId: session.id,
        sourceUrl,
        sourceHost,
        title: resolvedTitle,
        company: resolvedCompany,
        location: resolvedLocation || null,
        rawText: integrity.cleanedText,
        contentHash,
        integrityStatus: integrity.status,
        integrityFindings: integrity.findings,
      },
    });

    await recordAuditLog({
      userId: session.id,
      action: 'INGEST_JOB',
      resourceId: job.id,
      metadata: {
        jobId: job.id,
        sourceUrl,
        sourceHost,
        integrityStatus: integrity.status,
        isAuthWall,
      },
    });

    // Auto-Run Gemini Fit Analysis if eligible and quota permits
    let fitAnalysis = null;
    if (autoAnalyze && job.integrityStatus !== 'REJECTED') {
      try {
        const quota = await checkAiQuota(session.id);
        if (quota.allowed) {
          // Fetch candidate facts
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

          const analysisResult = await analyzeJobFit({
            candidateProfile: candidateFacts,
            jobTitle: job.title,
            jobCompany: job.company,
            jobRawText: job.rawText,
          });

          fitAnalysis = await prisma.aIAnalysis.create({
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

          await logAiUsage({
            userId: session.id,
            actionType: 'FIT_ANALYSIS',
            inputTokens: Math.ceil(candidateFacts.length / 4) + Math.ceil(job.rawText.length / 4),
            outputTokens: 500,
          });
        }
      } catch (aiErr: any) {
        console.error('Auto fit analysis error:', aiErr);
      }
    }

    return NextResponse.json({
      success: true,
      job,
      fitAnalysis,
      isAuthWall,
      warnings,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to ingest job posting.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
