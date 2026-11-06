import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { inspectPostingIntegrity } from '@/lib/security/posting-guard';
import { checkAiQuota, logAiUsage, recordAuditLog } from '@/lib/quota';
import { scrapeJobWithHeadlessBrowser, ScrapedJobItem } from '@/lib/scraper';
import { analyzeJobFit } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { url, rawText, title, company, location, autoAnalyze = true } = body;

    let itemsToIngest: ScrapedJobItem[] = [];
    let isListing = false;
    let isAuthWall = false;
    let warnings: string[] = [];

    if (url) {
      try {
        new URL(url);
      } catch {
        return NextResponse.json({ error: 'Invalid URL provided.' }, { status: 400 });
      }

      // Execute Multi-Job Scraper
      const scraped = await scrapeJobWithHeadlessBrowser(url);
      itemsToIngest = scraped.jobs;
      isListing = scraped.isListing;
      isAuthWall = scraped.isAuthWall;
      warnings = scraped.warnings || [];

      // If user provided manual title/company override for single job
      if (!isListing && itemsToIngest.length === 1) {
        if (title) itemsToIngest[0].title = title;
        if (company) itemsToIngest[0].company = company;
        if (location) itemsToIngest[0].location = location;
      }
    } else if (rawText) {
      itemsToIngest = [
        {
          title: title || 'Untitled Opportunity',
          company: company || 'Undisclosed Employer',
          location: location || undefined,
          sourceUrl: '',
          rawText,
        },
      ];
    } else {
      return NextResponse.json(
        { error: 'Either a job URL or pasted job text must be provided.' },
        { status: 400 }
      );
    }

    if (itemsToIngest.length === 0) {
      return NextResponse.json(
        { error: 'No job postings could be extracted from the provided URL.' },
        { status: 422 }
      );
    }

    // Prepare Candidate Facts for Auto-Analysis
    let candidateFacts = '';
    let latestCvId: string | null = null;
    let quotaRemaining = 0;

    if (autoAnalyze) {
      const quota = await checkAiQuota(session.id);
      quotaRemaining = quota.remaining;

      if (quota.allowed) {
        const profile = await prisma.profile.findUnique({
          where: { userId: session.id },
        });

        const latestCv = await prisma.document.findFirst({
          where: { userId: session.id, documentType: 'CV', processingStatus: 'READY' },
          orderBy: { createdAt: 'desc' },
        });

        latestCvId = latestCv?.id || null;

        candidateFacts = `
Name: ${session.displayName || 'Candidate'}
Headline: ${profile?.headline || 'Professional'}
Location: ${profile?.location || 'Not specified'}
Work Authorization: ${profile?.workAuthorization || 'Not specified'}
Target Roles: ${profile?.targetRoles?.join(', ') || 'General'}
Skills: ${profile?.skills?.join(', ') || 'Not specified'}
Profile Summary: ${profile?.experienceSummary || ''}
${latestCv?.extractedText ? `\n--- SOURCE CV DOCUMENT (${latestCv.originalFilename}) ---\n${latestCv.extractedText.slice(0, 10000)}` : ''}
`;
      }
    }

    const createdJobs: any[] = [];
    const MAX_AUTO_ANALYZE = isListing ? 3 : 1; // Smart batching: auto-analyze top 3 jobs for search listings

    for (let i = 0; i < itemsToIngest.length; i++) {
      const item = itemsToIngest[i];

      // Run Deterministic Safety Gate
      const integrity = inspectPostingIntegrity(item.rawText);

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
        createdJobs.push(existing);
        continue;
      }

      // Save new JobPosting record
      let sourceHost: string | null = null;
      if (item.sourceUrl) {
        try {
          sourceHost = new URL(item.sourceUrl).hostname;
        } catch {}
      }

      const job = await prisma.jobPosting.create({
        data: {
          userId: session.id,
          sourceUrl: item.sourceUrl || null,
          sourceHost,
          title: item.title,
          company: item.company,
          location: item.location || null,
          rawText: integrity.cleanedText,
          contentHash,
          integrityStatus: integrity.status,
          integrityFindings: integrity.findings,
        },
      });

      // Auto-analyze top candidate jobs if quota allows
      if (candidateFacts && i < MAX_AUTO_ANALYZE && quotaRemaining > 0 && job.integrityStatus !== 'REJECTED') {
        try {
          const analysisResult = await analyzeJobFit({
            candidateProfile: candidateFacts,
            jobTitle: job.title,
            jobCompany: job.company,
            jobRawText: job.rawText,
          });

          await prisma.aIAnalysis.create({
            data: {
              userId: session.id,
              jobId: job.id,
              analysisType: 'FIT_ANALYSIS',
              model: 'gemini-3.8-flash',
              promptVersion: '1.0.0',
              inputDocumentIds: latestCvId ? [latestCvId] : [],
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

          quotaRemaining--;
        } catch (aiErr) {
          console.error(`Auto fit analysis error for job ${job.id}:`, aiErr);
        }
      }

      createdJobs.push(job);
    }

    await recordAuditLog({
      userId: session.id,
      action: 'INGEST_JOBS_BATCH',
      metadata: {
        totalExtracted: itemsToIngest.length,
        totalSaved: createdJobs.length,
        isListing,
        sourceUrl: url || null,
      },
    });

    return NextResponse.json({
      success: true,
      jobs: createdJobs,
      count: createdJobs.length,
      isListing,
      isAuthWall,
      warnings,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to ingest job posting.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
