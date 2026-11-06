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
    <div className="min-h-screen flex bg-[#07090e] text-foreground selection:bg-sky-500/30 selection:text-sky-200">
      <Sidebar quotaRemaining={quota.remaining} quotaLimit={quota.limit} />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Navbar user={session} />
        <main className="flex-1 overflow-y-auto px-5 py-6 md:px-8 md:py-8 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
