import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { uploadPrivateDocument } from '@/lib/storage';
import { extractTextFromBuffer } from '@/lib/parsers/doc-extractor';
import { recordAuditLog } from '@/lib/quota';

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const documentType = (formData.get('documentType') as string) || 'CV';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Compute SHA256 integrity hash
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');

    // Extract text in serverless process
    let extractedText = '';
    let processingStatus = 'READY';
    try {
      extractedText = await extractTextFromBuffer(buffer, file.type, file.name);
    } catch (err: unknown) {
      console.warn('Text extraction warning:', err);
      processingStatus = 'FAILED';
      extractedText = '';
    }

    // Upload to isolated private Supabase Storage
    const { objectKey, error: storageError } = await uploadPrivateDocument({
      userId: session.id,
      fileBuffer: buffer,
      fileName: file.name,
      contentType: file.type || 'application/octet-stream',
    });

    const finalObjectKey = objectKey || `fallback_${session.id}_${Date.now()}_${file.name}`;

    // Create Document record in database
    const doc = await prisma.document.create({
      data: {
        userId: session.id,
        originalFilename: file.name,
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
        sha256,
        documentType,
        objectKey: finalObjectKey,
        extractedText,
        processingStatus: storageError && !objectKey ? 'STORAGE_WARNING' : processingStatus,
      },
    });

    // If this was a CV and user profile summary was empty, update profile summary
    if (documentType === 'CV' && extractedText) {
      const profile = await prisma.profile.findUnique({ where: { userId: session.id } });
      if (profile && !profile.experienceSummary) {
        await prisma.profile.update({
          where: { userId: session.id },
          data: {
            experienceSummary: extractedText.slice(0, 3000),
          },
        });
      }
    }

    await recordAuditLog({
      userId: session.id,
      action: 'UPLOAD_DOCUMENT',
      resourceId: doc.id,
      metadata: { fileName: file.name, sizeBytes: file.size, sha256 },
    });

    return NextResponse.json({
      document: {
        id: doc.id,
        originalFilename: doc.originalFilename,
        sizeBytes: doc.sizeBytes,
        documentType: doc.documentType,
        processingStatus: doc.processingStatus,
        extractedTextLength: extractedText.length,
        createdAt: doc.createdAt,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Upload failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
