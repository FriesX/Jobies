import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const documents = await prisma.document.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      originalFilename: true,
      mimeType: true,
      sizeBytes: true,
      documentType: true,
      processingStatus: true,
      createdAt: true,
      extractedText: true,
    },
  });

  return NextResponse.json({ documents });
}
