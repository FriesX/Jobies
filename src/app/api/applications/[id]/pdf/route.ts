import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { renderToBuffer } from '@react-pdf/renderer';
import { AtsCvDocument } from '@/components/pdf/AtsCvTemplate';
import { TailoredCvData } from '@/lib/gemini';
import React from 'react';

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
    include: { job: true },
  });

  if (!application) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  }

  const cvData = application.tailoredCvJson as unknown as TailoredCvData | null;

  if (!cvData) {
    return NextResponse.json(
      { error: 'No tailored CV generated yet for this application.' },
      { status: 400 }
    );
  }

  try {
    // Render PDF buffer using React-PDF
    const buffer = await renderToBuffer(React.createElement(AtsCvDocument, { data: cvData }) as any);

    const cleanName = (cvData.fullName || 'Candidate').replace(/[^a-zA-Z0-9]/g, '_');
    const cleanCompany = (application.job.company || 'Job').replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${cleanName}_Resume_${cleanCompany}.pdf`;

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (err: unknown) {
    console.error('PDF generation error:', err);
    const msg = err instanceof Error ? err.message : 'Failed to generate PDF';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
