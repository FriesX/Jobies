import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { checkAiQuota } from '@/lib/quota';
import { Sidebar } from '@/components/navigation/Sidebar';
import { Navbar } from '@/components/navigation/Navbar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const quota = await checkAiQuota(session.id);

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <Sidebar quotaRemaining={quota.remaining} quotaLimit={quota.limit} />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar user={session} />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
