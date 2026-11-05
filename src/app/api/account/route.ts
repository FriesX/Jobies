import { NextResponse } from 'next/server';
import { getSession, clearSessionCookie } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { deletePrivateDocument } from '@/lib/storage';

export async function DELETE() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Find all documents to delete from storage
    const documents = await prisma.document.findMany({
      where: { userId: session.id },
      select: { objectKey: true },
    });

    for (const doc of documents) {
      await deletePrivateDocument(doc.objectKey);
    }

    // 2. Cascade delete User in DB (Profile, Documents, JobPostings, AIAnalyses, Applications, Logs all cascade)
    await prisma.user.delete({
      where: { id: session.id },
    });

    // 3. Clear session cookie
    await clearSessionCookie();

    return NextResponse.json({ success: true, message: 'Account and all data permanently deleted.' });
  } catch (err: unknown) {
    console.error('Account deletion failed:', err);
    const msg = err instanceof Error ? err.message : 'Failed to delete account';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
