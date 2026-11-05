import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { safeFetchHtml } from '@/lib/security/ssrf';
import { inspectPostingIntegrity } from '@/lib/security/posting-guard';
import { recordAuditLog } from '@/lib/quota';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { url, rawText, title, company, location } = body;

    let contentToInspect = '';
    let resolvedTitle = title || '';
    let resolvedCompany = company || '';
    let sourceHost: string | null = null;
    let sourceUrl: string | null = null;

    if (url) {
      sourceUrl = url;
      try {
        const parsedUrl = new URL(url);
        sourceHost = parsedUrl.hostname;
      } catch {
        return NextResponse.json({ error: 'Invalid URL provided.' }, { status: 400 });
      }

      // Safe fetch with SSRF Shield
      const fetchedHtml = await safeFetchHtml(url);
      contentToInspect = fetchedHtml;

      // Extract basic title if missing
      if (!resolvedTitle) {
        const titleMatch = fetchedHtml.match(/<title[^>]*>([^<]+)<\/title>/i);
        resolvedTitle = titleMatch ? titleMatch[1].trim() : 'Job Posting from Web';
      }
      if (!resolvedCompany) {
        resolvedCompany = sourceHost;
      }
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
        location: location || null,
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
      metadata: { title: job.title, company: job.company, integrityStatus: integrity.status },
    });

    return NextResponse.json({
      job,
      safetyReport: integrity,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Job ingestion failed';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
