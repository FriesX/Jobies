import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { recordAuditLog } from '@/lib/quota';

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      headline,
      location,
      workAuthorization,
      targetRoles,
      industries,
      skills,
      experienceSummary,
      salaryPreferences,
      privacyPreferences,
    } = body;

    const updatedProfile = await prisma.profile.upsert({
      where: { userId: session.id },
      create: {
        userId: session.id,
        headline,
        location,
        workAuthorization,
        targetRoles: Array.isArray(targetRoles) ? targetRoles : [],
        industries: Array.isArray(industries) ? industries : [],
        skills: Array.isArray(skills) ? skills : [],
        experienceSummary,
        salaryPreferences,
        privacyPreferences,
      },
      update: {
        headline,
        location,
        workAuthorization,
        targetRoles: Array.isArray(targetRoles) ? targetRoles : undefined,
        industries: Array.isArray(industries) ? industries : undefined,
        skills: Array.isArray(skills) ? skills : undefined,
        experienceSummary,
        salaryPreferences,
        privacyPreferences,
      },
    });

    await recordAuditLog({
      userId: session.id,
      action: 'UPDATE_PROFILE',
      resourceId: updatedProfile.id,
    });

    return NextResponse.json({ profile: updatedProfile });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to update profile';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
