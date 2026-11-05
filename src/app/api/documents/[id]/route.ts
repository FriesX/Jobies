import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getDocumentSignedUrl, deletePrivateDocument } from '@/lib/storage';
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

  // Strict tenant check
  const document = await prisma.document.findFirst({
    where: { id, userId: session.id },
  });

  if (!document) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }

  const signedUrl = await getDocumentSignedUrl(document.objectKey, 900);

  return NextResponse.json({
    document,
    signedUrl,
  });
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

  const document = await prisma.document.findFirst({
    where: { id, userId: session.id },
  });

  if (!document) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }

  // Delete from storage
  await deletePrivateDocument(document.objectKey);

  // Delete from DB
  await prisma.document.delete({
    where: { id },
  });

  await recordAuditLog({
    userId: session.id,
    action: 'DELETE_DOCUMENT',
    resourceId: id,
    metadata: { fileName: document.originalFilename },
  });

  return NextResponse.json({ success: true });
}
